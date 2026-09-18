# 豆包看板数据刷新（doubao-user-acquisition-dashboard）

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

## 手动刷新流程

```bash
WORK=$(mktemp -d)/doubao-refresh && mkdir -p $WORK
cd <clair-ai-studio 仓库>      # 建议 git worktree add --detach <目录> origin/main

# 0. 资产快照日：最近一个「跑完」的 cal_date（周末/节假日无批次）
AD=$(python3 scripts/qianwen-refresh/pick-asset-date.py)
CUT="$(date '+%Y-%m-%d %H:%M:%S')"; echo "$CUT" > $WORK/cut.txt; echo "$AD" > $WORK/ad.txt

# 1. 取数（需 VPN + ~/.zshrc 的 REDASH_API_KEY；数据源 41 dw-tidb）：6 段 + 扩展 7 段
QW_CUT="$CUT" QW_AD="$AD" scripts/doubao-refresh/run-sql.sh > $WORK/sql-raw.txt
QW_CUT="$CUT" QW_AD="$AD" QW_WORK=$WORK scripts/doubao-refresh/run-ext-sql.sh

# 2. 整理成 q1..q5.json，再以上一版 latest.json 为模板组装 + 闭合校验
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

## 发布注意

- `docs/` 下只有加密单页（口令与千问看板相同，见 `scripts/encrypt-doubao-dashboard.mjs`），**永远不要往 docs/ 拷明文数据**。
- 数据 `minimum_public_cell`、validate 脚本、`app.js` 的 `minimumCell` 三处必须一致，否则线上白屏。
- 发布后 GitHub Pages 有缓存，验证带 `?v=xxx` 强刷。
- 目前没有 launchd 定时任务，需要时可仿照 `scripts/qianwen-refresh/auto-refresh.sh` 加一份。
