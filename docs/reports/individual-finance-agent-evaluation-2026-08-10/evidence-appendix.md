# 个人理财 Agent 候选作品｜测试证据附录

评测截止：2026-08-10（Asia/Shanghai）

仓库版本：[`master@7f117a1`](https://github.com/zaz199110/Individual-finance-management-agent/tree/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8)

## 1. 复现环境

| 项目 | 实测值 |
|---|---|
| OS | macOS |
| Node | 24.3.0 |
| npm | 11.4.2 |
| 浏览器 | Chromium / Playwright |
| 桌面视口 | 1440×900 |
| 移动视口 | 390×844 |
| Docker | 当前机器不可用 |
| 私有模型/数据库凭据 | 未使用 |

## 2. 执行命令与结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 依赖安装 | `npm ci --legacy-peer-deps` | 899 packages；19 vulnerabilities（1 low、7 moderate、11 high） |
| 生产构建 | `npm run build` | 通过 |
| Lint | `npm run lint` | 失败；`next lint` 进入交互式配置 |
| 单元测试 | `npm test` | 107 files：96 passed、11 failed；562 tests：539 passed、22 failed、1 skipped |
| 官方 E2E | `npx playwright test --reporter=line` | 52 tests：10 passed、30 failed、2 skipped、10 did not run；15.7m |
| 浏览器 QA | 本地 Next dev + Playwright | 桌面 8 个路由可加载；移动端全局侧栏挤压 |

单测失败包含：缺少 holdings / plan payload samples、`server-only` 解析失败、退休目标字段契约冲突、持仓尾随自由文本、plan placeholder、model defaults 与 L0 sync 断言。

E2E 失败覆盖 CurrentConfigPanel、分红报告、Mode B、货币基金损益、pipeline lock、plan empty state、portfolio full flow、pipe normalize、sell guide、profile goal / modify / UI / unified flow。多数聊天链路卡在禁用 textarea；前置数据库 seed 还因缺 `.env.local` 失败。

## 3. 全场景用例

### Chat planner（15 条）

- 能力介绍 → `simple_qa`
- 梳理投资需求 → `cross_scene_handoff(profile)`
- 分析持仓 → 错落 `simple_qa`，未转 `portfolio`
- 解读 019305 → 错落 `simple_qa`，未转 `fund`
- profile / plan / portfolio / fund 显式入口能规划对应步骤

### Profile / Goal / Holdings

- 画像键值解析能提取姓名、年龄、职业、收入、资产、还贷、月可投资等字段。
- “月税后收入、贷款余额、每月固定支出”等常见字段仍被列为 unknown。
- `月收入: abc` 被转换成 `0`，没有拒绝非法值。
- README/E2E 的退休目标示例因缺“计划开始日期”失败。
- 普通 pipe 持仓文本在真实函数调用中先要求推理模型，未走完确定性解析。

### Fund QA（3 基金 × 3 问题）

| 基金 | 费用问题 | 业绩/回撤 | 风险适配 |
|---|---|---|---|
| 019305 摩根标普500 C | 2,016 字招募书绪言，无 0.50% | 数字部分可用，但泄露 `用 L0` 等模板语 | 返回模板指令与大段绪言 |
| 000198 天弘余额宝 | 返回市场回顾而非费率 | 输出 -15.4% 收益、-59.8% 回撤，产品语义错误 | 返回模板与风险准备金段落 |
| 217022 招商产业债 A | 正确命中管理费 0.60%、托管费 0.20% | 泄露模板语 | 返回模板与历史业绩段落 |

019305 独立复核：2026-08-06 单位净值 1.6974，近一年收益 14.83%，最大回撤 -9.30%，管理费 0.50%，托管费 0.15%，销售服务费 0.30%。候选系统的净值与回撤一致、收益为约 16%；但其直接费用回答没有使用已取到的费率字段。

## 4. 可复核源码位置

- CI 只监听 `main`，E2E 被注释：[`cross-platform.yml#L3-L7`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/.github/workflows/cross-platform.yml#L3-L7)、[`#L45-L67`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/.github/workflows/cross-platform.yml#L45-L67)
- `package.json` 没有 README 所述初始化命令：[`package.json#L5-L22`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/package.json#L5-L22)
- 固定宽度侧栏：[`ResizableSidebar.tsx#L53-L66`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/components/layout/ResizableSidebar.tsx#L53-L66)、[`sidebar-width.ts#L1-L8`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/components/layout/sidebar-width.ts#L1-L8)
- anon 全表读取：[`010_public_anon_grants.sql#L1-L8`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/supabase/migrations/010_public_anon_grants.sql#L1-L8)
- 设置表包含模型 key 与应用 JSON：[`000_app_core.sql#L9-L26`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/supabase/migrations/000_app_core.sql#L9-L26)
- 模型 key 原值直接写入并直接使用：[`models/route.ts#L66-L80`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/app/api/settings/models/route.ts#L66-L80)、[`model-probe.ts#L34-L38`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/lib/settings/model-probe.ts#L34-L38)
- DB 凭据写本地并回写 `app_settings`：[`database.ts#L118-L136`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/lib/settings/database.ts#L118-L136)、[`#L324-L345`](https://github.com/zaz199110/Individual-finance-management-agent/blob/7f117a1ee47adfd1db64ac4e1b3e4e1939ef50f8/src/lib/settings/database.ts#L324-L345)

## 5. 证据边界

- `confirmed`：来自公开源码、命令输出、确定性函数运行、浏览器截图或独立数据复核。
- `inferred`：对根因、岗位适配与修复优先级的专业判断。
- `missing`：没有候选人私有模型/API/数据库配置，完整画像—规划—持仓—报告链路不能冒充已通过。
- 未使用真实客户数据、真实持仓、生产 API Key 或数据库 service role。
