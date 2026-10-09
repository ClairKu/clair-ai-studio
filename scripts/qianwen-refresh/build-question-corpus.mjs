/**
 * 只读拉取千问新用户原始提问，在内存中完成多轴分类、路径/节奏聚合、去标识与脱敏。
 * 仅落两类安全产物：公开聚合研究 JSON，以及不含真实用户/会话标识的 AES-GCM 密文语料。
 */
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const cutoff = process.env.QW_CUT;
const output = process.env.QW_QUESTION_OUT;
const researchOutput = process.env.QW_QUESTION_RESEARCH_OUT || resolve(dirname(output || "."), "question-research.json");
const apiKey = process.env.REDASH_API_KEY;
const redashUrl = (process.env.REDASH_URL || "https://zhu.yingmi-inc.com").replace(/\/$/, "");
const password = process.env.REPORT_PASSWORD || "2026";
const dataSourceId = Number(process.env.REDASH_DATA_SOURCE_ID || 41);
if (!cutoff || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cutoff)) throw new Error("缺少合法 QW_CUT");
if (!output) throw new Error("缺少 QW_QUESTION_OUT");
if (!apiKey) throw new Error("缺少 REDASH_API_KEY");

const DIRECTION_IDS = [
  "holding_diagnosis", "product_research", "stock_research", "product_selection", "asset_allocation", "market_insight",
  "transaction_execution", "investment_learning", "qieman_service", "task_status", "personal_context", "context_followup",
  "non_investment", "other_investment", "unclear_expression",
];
const PATH_EXCLUDED_DIRECTIONS = new Set(["task_status", "personal_context", "context_followup", "non_investment", "other_investment", "unclear_expression"]);
const OBJECT_IDS = ["own_account", "specific_product", "fund_category", "strategy_portfolio", "asset_class", "goal_plan", "market_environment", "platform_service", "unspecified"];
const STYLE_IDS = ["direct_request", "diagnose_evaluate", "compare_choose", "why_explain", "how_to", "forecast_risk", "fact_lookup", "conversation_fragment"];
const COGNITION_IDS = ["beginner_signal", "developing_signal", "advanced_signal", "indeterminate"];
const PERSONA_IDS = ["holding_optimizer", "product_decider", "planning_allocator", "market_tracker", "execution_seeker", "learning_builder", "platform_explorer", "preset_only", "light_conversation"];

const PRESET_VERSIONS = [
  {
    id: "launch_v1",
    label: "首发版 · 4 个默认问题",
    evidence: "exact_text_confirmed",
    questions: [
      ["v1_holding", "帮我看看现在的持仓结构，给出优化建议"],
      ["v1_long_term_funds", "推荐2-3个值得长期持有的基金，并给出详细的分析"],
      ["v1_hot_products", "帮我看看最近有哪些比较热门的基金或投顾策略"],
      ["v1_market", "最近市场有哪些特点，有哪些机会和风险值得关注"],
    ],
  },
  {
    id: "expanded_v2",
    label: "扩展版 · 14 个推荐问题",
    evidence: "inferred_from_exact_repetition_and_launch_cluster",
    questions: [
      ["v2_market_response", "现在市场里有哪些值得关注的机会和风险？普通投资者可以采取什么样的应对思路？"],
      ["v2_sector", "最近哪些行业板块表现比较突出，背后的原因是什么，现在还值得继续关注吗？"],
      ["v2_defensive_assets", "如果市场继续震荡，哪些资产通常更抗波动，哪些方向的风险可能更大？"],
      ["v2_fund_movers", "最近哪些基金表现比较突出，主要集中在哪些板块？它们为什么上涨，又有哪些风险需要注意？"],
      ["v2_a_share_value", "现在A股整体算贵还是便宜？机会和风险分别在哪里？"],
      ["v2_cross_asset", "最近A股、港股、债券和黄金分别表现怎么样？为什么有的涨、有的跌，应该怎么看？"],
      ["v2_long_or_hot", "最近表现不错的基金里，哪些更适合长期观察，哪些可能只是短期热门？说说判断理由吗？"],
      ["v2_popular_funds", "最近大家比较关注哪些基金？它们长期表现怎么样，跌起来可能有多大，费用高不高？"],
      ["v2_active_vs_index", "同样投资一个行业，主动基金和指数基金通常有什么不同？选择时应该重点看什么？"],
      ["v2_chasing_risk", "有些基金短期涨得很快，现在再关注会不会有追高风险？应该看哪些方面再做判断？"],
      ["v2_signal_filter", "最近市场信息太多了，帮我筛选出真正重要的变化，并用简单的方式说说接下来应该关注什么。"],
      ["v2_nav_misunderstanding", "一只基金的净值已经比较高了，还能不能关注？净值高低能代表基金贵不贵吗？"],
      ["v2_qieman_entry", "且慢有哪些策略比较适合入门体验？介绍一下各自的特点、风险和建议持有时间。"],
      ["v2_goal_planning", "买房、养老、孩子教育等不同目标，需要分别做资金规划吗？应该怎样安排更清楚？"],
    ],
  },
  {
    id: "qieman_guided_v3",
    label: "且慢导览版 · 13 个推荐问题",
    evidence: "inferred_from_exact_repetition_and_launch_cluster",
    questions: [
      ["v3_strategy_match", "如果我想在且慢开始投资，哪些策略可能更适合我？可以帮我筛选并比较它们的投资方向、波动和持有时间吗？"],
      ["v3_four_money", "且慢常说的“四笔钱”是什么意思？每一类钱分别适合解决什么问题？"],
      ["v3_plan_balance", "做资金规划时，怎样兼顾随时要用、控制回撤和长期增值这几个需求？"],
      ["v3_strategy_recommend", "我不太了解且慢，根据我的情况帮我推荐几个值得重点了解的策略。"],
      ["v3_new_to_qieman", "我刚接触且慢，能不能根据我的情况推荐几个值得了解的策略，并告诉我为什么？"],
      ["v3_money_suitability", "怎么判断一笔钱适不适合拿来投资，以及应该选择稳一点还是波动大一点的方式？"],
      ["v3_qieman_plan", "用且慢的资金规划思路，怎么安排手头资金？需要注意什么？"],
      ["v3_no_frequent_adjust", "我不想自己频繁挑基金和调整，且慢有哪些策略可以重点了解？"],
      ["v3_plan_match", "我想找一个和自己投资计划更匹配的且慢策略，可以推荐几个候选，并说说它们分别适合什么样的情况吗？"],
      ["v3_representative_strategies", "且慢有哪些比较有代表性的策略？结合我的实际情况，你更建议我先了解哪几个，理由是什么？"],
      ["v3_simple_plan", "我有一笔资金不知道怎么投资，可以给我一个简单的规划思路吗？"],
      ["v3_four_money_strategies", "且慢的四笔钱分别对应哪些策略？帮我推荐一些具体选择。"],
      ["v3_plan_before_product", "投资规划应该先选产品，还是先想清楚用途和使用时间？这两种做法有什么区别？"],
    ],
  },
  {
    id: "entry_examples",
    label: "入口示例题 · 4 个高重复问法",
    evidence: "inferred_from_exact_repetition_without_exposure_log",
    questions: [
      ["example_monthly_brief", "给我发一份这个月基金市场简报"],
      ["example_idle_money", "有一笔闲钱想放三年以上，买什么比较稳健"],
      ["example_fund_case", "广发聚富近一年表现怎么样"],
      ["example_ai_funds", "最近AI相关的基金怎么样"],
    ],
  },
];

const KEYWORD_RULES = [
  ["指数基金", /指数基金|宽基|窄基/i], ["主动基金", /主动基金/i], ["债券基金", /债券基金|债基/i], ["货币基金", /货币基金|货基/i],
  ["红利基金", /红利.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}红利/i], ["AI 基金", /(?:AI|人工智能).{0,6}(?:基金|ETF)|(?:基金|ETF).{0,6}(?:AI|人工智能)/i],
  ["科技基金", /科技.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}科技/i], ["医药基金", /医药.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}医药/i],
  ["消费基金", /消费.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}消费/i], ["新能源基金", /新能源.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}新能源/i],
  ["半导体基金", /半导体.{0,5}(?:基金|ETF)|(?:基金|ETF).{0,5}半导体/i], ["QDII 基金", /QDII/i], ["ETF", /ETF/i],
  ["A 股市场", /A股|大盘/i], ["港股市场", /港股/i], ["美股市场", /美股/i], ["黄金市场", /黄金/i], ["债券市场", /债券市场|债市|可转债/i],
  ["行业板块", /行业|板块/i], ["市场机会", /市场.{0,8}机会|机会.{0,8}市场/i], ["市场风险", /市场.{0,8}风险|风险.{0,8}市场/i],
  ["持仓结构", /持仓结构|持仓分析|仓位结构/i], ["基金推荐", /推荐.{0,8}基金|基金.{0,8}推荐|买什么基金|选什么基金/i],
  ["长期持有", /长期持有|持有时间|持有多久/i], ["资产配置", /资产配置|资金配置|资金规划/i], ["收益表现", /收益|年化|业绩表现/i],
  ["最大回撤", /最大回撤|回撤/i], ["基金净值", /基金.{0,5}净值|净值.{0,5}基金/i], ["基金经理", /基金经理/i], ["基金费率", /基金.{0,5}(?:费率|手续费)|(?:费率|手续费).{0,5}基金/i],
  ["定投计划", /定投/i], ["止盈策略", /止盈/i], ["赎回操作", /赎回|卖出/i], ["养老规划", /养老|退休/i], ["教育金规划", /教育金|子女教育/i],
  ["买房资金", /买房|购房/i], ["四笔钱", /四笔钱/i],
];
const STRATEGY_NAMES = ["周周同行", "长钱账户", "我要稳稳的幸福", "中西合璧", "春华秋实", "全球赢", "价值五剑", "海外长钱", "稳健长钱", "养老长钱"];
const FUND_COMPANIES = "易方达|华夏|南方|广发|富国|招商|汇添富|嘉实|博时|景顺长城|景顺|工银瑞信|工银|鹏华|中欧|华安|国泰|交银施罗德|交银|兴证全球|兴全|银华|天弘|华宝|摩根|大成|建信|融通|睿远|永赢|创金合信|万家|国投瑞银|农银汇理|中银|诺安|长城|前海开源|东方红";
const fundNamePattern = new RegExp(`(?:${FUND_COMPANIES})[A-Za-z0-9\\u4e00-\\u9fff·]{2,22}?(?=近|最|这|该|表现|收益|净值|基金经理|风险|怎么|怎样|为什么|是否|值得|适合|可以|能不能|会不会|好不好|能买吗|买入|卖出|赎回|和|与|还是|吗|呢|[，。？！、；：\\s]|$)`, "gi");

const compact = (value) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
const normalizePreset = (value) => compact(value).replace(/\s+/g, "").replace(/[‐‑‒–—―]/g, "-").replace(/[“”\"']/g, "");
const presetLookup = new Map();
for (const version of PRESET_VERSIONS) for (const [id, question] of version.questions) presetLookup.set(normalizePreset(question), { id, version: version.id, question });

const sql = `WITH nu AS (
  SELECT b.pmid, b.fb FROM (
    SELECT user_id AS pmid, MIN(created_at) AS fb
    FROM ying99_qieman.qwen_user_map WHERE is_deleted=0 GROUP BY user_id
    HAVING MIN(created_at)>='2026-08-03 00:00:00' AND MIN(created_at)<'${cutoff}'
  ) b JOIN ying99_pomodel.portfolio_manager_info p
    ON p.po_manager_id=b.pmid AND ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60
), session_map AS (
  SELECT DISTINCT s.qmuser_user_id,s.session_id FROM nu
  JOIN ying99_qieman.qwen_a2a_session_map s
    ON s.qmuser_user_id=nu.pmid AND s.is_deleted=0
   AND s.created_at>=nu.fb AND s.created_at<'${cutoff}'
)
SELECT CAST(nu.pmid AS CHAR) AS person_key,
  CAST(s.session_id AS CHAR) AS session_key,
  DATE_FORMAT(DATE_ADD(m.created_at, INTERVAL 8 HOUR), '%Y-%m-%d %H:%i:%s') AS local_time,
  REGEXP_REPLACE(TRIM(m.user_input), '[[:space:]]+', ' ') AS question
FROM nu JOIN session_map s ON s.qmuser_user_id=nu.pmid
JOIN ying99_xiaogu3_qa.agent_dj_messages m
  ON m.session_id=s.session_id AND m.is_deleted=0
 AND m.created_at>=nu.fb AND m.created_at<'${cutoff}'
WHERE m.user_input IS NOT NULL AND TRIM(m.user_input)<>''
ORDER BY nu.pmid,m.created_at,m.id`;

const request = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${redashUrl}${path}`, {
    method,
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Redash ${method} ${path} -> ${response.status}`);
  return response.json();
};

async function executeSql(query) {
  let response = await request("/api/query_results", {
    method: "POST",
    body: { query, data_source_id: dataSourceId, max_age: 0 },
  });
  if (!response.job?.id) {
    const rows = response.query_result?.data?.rows;
    if (!Array.isArray(rows)) throw new Error("Redash 返回结构异常");
    return rows;
  }
  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 2000));
    const job = (await request(`/api/jobs/${response.job.id}`)).job || {};
    if (job.status === 3) {
      response = await request(`/api/query_results/${job.query_result_id}`);
      const rows = response.query_result?.data?.rows;
      if (!Array.isArray(rows)) throw new Error("Redash 返回结构异常");
      return rows;
    }
    if (job.status === 4 || job.status === 5) throw new Error(`Redash 查询失败：${job.error || job.status}`);
  }
  throw new Error("Redash 查询超时");
}

const sourceRows = await executeSql(sql);
const marketRows = (await executeSql(`SELECT DATE_FORMAT(record_date, '%Y-%m-%d') AS date,
  CAST(price_close AS DOUBLE) AS close, CAST(return_day AS DOUBLE) AS return_day
FROM ying99_fdp.dwd_index_price_daily
WHERE index_code='000300' AND is_real=1
  AND record_date>='2026-09-01' AND record_date<DATE('${cutoff}')
ORDER BY record_date`)).map((row) => ({ date: String(row.date), close: Number(row.close), return_day: Number(row.return_day) }));

function redact(input) {
  let value = compact(input);
  value = value.replace(/https?:\/\/\S+|www\.\S+/gi, "[链接]");
  value = value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[邮箱]");
  value = value.replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "[手机号]");
  value = value.replace(/(?<!\d)\d{17}[0-9Xx](?!\d)/g, "[身份证]");
  value = value.replace(/(?<!\d)(?:\d[ -]?){12,19}(?!\d)/g, "[长号码]");
  value = value.replace(/\b(?:wxid_|openid[:：]?)[A-Za-z0-9_-]{6,}\b/gi, "[外部标识]");
  return value;
}

function extractProducts(question) {
  const products = new Map();
  for (const code of question.match(/(?<!\d)\d{6}(?!\d)/g) || []) products.set(code, { label: code, kind: "基金代码" });
  for (const strategy of STRATEGY_NAMES) if (question.includes(strategy)) products.set(strategy, { label: strategy, kind: "且慢策略" });
  fundNamePattern.lastIndex = 0;
  for (const match of question.matchAll(fundNamePattern)) {
    const label = compact(match[0]).replace(/(?:这只|这支|该只)$/g, "");
    if ([...label].length >= 4 && !/(?:基金公司|基金经理|旗下基金|哪些基金|一个基金|一只基金|银行|证券|保险|官网|客服)$/.test(label)) products.set(label, { label, kind: "基金名称" });
  }
  return [...products.values()];
}

const shortFollowups = new Set(["好","好的","继续","可以","是","是的","不是","谢谢","需要","要","明白了","知道了","嗯","对","行","1","2","3","？","?","收到","没了","不用了"]);
const isShortFollowup = (question) => shortFollowups.has(question) || [...question].length <= 2;
const test = (pattern, value) => pattern.test(value);

function hasSpecificProduct(question) {
  if (/(?:^|\D)\d{6}(?:\D|$)/.test(question)) return true;
  if (/(?:这只|这支|该只|这款)(?:基金|产品|组合|策略)/i.test(question)) return true;
  if (/(?:易方达|华夏|南方|广发|富国|招商|汇添富|嘉实|博时|景顺|工银|鹏华|中欧|华安|国泰|交银|兴全|银华|天弘|华宝|摩根|大成|建信|融通|睿远|永赢|创金合信|万家|国投瑞银|农银汇理|中银|上投摩根|诺安|长城|前海开源|东方红)[A-Za-z0-9\u4e00-\u9fff·]{2,24}/i.test(question)) return true;
  if (/[A-Za-z0-9\u4e00-\u9fff·]{2,22}(?:ETF|LOF|FOF)(?:联接)?[ACDEIY]?/i.test(question)) return true;
  return /[A-Za-z0-9\u4e00-\u9fff·]{4,24}(?:混合|债券|指数|股票|货币|成长|价值|优势|精选|优选|灵活配置)[ACDEIY](?:类)?(?:份额)?(?:$|[\s，。？！、])/i.test(question);
}

function classifyObject(question) {
  if (test(/持仓|账户|我的.*(?:基金|组合|账户|资产|收益|盈亏|成本|仓位|余额)|我.*(?:买了|持有|亏了|赚了|浮亏|成本|仓位)|(?:当前|现有|总).*(?:资产|仓位)|浮亏/, question)) return "own_account";
  if (test(/(?:养老|教育).{0,5}(?:产业|主题|指数|ETF|基金)|(?:产业|主题|指数|ETF|基金).{0,5}(?:养老|教育)/i, question)) return "fund_category";
  if (test(/养老|退休|教育|买房|购房|结婚|子女|家庭|目标|资金规划|现金流|四笔钱/, question)) return "goal_plan";
  if (test(/主动基金|指数基金|股票型|混合型|债券型|货币型|债基|货基|宽基|窄基|红利|QDII|行业基金|主题基金|基金类型|(?:AI|人工智能|科技|医药|消费|新能源|半导体|军工).{0,6}基金|基金.{0,6}(?:AI|人工智能|科技|医药|消费|新能源|半导体|军工)/i, question)) return "fund_category";
  if (hasSpecificProduct(question)) return "specific_product";
  if (test(/投顾策略|策略|组合|主理人|跟车|发车/, question)) return "strategy_portfolio";
  if (test(/A股|港股|美股|黄金|债券|商品|现金|原油|外汇|可转债|REITs|资产类别/i, question)) return "asset_class";
  if (test(/市场|行情|大盘|宏观|利率|政策|板块|行业|牛市|熊市|震荡|估值/i, question)) return "market_environment";
  if (test(/且慢|小顾|登录|功能|报告|卡片|APP|开户|绑卡/i, question)) return "platform_service";
  return "unspecified";
}

function classifyDirection(question, object) {
  if (isShortFollowup(question)) return "context_followup";
  if (object === "own_account" || test(/组合.*诊断|持仓.*建议/, question)) return "holding_diagnosis";
  if (object === "goal_plan" || test(/资产配置|配置方案|资金分配|长期规划|风险预算|每月.{0,8}(?:投|存)|长期投资|短期稳健|靠利息生活|存款.{0,6}利息|存定期|复投|仓位.{0,8}配置/, question)) return "asset_allocation";
  if (test(/买入|卖出|赎回|申购|加仓|减仓|补仓|止盈|止损|下单|调仓|定投|开户|绑卡|手续费|费率|取出|提现|充值|怎么买|如何买|怎么操作|如何操作|下一步操作|买卖点|进场|离场|清仓|满仓|建仓|挂单/, question)) return "transaction_execution";
  if (test(/推荐|筛选|买什么|选什么|哪只|哪个基金|哪些基金|哪些策略|适合我|候选|值得长期持有|(?:给我|帮我).*(?:产品|基金|策略)/, question)) return "product_selection";
  if (["specific_product", "fund_category", "strategy_portfolio"].includes(object) || test(/基金|ETF|净值|业绩|年化|基金经理/, question)) return "product_research";
  if (["market_environment", "asset_class"].includes(object) || test(/机会|风险|走势|行情|市场|宏观|板块|行业|利率|政策|牛市|熊市|大势|风口|股市|资金动向|金价|黄金|白银|美联储|CPI|PCE|非农|通胀|经济数据|汇率|美元|人民币|美债|国债|指数|恒指|纳指|标普|科创50|中证|地缘|利好|利空|涨跌|消息|事件/, question)) return "market_insight";
  if (test(/什么是|是什么意思|区别|原理|为什么|怎么判断|如何判断|解释|知识|入门|胜率|盈亏比|市净率|市盈率|\bPE\b|\bPB\b|复利|量比|MACD|RSI|K线|技术指标|交易系统|缠论|怎么看财报|怎样看财报/i, question)) return "investment_learning";
  if (object === "platform_service" || test(/小顾|且慢|你能|功能|怎么用|登录|报告|资讯|怎么发.{0,3}(?:图片|截图)|站内信|对账单|资产证明|授权|投顾费|哪个模型|你是谁|订阅/, question)) return "qieman_service";
  if (test(/进度|好了吗|完成了吗|结果.{0,4}(?:出来|生成|显示|有了|如何)|有结果|在运行|还在(?:运行|处理|分析|回测|吗)|卡住|继续推进|推进.{0,6}(?:回测|任务|进度)|继续回测|任务进度|不用回答|停止|固化记忆|更新.{0,3}(?:记忆|数据)|补进记忆|加入记忆|做.{0,3}记录|保存为|没显示|没看到|到第几步|请继续$|继续撰写|你补齐|还没好/, question)) return "task_status";
  if (test(/^(?:这个|那个|这些|那些|以上|前面|上面|刚才|第一|第二|第三|路径|方案|继续|再说|还有|然后|按.+来看|结合.+来看|同样|具体|哪一个|为什么|如何|怎么样|对比|展开|详细|重新|再来|换一个|就是|其他|下一个|那|所以|好的)/, question)
      || test(/你说的|前文|接着|继续分析|以上回答|刚才问|再看看|再分析|再查|再扫|呢[？?]?$/, question)) return "context_followup";
  if (test(/股票|个股|股价|炒股|涨停|跌停|财报|市值|上市|龙头|分红|认购|资本开支|产业链|CPO|PCB|半导体|芯片|算力|公司|概念股|股指|上证|深证|北证|创业板|科创板|恒生|道琼斯|纳斯达克|英伟达|阿里|小鹏|中芯|持有\d+股|换手|K线|技术面|基本面|买点|主线|CPI|期货|交割日|股份|科技|药业|集团|证券|矿业|材料|设备|光电|通信|电子|银行股|白银股|黄金股/i, question)
      || (/^[A-Za-z]{2,12}(?:\s|呢|怎么样|[？?])?$/i.test(question))) return "stock_research";
  if (test(/(?:我有|我的|本人|目前|现在|已经|刚刚|买过|持有|本金|预算|金额|期限|风险承受|不接受亏损|能承受|偏好|每月|每年|计划|目标|收入|支出|家庭|年龄|退休|闲钱|可投|想投|准备投|大概|大约|元$|万元$)/, question)) return "personal_context";
  if (test(/你好|吃的啥|开玩笑|数学|计算|等于|为何|谁发明|怎么产生|介绍一下|翻译|天气|作文|写诗|故事|游戏|电影|菜谱|星座|生肖|旅游|英语|雷电|蜗牛|冰屋|宇航|巧克力|井盖|心跳|互联网|排队|极限|latex|糖|大卡|大乐透|双色球|彩票|system prompt|API 密钥|认证 token|身份证号|手机号/i, question)
      || /^\p{Extended_Pictographic}/u.test(question)) return "non_investment";
  if (test(/投资|股票|基金|资金|本金|利息|股息|收益|回撤|风险|仓位|价格|涨|跌|买|卖|行业|公司|银行|经济|金融|黄金|白银|债|汇率|期权|期货|标的|交易|账户|持有|配置|储蓄|存款|贷款|保单|保险|房产|财务|估值|市盈|市净|PE|PB|ETF|指数|A股|港股|美股|科技|能源|材料/i, question)) return "other_investment";
  return "unclear_expression";
}

function classifyStyle(question) {
  if (isShortFollowup(question)) return "conversation_fragment";
  if (test(/对比|比较|区别|哪个好|哪一个|怎么选|如何选|还是|vs|VS/, question)) return "compare_choose";
  if (test(/为什么|原因|逻辑|背后|怎么回事|如何理解|解释/, question)) return "why_explain";
  if (test(/怎么操作|如何操作|怎么买|怎么卖|怎么赎回|步骤|在哪里|如何开|怎么办|怎么做|怎样做/, question)) return "how_to";
  if (test(/未来|后市|接下来|走势|预测|会不会|还能不能|机会|风险|涨跌|追高/, question)) return "forecast_risk";
  if (test(/诊断|分析|评估|怎么样|值得|适合|靠谱吗|好不好|贵不贵/, question)) return "diagnose_evaluate";
  if (test(/什么是|是什么意思|多少|哪里|何时|哪天|查询|告诉我|介绍一下/, question)) return "fact_lookup";
  if (test(/帮我|请|给我|推荐|给出|需要|想要|筛选/, question)) return "direct_request";
  return "conversation_fragment";
}

function classifyCognition(question) {
  if (test(/夏普|卡玛|索提诺|alpha|beta|阿尔法|贝塔|归因|相关性|标准差|波动率|久期|凸性|最大回撤|回撤修复|PE|PB|ROE|风险预算|再平衡|有效前沿|杜邦|实际利率/i, question)) return "advanced_signal";
  if (test(/估值|回撤|仓位|持仓|基金经理|费率|定投|资产配置|现金流|风险|年化|同类|持有时间|主动基金|指数基金|追高|止盈|止损/, question)) return "developing_signal";
  if (test(/什么是|是什么意思|看不懂|怎么买|怎么操作|入门|小白|推荐.*基金|买什么|净值.*贵/, question)) return "beginner_signal";
  return "indeterminate";
}

function classify(question) {
  const preset = presetLookup.get(normalizePreset(question)) || null;
  const object = classifyObject(question);
  return {
    preset,
    short: isShortFollowup(question),
    object,
    direction: classifyDirection(question, object),
    style: classifyStyle(question),
    cognition: classifyCognition(question),
  };
}

let redactedRows = 0;
const internalRows = sourceRows.map((row, index) => {
  const original = compact(row.question);
  const question = redact(original);
  if (question !== original) redactedRows += 1;
  const localTime = String(row.local_time ?? "").slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(localTime)) throw new Error(`时间格式异常：${row.local_time}`);
  const classified = classify(original);
  return {
    index: index + 1,
    person: String(row.person_key),
    session: String(row.session_key),
    localTime,
    day: localTime.slice(0, 10),
    timeMs: Date.parse(localTime.replace(" ", "T") + "+08:00"),
    original,
    question,
    ...classified,
  };
});

const byPerson = new Map();
const bySession = new Map();
for (const row of internalRows) {
  if (!byPerson.has(row.person)) byPerson.set(row.person, []);
  byPerson.get(row.person).push(row);
  const sessionKey = `${row.person}\u0000${row.session}`;
  if (!bySession.has(sessionKey)) bySession.set(sessionKey, []);
  bySession.get(sessionKey).push(row);
}
for (const rows of [...byPerson.values(), ...bySession.values()]) rows.sort((a, b) => a.timeMs - b.timeMs || a.index - b.index);

// 将同一会话中默认题之后的自发提问，归因到最近一次默认题。
// 只把默认题 id/version 写入脱敏密文，不写用户或会话标识。
for (const rows of bySession.values()) {
  let originPreset = null;
  let substantiveTurn = 0;
  for (const row of rows) {
    if (row.preset) originPreset = row.preset;
    else {
      if (originPreset) row.originPreset = originPreset;
      if (!row.short) {
        substantiveTurn += 1;
        row.substantiveTurn = substantiveTurn;
      }
    }
  }
}

// “追问”采用会话内定义：同一会话出现第 2 条及以上自发实质问题。
// 这能排除跨日重新发起的新问题，也不会把“好 / 继续”等极短承接误算成实质追问。
const followupPeople = new Set();
const followupSessionKeys = new Set();
const substantiveSessionKeys = new Set();
for (const [sessionKey, rows] of bySession) {
  const substantive = rows.filter((row) => !row.preset && !row.short);
  if (substantive.length) substantiveSessionKeys.add(sessionKey);
  if (substantive.length >= 2) {
    followupSessionKeys.add(sessionKey);
    followupPeople.add(rows[0].person);
  }
}
const personSubstantiveCounts = new Map([...byPerson].map(([person, rows]) => [person, rows.filter((row) => !row.preset && !row.short).length]));
for (const row of internalRows) row.engagement = followupPeople.has(row.person) ? "followup" : "no_followup";

const makeStats = (ids) => Object.fromEntries(ids.map((id) => [id, { questions: 0, users: new Set() }]));
function summarizeDimension(rows, key, ids) {
  const stats = makeStats(ids);
  for (const row of rows) {
    const id = row[key];
    if (!stats[id]) throw new Error(`未知 ${key}：${id}`);
    stats[id].questions += 1;
    stats[id].users.add(row.person);
  }
  return ids.map((id) => ({ id, questions: stats[id].questions, users: stats[id].users.size }));
}

function summarizeBuckets(items, ids, bucketFn, userFn = (item) => item.person) {
  const stats = makeStats(ids);
  for (const item of items) {
    const id = bucketFn(item);
    stats[id].questions += 1;
    stats[id].users.add(userFn(item));
  }
  return ids.map((id) => ({ id, count: stats[id].questions, users: stats[id].users.size }));
}

const presetRows = internalRows.filter((row) => row.preset);
const selfRows = internalRows.filter((row) => !row.preset);
const substantiveRows = selfRows.filter((row) => !row.short);
const substantiveUsers = new Set(substantiveRows.map((row) => row.person));
const selfUsers = new Set(selfRows.map((row) => row.person));
const presetUsers = new Set(presetRows.map((row) => row.person));

const firstRows = new Map([...byPerson].map(([person, rows]) => [person, rows[0]]));
for (const rows of bySession.values()) {
  let laterSelf = false;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    rows[index].hasLaterSelfInSession = rows[index].preset ? laterSelf : false;
    if (!rows[index].preset) laterSelf = true;
  }
}

const versions = PRESET_VERSIONS.map((version) => {
  const rows = presetRows.filter((row) => row.preset.version === version.id);
  const followRows = substantiveRows.filter((row) => row.originPreset?.version === version.id);
  const observedFrom = rows.length ? rows.map((row) => row.day).sort()[0] : null;
  const observedTo = rows.length ? rows.map((row) => row.day).sort().at(-1) : null;
  const windowAskers = new Set(internalRows.filter((row) => observedFrom && row.day >= observedFrom && row.day <= observedTo).map((row) => row.person));
  const userSet = new Set(rows.map((row) => row.person));
  const firstSet = new Set(rows.filter((row) => firstRows.get(row.person) === row).map((row) => row.person));
  const followSet = new Set(rows.filter((row) => row.hasLaterSelfInSession).map((row) => row.person));
  const questions = version.questions.map(([id, question]) => {
    const questionRows = rows.filter((row) => row.preset.id === id);
    const questionFollowRows = substantiveRows.filter((row) => row.originPreset?.id === id);
    const classifiedQuestion = classify(question);
    return {
      id,
      question,
      direction: classifiedQuestion.direction,
      clicks: questionRows.length,
      users: new Set(questionRows.map((row) => row.person)).size,
      first_question_users: new Set(questionRows.filter((row) => firstRows.get(row.person) === row).map((row) => row.person)).size,
      follow_on_users: new Set(questionRows.filter((row) => row.hasLaterSelfInSession).map((row) => row.person)).size,
      follow_on_questions: questionFollowRows.length,
      follow_on_directions: summarizeDimension(questionFollowRows, "direction", DIRECTION_IDS),
    };
  });
  return {
    id: version.id,
    label: version.label,
    evidence: version.evidence,
    observed_from: observedFrom,
    observed_to: observedTo,
    clicks: rows.length,
    users: userSet.size,
    first_question_users: firstSet.size,
    follow_on_users: followSet.size,
    follow_on_questions: followRows.length,
    follow_on_directions: summarizeDimension(followRows, "direction", DIRECTION_IDS),
    asker_proxy_denominator: windowAskers.size,
    questions,
  };
});

const personaStats = Object.fromEntries(PERSONA_IDS.map((id) => [id, { users: 0, questions: 0 }]));
const cognitionUserStats = Object.fromEntries(COGNITION_IDS.map((id) => [id, 0]));
const personaDirectionMap = {
  holding_diagnosis: "holding_optimizer",
  product_research: "product_decider",
  stock_research: "product_decider",
  product_selection: "product_decider",
  asset_allocation: "planning_allocator",
  market_insight: "market_tracker",
  transaction_execution: "execution_seeker",
  investment_learning: "learning_builder",
  qieman_service: "platform_explorer",
  task_status: "platform_explorer",
  personal_context: "planning_allocator",
  context_followup: "light_conversation",
  non_investment: "light_conversation",
  other_investment: "market_tracker",
  unclear_expression: "light_conversation",
};
const directionPriority = Object.fromEntries(DIRECTION_IDS.map((id, index) => [id, index]));
const cognitionPriority = Object.fromEntries(COGNITION_IDS.map((id, index) => [id, index]));
for (const rows of byPerson.values()) {
  const substantive = rows.filter((row) => !row.preset && !row.short);
  let persona;
  if (!substantive.length) persona = rows.some((row) => row.preset) ? "preset_only" : "light_conversation";
  else {
    const counts = Object.fromEntries(DIRECTION_IDS.map((id) => [id, 0]));
    substantive.forEach((row) => { counts[row.direction] += 1; });
    const dominant = [...DIRECTION_IDS].sort((a, b) => counts[b] - counts[a] || directionPriority[a] - directionPriority[b])[0];
    persona = personaDirectionMap[dominant];
    const cognitionCounts = Object.fromEntries(COGNITION_IDS.map((id) => [id, 0]));
    substantive.forEach((row) => { cognitionCounts[row.cognition] += 1; });
    const cognition = [...COGNITION_IDS].sort((a, b) => cognitionCounts[b] - cognitionCounts[a] || cognitionPriority[b] - cognitionPriority[a])[0];
    cognitionUserStats[cognition] += 1;
  }
  personaStats[persona].users += 1;
  personaStats[persona].questions += substantive.length;
}

const activeDayIds = ["1", "2", "3_7", "8_plus"];
const activeDays = summarizeBuckets([...byPerson.entries()].map(([person, rows]) => ({ person, value: new Set(rows.map((row) => row.day)).size })), activeDayIds,
  (item) => item.value === 1 ? "1" : item.value === 2 ? "2" : item.value <= 7 ? "3_7" : "8_plus");
const timeIds = ["00_06", "06_09", "09_12", "12_14", "14_18", "18_22", "22_24"];
const timeOfDay = summarizeBuckets(internalRows, timeIds, (row) => {
  const hour = Number(row.localTime.slice(11, 13));
  if (hour < 6) return "00_06";
  if (hour < 9) return "06_09";
  if (hour < 12) return "09_12";
  if (hour < 14) return "12_14";
  if (hour < 18) return "14_18";
  if (hour < 22) return "18_22";
  return "22_24";
});
const sessionIds = ["1", "2_3", "4_9", "10_plus"];
const sessionDepth = summarizeBuckets([...bySession.entries()].map(([key, rows]) => ({ person: rows[0].person, key, value: rows.length })), sessionIds,
  (item) => item.value === 1 ? "1" : item.value <= 3 ? "2_3" : item.value <= 9 ? "4_9" : "10_plus", (item) => item.person);
const gaps = [];
for (const [person, rows] of byPerson) for (let index = 1; index < rows.length; index += 1) gaps.push({ person, minutes: (rows[index].timeMs - rows[index - 1].timeMs) / 60000 });
const gapIds = ["lte_5m", "5_30m", "30m_1d", "gte_1d"];
const gapDistribution = summarizeBuckets(gaps, gapIds, (item) => item.minutes <= 5 ? "lte_5m" : item.minutes <= 30 ? "5_30m" : item.minutes < 1440 ? "30m_1d" : "gte_1d");

const transitionMap = new Map();
for (const rows of bySession.values()) {
  const sequence = rows.filter((row) => !row.preset && !row.short && !PATH_EXCLUDED_DIRECTIONS.has(row.direction))
    .map((row) => row.direction).filter((id, index, all) => index === 0 || id !== all[index - 1]);
  for (let index = 1; index < sequence.length; index += 1) {
    const key = `${sequence[index - 1]}>${sequence[index]}`;
    if (!transitionMap.has(key)) transitionMap.set(key, { from: sequence[index - 1], to: sequence[index], count: 0, users: new Set() });
    const item = transitionMap.get(key);
    item.count += 1;
    item.users.add(rows[0].person);
  }
}
const topTransitions = [...transitionMap.values()].sort((a, b) => b.count - a.count || b.users.size - a.users.size).slice(0, 12)
  .map((item) => ({ from: item.from, to: item.to, count: item.count, users: item.users.size }));
const sequenceMap = new Map();
for (const [person, rows] of byPerson) {
  const sequence = rows.filter((row) => !row.preset && !row.short && !PATH_EXCLUDED_DIRECTIONS.has(row.direction))
    .map((row) => row.direction).filter((id, index, all) => index === 0 || id !== all[index - 1]).slice(0, 3);
  if (sequence.length < 2) continue;
  const key = sequence.join(">");
  if (!sequenceMap.has(key)) sequenceMap.set(key, { path: sequence, users: new Set() });
  sequenceMap.get(key).users.add(person);
}
const topSequences = [...sequenceMap.values()].sort((a, b) => b.users.size - a.users.size).slice(0, 10)
  .map((item) => ({ path: item.path, users: item.users.size }));
const firstSubstantive = [];
for (const rows of byPerson.values()) {
  const first = rows.find((row) => !row.preset && !row.short);
  if (first) firstSubstantive.push(first);
}

const topQuestionMap = new Map();
for (const row of substantiveRows) {
  if (row.question !== row.original || [...row.question].length < 5 || [...row.question].length > 120) continue;
  if (!topQuestionMap.has(row.question)) topQuestionMap.set(row.question, { question: row.question, questions: 0, users: new Set(), direction: row.direction });
  const item = topQuestionMap.get(row.question);
  item.questions += 1;
  item.users.add(row.person);
}
const topSelfAuthored = [...topQuestionMap.values()].filter((item) => item.users.size >= 10)
  .sort((a, b) => b.questions - a.questions || b.users.size - a.users.size || a.question.localeCompare(b.question, "zh-CN"))
  .slice(0, 24).map((item, index) => ({ rank: index + 1, question: item.question, questions: item.questions, users: item.users.size, direction: item.direction }));

const keywordStats = new Map(KEYWORD_RULES.map(([label]) => [label, { label, questions: 0, users: new Set() }]));
const productStats = new Map();
const substantiveRowSet = new Set(substantiveRows);
for (const row of internalRows) {
  row.keywordLabels = [];
  row.productEntries = extractProducts(row.original);
  for (const [label, pattern] of KEYWORD_RULES) {
    if (!pattern.test(row.original)) continue;
    row.keywordLabels.push(label);
    if (!substantiveRowSet.has(row)) continue;
    const item = keywordStats.get(label);
    item.questions += 1;
    item.users.add(row.person);
  }
  if (!substantiveRowSet.has(row)) continue;
  for (const product of row.productEntries) {
    if (!productStats.has(product.label)) productStats.set(product.label, { ...product, questions: 0, users: new Set() });
    const item = productStats.get(product.label);
    item.questions += 1;
    item.users.add(row.person);
  }
}
const keywords = [...keywordStats.values()].filter((item) => item.questions > 0)
  .sort((a, b) => b.questions - a.questions || b.users.size - a.users.size)
  .map((item) => ({ label: item.label, questions: item.questions, users: item.users.size }));
const productCodes = [...productStats.values()].filter((item) => item.kind === "基金代码" && item.users.size >= 2).map((item) => item.label);
const fundNames = new Map();
if (productCodes.length) {
  const codeList = productCodes.map((code) => `'${code}'`).join(",");
  let fundResponse = await request("/api/query_results", {
    method: "POST",
    body: { query: `SELECT fund_code, MAX(fund_name) AS fund_name FROM ying99_fundtxn.fund_info WHERE fund_code IN (${codeList}) GROUP BY fund_code`, data_source_id: dataSourceId, max_age: 86400 },
  });
  if (fundResponse.job?.id) {
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((done) => setTimeout(done, 1500));
      const job = (await request(`/api/jobs/${fundResponse.job.id}`)).job || {};
      if (job.status === 3) { fundResponse = await request(`/api/query_results/${job.query_result_id}`); break; }
      if (job.status === 4 || job.status === 5) throw new Error(`基金名称查询失败：${job.error || job.status}`);
    }
  }
  for (const row of fundResponse.query_result?.data?.rows || []) if (row.fund_code && row.fund_name) fundNames.set(String(row.fund_code), compact(row.fund_name));
}
const products = [...productStats.values()].filter((item) => item.users.size >= 2)
  .sort((a, b) => b.users.size - a.users.size || b.questions - a.questions || a.label.localeCompare(b.label, "zh-CN"))
  .slice(0, 40).map((item) => ({
    label: item.kind === "基金代码" && fundNames.has(item.label) ? `${fundNames.get(item.label)}（${item.label}）` : item.label,
    query: item.label,
    kind: item.kind,
    questions: item.questions,
    users: item.users.size,
  }));

const canonicalProductLabel = (product) => product.kind === "基金代码" && fundNames.has(product.label)
  ? `${fundNames.get(product.label)}（${product.label}）`
  : product.label;
const weekStart = (day) => {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
};
function summarizeEntityRows(rows) {
  const keywordMap = new Map();
  const productMap = new Map();
  for (const row of rows) {
    for (const label of row.keywordLabels || []) {
      if (!keywordMap.has(label)) keywordMap.set(label, { label, questions: 0, users: new Set() });
      keywordMap.get(label).questions += 1;
      keywordMap.get(label).users.add(row.person);
    }
    for (const product of row.productEntries || []) {
      const label = canonicalProductLabel(product);
      if (!productMap.has(label)) productMap.set(label, { label, query: product.label, kind: product.kind, questions: 0, users: new Set() });
      productMap.get(label).questions += 1;
      productMap.get(label).users.add(row.person);
    }
  }
  const serialize = (items, minUsers = 1) => [...items.values()].filter((item) => item.users.size >= minUsers)
    .sort((a, b) => b.questions - a.questions || b.users.size - a.users.size || a.label.localeCompare(b.label, "zh-CN"))
    .slice(0, 24).map((item) => ({ ...item, users: item.users.size }));
  return { keywords: serialize(keywordMap), products: serialize(productMap, 2) };
}
function summarizeTime(rows, grain) {
  const groups = new Map();
  for (const row of rows) {
    const start = grain === "day" ? row.day : weekStart(row.day);
    if (!groups.has(start)) groups.set(start, []);
    groups.get(start).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, groupRows]) => {
    const observedDays = groupRows.map((row) => row.day).sort();
    return {
      start: observedDays[0],
      end: observedDays.at(-1),
      questions: groupRows.length,
      users: new Set(groupRows.map((row) => row.person)).size,
      sessions: new Set(groupRows.map((row) => `${row.person}\u0000${row.session}`)).size,
      directions: summarizeDimension(groupRows, "direction", DIRECTION_IDS),
    };
  });
}
const questionScopeRows = {
  all: internalRows,
  preset: presetRows,
  self: selfRows,
  substantive: substantiveRows,
};
const crossGroups = [];
for (const source of ["all", "preset", "self", "substantive"]) {
  for (const engagement of ["all", "no_followup", "followup"]) {
    const groupRows = questionScopeRows[source].filter((row) => engagement === "all" || row.engagement === engagement);
    crossGroups.push({
      id: `${source}:${engagement}`,
      source,
      engagement,
      questions: groupRows.length,
      users: new Set(groupRows.map((row) => row.person)).size,
      sessions: new Set(groupRows.map((row) => `${row.person}\u0000${row.session}`)).size,
      dimensions: {
        direction: summarizeDimension(groupRows, "direction", DIRECTION_IDS),
        object: summarizeDimension(groupRows, "object", OBJECT_IDS),
        style: summarizeDimension(groupRows, "style", STYLE_IDS),
        cognition: summarizeDimension(groupRows, "cognition", COGNITION_IDS),
      },
      entities: summarizeEntityRows(groupRows),
      daily: summarizeTime(groupRows, "day"),
      weekly: summarizeTime(groupRows, "week"),
    });
  }
}

const followupUserSubstantiveQuestions = [...followupPeople].reduce((total, person) => total + (personSubstantiveCounts.get(person) || 0), 0);
const questionDepthIds = ["1", "2_3", "4_9", "10_plus"];
const questionDepthStats = Object.fromEntries(questionDepthIds.map((id) => [id, { id, users: 0, questions: 0 }]));
for (const count of personSubstantiveCounts.values()) {
  if (!count) continue;
  const id = count === 1 ? "1" : count <= 3 ? "2_3" : count <= 9 ? "4_9" : "10_plus";
  questionDepthStats[id].users += 1;
  questionDepthStats[id].questions += count;
}
const journey = {
  observed_from: internalRows.map((row) => row.day).sort()[0] || null,
  observed_to: internalRows.map((row) => row.day).sort().at(-1) || null,
  asking_users: byPerson.size,
  conversation_sessions: bySession.size,
  user_question_turns: internalRows.length,
  preset_questions: presetRows.length,
  self_authored_questions: selfRows.length,
  substantive_questions: substantiveRows.length,
  short_followups: selfRows.length - substantiveRows.length,
  self_authored_users: selfUsers.size,
  substantive_users: substantiveUsers.size,
  substantive_sessions: substantiveSessionKeys.size,
  followup_users: followupPeople.size,
  followup_sessions: followupSessionKeys.size,
  no_followup_users: substantiveUsers.size - followupPeople.size,
  one_question_users: [...personSubstantiveCounts.values()].filter((count) => count === 1).length,
  multi_question_users: [...personSubstantiveCounts.values()].filter((count) => count >= 2).length,
  followup_user_substantive_questions: followupUserSubstantiveQuestions,
  average_questions_per_asking_user: internalRows.length / Math.max(1, byPerson.size),
  average_self_questions_per_self_user: selfRows.length / Math.max(1, selfUsers.size),
  average_substantive_questions_per_user: substantiveRows.length / Math.max(1, substantiveUsers.size),
  average_substantive_questions_per_followup_user: followupUserSubstantiveQuestions / Math.max(1, followupPeople.size),
  average_turns_per_session: internalRows.length / Math.max(1, bySession.size),
  question_depth: questionDepthIds.map((id) => questionDepthStats[id]),
};

const turnBucket = (turn) => turn === 1 ? "1" : turn === 2 ? "2" : turn === 3 ? "3" : turn <= 5 ? "4_5" : "6_plus";
const turnIds = ["1", "2", "3", "4_5", "6_plus"];
const turnLabels = { "1": "第 1 问", "2": "第 2 问", "3": "第 3 问", "4_5": "第 4–5 问", "6_plus": "第 6 问以上" };
const turnTransitions = Object.fromEntries(turnIds.map((id) => [id, new Map()]));
for (const rows of bySession.values()) {
  const turns = rows.filter((row) => !row.preset && !row.short);
  for (let index = 0; index < turns.length - 1; index += 1) {
    const current = turns[index];
    const next = turns[index + 1];
    current.nextDirection = next.direction;
    if (current.direction === next.direction || PATH_EXCLUDED_DIRECTIONS.has(current.direction) || PATH_EXCLUDED_DIRECTIONS.has(next.direction)) continue;
    const bucket = turnBucket(current.substantiveTurn);
    const key = `${current.direction}>${next.direction}`;
    if (!turnTransitions[bucket].has(key)) turnTransitions[bucket].set(key, { from: current.direction, to: next.direction, count: 0, users: new Set() });
    const item = turnTransitions[bucket].get(key);
    item.count += 1;
    item.users.add(current.person);
  }
}
const turnAnalysis = turnIds.map((id) => {
  const rows = substantiveRows.filter((row) => turnBucket(row.substantiveTurn) === id);
  return {
    id,
    label: turnLabels[id],
    questions: rows.length,
    users: new Set(rows.map((row) => row.person)).size,
    directions: summarizeDimension(rows, "direction", DIRECTION_IDS),
    transitions: [...turnTransitions[id].values()].sort((a, b) => b.count - a.count || b.users.size - a.users.size).slice(0, 12)
      .map((item) => ({ from: item.from, to: item.to, count: item.count, users: item.users.size })),
  };
});

const research = {
  schema_version: "qianwen-question-research-v2",
  as_of: cutoff.replace(" ", "T") + "+08:00",
  methodology: {
    taxonomy: "rule-based-multiaxis-v2",
    corpus_scope: "new_users_after_first_binding",
    self_authored_definition: "all_questions_excluding_recognized_default_questions",
    substantive_definition: "self_authored_excluding_short_dialogue_followups",
    persona_note: "behavioral_archetype_from_question_signals_not_personal_financial_profile",
    cognition_note: "language_signal_not_verified_investment_knowledge",
    preset_ctr_note: "no_impression_log_asker_reach_is_proxy_not_true_ctr",
    followup_definition: "same_session_second_or_later_self_authored_substantive_question",
    direction_other_split: "stock_research_task_status_personal_context_context_followup_non_investment_other_investment_unclear_expression",
  },
  market_context: {
    index_code: "000300.CSI",
    index_name: "沪深300",
    source: "盈米指数行情日线",
    completed_trading_days_only: true,
    daily: marketRows,
  },
  journey,
  cross_analysis: {
    sources: ["all", "preset", "self", "substantive"],
    engagements: ["all", "no_followup", "followup"],
    groups: crossGroups,
  },
  summary: {
    questions: internalRows.length,
    asking_users: byPerson.size,
    sessions: bySession.size,
    preset_questions: presetRows.length,
    preset_users: presetUsers.size,
    preset_first_users: new Set([...firstRows.values()].filter((row) => row.preset).map((row) => row.person)).size,
    self_authored_questions: selfRows.length,
    self_authored_users: selfUsers.size,
    substantive_questions: substantiveRows.length,
    substantive_users: substantiveUsers.size,
    short_followups: selfRows.filter((row) => row.short).length,
    preset_only_users: [...byPerson.values()].filter((rows) => rows.some((row) => row.preset) && rows.every((row) => row.preset)).length,
    preset_follow_on_users: new Set(presetRows.filter((row) => row.hasLaterSelfInSession).map((row) => row.person)).size,
    preset_follow_on_questions: substantiveRows.filter((row) => row.originPreset).length,
  },
  presets: {
    true_impressions_available: false,
    rate_metric: "unique_click_users_divided_by_asking_users_in_observed_window",
    directions: DIRECTION_IDS.map((id) => {
      const rows = presetRows.filter((row) => row.direction === id);
      return {
        id,
        clicks: rows.length,
        users: new Set(rows.map((row) => row.person)).size,
        first_question_users: new Set(rows.filter((row) => firstRows.get(row.person) === row).map((row) => row.person)).size,
        follow_on_users: new Set(rows.filter((row) => row.hasLaterSelfInSession).map((row) => row.person)).size,
      };
    }),
    follow_on_directions: summarizeDimension(substantiveRows.filter((row) => row.originPreset), "direction", DIRECTION_IDS),
    versions,
  },
  dimensions: {
    direction: summarizeDimension(substantiveRows, "direction", DIRECTION_IDS),
    first_direction: summarizeDimension(firstSubstantive, "direction", DIRECTION_IDS),
    object: summarizeDimension(substantiveRows, "object", OBJECT_IDS),
    style: summarizeDimension(substantiveRows, "style", STYLE_IDS),
    cognition: summarizeDimension(substantiveRows, "cognition", COGNITION_IDS),
  },
  personas: PERSONA_IDS.map((id) => ({ id, users: personaStats[id].users, questions: personaStats[id].questions })),
  user_cognition: COGNITION_IDS.map((id) => ({ id, users: cognitionUserStats[id] })),
  rhythm: { active_days: activeDays, time_of_day: timeOfDay, session_depth: sessionDepth, gaps: gapDistribution },
  paths: { transitions: topTransitions, sequences: topSequences },
  entities: { product_min_users: 2, keywords, products },
  turn_analysis: { buckets: turnAnalysis },
  top_self_authored: topSelfAuthored,
};

const rows = internalRows.map((row) => ({
  i: row.index,
  d: row.day,
  t: row.direction,
  o: row.object,
  f: row.style,
  c: row.cognition,
  s: row.short ? 1 : 0,
  p: row.preset?.id || "",
  v: row.preset?.version || "",
  r: row.originPreset?.id || "",
  w: row.originPreset?.version || "",
  e: row.engagement,
  u: row.substantiveTurn || 0,
  n: row.nextDirection || "",
  q: row.question,
}));
const directionCounts = Object.fromEntries(DIRECTION_IDS.map((id) => [id, rows.filter((row) => row.t === id).length]));
const plainObject = {
  schema_version: "qianwen-question-corpus-v2",
  meta: {
    data_cutoff: research.as_of,
    questions: rows.length,
    redacted_rows: redactedRows,
    identity_fields: "none",
    date_timezone: "Asia/Shanghai",
    taxonomy: "rule-based-multiaxis-v2",
    default_questions: presetRows.length,
    self_authored_questions: selfRows.length,
    direction_counts: directionCounts,
  },
  rows,
};
const plain = JSON.stringify(plainObject);
const encoder = new TextEncoder();
const compressed = gzipSync(encoder.encode(plain), { level: 9 });
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 310000;
const material = await webcrypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await webcrypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
  material, { name: "AES-GCM", length: 256 }, false, ["encrypt"],
);
const data = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, compressed));
const envelope = {
  schema_version: "qianwen-question-corpus-envelope-v2",
  meta: {
    data_cutoff: plainObject.meta.data_cutoff,
    questions: rows.length,
    redacted_rows: redactedRows,
    default_questions: presetRows.length,
    self_authored_questions: selfRows.length,
    plaintext_sha256: createHash("sha256").update(plain).digest("hex"),
  },
  iterations,
  compression: "gzip",
  salt: Buffer.from(salt).toString("base64"),
  iv: Buffer.from(iv).toString("base64"),
  data: Buffer.from(data).toString("base64"),
};
await mkdir(dirname(resolve(output)), { recursive: true });
await mkdir(dirname(resolve(researchOutput)), { recursive: true });
await writeFile(output, JSON.stringify(envelope) + "\n", { mode: 0o600 });
await writeFile(researchOutput, JSON.stringify(research, null, 2) + "\n", { mode: 0o600 });
console.log(`OK questions=${rows.length} self=${selfRows.length} substantive=${substantiveRows.length} presets=${presetRows.length} redacted=${redactedRows}`);
