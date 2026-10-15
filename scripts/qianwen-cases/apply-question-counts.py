#!/usr/bin/env python3
"""Merge a complete private per-user Qwen question audit, including verified zeros.

Usage: apply-question-counts.py users-reviewed.json question-counts.json out.json
Counts use USER messages' business time, strict Qwen/session ownership and message-ID
deduplication. pre_first_inflow_questions ends strictly before first post-bind inflow.
"""
import json
import sys
from datetime import datetime
from pathlib import Path


def instant(value):
    return datetime.fromisoformat(str(value).replace("Z", "")[:19])


def apply_counts(data, rows):
    users = data["users"]
    by_id = {str(row["pmid"]): row for row in rows}
    if len(by_id) != len(rows) or set(by_id) != {str(u["pmid"]) for u in users}:
        raise ValueError("提问审查用户集合不完整或重复")
    cutoff = instant(data["meta"]["cutoff"])
    for user in users:
        row = by_id[str(user["pmid"])]
        total, before = row.get("total_questions"), row.get("pre_first_inflow_questions")
        if any(type(v) is not int or v < 0 for v in (total, before)) or before > total:
            raise ValueError("提问数必须为非负整数，首笔前不能超过总数")
        first = instant(user["derived"]["first_inflow_after"])
        if instant(row["first_inflow_after"]) != first or not instant(user["fb"]) <= first < cutoff:
            raise ValueError("提问审查的首笔入金基准不一致")
        if user.get("coverage") != "funding_only" and len(user.get("asks") or []) != total:
            raise ValueError("提问聚合与已审原文不一致")
        user["question_stats"] = {"total_questions": total, "pre_first_inflow_questions": before,
                                  "first_inflow_after": user["derived"]["first_inflow_after"],
                                  "cutoff": data["meta"]["cutoff"], "reviewed": True}
    data["meta"].update({"question_stats_audit_complete": True, "question_reviewed_accounts": len(users),
                         "question_business_time": "dj_gmt_create",
                         "question_mean_denominator": "all_scope_users_including_verified_zero"})
    return data


if __name__ == "__main__":
    read = lambda filename: json.loads(Path(filename).read_text())
    result = apply_counts(read(sys.argv[1]), read(sys.argv[2]))
    Path(sys.argv[3]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_accounts": len(result["users"]),
                      "total_questions": sum(u["question_stats"]["total_questions"] for u in result["users"]),
                      "pre_first_inflow_questions": sum(u["question_stats"]["pre_first_inflow_questions"] for u in result["users"])}))
