import test from "node:test";
import assert from "node:assert/strict";

import {
  clearReportDisposition,
  normalizedReportUrl,
  reportDisposition,
  seedLegacyArchiveDispositions,
  setReportDisposition,
} from "../src/report-dispositions.js";

const archivedAt = "2026-09-04T02:00:00.000Z";

test("keeps an archive decision when catalog metadata and URL change", () => {
  const original = {
    id: "stable-report-id",
    url: "https://clairku.github.io/clair-ai-studio/reports/old-slug/",
  };
  const updated = {
    id: "stable-report-id",
    url: "https://clairku.github.io/clair-ai-studio/reports/new-slug/",
  };
  const entries = setReportDisposition([], original, "archived", archivedAt);

  assert.equal(reportDisposition(entries, updated)?.status, "archived");
});

test("keeps an archive decision when the id changes but the report URL stays stable", () => {
  const original = {
    id: "old-id",
    url: "https://clairku.github.io/clair-ai-studio/reports/stable/index.html?preview=1#top",
  };
  const updated = {
    id: "new-id",
    url: "https://clairku.github.io/clair-ai-studio/reports/stable/",
  };
  const entries = setReportDisposition([], original, "archived", archivedAt);

  assert.equal(normalizedReportUrl(original.url), updated.url);
  assert.equal(reportDisposition(entries, updated)?.status, "archived");
});

test("persists permanent deletion as an explicit tombstone", () => {
  const report = {
    id: "built-in-report",
    url: "https://clairku.github.io/clair-ai-studio/reports/built-in-report/",
  };
  const entries = setReportDisposition([], report, "deleted", archivedAt);

  assert.deepEqual(reportDisposition(entries, report), {
    id: report.id,
    url: report.url,
    status: "deleted",
    changedAt: archivedAt,
  });
});

test("migrates legacy archived flags and clears the decision on restore", () => {
  const report = {
    id: "legacy-archive",
    url: "https://clairku.github.io/clair-ai-studio/reports/legacy-archive/",
    archived: true,
    archivedAt,
  };
  const migrated = seedLegacyArchiveDispositions([], [report]);

  assert.equal(reportDisposition(migrated, report)?.status, "archived");
  assert.equal(reportDisposition(clearReportDisposition(migrated, report), report), null);
});
