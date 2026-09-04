import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const redashUrl = process.env.REDASH_URL || "https://zhu.yingmi-inc.com";
const skipKey = "479c9d2e-4d05-4098-bd72-994c82e0fd22";
const slug = "oap-channel-attribution-dashboard-2026-09-04";
const args = new Set(process.argv.slice(2));

if (!process.env.REDASH_API_KEY) throw new Error("REDASH_API_KEY is missing");

const headers = {
  Authorization: `Key ${process.env.REDASH_API_KEY}`,
  "Content-Type": "application/json",
};

async function query(sql) {
  const response = await fetch(`${redashUrl}/api/query_results`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: sql, data_source_id: 41, max_age: 0 }),
  });
  if (!response.ok) throw new Error(`Redash POST ${response.status}: ${(await response.text()).slice(0, 240)}`);
  let body = await response.json();
  if (body.job) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const jobResponse = await fetch(`${redashUrl}/api/jobs/${body.job.id}`, { headers });
      const job = (await jobResponse.json()).job;
      if (job.status === 3) {
        const result = await fetch(`${redashUrl}/api/query_results/${job.query_result_id}`, { headers });
        body = await result.json();
        break;
      }
      if (job.status === 4 || job.status === 5) throw new Error(job.error || "Redash query failed");
    }
  }
  if (!body.query_result) throw new Error("Redash query timed out");
  return body.query_result.data.rows;
}

const categoryCase = `CASE
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'qianwen|千问|tongyi|通义' THEN '千问'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'dify' THEN 'Dify'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'coze|扣子' THEN 'Coze / 扣子'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'vesta' THEN 'Vesta'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'doubao|豆包|trae|字节' THEN '豆包 / 字节'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'wechat|微信' THEN '微信'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'workbuddy|codebuddy|工作伙伴' THEN 'WorkBuddy'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'cursor' THEN 'Cursor'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'claude' THEN 'Claude'
  WHEN LOWER(CONCAT_WS(' ',k.name,k.description)) REGEXP 'chatgpt|codex|openai' THEN 'ChatGPT / Codex'
  ELSE '未标注平台'
END`;

const [clock] = await query("SELECT NOW() generated_at");
const cutoff = String(clock.generated_at).replace("T", " ").slice(0, 19);
const cutoffDate = cutoff.slice(0, 10);

const platformRowsPromise = query(`
  SELECT channel_hint, COUNT(DISTINCT id) api_keys,
    COUNT(DISTINCT CASE WHEN calls_30d>0 THEN id END) active_keys_30d,
    SUM(calls_30d) calls_30d, MAX(last_call_date) last_call_date
  FROM (
    SELECT k.id, ${categoryCase} channel_hint, COUNT(u.id) calls_30d,
      MAX(DATE(u.request_at)) last_call_date
    FROM ying99_oap.api_key k
    LEFT JOIN ying99_oap.api_key_usage_details u ON u.api_key_id=k.id
      AND u.request_at>=DATE_SUB('${cutoff}',INTERVAL 30 DAY) AND u.request_at<'${cutoff}'
    WHERE k.id<>'${skipKey}'
    GROUP BY k.id,channel_hint
  ) x
  GROUP BY channel_hint
  ORDER BY calls_30d DESC,api_keys DESC
`);

const trendRowsPromise = query(`
  SELECT DATE(u.request_at) d,
    SUM((${categoryCase})='千问') qianwen_calls,
    SUM((${categoryCase}) NOT IN ('千问','未标注平台')) other_identified_calls,
    SUM((${categoryCase})='未标注平台') unattributed_calls
  FROM ying99_oap.api_key_usage_details u
  JOIN ying99_oap.api_key k ON k.id=u.api_key_id
  WHERE u.api_key_id<>'${skipKey}'
    AND u.request_at>=DATE_SUB('${cutoff}',INTERVAL 30 DAY) AND u.request_at<'${cutoff}'
  GROUP BY DATE(u.request_at)
  ORDER BY d
`);

const oauthRowsPromise = query(`
  SELECT c.client_name, c.status, COUNT(DISTINCT r.user_id) current_users,
    MIN(DATE(r.granted_at)) first_authorized_date,
    MAX(DATE(r.granted_at)) last_authorized_date
  FROM ying99_oap.api_oauth_client c
  LEFT JOIN ying99_oap.api_user_consent_record r ON r.client_id=c.client_id
    AND r.revoked_at IS NULL AND r.superseded_at IS NULL
  GROUP BY c.id,c.client_name,c.status
  ORDER BY current_users DESC
`);

const openChannelRowsPromise = query(`
  SELECT oc.name open_channel, oc.slug,
    COUNT(DISTINCT r.user_id) current_users,
    COUNT(DISTINCT r.client_id) clients
  FROM ying99_oap.api_open_channel oc
  LEFT JOIN ying99_oap.api_user_consent_record r ON r.open_channel_id=oc.id
    AND r.revoked_at IS NULL AND r.superseded_at IS NULL
  GROUP BY oc.id,oc.name,oc.slug
  ORDER BY current_users DESC
`);

const coveragePromise = query(`
  SELECT
    COUNT(DISTINCT k.id) api_keys,
    COUNT(DISTINCT CASE WHEN k.user_id IS NOT NULL THEN k.id END) keys_with_user,
    COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN k.id END) keys_with_application,
    COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN k.id END) keys_joining_consent_user,
    COUNT(DISTINCT CASE WHEN a.platform_type='0008' THEN k.id END) broker_0008_keys
  FROM ying99_oap.api_key k
  LEFT JOIN ying99_oap.api_access_application a ON a.api_key_id=k.id
  LEFT JOIN ying99_oap.api_user_consent_record r ON r.user_id=k.user_id
  WHERE k.id<>'${skipKey}'
`);

const oauthTotalPromise = query(`
  SELECT COUNT(DISTINCT r.user_id) registered_client_users
  FROM ying99_oap.api_user_consent_record r
  JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
  WHERE r.revoked_at IS NULL AND r.superseded_at IS NULL
`);

const [platformRows, trendRows, oauthRows, openChannelRows, coverageRows, oauthTotalRows] = await Promise.all([
  platformRowsPromise,
  trendRowsPromise,
  oauthRowsPromise,
  openChannelRowsPromise,
  coveragePromise,
  oauthTotalPromise,
]);
const [coverage] = coverageRows;
const [oauthTotal] = oauthTotalRows;

const value = (row, key) => Number(row?.[key] || 0);
const platforms = platformRows.map((row) => ({
  platform: row.channel_hint,
  apiKeys: value(row, "api_keys"),
  activeKeys30d: value(row, "active_keys_30d"),
  calls30d: value(row, "calls_30d"),
  lastCallDate: row.last_call_date || null,
}));
const unknown = platforms.find((row) => row.platform === "未标注平台");
const totals = platforms.reduce((acc, row) => ({
  apiKeys: acc.apiKeys + row.apiKeys,
  activeKeys30d: acc.activeKeys30d + row.activeKeys30d,
  calls30d: acc.calls30d + row.calls30d,
}), { apiKeys: 0, activeKeys30d: 0, calls30d: 0 });
const pct = (numerator, denominator) => denominator ? Number((numerator / denominator * 100).toFixed(1)) : 0;
const suppressUserCell = (count) => count > 0 && count < 5
  ? { currentUsers: null, currentUsersDisplay: "<5" }
  : { currentUsers: count, currentUsersDisplay: String(count) };

const payload = {
  schema: "oap-channel-attribution/v1",
  generatedAt: `${cutoff.replace(" ", "T")}+08:00`,
  asOf: cutoffDate,
  timezone: "Asia/Shanghai",
  partialDay: true,
  window: {
    start: new Date(`${cutoff.replace(" ", "T")}+08:00`).getTime() - 30 * 86400e3,
    end: `${cutoff.replace(" ", "T")}+08:00`,
    label: "滚动近 30 日",
  },
  totals,
  coverage: {
    identifiedCalls: totals.calls30d - value(unknown, "calls30d"),
    identifiedActiveKeys: totals.activeKeys30d - value(unknown, "activeKeys30d"),
    callAttributionRate: pct(totals.calls30d - value(unknown, "calls30d"), totals.calls30d),
    activeKeyAttributionRate: pct(totals.activeKeys30d - value(unknown, "activeKeys30d"), totals.activeKeys30d),
    keysWithUser: value(coverage, "keys_with_user"),
    keysWithApplication: value(coverage, "keys_with_application"),
    keysJoiningConsentUser: value(coverage, "keys_joining_consent_user"),
    broker0008Keys: value(coverage, "broker_0008_keys"),
  },
  registeredClientUsers: value(oauthTotal, "registered_client_users"),
  platforms,
  oauthClients: oauthRows.map((row) => ({
    client: row.client_name,
    status: row.status,
    ...suppressUserCell(value(row, "current_users")),
    firstAuthorizedDate: row.first_authorized_date || null,
    lastAuthorizedDate: row.last_authorized_date || null,
  })),
  openChannels: openChannelRows.map((row) => ({
    channel: row.open_channel,
    slug: row.slug,
    clients: value(row, "clients"),
    ...suppressUserCell(value(row, "current_users")),
  })),
  trend: trendRows.map((row) => ({
    date: String(row.d).slice(0, 10),
    qianwen: value(row, "qianwen_calls"),
    otherIdentified: value(row, "other_identified_calls"),
    unattributed: value(row, "unattributed_calls"),
  })),
  evidence: {
    calls: "ying99_oap.api_key_usage_details × api_key；只统计成功落账调用，排除内部测试 Key",
    oauth: "api_user_consent_record × api_oauth_client；按 user_id 去重，只展示当前未撤销且未被替代的授权",
    openChannels: "api_user_consent_record × api_open_channel；它是身份/产品通道，不等于客户端平台",
    classification: "平台归类来自 api_key.name + description 的关键词；未使用 platform_type=0008，因为 0008 是且慢 broker 代码，不是来源平台",
  },
};

if (payload.totals.calls30d !== payload.trend.reduce((sum, row) => sum + row.qianwen + row.otherIdentified + row.unattributed, 0)) {
  throw new Error("Trend total does not reconcile to the platform total");
}
if (!payload.platforms.some((row) => row.platform === "千问")) throw new Error("Missing Qianwen platform row");

for (const base of ["public", "docs"]) {
  const dir = join(root, base, "reports", slug, "data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "latest.json"), `${JSON.stringify(payload, null, 2)}\n`);
}

console.log(`synced ${slug}: asOf=${payload.asOf} calls=${payload.totals.calls30d} activeKeys=${payload.totals.activeKeys30d} callCoverage=${payload.coverage.callAttributionRate}%`);

if (args.has("--push")) {
  const git = (...command) => execFileSync("git", command, { cwd: root, encoding: "utf8" });
  git("add", `public/reports/${slug}/data/latest.json`, `docs/reports/${slug}/data/latest.json`);
  if (git("diff", "--cached", "--name-only").trim()) {
    git("commit", "-m", `data(oap): refresh channel attribution to ${payload.asOf}`);
    git("push", "origin", "HEAD:main");
  }
}
