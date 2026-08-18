# clair-refresh-relay

看板「更新数据」按钮的公网中继。解决的问题：盈米本体是内网服务（`ontology.yingmi-inc.com` →
`172.18.38.103`），GitHub Pages 上的静态看板、GitHub Actions 云端 runner、Cloudflare Worker
本身**都查不到它**。唯一能查数的是「挂着 VPN + 本体登录态」的本机 agent。

```
公网访客 --口令--> 中继(建任务) <--出站轮询-- 本机 agent --> 盈米本体
                     \__ 访客轮询状态 __/       \__ 查完回传快照 __/
```

中继不持有任何本体凭证，也不碰内网；本机 agent 只发出站请求，不需要开放端口或做内网穿透。

## 端点

公网侧（CORS 只放 `https://clairku.github.io`）：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/refresh` | `{dashboard, password}`。口令对了才建任务；返回 `job_id` |
| GET | `/status?job=<id>` | 任务状态；`completed` 时带回快照数据 |
| GET | `/latest?dashboard=<id>` | 最近一次成功快照 |
| GET | `/health` | 存活探测 |

本机 agent 侧（`Authorization: Bearer <AGENT_TOKEN>`）：`/agent/heartbeat`、`/agent/claim`、
`/agent/progress`、`/agent/complete`、`/agent/fail`。

## 为什么要这些闸门

每次真正的更新都会花掉本体算力，而看板地址是公开的，所以：

- **口令只在这里校验**。放在页面里校验等于没校验——任何人都能读 app.js。
- **口令错误节流**：同一 IP 15 分钟最多 5 次。口令很短，这是防暴力猜测的主要手段。
- **冷却期 10 分钟**：期内所有人点更新都复用同一份结果，不重复打扰本体。
- **同一时刻只有一个任务**：并发点击会合并到同一个 job。
- **全局每小时最多 6 次**真正的查询。

需要说明的边界：看板数据本身是公开静态文件，口令保护的是**触发查询的动作**，不是数据的保密性。

## 部署

```bash
cd relay
wrangler kv namespace create RELAY          # 把返回的 id 填进 wrangler.toml
wrangler secret put DASHBOARD_PASSWORD      # 公网访客口令
wrangler secret put AGENT_TOKEN             # 本机 agent 令牌，用 openssl rand -hex 32 生成
wrangler deploy
```

部署后把 workers.dev 域名同步到两处：
`public/reports/qianwen-user-acquisition-dashboard/app.js` 的 `RELAY_BASE`，以及
`scripts/validate-qianwen-user-acquisition-dashboard.mjs` 的 `auditedOrigins` 白名单
（验证器禁止页面脚本出现未审计的外部服务，这是有意的闸门，不要绕过）。
