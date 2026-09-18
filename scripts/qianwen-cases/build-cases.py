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
  {"id": "zero", "label": "绑定时资产为 0", "flag": "zero_at_bind",
   "def": "绑定当日回溯顶层 ROOT 资产为 0 或未开户，且绑定后有入金（含新客与老客）——渠道「真实新增」的全部来源"},
  {"id": "recall", "label": "老用户唤回", "flag": "recall",
   "def": "已有且慢账户但未首投或已清仓，绑定后重新入金"},
  {"id": "newfirst", "label": "全新用户首投", "flag": "new_first_invest",
   "def": "绑定时当场新注册且慢（注册与绑定相差 ≤60 分钟），并在绑定后完成人生首笔非钱包买入"},
  {"id": "first", "label": "用户首投", "flag": "first_invest_after",
   "def": "不分新老，人生首笔非钱包买入（po.buy / fund.buy / si.trade / po.adjust / plan.trade，撤单不计）发生在绑定之后"},
]

def scope_users(sc):
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

def verdict(u):
    if u.get("verdict"):
        v = u["verdict"]; return f'<div class="verdict {v.get("cls","")}"><b>{esc(v["title"])}</b>{esc(v["text"])}</div>'
    fb = dt(u["fb"]); fbuy = dt(u["derived"]["first_buy_after"])
    devs = u["dev"]; mp = u["mp"]
    pays = sorted({(t["extra"] or "").strip() for t in u["trades"] if dt(t["accept_time"]) >= fb and t["extra"]})
    pay_txt = "、".join(pays) if pays else "无支付标记"
    if devs:
        d0 = min(devs, key=lambda d: d["created_on"]); cr = dt(d0["created_on"]); up = dt(d0.get("updated_on") or d0["created_on"])
        name = PLAT.get(str(d0["platform"]), d0["platform"])
        if fbuy and cr <= fbuy and up >= fb:
            return f'<div class="verdict"><b>渠道判定：回到且慢 App（{name}端）完成交易</b>App 设备于 {fmt_t(d0["created_on"], True)} 注册、{fmt_t(d0["updated_on"], True)} 仍有更新，覆盖首投时点；支付方式 {esc(pay_txt)}。千问侧会话仅有对话，无交易动作。</div>'
        if fbuy and cr > fbuy:
            return f'<div class="verdict h5"><b>渠道判定：首投时无 App 记录，判定微信 H5（高置信推断）；{fmt_md(d0["created_on"])} 起转入 App</b>App 设备（{name}）在首投之后才首次出现；{"已绑定公众号" if mp else "未绑定公众号"}；支付方式 {esc(pay_txt)}。</div>'
        return f'<div class="verdict h5"><b>渠道判定：且慢平台内完成，具体端不确定</b>存在 {name} 设备记录（{fmt_t(d0["created_on"], True)} 注册），但设备最后更新于 {fmt_t(d0["updated_on"], True)}，未覆盖交易期；{"已绑定公众号" if mp else "未绑定公众号"}；支付方式 {esc(pay_txt)}。</div>'
    return f'<div class="verdict h5"><b>渠道判定：{"微信 H5（高置信推断）" if mp else "且慢平台内完成，具体端不确定"}</b>全库无任何且慢 App 设备记录；{"已绑定且慢微信公众号，指向 H5" if mp else "亦未绑定微信公众号，触点最少"}；支付方式 {esc(pay_txt)}。风测、下单均为且慢账户体系动作。</div>'

MIA_SCENE = {"MIA": "小顾会话页", "STRATEGY_DETAIL": "策略详情页", "ADVISOR_PAGE_TOP": "投顾页顶部入口",
             "ASSET_M4": "资产页", "QUICK_MENU": "快捷菜单", "FIRST_IN_DAY": "当日首次进入"}
def channel_block(u):
    ch = u.get("channels") or {}
    fb = dt(u["fb"]); fbuy = dt(u["derived"]["first_buy_after"])
    mia = ch.get("app_mia", [])
    toks = ch.get("tokens", [])
    # 千问侧活跃时刻（令牌签发）与首笔买入的关系
    tok_near = [t for t in toks if fbuy and abs((dt(t) - fbuy).total_seconds()) <= 3600]
    cells = f'''<div class="kv three">
      <div><b class="num">{ch.get("qwen_msgs", 0)} 条</b><span>千问小顾 · {ch.get("qwen_sessions", 0)} 个会话</span></div>
      <div><b class="num">{len(mia)} 次</b><span>且慢 App 内小顾（Mia）</span></div>
      <div><b class="num">{ch.get("wechat_msgs", 0)} 条</b><span>微信 / 企微侧小顾</span></div>
    </div>'''
    rows = ""
    for m in mia:
        rows += f'<li><span class="qt">{fmt_t(m["ts"], True)}</span><span class="qd"><span class="scene">{MIA_SCENE.get(m.get("scene"), m.get("scene") or "")}</span>{esc((m.get("text") or "").strip()[:60])}{" <i>（快捷入口）</i>" if m.get("mode") == "AUTO_LEAD" else " <i>（自行输入）</i>" if m.get("mode") == "SELF_INPUT" else ""}</span></li>'
    mia_list = f'<ul class="qlist mini">{rows}</ul>' if rows else '<p class="muted tight">绑定后没有在且慢 App 内使用过小顾。</p>'
    dev_note = ""
    if u["dev"]:
        d0 = min(u["dev"], key=lambda d: d["created_on"])
        dev_note = f'App 设备（{PLAT.get(str(d0["platform"]), d0["platform"])}）{fmt_t(d0["created_on"], True)} 注册、{fmt_t(d0["updated_on"], True)} 最近更新'
    else:
        dev_note = "无任何且慢 App 设备记录"
    tok_note = (f'首笔买入前后 1 小时内有千问会话活动（令牌 {"、".join(fmt_t(t, True) for t in tok_near)} 签发）——下单前刚在千问里问过小顾；是否经千问内嵌的且慢页面下单，库内无终端字段可判' if tok_near
                else f'千问侧令牌签发时刻（{"、".join(fmt_t(t, True) for t in toks[:6])}{"…" if len(toks) > 6 else ""}）均不在首笔买入前后 1 小时内——下单时段没有千问会话活动')
    ops = []
    for r in u["risk"]:
        if dt(r["created_at"]) >= fb - __import__("datetime").timedelta(days=60): ops.append(f'{fmt_t(r["created_at"], True)} 风险测评（{r["score"]} 分）')
    for m in mia: ops.append(f'{fmt_t(m["ts"], True)} App 小顾 · {MIA_SCENE.get(m.get("scene"), m.get("scene") or "")} · {esc((m.get("text") or "")[:20])}')
    for t in u["trades"]:
        if dt(t["accept_time"]) < fb or t["canceled"]: continue
        if t["trade_type"] == "wallet.recharge": ops.append(f'{fmt_t(t["accept_time"], True)} 盈米宝充值 {money(t["buy"])}（{esc(t["extra"] or "")}）')
        elif t["buy"] and float(t["buy"]) > 0: ops.append(f'{fmt_t(t["accept_time"], True)} 买入 {esc(t["po_name"] or t["po_code"])} {money(t["buy"])}')
    ops.sort()
    ops_html = "".join(f"<li>{o}</li>" for o in ops[:14]) + (f"<li>…共 {len(ops)} 项</li>" if len(ops) > 14 else "")
    return f'''<div class="sub-block">
  <h4>小顾入口</h4>{cells}{mia_list}
  <h4>下单终端与千问侧活跃</h4>
  <p class="tight">{dev_note}；{tok_note}。</p>
  <h4>在且慢平台内的主要操作（绑定后）</h4>
  <ul class="ops">{ops_html}</ul>
</div>'''

def holdings_block(u):
    hs = u.get("holdings") or []; fd = u.get("fund_detail") or []; hm = u.get("holdings_meta") or {}
    if not hs and not fd:
        return '<div class="sub-block"><h4>最终持有</h4><p class="muted tight">资产表尚无该账户持仓行（当日成交，次日批次体现）。</p></div>'
    rows = "".join(f'<tr><td>{esc(h["kind"])}</td><td>{esc(h["name"])}{f" <span class=num>{esc(h[chr(99)+chr(111)+chr(100)+chr(101)])}</span>" if h.get("code") and h["code"] not in ("WALLET","FUND") else ""}</td><td class="num">{money(h["value"]) + " 元" if h.get("value") is not None else "买入 " + money(h.get("buy")) + " 元（未落账）"}</td></tr>' for h in hs)
    tbl = f'''<table class="mini-table"><thead><tr><th>类型</th><th>产品</th><th>当前市值{f"（{hm.get('as_of','')[5:]} 快照）" if hm.get("as_of") else ""}</th></tr></thead><tbody>{rows}</tbody></table>'''
    fund_html = ""
    if fd:
        top = sorted([f for f in fd if f["po"] != "盈米宝"], key=lambda f: -f["mv"])[:8]
        wallet = sum(f["mv"] for f in fd if f["po"] == "盈米宝")
        items = "".join(f'<li><span class="num">{esc(f["fund_code"])}</span> {esc(f["fund_name"])} <span class="muted">{"· " + esc(f["po"]) + " " if f.get("po") and f["po"] != "—" else ""}· {money(f["mv"])} 元</span></li>' for f in top)
        more = len([f for f in fd if f["po"] != "盈米宝"]) - len(top)
        basis = f'{hm.get("bill_month")} 月末账单市值' if hm.get("bill_month") else "绑定后子订单成功金额（未扣净值波动）"
        fund_html = f'''<p class="tight muted">穿透到基金（{basis}，前 {len(top)} 只{f"，另 {more} 只未列" if more > 0 else ""}{f"；盈米宝货币基金 {money(wallet)} 元" if wallet else ""}）</p><ul class="funds">{items}</ul>'''
    return f'<div class="sub-block"><h4>最终持有</h4>{tbl}{fund_html}</div>'

def card(u):
    d = u["derived"]
    who = f'{u["age"]} 岁 · {"男" if u["gender"]=="M" else "女" if u["gender"]=="F" else "性别未知"}' + (f' · {esc(u["prov"])}' if u.get("prov") else "")
    dev_txt = "、".join(sorted({PLAT.get(str(x["platform"]), str(x["platform"])) for x in u["dev"]})) or "无 App 记录"
    tags = [f'<span class="tag">{ "绑定当场注册" if u["cohort"]=="new" else "老客 · " + dt(u["registered_at"]).strftime("%Y-%m") + " 注册" }</span>',
            f'<span class="tag good">绑定后买入 {money(d["buy_amount_after"])} 元</span>',
            f'<span class="tag good">绑定后入金 {money(d["inflow_after"])} 元</span>']
    if d["cancels_after"]: tags.append(f'<span class="tag amber">撤单重下 {d["cancels_after"]} 次</span>')
    if not u["asks"]: tags.append('<span class="tag amber">提问 0 条</span>')
    risk_last = u["risk"][-1]["score"] if u["risk"] else "—"
    al = u.get("asset_latest")
    asset_txt = f'{money(al["ta"])} 元' if al else "尚无快照"
    asset_sub = f'当前资产（{al["cal_date"][5:]} 快照）' if al else "当前资产（当日成交，次日批次体现）"
    kv = f'''<div class="kv">
      <div><b class="num">{risk_last} 分</b><span>风险测评得分</span></div>
      <div><b class="num">{asset_txt}</b><span>{asset_sub}</span></div>
      <div><b class="num">{d["buys_after"]} 笔</b><span>绑定后买入（赎回 {money(d["sell_after"])} 元）</span></div>
      <div><b class="num">{dur(u["fb"], d["first_buy_after"])}</b><span>绑定 → 首笔买入</span></div>
    </div>'''
    narrative = f'<p class="muted">{u["narrative"]}</p>' if u.get("narrative") else ""
    extra_blocks = channel_block(u) + holdings_block(u)
    badge_cls = "badge n" if u["cohort"] == "new" else "badge"
    return f'''<div class="case" data-pmid="{u["pmid"]}" data-letter="{u["letter"]}">
  <div class="case-head">
    <span class="who"><span class="{badge_cls}">{u["letter"]}</span>{who} · {dev_txt}</span>
    {"".join(tags)}
  </div>
  <div class="case-body">
    {kv}
    <ul class="tl">
{timeline(u)}
    </ul>
    {verdict(u)}
    {extra_blocks}
    {narrative}
    <div class="case-foot">
      <span class="foot-label">用户 {u["letter"]} · {"新客" if u["cohort"]=="new" else "老客"} · 提问 {len(u["asks"])} 条</span>
      <span class="foot-actions">
        <button type="button" class="icon-btn" data-copy="{u["pmid"]}" title="复制用户 ID 到剪贴板" aria-label="复制用户 ID">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>
        </button>
        <button type="button" class="icon-btn" data-asks="{u["pmid"]}" title="查看在千问侧的全部提问历程" aria-label="查看提问历程">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z"/><path d="M8 11h8M8 14h5"/></svg>
        </button>
      </span>
    </div>
  </div>
</div>'''

# ───── 汇总矩阵 ─────
def matrix(us):
    rows = []
    for u in us:
        d = u["derived"]; al = u.get("asset_latest")
        dev = u["dev"]
        dev_txt = ("、".join(sorted({PLAT.get(str(x["platform"]), str(x["platform"])) for x in dev})) + " · " + fmt_md(min(x["created_on"] for x in dev)) + " 注册") if dev else "无记录"
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
<thead><tr><th>用户</th><th>客群</th><th>画像</th><th>绑定</th><th>绑定后首笔买入</th><th>间隔</th><th>绑定后入金</th><th>绑定后买入</th><th>当前资产</th><th>风测</th><th>提问</th><th>且慢 App 设备</th></tr></thead>
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
  <div class="cell"><b>{a["n"]}</b><span>用户数</span><em>新客 {a["new"]} / 老客 {a["n"]-a["new"]} · 绑定→首投中位 {med_txt}</em></div>
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
  <h2 class="cases-h">个例分析 <span class="muted">按绑定后买入金额降序 · {a["n"]} 人</span></h2>
  {cards}
</section>'''

tabs = "".join(f'<button type="button" class="tab" role="tab" data-scope="{sc["id"]}" aria-selected="false">{sc["label"]}<small>{agg(scope_users(sc))["n"]}</small></button>' for sc in SCOPES)
sections = "\n".join(scope_section(sc) for sc in SCOPES)

ASKS_JSON = json.dumps({u["pmid"]: {"letter": u["letter"], "cohort": u["cohort"],
                                    "asks": [{"ts": a["ts"][:19], "text": a["text"]} for a in sorted(u["asks"], key=lambda a: a["ts"])]}
                        for u in users}, ensure_ascii=False).replace("</", "<\\/")

CSS = Path(sys.argv[3]).read_text() if len(sys.argv) > 3 else ""

page = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>千问绑定用户个例分析台｜截至 {CUT[:10]}</title>
<style>
{CSS}
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
  .tabs{{display:inline-flex;flex-wrap:nowrap;gap:2px;margin:26px 0 8px;padding:4px;max-width:100%;overflow-x:auto;
    background:var(--surface);border:1px solid var(--rule);border-radius:12px;scrollbar-width:none}}
  .tabs::-webkit-scrollbar{{display:none}}
  .tab{{font:inherit;font-size:13.5px;font-weight:600;line-height:1;padding:9px 14px;border:0;border-radius:9px;
    background:transparent;color:var(--ink-2);cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;
    transition:background .15s,color .15s}}
  .tab small{{font:600 11.5px/1 var(--mono);color:var(--ink-3);letter-spacing:0}}
  .tab:hover{{background:var(--ground);color:var(--ink)}}
  .tab[aria-selected="true"]{{background:var(--ink-blue);color:#fff}}
  .tab[aria-selected="true"] small{{color:rgba(255,255,255,.7)}}
  @media(max-width:520px){{.tab{{padding:8px 11px;font-size:13px}}}}
  .scope-def{{margin:8px 0 18px!important}}
  .cases-h{{margin-top:36px}}
  .cases-h .muted{{font:500 13px/1 Inter,"PingFang SC",sans-serif;margin-left:10px}}
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
  .qlist .qmark{{color:var(--blue);font-weight:700;font-size:12px;margin-right:6px}}
  @media(max-width:600px){{.qlist li{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">QIANWEN × QIEMAN AI · CASE EXPLORER</div>
  <h1>千问绑定用户个例分析台</h1>
  <p class="lede">四种口径切换看同一批人：每种口径给出用户数、资产规模、绑定后入金，以及名单下每一位用户的完整决策路径——他们是谁、和小顾聊了什么、钱怎么进来的、最后在哪个端完成交易。</p>
  <p class="meta-line">数据截至 {CUT}（北京时间） · 全部绑定用户 {META["bound_total"]:,} · 口径锚定各用户自己的绑定时刻 · 本页含个例级明细，已作者端加密发布</p>

  <div class="tabs" role="tablist" aria-label="口径切换">{tabs}</div>
  {sections}

  <div class="caveat">
    <h4>口径与局限</h4>
    <ul>
      <li>「绑定时资产为 0」按各用户绑定当日回溯顶层 ROOT 资产快照，为 0 或未开户即计入，并要求绑定后有入金；「老用户唤回」= 已有且慢账户但未首投或已清仓、绑定后重新入金；「首投」= 人生首笔非钱包买入（<span class="num">po.buy / fund.buy / si.trade / po.adjust / plan.trade</span>，撤单不计）晚于首次绑定；新客 / 老客按注册与绑定相差是否 ≤60 分钟划分。统计截至 {CUT}。</li>
      <li>入金 = 各用户自绑定日起顶层 ROOT 账户的实际入流合计（资产表 input_amount，含线下汇款与钱包充值，不重复计从钱包转买的部分）；当日成交尚未落账者以盈米宝充值额暂代。买入 = 绑定后非钱包买入合计；资产 = 各用户最近一个已跑批的 ROOT 快照。</li>
      <li>渠道判定基于设备注册记录（<span class="num">ying99_pomodel.device_info</span>，platform 3=iOS / 4=Android / 5=鸿蒙）、订单支付方式（<span class="num">by.online</span> 线上充值 / <span class="num">from.card</span> 银行卡直付）与时间线交叉推断。<b>交易订单表没有终端来源字段，神策埋点凭证本机未配置</b>，故 H5 判定为高置信推断而非直接证据。</li>
      <li>风测得分为且慢风险测评原始分（broker 0008，<span class="num">risk_survey_record</span> 全量历史，取最近一次），未换算等级档位。</li>
      <li>提问取 <span class="num">agent_dj_messages</span> 中 role=USER 的非空记录，时间用 <span class="num">dj_gmt_create</span>（业务时间）；卡内时间线最多展示前 10 条，完整历程点卡尾对话图标查看。</li>
      <li>卡尾两个图标：复制该用户 ID 到剪贴板；查看其在千问侧的全部提问历程。页面不明文展示用户 ID。</li>
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
  document.getElementById('asks-title').innerHTML = `用户 ${{u.letter}} 的提问历程 <span class="muted">${{u.asks.length}} 条 · 千问侧小顾会话</span>`;
  const list=document.getElementById('asks-list'); list.innerHTML='';
  if(!u.asks.length){{ list.innerHTML='<li><span class="qt">—</span><span class="qd">该用户在千问侧没有任何提问记录（会话已创建但零输入）。</span></li>'; }}
  let lastDay='';
  u.asks.forEach(q=>{{
    const day=q.ts.slice(0,10), first=day!==lastDay; lastDay=day;
    const li=document.createElement('li'); if(first) li.className='daysep';
    const t=document.createElement('span'); t.className='qt'; t.textContent = first ? q.ts.slice(5,16).replace('T',' ') : q.ts.slice(11,19);
    const d=document.createElement('span'); d.className='qd'; const m=document.createElement('span'); m.className='qmark'; m.textContent='问';
    d.appendChild(m); d.appendChild(document.createTextNode(q.text));
    li.appendChild(t); li.appendChild(d); list.appendChild(li);
  }});
  modal.setAttribute('open',''); document.body.style.overflow='hidden';
}}
function closeAsks(){{ modal.removeAttribute('open'); document.body.style.overflow=''; }}
modal.querySelector('.modal-close').addEventListener('click', closeAsks);
modal.addEventListener('click', e=>{{ if(e.target===modal) closeAsks(); }});
document.addEventListener('keydown', e=>{{ if(e.key==='Escape') closeAsks(); }});
</script>
</body>
</html>'''
OUT.write_text(page)
print(f"OK → {OUT} ({len(page)//1024} KB); scopes:", {sc["id"]: agg(scope_users(sc))["n"] for sc in SCOPES})
