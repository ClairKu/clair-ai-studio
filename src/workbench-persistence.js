import {
  mergeReportDispositions,
  normalizeReportDispositions,
  reportDisposition,
} from "./report-dispositions.js";

export const DISPOSITION_LEDGER_KEY = "clair-service-report-dispositions-v2";
export const DISPOSITION_LEDGER_BACKUP_KEY = "clair-service-report-dispositions-v2-backup";
export const DISPOSITION_BACKUP_DATABASE_ID = "__clair_report_dispositions_v2__";

function parsedLedger(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeReportDispositions(Array.isArray(parsed) ? parsed : parsed?.entries);
  } catch {
    return [];
  }
}

export function dispositionFingerprint(entries) {
  return JSON.stringify(mergeReportDispositions(entries));
}

export function loadDispositionLedger(storage = globalThis.localStorage) {
  const ledgers = [];
  for (const key of [DISPOSITION_LEDGER_KEY, DISPOSITION_LEDGER_BACKUP_KEY]) {
    try {
      ledgers.push(parsedLedger(storage?.getItem(key)));
    } catch {
      // A blocked storage surface must not erase the in-memory catalog.
    }
  }
  return mergeReportDispositions(...ledgers);
}

export function saveDispositionLedger(storage = globalThis.localStorage, entries = [], now = new Date().toISOString()) {
  const merged = mergeReportDispositions(loadDispositionLedger(storage), entries);
  const payload = JSON.stringify({
    schemaVersion: 2,
    updatedAt: now,
    entries: merged,
  });
  let successfulWrites = 0;
  let lastError = null;

  for (const key of [DISPOSITION_LEDGER_BACKUP_KEY, DISPOSITION_LEDGER_KEY]) {
    try {
      storage?.setItem(key, payload);
      successfulWrites += 1;
    } catch (error) {
      lastError = error;
    }
  }

  if (!successfulWrites && lastError) throw lastError;
  return merged;
}

export function applyReportDispositions(reports = [], entries = []) {
  return reports.flatMap((report) => {
    const disposition = reportDisposition(entries, report);
    if (disposition?.status === "deleted") return [];
    if (disposition?.status === "archived") {
      return [{ ...report, archived: true, archivedAt: disposition.changedAt || report.archivedAt || "" }];
    }
    if (disposition?.status === "active") {
      return [{ ...report, archived: false, archivedAt: "" }];
    }
    return [report];
  });
}
