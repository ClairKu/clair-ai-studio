SELECT p.po_manager_id pmid,b.fb,p.registered_at,p.gender,p.account3_id,p.account_created_at,
    CASE WHEN CHAR_LENGTH(p.birthday_del)=8 THEN TIMESTAMPDIFF(YEAR,STR_TO_DATE(p.birthday_del,'%Y%m%d'),'{{CUTDAY}}') END age,
    JSON_UNQUOTE(JSON_EXTRACT(p.register_location,'$.province')) prov,
    (p.unionid IS NOT NULL AND p.unionid<>'') mp,(p.bank_no IS NOT NULL AND p.bank_no<>'') card,
    CASE WHEN ABS(TIMESTAMPDIFF(MINUTE,p.registered_at,b.fb))<=60 THEN 'new' ELSE 'existing' END cohort
    FROM ying99_pomodel.portfolio_manager_info p JOIN (SELECT user_id pmid,MIN(created_at) fb FROM ying99_qieman.qwen_user_map WHERE is_deleted=0 GROUP BY user_id HAVING MIN(created_at)>='2026-08-03 00:00:00' AND MIN(created_at)<'{{CUT}}') b ON b.pmid=p.po_manager_id
    WHERE p.po_manager_id IN ({{IDS}})
