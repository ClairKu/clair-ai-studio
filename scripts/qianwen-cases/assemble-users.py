#!/usr/bin/env python3
"""candidates.json + d_*.json + narratives.json → users.json（build-cases.py 的输入）。
用法: assemble-users.py <dir> <cutoff 'YYYY-MM-DD HH:MM'> <bound_total>"""
import json, sys, re
from pathlib import Path
from datetime import datetime
D = Path(sys.argv[1]); CUT = sys.argv[2]; BOUND = int(sys.argv[3])
cand = json.load(open(D/"candidates.json"))
T = lambda s: datetime.fromisoformat(str(s)[:19]) if s else None

trades = json.load(open(D/"d_trades.json")); risk = json.load(open(D/"d_risk.json"))
asks = json.load(open(D/"d_asks.json")); assets = json.load(open(D/"d_assets.json")); dev = json.load(open(D/"d_device.json"))
flows = json.load(open(D/"d_flows.json")) if (D/"d_flows.json").exists() else []
narr = json.load(open(D/"narratives.json")) if (D/"narratives.json").exists() else {}
def load(name):
    f = D/name
    return json.load(open(f)) if f.exists() else []
m_sessions, m_mia, m_tokens, m_combine, m_bill, m_meta, m_fo = (load(x) for x in
    ("m_sessions.json","m_mia_msgs.json","m_tokens.json","m_combine17.json","m_bill.json","m_meta.json","m_fundorder.json"))
g_sess = {}
for r in m_sessions: g_sess.setdefault(str(r["uid"]), []).append(r)
g_mia = {}
for r in m_mia:
    if r.get("sender_id") == "USER": g_mia.setdefault(str(r["owner_id"]), []).append(r)
g_tok = {}
for r in m_tokens: g_tok.setdefault(str(r["user_id"]), []).append(r["created_at"])
g_comb = {}
for r in m_combine: g_comb.setdefault(str(r["account3_id"]), []).append(r)
g_bill = {}
for r in m_bill: g_bill.setdefault(str(r["account3_id"]), []).append(r)
sa_meta = {r["service_account_id"]: r.get("meta") for r in m_meta}
m_fo_all = load("m_fundorders.json")
import re as _re
def po_from_meta(meta):
    m = _re.search(r'"po_code"\s*:\s*"([A-Z0-9_]+)"', meta or "") or _re.search(r'(ZH\d{6}|SI\d{6})', meta or "")
    return m.group(1) if m else None
by = lambda rows, k: {}
def group(rows, key):
    g = {}
    for r in rows: g.setdefault(str(r[key]), []).append(r)
    return g
g_tr, g_risk, g_asks, g_assets, g_dev = group(trades,"user_id"), group(risk,"account3_id"), group(asks,"uid"), group(assets,"account3_id"), group(dev,"po_manager_id")
g_flow = group(flows,"account3_id")

users = []
for c in sorted(cand, key=lambda c: c["fb"]):
    pmid = str(c["pmid"]); a3 = str(c["account3_id"]) if c.get("account3_id") is not None else None
    fb = T(c["fb"])
    tr = [{"accept_time": t["accept_time"], "trade_type": t["trade_type"], "po_code": t["po_code"], "po_name": t["po_name"],
           "buy": t["buy_amount"], "redeem": t["redeem_amount"], "canceled": int(t["canceled"] or 0), "extra": t["extra"]}
          for t in g_tr.get(pmid, [])]
    after = [t for t in tr if T(t["accept_time"]) >= fb and not t["canceled"]]
    BUY_TYPES = {"po.buy","fund.buy","si.trade","po.adjust","plan.trade"}
    buys = [t for t in after if t["trade_type"] in BUY_TYPES and t["buy"] and float(t["buy"]) > 0]
    recharge_secs = {t["accept_time"] for t in after if t["trade_type"] == "wallet.recharge"}
    inflow = sum(float(t["buy"]) for t in after if t["trade_type"] == "wallet.recharge") + \
             sum(float(t["buy"]) for t in buys if t["accept_time"] not in recharge_secs)
    sell = sum(float(t["redeem"] or 0) for t in after if t["redeem"] and float(t["redeem"]) > 0)
    cancels = sum(1 for t in tr if T(t["accept_time"]) >= fb and t["canceled"])
    fl = [f for f in g_flow.get(a3, []) if a3 and f["cal_date"][:10] >= fb.strftime("%Y-%m-%d")]
    root_in = sum(float(f["inflow"] or 0) for f in fl); root_out = sum(float(f["outflow"] or 0) for f in fl)
    wallet_inflow = inflow
    if fl: inflow = root_in
    else:
        rc = sum(float(t["buy"]) for t in after if t["trade_type"] == "wallet.recharge")
        inflow = rc if rc > 0 else sum(float(t["buy"]) for t in buys)
    first_buy_after = min((t["accept_time"] for t in buys), default=None)
    asset_rows = sorted(g_assets.get(a3, []), key=lambda r: r["cal_date"]) if a3 else []
    asset_latest = {"cal_date": asset_rows[-1]["cal_date"][:10], "ta": asset_rows[-1]["ta"]} if asset_rows else None
    zero = (c.get("asset_at_bind") is None) or float(c["asset_at_bind"]) <= 0
    first_ever = T(c.get("first_buy_ever"))
    flags = {
        "zero_at_bind": bool(zero and inflow > 0),
        "recall": bool(zero and inflow > 0 and c["cohort"] == "existing"),
        "first_invest_after": bool(first_ever and first_ever >= fb),
        "new_first_invest": bool(c["cohort"] == "new" and buys),
    }
    n = narr.get(pmid, {})
    # 小顾入口
    sess = g_sess.get(pmid, [])
    mia = sorted(g_mia.get(pmid, []), key=lambda r: r["create_time"])
    channels = {
        "qwen_sessions": sum(1 for r in sess if r.get("is_qwen")), "qwen_msgs": sum(int(r["msgs"] or 0) for r in sess if r.get("is_qwen")),
        "app_sessions": sum(1 for r in sess if not r.get("is_qwen")),
        "app_mia": [{"ts": r["create_time"], "scene": r.get("scene"), "mode": r.get("query_mode"), "text": r.get("content")} for r in mia],
        "wechat_msgs": 0,
        "tokens": sorted(g_tok.get(pmid, [])),
    }
    # 最终持有：CA/WALLET 子账户 + 组合名（meta→po_code，否则按买入金额就近匹配）+ 月度账单基金明细
    po_names = {t["po_code"]: t["po_name"] for t in tr if t.get("po_code") and t.get("po_name")}
    buy_by_po = {}
    for t in buys: buy_by_po[t["po_code"]] = buy_by_po.get(t["po_code"], 0) + float(t["buy"])
    holdings = []
    used = set()
    for r in sorted([x for x in g_comb.get(a3 or "", []) if x["relation_account_type"] in ("CA", "WALLET")], key=lambda x: -float(x["ta"])):
        if r["relation_account_type"] == "WALLET":
            holdings.append({"kind": "钱包", "code": "WALLET", "name": "盈米宝", "value": float(r["ta"]), "sa": r["service_account_id"]}); continue
        po = po_from_meta(sa_meta.get(r["service_account_id"]))
        if not po:
            cands = [(abs(buy_by_po[c] - float(r["sh"] or r["ta"])), c) for c in buy_by_po if c not in used and c != "WALLET"]
            po = min(cands)[1] if cands else None
        if po: used.add(po)
        holdings.append({"kind": "自助基金" if po == "FUND" else "组合" if po and po.startswith("ZH") else "策略" if po and po.startswith("SI") else "组合/策略",
                         "code": po, "name": po_names.get(po, po or "未知"), "value": float(r["ta"]), "sa": r["service_account_id"]})
    if not holdings and buys:
        for pc, amt in sorted(buy_by_po.items(), key=lambda kv: -kv[1]):
            holdings.append({"kind": "自助基金" if pc == "FUND" else "组合/策略", "code": pc, "name": po_names.get(pc, pc), "value": None, "buy": amt})
    bill = g_bill.get(a3 or "", [])
    latest_month = max((b["cal_month"] for b in bill), default=None)
    fund_detail = [{"po": b["po_name"] or "盈米宝", "fund_code": b["fund_code"], "fund_name": b["fund_name"], "mv": float(b["mv"] or 0)}
                   for b in bill if b["cal_month"] == latest_month] if bill else []
    # 账单缺失/过旧时，用绑定后子订单（fund_order，按基金汇总成功金额）穿透
    fos = [r for r in m_fo_all if str(r["account_id"]) == (a3 or "")] if a3 else []
    last_buy_month = max((t["accept_time"][:7] for t in buys), default=fb.strftime("%Y-%m"))
    if fos and (not fund_detail or (latest_month or "") < last_buy_month):
        fund_detail = [{"po": r.get("po") or "—", "fund_code": r["fund_code"], "fund_name": r["fund_name"] or r["fund_code"],
                        "mv": float(r["amt"] or 0), "basis": "绑定后子订单成功金额"} for r in fos]
        latest_month = None
    holdings_meta = {"as_of": (asset_latest or {}).get("cal_date"), "bill_month": latest_month,
                     "fund_basis": "子订单成功金额" if (fos and latest_month is None) else ("月末账单市值" if fund_detail else None)}
    users.append({
        "pmid": pmid, "letter": n.get("letter"), "cohort": c["cohort"], "gender": c.get("gender"), "age": c.get("age"),
        "prov": c.get("prov"), "mp": bool(c.get("mp")), "card": bool(c.get("card")), "account3_id": a3,
        "fb": c["fb"], "registered_at": c["registered_at"], "asset_at_bind": c.get("asset_at_bind"),
        "first_buy_ever": c.get("first_buy_ever"), "last_buy_before": c.get("last_buy_before"),
        "dev": [{"platform": str(d["platform"]), "created_on": d["created_on"], "updated_on": d["updated_on"]} for d in g_dev.get(pmid, [])],
        "risk": [{"created_at": r["created_at"], "score": r["score"]} for r in sorted(g_risk.get(a3, []), key=lambda r: r["created_at"])] if a3 else [],
        "trades": tr,
        "asks": [{"ts": q["ts"], "text": q["text"], "session_id": str(q["session_id"])} for q in g_asks.get(pmid, [])],
        "asset_latest": asset_latest, "channels": channels, "holdings": holdings, "fund_detail": fund_detail, "holdings_meta": holdings_meta,
        "flags": flags,
        "derived": {"buys_after": len(buys), "buy_amount_after": sum(float(t["buy"]) for t in buys), "inflow_after": inflow,
                    "sell_after": sell, "first_buy_after": first_buy_after, "cancels_after": cancels,
                    "wallet_inflow": wallet_inflow, "root_out": root_out if fl else None},
        **({"narrative": n["narrative"], "verdict": n["verdict"]} if n else {}),
    })
# 字母：沿用已有 A—F，其余按绑定时间顺延
used = {u["letter"] for u in users if u["letter"]}
nxt = iter(ch for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if ch not in used)
for u in users:
    if not u["letter"]: u["letter"] = next(nxt)
keep = [u for u in users if any(u["flags"].values())]
json.dump({"meta": {"cutoff": CUT, "bound_total": BOUND, "generated": datetime.now().strftime("%Y-%m-%d %H:%M")}, "users": keep},
          open(D/"users.json", "w"), ensure_ascii=False, indent=1)
print(f"users: {len(keep)}", [(u["letter"], u["pmid"], u["cohort"], {k for k,v in u["flags"].items() if v}) for u in keep])
