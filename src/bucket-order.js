export function reorderItemIds(ids, sourceId, targetId, placeAfter = false) {
  const ordered = [...new Set((Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === "string" && id))];
  if (!sourceId || !targetId || sourceId === targetId) return ordered;
  if (!ordered.includes(sourceId) || !ordered.includes(targetId)) return ordered;

  const next = ordered.filter((id) => id !== sourceId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex + (placeAfter ? 1 : 0), 0, sourceId);
  return next;
}
