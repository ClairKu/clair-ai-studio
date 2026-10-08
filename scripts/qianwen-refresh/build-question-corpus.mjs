/**
 * 只读拉取千问新用户的原始提问，在内存中去标识、脱敏并加密后落盘。
 * 产物不含用户/会话 ID，也不产生明文中间文件。
 */
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const cutoff = process.env.QW_CUT;
const output = process.env.QW_QUESTION_OUT;
const apiKey = process.env.REDASH_API_KEY;
const redashUrl = (process.env.REDASH_URL || "https://zhu.yingmi-inc.com").replace(/\/$/, "");
const password = process.env.REPORT_PASSWORD || "2026";
const dataSourceId = Number(process.env.REDASH_DATA_SOURCE_ID || 41);
if (!cutoff || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cutoff)) throw new Error("缺少合法 QW_CUT");
if (!output) throw new Error("缺少 QW_QUESTION_OUT");
if (!apiKey) throw new Error("缺少 REDASH_API_KEY");

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
SELECT DATE(DATE_ADD(m.created_at, INTERVAL 8 HOUR)) AS question_day,
  REGEXP_REPLACE(TRIM(m.user_input), '[[:space:]]+', ' ') AS question
FROM nu JOIN session_map s ON s.qmuser_user_id=nu.pmid
JOIN ying99_xiaogu3_qa.agent_dj_messages m
  ON m.session_id=s.session_id AND m.is_deleted=0
 AND m.created_at>=nu.fb AND m.created_at<'${cutoff}'
WHERE m.user_input IS NOT NULL AND TRIM(m.user_input)<>''
ORDER BY m.created_at,m.id`;

const request = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${redashUrl}${path}`, {
    method,
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Redash ${method} ${path} -> ${response.status}`);
  return response.json();
};

let response = await request("/api/query_results", {
  method: "POST",
  body: { query: sql, data_source_id: dataSourceId, max_age: 0 },
});
if (response.job?.id) {
  const deadline = Date.now() + 12 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 2000));
    const job = (await request(`/api/jobs/${response.job.id}`)).job || {};
    if (job.status === 3) {
      response = await request(`/api/query_results/${job.query_result_id}`);
      break;
    }
    if (job.status === 4 || job.status === 5) throw new Error(`Redash 查询失败：${job.error || job.status}`);
  }
}
const sourceRows = response.query_result?.data?.rows;
if (!Array.isArray(sourceRows)) throw new Error("Redash 查询超时或返回结构异常");

const compact = (value) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
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

const shortFollowups = new Set(["好","好的","继续","可以","是","是的","不是","谢谢","需要","要","明白了","知道了","嗯","对","行","1","2","？","?"]);
const rules = [
  ["holding_account", /持仓|我的.*基金|账户|资产|收益|盈亏|亏损|浮亏|回撤|仓位|余额|成本|组合.*诊断/i],
  ["transaction_action", /买入|卖出|赎回|申购|加仓|减仓|补仓|止盈|止损|下单|调仓|定投|开户|绑卡|交易|费率|手续费|取出|提现|充值/i],
  ["planning_configuration", /资金规划|资产配置|配置方案|四笔钱|养老|退休|教育|买房|目标|现金流|家庭|闲钱|长期增值|稳健/i],
  ["product_selection", /推荐|热门|选品|筛选|值得长期|哪些基金|哪些策略|适合我|买什么|哪只|哪个基金|候选/i],
  ["product_analysis", /基金|策略|指数|债基|货基|ETF|净值|主理人|年化|业绩|估值/i],
  ["market_research", /市场|行情|A股|港股|美股|黄金|债券|板块|行业|宏观|利率|政策|牛市|熊市|机会|风险/i],
  ["knowledge_explain", /什么是|是什么意思|区别|怎么看|为什么|如何判断|怎么判断|介绍一下|解释|知识|原理/i],
  ["report_information", /简报|报告|新闻|资讯|研报|文档/i],
  ["qieman_service", /小顾|且慢|你能|能不能|会不会|功能|怎么用|登录/i],
];
function classify(question) {
  if (shortFollowups.has(question) || [...question].length <= 2) return "dialogue_followup";
  return rules.find(([, pattern]) => pattern.test(question))?.[0] || "other_expression";
}

let redactedRows = 0;
const rows = sourceRows.map((row, index) => {
  const original = compact(row.question);
  const question = redact(original);
  if (question !== original) redactedRows += 1;
  return { i: index + 1, d: String(row.question_day).slice(0, 10), t: classify(original), q: question };
});
const topicCounts = Object.fromEntries([...new Set(rows.map((row) => row.t))].sort().map((topic) => [topic, rows.filter((row) => row.t === topic).length]));
const plainObject = {
  schema_version: "qianwen-question-corpus-v1",
  meta: {
    data_cutoff: cutoff.replace(" ", "T") + "+08:00",
    questions: rows.length,
    redacted_rows: redactedRows,
    identity_fields: "none",
    date_timezone: "Asia/Shanghai",
    topic_model: "keyword-primary-intent-v1",
    topic_counts: topicCounts,
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
  schema_version: "qianwen-question-corpus-envelope-v1",
  meta: {
    data_cutoff: plainObject.meta.data_cutoff,
    questions: rows.length,
    redacted_rows: redactedRows,
    plaintext_sha256: createHash("sha256").update(plain).digest("hex"),
  },
  iterations,
  compression: "gzip",
  salt: Buffer.from(salt).toString("base64"),
  iv: Buffer.from(iv).toString("base64"),
  data: Buffer.from(data).toString("base64"),
};
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(output, JSON.stringify(envelope) + "\n", { mode: 0o600 });
console.log(`OK questions=${rows.length} redacted_rows=${redactedRows} output=${output}`);
