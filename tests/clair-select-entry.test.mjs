import test from "node:test";
import assert from "node:assert/strict";
import { personalLaunchpadMarkup } from "../src/personal-home.js";
import { DEFAULT_FEATURED_REPORT_IDS, FEATURED_SELECTION_KEY, loadFeaturedReportIds } from "../src/featured-selection.js";

const selectId = "candidate-evaluator-2026-10-29";
const storage = (seed = {}) => ({ getItem: (key) => seed[key] ?? null });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

test("Clair Select is available from the common launchpad with the online and local boundary", () => {
  const html = personalLaunchpadMarkup({
    reports: [{ id: selectId, title: "Clair Select｜招聘工作台" }],
    escapeHtml,
    storage: storage(),
  });
  assert.equal((html.match(new RegExp(`data-id="${selectId}"`, "g")) || []).length, 1);
  assert.match(html, /线上加密档案 · 本机完整功能/);
});

test("the launchpad respects a previously archived Clair Select record", () => {
  const html = personalLaunchpadMarkup({
    reports: [{ id: selectId, title: "Clair Select｜招聘工作台", archived: true }],
    escapeHtml,
    storage: storage(),
  });
  assert.doesNotMatch(html, new RegExp(`data-id="${selectId}"`));
});

test("the new featured default preserves the user's existing curated selection and order", () => {
  assert.ok(DEFAULT_FEATURED_REPORT_IDS.includes(selectId));
  assert.deepEqual(loadFeaturedReportIds(storage({
    [FEATURED_SELECTION_KEY]: JSON.stringify({ schemaVersion: 1, ids: ["mine-b", "mine-a"] }),
  }), { reports: [] }), ["mine-b", "mine-a"]);
  assert.deepEqual(loadFeaturedReportIds(storage({
    [FEATURED_SELECTION_KEY]: JSON.stringify({ schemaVersion: 1, ids: [] }),
  }), { reports: [] }), []);
});

