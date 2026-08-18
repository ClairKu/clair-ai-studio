const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41792";
const LOCAL_DATA_KEY = "clair-oap-qieman-dashboard-latest-v1";
const LOCAL_HEADER = { "X-Clair-Dashboard": "oap-qieman-user-dashboard-v1" };
const CONTRACT_REVISION = "segments-new-existing-2026-08-18";

const number = new Intl.NumberFormat("zh-CN");
const oneDecimal = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);
const GROWTH_MODES = {
  registrations: { field: "new_registrations", label: "新注册用户", kind: "count" },
  first_inflow: { field: "first_inflow_users", label: "首次入金用户", kind: "count" },
  inflow: { field: "inflow_yuan", label: "资金流入 / 新入金代理", kind: "money" },
  net_inflow: { field: "net_inflow_yuan", label: "净入金", kind: "money", derived: true },
};
const GROWTH_SUMMARY_FIELDS = [
  "new_registrations",
  "first_inflow_users",
  "inflow_users",
  "inflow_yuan",
  "outflow_yuan",
];
const GROWTH_FUNNEL_FIELDS = [
  "eligible_registrations",
  "first_inflow_d30_users",
  "first_inflow_d7_users",
  "still_holding_users",
];

const SEGMENT_ORDER = ["all", "new", "existing"];
const SEGMENT_FALLBACK_LABELS = {
  all: { short_label: "全部", label: "全部 OAP 用户" },
  new: { short_label: "新用户", label: "新用户（OAP 后注册）" },
  existing: { short_label: "老用户", label: "老用户（OAP 前已注册）" },
};

let currentData = null;
let selectedCohortId = "active_30d";
let selectedSegment = "all";
let behaviorMode = "penetration";
let growthMode = "registrations";
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTime(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isNewerSnapshot(candidate, baseline) {
  if (!candidate) return false;
  if (!baseline) return true;
  const candidateCutoff = parseTime(candidate.meta?.data_cutoff);
  const baselineCutoff = parseTime(baseline.meta?.data_cutoff);
  if (candidateCutoff !== baselineCutoff) return candidateCutoff > baselineCutoff;
  return parseTime(candidate.meta?.generated_at) > parseTime(baseline.meta?.generated_at);
}

function approximately(left, right, tolerance = 0.0015) {
  return Math.abs(Number(left) - Number(right)) <= tolerance;
}

function formatDateTime(value, includeYear = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: includeYear ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value || "—";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function dateOrdinal(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return NaN;
  return Date.parse(`${value}T00:00:00Z`) / 86_400_000;
}

function inclusiveDays(start, end) {
  return dateOrdinal(end) - dateOrdinal(start) + 1;
}

function datesAreAdjacent(left, right) {
  return dateOrdinal(right) - dateOrdinal(left) === 1;
}

function compact(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 100000000) return `${oneDecimal.format(amount / 100000000)} 亿`;
  if (Math.abs(amount) >= 10000) return `${oneDecimal.format(amount / 10000)} 万`;
  return number.format(amount);
}

function money(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 100000000) return `${(amount / 100000000).toFixed(2)} 亿`;
  if (Math.abs(amount) >= 10000) return `${oneDecimal.format(amount / 10000)} 万`;
  return `${number.format(amount)} 元`;
}

function growthFieldSuppressed(row, field) {
  return row?.[field] === null || row?.suppressed_fields?.includes(field);
}

function growthMetric(row, field) {
  if (!row) return null;
  if (field === "net_inflow_yuan") {
    if (growthFieldSuppressed(row, "inflow_yuan") || growthFieldSuppressed(row, "outflow_yuan")) return null;
    return row.inflow_yuan - row.outflow_yuan;
  }
  return growthFieldSuppressed(row, field) ? null : row[field];
}

function validateGrowthRow(row, fields, label, minimumPublicCell) {
  if (!row || !Array.isArray(row.suppressed_fields)) throw new Error(`${label} 缺少小样本抑制声明`);
  const suppressed = new Set(row.suppressed_fields);
  if (suppressed.size !== row.suppressed_fields.length || [...suppressed].some((field) => !fields.includes(field))) {
    throw new Error(`${label} 小样本抑制字段异常`);
  }
  for (const field of fields) {
    const value = row[field];
    if (value === null) {
      if (!suppressed.has(field)) throw new Error(`${label}.${field} 为空但未标记 suppressed`);
      continue;
    }
    if (suppressed.has(field)) throw new Error(`${label}.${field} 已有值却标记 suppressed`);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label}.${field} 无效`);
    const isAmount = field.endsWith("_yuan");
    if (isAmount && value % 10_000 !== 0) throw new Error(`${label}.${field} 未按万元汇总`);
    if (!isAmount && value > 0 && value < minimumPublicCell) throw new Error(`${label}.${field} 小于公开样本阈值`);
  }
  return row;
}

function validateGrowth(data, cohortIds) {
  const growth = data.growth;
  if (!growth || data.meta?.contract_revision !== CONTRACT_REVISION) throw new Error("增长数据契约缺失；旧缓存已停用");
  if (!["confirmed_with_boundaries", "partial"].includes(growth.evidence_state)) throw new Error("增长证据状态无效");
  const registrationSource = growth.registration_definition?.source_field || growth.registration_definition?.source;
  if (growth.registration_definition?.state !== "confirmed" || registrationSource !== "registered_at") {
    throw new Error("新注册未按且慢真实注册时间统计");
  }
  const cashflowDefinition = growth.cash_flow_definition || {};
  if (!["confirmed", "partial"].includes(cashflowDefinition.state) || cashflowDefinition.first_inflow_scope !== "all_history") {
    throw new Error("资金流入或全历史首次入金口径未声明");
  }
  const cashflowPartial = cashflowDefinition.state === "partial";
  if (growth.join_key_state !== "confirmed" || !/^\d{4}-\d{2}-\d{2}$/.test(growth.cashflow_max_date)) throw new Error("增长关联键或资金截止日未确认");
  if (cashflowPartial && (cashflowDefinition.source_type !== "asset_delta_proxy" || growth.evidence_state !== "partial" || data.meta.evidence_state !== "partial")) throw new Error("资产入账代理证据状态不一致");
  if (!cashflowPartial && (cashflowDefinition.source_type !== "authoritative_cashflow_daily" || growth.evidence_state !== "confirmed_with_boundaries")) throw new Error("权威现金流证据状态不一致");

  const { comparison, trend, funnel } = growth;
  if (!comparison || inclusiveDays(comparison.current_start, comparison.current_end) !== 30 || inclusiveDays(comparison.previous_start, comparison.previous_end) !== 30) {
    throw new Error("增长同期窗口必须各为 30 个完整自然日");
  }
  if (!datesAreAdjacent(comparison.previous_end, comparison.current_start) || comparison.current_end !== data.meta.data_cutoff.slice(0, 10)) {
    if (!cashflowPartial || comparison.current_end !== growth.cashflow_max_date) throw new Error("增长同期窗口与数据截止日不连续");
  }
  if (comparison.current_end !== growth.cashflow_max_date) throw new Error("增长窗口与资金完整日不一致");
  const cashflowLagDays = dateOrdinal(data.meta.data_cutoff.slice(0, 10)) - dateOrdinal(growth.cashflow_max_date);
  if (cashflowLagDays < 0 || (cashflowPartial && cashflowLagDays > 7)) throw new Error("资产入账代理数据落后总看板超过 7 天");
  if (!trend || trend.grain_days !== 10 || inclusiveDays(trend.window_start, trend.window_end) !== 90 || trend.window_end !== comparison.current_end) {
    throw new Error("增长趋势必须为截至口径日的 90 日、每 10 日一段");
  }
  if (!funnel || funnel.followup_days !== 30 || funnel.registration_start !== comparison.previous_start || funnel.registration_end !== comparison.previous_end) {
    throw new Error("注册漏斗必须使用完整 30 日观察窗");
  }

  const minimum = data.meta.minimum_public_cell;
  if (!growth.by_cohort || cohortIds.some((id) => !growth.by_cohort[id])) throw new Error("增长人群数据缺失");
  for (const cohortId of cohortIds) {
    const cohortGrowth = growth.by_cohort[cohortId];
    const expectedCohortUsers = data.usage[cohortId === "approved" ? "approved_users" : cohortId === "called" ? "ever_called_users" : "active_30d_users"];
    if (cohortGrowth.cohort_n !== expectedCohortUsers || !["complete", "high", "medium", "low"].includes(cohortGrowth.registration_time_coverage_state)) throw new Error(`${cohortId} 注册覆盖契约异常`);
    if ("registered_at_nonnull_n" in cohortGrowth || "registered_at_missing_n" in cohortGrowth || "registration_time_coverage" in cohortGrowth) throw new Error(`${cohortId} 公开快照不得暴露可反推注册缺失数`);
    const current = validateGrowthRow(cohortGrowth.current, GROWTH_SUMMARY_FIELDS, `${cohortId}.growth.current`, minimum);
    const previous = validateGrowthRow(cohortGrowth.previous, GROWTH_SUMMARY_FIELDS, `${cohortId}.growth.previous`, minimum);
    for (const row of [current, previous]) {
      const first = growthMetric(row, "first_inflow_users");
      const inflowUsers = growthMetric(row, "inflow_users");
      if (first !== null && inflowUsers !== null && first > inflowUsers) throw new Error(`${cohortId} 首次入金用户大于资金流入用户`);
      if (inflowUsers === 0 && growthMetric(row, "inflow_yuan") !== 0) throw new Error(`${cohortId} 无资金流入用户但存在流入金额`);
      if (inflowUsers === null && growthMetric(row, "inflow_yuan") !== null) throw new Error(`${cohortId} 流入人数被抑制时金额也必须抑制`);
    }

    const funnelRow = validateGrowthRow(cohortGrowth.funnel, GROWTH_FUNNEL_FIELDS, `${cohortId}.growth.funnel`, minimum);
    const eligible = growthMetric(funnelRow, "eligible_registrations");
    const d30 = growthMetric(funnelRow, "first_inflow_d30_users");
    const d7 = growthMetric(funnelRow, "first_inflow_d7_users");
    const holding = growthMetric(funnelRow, "still_holding_users");
    if (eligible !== null && d30 !== null && d30 > eligible) throw new Error(`${cohortId} 30 日首次入金大于可观察注册用户`);
    if (d30 !== null && d7 !== null && d7 > d30) throw new Error(`${cohortId} 7 日首次入金大于 30 日首次入金`);
    if (d30 !== null && holding !== null && holding > d30) throw new Error(`${cohortId} 仍持仓人数大于 30 日首次入金人数`);
    const previousRegistrations = growthMetric(previous, "new_registrations");
    if ((eligible === null) !== (previousRegistrations === null) || (eligible !== null && eligible !== previousRegistrations)) throw new Error(`${cohortId} 漏斗起点与前30日新注册不一致`);

    const periods = cohortGrowth.trend_periods;
    if (!Array.isArray(periods) || periods.length !== 9) throw new Error(`${cohortId} 增长趋势必须为 9 段`);
    periods.forEach((period, index) => {
      validateGrowthRow(period, GROWTH_SUMMARY_FIELDS, `${cohortId}.growth.trend[${index}]`, minimum);
      if (inclusiveDays(period.start, period.end) !== 10) throw new Error(`${cohortId} 第 ${index + 1} 个趋势段不是 10 日`);
      if (index === 0 && period.start !== trend.window_start) throw new Error(`${cohortId} 趋势起点不一致`);
      if (index > 0 && !datesAreAdjacent(periods[index - 1].end, period.start)) throw new Error(`${cohortId} 趋势段不连续`);
      if (index === periods.length - 1 && period.end !== trend.window_end) throw new Error(`${cohortId} 趋势终点不一致`);
    });
    const closureFields = ["new_registrations", "first_inflow_users", "inflow_users", "inflow_yuan", "outflow_yuan"];
    for (const field of closureFields) {
      for (const [summary, slice, periodLabel] of [[previous, periods.slice(3, 6), "前 30 日"], [current, periods.slice(6), "近 30 日"]]) {
        const values = slice.map((period) => growthMetric(period, field));
        const summaryValue = growthMetric(summary, field);
        if ((summaryValue === null) !== values.some((value) => value === null)) throw new Error(`${cohortId} ${periodLabel}${field} 抑制未上下传播`);
        const closureTolerance = field.endsWith("_yuan") ? 20_000 : 0;
        if (field !== "inflow_users" && summaryValue !== null && values.every((value) => value !== null) && Math.abs(values.reduce((sum, value) => sum + value, 0) - summaryValue) > closureTolerance) {
          throw new Error(`${cohortId} ${periodLabel}${field} 与趋势不闭合`);
        }
      }
    }
  }
  const rejectSmallNestedDifference = (rows, field, relatedAmount = null, label = field) => {
    for (let index = 0; index < rows.length - 1; index += 1) {
      const broader = growthMetric(rows[index], field);
      const narrower = growthMetric(rows[index + 1], field);
      if (broader === null) {
        if (relatedAmount && growthMetric(rows[index], relatedAmount) !== null) throw new Error(`${label} 人数隐藏时关联金额仍公开`);
        continue;
      }
      if (narrower === null) continue;
      const difference = broader - narrower;
      if (difference < 0 || (difference > 0 && difference < minimum)) throw new Error(`${label} 嵌套人群可差分反推小样本`);
    }
  };
  for (const period of ["current", "previous"]) {
    const rows = cohortIds.map((id) => growth.by_cohort[id][period]);
    rejectSmallNestedDifference(rows, "new_registrations", null, `${period} 新注册`);
    rejectSmallNestedDifference(rows, "first_inflow_users", null, `${period} 首次入金`);
    rejectSmallNestedDifference(rows, "inflow_users", "inflow_yuan", `${period} 资金流入`);
  }
  for (let index = 0; index < 9; index += 1) {
    const rows = cohortIds.map((id) => growth.by_cohort[id].trend_periods[index]);
    rejectSmallNestedDifference(rows, "new_registrations", null, `trend ${index + 1} 新注册`);
    rejectSmallNestedDifference(rows, "first_inflow_users", null, `trend ${index + 1} 首次入金`);
    rejectSmallNestedDifference(rows, "inflow_users", "inflow_yuan", `trend ${index + 1} 资金流入`);
  }
  for (const field of GROWTH_FUNNEL_FIELDS) rejectSmallNestedDifference(cohortIds.map((id) => growth.by_cohort[id].funnel), field, null, `funnel ${field}`);
  return growth;
}

function validateData(data) {
  if (!data || data.schema_version !== "oap-qieman-user-dashboard-v1") throw new Error("数据版本不兼容");
  if (!parseTime(data.meta?.data_cutoff) || !/^\d{4}-\d{2}-\d{2}$/.test(data.meta?.asset_snapshot_date || "")) {
    throw new Error("数据截止时间缺失");
  }
  if (data.meta?.timezone !== "Asia/Shanghai" || data.meta?.minimum_public_cell !== 20) throw new Error("时间或隐私口径异常");

  const usage = data.usage || {};
  const requiredUsage = ["approved_users", "ever_called_users", "active_30d_users", "total_calls", "attributed_calls", "unattributed_calls", "calls_30d"];
  for (const key of requiredUsage) {
    if (!Number.isInteger(usage[key]) || usage[key] < 0) throw new Error(`使用指标 ${key} 无效`);
  }
  if (!(usage.approved_users >= usage.ever_called_users && usage.ever_called_users >= usage.active_30d_users)) throw new Error("三组人群层级不闭合");
  if (usage.total_calls !== usage.attributed_calls + usage.unattributed_calls) throw new Error("调用归属无法闭合");

  {
    const journey = data.journey_metrics;
    if (!journey || journey.schema_version !== "oap-journey-metrics-v1" || !Array.isArray(journey.rows) || !journey.rows.length) throw new Error("关键历程数据契约异常");
    const fieldMap = { cumulativeCalls: "cumulative_calls", cumulativeUsers: "cumulative_users", dailyCalls: "daily_calls", dailyNewUsers: "daily_new_users", dailyCallingUsers: "daily_calling_users" };
    let previousDate = null;
    journey.rows.forEach((row) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || (previousDate && dateOrdinal(row.date) - dateOrdinal(previousDate) !== 1)) throw new Error("关键历程日序列不连续");
      previousDate = row.date;
      const suppressed = new Set(row.suppressed_fields || []);
      if (suppressed.size !== (row.suppressed_fields || []).length || [...suppressed].some((field) => !Object.values(fieldMap).includes(field))) throw new Error("关键历程抑制字段异常");
      for (const [publicField, marker] of Object.entries(fieldMap)) {
        const value = row[publicField];
        if (value === null) {
          if (!suppressed.has(marker)) throw new Error(`关键历程 ${row.date}.${publicField} 为空但未声明抑制`);
          continue;
        }
        if (!Number.isSafeInteger(value) || value < 0 || suppressed.has(marker)) throw new Error(`关键历程 ${row.date}.${publicField} 异常`);
        if (publicField.startsWith("daily") && value > 0 && value < data.meta.minimum_public_cell) throw new Error(`关键历程 ${row.date}.${publicField} 低于公开阈值`);
        if (publicField.startsWith("cumulative") && value % data.meta.minimum_public_cell !== 0) throw new Error(`关键历程 ${row.date}.${publicField} 未按公开阈值取整`);
      }
    });
    const cutoffDay = data.meta.data_cutoff.slice(0, 10);
    if (journey.timezone !== "Asia/Shanghai" || journey.as_of !== cutoffDay || journey.range_start !== journey.rows[0].date || journey.rows.at(-1).date !== cutoffDay) {
      throw new Error("关键历程时间边界异常");
    }
    if (journey.rows.length !== inclusiveDays(journey.range_start, journey.as_of)) throw new Error("关键历程没有覆盖每个完整自然日");
    const journeyTail = journey.rows.at(-1);
    if (Math.abs(journeyTail.cumulativeCalls - usage.total_calls) >= data.meta.minimum_public_cell || Math.abs(journeyTail.cumulativeUsers - usage.approved_users) >= data.meta.minimum_public_cell) {
      throw new Error("关键历程累计值与使用规模不闭合");
    }
  }

  const expectedIds = ["approved", "called", "active_30d"];
  if (!Array.isArray(data.cohorts) || data.cohorts.length !== expectedIds.length) throw new Error("人群数据缺失");
  for (const [index, cohort] of data.cohorts.entries()) {
    if (cohort.id !== expectedIds[index]) throw new Error("人群顺序或标识异常");
    if (!Number.isInteger(cohort.users) || cohort.users !== usage[`${cohort.id === "called" ? "ever_called" : cohort.id}_users`]) throw new Error(`${cohort.id} 人数不一致`);
    for (const key of ["qieman_accounts", "holders", "managed_accounts", "profitable_holders"]) {
      if (!Number.isInteger(cohort[key]) || cohort[key] < 0) throw new Error(`${cohort.id}.${key} 无效`);
    }
    if (!(cohort.users >= cohort.qieman_accounts && cohort.qieman_accounts >= cohort.holders && cohort.holders >= cohort.managed_accounts)) throw new Error(`${cohort.id} 持仓层级不闭合`);
    if (cohort.profitable_holders > cohort.holders || cohort.aum_yuan < 0 || cohort.average_holder_asset_yuan < 0) throw new Error(`${cohort.id} 资产指标异常`);
    const ratePairs = [
      ["qieman_account_rate", cohort.qieman_accounts / cohort.users],
      ["holder_rate", cohort.holders / cohort.users],
      ["managed_rate", cohort.managed_accounts / cohort.users],
      ["profitable_holder_rate", cohort.holders ? cohort.profitable_holders / cohort.holders : 0],
    ];
    for (const [key, expected] of ratePairs) {
      if (!approximately(cohort[key], expected)) throw new Error(`${cohort.id}.${key} 与分子分母不一致`);
    }
    if (!Array.isArray(cohort.asset_buckets) || cohort.asset_buckets.length !== 5) throw new Error(`${cohort.id} 资产分层缺失`);
    const bucketTotal = cohort.asset_buckets.reduce((sum, row) => sum + row.count, 0);
    const shareTotal = cohort.asset_buckets.reduce((sum, row) => sum + row.share, 0);
    if (bucketTotal !== cohort.holders || !approximately(shareTotal, 1, 0.006)) throw new Error(`${cohort.id} 资产分层不闭合`);
    if (cohort.asset_buckets.some((row) => row.count < data.meta.minimum_public_cell)) throw new Error(`${cohort.id} 出现小于公开阈值的分组`);
  }

  validateGrowth(data, expectedIds);

  if (!data.behavior?.by_cohort || !Array.isArray(data.behavior.categories)) throw new Error("行为数据缺失");
  const categoryKeys = data.behavior.categories.map((item) => item.key);
  // 行为块停留在更早窗口时自带当时的人群分母，参与率按该分母复算，不与新人群混算
  const behaviorDenominators = data.behavior.denominators || null;
  if (behaviorDenominators && (!data.behavior.as_of || data.behavior.refresh_state !== "not_refreshed")) {
    throw new Error("行为块自带分母但未申报口径日或未刷新状态");
  }
  for (const cohort of data.cohorts) {
    const denominator = behaviorDenominators ? behaviorDenominators[cohort.id] : cohort.users;
    if (!Number.isInteger(denominator) || denominator <= 0) throw new Error(`${cohort.id} 行为分母无效`);
    const rows = data.behavior.by_cohort[cohort.id];
    if (!Array.isArray(rows) || rows.length !== categoryKeys.length) throw new Error(`${cohort.id} 行为分类缺失`);
    for (const [index, row] of rows.entries()) {
      if (row.key !== categoryKeys[index] || !Number.isInteger(row.actors) || !Number.isInteger(row.events)) throw new Error(`${cohort.id} 行为字段异常`);
      if (row.actors > denominator || row.actors < data.meta.minimum_public_cell || row.events < row.actors) throw new Error(`${cohort.id}.${row.key} 行为数量异常`);
      if (!approximately(row.penetration, row.actors / denominator, 0.00025)) throw new Error(`${cohort.id}.${row.key} 参与率不一致`);
      if (!approximately(row.events_per_actor, row.events / row.actors, 0.015)) throw new Error(`${cohort.id}.${row.key} 人均频次不一致`);
    }
  }

  if (!Array.isArray(data.profile?.dimensions) || data.profile.dimensions.length < 4) throw new Error("画像维度不足");
  for (const item of data.profile.dimensions) {
    if (item.sample < data.meta.minimum_public_cell || item.count > item.sample || !approximately(item.share, item.count / item.sample, 0.002)) throw new Error(`画像 ${item.key} 不闭合`);
  }
  if (!Array.isArray(data.quality_checks) || data.quality_checks.length !== (data.segments ? 7 : 6) || !data.quality_checks.some((item) => item.label === "注册与入金口径" && ["pass", "warn"].includes(item.status)) || !Array.isArray(data.definitions)) {
    throw new Error("数据健康或增长口径缺失");
  }
  const cashflowPartial = data.growth.cash_flow_definition.state === "partial";
  const growthQuality = data.quality_checks.find((item) => item.label === "注册与入金口径");
  if (growthQuality.status !== (cashflowPartial ? "warn" : "pass")) throw new Error("增长口径与质量状态不一致");
  for (const term of ["首次入金用户", "净入金"]) {
    if (!data.definitions.some((item) => item.term === term && item.state === (cashflowPartial ? "partial" : "confirmed"))) throw new Error(`${term}定义与证据状态不一致`);
  }

  // 维度二：新老用户。旧快照没有 segments 块时跳过，页面自动隐藏相关模块。
  if (data.segments) {
    const segments = data.segments;
    if (!["confirmed", "partial"].includes(segments.definition?.state)) throw new Error("新老切分缺少证据状态");
    const keys = segments.keys;
    if (!Array.isArray(keys) || !["all", "new", "existing"].every((key) => keys.some((item) => item.key === key))) throw new Error("新老分段标识缺失");
    for (const cohort of data.cohorts) {
      const bucket = segments.by_cohort?.[cohort.id];
      if (!bucket) throw new Error(`${cohort.id} 缺少新老分段`);
      if (!Number.isInteger(bucket.unknown_users) || bucket.unknown_users < 0) throw new Error(`${cohort.id} 未申报无法判定新老的人数`);
      for (const key of ["all", "new", "existing"]) {
        const view = bucket[key];
        if (!view || !Array.isArray(view.suppressed_fields)) throw new Error(`${cohort.id}.${key} 缺少小样本抑制声明`);
        if (!Number.isInteger(view.users) || view.users < 0) throw new Error(`${cohort.id}.${key} 人数无效`);
        if (view.users > cohort.users) throw new Error(`${cohort.id}.${key} 人数超过所在人群`);
        if (key !== "all" && view.users > 0 && view.users < data.meta.minimum_public_cell) throw new Error(`${cohort.id}.${key} 人数低于公开阈值`);
        for (const [rateKey, numerator, denominator] of [
          ["qieman_account_rate", "qieman_accounts", "users"],
          ["holder_rate", "holders", "users"],
          ["managed_rate", "managed_accounts", "users"],
          ["profitable_holder_rate", "profitable_holders", "holders"],
        ]) {
          const rate = view[rateKey];
          const top = view[numerator];
          const bottom = view[denominator];
          if (rate === null || rate === undefined || top === null || top === undefined || !bottom) continue;
          if (!approximately(rate, top / bottom, 0.002)) throw new Error(`${cohort.id}.${key}.${rateKey} 与分子分母不一致`);
        }
        if (Array.isArray(view.asset_buckets)) {
          if (view.asset_buckets.length !== 5) throw new Error(`${cohort.id}.${key} 资产分层数量异常`);
          const published = view.asset_buckets.filter((row) => row.count !== null && row.count !== undefined);
          if (published.some((row) => row.count > 0 && row.count < data.meta.minimum_public_cell)) throw new Error(`${cohort.id}.${key} 资产分层出现小样本`);
          if (published.length === 4) throw new Error(`${cohort.id}.${key} 只抑制一个资产档，可被相减反推`);
        }
      }
      if (bucket.new.users + bucket.existing.users + bucket.unknown_users !== cohort.users) throw new Error(`${cohort.id} 新老与无法判定之和不等于人群规模`);
      if (bucket.all.users !== cohort.users) throw new Error(`${cohort.id}.all 人数与人群规模不一致`);
    }
  }

  const publicText = JSON.stringify(data);
  const forbidden = /(account3|broker_user|union_id|user_id|po_manager|portfolio_manager_info|relation_account|\broot\b|手机号|phone|email|邮箱|ying99_|redash|api[_ -]?key|access[_ -]?token|view[_ -]?token)/i;
  if (forbidden.test(publicText)) throw new Error("公开数据包含内部标识、PII 或凭证字段");
  return data;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadPublishedData(fresh = false) {
  try {
    const response = await fetch(`${DATA_URL}${fresh ? `?v=${Date.now()}` : ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (window.OAP_QIEMAN_DASHBOARD_DATA) return validateData(window.OAP_QIEMAN_DASHBOARD_DATA);
    throw error;
  }
}

function loadSavedLocalData() {
  try { return validateData(JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "null")); } catch { return null; }
}

function saveLocalData(data) {
  try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data)); } catch { /* optional cache */ }
}

function cohortById(id = selectedCohortId) {
  return currentData?.cohorts.find((item) => item.id === id) || currentData?.cohorts.at(-1);
}

/* ---- 维度二：新老用户 ---- */

function segmentsAvailable() {
  return Boolean(currentData?.segments?.by_cohort);
}

function segmentKeys() {
  const declared = currentData?.segments?.keys;
  if (!Array.isArray(declared) || !declared.length) return SEGMENT_ORDER.map((key) => ({ key, ...SEGMENT_FALLBACK_LABELS[key] }));
  return declared;
}

function segmentMeta(key = selectedSegment) {
  return segmentKeys().find((item) => item.key === key) || { key, ...(SEGMENT_FALLBACK_LABELS[key] || { short_label: key, label: key }) };
}

function segmentLabel(key = selectedSegment) {
  return segmentMeta(key).short_label || segmentMeta(key).label || key;
}

// 所选人群 × 所选新老分段的指标视图。segment=all 时回落到 cohorts[]，
// 保证旧快照（无 segments 块）也能照常渲染。
function segmentView(cohortId = selectedCohortId, segmentKey = selectedSegment) {
  const cohort = cohortById(cohortId);
  if (!segmentsAvailable() || segmentKey === "all") {
    if (!cohort) return null;
    const stored = currentData?.segments?.by_cohort?.[cohortId]?.all;
    return { ...cohort, ...(stored || {}), users: cohort.users, suppressed_fields: stored?.suppressed_fields || [] };
  }
  const view = currentData.segments.by_cohort?.[cohortId]?.[segmentKey];
  if (!view) return null;
  return { ...view, suppressed_fields: view.suppressed_fields || [] };
}

// 当前视图；分段数据缺失时退回全部，避免整页空白
function activeView() {
  return segmentView() || segmentView(selectedCohortId, "all");
}

function scopeLabel() {
  const cohort = cohortById();
  const short = cohort?.short_label || "所选人群";
  return selectedSegment === "all" ? short : `${short} · ${segmentLabel()}`;
}

function metric(view, field) {
  if (!view) return null;
  const value = view[field];
  if (value === undefined || value === null) return null;
  return view.suppressed_fields?.includes(field) ? null : value;
}

const SUPPRESSED_TEXT = "样本不足";

function countText(value, unit = "") {
  return value === null || value === undefined ? SUPPRESSED_TEXT : `${number.format(value)}${unit}`;
}

function rateText(value) {
  return value === null || value === undefined ? SUPPRESSED_TEXT : percent.format(value);
}

function moneyText(value) {
  return value === null || value === undefined ? SUPPRESSED_TEXT : money(value);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function setFreshness(mode, text) {
  const freshness = $("#freshness");
  freshness.classList.toggle("is-loading", mode === "loading");
  freshness.classList.toggle("is-error", mode === "error");
  freshness.querySelector("span").textContent = text;
}

function setRefreshStatus(message, progressUrl = "") {
  const status = $("#refresh-status");
  status.textContent = message;
  if (!progressUrl) return;
  try {
    const url = new URL(progressUrl);
    if (url.protocol === "https:" && url.hostname === "ontology.yingmi-inc.com") {
      status.append(" ");
      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "查看本体进度";
      status.append(link);
    }
  } catch { /* ignore invalid progress URLs */ }
}

function renderHero() {
  const { usage, meta } = currentData;
  const cohort = cohortById("active_30d");
  const humanRate = usage.attributed_calls / usage.total_calls;
  const serviceRate = usage.unattributed_calls / usage.total_calls;
  $("#total-calls").textContent = compact(usage.total_calls);
  $("#human-call-rate").textContent = percent.format(humanRate);
  $("#service-call-rate").textContent = percent.format(serviceRate);
  requestAnimationFrame(() => { $("#human-call-share").style.width = `${humanRate * 100}%`; });
  $("#hero-aum").textContent = money(cohort.aum_yuan);
  $("#hero-holders").textContent = number.format(cohort.holders);
  $("#hero-holder-rate").textContent = percent.format(cohort.holder_rate);
  $("#hero-lead").textContent = `截至 ${formatDateTime(meta.data_cutoff)}，${number.format(usage.approved_users)} 位批准用户中，${percent.format(usage.ever_called_users / usage.approved_users)} 曾调用，${percent.format(usage.active_30d_users / usage.approved_users)} 在近 30 日保持活跃。`;
  $("#verdict").textContent = `近 30 日活跃人群的且慢持仓率为 ${percent.format(cohort.holder_rate)}，高于批准用户的 ${percent.format(cohortById("approved").holder_rate)}；但 ${percent.format(serviceRate)} 调用仍无法归属到人，规模与用户价值必须拆账。`;
  $("#footer-cutoff").textContent = footerCutoffText();
  setFreshness("ready", `数据截至 ${formatDateTime(meta.data_cutoff)}`);
}

function cohortButtonMarkup(cohort, index, compactMode = false) {
  const usage = currentData.usage;
  const ratioLabel = index === 0
    ? "人群起点"
    : index === 1
      ? `${percent.format(cohort.users / usage.approved_users)} / 批准用户`
      : `${percent.format(cohort.users / usage.ever_called_users)} / 历史调用`;
  if (compactMode) {
    return `<button type="button" data-cohort="${cohort.id}" class="${cohort.id === selectedCohortId ? "active" : ""}">${escapeHtml(cohort.short_label)}</button>`;
  }
  return `<button type="button" class="cohort-button ${cohort.id === selectedCohortId ? "active" : ""}" data-cohort="${cohort.id}" aria-pressed="${cohort.id === selectedCohortId}">
    <span>0${index + 1} · ${escapeHtml(cohort.label)}</span>
    <strong>${number.format(cohort.users)}</strong>
    <em>${escapeHtml(ratioLabel)}</em>
    <p>${escapeHtml(cohort.definition)}</p>
  </button>`;
}

function renderCohortControls() {
  $("#cohort-ladder").innerHTML = currentData.cohorts.map((cohort, index) => cohortButtonMarkup(cohort, index)).join("");
  $("#cohort-switch").innerHTML = currentData.cohorts.map((cohort, index) => cohortButtonMarkup(cohort, index, true)).join("");
  const usage = currentData.usage;
  $("#cohort-footnotes").innerHTML = [
    `<p>历史调用用户规模相当于批准用户的 <b>${percent.format(usage.ever_called_users / usage.approved_users)}</b>。</p>`,
    `<p>近 30 日活跃规模相当于历史调用用户的 <b>${percent.format(usage.active_30d_users / usage.ever_called_users)}</b>。</p>`,
    `<p>近 30 日共 <b>${compact(usage.calls_30d)}</b> 次调用；三组相互重叠，不可相加。</p>`,
  ].join("");
  document.querySelectorAll("[data-cohort]").forEach((button) => {
    button.addEventListener("click", () => selectCohort(button.dataset.cohort));
  });
}

function growthByCohort(id = selectedCohortId) {
  return currentData?.growth?.by_cohort?.[id] || currentData?.growth?.by_cohort?.active_30d;
}

function growthEvidenceLabels() {
  const definition = currentData.growth.cash_flow_definition;
  const partial = definition.state === "partial";
  return {
    partial,
    first: partial ? "首次资产入账用户（代理）" : "首次入金用户",
    firstShort: partial ? "首次资产入账" : "首次入金",
    inflow: partial ? "资产入账 / 新入金代理" : "外部资金流入 / 新入金",
    inflowShort: partial ? "资产入账" : "外部资金流入",
    net: partial ? "净资产入账（代理）" : "净入金",
  };
}

function applyGrowthEvidenceLabels() {
  const labels = growthEvidenceLabels();
  const definition = currentData.growth.cash_flow_definition;
  const cutoff = formatDay(currentData.growth.cashflow_max_date);
  $("#growth-title").textContent = labels.partial ? "从新注册，到首次资产入账" : "从新注册，到首次外部资金进入且慢";
  $("#growth-scope-copy").textContent = `注册按且慢正式注册时间；${definition.label}，资金数据截至 ${cutoff}。它不是买入或赎回金额。`;
  $("#growth-first-label").textContent = labels.first;
  $("#growth-first-note").textContent = labels.partial ? "全历史首次正资产入账日落在窗口内" : "全历史首次外部资金流入日落在窗口内";
  $("#growth-inflow-label").textContent = labels.inflow;
  $("#growth-inflow-note").textContent = labels.partial ? "窗口内资产入账日代理流入总额" : "窗口内外部资金流入总额";
  $("#growth-net-label").textContent = labels.net;
  $("#growth-net-note").textContent = labels.partial ? "同源资产入账减出账，可为负" : "外部资金流入减流出，可为负";
  $("#growth-mode-first-label").textContent = labels.firstShort;
  $("#growth-mode-inflow-label").textContent = labels.inflowShort;
  $("#growth-mode-net-label").textContent = labels.net;
  $("#growth-funnel-title").textContent = `注册 → ${labels.firstShort} → 仍持仓`;
  $("#growth-speed-label").textContent = `7 日内完成${labels.firstShort}`;
  $("#growth-boundary-copy").textContent = `注册、${labels.inflowShort}和当前 OAP 使用深度只存在时间关系，尚未排除渠道、活动、资产基础与自选择影响，不能表述为“OAP 带来新增”。${labels.partial ? "当前资金口径为 partial，权威现金流恢复后再升级。" : ""}`;
}

// 行为可能停留在更早窗口，页脚必须分源写清楚，不能一句「OAP / 行为截至」糊过去
function footerCutoffText() {
  const { meta, behavior } = currentData;
  const parts = [`OAP 截至 ${formatDateTime(meta.data_cutoff, true)}`];
  parts.push(behavior?.refresh_state === "not_refreshed"
    ? `行为截至 ${formatDay(behavior.as_of)}`
    : `行为截至 ${formatDateTime(meta.data_cutoff)}`);
  parts.push(`资产快照 ${formatDay(meta.asset_snapshot_date)}`);
  return parts.join(" · ");
}

const FIRST_INFLOW_FIELDS = new Set(["first_inflow_users", "first_inflow_d7_users", "first_inflow_d30_users", "still_holding_users"]);
const UNAVAILABLE_TEXT = "本轮未能计算";

// 源头查不到 ≠ 小样本被抑制，两者不能都显示成「样本不足」
function unavailableLabel(field) {
  return currentData?.growth?.first_inflow_state === "missing" && FIRST_INFLOW_FIELDS.has(field) ? UNAVAILABLE_TEXT : "样本不足";
}

function growthValueLabel(row, field, kind = "count") {
  const value = growthMetric(row, field);
  if (value === null) return unavailableLabel(field);
  return kind === "money" ? `约 ${money(value)}` : `${number.format(value)} 人`;
}

function growthComparison(current, previous, field, kind = "count") {
  const currentValue = growthMetric(current, field);
  const previousValue = growthMetric(previous, field);
  if (currentValue === null || previousValue === null) {
    return { text: unavailableLabel(field) === UNAVAILABLE_TEXT ? "该指标本轮未能计算，环比不展示" : "小样本已隐藏，环比不展示", tone: "neutral" };
  }
  if (currentValue === previousValue) return { text: "与前 30 日持平", tone: "neutral" };
  const delta = currentValue - previousValue;
  if (field === "net_inflow_yuan" && (currentValue < 0 || previousValue <= 0)) {
    return { text: `较前 30 日${delta > 0 ? "净增加" : "净减少"} ${money(Math.abs(delta))}`, tone: delta > 0 ? "up" : "down" };
  }
  if (previousValue === 0) return { text: "前 30 日为 0，暂不计算环比", tone: "neutral" };
  const rate = Math.abs(delta / previousValue);
  return { text: `较前 30 日${delta > 0 ? "上升" : "下降"} ${percent.format(rate)}`, tone: delta > 0 ? "up" : "down" };
}

function setGrowthHeadline(valueSelector, changeSelector, current, previous, field, kind) {
  const value = growthMetric(current, field);
  const comparison = growthComparison(current, previous, field, kind);
  $(valueSelector).textContent = growthValueLabel(current, field, kind);
  const change = $(changeSelector);
  change.textContent = comparison.text;
  change.classList.toggle("is-down", comparison.tone === "down");
  change.classList.toggle("is-neutral", comparison.tone === "neutral");
  return value;
}

function shortGrowthPeriod(start, end) {
  const startParts = String(start).split("-").map(Number);
  const endParts = String(end).split("-").map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return `${start}—${end}`;
  return `${startParts[1]}.${startParts[2]}–${endParts[1]}.${endParts[2]}`;
}

// 新老分段的资金口径来自 segments…cashflow；缺失时退回全人群，并在文案里说明
function growthRows() {
  const cohortGrowth = growthByCohort();
  if (selectedSegment === "all" || !segmentsAvailable()) return { current: cohortGrowth.current, previous: cohortGrowth.previous, segmented: false };
  const cashflow = segmentView()?.cashflow;
  if (!cashflow?.current || !cashflow?.previous) return { current: cohortGrowth.current, previous: cohortGrowth.previous, segmented: false };
  return { current: cashflow.current, previous: cashflow.previous, segmented: true };
}

function renderGrowthSummary() {
  applyGrowthEvidenceLabels();
  const cohort = cohortById();
  const { current, previous, segmented } = growthRows();
  $("#growth-cohort-title").textContent = scopeLabel();
  if (selectedSegment !== "all" && !segmented) {
    $("#growth-scope-copy").textContent = `${scopeLabel()}的资金口径本轮无法按新老拆分，以下为${cohort.short_label}全人群数字；注册按且慢正式注册时间。`;
  }
  setGrowthHeadline("#growth-new-registrations", "#growth-new-registrations-change", current, previous, "new_registrations", "count");
  setGrowthHeadline("#growth-first-inflow-users", "#growth-first-inflow-users-change", current, previous, "first_inflow_users", "count");
  setGrowthHeadline("#growth-inflow", "#growth-inflow-change", current, previous, "inflow_yuan", "money");
  const net = setGrowthHeadline("#growth-net-inflow", "#growth-net-inflow-change", current, previous, "net_inflow_yuan", "money");
  $(".growth-net").classList.toggle("is-negative", net !== null && net < 0);
  $("#growth-summary").setAttribute(
    "aria-label",
    `${scopeLabel()}近30日：新注册${growthValueLabel(current, "new_registrations")}; ${growthEvidenceLabels().firstShort}${growthValueLabel(current, "first_inflow_users")}; ${growthEvidenceLabels().inflowShort}${growthValueLabel(current, "inflow_yuan", "money")}; ${growthEvidenceLabels().net}${growthValueLabel(current, "net_inflow_yuan", "money")}。`,
  );
}

function renderGrowthTrend() {
  const cohort = cohortById();
  const cohortGrowth = growthByCohort();
  const labels = growthEvidenceLabels();
  const dynamicLabels = { registrations: "新注册", first_inflow: labels.firstShort, inflow: labels.inflowShort, net_inflow: labels.net };
  const config = { ...GROWTH_MODES[growthMode], label: dynamicLabels[growthMode] };
  const periods = cohortGrowth.trend_periods;
  const values = periods.map((period) => growthMetric(period, config.field));
  const numericValues = values.filter((value) => value !== null);
  const domainMax = Math.max(0, ...numericValues, 1);
  const domainMin = Math.min(0, ...numericValues);
  const domainRange = domainMax - domainMin || 1;
  const zeroPercent = domainMax / domainRange * 100;
  const zeroTop = 28 + 172 * zeroPercent / 100;

  const columns = periods.map((period, index) => {
    const value = values[index];
    const phase = index >= 6 ? "current" : index >= 3 ? "previous" : "older";
    const suppressed = value === null;
    const top = value === null
      ? 42
      : value >= 0
        ? (domainMax - value) / domainRange * 100
        : zeroPercent;
    const height = value === null ? 18 : Math.max(value === 0 ? 1 : Math.abs(value) / domainRange * 100, 2);
    const label = suppressed ? "样本不足" : config.kind === "money" ? money(value) : number.format(value);
    return `<div class="growth-period ${suppressed ? "is-suppressed" : ""} ${value !== null && value < 0 ? "is-negative" : ""}" data-phase="${phase}" data-mode="${growthMode}">
      <strong>${escapeHtml(label)}</strong>
      <div class="growth-bar-slot"><i style="top:${top.toFixed(2)}%;height:${height.toFixed(2)}%"></i></div>
      <span>${escapeHtml(shortGrowthPeriod(period.start, period.end))}</span>
    </div>`;
  }).join("");
  const chart = $("#growth-trend");
  chart.style.setProperty("--zero", `${zeroTop.toFixed(2)}px`);
  chart.innerHTML = `<i class="growth-zero-line" aria-hidden="true"></i><div class="growth-trend-columns">${columns}</div>`;
  chart.setAttribute("aria-label", `${cohort.short_label}${config.label}近90日趋势：${periods.map((period, index) => `${shortGrowthPeriod(period.start, period.end)} ${values[index] === null ? "样本不足" : config.kind === "money" ? money(values[index]) : `${number.format(values[index])}人`}`).join("；")}`);

  const comparison = growthComparison(cohortGrowth.current, cohortGrowth.previous, config.field, config.kind);
  const trendScopeNote = selectedSegment === "all" ? "" : `趋势与漏斗按${cohort.short_label}全人群绘制，未按新老拆分。`;
  $("#growth-trend-copy").textContent = `${cohort.short_label}近 30 日${config.label}为 ${growthValueLabel(cohortGrowth.current, config.field, config.kind)}，${comparison.text}。浅蓝底为前 30 日，浅绿底为近 30 日；斜纹表示样本不足，不展示数值。${trendScopeNote}`;
}

function funnelValueMarkup(row, field) {
  const value = growthMetric(row, field);
  return value === null ? unavailableLabel(field) : `${number.format(value)} 人`;
}

function renderGrowthFunnel() {
  const cohort = cohortById();
  const labels = growthEvidenceLabels();
  const funnel = growthByCohort().funnel;
  const eligible = growthMetric(funnel, "eligible_registrations");
  const d30 = growthMetric(funnel, "first_inflow_d30_users");
  const d7 = growthMetric(funnel, "first_inflow_d7_users");
  const holding = growthMetric(funnel, "still_holding_users");
  const widthFor = (value, denominator, fallback) => value === null || denominator === null
    ? fallback
    : denominator <= 0
      ? 0
      : Math.max(2, value / denominator * 100);
  const conversion = eligible && d30 !== null ? percent.format(d30 / eligible) : unavailableLabel("first_inflow_d30_users");
  const holdingRate = d30 && holding !== null ? percent.format(holding / d30) : unavailableLabel("still_holding_users");
  const stages = [
    { label: "完整观察的新注册", note: "漏斗起点", field: "eligible_registrations", width: 100 },
    { label: `30 日内完成${labels.firstShort}`, note: `注册转化 ${conversion}`, field: "first_inflow_d30_users", width: widthFor(d30, eligible, 100) },
    { label: "截至快照仍持仓", note: `占${labels.firstShort} ${holdingRate}`, field: "still_holding_users", width: widthFor(holding, eligible, 100) },
  ];
  $("#growth-funnel").innerHTML = stages.map((stage) => `<div class="growth-funnel-step ${growthMetric(funnel, stage.field) === null ? "is-suppressed" : ""}" style="--funnel-width:${stage.width.toFixed(2)}%">
    <span><b>${escapeHtml(stage.label)}</b>${escapeHtml(stage.note)}</span><strong>${escapeHtml(funnelValueMarkup(funnel, stage.field))}</strong>
  </div>`).join("");
  $("#growth-funnel").setAttribute("aria-label", `${cohort.short_label}完整观察窗漏斗：新注册${funnelValueMarkup(funnel, "eligible_registrations")}；30日内${labels.firstShort}${funnelValueMarkup(funnel, "first_inflow_d30_users")}；当前仍持仓${funnelValueMarkup(funnel, "still_holding_users")}。`);
  $("#growth-funnel-window").textContent = `注册窗口 ${formatDay(currentData.growth.funnel.registration_start)}—${formatDay(currentData.growth.funnel.registration_end)}；统一观察注册后 30 日，避免未成熟用户拉低转化。`;
  $("#growth-speed strong").textContent = eligible && d7 !== null ? `${number.format(d7)} 人 · ${percent.format(d7 / eligible)}` : unavailableLabel("first_inflow_d7_users");
}

function renderGrowth() {
  renderGrowthSummary();
  renderGrowthTrend();
  renderGrowthFunnel();
}

function compareRowsMarkup() {
  return currentData.cohorts.map((cohort) => {
    const maximum = 0.3;
    return `<div class="compare-row ${cohort.id === selectedCohortId ? "active" : ""}">
      <span>${escapeHtml(cohort.short_label)}</span>
      <div>
        <div class="compare-track account" title="可关联且慢账户率 ${percent.format(cohort.qieman_account_rate)}"><i style="width:${Math.min(100, cohort.qieman_account_rate / maximum * 100)}%"></i></div>
        <div class="compare-track holder" title="持仓率 ${percent.format(cohort.holder_rate)}"><i style="width:${Math.min(100, cohort.holder_rate / maximum * 100)}%"></i></div>
        <div class="compare-track managed" title="在管率 ${percent.format(cohort.managed_rate)}"><i style="width:${Math.min(100, cohort.managed_rate / maximum * 100)}%"></i></div>
        <small>账户 ${percent.format(cohort.qieman_account_rate)} · 持仓 ${percent.format(cohort.holder_rate)} · 在管 ${percent.format(cohort.managed_rate)}</small>
      </div>
      <em>${percent.format(cohort.holder_rate)}</em>
    </div>`;
  }).join("");
}

function renderHoldings() {
  const baseline = currentData.qieman_baseline;
  const view = activeView();
  const accounts = metric(view, "qieman_accounts");
  const accountRate = metric(view, "qieman_account_rate");
  const holders = metric(view, "holders");
  const holderRate = metric(view, "holder_rate");
  const managed = metric(view, "managed_accounts");
  const profitRate = metric(view, "profitable_holder_rate");
  const profitHolders = metric(view, "profitable_holders");
  $("#selected-cohort-title").textContent = scopeLabel();
  $("#qieman-accounts").textContent = countText(accounts);
  $("#qieman-account-rate").textContent = accountRate === null ? "分母 = 所选人群" : `${percent.format(accountRate)} / 人群`;
  $("#holders").textContent = countText(holders);
  $("#holder-rate").textContent = holderRate === null ? "分母 = 所选人群" : `${percent.format(holderRate)} / 人群`;
  $("#aum").textContent = moneyText(metric(view, "aum_yuan"));
  $("#aum-user-share").textContent = managed === null ? "在管人数样本不足" : `${number.format(managed)} 位在管用户`;
  $("#avg-asset").textContent = moneyText(metric(view, "average_holder_asset_yuan"));
  $("#baseline-multiple").textContent = "与且慢在管户均分母不同";
  $("#cohort-compare").innerHTML = compareRowsMarkup();
  const ring = $("#profit-ring");
  ring.style.setProperty("--rate", profitRate === null ? "0" : (profitRate * 100).toFixed(2));
  ring.setAttribute("aria-label", profitRate === null
    ? `${scopeLabel()}的累计收益为正比例样本不足，未公开`
    : `${scopeLabel()}中累计收益为正的持仓用户占${percent.format(profitRate)}`);
  $("#profit-rate").textContent = rateText(profitRate);
  $("#profit-count").textContent = profitHolders === null || holders === null
    ? "小样本已隐藏"
    : `${number.format(profitHolders)} / ${number.format(holders)} 位持仓用户`;
  $("#profit-note").textContent = `且慢可比口径约为 ${percent.format(baseline.profitable_holder_rate)}。这里只描述历史累计状态，不能解释为 OAP 带来的收益。`;
}

function assetBucketRows() {
  const view = activeView();
  const buckets = metric(view, "asset_buckets");
  if (!Array.isArray(buckets)) return null;
  return buckets.some((row) => row.share === null || row.count === null) ? null : buckets;
}

function renderAssets() {
  const baseline = currentData.qieman_baseline;
  const view = activeView();
  const buckets = assetBucketRows();
  const holders = metric(view, "holders");
  if (!buckets) {
    $("#asset-stacked").innerHTML = `<div class="asset-segment" style="width:100%"><strong>${SUPPRESSED_TEXT}</strong></div>`;
    $("#asset-legend").innerHTML = "";
    $("#baseline-callout").innerHTML = `<span>${escapeHtml(scopeLabel())}的资产区间人数低于公开阈值，已整档隐藏，避免用相邻档相减反推。</span><span>且慢全量参照：50 万以上约 <strong>${percent.format(baseline.share_500k_plus)}</strong>，100 万以上约 <strong>${percent.format(baseline.share_1m_plus)}</strong>。</span>`;
    $("#asset-summary").textContent = `${scopeLabel()}的资产分档未达公开样本阈值；请切回“全部”查看结构，或以对照表中的可公开口径为准。`;
    return;
  }
  $("#asset-stacked").innerHTML = buckets.map((row) => `<div class="asset-segment" style="width:${row.share * 100}%" title="${escapeHtml(row.label)}：${number.format(row.count)} 人，${percent.format(row.share)}"><strong>${percent.format(row.share)}</strong></div>`).join("");
  $("#asset-legend").innerHTML = buckets.map((row) => `<article><span>${escapeHtml(row.label)}</span><strong>${percent.format(row.share)}</strong><em>${number.format(row.count)} 人</em></article>`).join("");
  const highAsset = buckets.at(-1).share + buckets.at(-2).share;
  $("#baseline-callout").innerHTML = `<span><strong>${escapeHtml(scopeLabel())}</strong>中，50 万以上占 <strong>${percent.format(highAsset)}</strong>，100 万以上占 <strong>${percent.format(buckets.at(-1).share)}</strong>。</span><span>且慢全量参照：50 万以上约 <strong>${percent.format(baseline.share_500k_plus)}</strong>，100 万以上约 <strong>${percent.format(baseline.share_1m_plus)}</strong>。</span>`;
  $("#asset-summary").textContent = `${scopeLabel()}共有 ${countText(holders)} 位持仓用户；户均 ${moneyText(metric(view, "average_holder_asset_yuan"))}，但 ${percent.format(buckets[0].share + buckets[1].share)} 的持仓仍低于 10 万。`;
}

function behaviorValue(row) {
  const actors = row.actors === null || row.actors === undefined ? null : row.actors;
  const actorNote = actors === null ? "参与人数样本不足" : `${number.format(actors)} 位参与者`;
  if (behaviorMode === "events") return { value: row.events, label: countText(row.events, " 次"), note: actorNote };
  if (behaviorMode === "frequency") {
    return { value: row.events_per_actor, label: row.events_per_actor === null || row.events_per_actor === undefined ? SUPPRESSED_TEXT : `${oneDecimal.format(row.events_per_actor)} 次`, note: actorNote };
  }
  return {
    value: row.penetration,
    label: rateText(row.penetration),
    note: actors === null ? "参与人数样本不足" : `${number.format(actors)} 人 · ${countText(row.events, " 次事件")}`,
  };
}

// 行为尚未按新老拆分时返回 null，由调用方回落并说明，避免画出空图
function segmentBehaviorRows(cohortId, segmentKey) {
  if (segmentKey === "all" || !segmentsAvailable()) return currentData.behavior.by_cohort[cohortId] || [];
  const view = segmentView(cohortId, segmentKey);
  return Array.isArray(view?.behavior) && view.behavior.length ? view.behavior : null;
}

function behaviorRows(cohortId = selectedCohortId, segmentKey = selectedSegment) {
  return segmentBehaviorRows(cohortId, segmentKey) || currentData.behavior.by_cohort[cohortId] || [];
}

function behaviorIsSegmented(cohortId = selectedCohortId, segmentKey = selectedSegment) {
  return segmentKey === "all" || Boolean(segmentBehaviorRows(cohortId, segmentKey));
}

function renderBehavior() {
  const rows = behaviorRows();
  const categoryMap = new Map(currentData.behavior.categories.map((item) => [item.key, item]));
  const max = Math.max(...rows.map((row) => behaviorValue(row).value ?? 0), 1e-9);
  $("#behavior-chart").innerHTML = rows.map((row) => {
    const category = categoryMap.get(row.key) || { label: row.key, state: "partial" };
    const shown = behaviorValue(row);
    const width = shown.value === null || shown.value === undefined ? 0 : shown.value / max * 100;
    return `<div class="behavior-row" data-state="${escapeHtml(category.state)}">
      <span><i></i>${escapeHtml(category.label)}</span>
      <div class="behavior-bar"><i style="width:${width}%"></i></div>
      <strong>${escapeHtml(shown.label)}</strong>
      <small>${escapeHtml(shown.note)}${row.amount_yuan ? ` · 金额约 ${money(row.amount_yuan)}` : ""}</small>
    </div>`;
  }).join("");
  const confirmedKeys = new Set(currentData.behavior.categories.filter((item) => item.state === "confirmed").map((item) => item.key));
  const strongest = [...rows]
    .filter((row) => confirmedKeys.has(row.key) && row.penetration !== null && row.penetration !== undefined)
    .sort((a, b) => b.penetration - a.penetration)[0];
  const segmented = behaviorIsSegmented();
  const scope = segmented ? scopeLabel() : cohortById().short_label;
  const stale = currentData.behavior.refresh_state === "not_refreshed" ? currentData.behavior : null;
  const staleNote = stale
    ? `本模块口径截至 ${formatDay(stale.as_of)}，未随本次刷新更新；参与率分母为当时的人群规模 ${number.format((stale.denominators || {})[selectedCohortId] ?? 0)} 人。`
    : "";
  if (!strongest) {
    $("#behavior-highlight").textContent = SUPPRESSED_TEXT;
    $("#behavior-highlight-copy").textContent = `${scope}的已确认行为参与人数均低于公开阈值，未发布最强信号。`;
    return;
  }
  $("#behavior-highlight").textContent = (categoryMap.get(strongest.key) || {}).label || strongest.key;
  $("#behavior-highlight-copy").textContent = `${scope}中有 ${countText(strongest.actors)} 人参与，渗透率 ${rateText(strongest.penetration)}，人均 ${strongest.events_per_actor === null || strongest.events_per_actor === undefined ? SUPPRESSED_TEXT : `${oneDecimal.format(strongest.events_per_actor)} 次`}。${segmented ? "参与率差异只是相关性，不能直接解释为 OAP 促成。" : "本轮行为数据尚未按新老拆分，这里是该人群全体口径。"}${staleNote ? ` ${staleNote}` : ""}`;
}

function renderSegmentControls() {
  const wrapper = $("#segment-switch");
  const footnotes = $("#segment-footnotes");
  if (!segmentsAvailable()) {
    wrapper.closest("section").hidden = true;
    return;
  }
  wrapper.closest("section").hidden = false;
  const cohort = cohortById();
  const bucket = currentData.segments.by_cohort[cohort.id] || {};
  wrapper.innerHTML = segmentKeys().map((item) => {
    const view = item.key === "all" ? cohort : bucket[item.key];
    const users = item.key === "all" ? cohort.users : (view?.users ?? null);
    const share = item.key === "all" ? 1 : (view?.share ?? null);
    return `<button type="button" class="segment-button ${item.key === selectedSegment ? "active" : ""}" data-segment="${escapeHtml(item.key)}" aria-pressed="${item.key === selectedSegment}">
      <span>${escapeHtml(item.short_label || item.key)}</span>
      <strong>${countText(users)}</strong>
      <em>${item.key === "all" ? "人群全体" : `${rateText(share)} / ${escapeHtml(cohort.short_label)}`}</em>
      <p>${escapeHtml(item.definition || item.label || "")}</p>
    </button>`;
  }).join("");
  const definition = currentData.segments.definition || {};
  const unknown = bucket.unknown_users;
  footnotes.innerHTML = [
    `<p>切分依据：<b>${escapeHtml(definition.label || "且慢注册时间 vs OAP 批准时间")}</b>，证据状态 <b>${escapeHtml(definition.state || "partial")}</b>。</p>`,
    `<p>时间缺失、无法判定新老：<b>${countText(unknown ?? null)}</b> 人，不计入新老任一侧。</p>`,
    `<p>新老之和加上无法判定，等于 <b>${escapeHtml(cohort.short_label)}</b> 的 <b>${number.format(cohort.users)}</b> 人。</p>`,
  ].join("");
  wrapper.querySelectorAll("[data-segment]").forEach((button) => {
    button.addEventListener("click", () => selectSegment(button.dataset.segment));
  });
}

/* ---- 新老对照表 ---- */

const COMPARE_GROUPS = [
  {
    title: "人群规模",
    rows: [
      { label: "人数", kind: "count", pick: (view) => metric(view, "users") },
      { label: "占所选人群", kind: "rate", pick: (view) => metric(view, "share") },
    ],
  },
  {
    title: "且慢资产",
    rows: [
      { label: "可关联且慢账户率", kind: "rate", pick: (view) => metric(view, "qieman_account_rate") },
      { label: "持仓用户", kind: "count", pick: (view) => metric(view, "holders") },
      { label: "持仓率", kind: "rate", pick: (view) => metric(view, "holder_rate") },
      { label: "持仓规模", kind: "money", pick: (view) => metric(view, "aum_yuan") },
      { label: "持仓户均", kind: "money", pick: (view) => metric(view, "average_holder_asset_yuan") },
      { label: "累计收益为正占比", kind: "rate", pick: (view) => metric(view, "profitable_holder_rate") },
    ],
  },
  {
    title: "OAP 使用深度（该分段用户的全历史调用）",
    rows: [
      { label: "累计调用次数", kind: "count", pick: (view) => metric(view.oap_usage || {}, "calls_total") },
      { label: "人均调用次数", kind: "decimal", pick: (view) => metric(view.oap_usage || {}, "calls_per_user") },
    ],
  },
  {
    title: "入金（资产入账代理 · 近 30 日）",
    rows: [
      { label: "入账人数", kind: "count", pick: (view) => metric(view.cashflow?.current || {}, "inflow_users") },
      { label: "入账金额", kind: "money", pick: (view) => metric(view.cashflow?.current || {}, "inflow_yuan") },
      {
        label: "净额",
        kind: "money",
        pick: (view) => {
          const row = view.cashflow?.current || {};
          const inflow = metric(row, "inflow_yuan");
          const outflow = metric(row, "outflow_yuan");
          return inflow === null || outflow === null ? null : inflow - outflow;
        },
      },
    ],
    requires: (view) => Boolean(view.cashflow?.current),
  },
];

// 新用户看「注册相对 OAP 批准日的间隔」，老用户看「账龄」，两侧刻度不同，分别成行
const TENURE_LABELS = {
  d0_7: "批准后 0–7 日内注册",
  d8_30: "批准后 8–30 日注册",
  d31_90: "批准后 31–90 日注册",
  d90_plus: "批准后 90 日以上注册",
  lt_1y: "账龄 1 年以内",
  y1_3: "账龄 1–3 年",
  y3_plus: "账龄 3 年以上",
};

// 该刻度对另一段不适用（例如「账龄」对新用户），与小样本抑制必须区分开
const NOT_APPLICABLE = "__NA__";

// 接近 100% 时多给两位小数，避免 99.97% 被显示成 100%
function preciseShare(value) {
  if (value === null || value === undefined) return SUPPRESSED_TEXT;
  if (value > 0.999 && value < 1) return `${(value * 100).toFixed(2)}%`;
  if (value > 0 && value < 0.001) return `${(value * 100).toFixed(2)}%`;
  return percent.format(value);
}

function compareCellText(value, kind) {
  if (value === null || value === undefined) return SUPPRESSED_TEXT;
  if (kind === "rate") return percent.format(value);
  if (kind === "money") return money(value);
  if (kind === "decimal") return oneDecimal.format(value);
  return number.format(value);
}

function compareGapCell(newValue, oldValue, kind) {
  if (newValue === NOT_APPLICABLE || oldValue === NOT_APPLICABLE) return `<td class="gap" data-tone="flat">刻度不同</td>`;
  if (newValue === null || oldValue === null || newValue === undefined || oldValue === undefined) {
    return `<td class="gap" data-tone="flat">—</td>`;
  }
  if (kind === "rate") {
    const delta = (newValue - oldValue) * 100;
    const tone = Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "new" : "existing";
    return `<td class="gap" data-tone="${tone}">${delta > 0 ? "+" : ""}${oneDecimal.format(delta)} pt</td>`;
  }
  if (newValue === 0 && oldValue === 0) return `<td class="gap" data-tone="flat">同为 0</td>`;
  if (oldValue === 0) return `<td class="gap" data-tone="flat">—</td>`;
  const ratio = newValue / oldValue;
  const tone = Math.abs(ratio - 1) < 0.02 ? "flat" : ratio > 1 ? "new" : "existing";
  // 极端倍数不要被取整成 0× 或 1×，否则「4 万 vs 1.17 亿」看起来像持平
  const label = tone === "flat"
    ? "≈1×"
    : ratio >= 100
      ? `${number.format(Math.round(ratio))}×`
      : ratio < 0.01
        ? `1/${number.format(Math.round(1 / ratio))}`
        : ratio < 0.1
          ? `${ratio.toFixed(3)}×`
          : `${oneDecimal.format(ratio)}×`;
  return `<td class="gap" data-tone="${tone}" title="精确比值 ${ratio.toPrecision(3)}">${label}</td>`;
}

function renderCompare() {
  const section = $("#compare-table").closest("section");
  if (!segmentsAvailable()) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const cohort = cohortById();
  const newView = segmentView(cohort.id, "new") || {};
  const oldView = segmentView(cohort.id, "existing") || {};
  const categories = currentData.behavior.categories;
  const services = currentData.segments.services || [];

  $("#compare-cohort-label").textContent = cohort.short_label;
  $("#compare-head").innerHTML = `<tr>
    <th scope="col">指标</th>
    <th scope="col">新用户 · OAP 后注册</th>
    <th scope="col">老用户 · OAP 前已注册</th>
    <th scope="col">新 / 老</th>
  </tr>`;

  const groups = COMPARE_GROUPS.filter((group) => !group.requires || group.requires(newView) || group.requires(oldView));
  const tenureRows = [...(newView.tenure || []), ...(oldView.tenure || [])];
  if (tenureRows.length) {
    const seen = new Set();
    const buckets = tenureRows.map((row) => row.bucket).filter((bucket) => !seen.has(bucket) && seen.add(bucket));
    groups.push({
      title: "注册与 OAP 批准的时间关系 / 账龄",
      rows: buckets.map((bucket) => ({
        label: TENURE_LABELS[bucket] || bucket,
        kind: "count",
        pickRow: (segmentKey) => {
          const view = segmentKey === "new" ? newView : oldView;
          const tenure = view.tenure || [];
          const row = tenure.find((item) => item.bucket === bucket);
          // 该段没有这个刻度（新用户没有「账龄」档）→ 不适用，不是小样本
          if (!row) return tenure.length ? NOT_APPLICABLE : null;
          return row.users ?? null;
        },
      })),
    });
  }
  if (behaviorIsSegmented(cohort.id, "new") && behaviorIsSegmented(cohort.id, "existing")) {
    groups.push({
      title: "投资行为参与率（近 90 日）",
      rows: categories.map((category) => ({
        label: `${category.label}${category.state === "confirmed" ? "" : category.state === "partial" ? "（口径部分确认）" : "（语义待补）"}`,
        kind: "rate",
        pickRow: (segmentKey) => {
          const row = behaviorRows(cohort.id, segmentKey).find((item) => item.key === category.key);
          return row ? (row.penetration ?? null) : null;
        },
      })),
    });
  }
  if (services.length) {
    groups.push({
      title: "平台服务使用渗透率",
      rows: services.map((service) => ({
        label: `${service.label}${service.state === "confirmed" ? "" : "（口径部分确认）"}`,
        kind: "rate",
        pickRow: (segmentKey) => {
          const view = segmentKey === "new" ? newView : oldView;
          const row = (view.services || []).find((item) => item.key === service.key);
          return row ? (row.penetration ?? null) : null;
        },
      })),
    });
  }

  $("#compare-body").innerHTML = groups.map((group) => {
    const header = `<tr data-group="head"><td colspan="4">${escapeHtml(group.title)}</td></tr>`;
    const body = group.rows.map((row) => {
      const newValue = row.pickRow ? row.pickRow("new") : row.pick(newView);
      const oldValue = row.pickRow ? row.pickRow("existing") : row.pick(oldView);
      const cell = (value) => value === NOT_APPLICABLE
        ? `<td class="suppressed">不适用</td>`
        : value === null || value === undefined
          ? `<td class="suppressed">${SUPPRESSED_TEXT}</td>`
          : `<td class="value">${escapeHtml(compareCellText(value, row.kind))}</td>`;
      return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cell(newValue)}${cell(oldValue)}${compareGapCell(newValue, oldValue, row.kind)}</tr>`;
    }).join("");
    return header + body;
  }).join("");

  const newAum = metric(newView, "aum_yuan");
  const oldAum = metric(oldView, "aum_yuan");
  const aumTotal = newAum !== null && oldAum !== null ? newAum + oldAum : null;
  const missing = currentData.segments.missing_dimensions || [];
  $("#compare-readout").innerHTML = [
    `<article><span>资产侧读数</span><p>新用户持仓率 <b>${rateText(metric(newView, "holder_rate"))}</b>，老用户 <b>${rateText(metric(oldView, "holder_rate"))}</b>；持仓规模 <b>${moneyText(newAum)}</b> 对 <b>${moneyText(oldAum)}</b>${aumTotal ? `，老用户贡献两段合计的 <b>${preciseShare(oldAum / aumTotal)}</b>` : ""}。人数多的一侧，不等于资产多的一侧。</p></article>`,
    missing.length
      ? `<article><span>本轮查不到，未发布</span><p>${missing.map((item) => `<b>${escapeHtml(item.label)}</b>：${escapeHtml(item.reason)}`).join("；")}。这些维度没有按新老拆分，页面上不用近似口径顶替。</p></article>`
      : `<article><span>边界</span><p>新老不是随机分配。老用户在 OAP 之前已在且慢积累资产，新用户账龄普遍更短，<b>差值只能描述结构，不能当作 OAP 的增量效果</b>。</p></article>`,
  ].join("");
}

/* ---- 平台服务使用 ---- */

function renderServices() {
  const section = $("#services-section");
  const services = currentData.segments?.services || [];
  const unavailable = currentData.segments?.unavailable_services || [];
  if (!segmentsAvailable() || (!services.length && !unavailable.length)) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const view = activeView() || {};
  const rows = services.map((service) => {
    const row = (view.services || []).find((item) => item.key === service.key) || {};
    return { ...service, actors: row.actors ?? null, penetration: row.penetration ?? null, events_per_actor: row.events_per_actor ?? null };
  });
  const max = Math.max(...rows.map((row) => row.penetration ?? 0), 1e-9);
  $("#services-chart").innerHTML = rows.length
    ? rows.map((row) => `<div class="service-row ${row.penetration === null ? "is-suppressed" : ""}" data-state="${escapeHtml(row.state || "confirmed")}">
        <span><i></i>${escapeHtml(row.label)}</span>
        <div class="service-bar"><i style="width:${row.penetration === null ? 0 : row.penetration / max * 100}%"></i></div>
        <strong>${escapeHtml(rateText(row.penetration))}</strong>
        <small>${escapeHtml(countText(row.actors))} 人使用${row.events_per_actor ? ` · 人均 ${oneDecimal.format(row.events_per_actor)} 次` : ""}</small>
      </div>`).join("")
    : `<p class="services-empty">本次刷新没有通过口径校验的且慢服务使用指标，未发布任何渗透率。</p>`;
  $("#services-unavailable").innerHTML = unavailable.length
    ? unavailable.map((item) => `<article><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.reason)}</p></article>`).join("")
    : `<p class="services-empty">本次没有额外标记为不可用的服务口径。</p>`;
  const strongest = [...rows].filter((row) => row.penetration !== null).sort((a, b) => b.penetration - a.penetration)[0];
  $("#services-title").textContent = `平台服务使用：${rows.length} 项可查口径，最高渗透 ${strongest ? `${strongest.label} ${percent.format(strongest.penetration)}` : SUPPRESSED_TEXT}`;
  $("#services-scope").textContent = `这里统计的是且慢平台侧服务/功能的使用，不是 OAP 调用。分母为${scopeLabel()}；口径不可靠的服务列在右侧，不做近似替代。`;
}

/* ---- 标题：全部由数据生成，避免刷新后写死的数字变旧 ---- */

function renderTitles() {
  const { usage, meta } = currentData;
  const cohort = cohortById();
  const view = activeView();
  const approved = cohortById("approved");

  $("#cohort-title").textContent = `人群规模：批准 ${number.format(usage.approved_users)} · 曾调用 ${number.format(usage.ever_called_users)} · 近 30 日活跃 ${number.format(usage.active_30d_users)}`;

  if (segmentsAvailable()) {
    const newView = segmentView(cohort.id, "new") || {};
    $("#segment-title").textContent = `新老结构：${countText(metric(newView, "users"))} 位新用户（${rateText(metric(newView, "share"))}）先用 OAP 后注册且慢`;
    $("#compare-title").textContent = `新老用户对照：资产、入金、行为、服务使用（当前 ${cohort.short_label}）`;
  }

  const { current } = growthRows();
  const registrations = growthMetric(current, "new_registrations");
  const inflow = growthMetric(current, "inflow_yuan");
  const net = growthMetric(current, "net_inflow_yuan");
  $("#growth-title").textContent = `近 30 日：新注册 ${countText(registrations, " 人")}、资产入账 ${moneyText(inflow)}、净额 ${net === null ? SUPPRESSED_TEXT : `${net < 0 ? "-" : "+"}${money(Math.abs(net))}`}`;

  $("#holdings-title").innerHTML = `<span id="selected-cohort-title">${escapeHtml(scopeLabel())}</span>：持仓率 ${escapeHtml(rateText(metric(view, "holder_rate")))} · 规模 ${escapeHtml(moneyText(metric(view, "aum_yuan")))} · 户均 ${escapeHtml(moneyText(metric(view, "average_holder_asset_yuan")))}`;

  const buckets = assetBucketRows();
  $("#asset-title").textContent = buckets
    ? `资产分布：${percent.format(buckets[0].share + buckets[1].share)} 低于 10 万，${percent.format(buckets.at(-1).share + buckets.at(-2).share)} 在 50 万以上`
    : `资产分布：${scopeLabel()}分档样本不足，未公开`;

  const confirmedKeys = new Set(currentData.behavior.categories.filter((item) => item.state === "confirmed").map((item) => item.key));
  const categoryMap = new Map(currentData.behavior.categories.map((item) => [item.key, item]));
  const strongest = [...behaviorRows()]
    .filter((row) => confirmedKeys.has(row.key) && row.penetration !== null && row.penetration !== undefined)
    .sort((a, b) => b.penetration - a.penetration)[0];
  const behaviorStale = currentData.behavior.refresh_state === "not_refreshed" ? `（截至 ${formatDay(currentData.behavior.as_of)}）` : "";
  $("#behavior-title").textContent = strongest
    ? `投资行为${behaviorStale}：最强信号${(categoryMap.get(strongest.key) || {}).label || strongest.key}，参与率 ${percent.format(strongest.penetration)}`
    : `投资行为${behaviorStale}：${scopeLabel()}的已确认行为样本不足`;

  const profile = currentData.profile;
  $("#profile-title").innerHTML = `问卷画像：覆盖 ${escapeHtml(percent.format(profile.survey_coverage_approx))}，结构化仅 ${escapeHtml(number.format(profile.structured_profile_rows))} 条，<br />只代表回答者`;

  const counts = currentData.quality_checks.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {});
  $("#quality-title").textContent = `数据健康：${counts.pass || 0} 项通过、${counts.warn || 0} 项有边界、${counts.missing || 0} 项缺失`;

  const humanRate = usage.attributed_calls / usage.total_calls;
  if (segmentsAvailable()) {
    const approvedNew = segmentView("approved", "new") || {};
    const approvedOld = segmentView("approved", "existing") || {};
    $("#hero-headline").textContent = `${number.format(usage.approved_users)} 位批准用户里，${countText(metric(approvedNew, "users"))} 位（${rateText(metric(approvedNew, "share"))}）是先用 OAP 才注册且慢的新用户；但持仓资产几乎全部来自 ${countText(metric(approvedOld, "users"))} 位老用户。`;
  } else {
    $("#hero-headline").textContent = `${number.format(usage.approved_users)} 位批准用户在且慢持仓 ${money(approved.aum_yuan)}；${percent.format(humanRate)} 的调用可归属到人。`;
  }
  $("#footer-cutoff").textContent = footerCutoffText();
}

function renderProfile() {
  const profile = currentData.profile;
  $("#survey-coverage").textContent = percent.format(profile.survey_coverage_approx);
  $("#profile-rows").textContent = `${number.format(profile.structured_profile_rows)} 条`;
  $("#profile-note").textContent = profile.note;
  $("#profile-chart").innerHTML = profile.dimensions.map((item) => {
    const baseline = Number.isFinite(item.qieman_baseline) ? item.qieman_baseline : null;
    const left = baseline === null ? item.share : Math.min(item.share, baseline);
    const width = baseline === null ? 0 : Math.abs(item.share - baseline);
    return `<div class="profile-row">
      <span>${escapeHtml(item.label)}</span>
      <div class="dumbbell" aria-label="${escapeHtml(item.label)}：OAP 样本 ${percent.format(item.share)}${baseline === null ? "" : `，且慢基线 ${percent.format(baseline)}`}">
        ${baseline === null ? "" : `<i style="left:${left * 100}%;width:${width * 100}%"></i><b style="left:${baseline * 100}%" title="且慢基线 ${percent.format(baseline)}"></b>`}
        <b style="left:${item.share * 100}%" title="OAP 样本 ${percent.format(item.share)}"></b>
      </div>
      <strong>${percent.format(item.share)}</strong>
      <small>OAP 样本 n=${number.format(item.sample)}${baseline === null ? " · 暂无可比基线" : ` · 且慢基线 ${percent.format(baseline)}`}</small>
    </div>`;
  }).join("");
}

function renderQuality() {
  const counts = currentData.quality_checks.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {});
  $("#quality-score").textContent = `${counts.pass || 0} PASS · ${counts.warn || 0} WARN · ${counts.missing || 0} MISSING`;
  $("#quality-grid").innerHTML = currentData.quality_checks.map((item) => `<article class="quality-card" data-status="${escapeHtml(item.status)}"><span>${escapeHtml(item.status.toUpperCase())}</span><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join("");
}

function buildDocument() {
  const data = currentData;
  const cohort = cohortById();
  const growth = growthByCohort();
  const labels = growthEvidenceLabels();
  const humanRate = data.usage.attributed_calls / data.usage.total_calls;
  const cohortRows = data.cohorts.map((item) => `| ${item.label} | ${number.format(item.users)} | ${percent.format(item.qieman_account_rate)} | ${percent.format(item.holder_rate)} | ${money(item.aum_yuan)} | ${money(item.average_holder_asset_yuan)} |`).join("\n");
  const growthRows = [
    ["新注册用户", "new_registrations", "count"],
    [labels.first, "first_inflow_users", "count"],
    [labels.inflow, "inflow_yuan", "money"],
    [labels.net, "net_inflow_yuan", "money"],
  ].map(([label, field, kind]) => `| ${label} | ${growthValueLabel(growth.current, field, kind)} | ${growthValueLabel(growth.previous, field, kind)} | ${growthComparison(growth.current, growth.previous, field, kind).text} |`).join("\n");
  const trendRows = growth.trend_periods.map((row) => `| ${row.start}—${row.end} | ${growthValueLabel(row, "new_registrations")} | ${growthValueLabel(row, "first_inflow_users")} | ${growthValueLabel(row, "inflow_yuan", "money")} | ${growthValueLabel(row, "net_inflow_yuan", "money")} |`).join("\n");
  const behaviorDocRows = behaviorRows(cohort.id, "all").map((row) => {
    const category = data.behavior.categories.find((item) => item.key === row.key);
    return `| ${category.label} | ${countText(row.actors)} | ${rateText(row.penetration)} | ${countText(row.events)} | ${row.events_per_actor === null || row.events_per_actor === undefined ? "样本不足" : oneDecimal.format(row.events_per_actor)} | ${category.state} |`;
  }).join("\n");
  const profileRows = data.profile.dimensions.map((item) => `| ${item.label} | ${item.count}/${item.sample} | ${percent.format(item.share)} | ${item.qieman_baseline === null ? "—" : percent.format(item.qieman_baseline)} |`).join("\n");
  const cashflowDefinition = data.growth.cash_flow_definition;
  const d30 = growthMetric(growth.funnel, "first_inflow_d30_users");
  const d7 = growthMetric(growth.funnel, "first_inflow_d7_users");
  const eligible = growthMetric(growth.funnel, "eligible_registrations");
  const holding = growthMetric(growth.funnel, "still_holding_users");
  const segmentDocSection = (() => {
    if (!segmentsAvailable()) return "\n本次快照未包含新老用户切分。\n";
    const definition = data.segments.definition || {};
    const bucket = data.segments.by_cohort[cohort.id] || {};
    const newView = bucket.new || {};
    const oldView = bucket.existing || {};
    const usageRow = (view, field) => {
      const value = metric(view.oap_usage || {}, field);
      if (value === null) return "样本不足";
      return field === "calls_per_user" ? `${oneDecimal.format(value)} 次` : `${number.format(value)} 次`;
    };
    const rows = [
      ["人数", countText(metric(newView, "users")), countText(metric(oldView, "users"))],
      ["占所选人群", rateText(metric(newView, "share")), rateText(metric(oldView, "share"))],
      ["可关联且慢账户率", rateText(metric(newView, "qieman_account_rate")), rateText(metric(oldView, "qieman_account_rate"))],
      ["持仓用户", countText(metric(newView, "holders")), countText(metric(oldView, "holders"))],
      ["持仓率", rateText(metric(newView, "holder_rate")), rateText(metric(oldView, "holder_rate"))],
      ["持仓规模", moneyText(metric(newView, "aum_yuan")), moneyText(metric(oldView, "aum_yuan"))],
      ["持仓户均", moneyText(metric(newView, "average_holder_asset_yuan")), moneyText(metric(oldView, "average_holder_asset_yuan"))],
      ["累计收益为正占比", rateText(metric(newView, "profitable_holder_rate")), rateText(metric(oldView, "profitable_holder_rate"))],
      ["累计调用次数", usageRow(newView, "calls_total"), usageRow(oldView, "calls_total")],
      ["人均调用次数", usageRow(newView, "calls_per_user"), usageRow(oldView, "calls_per_user")],
    ].map(([label, left, right]) => `| ${label} | ${left} | ${right} |`).join("\n");
    const tenureLines = [
      ...(newView.tenure || []).map((row) => `| 新用户 · ${TENURE_LABELS[row.bucket] || row.bucket} | ${countText(row.users)} |`),
      ...(oldView.tenure || []).map((row) => `| 老用户 · ${TENURE_LABELS[row.bucket] || row.bucket} | ${countText(row.users)} |`),
    ].join("\n");
    const serviceLines = (data.segments.services || []).map((service) => {
      const pick = (view) => {
        const row = (view.services || []).find((item) => item.key === service.key);
        return row ? rateText(row.penetration ?? null) : "样本不足";
      };
      return `| ${service.label}（${service.state}） | ${pick(newView)} | ${pick(oldView)} |`;
    }).join("\n");
    const unavailableLines = (data.segments.unavailable_services || []).map((item) => `- **${item.label}**：${item.reason}`).join("\n");
    const missingLines = (data.segments.missing_dimensions || []).map((item) => `- **${item.label}**：${item.reason}`).join("\n");
    return `
切分口径：${definition.label || "且慢注册时间 vs OAP 批准时间"}（证据状态 **${definition.state || "partial"}**）。${definition.detail || ""}

- **新用户**：且慢正式注册时间不早于该用户的 OAP 批准日，即先接触 OAP、之后才注册且慢。
- **老用户**：OAP 批准之前已是且慢注册用户。
- **无法判定**：${countText(Number.isInteger(bucket.unknown_users) ? bucket.unknown_users : null)} 人，注册或批准时间缺失，不以建表/更新时间补值，也不并入任一侧。

当前人群：${cohort.label}。

| 指标 | 新用户 | 老用户 |
|---|---:|---:|
${rows}

**注册与 OAP 批准的时间关系 / 账龄**

| 分档 | 人数 |
|---|---:|
${tenureLines}

**平台服务使用渗透率**

${serviceLines ? `| 服务（口径状态） | 新用户 | 老用户 |\n|---|---:|---:|\n${serviceLines}` : "本次没有通过口径校验的且慢服务使用指标。"}

${unavailableLines ? `服务口径查不到或不可靠，未发布：\n${unavailableLines}\n` : ""}
${missingLines ? `本轮无法按新老拆分的维度：\n${missingLines}\n` : ""}
边界：新老两组不是随机分配。老用户在 OAP 之前已在且慢积累资产与交易习惯，新用户账龄普遍更短，资产自然更低。两组差值只能描述结构，**不能当作 OAP 的获客或增量效果**；要回答因果，需按注册时点、初始资产与渠道匹配对照组。${data.segments.snapshot_note ? `\n\n${data.segments.snapshot_note}` : ""}
`;
  })();
  const d30Rate = eligible && d30 !== null ? percent.format(d30 / eligible) : "样本不足";
  const d7Rate = eligible && d7 !== null ? percent.format(d7 / eligible) : "样本不足";
  const holdingRate = d30 && holding !== null ? percent.format(holding / d30) : "样本不足";
  return `# OAP 用户画像 × 且慢增长、持仓与行为看板

> OAP / 行为数据截至：${formatDateTime(data.meta.data_cutoff, true)}
> 资产快照：${formatDay(data.meta.asset_snapshot_date)}
> 增长趋势：${formatDay(data.growth.trend.window_start)}—${formatDay(data.growth.trend.window_end)}（每 10 日）
> 近 90 日行为窗口：${formatDay(data.meta.behavior_window_start)}—${formatDay(data.meta.behavior_window_end)}
> 来源：${data.meta.source}
> 隐私：${data.meta.privacy}

## 1. 分析目标

回答 OAP 用户中，谁在近期新注册且慢、谁完成${labels.firstShort}、${labels.inflowShort}与${labels.net}如何变化，以及这些领先指标与当前持仓、行为之间呈现什么关系。用于判断增长链路应优先补哪一步，不把时间相关性误写成 OAP 的因果贡献。

## 2. 核心判断

OAP 的“平台规模”“注册激活”“资金变化”和“存量价值”必须分开经营。累计 ${compact(data.usage.total_calls)} 次调用中，只有 ${percent.format(humanRate)} 可归属到具体用户；${cohort.short_label}近 30 日新注册为 ${growthValueLabel(growth.current, "new_registrations")}、${labels.firstShort}为 ${growthValueLabel(growth.current, "first_inflow_users")}、${labels.inflowShort}为 ${growthValueLabel(growth.current, "inflow_yuan", "money")}。这些数据描述同期关系，不证明由 OAP 导致。

## 3. 数据健康度

${data.quality_checks.map((item) => `- **${item.status.toUpperCase()}｜${item.label}**：${item.detail}`).join("\n")}

- 公开非零人数单元格最小样本量为 n ≥ ${data.meta.minimum_public_cell}；1–19 显示“样本不足”，真实为 0 时可显示 0。
- 新注册以且慢正式 \`registered_at\` 为准。
- 资金口径为 **${cashflowDefinition.state}**：${cashflowDefinition.detail}

## 4. 指标拆解

\`增长结果 = 新注册规模 × 30 日${labels.firstShort}转化 × ${labels.firstShort}后仍持仓比例\`

账户资金同时拆成：\`${labels.net} = 同源流入 - 同源流出\`。${labels.firstShort}以全历史首次正资金入账日识别，不推断交易级先后顺序。

### 4.1 三组人群

| 人群 | 用户数 | 且慢账户率 | 持仓率 | 持仓规模 | 持仓户均 |
|---|---:|---:|---:|---:|---:|
${cohortRows}

- 历史调用用户规模相当于批准用户的 ${percent.format(data.usage.ever_called_users / data.usage.approved_users)}。
- 近 30 日活跃规模相当于历史调用用户的 ${percent.format(data.usage.active_30d_users / data.usage.ever_called_users)}。
- 三组相互重叠，不可相加；后两组按调用深度递进。

### 4.2 新老用户切分（维度二）
${segmentDocSection}

## 5. 新增增长：${cohort.label}

当前窗口：${formatDay(data.growth.comparison.current_start)}—${formatDay(data.growth.comparison.current_end)}；对比窗口：${formatDay(data.growth.comparison.previous_start)}—${formatDay(data.growth.comparison.previous_end)}。

| 指标 | 近 30 日 | 前 30 日 | 同期变化 |
|---|---:|---:|---|
${growthRows}

### 5.1 完整观察窗漏斗

- 完整观察的新注册：${funnelValueMarkup(growth.funnel, "eligible_registrations")}
- 30 日内完成${labels.firstShort}：${funnelValueMarkup(growth.funnel, "first_inflow_d30_users")}，注册转化 ${d30Rate}
- 其中 7 日内完成：${funnelValueMarkup(growth.funnel, "first_inflow_d7_users")}，占注册 ${d7Rate}
- 截至资产快照仍持仓：${funnelValueMarkup(growth.funnel, "still_holding_users")}，占 30 日${labels.firstShort} ${holdingRate}

注册窗口为 ${formatDay(data.growth.funnel.registration_start)}—${formatDay(data.growth.funnel.registration_end)}，每位用户至少拥有 30 日观察期。

### 5.2 近 90 日趋势

| 10 日区间 | 新注册 | ${labels.firstShort} | ${labels.inflowShort} | ${labels.net} |
|---|---:|---:|---:|---:|
${trendRows}

## 6. 当前持仓：${cohort.label}

- 用户：${number.format(cohort.users)}
- 可关联且慢账户：${number.format(cohort.qieman_accounts)}（${percent.format(cohort.qieman_account_rate)}）
- 当前持仓：${number.format(cohort.holders)}（${percent.format(cohort.holder_rate)}）
- 在管用户：${number.format(cohort.managed_accounts)}（${percent.format(cohort.managed_rate)}）
- 持仓规模：${money(cohort.aum_yuan)}
- 持仓户均：${money(cohort.average_holder_asset_yuan)}；且慢在管户均约 ${money(data.qieman_baseline.average_asset_yuan)}，两者分母不同，不作倍数比较
- 累计收益为正：${number.format(cohort.profitable_holders)}/${number.format(cohort.holders)}（${percent.format(cohort.profitable_holder_rate)}）

### 6.1 近 90 日行为

行为按未撤销事件汇总，不等同于最终成交或确认份额。

| 行为 | 参与人数 | 人群参与率 | 事件数 | 人均频次 | 语义状态 |
|---|---:|---:|---:|---:|---|
${behaviorDocRows}

“其他计划交易”仅部分确认；“SI 交易”含义待补，不能擅自解释成定投。

## 7. 画像样本

画像问卷覆盖约 ${percent.format(data.profile.survey_coverage_approx)}，关键字段缺失率约 84%–89%。以下结论只代表非缺失样本。

| 维度 | 命中/样本 | OAP 样本 | 且慢基线 |
|---|---:|---:|---:|
${profileRows}

## 8. 假设列表

| # | 假设 | 支撑证据 | 关系类型 | 可信度 | 验证方式 |
|---|---|---|---|---|---|
| H1 | 注册变化可能传导至后续${labels.firstShort} | 当前只观察到新注册与全人群同期资金指标；首次入账漏斗受小样本抑制 | 🧪 待验证 | 低 | 按注册批次比较 D7 / D30，控制渠道、活动与资产基础 |
| H2 | OAP 使用更深的人群可能有更强资金与持仓表现 | 近 30 日活跃人群持仓率 ${percent.format(cohortById("active_30d").holder_rate)}，批准人群 ${percent.format(cohortById("approved").holder_rate)} | 🔗 相关性 | 低 | 按注册时点、历史资产与使用倾向匹配对照 |
| H3 | 资金变化可能受市场、活动与渠道共同影响 | 当前为资产入账日代理口径，且没有控制同期运营与市场因素 | 🔗 相关性 | 低 | 权威现金流恢复后，再分渠道、活动暴露和市场阶段做匹配对照 |

## 9. 行动建议

1. **P0｜经营注册到${labels.firstShort}漏斗**：固定观察 D7 / D30，按注册批次识别转化差异；不要把全人群同期资金变化直接当作新注册转化。
2. **P0｜升级权威现金流**：恢复受控查询权限后，先复核资产入账代理与权威现金流的差异，再按来源识别变化贡献。
3. **P1｜做活跃增量验证**：按注册时点、历史资产、渠道匹配对照，持续观察后续入金、持仓与服务行为。
4. **P1｜补画像采集**：覆盖未达阈值前只展示样本结论，不做人群外推。

## 10. 验证计划

- **核心指标**：注册后 D7 / D30 ${labels.firstShort}率、30 日${labels.net}、${labels.firstShort}后仍持仓率。
- **护栏指标**：赎回/资金流出、投诉、风险等级不匹配、样本抑制比例。
- **设计**：匹配对照或分层随机触达；至少跑满 30 日观察期。
- **决策规则**：只有控制混杂因素后仍稳定提升，才升级为疑似因果；未经实验不标记“已验证因果”。

## 11. 口径与更新机制

Clair 的 Mac 上通过仅监听本机的只读更新器调用盈米本体，网页只接收脱敏聚合；浏览器不能传 SQL。结构、窗口闭合、小样本抑制或隐私校验失败时，保留上一版完整快照，不混用不同截止日的数据。其他设备只读取最近发布快照。`;
}

function renderDocument() {
  $("#doc-content").textContent = buildDocument();
}

function render(data, mode = "published") {
  currentData = validateData(data);
  if (!currentData.cohorts.some((item) => item.id === selectedCohortId)) selectedCohortId = "active_30d";
  if (!segmentKeys().some((item) => item.key === selectedSegment)) selectedSegment = "all";
  renderHero();
  renderCohortControls();
  renderSegmentControls();
  renderCompare();
  renderGrowth();
  renderHoldings();
  renderAssets();
  renderBehavior();
  renderServices();
  renderProfile();
  renderQuality();
  renderTitles();
  renderDocument();
  document.documentElement.dataset.dataMode = mode;
}

// 换人群或换新老分段后要重画的模块
function renderScopedModules() {
  renderSegmentControls();
  renderCompare();
  renderGrowth();
  renderHoldings();
  renderAssets();
  renderBehavior();
  renderServices();
  renderTitles();
  renderDocument();
}

function selectCohort(id) {
  if (!currentData?.cohorts.some((item) => item.id === id)) return;
  selectedCohortId = id;
  renderCohortControls();
  renderScopedModules();
}

function selectSegment(key) {
  if (!segmentKeys().some((item) => item.key === key)) return;
  selectedSegment = key;
  renderScopedModules();
}

function selectBehaviorMode(mode) {
  if (!["penetration", "events", "frequency"].includes(mode)) return;
  behaviorMode = mode;
  document.querySelectorAll("[data-behavior-mode]").forEach((button) => button.classList.toggle("active", button.dataset.behaviorMode === mode));
  renderBehavior();
}

function selectGrowthMode(mode) {
  if (!GROWTH_MODES[mode]) return;
  growthMode = mode;
  document.querySelectorAll("[data-growth-mode]").forEach((button) => {
    const active = button.dataset.growthMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderGrowthTrend();
  renderDocument();
}

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

async function startLocalRefresh() {
  const health = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/health`, { cache: "no-store", headers: LOCAL_HEADER }, 2000);
  if (!health.ok) throw new Error("本机更新器未就绪");
  const healthData = await health.json();
  if (healthData.schema_version !== "oap-qieman-user-dashboard-v1" || healthData.contract_revision !== CONTRACT_REVISION) throw new Error("本机更新器版本不兼容");

  const response = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: { ...LOCAL_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh" }),
  }, 5000);
  if (!response.ok) throw new Error(`本机更新器返回 ${response.status}`);
  const started = await response.json();
  if (!started.job_id) throw new Error("本机更新器没有返回任务编号");
  setRefreshStatus(started.message || "本体查询已开始。", started.progress_url || "");

  for (let attempt = 0; attempt < 1200; attempt += 1) {
    await delay(2500);
    const statusResponse = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/status?job=${encodeURIComponent(started.job_id)}&v=${Date.now()}`, {
      cache: "no-store",
      headers: LOCAL_HEADER,
    }, 6000);
    if (!statusResponse.ok) throw new Error(`查询状态返回 ${statusResponse.status}`);
    const status = await statusResponse.json();
    setRefreshStatus(status.message || "本体正在查询。", status.progress_url || "");
    if (status.status === "completed") {
      const refreshed = validateData(status.data);
      saveLocalData(refreshed);
      return refreshed;
    }
    if (status.status === "failed") throw new Error(status.message || "本体查询失败");
  }
  throw new Error("本体查询超过 15 分钟，请稍后重试");
}

async function refreshData() {
  const button = $("#refresh-button");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("is-loading");
  button.querySelector("span").textContent = "正在更新";
  setFreshness("loading", "正在连接本体");
  setRefreshStatus("正在连接 Clair Mac 上的本体更新器…");
  try {
    const refreshed = await startLocalRefresh();
    render(refreshed, "local-live");
    setRefreshStatus(`本体查询与校验完成，数据已更新至 ${formatDateTime(refreshed.meta.data_cutoff)}。`);
    showToast("已换成最新脱敏生产聚合数据");
  } catch (localError) {
    try {
      const published = await loadPublishedData(true);
      const saved = loadSavedLocalData();
      const newest = isNewerSnapshot(saved, published) ? saved : published;
      render(newest, newest === saved ? "local-cache" : "published");
      setRefreshStatus(`本机更新器未连接，已保留最近可用快照（截至 ${formatDateTime(newest.meta.data_cutoff)}）。`);
      showToast("未连接本机更新器，已保留最近快照");
    } catch {
      setFreshness("error", "更新失败");
      setRefreshStatus(`更新失败：${localError.message || "无法连接本体或读取快照"}`);
      showToast("更新失败，请稍后再试");
    }
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.querySelector("span").textContent = "更新数据";
  }
}

function setDocumentOpen(open) {
  const panel = $("#doc-panel");
  const overlay = $("#doc-overlay");
  const fab = $("#doc-fab");
  panel.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", String(!open));
  fab.setAttribute("aria-expanded", String(open));
  if (open) $("#close-doc").focus();
  else fab.focus();
}

function bindInteractions() {
  $("#refresh-button").addEventListener("click", refreshData);
  document.querySelectorAll("[data-behavior-mode]").forEach((button) => button.addEventListener("click", () => selectBehaviorMode(button.dataset.behaviorMode)));
  document.querySelectorAll("[data-growth-mode]").forEach((button) => button.addEventListener("click", () => selectGrowthMode(button.dataset.growthMode)));
  $("#doc-fab").addEventListener("click", () => setDocumentOpen(true));
  $("#close-doc").addEventListener("click", () => setDocumentOpen(false));
  $("#doc-overlay").addEventListener("click", () => setDocumentOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#doc-panel").classList.contains("open")) setDocumentOpen(false);
  });
  $("#copy-doc").addEventListener("click", async () => {
    const button = $("#copy-doc");
    try {
      await navigator.clipboard.writeText($("#doc-content").textContent);
      button.textContent = "已复制";
      showToast("分析与口径文档已复制");
      window.setTimeout(() => { button.textContent = "复制 Markdown"; }, 1800);
    } catch { showToast("浏览器未授权复制，请手动选择文本"); }
  });
}

async function init() {
  bindInteractions();
  setFreshness("loading", "正在读取数据");
  try {
    const published = await loadPublishedData();
    const saved = loadSavedLocalData();
    const newest = isNewerSnapshot(saved, published) ? saved : published;
    render(newest, newest === saved ? "local-cache" : "published");
    setRefreshStatus(newest === saved
      ? `当前展示这台 Mac 上次本体查询结果，数据截至 ${formatDateTime(newest.meta.data_cutoff)}。`
      : `当前展示最近发布快照，数据截至 ${formatDateTime(newest.meta.data_cutoff)}。`);
  } catch (error) {
    setFreshness("error", "数据读取失败");
    setRefreshStatus(`数据读取失败：${error.message || "请点击更新数据重试"}`);
  }
}

init();
