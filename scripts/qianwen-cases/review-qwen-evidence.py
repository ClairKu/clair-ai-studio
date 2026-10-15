#!/usr/bin/env python3
"""Produce private, conservative first-inflow evidence; absence is not attribution.

Usage: review-qwen-evidence.py first-inflow-window-audit.json evidence.json
The first-window audit cannot reject attribution on other inflows, so non-matches stay unknown.
"""
import json
import sys
from pathlib import Path


def review(row):
    positive = int(row.get("qwen_user_input_30m") or 0) > 0
    no_known = int(row.get("qieman_known_events_30m") or 0) == 0
    no_unknown = not any(int(row.get(key) or 0) for key in ("h5_unknown_events_30m", "other_unknown_events_30m"))
    hit = positive and no_known and no_unknown
    return {
        "pmid": str(row["pmid"]),
        "qwen_side_inferred": True if hit else None,
        "qwen_influence_rule": None,
        "qwen_side_evidence": [
            f"首笔入金：{str(row['first_inflow_after']).replace('T', ' ')[:19]}",
            "入金前30分钟有千问提问记录。" if positive else "入金前30分钟未见千问提问记录，不能据此排除其他入金与千问有关。",
            "同窗口未见且慢App或小程序操作记录。" if no_known else f"同窗口有 {int(row['qieman_known_events_30m'])} 条且慢App或小程序操作记录。",
            "同窗口未见来源不明的H5或其他端记录。" if no_unknown else "同窗口存在来源不明的H5或其他端记录，终端待核验。",
            "这是首笔入金的规则推断，不是成交渠道实锤；埋点缺失仍有可能，本期其他入金尚未逐笔核验。",
        ],
        "qwen_influence_evidence": ["需逐笔匹配入金前产品提问与此前该产品持仓，证据未闭环；不能记为零人。"],
    }


if __name__ == "__main__":
    rows = json.loads(Path(sys.argv[1]).read_text())
    result = [review(row) for row in rows]
    Path(sys.argv[2]).write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(json.dumps({"reviewed_first_inflows": len(result), "rule_matches_all_funded": sum(row["qwen_side_inferred"] is True for row in result)}))
