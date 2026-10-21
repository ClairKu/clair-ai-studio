SELECT account3_id,created_at,score FROM ying99_accounts.risk_survey_record WHERE account3_id IN ({{A3}}) AND broker='0008' AND created_at<'{{CUT}}' ORDER BY account3_id,created_at
