/**
 * 千问用户数据看板：数据层校验（口径唯一来源）
 *
 * 只校验快照 JSON 本身：数据版本、上线口径、关键数据闭合、每日趋势闭合、
 * 画像与行为的小样本保护、禁止公开的明细字段。不读取任何文件，可被两处复用：
 *   - scripts/validate-qianwen-user-acquisition-dashboard.mjs（构建期，另加页面与工作台校验）
 *   - scripts/qianwen-dashboard-refresh-agent.mjs（本机刷新，落盘发布前把关）
 */

export const SCHEMA_VERSION = "qianwen-user-acquisition-v5";
export const LAUNCH_AT = "2026-08-10T08:00:00+08:00";

const cohortKeys = ["all", "new", "existing"];
const profileDimensionIds = [
  "asset_holding_status",
  "asset_bucket",
  "lifetime_investment_status",
  "bank_card_status",
  "risk_assessment_status",
];
const behaviorMetricIds = [
  "funded_after_binding",
  "first_investment_after_binding",
  "investment_activity_after_binding",
  "qieman_app_used_after_binding",
  "xiaogu_used_after_binding",
];
const publicStates = new Set(["confirmed", "suppressed", "unavailable"]);
const countLikePublicKey = /(?:^|_)(?:account|accounts|actor|actors|count|counts|population|eligible|excluded|reached|not_reached|unknown|event|events|share|rate|ratio|percent|total)(?:_|$)/i;
const forbidden = /(ying99_|union_id|user_id|po_manager_id|手机号|phone|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token)/i;
const forbiddenPublicKey = /(?:^|_)(?:user_ids?|customer_ids?|member_ids?|po_manager_ids?|union_ids?|open_ids?|account_ids?|phone|mobile|email|full_name|real_name|id_card|identity_card|device|device_id|device_model|imei|idfa|oaid|ip|ip_address|city|province|district|address|longitude|latitude|amount|balance|aum|asset_value|total_asset|money|cash_value|conversation_text|dialogue_text|transcript|prompt|question_text|answer_text|message_text|content_text|query_text|response_text)(?:_|$)/i;
const forbiddenChineseKey = /(手机号|手机号码|邮箱|姓名|身份证|用户\s*[Ii][Dd]|用户标识|设备|城市|省份|地址|经纬度|金额|余额|资产总额|对话文本|问题文本|回答文本|消息文本)/;

const isCount = (value) => Number.isInteger(value) && value >= 0;

export const PROFILE_DIMENSION_IDS = [...profileDimensionIds];
export const BEHAVIOR_METRIC_IDS = [...behaviorMetricIds];

/**
 * 校验一份看板快照。通过返回原对象，不通过抛 Error。
 */
export function validateQianwenDashboardData(data) {
  const fail = (message) => { throw new Error(`千问用户数据看板校验失败：${message}`); };

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
    if (data.privacy.protected_sections?.join(",") !== "profile,behavior") fail("privacy.protected_sections 必须明确为画像与行为模块");
    if (data.privacy.multi_dimension_cross_tabs_public !== false) fail("privacy.multi_dimension_cross_tabs_public 必须关闭");
    if (data.behavior?.window_start_at !== LAUNCH_AT || data.behavior?.window_end_at !== data.meta.data_cutoff || data.behavior?.anchor !== "first_bound_at") {
      fail("behavior 观察窗口或锚点异常");
    }

    const expectedPopulation = {
      all: data.metrics.bound_accounts,
      new: data.metrics.new_accounts,
      existing: data.metrics.existing_accounts,
    };
    const sections = [
      { key: "profile", listKey: "dimensions", expectedIds: profileDimensionIds, assertItem: assertProfileItem },
      { key: "behavior", listKey: "metrics", expectedIds: behaviorMetricIds, assertItem: assertBehaviorItem },
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

  function assertNoForbiddenKeys(value, path = "data") {
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (forbiddenPublicKey.test(key) || forbiddenChineseKey.test(key)) fail(`${path}.${key} 是禁止公开的明细字段`);
      assertNoForbiddenKeys(nested, `${path}.${key}`);
    }
  }

  assertPlainObject(data, "data");
  if (data.schema_version !== SCHEMA_VERSION) fail("数据版本异常");
  if (data.meta?.window_start_at !== LAUNCH_AT || data.meta?.launch_at !== LAUNCH_AT || data.meta?.timezone !== "Asia/Shanghai") {
    fail("服务上线时间口径不完整");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(data.meta?.data_cutoff || "")) fail("数据截止时间不是北京时间");
  if (!Date.parse(data.meta?.data_cutoff) || !Date.parse(data.meta?.generated_at) || Date.parse(data.meta.data_cutoff) < Date.parse(LAUNCH_AT)) fail("数据时间无效");
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
  if (Object.hasOwn(data, "launch_metrics")) fail("v5 不应保留冗余上线阶段指标");

  if (!Array.isArray(data.daily) || !data.daily.length) fail("每日趋势缺失");
  if (data.daily[0].date !== "2026-08-10") fail("每日趋势未从服务上线日开始");
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
    const shouldBePartial = index === 0 || index === data.daily.length - 1;
    if (typeof row.partial !== "boolean" || row.partial !== shouldBePartial) fail(`首日或最新日完整性标记异常：${row.date}`);
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

  if (forbidden.test(JSON.stringify(data))) fail("公开快照包含内部标识、PII 或凭证字段");
  assertNoForbiddenKeys(data);

  return data;
}
