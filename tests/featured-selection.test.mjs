import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FEATURED_REPORT_IDS,
  FEATURED_SELECTION_KEY,
  loadFeaturedReportIds,
  saveFeaturedReportIds,
} from "../src/featured-selection.js";

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("restores the curated featured membership from the legacy drag order", () => {
  const storage = memoryStorage({
    "clair-service-report-workbench-report-order-v1": JSON.stringify({
      "featured:featured": ["first", "second", "first"],
    }),
  });
  const resetState = {
    version: 96,
    reports: [{ id: "wrong-default", pinned: true }],
  };
  assert.deepEqual(loadFeaturedReportIds(storage, resetState), ["first", "second"]);
});

test("a dedicated featured ledger preserves an intentionally empty selection", () => {
  const storage = memoryStorage({
    [FEATURED_SELECTION_KEY]: JSON.stringify({ schemaVersion: 1, ids: [] }),
    "clair-service-report-workbench-report-order-v1": JSON.stringify({
      "featured:featured": ["stale-card"],
    }),
  });
  assert.deepEqual(loadFeaturedReportIds(storage, { reports: [] }), []);
});

test("falls back to saved pin flags before using the catalog defaults", () => {
  const storage = memoryStorage();
  const savedState = {
    reports: [
      { id: "kept", pinned: true },
      { id: "not-kept", pinned: false },
    ],
  };
  assert.deepEqual(loadFeaturedReportIds(storage, savedState), ["kept"]);
  assert.deepEqual(loadFeaturedReportIds(storage, {}), DEFAULT_FEATURED_REPORT_IDS);
});

test("saving the featured ledger records membership independently of catalog versions", () => {
  const storage = memoryStorage();
  assert.deepEqual(saveFeaturedReportIds(storage, [
    { id: "alpha", pinned: true },
    { id: "beta", pinned: false },
    { id: "alpha", pinned: true },
  ]), ["alpha"]);
  assert.deepEqual(JSON.parse(storage.getItem(FEATURED_SELECTION_KEY)), {
    schemaVersion: 1,
    ids: ["alpha"],
  });
});
