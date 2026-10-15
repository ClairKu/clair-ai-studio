#!/usr/bin/env python3
"""校验个例看板与千问主看板的共同客群、入金人数、笔数和金额完全一致。"""

import json
import sys
from pathlib import Path


if len(sys.argv) != 3:
    raise SystemExit("用法: validate-alignment.py <main-latest.json> <cases-users.json>")

main = json.loads(Path(sys.argv[1]).read_text())
cases = json.loads(Path(sys.argv[2]).read_text())
main_cutoff = main["meta"]["data_cutoff"].replace("T", " ")[:19]
case_cutoff = cases["meta"]["cutoff"].replace("T", " ")[:19]
if main_cutoff != case_cutoff:
    raise SystemExit(f"截止时间不一致：主看板 {main_cutoff}，个例看板 {case_cutoff}")

segments = {item["id"]: item for item in main["segments"]["items"]}
users = cases["users"]

for user in users:
    inflow = float(user["derived"].get("inflow_after") or 0)
    if inflow <= 0 or not user.get("inflow_txns"):
        raise SystemExit(f"案例 {user['pmid']} 不属于新增入金集合")
    first_inflow = str(user.get("first_inflow_ever") or "").replace("T", " ")[:19]
    first_bound = str(user.get("fb") or "").replace("T", " ")[:19]
    is_first = bool(first_inflow and first_inflow >= first_bound)
    is_first = is_first and not user.get("last_buy_before")
    if bool(user["flags"].get("first_invest_after")) != is_first:
        raise SystemExit(f"案例 {user['pmid']} 的首投标签与新增入金历史不一致")
    first_after = str(user["derived"].get("first_inflow_after") or "").replace("T", " ")[:19]
    txn_first = min(str(t["t"]).replace("T", " ")[:19] for t in user["inflow_txns"])
    if first_after != txn_first:
        raise SystemExit(f"案例 {user['pmid']} 的首笔入金时距基准与交易不一致")


def selected(scope_id):
    if scope_id == "new_inv":
        return [u for u in users if u["flags"].get("zero_at_bind")]
    if scope_id == "first_inv":
        return [u for u in users if u["flags"].get("first_invest_after")]
    if scope_id == "new_first_inv":
        return [u for u in users if u["flags"].get("new_first_invest")]
    if scope_id == "existing_reactivated":
        return [u for u in users if u["flags"].get("recall")]
    if scope_id == "existing_first_inv":
        return [u for u in users if u["cohort"] == "existing" and u["flags"].get("first_invest_after")]
    raise KeyError(scope_id)


scope_ids = ("new_inv", "first_inv", "new_first_inv", "existing_reactivated", "existing_first_inv")
for scope_id in scope_ids:
    expected = segments[scope_id]
    scope_users = selected(scope_id)
    actual = {
        "population_accounts": len(scope_users),
        "inflow_accounts": sum(float(u["derived"]["inflow_after"] or 0) > 0 for u in scope_users),
        "inflow_transactions": sum(len(u.get("inflow_txns") or []) for u in scope_users),
        "inflow_amount_wan": round(sum(float(u["derived"]["inflow_after"] or 0) for u in scope_users) / 10000, 4),
    }
    for field, value in actual.items():
        expected_value = expected[field]
        if value != expected_value:
            raise SystemExit(f"{scope_id}.{field} 不一致：主看板 {expected_value}，个例看板 {value}")

    if expected["population_accounts"] != expected["inflow_accounts"]:
        raise SystemExit(f"{scope_id} 不是完整的新增入金客群")

case_union = {str(u["pmid"]) for scope_id in scope_ids for u in selected(scope_id)}
if cases["meta"].get("taxonomy_version"):
    case_union |= {str(u["pmid"]) for u in users if u["flags"].get("existing_reinvested") or u["flags"].get("asset_unknown")}
if len(case_union) != len(users):
    raise SystemExit(f"案例并集不闭合：并集 {len(case_union)} 人，users.json {len(users)} 人")

recalled = selected("existing_reactivated")
recall_first = [u for u in recalled if u["flags"].get("first_invest_after")]
recall_returned = [u for u in recalled if not u["flags"].get("first_invest_after")]
if len(recall_first) + len(recall_returned) != len(recalled):
    raise SystemExit("老户唤回的首投/清仓后唤回拆分不闭合")

reinvested = segments["reinvested"]
all_segment = segments["all"]
if reinvested["population_accounts"] != all_segment["inflow_accounts"]:
    raise SystemExit("再投客群人数与全部绑定用户的新增入金人数不一致")
if reinvested["population_accounts"] != reinvested["inflow_accounts"]:
    raise SystemExit("再投客群包含非新增入金用户")

if cases["meta"].get("taxonomy_version"):
    all_funded = len(users)
    total_amount = round(sum(float(u["derived"]["inflow_after"]) for u in users) / 10000, 4)
    total_events = sum(len(u["inflow_txns"]) for u in users)
    for field, actual in (("inflow_accounts", all_funded), ("inflow_amount_wan", total_amount), ("inflow_transactions", total_events)):
        if all_segment[field] != actual:
            raise SystemExit(f"全量入金集合 {field} 不一致")
    ids = lambda group: {str(u["pmid"]) for u in group}
    new_first, old_first = selected("new_first_inv"), selected("existing_first_inv")
    if ids(selected("first_inv")) != ids(new_first) | ids(old_first):
        raise SystemExit("首投 = 新户首投 + 老户首投 不闭合")
    if ids(selected("new_inv")) != ids(new_first) | ids(recalled):
        raise SystemExit("新投 = 新户首投 + 老户唤醒 不闭合")
    if ids(recalled) != ids(old_first) | ids(recall_returned):
        raise SystemExit("老户唤醒 = 老户首投 + 老户回流 不闭合")
    leaves = ("new_first_invest", "existing_first_invest", "existing_returned", "existing_reinvested")
    for u in users:
        if sum(bool(u["flags"].get(k)) for k in leaves) != 1 and not u["flags"].get("asset_unknown"):
            raise SystemExit("互斥叶子人群未闭合")
        if any(u["flags"].get(k) for k in ("qwen_side_inferred", "qwen_influence_rule")) and not u["flags"].get("existing_reinvested"):
            raise SystemExit("千问侧/归因标签超出老户再投集合")
    print(f"全量入金 {all_funded} 人 / {total_amount} 万 / {total_events} 笔，与主看板一致；三条人群公式和互斥叶子全部闭合。")
else:
    print(f"两张看板口径一致：{main_cutoff}，5 个案例客群及案例并集闭合；老户唤醒 {len(recalled)} = 首投 {len(recall_first)} + 老户回流 {len(recall_returned)}。")
