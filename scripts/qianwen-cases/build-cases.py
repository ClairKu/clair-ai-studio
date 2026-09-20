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

# 个案洞察由作者逐例研判，不用固定字段模板拼接。兼容已经生成、尚未内嵌 insight 的 users.json。
insight_file = Path(__file__).with_name("narratives.json")
insight_rows = json.load(open(insight_file)) if insight_file.exists() else {}
for user in users:
    curated = insight_rows.get(str(user.get("pmid")), {})
    for key in ("insight", "conversion_path_label", "conversion_path", "behavior_insight"):
        if curated.get(key) and not user.get(key):
            user[key] = curated[key]

# 姓氏单独存放在作者端临时数据中，公开源码不落真实姓名；页面仅进入加密产物。
surname_file = SRC.with_name("m_surnames.json")
surname_rows = json.load(open(surname_file)) if surname_file.exists() else []
surname_by_pmid = {str(row["pmid"]): str(row.get("surname") or "").strip()[:1] for row in surname_rows}

# 公开展示统一使用匿名数字编号；沿用原 A→1、B→2… 的稳定映射，不改变底层用户身份。
for user in users:
    user["surname"] = str(user.get("surname") or surname_by_pmid.get(str(user["pmid"]), "")).strip()[:1]
    label = str(user.get("letter") or "")
    if len(label) == 1 and label.isalpha():
        user["letter"] = str(ord(label.upper()) - ord("A") + 1)
    if user.get("narrative"):
        user["narrative"] = re.sub(
            r"用户\s+([A-Z])\b",
            lambda match: f"用户 {ord(match.group(1)) - ord('A') + 1}",
            user["narrative"],
        )

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
def fmt_badge_date(s):
    d = dt(s); return f"{d.month}/{d.day:02d}" if d else "—"
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
   "def": "绑定千问时没有投资资产，绑定后开始投入资金，新客和老客都包括在内。"},
  {"id": "first_inv", "label": "首投", "flag": "first_invest_after",
   "def": "绑定千问前从未投资，绑定后完成了人生第一笔投资，新客和老客都包括在内。"},
  {"id": "new_first_inv", "label": "新户首投", "flag": "new_first_invest",
   "def": "在绑定千问时新注册且慢，之后完成了人生第一笔投资。"},
  {"id": "existing_reactivated", "label": "老户唤回", "flag": "recall",
   "def": "已有且慢账号，绑定时尚未投资或已经清仓，绑定后重新投入资金。"},
  {"id": "existing_first_inv", "label": "老户首投", "flag": "existing_first_invest",
   "def": "已有且慢账号但从未投资，绑定千问后完成了人生第一笔投资。"},
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
    out, last_day, last_time = [], None, None
    for t, cls, text in ev:
        day = t.date()
        first = day != last_day
        if first:
            weekday = "一二三四五六日"[t.weekday()]
            out.append(f'<li class="day-marker"><span class="day-date">{t.strftime("%-m月%-d日")}</span><span class="weekday">周{weekday}</span></li>')
            last_time = None
        last_day = day
        same_time = t == last_time
        tt = "同刻" if same_time else t.strftime("%H:%M:%S")
        out.append(f'<li class="{cls}{" same-time" if same_time else ""}"><span class="t">{tt}</span><span class="d">{text}</span></li>')
        last_time = t
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

def chain_time(value):
    point = dt(value)
    return point.strftime("%-m-%d %H:%M") if point else "—"

def short_quote(value, limit=40):
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:limit] + ("…" if len(text) > limit else "")

def decision_chain_panel(u):
    """只保留与首笔下单最相关的时序证据；这是链路判断，不宣称单点因果。"""
    fb = dt(u["fb"])
    first_trade = dt(u["derived"].get("first_buy_after"))
    first_inflow = dt((u.get("inflow_txns") or [{}])[0].get("t")) if u.get("inflow_txns") else None
    decision_at = first_trade or first_inflow
    steps = []

    asks = sorted((u.get("asks") or []), key=lambda row: row.get("ts") or "")
    if asks:
        first_ask = asks[0]
        steps.append(("intent", "需求出现", chain_time(first_ask.get("ts")), f'千问提出“{short_quote(first_ask.get("text"))}”'))
    else:
        steps.append(("intent", "入口触发", chain_time(u.get("fb")), "完成千问绑定，但没有留下有效提问"))

    native = sorted([e for e in (u.get("events") or []) if e.get("lib") != "js" and dt(e.get("t")) and dt(e.get("t")) >= fb], key=lambda e: e["t"])
    if native:
        first_app = native[0]
        steps.append(("app", "进入且慢", chain_time(first_app["t"]), f'{LIBN.get(first_app.get("lib"), first_app.get("lib"))} App 开始承接后续操作'))

    before_trade = [e for e in (u.get("events") or []) if dt(e.get("t")) and dt(e.get("t")) >= fb and (not decision_at or dt(e.get("t")) <= decision_at)]
    signals = []
    signal_times = []
    signal_texts = [(e, f'{e.get("p") or ""} {e.get("e") or ""}') for e in before_trade]
    if any(re.search(r"开户|绑卡|实名", text) for _, text in signal_texts):
        signals.append("开户绑卡")
        signal_times += [dt(e["t"]) for e, text in signal_texts if re.search(r"开户|绑卡|实名", text)]
    if any(re.search(r"风险测评|测评结果", text) for _, text in signal_texts):
        signals.append("风险测评")
        signal_times += [dt(e["t"]) for e, text in signal_texts if re.search(r"风险测评|测评结果", text)]
    product_pages = [re.sub(r"^(策略详情|策略介绍|主理人详情|资产详情)-", "", e.get("p") or "") for e, _ in signal_texts if e.get("p") and PROD_RE.match(e["p"])]
    product_pages = [name for name in product_pages if name and not name.isdigit()]
    if product_pages:
        from collections import Counter
        product = Counter(product_pages).most_common(1)[0][0]
        signals.append(f'比较“{short_quote(product, 18)}”')
        signal_times += [dt(e["t"]) for e, _ in signal_texts if e.get("p") and product in e["p"]]
    if any(re.search(r"投资规划|定投|开启计划|确认提交|转入一笔试试", text) for _, text in signal_texts):
        signals.append("进入执行环节")
        signal_times += [dt(e["t"]) for e, text in signal_texts if re.search(r"投资规划|定投|开启计划|确认提交|转入一笔试试", text)]
    if signals:
        unique_signals = list(dict.fromkeys(signals))[:4]
        lo, hi = min(signal_times), max(signal_times)
        if lo == hi:
            time_text = chain_time(lo.isoformat())
        elif lo.date() == hi.date():
            time_text = f'{chain_time(lo.isoformat())}–{hi.strftime("%H:%M")}'
        else:
            time_text = f'{chain_time(lo.isoformat())}–{chain_time(hi.isoformat())}'
        steps.append(("prepare", "决策准备", time_text, "、".join(unique_signals)))

    if decision_at:
        products = []
        for trade in u.get("trades") or []:
            when = dt(trade.get("accept_time"))
            if not when or when < fb or trade.get("canceled") or trade.get("trade_type") == "wallet.recharge":
                continue
            if float(trade.get("buy") or 0) > 0 and trade.get("po_name"):
                products.append(trade["po_name"])
        products = list(dict.fromkeys(products))
        inflow = float(u["derived"].get("inflow_after") or 0)
        if inflow > 0:
            trade_text = f'完成首次买入；累计入金 {wan(inflow)}'
        else:
            trade_text = "使用已有余额完成首次买入"
        if products:
            trade_text += f'，主要买入“{short_quote(products[0], 20)}”'
        steps.append(("trade", "完成下单", chain_time(decision_at.isoformat()), trade_text))

        post = []
        for row in asks:
            when = dt(row.get("ts"))
            if when and when > decision_at:
                post.append((when, "千问", row.get("text") or ""))
        for row in (u.get("channels") or {}).get("app_mia", []):
            when = dt(row.get("ts"))
            text = row.get("text") or ""
            if when and when > decision_at and text != "HI_AGAIN":
                post.append((when, "App 小顾", text))
        post.sort(key=lambda item: item[0])
        if post:
            when, channel, text = post[0]
            steps.append(("after", "投后确认", chain_time(when.isoformat()), f'{channel}继续追问“{short_quote(text)}”'))
        else:
            after_pages = sorted([e for e in (u.get("events") or []) if dt(e.get("t")) and dt(e.get("t")) > decision_at and re.search(r"资产|持仓|交易记录", e.get("p") or "")], key=lambda e: e["t"])
            if after_pages:
                first = after_pages[0]
                steps.append(("after", "投后回看", chain_time(first["t"]), f'回到“{short_quote(first.get("p"), 26)}”查看状态'))

    rows = "".join(
        f'<li class="decision-step {kind}"><time>{esc(when)}</time><div><b>{esc(label)}</b><p>{esc(detail)}</p></div></li>'
        for kind, label, when, detail in steps[:5]
    )
    return (f'<div class="decision-head"><h4>关键行为证据</h4></div>'
            f'<ol class="decision-chain">{rows}</ol>')

def behavior_panel(u):
    # 且慢行为：保留关键操作的真实发生顺序，只合并短时间内连续重复的同一动作。
    fb = dt(u["fb"]); evs = u.get("events") or []
    analysis = decision_chain_panel(u)
    mia_rows = (u.get("channels") or {}).get("app_mia", [])
    trade_rows = [
        trade for trade in (u.get("trades") or [])
        if dt(trade.get("accept_time")) and dt(trade["accept_time"]) >= fb and not trade.get("canceled")
    ]
    if not evs and not mia_rows and not trade_rows:
        return analysis + '<p class="muted tight">该用户在且慢 App / H5 没有埋点记录。</p>'

    signal_re = re.compile(r"首页|我的|资产|持仓|交易|订单|风险|测评|搜索|策略|组合|投顾|小顾|基金|开户|登录|银行卡|身份|个人信息|反洗钱|确认|支付|充值|转入|跟车|定投|建议书|发车")
    records = []

    def add_record(value, kind, channel, detail):
        when = dt(value)
        if when and detail:
            records.append({
                "when": when,
                "kind": kind,
                "channel": channel,
                "detail": re.sub(r"\s+", " ", str(detail)).strip(),
            })

    for event in evs:
        page = (event.get("p") or "").strip()
        action = (event.get("e") or "").strip()
        channel = f'{LIBN.get(event.get("lib"), event.get("lib"))} App' if event.get("lib") != "js" else "网页端"
        if event.get("k") == "view" and page and page not in {"首页", "我的"} and (signal_re.search(page) or PROD_RE.match(page) or page in XG_PAGES):
            name = re.sub(r"^(策略详情|策略介绍|主理人详情|资产详情)-", "", page)
            if page.startswith(("策略详情", "策略介绍")):
                detail = f'查看策略「{name}」'
            elif page.startswith("资产详情"):
                detail = f'查看持仓「{name}」'
            else:
                detail = f'进入页面「{name}」'
            add_record(event.get("t"), "view", channel, detail)
        elif event.get("k") == "click" and action and not NOISE_RE.search(action):
            if OP_RE.search(action) or signal_re.search(action) or PROD_RE.match(page) or page in XG_PAGES:
                add_record(event.get("t"), "op", channel, f'{page + " → " if page else ""}{action}')

    for message in mia_rows:
        text = (message.get("text") or "").strip()
        source = MIA_SCENE.get(message.get("scene"), message.get("scene") or "App")
        detail = f'从{source}进入小顾'
        if text and text != "HI_AGAIN":
            detail += f' →「{short_quote(text, 48)}」'
        add_record(message.get("ts"), "xg", "App 小顾", detail)

    for trade in trade_rows:
        name = trade.get("po_name") or trade.get("po_code") or ""
        if trade.get("trade_type") == "wallet.recharge" and (trade.get("extra") or "") in ("by.online", "by.offline"):
            detail = f'{"线上" if trade.get("extra") == "by.online" else "线下汇款"}充值 {money(trade.get("buy"))} 元'
        elif float(trade.get("redeem") or 0) > 0:
            detail = f'赎回「{name}」{money(trade.get("redeem"))} 元'
        elif float(trade.get("buy") or 0) > 0:
            detail = f'买入「{name}」{money(trade.get("buy"))} 元'
        else:
            continue
        add_record(trade.get("accept_time"), "trade", "交易", detail)

    stage_rules = (
        ("account", "开户准备", re.compile(r"开户|绑卡|实名认证|银行卡|身份|个人信息|反洗钱")),
        ("risk", "风险测评", re.compile(r"风险|测评")),
        ("strategy", "研究选品", re.compile(r"搜索|策略|组合|基金|投顾|建议书|跟车|定投|发车")),
        ("asset", "资产回看", re.compile(r"资产|持仓|交易记录")),
        ("trade", "交易执行", re.compile(r"买入|下单|订单|支付|充值|转入|汇款|确认提交")),
    )

    def stage_of(row):
        if row["kind"] == "trade":
            return "trade", "交易执行"
        if row["kind"] == "xg":
            return "xg", "小顾咨询"
        for stage, label, pattern in stage_rules:
            if pattern.search(row["detail"]):
                return stage, label
        return "nav", "页面操作"

    records.sort(key=lambda row: (row["when"], {"view": 0, "op": 1, "xg": 2, "trade": 3}.get(row["kind"], 9)))
    merged = []
    for row in records:
        stage, stage_label = stage_of(row)
        if (
            merged
            and merged[-1]["stage"] == stage
            and row["when"].date() == merged[-1]["when"].date()
            and row["when"] - merged[-1]["end"] <= _td(minutes=8)
        ):
            merged[-1]["end"] = row["when"]
            merged[-1]["count"] += 1
            if row["channel"] not in merged[-1]["channels"]:
                merged[-1]["channels"].append(row["channel"])
            if row["detail"] != merged[-1]["actions"][-1]:
                merged[-1]["actions"].append(row["detail"])
        else:
            merged.append({
                **row,
                "stage": stage,
                "stage_label": stage_label,
                "end": row["when"],
                "count": 1,
                "channels": [row["channel"]],
                "actions": [row["detail"]],
            })

    items = []
    last_day = None
    weekdays = "一二三四五六日"
    for row in merged:
        day = row["when"].date()
        if day != last_day:
            pre = " · 绑定前" if day < fb.date() else ""
            items.append(
                f'<li class="day-marker"><span class="day-date">{row["when"].strftime("%-m月%-d日")}</span>'
                f'<span class="weekday">周{weekdays[row["when"].weekday()]}{pre}</span></li>'
            )
            last_day = day
        time_text = row["when"].strftime("%H:%M:%S")
        if row["end"] != row["when"]:
            time_text += "–" + row["end"].strftime("%H:%M:%S")
        actions = row["actions"][:6]
        detail_text = " → ".join(actions)
        if len(row["actions"]) > len(actions):
            detail_text += f' → 另 {len(row["actions"]) - len(actions)} 步'
        channel_text = " / ".join(row["channels"])
        items.append(
            f'<li class="seq-{row["stage"]}{" trade" if row["stage"] == "trade" else ""}">'
            f'<span class="t">{time_text}</span><span class="d"><b>{row["stage_label"]}</b>'
            f'<i>{esc(channel_text)}</i>{esc(detail_text)}</span></li>'
        )

    detail_html = (
        '<ul class="tl beh behavior-sequence">' + "\n".join(items) + '</ul>'
        if items else '<p class="muted tight">没有可识别的关键页面或操作记录。</p>'
    )
    return analysis + '<div class="behavior-raw"><h4>关键时点与操作顺序</h4>' + detail_html + '</div>'

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
    asset_sub = f'{al["cal_date"][5:].replace("-", "/")} 资产 {wan(al["ta"])}' if al else "资产待次日批次落账"
    first_in = inf[0]["t"] if inf else d["first_buy_after"]
    dates = "、".join(f'{"首笔" if i == 0 else "第二笔"} {fmt_md(x["t"])}' for i, x in enumerate(inf[:2]))
    dates_html = f'<small>{dates}</small>' if dates else ''
    q = len(u["asks"]); m = len(ch.get("app_mia", [])); w = int(ch.get("wechat_msgs", 0) or 0)
    total = q + m + w
    chs = [f'千问 {q} 条' if q else "", f'且慢 {m} 条' if m else "", f'微信 {w} 条' if w else ""]
    chs = " · ".join(x for x in chs if x) or "三端均无提问"
    icon = (f'<button type="button" class="mini-ic" data-asks="{u["pmid"]}" title="查看在千问、且慢小顾、微信小顾的全部提问记录" aria-label="查看全部提问记录">'
            '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z"/></svg></button>') if total else ""
    return (f'<div class="case-facts" aria-label="个例关键结果">'
            f'<div class="fact primary"><span>绑定后入金</span><b class="num">{money(d["inflow_after"])} 元</b><small>{asset_sub}</small></div>'
            f'<div class="fact"><span>首笔决策时长</span><b class="num">{dur(u["fb"], first_in)}</b><small>千问绑定 → 首笔入金</small></div>'
            f'<div class="fact"><span>入金节奏</span><b class="num">{len(inf) if inf else d["buys_after"]} 笔</b>{dates_html}</div>'
            f'<div class="fact"><span>小顾对话</span><b class="num">{total} 条{icon}</b><small>{chs}</small></div>'
            f'</div>')

def holdings_block(u):
    hs = u.get("holdings") or []; fd = u.get("fund_detail") or []; hm = u.get("holdings_meta") or {}
    d = u["derived"]; fb = dt(u["fb"])
    buy_by_po = {}
    for t in u["trades"]:
        if dt(t["accept_time"]) >= fb and not t["canceled"] and t["trade_type"] != "wallet.recharge" and t["buy"] and float(t["buy"]) > 0:
            buy_by_po[t["po_code"]] = buy_by_po.get(t["po_code"], 0) + float(t["buy"])
    if not hs and not fd:
        return '<div class="deposit-products"><div class="deposit-head"><h4>买入去向与当前状态</h4><span>资产尚待次日批次落账</span></div><p class="muted tight">当前尚无可展示的账户持仓行。</p></div>'
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
    return f'<div class="deposit-products"><div class="deposit-head"><h4>买入去向与当前状态</h4><span>入金金额与最新市值</span></div><p class="tight muted">各产品入金金额为绑定后买入金额；盈米宝为充值后仍留在钱包的部分。</p>{tbl}{fund_html}</div>'

def case_insight(u):
    style = str(u.get("conversion_path_label") or "")
    focus_by_style = {
        "规划推荐型": "先用千问明确资金金额、投资期限、收益目标与提醒需求",
        "诊断试单型": "围绕持仓诊断和长期基金推荐反复求证",
        "专业体验型": "高频追问平台能力、账户体系、投顾生态与绩效归因",
        "市场问询型": "先询问热门基金与投顾策略，再自行评估",
        "投后求证型": "反复使用持仓诊断问法，并在成交后继续确认持仓",
        "临门触发型": "只做少量行情问询，几乎不依赖长对话",
        "研究筛选型": "提交基金清单，持续要求回测、比较与替代筛选",
        "规则执行型": "围绕估值分位定投、止盈、执行频率、自动执行与实时提醒持续提问",
        "小白引导型": "反复确认买什么、怎么买和从多少金额开始",
    }
    focus = focus_by_style.get(style)
    behavior = str(u.get("behavior_insight") or "").strip()
    if focus and behavior:
        return esc(f'{style}：{focus}；{behavior}')
    if u.get("insight"):
        return esc(u["insight"])
    if u.get("narrative"):
        plain = re.sub(r"<[^>]+>", "", str(u["narrative"]))
        return esc(re.split(r"[。！？]", plain, maxsplit=1)[0] + "。")
    return "该个案暂缺足够证据，尚不能定义其主要特征。"

def case_overview(u):
    route_steps = [step.strip() for step in str(u.get("conversion_path") or "").split("→") if step.strip()]
    route_html = "".join(f'<li>{esc(step)}</li>' for step in route_steps)
    insight = case_insight(u)
    style = esc(u.get("conversion_path_label") or "转化路径待研判")
    if "：" in insight:
        prefix, insight = insight.split("：", 1)
        if prefix:
            style = prefix
    lead, separator, detail = insight.partition("；")
    detail_html = f'<p class="insight-detail">{detail}</p>' if separator and detail else ''
    return (f'<section class="case-overview" aria-label="用户洞察与转化路径">'
            f'<article class="case-insight"><blockquote class="insight-main"><b>{style}</b>：{lead}</blockquote>{detail_html}</article>'
            f'<div class="case-route"><ol class="overview-route" aria-label="清晰的转化步骤">{route_html}</ol></div>'
            f'</section>')

def card(u):
    gender = "男" if u["gender"] == "M" else "女" if u["gender"] == "F" else "性别未知"
    age = f'{u["age"]}岁' if u.get("age") else "年龄未知"
    who = f'千问用户 #{u["letter"]} · {esc(u.get("surname") or "")}{gender} · {age}'
    app_dates = [d.get("created_on") for d in u.get("dev", []) if d.get("created_on")]
    app_download = min(app_dates) if app_dates else None
    tags = []
    if u.get("fb"):
        tags.append(f'<span class="tag">千问绑定 {fmt_badge_date(u["fb"])}</span>')
    if app_download:
        tags.append(f'<span class="tag">下载 App {fmt_badge_date(app_download)}</span>')
    if u.get("first_buy_ever"):
        tags.append(f'<span class="tag">首投 {fmt_badge_date(u.get("first_buy_ever"))}</span>')
    if u.get("risk"):
        tags.append(f'<span class="tag">风测 {u["risk"][-1]["score"]} 分</span>')
    copy_svg = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
    return (f'<div class="case" data-pmid="{u["pmid"]}" data-letter="{u["letter"]}">\n'
            f'  <div class="case-head">\n'
            f'    <span class="who">{who}</span>\n'
            f'    {"".join(tags)}\n'
            f'    <button type="button" class="icon-btn copy-id" data-copy="{u["pmid"]}" title="复制用户 ID" aria-label="复制用户 ID">{copy_svg}</button>\n'
            f'  </div>\n'
            f'  <div class="case-summary">\n'
            f'    {case_overview(u)}\n'
            f'    {top_stats(u)}\n'
            f'  </div>\n'
            f'  <div class="case-body">\n'
            f'    <div class="ctabs" role="tablist" aria-label="历程切换">\n'
            f'      <button type="button" class="ctab" role="tab" aria-selected="true" data-panel="journey">关键旅程</button>\n'
            f'      <button type="button" class="ctab" role="tab" aria-selected="false" data-panel="behavior">且慢行为</button>\n'
            f'      <button type="button" class="ctab" role="tab" aria-selected="false" data-panel="products">入金产品</button>\n'
            f'    </div>\n'
            f'    <div class="cpanel" data-panel="journey" role="region" aria-label="关键旅程内容" tabindex="0">\n    <ul class="tl journey-tl">\n{timeline(u)}\n    </ul>\n    </div>\n'
            f'    <div class="cpanel" data-panel="behavior" role="region" aria-label="且慢行为内容" tabindex="0" hidden>\n    {behavior_panel(u)}\n    </div>\n'
            f'    <div class="cpanel" data-panel="products" role="region" aria-label="入金产品内容" tabindex="0" hidden>\n    {holdings_block(u)}\n    </div>\n'
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
  <td class="num">{money(al["ta"]) if al else "—"}</td>
  <td class="num">{u["risk"][-1]["score"] if u["risk"] else "—"}</td>
  <td class="num">{len(u["asks"])}</td>
  <td class="wrap">{dev_txt}</td>
</tr>''')
    return f'''<div class="scrollx"><table class="matrix">
<thead><tr><th>用户</th><th>客群</th><th>画像</th><th>绑定</th><th>绑定后首笔投资</th><th>间隔</th><th title="充值盈米宝或银行卡直接投资">入金</th><th>当前资产</th><th>风测</th><th>提问</th><th>下单终端</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table></div>'''

def short_duration(seconds):
    if seconds is None:
        return "—"
    if seconds >= 86400:
        return f"{seconds/86400:.1f} 天"
    if seconds >= 3600:
        return f"{seconds/3600:.1f} 小时"
    return f"{seconds/60:.0f} 分钟"

def scope_section(sc):
    us = scope_users(sc); a = agg(us)
    # 决策时长：绑定千问 → 第一笔入金；无入金记录的用户不进入时长计算。
    import statistics
    durs = [(dt(u["inflow_txns"][0]["t"]) - dt(u["fb"])).total_seconds() for u in us if u.get("inflow_txns")]
    avg_txt = short_duration(statistics.mean(durs)) if durs else "—"
    med_txt = short_duration(statistics.median(durs)) if durs else "—"
    inflow_people = sum(1 for u in us if u.get("inflow_txns"))
    inflow_count = sum(len(u.get("inflow_txns") or []) for u in us)
    asset_people = sum(1 for u in us if float((u.get("asset_latest") or {}).get("ta") or 0) > 0)
    asset_dates = [dt((u.get("asset_latest") or {}).get("cal_date")) for u in us if (u.get("asset_latest") or {}).get("cal_date")]
    asset_date_txt = fmt_md(max(asset_dates).isoformat()) if asset_dates else "—"
    ask_counts = [len(u.get("asks") or []) for u in us]
    ask_avg = statistics.mean(ask_counts) if ask_counts else 0
    ask_med = statistics.median(ask_counts) if ask_counts else 0
    ask_med_txt = f'{ask_med:g}'
    cells = f'''<div class="grid sumrow">
  <div class="cell"><b>{a["n"]}</b><span>用户数</span><em>新客 {a["new"]} 人 · 老客 {a["n"] - a["new"]} 人</em></div>
  <div class="cell"><b>{wan(a["inflow"])}</b><span>总入金</span><em>入金 {inflow_people} 人 · {inflow_count} 笔</em></div>
  <div class="cell"><b>{wan(a["asset"])}</b><span>总资产</span><em>持有资产 {asset_people} 人 · 快照 {asset_date_txt}</em></div>
  <div class="cell"><b>{a["asks"]:,}</b><span>提问数</span><em>人均 {ask_avg:.1f} 问 · 中位数 {ask_med_txt} 问</em></div>
  <div class="cell decision" title="绑定千问到第一笔入金，按 {len(durs)} 位有入金记录的用户计算"><b>{avg_txt}</b><span>平均决策时长</span><em>中位数 {med_txt} · 样本 {len(durs)} 人</em></div>
</div>'''
    cards = "\n".join(card(u) for u in us) if us else '<div class="note">该口径下暂无用户。</div>'
    return f'''<section class="scope" id="scope-{sc["id"]}" hidden>
  {cells}
  <h2 class="section-h matrix-h">个例汇总</h2>
  {matrix(us) if us else ""}
  <h2 class="section-h cases-h">个例分析 <span class="muted">{esc(sc["label"])} {a["n"]}人・第<b class="pg-cur">1</b>人</span></h2>
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
import statistics as _st
if _first_users:
    _med = _st.median([(dt(u["derived"]["first_buy_after"]) - dt(u["fb"])).total_seconds() for u in _first_users if u["derived"]["first_buy_after"]])
_med_txt = "—" if _med is None else (f"{_med/86400:.1f} 天" if _med >= 86400 else f"{_med/3600:.1f} 小时")
from collections import Counter as _C
_tc = _C(LIBN.get(terminal_of(u), "未知") for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
_term_txt = "、".join(f"{k} {v}" for k, v in _tc.most_common())
_terminal_evidence_n = sum(terminal_of(u) is not None for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
_mia_n = sum(len((u.get("channels") or {}).get("app_mia", [])) for u in scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv")))
_new_users = scope_users(next(sc for sc in SCOPES if sc["id"] == "new_inv"))
_ages = [int(u["age"]) for u in _new_users if u.get("age") is not None]
_age_mid = int(_st.median(_ages)) if _ages else None
_male_n = sum(1 for u in _new_users if u.get("gender") == "M")
_gender_txt = f"均为男性" if _male_n == Z["n"] else f"男性 {_male_n} 人"
_durations = [
    (dt(u["inflow_txns"][0]["t"]) - dt(u["fb"])).total_seconds()
    for u in _new_users if u.get("inflow_txns")
]
_new_med = _st.median(_durations) if _durations else None
_new_med_txt = "—" if _new_med is None else (f"{_new_med/86400:.1f} 天" if _new_med >= 86400 else f"{_new_med/3600:.1f} 小时")
_within_day_n = sum(seconds <= 86400 for seconds in _durations)
_app_order_n = 0
for _u in _new_users:
    _buy_at = dt(_u["derived"].get("first_buy_after"))
    if not _buy_at:
        continue
    _lo, _hi = _buy_at - _td(minutes=30), _buy_at + _td(minutes=30)
    if any(e.get("lib") != "js" and _lo <= dt(e.get("t")) <= _hi for e in (_u.get("events") or []) if dt(e.get("t"))):
        _app_order_n += 1
_prior_recall = [u for u in _new_users if u.get("cohort") == "existing" and u.get("last_buy_before")]
_big_new = max((u for u in _new_users if u.get("cohort") == "new"), key=lambda u: float(u["derived"].get("inflow_after") or 0), default=None)
_big_recall = max(_prior_recall, key=lambda u: float(u["derived"].get("inflow_after") or 0), default=None)
_top_two = sorted(_new_users, key=lambda u: float(u["derived"].get("inflow_after") or 0), reverse=True)[:2]
_top_two_inflow_share = (sum(float(u["derived"].get("inflow_after") or 0) for u in _top_two) / Z["inflow"] * 100) if Z["inflow"] else 0
_max_ask_user = max(_new_users, key=lambda u: len(u.get("asks") or []), default=None)
_max_ask_share = (len(_max_ask_user.get("asks") or []) / Z["asks"] * 100) if _max_ask_user and Z["asks"] else 0
_max_ask_inflow_share = (float(_max_ask_user["derived"].get("inflow_after") or 0) / Z["inflow"] * 100) if _max_ask_user and Z["inflow"] else 0

INSIGHTS = [
    f'<b>成效</b>{META["bound_total"]:,} 位绑定用户中识别出 {Z["n"]} 位新投、{F1["n"]} 位首投；累计入金 {wan(Z["inflow"])}，当前资产 {wan(Z["asset"])}。',
    f'<b>行为</b>绑定到首笔入金中位 {_new_med_txt}，{_within_day_n} 人在 24 小时内完成；{_terminal_evidence_n} 人均有且慢 App 原生行为记录，其中 {_app_order_n} 人的首笔投资时点可直接确认在 App 完成。',
    (f'<b>关键案例</b>{_big_new["age"]} 岁新客入金 {wan(_big_new["derived"]["inflow_after"])}、当前资产 {wan(float((_big_new.get("asset_latest") or {}).get("ta") or 0))}；'
     f'沉寂老客回流入金 {wan(_big_recall["derived"]["inflow_after"])}、当前资产 {wan(float((_big_recall.get("asset_latest") or {}).get("ta") or 0))}。'
     f'两例合计贡献 {_top_two_inflow_share:.1f}% 入金，成效高度集中。') if _big_new and _big_recall else '',
]
INSIGHTS_HTML = "\n".join(f'<li>{item}</li>' for item in INSIGHTS if item)
tabs = "".join(f'<button type="button" class="tab" role="tab" data-scope="{sc["id"]}" data-desc="{esc(sc["def"])}" aria-selected="false">{sc["label"]}<small>{agg(scope_users(sc))["n"]}</small></button>' for sc in SCOPES)
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

# 与主看板共用同一组合作品牌标识，避免子看板出现第二套近似 Logo。
main_dashboard = Path(__file__).resolve().parents[2] / "public/reports/qianwen-user-acquisition-dashboard/index.html"
main_dashboard_html = main_dashboard.read_text(encoding="utf-8")
brand_marks_match = re.search(r'<span class="cobrand-marks">(.+?)</span>', main_dashboard_html)
if not brand_marks_match:
    raise RuntimeError("未能从主看板读取千问 × 且慢合作 Logo")
COBRAND_MARKS_HTML = brand_marks_match.group(1)

PAGER_SNIPPET = r'''<style>
*,*::before,*::after{font-family:var(--serif) !important}
html,body{max-width:100%}
.page-wrap{min-width:0}
.insight-list{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;width:100%;max-width:none;margin:16px 0 30px;padding:0;list-style:none;color:var(--ink-2);font-size:13.5px;line-height:1.65}
.insight-list li{position:relative;min-width:0;padding:10px 13px 10px 30px;border-top:1px solid var(--rule);background:rgba(255,255,255,.38);overflow-wrap:anywhere}
.insight-list li::before{content:"";position:absolute;left:13px;top:18px;width:6px;height:6px;border-radius:50%;background:var(--blue)}
.insight-list b{margin-right:8px;color:var(--blue-deep);font-weight:800}
@media(min-width:1280px){.insight-list li{white-space:nowrap}}
.sumrow,.sumrow .cell{min-width:0}
.sumrow .cell em{white-space:nowrap;overflow-wrap:normal;font-size:clamp(10px,.9vw,12px);letter-spacing:-.025em}
.scope-nav{display:flex;align-items:center;gap:22px}
.tabs{display:flex;align-items:center}
.dashboard-link svg,.pager .pg svg,.mini-ic svg,.icon-btn svg{display:block;margin:auto}
.pager{display:inline-flex;align-items:center;gap:8px;margin-left:8px;vertical-align:middle;font-size:14px;color:var(--ink-2)}
.pager .pg{width:28px;height:28px;border:1.5px solid var(--rule-2);border-radius:50%;background:var(--surface);color:var(--ink-3);cursor:pointer;line-height:0;display:inline-grid;place-items:center;padding:0}
.pager .pg:hover{border-color:var(--blue);color:var(--blue)}
.pager .pg:disabled{opacity:.35;cursor:default}
.pager b{font-weight:600;font-variant-numeric:tabular-nums;min-width:3ch;text-align:center}
.cpanel:focus-visible{outline:2px solid rgba(115,87,232,.35);outline-offset:4px;border-radius:6px}
.tl.beh .t{min-width:118px;color:var(--ink-3)}
.tl.beh li.day .t{min-width:0;display:inline;font-weight:800;color:var(--blue-deep)}
.tl.beh li .d{color:var(--ink-2);font-size:13.5px}
.tl.beh li.b-xg::before{background:var(--blue)}
.tl.beh li.b-xg .d{color:var(--ink-blue)}
.tl.beh li.b-trade .d{color:var(--good);font-weight:700}
.mini-ic{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:6px;vertical-align:-4px;border:1px solid var(--rule-2);border-radius:50%;background:var(--surface);color:var(--ink-3);cursor:pointer;padding:0}
.mini-ic:hover{border-color:var(--blue);color:var(--blue)}
.mini-table tr.total td{font-weight:700;border-top:1px solid var(--rule-2);background:var(--pale)}
.matrix tbody tr[data-jump]{cursor:pointer}
.matrix tbody tr[data-jump]:hover td{background:#f0edff;color:#171b2a}
.matrix tbody tr[data-jump] .badge{box-shadow:0 0 0 0 transparent;transition:box-shadow .15s}
.matrix tbody tr[data-jump]:hover .badge{box-shadow:0 0 0 3px rgba(27,136,238,.18)}
@media(max-width:760px){
  .insight-list{grid-template-columns:1fr;gap:7px;margin:13px 0 22px;font-size:12.5px;line-height:1.6}
  .insight-list li{padding:9px 10px 9px 27px}
  .insight-list li::before{left:11px;top:17px}
  .scope-nav{display:grid;gap:10px;margin-top:22px}
  .tabs{max-width:100%;overflow-x:auto}
  .tab{min-height:44px;padding:0 15px;font-size:13px}
  .scope-def{padding-left:0;border-left:0;font-size:13px;line-height:1.65}
  .sumrow{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .cases-h{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
  .cases-h .muted{margin-left:0}
  .cpanel{max-height:none;padding-right:15px}
}
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
      box.innerHTML='<button type="button" class="pg" aria-label="下一位"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>';
      head.appendChild(box);
      box.addEventListener('click',function(e){ if(!e.target.closest('.pg')) return; idx=(idx+1)%cases.length; render(); });
    }
    cnt=head.querySelector('.pg-cur');
    function render(){ cases.forEach(function(c,i){ c.hidden = i!==idx; }); if(cnt) cnt.textContent=String(idx+1); }
    // 表格行 → 对应个例：按匿名用户编号匹配 .case[data-letter]
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
  .eyebrow{{letter-spacing:.14em}}
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
  .report-hero{{display:block}}
  .brand-nav{{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:0 0 22px}}
  .cobrand-brand{{display:inline-flex;align-items:center;min-width:0}}
  .cobrand-marks{{display:inline-flex;align-items:center;flex:0 0 auto}}
  .cobrand-marks img{{display:block;width:26px;height:26px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 2px var(--surface)}}
  .cobrand-marks img + img{{margin-left:-6px}}
  .cobrand-text{{margin-left:16px;color:var(--blue-deep);font:750 11px/1.4 var(--mono);letter-spacing:.16em;white-space:nowrap}}
  .dashboard-link{{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:4px 0;color:var(--blue-deep);font:750 13px/1.3 var(--serif);letter-spacing:.02em;text-decoration:none;white-space:nowrap;transition:color .15s}}
  .dashboard-link i{{display:inline-grid;place-items:center;width:19px;height:19px;padding:0 0 1px;border:1.5px solid currentColor;border-radius:50%;font:750 14px/1 var(--serif);font-style:normal}}
  .dashboard-link:hover{{color:var(--ink)}}
  .dashboard-link:focus-visible{{outline:3px solid var(--amber);outline-offset:4px;border-radius:3px}}
  .scope-nav{{display:flex;align-items:center;gap:24px;margin:34px 0 18px;padding-bottom:14px;border-bottom:1px solid var(--rule-2)}}
  .tabs{{display:flex;flex:0 0 auto;flex-wrap:nowrap;align-items:center;gap:0;margin:0;max-width:100%;overflow-x:auto;scrollbar-width:none}}
  .tabs::-webkit-scrollbar{{display:none}}
  .tab{{min-height:50px;padding:0 22px;border:1px solid var(--rule-2);background:var(--surface);color:var(--ink-3);cursor:pointer;
    display:inline-flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;font:750 16px/1 var(--serif);transition:color .15s,border-color .15s,background-color .15s}}
  .tab + .tab{{margin-left:-1px}}
  .tab small{{font:700 12.5px/1 var(--serif);color:inherit;opacity:.78;letter-spacing:0}}
  .tab:hover{{position:relative;z-index:1;border-color:var(--ink);color:var(--ink)}}
  .tab:focus-visible{{position:relative;z-index:2;outline:3px solid var(--amber);outline-offset:2px}}
  .tab[aria-selected="true"]{{position:relative;z-index:1;border-color:var(--ink);background:var(--ink);color:var(--surface)}}
  .tab[aria-selected="true"] small{{color:inherit;opacity:.72}}
  .scope-def{{min-width:0;margin:0!important;padding-left:22px;border-left:1px solid var(--rule-2);background:transparent;color:var(--ink-2)!important;font-size:14px!important;line-height:1.65}}
  @media(max-width:900px){{
    .scope-nav{{display:grid;gap:11px}}
    .scope-def{{padding:0;border-left:0}}
  }}
  @media(max-width:520px){{
    .brand-nav{{align-items:flex-start;gap:14px;margin-bottom:18px}}
    .cobrand-marks img{{width:24px;height:24px}}
    .cobrand-text{{margin-left:11px;font-size:9px;letter-spacing:.11em;white-space:normal}}
    .dashboard-link{{font-size:12px}}
    .tab{{min-height:44px;padding:0 15px;font-size:13px}}
  }}
  .section-h{{font:800 26px/1.3 var(--serif);letter-spacing:-.02em;color:var(--ink)}}
  .matrix-h{{margin:32px 0 12px}}
  .cases-h{{display:flex;align-items:center;gap:10px;margin-top:38px;margin-bottom:14px}}
  .cases-h .muted{{font:500 13px/1 Inter,"PingFang SC",sans-serif;margin-left:10px;white-space:nowrap}}
  .cases-h .muted b{{font-weight:700;color:var(--ink)}}
  .metric-note{{margin:12px 2px 8px;color:var(--ink-3);font-size:12px;line-height:1.6}}
  .metric-note b{{color:var(--ink-2);font-weight:700}}
  .sumrow{{gap:12px}}
  .sumrow .cell{{min-height:106px;padding:17px 18px;border-color:#d7d4e8;background:var(--surface);box-shadow:inset 0 3px 0 var(--blue),0 8px 24px rgb(34 39 63 / 4%)}}
  .sumrow .cell b{{margin-top:2px;color:#27234d;font-size:27px}}
  .sumrow .cell span{{margin-top:8px;color:#555b70;font-size:12.5px;font-weight:650}}
  .sumrow .cell em{{display:block;margin-top:4px;color:#70768a;font-size:11.5px;font-style:normal}}
  .scrollx{{border:1px solid #d4d8e5;border-radius:13px;background:var(--surface);box-shadow:0 10px 30px rgb(30 36 58 / 5%)}}
  .matrix{{min-width:1000px;margin:0;border:0;border-radius:0;background:var(--surface);font-size:13.5px}}
  .matrix th,.matrix td{{padding:11px 13px;border-bottom:1px solid #dce0eb;color:#24293a}}
  .matrix th{{background:#eceaf6;color:#484d62;font-size:12.5px;font-weight:800;letter-spacing:.025em}}
  .matrix tbody tr:nth-child(even) td{{background:#faf9fd}}
  .matrix tbody tr:last-child td{{border-bottom:0}}
  .matrix tbody tr[data-jump]{{transition:background-color .14s ease,box-shadow .14s ease}}
  .matrix tbody tr[data-jump]:hover td{{background:#f0edff;color:#171b2a}}
  .matrix tbody tr[data-jump]:hover{{box-shadow:inset 3px 0 0 var(--blue)}}
  .matrix .badge{{border-color:#cfc8f2;background:#f1effd;color:#5540b8;font-weight:750}}
  .case{{border-color:#ccd2e0;border-radius:18px;background:var(--surface);box-shadow:0 16px 42px rgb(25 31 52 / 8%)}}
  .case-head{{min-height:72px;padding:18px 24px;border-bottom:1px solid #d8dbea;background:linear-gradient(105deg,#f1effb 0%,#faf9fd 70%,#f4f5fa 100%)}}
  .case-head .who{{color:#1e2233;font-size:20px;font-weight:800}}
  .case-head .badge{{width:25px;height:25px;border-color:#c9c2ed;background:#fff;color:#4e38ac;font-weight:800}}
  .case-head .tag{{padding:4px 10px;border-color:#d4d0e9;background:rgba(255,255,255,.78);color:#4d5266;font-size:11.5px;font-weight:700}}
  .case-summary{{padding:20px 24px 22px;border-bottom:1px solid #d8dbea;background:linear-gradient(180deg,#fcfbff 0%,#f8f7fc 100%)}}
  .case-overview{{display:block;padding:0;border:1px solid #d5d3e5;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgb(37 31 72 / 6%);overflow:hidden}}
  .case-insight{{min-width:0;padding:24px 28px 22px;background:linear-gradient(145deg,#292642 0%,#332e57 100%);color:#fff}}
  .insight-main{{position:relative;margin:0;padding-left:30px;color:#fff;font-size:18px;font-weight:760;line-height:1.72}}
  .insight-main::before{{content:"“";position:absolute;left:0;top:-6px;color:#8c74f3;font:900 34px/1 var(--serif)}}
  .insight-main b{{color:#c9bdff;font-weight:900}}
  .insight-detail{{max-width:1080px;margin:13px 0 0;padding:12px 0 0 30px;border-top:1px solid rgb(255 255 255 / 15%);color:#d9d7e5;font-size:12.5px;font-weight:600;line-height:1.7}}
  .case-route{{min-width:0;padding:20px 24px 22px;background:linear-gradient(135deg,#f8f7fd 0%,#fdfdff 100%)}}
  .overview-route{{counter-reset:route;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:stretch;gap:20px;margin:0;padding:0;list-style:none}}
  .overview-route li{{counter-increment:route;position:relative;min-width:0;min-height:76px;display:flex;align-items:center;padding:22px 15px 15px 48px;border:1px solid #dcd8ed;border-radius:10px;background:#fff;color:#34384a;font-size:12.5px;font-weight:800;line-height:1.5;box-shadow:0 4px 12px rgb(42 36 78 / 4%)}}
  .overview-route li::before{{content:"0" counter(route);position:absolute;left:12px;top:11px;color:#6a50d1;font:850 11px/1 var(--mono);letter-spacing:.04em}}
  .overview-route li + li::after{{content:"→";position:absolute;left:-16px;top:50%;transform:translate(-50%,-50%);color:#8d7cdd;font-size:14px;font-weight:900}}
  .case-facts{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:14px;border:1px solid #d8dbea;border-radius:12px;background:#fff;overflow:hidden}}
  .fact{{min-width:0;min-height:92px;padding:14px 17px 15px}}
  .fact + .fact{{border-left:1px solid #e0e2eb}}
  .fact > span{{display:block;color:#757b8d;font-size:10.5px;font-weight:800;letter-spacing:.04em}}
  .fact > b{{display:flex;align-items:center;gap:7px;margin-top:6px;color:#27234d;font-size:21px;font-weight:850;line-height:1.15}}
  .fact.primary > b{{color:var(--blue-deep);font-weight:900}}
  .fact > small{{display:block;margin-top:6px;color:#656b7f;font-size:11.5px;line-height:1.45;white-space:normal}}
  .fact .mini-ic{{margin-left:0;vertical-align:0}}
  .case-body{{padding:22px 24px 24px}}
  .ctabs{{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0;border:1px solid #d8dbea;border-radius:11px 11px 0 0;background:#f1f0f7;overflow:hidden}}
  .ctab{{min-height:48px;font:inherit;font-size:14px;font-weight:760;padding:0 16px;border:0;border-right:1px solid #d8dbea;background:transparent;color:#666c7f;cursor:pointer;transition:background-color .15s,color .15s}}
  .ctab:last-child{{border-right:0}}
  .ctab:hover{{color:#292d3d;background:#f8f7fc}}
  .ctab:focus,.ctab:focus-visible{{outline:2px solid var(--blue);outline-offset:-2px}}
  .ctab[aria-selected="true"]{{color:#352b75;background:#fff;box-shadow:inset 0 -3px 0 var(--blue-deep)}}
  .cpanel{{height:clamp(560px,68vh,780px);overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;
    padding:20px 22px 22px;border:1px solid #d8dbea;border-top:0;border-radius:0 0 11px 11px;background:#fff;scrollbar-color:#b9bdd0 transparent}}
  .route-title{{display:flex;align-items:center;gap:9px;margin-bottom:12px;color:var(--ink-3);font-size:12px;font-weight:700}}
  .route-title b{{padding:4px 10px;border-radius:99px;background:var(--ink);color:#fff;font-size:12px;letter-spacing:.02em}}
  .decision-head{{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 12px}}
  .decision-head h4{{margin:0;color:#27234d;font-size:14px}}
  .decision-head small{{color:var(--ink-3);font-size:11px}}
  .decision-chain{{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin:0;padding:0;list-style:none}}
  .decision-step{{min-width:0;padding:11px 12px 12px;border:1px solid #dfe2eb;border-radius:9px;background:#fafafe}}
  .decision-step time{{display:block;margin-bottom:7px;color:var(--ink-3);font:700 11px/1.2 var(--serif);font-variant-numeric:tabular-nums}}
  .decision-step b{{display:block;color:#302965;font-size:13px}}
  .decision-step p{{margin:5px 0 0;color:#555b70;font-size:12px;line-height:1.6;overflow-wrap:anywhere}}
  .decision-step.trade{{border-color:#bfe3d4;background:#f2faf7}}
  .decision-step.trade b{{color:#087b5d}}
  .decision-caveat{{margin:10px 2px 0;color:#7a8091;font-size:11.5px;line-height:1.6}}
  .behavior-raw{{margin-top:18px;border-top:1px solid #dfe2eb;padding-top:16px}}
  .behavior-raw > h4{{margin:0 0 14px;color:#27234d;font-size:14px;font-weight:800}}
  .behavior-raw .tl{{margin-top:0}}
  .behavior-sequence .d{{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}}
  .behavior-sequence .d b{{color:#352b75;font-size:11.5px}}
  .behavior-sequence .d i{{padding:2px 7px;border-radius:99px;background:#f0eefc;color:#655aa4;font-size:10.5px;font-style:normal;white-space:nowrap}}
  .behavior-sequence .seq-trade .d b{{color:#087b5d}}
  .deposit-products{{padding:0 2px 8px}}
  .deposit-head{{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:6px}}
  .deposit-head h4,.deposit-products > h4{{margin:0;color:#27234d;font-size:14px;font-weight:800}}
  .deposit-head span{{color:var(--ink-3);font-size:11px}}
  .journey-tl{{margin:0}}
  .journey-tl::before{{background:#c8ccdc}}
  .journey-tl .t{{color:#5e657a;font-weight:650}}
  .journey-tl .d{{color:#24293a}}
  .journey-tl .day-marker{{background:linear-gradient(90deg,#fdfdff 82%,rgba(253,253,255,.88));color:#24293a}}
  .summary{{margin-top:18px!important;padding:16px 18px 17px!important;border:1px solid #d7d4e8!important;border-left:4px solid var(--blue)!important;border-radius:10px!important;background:#f8f7fd!important;color:#24293a!important}}
  .summary h4{{margin-bottom:8px!important;color:#27234d!important;font-size:14px!important;font-weight:800}}
  .summary p{{color:#34394b!important;line-height:1.75}}
  .summary .path b{{color:var(--blue-deep)!important}}
  .sub-block{{margin-top:16px!important;padding:16px 18px!important;border-color:#d8dbea!important;border-radius:10px!important;background:#fbfbfe!important}}
  .sub-block h4{{color:#342d66!important;font-weight:800}}
  .mini-table{{border-color:#d8dbea}}
  .mini-table th{{background:#efedf8;color:#4b5064;font-weight:750}}
  .mini-table td{{color:#292e40}}
  .icon-btn{{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--rule-2);border-radius:9px;
    background:var(--surface);color:var(--ink-2);cursor:pointer;position:relative}}
  .icon-btn:hover{{border-color:var(--blue);color:var(--blue-deep);background:var(--pale)}}
  .icon-btn.done{{border-color:var(--good);color:var(--good)}}
  .copy-id{{width:28px;height:28px;flex:0 0 28px;align-self:center;border-color:transparent;background:transparent;color:var(--ink-3);opacity:.72}}
  .copy-id:hover{{opacity:1;border-color:var(--rule-2);background:rgba(255,255,255,.7)}}
  .copy-id.done{{opacity:1;border-color:#bfe3d4;background:#eaf7f1;color:var(--good)}}
  .copy-id.failed{{opacity:1;border-color:#efc7c1;background:#fff3f1;color:var(--warn)}}
  .modal{{position:fixed;inset:0;z-index:50;display:none;place-items:center;padding:20px;background:rgb(15 20 30 / 45%)}}
  .modal[open]{{display:grid}}
  .modal-card{{width:min(920px,calc(100vw - 48px));height:min(760px,calc(100svh - 48px));min-height:520px;display:flex;flex-direction:column;background:var(--surface);
    border-radius:14px;box-shadow:0 30px 90px rgb(10 20 40 / 30%);overflow:hidden}}
  .modal-head{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 20px;
    min-height:72px;border-bottom:1px solid var(--rule);background:var(--pale)}}
  .modal-title-group{{min-width:0;flex:1;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:12px 18px}}
  .modal-head h3{{margin:0;font:600 18px/1.3 var(--serif)}}
  .asks-filters{{display:flex;align-items:center;flex-wrap:nowrap;gap:6px}}
  .asks-filter{{border:1px solid var(--rule-2);border-radius:99px;background:var(--surface);color:var(--ink-3);
    min-width:72px;padding:5px 10px;font:600 12px/1.35 var(--serif);cursor:pointer;transition:.15s}}
  .asks-filter:hover{{border-color:var(--blue);color:var(--blue-deep)}}
  .asks-filter[aria-pressed="true"]{{border-color:var(--blue);background:var(--soft);color:var(--blue-deep)}}
  .asks-filter b{{font-weight:700;font-variant-numeric:tabular-nums}}
  .modal-close{{width:32px;height:32px;border:0;border-radius:8px;background:transparent;font-size:20px;cursor:pointer;color:var(--ink-3)}}
  .modal-close:hover{{background:var(--ground);color:var(--ink)}}
  .modal-body{{flex:1;min-height:0;overflow-y:scroll;overflow-x:hidden;scrollbar-gutter:stable;padding:6px 20px 18px}}
  .qlist{{margin:0;padding:0;list-style:none}}
  .qlist li{{display:grid;grid-template-columns:130px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid var(--rule);font-size:13.5px}}
  .qlist li:last-child{{border-bottom:0}}
  .qlist .qt{{color:var(--ink-3);font:12px/1.7 var(--mono)}}
  .qlist .qd{{color:var(--ink-2);overflow-wrap:anywhere}}
  .qlist li.daysep .qt{{font-weight:800;color:var(--blue-deep)}}
  .qlist .qmark{{display:inline-block;min-width:32px;text-align:center;color:var(--ink-blue);background:var(--soft);border-radius:4px;font-weight:700;font-size:11px;margin-right:8px;padding:1px 6px}}
  .qlist .qmark.qm{{color:var(--good);background:#e6f5ee}}
  .qlist .via{{color:var(--ink-3);font-style:normal;font-size:11.5px}}
  @media(max-width:600px){{
    .modal{{padding:10px}}
    .modal-card{{width:calc(100vw - 20px);height:calc(100svh - 20px);min-height:0;border-radius:12px}}
    .modal-head{{align-items:flex-start;min-height:112px;padding:14px 16px}}
    .modal-title-group{{grid-template-columns:1fr;gap:9px}}
    .asks-filters{{width:100%;overflow-x:auto;scrollbar-width:none}}
    .asks-filters::-webkit-scrollbar{{display:none}}
    .asks-filter{{min-width:68px;padding:5px 9px}}
    .modal-body{{padding-inline:16px}}
    .qlist li{{grid-template-columns:1fr}}
    .section-h{{font-size:23px}}
    .matrix-h{{margin-top:28px}}
    .case-head{{padding:16px 18px}}
    .case-head .who{{width:100%;font-size:18px}}
    .case-summary{{padding:16px 18px 18px}}
    .case-insight{{padding:19px 20px 18px}}
    .insight-main{{font-size:14.5px}}
    .insight-detail{{padding-left:0}}
    .case-route{{padding:18px 18px 19px}}
    .overview-route{{grid-template-columns:1fr;gap:10px}}
    .overview-route li{{min-height:54px;padding:17px 14px 14px 49px;align-items:center}}
    .overview-route li::before{{left:15px;top:50%;transform:translateY(-50%)}}
    .overview-route li + li::after{{content:"↓";left:25px;top:-7px;transform:none;background:#f8f7fd;padding:0 3px}}
    .case-facts{{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .fact{{min-height:88px;padding:13px 14px}}
    .fact + .fact{{border-left:0}}
    .fact:nth-child(even){{border-left:1px solid #e0e2eb}}
    .fact:nth-child(n+3){{border-top:1px solid #e0e2eb}}
    .case-body{{padding:18px}}
    .ctab{{min-height:46px;padding:0 8px;font-size:13px}}
    .cpanel{{height:clamp(520px,70svh,720px);padding:17px 15px 20px}}
    .decision-chain{{grid-template-columns:1fr}}
  }}
</style>
</head>
<body>
<div class="page-wrap">
  <div class="report-hero">
    <div class="brand-nav">
      <span class="cobrand-brand">
        <span class="cobrand-marks">{COBRAND_MARKS_HTML}</span>
        <span class="cobrand-text">QIANWEN × QIEMAN AI · CASE EXPLORER</span>
      </span>
      <a class="dashboard-link" href="../qianwen-user-acquisition-dashboard/" title="返回千问引流数据分析主看板" aria-label="返回千问引流数据分析主看板">
        <span>引流数据分析</span><i aria-hidden="true">‹</i>
      </a>
    </div>
    <h1>千问用户转化分析</h1>
  </div>
  <ul class="insight-list" aria-label="转化分析洞察与总结">
    {INSIGHTS_HTML}
  </ul>

  <div class="scope-nav">
    <div class="tabs" role="tablist" aria-label="分类切换">{tabs}</div>
    <p class="scope-def" id="scope-description" aria-live="polite"></p>
  </div>
  {sections}

  <footer>千问 X 且慢AI小顾 · 绑定用户个例分析台 · 生成于 {META["generated"]} · <a href="../qianwen-user-acquisition-dashboard/">返回用户数据看板</a></footer>
</div>

<div class="modal" id="asks-modal" role="dialog" aria-modal="true" aria-labelledby="asks-title">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title-group">
        <h3 id="asks-title">提问历程</h3>
        <div class="asks-filters" id="asks-filters" role="toolbar" aria-label="按提问渠道筛选"></div>
      </div>
      <button type="button" class="modal-close" aria-label="关闭">×</button>
    </div>
    <div class="modal-body"><ul class="qlist" id="asks-list"></ul></div>
  </div>
</div>

<script>
const ASKS = {ASKS_JSON};
const tabs=[...document.querySelectorAll('.tab')];
const scopeDescription=document.getElementById('scope-description');
function show(id){{
  tabs.forEach(t=>t.setAttribute('aria-selected', String(t.dataset.scope===id)));
  document.querySelectorAll('.scope').forEach(s=>{{ s.hidden = s.id!=='scope-'+id; }});
  const active=tabs.find(t=>t.dataset.scope===id);
  if(scopeDescription) scopeDescription.textContent=active ? active.dataset.desc : '';
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
  if(c){{
    const original=c.innerHTML, originalLabel=c.getAttribute('aria-label')||'复制用户 ID', originalTitle=c.title;
    const ok=await copyText(c.dataset.copy);
    c.classList.toggle('done',ok); c.classList.toggle('failed',!ok);
    c.innerHTML=ok
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
    c.setAttribute('aria-label',ok?'用户 ID 已复制':'复制失败'); c.title=ok?'已复制用户 ID':'复制失败，请重试';
    setTimeout(()=>{{ c.classList.remove('done','failed'); c.innerHTML=original; c.setAttribute('aria-label',originalLabel); c.title=originalTitle; }},1400);
    return;
  }}
  const a=e.target.closest('[data-asks]');
  if(a){{ openAsks(a.dataset.asks); }}
}});
const modal=document.getElementById('asks-modal');
const askChannels=['千问','且慢','微信'];
let asksUser=null, asksChannel='';
function openAsks(pmid){{
  const u=ASKS[pmid]; if(!u) return;
  asksUser=u; asksChannel=''; renderAsks();
  modal.setAttribute('open',''); document.body.style.overflow='hidden';
}}
function renderAsks(){{
  const u=asksUser; if(!u) return;
  const rows=asksChannel ? u.asks.filter(a=>a.ch===asksChannel) : u.asks;
  document.getElementById('asks-title').textContent=`用户 ${{u.letter}} 的小顾对话`;
  const filters=document.getElementById('asks-filters'); filters.innerHTML='';
  const channelSpecs=askChannels.map(ch=>[ch,ch,u.asks.filter(a=>a.ch===ch).length]).filter(spec=>spec[2]>0);
  [['','全部',u.asks.length], ...channelSpecs].forEach(spec=>{{
    const b=document.createElement('button'); b.type='button'; b.className='asks-filter'; b.dataset.channel=spec[0];
    b.setAttribute('aria-pressed',String(asksChannel===spec[0])); b.title=spec[0] ? `只看${{spec[1]}}提问` : '查看全部渠道提问';
    b.appendChild(document.createTextNode(spec[1]+' ')); const n=document.createElement('b'); n.textContent=spec[2]; b.appendChild(n); filters.appendChild(b);
  }});
  const list=document.getElementById('asks-list'); list.innerHTML='';
  if(!rows.length){{ const li=document.createElement('li'), t=document.createElement('span'), d=document.createElement('span');
    t.className='qt'; t.textContent='—'; d.className='qd'; d.textContent=asksChannel ? `该用户没有${{asksChannel}}渠道的提问记录。` : '该用户在千问、且慢、微信三端都没有向小顾提问（千问会话已创建但零输入）。';
    li.appendChild(t); li.appendChild(d); list.appendChild(li); }}
  let lastDay='';
  rows.forEach(q=>{{
    const day=q.ts.slice(0,10), first=day!==lastDay; lastDay=day;
    const li=document.createElement('li'); if(first) li.className='daysep';
    const t=document.createElement('span'); t.className='qt'; t.textContent = first ? q.ts.slice(5,16).replace('T',' ') : q.ts.slice(11,19);
    const d=document.createElement('span'); d.className='qd'; const m=document.createElement('span'); m.className='qmark'+(q.ch==='且慢'?' qm':''); m.textContent=q.ch;
    d.appendChild(m); d.appendChild(document.createTextNode(q.text)); if(q.via){{ const v=document.createElement('i'); v.className='via'; v.textContent=' · '+q.via; d.appendChild(v); }}
    li.appendChild(t); li.appendChild(d); list.appendChild(li);
  }});
}}
document.getElementById('asks-filters').addEventListener('click',e=>{{
  const b=e.target.closest('.asks-filter'); if(!b) return;
  asksChannel=b.dataset.channel; renderAsks();
}});
function closeAsks(){{ modal.removeAttribute('open'); document.body.style.overflow=''; }}
modal.querySelector('.modal-close').addEventListener('click', closeAsks);
modal.addEventListener('click', e=>{{ if(e.target===modal) closeAsks(); }});
document.addEventListener('keydown', e=>{{ if(e.key==='Escape') closeAsks(); }});
</script>
{PAGER_SNIPPET}</body>
</html>'''
OUT.write_text(page)
print(f"OK → {OUT} ({len(page)//1024} KB); scopes:", {sc["id"]: agg(scope_users(sc))["n"] for sc in SCOPES})
