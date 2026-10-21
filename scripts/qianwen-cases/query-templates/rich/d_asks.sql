WITH funded AS ({{FUNDED}}) SELECT DISTINCT b.pmid uid,CAST(q.session_id AS CHAR) session_id,CAST(m.id AS CHAR) msg_id,m.dj_gmt_create ts,m.user_input text
            FROM funded b JOIN (SELECT DISTINCT qmuser_user_id,session_id FROM ying99_qieman.qwen_a2a_session_map WHERE is_deleted=0 AND created_at<'{{CUT}}' AND qmuser_user_id IN ({{IDS}})) q ON q.qmuser_user_id=b.pmid
            JOIN ying99_xiaogu3_qa.agent_dj_sessions s ON s.session_id=q.session_id AND s.is_deleted=0 AND s.qmuser_user_id=b.pmid
            JOIN ying99_xiaogu3_qa.agent_dj_messages m ON m.session_id=q.session_id AND m.is_deleted=0 AND m.role='USER' AND m.dj_gmt_create>=b.fb AND m.dj_gmt_create<'{{CUT}}'
            WHERE m.user_input IS NOT NULL AND TRIM(m.user_input)<>'' ORDER BY b.pmid,m.dj_gmt_create,CAST(m.id AS CHAR)
