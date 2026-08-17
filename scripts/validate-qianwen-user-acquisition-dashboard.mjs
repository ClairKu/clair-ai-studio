import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

if (data.schema_version !== "qianwen-user-acquisition-v3") fail("数据版本异常");
if (!data.meta?.data_cutoff || !data.meta?.window_start_at || !data.meta?.launch_at || data.meta?.timezone !== "Asia/Shanghai") fail("时间口径不完整");
if (data.meta?.evidence_state !== "confirmed") fail("生产快照未标记 confirmed");

const metricKeys = [
  "bound_accounts",
  "existing_accounts",
  "new_accounts",
  "missing_registration_time",
  "duplicate_bindings",
  "unmatched_accounts",
];
for (const key of metricKeys) {
  if (!Number.isInteger(data.metrics?.[key]) || data.metrics[key] < 0) fail(`指标 ${key} 无效`);
}
if (data.metrics.bound_accounts !== data.metrics.existing_accounts + data.metrics.new_accounts + data.metrics.missing_registration_time) {
  fail("账号结构无法闭合");
}

const launchMetricKeys = [
  "pre_launch_bound_accounts",
  "post_launch_bound_accounts",
  "post_launch_new_accounts",
  "post_launch_existing_accounts",
  "post_launch_unclassified_accounts",
];
for (const key of launchMetricKeys) {
  if (!Number.isInteger(data.launch_metrics?.[key]) || data.launch_metrics[key] < 0) fail(`上线阶段指标 ${key} 无效`);
}
if (
  data.launch_metrics.post_launch_bound_accounts !== data.launch_metrics.post_launch_new_accounts
    + data.launch_metrics.post_launch_existing_accounts
    + data.launch_metrics.post_launch_unclassified_accounts
) fail("上线后账号结构无法闭合");
if (data.metrics.bound_accounts !== data.launch_metrics.pre_launch_bound_accounts + data.launch_metrics.post_launch_bound_accounts) {
  fail("上线前后总数无法闭合");
}

if (!Array.isArray(data.daily) || !data.daily.length) fail("每日趋势缺失");
if (data.daily[0].date !== "2026-08-03") fail("每日趋势未从 8 月 3 日开始");
let cumulativeNew = 0;
let cumulativeExisting = 0;
let cumulativeUnclassified = 0;
let cumulativeBound = 0;
let prior = "";
for (const row of data.daily) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) fail(`日期格式异常：${row.date}`);
  if (prior) {
    const expected = new Date(`${prior}T12:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + 1);
    if (row.date !== expected.toISOString().slice(0, 10)) fail(`日期不连续：${prior} → ${row.date}`);
  }
  for (const key of [
    "new_accounts_today",
    "existing_accounts_today",
    "unclassified_accounts_today",
    "bound_accounts_today",
    "cumulative_new_accounts",
    "cumulative_existing_accounts",
    "cumulative_unclassified_accounts",
    "cumulative_bound_accounts",
  ]) {
    if (!Number.isInteger(row[key]) || row[key] < 0) fail(`${key} 异常：${row.date}`);
  }
  if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
    fail(`每日账号结构不闭合：${row.date}`);
  }
  cumulativeNew += row.new_accounts_today;
  cumulativeExisting += row.existing_accounts_today;
  cumulativeUnclassified += row.unclassified_accounts_today;
  cumulativeBound += row.bound_accounts_today;
  if (
    row.cumulative_new_accounts !== cumulativeNew
    || row.cumulative_existing_accounts !== cumulativeExisting
    || row.cumulative_unclassified_accounts !== cumulativeUnclassified
    || row.cumulative_bound_accounts !== cumulativeBound
  ) fail(`累计值不闭合：${row.date}`);
  prior = row.date;
}
if (
  cumulativeNew !== data.metrics.new_accounts
  || cumulativeExisting !== data.metrics.existing_accounts
  || cumulativeUnclassified !== data.metrics.missing_registration_time
  || cumulativeBound !== data.metrics.bound_accounts
) fail("每日趋势与总数不闭合");

const publicText = JSON.stringify(data);
const forbidden = /(ying99_|union_id|user_id|po_manager_id|手机号|phone|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
for (const signal of ["id=\"refresh-button\"", "id=\"bound-total\"", "id=\"trend-chart\"", "id=\"doc-panel\"", "data/fallback-data.js", "app.js"]) {
  if (!html.includes(signal)) fail(`页面缺少 ${signal}`);
}
for (const removed of ["verdict-band", "quality-title", "definition-title", "next-title", "最新数据已完成核对", "三项核心数据口径", "从用户增长，走向用户留存", "汇报结论"]) {
  if (html.includes(removed) || app.includes(removed)) fail(`页面仍包含已移除内容：${removed}`);
}
for (const signal of ["当日增量", "累计用户", "新用户占比", "老用户占比", "完整逐日明细"]) {
  if (!html.includes(signal)) fail(`完整明细缺少：${signal}`);
}
for (const signal of ["LOCAL_REFRESH_BASE", "127.0.0.1", "validateData", "startLocalRefresh", "loadPublishedData", "buildDocument"]) {
  if (!app.includes(signal)) fail(`交互缺少 ${signal}`);
}
if (/https?:\/\/(?!127\.0\.0\.1)/.test(app.replaceAll("https://ontology.yingmi-inc.com", ""))) fail("页面脚本含未审计外部服务");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");

const reportEntryStart = workbench.indexOf('id: "qianwen-user-acquisition-dashboard"');
const reportEntryEnd = workbench.indexOf("\n    {", reportEntryStart + 1);
if (reportEntryStart < 0 || reportEntryEnd < 0) fail("工作台入口缺失");
const reportingCopy = [html, app, publicText, preview, workbench.slice(reportEntryStart, reportEntryEnd)].join("\n");
for (const word of ["映射", "聚合", "去重", "关联", "存量", "ACCOUNT HANDOFF", "生产数仓"]) {
  if (reportingCopy.includes(word)) fail(`汇报文案仍包含技术术语：${word}`);
}
for (const phrase of ["千问 X 且慢AI小顾", "累计绑定用户", "其中新用户", "老用户", "千问引流且慢用户增长走势图"]) {
  if (!reportingCopy.includes(phrase)) fail(`汇报文案缺少：${phrase}`);
}

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.QIANWEN_ACQUISITION_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`千问用户数据看板通过：${data.metrics.bound_accounts} 个绑定且慢账号，${data.daily.length} 天趋势，截止 ${data.meta.data_cutoff}。`);
