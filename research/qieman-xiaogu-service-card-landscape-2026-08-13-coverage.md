# 覆盖与口径

## 覆盖结果

| 口径 | 数量 | 说明 |
|---|---:|---|
| 前端注册卡片 | 35 | `XiaoguCardRenderer` 中的注册项 |
| 生产独立落卡 | 23 | 两轮测试中至少一次出现对应专用卡片 |
| 需求完成但专卡降级 | 5 | 通用 ECharts、资产分析或文字承接 |
| 交叉测试仍未独立落卡 | 7 | 工具未接通、无数据或回退文字 |
| 推荐问法 | 37 | “可以这么问”面板中的示例 |
| 快捷服务 | 20 | 五个快捷服务分组中的入口 |
| 首页快捷入口 | 5 | 首页顶部快捷按钮 |

## 独立落卡 23 种

`card_fund_detail`、`card_asset_analysis_visualization`、`card_asset_flow_summary`、`card_latest_profit`、`card_profit_calendar`、`card_sub_account_profit`、`card_product_profit`、`card_monthly_statement`、`card_account_diagnose_report`、`card_account_diagnose_entry`、`card_monthly_analysis_specify`、`card_monthly_analysis_range`、`card_prod_detail`、`card_recommend_product`、`card_account_invest_plan`、`card_market_thermometer`、`card_idx_eval_detail`、`card_subscribed_content`、`card_todo_items`、`card_inbox_msgs`、`card_echart`、`card_feedback_human_service`、`card_processing_asset`。

## 需求完成但专卡降级 5 种

`card_fund_holding_concentration_compare`、`card_fund_basic_info_compare`、`card_fund_fee_compare`、`card_fund_performance_compare`、`card_product_holding_summary`。

## 交叉测试仍未独立落卡 7 种

`card_fund_manager_detail`、`card_fund_list`、`card_asset_cert_result`、`card_prod_search`、`card_rebalance_adjust_list`、`card_industry_viewpoint`、`card_news`。

## 未覆盖边界

- 未以多种账户身份和权限组合做覆盖测试。
- 未执行任何会改变账户或外部系统状态的操作。
- 未验证全部错误态、弱网、超时与异常参数。
- 未核验每个卡片的埋点、转化率、无障碍与跨端一致性。
- 未将本次结果解释为生产验收或合规结论。

## 场景截图覆盖

- 账户：资产分析、月度对账单、指定月分析，个人标签、比例和金额均已脱敏。
- 投研与规划：基金研究、定制方案，保留公开生产界面。
- 服务承接：人工服务卡与第三方会话结束，保留真实跳转前后效果。
- 公开证据：基金详情与指数估值，保留公开市场和基金数据。
