const VALID_STATUSES = new Set(["archived", "deleted"]);

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

export function reportDisposition(entries, report) {
  return normalizeReportDispositions(entries)
    .filter((entry) => matchesReport(entry, report))
    .sort((a, b) => {
      const timeDifference = new Date(b.changedAt || 0) - new Date(a.changedAt || 0);
      if (timeDifference) return timeDifference;
      return Number(b.status === "deleted") - Number(a.status === "deleted");
    })[0] || null;
}

export function setReportDisposition(entries, report, status, changedAt = new Date().toISOString()) {
  if (!VALID_STATUSES.has(status)) return normalizeReportDispositions(entries);
  const next = normalizeReportDispositions(entries)
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

export function clearReportDisposition(entries, report) {
  return normalizeReportDispositions(entries)
    .filter((entry) => !matchesReport(entry, report));
}

export function seedLegacyArchiveDispositions(entries, reports) {
  return (Array.isArray(reports) ? reports : []).reduce((next, report) => {
    if (!report?.archived || reportDisposition(next, report)) return next;
    return setReportDisposition(next, report, "archived", report.archivedAt || "");
  }, normalizeReportDispositions(entries));
}
