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
const growthSummaryFields = ["new_registrations", "first_inflow_users", "inflow_users", "inflow_yuan", "outflow_yuan"];
const growthFunnelFields = ["eligible_registrations", "first_inflow_d30_users", "first_inflow_d7_users", "still_holding_users"];
const dateOrdinal = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? Date.parse(`${value}T00:00:00Z`) / 86_400_000 : NaN;
const inclusiveDays = (start, end) => dateOrdinal(end) - dateOrdinal(start) + 1;
const datesAreAdjacent = (left, right) => dateOrdinal(right) - dateOrdinal(left) === 1;
const growthValue = (row, field) => {
  if (!row) return null;
  if (field === "net_inflow_yuan") {
    if (growthValue(row, "inflow_yuan") === null || growthValue(row, "outflow_yuan") === null) return null;
    return row.inflow_yuan - row.outflow_yuan;
  }
  return row[field] === null || row.suppressed_fields?.includes(field) ? null : row[field];
};
const validateGrowthRow = (row, fields, label) => {
  if (!row || !Array.isArray(row.suppressed_fields)) fail(`${label} 缺少小样本抑制声明`);
  const suppressed = new Set(row.suppressed_fields);
  if (suppressed.size !== row.suppressed_fields.length || [...suppressed].some((field) => !fields.includes(field))) fail(`${label} 小样本抑制字段异常`);
  for (const field of fields) {
    const value = row[field];
    if (value === null) {
      if (!suppressed.has(field)) fail(`${label}.${field} 为空但未标记 suppressed`);
      continue;
    }
    if (suppressed.has(field)) fail(`${label}.${field} 已有值却标记 suppressed`);
    if (!Number.isSafeInteger(value) || value < 0) fail(`${label}.${field} 无效`);
    const isAmount = field.endsWith("_yuan");
    if (isAmount && value % 10_000 !== 0) fail(`${label}.${field} 未按万元汇总`);
    if (!isAmount && value > 0 && value < data.meta.minimum_public_cell) fail(`${label}.${field} 小于公开样本阈值`);
  }
  return row;
};

if (data.schema_version !== "oap-qieman-user-dashboard-v1") fail("数据版本异常");
if (!data.meta?.generated_at || !data.meta?.data_cutoff || !data.meta?.asset_snapshot_date || data.meta?.timezone !== "Asia/Shanghai") fail("分源截止时间不完整");
if (!["confirmed_with_boundaries", "partial"].includes(data.meta?.evidence_state)) fail("证据状态没有保留边界");
if (data.meta?.minimum_public_cell !== 20) fail("公开最小样本阈值必须为 20");
if (Date.parse(data.meta.generated_at) < Date.parse(data.meta.data_cutoff)) fail("生成时间早于数据截止时间");

const usageKeys = ["approved_users", "ever_called_users", "active_30d_users", "total_calls", "attributed_calls", "unattributed_calls", "calls_30d"];
for (const key of usageKeys) {
  if (!Number.isInteger(data.usage?.[key]) || data.usage[key] < 0) fail(`使用指标 ${key} 无效`);
}
if (!(data.usage.approved_users >= data.usage.ever_called_users && data.usage.ever_called_users >= data.usage.active_30d_users)) fail("三组用户人群不闭合");
if (data.usage.total_calls !== data.usage.attributed_calls + data.usage.unattributed_calls) fail("调用归属与总调用不闭合");

{
  const journey = data.journey_metrics;
  if (!journey || journey.schema_version !== "oap-journey-metrics-v1" || !Array.isArray(journey.rows) || !journey.rows.length) fail("关键历程数据契约异常");
  const fieldMap = {
    cumulativeCalls: "cumulative_calls",
    cumulativeUsers: "cumulative_users",
    dailyCalls: "daily_calls",
    dailyNewUsers: "daily_new_users",
    dailyCallingUsers: "daily_calling_users",
  };
  let previousDate = null;
  for (const [index, row] of journey.rows.entries()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) fail(`关键历程第 ${index + 1} 日期异常`);
    if (previousDate && dateOrdinal(row.date) - dateOrdinal(previousDate) !== 1) fail("关键历程日序列不连续");
    previousDate = row.date;
    const suppressed = new Set(row.suppressed_fields || []);
    if (suppressed.size !== (row.suppressed_fields || []).length || [...suppressed].some((field) => !Object.values(fieldMap).includes(field))) fail("关键历程抑制字段异常");
    for (const [publicField, marker] of Object.entries(fieldMap)) {
      const value = row[publicField];
      if (value === null) {
        if (!suppressed.has(marker)) fail(`关键历程 ${row.date}.${publicField} 为空但未声明抑制`);
        continue;
      }
      if (!Number.isSafeInteger(value) || value < 0 || suppressed.has(marker)) fail(`关键历程 ${row.date}.${publicField} 异常`);
      if (publicField.startsWith("daily") && value > 0 && value < data.meta.minimum_public_cell) fail(`关键历程 ${row.date}.${publicField} 低于公开阈值`);
      if (publicField.startsWith("cumulative") && value % data.meta.minimum_public_cell !== 0) fail(`关键历程 ${row.date}.${publicField} 未按公开阈值取整`);
    }
  }
  const cutoffDay = data.meta.data_cutoff.slice(0, 10);
  if (journey.timezone !== "Asia/Shanghai" || journey.as_of !== cutoffDay || journey.range_start !== journey.rows[0].date || journey.rows.at(-1).date !== cutoffDay) fail("关键历程时间边界异常");
  if (journey.rows.length !== inclusiveDays(journey.range_start, journey.as_of)) fail("关键历程没有覆盖每个完整自然日");
  const journeyTail = journey.rows.at(-1);
  if (Math.abs(journeyTail.cumulativeCalls - data.usage.total_calls) >= data.meta.minimum_public_cell || Math.abs(journeyTail.cumulativeUsers - data.usage.approved_users) >= data.meta.minimum_public_cell) fail("关键历程累计值与使用规模不闭合");
}

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

const growth = data.growth;
if (!growth || data.meta?.contract_revision !== "journey-growth-2026-08-17") fail("增长数据契约缺失；旧缓存不得继续使用");
if (!["confirmed_with_boundaries", "partial"].includes(growth.evidence_state)) fail("增长证据状态无效");
const registrationSource = growth.registration_definition?.source_field || growth.registration_definition?.source;
if (growth.registration_definition?.state !== "confirmed" || registrationSource !== "registered_at") fail("新注册未按且慢真实注册时间统计");
const cashflowDefinition = growth.cash_flow_definition || {};
if (!["confirmed", "partial"].includes(cashflowDefinition.state) || cashflowDefinition.first_inflow_scope !== "all_history") fail("资金流入或全历史首次入金口径未声明");
const cashflowPartial = cashflowDefinition.state === "partial";
if (growth.join_key_state !== "confirmed" || !/^\d{4}-\d{2}-\d{2}$/.test(growth.cashflow_max_date)) fail("增长关联键或资金截止日未确认");
if (cashflowPartial && (cashflowDefinition.source_type !== "asset_delta_proxy" || growth.evidence_state !== "partial" || data.meta.evidence_state !== "partial")) fail("资产入账代理证据状态不一致");
if (!cashflowPartial && (cashflowDefinition.source_type !== "authoritative_cashflow_daily" || growth.evidence_state !== "confirmed_with_boundaries")) fail("权威现金流证据状态不一致");

const { comparison, trend, funnel } = growth;
if (!comparison || inclusiveDays(comparison.current_start, comparison.current_end) !== 30 || inclusiveDays(comparison.previous_start, comparison.previous_end) !== 30) fail("增长同期窗口必须各为 30 个完整自然日");
if (!datesAreAdjacent(comparison.previous_end, comparison.current_start)) fail("增长同期窗口不连续");
if (comparison.current_end !== growth.cashflow_max_date) fail("增长窗口与资金完整日不一致");
const cashflowLagDays = dateOrdinal(data.meta.data_cutoff.slice(0, 10)) - dateOrdinal(growth.cashflow_max_date);
if (cashflowLagDays < 0 || (cashflowPartial && cashflowLagDays > 7)) fail("资产入账代理数据落后总看板超过 7 天");
if (!cashflowPartial && comparison.current_end !== data.meta.data_cutoff.slice(0, 10)) fail("权威资金窗口与总看板截止日不一致");
if (!trend || trend.grain_days !== 10 || inclusiveDays(trend.window_start, trend.window_end) !== 90 || trend.window_end !== comparison.current_end) fail("增长趋势必须为截至口径日的 90 日、每 10 日一段");
if (!funnel || funnel.followup_days !== 30 || funnel.registration_start !== comparison.previous_start || funnel.registration_end !== comparison.previous_end) fail("注册漏斗必须使用完整 30 日观察窗");
if (!growth.by_cohort || expectedIds.some((id) => !growth.by_cohort[id])) fail("增长人群数据缺失");

for (const cohortId of expectedIds) {
  const cohortGrowth = growth.by_cohort[cohortId];
  const expectedCohortUsers = data.usage[cohortId === "approved" ? "approved_users" : cohortId === "called" ? "ever_called_users" : "active_30d_users"];
  if (cohortGrowth.cohort_n !== expectedCohortUsers || !["complete", "high", "medium", "low"].includes(cohortGrowth.registration_time_coverage_state)) fail(`${cohortId} 注册覆盖契约异常`);
  if ("registered_at_nonnull_n" in cohortGrowth || "registered_at_missing_n" in cohortGrowth || "registration_time_coverage" in cohortGrowth) fail(`${cohortId} 公开快照不得暴露可反推注册缺失数`);
  const current = validateGrowthRow(cohortGrowth.current, growthSummaryFields, `${cohortId}.growth.current`);
  const previous = validateGrowthRow(cohortGrowth.previous, growthSummaryFields, `${cohortId}.growth.previous`);
  for (const row of [current, previous]) {
    const first = growthValue(row, "first_inflow_users");
    const inflowUsers = growthValue(row, "inflow_users");
    if (first !== null && inflowUsers !== null && first > inflowUsers) fail(`${cohortId} 首次入金用户大于资金流入用户`);
    if (inflowUsers === 0 && growthValue(row, "inflow_yuan") !== 0) fail(`${cohortId} 无资金流入用户但存在流入金额`);
    if (inflowUsers === null && growthValue(row, "inflow_yuan") !== null) fail(`${cohortId} 流入人数被抑制时金额也必须抑制`);
  }

  const funnelRow = validateGrowthRow(cohortGrowth.funnel, growthFunnelFields, `${cohortId}.growth.funnel`);
  const eligible = growthValue(funnelRow, "eligible_registrations");
  const d30 = growthValue(funnelRow, "first_inflow_d30_users");
  const d7 = growthValue(funnelRow, "first_inflow_d7_users");
  const holding = growthValue(funnelRow, "still_holding_users");
  if (eligible !== null && d30 !== null && d30 > eligible) fail(`${cohortId} 30 日首次入金大于可观察注册用户`);
  if (d30 !== null && d7 !== null && d7 > d30) fail(`${cohortId} 7 日首次入金大于 30 日首次入金`);
  if (d30 !== null && holding !== null && holding > d30) fail(`${cohortId} 仍持仓人数大于 30 日首次入金人数`);
  const previousRegistrations = growthValue(previous, "new_registrations");
  if ((eligible === null) !== (previousRegistrations === null) || (eligible !== null && eligible !== previousRegistrations)) fail(`${cohortId} 漏斗起点与前30日新注册不一致`);

  const periods = cohortGrowth.trend_periods;
  if (!Array.isArray(periods) || periods.length !== 9) fail(`${cohortId} 增长趋势必须为 9 段`);
  periods.forEach((period, index) => {
    validateGrowthRow(period, growthSummaryFields, `${cohortId}.growth.trend[${index}]`);
    if (inclusiveDays(period.start, period.end) !== 10) fail(`${cohortId} 第 ${index + 1} 个趋势段不是 10 日`);
    if (index === 0 && period.start !== trend.window_start) fail(`${cohortId} 趋势起点不一致`);
    if (index > 0 && !datesAreAdjacent(periods[index - 1].end, period.start)) fail(`${cohortId} 趋势段不连续`);
    if (index === periods.length - 1 && period.end !== trend.window_end) fail(`${cohortId} 趋势终点不一致`);
  });
  for (const field of ["new_registrations", "first_inflow_users", "inflow_users", "inflow_yuan", "outflow_yuan"]) {
    for (const [summary, slice, periodLabel] of [[previous, periods.slice(3, 6), "前 30 日"], [current, periods.slice(6), "近 30 日"]]) {
      const values = slice.map((period) => growthValue(period, field));
      const summaryValue = growthValue(summary, field);
      if ((summaryValue === null) !== values.some((value) => value === null)) fail(`${cohortId} ${periodLabel}${field} 抑制未上下传播`);
      if (field !== "inflow_users" && summaryValue !== null && values.every((value) => value !== null) && values.reduce((sum, value) => sum + value, 0) !== summaryValue) fail(`${cohortId} ${periodLabel}${field} 与趋势不闭合`);
    }
  }
}

const rejectSmallNestedDifference = (rows, field, relatedAmount = null, label = field) => {
  for (let index = 0; index < rows.length - 1; index += 1) {
    const broader = growthValue(rows[index], field);
    const narrower = growthValue(rows[index + 1], field);
    if (broader === null) {
      if (relatedAmount && growthValue(rows[index], relatedAmount) !== null) fail(`${label} 人数隐藏时关联金额仍公开`);
      continue;
    }
    if (narrower === null) continue;
    const difference = broader - narrower;
    if (difference < 0 || (difference > 0 && difference < data.meta.minimum_public_cell)) fail(`${label} 嵌套人群可差分反推小样本`);
  }
};
for (const period of ["current", "previous"]) {
  const rows = expectedIds.map((id) => growth.by_cohort[id][period]);
  rejectSmallNestedDifference(rows, "new_registrations", null, `${period} 新注册`);
  rejectSmallNestedDifference(rows, "first_inflow_users", null, `${period} 首次入金`);
  rejectSmallNestedDifference(rows, "inflow_users", "inflow_yuan", `${period} 资金流入`);
}
for (let index = 0; index < 9; index += 1) {
  const rows = expectedIds.map((id) => growth.by_cohort[id].trend_periods[index]);
  rejectSmallNestedDifference(rows, "new_registrations", null, `trend ${index + 1} 新注册`);
  rejectSmallNestedDifference(rows, "first_inflow_users", null, `trend ${index + 1} 首次入金`);
  rejectSmallNestedDifference(rows, "inflow_users", "inflow_yuan", `trend ${index + 1} 资金流入`);
}
for (const field of growthFunnelFields) rejectSmallNestedDifference(expectedIds.map((id) => growth.by_cohort[id].funnel), field, null, `funnel ${field}`);

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

if (!Array.isArray(data.quality_checks) || data.quality_checks.length !== 6) fail("数据健康度必须为 6 项");
for (const status of ["pass", "warn", "missing"]) {
  if (!data.quality_checks.some((item) => item.status === status)) fail(`数据健康缺少 ${status}`);
}
const growthQuality = data.quality_checks.find((item) => item.label === "注册与入金口径");
if (!growthQuality || growthQuality.status !== (cashflowPartial ? "warn" : "pass")) fail("注册与入金口径未与证据状态对齐");
if (!Array.isArray(data.definitions) || !data.definitions.some((item) => item.state === "missing")) fail("口径文档缺少 missing 边界");
for (const term of ["首次入金用户", "净入金"]) {
  if (!data.definitions.some((item) => item.term === term && item.state === (cashflowPartial ? "partial" : "confirmed"))) fail(`${term}定义与证据状态不一致`);
}

const publicText = JSON.stringify(data);
const forbidden = /(account3|broker_user|union_id|user_id|po_manager|portfolio_manager_info|relation_account|\broot\b|ying99_|手机号|phone|email|邮箱|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token|view[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
if (publicText.length > 150000) fail("公开快照异常过大");

for (const signal of [
  'id="refresh-button"',
  'id="cohort-ladder"',
  'id="growth-summary"',
  'id="growth-trend"',
  'id="growth-funnel"',
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
for (const term of ["批准用户", "历史调用用户", "近30日活跃用户", "新注册用户", "首次入金用户", "资金流入", "净入金", "且慢持仓", "参与率", "画像覆盖率", "confirmed", "partial", "missing", "suppressed"]) {
  if (!html.includes(term)) fail(`搜索索引稳定文本缺少 ${term}`);
}
for (const signal of ["LOCAL_REFRESH_BASE", "127.0.0.1:41792", "validateData", "validateGrowth", "isNewerSnapshot", "startLocalRefresh", "selectCohort", "selectGrowthMode", "renderGrowth", "selectBehaviorMode", "buildDocument"]) {
  if (!app.includes(signal)) fail(`交互缺少 ${signal}`);
}
for (const signal of ["@media (max-width: 680px)", "prefers-reduced-motion", "@media print", ".doc-panel", ".signal-bridge", ".growth-bridge", ".growth-trend", ".growth-funnel"]) {
  if (!css.includes(signal)) fail(`样式缺少 ${signal}`);
}
if (/https?:\/\/(?!127\.0\.0\.1)/.test(app.replaceAll("https://ontology.yingmi-inc.com", ""))) fail("页面脚本含未审计外部服务");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.OAP_QIEMAN_DASHBOARD_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`OAP × 且慢用户看板通过：${data.usage.approved_users} 位批准用户，${data.usage.active_30d_users} 位近 30 日活跃，资产快照 ${data.meta.asset_snapshot_date}。`);
