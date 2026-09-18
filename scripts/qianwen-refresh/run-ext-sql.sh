#!/bin/zsh
# 6 段之外的 7 段扩展取数，产物写到 $QW_WORK/<name>.txt，供 build-q.py 整理。
# 用法：QW_CUT='YYYY-MM-DD HH:MM:SS' QW_AD='YYYY-MM-DD' QW_WORK=<目录> scripts/qianwen-refresh/run-ext-sql.sh
# 7 段并行跑（redash 允许并发 adhoc），整轮约 5 分钟；任一段失败整体非零退出。
set -u
source ~/.zshrc 2>/dev/null
CUT="${QW_CUT:?}"; AD="${QW_AD:?}"; W="${QW_WORK:?}"
REDASH="$HOME/.claude/skills/redash/redash.py"
Q() { # Q <name> <timeout> <sql>
  local name=$1 to=$2 sql=$3
  python3 "$REDASH" execute-adhoc --timeout "$to" --sql "$sql" > "$W/$name.txt" 2>&1
  grep -qE "^-{5,}" "$W/$name.txt" || { echo "[$name] 失败: $(tail -2 "$W/$name.txt" | tr '\n' ' ')"; return 1; }
  echo "[$name] ok"
}
# 绑定用户基表（新老判定：注册与绑定相差 ≤60 分钟为新）
B="(SELECT user_id AS pmid, MIN(created_at) AS fb FROM ying99_qieman.qwen_user_map
    WHERE is_deleted=0 GROUP BY user_id
    HAVING MIN(created_at)>='2026-08-03 00:00:00' AND MIN(created_at)<'$CUT') b
   JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid"
COHORT="CASE WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END"
# 入金口径：充值到宝(线上/线下) + 银行卡直付买产品；组合回款进宝、宝内余额买产品不计
INFLOW_CASE="CASE WHEN t.trade_type='wallet.recharge' AND t.extra IN ('by.online','by.offline') THEN t.buy_amount
     WHEN t.trade_type<>'wallet.recharge' AND t.extra='from.card' THEN t.buy_amount ELSE 0 END"
INFLOW_PER_USER="(SELECT t.user_id, SUM($INFLOW_CASE) AS inflow FROM qm_meta.trade_detail t
   JOIN (SELECT user_id AS pmid, MIN(created_at) AS fb FROM ying99_qieman.qwen_user_map
         WHERE is_deleted=0 GROUP BY user_id) bb ON bb.pmid=t.user_id
   WHERE t.canceled=0 AND t.accept_time>=bb.fb AND t.accept_time<'$CUT' GROUP BY t.user_id)"
ASSET_AD="(SELECT account3_id, SUM(total_asset) ta FROM ying99_asset.dwd_app_service_account_profit_combine
   USE INDEX(idx_cal_date_saId) WHERE cal_date='$AD' AND relation_account_type='ROOT' GROUP BY account3_id)"

Q money 550 "SELECT u.cohort,
 ROUND(SUM(CASE WHEN t.trade_type IN ('po.buy','fund.buy','si.trade','po.adjust','plan.trade') THEN t.buy_amount ELSE 0 END)/10000,4) buy_wan,
 COUNT(DISTINCT CASE WHEN t.trade_type IN ('po.buy','fund.buy','si.trade','po.adjust','plan.trade') AND t.buy_amount>0 THEN t.user_id END) buy_users,
 ROUND(SUM(CASE WHEN t.redeem_amount>0 THEN t.redeem_amount ELSE 0 END)/10000,4) sell_wan,
 COUNT(DISTINCT CASE WHEN t.redeem_amount>0 THEN t.user_id END) sell_users,
 ROUND(SUM($INFLOW_CASE)/10000,4) inflow_wan,
 COUNT(DISTINCT CASE WHEN ($INFLOW_CASE)>0 THEN t.user_id END) inflow_users
FROM qm_meta.trade_detail t
JOIN (SELECT b.pmid, b.fb, $COHORT cohort FROM $B) u ON u.pmid=t.user_id
WHERE t.canceled=0 AND t.accept_time>=u.fb AND t.accept_time<'$CUT' GROUP BY u.cohort" &

Q newdims 550 "SELECT u.cohort, COUNT(*) pop, SUM(u.first_risk IS NOT NULL) risk_ever,
  SUM(u.first_risk > u.fb) first_risk_after_bind, SUM(u.last_risk > u.fb) any_risk_after_bind,
  SUM(u.first_fund IS NOT NULL AND u.first_fund > u.fb) first_fund_after_bind, SUM(u.first_fund IS NOT NULL) fund_ever
FROM (SELECT b.pmid, b.fb, $COHORT AS cohort,
    (SELECT MIN(r.created_at) FROM ying99_accounts.risk_survey_record r WHERE r.account3_id=p.account3_id AND r.broker='0008') AS first_risk,
    (SELECT MAX(r.created_at) FROM ying99_accounts.risk_survey_record r WHERE r.account3_id=p.account3_id AND r.broker='0008' AND r.created_at<'$CUT') AS last_risk,
    (SELECT MIN(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0) AS first_fund
  FROM $B) u GROUP BY u.cohort" &

Q repeat 550 "SELECT u.cohort, SUM(u.buys>=1) invested_after, SUM(u.buys>=2) repeat_invest
FROM (SELECT b.pmid, $COHORT AS cohort,
    (SELECT COUNT(*) FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0
       AND t.po_code<>'WALLET' AND t.accept_time>=b.fb AND t.accept_time<'$CUT') AS buys
  FROM $B) u GROUP BY u.cohort" &

Q zeroasset 550 "SELECT v.cohort, COUNT(*) inflow_users, ROUND(SUM(v.inflow)/10000,4) inflow_wan,
  SUM(CASE WHEN v.asset_at_bind IS NULL OR v.asset_at_bind<=0 THEN 1 ELSE 0 END) zero_users,
  ROUND(SUM(CASE WHEN v.asset_at_bind IS NULL OR v.asset_at_bind<=0 THEN v.inflow ELSE 0 END)/10000,4) zero_wan
FROM (SELECT g.cohort, g.inflow,
    CASE WHEN g.account3_id IS NULL THEN NULL ELSE
    (SELECT d.total_asset FROM ying99_asset.dwd_app_service_account_profit_combine d
       WHERE d.account3_id=g.account3_id AND d.relation_account_type='ROOT' AND d.cal_date<=DATE(g.fb)
       ORDER BY d.cal_date DESC LIMIT 1) END AS asset_at_bind
  FROM (SELECT b.pmid, b.fb, p.account3_id, $COHORT cohort, f.inflow FROM $B
        JOIN $INFLOW_PER_USER f ON f.user_id=b.pmid WHERE f.inflow>0) g) v GROUP BY v.cohort" &

Q zeroatbind 550 "SELECT x.cohort, COUNT(*) candidates, SUM(x.nonzero_at_bind) nonzero_at_bind
FROM (SELECT $COHORT cohort,
    (SELECT CASE WHEN d2.total_asset>0 THEN 1 ELSE 0 END FROM ying99_asset.dwd_app_service_account_profit_combine d2
       WHERE d2.account3_id=p.account3_id AND d2.relation_account_type='ROOT' AND d2.cal_date<=DATE(b.fb)
       ORDER BY d2.cal_date DESC LIMIT 1) nonzero_at_bind
  FROM $B WHERE p.account3_id IS NOT NULL AND p.account3_id<>1002
    AND EXISTS(SELECT 1 FROM ying99_asset.dwd_app_service_account_profit_combine d
               WHERE d.account3_id=p.account3_id AND d.relation_account_type='ROOT'
                 AND d.cal_date<=DATE(b.fb) AND d.total_asset>0)) x GROUP BY x.cohort" &

Q lifecycle 550 "SELECT u.cohort, COUNT(*) pop,
  SUM(CASE WHEN u.ta>0 OR (u.ever_buy=1 AND u.last_buy_day>='$AD') THEN 1 ELSE 0 END) under_mgmt,
  SUM(CASE WHEN NOT (u.ta>0 OR (u.ever_buy=1 AND u.last_buy_day>='$AD')) AND u.ever_buy=1 THEN 1 ELSE 0 END) churned,
  SUM(CASE WHEN NOT (u.ta>0 OR (u.ever_buy=1 AND u.last_buy_day>='$AD')) AND u.ever_buy=0 THEN 1 ELSE 0 END) never_inv
FROM (SELECT b.pmid, $COHORT AS cohort, COALESCE(a.ta,0) AS ta,
    EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET' AND t.accept_time<'$CUT') AS ever_buy,
    (SELECT MAX(DATE(t.accept_time)) FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET' AND t.accept_time<'$CUT') AS last_buy_day
  FROM $B LEFT JOIN $ASSET_AD a ON a.account3_id=p.account3_id AND p.account3_id<>1002) u GROUP BY u.cohort" &

Q segments 580 "SELECT s.seg, COUNT(*) pop, SUM(u.card) card_bound, SUM(u.assessed) assessed,
  ROUND(SUM(COALESCE(f.inflow,0))/10000,4) inflow_wan, SUM(COALESCE(f.inflow,0)>0) inflow_users,
  ROUND(SUM(COALESCE(a.ta,0))/10000,2) asset_wan, SUM(COALESCE(a.ta,0)>0) holders
FROM (SELECT b.pmid, b.fb, p.account3_id, $COHORT cohort,
    (p.bank_no IS NOT NULL AND p.bank_no<>'') card,
    EXISTS(SELECT 1 FROM qm_meta.user_survey_record_latest sv WHERE sv.broker='0008' AND sv.account3_id=CAST(p.account3_id AS CHAR)
           AND sv.answer_time>='2026-05-10 00:00:00' AND sv.answer_time<'$CUT') assessed,
    EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.accept_time>=b.fb AND t.accept_time<'$CUT') awakened,
    NOT EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET' AND t.accept_time<'$CUT') ever_no_buy
  FROM $B) u
LEFT JOIN $INFLOW_PER_USER f ON f.user_id=u.pmid
LEFT JOIN $ASSET_AD a ON a.account3_id=u.account3_id AND u.account3_id<>1002
JOIN (SELECT 'all' seg UNION ALL SELECT 'existing' UNION ALL SELECT 'awakened' UNION ALL SELECT 'never_inv' UNION ALL SELECT 'new') s
  ON s.seg='all' OR (s.seg='existing' AND u.cohort='existing')
  OR (s.seg='awakened' AND u.cohort='existing' AND u.awakened)
  OR (s.seg='never_inv' AND u.cohort='existing' AND u.ever_no_buy AND COALESCE(a.ta,0)<=0)
  OR (s.seg='new' AND u.cohort='new')
GROUP BY s.seg ORDER BY FIELD(s.seg,'all','existing','awakened','never_inv','new')" &

fails=0
for job in $(jobs -p); do wait $job || fails=$((fails+1)); done
[ $fails -eq 0 ] && echo "扩展 7 段全部完成" || { echo "扩展取数有 $fails 段失败"; exit 1; }
