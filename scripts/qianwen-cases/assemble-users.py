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
    users.append({
        "pmid": pmid, "letter": n.get("letter"), "cohort": c["cohort"], "gender": c.get("gender"), "age": c.get("age"),
        "prov": c.get("prov"), "mp": bool(c.get("mp")), "card": bool(c.get("card")), "account3_id": a3,
        "fb": c["fb"], "registered_at": c["registered_at"], "asset_at_bind": c.get("asset_at_bind"),
        "first_buy_ever": c.get("first_buy_ever"), "last_buy_before": c.get("last_buy_before"),
        "dev": [{"platform": str(d["platform"]), "created_on": d["created_on"], "updated_on": d["updated_on"]} for d in g_dev.get(pmid, [])],
        "risk": [{"created_at": r["created_at"], "score": r["score"]} for r in sorted(g_risk.get(a3, []), key=lambda r: r["created_at"])] if a3 else [],
        "trades": tr,
        "asks": [{"ts": q["ts"], "text": q["text"], "session_id": str(q["session_id"])} for q in g_asks.get(pmid, [])],
        "asset_latest": asset_latest,
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
