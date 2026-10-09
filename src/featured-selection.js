export const FEATURED_SELECTION_KEY = "clair-service-report-workbench-featured-v1";

export const DEFAULT_FEATURED_REPORT_IDS = Object.freeze([
  "product-demand-pulse-2026-08-11",
  "qieman-four-money-redesign-2026-09-24",
  "qianwen-first-investor-cases-2026-09-17",
  "doubao-user-conversion-cases-2026-09-20",
  "oap-journey-metrics-2026-08-02",
  "qianwen-user-acquisition-dashboard",
  "doubao-user-acquisition-dashboard",
  "yingmi-ai-oap-framework-2026-08-03",
  "wb-wechat-ai-dashboard",
]);

const LEGACY_REPORT_ORDER_KEY = "clair-service-report-workbench-report-order-v1";
const LEGACY_FEATURED_ORDER_KEY = "featured:featured";

function uniqueIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === "string" && id))];
}

function parsedStorageValue(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadFeaturedReportIds(storage, savedState) {
  const ledger = parsedStorageValue(storage, FEATURED_SELECTION_KEY);
  if (ledger?.schemaVersion === 1 && Array.isArray(ledger.ids)) {
    return uniqueIds(ledger.ids);
  }

  // Before the dedicated ledger existed, dragging the featured cards wrote the
  // exact curated membership and order to this independent key. Prefer it when
  // repairing catalogs whose version migration reset every report's pin flag.
  const legacyOrder = parsedStorageValue(storage, LEGACY_REPORT_ORDER_KEY);
  const orderedIds = uniqueIds(legacyOrder?.[LEGACY_FEATURED_ORDER_KEY]);
  if (orderedIds.length) return orderedIds;

  const savedReports = Array.isArray(savedState?.reports) ? savedState.reports : [];
  if (savedReports.some((report) => Object.hasOwn(report, "pinned"))) {
    return uniqueIds(savedReports.filter((report) => report.pinned).map((report) => report.id));
  }
  return [...DEFAULT_FEATURED_REPORT_IDS];
}

export function saveFeaturedReportIds(storage, reportsOrIds) {
  const ids = uniqueIds((reportsOrIds || []).map((item) =>
    typeof item === "string" ? item : item?.pinned ? item.id : ""));
  storage?.setItem?.(FEATURED_SELECTION_KEY, JSON.stringify({
    schemaVersion: 1,
    ids,
  }));
  return ids;
}

