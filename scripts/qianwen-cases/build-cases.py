#!/usr/bin/env python3
"""千问个例分析台生成器：users.json（归一化用户明细）→ 可切换口径的单文件 HTML（明文，随后作者端加密）。

users.json 每个用户字段：
  pmid, letter, cohort(new|existing), gender, age, prov, mp, card, account3_id,
  fb, registered_at, asset_at_bind, first_buy_ever, last_buy_before, dev(list of {platform,created_on,updated_on}),
  risk(list of {created_at,score}), trades(list of {accept_time,trade_type,po_code,po_name,buy,redeem,canceled,extra}),
  asks(list of {ts,text,session_id}), asset_latest({cal_date,ta} | None),
  flags: {zero_at_bind, first_invest_after, new_first_invest, recall}
  derived: buys_after, buy_amount_after, inflow_after, sell_after, first_buy_after, cancels_after
  narrative(optional 手写段), verdict(optional {cls, title, text})
"""
import json, sys, html, re
from datetime import datetime
from pathlib import Path

SRC = Path(sys.argv[1]); OUT = Path(sys.argv[2])
data = json.load(open(SRC))
users = data["users"]; META = data["meta"]
CUT = META["cutoff"]  # 'YYYY-MM-DD HH:MM'

def esc(s): return html.escape(str(s if s is not None else ""))
def dt(s):
    if not s: return None
    return datetime.fromisoformat(str(s).replace("Z", "")[:19])
def fmt_t(s, day=False):
    d = dt(s)
    if not d: return "—"
    return d.strftime("%-m-%d %H:%M") if day else d.strftime("%H:%M:%S")
def fmt_md(s):
    d = dt(s); return d.strftime("%-m-%d") if d else "—"
def money(v):
    if v is None: return "—"
    v = float(v)
    return f"{v:,.0f}" if abs(v - round(v)) < 0.005 else f"{v:,.2f}"
def wan(v):
    v = float(v or 0)
    return f"{v/10000:,.2f} 万" if v >= 10000 else f"{v:,.0f} 元"
def dur(a, b):
    if not a or not b: return "—"
    s = int((dt(b) - dt(a)).total_seconds())
    if s < 0: return "—"
    d, r = divmod(s, 86400); h, r = divmod(r, 3600); m, sec = divmod(r, 60)
    if d: return f"{d}天{h}h"
    if h: return f"{h}h{m:02d}m"
    return f"{m}分{sec:02d}秒"
PLAT = {"3": "iOS", "4": "安卓", "5": "鸿蒙"}

# ───── 口径定义 ─────
SCOPES = [
  {"id": "new_inv", "label": "新投", "flag": "zero_at_bind",
   "def": "绑定后有新增投资，且绑定时无资产（含新老用户）"},
  {"id": "first_inv", "label": "首投", "flag": "first_invest_after",
   "def": "绑定后有新增投资，且绑定前没有投资过（含新老用户）"},
  {"id": "new_first_inv", "label": "新户首投", "flag": "new_first_invest",
   "def": "在千问当场注册且慢帐号，并在绑定后完成第一笔投资"},
  {"id": "existing_reactivated", "label": "老户唤回", "flag": "recall",
   "def": "绑定时已有且慢帐号、未首投或已清仓，绑定后重新入金"},
  {"id": "existing_first_inv", "label": "老户首投", "flag": "existing_first_invest",
   "def": "老用户的人生第一笔投资发生在绑定后"},
]

def scope_users(sc):
    if sc["flag"] == "existing_first_invest":
        us = [u for u in users if u["cohort"] == "existing" and u["flags"].get("first_invest_after")]
    else:
        us = [u for u in users if u["flags"].get(sc["flag"])]
    return sorted(us, key=lambda u: -(u["derived"]["buy_amount_after"] or 0))

def agg(us):
    return {
        "n": len(us),
        "new": sum(1 for u in us if u["cohort"] == "new"),
        "asset": sum(float((u.get("asset_latest") or {}).get("ta") or 0) for u in us),
        "inflow": sum(float(u["derived"]["inflow_after"] or 0) for u in us),
        "buy": sum(float(u["derived"]["buy_amount_after"] or 0) for u in us),
        "repeat": sum(1 for u in us if (u["derived"]["buys_after"] or 0) >= 2),
        "cancels": sum(1 for u in us if (u["derived"]["cancels_after"] or 0) > 0),
        "asks": sum(len(u["asks"]) for u in us),
        "max_inflow": max((float(u["derived"]["inflow_after"] or 0) for u in us), default=0),
        "max_asks": max((len(u["asks"]) for u in us), default=0),
        "no_asks": sum(1 for u in us if not u["asks"]),
        "mid_days": None,
    }

# ───── 时间线 ─────
def timeline(u):
    ev = []
    fb = dt(u["fb"]); reg = dt(u["registered_at"])
    if u["cohort"] == "new":
        ev.append((fb, "sys", f"千问侧绑定，{reg.strftime('%H:%M:%S')} 当场完成且慢注册"))
    else:
        extra = ""
        if u.get("asset_at_bind") is not None and float(u["asset_at_bind"]) > 0:
            extra = f"；绑定时持有资产 {money(u['asset_at_bind'])} 元"
        elif u.get("last_buy_before"):
            extra = f"；上一次买入在 {dt(u['last_buy_before']).strftime('%Y-%m-%d')}，此后清仓"
        else:
            extra = "；此前从未投资"
        ev.append((fb, "sys", f"绑定千问（账户 {reg.strftime('%Y-%m-%d')} 注册{extra}）"))
    for r in u["risk"]:
        t = dt(r["created_at"])
        if t and (fb - t).days <= 60 or (t and t >= fb):
            ev.append((t, "sys", f"完成风险测评（{r['score']} 分）"))
    for d in u["dev"]:
        t = dt(d["created_on"])
        if t and abs((t - fb).days) <= 60:
            ev.append((t, "sys", f"且慢 App 设备注册（{PLAT.get(str(d['platform']), d['platform'])}）"))
    asks = sorted(u["asks"], key=lambda a: a["ts"])
    shown = 0
    for a in asks:
        t = dt(a["ts"])
        if len(asks) > 14 and shown >= 10:
            break
        ev.append((t, "ask", "「" + esc(a["text"][:60]) + ("…" if len(a["text"]) > 60 else "") + "」"))
        shown += 1
    if len(asks) > shown:
        last = dt(asks[-1]["ts"])
        ev.append((last, "ask", f"……共 {len(asks)} 条提问，最近一次在 {fmt_t(asks[-1]['ts'], True)}（完整提问历程见卡尾图标）"))
    for tr in u["trades"]:
        t = dt(tr["accept_time"])
        if t < fb: continue
        name = tr["po_name"] or tr["po_code"]
        if tr["trade_type"] == "wallet.recharge":
            ev.append((t, "trade", f"盈米宝充值 {money(tr['buy'])} 元"))
        elif tr["canceled"]:
            ev.append((t, "cancel", f"下单「{esc(name)}」{money(tr['buy'] or tr['redeem'])} 元 → 撤单"))
        elif tr["redeem"] and float(tr["redeem"]) > 0:
            ev.append((t, "trade", f"赎回「{esc(name)}」{money(tr['redeem'])} 元"))
        elif tr["trade_type"] == "po.adjust" and not tr["buy"]:
            ev.append((t, "trade", f"组合「{esc(name)}」调仓"))
        else:
            kind = {"fund.buy": "自助买入基金", "si.trade": "买入", "plan.trade": "买入"}.get(tr["trade_type"], "买入组合")
            ev.append((t, "trade", f"{kind}「{esc(name)}」{money(tr['buy'])} 元"))
    al = u.get("asset_latest")
    if al:
        ev.append((dt(al["cal_date"] + "T23:59:59"), "sys", f"最近资产快照（{al['cal_date'][5:]}）{money(al['ta'])} 元"))
    ev = [e for e in ev if e[0]]
    ev.sort(key=lambda e: e[0])
    out, last_day = [], None
    for t, cls, text in ev:
        day = t.date()
        first = day != last_day
        last_day = day
        cls2 = cls + (" day" if first else "")
        tt = t.strftime("%-m-%d %H:%M:%S") if first else t.strftime("%H:%M:%S")
        out.append(f'<li class="{cls2}"><span class="t">{tt}</span><span class="d">{text}</span></li>')
    return "\n".join(out)

LIBN = {"iOS": "iOS", "Android": "安卓", "HarmonyOS": "鸿蒙"}
MIA_SCENE = {"MIA": "小顾会话页", "STRATEGY_DETAIL": "策略详情页", "ADVISOR_PAGE_TOP": "投顾页顶部入口",
             "ASSET_M4": "资产页", "QUICK_MENU": "快捷菜单", "FIRST_IN_DAY": "当日首次进入"}
OP_RE = re.compile(r"转入|买入|定投|跟车|下单|确定|确认|下一题|提交|搜索|关注|充值|汇款|转账|复制账号|继续投资|新增投资|立即定制|回顾建议书|去看看|开户|上传|拍照|存入|切换账户|修改定投|产品明细|管理的策略|优惠券|创建|建议书|试试")
NOISE_RE = re.compile(r"tab$|^输入|^取消|^关闭|^返回|^知道了|^我知道了|^稍后再说|Banner|imgUrl|^on$|^完成$|^选择$|^其他手机号|^\[object")
PROD_RE = re.compile(r"^(策略详情|策略介绍|主理人详情|资产详情)-(?=.)")
GENERIC_LAST = {"须知及协议", "风险提示", "投顾服务费说明", "登录", "密码登录", "短信验证码登录", "本机号登录", "反洗钱-完善个人信息页", "下单结果", "充值结果", "通知", "首页", "我的"}
XG_PAGES = {"超级入口", "且慢AI小顾"}
_td = __import__("datetime").timedelta

def app_events(u, since=None, until=None):
    out = []
    for e in u.get("events") or []:
        if since and e["t"] < since: continue
        if until and e["t"] > until: continue
        out.append(e)
    return out

def terminal_of(u):
    # 绑定后 App 原生页记录最多的终端；无原生页记录时返回 None
    fb = u["fb"][:19]
    c = {}
    for e in app_events(u, since=fb):
        if e["lib"] != "js": c[e["lib"]] = c.get(e["lib"], 0) + 1
    return max(c, key=c.get) if c else None

def behavior_panel(u):
    # 且慢行为：按日汇总埋点（浏览 / 策略与产品 / 功能操作 / 小顾入口 / 交易）
    fb = dt(u["fb"]); evs = u.get("events") or []
    if not evs:
        return '<p class="muted tight">该用户在且慢 App / H5 没有埋点记录。</p>'
    from collections import Counter, OrderedDict
    days = OrderedDict()
    for e in evs: days.setdefault(e["t"][:10], []).append(e)
    mia_by_day = {}
    for m in (u.get("channels") or {}).get("app_mia", []): mia_by_day.setdefault(m["ts"][:10], []).append(m)
    tr_by_day = {}
    for t in u["trades"]:
        if dt(t["accept_time"]) >= fb and not t["canceled"]: tr_by_day.setdefault(t["accept_time"][:10], []).append(t)
    items = []
    for day, es in days.items():
        d = datetime.fromisoformat(day)
        libs = Counter(e["lib"] for e in es if e["lib"] != "js")
        term = f'{LIBN.get(libs.most_common(1)[0][0], libs.most_common(1)[0][0])} App' if libs else "网页端（微信 / 千问内嵌页）"
        views = [e for e in es if e["k"] == "view"]; clicks = [e for e in es if e["k"] == "click" and e["e"]]
        pre = "（绑定前）" if d.date() < fb.date() else ""
        head = f'{d.strftime("%-m-%d")}{pre} · {term} · {es[0]["t"][11:16]}–{es[-1]["t"][11:16]} · 浏览 {len(views)} 页 · 操作 {len(clicks)} 次'
        items.append(f'<li class="day sys"><span class="t">{esc(head)}</span></li>')
        pv = Counter(e["p"] for e in views if e["p"] and not PROD_RE.match(e["p"]) and e["p"] not in XG_PAGES)
        if pv:
            top = pv.most_common(7)
            items.append('<li class="b-view"><span class="t">浏览</span><span class="d">' + "、".join(f'{esc(pg)}{f" ×{n}" if n >= 3 else ""}' for pg, n in top) + (f'，另 {len(pv) - len(top)} 个页面' if len(pv) > len(top) else "") + '</span></li>')
        prods = OrderedDict()
        for e in views:
            if e["p"] and PROD_RE.match(e["p"]): prods.setdefault(e["p"], set())
        for e in clicks:
            if e["p"] and PROD_RE.match(e["p"]) and not NOISE_RE.search(e["e"]): prods.setdefault(e["p"], set()).add(e["e"])
        if prods:
            parts = []
            for pg, acts in list(prods.items())[:6]:
                name = re.sub(r"^(策略详情|策略介绍|主理人详情|资产详情)-", "", pg)
                if name.isdigit(): continue
                kind = "主理人" if pg.startswith("主理人") else "持仓" if pg.startswith("资产详情") else "策略"
                a = "、".join(sorted(acts)[:3])
                parts.append(f'{kind}「{esc(name)}」' + (f' → {esc(a)}' if a else ""))
            items.append('<li class="b-prod"><span class="t">策略与产品</span><span class="d">' + "；".join(parts) + '</span></li>')
        ops = Counter((e["p"] or "", e["e"]) for e in clicks
                      if not NOISE_RE.search(e["e"]) and OP_RE.search(e["e"]) and not (e["p"] and (PROD_RE.match(e["p"]) or e["p"] in XG_PAGES)))
        if ops:
            parts = [f'{esc(pg) + " · " if pg else ""}{esc(el)}{f" ×{n}" if n >= 2 else ""}' for (pg, el), n in ops.most_common(7)]
            items.append('<li class="b-op"><span class="t">功能操作</span><span class="d">' + "；".join(parts) + '</span></li>')
        xg = []
        for m in mia_by_day.get(day, []):
            xg.append(f'从{MIA_SCENE.get(m.get("scene"), m.get("scene") or "App")}{"快捷入口" if m.get("mode") == "AUTO_LEAD" else ""}进小顾 →「{esc((m.get("text") or "").strip()[:30])}」')
        xn = sum(1 for e in clicks if e["p"] in XG_PAGES and e["e"] in ("PlainText", "MultiThink"))
        if xn: xg.append(f'在 App 小顾入口自行输入 {xn} 次')
        if xg: items.append('<li class="b-xg"><span class="t">小顾</span><span class="d">' + "；".join(xg) + '</span></li>')
        trs = []
        for t in tr_by_day.get(day, []):
            nm = t["po_name"] or t["po_code"]
            if t["trade_type"] == "wallet.recharge":
                if (t["extra"] or "") in ("by.online", "by.offline"): trs.append(f'{"线上" if t["extra"] == "by.online" else "线下汇款"}充值 {money(t["buy"])} 元')
            elif t["redeem"] and float(t["redeem"]) > 0: trs.append(f'赎回「{esc(nm)}」{money(t["redeem"])} 元')
            elif t["buy"] and float(t["buy"]) > 0: trs.append(f'买入「{esc(nm)}」{money(t["buy"])} 元')
        if trs: items.append('<li class="b-trade trade"><span class="t">交易</span><span class="d">' + "；".join(trs) + '</span></li>')
    return '<ul class="tl beh">' + "\n".join(items) + '</ul>'

def path_summary(u):
    # 用户路径与行为总结：终端 / 下单情境 / 千问侧关系 / App 内小顾——全部白话，不出现字段名
    fb = dt(u["fb"]); fbuy = dt(u["derived"]["first_buy_after"])
    evs = u.get("events") or []
    app = [e for e in evs if e["lib"] != "js"]
    term = terminal_of(u)
    tname = LIBN.get(term, term)
    parts = []
    if app:
        first = dt(min(e["t"] for e in app))
        if first < fb:
            parts.append(f'绑定千问前 {dur(first.isoformat(), fb.isoformat())} 就已在且慢 App（{tname}）里活动')
        else:
            parts.append(f'绑定后 {dur(fb.isoformat(), first.isoformat())} 打开且慢 App（{tname}）')
    elif evs:
        parts.append('全程只有网页端记录、没有装 App')
    else:
        parts.append('且慢侧没有埋点记录')
    if fbuy:
        lo = (fbuy - _td(minutes=30)).isoformat(); hi = (fbuy + _td(minutes=30)).isoformat()
        near_app = [e for e in app if lo <= e["t"] <= hi]
        near_any = [e for e in evs if lo <= e["t"] <= hi]
        if near_app:
            before = [e for e in evs if e["k"] == "view" and e["p"] and lo <= e["t"] <= fbuy.isoformat()
                      and not e["p"].startswith(("下单", "策略买入", "策略转入", "定投买入", "策略跟投页")) and e["p"] not in GENERIC_LAST]
            last = before[-1]["p"] if before else None
            parts.append('首笔买入在 App 内完成' + (f'，下单前最后停留在「{esc(last)}」' if last else ""))
        elif near_any:
            parts.append('首笔买入时段只有网页端记录，应是在微信或千问内嵌的且慢页面里下单')
        else:
            parts.append('首笔买入时段没有埋点记录，终端无法直接判定')
    asks = sorted(u["asks"], key=lambda a: a["ts"])
    if not asks:
        parts.append('千问侧零提问，会话建好就直接去且慢下单了')
    else:
        near = [a for a in asks if fbuy and 0 <= (fbuy - dt(a["ts"])).total_seconds() <= 3600]
        if near:
            a = near[-1]; mins = int((fbuy - dt(a["ts"])).total_seconds() // 60)
            parts.append(f'下单前 {mins} 分钟刚在千问问了「{esc(a["text"][:24])}{"…" if len(a["text"]) > 24 else ""}」')
        else:
            parts.append(f'千问侧 {len(asks)} 条提问全是咨询，下单时段没有回到千问')
    mia = (u.get("channels") or {}).get("app_mia", [])
    if mia:
        scenes = sorted({MIA_SCENE.get(m.get("scene"), m.get("scene") or "App") for m in mia})
        parts.append(f'在 App 内也用了 {len(mia)} 次小顾（{"、".join(scenes)}入口）')
    path = "，".join(parts[:2]) + "；" + "；".join(parts[2:]) + "。"
    narrative = f'<p>{u["narrative"]}</p>' if u.get("narrative") else ""
    return f'<div class="summary"><h4>用户路径与行为总结</h4><p class="path"><b>路径</b>{path}</p>{narrative}</div>'

def top_stats(u):
    d = u["derived"]; al = u.get("asset_latest"); ch = u.get("channels") or {}
    inf = u.get("inflow_txns") or []
    asset_sub = f'{al["cal_date"][5:].replace("-", "/")} 资产 {money(al["ta"])} 元' if al else "资产待次日批次落账"
    first_in = inf[0]["t"] if inf else d["first_buy_after"]
    dates = "、".join(f'{"首笔" if i == 0 else "第二笔"} {fmt_md(x["t"])}' for i, x in enumerate(inf[:2]))
    q = len(u["asks"]); m = len(ch.get("app_mia", [])); w = int(ch.get("wechat_msgs", 0) or 0)
    total = q + m + w
    chs = [f'千问 {q} 条' if q else "", f'且慢 {m} 条' if m else "", f'微信 {w} 条' if w else ""]
    chs = " · ".join(x for x in chs if x) or "三端均无提问"
    icon = (f'<button type="button" class="mini-ic" data-asks="{u["pmid"]}" title="查看在千问、且慢小顾、微信小顾的全部提问记录" aria-label="查看全部提问记录">'
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z"/></svg></button>') if total else ""
    return (f'<div class="kv top">'
            f'<div><b class="num">{money(d["inflow_after"])} 元</b><span>绑定后入金 · {asset_sub}</span></div>'
            f'<div><b class="num">{dur(u["fb"], first_in)}</b><span>绑定 → 首笔入金</span></div>'
            f'<div><b class="num">{len(inf) if inf else d["buys_after"]} 笔</b><span>入金{" · " + dates if dates else ""}</span></div>'
            f'<div><b class="num">{total} 条</b><span>小顾对话 · {chs}{icon}</span></div>'
            f'</div>')

def holdings_block(u):
    hs = u.get("holdings") or []; fd = u.get("fund_detail") or []; hm = u.get("holdings_meta") or {}
    d = u["derived"]; fb = dt(u["fb"])
    buy_by_po = {}
    for t in u["trades"]:
        if dt(t["accept_time"]) >= fb and not t["canceled"] and t["trade_type"] != "wallet.recharge" and t["buy"] and float(t["buy"]) > 0:
            buy_by_po[t["po_code"]] = buy_by_po.get(t["po_code"], 0) + float(t["buy"])
    if not hs and not fd:
        return '<div class="sub-block"><h4>最终持有</h4><p class="muted tight">资产表尚无该账户持仓行（当日成交，次日批次体现）。</p></div>'
    wallet_keep = max(float(d["inflow_after"] or 0) - sum(buy_by_po.values()), 0)
    rows = ""; tot_in = 0; tot_v = 0
    for h in hs:
        put = wallet_keep if h.get("code") == "WALLET" else buy_by_po.get(h.get("code"), h.get("buy") or 0)
        tot_in += put or 0
        if h.get("value") is not None: tot_v += float(h["value"])
        code = f' <span class="num muted">{esc(h["code"])}</span>' if h.get("code") and h["code"] not in ("WALLET", "FUND") else ""
        val = money(h["value"]) + " 元" if h.get("value") is not None else "未落账"
        rows += f'<tr><td>{esc(h["kind"])}</td><td>{esc(h["name"])}{code}</td><td class="num">{money(put)} 元</td><td class="num">{val}</td></tr>'
    foot = f'<tr class="total"><td colspan="2">合计</td><td class="num">{money(tot_in)} 元</td><td class="num">{money(tot_v) + " 元" if tot_v else "—"}</td></tr>'
    snap = f'（{hm.get("as_of", "")[5:]} 快照）' if hm.get("as_of") else ""
    tbl = f'<table class="mini-table"><thead><tr><th>类型</th><th>产品</th><th>入金金额</th><th>当前市值{snap}</th></tr></thead><tbody>{rows}{foot}</tbody></table>'
    fund_html = ""
    if fd:
        top = sorted([f for f in fd if f["po"] != "盈米宝"], key=lambda f: -f["mv"])[:8]
        wallet = sum(f["mv"] for f in fd if f["po"] == "盈米宝")
        items = "".join(f'<li><span class="num">{esc(f["fund_code"])}</span> {esc(f["fund_name"])} <span class="muted">{"· " + esc(f["po"]) + " " if f.get("po") and f["po"] != "—" else ""}· {money(f["mv"])} 元</span></li>' for f in top)
        more = len([f for f in fd if f["po"] != "盈米宝"]) - len(top)
        basis = f'{hm.get("bill_month")} 月末账单市值' if hm.get("bill_month") else "绑定后子订单成功金额（未扣净值波动）"
        fund_html = (f'<p class="tight muted">穿透到基金（{basis}，前 {len(top)} 只{f"，另 {more} 只未列" if more > 0 else ""}'
                     f'{f"；盈米宝货币基金 {money(wallet)} 元" if wallet else ""}）</p><ul class="funds">{items}</ul>')
    return f'<div class="sub-block"><h4>最终持有</h4><p class="tight muted">入金金额：各产品为绑定后买入金额，盈米宝为充值后仍留在钱包的部分。</p>{tbl}{fund_html}</div>'

def card(u):
    d = u["derived"]
    who = f'{u["age"]} 岁 · {"男" if u["gender"]=="M" else "女" if u["gender"]=="F" else "性别未知"}' + (f' · {esc(u["prov"])}' if u.get("prov") else "")
    term = terminal_of(u)
    dev_txt = f'{LIBN.get(term, term)} App' if term else ("网页端" if u.get("events") else "无埋点记录")
    tags = [f'<span class="tag">{ "绑定当场注册" if u["cohort"]=="new" else "老客 · " + dt(u["registered_at"]).strftime("%Y-%m") + " 注册" }</span>',
            f'<span class="tag good">绑定后入金 {money(d["inflow_after"])} 元</span>']
    if d["cancels_after"]: tags.append(f'<span class="tag amber">撤单重下 {d["cancels_after"]} 次</span>')
    if not u["asks"]: tags.append('<span class="tag amber">千问提问 0 条</span>')
    badge_cls = "badge n" if u["cohort"] == "new" else "badge"
    foot = f'用户 {u["letter"]} · {"新客" if u["cohort"]=="new" else "老客"} · 风测 {u["risk"][-1]["score"] if u["risk"] else "—"} 分 · 绑定后买入 {d["buys_after"]} 笔' + (f' · 赎回 {money(d["sell_after"])} 元' if d["sell_after"] else "")
    copy_svg = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
    return (f'<div class="case" data-pmid="{u["pmid"]}" data-letter="{u["letter"]}">\n'
            f'  <div class="case-head">\n'
            f'    <span class="who"><span class="{badge_cls}">{u["letter"]}</span>{who} · {dev_txt}</span>\n'
            f'    {"".join(tags)}\n'
            f'  </div>\n'
            f'  <div class="case-body">\n'
            f'    {top_stats(u)}\n'
            f'    <div class="ctabs" role="tablist" aria-label="历程切换">\n'
            f'      <button type="button" class="ctab" role="tab" aria-selected="true" data-panel="journey">关键旅程</button>\n'
            f'      <button type="button" class="ctab" role="tab" aria-selected="false" data-panel="behavior">且慢行为</button>\n'
            f'    </div>\n'
            f'    <div class="cpanel" data-panel="journey">\n    <ul class="tl">\n{timeline(u)}\n    </ul>\n    </div>\n'
            f'    <div class="cpanel" data-panel="behavior" hidden>\n    {behavior_panel(u)}\n    </div>\n'
            f'    {path_summary(u)}\n'
            f'    {holdings_block(u)}\n'
            f'    <div class="case-foot">\n'
            f'      <span class="foot-label">{foot}</span>\n'
            f'      <span class="foot-actions"><button type="button" class="icon-btn" data-copy="{u["pmid"]}" title="复制用户 ID 到剪贴板" aria-label="复制用户 ID">{copy_svg}</button></span>\n'
            f'    </div>\n'
            f'  </div>\n'
            f'</div>')

# ───── 汇总矩阵 ─────
def matrix(us):
    rows = []
    for u in us:
        d = u["derived"]; al = u.get("asset_latest")
        term = terminal_of(u); app = [e for e in (u.get("events") or []) if e["lib"] != "js"]
        dev_txt = (f'{LIBN.get(term, term)} App · {fmt_md(min(e["t"] for e in app))} 起') if term else ("网页端" if u.get("events") else "无埋点")
        rows.append(f'''<tr>
  <td><span class="who"><span class="{"badge n" if u["cohort"]=="new" else "badge"}">{u["letter"]}</span></span></td>
  <td>{"新客" if u["cohort"]=="new" else "老客"}</td>
  <td>{"男" if u["gender"]=="M" else "女" if u["gender"]=="F" else "—"} {u["age"] or ""}</td>
  <td class="num">{fmt_t(u["fb"], True)}</td>
  <td class="num">{fmt_t(d["first_buy_after"], True)}</td>
  <td class="num">{dur(u["fb"], d["first_buy_after"])}</td>
  <td class="num">{money(d["inflow_after"])}</td>
  <td class="num">{money(d["buy_amount_after"])}</td>
  <td class="num">{money(al["ta"]) if al else "—"}</td>
  <td class="num">{u["risk"][-1]["score"] if u["risk"] else "—"}</td>
  <td class="num">{len(u["asks"])}</td>
  <td class="wrap">{dev_txt}</td>
</tr>''')
    return f'''<div class="scrollx"><table class="matrix">
<thead><tr><th>用户</th><th>客群</th><th>画像</th><th>绑定</th><th>绑定后首笔买入</th><th>间隔</th><th>绑定后入金</th><th>绑定后买入</th><th>当前资产</th><th>风测</th><th>提问</th><th>下单终端</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table></div>'''

def scope_section(sc):
    us = scope_users(sc); a = agg(us)
    n = max(a["n"], 1)
    keep = f'{a["asset"]/a["inflow"]*100:.0f}%' if a["inflow"] else "—"
    top_inflow = f'{a["max_inflow"]/a["inflow"]*100:.0f}%' if a["inflow"] else "—"
    top_asks = f'{a["max_asks"]/a["asks"]*100:.0f}%' if a["asks"] else "—"
    # 绑定→首笔买入的中位时长
    import statistics
    durs = [(dt(u["derived"]["first_buy_after"]) - dt(u["fb"])).total_seconds() for u in us if u["derived"]["first_buy_after"]]
    med = statistics.median(durs) if durs else None
    med_txt = ("—" if med is None else f"{med/86400:.1f} 天" if med >= 86400 else f"{med/3600:.1f} 小时")
    cells = f'''<div class="grid sumrow">
  <div class="cell"><b>{a["n"]}</b><span>用户数</span><em>{(f"未首投 {sum(1 for u in us if not u.get('last_buy_before'))} 人 / 已清仓 {sum(1 for u in us if u.get('last_buy_before'))} 人") if sc["id"] == "existing_reactivated" else f"新客 {a['new']} / 老客 {a['n']-a['new']}"} · 绑定→首投中位 {med_txt}</em></div>
  <div class="cell"><b>{wan(a["asset"])}</b><span>当前资产规模</span><em>人均 {wan(a["asset"]/n)} · 相当于入金的 {keep}</em></div>
  <div class="cell"><b>{wan(a["inflow"])}</b><span>绑定后入金</span><em>人均 {wan(a["inflow"]/n)} · 最大单人占 {top_inflow}</em></div>
  <div class="cell"><b>{wan(a["buy"])}</b><span>绑定后买入</span><em>复投 {a["repeat"]} 人 · 撤单重下 {a["cancels"]} 人</em></div>
  <div class="cell"><b>{a["asks"]:,}</b><span>小顾提问合计</span><em>零提问 {a["no_asks"]} 人 · 最多一人占 {top_asks}</em></div>
</div>'''
    cards = "\n".join(card(u) for u in us) if us else '<div class="note">该口径下暂无用户。</div>'
    return f'''<section class="scope" id="scope-{sc["id"]}" hidden>
  <p class="sub scope-def">{esc(sc["def"])}</p>
  {cells}
  {matrix(us) if us else ""}
  <h2 class="cases-h">个例分析 <span class="muted">{esc(sc["label"])} {a["n"]}人・第<b class="pg-cur">1</b>人</span></h2>
  {cards}
</section>'''

SCOPE_AGG = {sc["id"]: agg(scope_users(sc)) for sc in SCOPES}
Z = SCOPE_AGG["new_inv"]
F1 = SCOPE_AGG["first_inv"]
NF = SCOPE_AGG["new_first_inv"]
R = SCOPE_AGG["existing_reactivated"]
EF = SCOPE_AGG["existing_first_inv"]
_first_users = scope_users(next(sc for sc in SCOPES if sc["id"] == "first_inv"))
_med = None
if _first_users:
    import statistics as _st
    _med = _st.median([(dt(u["derived"]["first_buy_after"]) - dt(u["fb"])).total_seconds() for u in _first_users if u["derived"]["first_buy_after"]])
_med_txt = "—" if _med is None else (f"{_med/86400:.1f} 天" if _med >= 86400 else f"{_med/3600:.1f} 小时")
from collections import Counter as _C
_tc = _C(LIBN.get(terminal_of(u), "未知") for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
_term_txt = "、".join(f"{k} {v}" for k, v in _tc.most_common())
_terminal_evidence_n = sum(terminal_of(u) is not None for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
_mia_n = sum(len((u.get("channels") or {}).get("app_mia", [])) for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
LEDE = (
    f"{META['bound_total']:,} 位绑定用户中，新投 <b>{Z['n']}</b> 人、首投 <b>{F1['n']}</b> 人"
    f"（新户首投 {NF['n']} 人、老户首投 {EF['n']} 人），老户唤回 {R['n']} 人；"
    f"其中 <b>{_terminal_evidence_n}</b> 位可由且慢 App 原生埋点识别下单终端。"
)
tabs = "".join(f'<button type="button" class="tab" role="tab" data-scope="{sc["id"]}" aria-selected="false">{sc["label"]}<small>{agg(scope_users(sc))["n"]}</small></button>' for sc in SCOPES)
sections = "\n".join(scope_section(sc) for sc in SCOPES)

def all_asks(u):
    rows = [{"ts": a["ts"][:19], "text": a["text"], "ch": "千问"} for a in u["asks"]]
    for m in (u.get("channels") or {}).get("app_mia", []):
        rows.append({"ts": m["ts"][:19], "text": (m.get("text") or "").strip(), "ch": "且慢",
                     "via": MIA_SCENE.get(m.get("scene"), m.get("scene") or "") + ("快捷入口" if m.get("mode") == "AUTO_LEAD" else "")})
    return sorted(rows, key=lambda r: r["ts"])
ASKS_JSON = json.dumps({u["pmid"]: {"letter": u["letter"], "cohort": u["cohort"], "asks": all_asks(u)} for u in users},
                       ensure_ascii=False).replace("</", "<\\/")

CSS = Path(sys.argv[3]).read_text() if len(sys.argv) > 3 else ""

PAGER_SNIPPET = r'''<style>
*,*::before,*::after{font-family:var(--serif) !important}
html,body{max-width:100%;overflow-x:hidden}
.wrap{width:100%;min-width:0}
.lede-summary{display:block;width:100%;max-width:100%;margin:8px 0 30px;color:var(--ink-2);font-size:13px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sumrow,.sumrow .cell{min-width:0}
.sumrow .cell em{white-space:normal;overflow-wrap:anywhere}
.tabs{display:flex;align-items:flex-end}
.back-home{margin-left:auto;align-self:center;width:34px;height:34px;display:inline-grid;place-items:center;border:1.5px solid var(--rule-2);border-radius:50%;color:var(--ink-3);text-decoration:none;font-size:22px;line-height:1;padding-bottom:2px}
.back-home:hover{border-color:var(--blue);color:var(--blue)}
.pager{display:inline-flex;align-items:center;gap:8px;margin-left:8px;vertical-align:middle;font-size:14px;color:var(--ink-2)}
.pager .pg{width:28px;height:28px;border:1.5px solid var(--rule-2);border-radius:50%;background:var(--surface);color:var(--ink-3);cursor:pointer;font-size:18px;line-height:1;display:inline-grid;place-items:center;padding:0 0 2px}
.pager .pg:hover{border-color:var(--blue);color:var(--blue)}
.pager .pg:disabled{opacity:.35;cursor:default}
.pager b{font-weight:600;font-variant-numeric:tabular-nums;min-width:3ch;text-align:center}
.ctabs{display:flex;gap:22px;margin:18px 0 0;border-bottom:1px solid var(--rule-2)}
.ctab{font:inherit;font-size:14px;font-weight:600;padding:8px 2px 10px;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent;color:var(--ink-3);cursor:pointer}
.ctab:hover{color:var(--ink)}
.ctab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--blue-deep)}
.tl.beh .t{min-width:118px;color:var(--ink-3)}
.tl.beh li.day .t{min-width:0;display:inline;font-weight:800;color:var(--blue-deep)}
.tl.beh li .d{color:var(--ink-2);font-size:13.5px}
.tl.beh li.b-xg::before{background:var(--blue)}
.tl.beh li.b-xg .d{color:var(--ink-blue)}
.tl.beh li.b-trade .d{color:var(--good);font-weight:700}
.summary{margin-top:16px;padding:14px 18px;border-radius:8px;background:#eef7f2;border:1px solid #cfe9dc;color:#0b5e42;font-size:14px}
.summary h4{margin:0 0 6px;font-size:13px;letter-spacing:.04em}
.summary p{margin:6px 0 0;color:var(--ink-2)}
.summary .path b{color:#0b5e42;margin-right:8px}
.kv.top span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.mini-ic{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;vertical-align:-4px;border:1px solid var(--rule-2);border-radius:50%;background:var(--surface);color:var(--ink-3);cursor:pointer;padding:0}
.mini-ic:hover{border-color:var(--blue);color:var(--blue)}
.mini-table tr.total td{font-weight:700;border-top:1px solid var(--rule-2);background:var(--pale)}
.matrix tbody tr[data-jump]{cursor:pointer}
.matrix tbody tr[data-jump]:hover td{background:var(--pale)}
.matrix tbody tr[data-jump] .badge{box-shadow:0 0 0 0 transparent;transition:box-shadow .15s}
.matrix tbody tr[data-jump]:hover .badge{box-shadow:0 0 0 3px rgba(27,136,238,.18)}
</style>
<script>
(function(){
  document.querySelectorAll('section.scope').forEach(function(sec){
    var cases=[].slice.call(sec.querySelectorAll(':scope > .case'));
    var head=sec.querySelector('.cases-h');
    if(!head||!cases.length) return;
    var idx=0, box=null, btns=null, cnt=null;
    if(cases.length>1){
      box=document.createElement('span'); box.className='pager';
      box.innerHTML='<button type="button" class="pg" aria-label="下一位">›</button>';
      head.appendChild(box);
      box.addEventListener('click',function(e){ if(!e.target.closest('.pg')) return; idx=(idx+1)%cases.length; render(); });
    }
    cnt=head.querySelector('.pg-cur');
    function render(){ cases.forEach(function(c,i){ c.hidden = i!==idx; }); if(cnt) cnt.textContent=String(idx+1); }
    // 表格行 → 对应个例：按用户字母匹配 .case[data-letter]
    sec.querySelectorAll('.matrix tbody tr').forEach(function(tr){
      var badge=tr.querySelector('.badge'); if(!badge) return;
      var letter=badge.textContent.trim(); var target=cases.findIndex(function(c){ return c.dataset.letter===letter; });
      if(target<0) return;
      tr.setAttribute('data-jump',letter); tr.title='查看用户 '+letter+' 的个例';
      tr.addEventListener('click',function(e){ if(e.target.closest('a,button,[data-copy]')) return; idx=target; render(); head.scrollIntoView({behavior:'smooth',block:'start'}); });
    });
    render();
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('.ctab'); if(!b) return;
    var body=b.closest('.case-body');
    body.querySelectorAll('.ctab').forEach(function(x){ x.setAttribute('aria-selected', String(x===b)); });
    body.querySelectorAll('.cpanel').forEach(function(p){ p.hidden = p.dataset.panel!==b.dataset.panel; });
  });
})();
</script>
'''

page = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>千问用户转化分析｜截至 {CUT[:10]}</title>
<style>
{CSS}
  :root{{--serif:"Songti SC",STSong,"Noto Serif CJK SC","Source Han Serif SC",SimSun,Georgia,"Times New Roman",serif;--mono:var(--serif)}}
  body,button,input,table{{font-family:var(--serif)}}
  .num,.cell b,.kv b,.tl .t,.matrix td.num,.qt,.badge{{font-variant-numeric:tabular-nums}}
  .eyebrow,.foot-label{{letter-spacing:.14em}}
  .sub-block{{margin-top:16px;padding:14px 16px;border:1px solid var(--rule);border-radius:10px;background:var(--ground)}}
  .sub-block h4{{margin:10px 0 6px;font-size:13px;color:var(--ink-blue);letter-spacing:.04em}}
  .sub-block h4:first-child{{margin-top:0}}
  .kv.three{{grid-template-columns:repeat(3,1fr);margin:6px 0 8px}}
  .kv.three div{{background:var(--surface)}}
  .tight{{margin:4px 0;font-size:13px;color:var(--ink-2)}}
  .qlist.mini li{{grid-template-columns:110px 1fr;padding:5px 0;font-size:12.5px;border-bottom:1px dashed var(--rule)}}
  .qlist.mini .scene{{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:4px;background:var(--soft);color:var(--ink-blue);font-size:11px}}
  .qlist.mini i{{color:var(--ink-3);font-style:normal;font-size:11px}}
  .ops{{margin:4px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink-2);columns:2;column-gap:24px}}
  .ops li{{margin:2px 0;break-inside:avoid}}
  @media(max-width:700px){{.ops{{columns:1}}}}
  .mini-table{{margin-top:6px;font-size:13px}}
  .mini-table th,.mini-table td{{padding:6px 10px}}
  .funds{{margin:4px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink-2)}}
  .funds li{{margin:2px 0}}
  .tabs{{display:flex;flex-wrap:nowrap;gap:0;margin:34px 0 0;max-width:100%;overflow-x:auto;border-bottom:1px solid var(--rule-2);scrollbar-width:none}}
  .tabs::-webkit-scrollbar{{display:none}}
  .tab{{font:inherit;font-size:17px;font-weight:600;line-height:1;padding:12px 4px 14px;margin-right:34px;border:0;border-bottom:2px solid transparent;
    background:transparent;color:var(--ink-3);cursor:pointer;display:inline-flex;align-items:baseline;gap:8px;white-space:nowrap;margin-bottom:-1px;
    transition:color .15s,border-color .15s}}
  .tab small{{font:500 12.5px/1 inherit;color:var(--ink-3);letter-spacing:0}}
  .tab:hover{{color:var(--ink)}}
  .tab[aria-selected="true"]{{color:var(--ink);border-bottom-color:var(--blue-deep)}}
  .tab[aria-selected="true"] small{{color:var(--blue-deep);font-weight:700}}
  @media(max-width:520px){{.tab{{font-size:15px;margin-right:22px}}}}
  .scope-def{{margin:14px 0 18px!important}}
  .cases-h{{margin-top:36px}}
  .cases-h .muted{{font:500 13px/1 Inter,"PingFang SC",sans-serif;margin-left:10px;white-space:nowrap}}
  .cases-h .muted b{{font-weight:700;color:var(--ink)}}
  .case-foot{{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;
    border-top:1px dashed var(--rule)}}
  .foot-label{{color:var(--ink-3);font-size:12px}}
  .foot-actions{{display:inline-flex;gap:6px}}
  .icon-btn{{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--rule-2);border-radius:9px;
    background:var(--surface);color:var(--ink-2);cursor:pointer;position:relative}}
  .icon-btn:hover{{border-color:var(--blue);color:var(--blue-deep);background:var(--pale)}}
  .icon-btn.done{{border-color:var(--good);color:var(--good)}}
  .icon-btn .tip{{position:absolute;bottom:calc(100% + 6px);right:0;background:var(--ink);color:#fff;font-size:11px;
    padding:4px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transform:translateY(3px);transition:.15s}}
  .icon-btn.done .tip{{opacity:1;transform:none}}
  .modal{{position:fixed;inset:0;z-index:50;display:none;place-items:center;padding:20px;background:rgb(15 20 30 / 45%)}}
  .modal[open]{{display:grid}}
  .modal-card{{width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;background:var(--surface);
    border-radius:14px;box-shadow:0 30px 90px rgb(10 20 40 / 30%);overflow:hidden}}
  .modal-head{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;
    border-bottom:1px solid var(--rule);background:var(--pale)}}
  .modal-head h3{{margin:0;font:600 18px/1.3 var(--serif)}}
  .modal-head .muted{{margin-left:8px}}
  .modal-close{{width:32px;height:32px;border:0;border-radius:8px;background:transparent;font-size:20px;cursor:pointer;color:var(--ink-3)}}
  .modal-close:hover{{background:var(--ground);color:var(--ink)}}
  .modal-body{{overflow:auto;padding:6px 20px 18px}}
  .qlist{{margin:0;padding:0;list-style:none}}
  .qlist li{{display:grid;grid-template-columns:130px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid var(--rule);font-size:13.5px}}
  .qlist li:last-child{{border-bottom:0}}
  .qlist .qt{{color:var(--ink-3);font:12px/1.7 var(--mono)}}
  .qlist .qd{{color:var(--ink-2);overflow-wrap:anywhere}}
  .qlist li.daysep .qt{{font-weight:800;color:var(--blue-deep)}}
  .qlist .qmark{{display:inline-block;min-width:32px;text-align:center;color:var(--ink-blue);background:var(--soft);border-radius:4px;font-weight:700;font-size:11px;margin-right:8px;padding:1px 6px}}
  .qlist .qmark.qm{{color:var(--good);background:#e6f5ee}}
  .qlist .via{{color:var(--ink-3);font-style:normal;font-size:11.5px}}
  @media(max-width:600px){{.qlist li{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">QIANWEN × QIEMAN AI · CASE EXPLORER</div>
  <h1>千问用户转化分析</h1>
  <p class="lede-summary" title="{esc(re.sub('<[^>]+>', '', LEDE))}">{LEDE}</p>

  <div class="tabs" role="tablist" aria-label="口径切换">{tabs}<a class="back-home" href="../qianwen-user-acquisition-dashboard/" title="回到千问主看板" aria-label="回到千问主看板">›</a></div>
  {sections}

  <div class="caveat">
    <h4>口径与局限</h4>
    <ul>
      <li>分类名称与主看板一致：「新投」= 绑定后有新增投资且绑定时无资产（含新老用户）；「首投」= 绑定后完成第一笔投资（人生首笔非钱包买入，<span class="num">po.buy / fund.buy / si.trade / po.adjust / plan.trade</span>，撤单不计，含新老用户）；「新户首投」= 其中绑定时当场新注册（注册与绑定相差 ≤60 分钟）的用户；「老户唤回」= 绑定时已有且慢帐号但未首投或已清仓，绑定后重新入金；「老户首投」= 老用户的人生首笔投资发生在绑定后。统计截至 {CUT}。</li>
      <li>入金与主看板完全同口径：绑定后线上/线下充值到盈米宝 + 银行卡直付买产品；组合回款进宝、宝内余额买产品不计。买入 = 绑定后非钱包买入合计；资产 = 各用户最近一个已跑批的 ROOT 快照。</li>
      <li>下单终端与「且慢行为」来自神策埋点（<span class="num">qm_meta.ai_insight_sensors_event_detail</span>）：iOS / Android / HarmonyOS 为 App 原生页记录，js 为 App 内嵌或独立 H5 页；以首笔买入前后 30 分钟内的原生页记录判定终端，设备注册表仅作辅证。页面名已从技术类名翻译成业务页名，不可读的类名不展示；「入金 X 笔」按看板口径（线上/线下充值到盈米宝 + 银行卡直付买入）计数。</li>
      <li>风测得分为且慢风险测评原始分（broker 0008，<span class="num">risk_survey_record</span> 全量历史，取最近一次），未换算等级档位。</li>
      <li>千问提问取 <span class="num">agent_dj_messages</span> 中 role=USER 的非空记录，时间用 <span class="num">dj_gmt_create</span>（业务时间）；且慢 App 内小顾取 <span class="num">ying99_mia.user_message</span> 用户输入行；微信 / 企微侧小顾七人均无记录。关键旅程最多展示前 10 条提问。</li>
      <li>顶部「小顾对话」旁的小图标可查看该用户在千问、且慢 App 小顾、微信小顾三端的全部提问；卡尾图标复制用户 ID 到剪贴板。页面不明文展示用户 ID。</li>
      <li>本页含个例级信息，发布前已在作者端以 PBKDF2 + AES-GCM 加密，明文不进入版本库。</li>
    </ul>
  </div>
  <footer>千问 X 且慢AI小顾 · 绑定用户个例分析台 · 生成于 {META["generated"]} · <a href="../qianwen-user-acquisition-dashboard/">返回用户数据看板</a></footer>
</div>

<div class="modal" id="asks-modal" role="dialog" aria-modal="true" aria-labelledby="asks-title">
  <div class="modal-card">
    <div class="modal-head"><h3 id="asks-title">提问历程</h3><button type="button" class="modal-close" aria-label="关闭">×</button></div>
    <div class="modal-body"><ul class="qlist" id="asks-list"></ul></div>
  </div>
</div>

<script>
const ASKS = {ASKS_JSON};
const tabs=[...document.querySelectorAll('.tab')];
function show(id){{
  tabs.forEach(t=>t.setAttribute('aria-selected', String(t.dataset.scope===id)));
  document.querySelectorAll('.scope').forEach(s=>{{ s.hidden = s.id!=='scope-'+id; }});
  try{{ history.replaceState(null,'','#'+id); }}catch(e){{}}
}}
tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.scope)));
const initial=(location.hash||'').slice(1);
show(tabs.some(t=>t.dataset.scope===initial)?initial:tabs[0].dataset.scope);

async function copyText(text){{
  try{{ await navigator.clipboard.writeText(text); return true; }}catch(e){{}}
  try{{ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select(); const ok=document.execCommand('copy'); ta.remove(); return ok; }}catch(e){{ return false; }}
}}
document.addEventListener('click', async (e)=>{{
  const c=e.target.closest('[data-copy]');
  if(c){{ const ok=await copyText(c.dataset.copy); c.classList.add('done');
    let tip=c.querySelector('.tip'); if(!tip){{ tip=document.createElement('span'); tip.className='tip'; c.appendChild(tip); }}
    tip.textContent= ok ? '已复制 ID' : '复制失败'; setTimeout(()=>c.classList.remove('done'),1600); return; }}
  const a=e.target.closest('[data-asks]');
  if(a){{ openAsks(a.dataset.asks); }}
}});
const modal=document.getElementById('asks-modal');
function openAsks(pmid){{
  const u=ASKS[pmid]; if(!u) return;
  const nq=u.asks.filter(a=>a.ch==='千问').length, nm=u.asks.filter(a=>a.ch==='且慢').length;
  document.getElementById('asks-title').innerHTML = `用户 ${{u.letter}} 的小顾对话 <span class="muted">${{u.asks.length}} 条 · 千问 ${{nq}} · 且慢 ${{nm}} · 微信 0</span>`;
  const list=document.getElementById('asks-list'); list.innerHTML='';
  if(!u.asks.length){{ list.innerHTML='<li><span class="qt">—</span><span class="qd">该用户在千问、且慢、微信三端都没有向小顾提问（千问会话已创建但零输入）。</span></li>'; }}
  let lastDay='';
  u.asks.forEach(q=>{{
    const day=q.ts.slice(0,10), first=day!==lastDay; lastDay=day;
    const li=document.createElement('li'); if(first) li.className='daysep';
    const t=document.createElement('span'); t.className='qt'; t.textContent = first ? q.ts.slice(5,16).replace('T',' ') : q.ts.slice(11,19);
    const d=document.createElement('span'); d.className='qd'; const m=document.createElement('span'); m.className='qmark'+(q.ch==='且慢'?' qm':''); m.textContent=q.ch;
    d.appendChild(m); d.appendChild(document.createTextNode(q.text)); if(q.via){{ const v=document.createElement('i'); v.className='via'; v.textContent=' · '+q.via; d.appendChild(v); }}
    li.appendChild(t); li.appendChild(d); list.appendChild(li);
  }});
  modal.setAttribute('open',''); document.body.style.overflow='hidden';
}}
function closeAsks(){{ modal.removeAttribute('open'); document.body.style.overflow=''; }}
modal.querySelector('.modal-close').addEventListener('click', closeAsks);
modal.addEventListener('click', e=>{{ if(e.target===modal) closeAsks(); }});
document.addEventListener('keydown', e=>{{ if(e.key==='Escape') closeAsks(); }});
</script>
{PAGER_SNIPPET}</body>
</html>'''
OUT.write_text(page)
print(f"OK → {OUT} ({len(page)//1024} KB); scopes:", {sc["id"]: agg(scope_users(sc))["n"] for sc in SCOPES})
