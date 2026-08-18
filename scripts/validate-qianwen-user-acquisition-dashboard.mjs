import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateQianwenDashboardData } from "./qianwen-dashboard-data-validator.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportRoot = join(root, "public", "reports", "qianwen-user-acquisition-dashboard");
const dataPath = join(reportRoot, "data", "latest.json");
const fallbackPath = join(reportRoot, "data", "fallback-data.js");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const html = readFileSync(join(reportRoot, "index.html"), "utf8");
const app = readFileSync(join(reportRoot, "app.js"), "utf8");
const preview = readFileSync(join(root, "public", "previews", "qianwen-user-acquisition-dashboard.svg"), "utf8");
const workbench = readFileSync(join(root, "src", "app.js"), "utf8");
const fail = (message) => { throw new Error(`千问用户数据看板校验失败：${message}`); };

// 快照数据本身的口径校验与本机刷新 agent 共用同一份实现，避免两处口径漂移。
validateQianwenDashboardData(data);

const publicText = JSON.stringify(data);

for (const signal of [
  'id="refresh-button"',
  'id="bound-total"',
  'id="new-accounts"',
  'id="existing-accounts"',
  'id="trend-chart"',
  'id="detail-table"',
  'id="range-start"',
  'id="range-end"',
  'id="audience-analysis"',
  'id="audience-cohort-control"',
  'id="audience-population"',
  'id="asset-distribution"',
  'id="behavior-bars"',
  'id="audience-table"',
  'id="audience-table-body"',
  'id="audience-footnote"',
  'id="refresh-dialog"',
  'id="refresh-form"',
  'id="refresh-password"',
  'data/fallback-data.js',
]) {
  if (!html.includes(signal)) fail(`页面缺少 ${signal}`);
}
for (const signal of [
  'name="series" value="bound"',
  'name="series" value="new"',
  'name="series" value="existing"',
  'name="series" value="daily"',
  'name="range" value="since-launch"',
  'name="range" value="last-7"',
  'name="range" value="custom"',
  'name="audience-cohort" value="all"',
  'name="audience-cohort" value="new"',
  'name="audience-cohort" value="existing"',
]) {
  if (!html.includes(signal)) fail(`交互控件缺少 ${signal}`);
}
if ((html.match(/<article class="kpi-card/g) || []).length !== 3) fail("关键数据卡必须为三个静态展示卡");
if ((html.match(/name="series"/g) || []).length !== 4) fail("走势图必须有四个独立数据开关");

// 密码只在中继服务端校验：页面不得自带口令、也不得把口令留在浏览器里。
if (/(autocomplete|name)\s*=\s*"[^"]*(?:current-password|new-password)/i.test(html)) fail("密码框不得触发浏览器保存口令");
for (const persisted of ["localStorage.setItem(\"clair-qianwen-refresh", "sessionStorage"]) {
  if (app.includes(persisted)) fail(`更新口令不得被持久化：${persisted}`);
}

for (const removed of [
  "阶段",
  "数据状态",
  "refresh-explainer",
  "pulse-notes",
  "handoff-route",
  "doc-fab",
  "doc-panel",
  "quality-title",
  "definition-title",
  "汇报结论",
  "chart-summary",
  "analysis-value",
  "analysis-label",
  "analysis-context",
  'name="metric"',
  'name="trend"',
  "选择指标，查看对应走势",
  "查看走势",
  // 本机守护进程更新链路已下线，改为中继 + 本机刷新 agent
  "LOCAL_REFRESH_BASE",
  "startLocalRefresh",
  "127.0.0.1",
]) {
  if (html.includes(removed) || app.includes(removed)) fail(`页面仍包含已移除内容：${removed}`);
}
for (const signal of [
  "RELAY_BASE",
  "qianwen-user-acquisition-v5",
  "clair-qianwen-acquisition-latest-v5",
  "validateData",
  "validateAudienceData",
  "requestRelayRefresh",
  "openRefreshDialog",
  "filteredRows",
  "renderChart",
  "renderTable",
  "PROFILE_DIMENSIONS",
  "BEHAVIOR_METRICS",
  "renderAudience",
  "renderAssetDistribution",
  "renderBehaviorBars",
  "renderAudienceTable",
  "window_cumulative_bound",
  "visibleSeries",
  "chart-area-new",
  "chart-area-existing",
  "chart-bound-line",
  "chart-bar",
  "selectedDate",
]) {
  if (!app.includes(signal)) fail(`页面脚本缺少 ${signal}`);
}

// 页面脚本允许出现的外部服务：本体进度页（只读链接）与更新中继（只收口令、发任务）。
const auditedOrigins = [
  "https://ontology.yingmi-inc.com",
  "https://clair-refresh-relay.clairku.workers.dev",
];
let auditedApp = app;
for (const origin of auditedOrigins) auditedApp = auditedApp.replaceAll(origin, "");
if (/https?:\/\//.test(auditedApp)) fail("页面脚本含未审计外部服务");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");

const reportEntryStart = workbench.indexOf('id: "qianwen-user-acquisition-dashboard"');
const reportEntryEnd = workbench.indexOf("\n    {", reportEntryStart + 1);
if (reportEntryStart < 0 || reportEntryEnd < 0) fail("工作台入口缺失");
const reportingCopy = [html, app, publicText, preview, workbench.slice(reportEntryStart, reportEntryEnd)].join("\n");
for (const word of ["映射", "聚合", "去重", "关联", "存量", "ACCOUNT HANDOFF", "生产数仓"]) {
  if (reportingCopy.includes(word)) fail(`汇报文案仍包含技术术语：${word}`);
}
for (const phrase of [
  "千问 X 且慢AI小顾",
  "累计绑定用户",
  "其中新用户",
  "老用户",
  "用户增长走势",
  "对应数据明细",
  "用户画像与行为",
  "资产与账户状态",
  "绑定后关键行为",
]) {
  if (!reportingCopy.includes(phrase)) fail(`汇报文案缺少：${phrase}`);
}

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.QIANWEN_ACQUISITION_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`千问用户数据看板通过：服务上线以来 ${data.metrics.bound_accounts} 个绑定用户，${data.daily.length} 天趋势，截止 ${data.meta.data_cutoff}。`);
