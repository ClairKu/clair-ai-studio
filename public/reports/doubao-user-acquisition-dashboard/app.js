const DATA_URL = "./data/latest.json";
const SCHEMA_VERSION = "doubao-user-acquisition-v1";
// 豆包 2026-08-28 上架当日即有用户绑定，没有单独的灰度期：上架时刻与统计窗口起点一致。
const LAUNCH_AT = "2026-08-28T00:00:00+08:00";
const WINDOW_START_AT = "2026-08-28T00:00:00+08:00";
const LAUNCH_DAY = LAUNCH_AT.slice(0, 10);
const number = new Intl.NumberFormat("zh-CN");
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);

const SERIES = {
  bound: {
    label: "累计绑定",
    field: "window_cumulative_bound",
    type: "cumulative",
  },
  new: {
    label: "累计新用户",
    field: "window_cumulative_new",
    type: "cumulative",
  },
  existing: {
    label: "累计老用户",
    field: "window_cumulative_existing",
    type: "cumulative",
  },
  daily: {
    label: "当日新增",
    field: "bound_accounts_today",
    type: "daily",
  },
};
const CUMULATIVE_KEYS = ["bound", "new", "existing"];
const SERIES_ORDER = ["bound", "new", "existing", "daily"];
const COHORT_ORDER = ["all", "new", "existing"];
const COHORT_LABELS = {
  all: "全部绑定用户",
  new: "新用户",
  existing: "老用户",
};
const PROFILE_DIMENSIONS = {
  asset_holding_status: {
    label: "当前资产状态",
    description: "只汇总顶层 ROOT 账户的最近资产记录，避免账户层级重复计算",
    panel: "asset",
  },
  asset_bucket: {
    label: "保有规模分布",
    description: "按顶层 ROOT 账户当前持有市值分档",
    panel: "asset",
  },
  holding_lifecycle_status: {
    label: "资金留存状态",
    description: "终身视角：从未完成新增入金为无首投；曾入金但当前顶层账户已无资产为已流失；当前有资产在管（含当日入金尚未进快照）为在管",
    panel: "asset",
  },
  asset_at_bind_status: {
    label: "绑定时资产状态",
    description: "回溯每个用户绑定当日的顶层 ROOT 资产快照；为 0 或未开户即为零资产，是衡量渠道真实新增的基数",
    panel: "asset",
  },
  lifetime_investment_status: {
    label: "历史投资情况",
    description: "看是否曾在且慢完成新增入金",
    panel: "asset",
  },
  age_bucket: {
    label: "年龄分布",
    description: "按证件出生日期推算，取查询时点年龄",
    panel: "profile",
  },
  gender: {
    label: "性别分布",
    description: "取实名信息中的性别字段",
    panel: "profile",
  },
  residence_province: {
    label: "居住地分布",
    description: "取实名/联系信息中的省级归属，仅列前若干位",
    panel: "profile",
  },
  app_usage_status: {
    label: "且慢APP使用情况",
    description: "查看且慢 App 使用记录",
    panel: "touchpoint",
  },
  wechat_mp_status: {
    label: "微信公众号绑定",
    description: "看是否已关注并绑定且慢微信公众号",
    panel: "touchpoint",
  },
  bank_card_status: {
    label: "银行卡准备情况",
    description: "看是否已完成银行卡绑定",
    panel: "touchpoint",
  },
  risk_assessment_status: {
    label: "风险测评情况",
    description: "看是否已完成风险测评",
    panel: "touchpoint",
  },
};
const REQUIRED_PROFILE_DIMENSIONS = ["asset_holding_status", "asset_bucket", "lifetime_investment_status"];
const PROFILE_PANELS = {
  asset: "#asset-distribution",
  profile: "#profile-distribution",
  touchpoint: "#touchpoint-distribution",
};
const BEHAVIOR_METRICS = {
  funded_after_binding: {
    label: "绑定后完成入金",
    description: "绑定后完成新增入金",
  },
  first_investment_after_binding: {
    label: "绑定后首投",
    description: "人生首笔新增入金发生在绑定后",
  },
  investment_activity_after_binding: {
    label: "绑定后新增入金",
    description: "绑定后新增入金",
  },
  redemption_after_binding: {
    label: "绑定后资金转出或赎回",
    description: "绑定后出现顶层账户转出流水或非撤单赎回记录",
  },
  xiaogu_used_after_binding: {
    label: "绑定后有效使用AI小顾",
    description: "绑定后至少产生一次豆包 OAuth 会话令牌；豆包侧不落工具级调用明细，以会话令牌作为有效使用的代理口径",
  },
  account_opened_after_binding: {
    label: "绑定后开立资金账户",
    description: "首次风险测评发生在绑定后；开户须先测评，故以此作为开户时间的代理口径",
  },
  risk_assessed_after_binding: {
    label: "绑定后完成风险测评",
    description: "绑定后新产生过风险测评记录",
  },
  first_funding_after_binding: {
    label: "绑定后首次入金",
    description: "人生首笔新增入金发生在绑定后",
  },
  repeat_investment_after_binding: {
    label: "绑定后复投",
    description: "绑定后新增入金达到两笔及以上",
  },
};
const REQUIRED_BEHAVIOR_METRICS = ["first_investment_after_binding", "investment_activity_after_binding"];
// 金额型指标单独放在 business 段：人数类走 behavior，金额类走这里，避免两种量纲混在一张图上。
const BUSINESS_STATS = {
  holding_amount: {
    label: "当前保有（含绑定前已有资产）",
    description: "所选用户顶层 ROOT 账户的持有市值合计；包含老用户绑定前已有资产，不代表项目新增规模",
    tone: "scale",
  },
  inflow_amount: {
    label: "绑定后新增入金",
    description: "绑定后新增入金金额",
    tone: "flow",
  },
  inflow_transactions: {
    label: "交易入金笔数",
    description: "绑定后新增入金笔数",
    tone: "flow",
    unit: "count",
  },
  buy_amount: {
    label: "绑定后产品买入",
    description: "绑定后产品买入金额",
    tone: "flow",
    hidden: true,
  },
  zero_asset_inflow_amount: {
    label: "零资产用户绑定后入金",
    description: "绑定当刻无任何资产（含未开户）的用户，绑定后转入的资金合计，是渠道真实新增",
    tone: "flow",
  },
  sell_amount: {
    label: "绑定后赎回",
    description: "绑定后确认成功的赎回金额合计",
    tone: "flow",
    hidden: true,
  },
};
const SEGMENTS = [
  { id: "all", label: "全部", note: "全部绑定用户" },
  { id: "new_inv", label: "新投", note: "绑定时无资产，绑定后完成新增入金", legacy: null },
  { id: "first_inv", label: "首投", note: "人生首笔新增入金发生在绑定后" },
  { id: "reinvested", label: "入金用户", note: "绑定后完成新增入金", legacy: "invested" },
  { id: "new", label: "新户", note: "在豆包注册且慢帐号" },
  { id: "new_first_inv", label: "新户首投", note: "新户中完成人生首笔新增入金" },
  { id: "existing", label: "老用户", note: "绑定时已有且慢账户" },
  { id: "existing_reactivated", label: "老户唤回", note: "绑定时零资产（未投过或已清仓），绑定后完成新增入金" },
  { id: "existing_first_inv", label: "老户首投", note: "老户中人生首笔新增入金发生在绑定后" },
];
const PUBLIC_STATES = new Set(["confirmed", "suppressed", "unavailable"]);
const QUESTION_COHORT_LABELS = { all: "全部绑定用户", new: "新用户", existing: "老用户" };
const QUESTION_ACTIVE_DAY_LABELS = { one_day: "1 天", two_to_seven_days: "2—7 天", eight_to_thirty_days: "8—30 天", gte_thirty_one_days: "31 天及以上" };
const QUESTION_UNAVAILABLE = {
  original_questions: ["原始提问", "豆包协议当前不回传自然语言问题"],
  demand_topics: ["需求主题", "无法可靠判断用户关注的业务方向"],
  keywords_and_products: ["关键词与产品", "无法确认用户提及的策略、基金或功能"],
  followup_paths: ["追问路径", "无法识别首问、追问与问题解决进度"],
};
const QUESTION_INSTRUMENTATION = {
  anonymous_subject: ["匿名主体", "只用于避免重复计数与连续观察"],
  request_trace: ["请求流水", "区分一次请求与系统自动刷新事件"],
  service_route: ["服务路径", "确认请求确实来自豆包且调用了哪项能力"],
  redacted_intent: ["脱敏分类", "只保留主题、意图与结果，不公开原话"],
};

const viewState = {
  visibleSeries: new Set(SERIES_ORDER),
  range: "full-window",
  start: "",
  end: "",
  selectedDate: "",
  hoverDate: "",
  customApplied: false,
  audienceCohort: "all",
  segment: "all",
};

let currentData = null;
let currentRows = [];
let resizeTimer = null;

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

function formatCutoff(value, includeYear = false) {
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

function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDay(value) {
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${Number(month)}月${Number(day)}日` : String(value);
}

function safeShare(part, total) {
  return total > 0 ? part / total : null;
}

function formatShare(part, total) {
  const share = safeShare(part, total);
  return share === null ? "—" : percent.format(share);
}

function nextDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function isWholeCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateAudienceData(data) {
  const privacy = data.privacy || {};
  const minimumCell = privacy.minimum_public_cell;
  if (
    !Number.isInteger(minimumCell)
    || minimumCell < 1
    || privacy.scope !== "profile_and_behavior_only"
    || privacy.protected_sections?.join(",") !== "profile,behavior,business"
    || privacy.multi_dimension_cross_tabs_public !== false
  ) throw new Error("画像与行为隐私保护口径异常");
  if (
    data.behavior?.window_start_at !== WINDOW_START_AT
    || data.behavior?.window_end_at !== data.meta.data_cutoff
    || data.behavior?.anchor !== "first_bound_at"
  ) throw new Error("绑定后行为观察窗口异常");
  const expectedPopulation = {
    all: data.metrics.bound_accounts,
    new: data.metrics.new_accounts,
    existing: data.metrics.existing_accounts,
  };
  const assertPublicCount = (value, label) => {
    if (!isWholeCount(value) || (value > 0 && value < minimumCell)) throw new Error(`${label} 未通过小样本保护`);
  };
  const sections = [
    { key: "profile", listKey: "dimensions", allowed: PROFILE_DIMENSIONS, required: REQUIRED_PROFILE_DIMENSIONS, name: "用户画像" },
    { key: "behavior", listKey: "metrics", allowed: BEHAVIOR_METRICS, required: REQUIRED_BEHAVIOR_METRICS, name: "用户行为" },
    { key: "business", listKey: "stats", allowed: BUSINESS_STATS, required: [], name: "经营金额" },
  ];
  sections.forEach(({ key, listKey, allowed, required, name }) => {
    const section = data[key];
    if (!section || typeof section !== "object" || !section.cohorts || typeof section.cohorts !== "object") {
      throw new Error(`${name}数据缺失`);
    }
    COHORT_ORDER.forEach((cohortKey) => {
      const cohort = section.cohorts[cohortKey];
      if (!cohort || cohort.population_accounts !== expectedPopulation[cohortKey] || !Array.isArray(cohort[listKey])) {
        throw new Error(`${COHORT_LABELS[cohortKey]}${name}数据格式异常`);
      }
      // 允许只发布其中一部分口径（未接入的直接不出现），但核心口径必须齐、且不得出现白名单外的指标。
      const ids = cohort[listKey].map((item) => item?.id);
      if (new Set(ids).size !== ids.length || required.some((id) => !ids.includes(id))) {
        throw new Error(`${COHORT_LABELS[cohortKey]}${name}指标不完整`);
      }
      cohort[listKey].forEach((item) => {
        if (!item || !Object.hasOwn(allowed, item.id) || !PUBLIC_STATES.has(item.state)) {
          throw new Error(`${COHORT_LABELS[cohortKey]}存在未允许的公开指标`);
        }
        if (item.state !== "unavailable" && (!item.data_as_of || (parseTime(item.data_as_of) && parseTime(item.data_as_of) > parseTime(data.meta.data_cutoff)))) {
          throw new Error(`${allowed[item.id].label}截止时间异常`);
        }
        if (item.state !== "confirmed") {
          for (const forbidden of ["buckets", "population_accounts", "eligible_accounts", "excluded_accounts", "reached_accounts", "not_reached_accounts", "unknown_accounts", "event_count", "accounts", "amount_wan", "per_capita_wan", "median_wan"]) {
            if (Object.hasOwn(item, forbidden)) throw new Error(`${allowed[item.id].label}隐藏后仍带精确数据`);
          }
          return;
        }
        if (key === "profile") {
          if (!Array.isArray(item.buckets) || !item.buckets.length) throw new Error("资产分布缺少分组");
          let total = 0;
          item.buckets.forEach((bucket) => {
            if (!bucket || typeof bucket.id !== "string" || !bucket.id) {
              throw new Error("资产分布人数异常");
            }
            assertPublicCount(bucket.accounts, `${allowed[item.id].label}${bucket.id}`);
            total += bucket.accounts;
          });
          if (total !== cohort.population_accounts) throw new Error(`${allowed[item.id].label}无法闭合`);
        }
        if (key === "behavior") {
          [
            "population_accounts",
            "eligible_accounts",
            "excluded_accounts",
            "reached_accounts",
            "not_reached_accounts",
            "unknown_accounts",
          ].forEach((field) => {
            assertPublicCount(item[field], `${BEHAVIOR_METRICS[item.id].label}${field}`);
          });
          if (item.population_accounts !== cohort.population_accounts || item.population_accounts !== item.eligible_accounts + item.excluded_accounts) {
            throw new Error(`${BEHAVIOR_METRICS[item.id].label}总人数无法闭合`);
          }
          if (item.eligible_accounts !== item.reached_accounts + item.not_reached_accounts + item.unknown_accounts) {
            throw new Error(`${BEHAVIOR_METRICS[item.id].label}可统计人数无法闭合`);
          }
          if (item.event_count !== undefined) {
            assertPublicCount(item.event_count, `${BEHAVIOR_METRICS[item.id].label}次数`);
            if (item.event_count < item.reached_accounts) throw new Error(`${BEHAVIOR_METRICS[item.id].label}次数异常`);
          }
        }
        if (key === "business") {
          const label = BUSINESS_STATS[item.id].label;
          assertPublicCount(item.accounts, `${label}人数`);
          if (item.accounts > cohort.population_accounts) throw new Error(`${label}人数超出总人数`);
          if (item.id === "inflow_transactions") {
            assertPublicCount(item.event_count, `${label}笔数`);
            if (item.event_count < item.accounts) throw new Error(`${label}笔数小于涉及人数`);
          } else {
            if (!Number.isFinite(item.amount_wan) || item.amount_wan < 0) throw new Error(`${label}金额异常`);
            for (const field of ["per_capita_wan", "median_wan"]) {
              if (item[field] !== undefined && (!Number.isFinite(item[field]) || item[field] < 0)) throw new Error(`${label}人均或中位数异常`);
            }
          }
        }
      });
    });
  });
  COHORT_ORDER.forEach((cohortKey) => {
    const populations = ["profile", "behavior", "business"].map((key) => data[key].cohorts[cohortKey].population_accounts);
    if (new Set(populations).size !== 1) {
      throw new Error(`${COHORT_LABELS[cohortKey]}画像、行为与经营人数不一致`);
    }
  });
}

function validateQuestionSignals(data) {
  const signals = data.usage_question_signals;
  if (
    !signals
    || signals.schema_version !== "doubao-question-signals-v1"
    || signals.data_as_of !== data.meta.data_cutoff
    || signals.evidence_level !== "oauth_session_proxy_only"
  ) throw new Error("豆包提问与使用信号口径异常");

  if (!Array.isArray(signals.cohorts) || signals.cohorts.length !== COHORT_ORDER.length) {
    throw new Error("豆包使用代理客群缺失");
  }
  const expectedPopulation = {
    all: data.metrics.bound_accounts,
    new: data.metrics.new_accounts,
    existing: data.metrics.existing_accounts,
  };
  COHORT_ORDER.forEach((cohortId) => {
    const cohort = signals.cohorts.find((item) => item.id === cohortId);
    if (
      !cohort
      || cohort.population_accounts !== expectedPopulation[cohortId]
      || !isWholeCount(cohort.proxy_active_accounts)
      || !isWholeCount(cohort.not_observed_accounts)
      || cohort.proxy_active_accounts + cohort.not_observed_accounts !== cohort.population_accounts
    ) throw new Error(`${QUESTION_COHORT_LABELS[cohortId]}使用代理无法闭合`);
    const behavior = data.behavior.cohorts[cohortId].metrics.find((item) => item.id === "xiaogu_used_after_binding");
    if (!behavior || cohort.proxy_active_accounts !== behavior.reached_accounts) {
      throw new Error(`${QUESTION_COHORT_LABELS[cohortId]}使用代理与行为口径不一致`);
    }
  });

  const rhythm = signals.usage_rhythm;
  if (!rhythm || !Array.isArray(rhythm.active_day_buckets) || !Array.isArray(rhythm.first_proxy_lag_buckets) || !Array.isArray(rhythm.daily_proxy_active)) {
    throw new Error("豆包使用节奏缺失");
  }
  const activeIds = Object.keys(QUESTION_ACTIVE_DAY_LABELS);
  if (rhythm.active_day_buckets.map((item) => item.id).join(",") !== activeIds.join(",")) {
    throw new Error("豆包活跃天数分档异常");
  }
  const activeTotals = { all: 0, new: 0, existing: 0 };
  rhythm.active_day_buckets.forEach((bucket) => {
    for (const key of COHORT_ORDER) {
      const field = `${key}_accounts`;
      if (!isWholeCount(bucket[field])) throw new Error("豆包活跃天数人数异常");
      activeTotals[key] += bucket[field];
    }
    if (bucket.all_accounts !== bucket.new_accounts + bucket.existing_accounts) throw new Error("豆包活跃天数新老用户无法闭合");
  });
  COHORT_ORDER.forEach((key) => {
    const cohort = signals.cohorts.find((item) => item.id === key);
    if (activeTotals[key] !== cohort.proxy_active_accounts) throw new Error("豆包活跃天数与使用代理人数不一致");
  });
  const allProxy = signals.cohorts.find((item) => item.id === "all").proxy_active_accounts;
  if (rhythm.first_proxy_lag_buckets.reduce((sum, item) => sum + item.accounts, 0) !== allProxy) {
    throw new Error("豆包首次令牌时延无法闭合");
  }
  let previousDate = "";
  rhythm.daily_proxy_active.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "") || row.all_accounts !== row.new_accounts + row.existing_accounts) {
      throw new Error("豆包近 7 日使用代理异常");
    }
    if (previousDate && row.date !== nextDate(previousDate)) throw new Error("豆包近 7 日使用代理日期不连续");
    if (row.partial !== (index === rhythm.daily_proxy_active.length - 1)) throw new Error("豆包近 7 日截止标记异常");
    previousDate = row.date;
  });
  if (rhythm.daily_proxy_active.length !== 7 || rhythm.daily_proxy_active.at(-1).date !== data.meta.data_cutoff.slice(0, 10)) {
    throw new Error("豆包近 7 日使用代理未覆盖截止日");
  }
  if (signals.unavailable_content?.join(",") !== Object.keys(QUESTION_UNAVAILABLE).join(",")) throw new Error("豆包不可用提问内容清单异常");
  if (signals.required_instrumentation?.join(",") !== Object.keys(QUESTION_INSTRUMENTATION).join(",")) throw new Error("豆包提问观测补齐清单异常");
}

function validateData(data) {
  if (!data || data.schema_version !== SCHEMA_VERSION) throw new Error("数据版本不兼容");
  const { meta = {}, metrics = {} } = data;
  if (meta.window_start_at !== WINDOW_START_AT || meta.launch_at !== LAUNCH_AT || meta.timezone !== "Asia/Shanghai") {
    throw new Error("统计窗口或服务上线时间口径异常");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(meta.data_cutoff || "") || !parseTime(meta.data_cutoff)) {
    throw new Error("数据截止时间异常");
  }
  if (!parseTime(meta.generated_at) || parseTime(meta.data_cutoff) < parseTime(meta.window_start_at)) throw new Error("数据生成时间异常");
  const metricKeys = [
    "bound_accounts",
    "new_accounts",
    "existing_accounts",
    "missing_registration_time",
    "duplicate_bindings",
    "unmatched_accounts",
  ];
  for (const key of metricKeys) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.bound_accounts !== metrics.new_accounts + metrics.existing_accounts + metrics.missing_registration_time) {
    throw new Error("用户分类与总数无法闭合");
  }
  if (!Array.isArray(data.daily) || !data.daily.length) throw new Error("缺少每日趋势");
  const cutoffDay = meta.data_cutoff.slice(0, 10);
  let runningNew = 0;
  let runningExisting = 0;
  let runningUnclassified = 0;
  let runningBound = 0;
  let previousDate = "";
  data.daily.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) throw new Error("趋势日期格式异常");
    if (index === 0 && row.date !== WINDOW_START_AT.slice(0, 10)) throw new Error("趋势没有从统计窗口起始日开始");
    if (previousDate && row.date !== nextDate(previousDate)) throw new Error("趋势日期不连续");
    previousDate = row.date;
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
      if (!Number.isInteger(row[key]) || row[key] < 0) throw new Error(`每日趋势 ${key} 异常`);
    }
    if (typeof row.partial !== "boolean") throw new Error("每日完整性标记异常");
    const shouldBePartial = index === data.daily.length - 1;
    if (row.partial !== shouldBePartial) throw new Error("只有最新日应标记为非完整自然日");
    if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
      throw new Error("每日用户分类无法闭合");
    }
    runningNew += row.new_accounts_today;
    runningExisting += row.existing_accounts_today;
    runningUnclassified += row.unclassified_accounts_today;
    runningBound += row.bound_accounts_today;
    if (
      row.cumulative_new_accounts !== runningNew
      || row.cumulative_existing_accounts !== runningExisting
      || row.cumulative_unclassified_accounts !== runningUnclassified
      || row.cumulative_bound_accounts !== runningBound
    ) throw new Error("累计趋势无法闭合");
  });
  if (data.daily.at(-1).date !== cutoffDay) throw new Error("趋势没有覆盖到数据截止日");
  if (meta.latest_day_is_partial !== true || data.daily.at(-1).partial !== true) throw new Error("最新日必须标记为非完整日");
  if (
    runningNew !== metrics.new_accounts
    || runningExisting !== metrics.existing_accounts
    || runningUnclassified !== metrics.missing_registration_time
    || runningBound !== metrics.bound_accounts
  ) throw new Error("趋势总数与关键数据不一致");
  validateAudienceData(data);
  validateQuestionSignals(data);
  return data;
}

async function loadPublishedData({ allowFallback = true } = {}) {
  try {
    const url = `${DATA_URL}?refresh=${Date.now()}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (allowFallback && window.DOUBAO_ACQUISITION_DATA) return validateData(window.DOUBAO_ACQUISITION_DATA);
    throw error;
  }
}

function setFreshness(mode, text) {
  const freshness = $("#freshness");
  if (!freshness) return;   // 顶栏已移除，截止时间改在「累计绑定用户」卡的小字里展示
  freshness.classList.toggle("is-loading", mode === "loading");
  freshness.classList.toggle("is-error", mode === "error");
  freshness.querySelector("span").textContent = text;
}

function setNotice(message) {
  const node = $("#refresh-status");
  if (node) node.textContent = message;
}

// 截止时刻只取时:分（8:30 / 17:30 这种写法），配合日期范围放进黑底卡小字
function formatClock(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "numeric", minute: "2-digit", hour12: false }).format(date);
}

// 标题下的小字：合作方式 + 绑定构成 + 关键转化 + 资金结果；全部取自当前数据快照，不随下方时间范围联动
function renderHeroLead() {
  const node = $("#hero-lead");
  if (!node || !currentData) return;
  const segment = (id) => currentData.segments?.items?.find((item) => item.id === id);
  const all = segment("all");
  const firstInvestors = segment("first_inv");
  const newInvestors = segment("new_inv");
  const sentences = ["盈米基金与 AI 流量入口平台豆包合作，以 MCP 模式将且慢 AI 小顾能力上架豆包，用户通过 OAuth 授权绑定且慢账户"];
  sentences.push(`上架以来，已有 ${number.format(currentData.metrics.bound_accounts)} 个豆包用户绑定且慢账户，其中带来 ${number.format(currentData.metrics.new_accounts)} 个新用户注册，并连接 ${number.format(currentData.metrics.existing_accounts)} 位且慢老用户`);
  if (all?.state === "confirmed" && firstInvestors?.state === "confirmed" && newInvestors?.state === "confirmed") {
    sentences.push(`绑定后完成开户 ${number.format(all.opened_after_binding_accounts)} 人、风测 ${number.format(all.risk_after_binding_accounts)} 人，首投 ${number.format(firstInvestors.population_accounts)} 人、新投 ${number.format(newInvestors.population_accounts)} 人，新投用户入金 ${formatAmount(newInvestors.inflow_amount_wan)}`);
    sentences.push(`全部绑定用户累计新增入金 ${formatAmount(all.inflow_amount_wan)}，总资产规模 ${formatAmount(all.total_asset_wan)}`);
  }
  node.textContent = `${sentences.join("。")}。`;
}


function decorateRows(rows) {
  let cumulativeNew = 0;
  let cumulativeExisting = 0;
  let cumulativeUnclassified = 0;
  let cumulativeBound = 0;
  return rows.map((row) => {
    cumulativeNew += row.new_accounts_today;
    cumulativeExisting += row.existing_accounts_today;
    cumulativeUnclassified += row.unclassified_accounts_today;
    cumulativeBound += row.bound_accounts_today;
    return {
      ...row,
      window_cumulative_new: cumulativeNew,
      window_cumulative_existing: cumulativeExisting,
      window_cumulative_unclassified: cumulativeUnclassified,
      window_cumulative_bound: cumulativeBound,
    };
  });
}

function filteredRows() {
  if (!currentData) return [];
  let rows = currentData.daily;
  const last = rows.at(-1)?.date || "";
  if (viewState.range === "ytd") rows = rows.filter((row) => row.date >= `${last.slice(0, 4)}-01-01`);
  if (viewState.range === "mtd") rows = rows.filter((row) => row.date >= `${last.slice(0, 7)}-01`);
  if (viewState.range === "last-30") rows = rows.slice(-30);
  if (viewState.range === "last-7") rows = rows.slice(-7);
  if (viewState.range === "custom") rows = rows.filter((row) => row.date >= viewState.start && row.date <= viewState.end);
  return decorateRows(rows);
}

function scopeLabel(rows, short = false) {
  if (viewState.range === "full-window") return short ? "全部" : `${formatDay(currentData.daily[0].date)}上架以来`;
  if (viewState.range === "ytd") return "今年来";
  if (viewState.range === "mtd") return "本月来";
  if (viewState.range === "last-30") return "近一月";
  if (viewState.range === "last-7") return "近7日";
  if (!rows.length) return "自订区间";
  return short ? "自订" : `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
}

function rangeTotals(rows) {
  const latest = rows.at(-1);
  return latest ? {
    bound: latest.window_cumulative_bound,
    new: latest.window_cumulative_new,
    existing: latest.window_cumulative_existing,
    unclassified: latest.window_cumulative_unclassified,
  } : { bound: 0, new: 0, existing: 0, unclassified: 0 };
}

function renderSegmentPanel() {
  // 分客群面板：全窗口口径（锚在各用户自己的绑定时刻），不随上方时间范围联动。
  const items = currentData?.segments?.items || [];
  const meta = SEGMENTS.find((entry) => entry.id === viewState.segment) || SEGMENTS[0];
  const item = items.find((entry) => entry.id === viewState.segment)
    || (meta.legacy ? items.find((entry) => entry.id === meta.legacy) : null);
  const bound = currentData?.metrics?.bound_accounts || 0;
  const set = (selector, text) => { const node = $(selector); if (node) node.textContent = text; };
  const people = (n) => `${number.format(n)} 人`;
  if (!item || item.state !== "confirmed") {
    ["#seg-pop", "#seg-card", "#seg-risk", "#seg-inflow", "#seg-asset", "#seg-percapita"].forEach((id) => set(id, "—"));
    ["#seg-pop-share", "#seg-card-share", "#seg-risk-share", "#seg-inflow-people", "#seg-asset-people",
      "#seg-percapita-note", "#seg-pop-note", "#seg-card-note", "#seg-risk-note", "#seg-inflow-note",
      "#seg-asset-note", "#seg-percapita-small"].forEach((id) => set(id, "—"));
    if (!item) set("#seg-pop-note", "该维度将在下一次自动刷新后产出");
    return;
  }
  const population = item.population_accounts;

  // 用户：小字按客群给最有信息量的一句
  set("#seg-pop", number.format(population));
  set("#seg-pop-share", viewState.segment === "all" ? "全部绑定" : formatShare(population, bound));
  let popNote = meta.note;
  if (viewState.segment === "all") {
    popNote = `${number.format(item.new_accounts)} 新注册 · ${number.format(item.existing_accounts)} 已有帐号`;
  } else if (viewState.segment === "existing") {
    const lifecycle = currentData.profile?.cohorts?.existing?.dimensions?.find((d) => d.id === "holding_lifecycle_status");
    if (lifecycle?.state === "confirmed") {
      const seg = (id) => lifecycle.buckets.find((b) => b.id === id)?.accounts ?? 0;
      popNote = `${number.format(seg("no_first_investment"))} 无首投 · ${number.format(seg("churned"))} 已流失 · ${number.format(seg("under_management"))} 在管`;
    }
  } else if (viewState.segment === "reinvested") {
    popNote = item.first_investor_accounts
      ? `其中 ${people(item.first_investor_accounts)}为人生首投`
      : meta.note;
  } else if (viewState.segment === "new_inv") {
    popNote = `新户 ${number.format(item.new_accounts)} · 老户 ${number.format(item.existing_accounts)}`;
  } else if (viewState.segment === "first_inv") {
    popNote = `新户 ${number.format(item.new_accounts)} · 老户 ${number.format(item.existing_accounts)}`;
  } else if (viewState.segment === "new_first_inv") {
    popNote = `占新户 ${formatShare(population, currentData.metrics?.new_accounts || 0)}`;
  } else if (viewState.segment === "existing_reactivated") {
    popNote = `首投 ${number.format(item.first_investor_accounts)} 人 · 清仓后唤回 ${number.format(population - item.first_investor_accounts)} 人`;
  } else if (viewState.segment === "existing_first_inv") {
    popNote = `占老用户 ${formatShare(population, currentData.metrics?.existing_accounts || 0)}`;
  }
  set("#seg-pop-note", popNote);

  // 已开户绑卡：小字给绑定后新开户的人数
  set("#seg-card", number.format(item.card_bound_accounts));
  set("#seg-card-share", formatShare(item.card_bound_accounts, population));
  set("#seg-card-note", item.opened_after_binding_accounts
    ? `${people(item.opened_after_binding_accounts)}为绑定后新开户`
    : "绑定后无新开户");

  // 已风险测评：小字给绑定后新做风测的人数
  set("#seg-risk", number.format(item.risk_assessed_accounts));
  set("#seg-risk-share", formatShare(item.risk_assessed_accounts, population));
  set("#seg-risk-note", item.risk_after_binding_accounts
    ? `${people(item.risk_after_binding_accounts)}绑定后新做风测`
    : "绑定后无新风测");

  // 新增入金：人数与笔数放小字
  set("#seg-inflow", formatAmount(item.inflow_amount_wan));
  set("#seg-inflow-people", "");
  set("#seg-inflow-note", item.inflow_accounts
    ? `${people(item.inflow_accounts)} · ${number.format(item.inflow_transactions)} 笔交易`
    : "暂无入金");

  // 总资产：持有人数放小字
  set("#seg-asset", formatAmount(item.total_asset_wan));
  set("#seg-asset-people", "");
  set("#seg-asset-note", item.holder_accounts ? `${people(item.holder_accounts)}持有` : "暂无资产");

  // 人均资产：小字给分层人数
  set("#seg-percapita", item.holder_accounts ? formatAmount(item.per_capita_asset_wan) : "—");
  set("#seg-percapita-note", "");
  set("#seg-percapita-small", item.holder_accounts
    ? `${people(item.holders_gte_100k_accounts)}超 10 万 · ${people(item.holders_gte_1m_accounts)}超 100 万`
    : "暂无资产");
}

function renderKpis(rows) {
  // 顶部三张总览卡固定展示全窗口累计口径；日期筛选只影响下方走势和日明细。
  const totals = {
    bound: currentData.metrics.bound_accounts,
    new: currentData.metrics.new_accounts,
    existing: currentData.metrics.existing_accounts,
  };
  const allRows = currentData.daily;
  $("#bound-total").textContent = number.format(totals.bound);
  $("#new-accounts").textContent = number.format(totals.new);
  $("#existing-accounts").textContent = number.format(totals.existing);
  $("#new-share").textContent = formatShare(totals.new, totals.bound);
  $("#existing-share").textContent = formatShare(totals.existing, totals.bound);
  const app = currentData.app_usage;
  $("#app-users").textContent = app?.state === "confirmed" ? number.format(app.cohorts.all.users) : "—";
  $("#app-share").textContent = app?.state === "confirmed" ? formatShare(app.cohorts.all.users, totals.bound) : "";
  $("#app-breakdown").textContent = app?.state === "confirmed"
    ? `有 App 使用记录 · 新客 ${number.format(app.cohorts.new.users)} · 老客 ${number.format(app.cohorts.existing.users)}`
    : "使用记录待更新";
  const range = `${formatDay(allRows[0].date)}—${formatDay(allRows.at(-1).date)}`;
  $("#bound-context").textContent = `${range} ${formatClock(currentData.meta.data_cutoff)} · ${allRows.length} 天`;
  // 老用户卡小字同样固定为全窗口生命周期拆分。
  const lifecycle = currentData.profile?.cohorts?.existing?.dimensions?.find((item) => item.id === "holding_lifecycle_status");
  const breakdown = $("#existing-breakdown");
  if (breakdown) {
    if (lifecycle?.state === "confirmed") {
      const seg = (id) => lifecycle.buckets.find((bucket) => bucket.id === id)?.accounts ?? 0;
      breakdown.textContent = `${number.format(seg("no_first_investment"))} 无首投 · ${number.format(seg("churned"))} 已流失 · ${number.format(seg("under_management"))} 在管`;
    } else {
      breakdown.textContent = "绑定时已有且慢账户";
    }
  }
  setFreshness("ready", `数据截至 ${formatCutoff(currentData.meta.data_cutoff)}`);
}

function niceMaximum(value) {
  if (value <= 10) return 10;
  const target = value * 1.04;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const normalized = target / magnitude;
  const rounded = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => candidate >= normalized) || 10;
  return rounded * magnitude;
}

function chartLayout(rows) {
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const showEndLabels = !mobile && rows.length > 1;
  const width = mobile ? 430 : 1040;
  const left = mobile ? 40 : 56;
  const right = showEndLabels ? 96 : mobile ? 16 : 28;
  const top = mobile ? 32 : 36;
  const cumulativeHeight = mobile ? 176 : 244;
  const gap = mobile ? 44 : 52;
  const dailyHeight = mobile ? 78 : 106;
  const axisHeight = mobile ? 30 : 34;
  const cumulativeBase = top + cumulativeHeight;
  const dailyTop = cumulativeBase + gap;
  const dailyBase = dailyTop + dailyHeight;
  return {
    mobile,
    showEndLabels,
    width,
    height: dailyBase + axisHeight,
    left,
    right,
    top,
    plotWidth: width - left - right,
    cumulativeHeight,
    cumulativeBase,
    dailyTop,
    dailyHeight,
    dailyBase,
  };
}

function barPath(centerX, halfWidth, top, bottom, radius) {
  const height = Math.max(0, bottom - top);
  const corner = Math.min(radius, halfWidth, height);
  const startX = centerX - halfWidth;
  const endX = centerX + halfWidth;
  if (corner <= 0) return `M${startX},${bottom} L${startX},${top} L${endX},${top} L${endX},${bottom} Z`;
  return `M${startX},${bottom} L${startX},${top + corner} Q${startX},${top} ${startX + corner},${top}`
    + ` L${endX - corner},${top} Q${endX},${top} ${endX},${top + corner} L${endX},${bottom} Z`;
}

// 端点数值标签互相靠得太近时上下微推，并用引线连回端点，避免标签脱离所属折线。
function declutter(labels, minimumGap) {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index].y - sorted[index - 1].y;
    if (gap < minimumGap) sorted[index].y = sorted[index - 1].y + minimumGap;
  }
  return sorted;
}

function chartMarkup(rows) {
  const layout = chartLayout(rows);
  const cumulativeKeys = CUMULATIVE_KEYS.filter((key) => viewState.visibleSeries.has(key));
  const dailyVisible = viewState.visibleSeries.has("daily");
  const step = layout.plotWidth / Math.max(rows.length, 1);
  const x = (index) => layout.left + step * index + step / 2;
  const cumulativeValues = cumulativeKeys.length
    ? rows.flatMap((row) => cumulativeKeys.map((key) => row[SERIES[key].field]))
    : [0];
  const cumulativeMaximum = niceMaximum(Math.max(1, ...cumulativeValues));
  const dailyMaximum = niceMaximum(Math.max(1, ...rows.map((row) => row.bound_accounts_today)));
  const yCumulative = (value) => layout.cumulativeBase - (value / cumulativeMaximum) * layout.cumulativeHeight;
  const yDaily = (value) => layout.dailyBase - (value / dailyMaximum) * layout.dailyHeight;
  const plotRight = layout.width - layout.right;

  const gridLines = (ratios, base, plotHeight, maximum) => ratios.map((ratio) => {
    const gridY = base - ratio * plotHeight;
    return `<line class="${ratio === 0 ? "chart-baseline" : "chart-grid"}" x1="${layout.left}" y1="${gridY}" x2="${plotRight}" y2="${gridY}"></line>
      <text class="chart-axis-label" x="${layout.left - 9}" y="${gridY + 4}" text-anchor="end">${number.format(Math.round(maximum * ratio))}</text>`;
  }).join("");
  const grids = (cumulativeKeys.length ? gridLines([0, 0.25, 0.5, 0.75, 1], layout.cumulativeBase, layout.cumulativeHeight, cumulativeMaximum) : "")
    + (dailyVisible ? gridLines([0, 0.5, 1], layout.dailyBase, layout.dailyHeight, dailyMaximum) : "");
  const panelTitles = dailyVisible
    ? `<text class="chart-panel-title" x="${layout.left}" y="${layout.dailyTop - 12}">每日新增绑定（人）</text>`
    : "";

  const launchMarkup = "";   // 豆包上架首日即为窗口起点，没有需要标注的灰度区间

  // 累计绑定是总量线，最后画保证压在分项线之上——上线前两条线数值完全相同，否则总量线会被盖住。
  const lines = [...cumulativeKeys].sort((a, b) => (a === "bound" ? 1 : 0) - (b === "bound" ? 1 : 0)).map((key) => {
    const points = rows.map((row, index) => `${x(index)},${yCumulative(row[SERIES[key].field])}`).join(" ");
    return `<polyline class="chart-line chart-line-${key}" data-series="${key}" points="${points}"></polyline>`;
  }).join("");

  let endMarkup = "";
  if (cumulativeKeys.length && rows.length) {
    const lastIndex = rows.length - 1;
    const centerX = x(lastIndex);
    const anchors = cumulativeKeys.map((key) => ({
      key,
      y: yCumulative(rows[lastIndex][SERIES[key].field]),
      value: rows[lastIndex][SERIES[key].field],
    }));
    const dots = anchors.map((anchor) => `<circle class="chart-end-dot chart-end-${anchor.key}" cx="${centerX}" cy="${anchor.y}" r="4.5"></circle>`).join("");
    const labels = layout.showEndLabels
      ? declutter(anchors.map((anchor) => ({ ...anchor, origin: anchor.y })), 17).map((anchor) => {
        const leader = Math.abs(anchor.y - anchor.origin) > 2
          ? `<line class="chart-grid" x1="${centerX + 5}" y1="${anchor.origin}" x2="${centerX + 11}" y2="${anchor.y}"></line>`
          : "";
        return `${leader}<text class="chart-end-value" x="${centerX + 13}" y="${anchor.y + 4}">${number.format(anchor.value)}</text>`;
      }).join("")
      : "";
    endMarkup = `${dots}${labels}`;
  }

  const barHalfWidth = Math.max(1.5, Math.min(12, step * 0.3));
  const bars = dailyVisible ? rows.map((row, index) => {
    const centerX = x(index);
    const segments = [
      { value: row.new_accounts_today, className: "chart-bar-new" },
      { value: row.existing_accounts_today, className: "chart-bar-existing" },
      { value: row.unclassified_accounts_today, className: "chart-bar-unclassified" },
    ].filter((segment) => segment.value > 0);
    let stacked = 0;
    const drawn = segments.map((segment) => {
      const bottom = yDaily(stacked);
      stacked += segment.value;
      return { ...segment, bottom, top: yDaily(stacked) };
    }).filter((segment) => segment.bottom - segment.top >= 0.6);
    const shapes = drawn.map((segment, segmentIndex) => {
      const isTop = segmentIndex === drawn.length - 1;
      // 段间留 2px 背景色空隙做分隔，顶端 4px 圆角、基线端保持方角；
      // 极薄的段（如个别日期只有几个老用户）不再抠空隙，否则整段会被吃掉。
      const thickness = segment.bottom - segment.top;
      const bottom = segmentIndex && thickness > 3.5 ? segment.bottom - 2 : segment.bottom;
      return `<path class="${segment.className}" d="${barPath(centerX, barHalfWidth, segment.top, bottom, isTop ? 4 : 0)}"></path>`;
    }).join("");
    const cap = index === rows.length - 1 && row.bound_accounts_today > 0
      ? `<text class="chart-bar-cap" x="${centerX}" y="${yDaily(row.bound_accounts_today) - 12}" text-anchor="middle">+${number.format(row.bound_accounts_today)}</text>`
      : "";
    return `<g class="chart-bar-group" data-date="${row.date}">${shapes}${cap}</g>`;
  }).join("") : "";

  const showEvery = rows.length <= 10 ? 1 : Math.ceil(rows.length / (layout.mobile ? 5 : 9));
  const dateLabels = rows.map((row, index) => {
    const [month, day] = row.date.slice(5).split("-");
    const show = index === 0 || index === rows.length - 1 || index % showEvery === 0;
    return show ? `<text class="chart-axis-label" x="${x(index)}" y="${layout.dailyBase + 22}" text-anchor="middle">${Number(month)}.${Number(day)}</text>` : "";
  }).join("");

  const interactivePoints = viewState.visibleSeries.size ? rows.map((row, index) => {
    const centerX = x(index);
    const dots = cumulativeKeys.map((key) => `<circle class="chart-dot chart-end-${key}" cx="${centerX}" cy="${yCumulative(row[SERIES[key].field])}" r="4.5"></circle>`).join("")
      + (dailyVisible && row.bound_accounts_today > 0 ? `<circle class="chart-dot chart-end-bound" cx="${centerX}" cy="${yDaily(row.bound_accounts_today)}" r="3.5"></circle>` : "");
    const ariaValues = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key))
      .map((key) => `${SERIES[key].label}${key === "daily" ? "+" : ""}${number.format(row[SERIES[key].field])}人`).join("，");
    const selected = row.date === viewState.selectedDate;
    return `<g class="chart-point${selected ? " is-selected" : ""}" data-index="${index}" data-date="${row.date}" data-x="${centerX}" data-y="${layout.dailyTop - 8}" tabindex="${selected ? "0" : "-1"}" role="button" aria-pressed="${selected}" aria-label="${escapeHtml(formatDay(row.date))}，${escapeHtml(ariaValues)}">
      <rect class="chart-hit" x="${centerX - step / 2}" y="${layout.top}" width="${step}" height="${layout.dailyBase - layout.top}"></rect>
      <line class="chart-crosshair" x1="${centerX}" y1="${layout.top}" x2="${centerX}" y2="${layout.dailyBase}"></line>
      ${dots}
    </g>`;
  }).join("") : "";

  const emptyState = viewState.visibleSeries.size
    ? ""
    : `<text class="chart-empty" x="${layout.left + layout.plotWidth / 2}" y="${layout.top + layout.cumulativeHeight / 2}" text-anchor="middle">请选择至少一项数据</text>`;

  const markup = `${launchMarkup}${grids}${panelTitles}${lines}${bars}${endMarkup}${dateLabels}${interactivePoints}${emptyState}`;
  return { width: layout.width, height: layout.height, cumulativeMaximum, dailyMaximum, markup };
}

function rowLabel(row) {
  const lastDate = currentData.daily.at(-1).date;
  if (row.date === lastDate) return `${formatDay(row.date)} · 截至 ${formatTime(currentData.meta.data_cutoff)}`;
  if (row.date === LAUNCH_DAY) return `${formatDay(row.date)} · 豆包上架首日`;
  return formatDay(row.date);
}

// 读数条：默认停在最新一天的累计值；hover / 键盘移动时切换到对应日期。
function renderReadout(row) {
  const isLatest = row.date === currentRows.at(-1)?.date;
  const dailyName = $("#chip-daily-name");
  if (dailyName) dailyName.textContent = `${Number(row.date.slice(5, 7))}.${row.date.slice(8, 10)}新增`;
  void isLatest;
  SERIES_ORDER.forEach((key) => {
    const value = row[SERIES[key].field];
    $(`#value-${key}`).textContent = `${key === "daily" ? "+" : ""}${number.format(value)}`;
  });
}

function showChartTooltip(element, row) {
  const tooltip = $("#chart-tooltip");
  if (!viewState.visibleSeries.size || !row.bound_accounts_today) {
    tooltip.hidden = true;
    return;
  }
  const entries = [
    { key: "new", label: "新用户", value: row.new_accounts_today },
    { key: "existing", label: "老用户", value: row.existing_accounts_today },
    { key: "bound", label: "待识别", value: row.unclassified_accounts_today },
  ].filter((entry) => entry.value > 0).map((entry) => `<dt><i class="key-${entry.key}" aria-hidden="true"></i>${entry.label}</dt>`
    + `<dd>+${number.format(entry.value)}<em>${formatShare(entry.value, row.bound_accounts_today)}</em></dd>`).join("");
  tooltip.innerHTML = `<strong>${escapeHtml(rowLabel(row))} 新增 ${number.format(row.bound_accounts_today)} 人</strong><dl>${entries}</dl>`;
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const left = Number(element.dataset.x) / viewBox.width * 100;
  tooltip.style.left = `${Math.max(13, Math.min(87, left))}%`;
  tooltip.style.top = `${Number(element.dataset.y) / viewBox.height * 100}%`;
  tooltip.hidden = false;
}

function announceSelection(row) {
  const values = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key)).map((key) => `${SERIES[key].label}${key === "daily" ? "+" : ""}${number.format(row[SERIES[key].field])}人`);
  $("#selection-announcement").textContent = values.length ? `${formatDay(row.date)}，${values.join("，")}。` : "当前未选择走势图数据。";
}

function applySelectedDate(date, { announce = true, focusPoint = false, showTooltip = false } = {}) {
  const row = currentRows.find((item) => item.date === date);
  if (!row) return;
  viewState.selectedDate = date;
  document.querySelectorAll(".chart-point").forEach((point) => {
    const selected = point.dataset.date === date;
    point.classList.toggle("is-selected", selected);
    point.tabIndex = selected ? 0 : -1;
    point.setAttribute("aria-pressed", String(selected));
    if (selected && focusPoint) point.focus();
    if (selected && showTooltip) showChartTooltip(point, row);
  });
  document.querySelectorAll("#daily-table tr").forEach((tableRow) => tableRow.classList.toggle("is-selected", tableRow.dataset.date === date));
  document.querySelectorAll(".date-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.date === date)));
  if (!viewState.hoverDate) renderReadout(row);
  if (announce) announceSelection(row);
}

function bindChartInteractions(rows) {
  const tooltip = $("#chart-tooltip");
  const leave = () => {
    tooltip.hidden = true;
    viewState.hoverDate = "";
    const fallback = rows.find((item) => item.date === viewState.selectedDate) || rows.at(-1);
    if (fallback) renderReadout(fallback);
  };
  document.querySelectorAll(".chart-point").forEach((point) => {
    const row = rows[Number(point.dataset.index)];
    const enter = () => {
      viewState.hoverDate = row.date;
      renderReadout(row);
      showChartTooltip(point, row);
    };
    point.addEventListener("mouseenter", enter);
    point.addEventListener("focus", enter);
    point.addEventListener("mouseleave", leave);
    point.addEventListener("blur", leave);
    point.addEventListener("click", () => applySelectedDate(row.date, { showTooltip: true }));
    point.addEventListener("keydown", (event) => {
      const index = Number(point.dataset.index);
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = Math.min(rows.length - 1, index + 1);
      else if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = rows.length - 1;
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applySelectedDate(row.date, { showTooltip: true });
        return;
      } else return;
      event.preventDefault();
      applySelectedDate(rows[nextIndex].date, { focusPoint: true, showTooltip: true });
    });
  });
}

function renderChart(rows) {
  const chart = chartMarkup(rows);
  const svg = $("#trend-chart");
  svg.setAttribute("viewBox", `0 0 ${chart.width} ${chart.height}`);
  const visibleKeys = SERIES_ORDER.filter((key) => viewState.visibleSeries.has(key));
  const visibleLabels = visibleKeys.map((key) => SERIES[key].label);
  svg.dataset.visibleSeries = visibleKeys.join(",");
  svg.dataset.cumulativeMaximum = String(chart.cumulativeMaximum);
  svg.dataset.dailyMaximum = String(chart.dailyMaximum);
  svg.innerHTML = `<title id="chart-title">${escapeHtml(scopeLabel(rows, true))}用户增长走势</title>
    <desc id="chart-desc">${visibleLabels.length ? `上下两图分别显示${escapeHtml(visibleLabels.join("、"))}` : "当前未选择数据"}；图表与下方明细表按日期联动。</desc>${chart.markup}`;
  $("#chart-tooltip").hidden = true;
  viewState.hoverDate = "";
  bindChartInteractions(rows);
}

function metricCell(value, share, className, prefix = "") {
  void share;
  return `<td class="metric-cell ${className}"><strong>${prefix}${number.format(value)}</strong></td>`;
}

function renderTable(rows) {
  const totals = rangeTotals(rows);
  const hasUnclassified = totals.unclassified > 0;
  const columnCount = hasUnclassified ? 4 : 3;
  $("#detail-head").innerHTML = `<tr>
      <th rowspan="2">日期</th>
      <th class="group-heading" colspan="${columnCount}">当日新增</th>
      <th class="group-heading" colspan="${columnCount}">所选范围累计</th>
    </tr>
    <tr>
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
    </tr>`;
  $("#daily-table").innerHTML = rows.map((row) => `<tr data-date="${row.date}" class="${row.date === viewState.selectedDate ? "is-selected" : ""}">
      <td><button class="date-button" type="button" data-date="${row.date}" aria-pressed="${row.date === viewState.selectedDate}">${escapeHtml(formatDay(row.date))}</button></td>
      ${metricCell(row.bound_accounts_today, "当日总量", "metric-bound", "+")}
      ${metricCell(row.new_accounts_today, formatShare(row.new_accounts_today, row.bound_accounts_today), "metric-new", "+")}
      ${metricCell(row.existing_accounts_today, formatShare(row.existing_accounts_today, row.bound_accounts_today), "metric-existing", "+")}
      ${hasUnclassified ? metricCell(row.unclassified_accounts_today, formatShare(row.unclassified_accounts_today, row.bound_accounts_today), "", "+") : ""}
      ${metricCell(row.window_cumulative_bound, "区间总量", "metric-bound")}
      ${metricCell(row.window_cumulative_new, formatShare(row.window_cumulative_new, row.window_cumulative_bound), "metric-new")}
      ${metricCell(row.window_cumulative_existing, formatShare(row.window_cumulative_existing, row.window_cumulative_bound), "metric-existing")}
      ${hasUnclassified ? metricCell(row.window_cumulative_unclassified, formatShare(row.window_cumulative_unclassified, row.window_cumulative_bound), "") : ""}
    </tr>`).join("");
  document.querySelectorAll(".date-button").forEach((button) => button.addEventListener("click", () => applySelectedDate(button.dataset.date, { showTooltip: true })));
  $("#detail-range").textContent = `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
  $("#detail-count").textContent = `${rows.length} 个日期 · 增量、占比与累计`;
  $("#data-footnote").textContent = `新用户指在豆包授权绑定时当场新注册且慢账户；老用户指绑定前账户已经存在——按每个用户自己的首次授权时刻判定，与上架时刻无关。统计窗口自 ${formatDay(currentData.daily[0].date)} 起，按自然日归集绑定时间；${formatDay(currentData.daily.at(-1).date)}截至 ${formatTime(currentData.meta.data_cutoff)}，不是完整自然日。`;
}

const REASON_COPY = {
  minimum_group_size: "为保护较小分组，暂不展示",
  cross_cohort_inference: "为避免相减反推，仅在「全部」口径下展示",
  source_not_closed: "该分组数据暂未对齐，先不展示",
  no_authoritative_source: "权威口径待接入",
  authoritative_source_unavailable: "权威口径待接入",
  not_refreshed_this_cycle: "本次刷新未包含",
  query_in_progress: "数据查询中",
};

function publicStateCopy(item) {
  const reasonCode = typeof item === "string" ? "" : item?.reason_code;
  if (reasonCode && REASON_COPY[reasonCode]) return REASON_COPY[reasonCode];
  const state = typeof item === "string" ? item : item?.state;
  if (state === "suppressed") return REASON_COPY.minimum_group_size;
  return "数据源待确认";
}

function cohortSections(cohortKey) {
  return {
    profile: currentData?.profile?.cohorts?.[cohortKey] || null,
    behavior: currentData?.behavior?.cohorts?.[cohortKey] || null,
    business: currentData?.business?.cohorts?.[cohortKey] || null,
  };
}

function hasConfirmedAudienceMetric(cohortKey) {
  const { profile, behavior, business } = cohortSections(cohortKey);
  return Boolean(profile?.dimensions?.some((item) => item.state === "confirmed")
    || behavior?.metrics?.some((item) => item.state === "confirmed")
    || business?.stats?.some((item) => item.state === "confirmed"));
}

function syncAudienceControls() {
  const available = COHORT_ORDER.filter(hasConfirmedAudienceMetric);
  if (!available.includes(viewState.audienceCohort)) viewState.audienceCohort = available[0] || "all";
  document.querySelectorAll('input[name="audience-cohort"]').forEach((input) => {
    const enabled = available.includes(input.value);
    input.disabled = !enabled;
    input.checked = input.value === viewState.audienceCohort;
    input.parentElement.classList.toggle("is-disabled", !enabled);
  });
  return available;
}

function audiencePopulation(profile, behavior) {
  if (isWholeCount(profile?.population_accounts)) return profile.population_accounts;
  if (isWholeCount(behavior?.population_accounts)) return behavior.population_accounts;
  return null;
}

const amount0 = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const amount1 = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatAmount(wan) {
  if (!Number.isFinite(wan)) return "—";
  if (wan === 0) return "0 万元";
  if (wan >= 10000) return `${amount1.format(wan / 10000)} 亿元`;
  if (wan >= 1000) return `${amount0.format(wan)} 万元`;
  return `${amount1.format(wan)} 万元`;
}

function bucketLabel(bucket) {
  const fixedLabels = {
    has_asset: "有资产",
    has_assets: "有资产",
    no_asset: "暂无资产",
    no_assets: "暂无资产",
    with_asset: "有资产",
    without_asset: "暂无资产",
    invested: "曾投资",
    not_invested: "尚未投资",
    never_invested: "未投资",
    lt_10k: "1 万元及以下",
    "10k_100k": "1—10 万元",
    "100k_500k": "10—50 万元",
    gte_500k: "50 万元以上",
    card_bound: "已绑卡",
    card_not_bound: "尚未绑卡",
    assessed: "已完成测评",
    not_assessed: "尚未完成测评",
    lt_25: "25 岁以下",
    "25_30": "25—30 岁",
    "31_40": "31—40 岁",
    "41_50": "41—50 岁",
    "51_60": "51—60 岁",
    gt_60: "60 岁以上",
    male: "男",
    female: "女",
    app_used: "有 App 使用记录",
    app_not_used: "暂无 App 记录",
    app_no_record: "暂无 App 记录",
    mp_bound: "已绑定公众号",
    mp_not_bound: "未绑定公众号",
    other: "其他",
    suppressed_small: "其他（小分组合并）",
    unknown: "暂无法判断",
  };
  return fixedLabels[bucket.id] || bucket.label || "其他";
}

function shareWidth(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, part / total * 100));
}

function profileDimensionsFor(cohort, panel = null) {
  if (!cohort) return [];
  const byId = new Map(cohort.dimensions.map((item) => [item.id, item]));
  return Object.keys(PROFILE_DIMENSIONS)
    .filter((id) => !panel || PROFILE_DIMENSIONS[id].panel === panel)
    .map((id) => byId.get(id))
    .filter(Boolean);
}

function behaviorMetricsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.metrics.map((item) => [item.id, item]));
  return Object.keys(BEHAVIOR_METRICS).map((id) => byId.get(id)).filter(Boolean);
}

function businessStatsFor(cohort) {
  if (!cohort) return [];
  const byId = new Map(cohort.stats.map((item) => [item.id, item]));
  return Object.keys(BUSINESS_STATS).filter((id) => !BUSINESS_STATS[id].hidden).map((id) => byId.get(id)).filter(Boolean);
}

// 金额型指标做成数字块：金额是主角，人数与人均做辅助行，不进走势图，避免量纲混用。
function renderBusinessTiles(business, population) {
  const stats = businessStatsFor(business);
  const container = $("#business-tiles");
  if (!stats.length) {
    container.innerHTML = '<p class="audience-inline-empty">入金、规模与交易金额口径待接入</p>';
    return;
  }
  container.innerHTML = stats.map((stat) => {
    const config = BUSINESS_STATS[stat.id];
    if (stat.state !== "confirmed") {
      return `<article class="metric-tile is-${stat.state}">
        <span class="metric-tile-label">${escapeHtml(config.label)}</span>
        <strong class="metric-tile-state">${publicStateCopy(stat)}</strong>
        <small>${escapeHtml(config.description)}</small>
      </article>`;
    }
    const share = safeShare(stat.accounts, population);
    const extra = [];
    if (Number.isFinite(stat.per_capita_wan)) extra.push(`人均 ${formatAmount(stat.per_capita_wan)}`);
    if (Number.isFinite(stat.median_wan)) extra.push(`中位 ${formatAmount(stat.median_wan)}`);
    if (Number.isFinite(stat.event_count) && config.unit !== "count") extra.push(`共 ${number.format(stat.event_count)} 笔`);
    const value = config.unit === "count"
      ? `${number.format(stat.event_count)} 笔`
      : formatAmount(stat.amount_wan);
    return `<article class="metric-tile tone-${config.tone}">
      <span class="metric-tile-label">${escapeHtml(config.label)}</span>
      <strong class="metric-tile-value">${escapeHtml(value)}</strong>
      <p class="metric-tile-people">涉及 ${number.format(stat.accounts)} 人<em>${share === null ? "—" : percent.format(share)}</em></p>
      <small>${escapeHtml(extra.length ? extra.join(" · ") : config.description)}</small>
    </article>`;
  }).join("");
}

function distributionMarkup(dimension, population) {
  const config = PROFILE_DIMENSIONS[dimension.id];
  if (dimension.state !== "confirmed") {
    return `<section class="asset-group is-${dimension.state}">
      <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
      <p class="audience-state-copy">${publicStateCopy(dimension)}</p>
    </section>`;
  }
  const bars = dimension.buckets.map((bucket) => {
    const share = safeShare(bucket.accounts, population);
    const label = bucketLabel(bucket);
    const muted = bucket.id === "unknown" || bucket.id === "suppressed_small" ? " is-muted" : "";
    return `<div class="asset-row">
      <div class="asset-row-copy"><span>${escapeHtml(label)}</span><strong>${number.format(bucket.accounts)}<small> 人</small></strong></div>
      <div class="audience-progress${muted}" role="img" aria-label="${escapeHtml(label)} ${number.format(bucket.accounts)} 人，占 ${share === null ? "未知" : percent.format(share)}">
        <i style="--share: ${shareWidth(bucket.accounts, population)}%"></i>
      </div>
      <em>${share === null ? "—" : percent.format(share)}</em>
    </div>`;
  }).join("");
  const note = dimension.note ? `<p class="asset-group-note">${escapeHtml(dimension.note)}</p>` : "";
  return `<section class="asset-group">
    <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
    <div class="asset-rows">${bars}</div>${note}
  </section>`;
}

function renderDistributionPanels(profile, population) {
  Object.entries(PROFILE_PANELS).forEach(([panel, selector]) => {
    const dimensions = profileDimensionsFor(profile, panel);
    $(selector).innerHTML = dimensions.length
      ? dimensions.map((dimension) => distributionMarkup(dimension, population)).join("")
      : '<p class="audience-inline-empty">数据源待确认</p>';
  });
}

function renderBehaviorBars(behavior) {
  const metrics = behaviorMetricsFor(behavior);
  if (!metrics.length) {
    $("#behavior-bars").innerHTML = '<p class="audience-inline-empty">数据源待确认</p>';
    return;
  }
  $("#behavior-bars").innerHTML = metrics.map((metric) => {
    const config = BEHAVIOR_METRICS[metric.id];
    if (metric.state !== "confirmed") {
      return `<article class="behavior-row is-${metric.state}">
        <div class="behavior-copy"><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div>
        <strong class="behavior-state">${publicStateCopy(metric)}</strong>
      </article>`;
    }
    const share = safeShare(metric.reached_accounts, metric.eligible_accounts);
    const eventCopy = metric.event_count === undefined ? "" : ` · 共 ${number.format(metric.event_count)} 笔`;
    return `<article class="behavior-row">
      <div class="behavior-copy"><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div>
      <div class="behavior-value"><strong>${number.format(metric.reached_accounts)}<small> 人</small></strong><em>${share === null ? "—" : percent.format(share)}</em></div>
      <div class="audience-progress behavior-progress" role="img" aria-label="${escapeHtml(config.label)} ${number.format(metric.reached_accounts)} 人，占可统计用户 ${share === null ? "未知" : percent.format(share)}"><i style="--share: ${shareWidth(metric.reached_accounts, metric.eligible_accounts)}%"></i></div>
      <p class="behavior-base">可统计 ${number.format(metric.eligible_accounts)} 人${eventCopy}</p>
    </article>`;
  }).join("");
}

function renderAudience({ announce = false } = {}) {
  const available = syncAudienceControls();
  const cohortKey = viewState.audienceCohort;
  const { profile, behavior, business } = cohortSections(cohortKey);
  const population = audiencePopulation(profile, behavior);
  const label = COHORT_LABELS[cohortKey];
  $("#audience-cohort-label").textContent = label;
  $("#audience-population").textContent = population === null ? "—" : number.format(population);
  const confirmed = (list, key, id) => list?.[key]?.find((item) => item.id === id && item.state === "confirmed");
  const holding = confirmed(business, "stats", "holding_amount");
  const inflow = confirmed(business, "stats", "inflow_amount");
  const asset = confirmed(profile, "dimensions", "asset_holding_status");
  const activity = confirmed(behavior, "metrics", "investment_activity_after_binding");
  const assetCount = asset?.buckets?.find((bucket) => bucket.id === "has_assets")?.accounts;
  const insight = [];
  if (holding) insight.push(`当前保有（含绑定前已有资产）${formatAmount(holding.amount_wan)}`);
  if (inflow) insight.push(`绑定后新增入金 ${formatAmount(inflow.amount_wan)}（${number.format(inflow.accounts)} 人）`);
  if (isWholeCount(assetCount)) insight.push(`可识别有资产 ${number.format(assetCount)} 人（${formatShare(assetCount, population)}）`);
  if (isWholeCount(activity?.reached_accounts)) insight.push(`绑定后新增入金 ${number.format(activity.reached_accounts)} 人`);
  $("#audience-summary-copy").textContent = available.length && insight.length ? `${insight.join("；")}。` : "数据源待确认";
  renderBusinessTiles(business, population);
  renderDistributionPanels(profile, population);
  renderBehaviorBars(behavior);
  if (announce) $("#audience-announcement").textContent = `已切换至${label}，共 ${population === null ? "未知" : number.format(population)} 人。`;
}

function renderQuestionAnalysis() {
  const signals = currentData.usage_question_signals;
  const cohorts = Object.fromEntries(signals.cohorts.map((item) => [item.id, item]));
  const all = cohorts.all;
  const newCoverage = safeShare(cohorts.new.proxy_active_accounts, cohorts.new.population_accounts);
  const existingCoverage = safeShare(cohorts.existing.proxy_active_accounts, cohorts.existing.population_accounts);
  const gapPoints = (existingCoverage - newCoverage) * 100;

  $("#question-proxy-users").textContent = number.format(all.proxy_active_accounts);
  $("#question-proxy-users-note").textContent = `共 ${number.format(all.population_accounts)} 位绑定用户`;
  $("#question-proxy-coverage").textContent = formatShare(all.proxy_active_accounts, all.population_accounts);
  $("#question-proxy-missing").textContent = number.format(all.not_observed_accounts);
  $("#question-proxy-gap").textContent = `${gapPoints >= 0 ? "+" : ""}${gapPoints.toFixed(1)} 个百分点`;
  $("#question-signal-summary").textContent = `${number.format(all.population_accounts)} 位绑定用户中，${number.format(all.proxy_active_accounts)} 位出现 OAuth 使用代理（${formatShare(all.proxy_active_accounts, all.population_accounts)}）；这能证明技术连接已被使用，但不能回答用户具体问了什么。`;

  $("#question-coverage-list").innerHTML = COHORT_ORDER.map((id) => {
    const cohort = cohorts[id];
    const share = safeShare(cohort.proxy_active_accounts, cohort.population_accounts) || 0;
    return `<div class="question-coverage-row">
      <div class="question-coverage-copy"><span>${QUESTION_COHORT_LABELS[id]}</span><strong>${number.format(cohort.proxy_active_accounts)} / ${number.format(cohort.population_accounts)}</strong></div>
      <em>${percent.format(share)}</em>
      <div class="question-coverage-bar" aria-hidden="true"><i style="--share:${(share * 100).toFixed(2)}%"></i></div>
    </div>`;
  }).join("");

  $("#question-unavailable-grid").innerHTML = signals.unavailable_content.map((id) => {
    const [label, reason] = QUESTION_UNAVAILABLE[id];
    return `<article class="question-unavailable-card"><span>当前不可得</span><strong>${escapeHtml(label)}</strong><p>${escapeHtml(reason)}</p></article>`;
  }).join("");

  const rhythm = signals.usage_rhythm;
  const oneDay = rhythm.active_day_buckets.find((item) => item.id === "one_day").all_accounts;
  const multiDay = all.proxy_active_accounts - oneDay;
  const gteEight = rhythm.active_day_buckets
    .filter((item) => item.id === "eight_to_thirty_days" || item.id === "gte_thirty_one_days")
    .reduce((sum, item) => sum + item.all_accounts, 0);
  $("#question-active-days-base").textContent = `有使用代理的 ${number.format(all.proxy_active_accounts)} 人`;
  $("#question-active-days-insight").textContent = `${number.format(multiDay)} 人在不止 1 个自然日出现令牌活动（${formatShare(multiDay, all.proxy_active_accounts)}），其中 ${number.format(gteEight)} 人达到 8 天及以上（${formatShare(gteEight, all.proxy_active_accounts)}）。`;
  $("#question-active-days").innerHTML = rhythm.active_day_buckets.map((bucket) => {
    const share = safeShare(bucket.all_accounts, all.proxy_active_accounts) || 0;
    return `<div class="question-active-row"><span>${QUESTION_ACTIVE_DAY_LABELS[bucket.id]}</span><div class="question-active-bar" aria-hidden="true"><i style="--share:${(share * 100).toFixed(2)}%"></i></div><strong>${number.format(bucket.all_accounts)} 人</strong></div>`;
  }).join("");

  const withinFive = rhythm.first_proxy_lag_buckets.find((item) => item.id === "lte_5m").accounts;
  $("#question-first-lag-insight").textContent = `${number.format(withinFive)} 人（${formatShare(withinFive, all.proxy_active_accounts)}）在授权后 5 分钟内出现首个令牌，更接近技术激活信号，不能解释为即时产生提问。`;
  const recentMax = Math.max(...rhythm.daily_proxy_active.map((row) => row.all_accounts), 1);
  $("#question-recent-list").innerHTML = rhythm.daily_proxy_active.map((row) => `<div class="question-recent-row${row.partial ? " is-partial" : ""}">
    <span>${formatDay(row.date)}</span>
    <div class="question-recent-bar" aria-hidden="true"><i style="--share:${((row.all_accounts / recentMax) * 100).toFixed(2)}%"></i></div>
    <strong>${number.format(row.all_accounts)} 人</strong>
  </div>`).join("");

  $("#question-instrumentation-list").innerHTML = signals.required_instrumentation.map((id) => {
    const [label, note] = QUESTION_INSTRUMENTATION[id];
    return `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(note)}</span></li>`;
  }).join("");
}

function shortDay(value) {
  return `${Number(value.slice(5, 7))}/${value.slice(8, 10)}`;
}

function parseRangeInput(text) {
  const m = String(text || "").trim().match(/^(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})日?\s*[-–—~至到]\s*(\d{4})[\/.\-年](\d{1,2})[\/.\-月](\d{1,2})日?$/);
  if (!m) return null;
  const pad = (v) => String(v).padStart(2, "0");
  const a = `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  const b = `${m[4]}-${pad(m[5])}-${pad(m[6])}`;
  if (Number.isNaN(Date.parse(a)) || Number.isNaN(Date.parse(b))) return null;
  return [a, b];
}

function openRangeDialog() {
  const dialog = $("#range-dialog");
  if (!dialog || !currentData) return;
  $("#range-input").value = `${viewState.start.replaceAll("-", "/")}-${viewState.end.replaceAll("-", "/")}`;
  $("#range-error").textContent = "";
  if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
  window.requestAnimationFrame(() => $("#range-input").select());
}

function syncControls() {
  document.querySelectorAll('input[name="series"]').forEach((input) => { input.checked = viewState.visibleSeries.has(input.value); });
  document.querySelectorAll('input[name="range"]').forEach((input) => { input.checked = input.value === viewState.range; });
  const customLabel = $("#range-custom-label");
  if (customLabel) customLabel.textContent = viewState.customApplied ? `${shortDay(viewState.start)}–${shortDay(viewState.end)}` : "自订";
}

function renderView({ announce = false } = {}) {
  if (!currentData) return;
  const rows = filteredRows();
  if (!rows.length) return;
  currentRows = rows;
  if (!rows.some((row) => row.date === viewState.selectedDate)) viewState.selectedDate = rows.at(-1).date;
  syncControls();
  renderKpis(rows);
  renderSegmentPanel();
  renderChart(rows);
  renderTable(rows);
  renderAudience();
  applySelectedDate(viewState.selectedDate, { announce });
}

function render(data) {
  currentData = validateData(data);
  const firstDate = currentData.daily[0].date;
  const lastDate = currentData.daily.at(-1).date;
  if (!viewState.start || viewState.start < firstDate || viewState.start > lastDate) viewState.start = firstDate;
  if (!viewState.end || viewState.end < firstDate || viewState.end > lastDate) viewState.end = lastDate;
  $("#range-hint").textContent = `可选 ${firstDate.replaceAll("-", "/")} 至 ${lastDate.replaceAll("-", "/")}`;
  $("#range-error").textContent = "";
  document.documentElement.dataset.dataMode = "published";
  renderHeroLead();
  renderView();
  renderQuestionAnalysis();
}

function bindInteractions() {
  document.querySelectorAll('input[name="series"]').forEach((input) => input.addEventListener("change", () => {
    if (input.checked) viewState.visibleSeries.add(input.value);
    else viewState.visibleSeries.delete(input.value);
    renderChart(currentRows);
    applySelectedDate(viewState.selectedDate, { announce: false });
    const visibleCount = viewState.visibleSeries.size;
    $("#selection-announcement").textContent = `${input.checked ? "已显示" : "已隐藏"}${SERIES[input.value].label}，当前显示 ${visibleCount} 项数据。`;
  }));
  document.querySelectorAll('input[name="range"]').forEach((input) => input.addEventListener("change", () => {
    if (input.value === "custom") { openRangeDialog(); return; }
    viewState.range = input.value;
    renderView({ announce: true });
  }));
  document.querySelectorAll('input[name="segment"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked) return;
    viewState.segment = input.value;
    renderSegmentPanel();
  }));
  document.querySelectorAll('input[name="audience-cohort"]').forEach((input) => input.addEventListener("change", () => {
    if (input.disabled) return;
    viewState.audienceCohort = input.value;
    renderAudience({ announce: true });
  }));
  $("#range-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const parsed = parseRangeInput($("#range-input").value);
    const firstDate = currentData.daily[0].date;
    const lastDate = currentData.daily.at(-1).date;
    if (!parsed) { $("#range-error").textContent = "格式应为 YYYY/MM/DD-YYYY/MM/DD。"; return; }
    let [start, end] = parsed;
    if (start > end) { $("#range-error").textContent = "开始日期不能晚于结束日期。"; return; }
    if (end < firstDate || start > lastDate) { $("#range-error").textContent = `区间需与 ${firstDate.replaceAll("-", "/")}–${lastDate.replaceAll("-", "/")} 有交集。`; return; }
    start = start < firstDate ? firstDate : start;
    end = end > lastDate ? lastDate : end;
    viewState.start = start;
    viewState.end = end;
    viewState.range = "custom";
    viewState.customApplied = true;
    $("#range-error").textContent = "";
    $("#range-dialog").close();
    renderView({ announce: true });
  });
  $("#range-cancel").addEventListener("click", () => $("#range-dialog").close());
  $("#range-dialog").addEventListener("close", () => syncControls());
  $("#range-dialog").addEventListener("click", (event) => { if (event.target === $("#range-dialog")) $("#range-dialog").close(); });
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => renderView(), 140);
  });
}

async function init() {
  bindInteractions();
  setFreshness("loading", "正在读取数据");
  try {
    render(await loadPublishedData());
    setNotice("");
  } catch {
    setFreshness("error", "数据读取失败");
    setNotice("数据读取失败，请稍后重新打开页面。");
  }
}

init();
