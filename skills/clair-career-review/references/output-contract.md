# 输出契约

顶层必须包含 `title`、`verdict`、`confidence`、`summary`、`evidence`、`findings`、`human_questions`、`next_actions`、`skill_version`。

- `evidence[].status`：`confirmed`、`inferred` 或 `missing`。
- `findings[].priority`：`P0`、`P1` 或 `P2`。
- 每项 finding 包含 `issue`、`impact`、`evidence`、`recommendation`。
- `confidence` 为 0 到 100。
- 页面可渲染为可编辑 HTML，但不得丢失证据状态。
