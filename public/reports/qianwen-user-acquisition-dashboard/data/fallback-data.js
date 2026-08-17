window.QIANWEN_ACQUISITION_DATA = {
  "schema_version": "qianwen-user-acquisition-v5",
  "meta": {
    "title": "千问 X 且慢AI小顾 用户数据看板",
    "window_start_at": "2026-08-10T08:00:00+08:00",
    "launch_at": "2026-08-10T08:00:00+08:00",
    "generated_at": "2026-08-17T15:45:31+08:00",
    "data_cutoff": "2026-08-17T15:45:31+08:00",
    "timezone": "Asia/Shanghai",
    "source": "盈米本体 · 生产数据库",
    "evidence_state": "confirmed",
    "privacy": "用户画像与行为采用小样本保护；页面不含用户明细、单用户金额与原始对话",
    "privacy_policy": "audience-aggregate-k20-v1",
    "latest_day_is_partial": true
  },
  "privacy": {
    "public_grain": "aggregate_only",
    "scope": "profile_and_behavior_only",
    "protected_sections": [
      "profile",
      "behavior"
    ],
    "minimum_public_cell": 20,
    "small_cell_rule": "primary_and_complementary_suppression",
    "multi_dimension_cross_tabs_public": false
  },
  "metrics": {
    "bound_accounts": 1088,
    "existing_accounts": 316,
    "new_accounts": 772,
    "missing_registration_time": 0,
    "duplicate_bindings": 0,
    "unmatched_accounts": 0
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
      "new_accounts_today": 36,
      "existing_accounts_today": 10,
      "unclassified_accounts_today": 0,
      "bound_accounts_today": 46,
      "cumulative_new_accounts": 772,
      "cumulative_existing_accounts": 316,
      "cumulative_unclassified_accounts": 0,
      "cumulative_bound_accounts": 1088,
      "partial": true
    }
  ],
  "profile": {
    "cohorts": {
      "all": {
        "population_accounts": 1088,
        "dimensions": [
          {
            "id": "asset_holding_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "has_assets",
                "accounts": 151
              },
              {
                "id": "no_assets",
                "accounts": 25
              },
              {
                "id": "unknown",
                "accounts": 912
              }
            ]
          },
          {
            "id": "asset_bucket",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "no_assets",
                "accounts": 25
              },
              {
                "id": "lt_10k",
                "accounts": 30
              },
              {
                "id": "10k_100k",
                "accounts": 41
              },
              {
                "id": "100k_500k",
                "accounts": 50
              },
              {
                "id": "gte_500k",
                "accounts": 30
              },
              {
                "id": "unknown",
                "accounts": 912
              }
            ]
          },
          {
            "id": "lifetime_investment_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "buckets": [
              {
                "id": "invested",
                "accounts": 169
              },
              {
                "id": "not_invested",
                "accounts": 919
              },
              {
                "id": "unknown",
                "accounts": 0
              }
            ]
          },
          {
            "id": "bank_card_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "buckets": [
              {
                "id": "card_bound",
                "accounts": 198
              },
              {
                "id": "card_not_bound",
                "accounts": 890
              },
              {
                "id": "unknown",
                "accounts": 0
              }
            ]
          },
          {
            "id": "risk_assessment_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "buckets": [
              {
                "id": "assessed",
                "accounts": 196
              },
              {
                "id": "not_assessed",
                "accounts": 892
              },
              {
                "id": "unknown",
                "accounts": 0
              }
            ]
          }
        ]
      },
      "new": {
        "population_accounts": 772,
        "dimensions": [
          {
            "id": "asset_holding_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "has_assets",
                "accounts": 0
              },
              {
                "id": "no_assets",
                "accounts": 0
              },
              {
                "id": "unknown",
                "accounts": 772
              }
            ]
          },
          {
            "id": "asset_bucket",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "no_assets",
                "accounts": 0
              },
              {
                "id": "lt_10k",
                "accounts": 0
              },
              {
                "id": "10k_100k",
                "accounts": 0
              },
              {
                "id": "100k_500k",
                "accounts": 0
              },
              {
                "id": "gte_500k",
                "accounts": 0
              },
              {
                "id": "unknown",
                "accounts": 772
              }
            ]
          },
          {
            "id": "lifetime_investment_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "buckets": [
              {
                "id": "invested",
                "accounts": 0
              },
              {
                "id": "not_invested",
                "accounts": 772
              },
              {
                "id": "unknown",
                "accounts": 0
              }
            ]
          },
          {
            "id": "bank_card_status",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          },
          {
            "id": "risk_assessment_status",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          }
        ]
      },
      "existing": {
        "population_accounts": 316,
        "dimensions": [
          {
            "id": "asset_holding_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "has_assets",
                "accounts": 151
              },
              {
                "id": "no_assets",
                "accounts": 25
              },
              {
                "id": "unknown",
                "accounts": 140
              }
            ]
          },
          {
            "id": "asset_bucket",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "snapshot_as_of",
            "data_as_of": "2026-08-17",
            "buckets": [
              {
                "id": "no_assets",
                "accounts": 25
              },
              {
                "id": "lt_10k",
                "accounts": 30
              },
              {
                "id": "10k_100k",
                "accounts": 41
              },
              {
                "id": "100k_500k",
                "accounts": 50
              },
              {
                "id": "gte_500k",
                "accounts": 30
              },
              {
                "id": "unknown",
                "accounts": 140
              }
            ]
          },
          {
            "id": "lifetime_investment_status",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "buckets": [
              {
                "id": "invested",
                "accounts": 169
              },
              {
                "id": "not_invested",
                "accounts": 147
              },
              {
                "id": "unknown",
                "accounts": 0
              }
            ]
          },
          {
            "id": "bank_card_status",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          },
          {
            "id": "risk_assessment_status",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "lifetime_as_of",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          }
        ]
      }
    }
  },
  "behavior": {
    "window_start_at": "2026-08-10T08:00:00+08:00",
    "window_end_at": "2026-08-17T15:45:31+08:00",
    "anchor": "first_bound_at",
    "cohorts": {
      "all": {
        "population_accounts": 1088,
        "metrics": [
          {
            "id": "funded_after_binding",
            "state": "unavailable",
            "reason_code": "authoritative_source_unavailable",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "first_investment_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 1088,
            "eligible_accounts": 1088,
            "excluded_accounts": 0,
            "reached_accounts": 0,
            "not_reached_accounts": 1088,
            "unknown_accounts": 0
          },
          {
            "id": "investment_activity_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 1088,
            "eligible_accounts": 1088,
            "excluded_accounts": 0,
            "reached_accounts": 60,
            "not_reached_accounts": 1028,
            "unknown_accounts": 0
          },
          {
            "id": "qieman_app_used_after_binding",
            "state": "unavailable",
            "reason_code": "no_authoritative_source",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "xiaogu_used_after_binding",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          }
        ]
      },
      "new": {
        "population_accounts": 772,
        "metrics": [
          {
            "id": "funded_after_binding",
            "state": "unavailable",
            "reason_code": "authoritative_source_unavailable",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "first_investment_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 772,
            "eligible_accounts": 772,
            "excluded_accounts": 0,
            "reached_accounts": 0,
            "not_reached_accounts": 772,
            "unknown_accounts": 0
          },
          {
            "id": "investment_activity_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 772,
            "eligible_accounts": 772,
            "excluded_accounts": 0,
            "reached_accounts": 0,
            "not_reached_accounts": 772,
            "unknown_accounts": 0
          },
          {
            "id": "qieman_app_used_after_binding",
            "state": "unavailable",
            "reason_code": "no_authoritative_source",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "xiaogu_used_after_binding",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          }
        ]
      },
      "existing": {
        "population_accounts": 316,
        "metrics": [
          {
            "id": "funded_after_binding",
            "state": "unavailable",
            "reason_code": "authoritative_source_unavailable",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "first_investment_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 316,
            "eligible_accounts": 316,
            "excluded_accounts": 0,
            "reached_accounts": 0,
            "not_reached_accounts": 316,
            "unknown_accounts": 0
          },
          {
            "id": "investment_activity_after_binding",
            "state": "confirmed",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00",
            "population_accounts": 316,
            "eligible_accounts": 316,
            "excluded_accounts": 0,
            "reached_accounts": 60,
            "not_reached_accounts": 256,
            "unknown_accounts": 0
          },
          {
            "id": "qieman_app_used_after_binding",
            "state": "unavailable",
            "reason_code": "no_authoritative_source",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window"
          },
          {
            "id": "xiaogu_used_after_binding",
            "state": "suppressed",
            "reason_code": "minimum_group_size",
            "definition_version": "2026-08-17-v1",
            "time_basis": "post_binding_window",
            "data_as_of": "2026-08-17T15:45:31+08:00"
          }
        ]
      }
    }
  }
};
