# 豆包看板数据刷新（doubao-user-acquisition-dashboard）

App 使用统计由 `run-ext-sql.sh` 调用 `scripts/refresh-app-usage.py` 生成 `app-usage.json`，组装时校验截止时点和绑定人群。原生 App 埋点（iOS / Android / HarmonyOS）与设备注册（platform 3 / 4 / 5）按用户去重；小程序和 H5 不计入，暂无记录不代表从未使用。

豆包 X 且慢AI小顾用户数据看板，与千问看板（`scripts/qianwen-refresh/`）**同一套页面、同一套口径、同一条流水线**，
只把「绑定用户」的基表从千问的 `qwen_user_map` 换成豆包的 OAuth 授权记录：

| | 千问看板 | 豆包看板 |
| --- | --- | --- |
| 绑定用户 | `ying99_qieman.qwen_user_map`，`is_deleted=0` | `ying99_oap.api_user_consent_record`，`client_id='doubao'`，当前仍有未撤销授权（`SUM(revoked_at IS NULL)>0`） |
| 首次绑定时刻 `fb` | `MIN(created_at)` | `MIN(granted_at)` |
| 统计窗口起点 | 2026-08-03（含上线前灰度，8-10 08:00 正式上线） | 2026-08-28（豆包上架首日即有绑定，无灰度期，`launch_at = window_start_at`） |
| 「绑定后有效使用 AI 小顾」 | `qwen_a2a_session_map` 绑定后有会话 | `api_oauth_refresh_token` 绑定后产生过豆包会话令牌（豆包侧不落工具级明细，以会话令牌作代理，与豆包全景报告一致） |

其余全部一致：新老分界按每个用户自己的 `fb` ±60 分钟判定；资产一律 ROOT 层；入金口径 = 充值到宝（线上/线下）+ 银行卡直付；
分客群 9 维度、画像 12 维度、行为 9 指标、经营 6 指标；小样本自全量披露（`minimum_public_cell=1`）。
口径红线与踩坑记录见 `scripts/qianwen-refresh/README.md`，这里不重复。

首投、新户首投、老户首投、复投、历史投过和生命周期一律采用同一合格新增入金事件：非撤单、正金额的线上/线下钱包充值或银行卡直付产品，且接受时间早于截止时刻。人生首笔合格新增入金在绑定后即算首投，钱包充值无须再买产品；复投按绑定后至少 2 笔合格新增入金计算。老户唤回拆为老户首投与清仓后唤回。产品买入仍单列，宝内原余额买入不计新增入金。

`build-q.py` 校验首投总数等于新户首投加老户首投，基础首投行为等于首次入金行为及分客群首投；投资、首投和复投行为均以全体绑定用户为分母。累计投资画像采用同口径生命周期数据，避免旧产品买入口径混入。

## 手动刷新流程

```bash
WORK=$(mktemp -d)/doubao-refresh && mkdir -p $WORK
cd <clair-ai-studio 仓库>      # 建议 git worktree add --detach <目录> origin/main

# 0. 资产快照日：最近一个「跑完」的 cal_date（周末/节假日无批次）
AD=$(python3 scripts/qianwen-refresh/pick-asset-date.py)
CUT="$(date '+%Y-%m-%d %H:%M:%S')"; echo "$CUT" > $WORK/cut.txt; echo "$AD" > $WORK/ad.txt

# 1. 取数（需 VPN + ~/.zshrc 的 REDASH_API_KEY；数据源 41 dw-tidb）：6 段 + 扩展经营/使用节奏
QW_CUT="$CUT" QW_AD="$AD" scripts/doubao-refresh/run-sql.sh > $WORK/sql-raw.txt
QW_CUT="$CUT" QW_AD="$AD" QW_WORK=$WORK scripts/doubao-refresh/run-ext-sql.sh

# 2. 整理成 q1..q6.json，再以上一版 latest.json 为模板组装 + 闭合校验
python3 scripts/doubao-refresh/build-q.py $WORK
python3 scripts/doubao-refresh/assemble.py \
  public/reports/doubao-user-acquisition-dashboard/data/latest.json $WORK
cp $WORK/latest.new.json public/reports/doubao-user-acquisition-dashboard/data/latest.json

# 3. 缩图随数据重生成；构建会顺带校验（validate-doubao-user-acquisition-dashboard.mjs）、
#    重写 fallback-data.js、加密出 docs/reports/doubao-user-acquisition-dashboard/index.html
python3 scripts/doubao-refresh/build-preview.py
npm run build

# 4. 只提交自己的文件后推送（直连 443 不稳时可借用 qianwen-refresh/api-push.py，QW_WT 指向本 worktree）
git add public/reports/doubao-user-acquisition-dashboard public/previews/doubao-user-acquisition-dashboard.svg \
        docs/reports/doubao-user-acquisition-dashboard/index.html
git commit -m "chore(doubao): 刷新看板数据至 ${CUT:0:16}"
```

## 使用节奏代理与 q6.json

豆包 OAuth/MCP 链路没有回传原始提问、豆包会话 ID 或工具级调用明细。`question-signals.sql`
因此只从 `api_oauth_refresh_token` 生成四组**使用代理**：令牌活跃覆盖、授权到首次令牌时延、
令牌活跃天数、近 7 日每日去重令牌用户。它们不得命名为提问数、会话数、对话深度或主动使用次数。

`build-q.py` 会把 `question-signals.txt` 整理为独立的 `$WORK/q6.json`，并在写出前检查三类客群、
首次令牌时延、活跃天数与近 7 日数据是否闭合。结构如下：

```json
{
  "schema_version": "doubao-usage-proxy-signals-v1",
  "as_of": "YYYY-MM-DDTHH:mm:ss+08:00",
  "evidence_state": "confirmed_proxy",
  "coverage": {
    "all": {"bound_users": 0, "token_active_users": 0, "no_token_users": 0, "token_active_rate_pct": 0},
    "new": {"bound_users": 0, "token_active_users": 0, "no_token_users": 0, "token_active_rate_pct": 0},
    "existing": {"bound_users": 0, "token_active_users": 0, "no_token_users": 0, "token_active_rate_pct": 0}
  },
  "first_token_delay": {"all": {"lte_5m": 0, "5_30m": 0, "30m_24h": 0, "gte_1d": 0}},
  "token_active_days": {"all": {"1": 0, "2_7": 0, "8_30": 0, "31_plus": 0}},
  "recent_7d": [
    {"date": "YYYY-MM-DD", "all_users": 0, "new_users": 0, "existing_users": 0, "partial": false}
  ]
}
```

生成 `q6.json` 时按 `kind` 分组：`coverage` 的 `value_1/2/3/rate_pct` 分别为绑定用户、
令牌活跃用户、无令牌用户、覆盖率；两个分桶组取 `item_id → value_1`；`recent_7d` 的
`value_1/2/3` 分别为全部、新用户、老用户，`latest_day_partial=1` 的截止日必须标记为不完整日。
写入前至少校验：三客群覆盖人数闭合、每个时延/活跃天数分桶之和等于对应令牌活跃用户、
近 7 日共有 7 个连续日期、每日 `all_users = new_users + existing_users`，且 `as_of` 与主看板
`meta.data_cutoff` 完全一致。

## 发布注意

- `docs/` 下只有加密单页（口令与千问看板相同，见 `scripts/encrypt-doubao-dashboard.mjs`），**永远不要往 docs/ 拷明文数据**。
- 数据 `minimum_public_cell`、validate 脚本、`app.js` 的 `minimumCell` 三处必须一致，否则线上白屏。
- `question-signals.sql` 不读取或输出原始提问，也不输出用户、会话、令牌、请求标识；不得把 refresh token 行数包装成提问量。
- 发布后 GitHub Pages 有缓存，验证带 `?v=xxx` 强刷。
- 目前没有 launchd 定时任务，需要时可仿照 `scripts/qianwen-refresh/auto-refresh.sh` 加一份。
