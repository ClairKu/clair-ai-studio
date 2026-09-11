# 来源覆盖清单｜双设备 AI Token 使用审计

| 来源 / 原材料 | 核心信息 | 报告去向 | 状态 |
|---|---|---|---|
| 原报告 `audit-data.json` | 公司电脑五端聚合、逐日序列、价格与行为快照 | 公司电脑桶；Cursor 改入账号共享桶；原价格分析保留在 JSON 的 inheritedAnalysis | confirmed |
| 公司电脑原快照 `company-device-snapshot.json` | 2026-09-11 更新前的单设备事实源 | 发布目录留档，供后续增量构建 | confirmed |
| 个人电脑 Codex 会话 / 归档会话 | 1,113 个文件、80,024 次可计量事件 | 个人电脑 Codex 总量、逐日趋势、截图对账 | confirmed |
| 个人电脑 WorkBuddy 项目 JSONL | 54 个文件、859 次 rawUsage | 个人电脑 WorkBuddy 总量与逐日趋势 | confirmed |
| 个人电脑 Claude Code 项目记录 | 1 条 usage 事件但 Token 为 0 | 设备 × 平台矩阵；不扩大解释为“从未使用 Claude” | confirmed visible / incomplete |
| 个人电脑 Kiro token 文件 | 5 条记录、总量 6,872、无时间戳 | 个人电脑总量、无日期边界说明；不进逐日图 | confirmed total / missing date |
| Cursor 官方用量接口原快照 | 686,153,337 Token，账号级 | 账号共享 / 不可归因设备桶，只计一次 | confirmed total / missing device |
| 原三张产品截图 | Codex 约 9.67B、Cursor 与 Claude 对账信息 | Codex 截图对账章节；其余细节保留原始对账 JSON | inferred scope |
| 已安装但无可靠 Token 字段的客户端 | ChatGPT / Atlas、Claude Desktop、Trae | 数据边界章节 | missing |

## 数字完整性检查

- 全局总量：13,449,527,546。
- 公司电脑 + 个人电脑 + 账号共享：3,065,748,642 + 9,697,625,567 + 686,153,337 = 13,449,527,546。
- 逐日总量 + Kiro 无日期总量：13,449,520,674 + 6,872 = 13,449,527,546。
- 平台合计：Claude 1,811,026,084；Codex 10,841,469,925；Cursor 686,153,337；YinmiWork 37,573,083；WorkBuddy 73,298,245；Kiro 6,872。
