window.DEMAND_PULSE_DATA = {
  "meta": {
    "cutoff": "2026-08-12T11:05:00+08:00",
    "last_change_at": "2026-08-14T00:46:00+08:00",
    "headline": "4 个已提交，4 个已上线，2 位 PM 完成端到端交付。",
    "update_rule_version": "delta-first-v1"
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
      "category": "important",
      "priority": "P1",
      "public_title": "群组人数展示口径",
      "pain_category": "同一策略的人数信息不够清楚",
      "public_outcome": "生产版本已展示“开启计划/在投”双口径。",
      "evidence_level": "已上线"
    },
    {
      "id": "R2",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P01",
      "person_display": "嘉鸿",
      "submitted_at": "2026-08-11",
      "released_at": "2026-08-14",
      "status": "released",
      "category": "urgent_bug",
      "priority": "P1",
      "public_title": "加仓计划术语修正",
      "pain_category": "加仓规则弹窗残留错误术语",
      "public_outcome": "生产规则弹窗中的错误术语已修正为“加仓计划”。",
      "evidence_level": "已上线"
    },
    {
      "id": "R3",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P02",
      "person_display": "家亮",
      "submitted_at": "2026-07-31",
      "status": "released",
      "category": "user_request",
      "priority": "P2",
      "public_title": "文章图片查看体验",
      "pain_category": "文章图片无法点开看大图和缩放",
      "public_outcome": "线上文章已支持图片预览与缩放。",
      "evidence_level": "已上线"
    },
    {
      "id": "R4",
      "unique": true,
      "kind": "user_pain",
      "person_id": "P02",
      "person_display": "家亮",
      "submitted_at": "2026-07-31",
      "status": "released",
      "category": "user_request",
      "priority": "P1",
      "public_title": "移动端表格阅读体验",
      "pain_category": "宽表格在手机上内容被截断",
      "public_outcome": "线上移动端表格已支持横向滑动。",
      "evidence_level": "已上线"
    }
  ],
  "people": [
    {
      "id": "P01",
      "display_name": "嘉鸿",
      "avatar": "🦝"
    },
    {
      "id": "P02",
      "display_name": "家亮",
      "avatar": "🦦"
    },
    {
      "id": "P04",
      "display_name": "春燕",
      "avatar": "🐧"
    },
    {
      "id": "P05",
      "display_name": "刘晨",
      "avatar": "🦊"
    },
    {
      "id": "P06",
      "display_name": "金星",
      "avatar": "🐰"
    },
    {
      "id": "P07",
      "display_name": "刘佳",
      "avatar": "🐨"
    },
    {
      "id": "P08",
      "display_name": "嘉烨",
      "avatar": "🐯"
    }
  ],
  "value_definition": {
    "early_delivery_days": "原计划上线日减实际上线日",
    "backlog_unlocked_count": "原本无排期且最终上线的需求数"
  }
};
