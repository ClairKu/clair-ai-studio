# OAP × 且慢用户看板数据刷新（oap-qieman-user-dashboard）

半自动流程：SQL 取数 → 组装（自动做 k=20 抑制与传播）→ 校验 → build → 发布。
整轮约 20 分钟。口径详证与回放校准记录见 research/oap-qieman-user-dashboard-2026-08-17.md §0-bis。

## 流程

```bash
WORK=$(mktemp -d)/oapq && mkdir -p $WORK

# 1. 取数（需 VPN + ~/.zshrc 里的 REDASH_API_KEY；数据源 41 dw-tidb）
#    QO_AD=资产快照 cal_date：先核实批次跑完（当日 broker=0008 ROOT 行数
#    明显少于前一日 = 没跑完；周末/节假日无批次）
QO_WORK=$WORK QO_CUT=2026-09-03 QO_AD=2026-09-04 scripts/oap-qieman-refresh/run-sql.sh

# 2. 组装（模板 = 上一版 latest.json；自动做小样本抑制、差分反推防护、抑制上下传播）
python3 scripts/oap-qieman-refresh/assemble.py \
  public/reports/oap-qieman-user-dashboard/data/latest.json $WORK \
  --cut 2026-09-03 --ad 2026-09-04

# 3. 落盘 + 校验 + build（--write-fallback 生成兜底文件；build 生成 docs/ 镜像）
cp $WORK/latest.new.json public/reports/oap-qieman-user-dashboard/data/latest.json
node scripts/validate-oap-qieman-user-dashboard.mjs --write-fallback
npm run build

# 4. 只提交自己的文件：public+docs 的 latest.json + fallback-data.js（build 顺带改动的
#    vite 哈希 / search-index / 他人报告不要带上），pull --rebase 后推送
```

## 口径要点（全部经 08-17/08-18 发布值回放校准）

- 人群主键 `ying99_oap.api_key.user_id`：批准 = 去重、非空、有 active key、排除测试 key
  `479c9d2e-…`；曾调用 / 近 30 日活跃经 `api_key_usage_details` 关联（不限 key 状态）。
- 且慢账户 = `portfolio_manager_info.account3_id` 非空；资产 = dwd combine
  `broker='0008'`，持仓 = ROOT total_asset>0，**在管 = UMA−UMA_WALLET>0**（复现口径，
  两版回放偏差 ≤5 户），收益为正 = ROOT acc_profit>0。
- 新老切分：注册日 ≥ 批准日（`api_access_application` 每人最早
  `COALESCE(active_date, created_at)`，无申请记录回退首个 key 创建时间）。
- 入账/出账代理 = dwd ROOT input_amount/output_amount 窗口求和；金额按万元汇总。
- 定投计划 = `ying99_smartadvisor.user_manage_account_invest_plan`
  （broker='0008'，status='CONFIRM_PLAN'，未删除）。
- **行为（7 类交易）与问卷画像按分源截止保持冻结**（2026-08-16，自带当时分母），
  assemble.py 原样保留模板里的这两块；且慢全量基线（qieman_baseline）同样冻结在
  2026-08-18——其「在管用户 291,936」来自当时的官方汇总口径，dwd 无法复现。

## 坑

- ⚠️ dwd combine「小账户集 × 日期范围」查询**不要**加 `USE INDEX(idx_cal_date_saId)`，
  让优化器走 account3_id 索引（否则 90 日窗口 550 秒超时）；单日全量快照才用该 hint。
- TiDB 不支持 `GROUP BY … WITH ROLLUP`（报 Can't find a proper physical plan），
  分段合计在 assemble.py 里做。
- 校验器是硬闸门：journey 累计值按 20 取整、跨人群差分 1–19 禁止、抑制必须上下传播——
  assemble.py 已实现同语义；改口径两边要一起改。
- 首次资产入账 / D7-D30 漏斗仍为 missing（全历史扫描不可行），不要用窗口内入账人数顶替。
