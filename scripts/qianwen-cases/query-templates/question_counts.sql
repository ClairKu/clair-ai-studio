WITH funded AS ({{FUNDED}}),qmap AS (SELECT DISTINCT qmuser_user_id,session_id FROM ying99_qieman.qwen_a2a_session_map WHERE is_deleted=0 AND created_at<'{{CUT}}' AND qmuser_user_id IN ({{IDS}})),msgs AS (
        SELECT DISTINCT b.pmid,m.id msg_id,m.dj_gmt_create FROM funded b JOIN qmap q ON q.qmuser_user_id=b.pmid
        JOIN ying99_xiaogu3_qa.agent_dj_sessions s ON s.session_id=q.session_id AND s.is_deleted=0 AND s.qmuser_user_id=b.pmid
        JOIN ying99_xiaogu3_qa.agent_dj_messages m ON m.session_id=q.session_id AND m.is_deleted=0 AND m.role='USER' AND m.dj_gmt_create>=b.fb AND m.dj_gmt_create<'{{CUT}}' WHERE m.user_input IS NOT NULL AND TRIM(m.user_input)<>'')
        SELECT b.pmid,COUNT(DISTINCT m.msg_id) total_questions,COUNT(DISTINCT CASE WHEN m.dj_gmt_create<b.first_inflow_after THEN m.msg_id END) pre_first_inflow_questions,b.first_inflow_after FROM funded b LEFT JOIN msgs m ON m.pmid=b.pmid GROUP BY b.pmid,b.first_inflow_after
