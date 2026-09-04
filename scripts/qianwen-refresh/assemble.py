#!/usr/bin/env python3
"""组装千问看板 latest.json：模板(上一版) + q1..q4 原始数 → 发布快照。

- 人口基准 = q1（逐日累加）；q2/q3/q4 查询时点略晚，多出的人从各维度兜底桶扣除。
- 资产两维取 q4：**ROOT 层**口径（全层级 SUM 会重复累加约 3 倍）。
- 小样本：2026-08-24 起按业务方要求全量披露，不做 k=20 合并与互补隐藏。
- 入金/买入/赎回金额权威源（MaxCompute 现金流）未接入，标 unavailable。
"""
import json, os, sys
from pathlib import Path

# 用法: assemble.py <上一版 latest.json 模板> [工作目录(q1..q4.json 所在, 默认 $QW_WORK 或 cwd)]
HERE = Path(sys.argv[2] if len(sys.argv) > 2 else os.environ.get("QW_WORK", "."))
COHORTS = ["all", "new", "existing"]
DEF_VERSION = "2026-08-20-v2"

template = json.load(open(sys.argv[1]))
q1, q2, q3, q4 = (json.load(open(HERE / f"q{i}.json")) for i in (1, 2, 3, 4))
cutoff = q1["data_cutoff"]
cutoff_day = cutoff[:10]

days = q1["days"]
assert days[0]["date"] == "2026-08-03"
rows, cn, ce, cu = [], 0, 0, 0
for i, d in enumerate(days):
    n, e, u = int(d["new"]), int(d["existing"]), int(d["unclassified"])
    cn += n; ce += e; cu += u
    rows.append({"date": d["date"], "new_accounts_today": n, "existing_accounts_today": e,
                 "unclassified_accounts_today": u, "bound_accounts_today": n + e + u,
                 "cumulative_new_accounts": cn, "cumulative_existing_accounts": ce,
                 "cumulative_unclassified_accounts": cu, "cumulative_bound_accounts": cn + ce + cu,
                 "partial": i == len(days) - 1})
assert rows[-1]["date"] == cutoff_day
metrics = {"bound_accounts": cn + ce + cu, "existing_accounts": ce, "new_accounts": cn,
           "missing_registration_time": cu,
           "duplicate_bindings": int(q1.get("duplicate_bindings", 0)),
           "unmatched_accounts": int(q1.get("unmatched_accounts", 0))}
POP = {"all": metrics["bound_accounts"], "new": metrics["new_accounts"],
       "existing": metrics["existing_accounts"]}

PROFILE_DIMS = ["asset_holding_status", "asset_bucket", "lifetime_investment_status",
                "age_bucket", "gender", "residence_province", "app_usage_status",
                "wechat_mp_status", "bank_card_status", "risk_assessment_status"]
BUCKET_ORDER = {
    "asset_holding_status": ["has_assets", "no_assets", "unknown"],
    "asset_bucket": ["no_assets", "lt_10k", "10k_100k", "100k_1m", "gte_1m", "unknown"],
    "lifetime_investment_status": ["invested", "not_invested"],
    "age_bucket": ["lte_25", "26_35", "36_45", "46_55", "56_65", "gte_66", "unknown"],
    "gender": ["male", "female", "unknown"],
    "wechat_mp_status": ["mp_bound", "mp_not_bound"],
    "bank_card_status": ["card_bound", "card_not_bound"],
    "risk_assessment_status": ["assessed", "not_assessed"],
}
BUCKET_LABELS = {"100k_1m": "10—100 万元", "gte_1m": "100 万元以上",
                 "lte_25": "25 岁及以下", "26_35": "26—35 岁", "36_45": "36—45 岁",
                 "46_55": "46—55 岁", "56_65": "56—65 岁", "gte_66": "66 岁以上"}
DEFAULT_BUCKET = {"asset_holding_status": "unknown", "asset_bucket": "unknown",
                  "lifetime_investment_status": "not_invested", "age_bucket": "unknown",
                  "gender": "unknown", "residence_province": "unknown",
                  "wechat_mp_status": "mp_not_bound", "bank_card_status": "card_not_bound",
                  "risk_assessment_status": "not_assessed"}

def normalize(raw, pop, dim):
    raw = dict(raw)
    delta = sum(raw.values()) - pop
    if delta < 0 or delta > 5:
        raise SystemExit(f"{dim} 人数差 {delta} 超容忍范围: sum={sum(raw.values())} pop={pop}")
    if delta:
        db = DEFAULT_BUCKET[dim]
        if raw.get(db, 0) < delta:
            raise SystemExit(f"{dim} 兜底桶 {db} 不足以扣减 {delta}")
        raw[db] -= delta
    return raw

def profile_item(dim, raw, pop, as_of):
    raw = normalize(raw, pop, dim)
    order = BUCKET_ORDER[dim]
    ordered = [b for b in order if b in raw] + [b for b in raw if b not in order]
    buckets = []
    for b in ordered:
        entry = {"id": b}
        if b in BUCKET_LABELS: entry["label"] = BUCKET_LABELS[b]
        entry["accounts"] = raw[b]
        buckets.append(entry)
    assert sum(raw.values()) == pop, (dim, raw, pop)
    return {"id": dim, "definition_version": DEF_VERSION, "time_basis": "snapshot_as_of",
            "data_as_of": as_of, "state": "confirmed", "buckets": buckets}

def province_item(raw, pop):
    raw = normalize(raw, pop, "residence_province")
    buckets = [{"id": "unknown", "accounts": raw.get("unknown", 0)}]
    for k, v in sorted(raw.items(), key=lambda kv: -kv[1]):
        if k == "unknown" or v <= 0: continue
        buckets.append({"id": k, "label": k, "accounts": v})
    assert sum(b["accounts"] for b in buckets) == pop
    return {"id": "residence_province", "definition_version": DEF_VERSION,
            "time_basis": "snapshot_as_of", "data_as_of": cutoff_day, "state": "confirmed",
            "buckets": buckets}

def asset_dims(co):
    pop = POP[co]; c = q4["cohorts"][co]
    holding, bucket = dict(c["asset_holding_status"]), dict(c["asset_bucket"])
    assert sum(holding.values()) == pop and sum(bucket.values()) == pop, (co, pop)
    assert bucket["no_assets"] == holding["no_assets"]
    assert sum(bucket[k] for k in ("lt_10k","10k_100k","100k_1m","gte_1m")) == holding["has_assets"]
    return holding, bucket

profile_cohorts = {}
for co in COHORTS:
    holding_dim, bucket_dim = asset_dims(co)
    src = {**q2["cohorts"][co], "asset_holding_status": holding_dim, "asset_bucket": bucket_dim}
    dims = []
    for dim in PROFILE_DIMS:
        if dim == "app_usage_status":
            dims.append({"id": dim, "definition_version": DEF_VERSION,
                         "time_basis": "post_binding_window", "state": "unavailable",
                         "reason_code": "not_refreshed_this_cycle"})
        elif dim == "residence_province":
            dims.append(province_item(src[dim], POP[co]))
        else:
            as_of = q4["as_of"] if dim in ("asset_holding_status", "asset_bucket") else cutoff_day
            dims.append(profile_item(dim, src[dim], POP[co], as_of))
    profile_cohorts[co] = {"population_accounts": POP[co], "dimensions": dims}

BEHAVIOR_IDS = ["funded_after_binding", "first_investment_after_binding",
                "investment_activity_after_binding", "redemption_after_binding",
                "xiaogu_used_after_binding"]
behavior_cohorts = {}
for co in COHORTS:
    items = []
    for bid in BEHAVIOR_IDS:
        r = {k: int(v) for k, v in q3["behavior"][co][bid].items()}
        delta = (r["eligible"] + r["excluded"]) - POP[co]
        if delta < 0 or delta > 5:
            raise SystemExit(f"behavior.{co}.{bid} 人数差 {delta} 超范围")
        if delta:
            if bid == "xiaogu_used_after_binding":
                r["eligible"] -= delta; r["reached"] -= delta
            else:
                r["excluded"] -= delta
        assert r["eligible"] + r["excluded"] == POP[co]
        assert r["eligible"] == r["reached"] + r["not_reached"] + r["unknown"], (co, bid, r)
        items.append({"id": bid, "definition_version": DEF_VERSION,
                      "time_basis": "post_binding_window", "data_as_of": cutoff,
                      "state": "confirmed", "population_accounts": POP[co],
                      "eligible_accounts": r["eligible"], "excluded_accounts": r["excluded"],
                      "reached_accounts": r["reached"], "not_reached_accounts": r["not_reached"],
                      "unknown_accounts": r["unknown"]})
    behavior_cohorts[co] = {"population_accounts": POP[co], "metrics": items}

UNAVAILABLE_MONEY = {"inflow_amount", "buy_amount", "sell_amount"}
business_cohorts = {}
for co in COHORTS:
    stats = []
    for sid in ["holding_amount", "inflow_amount", "buy_amount", "sell_amount"]:
        if sid in UNAVAILABLE_MONEY:
            stats.append({"id": sid, "definition_version": DEF_VERSION,
                          "time_basis": "post_binding_window", "state": "unavailable",
                          "reason_code": "authoritative_source_unavailable"})
            continue
        r = q3["business"][co][sid]
        accounts = int(r["accounts"])
        stats.append({"id": sid, "definition_version": DEF_VERSION,
                      "time_basis": "snapshot_as_of", "data_as_of": cutoff,
                      "state": "confirmed", "accounts": accounts,
                      "amount_wan": 0 if accounts == 0 else round(float(r["amount_wan"]), 4)})
    business_cohorts[co] = {"population_accounts": POP[co], "stats": stats}

out = dict(template)
out["meta"] = {**template["meta"], "generated_at": cutoff, "data_cutoff": cutoff,
               "latest_day_is_partial": True,
               "privacy": "只公开统计结果；2026-08-24 起按业务方要求，小分组不再合并或隐藏；页面不含用户身份标识与原始对话",
               "privacy_policy": "audience-full-disclosure-v2"}
out["privacy"] = {**template["privacy"], "minimum_public_cell": 1, "small_cell_rule": "full_disclosure"}
out["metrics"] = metrics
out["daily"] = rows
out["profile"] = {"cohorts": profile_cohorts}
for key, cohorts in (("behavior", behavior_cohorts), ("business", business_cohorts)):
    out[key] = {"window_start_at": template[key]["window_start_at"], "window_end_at": cutoff,
                "anchor": "first_bound_at", "cohorts": cohorts}

json.dump(out, open(HERE / "latest.new.json", "w"), ensure_ascii=False, indent=2)
open(HERE / "latest.new.json", "a").write("\n")
print("OK → latest.new.json")
print("metrics:", json.dumps(metrics, ensure_ascii=False))
