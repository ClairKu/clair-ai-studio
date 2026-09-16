import test from "node:test";
import assert from "node:assert/strict";

import {
  clearReportDisposition,
  mergeReportDispositions,
  normalizedReportUrl,
  reportDisposition,
  seedLegacyArchiveDispositions,
  setReportDisposition,
  setReportsDisposition,
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

test("creates deletion tombstones for every report in a cleared archive", () => {
  const reports = [
    { id: "built-in-report", url: "https://example.com/built-in/" },
    { id: "local-report", url: "" },
  ];
  const entries = setReportsDisposition([], reports, "deleted", archivedAt);

  assert.equal(reportDisposition(entries, reports[0])?.status, "deleted");
  assert.equal(reportDisposition(entries, reports[1])?.status, "deleted");
  assert.equal(entries.length, 2);
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

test("a newer active decision beats a stale archive from another tab", () => {
  const report = { id: "stable-report", url: "https://example.com/report/" };
  const archived = setReportDisposition([], report, "archived", "2026-09-04T02:00:00.000Z");
  const active = setReportDisposition([], report, "active", "2026-09-04T03:00:00.000Z");
  const merged = mergeReportDispositions(archived, active);

  assert.equal(reportDisposition(merged, report)?.status, "active");
});

test("merges independent changes made in two stale tabs", () => {
  const first = { id: "first", url: "https://example.com/first/" };
  const second = { id: "second", url: "https://example.com/second/" };
  const merged = mergeReportDispositions(
    setReportDisposition([], first, "archived", archivedAt),
    setReportDisposition([], second, "deleted", archivedAt),
  );

  assert.equal(reportDisposition(merged, first)?.status, "archived");
  assert.equal(reportDisposition(merged, second)?.status, "deleted");
});

test("deletion wins deterministic ties instead of resurrecting a report", () => {
  const report = { id: "tie", url: "https://example.com/tie/" };
  const merged = mergeReportDispositions(
    setReportDisposition([], report, "active", archivedAt),
    setReportDisposition([], report, "deleted", archivedAt),
  );

  assert.equal(reportDisposition(merged, report)?.status, "deleted");
});
