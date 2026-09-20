#!/usr/bin/env python3
"""redash adhoc → JSON 行。用法: fetch.py <out.json> <sql> [timeout=600]"""
import sys, time, json, os
sys.path.insert(0, os.path.expanduser("~/.claude/skills/redash"))
import redash
out, sql = sys.argv[1], sys.argv[2]
timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 600
resp = redash._request("POST", "/api/query_results", {"query": sql, "data_source_id": 41, "max_age": 0})
job = resp.get("job", {})
if job.get("id"):
    deadline = time.time() + timeout
    while time.time() < deadline:
        j = redash._request("GET", f"/api/jobs/{job['id']}").get("job", {})
        if j.get("status") == 3:
            resp = redash._request("GET", f"/api/query_results/{j['query_result_id']}"); break
        if j.get("status") in (4, 5):
            sys.exit(f"执行失败: {j.get('error')}")
        time.sleep(2)
    else:
        sys.exit("超时")
rows = resp["query_result"]["data"]["rows"]
json.dump(rows, open(out, "w"), ensure_ascii=False)
print(f"{out}: {len(rows)} rows")
