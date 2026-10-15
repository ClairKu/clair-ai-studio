#!/usr/bin/env python3
"""Apply reviewed lifetime first qualified inflow dates, never post-bind substitutes."""
import json
import sys
from datetime import datetime
from pathlib import Path


def instant(value):
    return datetime.fromisoformat(str(value).replace("Z", "")[:19])


def apply_dates(data, rows):
    by_id = {str(row["pmid"]): row for row in rows}
    if len(by_id) != len(rows) or set(by_id) != {str(u["pmid"]) for u in data["users"]}:
        raise ValueError("首次入金日期审查用户集合不完整或重复")
    for user in data["users"]:
        row = by_id[str(user["pmid"])]
        value = row.get("first_inflow_ever")
        if row.get("reviewed") is not True or not value:
            raise ValueError("历史首次入金日期未核实完整")
        first = instant(value)
        if first > instant(user["derived"]["first_inflow_after"]):
            raise ValueError("历史首次入金不能晚于绑定后首笔")
        if user.get("first_inflow_ever") and first != instant(user["first_inflow_ever"]):
            raise ValueError("历史首次入金与已审个例不一致")
        user["first_inflow_ever"] = str(value).replace("T", " ")[:19]
    data["meta"].update({"first_inflow_dates_audit_complete": True, "first_inflow_dates_reviewed_accounts": len(rows)})
    return data


if __name__ == "__main__":
    read = lambda path: json.loads(Path(path).read_text())
    result = apply_dates(read(sys.argv[1]), read(sys.argv[2]))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_first_inflow_dates": len(result["users"])}))
