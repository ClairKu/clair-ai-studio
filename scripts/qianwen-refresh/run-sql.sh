#!/bin/zsh
# 千问看板取数（redash 数据源 41 / dw-tidb）。用法：
#   QW_CUT='YYYY-MM-DD HH:MM:SS' QW_AD='YYYY-MM-DD' scripts/qianwen-refresh/run-sql.sh
# QW_CUT 默认当前时刻；QW_AD（资产快照日）默认昨天——周末/节假日无批次，
# 必须人工确认取「最近一个跑完的 cal_date」（当日行数明显少于前一日=没跑完）。
source ~/.zshrc 2>/dev/null
R() { python3 $HOME/.claude/skills/redash/redash.py execute-adhoc --timeout 550 --sql "$1"; }
CUT="${QW_CUT:-$(date '+%Y-%m-%d %H:%M:%S')}"
AD="${QW_AD:-$(date -v-1d '+%Y-%m-%d')}"
AGEREF="${QW_AGEREF:-$(date '+%Y-%m-%d')}"
echo "### params CUT=$CUT AD=$AD AGEREF=$AGEREF"
U="SELECT b.pmid, b.fb, p.account3_id, p.gender, p.bank_no, p.unionid, p.register_location, p.birthday_del,
     (p.bank_no IS NOT NULL AND p.bank_no<>'') AS elig,
     CASE WHEN p.registered_at IS NULL THEN 'unclassified'
          WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END AS cohort
   FROM (SELECT user_id AS pmid, MIN(created_at) AS fb FROM ying99_qieman.qwen_user_map
         WHERE is_deleted=0 GROUP BY user_id
         HAVING MIN(created_at)>='2026-08-03 00:00:00' AND MIN(created_at)<'$CUT') b
   JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid"

echo "### 1 daily"; R "SELECT DATE(u.fb) AS d, SUM(u.cohort='new') AS new_cnt, SUM(u.cohort='existing') AS ex_cnt, SUM(u.cohort='unclassified') AS unc FROM ($U) u GROUP BY DATE(u.fb) ORDER BY d" 2>&1 | tail -40

echo "### 2 profile"; R "SELECT u.cohort, COUNT(*) pop, SUM(u.gender='M') male, SUM(u.gender='F') female,
 SUM(u.age<=25) lte25, SUM(u.age BETWEEN 26 AND 35) a2635, SUM(u.age BETWEEN 36 AND 45) a3645,
 SUM(u.age BETWEEN 46 AND 55) a4655, SUM(u.age BETWEEN 56 AND 65) a5665, SUM(u.age>=66) gte66,
 SUM(u.unionid IS NOT NULL AND u.unionid<>'') mp, SUM(u.elig) card,
 SUM(EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET')) invested,
 SUM(EXISTS(SELECT 1 FROM qm_meta.user_survey_record_latest s WHERE s.broker='0008' AND s.account3_id=CAST(u.account3_id AS CHAR) AND s.answer_time>='2026-05-10 00:00:00' AND s.answer_time<'$CUT')) assessed
 FROM (SELECT x.*, CASE WHEN CHAR_LENGTH(x.birthday_del)=8 THEN TIMESTAMPDIFF(YEAR,STR_TO_DATE(x.birthday_del,'%Y%m%d'),'$AGEREF') END AS age FROM ($U) x) u GROUP BY u.cohort" 2>&1 | tail -6

echo "### 3 assets"; R "SELECT u.cohort, COUNT(*) with_acct, SUM(a.ta IS NULL OR a.ta<=0) no_assets,
 SUM(a.ta>0 AND a.ta<10000) lt10k, SUM(a.ta>=10000 AND a.ta<100000) b1, SUM(a.ta>=100000 AND a.ta<1000000) b2,
 SUM(a.ta>=1000000) b3, SUM(a.ta>0) has_assets, ROUND(SUM(CASE WHEN a.ta>0 THEN a.ta ELSE 0 END)/10000,2) wan
 FROM ($U) u LEFT JOIN (SELECT account3_id, SUM(total_asset) ta FROM ying99_asset.dwd_app_service_account_profit_combine
   USE INDEX(idx_cal_date_saId) WHERE cal_date='$AD' AND relation_account_type='ROOT' GROUP BY account3_id) a
 ON a.account3_id=u.account3_id WHERE u.account3_id IS NOT NULL AND u.account3_id<>1002 GROUP BY u.cohort" 2>&1 | tail -6

echo "### 4 trade behaviors"; R "SELECT u.cohort, SUM(u.elig) eligible,
 SUM(u.elig AND EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.accept_time>=u.fb)) activity,
 SUM(u.elig AND (SELECT MIN(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET')>u.fb) first_inv,
 SUM(EXISTS(SELECT 1 FROM ying99_qieman.qwen_a2a_session_map q WHERE q.qmuser_user_id=u.pmid AND q.is_deleted=0 AND q.created_at>=u.fb AND q.created_at<'$CUT')) xiaogu
 FROM ($U) u GROUP BY u.cohort" 2>&1 | tail -6

echo "### 5 flow behaviors"; R "SELECT u.cohort,
 SUM(u.elig AND (SELECT SUM(d.input_amount) FROM ying99_asset.dwd_app_service_account_profit_combine d
   WHERE d.account3_id=u.account3_id AND d.relation_account_type='ROOT' AND d.cal_date>=DATE(u.fb) AND d.cal_date<='$AD')>0) funded,
 SUM(u.elig AND NOT EXISTS(SELECT 1 FROM ying99_asset.dwd_app_service_account_profit_combine d
   WHERE d.account3_id=u.account3_id AND d.relation_account_type='ROOT')) no_rows,
 SUM(u.elig AND ((SELECT SUM(d.output_amount) FROM ying99_asset.dwd_app_service_account_profit_combine d
   WHERE d.account3_id=u.account3_id AND d.relation_account_type='ROOT' AND d.cal_date>=DATE(u.fb) AND d.cal_date<='$AD')>0
  OR EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=u.pmid AND t.canceled=0 AND t.redeem_amount>0 AND t.accept_time>=u.fb))) redeem_union
 FROM ($U) u GROUP BY u.cohort" 2>&1 | tail -6

echo "### 6 province"; R "SELECT u.cohort, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.register_location,'\$.province')),'unknown') prov, COUNT(*) c
 FROM ($U) u GROUP BY u.cohort, prov ORDER BY u.cohort, c DESC" 2>&1 | tail -45
