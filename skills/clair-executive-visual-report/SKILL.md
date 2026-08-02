---
name: clair-executive-visual-report
description: 将任意 Word、PDF、PPT、Markdown、网页摘录、聊天记录或零散业务材料，整理成与《盈米 AI 产品实践》同类的证据化、管理层友好、图文并茂、移动端响应式单页 HTML 报告。用户要求套用 Clair 报告模板、制作视觉报告、管理汇报、项目复盘、产品实践报告、研究报告、材料整合、发布到 Clair AI Studio，或要求“做成和盈米 AI 产品实践一样的效果”时使用。
---

# Clair Executive Visual Report

版本：1.0.0

## 目标

把材料转成一份可审计的决策资产，而非仅做视觉包装。保留材料来源、截止日期、证据状态与不确定性；使用统一模板生成独立、无外部依赖的 HTML。

## 工作流

1. 建立材料清单。记录文件名、链接、版本、日期、提供方和可公开边界；不覆盖原材料。
2. 先审证据再写结论。把内容分成 `confirmed`、`inferred`、`missing`、`target` 四类；数字必须有口径、周期、分母或明确标为待补。
3. 提炼一条中心判断。用一句话回答“发生了什么、为什么重要、下一步做什么”，再组织支撑模块。
4. 按 [references/content-contract.md](references/content-contract.md) 生成 `report.json`。从材料中选择 6—10 个必要章节，不为凑版式制造内容。
5. 选择模块：总图用 `architecture`，阶段变化用 `timeline`，责任链用 `process`，量化结果用 `metrics`，事实材料用 `evidence`，对比用 `comparison`，行动用 `actions`，体验走查用 `demo`。
6. 运行生成器：`node scripts/render_report.mjs report.json <output-dir>`。
7. 运行质量门：`node scripts/validate_report.mjs report.json <output-dir>/index.html`。
8. 打开 HTML，检查桌面与 390px 手机布局、图片加载、滚动导航、交互标签、无横向溢出和中文编码。遵循 [references/quality-gates.md](references/quality-gates.md)。
9. 若用户要求发布，保留研究源稿与 JSON，复制页面和资产至站点，登记唯一工作台入口，构建、测试、推送并验证生产 URL。

## 内容编排

默认使用以下叙事，不要求每次机械凑齐：

`一句话结论 → 背景/为什么 → 总体蓝图 → 关键角色或能力 → 演进路径 → 真实证据 → 场景演示 → 业务结果 → 治理边界 → 下一步`

- 首屏只承担判断、对象、日期和 2—4 个关键标签。
- 每章只回答一个问题；标题写结论，不写“情况介绍”这类空标题。
- 正文优先“事实—判断—行动”；证据卡写来源和状态。
- 复杂关系必须配结构图、流程、时间线或对比卡；不要用装饰图替代信息。
- `target` 和概念原型必须显式标注“不代表已上线”。
- 内部或敏感内容发布前必须加密正文；CSS 隐藏不等于保护。

## 视觉与交互

直接使用 `assets/report-template.html`，不要重新手写整套 CSS。模板内置：

- 宋体/衬线大标题、无衬线正文、紫色渐变强调、深色演示舞台、档案卡片；
- 粘性章节导航、滚动显现、阅读进度、移动端抽屉、Demo 标签切换；
- `cards`、`metrics`、`architecture`、`timeline`、`process`、`evidence`、`comparison`、`demo`、`actions` 九类模块；
- 打印样式、减少动态偏好、图片懒加载与 390px 响应式布局。

允许改变强调色和品牌字样，不改变信息层级、证据标签和移动端规则。

## 交付契约

至少交付：

- `report.json`：结构化单一事实源；
- `index.html`：可独立打开的生成结果；
- 原材料/研究源清单；
- 校验结果与尚待确认事项；
- 发布任务中的生产 URL 与工作台入口。

不得把浏览器草稿、静态托管、加密壳或本地文件描述成服务端系统。不得编造来源、数字、已上线状态、负责人或完成日期。

## 质量门

以下任一情况必须停止发布并修正：

- 缺少标题、中心判断、截止日期、章节或证据边界；
- 重复章节 ID、未知布局、无来源的关键数字；
- `target` 内容没有状态标签；
- HTML 未嵌入报告数据、导航、阅读进度或响应式样式；
- 页面存在外部 CDN 依赖，或生产资源引用不存在；
- 敏感正文以明文进入公开仓库。
