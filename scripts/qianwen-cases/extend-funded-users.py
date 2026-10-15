#!/usr/bin/env python3
"""Expand the private case snapshot to all post-binding funded users.

Usage: extend-funded-users.py rich-users.json candidates.json inflows.json out.json [evidence.json]
Only the encrypted HTML is published. Inputs and this output stay in the private run directory.
"""
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def time(value):
    return str(value or "").replace("T", " ")[:19]


def classify(row):
    bound = time(row["fb"])
    first = time(row.get("first_inflow_ever"))
    prior_product = bool(row.get("last_buy_before"))
    first_after = bool(first and first >= bound and not prior_product)
    asset = row.get("asset_at_bind")
    if asset is not None:
        zero = float(asset) == 0
        basis = "绑定日及之前最近资产快照"
    elif time(row.get("account_created_at")) >= bound and row.get("account_created_at"):
        zero = True
        basis = "绑定时尚未开户"
    elif first_after:
        zero = True
        basis = "历史无入金、无产品买入，且无资产记录"
    else:
        zero = None
        basis = "绑定前资产证据待核验"
    old = row["cohort"] == "existing"
    historical = bool((first and first < bound) or prior_product)
    return {
        "zero_at_bind": zero is True,
        "first_invest_after": first_after,
        "new_first_invest": not old and first_after,
        "recall": old and zero is True,
        "existing_first_invest": old and first_after,
        "existing_returned": old and zero is True and historical,
        "existing_reinvested": old and asset is not None and float(asset) > 0,
        "asset_unknown": zero is None,
        "qwen_side_inferred": None,
        "qwen_influence_rule": None,
    }, basis


def extend(rich, candidates, inflows, evidence):
    original = {str(user["pmid"]): user for user in rich["users"]}
    grouped = defaultdict(list)
    for txn in inflows:
        grouped[str(txn.get("pmid", txn.get("user_id")))].append(txn)
    evidence_by_id = {str(row["pmid"]): row for row in evidence}
    users = []
    next_label = max((ord(str(u.get("letter")).upper()) - 64 if len(str(u.get("letter"))) == 1 and str(u.get("letter")).isalpha()
                      else int(u.get("letter") or 0) for u in original.values()), default=0) + 1
    for row in sorted(candidates, key=lambda item: (time(item["fb"]), str(item["pmid"]))):
        uid = str(row["pmid"])
        txns = sorted(grouped[uid], key=lambda item: time(item.get("t", item.get("accept_time"))))
        if not txns:
            raise ValueError("Every funded candidate must have complete inflow records")
        normalized = [{"t": item.get("t", item.get("accept_time")),
                       "amt": float(item.get("amt", item.get("buy_amount", 0))),
                       "kind": item.get("kind", "入金")} for item in txns]
        amount = round(sum(item["amt"] for item in normalized), 2)
        if len(txns) != int(row["inflow_events_after"]) or abs(amount - float(row["inflow_after_amount"])) > .01:
            raise ValueError("Candidate totals and complete inflow records do not reconcile")
        if time(normalized[0]["t"]) != time(row["first_inflow_after"]):
            raise ValueError("First inflow timestamps do not reconcile")
        flags, asset_basis = classify(row)
        if uid in original:
            user = dict(original[uid])
            if abs(float(user["derived"]["inflow_after"]) - amount) > .01:
                raise ValueError("Existing rich case changed funding amount")
        else:
            user = {
                "pmid": uid, "letter": str(next_label), "cohort": row["cohort"],
                "fb": row["fb"], "registered_at": row["registered_at"],
                "asset_at_bind": row.get("asset_at_bind"), "first_inflow_ever": row.get("first_inflow_ever"),
                "first_buy_ever": row.get("first_buy_ever"), "last_buy_before": row.get("last_buy_before"),
                "coverage": "funding_only", "asset_latest": None,
                "trades": [], "asks": [], "dev": [], "risk": [], "events": [], "channels": {},
                "derived": {"buy_amount_after": None, "buys_after": None, "cancels_after": None,
                            "sell_after": None, "first_buy_after": None},
            }
            next_label += 1
        user["flags"] = flags
        user["asset_evidence"] = asset_basis
        user["asset_bind_date"] = row.get("asset_bind_date")
        user["first_inflow_ever"] = row.get("first_inflow_ever")
        user["first_inflow_after"] = row["first_inflow_after"]
        user["inflow_txns"] = normalized
        user["derived"] = {**user["derived"], "inflow_after": amount,
                           "first_inflow_after": row["first_inflow_after"]}
        review = evidence_by_id.get(uid, {})
        for key in ("qwen_side_inferred", "qwen_influence_rule"):
            if flags["existing_reinvested"] and key in review:
                user["flags"][key] = review[key]
        for key in ("qwen_side_evidence", "qwen_influence_evidence"):
            if key in review:
                user[key] = review[key]
        if user["flags"].get("qwen_side_inferred") is True:
            matched_amount = normalized[0]["amt"]
            user["qwen_side_matched_inflow_amount"] = matched_amount
            user.setdefault("qwen_side_evidence", []).append(
                f"本次命中首笔入金 {matched_amount:,.2f} 元；用户全期入金 {amount:,.2f} 元，不将全期金额整体归给千问侧。")
        users.append(user)
    if set(original) - {str(user["pmid"]) for user in users}:
        raise ValueError("Existing cases were omitted from the funded universe")
    leaves = ("new_first_invest", "existing_first_invest", "existing_returned", "existing_reinvested")
    for user in users:
        memberships = sum(bool(user["flags"].get(key)) for key in leaves)
        if memberships != 1 and not user["flags"]["asset_unknown"]:
            raise ValueError("Mutually exclusive conversion leaves do not close")
    return {"meta": {**rich["meta"], "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
                     "taxonomy_version": "2026-10-15", "funding_universe": len(users),
                     "rich_cases": len(original), "cohort_basis": "注册与绑定时间相差不超过60分钟，作为新户近似",
                     "asset_basis": "绑定日及之前最近资产快照；缺失时结合开户和历史入金记录核验",
                     "transaction_basis": "未撤单的入金受理记录；不等同于全部已确认到账"}, "users": users}


if __name__ == "__main__":
    if len(sys.argv) not in (5, 6):
        raise SystemExit(__doc__)
    read = lambda path: json.loads(Path(path).read_text())
    result = extend(read(sys.argv[1]), read(sys.argv[2]), read(sys.argv[3]), read(sys.argv[5]) if len(sys.argv) == 6 else [])
    Path(sys.argv[4]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"funded_users": len(result["users"]), "rich_cases": result["meta"]["rich_cases"],
                      "leaves": {key: sum(bool(u["flags"].get(key)) for u in result["users"])
                                 for key in ("new_first_invest", "existing_first_invest", "existing_returned", "existing_reinvested", "asset_unknown")}}, ensure_ascii=False))
