#!/usr/bin/env python3
"""从 scripts/qianwen-cases 的最新模板派生豆包个例台脚本（build-cases.py / assemble-users.py / encrypt-page.mjs 等）。

千问个例台是模板源，豆包版只在渠道语义上不同（豆包走 MCP：只有 OAuth 会话令牌，没有提问文本；
asks = 且慢 App 内小顾 3.0 提问）。千问模板改版后重跑本脚本即可同步；每条替换都以锚点断言，
锚点漂移会直接报错并指出哪一条，按新模板改锚点即可，不会静默漏改。

用法（仓库根目录）：python3 scripts/doubao-cases/derive-from-qianwen.py
产物：scripts/doubao-cases/{build-cases.py,assemble-users.py,encrypt-page.mjs,validate-alignment.py,base.css,fetch.py}
不动：fetch-all.sh（豆包专有取数）、narratives.json（作者研判）、README.md
"""
import re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
S = ROOT / "scripts/qianwen-cases"
D = ROOT / "scripts/doubao-cases"
SLUG_MAIN = "doubao-user-acquisition-dashboard"


def patch(text, reps, name):
    for a, b in reps:
        n = text.count(a)
        if n != 1:
            sys.exit(f"[{name}] 锚点出现 {n} 次（应为 1）：\n{a[:160]}")
        text = text.replace(a, b)
    return text


# ── 原样复用 ──
for f in ("base.css", "fetch.py"):
    shutil.copy(S / f, D / f)

# ── validate-alignment.py：只改说明 ──
(D / "validate-alignment.py").write_text(
    (S / "validate-alignment.py").read_text().replace("校验个例看板与千问主看板", "校验个例看板与豆包主看板"))

# ── encrypt-page.mjs：标题默认值 + 会话缓存键（主看板与子页共用同一键，解锁一次即可互跳） ──
s = (S / "encrypt-page.mjs").read_text()
s = patch(s, [
    ('const [src, out, title = "千问新用户首投个例分析"] = process.argv.slice(2);',
     'const [src, out, title = "豆包绑定用户个例分析台"] = process.argv.slice(2);'),
    ('const sessionKey="clair-qianwen-report-unlock-v1";', 'const sessionKey="clair-doubao-report-unlock-v1";'),
], "encrypt-page.mjs")
assert "千问" not in s and "qianwen" not in s, "encrypt-page.mjs 仍有千问残留"
(D / "encrypt-page.mjs").write_text(s)

# ── assemble-users.py：会话令牌语义 ──
s = (S / "assemble-users.py").read_text()
s = patch(s, [
    ('"""candidates.json + d_*.json + narratives.json → users.json（build-cases.py 的输入）。',
     '"""豆包个例：candidates.json + d_*.json + narratives.json → users.json（build-cases.py 的输入）。\n'
     '由 derive-from-qianwen.py 从 qianwen-cases/assemble-users.py 派生；差别：m_tokens 是豆包 OAuth 会话令牌（channels.doubao_sessions），\n'
     'd_asks 只含且慢 App 内小顾 3.0 的提问（豆包侧走 MCP，提问文本协议层不可得）。'),
    ('    channels = {\n        "qwen_sessions": sum(1 for r in sess if r.get("is_qwen")), "qwen_msgs": sum(int(r["msgs"] or 0) for r in sess if r.get("is_qwen")),\n        "app_sessions": sum(1 for r in sess if not r.get("is_qwen")),',
     '    toks_after = sorted(t for t in g_tok.get(pmid, []) if T(t) and T(t) >= fb)\n    channels = {\n        "doubao_sessions": len(toks_after),   # 豆包会话令牌（绑定后签发次数，含授权当刻那一次）\n        "app_sessions": sum(1 for r in sess if not r.get("is_qwen")),'),
], "assemble-users.py")
(D / "assemble-users.py").write_text(s)

# ── build-cases.py ──
s = (S / "build-cases.py").read_text()
s = patch(s, [
    ('"""千问个例分析台生成器：',
     '"""豆包个例分析台生成器（由 derive-from-qianwen.py 从 qianwen-cases/build-cases.py 派生；豆包侧只有 OAuth 会话令牌、没有提问文本，asks = 且慢 App 内小顾 3.0 提问）：'),
    ('"def": "绑定千问时没有投资资产，绑定后开始投入资金，新客和老客都包括在内。"', '"def": "绑定豆包时没有投资资产，绑定后开始投入资金，新客和老客都包括在内。"'),
    ('"def": "绑定千问前从未投资，绑定后完成了人生第一笔投资，新客和老客都包括在内。"', '"def": "绑定豆包前从未投资，绑定后完成了人生第一笔投资，新客和老客都包括在内。"'),
    ('"def": "在绑定千问时新注册且慢，之后完成了人生第一笔投资。"', '"def": "在绑定豆包时新注册且慢，之后完成了人生第一笔投资。"'),
    ('"def": "已有且慢账号但从未投资，绑定千问后完成了人生第一笔投资。"', '"def": "已有且慢账号但从未投资，绑定豆包后完成了人生第一笔投资。"'),
    # 汇总：补豆包会话次数
    ('        "asks": sum(len(u["asks"]) for u in us),\n',
     '        "asks": sum(len(u["asks"]) for u in us),\n        "sessions": sum(int((u.get("channels") or {}).get("doubao_sessions") or 0) for u in us),\n'),
    # 时间线
    ('ev.append((fb, "sys", f"千问侧绑定，{reg.strftime(\'%H:%M:%S\')} 当场完成且慢注册"))',
     'ev.append((fb, "sys", f"豆包侧 OAuth 授权绑定，{reg.strftime(\'%H:%M:%S\')} 当场完成且慢注册"))'),
    ('ev.append((fb, "sys", f"绑定千问（账户 {reg.strftime(\'%Y-%m-%d\')} 注册{extra}）"))',
     'ev.append((fb, "sys", f"绑定豆包（账户 {reg.strftime(\'%Y-%m-%d\')} 注册{extra}）"))'),
    ('        ev.append((t, "ask", "「" + esc(a["text"][:60]) + ("…" if len(a["text"]) > 60 else "") + "」"))\n        shown += 1\n    if len(asks) > shown:\n        last = dt(asks[-1]["ts"])\n        ev.append((last, "ask", f"……共 {len(asks)} 条提问，最近一次在 {fmt_t(asks[-1][\'ts\'], True)}（完整提问历程见卡尾图标）"))\n',
     '        ev.append((t, "ask", "App 小顾「" + esc(a["text"][:60]) + ("…" if len(a["text"]) > 60 else "") + "」"))\n        shown += 1\n    if len(asks) > shown:\n        last = dt(asks[-1]["ts"])\n        ev.append((last, "ask", f"……共 {len(asks)} 条提问，最近一次在 {fmt_t(asks[-1][\'ts\'], True)}（完整提问历程见卡尾图标）"))\n'
     '    # 豆包会话：只有 OAuth 令牌签发时刻，没有提问文本；授权当刻那一次不重复列，其余最多列 6 次\n'
     '    toks = [dt(x) for x in (u.get("channels") or {}).get("tokens", []) if dt(x) and dt(x) >= fb and (dt(x) - fb).total_seconds() > 120]\n'
     '    for t in toks[:6]:\n        ev.append((t, "ask", "回到豆包发起会话（内容协议层不可得）"))\n'
     '    if len(toks) > 6:\n        ev.append((toks[-1], "ask", f"……豆包侧共 {len(toks)} 次会话，最近一次在 {fmt_t(toks[-1].isoformat(), True)}"))\n'),
    # 决策链：入口触发写清会话次数；App 小顾提问只有发生在首笔下单之前才算「需求出现」
    ('    asks = sorted((u.get("asks") or []), key=lambda row: row.get("ts") or "")\n    if asks:\n        first_ask = asks[0]\n        steps.append(("intent", "需求出现", chain_time(first_ask.get("ts")), f\'千问提出“{short_quote(first_ask.get("text"))}”\'))\n    else:\n        steps.append(("intent", "入口触发", chain_time(u.get("fb")), "完成千问绑定，但没有留下有效提问"))\n',
     '    asks = sorted((u.get("asks") or []), key=lambda row: row.get("ts") or "")\n    n_tok = int((u.get("channels") or {}).get("doubao_sessions") or 0)\n'
     '    steps.append(("intent", "入口触发", chain_time(u.get("fb")), f"完成豆包 OAuth 授权绑定；豆包侧共 {n_tok} 次会话，提问内容协议层不可得" if n_tok else "完成豆包 OAuth 授权绑定，此后豆包侧没有再产生会话"))\n'
     '    if asks and (not decision_at or (dt(asks[0].get("ts")) or decision_at) <= decision_at):\n        first_ask = asks[0]\n        steps.append(("intent", "需求出现", chain_time(first_ask.get("ts")), f\'且慢 App 小顾提出“{short_quote(first_ask.get("text"))}”\'))\n'),
    ('                post.append((when, "千问", row.get("text") or ""))', '                post.append((when, "App 小顾", row.get("text") or ""))'),
    ('    # 用户路径与行为总结：终端 / 下单情境 / 千问侧关系 / App 内小顾——全部白话，不出现字段名',
     '    # 用户路径与行为总结：终端 / 下单情境 / 豆包侧关系 / App 内小顾——全部白话，不出现字段名'),
    ("parts.append(f'绑定千问前 {dur(first.isoformat(), fb.isoformat())} 就已在且慢 App（{tname}）里活动')",
     "parts.append(f'绑定豆包前 {dur(first.isoformat(), fb.isoformat())} 就已在且慢 App（{tname}）里活动')"),
    ("parts.append('首笔买入时段只有网页端记录，应是在微信或千问内嵌的且慢页面里下单')",
     "parts.append('首笔买入时段只有网页端记录，应是在微信或豆包内嵌的且慢页面里下单')"),
    ("    asks = sorted(u[\"asks\"], key=lambda a: a[\"ts\"])\n    if not asks:\n        parts.append('千问侧零提问，会话建好就直接去且慢下单了')\n    else:\n        near = [a for a in asks if fbuy and 0 <= (fbuy - dt(a[\"ts\"])).total_seconds() <= 3600]\n        if near:\n            a = near[-1]; mins = int((fbuy - dt(a[\"ts\"])).total_seconds() // 60)\n            parts.append(f'下单前 {mins} 分钟刚在千问问了「{esc(a[\"text\"][:24])}{\"…\" if len(a[\"text\"]) > 24 else \"\"}」')\n        else:\n            parts.append(f'千问侧 {len(asks)} 条提问全是咨询，下单时段没有回到千问')\n",
     "    toks = sorted(dt(x) for x in (u.get(\"channels\") or {}).get(\"tokens\", []) if dt(x) and dt(x) >= fb)\n    later = [t for t in toks if (t - fb).total_seconds() > 120]\n"
     "    if not later:\n        parts.append('豆包侧授权之后没有再产生会话，直接去且慢下单了')\n    else:\n        near = [t for t in later if fbuy and 0 <= (fbuy - t).total_seconds() <= 3600]\n        if near:\n            mins = int((fbuy - near[-1]).total_seconds() // 60)\n            parts.append(f'下单前 {mins} 分钟刚在豆包发起过会话（提问内容协议层不可得）')\n        else:\n            parts.append(f'豆包侧绑定后又有 {len(later)} 次会话，但下单时段没有回到豆包（提问内容不可得）')\n"
     "    asks = sorted(u[\"asks\"], key=lambda a: a[\"ts\"])\n    if asks:\n        parts.append(f'在且慢 App 内向小顾提问 {len(asks)} 次')\n"),
    # 顶部四格
    ("    q = len(u[\"asks\"]); m = len(ch.get(\"app_mia\", [])); w = int(ch.get(\"wechat_msgs\", 0) or 0)\n    total = q + m + w\n    chs = [f'千问 {q} 条' if q else \"\", f'且慢 {m} 条' if m else \"\", f'微信 {w} 条' if w else \"\"]\n    chs = \" · \".join(x for x in chs if x) or \"三端均无提问\"\n    icon = (f'<button type=\"button\" class=\"mini-ic\" data-asks=\"{u[\"pmid\"]}\" title=\"查看在千问、且慢小顾、微信小顾的全部提问记录\" aria-label=\"查看全部提问记录\">'",
     "    q = len(u[\"asks\"]); m = len(ch.get(\"app_mia\", [])); w = int(ch.get(\"wechat_msgs\", 0) or 0); db = int(ch.get(\"doubao_sessions\", 0) or 0)\n    total = db + q + m + w\n    chs = [f'豆包 {db} 次会话' if db else \"\", f'且慢 {q + m} 条' if (q + m) else \"\", f'微信 {w} 条' if w else \"\"]\n    chs = \" · \".join(x for x in chs if x) or \"三端均无会话\"\n    icon = (f'<button type=\"button\" class=\"mini-ic\" data-asks=\"{u[\"pmid\"]}\" title=\"查看豆包会话与且慢小顾、微信小顾的全部记录\" aria-label=\"查看全部会话记录\">'"),
    ("<small>千问绑定 → 首笔入金</small>", "<small>豆包绑定 → 首笔入金</small>"),
    ("f'<div class=\"fact\"><span>小顾对话</span><b class=\"num\">{total} 条{icon}</b><small>{chs}</small></div>'",
     "f'<div class=\"fact\"><span>会话与提问</span><b class=\"num\">{total} 次{icon}</b><small>{chs}</small></div>'"),
    ('        "规划推荐型": "先用千问明确资金金额、投资期限、收益目标与提醒需求",', '        "规划推荐型": "先用豆包明确资金金额、投资期限、收益目标与提醒需求",'),
    ("    who = f'千问用户 #{u[\"letter\"]} · {esc(u.get(\"surname\") or \"\")}{gender} · {age}'", "    who = f'豆包用户 #{u[\"letter\"]} · {esc(u.get(\"surname\") or \"\")}{gender} · {age}'"),
    ("        tags.append(f'<span class=\"tag\">千问绑定 {fmt_badge_date(u[\"fb\"])}</span>')", "        tags.append(f'<span class=\"tag\">豆包绑定 {fmt_badge_date(u[\"fb\"])}</span>')"),
    # 矩阵
    ("  <td class=\"num\">{len(u[\"asks\"])}</td>\n  <td class=\"wrap\">{dev_txt}</td>",
     "  <td class=\"num\">{int((u.get(\"channels\") or {}).get(\"doubao_sessions\") or 0)} / {len(u[\"asks\"])}</td>\n  <td class=\"wrap\">{dev_txt}</td>"),
    ("<th>风测</th><th>提问</th><th>下单终端</th>", "<th>风测</th><th title=\"豆包会话令牌次数 / 且慢 App 小顾提问条数\">豆包会话 / 提问</th><th>下单终端</th>"),
    # 汇总卡
    ("    # 决策时长：绑定千问 → 第一笔入金；无入金记录的用户不进入时长计算。", "    # 决策时长：绑定豆包 → 第一笔入金；无入金记录的用户不进入时长计算。"),
    ("  <div class=\"cell\"><b>{a[\"asks\"]:,}</b><span>提问数</span><em>人均 {ask_avg:.1f} 问 · 中位数 {ask_med_txt} 问</em></div>\n  <div class=\"cell decision\" title=\"绑定千问到第一笔入金",
     "  <div class=\"cell\"><b>{a[\"sessions\"]:,}</b><span>豆包会话</span><em>且慢小顾提问 {a[\"asks\"]:,} 条 · 豆包侧无提问文本</em></div>\n  <div class=\"cell decision\" title=\"绑定豆包到第一笔入金"),
    # 洞察：提问量指标换成会话令牌，并补一条口径判断
    ("_max_ask_user = max(_new_users, key=lambda u: len(u.get(\"asks\") or []), default=None)\n_max_ask_share = (len(_max_ask_user.get(\"asks\") or []) / Z[\"asks\"] * 100) if _max_ask_user and Z[\"asks\"] else 0\n",
     "_tok_n = lambda u: int((u.get(\"channels\") or {}).get(\"doubao_sessions\") or 0)\n_max_ask_user = max(_new_users, key=_tok_n, default=None)\n_max_ask_share = (_tok_n(_max_ask_user) / Z[\"sessions\"] * 100) if _max_ask_user and Z[\"sessions\"] else 0\n"),
    ("     f'两例合计贡献 {_top_two_inflow_share:.1f}% 入金，成效高度集中。') if _big_new and _big_recall else '',\n]",
     "     f'两例合计贡献 {_top_two_inflow_share:.1f}% 入金，成效高度集中。') if _big_new and _big_recall else '',\n"
     "    '<b>判断</b>豆包侧只能观察 OAuth 会话令牌、看不到提问内容，会话频次不能当作转化强度的代理；现有数据证明的是“绑定后发生转化”，不能单独归因为豆包增量。',\n]"),
    # 会话弹窗数据
    ("    rows = [{\"ts\": a[\"ts\"][:19], \"text\": a[\"text\"], \"ch\": \"千问\"} for a in u[\"asks\"]]\n",
     "    rows = [{\"ts\": a[\"ts\"][:19], \"text\": a[\"text\"], \"ch\": \"且慢\", \"via\": \"App 小顾\"} for a in u[\"asks\"]]\n"
     "    fb0 = dt(u[\"fb\"])\n    for x in (u.get(\"channels\") or {}).get(\"tokens\", []):\n        t = dt(x)\n        if t and t >= fb0:\n            rows.append({\"ts\": t.strftime(\"%Y-%m-%dT%H:%M:%S\"), \"text\": \"授权当刻建立会话\" if (t - fb0).total_seconds() <= 120 else \"回到豆包发起会话（提问内容协议层不可得）\", \"ch\": \"豆包\"})\n"),
    # 合作 Logo 取自豆包主看板
    ('main_dashboard = Path(__file__).resolve().parents[2] / "public/reports/qianwen-user-acquisition-dashboard/index.html"',
     f'main_dashboard = Path(__file__).resolve().parents[2] / "public/reports/{SLUG_MAIN}/index.html"'),
    ('    raise RuntimeError("未能从主看板读取千问 × 且慢合作 Logo")', '    raise RuntimeError("未能从主看板读取豆包 × 且慢合作 Logo")'),
    # 页面壳
    ("<title>千问用户转化分析｜截至 {CUT[:10]}</title>", "<title>豆包用户转化分析｜截至 {CUT[:10]}</title>"),
    ('<span class="cobrand-text">QIANWEN × QIEMAN AI · CASE EXPLORER</span>', '<span class="cobrand-text">DOUBAO × QIEMAN AI · CASE EXPLORER</span>'),
    ('<a class="dashboard-link" href="../qianwen-user-acquisition-dashboard/" title="返回千问引流数据分析主看板" aria-label="返回千问引流数据分析主看板">',
     f'<a class="dashboard-link" href="../{SLUG_MAIN}/" title="返回豆包引流数据分析主看板" aria-label="返回豆包引流数据分析主看板">'),
    ("    <h1>千问用户转化分析</h1>", "    <h1>豆包用户转化分析</h1>"),
    ('<footer>千问 X 且慢AI小顾 · 绑定用户个例分析台 · 生成于 {META["generated"]} · <a href="../qianwen-user-acquisition-dashboard/">返回用户数据看板</a></footer>',
     f'<footer>豆包 X 且慢AI小顾 · 绑定用户个例分析台 · 生成于 {{META["generated"]}} · <a href="../{SLUG_MAIN}/">返回用户数据看板</a></footer>'),
    ("const askChannels=['千问','且慢','微信'];", "const askChannels=['豆包','且慢','微信'];"),
    ("d.textContent=asksChannel ? `该用户没有${{asksChannel}}渠道的提问记录。` : '该用户在千问、且慢、微信三端都没有向小顾提问（千问会话已创建但零输入）。';",
     "d.textContent=asksChannel ? `该用户没有${{asksChannel}}渠道的记录。` : '该用户在豆包、且慢、微信三端都没有会话或提问记录。';"),
], "build-cases.py")
# 弹窗标题类文案（锚点若不存在则跳过，不是硬性要求）
for a, b in [
    ('"网页端（微信 / 千问内嵌页）"', '"网页端（微信 / 豆包内嵌页）"'),
    ('<h3 id="asks-title">提问历程</h3>', '<h3 id="asks-title">会话与提问历程</h3>'),
    ("document.getElementById('asks-title').textContent=`用户 ${{u.letter}} 的小顾对话`;", "document.getElementById('asks-title').textContent=`用户 ${{u.letter}} 的会话与提问`;"),
    ("b.title=spec[0] ? `只看${{spec[1]}}提问` : '查看全部渠道提问';", "b.title=spec[0] ? `只看${{spec[1]}}记录` : '查看全部渠道记录';"),
]:
    if s.count(a) == 1:
        s = s.replace(a, b)
left = [l for l in s.splitlines() if ("千问" in l or "qianwen" in l.lower()) and "is_qwen" not in l and "derive-from-qianwen" not in l]
if left:
    sys.exit("build-cases.py 仍有千问残留：\n" + "\n".join(left[:8]))
(D / "build-cases.py").write_text(s)
print("派生完成：", ", ".join(p.name for p in sorted(D.iterdir()) if p.suffix in (".py", ".mjs", ".css")))
