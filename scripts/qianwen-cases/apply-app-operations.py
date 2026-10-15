#!/usr/bin/env python3
"""Apply full private first-App-operation audit. Device registration is not an operation."""
import json
import sys
from datetime import datetime
from pathlib import Path


def instant(value):
    return datetime.fromisoformat(str(value).replace("Z", "")[:19])


def apply_operations(data, rows):
    users = data["users"]
    by_id = {str(row["pmid"]): row for row in rows}
    if len(by_id) != len(rows) or set(by_id) != {str(u["pmid"]) for u in users}:
        raise ValueError("App操作审查用户集合不完整或重复")
    cutoff = instant(data["meta"]["cutoff"])
    platforms = {"iOS", "Android", "HarmonyOS"}
    normalize = lambda value: {"安卓": "Android", "鸿蒙": "HarmonyOS"}.get(value, value)
    for user in users:
        row = by_id[str(user["pmid"])]
        first = row.get("first_app_operation_at")
        device_platforms = row.get("device_platforms")
        if not isinstance(device_platforms, list):
            raise ValueError("App设备类型未审查完整")
        device_platforms = [normalize(value) for value in device_platforms]
        first_platform = normalize(row.get("first_app_operation_platform"))
        if row.get("reviewed") is not True or set(device_platforms) - platforms:
            raise ValueError("App操作或设备类型未审查完整")
        if first and (not instant(user["fb"]) <= instant(first) < cutoff or first_platform not in platforms):
            raise ValueError("首次App操作必须在绑定后、截止前，并有已核实App终端")
        if not first and first_platform is not None:
            raise ValueError("没有操作时间不能填首次操作终端")
        user["app_operation"] = {"first_at": first, "first_platform": first_platform,
                                  "device_platforms": sorted(set(device_platforms)), "reviewed": True,
                                  "cutoff": data["meta"]["cutoff"]}
    data["meta"].update({"app_operations_audit_complete": True, "app_operation_reviewed_accounts": len(users),
                         "app_operation_definition": "post-bind native App page views or clicks, excluding device registration and background events"})
    return data


if __name__ == "__main__":
    read = lambda filename: json.loads(Path(filename).read_text())
    result = apply_operations(read(sys.argv[1]), read(sys.argv[2]))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_accounts": len(result["users"]),
                      "with_post_bind_app_operation": sum(bool(u["app_operation"]["first_at"]) for u in result["users"])}))
