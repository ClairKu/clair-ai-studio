SELECT po_manager_id,platform,created_on,updated_on FROM ying99_pomodel.device_info WHERE po_manager_id IN ({{IDS}}) AND created_on<'{{CUT}}' ORDER BY po_manager_id,created_on
