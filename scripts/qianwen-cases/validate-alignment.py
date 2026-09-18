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


for scope_id in ("new_inv", "first_inv", "new_first_inv", "existing_reactivated", "existing_first_inv"):
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

print(f"两张看板口径一致：{main_cutoff}，5 个共同客群的人数、入金人数、笔数与金额全部闭合。")
