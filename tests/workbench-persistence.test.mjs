import test from "node:test";
import assert from "node:assert/strict";

import { setReportDisposition } from "../src/report-dispositions.js";
import {
  applyReportDispositions,
  DISPOSITION_LEDGER_BACKUP_KEY,
  DISPOSITION_LEDGER_KEY,
  loadDispositionLedger,
  saveDispositionLedger,
} from "../src/workbench-persistence.js";

function memoryStorage({ failKeys = [] } = {}) {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failKeys.includes(key)) throw new Error("quota");
      values.set(key, String(value));
    },
    values,
  };
}

const first = { id: "first", url: "https://example.com/first/" };
const second = { id: "second", url: "https://example.com/second/" };

test("writes redundant ledger copies and recovers when the primary is corrupted", () => {
  const storage = memoryStorage();
  saveDispositionLedger(storage, setReportDisposition([], first, "archived"));
  storage.values.set(DISPOSITION_LEDGER_KEY, "{broken");

  assert.equal(loadDispositionLedger(storage)[0]?.status, "archived");
  assert.match(storage.values.get(DISPOSITION_LEDGER_BACKUP_KEY), /"schemaVersion":2/);
});

test("preserves both tabs when each saves a different report", () => {
  const storage = memoryStorage();
  const firstTab = setReportDisposition([], first, "archived", "2026-09-16T01:00:00.000Z");
  const secondTab = setReportDisposition([], second, "deleted", "2026-09-16T01:01:00.000Z");
  saveDispositionLedger(storage, firstTab);
  const merged = saveDispositionLedger(storage, secondTab);

  assert.deepEqual(merged.map((entry) => entry.status).sort(), ["archived", "deleted"]);
});

test("keeps the ledger when one redundant storage slot rejects the write", () => {
  const storage = memoryStorage({ failKeys: [DISPOSITION_LEDGER_KEY] });
  saveDispositionLedger(storage, setReportDisposition([], first, "deleted"));

  assert.equal(loadDispositionLedger(storage)[0]?.status, "deleted");
});

test("applies archived, active, and deleted decisions to catalog records", () => {
  const reports = [
    { ...first, archived: false, archivedAt: "" },
    { ...second, archived: true, archivedAt: "old" },
    { id: "third", url: "https://example.com/third/" },
  ];
  const ledger = [
    ...setReportDisposition([], first, "archived", "2026-09-16T01:00:00.000Z"),
    ...setReportDisposition([], second, "active", "2026-09-16T01:01:00.000Z"),
    ...setReportDisposition([], reports[2], "deleted", "2026-09-16T01:02:00.000Z"),
  ];
  const applied = applyReportDispositions(reports, ledger);

  assert.equal(applied.length, 2);
  assert.equal(applied.find((report) => report.id === first.id)?.archived, true);
  assert.equal(applied.find((report) => report.id === second.id)?.archived, false);
});
