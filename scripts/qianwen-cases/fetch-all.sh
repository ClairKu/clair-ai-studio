#!/bin/zsh
# 千问个例分析台取数：候选用户 + 全部明细，一条命令跑完（redash 数据源 41 / dw-tidb，需 VPN + REDASH_API_KEY）。
# 用法：CASE_CUT='YYYY-MM-DD HH:MM:SS' CASE_AD='YYYY-MM-DD' CASE_WORK=<目录> scripts/qianwen-cases/fetch-all.sh
#   CASE_CUT 必须与主看板 latest.json 的 data_cutoff 一致（validate-alignment.py 会校验）；CASE_AD 为资产快照日。
# 字段见 assemble-users.py 头部；SQL 与 2026-09-18 刷新时一致，唯基金穿透只计已确认成功金额（success_amount>0），
# 避免把失败的定投扣款算进「入金产品」。m_surnames.json 为作者端输入，不在本脚本范围。
set -eu
source ~/.zshrc 2>/dev/null
CUT="${CASE_CUT:?}"; AD="${CASE_AD:?}"; W="${CASE_WORK:?}"; mkdir -p "$W"
S="$(cd "$(dirname "$0")" && pwd)"
F() { python3 "$S/fetch.py" "$@"; }
START='2026-08-03'                      # 千问主看板窗口起点（含上线前灰度）
SENS_FROM=$(python3 -c "import datetime as d;print((d.date.fromisoformat('$START')-d.timedelta(days=7)).isoformat())")   # 埋点从上架前 7 天起
AD_M3=$(python3 -c "import datetime as d;print((d.date.fromisoformat('$AD')-d.timedelta(days=3)).isoformat())")

B="(SELECT user_id AS pmid, MIN(created_at) AS fb FROM ying99_qieman.qwen_user_map
    WHERE is_deleted=0 GROUP BY user_id
    HAVING MIN(created_at)>='$START 00:00:00' AND MIN(created_at)<'$CUT') b
   JOIN ying99_pomodel.portfolio_manager_info p ON p.po_manager_id=b.pmid"

echo "== 1/3 候选：绑定后有买入，且（绑定时 ROOT 资产为 0/未开户 或 人生首笔买入在绑定后）"
F "$W/candidates.json" "SELECT u.* FROM (
  SELECT b.pmid, b.fb, p.registered_at, p.gender,
    CASE WHEN CHAR_LENGTH(p.birthday_del)=8 THEN TIMESTAMPDIFF(YEAR,STR_TO_DATE(p.birthday_del,'%Y%m%d'),'${CUT:0:10}') END AS age,
    JSON_UNQUOTE(JSON_EXTRACT(p.register_location,'\$.province')) AS prov,
    (p.unionid IS NOT NULL AND p.unionid<>'') AS mp, (p.bank_no IS NOT NULL AND p.bank_no<>'') AS card, p.account3_id,
    CASE WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END AS cohort,
    CASE WHEN p.account3_id IS NULL THEN NULL ELSE (SELECT d.total_asset FROM ying99_asset.dwd_app_service_account_profit_combine d
      WHERE d.account3_id=p.account3_id AND d.relation_account_type='ROOT' AND d.cal_date<=DATE(b.fb) ORDER BY d.cal_date DESC LIMIT 1) END AS asset_at_bind,
    (SELECT MIN(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET' AND t.accept_time<'$CUT') AS first_buy_ever,
    (SELECT MAX(t.accept_time) FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.po_code<>'WALLET' AND t.accept_time<b.fb) AS last_buy_before
  FROM $B
  WHERE EXISTS(SELECT 1 FROM qm_meta.trade_detail t WHERE t.user_id=b.pmid AND t.canceled=0 AND t.buy_amount>0 AND t.accept_time>=b.fb AND t.accept_time<'$CUT')
) u WHERE u.asset_at_bind IS NULL OR u.asset_at_bind<=0 OR u.first_buy_ever>=u.fb ORDER BY u.fb" 900

IDS=$(python3 -c "import json;print(','.join(str(r['pmid']) for r in json.load(open('$W/candidates.json'))) or '0')")
A3=$(python3 -c "import json;print(','.join(str(r['account3_id']) for r in json.load(open('$W/candidates.json')) if r.get('account3_id') is not None) or '0')")
IDQ=$(python3 -c "print(','.join(\"'%s'\" % x for x in '$IDS'.split(',')))")
A3Q=$(python3 -c "print(','.join(\"'%s'\" % x for x in '$A3'.split(',')))")
echo "候选 pmid: $IDS ; account3: $A3"

echo "== 2/3 明细（交易 / 风测 / 小顾提问 / 资产序列 / 设备 / ROOT 流水）"
F "$W/d_trades.json" "SELECT t.user_id, t.accept_time, t.trade_type, t.po_code, COALESCE(pi.po_name,'') po_name, t.buy_amount, t.redeem_amount, t.canceled, t.extra FROM qm_meta.trade_detail t LEFT JOIN ying99_pomodel.portfolio_info pi ON pi.po_code=t.po_code WHERE t.user_id IN ($IDS) AND t.accept_time<'$CUT' ORDER BY t.user_id, t.accept_time" 300
F "$W/d_risk.json" "SELECT r.account3_id, r.created_at, r.score FROM ying99_accounts.risk_survey_record r WHERE r.account3_id IN ($A3) AND r.broker='0008' AND r.created_at<'$CUT' ORDER BY r.account3_id, r.created_at" 300
F "$W/d_asks.json" "SELECT s.qmuser_user_id uid, s.session_id, m.dj_gmt_create ts, m.user_input text FROM ying99_xiaogu3_qa.agent_dj_sessions s JOIN ying99_xiaogu3_qa.agent_dj_messages m ON m.session_id=s.session_id AND m.is_deleted=0 WHERE s.qmuser_user_id IN ($IDS) AND s.is_deleted=0 AND m.role='USER' AND m.user_input IS NOT NULL AND m.user_input<>'' AND m.dj_gmt_create<'$CUT' ORDER BY uid, ts" 300
F "$W/d_assets.json" "SELECT d.account3_id, d.cal_date, ROUND(SUM(d.total_asset),2) ta FROM ying99_asset.dwd_app_service_account_profit_combine d WHERE d.account3_id IN ($A3) AND d.relation_account_type='ROOT' AND d.cal_date>='$START' AND d.cal_date<='$AD' GROUP BY d.account3_id, d.cal_date ORDER BY d.account3_id, d.cal_date" 300
F "$W/d_device.json" "SELECT po_manager_id, platform, created_on, updated_on FROM ying99_pomodel.device_info WHERE po_manager_id IN ($IDS) ORDER BY po_manager_id, created_on" 300
F "$W/d_flows.json" "SELECT d.account3_id, d.cal_date, ROUND(SUM(d.input_amount),2) inflow, ROUND(SUM(d.output_amount),2) outflow FROM ying99_asset.dwd_app_service_account_profit_combine d WHERE d.account3_id IN ($A3) AND d.relation_account_type='ROOT' AND d.cal_date>='$START' AND d.cal_date<='$AD' GROUP BY d.account3_id, d.cal_date ORDER BY d.account3_id, d.cal_date" 300

echo "== 3/3 小顾入口 / 千问登录令牌 / 最终持有 / 埋点"
F "$W/m_sessions.json" "SELECT s.qmuser_user_id uid, s.session_id, s.aliyun_agent_id, s.trigger_source_type, s.title, s.dj_gmt_create, s.dj_last_active_time, (q.session_id IS NOT NULL) AS is_qwen, (SELECT COUNT(*) FROM ying99_xiaogu3_qa.agent_dj_messages m WHERE m.session_id=s.session_id AND m.is_deleted=0 AND m.role='USER' AND m.user_input IS NOT NULL AND m.user_input<>'') msgs FROM ying99_xiaogu3_qa.agent_dj_sessions s LEFT JOIN ying99_qieman.qwen_a2a_session_map q ON CAST(q.session_id AS CHAR)=CAST(s.session_id AS CHAR) AND q.is_deleted=0 WHERE s.qmuser_user_id IN ($IDS) AND s.is_deleted=0 AND s.dj_gmt_create<'$CUT' ORDER BY uid, s.dj_gmt_create" 300
F "$W/m_mia_msgs.json" "SELECT owner_id, sender_id, sender_platform_id, scene, query_mode, serve_mode, msg_type, content_type, bot_id, session_id, LEFT(content,120) content, create_time FROM ying99_mia.user_message WHERE owner_id IN ($IDS) AND deleted_at IS NULL AND create_time<'$CUT' ORDER BY owner_id, create_time LIMIT 2000" 300
F "$W/m_tokens.json" "SELECT user_id, created_at, expires_at, revoked_at FROM ying99_qieman.qwen_issued_token WHERE user_id IN ($IDS) AND created_at<'$CUT' ORDER BY user_id, created_at" 300
F "$W/m_combine17.json" "SELECT account3_id, service_account_id, relation_account_type, parent_service_account_id, ROUND(total_asset,2) ta, ROUND(holding_share,4) sh, ROUND(acc_profit,2) acc_profit FROM ying99_asset.dwd_app_service_account_profit_combine USE INDEX(idx_cal_date_saId) WHERE cal_date='$AD' AND account3_id IN ($A3) AND total_asset>0 ORDER BY account3_id, relation_account_type" 300
CA=$(python3 -c "import json;print(','.join(\"'%s'\" % r['service_account_id'] for r in json.load(open('$W/m_combine17.json')) if r['relation_account_type']=='CA') or \"'0'\")")
F "$W/m_meta.json" "SELECT service_account_id, cal_date, LEFT(meta,300) meta FROM ying99_asset.asset_service_account WHERE service_account_id IN ($CA) AND cal_date>='$AD_M3' ORDER BY service_account_id, cal_date DESC" 300
F "$W/m_bill.json" "SELECT account3_id, cal_month, po_code, po_name, fund_code, fund_name, ROUND(total_share,2) sh, ROUND(market_value,2) mv, nav_date FROM ying99_asset.dwd_ast_bill_user_holding_detail_monthly_full WHERE account3_id IN ($A3) AND cal_month>='2026-07' ORDER BY account3_id, cal_month DESC, market_value DESC LIMIT 200" 300
F "$W/m_fundorders.json" "SELECT fo.account_id, fo.fund_code, f.fund_name, ROUND(SUM(fo.success_amount),2) amt, COUNT(*) n, MIN(fo.accept_time) first_t FROM ying99_fundtxn.fund_order fo LEFT JOIN ying99_fundtxn.fund_info f ON f.fund_code=fo.fund_code JOIN (SELECT CAST(p.account3_id AS CHAR) account_id, b.fb FROM $B WHERE p.account3_id IS NOT NULL) x ON x.account_id=fo.account_id AND fo.accept_time>=x.fb WHERE fo.account_id IN ($A3Q) AND fo.order_type='1' AND fo.accept_time<'$CUT' AND fo.confirm_status<>'3' AND fo.success_amount>0 GROUP BY fo.account_id, fo.fund_code, f.fund_name ORDER BY fo.account_id, amt DESC LIMIT 300" 300
F "$W/m_sensors.json" "SELECT broker_user_id, event, event_category, page_name, title, element_content, screen_name, lib, event_time FROM qm_meta.ai_insight_sensors_event_detail WHERE event_date>='$SENS_FROM' AND broker_user_id IN ($IDQ) AND event_time<'$CUT' ORDER BY event_time LIMIT 80000" 900
echo "取数完成 → $W"
