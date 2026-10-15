#!/usr/bin/env python3
"""校验个例看板与豆包主看板的共同客群、入金人数、笔数和金额完全一致。"""

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
    if user["flags"].get("first_invest_after"):
        first_buy = str(user.get("first_buy_ever") or "").replace("T", " ")[:19]
        first_bound = str(user.get("fb") or "").replace("T", " ")[:19]
        if not first_buy or first_buy < first_bound:
            raise SystemExit(f"案例 {user['pmid']} 的首投标签与产品交易不一致")


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
if len(case_union) != len(users):
    raise SystemExit(f"案例并集不闭合：并集 {len(case_union)} 人，users.json {len(users)} 人")

reinvested = segments["reinvested"]
all_segment = segments["all"]
if reinvested["population_accounts"] != all_segment["inflow_accounts"]:
    raise SystemExit("再投客群人数与全部绑定用户的新增入金人数不一致")
if reinvested["population_accounts"] != reinvested["inflow_accounts"]:
    raise SystemExit("再投客群包含非新增入金用户")

print(f"两张看板口径一致：{main_cutoff}，新增入金客群、5 个案例客群及案例并集全部闭合。")
