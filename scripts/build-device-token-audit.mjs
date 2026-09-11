#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, "public/reports/personal-ai-token-usage-audit-2026-09-10");
const companySnapshotPath = path.join(reportDir, "company-device-snapshot.json");
const personalSnapshotPath = process.argv[2];

if (!personalSnapshotPath) {
  throw new Error("Usage: node scripts/build-device-token-audit.mjs <personal-device-snapshot.json>");
}

const auditPath = path.join(reportDir, "audit-data.json");
if (!fs.existsSync(companySnapshotPath)) {
  const current = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  if (!current.ytdVisible?.platforms || !current.daily) {
    throw new Error("Current audit-data.json is not the original single-device snapshot.");
  }
  fs.writeFileSync(companySnapshotPath, `${JSON.stringify(current, null, 2)}\n`);
}

const company = JSON.parse(fs.readFileSync(companySnapshotPath, "utf8"));
const personal = JSON.parse(fs.readFileSync(personalSnapshotPath, "utf8"));

const platformDefs = [
  { key: "claude", name: "Claude", color: "#a78bfa" },
  { key: "codex", name: "Codex", color: "#34d399" },
  { key: "cursor", name: "Cursor", color: "#fb7185" },
  { key: "yinmiwork", name: "YinmiWork", color: "#fbbf24" },
  { key: "workbuddy", name: "WorkBuddy", color: "#38bdf8" },
  { key: "kiro", name: "Kiro", color: "#f97316" },
];

const deviceDefs = [
  { key: "company", name: "公司电脑", color: "#8b5cf6", attribution: "device-local" },
  { key: "personal", name: "个人电脑", color: "#10b981", attribution: "device-local" },
  { key: "shared", name: "账号共享 / 不可归因", color: "#f43f5e", attribution: "account-level" },
];

const zero = () => ({ total: 0, newContent: 0, reusedContent: 0, modelGenerated: 0 });
const normalize = (item = {}) => ({
  total: Number(item.total || 0),
  newContent: Number(item.newContent ?? item.fresh ?? 0),
  reusedContent: Number(item.reusedContent ?? item.cached ?? 0),
  modelGenerated: Number(item.modelGenerated ?? item.output ?? 0),
});
const plus = (items) => items.reduce((sum, item) => {
  const value = normalize(item);
  sum.total += value.total;
  sum.newContent += value.newContent;
  sum.reusedContent += value.reusedContent;
  sum.modelGenerated += value.modelGenerated;
  return sum;
}, zero());

const companyPlatforms = Object.fromEntries(
  ["claude", "codex", "yinmiwork", "workbuddy"].map((key) => [key, normalize(company.ytdVisible.platforms[key])]),
);
const personalPlatforms = Object.fromEntries(
  ["claude", "codex", "workbuddy", "kiro"].map((key) => [key, normalize(personal.platforms[key]?.summary)]),
);
const sharedPlatforms = { cursor: normalize(company.ytdVisible.platforms.cursor) };

const deviceSummaries = {
  company: plus(Object.values(companyPlatforms)),
  personal: plus(Object.values(personalPlatforms)),
  shared: plus(Object.values(sharedPlatforms)),
};
const globalSummary = plus(Object.values(deviceSummaries));
const undated = {
  total: personalPlatforms.kiro.total,
  items: [
    {
      device: "personal",
      platform: "kiro",
      total: personalPlatforms.kiro.total,
      window: personal.platforms.kiro.visibleWindow,
      reason: "Local Kiro token file has totals but no event timestamps.",
    },
  ],
};

const series = [
  ["company", "claude"],
  ["company", "codex"],
  ["company", "yinmiwork"],
  ["company", "workbuddy"],
  ["personal", "claude"],
  ["personal", "codex"],
  ["personal", "workbuddy"],
  ["shared", "cursor"],
].map(([device, platform]) => ({ key: `${device}_${platform}`, device, platform }));

const startDay = "2026-01-01";
const endDay = [company.through, personal.through].sort().at(-1);
const dates = [];
for (let cursor = new Date(`${startDay}T00:00:00Z`); cursor <= new Date(`${endDay}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
  dates.push(cursor.toISOString().slice(0, 10));
}
const companyByDay = new Map(company.daily.map((row) => [row.day, row]));

const daily = dates.map((day) => {
  const source = companyByDay.get(day) || {};
  const values = {};
  for (const item of series) {
    if (item.device === "company") values[item.key] = Number(source[item.platform] || 0);
    if (item.device === "shared") values[item.key] = Number(source[item.platform] || 0);
    if (item.device === "personal") values[item.key] = Number(personal.platforms[item.platform]?.daily?.[day]?.total || 0);
  }
  return {
    day,
    values,
    observable: {
      company: day >= company.observedFrom,
      personal: day >= personal.observedFrom,
      shared: day >= "2026-07-27",
    },
  };
});

const platformSummaries = Object.fromEntries(platformDefs.map(({ key }) => [
  key,
  plus([
    companyPlatforms[key],
    personalPlatforms[key],
    sharedPlatforms[key],
  ].filter(Boolean)),
]));

const dailyTotal = (row) => Object.values(row.values).reduce((sum, value) => sum + value, 0);
const visibleRows = daily.filter((row) => row.day >= personal.observedFrom);
const peak = visibleRows.reduce((best, row) => dailyTotal(row) > dailyTotal(best) ? row : best, visibleRows[0]);
const top5Total = visibleRows.map(dailyTotal).sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
const activeDays = visibleRows.filter((row) => dailyTotal(row) > 0).length;
const multiDeviceRows = visibleRows.filter((row) => {
  const devices = deviceDefs.filter((device) => series.some((item) => item.device === device.key && row.values[item.key] > 0));
  return devices.length >= 2;
});
const datedTotal = visibleRows.reduce((sum, row) => sum + dailyTotal(row), 0);

const reportData = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  timezone: "Asia/Shanghai",
  through: endDay,
  observedFrom: personal.observedFrom,
  coverage: {
    company: { observedFrom: company.observedFrom, snapshotAt: company.generatedAt },
    personal: { observedFrom: personal.observedFrom, snapshotAt: personal.generatedAt },
    shared: { observedFrom: "2026-07-27", note: "Cursor official account-level usage; not device-attributable." },
  },
  definitions: company.definitions,
  platforms: platformDefs,
  devices: deviceDefs,
  series,
  daily,
  summaries: {
    global: globalSummary,
    devices: deviceSummaries,
    platforms: platformSummaries,
    datedTotal,
    undatedTotal: undated.total,
  },
  devicePlatformMatrix: {
    company: companyPlatforms,
    personal: personalPlatforms,
    shared: sharedPlatforms,
  },
  behavior: {
    activeDays,
    top5DaysShare: top5Total / datedTotal,
    multiDeviceDays: multiDeviceRows.length,
    multiDeviceVolumeShare: multiDeviceRows.reduce((sum, row) => sum + dailyTotal(row), 0) / datedTotal,
    peak: { day: peak.day, total: dailyTotal(peak), values: peak.values },
  },
  undated,
  inheritedAnalysis: {
    pricing: company.pricing,
    sameModelComparison: company.sameModelComparison,
    frozenMonth: company.frozenMonth,
    note: "Inherited from the original company-computer snapshot; not recomputed for the personal computer.",
  },
  audit: {
    companyLocalSnapshotTotal: deviceSummaries.company.total,
    personalLocalSnapshotTotal: deviceSummaries.personal.total,
    sharedAccountTotal: deviceSummaries.shared.total,
    reconciliation: {
      codexScreenshotApprox: 9_670_000_000,
      personalCodexLocal: personalPlatforms.codex.total,
      coverageRatio: personalPlatforms.codex.total / 9_670_000_000,
      warning: "The screenshot's scope is not independently documented; similarity supports correspondence but does not prove account-wide or device-wide completeness.",
    },
    excludedInstalledClients: [
      { name: "ChatGPT / Atlas", status: "missing", reason: "No reliable local token telemetry." },
      { name: "Claude Desktop", status: "missing", reason: "Desktop storage does not expose auditable token totals; Claude Code on personal computer has zero measurable tokens." },
      { name: "Trae", status: "missing", reason: "Local database is proprietary/encrypted; no auditable token fields found." },
    ],
  },
};

const fmt = (value, digits = 2) => {
  const x = Number(value || 0);
  if (x >= 1e9) return `${(x / 1e9).toFixed(digits).replace(/\.00$/, "")}B`;
  if (x >= 1e6) return `${(x / 1e6).toFixed(digits).replace(/\.00$/, "")}M`;
  if (x >= 1e3) return `${(x / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return Math.round(x).toLocaleString("zh-CN");
};
const pct = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const cacheRatio = globalSummary.reusedContent / Math.max(1, globalSummary.total - globalSummary.modelGenerated);
const personalShare = deviceSummaries.personal.total / globalSummary.total;
const companyShare = deviceSummaries.company.total / globalSummary.total;
const sharedShare = deviceSummaries.shared.total / globalSummary.total;
const codexCoverage = reportData.audit.reconciliation.coverageRatio;

const matrixRows = [
  ["公司电脑", "Claude", companyPlatforms.claude, "设备本地日志", "confirmed"],
  ["公司电脑", "Codex", companyPlatforms.codex, "设备本地日志", "confirmed"],
  ["公司电脑", "YinmiWork", companyPlatforms.yinmiwork, "设备本地 runtime", "confirmed"],
  ["公司电脑", "WorkBuddy", companyPlatforms.workbuddy, "设备本地 rawUsage", "confirmed"],
  ["个人电脑", "Codex", personalPlatforms.codex, "80,024 次可计量事件", "confirmed"],
  ["个人电脑", "WorkBuddy", personalPlatforms.workbuddy, "859 次去重事件", "confirmed"],
  ["个人电脑", "Kiro", personalPlatforms.kiro, "5 条无日期 Token 记录", "inferred"],
  ["个人电脑", "Claude Code", personalPlatforms.claude, "发现 1 条 usage 事件但 Token 为 0", "confirmed"],
  ["账号共享", "Cursor", sharedPlatforms.cursor, "官方账号级接口；不可拆设备", "missing"],
];

const matrixHtml = matrixRows.map(([device, platform, value, source, status]) => `
  <tr><td><strong>${device}</strong></td><td>${platform}</td><td class="num strong">${fmt(value.total)}</td><td class="num">${fmt(value.newContent)}</td><td class="num">${fmt(value.reusedContent)}</td><td class="num">${fmt(value.modelGenerated)}</td><td>${source}</td><td><span class="status ${status === "confirmed" ? "ok" : status === "inferred" ? "warn" : "risk"}">${status === "confirmed" ? "已确认" : status === "inferred" ? "部分可归因" : "设备缺失"}</span></td></tr>`).join("");

const platformRows = platformDefs.map((platform) => {
  const value = platformSummaries[platform.key];
  const share = value.total / globalSummary.total;
  const devices = Object.entries(reportData.devicePlatformMatrix)
    .filter(([, values]) => values[platform.key]?.total)
    .map(([key]) => deviceDefs.find((device) => device.key === key)?.name)
    .join("、") || "—";
  return `<tr><td><span class="dot" style="--c:${platform.color}"></span><strong>${platform.name}</strong></td><td class="num strong">${fmt(value.total)}</td><td class="num">${pct(share)}</td><td>${devices}</td></tr>`;
}).join("");

const dataForHtml = JSON.stringify({
  daily: reportData.daily,
  series: reportData.series,
  devices: reportData.devices,
  platforms: reportData.platforms,
  minDay: startDay,
  maxDay: endDay,
  observedFrom: personal.observedFrom,
  coverage: reportData.coverage,
  undatedTotal: undated.total,
}).replace(/</g, "\\u003c");

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="公司与个人电脑 AI Token 使用量，按平台和设备可筛选、可追溯"><title>双设备 AI Token 使用看板｜平台 × 设备</title>
<style>
:root{--bg:#07101d;--panel:#0f1c2d;--panel2:#14243a;--text:#f3f7fb;--muted:#9eb0c5;--line:#2b4057;--paper:#f4f7fb;--ink:#142235;--sub:#60748a;--green:#10b981;--purple:#8b5cf6;--rose:#f43f5e;--amber:#f59e0b;--cyan:#0ea5e9}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;line-height:1.62}a{color:inherit}.skip{position:absolute;left:-999px;top:8px;background:#fff;color:#111;padding:8px;z-index:99}.skip:focus{left:8px}.wrap{max-width:1240px;margin:auto;padding:0 26px}.hero{padding:62px 0 44px;background:radial-gradient(circle at 15% 0,#134c53 0,transparent 33%),radial-gradient(circle at 90% 4%,#3b2462 0,transparent 30%)}.eyebrow{display:inline-flex;gap:8px;align-items:center;padding:6px 12px;border:1px solid #3a536d;border-radius:999px;color:#bfd0e1;font-size:13px;letter-spacing:.06em}.pulse{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 14px #4ade80}h1,h2,h3{font-family:"Songti SC","STSong",serif}h1{font-size:clamp(40px,6vw,72px);line-height:1.03;letter-spacing:-.052em;margin:22px 0 16px;max-width:1020px}h2{font-size:34px;line-height:1.18;letter-spacing:-.03em;margin:0 0 10px}h3{font-size:21px;margin:0 0 8px}.lead{max-width:940px;font-size:20px;color:#c2d1df}.meta{display:flex;gap:15px;flex-wrap:wrap;color:var(--muted);font-size:14px;margin-top:23px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:28px}.kpi{padding:20px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(145deg,var(--panel2),var(--panel));min-height:140px}.kpi .label{font-size:13px;color:var(--muted)}.kpi .value{font-size:34px;font-weight:850;letter-spacing:-.045em;margin:8px 0 3px}.kpi .sub{font-size:13px;color:#afc0d0}.section{padding:44px 0}.light{background:var(--paper);color:var(--ink)}.intro{max-width:980px;color:var(--muted);margin:0 0 22px}.light .intro{color:var(--sub)}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card,.insight{border-radius:20px;padding:23px;min-width:0}.card{background:var(--panel);border:1px solid var(--line)}.light .card,.insight{background:#fff;border:1px solid #dce6ef;color:var(--ink);box-shadow:0 12px 30px rgba(31,53,77,.055)}.device-card{position:relative;overflow:hidden}.device-card:before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:var(--c)}.device-value{font-size:38px;font-weight:850;letter-spacing:-.045em;margin:8px 0}.tag{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:12px;background:#e9f1f7;color:#4c657e;margin-bottom:11px}.tag.good{background:#dcfce7;color:#166534}.tag.attn{background:#fff0d5;color:#91480a}.tag.risk{background:#ffe4e6;color:#9f1239}.callout{border-left:4px solid var(--cyan);background:#10263a;border-radius:0 14px 14px 0;padding:16px 18px;color:#d1e1ef}.light .callout{background:#e8f4fb;color:#25465f}.callout strong{color:#fff}.light .callout strong{color:#15334d}.formula{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:10px;align-items:stretch}.term{border:1px solid #dce6ef;border-radius:18px;padding:20px;background:#fff}.term .big{font-size:27px;font-weight:850}.term p,.muted{font-size:13px;color:#63768b;margin:6px 0 0}.op{display:grid;place-items:center;font-size:25px;color:#8395a7}.chart-shell,.heatmap-shell{background:#fff;border:1px solid #dce6ef;border-radius:22px;padding:20px;color:var(--ink);box-shadow:0 18px 44px rgba(25,48,73,.08)}.heatmap-shell{margin-top:16px}.controls,.filter-row,.chart-head,.heatmap-head{display:flex;align-items:center;justify-content:space-between;gap:13px;flex-wrap:wrap}.filter-row{justify-content:flex-start;margin-top:13px}.filter-label{font-size:12px;color:#6b7f94;width:66px}.seg,.presets,.checks{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.button,.check{appearance:none;border:1px solid #ced9e4;background:#f6f8fb;color:#40566d;border-radius:10px;padding:8px 11px;font:inherit;font-size:13px;cursor:pointer}.button.active{background:#12233a;color:#fff;border-color:#12233a}.check{display:flex;align-items:center;gap:7px}.check input{accent-color:var(--c)}.datebox{display:flex;align-items:center;gap:7px;font-size:13px;color:#60748a}.datebox input{border:1px solid #ced9e4;border-radius:9px;padding:7px;background:white;color:#21364a}.chart-head{align-items:end;margin:20px 0 8px}.chart-total{font-size:30px;font-weight:850}.chart-note{color:#667b90;font-size:13px}.chart{width:100%;height:390px;display:block}.chart text,.activity-heatmap text{font-family:inherit;fill:#6f8296;font-size:11px}.chart .grid{stroke:#e0e7ee}.chart .unknown{fill:#e7edf3}.chart .boundary{stroke:#8fa1b3;stroke-dasharray:5 4}.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#60748a;margin-top:8px}.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--c);margin-right:5px}.tooltip{position:fixed;pointer-events:none;display:none;background:#07101d;color:#fff;border:1px solid #3c5269;padding:10px 12px;border-radius:10px;font-size:12px;z-index:50;box-shadow:0 14px 34px rgba(0,0,0,.25);max-width:280px}.table-wrap{overflow:auto;border:1px solid #dce6ef;border-radius:18px;background:#fff;color:var(--ink)}table{border-collapse:collapse;width:100%;min-width:920px}th,td{padding:13px 14px;border-bottom:1px solid #e5ecf3;text-align:left;vertical-align:top}th{font-size:12px;color:#64788d;background:#f7f9fb;letter-spacing:.035em;position:sticky;top:0}td{font-size:14px}tr:last-child td{border-bottom:0}.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.strong{font-weight:850}.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--c);margin-right:8px}.status{display:inline-flex;padding:3px 8px;border-radius:999px;font-size:12px}.status.ok{background:#dcfce7;color:#166534}.status.warn{background:#fef3c7;color:#92400e}.status.risk{background:#ffe4e6;color:#9f1239}.source-list{margin:0;padding-left:20px}.source-list li{margin:7px 0}.download{display:inline-flex;text-decoration:none;border:1px solid #aec0d1;border-radius:10px;padding:8px 12px;margin-top:10px}.heatmap-kpis{display:grid;grid-template-columns:1.45fr repeat(4,1fr);gap:1px;background:#e0e7ee;border:1px solid #e0e7ee;border-radius:15px;overflow:hidden;margin:17px 0}.heatmap-kpis>div{background:#f8fafc;padding:13px}.heatmap-kpis span{display:block;color:#708399;font-size:12px}.heatmap-kpis strong{display:block;font-size:20px;margin-top:3px}.activity-heatmap{display:block;width:100%;height:235px;overflow:visible}.footer{padding:28px 0;border-top:1px solid #213349;color:#8295a8;font-size:13px}@media(max-width:930px){.kpis,.grid3{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}.formula{grid-template-columns:1fr}.op{height:22px}.chart{height:330px}.heatmap-kpis{grid-template-columns:repeat(2,1fr)}.heatmap-kpis>div:first-child{grid-column:1/-1}}@media(max-width:620px){.wrap{padding:0 17px}.hero{padding-top:44px}.kpis,.grid3{grid-template-columns:1fr}.kpi{min-height:0}.section{padding:34px 0}.chart-shell,.heatmap-shell{padding:12px}.chart{height:300px}.datebox{width:100%;overflow:auto}.filter-label{width:100%}.device-value{font-size:32px}h2{font-size:28px}.activity-heatmap{height:215px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}@media print{.controls,.filter-row,.download{display:none}.section{break-inside:avoid}}
</style><link rel="stylesheet" href="platform-plan-dashboard.css"></head><body><a class="skip" href="#main">跳到主要内容</a>
<header class="hero"><div class="wrap"><div class="eyebrow"><span class="pulse"></span>DEVICE-AWARE USAGE AUDIT · 2026</div><h1>双设备 AI Token 使用看板</h1><p class="lead">公司电脑与个人电脑已合并，但不混账：每一笔可计量 Token 都标记平台与设备；Cursor 账号级数据单列，避免跨设备重复累计。</p><div class="meta"><span>范围：2026-01-01 — ${endDay}</span><span>最早本地可见：${personal.observedFrom}</span><span>时区：Asia/Shanghai</span><span>公开脱敏版</span></div><div class="kpis"><div class="kpi"><div class="label">双设备可见总量</div><div class="value">${fmt(globalSummary.total)}</div><div class="sub">含 ${fmt(undated.total)} Kiro 无日期记录</div></div><div class="kpi"><div class="label">个人电脑</div><div class="value">${fmt(deviceSummaries.personal.total)}</div><div class="sub">占 ${pct(personalShare)} · 新增同步完成</div></div><div class="kpi"><div class="label">公司电脑</div><div class="value">${fmt(deviceSummaries.company.total)}</div><div class="sub">占 ${pct(companyShare)} · 不含账号共享 Cursor</div></div><div class="kpi"><div class="label">账号共享 / 不可归因</div><div class="value">${fmt(deviceSummaries.shared.total)}</div><div class="sub">占 ${pct(sharedShare)} · Cursor 只计一次</div></div></div></div></header>
<main id="main">
<section class="section light"><div class="wrap"><h2>先把设备账分清</h2><p class="intro">最重要的变化不是总量从 3.752B 变成 ${fmt(globalSummary.total)}，而是新增了设备归属。设备本地日志进入对应电脑；只有账号级接口的 Cursor 放进“共享 / 不可归因”，不会因两台电脑都登录而翻倍。</p><div class="grid3"><div class="insight device-card" style="--c:#8b5cf6"><span class="tag good">confirmed · 本地</span><h3>公司电脑</h3><div class="device-value">${fmt(deviceSummaries.company.total)}</div><p>Claude、Codex、YinmiWork、WorkBuddy。原报告已统计，现统一改为公司设备标签。</p></div><div class="insight device-card" style="--c:#10b981"><span class="tag good">confirmed · 本地</span><h3>个人电脑</h3><div class="device-value">${fmt(deviceSummaries.personal.total)}</div><p>Codex ${fmt(personalPlatforms.codex.total)}、WorkBuddy ${fmt(personalPlatforms.workbuddy.total)}、Kiro ${fmt(personalPlatforms.kiro.total)}；Claude Code 无可计量 Token。</p></div><div class="insight device-card" style="--c:#f43f5e"><span class="tag risk">missing · 设备归属</span><h3>账号共享</h3><div class="device-value">${fmt(deviceSummaries.shared.total)}</div><p>Cursor 官方用量是账号级，不提供设备字段。总量可靠，哪台电脑产生目前无法确认。</p></div></div><div class="callout" style="margin-top:17px"><strong>关键判断：</strong> 个人电脑贡献 ${pct(personalShare)} 的当前可见总量，是主力设备；公司电脑贡献 ${pct(companyShare)}。Cursor ${pct(sharedShare)} 只能算账号共享，不能强行摊到任一设备。</div></div></section>
<section class="section light" style="padding-top:0"><div class="wrap"><h2>Token 口径仍保持一致</h2><p class="intro">总量 = 新内容 + 复用内容 + 模型生成。输入 Token 已包含复用部分，因此先拆开再相加，避免把缓存重复算两次。</p><div class="formula"><div class="term"><span class="tag">新内容</span><div class="big">${fmt(globalSummary.newContent)}</div><p>首次处理的输入与缓存写入。</p></div><div class="op">＋</div><div class="term"><span class="tag">复用内容</span><div class="big">${fmt(globalSummary.reusedContent)}</div><p>缓存读取；占可分辨输入 ${pct(cacheRatio)}。</p></div><div class="op">＋</div><div class="term"><span class="tag">模型生成</span><div class="big">${fmt(globalSummary.modelGenerated)}</div><p>模型输出；推理 Token 已包含。</p></div><div class="op">＝</div><div class="term"><span class="tag good">总调用量</span><div class="big">${fmt(globalSummary.total)}</div><p>两台设备本地量 + 账号共享量（只计一次）。</p></div></div></div></section>
<section class="section light" style="padding-top:0"><div class="wrap"><h2>按设备和平台筛选趋势</h2><p class="intro">先选设备，再选平台；每日、累计与热力图联动。Kiro 的 ${fmt(undated.total)} 只有总量、没有事件日期，因此在设备总量中保留，但不塞进任意一天。</p><div class="chart-shell"><div class="controls"><div class="seg"><button class="button active" data-mode="daily">每日调用</button><button class="button" data-mode="cumulative">累计调用</button></div><div class="presets"><button class="button" data-preset="7">近 7 天</button><button class="button active" data-preset="30">近 30 天</button><button class="button" data-preset="month">本月</button><button class="button" data-preset="ytd">今年以来</button><button class="button" data-preset="visible">全部可见</button></div><div class="datebox"><input id="startDate" type="date" min="${startDay}" max="${endDay}" aria-label="开始日期"><span>至</span><input id="endDate" type="date" min="${startDay}" max="${endDay}" aria-label="结束日期"></div></div><div class="filter-row"><span class="filter-label">设备</span><div class="checks" id="deviceChecks">${deviceDefs.map((device) => `<label class="check" style="--c:${device.color}"><input type="checkbox" value="${device.key}" checked><span class="dot" style="--c:${device.color}"></span>${device.name}</label>`).join("")}</div></div><div class="filter-row"><span class="filter-label">平台</span><div class="checks" id="platformChecks">${platformDefs.map((platform) => `<label class="check" style="--c:${platform.color}"><input type="checkbox" value="${platform.key}" checked><span class="dot" style="--c:${platform.color}"></span>${platform.name}</label>`).join("")}</div></div><div class="chart-head"><div><div class="chart-note" id="chartCaption">—</div><div class="chart-total" id="chartTotal">—</div></div><div class="chart-note" id="chartHint">—</div></div><svg class="chart" id="usageChart" role="img" aria-label="按设备和平台筛选的 AI Token 趋势图"></svg><div class="legend">${deviceDefs.map((device) => `<span><i style="--c:${device.color}"></i>${device.name}</span>`).join("")}</div><div class="chart-note" id="coverageNote"></div></div><div class="heatmap-shell"><div class="heatmap-head"><div><h3>Token 活动热力图</h3><div class="chart-note" id="heatmapCaption">与上方选择联动</div></div><div class="chart-note">颜色按当前选择内单日峰值归一</div></div><div class="heatmap-kpis"><div><span>选择范围总量</span><strong id="heatmapTotal">—</strong></div><div><span>峰值</span><strong id="heatmapPeak">—</strong></div><div><span>活跃日</span><strong id="heatmapActive">—</strong></div><div><span>当前连续</span><strong id="heatmapCurrent">—</strong></div><div><span>最长连续</span><strong id="heatmapLongest">—</strong></div></div><svg class="activity-heatmap" id="activityHeatmap" role="img" aria-label="双设备 AI Token 活动热力图"></svg></div></div></section>
<section class="section"><div class="wrap"><h2>设备 × 平台明细</h2><p class="intro">这张表是设备归属的单一事实源。Cursor 的 Token 总量保留，但设备状态明确标为缺失；Kiro 总量已确认，具体日期缺失。</p><div class="table-wrap"><table><thead><tr><th>设备</th><th>平台</th><th class="num">可见总量</th><th class="num">新内容</th><th class="num">复用内容</th><th class="num">模型生成</th><th>来源 / 事件</th><th>归因状态</th></tr></thead><tbody>${matrixHtml}</tbody></table></div></div></section>
<section class="section light"><div class="wrap"><h2>平台结构：Codex 占八成</h2><p class="intro">加入个人电脑后，平台结构被重新认识：Codex 合计 ${fmt(platformSummaries.codex.total)}，是明确的第一主力；Claude 居第二，Cursor 是无法拆设备的账号级补充。</p><div class="grid2"><div class="table-wrap"><table style="min-width:620px"><thead><tr><th>平台</th><th class="num">可见总量</th><th class="num">占比</th><th>设备归属</th></tr></thead><tbody>${platformRows}</tbody></table></div><div class="card"><h3>这次同步改写了什么</h3><ul class="source-list"><li>个人电脑新增 <strong>${fmt(deviceSummaries.personal.total)}</strong>，其中 Codex 占 ${pct(personalPlatforms.codex.total / deviceSummaries.personal.total)}。</li><li>两台电脑可归因本地量合计 <strong>${fmt(deviceSummaries.company.total + deviceSummaries.personal.total)}</strong>。</li><li>Cursor <strong>${fmt(deviceSummaries.shared.total)}</strong> 从“本机”纠正为“账号共享 / 设备缺失”。</li><li>Kiro 的 <strong>${fmt(undated.total)}</strong> 进入总量，不进入日趋势。</li></ul><div class="callout"><strong>不要用 Token 判断产出：</strong> 高占比主要反映长上下文和 Agent 循环。下一步应把设备 / 平台用量与交付物、返工和耗时关联。</div></div></div></div></section>
<section class="section" id="plan-analysis"><div class="wrap"><h2>五个平台套餐与额度驾驶舱</h2><p class="intro">这部分沿用公司电脑既有套餐快照：本地账号元数据确认方案，本地或登录态快照确认用量，官方规则解释计量与重置。它不把个人电脑新增 Token 反推成额度；没有额度分母的地方不画假进度条。</p><div id="platformPlanDashboard"><div class="plan-overview"><div><span>已知固定月费</span><strong>US$400–500</strong><small>另加 WorkBuddy 未知；不含税与额外用量</small></div><div><span>完整账期可核验</span><strong>1 / 5</strong><small>只有 Cursor 暴露起止日、额度与剩余</small></div><div><span>实时限额可核验</span><strong>2 / 5</strong><small>Codex 周窗口 + Cursor 月度双池</small></div><div><span>当前最需关注</span><strong>Cursor</strong><small>76% 用量 vs 63.7% 账期进度</small></div></div><div class="plan-tabs"><button class="plan-tab active" data-platform="all">全部对比</button><button class="plan-tab" data-platform="claude">Claude</button><button class="plan-tab" data-platform="codex">Codex</button><button class="plan-tab" data-platform="cursor">Cursor</button><button class="plan-tab" data-platform="workbuddy">WorkBuddy</button><button class="plan-tab" data-platform="yinmiwork">YinmiWork</button></div><div class="plan-grid" aria-label="五个平台套餐摘要"></div><div class="plan-detail" aria-live="polite"></div><div class="table-wrap plan-matrix"><table><thead><tr><th>平台 / 账号方案</th><th>账单与重置</th><th class="num">公司机冻结近月</th><th class="num">有效 Token</th><th class="num">单位有效成本</th><th>当前额度判断</th><th>结论</th></tr></thead><tbody><tr data-platform="claude"><td><strong>Claude · Max 5x</strong><small>本机确认；US$100/月</small></td><td>5 小时窗口；当前续费日不可见</td><td class="num">1.646B</td><td class="num">49.63M</td><td class="num strong">US$2.01/M</td><td>当前剩余不可见；Extra Usage 已启用</td><td>吞吐性价比最佳，保留</td></tr><tr data-platform="codex"><td><strong>Codex · Pro</strong><small>具体 US$100 / 200 档不可见</small></td><td>周窗口 9 月 15 日 12:00 重置</td><td class="num">1.176B</td><td class="num">33.26M</td><td class="num strong">US$3.01–6.01/M</td><td><span class="status ok">周额度已用 9%</span></td><td>额度宽松，仓库交付主力</td></tr><tr data-platform="cursor"><td><strong>Cursor · Ultra</strong><small>US$200/月；On-demand 关闭</small></td><td>8 月 22 日 — 9 月 22 日</td><td class="num">470.90M</td><td class="num">38.31M</td><td class="num strong">US$5.22/M</td><td><span class="status warn">Included 已用 76%</span></td><td>价值已兑现，但有提前触顶风险</td></tr><tr data-platform="workbuddy"><td><strong>WorkBuddy · 未识别</strong><small>本机只有 Credits 消耗</small></td><td>账号购买日 / 到期日不可见</td><td class="num">8.59M</td><td class="num">782.9K</td><td class="num strong">145.5 Credits/M</td><td>约 113.9 Credits；分母未知</td><td>轻量补充，不扩容</td></tr><tr data-platform="yinmiwork"><td><strong>YinmiWork · 内部账号</strong><small>plan_type 与 credits 未暴露</small></td><td>账期、限额、重置均不可见</td><td class="num">37.57M</td><td class="num">37.57M</td><td class="num strong">不可计算</td><td><span class="unknown-label">可观测性不足</span></td><td>先补计量，再谈性价比</td></tr></tbody></table></div><div class="callout" style="margin-top:16px"><strong>组合结论：</strong> Claude 负责高吞吐大上下文，Codex 负责仓库级落地，Cursor 负责 IDE 闭环；WorkBuddy 与 YinmiWork 维持专项入口。套餐、Credits、内部成本和缓存计价不是同一货币，不能仅按总 Token 排“贵贱”。</div><div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>编号</th><th>账户 / 额度指标</th><th>证据</th><th>状态</th></tr></thead><tbody><tr><td>D-009</td><td>Codex 周额度 9%，2026-09-15 12:00 重置</td><td>公司机最新 token_count.rate_limits</td><td><span class="status ok">已核验</span></td></tr><tr><td>D-010</td><td>Claude Max 5x；Extra Usage 已启用</td><td>公司机 oauthAccount 元数据</td><td><span class="status ok">已核验</span></td></tr><tr><td>D-011</td><td>Cursor Ultra；US$303.82 / US$400，约 76%</td><td>账号级官方用量接口</td><td><span class="status ok">已核验</span></td></tr><tr><td>D-012</td><td>WorkBuddy 约 113.9 Credits；套餐分母未知</td><td>公司机 rawUsage + session_usage</td><td><span class="status warn">部分可见</span></td></tr><tr><td>D-013</td><td>YinmiWork plan / limits / credits 均未上报</td><td>公司机内置 Codex runtime</td><td><span class="status warn">缺失项</span></td></tr></tbody></table></div><a class="download" href="platform-plan-analysis.json" download>下载套餐与额度分析 JSON</a></div></div></section>
<section class="section light" style="padding-top:0"><div class="wrap"><h2>Codex 截图现在基本对上了</h2><p class="intro">原报告中“截图约 96.7 亿、本机仅 11.8 亿”的缺口，加入个人电脑后得到解释：个人电脑 Codex 可恢复 ${fmt(personalPlatforms.codex.total)}，覆盖截图近似值的 ${pct(codexCoverage)}。</p><div class="grid3"><div class="insight"><span class="tag good">confirmed</span><h3>个人机 Codex</h3><div class="device-value">${fmt(personalPlatforms.codex.total)}</div><p>来自 1,113 个会话文件、80,024 次可计量事件。</p></div><div class="insight"><span class="tag attn">inferred</span><h3>截图近似值</h3><div class="device-value">9.67B</div><p>两者相差约 ${fmt(9_670_000_000 - personalPlatforms.codex.total)}；高度吻合说明截图主要对应个人机历史，但不证明统计绝对完整。</p></div><div class="insight"><span class="tag risk">missing</span><h3>公司机是否含于截图</h3><div class="device-value">未知</div><p>截图没有设备范围字段，因此公司机 ${fmt(companyPlatforms.codex.total)} 仍按独立本地来源保留，不拿截图做跨设备去重依据。</p></div></div></div></section>
<section class="section"><div class="wrap"><h2>行为判断与下一步</h2><div class="grid3"><div class="insight"><span class="tag good">事实</span><h3>个人电脑是主力</h3><p>${pct(personalShare)} 的可见用量来自个人电脑，且几乎全部由 Codex 贡献。设备治理和上下文清理应优先从个人机 Codex 开始。</p></div><div class="insight"><span class="tag attn">事实</span><h3>高峰仍集中</h3><p>双设备可见期 ${activeDays} 个活跃日，前 5 个高峰日贡献 ${pct(reportData.behavior.top5DaysShare)}；${reportData.behavior.multiDeviceDays} 天同时出现至少两类设备来源。</p></div><div class="insight"><span class="tag">建议</span><h3>以后按快照增量同步</h3><p>保留设备键、事件去重键和截止时间。每次只追加新事件；账号级平台只更新共享桶一次，避免两台电脑重复抓取。</p></div></div></div></section>
<section class="section light"><div class="wrap"><h2>数据边界与可审计来源</h2><div class="grid2"><div class="card"><h3>已确认</h3><ul class="source-list"><li>公司电脑：沿用原报告截至 ${company.through} 的四类本地来源。</li><li>个人电脑 Codex：累计 token_count 的 last_token_usage；输入拆为新内容与缓存读取。</li><li>个人电脑 WorkBuddy：providerData.rawUsage，按 messageId 去重。</li><li>个人电脑 Kiro：tokens_generated.jsonl 共 5 条，只有总量。</li><li>Cursor：官方账号级用量接口，总量只计一次。</li></ul></div><div class="card"><h3>缺失 / 不可推出</h3><ul class="source-list"><li>本地日志留存不完整，缺失日期不等于零使用。</li><li>Cursor 无设备字段，不能按公司 / 个人电脑拆分。</li><li>ChatGPT、Claude Desktop、Trae 没有可靠本地 Token 口径，不用会话数估算。</li><li>两台电脑如果手工迁移过同一会话，现有聚合快照无法跨设备按消息 ID 去重。</li><li>Token 吞吐不等于成本、效率或交付质量。</li></ul></div></div><div class="grid2" style="margin-top:16px"><div class="card"><h3>下载脱敏数据</h3><p class="muted">包含设备 × 平台矩阵、逐日序列、口径、证据状态与缺失项；不含账号、密钥、会话正文、主机名和个人路径。</p><a class="download" href="audit-data.json" download>下载 audit-data.json</a></div><div class="card"><h3>自检</h3><ul class="source-list"><li>D-001：全局总量 = 三个设备桶加总。</li><li>D-002：逐日量 + Kiro 无日期量 = 全局总量。</li><li>D-003：Cursor 只出现在共享桶，不在两台设备重复出现。</li><li>D-004：个人机平台汇总 = 本地事件汇总。</li></ul></div></div></div></section>
</main><footer class="footer"><div class="wrap">Clair AI Studio · 数据快照 ${reportData.generatedAt} · 公开脱敏版 · 本地缺失不按 0 解释</div></footer><div class="tooltip" id="tooltip"></div>
<script>const DATA=${dataForHtml};
const NS='http://www.w3.org/2000/svg',q=s=>document.querySelector(s);const state={mode:'daily',start:DATA.daily.at(-30).day,end:DATA.maxDay,platforms:new Set(DATA.platforms.map(x=>x.key)),devices:new Set(DATA.devices.map(x=>x.key))};const fmt=x=>{x=Number(x||0);if(x>=1e9)return(x/1e9).toFixed(2).replace(/\\.00$/,'')+'B';if(x>=1e6)return(x/1e6).toFixed(2).replace(/\\.00$/,'')+'M';if(x>=1e3)return(x/1e3).toFixed(1).replace(/\\.0$/,'')+'K';return Math.round(x).toLocaleString('zh-CN')};const activeSeries=()=>DATA.series.filter(s=>state.devices.has(s.device)&&state.platforms.has(s.platform));const value=(row,device)=>activeSeries().filter(s=>!device||s.device===device).reduce((n,s)=>n+Number(row.values[s.key]||0),0);const rows=()=>DATA.daily.filter(r=>r.day>=state.start&&r.day<=state.end);const observable=r=>[...state.devices].some(d=>r.observable[d]);function node(t,a={}){const n=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));return n}function tooltip(e,h){const t=q('#tooltip');t.innerHTML=h;t.style.display='block';t.style.left=Math.min(innerWidth-292,e.clientX+12)+'px';t.style.top=Math.max(8,e.clientY-48)+'px'}function hide(){q('#tooltip').style.display='none'}function dims(svg){const w=Math.max(600,svg.clientWidth||1000),h=svg.clientHeight||390;svg.setAttribute('viewBox','0 0 '+w+' '+h);return{w,h,l:62,t:22,pw:w-82,ph:h-62}}function axes(svg,d,max){for(let i=0;i<=4;i++){const y=d.t+d.ph*i/4;svg.append(node('line',{x1:d.l,x2:d.l+d.pw,y1:y,y2:y,class:'grid'}));const tx=node('text',{x:d.l-9,y:y+4,'text-anchor':'end'});tx.textContent=fmt(max*(1-i/4));svg.append(tx)}}function draw(){const svg=q('#usageChart'),rs=rows(),devices=DATA.devices.filter(d=>state.devices.has(d.key));svg.innerHTML='';const d=dims(svg);let running=Object.fromEntries(devices.map(x=>[x.key,0]));const totals=rs.map(r=>{devices.forEach(x=>running[x.key]+=value(r,x.key));return state.mode==='daily'?value(r):Object.values(running).reduce((a,b)=>a+b,0)});const max=Math.max(1,...totals)*1.08;const first=rs.findIndex(observable);if(first>0){const w=first/rs.length*d.pw;svg.append(node('rect',{x:d.l,y:d.t,width:w,height:d.ph,class:'unknown'}))}axes(svg,d,max);if(state.mode==='daily'){const bw=Math.max(1,d.pw/Math.max(1,rs.length)*.72);rs.forEach((r,i)=>{let acc=0;const x=d.l+(i+.5)*d.pw/rs.length-bw/2;devices.forEach(dev=>{const v=value(r,dev.key);if(!v)return;const h=v/max*d.ph,y=d.t+d.ph-(acc+v)/max*d.ph,bar=node('rect',{x,y,width:bw,height:Math.max(.7,h),rx:Math.min(2,bw/2),fill:dev.color,opacity:.92});bar.addEventListener('mousemove',e=>tooltip(e,'<strong>'+r.day+'</strong><br>'+dev.name+'：'+fmt(v)+'<br>当前选择合计：'+fmt(value(r))));bar.addEventListener('mouseleave',hide);svg.append(bar);acc+=v})})}else{devices.forEach(dev=>{let c=0;const pts=rs.map((r,i)=>{c+=value(r,dev.key);return[d.l+(rs.length===1?0:i*d.pw/(rs.length-1)),d.t+d.ph-c/max*d.ph,c]});svg.append(node('path',{d:pts.map((p,i)=>(i?'L':'M')+p[0]+','+p[1]).join(' '),fill:'none',stroke:dev.color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));pts.forEach((p,i)=>{const hit=node('circle',{cx:p[0],cy:p[1],r:7,fill:'transparent'});hit.addEventListener('mousemove',e=>tooltip(e,'<strong>'+rs[i].day+'</strong><br>'+dev.name+' 累计：'+fmt(p[2])));hit.addEventListener('mouseleave',hide);svg.append(hit)})})}const ticks=Math.min(7,rs.length);for(let i=0;i<ticks;i++){const idx=Math.round(i*(rs.length-1)/Math.max(1,ticks-1)),tx=node('text',{x:d.l+(rs.length===1?0:idx*d.pw/(rs.length-1)),y:d.h-13,'text-anchor':'middle'});tx.textContent=rs[idx]?.day.slice(5)||'';svg.append(tx)}const total=rs.reduce((n,r)=>n+value(r),0);q('#chartTotal').textContent=fmt(total)+' Token';q('#chartCaption').textContent=state.start+' — '+state.end+' · '+devices.length+' 个设备 · '+state.platforms.size+' 个平台';q('#chartHint').textContent=state.mode==='daily'?'颜色区分设备；平台选择决定纳入哪些调用':'每条线是一类设备的累计量';const missing=[...state.devices].filter(k=>state.start<DATA.coverage[k].observedFrom).map(k=>DATA.devices.find(d=>d.key===k).name+' '+DATA.coverage[k].observedFrom+' 前');q('#coverageNote').textContent=(missing.length?missing.join('；')+'无可见记录（不是 0）。':'当前范围在所选设备的可见窗口内。')+(DATA.undatedTotal?' Kiro '+fmt(DATA.undatedTotal)+' 无日期记录未进入趋势图。':'');drawHeatmap()}
function heatColor(r){if(r<=0)return'#f0f3f6';if(r<.12)return'#dcfce7';if(r<.28)return'#bbf7d0';if(r<.5)return'#86efac';if(r<.72)return'#4ade80';if(r<.9)return'#22c55e';return'#15803d'}function drawHeatmap(){const svg=q('#activityHeatmap'),rs=rows(),values=rs.map(r=>({...r,v:value(r)})),observed=values.filter(observable),peak=observed.reduce((b,r)=>r.v>b.v?r:b,{day:'—',v:0});let run=0,longest=0;observed.forEach(r=>{run=r.v>0?run+1:0;longest=Math.max(longest,run)});let current=0;for(let i=observed.length-1;i>=0&&observed[i].v>0;i--)current++;q('#heatmapTotal').textContent=fmt(observed.reduce((n,r)=>n+r.v,0));q('#heatmapPeak').textContent=peak.day==='—'?'—':peak.day.slice(5)+' · '+fmt(peak.v);q('#heatmapActive').textContent=observed.filter(r=>r.v>0).length+' 天';q('#heatmapCurrent').textContent=current+' 天';q('#heatmapLongest').textContent=longest+' 天';q('#heatmapCaption').textContent=state.devices.size+' 个设备 · '+state.platforms.size+' 个平台 · '+state.start+'—'+state.end;svg.innerHTML='';const w=Math.max(340,svg.clientWidth||1000),left=w<560?30:48,top=32,h=205,offset=values.length?(new Date(values[0].day+'T00:00:00Z').getUTCDay()+6)%7:0,weeks=Math.max(1,Math.ceil((offset+values.length)/7)),step=Math.max(5,Math.min(19,(w-left-12)/weeks)),cell=Math.max(3,step-Math.max(2,step*.18)),startX=left+Math.max(0,(w-left-12-weeks*step)/2),max=Math.max(1,...observed.map(r=>r.v));svg.setAttribute('viewBox','0 0 '+w+' '+h);if(step>=10)[['一',0],['三',2],['五',4],['日',6]].forEach(([l,row])=>{const t=node('text',{x:startX-8,y:top+row*step+cell*.72,'text-anchor':'end'});t.textContent=l;svg.append(t)});values.forEach((r,i)=>{const slot=offset+i,rect=node('rect',{x:startX+Math.floor(slot/7)*step,y:top+(slot%7)*step,width:cell,height:cell,rx:Math.max(1,cell*.2),fill:observable(r)?heatColor(r.v/max):'#e5e7eb'});rect.addEventListener('mousemove',e=>tooltip(e,'<strong>'+r.day+'</strong><br>'+(observable(r)?fmt(r.v)+' Token':'所选设备无留存')));rect.addEventListener('mouseleave',hide);svg.append(rect)})}
function setDates(s,e){state.start=s;state.end=e;q('#startDate').value=s;q('#endDate').value=e;draw()}document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));draw()});document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('active',x===b));let s=DATA.minDay;if(b.dataset.preset==='7')s=DATA.daily.at(-7).day;if(b.dataset.preset==='30')s=DATA.daily.at(-30).day;if(b.dataset.preset==='month')s=DATA.maxDay.slice(0,8)+'01';if(b.dataset.preset==='visible')s=DATA.observedFrom;setDates(s,DATA.maxDay)});document.querySelectorAll('#platformChecks input').forEach(c=>c.onchange=()=>{c.checked?state.platforms.add(c.value):state.platforms.delete(c.value);draw()});document.querySelectorAll('#deviceChecks input').forEach(c=>c.onchange=()=>{c.checked?state.devices.add(c.value):state.devices.delete(c.value);draw()});q('#startDate').onchange=e=>{state.start=e.target.value;draw()};q('#endDate').onchange=e=>{state.end=e.target.value;draw()};let timer;addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(draw,60)});setDates(state.start,state.end);
</script><script src="platform-plan-dashboard.js"></script></body></html>`;

fs.writeFileSync(auditPath, `${JSON.stringify(reportData, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "index.html"), html);

const previewPath = path.join(root, "public/previews/personal-ai-token-usage-audit-2026-09-10.svg");
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#07101d"/><stop offset="1" stop-color="#17243a"/></linearGradient></defs><rect width="1200" height="675" fill="url(#bg)"/><circle cx="1020" cy="80" r="240" fill="#8b5cf6" opacity=".18"/><circle cx="150" cy="640" r="270" fill="#10b981" opacity=".15"/><text x="74" y="86" fill="#a8b8ca" font-family="Arial,sans-serif" font-size="22" letter-spacing="4">DEVICE-AWARE AI USAGE · 2026</text><text x="74" y="195" fill="#fff" font-family="PingFang SC,Arial,sans-serif" font-size="64" font-weight="700">双设备 AI Token 使用看板</text><text x="74" y="250" fill="#b9c9d9" font-family="PingFang SC,Arial,sans-serif" font-size="28">平台 × 设备 × 日期 · 可筛选、可追溯、不重复</text><g transform="translate(74 330)"><rect width="310" height="190" rx="24" fill="#14243a" stroke="#31455c"/><rect x="0" width="8" height="190" rx="4" fill="#8b5cf6"/><text x="32" y="48" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="21">公司电脑</text><text x="32" y="112" fill="#fff" font-family="Arial" font-size="52" font-weight="700">${fmt(deviceSummaries.company.total)}</text><text x="32" y="154" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="20">${pct(companyShare)} · 设备本地</text></g><g transform="translate(412 330)"><rect width="310" height="190" rx="24" fill="#14243a" stroke="#31455c"/><rect x="0" width="8" height="190" rx="4" fill="#10b981"/><text x="32" y="48" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="21">个人电脑</text><text x="32" y="112" fill="#fff" font-family="Arial" font-size="52" font-weight="700">${fmt(deviceSummaries.personal.total)}</text><text x="32" y="154" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="20">${pct(personalShare)} · 主力设备</text></g><g transform="translate(750 330)"><rect width="376" height="190" rx="24" fill="#14243a" stroke="#31455c"/><rect x="0" width="8" height="190" rx="4" fill="#f43f5e"/><text x="32" y="48" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="21">账号共享 / 不可归因</text><text x="32" y="112" fill="#fff" font-family="Arial" font-size="52" font-weight="700">${fmt(deviceSummaries.shared.total)}</text><text x="32" y="154" fill="#a8b8ca" font-family="PingFang SC,Arial" font-size="20">Cursor · 只计一次</text></g><text x="74" y="610" fill="#70849a" font-family="PingFang SC,Arial" font-size="20">TOTAL ${fmt(globalSummary.total)} · 截至 ${endDay} · 本地缺失不按 0</text></svg>`;
fs.writeFileSync(previewPath, preview);

console.log(JSON.stringify({
  reportDir,
  globalTotal: globalSummary.total,
  deviceSummaries,
  platformSummaries,
  generatedAt: reportData.generatedAt,
}, null, 2));
