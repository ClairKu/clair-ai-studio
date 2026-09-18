#!/usr/bin/env python3
"""把取数各段的表格输出整理成 assemble.py 需要的 q1..q5.json。

用法: build-q.py <工作目录>
需要的文件（各段 SQL 见同目录 README）：
  sql-raw.txt   run-sql.sh 的 6 段（逐日 / 画像 / 资产 / 交易行为 / 流水行为 / 分省）
  money.txt     买入·赎回·入金金额（入金为「充值到宝＋银行卡直付」口径）
  newdims.txt   风测与人生首笔入金
  repeat.txt    复投（≥2 笔非钱包买入）
  zeroasset.txt 入金用户中绑定时零资产者的入金
  zeroatbind.txt 绑定时已有资产的人数（用于「绑定时资产状态」维度）
  lifecycle.txt 资金留存三段（无首投 / 已流失 / 在管）
  segments.txt  分客群面板 5 维度 × 6 指标
  cut.txt/ad.txt 数据截止时刻 / 资产快照日
"""
import json, re, sys
from pathlib import Path
from datetime import date, timedelta

I = lambda v: int(float(v))
F = lambda v: float(v)
W = Path(sys.argv[1])
CUT = (W / "cut.txt").read_text().strip()
AD = (W / "ad.txt").read_text().strip()
raw = (W / "sql-raw.txt").read_text()
iso = lambda s: s if "+08:00" in s else s.replace(" ", "T") + "+08:00"

def section(name, nxt):
    i = raw.index(name)
    return raw[i:raw.index(nxt) if nxt else len(raw)]

def rows(txt):
    lines = [l.rstrip() for l in txt.splitlines()]
    for k, l in enumerate(lines):
        if re.match(r"^-{5,}", l):
            hdr = lines[k - 1].split()
            out = []
            for dl in lines[k + 1:]:
                if not dl.strip():
                    break
                p = dl.split()
                if len(p) >= len(hdr):
                    out.append(dict(zip(hdr, p)))
            return out
    raise SystemExit("表格解析失败：没找到分隔行")

def by_cohort(name, cast=I):
    d = {r["cohort"]: {k: cast(v) for k, v in r.items() if k != "cohort"}
         for r in rows((W / name).read_text())}
    d.setdefault("new", {k: 0 for k in next(iter(d.values()))})
    d["all"] = {k: d["new"].get(k, 0) + d["existing"].get(k, 0) for k in d["existing"]}
    return d

# ── q1 逐日 ──
days = []
for l in section("### 1 daily", "### 2 profile").splitlines():
    m = re.match(r"^(\d{4}-\d{2}-\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)", l)
    if m:
        days.append({"date": m.group(1), "new": I(m.group(2)),
                     "existing": I(m.group(3)), "unclassified": I(m.group(4))})
assert days and days[0]["date"] == "2026-08-03", "逐日缺最早日期（检查 run-sql.sh 的 tail 上限）"
cur, full = date(2026, 8, 3), []
while cur <= date.fromisoformat(CUT[:10]):
    ds = cur.isoformat()
    full.append(next((d for d in days if d["date"] == ds),
                     {"date": ds, "new": 0, "existing": 0, "unclassified": 0}))
    cur += timedelta(days=1)
N = sum(d["new"] for d in full); E = sum(d["existing"] for d in full); U = sum(d["unclassified"] for d in full)
POP = {"all": N + E + U, "new": N, "existing": E}
q1 = {"data_cutoff": iso(CUT), "duplicate_bindings": 0, "unmatched_accounts": 0, "days": full}
print(f"q1: all={POP['all']} new={N} existing={E}")

# ── 各扩展段 ──
prof = {r["cohort"]: {k: I(v) for k, v in r.items() if k != "cohort"}
        for r in rows(section("### 2 profile", "### 3 assets"))}
prov = {}
for r in rows(section("### 6 province", None)):
    prov.setdefault(r["cohort"], {})[r["prov"]] = I(r["c"])
ast = {r["cohort"]: {k: (F(v) if k == "wan" else I(v)) for k, v in r.items() if k != "cohort"}
       for r in rows(section("### 3 assets", "### 4 trade behaviors"))}
trd = {r["cohort"]: {k: I(v) for k, v in r.items() if k != "cohort"}
       for r in rows(section("### 4 trade behaviors", "### 5 flow behaviors"))}
flw = {r["cohort"]: {k: I(v) for k, v in r.items() if k != "cohort"}
       for r in rows(section("### 5 flow behaviors", "### 6 province"))}
for _d in (trd, flw):          # 6 段里的两段只给 new/existing，这里补 all
    _d.setdefault("new", {k: 0 for k in _d["existing"]})
    _d["all"] = {k: _d["new"].get(k, 0) + _d["existing"].get(k, 0) for k in _d["existing"]}

nd = by_cohort("newdims.txt")
mny = by_cohort("money.txt", lambda v: I(v) if float(v) == int(float(v)) and "." not in str(v) else F(v))
mny = {c: {k: (I(v) if k.endswith("users") else F(v)) for k, v in d.items()} for c, d in
       {r["cohort"]: {k: v for k, v in r.items() if k != "cohort"} for r in rows((W/"money.txt").read_text())}.items()}
mny.setdefault("new", {k: 0 for k in mny["existing"]})
mny["all"] = {k: mny["new"].get(k, 0) + mny["existing"].get(k, 0) for k in mny["existing"]}
rp = by_cohort("repeat.txt")
za = by_cohort("zeroasset.txt", lambda v: F(v) if "wan" in str(v) else F(v))
za = {c: {k: (F(v) if k.endswith("wan") else I(v)) for k, v in d.items()} for c, d in
      {r["cohort"]: {k: v for k, v in r.items() if k != "cohort"} for r in rows((W/"zeroasset.txt").read_text())}.items()}
za.setdefault("new", {k: 0 for k in za["existing"]})
za["all"] = {k: round(za["new"].get(k, 0) + za["existing"].get(k, 0), 4) for k in za["existing"]}
zab = by_cohort("zeroatbind.txt")
lc = by_cohort("lifecycle.txt")
sg = {r["seg"]: r for r in rows((W / "segments.txt").read_text())}

for co in ("new", "existing"):
    assert rp[co]["invested_after"] == mny[co]["buy_users"], (co, "复投口径与买入人数不一致")

# ── q2 画像 ──
def cohort_profile(co):
    base = ({k: prof["new"].get(k, 0) + prof["existing"].get(k, 0) for k in prof["new"]}
            if co == "all" else prof[co])
    if co == "all":
        pv = {}
        for c in ("new", "existing"):
            for k, v in prov.get(c, {}).items():
                pv[k] = pv.get(k, 0) + v
    else:
        pv = dict(prov.get(co, {}))
    pop = base["pop"]
    ages = {"lte_25": base["lte25"], "26_35": base["a2635"], "36_45": base["a3645"],
            "46_55": base["a4655"], "56_65": base["a5665"], "gte_66": base["gte66"]}
    ages["unknown"] = pop - sum(ages.values())
    pv.setdefault("unknown", 0)
    zero_at_bind = pop - zab[co]["nonzero_at_bind"]
    return {"gender": {"male": base["male"], "female": base["female"],
                       "unknown": pop - base["male"] - base["female"]},
            "age_bucket": ages,
            "wechat_mp_status": {"mp_bound": base["mp"], "mp_not_bound": pop - base["mp"]},
            "bank_card_status": {"card_bound": base["card"], "card_not_bound": pop - base["card"]},
            "risk_assessment_status": {"assessed": base["assessed"], "not_assessed": pop - base["assessed"]},
            "lifetime_investment_status": {"invested": base["invested"], "not_invested": pop - base["invested"]},
            "asset_at_bind_status": {"zero_at_bind": zero_at_bind,
                                     "has_assets_at_bind": pop - zero_at_bind},
            "holding_lifecycle_status": {"no_first_investment": lc[co]["never_inv"],
                                         "churned": lc[co]["churned"],
                                         "under_management": lc[co]["under_mgmt"]},
            "residence_province": pv}

q2 = {"cohorts": {co: cohort_profile(co) for co in ("all", "new", "existing")}}

# ── q4 资产分布 ──
def cohort_assets(co):
    a = ({k: ast["new"].get(k, 0) + ast["existing"].get(k, 0) for k in ast["new"]}
         if co == "all" else ast[co])
    pop = POP[co]; unknown = pop - a["with_acct"]
    holding = {"has_assets": a["has_assets"], "no_assets": a["no_assets"], "unknown": unknown}
    bucket = {"no_assets": a["no_assets"], "lt_10k": a["lt10k"], "10k_100k": a["b1"],
              "100k_1m": a["b2"], "gte_1m": a["b3"], "unknown": unknown}
    assert sum(holding.values()) == pop and sum(bucket.values()) == pop, (co, pop, holding)
    return {"asset_holding_status": holding, "asset_bucket": bucket}

q4 = {"as_of": AD, "cohorts": {co: cohort_assets(co) for co in ("all", "new", "existing")}}

# ── q3 行为 + 经营 ──
def beh(pop, el, re_, unk=0):
    r = {"eligible": el, "excluded": pop - el, "reached": re_,
         "not_reached": el - re_ - unk, "unknown": unk}
    assert all(v >= 0 for v in r.values()), r
    return r

behavior, business = {}, {}
for co in ("all", "new", "existing"):
    pop = POP[co]; t, f, n, m, z = trd[co], flw[co], nd[co], mny[co], za[co]
    funded_before = n["fund_ever"] - n["first_fund_after_bind"]
    behavior[co] = {
        "funded_after_binding": beh(pop, t["eligible"], f["funded"], f["no_rows"]),
        "first_investment_after_binding": beh(pop, t["eligible"], t["first_inv"]),
        "investment_activity_after_binding": beh(pop, t["eligible"], t["activity"]),
        "redemption_after_binding": beh(pop, t["eligible"], f["redeem_union"]),
        "xiaogu_used_after_binding": beh(pop, pop, t["xiaogu"]),
        "account_opened_after_binding": beh(pop, pop, n["first_risk_after_bind"]),
        "risk_assessed_after_binding": beh(pop, pop, n["any_risk_after_bind"]),
        "first_funding_after_binding": beh(pop, pop - funded_before, n["first_fund_after_bind"]),
        "repeat_investment_after_binding": beh(pop, t["eligible"], rp[co]["repeat_invest"]),
    }
    a = ({k: ast["new"].get(k, 0) + ast["existing"].get(k, 0) for k in ast["new"]}
         if co == "all" else ast[co])
    wan = round(ast["new"]["wan"] + ast["existing"]["wan"], 2) if co == "all" else round(ast[co]["wan"], 2)
    hcnt = a["has_assets"]
    business[co] = {
        "holding_amount": {"accounts": hcnt, "amount_wan": wan,
                           **({"per_capita_wan": round(wan / hcnt, 4)} if hcnt else {})},
        "inflow_amount": {"accounts": m["inflow_users"], "amount_wan": round(m["inflow_wan"], 4)},
        "buy_amount": {"accounts": m["buy_users"], "amount_wan": round(m["buy_wan"], 4)},
        "zero_asset_inflow_amount": {"accounts": z["zero_users"], "amount_wan": round(z["zero_wan"], 4)},
        "sell_amount": {"accounts": m["sell_users"], "amount_wan": round(m["sell_wan"], 4)},
    }
q3 = {"as_of": iso(CUT), "behavior": behavior, "business": business}

# ── q5 分客群面板 ──
SEG_ORDER = ["all", "invested", "first_inv", "new", "new_first_inv", "existing", "existing_reactivated", "existing_first_inv"]
items = [{"id": k, "population_accounts": I(sg[k]["pop"]),
          "new_accounts": I(sg[k]["new_cnt"]),
          "existing_accounts": I(sg[k]["pop"]) - I(sg[k]["new_cnt"]),
          "card_bound_accounts": I(sg[k]["card_bound"]),
          "opened_after_binding_accounts": I(sg[k]["opened_after"]),
          "risk_assessed_accounts": I(sg[k]["assessed"]),
          "risk_after_binding_accounts": I(sg[k]["risk_after"]),
          "inflow_amount_wan": round(F(sg[k]["inflow_wan"]), 4),
          "inflow_accounts": I(sg[k]["inflow_users"]),
          "inflow_transactions": I(sg[k]["inflow_txns"]),
          "total_asset_wan": round(F(sg[k]["asset_wan"]), 2),
          "holder_accounts": I(sg[k]["holders"]),
          "holders_gte_100k_accounts": I(sg[k]["h100k"]),
          "holders_gte_1m_accounts": I(sg[k]["h1m"]),
          "reinvested_accounts": I(sg[k]["reinvested"]),
          "first_investor_accounts": I(sg[k]["first_inv_cnt"])}
         for k in SEG_ORDER if k in sg]
assert len(items) == len(SEG_ORDER), f"segments 缺维度: {set(SEG_ORDER)-set(sg)}"
q5 = {"as_of": iso(CUT), "asset_as_of": AD, "items": items}

for name, obj in (("q1", q1), ("q2", q2), ("q3", q3), ("q4", q4), ("q5", q5)):
    json.dump(obj, open(W / f"{name}.json", "w"), ensure_ascii=False, indent=1)
print("OK → q1..q5.json")
print("business.all:", json.dumps(business["all"], ensure_ascii=False))
