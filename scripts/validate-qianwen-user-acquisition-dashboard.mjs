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
const styles = readFileSync(join(reportRoot, "styles.css"), "utf8");
const preview = readFileSync(join(root, "public", "previews", "qianwen-user-acquisition-dashboard.svg"), "utf8");
const workbench = readFileSync(join(root, "src", "app.js"), "utf8");
const fail = (message) => { throw new Error(`千问用户数据看板校验失败：${message}`); };
const launchAt = "2026-08-10T08:00:00+08:00";
// v6 起统计窗口比正式上线提前一周，用于覆盖上线前的灰度绑定。
const windowStartAt = "2026-08-03T00:00:00+08:00";
const schemaVersion = "qianwen-user-acquisition-v6";
const cohortKeys = ["all", "new", "existing"];
const profileDimensionIds = [
  "asset_holding_status",
  "asset_bucket",
  "lifetime_investment_status",
  "age_bucket",
  "gender",
  "residence_province",
  "app_usage_status",
  "wechat_mp_status",
  "bank_card_status",
  "risk_assessment_status",
];
const behaviorMetricIds = [
  "funded_after_binding",
  "first_investment_after_binding",
  "investment_activity_after_binding",
  "redemption_after_binding",
  "xiaogu_used_after_binding",
];
const businessStatIds = [
  "holding_amount",
  "inflow_amount",
  "buy_amount",
  "sell_amount",
];
const publicStates = new Set(["confirmed", "suppressed", "unavailable"]);
const countLikePublicKey = /(?:^|_)(?:account|accounts|actor|actors|count|counts|population|eligible|excluded|reached|not_reached|unknown|event|events|share|rate|ratio|percent|total)(?:_|$)/i;
const isCount = (value) => Number.isInteger(value) && value >= 0;

function assertPlainObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} 不是有效对象`);
}

function assertExactKeys(actualKeys, expectedKeys, path) {
  const actual = [...actualKeys].sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${path} 必须且只能包含 ${expectedKeys.join("、")}`);
  }
}

function assertPublicCell(value, path, minimumPublicCell) {
  if (!isCount(value)) fail(`${path} 必须为非负整数`);
  if (value > 0 && value < minimumPublicCell) fail(`${path} 小于公开最小样本阈值 ${minimumPublicCell}`);
}

function assertDescriptiveExtrasOnly(object, allowedKeys, path) {
  for (const [key, value] of Object.entries(object)) {
    if (allowedKeys.has(key)) continue;
    if (countLikePublicKey.test(key) || (value !== null && typeof value !== "string" && typeof value !== "boolean")) {
      fail(`${path}.${key} 是未经校验的公开数据字段`);
    }
  }
}

function assertHiddenItemCarriesNoCounts(item, path) {
  if (Object.hasOwn(item, "buckets")) fail(`${path} 为 ${item.state} 时不得携带 buckets`);
  for (const [key, value] of Object.entries(item)) {
    if (key === "id" || key === "state") continue;
    if (countLikePublicKey.test(key) || typeof value === "number" || Array.isArray(value) || (value && typeof value === "object")) {
      fail(`${path} 为 ${item.state} 时不得携带可反推人数的字段 ${key}`);
    }
  }
}

function assertAudienceDataAsOf(item, path) {
  if (item.state === "unavailable") return;
  const value = item.data_as_of || "";
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\+08:00)?$/.test(value)) fail(`${path}.data_as_of 无效`);
  if (value.length === 10) {
    if (value > data.meta.data_cutoff.slice(0, 10)) fail(`${path}.data_as_of 晚于看板快照`);
    return;
  }
  if (Date.parse(value) > Date.parse(data.meta.data_cutoff)) fail(`${path}.data_as_of 晚于看板快照`);
}

function assertItemIds(items, expectedIds, path) {
  if (!Array.isArray(items)) fail(`${path} 必须为数组`);
  const ids = items.map((item, index) => {
    assertPlainObject(item, `${path}[${index}]`);
    if (typeof item.id !== "string" || !item.id) fail(`${path}[${index}].id 无效`);
    return item.id;
  });
  if (new Set(ids).size !== ids.length) fail(`${path} 存在重复指标`);
  assertExactKeys(ids, expectedIds, path);
}

function assertProfileItem(item, path, population, minimumPublicCell) {
  if (!publicStates.has(item.state)) fail(`${path}.state 无效`);
  assertAudienceDataAsOf(item, path);
  if (item.state !== "confirmed") {
    assertHiddenItemCarriesNoCounts(item, path);
    return;
  }
  if (!Array.isArray(item.buckets) || !item.buckets.length) fail(`${path}.buckets 缺失`);
  assertDescriptiveExtrasOnly(item, new Set(["id", "state", "buckets"]), path);
  const bucketIds = new Set();
  let total = 0;
  item.buckets.forEach((bucket, index) => {
    const bucketPath = `${path}.buckets[${index}]`;
    assertPlainObject(bucket, bucketPath);
    if (typeof bucket.id !== "string" || !bucket.id) fail(`${bucketPath}.id 无效`);
    if (bucketIds.has(bucket.id)) fail(`${path}.buckets 存在重复分组 ${bucket.id}`);
    bucketIds.add(bucket.id);
    assertPublicCell(bucket.accounts, `${bucketPath}.accounts`, minimumPublicCell);
    assertDescriptiveExtrasOnly(bucket, new Set(["id", "label", "accounts"]), bucketPath);
    total += bucket.accounts;
  });
  if (total !== population) fail(`${path}.buckets 合计 ${total} 与用户数 ${population} 不闭合`);
}

function assertBehaviorItem(item, path, population, minimumPublicCell) {
  if (!publicStates.has(item.state)) fail(`${path}.state 无效`);
  assertAudienceDataAsOf(item, path);
  if (item.state !== "confirmed") {
    assertHiddenItemCarriesNoCounts(item, path);
    return;
  }
  const countFields = [
    "population_accounts",
    "eligible_accounts",
    "excluded_accounts",
    "reached_accounts",
    "not_reached_accounts",
    "unknown_accounts",
  ];
  for (const field of countFields) assertPublicCell(item[field], `${path}.${field}`, minimumPublicCell);
  if (item.population_accounts !== population) fail(`${path}.population_accounts 与所属用户数不一致`);
  if (item.population_accounts !== item.eligible_accounts + item.excluded_accounts) {
    fail(`${path} 的 population_accounts 不等于 eligible_accounts + excluded_accounts`);
  }
  if (item.eligible_accounts !== item.reached_accounts + item.not_reached_accounts + item.unknown_accounts) {
    fail(`${path} 的 eligible_accounts 不等于 reached_accounts + not_reached_accounts + unknown_accounts`);
  }
  if (Object.hasOwn(item, "event_count")) {
    assertPublicCell(item.event_count, `${path}.event_count`, minimumPublicCell);
    if (item.event_count < item.reached_accounts) fail(`${path}.event_count 小于 reached_accounts`);
  }
  assertDescriptiveExtrasOnly(
    item,
    new Set(["id", "state", ...countFields, "event_count"]),
    path,
  );
}

// 经营金额只公开整体口径：金额必须是非负数，涉及人数仍须通过小样本阈值。
function assertBusinessItem(item, path, population, minimumPublicCell) {
  if (!publicStates.has(item.state)) fail(`${path}.state 无效`);
  assertAudienceDataAsOf(item, path);
  if (item.state !== "confirmed") {
    assertHiddenItemCarriesNoCounts(item, path);
    return;
  }
  const amountFields = ["amount_wan", "per_capita_wan", "median_wan"];
  if (!Number.isFinite(item.amount_wan) || item.amount_wan < 0) fail(`${path}.amount_wan 必须为非负数`);
  for (const field of amountFields.slice(1)) {
    if (Object.hasOwn(item, field) && (!Number.isFinite(item[field]) || item[field] < 0)) fail(`${path}.${field} 必须为非负数`);
  }
  assertPublicCell(item.accounts, `${path}.accounts`, minimumPublicCell);
  if (item.accounts > population) fail(`${path}.accounts 超过所属用户数`);
  if (item.accounts === 0 && item.amount_wan !== 0) fail(`${path} 无人涉及却有金额`);
  if (Object.hasOwn(item, "event_count")) {
    if (!isCount(item.event_count)) fail(`${path}.event_count 必须为非负整数`);
    if (item.accounts === 0 && item.event_count !== 0) fail(`${path}.event_count 与人数矛盾`);
  }
  assertDescriptiveExtrasOnly(
    item,
    new Set(["id", "state", "accounts", "event_count", ...amountFields]),
    path,
  );
}

function assertNoCrossCohortInference(section, listKey, expectedIds, path) {
  if (data.metrics.missing_registration_time !== 0) return;
  for (const id of expectedIds) {
    const states = cohortKeys.map((cohortKey) => section.cohorts[cohortKey][listKey].find((item) => item.id === id).state);
    if (states.filter((state) => state === "confirmed").length === 2) {
      fail(`${path}.${id} 仅隐藏一个用户类型，可由其余两个类型反推出人数`);
    }
  }
}

function validateAudienceData() {
  assertPlainObject(data.privacy, "privacy");
  const minimumPublicCell = data.privacy.minimum_public_cell;
  if (!Number.isInteger(minimumPublicCell) || minimumPublicCell < 20) fail("privacy.minimum_public_cell 必须至少为 20");
  if (data.privacy.scope !== "profile_and_behavior_only") fail("privacy.scope 必须限定为画像与行为模块");
  if (data.privacy.protected_sections?.join(",") !== "profile,behavior,business") fail("privacy.protected_sections 必须明确为画像、行为与经营模块");
  if (data.privacy.multi_dimension_cross_tabs_public !== false) fail("privacy.multi_dimension_cross_tabs_public 必须关闭");
  for (const key of ["behavior", "business"]) {
    if (data[key]?.window_start_at !== windowStartAt || data[key]?.window_end_at !== data.meta.data_cutoff || data[key]?.anchor !== "first_bound_at") {
      fail(`${key} 观察窗口或锚点异常`);
    }
  }

  const expectedPopulation = {
    all: data.metrics.bound_accounts,
    new: data.metrics.new_accounts,
    existing: data.metrics.existing_accounts,
  };
  const sections = [
    { key: "profile", listKey: "dimensions", expectedIds: profileDimensionIds, assertItem: assertProfileItem },
    { key: "behavior", listKey: "metrics", expectedIds: behaviorMetricIds, assertItem: assertBehaviorItem },
    { key: "business", listKey: "stats", expectedIds: businessStatIds, assertItem: assertBusinessItem },
  ];
  for (const { key, listKey, expectedIds, assertItem } of sections) {
    assertPlainObject(data[key], key);
    assertPlainObject(data[key].cohorts, `${key}.cohorts`);
    assertExactKeys(Object.keys(data[key].cohorts), cohortKeys, `${key}.cohorts`);
    for (const cohortKey of cohortKeys) {
      const cohortPath = `${key}.cohorts.${cohortKey}`;
      const cohort = data[key].cohorts[cohortKey];
      assertPlainObject(cohort, cohortPath);
      if (!isCount(cohort.population_accounts) || cohort.population_accounts !== expectedPopulation[cohortKey]) {
        fail(`${cohortPath}.population_accounts 必须等于关键数据 ${expectedPopulation[cohortKey]}`);
      }
      assertItemIds(cohort[listKey], expectedIds, `${cohortPath}.${listKey}`);
      cohort[listKey].forEach((item) => assertItem(
        item,
        `${cohortPath}.${listKey}.${item.id}`,
        cohort.population_accounts,
        minimumPublicCell,
      ));
      assertDescriptiveExtrasOnly(cohort, new Set(["population_accounts", listKey]), cohortPath);
    }
    assertNoCrossCohortInference(data[key], listKey, expectedIds, key);
  }
}

if (data.schema_version !== schemaVersion) fail("数据版本异常");
if (data.meta?.window_start_at !== windowStartAt || data.meta?.launch_at !== launchAt || data.meta?.timezone !== "Asia/Shanghai") {
  fail("统计窗口或服务上线时间口径不完整");
}
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(data.meta?.data_cutoff || "")) fail("数据截止时间不是北京时间");
if (!Date.parse(data.meta?.data_cutoff) || !Date.parse(data.meta?.generated_at) || Date.parse(data.meta.data_cutoff) < Date.parse(windowStartAt)) fail("数据时间无效");
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
  fail("用户结构无法闭合");
}
if (Object.hasOwn(data, "launch_metrics")) fail("不应保留冗余的上线期指标");

if (!Array.isArray(data.daily) || !data.daily.length) fail("每日趋势缺失");
if (data.daily[0].date !== windowStartAt.slice(0, 10)) fail("每日趋势未从统计窗口起始日开始");
const cutoffDay = data.meta.data_cutoff.slice(0, 10);
let cumulativeNew = 0;
let cumulativeExisting = 0;
let cumulativeUnclassified = 0;
let cumulativeBound = 0;
let prior = "";
for (let index = 0; index < data.daily.length; index += 1) {
  const row = data.daily[index];
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
  const shouldBePartial = index === data.daily.length - 1;
  if (typeof row.partial !== "boolean" || row.partial !== shouldBePartial) fail(`只有最新日应标记为非完整自然日：${row.date}`);
  if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
    fail(`每日用户结构不闭合：${row.date}`);
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
if (data.daily.at(-1).date !== cutoffDay) fail("每日趋势未覆盖到数据截止日");
if (data.meta.latest_day_is_partial !== true || data.daily.at(-1).partial !== true) fail("最新日期未标记为非完整日");
if (
  cumulativeNew !== data.metrics.new_accounts
  || cumulativeExisting !== data.metrics.existing_accounts
  || cumulativeUnclassified !== data.metrics.missing_registration_time
  || cumulativeBound !== data.metrics.bound_accounts
) fail("每日趋势与总数不闭合");

validateAudienceData();

const publicText = JSON.stringify(data);
const forbidden = /(ying99_|union_id|user_id|po_manager_id|手机号|phone|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
const forbiddenPublicKey = /(?:^|_)(?:user_ids?|customer_ids?|member_ids?|po_manager_ids?|union_ids?|open_ids?|account_ids?|phone|mobile|email|full_name|real_name|id_card|identity_card|device|device_id|device_model|imei|idfa|oaid|ip|ip_address|city|province|district|address|longitude|latitude|amount|balance|aum|asset_value|total_asset|money|cash_value|conversation_text|dialogue_text|transcript|prompt|question_text|answer_text|message_text|content_text|query_text|response_text)(?:_|$)/i;
const forbiddenChineseKey = /(手机号|手机号码|邮箱|姓名|身份证|用户\s*[Ii][Dd]|用户标识|设备|城市|省份|地址|经纬度|金额|余额|资产总额|对话文本|问题文本|回答文本|消息文本)/;
const aggregateAmountKeys = new Set(["amount_wan", "per_capita_wan", "median_wan"]);
function assertNoForbiddenKeys(value, path = "data") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    // 经营模块的整体金额是公开口径的一部分，其余位置一律禁止出现金额类字段。
    const allowedAggregateAmount = aggregateAmountKeys.has(key) && path.startsWith("data.business.");
    if (!allowedAggregateAmount && (forbiddenPublicKey.test(key) || forbiddenChineseKey.test(key))) {
      fail(`${path}.${key} 是禁止公开的明细字段`);
    }
    assertNoForbiddenKeys(nested, `${path}.${key}`);
  }
}
assertNoForbiddenKeys(data);

for (const signal of [
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
  'id="business-tiles"',
  'id="asset-distribution"',
  'id="behavior-bars"',
  'id="profile-distribution"',
  'id="touchpoint-distribution"',
  'id="readout-label"',
  'id="readout-date"',
  'id="audience-table"',
  'id="audience-table-body"',
  'id="audience-footnote"',
  'id="data-refresh-button"',
  'data/fallback-data.js',
]) {
  if (!html.includes(signal)) fail(`页面缺少 ${signal}`);
}
for (const signal of [
  'name="series" value="bound"',
  'name="series" value="new"',
  'name="series" value="existing"',
  'name="series" value="daily"',
  'name="range" value="full-window"',
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
for (const key of ["bound", "new", "existing", "daily"]) {
  if (!html.includes(`id="value-${key}"`)) fail(`读数条缺少 ${key} 的最新数值`);
}
for (const removed of [
  "localStorage",
  "id=\"toast\"",
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
]) {
  if (html.includes(removed) || app.includes(removed)) fail(`页面仍包含已移除内容：${removed}`);
}
for (const signal of [
  "qianwen-user-acquisition-v6",
  "validateData",
  "validateAudienceData",
  "filteredRows",
  "renderChart",
  "renderTable",
  "PROFILE_DIMENSIONS",
  "BEHAVIOR_METRICS",
  "BUSINESS_STATS",
  "renderAudience",
  "renderDistributionPanels",
  "renderBehaviorBars",
  "renderBusinessTiles",
  "renderAudienceTable",
  "renderReadout",
  "loadPublishedData",
  "LOCAL_REFRESH_BASE",
  "127.0.0.1:43122",
  "callRefreshService",
  "waitForRefresh",
  "waitForPublishedData",
  "refreshPublishedData",
  "window_cumulative_bound",
  "visibleSeries",
  "selectedDate",
]) {
  if (!app.includes(signal)) fail(`页面脚本缺少 ${signal}`);
}
for (const rule of [
  ".chart-line-bound",
  ".chart-line-new",
  ".chart-line-existing",
  ".chart-bar-new",
  ".chart-bar-existing",
  ".chart-prelaunch",
  ".chart-crosshair",
  ".chip-value",
  ".metric-tile-value",
]) {
  if (!styles.includes(rule)) fail(`样式表缺少 ${rule}`);
}
// 双 Y 轴会让两种量纲挤在同一张图里，v6 起累计与每日新增拆成上下两块独立坐标
for (const removed of [".chart-axis-right", ".chart-area-new", ".chart-area-existing", ".chart-bound-line"]) {
  if (styles.includes(removed)) fail(`样式表仍保留已废弃的双轴样式 ${removed}`);
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
for (const phrase of [
  "千问 X 且慢AI小顾",
  "累计绑定用户",
  "其中新用户",
  "老用户",
  "用户增长走势",
  "对应数据明细",
  "在且慢的经营情况与用户画像",
  "保有规模与账户状态",
  "绑定后入金与交易",
  "用户画像",
  "触点与投资准备度",
]) {
  if (!reportingCopy.includes(phrase)) fail(`汇报文案缺少：${phrase}`);
}

if (process.argv.includes("--write-fallback")) {
  writeFileSync(fallbackPath, `window.QIANWEN_ACQUISITION_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

console.log(`千问用户数据看板通过：${windowStartAt.slice(0, 10)} 起 ${data.metrics.bound_accounts} 个绑定用户，${data.daily.length} 天趋势，截止 ${data.meta.data_cutoff}。`);
