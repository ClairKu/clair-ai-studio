import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const redashUrl = process.env.REDASH_URL || "https://zhu.yingmi-inc.com";
const slug = "doubao-qieman-user-dashboard";

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
    for (let attempt = 0; attempt < 360; attempt += 1) {
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

const number = (row, key) => Number(row?.[key] || 0);
const [clock] = await query("SELECT DATE_FORMAT(NOW(),'%Y-%m-%d %H:%i:%s') cutoff");
const cutoff = clock.cutoff;
const cutoffDate = cutoff.slice(0, 10);
const [snapshot] = await query(`
  SELECT MAX(cal_date) asset_date
  FROM ying99_asset.dwd_app_service_account_profit_combine
  WHERE relation_account_type='ROOT' AND broker='0008' AND cal_date<DATE('${cutoff}')
`);
const assetDate = String(snapshot.asset_date).slice(0, 10);

const base = `
  SELECT b.pmid,b.fb,p.account3_id,p.gender,p.bank_no,p.unionid,p.register_location,p.birthday_del,
    (p.bank_no IS NOT NULL AND p.bank_no<>'') AS eligible,
    CASE WHEN p.registered_at IS NULL THEN 'unclassified'
      WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new'
      ELSE 'existing' END AS cohort
  FROM (
    SELECT CAST(r.user_id AS UNSIGNED) pmid,MIN(r.granted_at) fb
    FROM ying99_oap.api_user_consent_record r
    JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
    WHERE c.client_name='豆包' AND r.granted_at<'${cutoff}'
    GROUP BY r.user_id
  ) b
  JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid
`;

const readyBase = `
  SELECT CAST(r.user_id AS UNSIGNED) pmid,MIN(t.created_at) first_ready_at,
    p.account_id,p.account3_id,p.account_created_at
  FROM ying99_oap.api_user_consent_record r
  JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
  JOIN ying99_oap.api_oauth_refresh_token t ON t.consent_record_id=r.id
  JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=CAST(r.user_id AS UNSIGNED)
  WHERE c.client_name='豆包' AND t.created_at<'${cutoff}'
  GROUP BY r.user_id,p.account_id,p.account3_id,p.account_created_at
`;

const dailyRows = await query(`
  SELECT DATE(u.fb) d,SUM(u.cohort='new') new_cnt,SUM(u.cohort='existing') existing_cnt,
    SUM(u.cohort='unclassified') unclassified_cnt,COUNT(*) total
  FROM (${base}) u GROUP BY DATE(u.fb) ORDER BY d
`);

const [profileRows, assetRows, behaviorRows, provinceRows, authRows] = await Promise.all([
  query(`
    SELECT u.cohort,COUNT(*) population,SUM(u.gender='M') male,SUM(u.gender='F') female,
      SUM(u.age<=25) age_lte25,SUM(u.age BETWEEN 26 AND 35) age_26_35,
      SUM(u.age BETWEEN 36 AND 45) age_36_45,SUM(u.age BETWEEN 46 AND 55) age_46_55,
      SUM(u.age BETWEEN 56 AND 65) age_56_65,SUM(u.age>=66) age_gte66,
      SUM(u.unionid IS NOT NULL AND u.unionid<>'') wechat_bound,SUM(u.eligible) bank_card_bound,
      SUM(EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0
        AND t.buy_amount>0 AND t.po_code<>'WALLET')) ever_invested,
      SUM(EXISTS(SELECT 1 FROM qm_meta.user_survey_record_latest s WHERE s.broker='0008'
        AND s.account3_id=CAST(u.account3_id AS CHAR)
        AND s.answer_time>='2026-05-10 00:00:00' AND s.answer_time<'${cutoff}')) risk_assessed
    FROM (SELECT x.*,CASE WHEN CHAR_LENGTH(x.birthday_del)=8
      THEN TIMESTAMPDIFF(YEAR,STR_TO_DATE(x.birthday_del,'%Y%m%d'),'${cutoffDate}') END age FROM (${base}) x) u
    GROUP BY u.cohort ORDER BY u.cohort
  `),
  query(`
    SELECT u.cohort,COUNT(*) opened_accounts,SUM(a.total_asset IS NULL OR a.total_asset<=0) no_assets,
      SUM(a.total_asset>0 AND a.total_asset<10000) lt_10k,
      SUM(a.total_asset>=10000 AND a.total_asset<100000) between_10k_100k,
      SUM(a.total_asset>=100000 AND a.total_asset<1000000) between_100k_1m,
      SUM(a.total_asset>=1000000) gte_1m,SUM(a.total_asset>0) has_assets,
      ROUND(SUM(CASE WHEN a.total_asset>0 THEN a.total_asset ELSE 0 END)/10000,2) holding_wan
    FROM (${base}) u
    LEFT JOIN (
      SELECT account3_id,SUM(total_asset) total_asset
      FROM ying99_asset.dwd_app_service_account_profit_combine USE INDEX(idx_cal_date_saId)
      WHERE cal_date='${assetDate}' AND broker='0008' AND relation_account_type='ROOT' GROUP BY account3_id
    ) a ON a.account3_id=u.account3_id
    WHERE u.account3_id IS NOT NULL AND u.account3_id<>1002
    GROUP BY u.cohort ORDER BY u.cohort
  `),
  query(`
    SELECT u.cohort,SUM(u.eligible) eligible,
      SUM(u.eligible AND EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid
        AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET'
        AND t.accept_time>=u.fb AND t.accept_time<'${cutoff}')) buy_after,
      SUM(u.eligible AND (SELECT MIN(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid
        AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET')>u.fb) first_investment_after,
      SUM(u.eligible AND EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid
        AND t.canceled=0 AND t.redeem_amount>0 AND t.accept_time>=u.fb AND t.accept_time<'${cutoff}')) redeem_after,
      SUM(u.eligible AND (SELECT SUM(d.input_amount)
        FROM ying99_asset.dwd_app_service_account_profit_combine d
        WHERE d.account3_id=u.account3_id AND d.relation_account_type='ROOT'
          AND d.cal_date>=DATE(u.fb) AND d.cal_date<='${assetDate}')>0) funded_after,
      SUM(u.eligible AND NOT EXISTS(SELECT 1 FROM ying99_asset.dwd_app_service_account_profit_combine d
        WHERE d.account3_id=u.account3_id AND d.relation_account_type='ROOT')) funded_unknown
    FROM (${base}) u GROUP BY u.cohort ORDER BY u.cohort
  `),
  query(`
    SELECT u.cohort,COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.register_location,'$.province')),'unknown') province,
      COUNT(*) accounts FROM (${base}) u GROUP BY u.cohort,province ORDER BY u.cohort,accounts DESC
  `),
  query(`
    SELECT COUNT(*) ever_users,SUM(records>1) reauthorized_users,SUM(active_records>0) current_users,
      SUM(active_records=0) inactive_users,SUM(records) consent_records,MIN(first_grant) first_grant,MAX(last_grant) last_grant
    FROM (
      SELECT r.user_id,COUNT(*) records,SUM(r.revoked_at IS NULL AND r.superseded_at IS NULL) active_records,
        MIN(r.granted_at) first_grant,MAX(r.granted_at) last_grant
      FROM ying99_oap.api_user_consent_record r
      JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
      WHERE c.client_name='豆包' AND r.granted_at<'${cutoff}' GROUP BY r.user_id
    ) x
  `),
]);

const readyRows = await query(`
    SELECT COUNT(DISTINCT r.user_id) ready_users,COUNT(*) proxy_sessions,
      COUNT(DISTINCT CASE WHEN t.revoked_at IS NULL AND t.expires_at>'${cutoff}' THEN r.user_id END) active_ready_users,
      MIN(t.created_at) first_ready_at,MAX(t.created_at) last_ready_at
    FROM ying99_oap.api_user_consent_record r
    JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
    JOIN ying99_oap.api_oauth_refresh_token t ON t.consent_record_id=r.id
    WHERE c.client_name='豆包' AND t.created_at<'${cutoff}'
  `);
const journeyRows = await query(`
    WITH u AS (${readyBase}),
    first_trade AS (
      SELECT u.pmid,MIN(td.accept_time) first_invest_at
      FROM u JOIN qm_meta.trade_detail td ON td.user_id=u.pmid
        AND td.canceled=0 AND td.buy_amount>0 AND td.po_code<>'WALLET'
      GROUP BY u.pmid
    ),
    first_risk AS (
      SELECT u.pmid,MIN(s.answer_time) first_risk_at
      FROM u JOIN qm_meta.user_survey_record_latest s ON s.broker='0008'
        AND s.account3_id=CAST(u.account3_id AS CHAR)
      GROUP BY u.pmid
    )
    SELECT COUNT(*) ready_users,
      SUM(u.account_created_at>=u.first_ready_at) opened_after_ready,
      SUM(fr.first_risk_at>=u.first_ready_at) risk_after_ready,
      SUM(ft.first_invest_at>=u.first_ready_at) first_invest_after_ready,
      COUNT(DISTINCT CASE WHEN u.account_created_at IS NOT NULL THEN u.pmid END) ever_opened,
      COUNT(DISTINCT fr.pmid) ever_risk,COUNT(DISTINCT ft.pmid) ever_invested
    FROM u LEFT JOIN first_risk fr ON fr.pmid=u.pmid LEFT JOIN first_trade ft ON ft.pmid=u.pmid
  `);
const cardRows = await query(`
    WITH u AS (${readyBase}), pm AS (
      SELECT u.pmid,MIN(m.created_on) first_card_at
      FROM u JOIN ying99_accounts.payment_method m ON m.account_id=u.account_id AND m.broker='0008'
      GROUP BY u.pmid
    )
    SELECT COUNT(DISTINCT pm.pmid) ever_card_bound,
      SUM(pm.first_card_at>=u.first_ready_at) card_bound_after_ready
    FROM u LEFT JOIN pm ON pm.pmid=u.pmid
  `);
const inflowRows = await query(`
    WITH u AS (${readyBase}), f AS (
      SELECT u.pmid,SUM(d.input_amount) inflow
      FROM ying99_asset.dwd_app_service_account_profit_combine d USE INDEX(idx_cal_date_saId)
      JOIN u ON u.account3_id=d.account3_id
      WHERE d.broker='0008' AND d.relation_account_type='ROOT' AND d.cal_date>='2026-08-28'
        AND d.cal_date>=DATE(u.first_ready_at)
        AND d.cal_date<='${assetDate}'
      GROUP BY u.pmid
    )
    SELECT COUNT(*) inflow_users,ROUND(SUM(inflow)/10000,4) inflow_wan
    FROM f WHERE inflow>0
  `);

const profileByCohort = Object.fromEntries(profileRows.map((row) => [row.cohort, row]));
const assetByCohort = Object.fromEntries(assetRows.map((row) => [row.cohort, row]));
const behaviorByCohort = Object.fromEntries(behaviorRows.map((row) => [row.cohort, row]));
const provincesByCohort = { new: [], existing: [], unclassified: [] };
for (const row of provinceRows) provincesByCohort[row.cohort].push({ label: row.province, accounts: number(row, "accounts") });

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + number(row, key), 0);
}

function makeCohort(key) {
  const profileRowsForKey = key === "all" ? profileRows : [profileByCohort[key]].filter(Boolean);
  const assetRowsForKey = key === "all" ? assetRows : [assetByCohort[key]].filter(Boolean);
  const behaviorRowsForKey = key === "all" ? behaviorRows : [behaviorByCohort[key]].filter(Boolean);
  const population = sumRows(profileRowsForKey, "population");
  const male = sumRows(profileRowsForKey, "male");
  const female = sumRows(profileRowsForKey, "female");
  const openedAccounts = sumRows(assetRowsForKey, "opened_accounts");
  const eligible = sumRows(behaviorRowsForKey, "eligible");
  const funded = sumRows(behaviorRowsForKey, "funded_after");
  const fundedUnknown = sumRows(behaviorRowsForKey, "funded_unknown");
  const provinceRowsForKey = key === "all"
    ? Object.values(provincesByCohort).flat()
    : (provincesByCohort[key] || []);
  const provinceMap = new Map();
  for (const row of provinceRowsForKey) provinceMap.set(row.label, (provinceMap.get(row.label) || 0) + row.accounts);
  const provinces = [...provinceMap].map(([label, accounts]) => ({ label, accounts }))
    .sort((a, b) => b.accounts - a.accounts || a.label.localeCompare(b.label, "zh-CN"));
  return {
    population,
    profile: {
      gender: { male, female, unknown: population - male - female },
      age: {
        lte25: sumRows(profileRowsForKey, "age_lte25"),
        age26_35: sumRows(profileRowsForKey, "age_26_35"),
        age36_45: sumRows(profileRowsForKey, "age_36_45"),
        age46_55: sumRows(profileRowsForKey, "age_46_55"),
        age56_65: sumRows(profileRowsForKey, "age_56_65"),
        gte66: sumRows(profileRowsForKey, "age_gte66"),
        unknown: population - ["age_lte25", "age_26_35", "age_36_45", "age_46_55", "age_56_65", "age_gte66"]
          .reduce((sum, field) => sum + sumRows(profileRowsForKey, field), 0),
      },
      provinces,
      wechatBound: sumRows(profileRowsForKey, "wechat_bound"),
      bankCardBound: sumRows(profileRowsForKey, "bank_card_bound"),
      riskAssessed: sumRows(profileRowsForKey, "risk_assessed"),
      everInvested: sumRows(profileRowsForKey, "ever_invested"),
    },
    assets: {
      snapshotDate: assetDate,
      openedAccounts,
      hasAssets: sumRows(assetRowsForKey, "has_assets"),
      noAssets: sumRows(assetRowsForKey, "no_assets"),
      unknown: population - openedAccounts,
      holdingWan: Number(assetRowsForKey.reduce((sum, row) => sum + number(row, "holding_wan"), 0).toFixed(2)),
      buckets: {
        noAssets: sumRows(assetRowsForKey, "no_assets"),
        lt10k: sumRows(assetRowsForKey, "lt_10k"),
        between10k100k: sumRows(assetRowsForKey, "between_10k_100k"),
        between100k1m: sumRows(assetRowsForKey, "between_100k_1m"),
        gte1m: sumRows(assetRowsForKey, "gte_1m"),
        unknown: population - openedAccounts,
      },
    },
    behavior: {
      eligible,
      fundedAfter: funded,
      fundedNotReached: Math.max(0, eligible - funded - fundedUnknown),
      fundedUnknown,
      boughtAfter: sumRows(behaviorRowsForKey, "buy_after"),
      firstInvestmentAfter: sumRows(behaviorRowsForKey, "first_investment_after"),
      redeemedAfter: sumRows(behaviorRowsForKey, "redeem_after"),
      xiaoguUsage: null,
      xiaoguUsageState: "unavailable_no_user_level_oauth_usage_link",
    },
  };
}

let cumulativeNew = 0;
let cumulativeExisting = 0;
let cumulativeUnclassified = 0;
const daily = dailyRows.map((row) => {
  cumulativeNew += number(row, "new_cnt");
  cumulativeExisting += number(row, "existing_cnt");
  cumulativeUnclassified += number(row, "unclassified_cnt");
  return {
    date: String(row.d).slice(0, 10),
    new: number(row, "new_cnt"),
    existing: number(row, "existing_cnt"),
    unclassified: number(row, "unclassified_cnt"),
    total: number(row, "total"),
    cumulativeNew,
    cumulativeExisting,
    cumulativeUnclassified,
    cumulativeTotal: cumulativeNew + cumulativeExisting + cumulativeUnclassified,
  };
});

const [auth] = authRows;
const [ready] = readyRows;
const [journey] = journeyRows;
const [card] = cardRows;
const [inflow] = inflowRows;
const payload = {
  schema_version: "doubao-qieman-user-dashboard-v2",
  meta: {
    title: "豆包 × 且慢｜使用后转化看板",
    generated_at: `${cutoff.replace(" ", "T")}+08:00`,
    data_cutoff: `${cutoff.replace(" ", "T")}+08:00`,
    window_start_at: `${daily[0].date}T00:00:00+08:00`,
    first_observed_grant_at: `${String(auth.first_grant).replace(" ", "T")}+08:00`,
    timezone: "Asia/Shanghai",
    source: "OAP OAuth 授权 × 且慢生产数仓只读聚合",
    latest_day_is_partial: true,
    privacy: "仅公开聚合统计；不含用户身份、手机号、Client ID、Token、请求 ID 或原始对话",
  },
  metrics: {
    boundAccounts: number(auth, "ever_users"),
    currentAccounts: number(auth, "current_users"),
    inactiveAccounts: number(auth, "inactive_users"),
    reauthorizedAccounts: number(auth, "reauthorized_users"),
    consentRecords: number(auth, "consent_records"),
    readyAccounts: number(ready, "ready_users"),
    activeReadyAccounts: number(ready, "active_ready_users"),
    usageProxySessions: number(ready, "proxy_sessions"),
    newAccounts: cumulativeNew,
    existingAccounts: cumulativeExisting,
    unclassifiedAccounts: cumulativeUnclassified,
  },
  daily,
  journey: {
    anchor: "first_oauth_refresh_token_created_at",
    anchorLabel: "首次会话令牌签发（豆包使用代理）",
    readyAccounts: number(ready, "ready_users"),
    actualToolUsers: null,
    actualToolUsersState: "unavailable_no_client_to_user_call_link",
    openedAfterReady: number(journey, "opened_after_ready"),
    cardBoundAfterReady: number(card, "card_bound_after_ready"),
    riskAssessedAfterReady: number(journey, "risk_after_ready"),
    firstInvestmentAfterReady: number(journey, "first_invest_after_ready"),
    inflowUsersAfterReady: number(inflow, "inflow_users"),
    inflowWanAfterReady: Number(number(inflow, "inflow_wan").toFixed(4)),
    firstReadyAt: `${String(ready.first_ready_at).replace(" ", "T")}+08:00`,
    lastReadyAt: `${String(ready.last_ready_at).replace(" ", "T")}+08:00`,
  },
  cohorts: {
    all: makeCohort("all"),
    new: makeCohort("new"),
    existing: makeCohort("existing"),
  },
  evidence: {
    binding: "ying99_oap.api_user_consent_record × api_oauth_client；client_name=豆包；按 user_id 首次 granted_at 去重",
    current: "revoked_at 与 superseded_at 均为空的当前有效授权；重新授权按同一用户多条 consent record 识别",
    cohort: "新用户=注册时间与首次豆包授权时间相差不超过 60 分钟；老用户=授权前已有且慢账户",
    assets: `ying99_asset.dwd_app_service_account_profit_combine；${assetDate} 快照；只取 broker=0008 且 relation_account_type=ROOT，避免跨券商与树形账户重复求和`,
    ready: "api_oauth_refresh_token.created_at；会话令牌签发作为豆包使用代理，能证明客户端建立会话，但不是工具级实调用",
    journey: `开账户、绑卡、风测、首投均以首次会话令牌时间为锚点；入金采用 broker=0008、ROOT 层 input_amount，统计至 ${assetDate}`,
    behavior: "首投只计首次成功且未取消的非 WALLET 买入；入金金额为数仓 ROOT 层 input_amount 代理口径",
    usageGap: "逐次 API 调用缺少可稳定回连豆包 client_id 与授权 user_id 的链路；可使用人数不能替代实际工具调用人数",
  },
};

if (payload.metrics.boundAccounts !== payload.cohorts.all.population) throw new Error("Binding population mismatch");
if (payload.metrics.boundAccounts !== payload.metrics.newAccounts + payload.metrics.existingAccounts + payload.metrics.unclassifiedAccounts) {
  throw new Error("Cohort population mismatch");
}
if (payload.daily.at(-1).cumulativeTotal !== payload.metrics.boundAccounts) throw new Error("Daily cumulative mismatch");
if (payload.journey.readyAccounts !== payload.metrics.readyAccounts) throw new Error("Ready population mismatch");
if (payload.metrics.readyAccounts > payload.metrics.boundAccounts) throw new Error("Ready population exceeds authorization population");
for (const [key, cohort] of Object.entries(payload.cohorts)) {
  if (cohort.profile.gender.male + cohort.profile.gender.female + cohort.profile.gender.unknown !== cohort.population) {
    throw new Error(`${key} gender population mismatch`);
  }
  if (Object.values(cohort.assets.buckets).reduce((sum, value) => sum + value, 0) !== cohort.population) {
    throw new Error(`${key} asset buckets mismatch`);
  }
}

for (const baseDir of ["public", "docs"]) {
  const dir = join(root, baseDir, "reports", slug, "data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "latest.json"), `${JSON.stringify(payload, null, 2)}\n`);
}

console.log(`synced ${slug}: cutoff=${cutoff} bound=${payload.metrics.boundAccounts} new=${payload.metrics.newAccounts} existing=${payload.metrics.existingAccounts} holding=${payload.cohorts.all.assets.holdingWan}万`);
