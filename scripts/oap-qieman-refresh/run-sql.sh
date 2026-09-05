#!/bin/zsh
# OAP × 且慢用户看板取数（redash 数据源 41）。口径全部经 08-17/08-18 发布值回放校准，
# 详见 research/oap-qieman-user-dashboard-2026-08-17.md §0-bis 与本目录 README。
# 用法：QO_WORK=<输出目录> [QO_CUT=YYYY-MM-DD] [QO_AD=YYYY-MM-DD] scripts/oap-qieman-refresh/run-sql.sh
#   QO_CUT 数据截止日（默认昨天）；QO_AD 资产快照 cal_date（默认今天，需先核实批次跑完：
#   当日 broker=0008 ROOT 行数明显少于前一日 = 没跑完，周末/节假日无批次）。
source ~/.zshrc 2>/dev/null
set -u
W="${QO_WORK:?需要 QO_WORK 输出目录}"
mkdir -p "$W"
R() { python3 $HOME/.claude/skills/redash/redash.py execute-adhoc --timeout 550 --sql "$1"; }

CUTD="${QO_CUT:-$(date -v-1d '+%Y-%m-%d')}"
AD="${QO_AD:-$(date '+%Y-%m-%d')}"
CUT="$CUTD 23:59:59"
W30S=$(date -j -v-29d -f '%Y-%m-%d' "$CUTD" '+%Y-%m-%d')
PREVS=$(date -j -v-59d -f '%Y-%m-%d' "$CUTD" '+%Y-%m-%d')
TREND0=$(date -j -v-89d -f '%Y-%m-%d' "$CUTD" '+%Y-%m-%d')
JSTART=$(date -j -v-16d -f '%Y-%m-%d' "$CUTD" '+%Y-%m-%d')
TESTKEY='479c9d2e-4d05-4098-bd72-994c82e0fd22'
echo "### params CUT=$CUT AD=$AD W30S=$W30S PREVS=$PREVS TREND0=$TREND0 JSTART=$JSTART"

# 每用户主表 M：批准=去重 user_id 且有 active key（排除测试 key）；曾调用/近30日活跃经 usage_details；
# 新老切分 = 注册日 >= 批准日（申请表每人最早 COALESCE(active_date,created_at)，缺失回退首个 key 时间）
M="SELECT u.user_id, u.first_key, u.approved,
     (c.user_id IS NOT NULL) called, (a.user_id IS NOT NULL) active30,
     p.account3_id, p.registered_at,
     CASE WHEN p.po_manager_id IS NULL OR p.registered_at IS NULL OR COALESCE(ap.appr, u.first_key) IS NULL THEN 'unknown'
          WHEN DATE(p.registered_at) >= DATE(COALESCE(ap.appr, u.first_key)) THEN 'new' ELSE 'existing' END seg,
     COALESCE(ap.appr, u.first_key) appr
   FROM (SELECT user_id, MIN(created_at) first_key, MAX(status='active') approved
         FROM ying99_oap.api_key
         WHERE user_id IS NOT NULL AND user_id<>'' AND id<>'$TESTKEY' AND created_at<='$CUT'
         GROUP BY user_id) u
   LEFT JOIN (SELECT DISTINCT k.user_id FROM ying99_oap.api_key_usage_details d
              JOIN ying99_oap.api_key k ON k.id=d.api_key_id
              WHERE d.request_at<='$CUT' AND k.user_id IS NOT NULL AND k.user_id<>'') c ON c.user_id=u.user_id
   LEFT JOIN (SELECT DISTINCT k.user_id FROM ying99_oap.api_key_usage_details d
              JOIN ying99_oap.api_key k ON k.id=d.api_key_id
              WHERE d.request_at>='$W30S 00:00:00' AND d.request_at<='$CUT' AND k.user_id IS NOT NULL AND k.user_id<>'') a ON a.user_id=u.user_id
   LEFT JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=u.user_id
   LEFT JOIN (SELECT user_id, MIN(COALESCE(active_date, created_at)) appr FROM ying99_oap.api_access_application GROUP BY user_id) ap ON ap.user_id=u.user_id"

# 资产按 account3 聚合：ROOT 总资产 / 在管=UMA−UMA_WALLET / ROOT 累计收益。
# ⚠️ 单日快照可用 USE INDEX(idx_cal_date_saId)；跨日期范围 + 小账户集时绝不能加（会 550s 超时）。
ASSET="SELECT d.account3_id,
    SUM(CASE WHEN d.relation_account_type='ROOT' THEN d.total_asset ELSE 0 END) ta,
    SUM(CASE WHEN d.relation_account_type='ROOT' THEN d.acc_profit ELSE 0 END) prof,
    SUM(CASE WHEN d.relation_account_type='UMA' THEN d.total_asset ELSE 0 END)
      - SUM(CASE WHEN d.relation_account_type='UMA_WALLET' THEN d.total_asset ELSE 0 END) uma_ex_w
  FROM ying99_asset.dwd_app_service_account_profit_combine d USE INDEX(idx_cal_date_saId)
  WHERE d.cal_date='$AD' AND d.broker='0008'
  GROUP BY d.account3_id"

step() { echo "### $1 $(date '+%H:%M:%S')"; }

step q1_usage
R "SELECT SUM(m.approved) approved, SUM(m.called) called, SUM(m.active30) active30 FROM ($M) m" > "$W/q1_pop.txt" 2>&1
R "SELECT COUNT(*) total_calls, SUM(k.user_id IS NOT NULL AND k.user_id<>'') attributed,
     SUM(d.request_at>='$W30S 00:00:00') calls_30d
   FROM ying99_oap.api_key_usage_details d LEFT JOIN ying99_oap.api_key k ON k.id=d.api_key_id
   WHERE d.request_at<='$CUT' AND d.api_key_id<>'$TESTKEY'" > "$W/q1_calls.txt" 2>&1

step q2_journey
R "SELECT DATE(d.request_at) dt, COUNT(*) daily_calls,
     COUNT(DISTINCT CASE WHEN k.user_id IS NOT NULL AND k.user_id<>'' THEN k.user_id END) daily_calling_users
   FROM ying99_oap.api_key_usage_details d LEFT JOIN ying99_oap.api_key k ON k.id=d.api_key_id
   WHERE d.request_at>='$JSTART 00:00:00' AND d.request_at<='$CUT' AND d.api_key_id<>'$TESTKEY'
   GROUP BY DATE(d.request_at) ORDER BY dt" > "$W/q2_daily.txt" 2>&1
R "SELECT DATE(m.first_key) dt, SUM(m.approved) new_users FROM ($M) m
   WHERE m.first_key>='$JSTART 00:00:00' GROUP BY DATE(m.first_key) ORDER BY dt" > "$W/q2_newusers.txt" 2>&1
R "SELECT COUNT(*) base_calls FROM ying99_oap.api_key_usage_details d
   WHERE d.request_at<'$JSTART 00:00:00' AND d.api_key_id<>'$TESTKEY'" > "$W/q2_basecalls.txt" 2>&1
R "SELECT SUM(m.approved) base_users FROM ($M) m WHERE m.first_key<'$JSTART 00:00:00'" > "$W/q2_baseusers.txt" 2>&1

step q3_assets_by_cohort_seg
for CO in approved called active30; do
  case $CO in approved) F="m.approved=1";; called) F="m.called=1";; active30) F="m.active30=1";; esac
  R "SELECT m.seg, COUNT(*) users,
       SUM(m.account3_id IS NOT NULL AND m.account3_id<>'') qacct,
       SUM(f.ta>0) holders, SUM(f.ta>0 AND f.uma_ex_w>0) managed, SUM(f.ta>0 AND f.prof>0) profitable,
       ROUND(SUM(CASE WHEN f.ta>0 THEN f.ta ELSE 0 END),2) aum,
       SUM(f.ta>0 AND f.ta<10000) b1, SUM(f.ta>=10000 AND f.ta<100000) b2,
       SUM(f.ta>=100000 AND f.ta<500000) b3, SUM(f.ta>=500000 AND f.ta<1000000) b4, SUM(f.ta>=1000000) b5
     FROM ($M) m LEFT JOIN ($ASSET) f ON f.account3_id=m.account3_id
     WHERE $F GROUP BY m.seg" > "$W/q3_${CO}.txt" 2>&1
done

step q5_registrations
for CO in approved called active30; do
  case $CO in approved) F="m.approved=1";; called) F="m.called=1";; active30) F="m.active30=1";; esac
  R "SELECT SUM(m.registered_at BETWEEN '$W30S 00:00:00' AND '$CUT') reg_cur,
       SUM(m.registered_at BETWEEN '$PREVS 00:00:00' AND DATE_SUB('$W30S 00:00:00', INTERVAL 1 SECOND)) reg_prev,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=0 AND m.registered_at>='$TREND0') t0,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=1 AND m.registered_at>='$TREND0') t1,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=2 AND m.registered_at>='$TREND0') t2,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=3 AND m.registered_at>='$TREND0') t3,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=4 AND m.registered_at>='$TREND0') t4,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=5 AND m.registered_at>='$TREND0') t5,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=6 AND m.registered_at>='$TREND0') t6,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=7 AND m.registered_at>='$TREND0') t7,
       SUM(FLOOR(DATEDIFF(DATE(m.registered_at),'$TREND0')/10)=8 AND m.registered_at>='$TREND0' AND m.registered_at<='$CUT') t8
     FROM ($M) m WHERE $F" > "$W/q5_${CO}.txt" 2>&1
done

step q4_cashflow
for CO in approved called active30; do
  case $CO in approved) F="m.approved=1";; called) F="m.called=1";; active30) F="m.active30=1";; esac
  R "SELECT g.bucket, COUNT(DISTINCT CASE WHEN g.inflow>0 THEN g.account3_id END) inflow_users,
       ROUND(SUM(g.inflow),2) inflow, ROUND(SUM(g.outflow),2) outflow
     FROM (SELECT CONCAT('t', FLOOR(DATEDIFF(d.cal_date,'$TREND0')/10)) bucket, d.account3_id,
              SUM(d.input_amount) inflow, SUM(d.output_amount) outflow
       FROM ying99_asset.dwd_app_service_account_profit_combine d
       JOIN (SELECT DISTINCT m.account3_id FROM ($M) m WHERE $F AND m.account3_id IS NOT NULL AND m.account3_id<>'') u ON u.account3_id=d.account3_id
       WHERE d.cal_date BETWEEN '$TREND0' AND '$CUTD' AND d.broker='0008' AND d.relation_account_type='ROOT'
       GROUP BY bucket, d.account3_id) g GROUP BY g.bucket ORDER BY g.bucket" > "$W/q4t_${CO}.txt" 2>&1
  R "SELECT g.bucket, COUNT(DISTINCT CASE WHEN g.inflow>0 THEN g.account3_id END) inflow_users,
       ROUND(SUM(g.inflow),2) inflow, ROUND(SUM(g.outflow),2) outflow
     FROM (SELECT IF(d.cal_date>='$W30S','cur','prev') bucket, d.account3_id,
              SUM(d.input_amount) inflow, SUM(d.output_amount) outflow
       FROM ying99_asset.dwd_app_service_account_profit_combine d
       JOIN (SELECT DISTINCT m.account3_id FROM ($M) m WHERE $F AND m.account3_id IS NOT NULL AND m.account3_id<>'') u ON u.account3_id=d.account3_id
       WHERE d.cal_date BETWEEN '$PREVS' AND '$CUTD' AND d.broker='0008' AND d.relation_account_type='ROOT'
       GROUP BY bucket, d.account3_id) g GROUP BY g.bucket ORDER BY g.bucket" > "$W/q4w_${CO}.txt" 2>&1
done

step q8_calls_by_seg
R "SELECT m.seg,
     SUM(CASE WHEN m.approved=1 THEN cu.calls ELSE 0 END) calls_approved,
     SUM(CASE WHEN m.called=1 THEN cu.calls ELSE 0 END) calls_called,
     SUM(CASE WHEN m.active30=1 THEN cu.calls ELSE 0 END) calls_active30
   FROM ($M) m JOIN (
     SELECT k.user_id, COUNT(*) calls FROM ying99_oap.api_key_usage_details d
     JOIN ying99_oap.api_key k ON k.id=d.api_key_id
     WHERE d.request_at<='$CUT' AND d.api_key_id<>'$TESTKEY' AND k.user_id IS NOT NULL AND k.user_id<>''
     GROUP BY k.user_id) cu ON cu.user_id=m.user_id
   GROUP BY m.seg" > "$W/q8_calls_seg.txt" 2>&1

step q9_siplan_tenure
R "SELECT m.seg,
     SUM(CASE WHEN m.approved=1 THEN sp.has ELSE 0 END) si_approved,
     SUM(CASE WHEN m.called=1 THEN sp.has ELSE 0 END) si_called,
     SUM(CASE WHEN m.active30=1 THEN sp.has ELSE 0 END) si_active30
   FROM ($M) m LEFT JOIN (
     SELECT ip.broker_user_id a3, 1 has FROM ying99_smartadvisor.user_manage_account_invest_plan ip
     WHERE ip.broker='0008' AND ip.deleted_at IS NULL AND ip.status='CONFIRM_PLAN' AND ip.created_at<='$CUT'
     GROUP BY ip.broker_user_id) sp ON sp.a3=m.account3_id
   GROUP BY m.seg" > "$W/q9_siplan.txt" 2>&1
R "SELECT m.seg,
     SUM(m.approved=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 0 AND 7) ap_d0_7,
     SUM(m.approved=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 8 AND 30) ap_d8_30,
     SUM(m.approved=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 31 AND 90) ap_d31_90,
     SUM(m.approved=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) > 90) ap_d90p,
     SUM(m.called=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 0 AND 7) ca_d0_7,
     SUM(m.called=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 8 AND 30) ca_d8_30,
     SUM(m.called=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 31 AND 90) ca_d31_90,
     SUM(m.called=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) > 90) ca_d90p,
     SUM(m.active30=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 0 AND 7) ac_d0_7,
     SUM(m.active30=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 8 AND 30) ac_d8_30,
     SUM(m.active30=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) BETWEEN 31 AND 90) ac_d31_90,
     SUM(m.active30=1 AND DATEDIFF(DATE(m.registered_at),DATE(m.appr)) > 90) ac_d90p
   FROM ($M) m WHERE m.seg='new' GROUP BY m.seg" > "$W/q9_tenure_new.txt" 2>&1
R "SELECT m.seg,
     SUM(m.approved=1 AND m.registered_at > DATE_SUB('$CUT', INTERVAL 1 YEAR)) ap_lt1y,
     SUM(m.approved=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 1 YEAR) AND m.registered_at > DATE_SUB('$CUT', INTERVAL 3 YEAR)) ap_y13,
     SUM(m.approved=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 3 YEAR)) ap_y3p,
     SUM(m.called=1 AND m.registered_at > DATE_SUB('$CUT', INTERVAL 1 YEAR)) ca_lt1y,
     SUM(m.called=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 1 YEAR) AND m.registered_at > DATE_SUB('$CUT', INTERVAL 3 YEAR)) ca_y13,
     SUM(m.called=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 3 YEAR)) ca_y3p,
     SUM(m.active30=1 AND m.registered_at > DATE_SUB('$CUT', INTERVAL 1 YEAR)) ac_lt1y,
     SUM(m.active30=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 1 YEAR) AND m.registered_at > DATE_SUB('$CUT', INTERVAL 3 YEAR)) ac_y13,
     SUM(m.active30=1 AND m.registered_at <= DATE_SUB('$CUT', INTERVAL 3 YEAR)) ac_y3p
   FROM ($M) m WHERE m.seg='existing' GROUP BY m.seg" > "$W/q9_tenure_existing.txt" 2>&1

echo "ALL DONE $(date '+%H:%M:%S')"
