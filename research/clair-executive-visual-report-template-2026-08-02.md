---
title: Clair 报告模板与生成 Skill
date: 2026-08-02
data_cutoff: 2026-08-02
site_url: https://clairku.github.io/clair-ai-studio/reports/clair-executive-visual-report-template-2026-08-02/
site_status: production
---

# Clair 报告模板与生成 Skill

## 结论

《盈米 AI 产品实践》的可复用价值不是固定业务章节，而是“结论先行的证据化叙事 + 紫色档案式视觉 + 可操作场景 Demo + 生产质量门”。本次将其抽象为 `clair-executive-visual-report` Skill。

## 分屏交互 1.1.0

- 每个正文模块固定为一个可视屏高，外层滚动使用强制吸附；内容过多时仅在模块内部滚动。
- `↑/←` 返回上一屏，`↓/→` 前往下一屏，同时支持 `PageUp/PageDown` 与 `Home/End`。
- 右侧页轨可点击精确定位并同步当前屏页码；点击顶部品牌标识可一键回到报告首屏。
- 移动端保留逐屏吸附与页轨，打印时恢复自然高度，避免内容裁切。

## 可复用内容结构

默认叙事为：

`一句话结论 → 背景/为什么 → 总体蓝图 → 关键角色或能力 → 演进路径 → 真实证据 → 场景演示 → 业务结果 → 治理边界 → 下一步`

每份报告按材料裁剪，不机械凑章节。

## 生成系统

- `report.json`：内容、证据状态、来源和待确认项的单一事实源。
- `report-template.html`：统一视觉与交互资产。
- `render_report.mjs`：把 JSON 渲染为独立 HTML。
- `validate_report.mjs`：检查结构、证据、资源和页面信号。
- `SKILL.md`：材料盘点、证据审计、内容编排、生成、验收与发布工作流。

## 九类模块

`cards`、`metrics`、`architecture`、`timeline`、`process`、`evidence`、`comparison`、`demo`、`actions`。

## 证据状态

- `confirmed`：材料可定位事实。
- `inferred`：基于事实的判断。
- `missing`：缺失信息。
- `target`：目标态或概念原型，不代表已上线。

## 使用方式

以后可直接说：

> 用 Clair Executive Visual Report Skill，把这些材料做成一份老板能直接看的视觉报告并发布。

输入可以是 Word、PDF、PPT、Markdown、网页、截图、访谈或零散文字。Skill 负责证据盘点、中心判断、模块选择、HTML 生成、移动端验收、GitHub 发布和工作台登记。
