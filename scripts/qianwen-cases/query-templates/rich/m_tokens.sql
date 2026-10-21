SELECT user_id,created_at,expires_at,revoked_at FROM ying99_qieman.qwen_issued_token WHERE user_id IN ({{IDS}}) AND created_at<'{{CUT}}' ORDER BY user_id,created_at
