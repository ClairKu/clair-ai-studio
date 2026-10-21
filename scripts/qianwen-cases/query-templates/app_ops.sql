WITH funded AS ({{FUNDED}}) SELECT CAST(e.broker_user_id AS UNSIGNED) pmid,e.lib,MIN(e.event_time) first_app_operation_at,COUNT(*) operation_rows FROM qm_meta.ai_insight_sensors_event_detail e JOIN funded b ON e.broker_user_id=CAST(b.pmid AS CHAR)
        WHERE e.event_date>='2026-08-03' AND e.event_date<='{{CUTDAY}}' AND e.broker_user_id IN ({{IDQ}}) AND e.lib IN ('iOS','Android','HarmonyOS')
        AND ((e.event_category='浏览' AND e.event='$AppViewScreen') OR (e.event_category='点击' AND e.event='$AppClick')) AND e.event_time>=b.fb AND e.event_time<'{{CUT}}' GROUP BY e.broker_user_id,e.lib
