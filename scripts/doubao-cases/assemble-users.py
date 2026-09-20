#!/usr/bin/env python3
"""豆包个例：candidates.json + d_*.json + narratives.json → users.json（build-cases.py 的输入）。
与 qianwen-cases/assemble-users.py 同构；差别：m_tokens 是豆包 OAuth 会话令牌（channels.doubao_sessions），
d_asks 只含且慢 App 内小顾 3.0 的提问（豆包侧走 MCP，提问文本协议层不可得）。
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
# 神策埋点（qm_meta.ai_insight_sensors_event_detail）：lib=iOS/Android/HarmonyOS 为 App 原生页，js 为内嵌 H5
m_sens = load("m_sensors.json")
surname_by_pmid = {str(r["pmid"]): str(r.get("surname") or "").strip()[:1] for r in load("m_surnames.json")}
g_sens = {}
for r in m_sens: g_sens.setdefault(str(r["broker_user_id"]), []).append(r)
PAGE_MAP = {
  "HomePage": "首页", "rayleigh.RNHomePage": "首页", "MainFragment": "首页",
  "rayleigh.AssetsHomePage": "资产页", "AssetsPage": "资产页", "AssetFragmentV2": "资产页", "总资产": "资产页",
  "rayleigh.UserInfoPage": "我的", "MinePage": "我的", "MineFragment": "我的",
  "rayleigh.M4NewHomePage": "投顾页", "AdvisorPage": "投顾页", "M4Fragment": "投顾页", "投顾": "投顾页",
  "rayleigh.FindPage": "发现页", "rayleigh.FindRecommandPage": "发现页", "DiscoverPage": "发现页",
  "rayleigh.NotificationPage": "通知", "rayleigh.NormalRoleNotifyPage": "通知",
  "rayleigh.GeneralSearchPage": "搜索页", "SearchFragment": "搜索页",
  "rayleigh.POBuyPage": "策略买入页", "PoDepositPage": "策略转入页", "DepositFragment": "策略转入页",
  "rayleigh.POBuyWithAIPResultPage": "下单结果", "PoDepositResultPage": "下单结果",
  "SmartAIPWithBuyPage": "定投买入页", "POAIPWithBuyPage": "定投买入页", "YMTradeModule.WalletAIPPage": "盈米宝定投",
  "YMTradeModule.AIPDetailPage": "定投详情", "YMCommonModule.POAIPPickerPage": "定投设置", "YMCommonModule.QMUserRiskTipPage": "风险提示",
  "rayleigh.AdvisorFeesPOPPage": "投顾服务费说明",
  "YMTradeRecordModule.QMTotalAssetRecordPage": "交易记录", "TotalAssetRecordPage": "交易记录", "YMTradeRecordModule.BaseRecordDetailPage": "交易详情",
  "YMTradeModule.WalletRechargePage": "盈米宝充值页", "WalletDepositFragment": "盈米宝充值页", "YMTradeModule.WalletRechargeResultPage": "充值结果",
  "rayleigh.SuperWalletAssetPage": "盈米宝资产页",
  "rayleigh.CreateAssetsAccount": "新增投资账户", "rayleigh.CreateAssetsAccountSuccessPage": "新增账户成功",
  "rayleigh.ListAssetsAccount": "账户列表", "AssetUmaListFragment": "账户列表", "rayleigh.UMADetailPage": "账户详情", "UmaDetailFragment": "账户详情",
  "UploadIdentityCardPage": "开户-上传身份证", "BindingBankCardPage": "开户-绑卡", "CreateFundAccountGuidePage": "开户引导",
  "IdentityAuthenticationPage": "实名认证", "TXSSOLoginViewController": "登录",
  "PoDetailPage": "组合详情", "CreatePoFundSearchPage": "创建组合-搜基金", "CreatePoPage": "创建组合",
  "FollowedProductsPage": "关注的产品", "MyPoFragment": "管理的策略",
}
SKIP_PAGES = {"rayleigh.CachedWebViewPage", "rayleigh.WebViewPage", "rayleigh.MicroAppWebPage", "WebViewPage", "WebPage", "MicroappPage",
              "LaunchPage", "FormInputPage", "TOCropViewController", "rayleigh.PreRequestPushPage", "rayleigh.QMStyledAlertPresentationContainerPage",
              "WebViewNavFragment", "闪屏页", "", "?"}
def norm_page(x):
    raw = (x.get("page_name") or x.get("screen_name") or x.get("title") or "").strip()
    if raw in PAGE_MAP: return PAGE_MAP[raw]
    if raw in SKIP_PAGES: return None
    if "|" in raw: raw = raw.split("|")[-1].split(".")[-1]
    if raw in PAGE_MAP: return PAGE_MAP[raw]
    if raw in SKIP_PAGES: return None
    if _re.fullmatch(r"测评第\d+题", raw): return "风险测评答题"
    if _re.fullmatch(r"[\d\W]+", raw): return None
    if _re.search(r"[\u4e00-\u9fff]", raw): return raw
    if raw.startswith("_TtCC8rayleigh17GeneralSearchPage"): return "搜索结果"
    return None  # 其余英文类名：不可读，丢弃
def norm_event(x):
    page = norm_page(x)
    el = (x.get("element_content") or "").strip() or None
    if x["event_category"] == "浏览" and not page: return None
    if el and len(el) > 14 and "-" in el: el = el.split("-")[0].strip() or el
    if el and len(el) > 22: el = el[:22] + "…"
    return {"t": x["event_time"][:19], "lib": x["lib"], "k": "view" if x["event_category"] == "浏览" else "click", "p": page, "e": el}
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
    # 与主看板完全同口径：线上/线下充值到盈米宝 + 银行卡直付买产品；
    # 组合回款进宝、宝内余额买产品不计，避免 ROOT 资产表和交易表混用造成金额漂移。
    inflow_rows = [t for t in after if
                   (t["trade_type"] == "wallet.recharge" and (t["extra"] or "") in ("by.online", "by.offline") and float(t["buy"] or 0) > 0)
                   or (t["trade_type"] != "wallet.recharge" and (t["extra"] or "") == "from.card" and float(t["buy"] or 0) > 0)]
    inflow = sum(float(t["buy"]) for t in inflow_rows)
    sell = sum(float(t["redeem"] or 0) for t in after if t["redeem"] and float(t["redeem"]) > 0)
    cancels = sum(1 for t in tr if T(t["accept_time"]) >= fb and t["canceled"])
    fl = [f for f in g_flow.get(a3, []) if a3 and f["cal_date"][:10] >= fb.strftime("%Y-%m-%d")]
    root_in = sum(float(f["inflow"] or 0) for f in fl); root_out = sum(float(f["outflow"] or 0) for f in fl)
    first_buy_after = min((t["accept_time"] for t in buys), default=None)
    asset_rows = sorted(g_assets.get(a3, []), key=lambda r: r["cal_date"]) if a3 else []
    asset_latest = {"cal_date": asset_rows[-1]["cal_date"][:10], "ta": asset_rows[-1]["ta"]} if asset_rows else None
    zero = (c.get("asset_at_bind") is None) or float(c["asset_at_bind"]) <= 0
    first_ever = T(c.get("first_buy_ever"))
    flags = {
        "zero_at_bind": bool(zero and buys),
        "recall": bool(zero and inflow > 0 and c["cohort"] == "existing"),
        "first_invest_after": bool(first_ever and first_ever >= fb),
        "new_first_invest": bool(c["cohort"] == "new" and first_ever and first_ever >= fb),
    }
    n = narr.get(pmid, {})
    # 埋点：绑定前 7 天起到截止时间
    ev = []
    lo = (fb - __import__("datetime").timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S")
    for x in sorted(g_sens.get(pmid, []), key=lambda r: r["event_time"]):
        if x["event_time"][:19] < lo or x["event_time"][:16] > CUT.replace(" ", "T"): continue
        e = norm_event(x)
        if e: ev.append(e)
    # 入金（看板口径）：线上/线下充值到盈米宝 + 银行卡直付买入
    inflow_txns = sorted(inflow_rows, key=lambda t: t["accept_time"])
    # 小顾入口
    sess = g_sess.get(pmid, [])
    mia = sorted(g_mia.get(pmid, []), key=lambda r: r["create_time"])
    toks_after = sorted(t for t in g_tok.get(pmid, []) if T(t) and T(t) >= fb)
    channels = {
        "doubao_sessions": len(toks_after),   # 豆包会话令牌（绑定后签发次数，含授权当刻那一次）
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
        "pmid": pmid, "letter": n.get("letter"), "surname": surname_by_pmid.get(pmid), "cohort": c["cohort"], "gender": c.get("gender"), "age": c.get("age"),
        "prov": c.get("prov"), "mp": bool(c.get("mp")), "card": bool(c.get("card")), "account3_id": a3,
        "fb": c["fb"], "registered_at": c["registered_at"], "asset_at_bind": c.get("asset_at_bind"),
        "first_buy_ever": c.get("first_buy_ever"), "last_buy_before": c.get("last_buy_before"),
        "dev": [{"platform": str(d["platform"]), "created_on": d["created_on"], "updated_on": d["updated_on"]} for d in g_dev.get(pmid, [])],
        "risk": [{"created_at": r["created_at"], "score": r["score"]} for r in sorted(g_risk.get(a3, []), key=lambda r: r["created_at"])] if a3 else [],
        "trades": tr,
        "asks": [{"ts": q["ts"], "text": q["text"], "session_id": str(q["session_id"])} for q in g_asks.get(pmid, [])],
        "asset_latest": asset_latest, "channels": channels, "events": ev,
        "inflow_txns": [{"t": t["accept_time"], "amt": float(t["buy"]), "kind": "充值" if t["trade_type"] == "wallet.recharge" else "银行卡买入"} for t in inflow_txns], "holdings": holdings, "fund_detail": fund_detail, "holdings_meta": holdings_meta,
        "flags": flags,
        "derived": {"buys_after": len(buys), "buy_amount_after": sum(float(t["buy"]) for t in buys), "inflow_after": inflow,
                    "sell_after": sell, "first_buy_after": first_buy_after, "cancels_after": cancels,
                    "root_inflow_reference": root_in if fl else None, "root_out": root_out if fl else None},
        **{key: n[key] for key in ("insight", "conversion_path_label", "conversion_path", "behavior_insight", "narrative", "verdict") if key in n},
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
