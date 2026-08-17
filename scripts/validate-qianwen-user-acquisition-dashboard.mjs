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
const fail = (message) => { throw new Error(`千问账号映射看板校验失败：${message}`); };

if (data.schema_version !== "qianwen-user-acquisition-v1") fail("数据版本异常");
if (!data.meta?.data_cutoff || !data.meta?.launch_at || data.meta?.timezone !== "Asia/Shanghai") fail("时间口径不完整");
if (data.meta?.evidence_state !== "confirmed") fail("生产快照未标记 confirmed");

const metricKeys = [
  "mapped_accounts",
  "existing_accounts",
  "new_accounts",
  "missing_registration_time",
  "duplicate_mappings",
  "unmatched_accounts",
  "boundary_records",
];
for (const key of metricKeys) {
  if (!Number.isInteger(data.metrics?.[key]) || data.metrics[key] < 0) fail(`指标 ${key} 无效`);
}
if (data.metrics.mapped_accounts !== data.metrics.existing_accounts + data.metrics.new_accounts + data.metrics.missing_registration_time) {
  fail("账号结构无法闭合");
}

if (!Array.isArray(data.daily) || !data.daily.length) fail("每日趋势缺失");
let cumulative = 0;
let prior = "";
for (const row of data.daily) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) fail(`日期格式异常：${row.date}`);
  if (prior) {
    const expected = new Date(`${prior}T12:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + 1);
    if (row.date !== expected.toISOString().slice(0, 10)) fail(`日期不连续：${prior} → ${row.date}`);
  }
  if (!Number.isInteger(row.new_mapped_accounts) || row.new_mapped_accounts < 0) fail(`每日新增异常：${row.date}`);
  cumulative += row.new_mapped_accounts;
  if (row.cumulative_mapped_accounts !== cumulative) fail(`累计值不闭合：${row.date}`);
  prior = row.date;
}
if (cumulative !== data.metrics.mapped_accounts) fail("每日趋势与总数不闭合");

if (!Array.isArray(data.quality_checks) || data.quality_checks.length !== 4) fail("数据健康度必须为 4 项");
if (!Array.isArray(data.definitions) || !data.definitions.some((item) => item.state === "missing")) fail("口径边界缺少 missing 状态");

const publicText = JSON.stringify(data);
const forbidden = /(ying99_|union_id|user_id|po_manager_id|手机号|phone|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
for (const signal of ["id=\"refresh-button\"", "id=\"trend-chart\"", "id=\"doc-panel\"", "data/fallback-data.js", "app.js"]) {
  if (!html.includes(signal)) fail(`页面缺少 ${signal}`);
}
for (const signal of ["LOCAL_REFRESH_BASE", "127.0.0.1", "validateData", "startLocalRefresh", "loadPublishedData", "buildDocument"]) {
  if (!app.includes(signal)) fail(`交互缺少 ${signal}`);
}
if (/https?:\/\/(?!127\.0\.0\.1)/.test(app.replaceAll("https://ontology.yingmi-inc.com", ""))) fail("页面脚本含未审计外部服务");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.QIANWEN_ACQUISITION_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`千问账号映射看板数据通过：${data.metrics.mapped_accounts} 个映射账号，${data.daily.length} 天趋势，截止 ${data.meta.data_cutoff}。`);
