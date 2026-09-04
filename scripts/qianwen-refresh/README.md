# 千问看板数据刷新（qianwen-user-acquisition-dashboard）

半自动流程：SQL 取数 → 整理成 q1..q4.json → 组装校验 → worktree 重放 → API 推送。
整轮约 15 分钟。历史沿革与口径详证见 research/qianwen-user-acquisition-dashboard-2026-08-17.md。

## 流程

```bash
WORK=$(mktemp -d)/qianwen-refresh && mkdir -p $WORK

# 1. 取数（需 VPN + ~/.zshrc 里的 REDASH_API_KEY；数据源 41 dw-tidb）
#    QW_AD=资产快照日：必须取最近一个「跑完」的 cal_date（周末/节假日无批次；
#    当日行数明显少于前一日 = 没跑完）
QW_CUT="$(date '+%Y-%m-%d %H:%M:%S')" QW_AD=2026-09-03 \
  scripts/qianwen-refresh/run-sql.sh | tee $WORK/sql-raw.txt

# 2. 人工/会话把 6 段输出整理成 $WORK/q1.json..q4.json（schema 见下）

# 3. 组装 + 校验（逐日闭合、维度人数与 q1 基准归一、资产两维一致性）
python3 scripts/qianwen-refresh/assemble.py \
  public/reports/qianwen-user-acquisition-dashboard/data/latest.json $WORK

# 4. 基于最新 origin/main 的临时 worktree 重放 + build + commit（只带自己 3 个文件）
QW_WORK=$WORK scripts/qianwen-refresh/replay.sh

# 5. 经 GitHub Git Data API 推送（绕开时好时坏的 443 直连）
QW_WT=$WORK/wt python3 scripts/qianwen-refresh/api-push.py
```

## q1..q4.json schema

- `q1`：`{"data_cutoff":"YYYY-MM-DD HH:MM:SS","duplicate_bindings":N,"unmatched_accounts":N,"days":[{"date","new","existing","unclassified"}...]}`（自 2026-08-03 起逐日）
- `q2`：`{"cohorts":{all|new|existing:{gender:{male,female,unknown}, age_bucket:{lte_25..gte_66,unknown}, wechat_mp_status:{...}, bank_card_status:{...}, risk_assessment_status:{...}, lifetime_investment_status:{...}, residence_province:{省名:N,...,unknown:N}}}}`
- `q3`：`{"behavior":{co:{<metric_id>:{eligible,excluded,reached,not_reached,unknown}}},"business":{co:{holding_amount:{accounts,amount_wan}}}}`
- `q4`：`{"as_of":"YYYY-MM-DD","cohorts":{co:{asset_holding_status:{has_assets,no_assets,unknown}, asset_bucket:{no_assets,lt_10k,10k_100k,100k_1m,gte_1m,unknown}}}}`

## 口径红线（都踩过坑，别再犯）

- **资产一律 ROOT 层**：`dwd_app_service_account_profit_combine` 是树形表，全层级 SUM 把同一笔钱重复累加约 3 倍（曾把 7,284 万错发成 2.18 亿）。
- **新老分界是每个用户自己的 first_bound_at**（±60 分钟内注册=新），不是服务上线时刻。
- 入金/买入/赎回**金额**权威源（MaxCompute 现金流表）未接入，保持 `unavailable + authoritative_source_unavailable`，不发布口径漂移数字。
- 「开户但资产表当日无 ROOT 行」= no_assets；unknown 只放未开资金账户的人。
- 小样本自 2026-08-24 起全量披露（minimum_public_cell=1）。**数据、validate 脚本、app.js 的 minimumCell 三处必须一致**，否则线上白屏——replay.sh 已做前置校验，报错就先对齐三处。

## 发布注意

- docs/ 下是加密单页，**永远不要手工往 docs/ 拷明文数据**；npm run build（encrypt → inject 顺序）自动重生成。
- build 会顺带改动 vite 哈希、search-index、他人报告页——commit 只带自己 3 个文件（replay.sh 已处理）。
- api-push.py 有远端 HEAD 前进保护：报「远端 HEAD 已变」就重跑 replay.sh（本仓库并行会话极活跃）。
- 发布后浏览器/GitHub Pages 有缓存，验证要带 `?v=xxx` 强刷，别误判成没发上去。
- 本机常驻刷新服务（launchd `com.clair.qianwen-user-acquisition-refresh`，127.0.0.1:43122/43123）是页面「更新数据」按钮的本机入口，与本流程互不依赖。
