#!/usr/bin/env python3
"""由 latest.json 生成工作台缩图 public/previews/doubao-user-acquisition-dashboard.svg。

版式沿用千问看板缩图（三张规模卡 + 累计/每日分栏走势 + 右侧经营与画像黑卡），
数字全部取自快照，刷新数据后重跑即可，不再手工改 SVG。
用法: build-preview.py [latest.json] [输出 svg]
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/reports/doubao-user-acquisition-dashboard/data/latest.json"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "public/previews/doubao-user-acquisition-dashboard.svg"

d = json.load(open(DATA))
m, daily = d["metrics"], d["daily"]
fmt = lambda n: f"{int(n):,}"
pct = lambda a, b: f"{a / b * 100:.1f}%" if b else "—"

def wan(v):
    if v >= 10000: return f"{v / 10000:.1f} 亿元"
    if v >= 1000: return f"{v:,.0f} 万元"
    return f"{v:.1f} 万元"

def wan_short(v):
    return f"{v:,.0f} 万" if v >= 1000 else f"{v:.1f} 万"

def nice_max(v):
    if v <= 10: return 10
    import math
    target = v * 1.04
    mag = 10 ** math.floor(math.log10(target))
    norm = target / mag
    step = next(c for c in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10) if c >= norm)
    return step * mag

cut = d["meta"]["data_cutoff"]
cut_label = f"{int(cut[5:7])}月{int(cut[8:10])}日 {cut[11:16]}"
start = daily[0]["date"]
first_label = f"{int(start[5:7])}月{int(start[8:10])}日"

# ── 走势图几何（与千问缩图同一画布） ──
X0, X1 = 71, 646
n = len(daily)
xs = [X0 + (X1 - X0) * i / max(n - 1, 1) for i in range(n)]
cmax = nice_max(max(r["cumulative_bound_accounts"] for r in daily))
dmax = nice_max(max(r["bound_accounts_today"] for r in daily))
yc = lambda v: 210 - v / cmax * 120
yd = lambda v: 275 - v / dmax * 35
path = lambda key: " ".join(f"{'M' if i == 0 else 'L'}{xs[i]:.1f} {yc(r[key]):.1f}" for i, r in enumerate(daily))
bar_w = max(3, min(12, (X1 - X0) / n * 0.55))

bars_new, bars_old = [], []
for i, r in enumerate(daily):
    x = xs[i] - bar_w / 2
    top_new = yd(r["new_accounts_today"])
    bars_new.append(f'<rect x="{x:.1f}" y="{top_new:.2f}" width="{bar_w:.0f}" height="{275 - top_new:.2f}"/>')
    top_all = yd(r["bound_accounts_today"])
    if r["existing_accounts_today"]:
        bars_old.append(f'<rect x="{x:.1f}" y="{top_all:.2f}" width="{bar_w:.0f}" height="{top_new - top_all:.2f}" rx="1.5"/>')
grid_c = "".join(f'<line x1="53" y1="{210 - 120 * k / 4:.0f}" x2="664" y2="{210 - 120 * k / 4:.0f}"/>' for k in range(1, 5))
axis_c = "".join(f'<text x="44" y="{213 - 120 * k / 4:.0f}" text-anchor="end">{fmt(cmax * k / 4)}</text>' for k in range(0, 5))
every = max(1, round(n / 9))
date_labels = "".join(
    f'<text x="{xs[i]:.1f}" y="292" text-anchor="middle">{int(r["date"][5:7])}.{int(r["date"][8:10])}</text>'
    for i, r in enumerate(daily) if i % every == 0 or i == n - 1)
last = daily[-1]

# ── 右侧经营与画像 ──
stats = {s["id"]: s for s in d["business"]["cohorts"]["all"]["stats"]}
dims = {x["id"]: x for x in d["profile"]["cohorts"]["all"]["dimensions"]}
bucket = lambda dim, bid: next((b["accounts"] for b in dims[dim]["buckets"] if b["id"] == bid), 0)
holding, inflow, buy, txns = stats["holding_amount"], stats["inflow_amount"], stats["buy_amount"], stats["inflow_transactions"]
tiers = [("1万元及以下", bucket("asset_bucket", "lt_10k")), ("1—10万", bucket("asset_bucket", "10k_100k")),
         ("10—100万", bucket("asset_bucket", "100k_1m")), ("100万以上", bucket("asset_bucket", "gte_1m"))]
tier_max = max([t[1] for t in tiers] + [1])
tier_rows = "".join(
    f'<text x="0" y="{10 + 22 * i}" fill="#FFFFFF" fill-opacity=".5">{label}</text>'
    f'<rect x="76" y="{2 + 22 * i}" width="198" height="9" rx="4.5" fill="#FFFFFF" fill-opacity=".09"/>'
    f'<rect x="76" y="{2 + 22 * i}" width="{198 * v / tier_max:.0f}" height="9" rx="4.5" fill="#5ED5BB"/>'
    f'<text x="360" y="{10 + 22 * i}" text-anchor="end" fill="#FFFFFF" fill-opacity=".74" font-family="SFMono-Regular,monospace">{fmt(v)}</text>'
    for i, (label, v) in enumerate(tiers))
mp, card, assessed = bucket("wechat_mp_status", "mp_bound"), bucket("bank_card_status", "card_bound"), bucket("risk_assessment_status", "assessed")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">豆包 X 且慢AI小顾用户数据看板预览</title>
  <desc id="desc">统计窗口从{first_label}豆包上架起，累计绑定用户 {fmt(m["bound_accounts"])} 人，其中在绑定时新注册的新用户 {fmt(m["new_accounts"])} 人、绑定时已有账户的老用户 {fmt(m["existing_accounts"])} 人。画面左侧是累计与每日新增两块分栏走势，右侧是这批用户在且慢的保有规模、入金、交易与触点情况。</desc>
  <defs>
    <linearGradient id="newCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E6F6F1"/><stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <linearGradient id="oldCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E4F0FD"/><stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="shadow" x="-15%" y="-15%" width="130%" height="140%">
      <feDropShadow dx="0" dy="9" stdDeviation="16" flood-color="#171B29" flood-opacity=".07"/>
    </filter>
  </defs>

  <rect width="1280" height="720" fill="#F5F6FB"/>
  <circle cx="1185" cy="-4" r="250" fill="#2E7CF6" fill-opacity=".07"/>
  <circle cx="1128" cy="666" r="170" fill="#0F9D78" fill-opacity=".045"/>

  <g font-family="PingFang SC,Microsoft YaHei,sans-serif">
    <g transform="translate(62 24)">
      <circle cx="17" cy="17" r="17" fill="#2E7CF6"/>
      <text x="17" y="22" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700">豆</text>
      <circle cx="45" cy="17" r="17" fill="#0F9D78"/>
      <text x="45" y="22" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700">且</text>
      <text x="76" y="14" fill="#171B29" font-size="14" font-weight="700">豆包 X 且慢AI小顾</text>
      <text x="76" y="31" fill="#697187" font-size="9" letter-spacing="1.5">用户增长与画像</text>
    </g>
    <text x="1216" y="47" text-anchor="end" fill="#697187" font-size="12">数据截至 {cut_label}</text>
    <circle cx="1064" cy="43" r="5" fill="#0F9D78"/>

    <text x="62" y="104" fill="#2E7CF6" font-family="SFMono-Regular,monospace" font-size="10" font-weight="700" letter-spacing="2">DOUBAO MCP LAUNCH {start[5:7]}.{start[8:10]} · DATA WINDOW SINCE {start[5:7]}.{start[8:10]}</text>
    <text x="62" y="157" fill="#111522" font-family="Songti SC,STSong,serif" font-size="44" font-weight="700">豆包 X 且慢AI小顾 用户数据看板</text>
    <text x="62" y="188" fill="#697187" font-size="13">与千问看板同一口径：从豆包 OAuth 授权绑定看用户增长，再看在且慢的入金、规模与交易 · 新老按绑定当刻是否新注册判定</text>

    <g transform="translate(62 215)" filter="url(#shadow)">
      <rect width="220" height="108" rx="2" fill="#111522"/>
      <text x="22" y="31" fill="#FFFFFF" fill-opacity=".62" font-size="12" font-weight="700">累计绑定用户</text>
      <text x="22" y="78" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(m["bound_accounts"])}</text>
      <circle cx="194" cy="26" r="5" fill="#7FB3FF"/>
    </g>
    <g transform="translate(296 215)" filter="url(#shadow)">
      <rect width="220" height="108" rx="2" fill="url(#newCard)"/>
      <text x="22" y="31" fill="#0A7A5E" font-size="12" font-weight="700">绑定时新注册</text>
      <text x="22" y="78" fill="#0A7A5E" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(m["new_accounts"])}</text>
      <text x="195" y="76" text-anchor="end" fill="#0A7A5E" font-family="SFMono-Regular,monospace" font-size="14" font-weight="700">{pct(m["new_accounts"], m["bound_accounts"])}</text>
    </g>
    <g transform="translate(530 215)" filter="url(#shadow)">
      <rect width="228" height="108" rx="2" fill="url(#oldCard)"/>
      <text x="22" y="31" fill="#1F5FC4" font-size="12" font-weight="700">绑定时已有账户</text>
      <text x="22" y="78" fill="#1F5FC4" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(m["existing_accounts"])}</text>
      <text x="202" y="76" text-anchor="end" fill="#1F5FC4" font-family="SFMono-Regular,monospace" font-size="14" font-weight="700">{pct(m["existing_accounts"], m["bound_accounts"])}</text>
    </g>

    <g transform="translate(62 341)" filter="url(#shadow)">
      <rect width="696" height="333" rx="2" fill="#FFFFFF"/>
      <text x="26" y="30" fill="#2E7CF6" font-family="SFMono-Regular,monospace" font-size="9" font-weight="700" letter-spacing="1.4">GROWTH</text>
      <text x="26" y="54" fill="#171B29" font-size="17" font-weight="700">累计与每日新增分栏走势</text>

      <g font-size="9">
        <line x1="286" y1="26" x2="301" y2="26" stroke="#111522" stroke-width="2.5" stroke-linecap="round"/>
        <text x="307" y="29" fill="#697187">累计绑定</text>
        <text x="307" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(m["bound_accounts"])}</text>
        <line x1="386" y1="26" x2="401" y2="26" stroke="#0F9D78" stroke-width="2" stroke-linecap="round"/>
        <text x="407" y="29" fill="#697187">累计新用户</text>
        <text x="407" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(m["new_accounts"])}</text>
        <line x1="498" y1="26" x2="513" y2="26" stroke="#2E7CF6" stroke-width="2" stroke-linecap="round"/>
        <text x="519" y="29" fill="#697187">累计老用户</text>
        <text x="519" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(m["existing_accounts"])}</text>
        <rect x="612" y="21" width="9" height="10" rx="2" fill="#2E7CF6"/>
        <text x="627" y="29" fill="#697187">当日新增</text>
        <text x="627" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">+{fmt(last["bound_accounts_today"])}</text>
      </g>

      <text x="53" y="82" fill="#697187" font-size="9" font-weight="700">累计绑定用户（人）</text>
      <g stroke="#E9EBF3" stroke-width="1">{grid_c}</g>
      <line x1="53" y1="210" x2="664" y2="210" stroke="#CFD4E1" stroke-width="1"/>
      <g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8">{axis_c}</g>

      <path d="{path("cumulative_existing_accounts")}" fill="none" stroke="#2E7CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="{path("cumulative_new_accounts")}" fill="none" stroke="#0F9D78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="{path("cumulative_bound_accounts")}" fill="none" stroke="#111522" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <g stroke="#FFFFFF" stroke-width="2">
        <circle cx="{xs[-1]:.1f}" cy="{yc(last["cumulative_bound_accounts"]):.1f}" r="4.5" fill="#111522"/>
        <circle cx="{xs[-1]:.1f}" cy="{yc(last["cumulative_new_accounts"]):.1f}" r="4.5" fill="#0F9D78"/>
        <circle cx="{xs[-1]:.1f}" cy="{yc(last["cumulative_existing_accounts"]):.1f}" r="4.5" fill="#2E7CF6"/>
      </g>

      <text x="53" y="232" fill="#697187" font-size="9" font-weight="700">每日新增绑定（人）</text>
      <g stroke="#E9EBF3" stroke-width="1">
        <line x1="53" y1="240" x2="664" y2="240"/>
        <line x1="53" y1="257.5" x2="664" y2="257.5"/>
      </g>
      <line x1="53" y1="275" x2="664" y2="275" stroke="#CFD4E1" stroke-width="1"/>
      <g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8">
        <text x="44" y="243" text-anchor="end">{fmt(dmax)}</text>
        <text x="44" y="278" text-anchor="end">0</text>
      </g>

      <g fill="#2E7CF6">{"".join(bars_old)}</g>
      <g fill="#0F9D78">{"".join(bars_new)}</g>

      <g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8.5">{date_labels}</g>
      <text x="26" y="316" fill="#9AA0AF" font-size="9">{first_label}豆包上架首日即有用户完成授权绑定 · 最新一天截至 {cut_label}，尚未走完</text>
    </g>

    <g transform="translate(790 215)" filter="url(#shadow)">
      <rect width="426" height="459" rx="2" fill="#111522"/>
      <text x="28" y="33" fill="#5ED5BB" font-family="SFMono-Regular,monospace" font-size="9" font-weight="700" letter-spacing="1.4">QIEMAN VALUE</text>
      <text x="28" y="67" fill="#FFFFFF" font-family="Songti SC,STSong,serif" font-size="26" font-weight="700">在且慢的经营与画像</text>
      <text x="28" y="89" fill="#FFFFFF" fill-opacity=".48" font-size="10">入金、保有规模、交易，加上年龄性别居住地与触点</text>

      <g transform="translate(28 108)">
        <rect width="370" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/>
        <text x="18" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="11">当前保有规模（含绑定前已有资产）</text>
        <text x="18" y="56" fill="#5ED5BB" font-family="SFMono-Regular,monospace" font-size="27" font-weight="800">{wan(holding["amount_wan"])}</text>
        <text x="352" y="52" text-anchor="end" fill="#FFFFFF" fill-opacity=".42" font-size="9">{fmt(holding["accounts"])} 人持有</text>
      </g>
      <g transform="translate(28 186)">
        <rect width="177" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/>
        <text x="16" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="10">绑定后入金</text>
        <text x="16" y="52" fill="#BFD7FF" font-family="SFMono-Regular,monospace" font-size="21" font-weight="800">{wan_short(inflow["amount_wan"])}</text>
        <text x="161" y="66" text-anchor="end" fill="#FFFFFF" fill-opacity=".38" font-size="8.5">{fmt(inflow["accounts"])} 人 · {fmt(txns["event_count"])} 笔</text>
      </g>
      <g transform="translate(221 186)">
        <rect width="177" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/>
        <text x="16" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="10">绑定后买入</text>
        <text x="16" y="52" fill="#BFD7FF" font-family="SFMono-Regular,monospace" font-size="21" font-weight="800">{wan_short(buy["amount_wan"])}</text>
        <text x="161" y="66" text-anchor="end" fill="#FFFFFF" fill-opacity=".38" font-size="8.5">{fmt(buy["accounts"])} 人</text>
      </g>

      <line x1="28" y1="278" x2="398" y2="278" stroke="#FFFFFF" stroke-opacity=".12"/>
      <text x="28" y="302" fill="#FFFFFF" fill-opacity=".62" font-size="11" font-weight="700">保有规模分档</text>
      <text x="398" y="302" text-anchor="end" fill="#FFFFFF" fill-opacity=".34" font-size="9">共 {fmt(holding["accounts"])} 人持有</text>

      <g transform="translate(28 316)" font-size="9">{tier_rows}</g>

      <line x1="28" y1="410" x2="398" y2="410" stroke="#FFFFFF" stroke-opacity=".12"/>
      <g transform="translate(28 428)" font-size="9">
        <text x="0" y="0" fill="#FFFFFF" fill-opacity=".5">公众号绑定</text>
        <text x="66" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(mp)}</text>
        <text x="124" y="0" fill="#FFFFFF" fill-opacity=".5">已绑卡</text>
        <text x="168" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(card)}</text>
        <text x="224" y="0" fill="#FFFFFF" fill-opacity=".5">已测评</text>
        <text x="268" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(assessed)}</text>
      </g>
      <text x="28" y="452" fill="#FFFFFF" fill-opacity=".28" font-size="8.5">只展示符合公开口径的整体数据，不含个人明细与单人金额</text>
    </g>
  </g>
</svg>
'''
OUT.write_text(svg)
print(f"OK → {OUT} ({len(svg) // 1024} KB)")
