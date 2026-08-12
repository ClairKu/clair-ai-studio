window.DEMAND_PULSE_DATA = {
  "meta": {
    "cutoff": "2026-08-12T11:05:00+08:00",
    "last_change_at": "2026-08-12T11:05:00+08:00",
    "headline": "全团队 7/7 已核验：累计 4 个唯一改动，3 个已在生产环境验证上线，1 个完成测试复验后待上线。",
    "source_note": "按实时在岗名单逐人核验 Wiki、Jira、代码交付与生产页面；公开页只保留产品同学名字、脱敏痛点和证据状态。",
    "coverage": {
      "scope": "且慢产品团队",
      "active_members": 7,
      "checked_members": 7,
      "contributors": 2,
      "no_confirmed_record_members": 5
    }
  },
  "records": [
    {
      "id": "R1",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P01",
      "person_display": "嘉鸿",
      "submitted_at": "2026-08-05",
      "status": "released",
      "public_title": "群组人数展示口径",
      "pain_category": "同一策略的人数信息不够清楚",
      "public_outcome": "生产版本已展示“开启计划/在投”双口径，前后端交付链路完成。",
      "evidence_level": "生产版本已核验"
    },
    {
      "id": "R2",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P01",
      "person_display": "嘉鸿",
      "submitted_at": "2026-08-11",
      "status": "merged",
      "public_title": "加仓计划术语修正",
      "pain_category": "加仓规则弹窗残留错误术语，容易造成理解混淆",
      "public_outcome": "文案修正已完成多端复验并进入测试交付，生产上线仍待确认。",
      "evidence_level": "测试已复验 · 生产待核"
    },
    {
      "id": "R3",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P02",
      "person_display": "家亮",
      "submitted_at": "2026-07-31",
      "status": "released",
      "public_title": "文章图片查看体验",
      "pain_category": "文章图片无法点开看大图和缩放",
      "public_outcome": "线上文章已经具备图片点击预览与缩放能力。",
      "evidence_level": "生产页面与脚本已核验"
    },
    {
      "id": "R4",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P02",
      "person_display": "家亮",
      "submitted_at": "2026-07-31",
      "status": "released",
      "public_title": "移动端表格阅读体验",
      "pain_category": "文章中的宽表格在手机上内容被截断",
      "public_outcome": "线上移动端表格已支持横向滑动，完整内容可以查看。",
      "evidence_level": "生产页面与脚本已核验"
    }
  ],
  "people": [
    {
      "id": "P01",
      "display_name": "嘉鸿",
      "avatar": "🦝",
      "total": 2,
      "landed": 1,
      "checked": true
    },
    {
      "id": "P02",
      "display_name": "家亮",
      "avatar": "🦦",
      "total": 2,
      "landed": 2,
      "checked": true
    },
    {
      "id": "P03",
      "display_name": "腾玉",
      "avatar": "🐬",
      "total": 0,
      "landed": 0,
      "checked": true
    },
    {
      "id": "P04",
      "display_name": "春燕",
      "avatar": "🐧",
      "total": 0,
      "landed": 0,
      "checked": true
    },
    {
      "id": "P05",
      "display_name": "刘晨",
      "avatar": "🦊",
      "total": 0,
      "landed": 0,
      "checked": true
    },
    {
      "id": "P06",
      "display_name": "金星",
      "avatar": "🐰",
      "total": 0,
      "landed": 0,
      "checked": true
    },
    {
      "id": "P07",
      "display_name": "佳殊",
      "avatar": "🐼",
      "total": 0,
      "landed": 0,
      "checked": true
    }
  ],
  "boundaries": [
    "先按实时在岗名单逐人核验，再统计需求；本轮覆盖 7/7",
    "只统计产品同学本人借助本体推进并有交付证据的唯一改动",
    "需求提出人和后续代码协作者分开识别，同一痛点只记一次",
    "生产环境可直接验证的改动计为已上线；用户效果确认另设更高门槛",
    "公开页不展示账号、内部链接、项目编号、分支、代码路径或评论"
  ]
};
