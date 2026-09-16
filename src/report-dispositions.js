const VALID_STATUSES = new Set(["active", "archived", "deleted"]);
const STATUS_PRIORITY = new Map([
  ["active", 1],
  ["archived", 2],
  ["deleted", 3],
]);

export function normalizedReportUrl(value = "") {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    const pathname = decodeURI(parsed.pathname)
      .replace(/\/index\.html$/, "/")
      .replace(/\/+$/, "/");
    return `${parsed.origin}${pathname}`;
  } catch {
    return String(value).trim().replace(/\/+$/, "/");
  }
}

function normalizedDisposition(entry) {
  if (!entry || !VALID_STATUSES.has(entry.status)) return null;
  const id = typeof entry.id === "string" ? entry.id.trim() : "";
  const url = normalizedReportUrl(entry.url);
  if (!id && !url) return null;
  return {
    id,
    url,
    status: entry.status,
    changedAt: typeof entry.changedAt === "string" ? entry.changedAt : "",
  };
}

export function normalizeReportDispositions(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map(normalizedDisposition).filter(Boolean);
}

function matchesReport(entry, report) {
  const reportId = typeof report?.id === "string" ? report.id.trim() : "";
  const reportUrl = normalizedReportUrl(report?.url);
  return Boolean(
    (reportId && entry.id === reportId) ||
    (reportUrl && entry.url === reportUrl),
  );
}

function compareDispositions(a, b) {
  const timeDifference = new Date(a?.changedAt || 0) - new Date(b?.changedAt || 0);
  if (timeDifference) return timeDifference;
  return (STATUS_PRIORITY.get(a?.status) || 0) - (STATUS_PRIORITY.get(b?.status) || 0);
}

export function mergeReportDispositions(...collections) {
  const merged = [];
  const candidates = collections.flatMap((entries) => normalizeReportDispositions(entries));

  for (const candidate of candidates) {
    const matchingIndexes = merged
      .map((entry, index) => matchesReport(entry, candidate) ? index : -1)
      .filter((index) => index >= 0);
    if (!matchingIndexes.length) {
      merged.push(candidate);
      continue;
    }

    const matches = matchingIndexes.map((index) => merged[index]);
    const winner = [...matches, candidate]
      .sort((a, b) => compareDispositions(b, a))[0];
    for (const index of matchingIndexes.sort((a, b) => b - a)) merged.splice(index, 1);
    merged.push(winner);
  }

  return merged.sort((a, b) => {
    const idDifference = a.id.localeCompare(b.id);
    if (idDifference) return idDifference;
    return a.url.localeCompare(b.url);
  });
}

export function reportDisposition(entries, report) {
  return normalizeReportDispositions(entries)
    .filter((entry) => matchesReport(entry, report))
    .sort((a, b) => compareDispositions(b, a))[0] || null;
}

export function setReportDisposition(entries, report, status, changedAt = new Date().toISOString()) {
  if (!VALID_STATUSES.has(status)) return normalizeReportDispositions(entries);
  const next = mergeReportDispositions(entries)
    .filter((entry) => !matchesReport(entry, report));
  const disposition = normalizedDisposition({
    id: report?.id,
    url: report?.url,
    status,
    changedAt,
  });
  if (disposition) next.push(disposition);
  return next;
}

export function setReportsDisposition(entries, reports, status, changedAt = new Date().toISOString()) {
  if (!VALID_STATUSES.has(status)) return normalizeReportDispositions(entries);
  return (Array.isArray(reports) ? reports : []).reduce(
    (next, report) => setReportDisposition(next, report, status, changedAt),
    mergeReportDispositions(entries),
  );
}

export function clearReportDisposition(entries, report) {
  return mergeReportDispositions(entries)
    .filter((entry) => !matchesReport(entry, report));
}

export function seedLegacyArchiveDispositions(entries, reports) {
  return (Array.isArray(reports) ? reports : []).reduce((next, report) => {
    if (!report?.archived || reportDisposition(next, report)) return next;
    return setReportDisposition(next, report, "archived", report.archivedAt || "");
  }, normalizeReportDispositions(entries));
}
