WITH ready AS (
  SELECT CAST(r.user_id AS UNSIGNED) pmid,
    MIN(t.created_at) first_session,
    p.account_id,
    p.account3_id,
    p.account_created_at
  FROM ying99_oap.api_user_consent_record r
  JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id
  JOIN ying99_oap.api_oauth_refresh_token t ON t.consent_record_id=r.id
  JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=CAST(r.user_id AS UNSIGNED)
  WHERE c.client_name='豆包'
    AND t.created_at<'2026-09-05 22:33:51'
  GROUP BY r.user_id,p.account_id,p.account3_id,p.account_created_at
), flow_by_user AS (
  SELECT u.pmid,
    SUM(d.input_amount) day_level_inflow,
    SUM(CASE WHEN d.cal_date>DATE(u.first_session) THEN d.input_amount ELSE 0 END) strict_inflow,
    SUM(CASE WHEN d.cal_date=DATE(u.first_session) THEN d.input_amount ELSE 0 END) same_day_inflow
  FROM ready u
  JOIN ying99_asset.dwd_app_service_account_profit_combine d USE INDEX(idx_cal_date_saId)
    ON d.account3_id=u.account3_id
  WHERE d.broker='0008'
    AND d.relation_account_type='ROOT'
    AND d.cal_date>=DATE(u.first_session)
    AND d.cal_date<='2026-09-04'
  GROUP BY u.pmid
  HAVING day_level_inflow>0
), locked AS (
  SELECT u.*,f.day_level_inflow,f.strict_inflow,f.same_day_inflow
  FROM ready u JOIN flow_by_user f ON f.pmid=u.pmid
), sessions AS (
  SELECT l.pmid,COUNT(*) session_tokens,COUNT(DISTINCT DATE(t.created_at)) active_days
  FROM locked l
  JOIN ying99_oap.api_user_consent_record r ON CAST(r.user_id AS UNSIGNED)=l.pmid
  JOIN ying99_oap.api_oauth_client c ON c.client_id=r.client_id AND c.client_name='豆包'
  JOIN ying99_oap.api_oauth_refresh_token t ON t.consent_record_id=r.id
    AND t.created_at<'2026-09-05 22:33:51'
  GROUP BY l.pmid
), trades AS (
  SELECT l.pmid,COUNT(*) buy_orders,SUM(td.buy_amount) buy_amount
  FROM locked l
  JOIN qm_meta.trade_detail td ON td.user_id=l.pmid
    AND td.canceled=0
    AND td.po_code<>'WALLET'
    AND td.buy_amount>0
    AND td.accept_time>=l.first_session
    AND td.accept_time<'2026-09-05 22:33:51'
  GROUP BY l.pmid
), first_card AS (
  SELECT l.pmid,MIN(pm.created_on) first_card_at
  FROM locked l JOIN ying99_accounts.payment_method pm
    ON pm.account_id=l.account_id AND pm.broker='0008'
  GROUP BY l.pmid
), first_risk AS (
  SELECT l.pmid,MIN(s.answer_time) first_risk_at
  FROM locked l JOIN qm_meta.user_survey_record_latest s
    ON s.broker='0008' AND s.account3_id=CAST(l.account3_id AS CHAR)
  GROUP BY l.pmid
), first_trade AS (
  SELECT l.pmid,MIN(td.accept_time) first_trade_at
  FROM locked l JOIN qm_meta.trade_detail td
    ON td.user_id=l.pmid AND td.canceled=0 AND td.po_code<>'WALLET' AND td.buy_amount>0
  GROUP BY l.pmid
)
SELECT COUNT(*) day_level_users,
  SUM(l.day_level_inflow) day_level_inflow,
  SUM(l.strict_inflow>0) strict_users,
  SUM(l.strict_inflow) strict_inflow,
  SUM(l.same_day_inflow>0) same_day_users,
  SUM(l.same_day_inflow) same_day_inflow,
  SUM(l.same_day_inflow>0 AND l.strict_inflow=0) same_day_only_users,
  SUM(se.session_tokens) session_tokens,
  SUM(se.active_days) active_user_days,
  SUM(tr.buy_orders) post_buy_orders,
  SUM(tr.buy_amount) post_buy_amount,
  SUM(tr.buy_orders>0) post_buyers,
  SUM(l.account_created_at<l.first_session
    AND fc.first_card_at<l.first_session
    AND fr.first_risk_at<l.first_session
    AND ft.first_trade_at<l.first_session) all_milestones_before
FROM locked l
JOIN sessions se ON se.pmid=l.pmid
LEFT JOIN trades tr ON tr.pmid=l.pmid
LEFT JOIN first_card fc ON fc.pmid=l.pmid
LEFT JOIN first_risk fr ON fr.pmid=l.pmid
LEFT JOIN first_trade ft ON ft.pmid=l.pmid;
