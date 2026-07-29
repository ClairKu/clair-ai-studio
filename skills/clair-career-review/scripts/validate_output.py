#!/usr/bin/env python3
"""Validate a Clair review result."""
import argparse
import json
import sys
from pathlib import Path

REQUIRED = {"title", "verdict", "confidence", "summary", "evidence", "findings",
            "human_questions", "next_actions", "skill_version"}


def validate(payload):
    errors = []
    missing = sorted(REQUIRED - set(payload))
    if missing:
        errors.append(f"missing fields: {', '.join(missing)}")
    if not isinstance(payload.get("confidence"), (int, float)) or not 0 <= payload.get("confidence", -1) <= 100:
        errors.append("confidence must be a number from 0 to 100")
    if any(item.get("status") not in {"confirmed", "inferred", "missing"} for item in payload.get("evidence", [])):
        errors.append("evidence status is invalid")
    if any(item.get("priority") not in {"P0", "P1", "P2"} for item in payload.get("findings", [])):
        errors.append("finding priority is invalid")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("result")
    args = parser.parse_args()
    try:
        errors = validate(json.loads(Path(args.result).read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError) as exc:
        errors = [str(exc)]
    print(json.dumps({"valid": not errors, "errors": errors}, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
