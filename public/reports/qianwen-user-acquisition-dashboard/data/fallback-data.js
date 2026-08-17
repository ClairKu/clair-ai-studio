window.QIANWEN_ACQUISITION_DATA = {
  "schema_version": "qianwen-user-acquisition-v2",
  "meta": {
    "title": "千问 X 且慢AI小顾 用户数据看板",
    "launch_at": "2026-08-10T08:00:00+08:00",
    "generated_at": "2026-08-17T11:14:30+08:00",
    "data_cutoff": "2026-08-17T10:41:26+08:00",
    "timezone": "Asia/Shanghai",
    "source": "盈米本体 · 生产数据库",
    "evidence_state": "confirmed",
    "privacy": "仅展示用户统计结果，不含用户明细与数据库凭证",
    "latest_day_is_partial": true
  },
  "metrics": {
    "bound_accounts": 1067,
    "existing_accounts": 310,
    "new_accounts": 757,
    "missing_registration_time": 0,
    "duplicate_bindings": 0,
    "unmatched_accounts": 0,
    "boundary_records": 0
  },
  "daily": [
    {
      "date": "2026-08-10",
      "new_accounts_today": 207,
      "existing_accounts_today": 155,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 362,
      "cumulative_new_accounts": 207,
      "cumulative_existing_accounts": 155,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 362,
      "partial": true
    },
    {
      "date": "2026-08-11",
      "new_accounts_today": 132,
      "existing_accounts_today": 78,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 210,
      "cumulative_new_accounts": 339,
      "cumulative_existing_accounts": 233,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 572,
      "partial": false
    },
    {
      "date": "2026-08-12",
      "new_accounts_today": 112,
      "existing_accounts_today": 26,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 138,
      "cumulative_new_accounts": 451,
      "cumulative_existing_accounts": 259,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 710,
      "partial": false
    },
    {
      "date": "2026-08-13",
      "new_accounts_today": 87,
      "existing_accounts_today": 19,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 106,
      "cumulative_new_accounts": 538,
      "cumulative_existing_accounts": 278,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 816,
      "partial": false
    },
    {
      "date": "2026-08-14",
      "new_accounts_today": 64,
      "existing_accounts_today": 12,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 76,
      "cumulative_new_accounts": 602,
      "cumulative_existing_accounts": 290,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 892,
      "partial": false
    },
    {
      "date": "2026-08-15",
      "new_accounts_today": 80,
      "existing_accounts_today": 10,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 90,
      "cumulative_new_accounts": 682,
      "cumulative_existing_accounts": 300,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 982,
      "partial": false
    },
    {
      "date": "2026-08-16",
      "new_accounts_today": 54,
      "existing_accounts_today": 6,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 60,
      "cumulative_new_accounts": 736,
      "cumulative_existing_accounts": 306,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 1042,
      "partial": false
    },
    {
      "date": "2026-08-17",
      "new_accounts_today": 21,
      "existing_accounts_today": 4,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 25,
      "cumulative_new_accounts": 757,
      "cumulative_existing_accounts": 310,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 1067,
      "partial": true
    }
  ],
  "quality_checks": [
    {
      "label": "账号总数",
      "value": "1,067 = 757 + 310",
      "status": "pass",
      "detail": "绑定账号总数与新注册、老用户数量一致"
    },
    {
      "label": "重复计数",
      "value": "0 条",
      "status": "pass",
      "detail": "同一账号仅计算一次，本次无重复计数"
    },
    {
      "label": "用户分类",
      "value": "0 待识别",
      "status": "pass",
      "detail": "全部用户均已归入新注册或老用户"
    },
    {
      "label": "边界记录",
      "value": "0 条",
      "status": "pass",
      "detail": "上线整点没有记录，本次边界无歧义"
    }
  ],
  "definitions": [
    {
      "term": "绑定且慢账号",
      "definition": "8 月 10 日 08:00 之后，通过千问完成且慢账号绑定的用户；同一账号只计算一次。",
      "state": "confirmed"
    },
    {
      "term": "新注册",
      "definition": "8 月 10 日 08:00 及之后注册且慢，并完成账号绑定的用户。",
      "state": "confirmed"
    },
    {
      "term": "老用户",
      "definition": "8 月 10 日 08:00 前已注册且慢，之后完成账号绑定的用户。",
      "state": "confirmed"
    }
  ]
};
