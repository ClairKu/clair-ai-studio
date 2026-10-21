启明系列：调仓最终收益影响与客户核账（第二阶段）
研究日期2026-10-21；主分析截至2026-10-20。
线上：https://clairku.github.io/clair-ai-studio/reports/qiming-results-audit-2026-10-21/#client-impact

先看固定起点终值差，再看完整展示历史，最后看逐次胜率。模型贡献不是客户全部费后贡献，等身份XIRR与合并资金XIRR不可混用。

1. qiming-fixed-start-final-impact：36个可用/4个未成立场景，从既有模型状态继续调仓或冻结漂移份额；每个起点归一1万元，无后续资金流。不是新客按目标权重买入。
2. qiming-nav-calibration-model-comparison：8核心展示模型首日至截至日。正式模型与独立费用回放已对齐至约0.775bp以内；不是客户实付费后结论，部分展示史早于2021投顾服务上线。
3. qiming-adjustment-event-scores与calibration：452核心非初始调仓，445已结束/7未结束；本次t交易费归本次，u下一次交易前估值。保留原API/source_*对照。31个已结束期正负标签改变；原API合法NAV区间包含下一次费用，并非接口价格错误。
4. qiming-adjustment-events：465条原API记录，含13条未独立校准的非核心参考观察，不混入452新胜率。原cumret_net_excess_per是成本加回差，不是客户费后alpha。
5. customer-xirr-recalculated/pooled：按当前系统身份×策略合并SA现金流求XIRR（ACT/365），含退出客户。gross_source_ledger只指未追加loss_profit层，不是未扣任何费用。loss_adjusted_source_ledger只是日损益调整敏感性，尚非银行卡实付认证。合并资金XIRR不是身份XIRR平均。
6. customer-source-2005：且慢85个源年化200.5%账户日净CF全零，XIRR无唯一可识别值；不入均值，不改填0%。全渠道180源记录中其他渠道没有本次逐日CF复算。
7. customer-cashflow-reconciliation：中西4个身份少234.15日账投入，历史累计跳变已定位但无外部CF证据，仍剔除；旧6源损益调整桥有符号残差41.46元，未造流水冲平。
8. completed-execution-fees：仅P04/P2、执行成功且截至20日完成子集，27,391母单，196,565.65元登记交易费；不代表全部调仓总成本，失败/部分执行仍可能收费。无客户ID。
9. investment-responsibility-evidence：同期业务分工、共同调仓记录；不是连续正式任命，不把账号绑定或审批角色当个人投资能力。
10. 原始客户日度/快照文件保留原范围和源口径。当前映射身份不等于已确认全历史自然人。空缺覆盖日不补0，不将源XIRR直接认定已认证年化。

离线打开index.html；data目录与页面相对路径一致。overview.html仅为公开一手来源旧范围概览，完整授权详版以index为准。
用户明确授权公开非公开员工角色与审批、策略逐次调仓、聚合客户盈亏；包内不含客户ID、原始个人现金流、凭证或带令牌的下载链接。
