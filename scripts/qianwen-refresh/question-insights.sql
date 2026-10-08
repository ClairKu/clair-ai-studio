WITH nu AS (
  SELECT b.pmid, b.fb
  FROM (
    SELECT x.user_id AS pmid, MIN(x.created_at) AS fb
    FROM ying99_qieman.qwen_user_map x
    WHERE x.is_deleted = 0
    GROUP BY x.user_id
    HAVING MIN(x.created_at) >= '2026-08-03 00:00:00'
       AND MIN(x.created_at) < '__CUT__'
  ) b
  JOIN ying99_pomodel.portfolio_manager_info p
    ON p.po_manager_id = b.pmid
   AND ABS(TIMESTAMPDIFF(MINUTE, p.registered_at, b.fb)) <= 60
), session_map AS (
  SELECT DISTINCT s.qmuser_user_id, s.session_id
  FROM nu
  JOIN ying99_qieman.qwen_a2a_session_map s
    ON s.qmuser_user_id = nu.pmid
   AND s.is_deleted = 0
   AND s.created_at >= nu.fb
   AND s.created_at < '__CUT__'
), msg AS (
  SELECT
    nu.pmid,
    m.session_id,
    m.created_at,
    REGEXP_REPLACE(TRIM(m.user_input), '[[:space:]]+', ' ') AS q
  FROM nu
  JOIN session_map s ON s.qmuser_user_id = nu.pmid
  JOIN ying99_xiaogu3_qa.agent_dj_messages m
    ON m.session_id = s.session_id
   AND m.is_deleted = 0
   AND m.created_at >= nu.fb
   AND m.created_at < '__CUT__'
  WHERE m.user_input IS NOT NULL
    AND TRIM(m.user_input) <> ''
), classified AS (
  SELECT
    pmid,
    session_id,
    created_at,
    q,
    CASE
      WHEN REPLACE(q, ' ', '') IN (
        '帮我看看现在的持仓结构，给出优化建议',
        '推荐2-3个值得长期持有的基金，并给出详细的分析',
        '帮我看看最近有哪些比较热门的基金或投顾策略',
        '最近市场有哪些特点，有哪些机会和风险值得关注'
      ) THEN 1 ELSE 0
    END AS is_legacy_preset,
    CASE
      WHEN q IN ('好','好的','继续','可以','是','是的','不是','谢谢','需要','要','明白了','知道了','嗯','对','行','1','2','？','?') THEN 1 ELSE 0
    END AS is_short_followup,
    CASE
      WHEN q IN ('好','好的','继续','可以','是','是的','不是','谢谢','需要','要','明白了','知道了','嗯','对','行','1','2','？','?')
        OR CHAR_LENGTH(q) <= 2 THEN 'dialogue_followup'
      WHEN q REGEXP '持仓|我的.*基金|账户|资产|收益|盈亏|亏损|浮亏|回撤|仓位|余额|成本|组合.*诊断' THEN 'holding_account'
      WHEN q REGEXP '买入|卖出|赎回|申购|加仓|减仓|补仓|止盈|止损|下单|调仓|定投|开户|绑卡|交易|费率|手续费|取出|提现|充值' THEN 'transaction_action'
      WHEN q REGEXP '资金规划|资产配置|配置方案|四笔钱|养老|退休|教育|买房|目标|现金流|家庭|闲钱|长期增值|稳健' THEN 'planning_configuration'
      WHEN q REGEXP '推荐|热门|选品|筛选|值得长期|哪些基金|哪些策略|适合我|买什么|哪只|哪个基金|候选' THEN 'product_selection'
      WHEN q REGEXP '基金|策略|指数|债基|货基|ETF|净值|主理人|年化|业绩|估值' THEN 'product_analysis'
      WHEN q REGEXP '市场|行情|A股|港股|美股|黄金|债券|板块|行业|宏观|利率|政策|牛市|熊市|机会|风险' THEN 'market_research'
      WHEN q REGEXP '什么是|是什么意思|区别|怎么看|为什么|如何判断|怎么判断|介绍一下|解释|知识|原理' THEN 'knowledge_explain'
      WHEN q REGEXP '简报|报告|新闻|资讯|研报|文档' THEN 'report_information'
      WHEN q REGEXP '小顾|且慢|你能|能不能|会不会|功能|怎么用|登录' THEN 'qieman_service'
      ELSE 'other_expression'
    END AS topic
  FROM msg
), sequenced AS (
  SELECT classified.*,
    ROW_NUMBER() OVER (PARTITION BY pmid ORDER BY created_at, session_id, q) AS user_question_number
  FROM classified
), per_user AS (
  SELECT pmid, COUNT(*) AS questions, COUNT(DISTINCT DATE(DATE_ADD(created_at, INTERVAL 8 HOUR))) AS active_days,
    SUM(is_legacy_preset) AS preset_questions, SUM(is_short_followup) AS short_followups
  FROM classified
  GROUP BY pmid
), ranked_users AS (
  SELECT pmid, questions, ROW_NUMBER() OVER (ORDER BY questions DESC, pmid) AS rn,
    COUNT(*) OVER () AS asking_users
  FROM per_user
), question_rollup AS (
  SELECT q, COUNT(*) AS questions, COUNT(DISTINCT pmid) AS users
  FROM classified
  WHERE CHAR_LENGTH(q) BETWEEN 5 AND 120
    AND q NOT REGEXP '[0-9][0-9][0-9][0-9][0-9][0-9]'
    AND q NOT REGEXP '@|身份证|手机号|手机号码|银行卡|账号|密码'
  GROUP BY q
  HAVING COUNT(DISTINCT pmid) >= 10
), top_questions AS (
  SELECT q, questions, users,
    ROW_NUMBER() OVER (ORDER BY questions DESC, users DESC, q) AS rn
  FROM question_rollup
)
SELECT 'summary' AS kind, 'bound_users' AS item_id, COUNT(*) AS value_1, 0 AS value_2, 0 AS value_3, '-' AS text_hex FROM nu
UNION ALL SELECT 'summary', 'asking_users', COUNT(*), 0, 0, '-' FROM per_user
UNION ALL SELECT 'summary', 'questions', COUNT(*), 0, 0, '-' FROM classified
UNION ALL SELECT 'summary', 'sessions', COUNT(DISTINCT session_id), 0, 0, '-' FROM classified
UNION ALL SELECT 'summary', 'legacy_preset_questions', SUM(is_legacy_preset), 0, 0, '-' FROM classified
UNION ALL SELECT 'summary', 'short_followups', SUM(is_short_followup), 0, 0, '-' FROM classified
UNION ALL SELECT 'summary', 'first_question_preset_users', SUM(is_legacy_preset), 0, 0, '-' FROM sequenced WHERE user_question_number = 1
UNION ALL SELECT 'summary', 'one_day_users', SUM(active_days = 1), 0, 0, '-' FROM per_user
UNION ALL SELECT 'summary', 'multi_day_users', SUM(active_days >= 2), 0, 0, '-' FROM per_user
UNION ALL SELECT 'summary', 'top_1pct_questions', SUM(questions), 0, 0, '-' FROM ranked_users WHERE rn <= CEIL(asking_users * 0.01)
UNION ALL SELECT 'summary', 'top_5pct_questions', SUM(questions), 0, 0, '-' FROM ranked_users WHERE rn <= CEIL(asking_users * 0.05)
UNION ALL SELECT 'depth', '1', SUM(questions = 1), 0, 0, '-' FROM per_user
UNION ALL SELECT 'depth', '2_4', SUM(questions BETWEEN 2 AND 4), 0, 0, '-' FROM per_user
UNION ALL SELECT 'depth', '5_9', SUM(questions BETWEEN 5 AND 9), 0, 0, '-' FROM per_user
UNION ALL SELECT 'depth', '10_19', SUM(questions BETWEEN 10 AND 19), 0, 0, '-' FROM per_user
UNION ALL SELECT 'depth', '20_plus', SUM(questions >= 20), 0, 0, '-' FROM per_user
UNION ALL SELECT 'topic_all', topic, COUNT(*), COUNT(DISTINCT pmid), 0, '-' FROM classified GROUP BY topic
UNION ALL SELECT 'topic_first', topic, COUNT(*), COUNT(DISTINCT pmid), 0, '-' FROM sequenced WHERE user_question_number = 1 GROUP BY topic
UNION ALL SELECT 'top_question', CAST(rn AS CHAR), questions, users, 0, HEX(q) FROM top_questions WHERE rn <= 18
ORDER BY kind, item_id
