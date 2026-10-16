#!/bin/zsh
# 豆包看板取数（redash 数据源 41 / dw-tidb）。与 qianwen-refresh/run-sql.sh 同构，仅绑定基表换成豆包 OAuth 授权。用法：
#   QW_CUT='YYYY-MM-DD HH:MM:SS' QW_AD='YYYY-MM-DD' scripts/doubao-refresh/run-sql.sh
# 绑定 = ying99_oap.api_user_consent_record 中 client_id='doubao' 且当前仍有未撤销授权的用户；首次绑定时刻 = MIN(granted_at)。
# 「有效使用」= 绑定后产生过豆包 OAuth 会话令牌（api_oauth_refresh_token，会话代理口径，与豆包全景报告一致）。
# QW_CUT 默认当前时刻；QW_AD（资产快照日）默认昨天——周末/节假日无批次，
# 必须人工确认取「最近一个跑完的 cal_date」（当日行数明显少于前一日=没跑完）。
source ~/.zshrc 2>/dev/null
R() { python3 $HOME/.claude/skills/redash/redash.py execute-adhoc --timeout 550 --sql "$1"; }
CUT="${QW_CUT:-$(date '+%Y-%m-%d %H:%M:%S')}"
AD="${QW_AD:-$(date -v-1d '+%Y-%m-%d')}"
AGEREF="${QW_AGEREF:-$(date '+%Y-%m-%d')}"
INFLOW_PRED="t.buy_amount>0 AND ((t.trade_type='wallet.recharge' AND t.extra IN ('by.online','by.offline')) OR (t.trade_type<>'wallet.recharge' AND t.extra='from.card'))"
# 仅重跑指定段：QW_BASE_SECTIONS='2,4'；省略则执行全部 6 段。
selected() { [[ -z "${QW_BASE_SECTIONS:-}" || ",${QW_BASE_SECTIONS}," == *",$1,"* ]]; }
echo "### params CUT=$CUT AD=$AD AGEREF=$AGEREF"
U="SELECT b.pmid, b.fb, p.account3_id, p.gender, p.bank_no, p.unionid, p.register_location, p.birthday_del,
     (p.bank_no IS NOT NULL AND p.bank_no<>'') AS elig,
     CASE WHEN p.registered_at IS NULL THEN 'unclassified'
          WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END AS cohort
   FROM (SELECT CAST(user_id AS SIGNED) AS pmid, MIN(granted_at) AS fb FROM ying99_oap.api_user_consent_record
         WHERE client_id='doubao' GROUP BY user_id
         HAVING SUM(revoked_at IS NULL)>0 AND MIN(granted_at)>='2026-08-28 00:00:00' AND MIN(granted_at)<'$CUT') b
   JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid"

if selected 1; then
echo "### 1 daily"; R "SELECT DATE(u.fb) AS d, SUM(u.cohort='new') AS new_cnt, SUM(u.cohort='existing') AS ex_cnt, SUM(u.cohort='unclassified') AS unc FROM ($U) u GROUP BY DATE(u.fb) ORDER BY d" 2>&1 | tail -120

fi

if selected 2; then
echo "### 2 profile"; R "SELECT u.cohort, COUNT(*) pop, SUM(u.gender='M') male, SUM(u.gender='F') female,
 SUM(u.age<=25) lte25, SUM(u.age BETWEEN 26 AND 35) a2635, SUM(u.age BETWEEN 36 AND 45) a3645,
 SUM(u.age BETWEEN 46 AND 55) a4655, SUM(u.age BETWEEN 56 AND 65) a5665, SUM(u.age>=66) gte66,
 SUM(u.unionid IS NOT NULL AND u.unionid<>'') mp, SUM(u.elig) card,
 SUM(EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0 AND $INFLOW_PRED AND t.accept_time<'$CUT')) invested,
 SUM(EXISTS(SELECT 1 FROM qm_meta.user_survey_record_latest s WHERE s.broker='0008' AND s.account3_id=CAST(u.account3_id AS CHAR) AND s.answer_time>='2026-05-10 00:00:00' AND s.answer_time<'$CUT')) assessed
 FROM (SELECT x.*, CASE WHEN CHAR_LENGTH(x.birthday_del)=8 THEN TIMESTAMPDIFF(YEAR,STR_TO_DATE(x.birthday_del,'%Y%m%d'),'$AGEREF') END AS age FROM ($U) x) u GROUP BY u.cohort" 2>&1 | tail -6

fi

if selected 3; then
echo "### 3 assets"; R "SELECT u.cohort, COUNT(*) with_acct, SUM(a.ta IS NULL OR a.ta<=0) no_assets,
 SUM(a.ta>0 AND a.ta<10000) lt10k, SUM(a.ta>=10000 AND a.ta<100000) b1, SUM(a.ta>=100000 AND a.ta<1000000) b2,
 SUM(a.ta>=1000000) b3, SUM(a.ta>0) has_assets, ROUND(SUM(CASE WHEN a.ta>0 THEN a.ta ELSE 0 END)/10000,2) wan
 FROM ($U) u LEFT JOIN (SELECT account3_id, SUM(total_asset) ta FROM ying99_asset.dwd_app_service_account_profit_combine
   USE INDEX(idx_cal_date_saId) WHERE cal_date='$AD' AND relation_account_type='ROOT' GROUP BY account3_id) a
 ON a.account3_id=u.account3_id WHERE u.account3_id IS NOT NULL AND u.account3_id<>1002 GROUP BY u.cohort" 2>&1 | tail -6

fi

if selected 4; then
echo "### 4 trade behaviors"; R "SELECT u.cohort, SUM(u.elig) eligible,
 SUM(EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0
   AND t.buy_amount>0 AND t.accept_time>=u.fb AND t.accept_time<'$CUT'
   AND ((t.trade_type='wallet.recharge' AND t.extra IN ('by.online','by.offline'))
     OR (t.trade_type<>'wallet.recharge' AND t.extra='from.card')))) activity,
 SUM(COALESCE((SELECT MIN(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0
   AND $INFLOW_PRED AND t.accept_time<'$CUT')>=u.fb,0)) first_inv,
 SUM(EXISTS(SELECT 1 FROM ying99_oap.api_oauth_refresh_token q WHERE q.user_id=CAST(u.pmid AS CHAR) AND q.client_id='doubao' AND q.created_at>=u.fb AND q.created_at<'$CUT')) xiaogu
 FROM ($U) u GROUP BY u.cohort" 2>&1 | tail -6

fi

if selected 5; then
echo "### 5 flow behaviors"; R "WITH users AS ($U), trade_flags AS (
 SELECT u.pmid,
  MAX(CASE WHEN $INFLOW_PRED THEN 1 ELSE 0 END) funded,
  MAX(CASE WHEN t.redeem_amount>0 THEN 1 ELSE 0 END) redeemed
 FROM users u JOIN qm_meta.trade_detail t ON t.user_id=u.pmid AND t.canceled=0
  AND t.accept_time>=u.fb AND t.accept_time<'$CUT'
 WHERE t.redeem_amount>0 OR ($INFLOW_PRED) GROUP BY u.pmid
), remaining_eligible AS (
 SELECT u.* FROM users u LEFT JOIN trade_flags t ON t.pmid=u.pmid
 WHERE u.elig=1 AND COALESCE(t.redeemed,0)=0
), asset_output AS (
 SELECT u.pmid,SUM(d.output_amount) output_total
 FROM remaining_eligible u JOIN ying99_asset.dwd_app_service_account_profit_combine d USE INDEX(idx_user)
  ON d.account3_id=u.account3_id AND d.relation_account_type='ROOT'
  AND d.cal_date>=DATE(u.fb) AND d.cal_date<='$AD'
 WHERE d.cal_date>='2026-08-28' GROUP BY u.pmid
)
SELECT u.cohort,SUM(COALESCE(t.funded,0)) funded,0 no_rows,
 SUM(u.elig AND (COALESCE(t.redeemed,0)=1 OR a.output_total>0)) redeem_union
FROM users u LEFT JOIN trade_flags t ON t.pmid=u.pmid
 LEFT JOIN asset_output a ON a.pmid=u.pmid GROUP BY u.cohort" 2>&1 | tail -6

fi

if selected 6; then
echo "### 6 province"; R "SELECT u.cohort, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.register_location,'\$.province')),'unknown') prov, COUNT(*) c
 FROM ($U) u GROUP BY u.cohort, prov ORDER BY u.cohort, c DESC" 2>&1 | tail -200
fi
