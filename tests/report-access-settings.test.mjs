import test from "node:test";
import assert from "node:assert/strict";

import {
  loadReportAccessConfig,
  managedAccessEntry,
  normalizeReportAccessConfig,
  publishReportAccessSetting,
  reportAccessStatus,
} from "../src/report-access-settings.js";

test("normalizes report and app entries while migrating the earlier ID format", () => {
  assert.deepEqual(normalizeReportAccessConfig({
    stateEndpoint: "https://state.example/v1/",
    defaultLocked: false,
    lockedEntries: ["/apps/demo/page.html", "apps/demo/page.html"],
    lockedReportIds: ["legacy-report"],
    immutableLockedReportIds: ["encrypted-report"],
  }), {
    version: 3,
    stateEndpoint: "https://state.example/v1",
    defaultLocked: false,
    lockedEntries: ["apps/demo/page.html", "reports/legacy-report/"],
    unlockedEntries: [],
    immutableLockedEntries: ["reports/encrypted-report/"],
    updatedAt: "",
  });
});

test("fails closed when an older config has no default policy", () => {
  assert.equal(normalizeReportAccessConfig({}).defaultLocked, true);
  assert.equal(normalizeReportAccessConfig({ defaultLocked: false }).defaultLocked, false);
});

test("derives one stable access entry for report directories and individual app pages", () => {
  assert.equal(managedAccessEntry({
    url: "https://clairku.github.io/clair-ai-studio/reports/example/index.html",
  }), "reports/example/");
  assert.equal(managedAccessEntry({
    url: "https://clairku.github.io/clair-ai-studio/apps/advisor/customer-360.html",
  }), "apps/advisor/customer-360.html");
  assert.equal(managedAccessEntry({ url: "https://example.com/report/" }), "");
});

test("reports selective, immutable, and unmanaged states", () => {
  const config = {
    defaultLocked: false,
    lockedEntries: ["apps/advisor/customer-360.html"],
    immutableLockedEntries: ["reports/encrypted/"],
  };
  assert.equal(reportAccessStatus({
    url: "https://clairku.github.io/clair-ai-studio/apps/advisor/customer-360.html",
  }, config).locked, true);
  assert.equal(reportAccessStatus({
    url: "https://clairku.github.io/clair-ai-studio/reports/encrypted/",
  }, config).immutable, true);
  assert.equal(reportAccessStatus({
    url: "https://clairku.github.io/clair-ai-studio/reports/public/",
  }, config).locked, false);
  assert.equal(reportAccessStatus({ url: "https://example.com/" }, config).managed, false);
});

test("preserves default protection while allowing an explicit public exception", () => {
  const config = {
    defaultLocked: true,
    unlockedEntries: ["reports/public/"],
  };
  assert.equal(reportAccessStatus({
    url: "https://clairku.github.io/clair-ai-studio/reports/default-protected/",
  }, config).locked, true);
  assert.equal(reportAccessStatus({
    url: "https://clairku.github.io/clair-ai-studio/reports/public/",
  }, config).locked, false);
});

test("loads live state and toggles it with the workspace session without a Pages deployment", async () => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;
  const values = new Map([
    ["clair-ai-studio-access-admin-token-v1", "short-lived-token"],
    ["clair-ai-studio-access-admin-expires-v1", String(Date.now() + 60_000)],
  ]);
  const requests = [];
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  globalThis.fetch = async (url, options = {}) => {
    const request = { url: String(url), options };
    requests.push(request);
    if (request.url.includes("report-access.json")) {
      return Response.json({
        version: 3,
        stateEndpoint: "https://state.example/v1",
        defaultLocked: true,
        lockedEntries: [],
        unlockedEntries: [],
        immutableLockedEntries: [],
      });
    }
    if ((options.method || "GET") === "GET") {
      return Response.json({
        config: {
          version: 3,
          defaultLocked: true,
          lockedEntries: [],
          unlockedEntries: [],
          immutableLockedEntries: [],
        },
      });
    }
    return Response.json({
      config: {
        version: 3,
        defaultLocked: true,
        lockedEntries: [],
        unlockedEntries: ["reports/live-toggle/"],
        immutableLockedEntries: [],
        updatedAt: "2026-10-10T10:00:00.000Z",
      },
      status: { entry: "reports/live-toggle/", locked: false, immutable: false },
    });
  };
  try {
    await loadReportAccessConfig({ force: true });
    const result = await publishReportAccessSetting({
      title: "Live toggle",
      url: "https://clairku.github.io/clair-ai-studio/reports/live-toggle/",
    }, { locked: false });
    const write = requests.find((request) => request.options.method === "PUT");
    assert.ok(write);
    assert.equal(write.url, "https://state.example/v1/report-access");
    assert.equal(write.options.headers.Authorization, "Bearer short-lived-token");
    assert.deepEqual(JSON.parse(write.options.body), {
      entry: "reports/live-toggle/",
      locked: false,
    });
    assert.equal(result.locked, false);
    assert.deepEqual(result.config.unlockedEntries, ["reports/live-toggle/"]);
    assert.equal(requests.some((request) => request.url.includes("api.github.com")), false);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  }
});
