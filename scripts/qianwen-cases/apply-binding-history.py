#!/usr/bin/env python3
"""Merge complete reviewed pre-binding funding and last user-trade history."""
import json
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path


def instant(value):
    return datetime.fromisoformat(str(value).replace("Z", "")[:19])


def apply_history(data, rows):
    users = data["users"]
    by_id = {str(row["pmid"]): row for row in rows}
    if len(by_id) != len(rows) or set(by_id) != {str(u["pmid"]) for u in users}:
        raise ValueError("绑定前历史审查用户集合不完整或重复")
    report_year = instant(data["meta"]["cutoff"]).year
    for user in users:
        row = by_id[str(user["pmid"])]
        if row.get("reviewed") is not True or row.get("ytd_inflow_before") is None:
            raise ValueError("绑定前历史仍有未审查项，不能按零展示")
        amount = Decimal(str(row["ytd_inflow_before"]))
        if not amount.is_finite() or amount < 0:
            raise ValueError("绑定前年内入金必须为有效非负金额")
        bound = instant(user["fb"])
        last = row.get("last_trade_before")
        if last and instant(last) >= bound:
            raise ValueError("最近交易必须严格在绑定之前")
        if amount > 0 and (not last or instant(last).year < report_year):
            raise ValueError("年内有入金却没有对应交易历史")
        user["binding_history"] = {"ytd_inflow_before": float(amount), "last_trade_before": last,
                                    "year_start": f"{report_year}-01-01", "bound_at": user["fb"],
                                    "cutoff": data["meta"]["cutoff"], "reviewed": True}
    data["meta"].update({"binding_history_audit_complete": True, "binding_history_reviewed_accounts": len(users)})
    return data


if __name__ == "__main__":
    read = lambda filename: json.loads(Path(filename).read_text())
    result = apply_history(read(sys.argv[1]), read(sys.argv[2]))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_accounts": len(result["users"]),
                      "ytd_pre_bind_inflow": sum(u["binding_history"]["ytd_inflow_before"] for u in result["users"])}))
