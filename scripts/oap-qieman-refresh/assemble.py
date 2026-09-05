#!/usr/bin/env python3
"""组装 oap-qieman-user-dashboard latest.json：模板(上一版) + 工作目录里的 q*.txt 原始数 → 新快照。

用法: assemble.py <上一版 latest.json> <工作目录> [--cut YYYY-MM-DD] [--ad YYYY-MM-DD]
口径全部经 08-17/08-18 发布值回放校准（见 research/oap-qieman-user-dashboard-2026-08-17.md §0-bis）；
行为/画像/且慢基线按分源截止保持冻结。抑制规则与 validate-oap-qieman-user-dashboard.mjs 同语义。
"""
import json, re, sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

TEMPLATE = sys.argv[1]
W = Path(sys.argv[2])
def opt(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default
CUTD = opt("--cut", "2026-09-03")
AD = opt("--ad", "2026-09-04")
CUT_ISO = f"{CUTD}T23:59:59+08:00"
_c = date.fromisoformat(CUTD)
W30S = (_c - timedelta(days=29)).isoformat()
PREVE = (_c - timedelta(days=30)).isoformat()
PREVS = (_c - timedelta(days=59)).isoformat()
TREND0 = (_c - timedelta(days=89)).isoformat()
JSTART = (_c - timedelta(days=16)).isoformat()  # journey 17 行
K = 20

def parse(name):
    """redash CLI 文本表 → list[dict]，数值转 int/float，'None' → None。"""
    lines = (W / f"{name}.txt").read_text().splitlines()
    dash = max(i for i, l in enumerate(lines) if re.fullmatch(r"-{5,}", l.strip()) and i > 0 and lines[i - 1].strip())
    header = lines[dash - 1].split()
    rows = []
    for l in lines[dash + 1:]:
        vals = l.split()
        if len(vals) != len(header):
            continue
        row = {}
        for h, v in zip(header, vals):
            try:
                f = float(v)
                row[h] = int(f) if f == int(f) else f
            except ValueError:
                row[h] = None if v in ("NULL", "None") else v
        rows.append(row)
    assert rows, f"{name}: no rows parsed"
    return rows

def wan(x):  # 金额按万元汇总
    return int(round(x / 10000.0)) * 10000

def r4(x): return round(x, 4)

tpl = json.load(open(TEMPLATE))
out = json.loads(json.dumps(tpl))

# ---------- usage ----------
pop = parse("q1_pop")[0]
calls = parse("q1_calls")[0]
approved, called, active30 = pop["approved"], pop["called"], pop["active30"]
usage = {
    "approved_users": approved, "ever_called_users": called, "active_30d_users": active30,
    "total_calls": calls["total_calls"], "attributed_calls": calls["attributed"],
    "unattributed_calls": calls["total_calls"] - calls["attributed"], "calls_30d": calls["calls_30d"],
}
out["usage"] = usage
COHN = {"approved": approved, "called": called, "active_30d": active30}
CO_KEYS = [("approved", "approved"), ("called", "called"), ("active_30d", "active30")]

# ---------- meta ----------
now = datetime.now(timezone(timedelta(hours=8))).replace(microsecond=0)
out["meta"]["generated_at"] = now.isoformat()
out["meta"]["data_cutoff"] = CUT_ISO
out["meta"]["asset_snapshot_date"] = AD
out["meta"]["source_cutoffs"] = {
    "oap_usage_and_registration": CUTD, "asset_snapshot": AD, "cashflow_proxy": CUTD,
    "behavior_events": tpl["meta"]["source_cutoffs"]["behavior_events"],
    "survey_profile": tpl["meta"]["source_cutoffs"]["survey_profile"],
}

# ---------- journey ----------
daily = {r["dt"]: r for r in parse("q2_daily")}
newu = {r["dt"]: r["new_users"] for r in parse("q2_newusers")}
base_calls = parse("q2_basecalls")[0]["base_calls"]
base_users = parse("q2_baseusers")[0]["base_users"]
rows, cc, cu = [], base_calls, base_users
d = date.fromisoformat(JSTART)
while d <= _c:
    ds = d.isoformat()
    dc = daily.get(ds, {}).get("daily_calls", 0)
    dcu = daily.get(ds, {}).get("daily_calling_users", 0)
    dn = newu.get(ds, 0)
    cc += dc; cu += dn
    row = {"date": ds,
           "cumulativeCalls": int(round(cc / K)) * K, "cumulativeUsers": int(round(cu / K)) * K,
           "dailyCalls": dc, "dailyNewUsers": dn, "dailyCallingUsers": dcu, "suppressed_fields": []}
    for pub, marker in (("dailyCalls", "daily_calls"), ("dailyNewUsers", "daily_new_users"), ("dailyCallingUsers", "daily_calling_users")):
        if 0 < row[pub] < K:
            row[pub] = None
            row["suppressed_fields"].append(marker)
    rows.append(row)
    d += timedelta(days=1)
assert cc == usage["total_calls"], (cc, usage["total_calls"])
assert cu == usage["approved_users"], (cu, usage["approved_users"])
out["journey_metrics"].update({"as_of": CUTD, "range_start": JSTART, "rows": rows})

# ---------- cohorts + segments 资产 ----------
SEGQ = {"approved": parse("q3_approved"), "called": parse("q3_called"), "active_30d": parse("q3_active30")}
BUCKETS = [("lt_10k", "1 万以下", "b1"), ("10k_100k", "1–10 万", "b2"), ("100k_500k", "10–50 万", "b3"),
           ("500k_1m", "50–100 万", "b4"), ("gte_1m", "100 万以上", "b5")]
SEG_KEYS = ["users", "qacct", "holders", "managed", "profitable", "aum", "b1", "b2", "b3", "b4", "b5"]

def agg(rows):
    return {k: sum((r[k] or 0) for r in rows) for k in SEG_KEYS}

def seg_row(rows, seg):
    m = [r for r in rows if r["seg"] == seg]
    return {k: (m[0][k] or 0) for k in SEG_KEYS} if m else {k: 0 for k in SEG_KEYS}

new_cohorts = []
for cid, _k in CO_KEYS:
    t = agg(SEGQ[cid])
    assert t["users"] == COHN[cid], (cid, t["users"], COHN[cid])
    assert t["b1"] + t["b2"] + t["b3"] + t["b4"] + t["b5"] == t["holders"], cid
    c = dict(next(x for x in tpl["cohorts"] if x["id"] == cid))
    c.update({
        "users": t["users"], "qieman_accounts": t["qacct"],
        "qieman_account_rate": r4(t["qacct"] / t["users"]),
        "holders": t["holders"], "holder_rate": r4(t["holders"] / t["users"]),
        "managed_accounts": t["managed"], "managed_rate": r4(t["managed"] / t["users"]),
        "aum_yuan": wan(t["aum"]),
        "average_holder_asset_yuan": wan(t["aum"] / t["holders"]) if t["holders"] else 0,
        "profitable_holders": t["profitable"],
        "profitable_holder_rate": r4(t["profitable"] / t["holders"]) if t["holders"] else 0,
        "asset_buckets": [{"key": k, "label": lb, "count": t[col], "share": r4(t[col] / t["holders"])}
                          for k, lb, col in BUCKETS],
    })
    for b in c["asset_buckets"]:
        assert b["count"] == 0 or b["count"] >= K, f"{cid} bucket {b['key']}={b['count']} <{K}（人群级分档无抑制机制，需人工决定合并）"
    new_cohorts.append(c)
out["cohorts"] = new_cohorts

# ---------- growth ----------
REG = {"approved": parse("q5_approved")[0], "called": parse("q5_called")[0], "active_30d": parse("q5_active30")[0]}
CASH = {cid: parse(f"q4t_{k}") + parse(f"q4w_{k}") for cid, k in (("approved", "approved"), ("called", "called"), ("active_30d", "active30"))}

def cash_row(cid, bucket):
    m = [r for r in CASH[cid] if r["bucket"] == bucket]
    return {k: (m[0][k] or 0) for k in ("inflow_users", "inflow", "outflow")} if m else {"inflow_users": 0, "inflow": 0, "outflow": 0}

def period_dates(i):
    s = date.fromisoformat(TREND0) + timedelta(days=10 * i)
    return s.isoformat(), (s + timedelta(days=9)).isoformat()

growth = out["growth"]
growth["comparison"] = {"current_start": W30S, "current_end": CUTD, "previous_start": PREVS, "previous_end": PREVE}
growth["trend"] = {"window_start": TREND0, "window_end": CUTD, "grain_days": 10, "period_count": 9}
growth["funnel"] = {"registration_start": PREVS, "registration_end": PREVE, "followup_days": 30}
growth["cashflow_max_date"] = CUTD

def mkrow(reg, cash):
    return {"new_registrations": reg, "first_inflow_users": None,
            "inflow_users": cash["inflow_users"], "inflow_yuan": wan(cash["inflow"]),
            "outflow_yuan": wan(cash["outflow"]), "suppressed_fields": ["first_inflow_users"]}

by = {}
for cid, _k in CO_KEYS:
    r = REG[cid]
    by[cid] = {
        "cohort_n": COHN[cid], "registration_time_coverage_state": "complete",
        "current": mkrow(r["reg_cur"], cash_row(cid, "cur")),
        "previous": mkrow(r["reg_prev"], cash_row(cid, "prev")),
        "funnel": {"eligible_registrations": r["reg_prev"], "first_inflow_d7_users": None,
                   "first_inflow_d30_users": None, "still_holding_users": None,
                   "suppressed_fields": ["first_inflow_d7_users", "first_inflow_d30_users", "still_holding_users"]},
        "trend_periods": [dict(mkrow(r[f"t{i}"], cash_row(cid, f"t{i}")),
                               start=period_dates(i)[0], end=period_dates(i)[1]) for i in range(9)],
    }

def suppress(row, field):
    if row.get(field) is not None:
        row[field] = None
        if field not in row["suppressed_fields"]:
            row["suppressed_fields"].append(field)
    if field == "inflow_users" and row.get("inflow_yuan") is not None:
        row["inflow_yuan"] = None
        row["suppressed_fields"].append("inflow_yuan")

for cid in by:  # 基础抑制：1–19 → null
    g = by[cid]
    for row in [g["current"], g["previous"], g["funnel"], *g["trend_periods"]]:
        for f in ("new_registrations", "inflow_users", "eligible_registrations"):
            if f in row and row[f] is not None and 0 < row[f] < K:
                suppress(row, f)

order = ["approved", "called", "active_30d"]
for _ in range(6):  # 跨人群差分 1–19 抑制较窄侧 + 汇总⟺趋势抑制传播，迭代至不动点
    changed = False
    for f in ("new_registrations", "inflow_users", "eligible_registrations"):
        rowsets = [lambda g: g["current"], lambda g: g["previous"], lambda g: g["funnel"]] + \
                  [(lambda i: lambda g: g["trend_periods"][i])(i) for i in range(9)]
        for getr in rowsets:
            seq = [(getr(by[cid]), getr(by[cid]).get(f)) for cid in order]
            for a in range(len(seq) - 1):
                (rb, vb), (rn, vn) = seq[a], seq[a + 1]
                if vb is None or vn is None:
                    continue
                if 0 < vb - vn < K:
                    suppress(rn, f); changed = True
    for cid in order:
        g = by[cid]
        for f in ("new_registrations", "inflow_users"):
            for summary, sl in ((g["previous"], g["trend_periods"][3:6]), (g["current"], g["trend_periods"][6:9])):
                s_null, t_null = summary[f] is None, any(p[f] is None for p in sl)
                if s_null and not t_null:
                    suppress(min(sl, key=lambda p: p[f]), f); changed = True
                elif t_null and not s_null:
                    suppress(summary, f); changed = True
    if not changed:
        break
growth["by_cohort"] = by

# ---------- segments ----------
CALLSEG = {r["seg"]: r for r in parse("q8_calls_seg")}
SIPLAN = {r["seg"]: r for r in parse("q9_siplan")}
TEN_NEW = parse("q9_tenure_new")[0]
TEN_EX = parse("q9_tenure_existing")[0]
PFX = {"approved": "ap", "called": "ca", "active_30d": "ac"}
SI_COL = {"approved": "si_approved", "called": "si_called", "active30": "si_active30"}
CALL_COL = {"approved": "calls_approved", "called": "calls_called", "active_30d": "calls_active30"}

segs = out["segments"]
segs["snapshot_note"] = segs["snapshot_note"].replace(tpl["meta"]["asset_snapshot_date"], AD)

def build_view(seg, srow, coh_users):
    v = {"users": srow["users"], "qieman_accounts": srow["qacct"],
         "qieman_account_rate": r4(srow["qacct"] / srow["users"]) if srow["users"] else 0,
         "holders": srow["holders"], "holder_rate": r4(srow["holders"] / srow["users"]) if srow["users"] else 0,
         "managed_accounts": srow["managed"], "managed_rate": r4(srow["managed"] / srow["users"]) if srow["users"] else 0,
         "aum_yuan": wan(srow["aum"]),
         "average_holder_asset_yuan": wan(srow["aum"] / srow["holders"]) if srow["holders"] else 0,
         "profitable_holders": srow["profitable"],
         "profitable_holder_rate": r4(srow["profitable"] / srow["holders"]) if srow["holders"] else 0,
         "asset_buckets": [{"key": k, "label": lb, "count": srow[col],
                            "share": r4(srow[col] / srow["holders"]) if srow["holders"] else 0}
                           for k, lb, col in BUCKETS],
         "suppressed_fields": []}
    if seg in ("new", "existing"):
        v["share"] = r4(srow["users"] / coh_users)
    sup = v["suppressed_fields"]
    def hide(*fields):
        for f in fields:
            if f == "asset_buckets":
                for b in v["asset_buckets"]:
                    b["count"] = None; b["share"] = None
            else:
                v[f] = None
            if f not in sup:
                sup.append(f)
    if 0 < (v["qieman_accounts"] or 0) < K:
        hide("qieman_accounts", "qieman_account_rate")
    if 0 < (v["holders"] or 0) < K:
        hide("holders", "managed_accounts", "profitable_holders", "aum_yuan",
             "average_holder_asset_yuan", "holder_rate", "managed_rate", "profitable_holder_rate", "asset_buckets")
    else:
        if 0 < (v["managed_accounts"] or 0) < K:
            hide("managed_accounts", "managed_rate")
        if 0 < (v["profitable_holders"] or 0) < K:
            hide("profitable_holders", "profitable_holder_rate")
        for b in v["asset_buckets"]:
            if b["count"] is not None and 0 < b["count"] < K:
                b["count"] = None; b["share"] = None
        if sum(1 for b in v["asset_buckets"] if b["count"] is not None) == 4:
            bmin = min((b for b in v["asset_buckets"] if b["count"] is not None), key=lambda b: b["count"])
            bmin["count"] = None; bmin["share"] = None
        # suppressed_fields 里的分档字段要求每一档都为 null；部分抑制不申报
        if all(b["count"] is None for b in v["asset_buckets"]) and "asset_buckets" not in sup:
            sup.append("asset_buckets")
    return v

for cid, ckey in CO_KEYS:
    rows3 = SEGQ[cid]
    bucket = segs["by_cohort"][cid]
    bucket["unknown_users"] = seg_row(rows3, "unknown")["users"]
    views = {}
    for seg in ("new", "existing", "all"):
        srow = agg(rows3) if seg == "all" else seg_row(rows3, seg)
        views[seg] = build_view(seg, srow, COHN[cid])
    cnew = CALLSEG.get("new", {}).get(CALL_COL[cid]) or 0
    cex = CALLSEG.get("existing", {}).get(CALL_COL[cid]) or 0
    for seg, ct in (("new", cnew), ("existing", cex), ("all", cnew + cex)):  # all=新+老，沿用上一版口径
        u = views[seg]["users"]
        views[seg]["oap_usage"] = {"calls_total": ct, "calls_per_user": round(ct / u, 2) if u else 0}
    for seg in ("new", "existing", "all"):
        col = SI_COL[ckey]
        if seg == "all":
            actors = sum(SIPLAN.get(s, {}).get(col) or 0 for s in ("new", "existing", "unknown"))
        else:
            actors = SIPLAN.get(seg, {}).get(col) or 0
        u = views[seg]["users"]
        if 0 < actors < K:
            views[seg]["services"] = [{"key": "si_plan", "actors": None, "penetration": None}]
        else:
            views[seg]["services"] = [{"key": "si_plan", "actors": actors, "penetration": round(actors / u, 4) if u else 0.0}]
    p = PFX[cid]
    views["new"]["tenure"] = [{"bucket": b, "users": TEN_NEW[f"{p}_{c}"]} for b, c in
                              (("d0_7", "d0_7"), ("d8_30", "d8_30"), ("d31_90", "d31_90"), ("d90_plus", "d90p"))]
    views["existing"]["tenure"] = [{"bucket": b, "users": TEN_EX[f"{p}_{c}"]} for b, c in
                                   (("lt_1y", "lt1y"), ("y1_3", "y13"), ("y3_plus", "y3p"))]
    for seg in ("new", "existing"):
        for trow in views[seg]["tenure"]:
            if trow["users"] is not None and 0 < trow["users"] < K:
                trow["users"] = None
    views["all"]["tenure"] = None
    for seg in ("new", "existing", "all"):
        bucket[seg] = views[seg]
    assert views["new"]["users"] + views["existing"]["users"] + bucket["unknown_users"] == COHN[cid], cid

# ---------- quality checks / notes ----------
for qc in out["quality_checks"]:
    if qc["label"] == "注册与入金口径":
        qc["detail"] = f"新注册只认且慢正式注册时间；资金为账户日级资产入账代理，已刷新至 {CUTD}，但「首次资产入账」需全历史扫描本轮无法完成，按缺失处理。"
out["qieman_baseline"]["note"] = "且慢全量可比口径；沿用 2026-08-18 快照聚合（本轮未重算，「在管用户」口径源自当时的官方汇总，无法由日级资产表直接复现），仅作结构参照，不用于因果归因。"

json.dump(out, open(W / "latest.new.json", "w"), ensure_ascii=False, indent=2)
open(W / "latest.new.json", "a").write("\n")
print("OK → latest.new.json")
print("usage:", json.dumps(usage, ensure_ascii=False))
for c in out["cohorts"]:
    print(c["id"], c["users"], c["qieman_accounts"], c["holders"], c["managed_accounts"], c["aum_yuan"])
