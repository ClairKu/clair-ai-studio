window.OAP_QIEMAN_DASHBOARD_DATA = {
  "schema_version": "oap-qieman-user-dashboard-v1",
  "meta": {
    "title": "OAP 用户画像 × 且慢持仓与行为看板",
    "generated_at": "2026-08-17T11:12:46+08:00",
    "data_cutoff": "2026-08-16T23:59:59+08:00",
    "asset_snapshot_date": "2026-08-17",
    "behavior_window_start": "2026-05-19",
    "behavior_window_end": "2026-08-16",
    "timezone": "Asia/Shanghai",
    "source": "盈米本体 · 生产数仓只读聚合",
    "evidence_state": "confirmed_with_boundaries",
    "privacy": "公开脱敏聚合，不含用户明细、稳定主键与数据库凭证",
    "amount_precision": "金额按万元级汇总展示",
    "minimum_public_cell": 20
  },
  "usage": {
    "approved_users": 9855,
    "ever_called_users": 5816,
    "active_30d_users": 2266,
    "total_calls": 9458599,
    "attributed_calls": 1739054,
    "unattributed_calls": 7719545,
    "calls_30d": 471739
  },
  "cohorts": [
    {
      "id": "approved",
      "short_label": "批准用户",
      "label": "批准申请用户",
      "definition": "截至口径日已批准、且具有非空稳定内部主键的去重账号。",
      "users": 9855,
      "qieman_accounts": 1968,
      "qieman_account_rate": 0.2,
      "holders": 1197,
      "holder_rate": 0.1215,
      "managed_accounts": 1091,
      "managed_rate": 0.1107,
      "aum_yuan": 318070000,
      "average_holder_asset_yuan": 265719,
      "profitable_holders": 999,
      "profitable_holder_rate": 0.8346,
      "asset_buckets": [
        {
          "key": "lt_10k",
          "label": "1 万以下",
          "count": 362,
          "share": 0.3024
        },
        {
          "key": "10k_100k",
          "label": "1–10 万",
          "count": 311,
          "share": 0.2598
        },
        {
          "key": "100k_500k",
          "label": "10–50 万",
          "count": 334,
          "share": 0.279
        },
        {
          "key": "500k_1m",
          "label": "50–100 万",
          "count": 112,
          "share": 0.0936
        },
        {
          "key": "gte_1m",
          "label": "100 万以上",
          "count": 78,
          "share": 0.0652
        }
      ]
    },
    {
      "id": "called",
      "short_label": "调用用户",
      "label": "历史调用用户",
      "definition": "截至口径日曾产生 OAP 调用、且可归属到人的去重账号。",
      "users": 5816,
      "qieman_accounts": 1233,
      "qieman_account_rate": 0.212,
      "holders": 738,
      "holder_rate": 0.1269,
      "managed_accounts": 676,
      "managed_rate": 0.1162,
      "aum_yuan": 199760000,
      "average_holder_asset_yuan": 270675,
      "profitable_holders": 615,
      "profitable_holder_rate": 0.8333,
      "asset_buckets": [
        {
          "key": "lt_10k",
          "label": "1 万以下",
          "count": 221,
          "share": 0.2995
        },
        {
          "key": "10k_100k",
          "label": "1–10 万",
          "count": 198,
          "share": 0.2683
        },
        {
          "key": "100k_500k",
          "label": "10–50 万",
          "count": 205,
          "share": 0.2778
        },
        {
          "key": "500k_1m",
          "label": "50–100 万",
          "count": 64,
          "share": 0.0867
        },
        {
          "key": "gte_1m",
          "label": "100 万以上",
          "count": 50,
          "share": 0.0678
        }
      ]
    },
    {
      "id": "active_30d",
      "short_label": "近 30 日活跃",
      "label": "近 30 日活跃调用用户",
      "definition": "最近 30 个完整自然日内产生 OAP 调用、且可归属到人的去重账号。",
      "users": 2266,
      "qieman_accounts": 556,
      "qieman_account_rate": 0.2454,
      "holders": 357,
      "holder_rate": 0.1575,
      "managed_accounts": 331,
      "managed_rate": 0.1461,
      "aum_yuan": 87670000,
      "average_holder_asset_yuan": 245567,
      "profitable_holders": 292,
      "profitable_holder_rate": 0.818,
      "asset_buckets": [
        {
          "key": "lt_10k",
          "label": "1 万以下",
          "count": 116,
          "share": 0.3249
        },
        {
          "key": "10k_100k",
          "label": "1–10 万",
          "count": 100,
          "share": 0.2801
        },
        {
          "key": "100k_500k",
          "label": "10–50 万",
          "count": 85,
          "share": 0.2381
        },
        {
          "key": "500k_1m",
          "label": "50–100 万",
          "count": 35,
          "share": 0.098
        },
        {
          "key": "gte_1m",
          "label": "100 万以上",
          "count": 21,
          "share": 0.0588
        }
      ]
    }
  ],
  "qieman_baseline": {
    "managed_accounts": 291827,
    "aum_yuan": 40797000000,
    "average_asset_yuan": 139800,
    "approximate_median_asset_yuan": 38000,
    "profitable_holder_rate": 0.832,
    "share_500k_plus": 0.0625,
    "share_1m_plus": 0.0231,
    "note": "且慢全量可比口径；中位数与高资产占比为近似汇总，用于结构参照，不用于因果归因。"
  },
  "behavior": {
    "window_start": "2026-05-19",
    "window_end": "2026-08-16",
    "event_scope": "未撤销交易事件；不等同于最终成交或确认份额",
    "amount_precision": "rounded_10k",
    "categories": [
      {
        "key": "buy",
        "label": "买入",
        "state": "confirmed"
      },
      {
        "key": "redeem",
        "label": "赎回",
        "state": "confirmed"
      },
      {
        "key": "follow_plan",
        "label": "策略跟投",
        "state": "confirmed"
      },
      {
        "key": "other_plan",
        "label": "其他计划交易",
        "state": "partial"
      },
      {
        "key": "adjust",
        "label": "调仓",
        "state": "confirmed"
      },
      {
        "key": "convert",
        "label": "转换",
        "state": "confirmed"
      },
      {
        "key": "si_trade",
        "label": "SI 交易",
        "state": "missing"
      }
    ],
    "by_cohort": {
      "approved": [
        {
          "key": "buy",
          "actors": 580,
          "penetration": 0.0589,
          "events": 17103,
          "events_per_actor": 29.49,
          "amount_yuan": 30470000
        },
        {
          "key": "redeem",
          "actors": 378,
          "penetration": 0.0384,
          "events": 2301,
          "events_per_actor": 6.09,
          "amount_yuan": 24390000
        },
        {
          "key": "follow_plan",
          "actors": 537,
          "penetration": 0.0545,
          "events": 10616,
          "events_per_actor": 19.77,
          "amount_yuan": 21280000
        },
        {
          "key": "other_plan",
          "actors": 367,
          "penetration": 0.0372,
          "events": 1469,
          "events_per_actor": 4,
          "amount_yuan": 10590000
        },
        {
          "key": "adjust",
          "actors": 659,
          "penetration": 0.0669,
          "events": 3920,
          "events_per_actor": 5.95,
          "amount_yuan": 150000
        },
        {
          "key": "convert",
          "actors": 76,
          "penetration": 0.0077,
          "events": 250,
          "events_per_actor": 3.29,
          "amount_yuan": 3600000
        },
        {
          "key": "si_trade",
          "actors": 315,
          "penetration": 0.032,
          "events": 5123,
          "events_per_actor": 16.26,
          "amount_yuan": 6990000
        }
      ],
      "called": [
        {
          "key": "buy",
          "actors": 358,
          "penetration": 0.0616,
          "events": 10362,
          "events_per_actor": 28.94,
          "amount_yuan": 21100000
        },
        {
          "key": "redeem",
          "actors": 236,
          "penetration": 0.0406,
          "events": 1231,
          "events_per_actor": 5.22,
          "amount_yuan": 16400000
        },
        {
          "key": "follow_plan",
          "actors": 318,
          "penetration": 0.0547,
          "events": 6153,
          "events_per_actor": 19.35,
          "amount_yuan": 13520000
        },
        {
          "key": "other_plan",
          "actors": 216,
          "penetration": 0.0371,
          "events": 833,
          "events_per_actor": 3.86,
          "amount_yuan": 6380000
        },
        {
          "key": "adjust",
          "actors": 412,
          "penetration": 0.0708,
          "events": 2386,
          "events_per_actor": 5.79,
          "amount_yuan": 40000
        },
        {
          "key": "convert",
          "actors": 52,
          "penetration": 0.0089,
          "events": 132,
          "events_per_actor": 2.54,
          "amount_yuan": 2850000
        },
        {
          "key": "si_trade",
          "actors": 187,
          "penetration": 0.0321,
          "events": 3018,
          "events_per_actor": 16.14,
          "amount_yuan": 4870000
        }
      ],
      "active_30d": [
        {
          "key": "buy",
          "actors": 190,
          "penetration": 0.0838,
          "events": 5926,
          "events_per_actor": 31.19,
          "amount_yuan": 11100000
        },
        {
          "key": "redeem",
          "actors": 115,
          "penetration": 0.0508,
          "events": 634,
          "events_per_actor": 5.51,
          "amount_yuan": 7870000
        },
        {
          "key": "follow_plan",
          "actors": 146,
          "penetration": 0.0644,
          "events": 2808,
          "events_per_actor": 19.23,
          "amount_yuan": 6270000
        },
        {
          "key": "other_plan",
          "actors": 102,
          "penetration": 0.045,
          "events": 408,
          "events_per_actor": 4,
          "amount_yuan": 2570000
        },
        {
          "key": "adjust",
          "actors": 212,
          "penetration": 0.0936,
          "events": 1442,
          "events_per_actor": 6.8,
          "amount_yuan": 20000
        },
        {
          "key": "convert",
          "actors": 31,
          "penetration": 0.0137,
          "events": 95,
          "events_per_actor": 3.06,
          "amount_yuan": 2250000
        },
        {
          "key": "si_trade",
          "actors": 106,
          "penetration": 0.0468,
          "events": 1674,
          "events_per_actor": 15.79,
          "amount_yuan": 2390000
        }
      ]
    }
  },
  "profile": {
    "survey_coverage_approx": 0.206,
    "structured_profile_rows": 55,
    "coverage_state": "low",
    "dimensions": [
      {
        "key": "experienced",
        "label": "投资经验丰富",
        "count": 211,
        "sample": 325,
        "share": 0.649,
        "qieman_baseline": 0.194,
        "state": "confirmed_sample"
      },
      {
        "key": "high_income",
        "label": "年收入 30 万以上",
        "count": 143,
        "sample": 236,
        "share": 0.606,
        "qieman_baseline": 0.193,
        "state": "confirmed_sample"
      },
      {
        "key": "high_risk",
        "label": "高风险偏好",
        "count": 264,
        "sample": 325,
        "share": 0.812,
        "qieman_baseline": 0.447,
        "state": "confirmed_sample"
      },
      {
        "key": "equity_preference",
        "label": "偏好权益资产",
        "count": 241,
        "sample": 325,
        "share": 0.742,
        "qieman_baseline": 0.477,
        "state": "confirmed_sample"
      },
      {
        "key": "tech_finance",
        "label": "科技或金融从业",
        "count": 114,
        "sample": 193,
        "share": 0.591,
        "qieman_baseline": null,
        "state": "confirmed_sample"
      }
    ],
    "note": "画像仅代表非缺失问卷样本，关键字段缺失率约 84%–89%；不可外推为全部 OAP 用户。"
  },
  "quality_checks": [
    {
      "label": "稳定主键关联",
      "status": "pass",
      "detail": "OAP、且慢账户、持仓与行为均沿稳定内部主键关联，不使用姓名或联系方式模糊匹配。"
    },
    {
      "label": "人群去重",
      "status": "pass",
      "detail": "三组人群均排除空主键后去重；历史调用组包含近 30 日活跃组。"
    },
    {
      "label": "调用归属",
      "status": "warn",
      "detail": "81.6% 调用来自无法归属到人的服务或集成凭据，平台规模与人群价值必须分开。"
    },
    {
      "label": "行为语义",
      "status": "warn",
      "detail": "行为按未撤销事件统计；“其他计划交易”仅部分确认，“SI 交易”语义待补。"
    },
    {
      "label": "画像覆盖",
      "status": "missing",
      "detail": "问卷覆盖约 20.6%，结构化画像仅 55 条；年龄、城市、家庭等维度暂不展示。"
    }
  ],
  "definitions": [
    {
      "term": "三组人群",
      "state": "confirmed",
      "definition": "批准用户、历史调用用户、近 30 日活跃用户彼此重叠，不得相加；后两组体现使用深度。"
    },
    {
      "term": "可关联且慢账户",
      "state": "confirmed",
      "definition": "拥有可用于持仓汇总的且慢投资账户；不等于当前有资产。"
    },
    {
      "term": "持仓用户",
      "state": "confirmed",
      "definition": "资产快照日总资产大于 0；持仓率以所选 OAP 人群为分母。"
    },
    {
      "term": "在管用户",
      "state": "confirmed",
      "definition": "资产快照日总资产大于 100 元，用于与且慢全量可比口径参照。"
    },
    {
      "term": "累计收益为正",
      "state": "partial",
      "definition": "当前累计收益大于 0 的持仓账户比例；不代表未来收益，也不是 OAP 贡献。"
    },
    {
      "term": "因果关系",
      "state": "missing",
      "definition": "活跃人群的持仓与行为更强是相关性；尚未排除自选择、注册时点等混杂因素。"
    }
  ]
};
