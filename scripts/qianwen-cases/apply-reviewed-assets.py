#!/usr/bin/env python3
"""Merge private, reviewed same-day assets; incomplete coverage blocks publication.

Usage: apply-reviewed-assets.py users.json reviewed-assets.json out.json
Allowed statuses: exact, verified_zero. A missing row is never automatically zero.
"""
import json
import sys
from decimal import Decimal
from pathlib import Path


def apply_review(users_data, asset_rows):
    users = users_data["users"]
    by_id = {str(row["pmid"]): row for row in asset_rows}
    if len(by_id) != len(asset_rows) or set(by_id) != {str(u["pmid"]) for u in users}:
        raise ValueError("资产审查用户集合不完整或重复")
    dates = {str(row["as_of"])[:10] for row in asset_rows}
    if len(dates) != 1:
        raise ValueError("资产审查日期不一致")
    for user in users:
        row = by_id[str(user["pmid"])]
        if row.get("status") not in ("exact", "verified_zero") or row.get("total_asset") is None:
            raise ValueError("资产仍有未核实项，禁止发布")
        amount = Decimal(str(row["total_asset"]))
        if row["status"] == "verified_zero" and (amount != 0 or not row.get("basis")):
            raise ValueError("零资产必须有核实依据")
        if not row.get("basis") or (row["status"] == "exact" and not row.get("source_date")):
            raise ValueError("资产审查缺少证据或来源日期")
        user["asset_latest"] = {"cal_date": str(row["as_of"])[:10], "ta": float(amount),
                                "status": row["status"], "source_date": row["source_date"], "basis": row["basis"]}
    users_data["meta"].update({"assets_audit_complete": True, "asset_as_of": next(iter(dates)),
                               "asset_reviewed_accounts": len(users), "reviewed_scopes": []})
    return users_data


if __name__ == "__main__":
    read = lambda filename: json.loads(Path(filename).read_text())
    result = apply_review(read(sys.argv[1]), read(sys.argv[2]))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_accounts": len(result["users"]), "asset_as_of": result["meta"]["asset_as_of"],
                      "asset_yuan": str(sum(Decimal(str(u["asset_latest"]["ta"])) for u in result["users"]))}))
