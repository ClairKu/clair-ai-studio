# 痛点消消乐 · 数据更新链路

看板：<https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/>

## 为什么要这么绕

看板挂在 GitHub Pages 上，任何人任何网络都能打开。它要显示的数字却在**内网**（GitLab `git.frontnode.net`）。
公网页面进不了内网，所以「点一下就更新」不可能由页面自己完成——必须有人从内网这边往外送。

于是拆成三段，每段只做自己能做的事：

```
                    公网                                内网
  ┌──────────────────────────────┐        ┌──────────────────────────┐
  │  看板页面（GitHub Pages）      │        │  取数 agent（这台 Mac）   │
  │                              │        │                          │
  │  ① 点「更新数据」             │        │                          │
  │     → 先拉最新快照 ───────────┼──┐     │                          │
  │  ② 快照过期/强制 → 输口令      │  │     │                          │
  │     → 排一个刷新请求 ─────────┼──┼──┐  │                          │
  │  ③ 轮询进度，完成后自动重渲染  │  │  │  │                          │
  └──────────────────────────────┘  │  │  │                          │
                                    ▼  ▼  │                          │
                      ┌────────────────────┴──┐      ┌───────────────┴──┐
                      │ 中继 Worker (CF)      │◀─────│ 轮询 /jobs/next   │
                      │  KV: 最新快照 + 队列   │─────▶│ 查 GitLab、算口径 │
                      │  校验口令 / agent token│      │ 回推快照          │
                      └───────────────────────┘      └──────────────────┘
                                                              │
                                            定时（9/13/18 点）  │ 也写一份到
                                                              ▼
                                                    GitHub Pages latest.json（兜底）
```

- **零运维那一半**：launchd 每天定时取数 → 写 `latest.json` → 推 GitHub Pages。
  就算 Worker 没部署、Mac 关机，公网打开也有近期数据，「更新数据」按钮至少能拉到最新已发布快照。
- **实时那一半**：Worker + 常驻 agent。公网点更新且快照过期时，凭口令排队让内网重算，页面等结果自动刷新。

页面上永远不存任何凭据：口令由 Worker 校验，GitLab token 只在这台 Mac 上。

## 查询逻辑（口径）

口径全部写在 [`config/rules.json`](config/rules.json)，改那个文件就等于改口径。要点：

| 概念 | 定义 |
| --- | --- |
| 数据源 | GitLab `https://git.frontnode.net/api/v4`，只读（`read_api`） |
| 统计范围 | `config/roster.json` 里 7 位产品团队成员，按 `author.username` 匹配 |
| 统计区间 | 自 `window.program_start`（默认 2026-07-01）起累计 |
| **一个需求** | 一条特性分支 = 一个需求，key = `project_id + source_branch` |
| **累计提交** | 该成员作为 MR 作者发起、且未被废弃（`state != closed`）的需求数。从未合并过的纯草稿不计 |
| **累计上线** | 该需求下存在 `state = merged` 且 `target_branch ∈ {master, main, production, release}` 的 MR；上线时间取最早的 `merged_at` |
| **在途** | 已提交但未合入生产主干（含只合到 test/dev 的） |
| **端到端人数** | 名下 `released ≥ 1` 的成员数 |
| **交付周期** | `released_at - submitted_at`，只对已上线需求计算 |

### 两个必须知道的口径限制

1. **「上线」是近似值。** 盈米没有权威的生产发布记录系统——本体已确认：Jenkins 构建历史查不到，
   数仓也没有 `deploy_record` / `release_record` 类表。所以这里用「代码已合入生产主干」作为上线证据，
   它比真实部署时刻**早 0–2 个工作日**。看板上的「查询口径」板块对访问者明写了这一点。
   要拿到真实部署时刻，得先推动 infra 把 Jenkins 部署记录落到数仓，那是二期。
2. **同一分支合两次不重复计数。** GitLab flow 下一个需求通常先合 `test` 再合 `master`，
   按 MR 计数会直接翻倍；所以按 `source_branch` 归组。反过来，一个需求拆成多条分支会被算成多个——
   这是取舍，分支粒度是目前唯一稳定可自动判定的边界。

### 不发布到公网的东西

看板是公开的，所以脚本产出两层（`config/rules.json` 的 `publish_policy`）：

- **可发布**：计数、按人聚合、日期、状态、需求的哈希 id
- **不发布**：MR 标题、MR 链接、仓库路径、分支名（只留在本机 `state/detail.json`）

墙上「已发生的改变」的文案继续人工撰写在 [`config/curated-records.json`](config/curated-records.json)，
脚本只负责把它的状态对齐到最新——不会把内部标题直接推到公网。

## 搭起来要做的事

### 0. 前置：GitLab token

在 GitLab → Preferences → Access Tokens 建一个 scope 为 `read_api` 的 token。

```bash
export GIT_ACCESS_TOKEN="glpat-xxxxxxxx"
```

### 1. 补齐人员映射（一次性）

按人聚合完全建立在这个映射上，认错人比没数字更糟，所以脚本只给候选、不自动写回。

```bash
node automation/pain-off/resolve-roster.mjs
```

把确认后的 username 填进 `config/roster.json` 的 `gitlab_username`。

### 2. 先手跑一次，看数字对不对

```bash
node automation/pain-off/refresh.mjs --dry-run
```

对得上再去掉 `--dry-run` 写盘，加 `--publish` 推到公网。

### 3. 定时快照（零运维那一半）

```bash
cp automation/pain-off/launchd/com.clair.pain-off.schedule.plist ~/Library/LaunchAgents/
# 编辑里面的 EnvironmentVariables 填 token
launchctl load -w ~/Library/LaunchAgents/com.clair.pain-off.schedule.plist
```

### 4. 中继 Worker（实时那一半）

```bash
cd worker/pain-off-relay
npm install
npx wrangler kv namespace create PAIN_OFF     # 把返回的 id 填进 wrangler.toml
npx wrangler secret put PULSE_PASSCODE        # 公网点更新时要输的口令
npx wrangler secret put AGENT_TOKEN           # 本机 agent 的凭据，随便一串长随机串
npx wrangler deploy
```

部署后把 Worker 地址填进
`public/reports/product-demand-pulse/data/relay-config.json` 的 `worker_base`，重新发布页面。

### 5. 常驻 agent

```bash
cp automation/pain-off/launchd/com.clair.pain-off.agent.plist ~/Library/LaunchAgents/
# 编辑里面的 EnvironmentVariables 填三个值
launchctl load -w ~/Library/LaunchAgents/com.clair.pain-off.agent.plist
tail -f /tmp/pain-off-agent.log
```

## 目录

```
automation/pain-off/
  config/rules.json            口径定义（唯一真源）
  config/roster.json           人员 ↔ GitLab username
  config/curated-records.json  墙上展示文案（人工）
  lib/gitlab.mjs               GitLab 只读客户端
  lib/compute.mjs              需求折叠、按人汇总、增量比对
  lib/snapshot.mjs             组装公网快照 + 本机明细
  lib/worker-client.mjs        和中继说话
  lib/paths.mjs                路径与读写
  refresh.mjs                  手动/定时取数入口
  agent.mjs                    常驻轮询 agent
  resolve-roster.mjs           解析 GitLab username 候选
  publish.mjs                  经 GitHub API 发布快照
  state/                       本机明细与上一版快照（不入库）
worker/pain-off-relay/         公网中继
```

## 排查

| 症状 | 多半是 |
| --- | --- |
| 页面显示「实时重算尚未启用」 | `relay-config.json` 的 `worker_base` 还是 null |
| 点更新一直转、10 分钟后超时 | 常驻 agent 没在跑：`tail /tmp/pain-off-agent.err.log` |
| 口令一直不对 | Worker secret `PULSE_PASSCODE` 与实际输入不一致，重新 `wrangler secret put` |
| 取数报 401 | `GIT_ACCESS_TOKEN` 过期或 scope 不含 `read_api` |
| 某人数字是 0 | `roster.json` 里 `gitlab_username` 填错，或此人确实没有作者身份的 MR |
| Pages 推送失败 | 这台机器到 github.com:443 的 SNI 被阻断；`publish.mjs` 已改走 api.github.com，若仍失败检查 `gh auth token` |
