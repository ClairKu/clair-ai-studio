const DATA_URL = "./data/latest.json";
const SCHEMA_VERSION = "qianwen-user-acquisition-v8";
const LAUNCH_AT = "2026-08-10T08:00:00+08:00";
const WINDOW_START_AT = "2026-08-03T00:00:00+08:00";
const LAUNCH_DAY = LAUNCH_AT.slice(0, 10);
const number = new Intl.NumberFormat("zh-CN");
const decimal1 = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
    description: "终身视角：从未有过任何买入（不含钱包充值）为无首投；曾买入但当前顶层账户已无资产为已流失；当前有资产在管（含当日成交尚未进快照）为在管",
    panel: "asset",
  },
  asset_at_bind_status: {
    label: "绑定时资产状态",
    description: "回溯每个用户绑定当日的顶层 ROOT 资产快照；为 0 或未开户即为零资产，是衡量渠道真实新增的基数",
    panel: "asset",
  },
  lifetime_investment_status: {
    label: "历史投资情况",
    description: "看是否曾在且慢完成投资",
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
    description: "取实名/联系信息中的省级归属；默认展示主要地区，其余可展开查看",
    panel: "profile",
  },
  app_usage_status: {
    label: "且慢APP使用情况",
    description: "看是否有来自且慢APP端的登录或活跃行为",
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
    label: "绑定后账户资金流入",
    description: "绑定后顶层账户出现资金流入（资产表口径，与上方按支付方式统计的新增入金不同源）",
  },
  first_investment_after_binding: {
    label: "绑定后首次投资",
    description: "首次投资里程碑发生在绑定后",
  },
  investment_activity_after_binding: {
    label: "绑定后成功买入",
    description: "绑定后确认成功的买入类交易",
  },
  redemption_after_binding: {
    label: "绑定后成功赎回",
    description: "绑定后确认成功的卖出类交易",
  },
  xiaogu_used_after_binding: {
    label: "绑定后有效使用AI小顾",
    description: "绑定后至少一次有效提问",
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
    description: "此前从未入金，绑定后完成第一笔；已有入金记录的不计入可统计范围",
  },
  repeat_investment_after_binding: {
    label: "绑定后复投",
    description: "绑定后确认成功的产品买入（不含钱包充值）达到两笔及以上",
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
    label: "绑定后入金",
    description: "绑定后确认成功的买入订单金额合计，按入金口径统计",
    tone: "flow",
  },
  inflow_transactions: {
    label: "交易入金笔数",
    description: "绑定后按入金口径识别的交易笔数",
    tone: "flow",
    unit: "count",
  },
  buy_amount: {
    label: "绑定后买入",
    description: "绑定后确认成功的买入金额合计",
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
  { id: "new_inv", label: "新投", note: "绑定后有新增投资，且绑定时无资产", legacy: null },
  { id: "first_inv", label: "首投", note: "绑定后有新增投资，且绑定前没有投资过" },
  { id: "reinvested", label: "再投", note: "绑定后有新增投资（产品买入，不含钱包充值）", legacy: "invested" },
  { id: "new", label: "新户", note: "在千问注册且慢帐号" },
  { id: "new_first_inv", label: "新户首投", note: "新户中完成首投" },
  { id: "existing", label: "老用户", note: "绑定时已有且慢账户" },
  { id: "existing_reactivated", label: "老户唤回", note: "绑定时零资产（未投过或已清仓），绑定后重新入金" },
  { id: "existing_first_inv", label: "老户首投", note: "老户中人生首投发生在绑定后" },
];
const PUBLIC_STATES = new Set(["confirmed", "suppressed", "unavailable"]);
const QUESTION_TOPICS = {
  holding_account: "持仓与账户诊断",
  product_analysis: "基金 / 策略分析",
  market_research: "市场与行业研判",
  product_selection: "产品筛选与推荐",
  transaction_action: "交易与操作",
  planning_configuration: "资金规划与配置",
  knowledge_explain: "投资知识解释",
  qieman_service: "且慢 / 小顾服务",
  report_information: "报告与资讯",
  dialogue_followup: "短追问与对话承接",
  other_expression: "需结合上下文 / 未命中",
};
const QUESTION_TOPIC_IDS = Object.keys(QUESTION_TOPICS);
const QUESTION_DIRECTIONS = {
  holding_diagnosis: ["持仓与账户诊断", "围绕自己的持仓、收益、亏损与账户"],
  product_research: ["基金 / 策略研究", "研究具体基金、基金类型或投顾策略"],
  stock_research: ["个股与公司研究", "个股、公司、财报、估值与产业链"],
  product_selection: ["选品与推荐", "问买什么、选哪个、哪些更适合"],
  asset_allocation: ["资产配置与目标规划", "按养老、买房、教育或资金期限做配置"],
  market_insight: ["市场与机会研判", "行情、板块、资产表现、机会与风险"],
  transaction_execution: ["交易与执行", "买卖、赎回、定投、调仓与操作步骤"],
  investment_learning: ["投资知识学习", "概念、原理、差异与判断方法"],
  qieman_service: ["且慢 / 小顾服务", "平台功能、报告、登录与服务能力"],
  task_status: ["任务进度与结果确认", "催进度、继续执行、确认结果是否生成"],
  personal_context: ["补充个人情况", "补充资金、期限、风险偏好与已有操作"],
  context_followup: ["承接上文继续问", "引用前文、要求展开、比较或补充"],
  non_investment: ["非投资问题 / 闲聊", "数学、生活知识、翻译与日常对话"],
  other_investment: ["其他投资问题", "有投资语境，但对象或目的还不够明确"],
  unclear_expression: ["信息不足，暂难判断", "对象或目的不完整，需结合更多上下文"],
};
const NON_DECISION_DIRECTIONS = new Set(["task_status", "context_followup", "non_investment", "other_investment", "unclear_expression"]);
const QUESTION_OBJECTS = {
  own_account: ["自己的账户 / 持仓", "我的资产、收益与仓位"],
  specific_product: ["具体基金 / 产品", "带产品名或代码的具体对象"],
  fund_category: ["基金类型", "指数、主动、债基、红利等类型"],
  strategy_portfolio: ["投顾策略 / 组合", "策略、组合、主理人与跟车"],
  asset_class: ["资产类别", "A股、港股、美股、黄金、债券等"],
  goal_plan: ["人生目标 / 资金计划", "养老、买房、教育与现金流"],
  market_environment: ["市场环境", "大盘、宏观、行业、政策与估值"],
  platform_service: ["且慢 / 小顾服务", "平台功能与服务入口"],
  unspecified: ["对象未明确", "省略主语或依赖上下文"],
};
const QUESTION_STYLES = {
  direct_request: ["直接提出要求", "帮我、给我、推荐、筛选"],
  diagnose_evaluate: ["诊断 / 评价", "怎么样、是否值得、是否适合"],
  compare_choose: ["比较 / 选择", "哪个好、有什么区别、怎么选"],
  why_explain: ["追问原因", "为什么、逻辑、背后原因"],
  how_to: ["寻求操作方法", "怎么做、怎么买、在哪里操作"],
  forecast_risk: ["预测 / 机会风险", "后市、涨跌、风险与追高"],
  fact_lookup: ["事实查询 / 概念", "什么是、多少、何时、介绍"],
  conversation_fragment: ["口语片段 / 上下文", "省略表达与连续对话"],
};
const QUESTION_COGNITION = {
  beginner_signal: ["入门信号", "概念、怎么买、净值贵不贵等基础认知"],
  developing_signal: ["进阶信号", "回撤、费率、持有期、配置与风险"],
  advanced_signal: ["专业信号", "归因、相关性、夏普、久期等术语"],
  indeterminate: ["证据不足", "问题本身不足以判断投资认知"],
};
const QUESTION_DIMENSIONS = {
  direction: { label: "提问方向", values: QUESTION_DIRECTIONS, filter: "question-direction-filter", key: "t" },
  object: { label: "询问对象", values: QUESTION_OBJECTS, filter: "question-object-filter", key: "o" },
  style: { label: "问法风格", values: QUESTION_STYLES, filter: "question-style-filter", key: "f" },
  cognition: { label: "认知信号", values: QUESTION_COGNITION, filter: "question-cognition-filter", key: "c" },
};
const QUESTION_PERSONAS = {
  holding_optimizer: ["持仓求诊型", "带着自己的账户和盈亏来，核心诉求是诊断与优化。"],
  product_decider: ["产品决策型", "围绕具体基金、基金类型、策略筛选与比较做决定。"],
  planning_allocator: ["配置规划型", "从资金用途、期限和人生目标出发安排资产。"],
  market_tracker: ["市场研判型", "先理解行情、板块和机会风险，再决定是否行动。"],
  execution_seeker: ["交易执行型", "已接近行动，主要追问买卖、赎回、定投或调仓。"],
  learning_builder: ["投资学习型", "通过概念、原理和判断方法建立基础认知。"],
  platform_explorer: ["开放探索型", "大量依赖上下文的连续表达，方向会在对话中逐渐显现。"],
  preset_only: ["默认题尝鲜型", "只有默认 / 推荐问题，至多留下极短承接，没有可识别的实质自发需求。"],
  light_conversation: ["轻对话型", "只有极短承接语，尚未表达可识别的投资需求。"],
};
const QUESTION_RHYTHM = {
  active_days: { label: "活跃天数", values: { "1": "只在 1 天提问", "2": "活跃 2 天", "3_7": "活跃 3–7 天", "8_plus": "活跃 8 天以上" }, unit: "人" },
  session_depth: { label: "单会话深度", values: { "1": "单会话 1 问", "2_3": "单会话 2–3 问", "4_9": "单会话 4–9 问", "10_plus": "单会话 10 问以上" }, unit: "个会话" },
  gaps: { label: "连续提问间隔", values: { "lte_5m": "5 分钟内追问", "5_30m": "5–30 分钟", "30m_1d": "30 分钟–1 天", "gte_1d": "间隔 1 天以上" }, unit: "次间隔" },
  time_of_day: { label: "提问时段", values: { "00_06": "00–06 时", "06_09": "06–09 时", "09_12": "09–12 时", "12_14": "12–14 时", "14_18": "14–18 时", "18_22": "18–22 时", "22_24": "22–24 时" }, unit: "条" },
};
const PRESET_METRICS = {
  clicks: ["提问次数", "次"],
  users: ["点击用户", "人"],
  first_question_users: ["作为首问", "人"],
  follow_on_users: ["带来续问", "人"],
};
const QUESTION_TURNS = { "1": "第 1 问", "2": "第 2 问", "3": "第 3 问", "4_5": "第 4–5 问", "6_plus": "第 6 问以上" };
const QUESTION_SOURCE_LABELS = { all: "全部问题", preset: "默认题", self: "用户主动提问", substantive: "自发实质问题" };
const QUESTION_ENGAGEMENT_LABELS = { all: "全部用户", no_followup: "未形成同会话追问", followup: "有同会话实质追问" };
const QUESTION_JOURNEY_DEPTH_LABELS = { "1": "只问 1 个实质问题", "2_3": "累计问 2–3 个", "4_9": "累计问 4–9 个", "10_plus": "累计问 10 个以上" };
const QUESTION_DEPTH_LABELS = {
  "1": "只问 1 次",
  "2_4": "问 2–4 次",
  "5_9": "问 5–9 次",
  "10_19": "问 10–19 次",
  "20_plus": "问 20 次以上",
};
const QUESTION_CORPUS_URL = "./data/questions.enc.json";
const QUESTION_PAGE_SIZE = 30;

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
  questionLens: "direction",
  questionSource: "all",
  questionEngagement: "all",
  questionCrossMetric: "questions",
  questionTimeGrain: "weekly",
  questionRhythm: "active_days",
  presetView: "direction",
  presetMetric: "clicks",
  entityMetric: "questions",
  questionTurn: "1",
  questionPage: 1,
};

let currentData = null;
let currentRows = [];
let resizeTimer = null;
let questionCorpus = null;
let questionRows = [];
let questionUnlockAttempted = false;
let questionSearchTimer = null;

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

function validateQuestionInsights(data) {
  const insight = data.question_insights;
  if (!insight || insight.cohort !== "new" || insight.as_of !== data.meta.data_cutoff) throw new Error("新用户提问分析口径异常");
  if (insight.cohort_definition !== "registered_within_60m_of_first_binding") throw new Error("新用户提问人群定义异常");
  if (insight.methodology?.topic_model !== "keyword-primary-intent-v1" || insight.methodology?.taxonomy !== "rule-based-multiaxis-v2"
      || insight.methodology?.raw_corpus !== "deidentified_redacted_encrypted_v2") {
    throw new Error("新用户提问分析方法异常");
  }
  const summaryKeys = ["bound_users", "asking_users", "questions", "sessions", "legacy_preset_questions",
    "short_followups", "first_question_preset_users", "one_day_users", "multi_day_users", "top_1pct_questions", "top_5pct_questions"];
  const summary = insight.summary || {};
  summaryKeys.forEach((key) => { if (!isWholeCount(summary[key])) throw new Error(`提问汇总 ${key} 异常`); });
  if (summary.bound_users !== data.metrics.new_accounts || summary.asking_users > summary.bound_users || summary.sessions > summary.questions) {
    throw new Error("提问汇总与新用户基数不一致");
  }
  if (summary.one_day_users + summary.multi_day_users !== summary.asking_users) throw new Error("提问活跃天数不闭合");
  if (summary.top_1pct_questions > summary.top_5pct_questions || summary.top_5pct_questions > summary.questions) throw new Error("提问集中度异常");
  if (!Array.isArray(insight.depth) || insight.depth.reduce((sum, item) => sum + item.users, 0) !== summary.asking_users) throw new Error("提问深度不闭合");
  for (const scope of ["all", "first"]) {
    const rows = insight.topics?.[scope];
    if (!Array.isArray(rows) || rows.length !== QUESTION_TOPIC_IDS.length || new Set(rows.map((item) => item.id)).size !== QUESTION_TOPIC_IDS.length) {
      throw new Error(`提问主题 ${scope} 不完整`);
    }
    rows.forEach((item) => {
      if (!QUESTION_TOPIC_IDS.includes(item.id) || !isWholeCount(item.questions) || !isWholeCount(item.users)) throw new Error(`提问主题 ${scope} 异常`);
    });
    const expected = scope === "all" ? summary.questions : summary.asking_users;
    if (rows.reduce((sum, item) => sum + item.questions, 0) !== expected) throw new Error(`提问主题 ${scope} 不闭合`);
  }
  if (!Array.isArray(insight.top_questions)) throw new Error("高频自发问法结构异常");
  insight.top_questions.forEach((item, index) => {
    if (item.rank !== index + 1 || typeof item.question !== "string" || item.question.length < 5 || !QUESTION_DIRECTIONS[item.direction]
        || !isWholeCount(item.questions) || !isWholeCount(item.users) || item.users < 10) {
      throw new Error("高频原始问法格式异常");
    }
  });
  const research = insight.research;
  if (!research || research.schema_version !== "qianwen-question-research-v2" || research.as_of !== insight.as_of) throw new Error("提问研究数据异常");
  const rs = research.summary || {};
  ["questions", "asking_users", "sessions", "preset_questions", "preset_users", "preset_first_users", "self_authored_questions",
    "self_authored_users", "substantive_questions", "substantive_users", "short_followups", "preset_only_users",
    "preset_follow_on_users", "preset_follow_on_questions"].forEach((key) => {
    if (!isWholeCount(rs[key])) throw new Error(`提问研究汇总 ${key} 异常`);
  });
  if (rs.questions !== summary.questions || rs.asking_users !== summary.asking_users || rs.sessions !== summary.sessions
      || rs.preset_questions + rs.self_authored_questions !== rs.questions
      || rs.substantive_questions + rs.short_followups !== rs.self_authored_questions
      || rs.substantive_users > rs.self_authored_users || rs.self_authored_users > rs.asking_users) throw new Error("提问研究汇总无法闭合");
  const journey = research.journey || {};
  ["asking_users", "conversation_sessions", "user_question_turns", "preset_questions", "self_authored_questions", "substantive_questions", "short_followups",
    "self_authored_users", "substantive_users", "substantive_sessions", "followup_users", "followup_sessions", "no_followup_users", "one_question_users",
    "multi_question_users", "followup_user_substantive_questions"].forEach((key) => {
    if (!isWholeCount(journey[key])) throw new Error(`提问旅程 ${key} 异常`);
  });
  ["average_questions_per_asking_user", "average_self_questions_per_self_user", "average_substantive_questions_per_user",
    "average_substantive_questions_per_followup_user", "average_turns_per_session"].forEach((key) => {
    if (!Number.isFinite(journey[key]) || journey[key] < 0) throw new Error(`提问旅程均值 ${key} 异常`);
  });
  if (journey.asking_users !== rs.asking_users || journey.conversation_sessions !== rs.sessions || journey.user_question_turns !== rs.questions
      || journey.preset_questions + journey.self_authored_questions !== journey.user_question_turns
      || journey.substantive_questions + journey.short_followups !== journey.self_authored_questions
      || journey.followup_users + journey.no_followup_users !== journey.substantive_users
      || journey.one_question_users + journey.multi_question_users !== journey.substantive_users
      || !Array.isArray(journey.question_depth)
      || journey.question_depth.reduce((sum, item) => sum + item.users, 0) !== journey.substantive_users
      || journey.question_depth.reduce((sum, item) => sum + item.questions, 0) !== journey.substantive_questions) throw new Error("提问旅程无法闭合");
  const cross = research.cross_analysis;
  const expectedGroupIds = ["all", "preset", "self", "substantive"].flatMap((source) => ["all", "no_followup", "followup"].map((engagement) => `${source}:${engagement}`));
  if (!cross || !Array.isArray(cross.groups) || cross.groups.length !== expectedGroupIds.length || new Set(cross.groups.map((item) => item.id)).size !== expectedGroupIds.length) throw new Error("提问交叉分析结构异常");
  const dimensionLabels = { direction: QUESTION_DIRECTIONS, object: QUESTION_OBJECTS, style: QUESTION_STYLES, cognition: QUESTION_COGNITION };
  cross.groups.forEach((group) => {
    if (!expectedGroupIds.includes(group.id) || !isWholeCount(group.questions) || !isWholeCount(group.users) || !isWholeCount(group.sessions)) throw new Error(`提问交叉分组 ${group.id} 异常`);
    Object.entries(dimensionLabels).forEach(([key, labels]) => {
      const rows = group.dimensions?.[key];
      if (!Array.isArray(rows) || rows.length !== Object.keys(labels).length || rows.reduce((sum, item) => sum + item.questions, 0) !== group.questions) throw new Error(`提问交叉分组 ${group.id}.${key} 不闭合`);
    });
    for (const grain of ["daily", "weekly"]) {
      if (!Array.isArray(group[grain]) || group[grain].reduce((sum, item) => sum + item.questions, 0) !== group.questions) throw new Error(`提问交叉分组 ${group.id}.${grain} 不闭合`);
      group[grain].forEach((item) => { if (item.directions.reduce((sum, row) => sum + row.questions, 0) !== item.questions) throw new Error(`提问交叉分组 ${group.id}.${grain}方向不闭合`); });
    }
  });
  const groupMap = Object.fromEntries(cross.groups.map((item) => [item.id, item]));
  if (groupMap["all:all"].questions !== rs.questions || groupMap["preset:all"].questions !== rs.preset_questions
      || groupMap["self:all"].questions !== rs.self_authored_questions || groupMap["substantive:all"].questions !== rs.substantive_questions) throw new Error("提问交叉分组与汇总不一致");
  if (research.presets?.true_impressions_available !== false || !Array.isArray(research.presets?.versions) || !research.presets.versions.length) throw new Error("默认题版本数据异常");
  if (!Array.isArray(research.presets.directions) || !Array.isArray(research.presets.follow_on_directions)) throw new Error("默认题方向数据异常");
  let presetClicks = 0;
  research.presets.versions.forEach((version) => {
    if (!version.id || !version.label || !version.evidence || !Array.isArray(version.questions) || !version.questions.length
        || !isWholeCount(version.clicks) || !isWholeCount(version.users) || !isWholeCount(version.first_question_users)
        || !isWholeCount(version.follow_on_users) || !isWholeCount(version.follow_on_questions)
        || !Array.isArray(version.follow_on_directions) || !isWholeCount(version.asker_proxy_denominator)) throw new Error("默认题版本字段异常");
    version.questions.forEach((item) => {
      if (!QUESTION_DIRECTIONS[item.direction] || !isWholeCount(item.clicks) || !isWholeCount(item.users)
          || !isWholeCount(item.first_question_users) || !isWholeCount(item.follow_on_users)
          || !isWholeCount(item.follow_on_questions) || !Array.isArray(item.follow_on_directions)) throw new Error(`${item.id} 默认题字段异常`);
    });
    if (version.questions.reduce((sum, item) => sum + item.clicks, 0) !== version.clicks) throw new Error(`${version.id} 默认题点击不闭合`);
    presetClicks += version.clicks;
  });
  if (presetClicks !== rs.preset_questions) throw new Error("默认题版本合计不闭合");
  const dimensionSpecs = [
    ["direction", QUESTION_DIRECTIONS, rs.substantive_questions],
    ["first_direction", QUESTION_DIRECTIONS, rs.substantive_users],
    ["object", QUESTION_OBJECTS, rs.substantive_questions],
    ["style", QUESTION_STYLES, rs.substantive_questions],
    ["cognition", QUESTION_COGNITION, rs.substantive_questions],
  ];
  dimensionSpecs.forEach(([key, labels, expected]) => {
    const rows = research.dimensions?.[key];
    if (!Array.isArray(rows) || rows.length !== Object.keys(labels).length || rows.reduce((sum, item) => sum + item.questions, 0) !== expected) throw new Error(`${key} 分类不闭合`);
    rows.forEach((item) => { if (!labels[item.id] || !isWholeCount(item.questions) || !isWholeCount(item.users)) throw new Error(`${key}.${item.id} 异常`); });
  });
  if (!Array.isArray(research.entities?.keywords) || !research.entities.keywords.length || !Array.isArray(research.entities?.products)) throw new Error("关键词与产品数据异常");
  [...research.entities.keywords, ...research.entities.products].forEach((item) => {
    if (!item.label || !isWholeCount(item.questions) || !isWholeCount(item.users)) throw new Error("关键词或产品字段异常");
  });
  if (!Array.isArray(research.turn_analysis?.buckets) || research.turn_analysis.buckets.length !== Object.keys(QUESTION_TURNS).length) throw new Error("对话回合数据异常");
  research.turn_analysis.buckets.forEach((bucket) => {
    if (!QUESTION_TURNS[bucket.id] || !isWholeCount(bucket.questions) || !isWholeCount(bucket.users) || !Array.isArray(bucket.directions) || !Array.isArray(bucket.transitions)) throw new Error(`对话回合 ${bucket.id} 异常`);
    if (bucket.directions.reduce((sum, item) => sum + item.questions, 0) !== bucket.questions) throw new Error(`对话回合 ${bucket.id} 方向不闭合`);
  });
  if (!Array.isArray(research.personas) || research.personas.reduce((sum, item) => sum + item.users, 0) !== rs.asking_users) throw new Error("提问画像不闭合");
  research.personas.forEach((item) => { if (!QUESTION_PERSONAS[item.id] || !isWholeCount(item.users) || !isWholeCount(item.questions)) throw new Error("提问画像字段异常"); });
  if (!Array.isArray(research.user_cognition) || research.user_cognition.reduce((sum, item) => sum + item.users, 0) !== rs.substantive_users) throw new Error("用户认知信号不闭合");
  const rhythmExpected = { active_days: rs.asking_users, session_depth: rs.sessions, gaps: rs.questions - rs.asking_users, time_of_day: rs.questions };
  Object.entries(rhythmExpected).forEach(([key, expected]) => {
    const rows = research.rhythm?.[key];
    if (!Array.isArray(rows) || rows.reduce((sum, item) => sum + item.count, 0) !== expected) throw new Error(`提问节奏 ${key} 不闭合`);
  });
  if (!Array.isArray(research.paths?.transitions) || !Array.isArray(research.paths?.sequences)) throw new Error("提问路径缺失");
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
  validateQuestionInsights(data);
  return data;
}

async function loadPublishedData({ allowFallback = true } = {}) {
  try {
    const url = `${DATA_URL}?refresh=${Date.now()}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (allowFallback && window.QIANWEN_ACQUISITION_DATA) return validateData(window.QIANWEN_ACQUISITION_DATA);
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
  const sentences = ["盈米基金与 AI 流量入口平台千问合作，以 A2A 模式接入且慢 AI 小顾 Agent"];
  sentences.push(`上线以来，已有 ${number.format(currentData.metrics.bound_accounts)} 个千问用户绑定且慢账户，其中带来 ${number.format(currentData.metrics.new_accounts)} 个新用户注册，并连接 ${number.format(currentData.metrics.existing_accounts)} 位且慢老用户`);
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
  if (viewState.range === "since-launch") rows = rows.filter((row) => row.date >= LAUNCH_DAY);
  if (viewState.range === "ytd") rows = rows.filter((row) => row.date >= `${last.slice(0, 4)}-01-01`);
  if (viewState.range === "mtd") rows = rows.filter((row) => row.date >= `${last.slice(0, 7)}-01`);
  if (viewState.range === "last-30") rows = rows.slice(-30);
  if (viewState.range === "last-7") rows = rows.slice(-7);
  if (viewState.range === "custom") rows = rows.filter((row) => row.date >= viewState.start && row.date <= viewState.end);
  return decorateRows(rows);
}

function scopeLabel(rows, short = false) {
  if (viewState.range === "full-window") return short ? "全部" : `${formatDay(currentData.daily[0].date)}以来（含上线前灰度）`;
  if (viewState.range === "since-launch") return short ? "首发来" : "服务上线以来";
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
      ? `绑定后有产品买入 · 其中 ${people(item.first_investor_accounts)}为人生首投`
      : meta.note;
  } else if (viewState.segment === "new_inv") {
    popNote = `绑定时零资产、绑定后买入产品 · 新户 ${number.format(item.new_accounts)} · 老户 ${number.format(item.existing_accounts)}`;
  } else if (viewState.segment === "first_inv") {
    popNote = `人生首笔投资在绑定后 · 新户 ${number.format(item.new_accounts)} · 老户 ${number.format(item.existing_accounts)}`;
  } else if (viewState.segment === "new_first_inv") {
    popNote = `新户中完成首投 · 占新户 ${formatShare(population, currentData.metrics?.new_accounts || 0)}`;
  } else if (viewState.segment === "existing_reactivated") {
    popNote = item.reinvested_accounts
      ? `绑定时零资产，绑定后重新入金 · ${people(item.reinvested_accounts)}已买入产品`
      : meta.note;
  } else if (viewState.segment === "existing_first_inv") {
    popNote = `老户中首投 · 占老用户 ${formatShare(population, currentData.metrics?.existing_accounts || 0)}`;
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
  const dailyTotal = rows.reduce((sum, row) => sum + row.bound_accounts_today, 0);
  const dailyAverage = rows.length ? dailyTotal / rows.length : 0;
  const peakIndex = rows.reduce((bestIndex, row, index) => row.bound_accounts_today > rows[bestIndex].bound_accounts_today ? index : bestIndex, 0);
  const peakRow = rows[peakIndex];

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
  const dailyAnnotations = dailyVisible && rows.length
    ? `<line class="chart-average-rule" x1="${layout.left}" y1="${yDaily(dailyAverage)}" x2="${plotRight}" y2="${yDaily(dailyAverage)}"></line>
      <text class="chart-average-label" x="${plotRight}" y="${yDaily(dailyAverage) - 5}" text-anchor="end">日均 +${decimal1.format(dailyAverage)}</text>
      <circle class="chart-peak-dot" cx="${x(peakIndex)}" cy="${yDaily(peakRow.bound_accounts_today)}" r="4"></circle>
      <text class="chart-peak-label" x="${x(peakIndex)}" y="${Math.max(layout.dailyTop + 11, yDaily(peakRow.bound_accounts_today) - 8)}" text-anchor="middle">高峰 +${number.format(peakRow.bound_accounts_today)}</text>`
    : "";

  // 上线前灰度区间：底纹 + 分界线，让 8/10 08:00 正式上线的位置一眼可辨。
  const launchIndex = rows.findIndex((row) => row.date === LAUNCH_DAY);
  let launchMarkup = "";
  if (launchIndex > 0) {
    const ruleX = layout.left + step * launchIndex;
    const shade = (top, height) => `<rect class="chart-prelaunch" x="${layout.left}" y="${top}" width="${ruleX - layout.left}" height="${height}"></rect>`;
    launchMarkup = `${cumulativeKeys.length ? shade(layout.top, layout.cumulativeHeight) : ""}
      ${dailyVisible ? shade(layout.dailyTop, layout.dailyHeight) : ""}
      <line class="chart-launch-rule" x1="${ruleX}" y1="${layout.top}" x2="${ruleX}" y2="${layout.dailyBase}"></line>
      <text class="chart-prelaunch-label" x="${(layout.left + ruleX) / 2}" y="${layout.top + 17}" text-anchor="middle">上线前灰度</text>
      <text class="chart-launch-label" x="${ruleX + 8}" y="${layout.top + 17}">8/10 08:00 正式上线</text>`;
  }

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

  const markup = `${launchMarkup}${grids}${panelTitles}${lines}${bars}${dailyAnnotations}${endMarkup}${dateLabels}${interactivePoints}${emptyState}`;
  return { width: layout.width, height: layout.height, cumulativeMaximum, dailyMaximum, markup };
}

function rowLabel(row) {
  const lastDate = currentData.daily.at(-1).date;
  if (row.date === lastDate) return `${formatDay(row.date)} · 截至 ${formatTime(currentData.meta.data_cutoff)}`;
  if (row.date === LAUNCH_DAY) return `${formatDay(row.date)} · 08:00 正式上线`;
  if (row.date < LAUNCH_DAY) return `${formatDay(row.date)} · 上线前灰度`;
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
  const peak = rows.reduce((best, row) => !best || row.bound_accounts_today > best.bound_accounts_today ? row : best, null);
  const average = rows.length ? rows.reduce((sum, row) => sum + row.bound_accounts_today, 0) / rows.length : 0;
  $("#growth-peak-value").textContent = peak ? `+${number.format(peak.bound_accounts_today)} 人` : "—";
  $("#growth-peak-date").textContent = peak ? `${formatDay(peak.date)} · 所选范围峰值` : "当前范围无数据";
  $("#growth-average-value").textContent = rows.length ? `+${decimal1.format(average)} 人` : "—";
  $("#growth-average-range").textContent = rows.length ? `${rows.length} 个自然日平均` : "当前范围无数据";
  const prelaunch = rows.filter((row) => row.date < LAUNCH_DAY);
  const prelaunchNote = prelaunch.length
    ? `其中 ${formatDay(prelaunch[0].date)}—${formatDay(prelaunch.at(-1).date)} 为正式上线前的灰度绑定 ${number.format(prelaunch.reduce((sum, row) => sum + row.bound_accounts_today, 0))} 人。`
    : rows.some((row) => row.date === LAUNCH_DAY)
      ? `${formatDay(LAUNCH_DAY)}按自然日统计，含当日 08:00 正式上线前的灰度绑定。`
      : "";
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
  $("#data-footnote").textContent = `新用户指在千问绑定时当场新注册且慢账户；老用户指绑定前账户已经存在——按每个用户自己的绑定时刻判定，与服务上线时刻无关。统计窗口自 ${formatDay(currentData.daily[0].date)} 起，按自然日归集绑定时间；${formatDay(currentData.daily.at(-1).date)}截至 ${formatTime(currentData.meta.data_cutoff)}，不是完整自然日。`;
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
    app_used: "已使用APP",
    app_not_used: "未使用APP",
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

function distributionRowMarkup(bucket, population, options = {}) {
  const share = safeShare(bucket.accounts, population);
  const label = options.label || bucketLabel(bucket);
  const muted = bucket.id === "unknown" || bucket.id === "suppressed_small" ? " is-muted" : "";
  const rowClass = options.rowClass ? ` ${options.rowClass}` : "";
  return `<div class="asset-row${rowClass}">
    <div class="asset-row-copy"><span>${escapeHtml(label)}</span><strong>${number.format(bucket.accounts)}<small> 人</small></strong></div>
    <div class="audience-progress${muted}" role="img" aria-label="${escapeHtml(label)} ${number.format(bucket.accounts)} 人，占 ${share === null ? "未知" : percent.format(share)}">
      <i style="--share: ${shareWidth(bucket.accounts, population)}%"></i>
    </div>
    <em>${share === null ? "—" : percent.format(share)}</em>
  </div>`;
}

function profileFinding(dimension) {
  const buckets = dimension.buckets || [];
  const accounts = (id) => buckets.find((bucket) => bucket.id === id)?.accounts || 0;
  const knownBuckets = buckets
    .filter((bucket) => bucket.id !== "unknown" && bucket.id !== "suppressed_small")
    .sort((a, b) => b.accounts - a.accounts);
  const knownAccounts = knownBuckets.reduce((total, bucket) => total + bucket.accounts, 0);
  const findings = {
    asset_holding_status: `${number.format(accounts("has_assets"))} 人当前持有资产，${number.format(accounts("no_assets"))} 人已开户但暂无资产`,
    asset_bucket: `${number.format(accounts("100k_1m") + accounts("gte_1m"))} 人资产超过 10 万元，其中 ${number.format(accounts("gte_1m"))} 人超过 100 万元`,
    asset_at_bind_status: `${number.format(accounts("zero_at_bind"))} 人绑定时零资产，${number.format(accounts("has_assets_at_bind"))} 人此前已有资产`,
    holding_lifecycle_status: `${number.format(accounts("under_management"))} 人仍在管，${number.format(accounts("churned"))} 人投资后已清零`,
    lifetime_investment_status: `${number.format(accounts("invested"))} 人曾完成投资，${number.format(accounts("not_invested"))} 人尚未首投`,
    age_bucket: `已识别用户以 36—45 岁（${number.format(accounts("36_45"))} 人）和 26—35 岁（${number.format(accounts("26_35"))} 人）为主`,
    gender: `已识别 ${number.format(knownAccounts)} 人：男性 ${number.format(accounts("male"))} 人，女性 ${number.format(accounts("female"))} 人`,
    residence_province: `仅 ${number.format(knownAccounts)} 人可识别地区，主要来自 ${knownBuckets.slice(0, 3).map((bucket) => bucketLabel(bucket)).join("、")}`,
    wechat_mp_status: `${number.format(accounts("mp_bound"))} 人已绑定且慢公众号`,
    bank_card_status: `${number.format(accounts("card_bound"))} 人已绑卡，具备后续交易条件`,
    risk_assessment_status: `${number.format(accounts("assessed"))} 人完成风险测评，占全部绑定用户 ${percent.format(accounts("assessed") / Math.max(1, buckets.reduce((total, bucket) => total + bucket.accounts, 0)))}`,
  };
  return findings[dimension.id] || PROFILE_DIMENSIONS[dimension.id].description;
}

function residenceDistributionMarkup(dimension, population) {
  const unknownBuckets = dimension.buckets.filter((bucket) => bucket.id === "unknown" || bucket.id === "suppressed_small");
  const knownBuckets = dimension.buckets
    .filter((bucket) => bucket.id !== "unknown" && bucket.id !== "suppressed_small")
    .sort((a, b) => b.accounts - a.accounts);
  const knownAccounts = knownBuckets.reduce((total, bucket) => total + bucket.accounts, 0);
  const compactRows = [
    ...unknownBuckets,
    ...(knownBuckets.length ? [{ id: "known_total", accounts: knownAccounts }] : []),
  ];
  const bars = compactRows.map((bucket) => distributionRowMarkup(bucket, population, bucket.id === "known_total"
    ? { label: `已识别到省级地区（${knownBuckets.length} 个）`, rowClass: "is-aggregate" }
    : {})).join("");
  const leaders = knownBuckets.length
    ? `<div class="residence-leaders"><span>已识别主要地区</span><p>${knownBuckets.slice(0, 5).map((bucket) => `<small><b>${escapeHtml(bucketLabel(bucket))}</b>${number.format(bucket.accounts)} 人</small>`).join("")}</p></div>`
    : "";
  const details = knownBuckets.length
    ? `<details class="residence-details">
        <summary><span>查看全部 ${knownBuckets.length} 个地区明细</span><small>完整数据</small></summary>
        <div class="asset-rows residence-detail-rows">${knownBuckets.map((bucket) => distributionRowMarkup(bucket, population)).join("")}</div>
      </details>`
    : "";
  return `<div class="asset-rows is-compact-residence">${bars}</div>${leaders}${details}`;
}

function distributionMarkup(dimension, population) {
  const config = PROFILE_DIMENSIONS[dimension.id];
  if (dimension.state !== "confirmed") {
    return `<section class="asset-group is-${dimension.state}">
      <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(config.description)}</p></div></header>
      <p class="audience-state-copy">${publicStateCopy(dimension)}</p>
    </section>`;
  }
  const rows = dimension.id === "residence_province"
    ? residenceDistributionMarkup(dimension, population)
    : `<div class="asset-rows">${dimension.buckets.map((bucket) => distributionRowMarkup(bucket, population)).join("")}</div>`;
  const note = dimension.note ? `<p class="asset-group-note">${escapeHtml(dimension.note)}</p>` : "";
  return `<section class="asset-group">
    <header><div><h4>${escapeHtml(config.label)}</h4><p>${escapeHtml(profileFinding(dimension))}</p></div></header>
    ${rows}${note}
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
  if (inflow) insight.push(`绑定后入金 ${formatAmount(inflow.amount_wan)}（${number.format(inflow.accounts)} 人）`);
  if (isWholeCount(assetCount)) insight.push(`可识别有资产 ${number.format(assetCount)} 人（${formatShare(assetCount, population)}）`);
  if (isWholeCount(activity?.reached_accounts)) insight.push(`绑定后发起买入 ${number.format(activity.reached_accounts)} 人`);
  $("#audience-summary-copy").textContent = available.length && insight.length ? `${insight.join("；")}。` : "数据源待确认";
  renderBusinessTiles(business, population);
  renderDistributionPanels(profile, population);
  renderBehaviorBars(behavior);
  if (announce) $("#audience-announcement").textContent = `已切换至${label}，共 ${population === null ? "未知" : number.format(population)} 人。`;
}

const questionLabel = (dimension, id) => QUESTION_DIMENSIONS[dimension]?.values?.[id]?.[0] || id;

function selectedQuestionGroup(source = viewState.questionSource, engagement = viewState.questionEngagement) {
  return currentData.question_insights.research.cross_analysis.groups.find((item) => item.id === `${source}:${engagement}`);
}

function renderQuestionDimension() {
  const research = currentData.question_insights.research;
  const group = selectedQuestionGroup();
  const lens = viewState.questionLens;
  const metric = viewState.questionCrossMetric;
  const definition = QUESTION_DIMENSIONS[lens];
  const rows = [...group.dimensions[lens]].filter((item) => item[metric] > 0).sort((a, b) => b[metric] - a[metric] || b.questions - a.questions);
  const total = metric === "questions" ? group.questions : group.users;
  const max = Math.max(...rows.map((item) => item[metric]), 1);
  const excludedIds = new Set({ direction: ["task_status", "context_followup", "non_investment", "other_investment", "unclear_expression"], object: ["unspecified"], style: ["conversation_fragment"], cognition: ["indeterminate"] }[lens] || []);
  const primaryRows = lens === "direction" ? rows.filter((item) => !excludedIds.has(item.id)) : rows;
  const secondaryRows = lens === "direction" ? rows.filter((item) => excludedIds.has(item.id)) : [];
  const leading = primaryRows[0] || rows[0];
  const excludedRows = rows.filter((item) => excludedIds.has(item.id));
  const metricLabel = metric === "questions" ? "问题" : "用户";
  const leadingLabels = primaryRows.slice(0, 2).map((item) => definition.values[item.id][0]);
  const titleLead = leadingLabels.join("、");
  const titles = {
    direction: `${QUESTION_SOURCE_LABELS[viewState.questionSource]}主要集中在${titleLead}`,
    object: `${QUESTION_SOURCE_LABELS[viewState.questionSource]}主要在问${titleLead}`,
    style: `${QUESTION_SOURCE_LABELS[viewState.questionSource]}常见问法是${titleLead}`,
    cognition: `${QUESTION_SOURCE_LABELS[viewState.questionSource]}主要呈现${titleLead}`,
  };
  $("#question-map-title").textContent = leading ? titles[lens] : "当前筛选条件没有问题记录";
  $("#question-cross-selection").textContent = `${QUESTION_SOURCE_LABELS[viewState.questionSource]} · ${QUESTION_ENGAGEMENT_LABELS[viewState.questionEngagement]} · 看${metricLabel}数`;
  $("#question-dimension-note").textContent = leading
    ? `${number.format(group.users)} 位用户留下 ${number.format(group.questions)} 条问题；${excludedRows.length ? `将${excludedRows.map((item) => `“${definition.values[item.id][0]}”${number.format(item[metric])} ${metric === "questions" ? "条" : "人"}`).join("、")}单列后，` : ""}${definition.values[leading.id][0]}在可识别类别中最高：${number.format(leading[metric])} ${metric === "questions" ? "条" : "人"}。`
    : "当前交叉条件没有问题记录，可切换来源或追问状态。";
  $("#question-cross-summary").innerHTML = [
    ["筛选后用户", number.format(group.users), `${formatShare(group.users, research.summary.asking_users)} 的全部提问用户`],
    ["筛选后问题", number.format(group.questions), `${formatShare(group.questions, research.summary.questions)} 的全部提问`],
    ["涉及会话", number.format(group.sessions), group.users ? `人均 ${(group.questions / group.users).toFixed(1)} 条` : "—"],
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  const dimensionRows = primaryRows.map((item) => `<button class="dimension-row" type="button" data-question-dimension="${lens}" data-question-value="${item.id}">
    <span class="dimension-row-label">${escapeHtml(definition.values[item.id][0])}<small>${escapeHtml(definition.values[item.id][1])}</small></span>
    <span class="dimension-track" role="img" aria-label="${escapeHtml(definition.values[item.id][0])} ${number.format(item[metric])}"><i style="width:${Math.max(1.2, item[metric] / max * 100)}%"></i></span>
    <span class="dimension-row-value"><strong>${number.format(item[metric])}</strong><small>${formatShare(item[metric], total)} · ${number.format(item.questions)} 条 / ${number.format(item.users)} 人</small></span>
  </button>`).join("");
  const secondaryBreakdown = secondaryRows.length ? `<section class="direction-secondary" aria-label="表达与系统行为拆解"><header><strong>表达与系统行为，单独拆开看</strong><span>不与投资需求混排 · 点击可查看原话</span></header><div>${secondaryRows.map((item) => `<button type="button" data-question-dimension="direction" data-question-value="${item.id}"><span>${escapeHtml(definition.values[item.id][0])}</span><strong>${number.format(item[metric])} ${metric === "questions" ? "条" : "人"}</strong><small>${escapeHtml(definition.values[item.id][1])}</small></button>`).join("")}</div></section>` : "";
  $("#question-dimension-bars").innerHTML = dimensionRows + secondaryBreakdown;

  const noFollow = selectedQuestionGroup(viewState.questionSource, "no_followup");
  const follow = selectedQuestionGroup(viewState.questionSource, "followup");
  const noMap = Object.fromEntries(noFollow.dimensions[lens].map((item) => [item.id, item]));
  const followMap = Object.fromEntries(follow.dimensions[lens].map((item) => [item.id, item]));
  const matrixRows = [...new Set([...noFollow.dimensions[lens].map((item) => item.id), ...follow.dimensions[lens].map((item) => item.id)])]
    .map((id) => ({ id, no: noMap[id]?.[metric] || 0, follow: followMap[id]?.[metric] || 0 }))
    .filter((item) => item.no || item.follow).sort((a, b) => b.no + b.follow - a.no - a.follow).slice(0, 8);
  $("#question-cross-matrix").innerHTML = `<div class="cross-matrix-head"><span>${escapeHtml(definition.label)}</span><span>未追问</span><span>有追问</span></div>${matrixRows.map((item) => `<div class="cross-matrix-row"><span>${escapeHtml(definition.values[item.id][0])}</span><strong>${number.format(item.no)}<em>${formatShare(item.no, metric === "questions" ? noFollow.questions : noFollow.users)}</em></strong><strong>${number.format(item.follow)}<em>${formatShare(item.follow, metric === "questions" ? follow.questions : follow.users)}</em></strong></div>`).join("")}`;
}

function renderPresetChart(research) {
  const metric = viewState.presetMetric;
  const [metricLabel, unit] = PRESET_METRICS[metric];
  const questions = research.presets.versions.flatMap((version) => version.questions.map((item) => ({ ...item, versionId: version.id, versionLabel: version.label })));
  let rows;
  if (viewState.presetView === "version") {
    rows = research.presets.versions.map((version) => ({ ...version, title: version.label, subtitle: `${version.questions.length} 个默认问题`, action: `version:${version.id}` }));
  } else if (viewState.presetView === "question") {
    rows = questions.map((item) => ({ ...item, title: item.question, subtitle: `${QUESTION_DIRECTIONS[item.direction][0]} · ${item.versionLabel}`, action: `question:${item.id}` }));
  } else {
    rows = research.presets.directions.map((item) => ({ ...item, title: QUESTION_DIRECTIONS[item.id][0], subtitle: QUESTION_DIRECTIONS[item.id][1], action: `direction:${item.id}` }));
  }
  rows = rows.filter((item) => item[metric] > 0).sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...rows.map((item) => item[metric]), 1);
  const denominator = {
    clicks: research.summary.preset_questions,
    users: research.summary.preset_users,
    first_question_users: research.summary.preset_first_users,
    follow_on_users: research.summary.preset_follow_on_users,
  }[metric];
  const titles = { direction: "默认问题在问哪些方向", question: "每个默认问题的实际表现", version: "不同版本的默认问题表现" };
  $("#preset-chart-title").textContent = titles[viewState.presetView];
  $("#preset-chart-note").textContent = `${metricLabel} · 点击条目可查看对应原话`;
  $("#preset-chart").innerHTML = rows.map((item) => `<button class="preset-chart-row" type="button" data-preset-action="${escapeHtml(item.action)}">
    <span class="preset-chart-label">${escapeHtml(item.title)}<small>${escapeHtml(item.subtitle)}</small></span>
    <span class="preset-chart-track"><i style="--value:${item[metric] / max * 100}%"></i></span>
    <span class="preset-chart-value">${number.format(item[metric])} ${unit}<small>${formatShare(item[metric], denominator)}</small></span>
  </button>`).join("");
}

function renderPresetResearch(research) {
  const summary = research.summary;
  const average = summary.preset_users ? (summary.preset_questions / summary.preset_users).toFixed(1) : "—";
  $("#question-default-title").textContent = `${number.format(summary.preset_users)} 位用户使用过默认题，${formatShare(summary.preset_follow_on_users, summary.preset_users)} 继续主动提问`;
  $("#preset-insight").textContent = `${number.format(summary.preset_users)} 位用户共触发 ${number.format(summary.preset_questions)} 次默认问题，人均 ${average} 次；其中 ${number.format(summary.preset_follow_on_users)} 人随后继续主动提问。`;
  $("#preset-summary").innerHTML = [
    ["默认问题触发量", number.format(summary.preset_questions), `占全部提问 ${formatShare(summary.preset_questions, summary.questions)}`],
    ["使用默认题的用户", number.format(summary.preset_users), `占提问用户 ${formatShare(summary.preset_users, summary.asking_users)}`],
    ["人均默认题", average, "每位使用者平均触发次数"],
    ["第一问就是默认题", number.format(summary.preset_first_users), `占默认题用户 ${formatShare(summary.preset_first_users, summary.preset_users)}`],
    ["默认题后继续自发问", number.format(summary.preset_follow_on_users), `续问率 ${formatShare(summary.preset_follow_on_users, summary.preset_users)}`],
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  renderPresetChart(research);
  const followRows = [...research.presets.follow_on_directions].filter((item) => item.questions > 0).sort((a, b) => b.questions - a.questions);
  const followMax = Math.max(...followRows.map((item) => item.questions), 1);
  $("#preset-follow-note").textContent = `${number.format(summary.preset_follow_on_questions)} 条可归因实质续问`;
  $("#preset-follow-bars").innerHTML = followRows.map((item) => `<button class="preset-follow-row" type="button" data-preset-follow-direction="${escapeHtml(item.id)}">
    <span class="preset-chart-label">${escapeHtml(QUESTION_DIRECTIONS[item.id][0])}<small>${escapeHtml(QUESTION_DIRECTIONS[item.id][1])}</small></span>
    <span class="preset-chart-track"><i style="--value:${item.questions / followMax * 100}%"></i></span>
    <span class="preset-chart-value">${number.format(item.questions)} 条<small>${number.format(item.users)} 人</small></span>
  </button>`).join("");
  $("#preset-versions").innerHTML = research.presets.versions.map((version, index) => {
    const follow = formatShare(version.follow_on_users, version.users);
    const perUser = version.users ? (version.clicks / version.users).toFixed(1) : "—";
    return `<details class="preset-version"${index === 0 ? " open" : ""}><summary>
      <h4>${escapeHtml(version.label)}<small>${escapeHtml(version.observed_from)} — ${escapeHtml(version.observed_to)} · ${number.format(version.questions.length)} 个问题</small></h4>
      <span><strong>${number.format(version.clicks)}</strong>提问次数</span>
      <span><strong>${number.format(version.users)}</strong>使用用户</span>
      <span><strong>${perUser}</strong>人均次数</span>
      <span><strong>${follow}</strong>用户继续自发问</span>
    </summary><div class="preset-question-list">${version.questions.map((item) => `<div class="preset-question-row">
      <q><em>${escapeHtml(QUESTION_DIRECTIONS[item.direction][0])}</em>${escapeHtml(item.question)}</q><span>${number.format(item.clicks)} 次</span><span>${number.format(item.users)} 人</span><span>${number.format(item.first_question_users)} 人首问</span><span>${number.format(item.follow_on_users)} 人续问</span>
    </div>`).join("")}</div></details>`;
  }).join("");
}

function renderQuestionPersonas(research) {
  const total = research.summary.asking_users;
  const personas = [...research.personas].sort((a, b) => b.users - a.users);
  $("#question-persona-title").textContent = `${personas.slice(0, 3).map((item) => QUESTION_PERSONAS[item.id][0].replace("型", "")).join("、")}构成核心人群`;
  $("#question-persona-insight").textContent = personas.slice(0, 3).map((item) => `${QUESTION_PERSONAS[item.id][0]} ${number.format(item.users)} 人`).join(" · ");
  $("#question-personas").innerHTML = personas.map((item) => `<article class="persona-card">
    <em>${formatShare(item.users, total)}</em><h4>${escapeHtml(QUESTION_PERSONAS[item.id][0])}</h4><p>${escapeHtml(QUESTION_PERSONAS[item.id][1])}</p>
    <footer><strong>${number.format(item.users)}</strong><span>${item.questions ? `${number.format(item.questions)} 条实质问题` : "尚无实质自发问题"}</span></footer>
  </article>`).join("");
  const cognitionTotal = research.summary.substantive_users;
  const cognitionMap = Object.fromEntries(research.user_cognition.map((item) => [item.id, item.users]));
  $("#question-cognition-insight").textContent = `${number.format(cognitionMap.indeterminate)} 人的提问不足以判断认知；可识别信号中，进阶 ${number.format(cognitionMap.developing_signal)} 人、入门 ${number.format(cognitionMap.beginner_signal)} 人、专业 ${number.format(cognitionMap.advanced_signal)} 人。`;
  $("#question-cognition-users").innerHTML = research.user_cognition.map((item) => `<div class="cognition-user-row"><span>${escapeHtml(QUESTION_COGNITION[item.id][0])}</span><i><b style="width:${item.users / cognitionTotal * 100}%"></b></i><strong>${number.format(item.users)} · ${formatShare(item.users, cognitionTotal)}</strong></div>`).join("");
}

function renderQuestionRhythm() {
  const research = currentData.question_insights.research;
  const journey = research.journey;
  $("#question-rhythm-title").textContent = `${number.format(journey.followup_users)} 人进入同会话实质追问，占实质提问用户 ${formatShare(journey.followup_users, journey.substantive_users)}`;
  $("#question-rhythm-stat").textContent = `追问用户贡献 ${formatShare(journey.followup_user_substantive_questions, journey.substantive_questions)} 的实质问题`;
  $("#question-followup-kpis").innerHTML = [
    ["用户自己问过", number.format(journey.self_authored_users), `共 ${number.format(journey.self_authored_questions)} 条主动输入`],
    ["留下实质问题", number.format(journey.substantive_users), `共 ${number.format(journey.substantive_questions)} 条`],
    ["进入同会话追问", number.format(journey.followup_users), `${number.format(journey.followup_sessions)} 个会话出现第 2 问`],
    ["所有实质提问者人均", journey.average_substantive_questions_per_user.toFixed(1), "实质问题 / 人"],
    ["有追问用户人均", journey.average_substantive_questions_per_followup_user.toFixed(1), "实质问题 / 人"],
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  const rows = journey.question_depth;
  const max = Math.max(...rows.map((item) => item.users), 1);
  $("#question-rhythm-bars").innerHTML = rows.map((item) => `<div class="dimension-row">
    <span class="dimension-row-label">${escapeHtml(QUESTION_JOURNEY_DEPTH_LABELS[item.id])}<small>贡献 ${number.format(item.questions)} 条实质问题</small></span>
    <span class="dimension-track"><i style="width:${Math.max(1.2, item.users / max * 100)}%"></i></span>
    <span class="dimension-row-value"><strong>${number.format(item.users)} 人</strong><small>${formatShare(item.users, journey.substantive_users)}</small></span>
  </div>`).join("");
  const heavy = rows.find((item) => item.id === "10_plus");
  $("#question-rhythm-insight").innerHTML = `<strong>追问用户贡献了绝大多数实质问题</strong><p>${number.format(journey.followup_users)} 位有追问用户共留下 ${number.format(journey.followup_user_substantive_questions)} 条实质问题，人均 ${journey.average_substantive_questions_per_followup_user.toFixed(1)} 条；其中累计问 10 次以上的 ${number.format(heavy.users)} 人贡献 ${number.format(heavy.questions)} 条。</p>`;
}

function renderQuestionPaths(research) {
  $("#question-transitions").innerHTML = research.paths.transitions.map((item) => `<div class="transition-row"><div class="transition-route"><span>${escapeHtml(questionLabel("direction", item.from))}</span><i>→</i><span>${escapeHtml(questionLabel("direction", item.to))}</span></div><strong>${number.format(item.count)} 次 · ${number.format(item.users)} 人</strong></div>`).join("");
  $("#question-sequences").innerHTML = research.paths.sequences.map((item) => `<div class="sequence-row"><p>${item.path.map((id, index) => `${index ? "<i>→</i>" : ""}<span>${escapeHtml(questionLabel("direction", id))}</span>`).join("")}</p><strong>${number.format(item.users)} 人</strong></div>`).join("");
}

function pearsonCorrelation(rows, leftKey, rightKey) {
  if (rows.length < 3) return null;
  const leftMean = rows.reduce((sum, item) => sum + item[leftKey], 0) / rows.length;
  const rightMean = rows.reduce((sum, item) => sum + item[rightKey], 0) / rows.length;
  const numerator = rows.reduce((sum, item) => sum + (item[leftKey] - leftMean) * (item[rightKey] - rightMean), 0);
  const leftScale = Math.sqrt(rows.reduce((sum, item) => sum + (item[leftKey] - leftMean) ** 2, 0));
  const rightScale = Math.sqrt(rows.reduce((sum, item) => sum + (item[rightKey] - rightMean) ** 2, 0));
  return leftScale && rightScale ? numerator / (leftScale * rightScale) : null;
}

function correlationLabel(value) {
  const magnitude = Math.abs(value || 0);
  if (magnitude < 0.2) return "很弱";
  if (magnitude < 0.4) return "较弱";
  if (magnitude < 0.6) return "中等";
  if (magnitude < 0.8) return "较强";
  return "很强";
}

function renderQuestionTime() {
  const group = selectedQuestionGroup();
  const grain = viewState.questionTimeGrain;
  const metric = viewState.questionCrossMetric;
  const rows = group[grain];
  const unit = metric === "questions" ? "条" : "人";
  const max = Math.max(...rows.map((item) => item[metric]), 1);
  const peak = [...rows].sort((a, b) => b[metric] - a[metric])[0];
  const latest = rows.at(-1);
  const periodLabel = (item) => grain === "daily" || item.start === item.end ? formatDay(item.start) : `${formatDay(item.start)}—${formatDay(item.end)}`;
  const market = currentData.question_insights.research.market_context;
  const dailyMap = new Map(group.daily.map((item) => [item.start, item]));
  const firstObservedDay = currentData.question_insights.research.journey.observed_from;
  const pairs = (market?.daily || []).filter((item) => item.date !== firstObservedDay && dailyMap.has(item.date)).map((item) => {
    const questionDay = dailyMap.get(item.date);
    const marketDirection = questionDay.directions.find((entry) => entry.id === "market_insight");
    return { ...item, value: questionDay[metric], marketShare: (marketDirection?.[metric] || 0) / Math.max(1, questionDay[metric]) };
  });
  const correlation = pearsonCorrelation(pairs, "return_day", "value");
  const bigMove = pairs.filter((item) => Math.abs(item.return_day) >= 0.01);
  const normalMove = pairs.filter((item) => Math.abs(item.return_day) < 0.01);
  const average = (items, key) => items.length ? items.reduce((sum, item) => sum + item[key], 0) / items.length : 0;
  const bigAverage = average(bigMove, "value");
  const normalAverage = average(normalMove, "value");
  const bigLift = normalAverage ? bigAverage / normalAverage - 1 : 0;
  const bigMarketShare = average(bigMove, "marketShare");
  const normalMarketShare = average(normalMove, "marketShare");
  const completedMarket = market?.daily || [];
  const marketReturn = completedMarket.length > 1 ? completedMarket.at(-1).close / completedMarket[0].close - 1 : 0;
  const signedCorrelation = correlation === null ? "—" : `${correlation >= 0 ? "+" : ""}${correlation.toFixed(2)}`;
  $("#question-time-title").textContent = correlation === null
    ? (peak ? `${periodLabel(peak)}达到峰值：${number.format(peak[metric])} ${unit}` : "当前条件没有可展示的时间数据")
    : `A 股日涨跌与提问量关系${correlationLabel(correlation)}（r=${signedCorrelation}）`;
  $("#question-time-insight").textContent = correlation === null
    ? "可切换来源或追问状态查看时间变化。"
    : `结论：大盘涨跌方向不能解释提问量变化；但单日涨跌超过 1% 时，平均提问量比普通交易日${bigLift >= 0 ? "高" : "低"} ${percent.format(Math.abs(bigLift))}，市场类问题占比也由 ${percent.format(normalMarketShare)} 升至 ${percent.format(bigMarketShare)}。这说明剧烈波动可能放大咨询需求，仍不能视为因果。`;
  $("#question-market-summary").innerHTML = correlation === null ? "" : [
    ["同期沪深300", `${marketReturn >= 0 ? "+" : ""}${percent.format(marketReturn)}`, `${formatDay(completedMarket[0].date)}—${formatDay(completedMarket.at(-1).date)}`],
    ["日涨跌相关", signedCorrelation, `${pairs.length} 个完整交易日 · ${correlationLabel(correlation)}`],
    ["大波动日提问", `${bigLift >= 0 ? "+" : "−"}${percent.format(Math.abs(bigLift))}`, `${number.format(bigAverage)} vs ${number.format(normalAverage)} ${unit}`],
    ["市场类问题占比", `${(bigMarketShare - normalMarketShare) >= 0 ? "+" : "−"}${(Math.abs(bigMarketShare - normalMarketShare) * 100).toFixed(1)} 个百分点`, `大波动 ${percent.format(bigMarketShare)} · 普通 ${percent.format(normalMarketShare)}`],
  ].map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  const marketPoints = rows.map((period, index) => {
    const periodRows = completedMarket.filter((item) => item.date >= period.start && item.date <= period.end);
    return periodRows.length ? { index, value: periodRows.at(-1).close, date: periodRows.at(-1).date } : null;
  }).filter(Boolean);
  const marketValues = marketPoints.map((item) => item.value);
  const marketMin = Math.min(...marketValues);
  const marketMax = Math.max(...marketValues);
  const marketSpan = Math.max(1, marketMax - marketMin);
  const overlay = marketPoints.length > 1 ? `<svg class="time-market-overlay" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${marketPoints.map((item) => `${(item.index + .5) / rows.length * 1000},${92 - (item.value - marketMin) / marketSpan * 82}`).join(" ")}"></polyline>${marketPoints.map((item) => `<circle cx="${(item.index + .5) / rows.length * 1000}" cy="${92 - (item.value - marketMin) / marketSpan * 82}" r="3"></circle>`).join("")}</svg>` : "";
  $("#question-time-chart").innerHTML = rows.length ? `<div class="time-chart-legend"><span><i></i>提问量</span><span><i></i>沪深300收盘走势</span></div><div class="time-series market-time-series">${overlay}${rows.map((item) => `<div class="time-column" title="${escapeHtml(periodLabel(item))} · ${number.format(item[metric])} ${unit}"><strong>${number.format(item[metric])}</strong><i style="height:${Math.max(2, item[metric] / max * 230)}px"></i><span>${escapeHtml(item.start.slice(5).replace("-", "/"))}</span></div>`).join("")}</div>` : '<p class="audience-inline-empty">当前条件没有时间数据。</p>';
  const visible = grain === "daily" ? rows.slice(-10) : rows;
  $("#question-time-mix").innerHTML = visible.map((item) => {
    const directions = [...item.directions].filter((entry) => entry.questions > 0 && !NON_DECISION_DIRECTIONS.has(entry.id))
      .sort((a, b) => b[metric] - a[metric]).slice(0, 3);
    return `<div class="time-mix-row"><span>${escapeHtml(periodLabel(item))} · ${number.format(item[metric])} ${unit}</span><p>${directions.map((entry) => `<small>${escapeHtml(QUESTION_DIRECTIONS[entry.id][0])} ${number.format(entry[metric])}</small>`).join("") || "<small>暂无明确方向</small>"}</p></div>`;
  }).join("");
}

function renderQuestionEntities(research) {
  const group = selectedQuestionGroup();
  const metric = viewState.questionCrossMetric;
  const unit = metric === "questions" ? "条" : "人";
  const denominator = metric === "questions" ? group.questions : group.users;
  const renderRows = (items, container, limit) => {
    const rows = [...items].sort((a, b) => b[metric] - a[metric] || b.questions - a.questions).slice(0, limit);
    const max = Math.max(...rows.map((item) => item[metric]), 1);
    $(container).innerHTML = rows.length ? rows.map((item) => `<button class="preset-chart-row" type="button" data-entity-query="${escapeHtml(item.query || item.label)}">
      <span class="preset-chart-label">${escapeHtml(item.label)}<small>${escapeHtml(item.kind || `${number.format(item.users)} 位用户提到`)}</small></span>
      <span class="preset-chart-track"><i style="--value:${item[metric] / max * 100}%"></i></span>
      <span class="preset-chart-value">${number.format(item[metric])} ${unit}<small>${formatShare(item[metric], denominator)}</small></span>
    </button>`).join("") : '<p class="audience-inline-empty">暂未发现至少 2 位用户共同提到的具体产品。</p>';
  };
  renderRows(group.entities.keywords, "#question-keywords", 16);
  renderRows(group.entities.products, "#question-products", 16);
  const topKeywords = [...group.entities.keywords].sort((a, b) => b[metric] - a[metric]).slice(0, 3);
  const topProduct = [...group.entities.products].sort((a, b) => b[metric] - a[metric])[0];
  $("#question-entities-title").textContent = topKeywords.length ? `${topKeywords.map((item) => item.label).join("、")}是当前条件下的高频关键词` : "当前交叉条件未识别到高频关键词";
  $("#question-entities-stat").textContent = topKeywords[0] ? `${number.format(topKeywords[0].users)} 人提到“${topKeywords[0].label}”` : "当前条件暂无共同高频词";
  $("#question-entities-insight").textContent = topKeywords.length
    ? `${QUESTION_SOURCE_LABELS[viewState.questionSource]} · ${QUESTION_ENGAGEMENT_LABELS[viewState.questionEngagement]}：${topKeywords.map((item) => `${item.label} ${number.format(item[metric])} ${unit}`).join(" · ")}${topProduct ? `；具体产品中“${topProduct.label}”涉及 ${number.format(topProduct.users)} 位用户。` : "。"}`
    : "可切换问题来源或追问状态查看其他人群。";
}

function renderQuestionTurns(research) {
  const bucket = research.turn_analysis.buckets.find((item) => item.id === viewState.questionTurn) || research.turn_analysis.buckets[0];
  const rows = [...bucket.directions].filter((item) => item.questions > 0).sort((a, b) => b.questions - a.questions);
  const leading = rows.find((item) => !NON_DECISION_DIRECTIONS.has(item.id)) || rows[0];
  const max = Math.max(...rows.map((item) => item.questions), 1);
  $("#question-turn-title").textContent = `${bucket.label}最常见明确目的：${QUESTION_DIRECTIONS[leading.id][0]}`;
  $("#question-turn-insight").textContent = `${number.format(bucket.users)} 位用户在这一回合留下 ${number.format(bucket.questions)} 条实质问题；${QUESTION_DIRECTIONS[leading.id][0]}有 ${number.format(leading.questions)} 条。`;
  $("#question-turn-base").textContent = `${number.format(bucket.questions)} 条 · ${number.format(bucket.users)} 人`;
  $("#question-turn-directions").innerHTML = rows.map((item) => `<button class="preset-follow-row" type="button" data-turn-direction="${escapeHtml(item.id)}">
    <span class="preset-chart-label">${escapeHtml(QUESTION_DIRECTIONS[item.id][0])}<small>${escapeHtml(QUESTION_DIRECTIONS[item.id][1])}</small></span>
    <span class="preset-chart-track"><i style="--value:${item.questions / max * 100}%"></i></span>
    <span class="preset-chart-value">${number.format(item.questions)} 条<small>${number.format(item.users)} 人</small></span>
  </button>`).join("");
  $("#question-turn-transitions").innerHTML = bucket.transitions.length ? bucket.transitions.map((item) => `<button class="turn-transition-row" type="button" data-turn-from="${escapeHtml(item.from)}" data-turn-to="${escapeHtml(item.to)}">
    <p><span>${escapeHtml(QUESTION_DIRECTIONS[item.from][0])}</span><i>→</i><span>${escapeHtml(QUESTION_DIRECTIONS[item.to][0])}</span></p><strong>${number.format(item.count)} 次 · ${number.format(item.users)} 人</strong>
  </button>`).join("") : '<p class="audience-inline-empty">这一回合暂无可识别的下一步路径。</p>';
}

function populateQuestionFilters() {
  for (const [dimension, definition] of Object.entries(QUESTION_DIMENSIONS)) {
    const select = $(`#${definition.filter}`);
    if (select.options.length > 1) continue;
    select.insertAdjacentHTML("beforeend", Object.entries(definition.values).map(([id, copy]) => `<option value="${id}">${escapeHtml(copy[0])}</option>`).join(""));
  }
  const origin = $("#question-origin-filter");
  if (origin.options.length === 2) {
    origin.insertAdjacentHTML("beforeend", currentData.question_insights.research.presets.versions.map((version) => `<option value="version:${escapeHtml(version.id)}">${escapeHtml(version.label)}后的自发提问</option>`).join(""));
  }
  const next = $("#question-next-filter");
  if (next.options.length === 1) next.insertAdjacentHTML("beforeend", Object.entries(QUESTION_DIRECTIONS).map(([id, copy]) => `<option value="${escapeHtml(id)}">下一问：${escapeHtml(copy[0])}</option>`).join(""));
  const date = $("#question-date-filter");
  if (date.options.length === 1) {
    const allGroup = currentData.question_insights.research.cross_analysis.groups.find((item) => item.id === "all:all");
    date.insertAdjacentHTML("beforeend", allGroup.daily.map((item) => `<option value="${item.start}">${formatDay(item.start)} · ${number.format(item.questions)} 条</option>`).join(""));
  }
}

function ensureQuestionOriginOption(value, label) {
  const select = $("#question-origin-filter");
  if (![...select.options].some((option) => option.value === value)) select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`);
  select.value = value;
}

function renderQuestionOverview(insight, research) {
  const journey = research.journey;
  $("#question-overview-note").textContent = `${formatShare(journey.self_authored_questions, journey.user_question_turns)} 由用户主动输入 · ${formatShare(journey.followup_users, journey.substantive_users)} 进入实质追问`;
  $("#question-askers").textContent = number.format(journey.asking_users);
  $("#question-ask-rate").textContent = `覆盖新用户 ${formatShare(journey.asking_users, insight.summary.bound_users)}`;
  $("#question-sessions").textContent = number.format(journey.conversation_sessions);
  $("#question-session-rate").textContent = `提问用户人均 ${(journey.conversation_sessions / journey.asking_users).toFixed(1)} 个会话`;
  $("#question-turns-total").textContent = number.format(journey.user_question_turns);
  $("#question-turns-note").textContent = `每个会话平均 ${journey.average_turns_per_session.toFixed(1)} 个回合`;
  $("#question-default-total").textContent = number.format(journey.preset_questions);
  $("#question-default-rate").textContent = `占全部提问 ${formatShare(journey.preset_questions, journey.user_question_turns)}`;
  $("#question-self-total").textContent = number.format(journey.self_authored_questions);
  $("#question-self-rate").textContent = `${number.format(journey.self_authored_users)} 人主动输入`;
  $("#question-substantive").textContent = number.format(journey.substantive_questions);
  $("#question-substantive-users").textContent = `${number.format(journey.substantive_users)} 人留下 · ${number.format(journey.short_followups)} 条短承接`;
  $("#question-source-flow").innerHTML = [
    ["全部用户提问回合", journey.user_question_turns, `${number.format(journey.asking_users)} 人 · ${number.format(journey.conversation_sessions)} 个会话`],
    ["默认 / 推荐问题", journey.preset_questions, `${number.format(research.summary.preset_users)} 人使用 · ${formatShare(journey.preset_questions, journey.user_question_turns)}`],
    ["用户自己输入", journey.self_authored_questions, `${number.format(journey.substantive_questions)} 条实质问题 + ${number.format(journey.short_followups)} 条短承接`],
  ].map(([label, value, note]) => `<article class="source-flow-card"><span>${label}</span><strong>${number.format(value)}</strong><p>${note}</p></article>`).join("");
  $("#question-findings").innerHTML = [
    { key: "SELF ASK", title: `${number.format(journey.self_authored_users)} 人主动提问，人均 ${journey.average_self_questions_per_self_user.toFixed(1)} 次`, copy: `剔除 ${number.format(journey.preset_questions)} 次默认题后，主动输入仍占全部提问 ${formatShare(journey.self_authored_questions, journey.user_question_turns)}。` },
    { key: "FOLLOW-UP", title: `${number.format(journey.followup_users)} 人进入同会话实质追问`, copy: `追问率 ${formatShare(journey.followup_users, journey.substantive_users)}；有追问用户平均留下 ${journey.average_substantive_questions_per_followup_user.toFixed(1)} 条实质问题。` },
    { key: "TIME WINDOW", title: `问题明细覆盖 ${formatDay(journey.observed_from)}—${formatDay(journey.observed_to)}`, copy: "时间趋势只反映已取得的问题明细窗口；末日为截止时点内的部分日，不做因果推断。" },
  ].map((item) => `<article class="question-finding"><em>${item.key}</em><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.copy)}</p></article>`).join("");
}

function renderQuestionInsights() {
  const insight = currentData.question_insights;
  const research = insight.research;
  const summary = research.summary;
  renderQuestionOverview(insight, research);
  $("#question-headline-insight").textContent = `${number.format(research.journey.asking_users)} 位用户在 ${number.format(research.journey.conversation_sessions)} 个会话里留下 ${number.format(research.journey.user_question_turns)} 个提问回合；其中 ${formatShare(summary.self_authored_questions, summary.questions)} 是用户自己输入。`;
  $("#question-headline-stat").textContent = `${number.format(research.journey.followup_users)} 人进入实质追问`;
  $("#question-headline-detail").textContent = `主动提问人均 ${research.journey.average_self_questions_per_self_user.toFixed(1)} 次 · 有追问用户人均 ${research.journey.average_substantive_questions_per_followup_user.toFixed(1)} 次`;
  renderPresetResearch(research);
  renderQuestionDimension();
  renderQuestionEntities(research);
  renderQuestionPersonas(research);
  renderQuestionRhythm();
  renderQuestionTurns(research);
  renderQuestionPaths(research);
  renderQuestionTime();
  const topTransition = research.paths.transitions[0];
  if (topTransition) {
    $("#question-path-title").textContent = `最常见需求迁移：${QUESTION_DIRECTIONS[topTransition.from][0]} → ${QUESTION_DIRECTIONS[topTransition.to][0]}`;
    $("#question-path-insight").textContent = `${number.format(topTransition.count)} 次迁移，涉及 ${number.format(topTransition.users)} 位用户。`;
  }
  $("#question-raw-count").textContent = `${number.format(summary.self_authored_questions)} 条主动提问`;
  populateQuestionFilters();
  void autoUnlockQuestionCorpus();
}

const decodeQuestionBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

async function loadQuestionEnvelope() {
  if (window.QIANWEN_QUESTION_CORPUS_ENCRYPTED) return window.QIANWEN_QUESTION_CORPUS_ENCRYPTED;
  const response = await fetch(`${QUESTION_CORPUS_URL}?refresh=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`原始提问密文读取失败（HTTP ${response.status}）`);
  return response.json();
}

async function decryptQuestionCorpus(envelope, supplied) {
  if (envelope?.schema_version !== "qianwen-question-corpus-envelope-v2" || envelope.compression !== "gzip") throw new Error("原始提问密文版本不兼容");
  if (!globalThis.crypto?.subtle || typeof DecompressionStream !== "function") throw new Error("当前浏览器不支持安全解锁，请升级后重试");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(supplied), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: decodeQuestionBase64(envelope.salt), iterations: envelope.iterations, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
  const compressed = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decodeQuestionBase64(envelope.iv) }, key, decodeQuestionBase64(envelope.data));
  const decompressed = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const corpus = JSON.parse(await new Response(decompressed).text());
  if (corpus?.schema_version !== "qianwen-question-corpus-v2" || !Array.isArray(corpus.rows) || corpus.rows.length !== corpus.meta?.questions) {
    throw new Error("原始提问库结构异常");
  }
  const insight = currentData.question_insights;
  if (corpus.meta.data_cutoff !== insight.as_of || corpus.rows.length !== insight.summary.questions) throw new Error("原始提问库与分析快照不一致");
  if (corpus.meta.default_questions !== insight.research.summary.preset_questions || corpus.meta.self_authored_questions !== insight.research.summary.self_authored_questions) throw new Error("默认题与自发问题口径不一致");
  corpus.rows.forEach((row, index) => {
    if (row.i !== index + 1 || !/^\d{4}-\d{2}-\d{2}$/.test(row.d) || !QUESTION_DIRECTIONS[row.t] || !QUESTION_OBJECTS[row.o]
        || !QUESTION_STYLES[row.f] || !QUESTION_COGNITION[row.c] || ![0, 1].includes(row.s) || typeof row.p !== "string" || typeof row.v !== "string"
        || typeof row.r !== "string" || typeof row.w !== "string" || !["no_followup", "followup"].includes(row.e) || !Number.isInteger(row.u) || row.u < 0 || typeof row.n !== "string" || (row.n && !QUESTION_DIRECTIONS[row.n])
        || typeof row.q !== "string" || !row.q) {
      throw new Error("原始提问库包含异常记录");
    }
  });
  return corpus;
}

function cachedQuestionCredential() {
  for (const key of ["clair-qianwen-report-unlock-v1", "clair-ai-studio-report-credential-v1"]) {
    try { const value = sessionStorage.getItem(key); if (value) return value; } catch { /* opaque iframe */ }
  }
  return "";
}

function setQuestionUnlockState(message, { busy = false, error = false } = {}) {
  const status = $("#question-unlock-status");
  const button = $("#question-unlock-button");
  status.textContent = message;
  status.style.color = error ? "var(--coral)" : "";
  button.disabled = busy;
  button.textContent = busy ? "正在解锁…" : "解锁原始提问";
}

async function unlockQuestionCorpus(supplied, { automatic = false } = {}) {
  if (!supplied || questionCorpus) return;
  setQuestionUnlockState(automatic ? "正在使用本次报告会话解锁…" : "正在解密并校验 6.5 万条提问…", { busy: true });
  try {
    questionCorpus = await decryptQuestionCorpus(await loadQuestionEnvelope(), supplied);
    try { sessionStorage.setItem("clair-qianwen-report-unlock-v1", supplied); } catch { /* opaque iframe */ }
    $("#question-password").value = "";
    $("#question-unlock-form").hidden = true;
    $("#question-explorer").hidden = false;
    viewState.questionPage = 1;
    renderQuestionTable();
  } catch (error) {
    questionCorpus = null;
    setQuestionUnlockState(automatic ? "自动解锁不可用，请输入报告密码。" : (error?.message || "密码不正确或密文校验失败"), { error: true });
  } finally {
    if (!questionCorpus) setQuestionUnlockState($("#question-unlock-status").textContent, { error: true });
  }
}

async function autoUnlockQuestionCorpus() {
  if (questionUnlockAttempted || questionCorpus) return;
  questionUnlockAttempted = true;
  const credential = cachedQuestionCredential();
  if (credential) await unlockQuestionCorpus(credential, { automatic: true });
  else setQuestionUnlockState("请输入报告密码，解锁脱敏后的全部原始提问。");
}

function filteredQuestionRows() {
  if (!questionCorpus) return [];
  const query = $("#question-search").value.trim().toLocaleLowerCase("zh-CN");
  const scope = $("#question-scope-filter").value;
  const engagement = $("#question-engagement-filter").value;
  const date = $("#question-date-filter").value;
  const origin = $("#question-origin-filter").value;
  const turn = $("#question-turn-filter").value;
  const next = $("#question-next-filter").value;
  const direction = $("#question-direction-filter").value;
  const object = $("#question-object-filter").value;
  const style = $("#question-style-filter").value;
  const cognition = $("#question-cognition-filter").value;
  const inTurn = (row) => turn === "all" || (turn === "1" && row.u === 1) || (turn === "2" && row.u === 2) || (turn === "3" && row.u === 3)
    || (turn === "4_5" && row.u >= 4 && row.u <= 5) || (turn === "6_plus" && row.u >= 6);
  return questionCorpus.rows.filter((row) => (scope === "all" || (scope === "self" && !row.p) || (scope === "substantive" && !row.p && !row.s) || (scope === "preset" && row.p))
    && (engagement === "all" || row.e === engagement) && (date === "all" || row.d === date)
    && (origin === "all" || (origin === "after_preset" && row.r) || (origin.startsWith("version:") && row.w === origin.slice(8)) || (origin.startsWith("question:") && row.r === origin.slice(9)))
    && inTurn(row) && (next === "all" || row.n === next)
    && (direction === "all" || row.t === direction) && (object === "all" || row.o === object)
    && (style === "all" || row.f === style) && (cognition === "all" || row.c === cognition)
    && (!query || row.q.toLocaleLowerCase("zh-CN").includes(query)));
}

function renderQuestionTable() {
  questionRows = filteredQuestionRows();
  const pages = Math.max(1, Math.ceil(questionRows.length / QUESTION_PAGE_SIZE));
  viewState.questionPage = Math.min(Math.max(1, viewState.questionPage), pages);
  const start = (viewState.questionPage - 1) * QUESTION_PAGE_SIZE;
  const visible = questionRows.slice(start, start + QUESTION_PAGE_SIZE);
  const versionLabels = { launch_v1: "首发版默认", expanded_v2: "扩展版推荐", qieman_guided_v3: "且慢导览推荐", entry_examples: "入口示例题" };
  $("#question-table-body").innerHTML = visible.length ? visible.map((row) => `<tr>
    <td>${number.format(row.i)}</td><td>${escapeHtml(row.d)}</td><td>${escapeHtml(row.p ? versionLabels[row.v] || "默认 / 推荐" : row.r ? `默认题后自发 · 第 ${row.u} 问` : row.u ? `用户自发 · 第 ${row.u} 问` : row.s ? "自发短承接" : "用户自发")}<br /><small>${escapeHtml(QUESTION_ENGAGEMENT_LABELS[row.e])}</small></td>
    <td>${escapeHtml(QUESTION_DIRECTIONS[row.t][0])}</td><td>${escapeHtml(QUESTION_OBJECTS[row.o][0])}<br />${escapeHtml(QUESTION_STYLES[row.f][0])} · ${escapeHtml(QUESTION_COGNITION[row.c][0])}</td><td>${escapeHtml(row.q)}</td>
  </tr>`).join("") : '<tr><td colspan="6">没有符合当前筛选的提问。</td></tr>';
  $("#question-result-count").textContent = `找到 ${number.format(questionRows.length)} 条；本页 ${number.format(visible.length)} 条`;
  $("#question-corpus-meta").textContent = `截至 ${formatCutoff(questionCorpus.meta.data_cutoff, true)} · 自动脱敏 ${number.format(questionCorpus.meta.redacted_rows)} 条`;
  $("#question-page").textContent = `第 ${number.format(viewState.questionPage)} / ${number.format(pages)} 页`;
  $("#question-prev").disabled = viewState.questionPage <= 1;
  $("#question-next").disabled = viewState.questionPage >= pages;
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
  renderQuestionInsights();
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
  document.querySelectorAll('input[name="question-lens"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionLens = input.value;
    renderQuestionDimension();
  }));
  document.querySelectorAll('input[name="question-source"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionSource = input.value;
    $("#question-scope-filter").value = input.value;
    renderQuestionDimension();
    renderQuestionEntities(currentData.question_insights.research);
    renderQuestionTime();
    if (questionCorpus) { viewState.questionPage = 1; renderQuestionTable(); }
  }));
  document.querySelectorAll('input[name="question-engagement"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionEngagement = input.value;
    $("#question-engagement-filter").value = input.value;
    renderQuestionDimension();
    renderQuestionEntities(currentData.question_insights.research);
    renderQuestionTime();
    if (questionCorpus) { viewState.questionPage = 1; renderQuestionTable(); }
  }));
  document.querySelectorAll('input[name="question-cross-metric"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionCrossMetric = input.value;
    renderQuestionDimension();
    renderQuestionEntities(currentData.question_insights.research);
    renderQuestionTime();
  }));
  document.querySelectorAll('input[name="question-time-grain"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionTimeGrain = input.value;
    renderQuestionTime();
  }));
  document.querySelectorAll('input[name="question-rhythm"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionRhythm = input.value;
    renderQuestionRhythm();
  }));
  document.querySelectorAll('input[name="preset-view"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.presetView = input.value;
    renderPresetChart(currentData.question_insights.research);
  }));
  document.querySelectorAll('input[name="preset-metric"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.presetMetric = input.value;
    renderPresetChart(currentData.question_insights.research);
  }));
  document.querySelectorAll('input[name="entity-metric"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.entityMetric = input.value;
    renderQuestionEntities(currentData.question_insights.research);
  }));
  document.querySelectorAll('input[name="question-turn"]').forEach((input) => input.addEventListener("change", () => {
    if (!input.checked || !currentData) return;
    viewState.questionTurn = input.value;
    renderQuestionTurns(currentData.question_insights.research);
  }));
  $("#preset-chart").addEventListener("click", (event) => {
    const target = event.target.closest("[data-preset-action]");
    if (!target) return;
    const [kind, value] = target.dataset.presetAction.split(":");
    $("#question-search").value = "";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    if (kind === "direction") {
      $("#question-scope-filter").value = "preset";
      $("#question-origin-filter").value = "all";
      $("#question-direction-filter").value = value;
    } else {
      $("#question-scope-filter").value = "substantive";
      if (kind === "version") {
        ensureQuestionOriginOption(`version:${value}`, "该版本默认题后的自发提问");
      } else {
        const question = currentData.question_insights.research.presets.versions.flatMap((version) => version.questions).find((item) => item.id === value);
        ensureQuestionOriginOption(`question:${value}`, `“${question?.question || value}”后的自发提问`);
      }
    }
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#preset-follow-bars").addEventListener("click", (event) => {
    const target = event.target.closest("[data-preset-follow-direction]");
    if (!target) return;
    $("#question-scope-filter").value = "substantive";
    $("#question-origin-filter").value = "after_preset";
    $("#question-search").value = "";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    $("#question-direction-filter").value = target.dataset.presetFollowDirection;
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#preset-follow-raw").addEventListener("click", () => {
    $("#question-scope-filter").value = "substantive";
    $("#question-origin-filter").value = "after_preset";
    $("#question-search").value = "";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#question-entities").addEventListener("click", (event) => {
    const target = event.target.closest("[data-entity-query]");
    if (!target) return;
    $("#question-search").value = target.dataset.entityQuery;
    $("#question-scope-filter").value = viewState.questionSource;
    $("#question-engagement-filter").value = viewState.questionEngagement;
    $("#question-date-filter").value = "all";
    $("#question-origin-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#question-turn-directions").addEventListener("click", (event) => {
    const target = event.target.closest("[data-turn-direction]");
    if (!target) return;
    $("#question-scope-filter").value = "substantive";
    $("#question-origin-filter").value = "all";
    $("#question-search").value = "";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-turn-filter").value = viewState.questionTurn;
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    $("#question-direction-filter").value = target.dataset.turnDirection;
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#question-turn-transitions").addEventListener("click", (event) => {
    const target = event.target.closest("[data-turn-from]");
    if (!target) return;
    $("#question-scope-filter").value = "substantive";
    $("#question-origin-filter").value = "all";
    $("#question-search").value = "";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-turn-filter").value = viewState.questionTurn;
    $("#question-next-filter").value = target.dataset.turnTo;
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    $("#question-direction-filter").value = target.dataset.turnFrom;
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#question-dimension-bars").addEventListener("click", (event) => {
    const target = event.target.closest("[data-question-dimension]");
    if (!target) return;
    const definition = QUESTION_DIMENSIONS[target.dataset.questionDimension];
    $("#question-search").value = "";
    $("#question-scope-filter").value = viewState.questionSource;
    $("#question-engagement-filter").value = viewState.questionEngagement;
    $("#question-date-filter").value = "all";
    $("#question-origin-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    $(`#${definition.filter}`).value = target.dataset.questionValue;
    viewState.questionPage = 1;
    if (questionCorpus) renderQuestionTable();
    $("#raw-question-title").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#question-unlock-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const supplied = $("#question-password").value.trim();
    if (!supplied) { setQuestionUnlockState("请输入报告密码。", { error: true }); $("#question-password").focus(); return; }
    void unlockQuestionCorpus(supplied);
  });
  $("#question-search").addEventListener("input", () => {
    window.clearTimeout(questionSearchTimer);
    questionSearchTimer = window.setTimeout(() => { viewState.questionPage = 1; renderQuestionTable(); }, 160);
  });
  ["question-scope-filter", "question-engagement-filter", "question-date-filter", "question-origin-filter", "question-turn-filter", "question-next-filter", "question-direction-filter", "question-object-filter", "question-style-filter", "question-cognition-filter"].forEach((id) => {
    $(`#${id}`).addEventListener("change", () => {
      if (id === "question-origin-filter" && $("#question-origin-filter").value !== "all") $("#question-scope-filter").value = "substantive";
      viewState.questionPage = 1;
      renderQuestionTable();
    });
  });
  $("#question-clear").addEventListener("click", () => {
    $("#question-search").value = "";
    $("#question-scope-filter").value = "self";
    $("#question-engagement-filter").value = "all";
    $("#question-date-filter").value = "all";
    $("#question-origin-filter").value = "all";
    $("#question-turn-filter").value = "all";
    $("#question-next-filter").value = "all";
    for (const item of Object.values(QUESTION_DIMENSIONS)) $(`#${item.filter}`).value = "all";
    viewState.questionPage = 1;
    renderQuestionTable();
  });
  $("#question-prev").addEventListener("click", () => { viewState.questionPage -= 1; renderQuestionTable(); });
  $("#question-next").addEventListener("click", () => { viewState.questionPage += 1; renderQuestionTable(); });
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
