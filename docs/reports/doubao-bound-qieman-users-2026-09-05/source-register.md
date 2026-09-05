# 豆包绑定且慢用户深度分析｜证据登记

- 数据生成：2026-09-05 21:41:42（Asia/Shanghai，当日未结束）
- 资产快照：2026-09-04（最近完整批次）
- 环境：盈米生产数仓，经 Redash 数据源 41 只读聚合
- 发布边界：仅公开脱敏聚合，不含用户明细、凭证、原始对话或单用户金额

## 核心口径

1. 有效授权用户：豆包 OAuth Client 下，`revoked_at IS NULL AND superseded_at IS NULL` 的去重 `user_id`。
2. 授权即新建身份：且慢 `registered_at` 与首次豆包 `granted_at` 相差不超过 60 分钟。
3. 资金账户：`portfolio_manager_info.account3_id` 非空；绑卡：`bank_no` 非空。
4. 绑定后买入：首次授权后，`trade_detail` 中未撤销、非 `WALLET`、`buy_amount>0` 的用户。
5. 当前持仓：2026-09-04 资产快照中，且慢 broker `0008`、`ROOT` 层 `total_asset>0`；不跨层累加。
6. 同主体 OAP 调用：OAuth `user_id` 与 API Key `user_id` 相同，且调用发生在首次授权之后。API Key 未稳定绑定豆包 Client/会话，因此不视为豆包直接调用量。

## 证据表

| 分析层 | 生产表 | 用途 | 关键边界 |
|---|---|---|---|
| 授权 | `ying99_oap.api_user_consent_record`、`api_oauth_client` | 有效授权、首次授权、覆盖记录 | 133 条 superseded 代表历史版本替换，不代表 133 人流失 |
| 身份 | `ying99_pomodel.portfolio_manager_info` | 注册、新老、资金账户、绑卡、基础画像 | 新建且慢身份不等于资金账户开户 |
| 交易 | `qm_meta.trade_detail` | 首次/绑定后买入、赎回人数 | 时间先后不等于渠道因果；不发布金额 |
| 风测 | `qm_meta.user_survey_record_latest` | 风险测评覆盖 | 当前样本字段覆盖低，不做细画像外推 |
| 资产 | `ying99_asset.dwd_app_service_account_profit_combine` | 持仓、在管、累计收益 | 只取 broker=0008、ROOT 层、最近完整批次 |
| 调用 | `ying99_oap.api_key`、`api_key_usage_details`、`api_route` | 同主体调用、能力偏好 | 缺少 OAuth Client/豆包会话到每次调用的稳定血缘 |
| 服务 | `ying99_scrm.customer_list_detail`、`customer_list_follow_record`、`call_center_record`、`customer_list_meeting_record` | 顾问承接、跟进、接通、会议 | 系统跟进与人工跟进需分开；本报告只陈述绑定后是否出现记录 |

## 双重核验

核心指标由主聚合与独立审计 SQL 两次计算，结果一致：341 名有效授权；194 名授权即新建身份；新客资金账户、绑卡、绑定后买入均为 0；存量用户绑定后非钱包买入 11；且慢 broker=0008 当前持仓 30、资产 4,344,854.28 元；同主体授权后调用 35 人、3,408 次。

## 不可得与不得外推

- 当前授权记录的 `granted_scopes` 均为空数组、`data_permissions` 均为空；这只能证明“记录层无法审计细粒度权限”，不能直接证明实际能力为零或无限权限。
- 绑定窗口只有 8 天，不能给出 30 日留存、LTV、资产长期增量。
- 11 名绑定后买入者全部为既有投资用户，只证明时间相关，不证明豆包促成交易。
- 不公开低于 5 人的细分精确值；无法分类用户在公开报告中以 `<5` 呈现。
