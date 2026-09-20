# 豆包绑定用户个例分析台（doubao-user-conversion-cases-*）重烘焙

主看板「豆包 X 且慢AI小顾用户数据看板」的二级子页，与千问个例台（`scripts/qianwen-cases/`）**同一套模板、同一套口径**：
页面是静态烘焙的加密单页，不随主看板 latest.json 联动；主看板每次刷新后按下面步骤重跑即可（约 5 分钟）。

## 与千问个例台的差别（只有渠道语义）

| | 千问 | 豆包 |
| --- | --- | --- |
| 候选基表 | `qwen_user_map` | `api_user_consent_record`，`client_id='doubao'`，当前仍有未撤销授权；首次绑定 = `MIN(granted_at)` |
| 渠道侧会话 | A2A 会话 + 提问文本（`agent_dj_sessions` × `qwen_a2a_session_map`） | 只有 OAuth 会话令牌（`api_oauth_refresh_token`）——豆包走 MCP，**提问文本协议层不可得**；页面里全部写明「内容不可得」 |
| `d_asks` | 千问提问 | 且慢 App 内小顾 3.0 的提问（`agent_dj_sessions` 非千问部分），渠道标为「且慢」 |
| 汇总卡 / 矩阵 | 提问数 | 豆包会话次数（令牌）+ 且慢小顾提问条数 |
| 取数 | README 里的 SQL 手工执行 | `fetch-all.sh` 一条命令跑完全部 SQL |

其余（候选口径、入金口径、五个客群与主看板对齐校验、埋点页名翻译、最终持有穿透、匿名编号、加密壳）完全一致。

## 重烘焙流程

```bash
W=$(mktemp -d)/doubao-cases && S=scripts/doubao-cases
CUT='2026-09-20 09:31:53'   # 必须等于主看板 latest.json 的 meta.data_cutoff（去掉 T 与时区）
AD='2026-09-18'             # 主看板同一资产快照日（segments.items[].asset_as_of）

# 1. 取数（VPN + ~/.zshrc 的 REDASH_API_KEY）：候选 + 交易/风测/App 小顾/资产/设备/流水 + 会话令牌/Mia/持仓/账单/子订单/埋点
CASE_CUT="$CUT" CASE_AD="$AD" CASE_WORK=$W $S/fetch-all.sh

# 2. 归一化（bound_total = 主看板 metrics.bound_accounts）→ 与主看板五个客群闭合校验 → 生成明文页
cp $S/narratives.json $W/
python3 $S/assemble-users.py $W "$CUT" <bound_total>
python3 $S/validate-alignment.py public/reports/doubao-user-acquisition-dashboard/data/latest.json $W/users.json
python3 $S/build-cases.py $W/users.json $W/page.html $S/base.css

# 3. 加密落库（public + docs 同一份密文；口令与主看板相同）
node $S/encrypt-page.mjs $W/page.html public/reports/<slug>/index.html "豆包绑定用户个例分析台"
cp public/reports/<slug>/index.html docs/reports/<slug>/index.html
npm run build && npm test
```

## 作者研判

`narratives.json` 按 pmid 维护 `insight` / `conversion_path_label` / `conversion_path` / `behavior_insight`（可选 `narrative`），
必须逐例结合豆包会话时点、App 埋点、交易时点判断，不套模板；新增候选用户时补一条，缺失时页面显示「待研判」。
豆包侧看不到提问内容，研判里不得推断「用户在豆包问了什么」；只描述会话发生的时点与后续行为的先后关系。

## 落库清单（新 slug 时）

public + docs 密文、`scripts/inject-site-access-gate.mjs`、`tests/site-access-gate.test.mjs`、`scripts/validate-workbench.mjs`、
`catalog/report-registry.json`（`nonCatalogReportSlugs`，supporting-page，ownerId = doubao-user-acquisition-dashboard），
以及主看板 `index.html` 标题下的「用户转化分析」链接。
