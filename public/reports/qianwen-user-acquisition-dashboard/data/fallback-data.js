window.QIANWEN_ACQUISITION_DATA = {
  "schema_version": "qianwen-user-acquisition-v1",
  "meta": {
    "title": "千问 → 且慢账号映射数据看板",
    "launch_at": "2026-08-10T08:00:00+08:00",
    "generated_at": "2026-08-17T10:38:15+08:00",
    "data_cutoff": "2026-08-17T10:32:34+08:00",
    "timezone": "Asia/Shanghai",
    "source": "盈米本体 · 生产数仓只读聚合",
    "evidence_state": "confirmed",
    "privacy": "公开脱敏聚合，不含用户明细与数据库凭证",
    "latest_day_is_partial": true
  },
  "metrics": {
    "mapped_accounts": 1065,
    "existing_accounts": 309,
    "new_accounts": 756,
    "missing_registration_time": 0,
    "duplicate_mappings": 0,
    "unmatched_accounts": 0,
    "boundary_records": 0
  },
  "daily": [
    {
      "date": "2026-08-10",
      "new_mapped_accounts": 362,
      "cumulative_mapped_accounts": 362,
      "partial": true
    },
    {
      "date": "2026-08-11",
      "new_mapped_accounts": 210,
      "cumulative_mapped_accounts": 572,
      "partial": false
    },
    {
      "date": "2026-08-12",
      "new_mapped_accounts": 138,
      "cumulative_mapped_accounts": 710,
      "partial": false
    },
    {
      "date": "2026-08-13",
      "new_mapped_accounts": 106,
      "cumulative_mapped_accounts": 816,
      "partial": false
    },
    {
      "date": "2026-08-14",
      "new_mapped_accounts": 76,
      "cumulative_mapped_accounts": 892,
      "partial": false
    },
    {
      "date": "2026-08-15",
      "new_mapped_accounts": 90,
      "cumulative_mapped_accounts": 982,
      "partial": false
    },
    {
      "date": "2026-08-16",
      "new_mapped_accounts": 60,
      "cumulative_mapped_accounts": 1042,
      "partial": false
    },
    {
      "date": "2026-08-17",
      "new_mapped_accounts": 23,
      "cumulative_mapped_accounts": 1065,
      "partial": true
    }
  ],
  "quality_checks": [
    {
      "label": "去重闭合",
      "value": "1,065 = 1,065",
      "status": "pass",
      "detail": "窗口内映射记录数与唯一账号数一致"
    },
    {
      "label": "关联完整",
      "value": "0 丢失",
      "status": "pass",
      "detail": "映射账号均能关联且慢账号主记录"
    },
    {
      "label": "注册时间",
      "value": "0 缺失",
      "status": "pass",
      "detail": "存量与新注册分组可完全闭合"
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
      "term": "成功映射账号",
      "definition": "上线节点后成功建立千问身份与且慢账号映射的去重账号数。",
      "state": "confirmed"
    },
    {
      "term": "接入后新注册",
      "definition": "且慢注册时间不早于上线节点的映射账号；包含静默注册，不等于已激活或已交易。",
      "state": "confirmed"
    },
    {
      "term": "既有且慢账号",
      "definition": "且慢注册时间早于上线节点、随后通过千问完成身份映射的账号。",
      "state": "confirmed"
    },
    {
      "term": "完整千问引流",
      "definition": "当前缺少千问侧曝光、进入、绑定失败等上游分母，不能据此计算完整引流转化率。",
      "state": "missing"
    }
  ]
};
