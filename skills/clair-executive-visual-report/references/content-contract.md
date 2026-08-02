# 内容契约

## 顶层结构

```json
{
  "meta": {
    "title": "报告标题",
    "subtitle": "对象与目的",
    "eyebrow": "团队 / REPORT TYPE",
    "date": "2026-08-02",
    "cutoff": "2026-08-02",
    "owner": "材料责任方",
    "confidentiality": "公开 / 内部 / 机密",
    "accent": "#8067e8",
    "downloadUrl": "../../downloads/example.skill",
    "downloadLabel": "下载 Skill"
  },
  "hero": {
    "conclusion": "一句话中心判断",
    "thesis": "一段解释",
    "badges": ["证据化", "管理汇报"]
  },
  "sections": [],
  "sources": [],
  "openQuestions": []
}
```

`meta.title`、`meta.date`、`meta.cutoff`、`hero.conclusion`、`sections` 必填。`accent` 必须是六位十六进制颜色。仅在确有可下载交付物时填写 `downloadUrl` 与 `downloadLabel`。

## 章节结构

```json
{
  "id": "unique-slug",
  "kicker": "01 · WHY NOW",
  "title": "章节结论标题",
  "lead": "解释本章回答什么",
  "layout": "cards",
  "tone": "light",
  "items": [],
  "callout": {
    "label": "关键判断",
    "text": "一句话收束",
    "status": "confirmed"
  }
}
```

- `layout`：`cards`、`metrics`、`architecture`、`timeline`、`process`、`evidence`、`comparison`、`demo`、`actions`。
- `tone`：`light`、`soft`、`dark`。
- `status`：`confirmed`、`inferred`、`missing`、`target`。

## 通用 item

```json
{
  "index": "01",
  "eyebrow": "ROLE / PHASE / SOURCE",
  "title": "卡片标题",
  "body": "核心内容",
  "metric": "42%",
  "meta": "统计期或补充说明",
  "status": "confirmed",
  "bullets": ["要点一", "要点二"],
  "source": "来源名称 · 日期",
  "image": "assets/example.png",
  "alt": "图片内容说明"
}
```

只填写模块需要的字段。`evidence` 图片必须带 `alt` 与 `source`；`metrics` 必须带 `metric` 和统计口径；`timeline` 用 `meta` 写阶段或日期；`actions` 用 `meta` 写责任人/时间/状态，未知则明确写待确认。

## 模块选择

| 用户材料 | layout | 适用关系 |
|---|---|---|
| 战略、系统、能力层 | `architecture` | 上下层、底座与应用 |
| 项目进展、产品迭代 | `timeline` | 时间与阶段变化 |
| 多角色协同、用户旅程 | `process` | 顺序、交接与责任 |
| 经营指标、成果 | `metrics` | 数值与口径 |
| 截图、文档、访谈 | `evidence` | 原始事实与来源 |
| 方案选择、前后变化 | `comparison` | 同维度取舍 |
| 产品体验、场景故事 | `demo` | 可切换的连续场景 |
| 决策、建议、路线图 | `actions` | 优先级与下一步 |
| 并列观点、角色、原则 | `cards` | 等级相同的要点 |

## 证据规则

- `confirmed`：材料中有可定位依据；写来源和日期。
- `inferred`：从事实推导；使用“判断/推测/可能”措辞。
- `missing`：关键信息缺失；不能用零或否定替代。
- `target`：目标态、概念原型或计划；不得写成已经上线。

关键数字需说明统计期、样本、分母或数据口径。来源不足时删除数字或标为待补，不估算。
