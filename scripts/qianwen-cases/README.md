# 千问绑定用户个例分析台（qianwen-first-investor-cases-*）重烘焙

页面是静态烘焙的加密单页，**不随看板 latest.json 联动**；要更新按以下步骤重跑（约 20 分钟，主要是候选 SQL）。

```bash
W=$(mktemp -d)/cases && mkdir -p $W && S=scripts/qianwen-cases
CUT='2026-09-17 16:45:49'          # 与看板 data_cutoff 一致
# 1. 候选用户：绑定后有买入，且（绑定时 ROOT 资产为 0/未开户 或 人生首笔买入在绑定后）
#    SQL 见 assemble-users.py 头部注释所需字段；输出 JSON（fetch.py <out.json> "<sql>" [timeout]）
python3 $S/fetch.py $W/candidates.json "<候选 SQL>" 900
# 2. 明细：trades / risk / asks / assets(ta 序列) / device / flows(ROOT input/output) —— 字段名见 assemble-users.py
python3 $S/fetch.py $W/d_trades.json "..." ; ... d_risk d_asks d_assets d_device d_flows
# 3. 归一化 + 生成 + 加密
cp $S/narratives.json $W/            # 已有个例的手写叙事与渠道判定（按 pmid），新用户可追加
python3 $S/assemble-users.py $W "$CUT" <bound_total>
python3 $S/build-cases.py $W/users.json $W/page.html $S/base.css
node $S/encrypt-page.mjs $W/page.html public/reports/<slug>/index.html "千问绑定用户个例分析台"
cp public/reports/<slug>/index.html docs/reports/<slug>/index.html   # docs 副本须在 build 前就位
```

口径要点：四口径 = 绑定时资产为 0（含入金）/ 老用户唤回（其中老客）/ 全新用户首投 / 用户首投；
入金用资产表 ROOT input_amount（各用户自绑定日起），当日成交未落账者以充值额暂代；
渠道判定规则驱动（device_info platform 3=iOS/4=安卓/5=鸿蒙 + 订单 extra + 时间线），有手写 verdict 的用户优先用手写。
候选 SQL 的 asset_at_bind 子查询要加 `CASE WHEN account3_id IS NULL THEN NULL ELSE (...) END` 短路，否则 5k 用户会超时。
新加密子页落库五处：public+docs 密文、inject-site-access-gate.mjs、tests/site-access-gate.test.mjs、validate-workbench.mjs、catalog/report-registry.json（supporting-page）。

## 2026-09-17 晚追加：小顾入口 / 下单终端 / App 操作 / 最终持有

assemble-users.py 额外读取（缺失则跳过）：`m_sessions.json`（agent_dj_sessions LEFT JOIN qwen_a2a_session_map，is_qwen 标千问会话；另一 agent 844489… 为且慢 App 内小顾 3.0）、
`m_mia_msgs.json`（ying99_mia.user_message = 且慢 App 内小顾 Mia，sender_id='USER' 行，scene/query_mode）、`m_tokens.json`（ying99_qieman.qwen_issued_token，
千问侧 agent 登录令牌签发时刻=千问会话活跃时刻）、`m_combine17.json`（dwd combine 当日全层级行，CA/WALLET 子账户市值）、`m_bill.json`
（dwd_ast_bill_user_holding_detail_monthly_full 月末基金明细）、`m_fundorders.json`（ying99_fundtxn.fund_order，account_id=account3_id，
order_type=1 按 fund_code 汇总成功金额，穿透组合底层基金）。CA→组合名：asset_service_account.meta 无数据时按绑定后买入金额就近匹配。
口径限制：fund_order.txn_source 是销售机构代码非终端；微信/企微侧小顾（advisor_conversation）七人均无记录；「千问内嵌 H5 vs App」仍为推断。
