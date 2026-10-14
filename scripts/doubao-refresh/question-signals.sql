-- 豆包“用户提问分析”的可观测替代指标。
--
-- 重要边界：豆包 OAuth/MCP 链路没有把原始提问、豆包会话 ID 或工具级调用
-- 明细回传到盈米。因此本查询只能统计 refresh token 活动代理，不能把任何结果
-- 命名为“提问数”“会话数”“对话深度”或用户主动使用次数。
--
-- 执行前把 __CUT__ 替换为与主看板完全一致的 Asia/Shanghai 截止时刻。
-- 输出只有匿名聚合，不包含用户、会话、令牌或请求标识。

WITH bound AS (
  SELECT
    CAST(c.user_id AS SIGNED) AS pmid,
    MIN(c.granted_at) AS first_bound_at,
    CASE
      WHEN p.registered_at IS NOT NULL
       AND ABS(TIMESTAMPDIFF(MINUTE, p.registered_at, MIN(c.granted_at))) <= 60
      THEN 'new'
      ELSE 'existing'
    END AS cohort
  FROM ying99_oap.api_user_consent_record c
  JOIN ying99_pomodel.portfolio_manager_info p
    ON p.po_manager_id = CAST(c.user_id AS SIGNED)
  WHERE c.client_id = 'doubao'
  GROUP BY c.user_id, p.registered_at
  HAVING SUM(c.revoked_at IS NULL) > 0
     AND MIN(c.granted_at) >= '2026-08-28 00:00:00'
     AND MIN(c.granted_at) < '__CUT__'
), token_events AS (
  SELECT
    b.pmid,
    b.cohort,
    b.first_bound_at,
    t.created_at
  FROM bound b
  JOIN ying99_oap.api_oauth_refresh_token t
    ON t.user_id = CAST(b.pmid AS CHAR)
   AND t.client_id = 'doubao'
   AND t.created_at >= b.first_bound_at
   AND t.created_at < '__CUT__'
), per_user AS (
  SELECT
    b.pmid,
    b.cohort,
    b.first_bound_at,
    MIN(t.created_at) AS first_token_at,
    COUNT(DISTINCT DATE(t.created_at)) AS token_active_days
  FROM bound b
  LEFT JOIN token_events t
    ON t.pmid = b.pmid
  GROUP BY b.pmid, b.cohort, b.first_bound_at
), scoped_users AS (
  SELECT 'all' AS cohort, pmid, first_bound_at, first_token_at, token_active_days
  FROM per_user
  UNION ALL
  SELECT cohort, pmid, first_bound_at, first_token_at, token_active_days
  FROM per_user
), coverage AS (
  SELECT
    cohort,
    COUNT(*) AS bound_users,
    SUM(first_token_at IS NOT NULL) AS token_active_users,
    SUM(first_token_at IS NULL) AS no_token_users,
    ROUND(100 * SUM(first_token_at IS NOT NULL) / COUNT(*), 2) AS token_active_rate_pct
  FROM scoped_users
  GROUP BY cohort
), first_token_delay AS (
  SELECT cohort, 'lte_5m' AS bucket, SUM(
    first_token_at IS NOT NULL
    AND TIMESTAMPDIFF(MINUTE, first_bound_at, first_token_at) <= 5
  ) AS users
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, '5_30m', SUM(
    first_token_at IS NOT NULL
    AND TIMESTAMPDIFF(MINUTE, first_bound_at, first_token_at) > 5
    AND TIMESTAMPDIFF(MINUTE, first_bound_at, first_token_at) <= 30
  )
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, '30m_24h', SUM(
    first_token_at IS NOT NULL
    AND TIMESTAMPDIFF(MINUTE, first_bound_at, first_token_at) > 30
    AND TIMESTAMPDIFF(HOUR, first_bound_at, first_token_at) < 24
  )
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, 'gte_1d', SUM(
    first_token_at IS NOT NULL
    AND TIMESTAMPDIFF(HOUR, first_bound_at, first_token_at) >= 24
  )
  FROM scoped_users GROUP BY cohort
), active_days AS (
  SELECT cohort, '1' AS bucket, SUM(token_active_days = 1) AS users
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, '2_7', SUM(token_active_days BETWEEN 2 AND 7)
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, '8_30', SUM(token_active_days BETWEEN 8 AND 30)
  FROM scoped_users GROUP BY cohort
  UNION ALL
  SELECT cohort, '31_plus', SUM(token_active_days >= 31)
  FROM scoped_users GROUP BY cohort
), days AS (
  SELECT DATE_SUB(DATE('__CUT__'), INTERVAL n DAY) AS day
  FROM (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
  ) seq
), recent_daily AS (
  SELECT
    d.day,
    COUNT(DISTINCT CASE WHEN t.cohort = 'new' THEN t.pmid END) AS new_users,
    COUNT(DISTINCT CASE WHEN t.cohort = 'existing' THEN t.pmid END) AS existing_users,
    COUNT(DISTINCT t.pmid) AS all_users
  FROM days d
  LEFT JOIN token_events t
    ON DATE(t.created_at) = d.day
  GROUP BY d.day
)
SELECT
  'coverage' AS kind,
  cohort,
  'summary' AS item_id,
  '-' AS day,
  bound_users AS value_1,
  token_active_users AS value_2,
  no_token_users AS value_3,
  token_active_rate_pct AS rate_pct,
  0 AS latest_day_partial
FROM coverage
UNION ALL
SELECT
  'first_token_delay', cohort, bucket, '-', users, 0, 0, 0, 0
FROM first_token_delay
UNION ALL
SELECT
  'token_active_days', cohort, bucket, '-', users, 0, 0, 0, 0
FROM active_days
UNION ALL
SELECT
  'recent_7d', 'all', 'token_active_users', DATE_FORMAT(day, '%Y-%m-%d'),
  all_users, new_users, existing_users, 0,
  (day = DATE('__CUT__'))
FROM recent_daily
ORDER BY
  FIELD(kind, 'coverage', 'first_token_delay', 'token_active_days', 'recent_7d'),
  FIELD(cohort, 'all', 'new', 'existing'),
  day,
  FIELD(item_id, 'summary', 'lte_5m', '5_30m', '30m_24h', 'gte_1d', '1', '2_7', '8_30', '31_plus', 'token_active_users');
