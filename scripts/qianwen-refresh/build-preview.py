#!/usr/bin/env python3
"""由 latest.json 生成工作台缩图 public/previews/qianwen-user-acquisition-dashboard.svg。

版式沿用现有千问缩图（三张规模卡 + 累计/每日分栏走势 + 右侧经营与画像黑卡），
数字全部取自快照，刷新数据后重跑即可，不再手工修改 SVG。
用法: build-preview.py [latest.json] [输出 svg]
"""
import json
import math
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/reports/qianwen-user-acquisition-dashboard/data/latest.json"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "public/previews/qianwen-user-acquisition-dashboard.svg"

with DATA.open(encoding="utf-8") as source:
    data = json.load(source)

metrics = data["metrics"]
daily = data["daily"]


def fmt(value):
    return f"{int(value):,}"


def pct(part, total):
    return f"{part / total * 100:.1f}%" if total else "—"


def amount_label(value):
    if value >= 10000:
        return f"{value / 10000:.1f} 亿元"
    if value >= 1000:
        return f"{value:,.0f} 万元"
    return f"{value:.1f} 万元"


def amount_short(value):
    return f"{value:,.0f} 万" if value >= 1000 else f"{value:.1f} 万"


def nice_max(value):
    if value <= 10:
        return 10
    target = value * 1.04
    magnitude = 10 ** math.floor(math.log10(target))
    normalized = target / magnitude
    step = next(candidate for candidate in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10) if candidate >= normalized)
    return step * magnitude


def dimension(dimension_id):
    return next(item for item in data["profile"]["cohorts"]["all"]["dimensions"] if item["id"] == dimension_id)


def bucket(dimension_id, bucket_id):
    item = dimension(dimension_id)
    return next((entry["accounts"] for entry in item.get("buckets", []) if entry["id"] == bucket_id), 0)


cutoff = data["meta"]["data_cutoff"]
cutoff_label = f"{int(cutoff[5:7])}月{int(cutoff[8:10])}日 {cutoff[11:16]}"
start = daily[0]["date"]
start_label = f"{int(start[5:7])}月{int(start[8:10])}日"
launch = data["meta"]["launch_at"][:10]
launch_label = f"{int(launch[5:7])}/{int(launch[8:10])} 08:00 正式上线"

# 走势图几何：累计和每日新增使用两块独立坐标。
X0, X1 = 71, 646
count = len(daily)
xs = [X0 + (X1 - X0) * index / max(count - 1, 1) for index in range(count)]
cumulative_max = nice_max(max(row["cumulative_bound_accounts"] for row in daily))
daily_max = nice_max(max(row["bound_accounts_today"] for row in daily))
y_cumulative = lambda value: 210 - value / cumulative_max * 120
y_daily = lambda value: 275 - value / daily_max * 35


def line_path(key):
    return " ".join(
        f"{'M' if index == 0 else 'L'}{xs[index]:.1f} {y_cumulative(row[key]):.1f}"
        for index, row in enumerate(daily)
    )


bar_width = max(3, min(12, (X1 - X0) / count * 0.55))
bars_new = []
bars_existing = []
for index, row in enumerate(daily):
    x = xs[index] - bar_width / 2
    top_new = y_daily(row["new_accounts_today"])
    bars_new.append(f'<rect x="{x:.1f}" y="{top_new:.2f}" width="{bar_width:.1f}" height="{275 - top_new:.2f}"/>')
    top_all = y_daily(row["bound_accounts_today"])
    if row["existing_accounts_today"]:
        bars_existing.append(f'<rect x="{x:.1f}" y="{top_all:.2f}" width="{bar_width:.1f}" height="{top_new - top_all:.2f}" rx="1.5"/>')

grid_cumulative = "".join(
    f'<line x1="53" y1="{210 - 120 * index / 4:.0f}" x2="664" y2="{210 - 120 * index / 4:.0f}"/>'
    for index in range(1, 5)
)
axis_cumulative = "".join(
    f'<text x="44" y="{213 - 120 * index / 4:.0f}" text-anchor="end">{fmt(cumulative_max * index / 4)}</text>'
    for index in range(5)
)
label_every = max(1, round(count / 9))
date_labels = "".join(
    f'<text x="{xs[index]:.1f}" y="292" text-anchor="middle">{int(row["date"][5:7])}.{int(row["date"][8:10])}</text>'
    for index, row in enumerate(daily)
    if index % label_every == 0 or index == count - 1
)
last = daily[-1]

# 正式上线线落在上线日和前一日之间，完整标出此前灰度期。
launch_index = next((index for index, row in enumerate(daily) if row["date"] >= launch), 0)
if launch_index == 0:
    launch_x = 53
else:
    launch_x = (xs[launch_index - 1] + xs[launch_index]) / 2
prelaunch_width = max(0, launch_x - 53)
prelaunch_accounts = sum(row["bound_accounts_today"] for row in daily if row["date"] < launch)
prelaunch_new = sum(row["new_accounts_today"] for row in daily if row["date"] < launch)
prelaunch_existing = sum(row["existing_accounts_today"] for row in daily if row["date"] < launch)

# 右侧经营与画像。
stats = {item["id"]: item for item in data["business"]["cohorts"]["all"]["stats"]}
holding = stats["holding_amount"]
inflow = stats["inflow_amount"]
buy = stats["buy_amount"]
transactions = stats["inflow_transactions"]
tiers = [
    ("1万元及以下", bucket("asset_bucket", "lt_10k")),
    ("1—10万", bucket("asset_bucket", "10k_100k")),
    ("10—100万", bucket("asset_bucket", "100k_1m")),
    ("100万以上", bucket("asset_bucket", "gte_1m")),
]
tier_max = max([value for _, value in tiers] + [1])
tier_rows = "".join(
    f'<text x="0" y="{10 + 22 * index}" fill="#FFFFFF" fill-opacity=".5">{label}</text>'
    f'<rect x="76" y="{2 + 22 * index}" width="198" height="9" rx="4.5" fill="#FFFFFF" fill-opacity=".09"/>'
    f'<rect x="76" y="{2 + 22 * index}" width="{198 * value / tier_max:.0f}" height="9" rx="4.5" fill="#5ED5BB"/>'
    f'<text x="360" y="{10 + 22 * index}" text-anchor="end" fill="#FFFFFF" fill-opacity=".74" font-family="SFMono-Regular,monospace">{fmt(value)}</text>'
    for index, (label, value) in enumerate(tiers)
)
mp_bound = bucket("wechat_mp_status", "mp_bound")
card_bound = bucket("bank_card_status", "card_bound")
assessed = bucket("risk_assessment_status", "assessed")

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">千问 X 且慢AI小顾用户数据看板预览</title>
  <desc id="desc">统计窗口从{start_label}起，累计绑定用户 {fmt(metrics["bound_accounts"])} 人，其中在绑定时新注册的新用户 {fmt(metrics["new_accounts"])} 人、绑定时已有账户的老用户 {fmt(metrics["existing_accounts"])} 人。画面左侧是累计与每日新增走势，右侧是这批用户在且慢的保有规模、入金、交易与触点情况。</desc>
  <defs>
    <linearGradient id="newCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6F6F1"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <linearGradient id="oldCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EDE9FD"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <filter id="shadow" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="9" stdDeviation="16" flood-color="#171B29" flood-opacity=".07"/></filter>
  </defs>
  <rect width="1280" height="720" fill="#F5F6FB"/>
  <circle cx="1185" cy="-4" r="250" fill="#7357E8" fill-opacity=".07"/>
  <circle cx="1128" cy="666" r="170" fill="#0F9D78" fill-opacity=".045"/>
  <g font-family="PingFang SC,Microsoft YaHei,sans-serif">
    <g transform="translate(62 24)">
      <circle cx="17" cy="17" r="17" fill="#7357E8"/><text x="17" y="22" text-anchor="middle" fill="#FFFFFF" font-size="12" font-family="SFMono-Regular,monospace" font-weight="700">Q</text>
      <circle cx="45" cy="17" r="17" fill="#0F9D78"/><text x="45" y="22" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="700">且</text>
      <text x="76" y="14" fill="#171B29" font-size="14" font-weight="700">千问 X 且慢AI小顾</text><text x="76" y="31" fill="#697187" font-size="9" letter-spacing="1.5">用户增长与画像</text>
    </g>
    <text x="1216" y="47" text-anchor="end" fill="#697187" font-size="12">数据截至 {cutoff_label}</text><circle cx="1064" cy="43" r="5" fill="#0F9D78"/>
    <text x="62" y="104" fill="#7357E8" font-family="SFMono-Regular,monospace" font-size="10" font-weight="700" letter-spacing="2">LAUNCH {launch[5:7]}.{launch[8:10]} 08:00 · DATA WINDOW SINCE {start[5:7]}.{start[8:10]}</text>
    <text x="62" y="157" fill="#111522" font-family="Songti SC,STSong,serif" font-size="44" font-weight="700">千问 X 且慢AI小顾 用户数据看板</text>
    <text x="62" y="188" fill="#697187" font-size="13">窗口往前延长一周，从用户增长继续看在且慢的入金、规模与交易 · 新老按绑定当刻是否新注册判定</text>

    <g transform="translate(62 215)" filter="url(#shadow)"><rect width="220" height="108" rx="2" fill="#111522"/><text x="22" y="31" fill="#FFFFFF" fill-opacity=".62" font-size="12" font-weight="700">累计绑定用户</text><text x="22" y="78" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(metrics["bound_accounts"])}</text><circle cx="194" cy="26" r="5" fill="#A493FF"/></g>
    <g transform="translate(296 215)" filter="url(#shadow)"><rect width="220" height="108" rx="2" fill="url(#newCard)"/><text x="22" y="31" fill="#0A7A5E" font-size="12" font-weight="700">绑定时新注册</text><text x="22" y="78" fill="#0A7A5E" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(metrics["new_accounts"])}</text><text x="195" y="76" text-anchor="end" fill="#0A7A5E" font-family="SFMono-Regular,monospace" font-size="14" font-weight="700">{pct(metrics["new_accounts"], metrics["bound_accounts"])}</text></g>
    <g transform="translate(530 215)" filter="url(#shadow)"><rect width="228" height="108" rx="2" fill="url(#oldCard)"/><text x="22" y="31" fill="#4F33BD" font-size="12" font-weight="700">绑定时已有账户</text><text x="22" y="78" fill="#4F33BD" font-family="SFMono-Regular,monospace" font-size="40" font-weight="800" letter-spacing="-2">{fmt(metrics["existing_accounts"])}</text><text x="202" y="76" text-anchor="end" fill="#4F33BD" font-family="SFMono-Regular,monospace" font-size="14" font-weight="700">{pct(metrics["existing_accounts"], metrics["bound_accounts"])}</text></g>

    <g transform="translate(62 341)" filter="url(#shadow)">
      <rect width="696" height="333" rx="2" fill="#FFFFFF"/><text x="26" y="30" fill="#7357E8" font-family="SFMono-Regular,monospace" font-size="9" font-weight="700" letter-spacing="1.4">GROWTH</text><text x="26" y="54" fill="#171B29" font-size="17" font-weight="700">累计与每日新增分栏走势</text>
      <g font-size="9"><line x1="286" y1="26" x2="301" y2="26" stroke="#111522" stroke-width="2.5" stroke-linecap="round"/><text x="307" y="29" fill="#697187">累计绑定</text><text x="307" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(metrics["bound_accounts"])}</text><line x1="386" y1="26" x2="401" y2="26" stroke="#0F9D78" stroke-width="2" stroke-linecap="round"/><text x="407" y="29" fill="#697187">累计新用户</text><text x="407" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(metrics["new_accounts"])}</text><line x1="498" y1="26" x2="513" y2="26" stroke="#6A4CE2" stroke-width="2" stroke-linecap="round"/><text x="519" y="29" fill="#697187">累计老用户</text><text x="519" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">{fmt(metrics["existing_accounts"])}</text><rect x="612" y="21" width="9" height="10" rx="2" fill="#6A4CE2"/><text x="627" y="29" fill="#697187">当日新增</text><text x="627" y="45" fill="#111522" font-family="SFMono-Regular,monospace" font-size="11" font-weight="700">+{fmt(last["bound_accounts_today"])}</text></g>
      <rect x="53" y="90" width="{prelaunch_width:.1f}" height="120" fill="#F5F6FB"/><rect x="53" y="240" width="{prelaunch_width:.1f}" height="35" fill="#F5F6FB"/><line x1="{launch_x:.1f}" y1="90" x2="{launch_x:.1f}" y2="275" stroke="#CFD4E1"/><text x="{(53 + launch_x) / 2:.1f}" y="104" text-anchor="middle" fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8">上线前灰度</text><text x="{launch_x + 7:.1f}" y="104" fill="#111522" font-family="SFMono-Regular,monospace" font-size="8" font-weight="700">{launch_label}</text>
      <text x="53" y="82" fill="#697187" font-size="9" font-weight="700">累计绑定用户（人）</text><g stroke="#E9EBF3">{grid_cumulative}</g><line x1="53" y1="210" x2="664" y2="210" stroke="#CFD4E1"/><g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8">{axis_cumulative}</g>
      <path d="{line_path("cumulative_existing_accounts")}" fill="none" stroke="#6A4CE2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="{line_path("cumulative_new_accounts")}" fill="none" stroke="#0F9D78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="{line_path("cumulative_bound_accounts")}" fill="none" stroke="#111522" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><g stroke="#FFFFFF" stroke-width="2"><circle cx="{xs[-1]:.1f}" cy="{y_cumulative(last["cumulative_bound_accounts"]):.1f}" r="4.5" fill="#111522"/><circle cx="{xs[-1]:.1f}" cy="{y_cumulative(last["cumulative_new_accounts"]):.1f}" r="4.5" fill="#0F9D78"/><circle cx="{xs[-1]:.1f}" cy="{y_cumulative(last["cumulative_existing_accounts"]):.1f}" r="4.5" fill="#6A4CE2"/></g>
      <text x="53" y="232" fill="#697187" font-size="9" font-weight="700">每日新增绑定（人）</text><g stroke="#E9EBF3"><line x1="53" y1="240" x2="664" y2="240"/><line x1="53" y1="257.5" x2="664" y2="257.5"/></g><line x1="53" y1="275" x2="664" y2="275" stroke="#CFD4E1"/><g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8"><text x="44" y="243" text-anchor="end">{fmt(daily_max)}</text><text x="44" y="278" text-anchor="end">0</text></g><g fill="#6A4CE2">{"".join(bars_existing)}</g><g fill="#0F9D78">{"".join(bars_new)}</g><g fill="#8A91A5" font-family="SFMono-Regular,monospace" font-size="8.5">{date_labels}</g>
      <text x="26" y="316" fill="#9AA0AF" font-size="9">{start_label}—上线前灰度绑定 {fmt(prelaunch_accounts)} 人（新 {fmt(prelaunch_new)} / 老 {fmt(prelaunch_existing)}）· 最新一天截至 {cutoff_label}，尚未走完</text>
    </g>

    <g transform="translate(790 215)" filter="url(#shadow)">
      <rect width="426" height="459" rx="2" fill="#111522"/><text x="28" y="33" fill="#5ED5BB" font-family="SFMono-Regular,monospace" font-size="9" font-weight="700" letter-spacing="1.4">QIEMAN VALUE</text><text x="28" y="67" fill="#FFFFFF" font-family="Songti SC,STSong,serif" font-size="26" font-weight="700">在且慢的经营与画像</text><text x="28" y="89" fill="#FFFFFF" fill-opacity=".48" font-size="10">入金、保有规模、交易，加上资产分档与触点</text>
      <g transform="translate(28 108)"><rect width="370" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/><text x="18" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="11">当前保有规模（含绑定前已有资产）</text><text x="18" y="56" fill="#5ED5BB" font-family="SFMono-Regular,monospace" font-size="27" font-weight="800">{amount_label(holding["amount_wan"])}</text><text x="352" y="52" text-anchor="end" fill="#FFFFFF" fill-opacity=".42" font-size="9">{fmt(holding["accounts"])} 人持有</text></g>
      <g transform="translate(28 186)"><rect width="177" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/><text x="16" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="10">绑定后入金</text><text x="16" y="52" fill="#C8BEFF" font-family="SFMono-Regular,monospace" font-size="21" font-weight="800">{amount_short(inflow["amount_wan"])}</text><text x="161" y="66" text-anchor="end" fill="#FFFFFF" fill-opacity=".38" font-size="8.5">{fmt(inflow["accounts"])} 人 · {fmt(transactions["event_count"])} 笔</text></g>
      <g transform="translate(221 186)"><rect width="177" height="70" rx="2" fill="#FFFFFF" fill-opacity=".055"/><text x="16" y="24" fill="#FFFFFF" fill-opacity=".58" font-size="10">绑定后买入</text><text x="16" y="52" fill="#C8BEFF" font-family="SFMono-Regular,monospace" font-size="21" font-weight="800">{amount_short(buy["amount_wan"])}</text><text x="161" y="66" text-anchor="end" fill="#FFFFFF" fill-opacity=".38" font-size="8.5">{fmt(buy["accounts"])} 人</text></g>
      <line x1="28" y1="278" x2="398" y2="278" stroke="#FFFFFF" stroke-opacity=".12"/><text x="28" y="302" fill="#FFFFFF" fill-opacity=".62" font-size="11" font-weight="700">保有规模分档</text><text x="398" y="302" text-anchor="end" fill="#FFFFFF" fill-opacity=".34" font-size="9">共 {fmt(holding["accounts"])} 人持有</text><g transform="translate(28 316)" font-size="9">{tier_rows}</g>
      <line x1="28" y1="410" x2="398" y2="410" stroke="#FFFFFF" stroke-opacity=".12"/><g transform="translate(28 428)" font-size="9"><text x="0" y="0" fill="#FFFFFF" fill-opacity=".5">公众号绑定</text><text x="66" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(mp_bound)}</text><text x="124" y="0" fill="#FFFFFF" fill-opacity=".5">已绑卡</text><text x="168" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(card_bound)}</text><text x="224" y="0" fill="#FFFFFF" fill-opacity=".5">已测评</text><text x="268" y="0" fill="#FFFFFF" font-family="SFMono-Regular,monospace" font-weight="700">{fmt(assessed)}</text></g><text x="28" y="452" fill="#FFFFFF" fill-opacity=".28" font-size="8.5">只展示符合公开口径的整体数据，不含个人明细与单人金额</text>
    </g>
  </g>
</svg>'''

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(svg + "\n", encoding="utf-8")
print(f"OK → {OUT} ({len(svg) // 1024} KB)")
