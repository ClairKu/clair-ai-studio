import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportRoot = join(root, "public", "reports", "oap-qieman-user-dashboard");
const dataPath = join(reportRoot, "data", "latest.json");
const fallbackPath = join(reportRoot, "data", "fallback-data.js");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const html = readFileSync(join(reportRoot, "index.html"), "utf8");
const app = readFileSync(join(reportRoot, "app.js"), "utf8");
const css = readFileSync(join(reportRoot, "styles.css"), "utf8");
const fail = (message) => { throw new Error(`OAP × 且慢用户看板校验失败：${message}`); };
const approximately = (left, right, tolerance = 0.0015) => Math.abs(Number(left) - Number(right)) <= tolerance;

if (data.schema_version !== "oap-qieman-user-dashboard-v1") fail("数据版本异常");
if (!data.meta?.generated_at || !data.meta?.data_cutoff || !data.meta?.asset_snapshot_date || data.meta?.timezone !== "Asia/Shanghai") fail("分源截止时间不完整");
if (data.meta?.evidence_state !== "confirmed_with_boundaries") fail("证据状态没有保留边界");
if (data.meta?.minimum_public_cell !== 20) fail("公开最小样本阈值必须为 20");
if (Date.parse(data.meta.generated_at) < Date.parse(data.meta.data_cutoff)) fail("生成时间早于数据截止时间");

const usageKeys = ["approved_users", "ever_called_users", "active_30d_users", "total_calls", "attributed_calls", "unattributed_calls", "calls_30d"];
for (const key of usageKeys) {
  if (!Number.isInteger(data.usage?.[key]) || data.usage[key] < 0) fail(`使用指标 ${key} 无效`);
}
if (!(data.usage.approved_users >= data.usage.ever_called_users && data.usage.ever_called_users >= data.usage.active_30d_users)) fail("三组用户人群不闭合");
if (data.usage.total_calls !== data.usage.attributed_calls + data.usage.unattributed_calls) fail("调用归属与总调用不闭合");

const expectedIds = ["approved", "called", "active_30d"];
if (!Array.isArray(data.cohorts) || data.cohorts.length !== expectedIds.length) fail("人群数组必须为三组");
for (const [index, cohort] of data.cohorts.entries()) {
  if (cohort.id !== expectedIds[index]) fail(`人群标识或顺序异常：${cohort.id}`);
  const expectedUsers = data.usage[`${cohort.id === "called" ? "ever_called" : cohort.id}_users`];
  if (!Number.isInteger(cohort.users) || cohort.users !== expectedUsers) fail(`${cohort.id} 人群人数不一致`);
  for (const key of ["qieman_accounts", "holders", "managed_accounts", "profitable_holders"]) {
    if (!Number.isInteger(cohort[key]) || cohort[key] < 0) fail(`${cohort.id}.${key} 无效`);
  }
  if (!(cohort.users >= cohort.qieman_accounts && cohort.qieman_accounts >= cohort.holders && cohort.holders >= cohort.managed_accounts)) fail(`${cohort.id} 账户、持仓与在管关系不闭合`);
  if (cohort.profitable_holders > cohort.holders || cohort.aum_yuan < 0 || cohort.average_holder_asset_yuan < 0) fail(`${cohort.id} 资产值异常`);
  const ratePairs = [
    ["qieman_account_rate", cohort.qieman_accounts / cohort.users],
    ["holder_rate", cohort.holders / cohort.users],
    ["managed_rate", cohort.managed_accounts / cohort.users],
    ["profitable_holder_rate", cohort.holders ? cohort.profitable_holders / cohort.holders : 0],
  ];
  for (const [key, expected] of ratePairs) {
    if (!approximately(cohort[key], expected)) fail(`${cohort.id}.${key} 无法由分子分母复算`);
  }
  if (!Array.isArray(cohort.asset_buckets) || cohort.asset_buckets.length !== 5) fail(`${cohort.id} 资产分层缺失`);
  const bucketTotal = cohort.asset_buckets.reduce((sum, row) => sum + row.count, 0);
  const bucketShare = cohort.asset_buckets.reduce((sum, row) => sum + row.share, 0);
  if (bucketTotal !== cohort.holders || !approximately(bucketShare, 1, 0.006)) fail(`${cohort.id} 资产分层不闭合`);
  for (const row of cohort.asset_buckets) {
    if (!Number.isInteger(row.count) || row.count < data.meta.minimum_public_cell) fail(`${cohort.id}.${row.key} 小于公开样本阈值`);
    if (!approximately(row.share, row.count / cohort.holders, 0.0015)) fail(`${cohort.id}.${row.key} 占比不可复算`);
  }
}

if (!Array.isArray(data.behavior?.categories) || data.behavior.categories.length !== 7) fail("行为分类不完整");
if (!data.behavior.categories.some((item) => item.state === "missing") || !data.behavior.categories.some((item) => item.state === "partial")) fail("行为语义没有保留 partial / missing");
const categoryKeys = data.behavior.categories.map((item) => item.key);
for (const cohort of data.cohorts) {
  const rows = data.behavior.by_cohort?.[cohort.id];
  if (!Array.isArray(rows) || rows.length !== categoryKeys.length) fail(`${cohort.id} 行为数组缺失`);
  for (const [index, row] of rows.entries()) {
    if (row.key !== categoryKeys[index]) fail(`${cohort.id} 行为分类顺序不一致`);
    if (!Number.isInteger(row.actors) || !Number.isInteger(row.events) || row.actors > cohort.users || row.events < row.actors) fail(`${cohort.id}.${row.key} 行为数量异常`);
    if (row.actors < data.meta.minimum_public_cell) fail(`${cohort.id}.${row.key} 参与人数低于公开阈值`);
    if (!approximately(row.penetration, row.actors / cohort.users, 0.00025)) fail(`${cohort.id}.${row.key} 参与率不可复算`);
    if (!approximately(row.events_per_actor, row.events / row.actors, 0.015)) fail(`${cohort.id}.${row.key} 人均频次不可复算`);
  }
}

if (!Array.isArray(data.profile?.dimensions) || data.profile.dimensions.length < 4) fail("画像维度不足");
if (!(data.profile.survey_coverage_approx > 0 && data.profile.survey_coverage_approx < 0.5) || data.profile.coverage_state !== "low") fail("低覆盖画像没有正确标注");
for (const item of data.profile.dimensions) {
  if (!Number.isInteger(item.count) || !Number.isInteger(item.sample) || item.sample < data.meta.minimum_public_cell || item.count > item.sample) fail(`画像 ${item.key} 样本异常`);
  if (!approximately(item.share, item.count / item.sample, 0.002)) fail(`画像 ${item.key} 比例不可复算`);
}

if (!Array.isArray(data.quality_checks) || data.quality_checks.length !== 5) fail("数据健康度必须为 5 项");
for (const status of ["pass", "warn", "missing"]) {
  if (!data.quality_checks.some((item) => item.status === status)) fail(`数据健康缺少 ${status}`);
}
if (!Array.isArray(data.definitions) || !data.definitions.some((item) => item.state === "missing")) fail("口径文档缺少 missing 边界");

const publicText = JSON.stringify(data);
const forbidden = /(account3|broker_user|union_id|user_id|po_manager|ying99_|手机号|phone|email|邮箱|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token|view[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
if (publicText.length > 150000) fail("公开快照异常过大");

for (const signal of [
  'id="refresh-button"',
  'id="cohort-ladder"',
  'id="behavior-chart"',
  'id="profile-chart"',
  'id="quality-grid"',
  'id="doc-panel"',
  'id="report-data"',
  'data/fallback-data.js',
  'app.js',
]) {
  if (!html.includes(signal)) fail(`页面缺少 ${signal}`);
}
for (const term of ["批准用户", "历史调用用户", "近30日活跃用户", "且慢持仓", "参与率", "画像覆盖率", "confirmed", "partial", "missing"]) {
  if (!html.includes(term)) fail(`搜索索引稳定文本缺少 ${term}`);
}
for (const signal of ["LOCAL_REFRESH_BASE", "127.0.0.1:41792", "validateData", "isNewerSnapshot", "startLocalRefresh", "selectCohort", "selectBehaviorMode", "buildDocument"]) {
  if (!app.includes(signal)) fail(`交互缺少 ${signal}`);
}
for (const signal of ["@media (max-width: 680px)", "prefers-reduced-motion", "@media print", ".doc-panel", ".signal-bridge"]) {
  if (!css.includes(signal)) fail(`样式缺少 ${signal}`);
}
if (/https?:\/\/(?!127\.0\.0\.1)/.test(app.replaceAll("https://ontology.yingmi-inc.com", ""))) fail("页面脚本含未审计外部服务");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.OAP_QIEMAN_DASHBOARD_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`OAP × 且慢用户看板通过：${data.usage.approved_users} 位批准用户，${data.usage.active_30d_users} 位近 30 日活跃，资产快照 ${data.meta.asset_snapshot_date}。`);
