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
python3 $S/validate-alignment.py public/reports/qianwen-user-acquisition-dashboard/data/latest.json $W/users.json
python3 $S/build-cases.py $W/users.json $W/page.html $S/base.css
node $S/encrypt-page.mjs $W/page.html public/reports/<slug>/index.html "千问绑定用户个例分析台"
cp public/reports/<slug>/index.html docs/reports/<slug>/index.html   # docs 副本须在 build 前就位
```

口径要点：个例页分类名称与主看板对齐 = 新投 / 首投 / 新户首投 / 老户唤回 / 老户首投；
入金与主看板同口径：绑定后线上/线下充值到盈米宝 + 银行卡直付买产品；组合回款进宝、宝内余额买产品不计；
发布前必须通过 `validate-alignment.py`，确保两页截止时刻一致，且五个共同客群的人数、入金人数、笔数与金额全部闭合；
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

## 2026-09-18 下午：神策埋点接入（且慢行为 / 下单终端）+ 个例卡改版

- 新增可选输入 `m_sensors.json`：`qm_meta.ai_insight_sensors_event_detail`，按 `broker_user_id`（= po_manager_id）拉 `event_date>='2026-08-01'` 的
  `event/event_category/page_name/screen_name/title/element_content/lib/event_time`（fetch.py 一条 SQL，7 人约 5k 行，LIMIT 20000 足够）。
  `lib` = iOS / Android / HarmonyOS 为 App 原生页，`js` 为内嵌或独立 H5。assemble-users.py 用 PAGE_MAP 把类名译成业务页名，不可读类名丢弃，
  输出每人 `events`（绑定前 7 天起至截止）与 `inflow_txns`（看板口径：线上/线下充值 + 银行卡直付买入）。
- 埋点推翻了 4 个手写渠道判定（B/D/E/F 其实都在 iOS App 内下单），故 narratives.json 的 `verdict` 已删除，
  「用户路径与行为总结」改为 build-cases.py `path_summary()` 规则生成（白话，不出现字段名/令牌/by.online）。
- 个例卡结构：顶部四格（入金+资产快照 / 绑定→首笔入金 / 入金笔数+前两笔日期 / 小顾对话三端拆分+全量弹窗图标）→
  「关键旅程｜且慢行为」双 TAB → 路径与行为总结（绿框）→ 最终持有（新增「入金金额」列与合计）。分页只保留 › 且循环。
- 小顾对话弹窗顶部支持按「全部 / 千问 / 且慢 / 微信」筛选提问；筛选数量、列表与空状态同步更新。
- 页面用户编号统一用匿名数字展示（原 A→1、B→2…），表格、个例、对话弹窗和跳转定位保持一致。
- 标题下方只展示一行小字总结（不换行，窄屏省略）；分类标签与主看板同名同义，并补齐「老户首投」。
