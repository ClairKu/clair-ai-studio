#!/usr/bin/env python3
"""Read-only App evidence aggregation; never exports user identifiers."""
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, os.path.expanduser("~/.claude/skills/redash"))
import redash


def query(sql, timeout=900):
    result = redash._request("POST", "/api/query_results", {"query": sql, "data_source_id": 41, "max_age": 0})
    job_id = result.get("job", {}).get("id")
    if job_id:
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = redash._request("GET", f"/api/jobs/{job_id}").get("job", {})
            if job.get("status") == 3:
                result = redash._request("GET", f"/api/query_results/{job['query_result_id']}")
                break
            if job.get("status") in (4, 5):
                raise RuntimeError(job.get("error"))
            time.sleep(2)
        else:
            raise TimeoutError("App usage query timed out")
    return result["query_result"]["data"]["rows"]


def app_usage(platform, cutoff):
    if platform == "qianwen":
        binding = f"""SELECT user_id AS pmid, MIN(created_at) AS fb
          FROM ying99_qieman.qwen_user_map WHERE is_deleted=0 GROUP BY user_id
          HAVING MIN(created_at)>='2026-08-03 00:00:00' AND MIN(created_at)<'{cutoff}'"""
    elif platform == "doubao":
        binding = f"""SELECT CAST(user_id AS SIGNED) AS pmid, MIN(granted_at) AS fb
          FROM ying99_oap.api_user_consent_record WHERE client_id='doubao' GROUP BY user_id
          HAVING SUM(revoked_at IS NULL)>0 AND MIN(granted_at)>='2026-08-28 00:00:00'
            AND MIN(granted_at)<'{cutoff}'"""
    else:
        raise ValueError(platform)
    rows = query(f"""WITH bound AS (
        SELECT b.pmid, b.fb,
          CASE WHEN p.registered_at IS NULL THEN 'unclassified'
            WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END cohort
        FROM ({binding}) b JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid
      ), devices AS (
        SELECT b.pmid, MAX(d.created_on>=b.fb) AS after_bind
        FROM bound b JOIN ying99_pomodel.device_info d ON d.po_manager_id=b.pmid
        WHERE d.platform IN (3,4,5) AND d.created_on<'{cutoff}' GROUP BY b.pmid
      ), native AS (
        SELECT b.pmid, MAX(e.event_time>=b.fb) AS after_bind
        FROM bound b JOIN qm_meta.ai_insight_sensors_event_detail e ON e.broker_user_id=CAST(b.pmid AS CHAR)
        WHERE e.event_date>='2026-07-27' AND e.event_date<=DATE('{cutoff}')
          AND e.event_time<'{cutoff}' AND e.lib IN ('iOS','Android','HarmonyOS') GROUP BY b.pmid
      )
      SELECT b.cohort, COUNT(*) population_accounts,
        SUM(d.pmid IS NOT NULL OR n.pmid IS NOT NULL) users,
        SUM(d.pmid IS NOT NULL) device_users, SUM(n.pmid IS NOT NULL) native_users,
        SUM(d.pmid IS NOT NULL AND n.pmid IS NOT NULL) both_users,
        SUM(COALESCE(d.after_bind,0)=1 OR COALESCE(n.after_bind,0)=1) after_binding_users
      FROM bound b LEFT JOIN devices d ON d.pmid=b.pmid LEFT JOIN native n ON n.pmid=b.pmid
      GROUP BY b.cohort""")
    fields = ["population_accounts", "users", "device_users", "native_users", "both_users", "after_binding_users"]
    cohorts = {r["cohort"]: {key: int(r[key] or 0) for key in fields} for r in rows}
    cohorts["all"] = {key: sum(row[key] for row in cohorts.values()) for key in fields}
    for row in cohorts.values():
        assert row["users"] == row["device_users"] + row["native_users"] - row["both_users"]
        assert row["after_binding_users"] <= row["users"] <= row["population_accounts"]
    return {"as_of": cutoff.replace(" ", "T") + "+08:00", "state": "confirmed",
            "definition": "native_app_events_or_registered_native_device",
            "native_libs": ["iOS", "Android", "HarmonyOS"], "device_platforms": [3, 4, 5],
            "events_observed_from": "2026-07-27", "cohorts": cohorts}


if __name__ == "__main__":
    platform, cutoff, output = sys.argv[1:]
    result = app_usage(platform, cutoff)
    Path(output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(platform, json.dumps(result["cohorts"], ensure_ascii=False))
