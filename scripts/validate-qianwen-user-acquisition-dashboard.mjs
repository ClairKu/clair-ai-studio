import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, webcrypto } from "node:crypto";
import { gunzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportRoot = join(root, "public", "reports", "qianwen-user-acquisition-dashboard");
const dataPath = join(reportRoot, "data", "latest.json");
const fallbackPath = join(reportRoot, "data", "fallback-data.js");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const html = readFileSync(join(reportRoot, "index.html"), "utf8");
const app = readFileSync(join(reportRoot, "app.js"), "utf8");
const styles = readFileSync(join(reportRoot, "styles.css"), "utf8");
const questionEnvelope = JSON.parse(readFileSync(join(reportRoot, "data", "questions.enc.json"), "utf8"));
const preview = readFileSync(join(root, "public", "previews", "qianwen-user-acquisition-dashboard.svg"), "utf8");
const workbench = readFileSync(join(root, "src", "app.js"), "utf8");
const fail = (message) => { throw new Error(`千问用户数据看板校验失败：${message}`); };
const launchAt = "2026-08-10T08:00:00+08:00";
// v6 起统计窗口比正式上线提前一周，用于覆盖上线前的灰度绑定。
const windowStartAt = "2026-08-03T00:00:00+08:00";
const schemaVersion = "qianwen-user-acquisition-v8";
const cohortKeys = ["all", "new", "existing"];
const profileDimensionIds = [
  "asset_holding_status",
  "asset_bucket",
  "asset_at_bind_status",
  "holding_lifecycle_status",
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
  "account_opened_after_binding",
  "risk_assessed_after_binding",
  "first_funding_after_binding",
  "repeat_investment_after_binding",
];
const businessStatIds = [
  "holding_amount",
  "inflow_amount",
  "inflow_transactions",
  "buy_amount",
  "zero_asset_inflow_amount",
  "sell_amount",
];
const publicStates = new Set(["confirmed", "suppressed", "unavailable"]);
const countLikePublicKey = /(?:^|_)(?:account|accounts|actor|actors|count|counts|population|eligible|excluded|reached|not_reached|unknown|event|events|share|rate|ratio|percent|total)(?:_|$)/i;
const isCount = (value) => Number.isInteger(value) && value >= 0;
const questionTopicIds = ["holding_account", "product_analysis", "market_research", "product_selection",
  "transaction_action", "planning_configuration", "knowledge_explain", "qieman_service",
  "report_information", "dialogue_followup", "other_expression"];
const questionDirectionIds = ["holding_diagnosis", "product_research", "product_selection", "asset_allocation", "market_insight",
  "transaction_execution", "investment_learning", "qieman_service", "conversation_other"];
const questionObjectIds = ["own_account", "specific_product", "fund_category", "strategy_portfolio", "asset_class", "goal_plan",
  "market_environment", "platform_service", "unspecified"];
const questionStyleIds = ["direct_request", "diagnose_evaluate", "compare_choose", "why_explain", "how_to", "forecast_risk",
  "fact_lookup", "conversation_fragment"];
const questionCognitionIds = ["beginner_signal", "developing_signal", "advanced_signal", "indeterminate"];
const questionPersonaIds = ["holding_optimizer", "product_decider", "planning_allocator", "market_tracker", "execution_seeker",
  "learning_builder", "platform_explorer", "preset_only", "light_conversation"];
const questionTurnIds = ["1", "2", "3", "4_5", "6_plus"];

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
  const isTransactionCount = item.id === "inflow_transactions";
  if (isTransactionCount) {
    if (!isCount(item.event_count)) fail(`${path}.event_count 必须为非负整数`);
    if (Object.hasOwn(item, "amount_wan")) fail(`${path} 笔数指标不得携带金额`);
  } else {
    if (!Number.isFinite(item.amount_wan) || item.amount_wan < 0) fail(`${path}.amount_wan 必须为非负数`);
    for (const field of amountFields.slice(1)) {
      if (Object.hasOwn(item, field) && (!Number.isFinite(item[field]) || item[field] < 0)) fail(`${path}.${field} 必须为非负数`);
    }
  }
  assertPublicCell(item.accounts, `${path}.accounts`, minimumPublicCell);
  if (item.accounts > population) fail(`${path}.accounts 超过所属用户数`);
  if (item.accounts === 0 && item.amount_wan !== 0) fail(`${path} 无人涉及却有金额`);
  if (Object.hasOwn(item, "event_count")) {
    if (!isCount(item.event_count)) fail(`${path}.event_count 必须为非负整数`);
    if (item.accounts === 0 && item.event_count !== 0) fail(`${path}.event_count 与人数矛盾`);
    if (item.event_count < item.accounts) fail(`${path}.event_count 小于涉及人数`);
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
  if (!Number.isInteger(minimumPublicCell) || minimumPublicCell < 1) fail("privacy.minimum_public_cell 必须至少为 1");
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

function validateQuestionInsights() {
  const insight = data.question_insights;
  assertPlainObject(insight, "question_insights");
  if (insight.as_of !== data.meta.data_cutoff || insight.cohort !== "new"
      || insight.cohort_definition !== "registered_within_60m_of_first_binding") fail("question_insights 人群或截止时点异常");
  if (insight.methodology?.topic_model !== "keyword-primary-intent-v1"
      || insight.methodology?.taxonomy !== "rule-based-multiaxis-v2"
      || insight.methodology?.raw_corpus !== "deidentified_redacted_encrypted_v2"
      || insight.methodology?.top_question_min_users !== 10) fail("question_insights 方法说明异常");
  const summaryKeys = ["bound_users", "asking_users", "questions", "sessions", "legacy_preset_questions",
    "short_followups", "first_question_preset_users", "one_day_users", "multi_day_users", "top_1pct_questions", "top_5pct_questions"];
  assertPlainObject(insight.summary, "question_insights.summary");
  assertExactKeys(Object.keys(insight.summary), summaryKeys, "question_insights.summary");
  summaryKeys.forEach((key) => { if (!isCount(insight.summary[key])) fail(`question_insights.summary.${key} 无效`); });
  const summary = insight.summary;
  if (summary.bound_users !== data.metrics.new_accounts || summary.asking_users > summary.bound_users) fail("question_insights 新用户人数异常");
  if (summary.sessions > summary.questions || summary.one_day_users + summary.multi_day_users !== summary.asking_users) fail("question_insights 汇总无法闭合");
  if (summary.top_1pct_questions > summary.top_5pct_questions || summary.top_5pct_questions > summary.questions) fail("question_insights 集中度异常");
  const depthIds = ["1", "2_4", "5_9", "10_19", "20_plus"];
  assertItemIds(insight.depth, depthIds, "question_insights.depth");
  if (insight.depth.some((item) => !isCount(item.users)) || insight.depth.reduce((sum, item) => sum + item.users, 0) !== summary.asking_users) {
    fail("question_insights.depth 人数不闭合");
  }
  for (const scope of ["all", "first"]) {
    const rows = insight.topics?.[scope];
    assertItemIds(rows, questionTopicIds, `question_insights.topics.${scope}`);
    rows.forEach((item) => {
      if (!isCount(item.questions) || !isCount(item.users) || item.users > summary.asking_users) fail(`question_insights.topics.${scope}.${item.id} 无效`);
    });
    const expected = scope === "all" ? summary.questions : summary.asking_users;
    if (rows.reduce((sum, item) => sum + item.questions, 0) !== expected) fail(`question_insights.topics.${scope} 不闭合`);
  }
  if (!Array.isArray(insight.top_questions)) fail("question_insights.top_questions 缺失");
  const sensitiveText = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[0-9Xx](?!\d)|身份证|银行卡|账号|密码)/i;
  insight.top_questions.forEach((item, index) => {
    if (item.rank !== index + 1 || typeof item.question !== "string" || item.question.length < 5
      || !questionDirectionIds.includes(item.direction) || !isCount(item.questions) || !isCount(item.users)
      || item.users < insight.methodology.top_question_min_users
      || sensitiveText.test(item.question)) fail(`question_insights.top_questions[${index}] 异常`);
  });

  const research = insight.research;
  assertPlainObject(research, "question_insights.research");
  if (research.schema_version !== "qianwen-question-research-v2" || research.as_of !== insight.as_of
      || research.methodology?.taxonomy !== "rule-based-multiaxis-v2"
      || research.methodology?.preset_ctr_note !== "no_impression_log_asker_reach_is_proxy_not_true_ctr"
      || research.methodology?.followup_definition !== "same_session_second_or_later_self_authored_substantive_question") {
    fail("question_insights.research 方法或版本异常");
  }
  const researchSummaryKeys = ["questions", "asking_users", "sessions", "preset_questions", "preset_users", "preset_first_users",
    "self_authored_questions", "self_authored_users", "substantive_questions", "substantive_users", "short_followups", "preset_only_users",
    "preset_follow_on_users", "preset_follow_on_questions"];
  assertPlainObject(research.summary, "question_insights.research.summary");
  assertExactKeys(Object.keys(research.summary), researchSummaryKeys, "question_insights.research.summary");
  researchSummaryKeys.forEach((key) => { if (!isCount(research.summary[key])) fail(`question_insights.research.summary.${key} 无效`); });
  const rs = research.summary;
  if (rs.questions !== summary.questions || rs.asking_users !== summary.asking_users || rs.sessions !== summary.sessions
      || rs.preset_questions + rs.self_authored_questions !== rs.questions
      || rs.substantive_questions + rs.short_followups !== rs.self_authored_questions
      || rs.substantive_users > rs.self_authored_users || rs.self_authored_users > rs.asking_users
      || rs.preset_users > rs.asking_users || rs.preset_first_users > rs.preset_users || rs.preset_only_users > rs.preset_users
      || rs.preset_follow_on_users > rs.preset_users || rs.preset_follow_on_questions > rs.substantive_questions) {
    fail("question_insights.research 汇总无法闭合");
  }

  const journey = research.journey;
  assertPlainObject(journey, "question_insights.research.journey");
  const journeyCountKeys = ["asking_users", "conversation_sessions", "user_question_turns", "preset_questions", "self_authored_questions",
    "substantive_questions", "short_followups", "self_authored_users", "substantive_users", "substantive_sessions", "followup_users",
    "followup_sessions", "no_followup_users", "one_question_users", "multi_question_users", "followup_user_substantive_questions"];
  journeyCountKeys.forEach((key) => { if (!isCount(journey[key])) fail(`question_insights.research.journey.${key} 无效`); });
  const journeyAverageKeys = ["average_questions_per_asking_user", "average_self_questions_per_self_user",
    "average_substantive_questions_per_user", "average_substantive_questions_per_followup_user", "average_turns_per_session"];
  journeyAverageKeys.forEach((key) => {
    if (!Number.isFinite(journey[key]) || journey[key] < 0) fail(`question_insights.research.journey.${key} 无效`);
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(journey.observed_from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(journey.observed_to || "")
      || journey.asking_users !== rs.asking_users || journey.conversation_sessions !== rs.sessions || journey.user_question_turns !== rs.questions
      || journey.preset_questions !== rs.preset_questions || journey.self_authored_questions !== rs.self_authored_questions
      || journey.substantive_questions !== rs.substantive_questions || journey.short_followups !== rs.short_followups
      || journey.self_authored_users !== rs.self_authored_users || journey.substantive_users !== rs.substantive_users
      || journey.preset_questions + journey.self_authored_questions !== journey.user_question_turns
      || journey.substantive_questions + journey.short_followups !== journey.self_authored_questions
      || journey.followup_users + journey.no_followup_users !== journey.substantive_users
      || journey.one_question_users + journey.multi_question_users !== journey.substantive_users
      || journey.followup_user_substantive_questions > journey.substantive_questions) fail("提问旅程汇总无法闭合");
  assertItemIds(journey.question_depth, ["1", "2_3", "4_9", "10_plus"], "question_insights.research.journey.question_depth");
  if (journey.question_depth.some((item) => !isCount(item.users) || !isCount(item.questions))
      || journey.question_depth.reduce((sum, item) => sum + item.users, 0) !== journey.substantive_users
      || journey.question_depth.reduce((sum, item) => sum + item.questions, 0) !== journey.substantive_questions) fail("提问深度无法闭合");

  const cross = research.cross_analysis;
  assertPlainObject(cross, "question_insights.research.cross_analysis");
  const crossSources = ["all", "preset", "self", "substantive"];
  const crossEngagements = ["all", "no_followup", "followup"];
  assertExactKeys(cross.sources, crossSources, "question_insights.research.cross_analysis.sources");
  assertExactKeys(cross.engagements, crossEngagements, "question_insights.research.cross_analysis.engagements");
  const expectedGroupIds = crossSources.flatMap((source) => crossEngagements.map((engagement) => `${source}:${engagement}`));
  if (!Array.isArray(cross.groups) || cross.groups.length !== expectedGroupIds.length) fail("提问交叉分析分组缺失");
  assertExactKeys(cross.groups.map((group) => group.id), expectedGroupIds, "question_insights.research.cross_analysis.groups");
  const crossDimensions = [
    ["direction", questionDirectionIds],
    ["object", questionObjectIds],
    ["style", questionStyleIds],
    ["cognition", questionCognitionIds],
  ];
  cross.groups.forEach((group) => {
    if (group.id !== `${group.source}:${group.engagement}` || !crossSources.includes(group.source) || !crossEngagements.includes(group.engagement)
        || !isCount(group.questions) || !isCount(group.users) || !isCount(group.sessions)) fail(`提问交叉分组 ${group.id} 异常`);
    crossDimensions.forEach(([key, ids]) => {
      const rows = group.dimensions?.[key];
      assertItemIds(rows, ids, `提问交叉分组 ${group.id}.${key}`);
      if (rows.some((item) => !isCount(item.questions) || !isCount(item.users))
          || rows.reduce((sum, item) => sum + item.questions, 0) !== group.questions) fail(`提问交叉分组 ${group.id}.${key} 不闭合`);
    });
    for (const entity of ["keywords", "products"]) {
      if (!Array.isArray(group.entities?.[entity])) fail(`提问交叉分组 ${group.id}.${entity} 缺失`);
      group.entities[entity].forEach((item, index) => {
        if (typeof item.label !== "string" || !item.label || !isCount(item.questions) || !isCount(item.users)) fail(`提问交叉分组 ${group.id}.${entity}[${index}] 异常`);
      });
    }
    for (const grain of ["daily", "weekly"]) {
      if (!Array.isArray(group[grain]) || group[grain].reduce((sum, item) => sum + item.questions, 0) !== group.questions) fail(`提问交叉分组 ${group.id}.${grain} 不闭合`);
      group[grain].forEach((item, index) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.start || "") || !/^\d{4}-\d{2}-\d{2}$/.test(item.end || "")
            || !isCount(item.questions) || !isCount(item.users) || !isCount(item.sessions)) fail(`提问交叉分组 ${group.id}.${grain}[${index}] 异常`);
        assertItemIds(item.directions, questionDirectionIds, `提问交叉分组 ${group.id}.${grain}[${index}].directions`);
        if (item.directions.reduce((sum, row) => sum + row.questions, 0) !== item.questions) fail(`提问交叉分组 ${group.id}.${grain}[${index}] 方向不闭合`);
      });
    }
  });
  const crossGroupMap = Object.fromEntries(cross.groups.map((group) => [group.id, group]));
  if (crossGroupMap["all:all"].questions !== rs.questions || crossGroupMap["all:all"].users !== rs.asking_users || crossGroupMap["all:all"].sessions !== rs.sessions
      || crossGroupMap["preset:all"].questions !== rs.preset_questions || crossGroupMap["self:all"].questions !== rs.self_authored_questions
      || crossGroupMap["substantive:all"].questions !== rs.substantive_questions || crossGroupMap["substantive:all"].users !== rs.substantive_users
      || crossGroupMap["substantive:followup"].questions !== journey.followup_user_substantive_questions
      || crossGroupMap["substantive:followup"].users !== journey.followup_users || crossGroupMap["substantive:no_followup"].users !== journey.no_followup_users) {
    fail("提问交叉分析与汇总不一致");
  }

  if (research.presets?.true_impressions_available !== false
      || research.presets?.rate_metric !== "unique_click_users_divided_by_asking_users_in_observed_window"
      || !Array.isArray(research.presets?.versions) || !research.presets.versions.length) fail("默认题版本数据异常");
  assertItemIds(research.presets.directions, questionDirectionIds, "question_insights.research.presets.directions");
  research.presets.directions.forEach((item) => {
    if (!isCount(item.clicks) || !isCount(item.users) || !isCount(item.first_question_users) || !isCount(item.follow_on_users)
        || item.first_question_users > item.users || item.follow_on_users > item.users) fail(`默认题方向 ${item.id} 异常`);
  });
  if (research.presets.directions.reduce((sum, item) => sum + item.clicks, 0) !== rs.preset_questions) fail("默认题方向点击不闭合");
  assertItemIds(research.presets.follow_on_directions, questionDirectionIds, "question_insights.research.presets.follow_on_directions");
  if (research.presets.follow_on_directions.some((item) => !isCount(item.questions) || !isCount(item.users))
      || research.presets.follow_on_directions.reduce((sum, item) => sum + item.questions, 0) !== rs.preset_follow_on_questions) fail("默认题后续问方向不闭合");
  let presetClicks = 0;
  research.presets.versions.forEach((version, versionIndex) => {
    const path = `question_insights.research.presets.versions[${versionIndex}]`;
    if (typeof version.id !== "string" || !version.id || typeof version.label !== "string" || !version.label
        || !["exact_text_confirmed", "inferred_from_exact_repetition_and_launch_cluster", "inferred_from_exact_repetition_without_exposure_log"].includes(version.evidence)
        || !Array.isArray(version.questions) || !version.questions.length
        || !isCount(version.clicks) || !isCount(version.users) || !isCount(version.first_question_users)
        || !isCount(version.follow_on_users) || !isCount(version.follow_on_questions) || !Array.isArray(version.follow_on_directions)
        || !isCount(version.asker_proxy_denominator)
        || version.users > version.asker_proxy_denominator || version.first_question_users > version.users || version.follow_on_users > version.users) fail(`${path} 字段异常`);
    if (version.clicks > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(version.observed_from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(version.observed_to || ""))) fail(`${path} 观察日期异常`);
    let versionClicks = 0;
    version.questions.forEach((item, index) => {
      if (typeof item.id !== "string" || !item.id || typeof item.question !== "string" || item.question.length < 5
          || sensitiveText.test(item.question) || !questionDirectionIds.includes(item.direction) || !isCount(item.clicks) || !isCount(item.users)
          || !isCount(item.first_question_users) || !isCount(item.follow_on_users) || !isCount(item.follow_on_questions)
          || !Array.isArray(item.follow_on_directions)
          || item.first_question_users > item.users || item.follow_on_users > item.users) fail(`${path}.questions[${index}] 异常`);
      assertItemIds(item.follow_on_directions, questionDirectionIds, `${path}.questions[${index}].follow_on_directions`);
      if (item.follow_on_directions.reduce((sum, row) => sum + row.questions, 0) !== item.follow_on_questions) fail(`${path}.questions[${index}] 续问方向不闭合`);
      versionClicks += item.clicks;
    });
    assertItemIds(version.follow_on_directions, questionDirectionIds, `${path}.follow_on_directions`);
    if (version.follow_on_directions.reduce((sum, item) => sum + item.questions, 0) !== version.follow_on_questions) fail(`${path} 续问方向不闭合`);
    if (versionClicks !== version.clicks) fail(`${path} 点击次数不闭合`);
    presetClicks += version.clicks;
  });
  if (presetClicks !== rs.preset_questions) fail("默认题版本点击次数与汇总不闭合");

  const dimensions = [
    ["direction", questionDirectionIds, rs.substantive_questions],
    ["first_direction", questionDirectionIds, rs.substantive_users],
    ["object", questionObjectIds, rs.substantive_questions],
    ["style", questionStyleIds, rs.substantive_questions],
    ["cognition", questionCognitionIds, rs.substantive_questions],
  ];
  dimensions.forEach(([key, ids, expected]) => {
    const rows = research.dimensions?.[key];
    assertItemIds(rows, ids, `question_insights.research.dimensions.${key}`);
    rows.forEach((item) => {
      if (!isCount(item.questions) || !isCount(item.users) || item.users > rs.substantive_users) fail(`question_insights.research.dimensions.${key}.${item.id} 异常`);
    });
    if (rows.reduce((sum, item) => sum + item.questions, 0) !== expected) fail(`question_insights.research.dimensions.${key} 不闭合`);
  });

  if (!Array.isArray(research.entities?.keywords) || !research.entities.keywords.length || !Array.isArray(research.entities?.products)
      || research.entities.product_min_users !== 2) fail("关键词与产品实体数据异常");
  research.entities.keywords.forEach((item, index) => {
    if (typeof item.label !== "string" || !item.label || sensitiveText.test(item.label) || !isCount(item.questions) || !isCount(item.users)
        || item.questions > rs.substantive_questions || item.users > rs.substantive_users) fail(`关键词 ${index} 异常`);
  });
  research.entities.products.forEach((item, index) => {
    if (typeof item.label !== "string" || !item.label || typeof item.query !== "string" || !item.query || sensitiveText.test(item.label) || !["基金代码", "基金名称", "且慢策略"].includes(item.kind)
        || !isCount(item.questions) || !isCount(item.users) || item.users < research.entities.product_min_users) fail(`产品实体 ${index} 异常`);
  });

  assertItemIds(research.turn_analysis?.buckets, questionTurnIds, "question_insights.research.turn_analysis.buckets");
  research.turn_analysis.buckets.forEach((bucket) => {
    if (typeof bucket.label !== "string" || !bucket.label || !isCount(bucket.questions) || !isCount(bucket.users)) fail(`对话回合 ${bucket.id} 汇总异常`);
    assertItemIds(bucket.directions, questionDirectionIds, `对话回合 ${bucket.id}.directions`);
    if (bucket.directions.some((item) => !isCount(item.questions) || !isCount(item.users))
        || bucket.directions.reduce((sum, item) => sum + item.questions, 0) !== bucket.questions) fail(`对话回合 ${bucket.id} 方向不闭合`);
    if (!Array.isArray(bucket.transitions) || bucket.transitions.some((item) => !questionDirectionIds.includes(item.from)
        || !questionDirectionIds.includes(item.to) || !isCount(item.count) || !isCount(item.users))) fail(`对话回合 ${bucket.id} 路径异常`);
  });

  assertItemIds(research.personas, questionPersonaIds, "question_insights.research.personas");
  research.personas.forEach((item) => {
    if (!isCount(item.users) || !isCount(item.questions)) fail(`question_insights.research.personas.${item.id} 异常`);
  });
  if (research.personas.reduce((sum, item) => sum + item.users, 0) !== rs.asking_users) fail("提问画像人数不闭合");
  assertItemIds(research.user_cognition, questionCognitionIds, "question_insights.research.user_cognition");
  if (research.user_cognition.some((item) => !isCount(item.users))
      || research.user_cognition.reduce((sum, item) => sum + item.users, 0) !== rs.substantive_users) fail("用户认知信号不闭合");

  const rhythmSpecs = [
    ["active_days", ["1", "2", "3_7", "8_plus"], rs.asking_users],
    ["session_depth", ["1", "2_3", "4_9", "10_plus"], rs.sessions],
    ["gaps", ["lte_5m", "5_30m", "30m_1d", "gte_1d"], rs.questions - rs.asking_users],
    ["time_of_day", ["00_06", "06_09", "09_12", "12_14", "14_18", "18_22", "22_24"], rs.questions],
  ];
  rhythmSpecs.forEach(([key, ids, expected]) => {
    const rows = research.rhythm?.[key];
    assertItemIds(rows, ids, `question_insights.research.rhythm.${key}`);
    if (rows.some((item) => !isCount(item.count) || !isCount(item.users))
        || rows.reduce((sum, item) => sum + item.count, 0) !== expected) fail(`question_insights.research.rhythm.${key} 不闭合`);
  });
  if (!Array.isArray(research.paths?.transitions) || !Array.isArray(research.paths?.sequences)) fail("提问路径缺失");
  research.paths.transitions.forEach((item, index) => {
    if (!questionDirectionIds.includes(item.from) || !questionDirectionIds.includes(item.to)
        || !isCount(item.count) || !isCount(item.users)) fail(`question_insights.research.paths.transitions[${index}] 异常`);
  });
  research.paths.sequences.forEach((item, index) => {
    if (!Array.isArray(item.path) || item.path.length < 2 || item.path.some((id) => !questionDirectionIds.includes(id))
        || !isCount(item.users)) fail(`question_insights.research.paths.sequences[${index}] 异常`);
  });
  if (JSON.stringify(insight.top_questions) !== JSON.stringify(research.top_self_authored)) fail("公开高频问法与自发问法研究不一致");
}

async function validateQuestionCorpus() {
  assertPlainObject(questionEnvelope, "questions.enc.json");
  if (questionEnvelope.schema_version !== "qianwen-question-corpus-envelope-v2" || questionEnvelope.compression !== "gzip") {
    fail("原始提问密文版本异常");
  }
  if (questionEnvelope.meta?.data_cutoff !== data.meta.data_cutoff
      || questionEnvelope.meta?.questions !== data.question_insights.summary.questions
      || questionEnvelope.meta?.default_questions !== data.question_insights.research.summary.preset_questions
      || questionEnvelope.meta?.self_authored_questions !== data.question_insights.research.summary.self_authored_questions
      || !isCount(questionEnvelope.meta?.redacted_rows)) fail("原始提问密文元数据与分析快照不一致");
  if (!Number.isInteger(questionEnvelope.iterations) || questionEnvelope.iterations < 250000) fail("原始提问密文派生强度不足");
  const decode = (value) => new Uint8Array(Buffer.from(value, "base64"));
  const password = process.env.REPORT_PASSWORD || "2026";
  const material = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt: decode(questionEnvelope.salt), iterations: questionEnvelope.iterations, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
  let corpus;
  try {
    const compressed = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: decode(questionEnvelope.iv) }, key, decode(questionEnvelope.data));
    const plain = gunzipSync(new Uint8Array(compressed)).toString("utf8");
    if (createHash("sha256").update(plain).digest("hex") !== questionEnvelope.meta.plaintext_sha256) fail("原始提问密文哈希校验失败");
    corpus = JSON.parse(plain);
  } catch (error) {
    fail(`原始提问密文无法解密：${error.message}`);
  }
  if (corpus.schema_version !== "qianwen-question-corpus-v2" || corpus.meta?.identity_fields !== "none"
      || corpus.meta?.taxonomy !== "rule-based-multiaxis-v2" || corpus.meta?.date_timezone !== "Asia/Shanghai") fail("原始提问库口径异常");
  if (!Array.isArray(corpus.rows) || corpus.rows.length !== data.question_insights.summary.questions || corpus.meta.questions !== corpus.rows.length) {
    fail("原始提问库记录数异常");
  }
  const actualDirections = Object.fromEntries(questionDirectionIds.map((id) => [id, 0]));
  let actualDefaults = 0;
  let actualSelfAuthored = 0;
  let actualSubstantive = 0;
  const rawPii = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[0-9Xx](?!\d)|(?<!\d)(?:\d[ -]?){12,19}(?!\d)|\b(?:wxid_|openid[:：]?)[A-Za-z0-9_-]{6,}\b)/i;
  corpus.rows.forEach((row, index) => {
    assertPlainObject(row, `question_corpus.rows[${index}]`);
    assertExactKeys(Object.keys(row), ["i", "d", "t", "o", "f", "c", "s", "p", "v", "r", "w", "e", "u", "n", "q"], `question_corpus.rows[${index}]`);
    if (row.i !== index + 1 || !/^\d{4}-\d{2}-\d{2}$/.test(row.d) || !questionDirectionIds.includes(row.t)
        || !questionObjectIds.includes(row.o) || !questionStyleIds.includes(row.f) || !questionCognitionIds.includes(row.c)
        || ![0, 1].includes(row.s) || typeof row.p !== "string" || typeof row.v !== "string" || typeof row.r !== "string" || typeof row.w !== "string"
        || Boolean(row.p) !== Boolean(row.v) || Boolean(row.r) !== Boolean(row.w) || !["no_followup", "followup"].includes(row.e) || !Number.isInteger(row.u) || row.u < 0
        || typeof row.n !== "string" || (row.n && !questionDirectionIds.includes(row.n)) || (!row.p && !row.s && row.u < 1)
        || typeof row.q !== "string" || !row.q.trim() || rawPii.test(row.q)) {
      fail(`question_corpus.rows[${index}] 格式或脱敏异常`);
    }
    actualDirections[row.t] += 1;
    if (row.p) actualDefaults += 1;
    else {
      actualSelfAuthored += 1;
      if (!row.s) actualSubstantive += 1;
    }
  });
  questionDirectionIds.forEach((id) => {
    if (actualDirections[id] !== corpus.meta.direction_counts?.[id]) fail(`原始提问库方向 ${id} 不闭合`);
  });
  const rs = data.question_insights.research.summary;
  if (actualDefaults !== rs.preset_questions || actualSelfAuthored !== rs.self_authored_questions
      || actualSubstantive !== rs.substantive_questions || corpus.meta.default_questions !== actualDefaults
      || corpus.meta.self_authored_questions !== actualSelfAuthored) fail("原始提问库来源口径与聚合研究不闭合");
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
validateQuestionInsights();
await validateQuestionCorpus();

const publicText = JSON.stringify(data);
const forbidden = /(ying99_|union_id|user_id|po_manager_id|手机号|phone|redash|job[ _-]?id|api[_ -]?key|access[_ -]?token)/i;
if (forbidden.test(publicText)) fail("公开快照包含内部标识、PII 或凭证字段");
const forbiddenPublicKey = /(?:^|_)(?:user_ids?|customer_ids?|member_ids?|po_manager_ids?|union_ids?|open_ids?|account_ids?|phone|mobile|email|full_name|real_name|id_card|identity_card|device|device_id|device_model|imei|idfa|oaid|ip|ip_address|city|province|district|address|longitude|latitude|amount|balance|aum|asset_value|total_asset|money|cash_value|conversation_text|dialogue_text|transcript|prompt|question_text|answer_text|message_text|content_text|query_text|response_text)(?:_|$)/i;
const forbiddenChineseKey = /(手机号|手机号码|邮箱|姓名|身份证|用户\s*[Ii][Dd]|用户标识|设备|城市|省份|地址|经纬度|金额|余额|资产总额|对话文本|问题文本|回答文本|消息文本)/;
const aggregateAmountKeys = new Set(["amount_wan", "per_capita_wan", "median_wan",
  "inflow_amount_wan", "total_asset_wan", "per_capita_asset_wan"]);
function assertNoForbiddenKeys(value, path = "data") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    // 经营模块的整体金额是公开口径的一部分，其余位置一律禁止出现金额类字段。
    // 经营段与分客群面板的聚合金额是公开口径的一部分，其余位置一律禁止金额字段。
    const allowedAggregateAmount = aggregateAmountKeys.has(key)
      && (path.startsWith("data.business.") || path.startsWith("data.segments."));
    if (!allowedAggregateAmount && (forbiddenPublicKey.test(key) || forbiddenChineseKey.test(key))) {
      fail(`${path}.${key} 是禁止公开的明细字段`);
    }
    assertNoForbiddenKeys(nested, `${path}.${key}`);
  }
}
assertNoForbiddenKeys(data);

const segmentIds = ["all", "new_inv", "first_inv", "reinvested", "new", "new_first_inv", "existing", "existing_reactivated", "existing_first_inv"];
{
  const minimumPublicCell = data.privacy.minimum_public_cell;
  assertPlainObject(data.segments, "segments");
  if (data.segments.anchor !== "first_bound_at" || data.segments.window_end_at !== data.meta.data_cutoff) {
    fail("segments 观察窗口异常");
  }
  const actualSegmentIds = data.segments.items.map((item) => item.id);
  assertItemIds(data.segments.items, segmentIds, "segments.items");
  const expectedSegmentPopulation = {
    all: data.metrics.bound_accounts,
    existing: data.metrics.existing_accounts,
    new: data.metrics.new_accounts,
  };
  for (const item of data.segments.items) {
    const path = `segments.items.${item.id}`;
    if (!publicStates.has(item.state)) fail(`${path}.state 无效`);
    assertAudienceDataAsOf(item, path);
    if (item.state !== "confirmed") { assertHiddenItemCarriesNoCounts(item, path); continue; }
    const counts = ["population_accounts", "new_accounts", "existing_accounts",
                    "card_bound_accounts", "opened_after_binding_accounts",
                    "risk_assessed_accounts", "risk_after_binding_accounts",
                    "inflow_accounts", "inflow_transactions", "holder_accounts",
                    "holders_gte_100k_accounts", "holders_gte_1m_accounts", "reinvested_accounts", "first_investor_accounts"];
    for (const field of counts) assertPublicCell(item[field], `${path}.${field}`, minimumPublicCell);
    if (Object.hasOwn(expectedSegmentPopulation, item.id)
        && item.population_accounts !== expectedSegmentPopulation[item.id]) {
      fail(`${path}.population_accounts 与 metrics 不一致`);
    }
    if (item.id.startsWith("existing_") && item.population_accounts > data.metrics.existing_accounts) {
      fail(`${path}.population_accounts 超过老用户总数`);
    }
    for (const field of counts.slice(1)) {
      if (field === "inflow_transactions") continue;   // 笔数可以多于人数
      if (item[field] > item.population_accounts) fail(`${path}.${field} 超过该维度人数`);
    }
    if (item.new_accounts + item.existing_accounts !== item.population_accounts) fail(`${path} 新老拆分不闭合`);
    if (item.holders_gte_1m_accounts > item.holders_gte_100k_accounts) fail(`${path} 资产分层不单调`);
    if (item.holders_gte_100k_accounts > item.holder_accounts) fail(`${path} 资产分层超过持有人数`);
    if (item.inflow_accounts === 0 && item.inflow_transactions !== 0) fail(`${path} 无人入金却有笔数`);
    for (const field of ["inflow_amount_wan", "total_asset_wan"]) {
      if (!Number.isFinite(item[field]) || item[field] < 0) fail(`${path}.${field} 必须为非负数`);
    }
    if (item.holder_accounts === 0 && item.total_asset_wan !== 0) fail(`${path} 无人持有却有资产`);
    if (item.inflow_accounts === 0 && item.inflow_amount_wan !== 0) fail(`${path} 无人入金却有金额`);
    if (item.holder_accounts > 0) {
      const expected = Math.round((item.total_asset_wan / item.holder_accounts) * 10000) / 10000;
      if (Math.abs((item.per_capita_asset_wan ?? -1) - expected) > 0.001) fail(`${path}.per_capita_asset_wan 与总资产不一致`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.asset_as_of || "")) fail(`${path}.asset_as_of 无效`);
  }
}

for (const signal of [
  'id="bound-total"',
  'id="seg-pop"',
  'id="seg-card"',
  'id="seg-risk"',
  'id="seg-inflow"',
  'id="seg-asset"',
  'id="seg-percapita"',
  'id="segment-control"',
  'id="existing-breakdown"',
  'id="new-accounts"',
  'id="existing-accounts"',
  'id="trend-chart"',
  'id="detail-table"',
  'id="range-dialog"',
  'id="range-input"',
  'id="range-custom-label"',
  'id="chip-daily-name"',
  'id="audience-analysis"',
  'id="audience-cohort-control"',
  'id="audience-population"',
  'id="business-tiles"',
  'id="asset-distribution"',
  'id="behavior-bars"',
  'id="profile-distribution"',
  'id="touchpoint-distribution"',
  'id="question-analysis"',
  'id="question-overview"',
  'id="question-askers"',
  'id="question-sessions"',
  'id="question-turns-total"',
  'id="question-default-total"',
  'id="question-self-total"',
  'id="question-substantive"',
  'id="question-source-flow"',
  'id="question-defaults"',
  'id="preset-summary"',
  'id="preset-chart"',
  'id="preset-follow-bars"',
  'id="preset-versions"',
  'id="question-dimension-bars"',
  'id="question-cross-summary"',
  'id="question-cross-matrix"',
  'id="question-keywords"',
  'id="question-products"',
  'id="question-personas"',
  'id="question-cognition-users"',
  'id="question-rhythm-bars"',
  'id="question-followup-kpis"',
  'id="question-turn-directions"',
  'id="question-turn-transitions"',
  'id="question-transitions"',
  'id="question-sequences"',
  'id="question-time"',
  'id="question-time-chart"',
  'id="question-time-mix"',
  'id="question-unlock-form"',
  'id="question-search"',
  'id="question-scope-filter"',
  'id="question-engagement-filter"',
  'id="question-date-filter"',
  'id="question-origin-filter"',
  'id="question-turn-filter"',
  'id="question-next-filter"',
  'id="question-direction-filter"',
  'id="question-object-filter"',
  'id="question-style-filter"',
  'id="question-cognition-filter"',
  'id="question-table-body"',
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
  'name="range" value="ytd"',
  'name="range" value="mtd"',
  'name="range" value="last-30"',
  'name="range" value="last-7"',
  'name="range" value="custom"',
  'name="audience-cohort" value="all"',
  'name="audience-cohort" value="new"',
  'name="audience-cohort" value="existing"',
  'name="segment" value="all"',
  'name="segment" value="new_inv"',
  'name="segment" value="reinvested"',
  'name="segment" value="first_inv"',
  'name="segment" value="new"',
  'name="segment" value="new_first_inv"',
  'name="segment" value="existing"',
  'name="segment" value="existing_reactivated"',
  'name="segment" value="existing_first_inv"',
  'name="question-lens" value="direction"',
  'name="question-lens" value="object"',
  'name="question-lens" value="style"',
  'name="question-lens" value="cognition"',
  'name="question-source" value="all"',
  'name="question-source" value="preset"',
  'name="question-source" value="self"',
  'name="question-source" value="substantive"',
  'name="question-engagement" value="all"',
  'name="question-engagement" value="no_followup"',
  'name="question-engagement" value="followup"',
  'name="question-cross-metric" value="questions"',
  'name="question-cross-metric" value="users"',
  'name="question-time-grain" value="daily"',
  'name="question-time-grain" value="weekly"',
]) {
  if (!html.includes(signal)) fail(`交互控件缺少 ${signal}`);
}
if ((html.match(/<article class="kpi-card/g) || []).length !== 9) fail("关键数据卡必须为三张规模卡 + 六张分客群指标卡");
if ((html.match(/name="segment"/g) || []).length !== 9) fail("分客群面板必须有九个维度开关");
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
  'id="refresh-schedule"',
  'class="topbar"',
  "DATA WINDOW SINCE",
  'id="kpi-scope"',
  'id="freshness"',
  "灰度期间完成绑定",
  "data-refresh-button",
  "callRefreshService",
  "127.0.0.1:43122",
  "127.0.0.1:43123",
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
  'id="question-topic-bars"',
  'id="question-depth-bars"',
  'id="frequent-question-list"',
  'id="question-topic-filter"',
  'name="question-topic-scope"',
]) {
  if (html.includes(removed) || app.includes(removed)) fail(`页面仍包含已移除内容：${removed}`);
}
for (const signal of [
  "qianwen-user-acquisition-v8",
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
  "renderReadout",
  "renderSegmentPanel",
  "validateQuestionInsights",
  "renderQuestionInsights",
  "renderPresetResearch",
  "renderQuestionDimension",
  "renderQuestionPersonas",
  "renderQuestionRhythm",
  "renderQuestionPaths",
  "decryptQuestionCorpus",
  "renderQuestionTable",
  "loadPublishedData",
  "window_cumulative_bound",
  "visibleSeries",
  "selectedDate",
]) {
  if (!app.includes(signal)) fail(`页面脚本缺少 ${signal}`);
}
for (const removed of ["所选用户数据明细", 'id="audience-table"', 'id="audience-footnote"']) {
  if (html.includes(removed) || app.includes(removed)) fail(`页面仍包含已移除模块：${removed}`);
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
  ".question-findings",
  ".question-source-flow",
  ".question-chapter",
  ".preset-version",
  ".dimension-bars",
  ".persona-grid",
  ".rhythm-layout",
  ".followup-kpis",
  ".cross-summary",
  ".cross-matrix",
  ".question-time-chart",
  ".transition-row",
  ".wording-proof",
  ".question-table",
]) {
  if (!styles.includes(rule)) fail(`样式表缺少 ${rule}`);
}
// 双 Y 轴会让两种量纲挤在同一张图里，v6 起累计与每日新增拆成上下两块独立坐标
for (const removed of [".chart-axis-right", ".chart-area-new", ".chart-area-existing", ".chart-bound-line"]) {
  if (styles.includes(removed)) fail(`样式表仍保留已废弃的双轴样式 ${removed}`);
}
if (/https?:\/\/(?!127\.0\.0\.1)/.test(app.replaceAll("https://ontology.yingmi-inc.com", ""))) fail("页面脚本含未审计外部服务");
if (!(html.indexOf('id="question-analysis"') > html.indexOf('id="audience-analysis"')
      && html.indexOf('id="question-analysis"') < html.indexOf("</main>"))) fail("提问研究模块必须位于报告正文最后");
if (/(token|secret|password)\s*[:=]\s*["'][^"']+/i.test(app)) fail("页面脚本疑似硬编码凭证");
const renderKpisSource = app.slice(app.indexOf("function renderKpis"), app.indexOf("function niceMaximum"));
if (renderKpisSource.includes("rangeTotals(rows)")) fail("顶部累计总览卡仍与日期区间联动");
if (!renderKpisSource.includes("bound: currentData.metrics.bound_accounts")) fail("顶部累计总览卡没有固定使用全量 metrics");
const renderHeroLeadSource = app.slice(app.indexOf("function renderHeroLead"), app.indexOf("function decorateRows"));
for (const requiredSource of [
  'segment("all")',
  'segment("first_inv")',
  'segment("new_inv")',
  "currentData.metrics.bound_accounts",
  "currentData.metrics.new_accounts",
  "currentData.metrics.existing_accounts",
  "all.opened_after_binding_accounts",
  "all.risk_after_binding_accounts",
  "newInvestors.inflow_amount_wan",
  "all.inflow_amount_wan",
  "all.total_asset_wan",
]) {
  if (!renderHeroLeadSource.includes(requiredSource)) fail(`顶部动态总结缺少数据字段：${requiredSource}`);
}
if (app.includes("累计绑定用户（人）")) fail("增长趋势图仍显示累计绑定用户顶部标题");
if (html.includes('id="chart-note"')) fail("增长趋势图仍保留底部范围说明");

const reportEntryStart = workbench.indexOf('id: "qianwen-user-acquisition-dashboard"');
const reportEntryEnd = workbench.indexOf("\n    {", reportEntryStart + 1);
if (reportEntryStart < 0 || reportEntryEnd < 0) fail("工作台入口缺失");
const reportingCopy = [html, app, publicText, preview, workbench.slice(reportEntryStart, reportEntryEnd)].join("\n");
for (const word of ["映射", "聚合", "去重", "关联", "存量", "ACCOUNT HANDOFF", "生产数仓"]) {
  if (reportingCopy.includes(word)) fail(`汇报文案仍包含技术术语：${word}`);
}
for (const phrase of [
  "千问·且慢AI小顾",
  "用户引流成效看板",
  "AI 流量入口平台千问合作",
  "A2A 模式接入且慢 AI 小顾 Agent",
  "千问用户绑定且慢账户",
  "个新用户注册",
  "位且慢老用户",
  "绑定后完成开户",
  "风测",
  "首投",
  "新投",
  "新投用户入金",
  "全部绑定用户累计新增入金",
  "总资产规模",
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
