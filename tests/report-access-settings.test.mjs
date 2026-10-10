import test from "node:test";
import assert from "node:assert/strict";

import {
  managedAccessEntry,
  normalizeReportAccessConfig,
  publishReportAccessSetting,
  reportAccessStatus,
} from "../src/report-access-settings.js";
import {
  githubSessionToken,
  hasGithubSessionToken,
  rememberGithubSessionToken,
} from "../src/github-session.js";

test("normalizes report and app entries while migrating the earlier ID format", () => {
  assert.deepEqual(normalizeReportAccessConfig({
    defaultLocked: false,
    lockedEntries: ["/apps/demo/page.html", "apps/demo/page.html"],
    lockedReportIds: ["legacy-report"],
    immutableLockedReportIds: ["encrypted-report"],
  }), {
    version: 2,
    defaultLocked: false,
    lockedEntries: ["apps/demo/page.html", "reports/legacy-report/"],
    unlockedEntries: [],
    immutableLockedEntries: ["reports/encrypted-report/"],
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

test("shares a publish token only in module memory", () => {
  rememberGithubSessionToken("");
  assert.equal(hasGithubSessionToken(), false);
  rememberGithubSessionToken("  github_pat_example  ");
  assert.equal(githubSessionToken(), "github_pat_example");
  assert.equal(hasGithubSessionToken(), true);
  rememberGithubSessionToken("");
});

test("publishes both config mirrors against the same production head", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  const productionConfig = {
    version: 2,
    defaultLocked: true,
    lockedEntries: [],
    unlockedEntries: [],
    immutableLockedEntries: [],
  };
  const responses = [
    { object: { sha: "base-head" } },
    { encoding: "base64", content: Buffer.from(JSON.stringify(productionConfig)).toString("base64") },
    { tree: { sha: "base-tree" } },
    { sha: "config-blob" },
    { sha: "config-tree" },
    { sha: "config-commit" },
    { object: { sha: "config-commit" } },
  ];
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    const payload = responses.shift();
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const result = await publishReportAccessSetting({
      title: "Concurrency-safe report",
      url: "https://clairku.github.io/clair-ai-studio/reports/concurrency-safe/",
    }, { locked: false, token: "github_pat_test" });
    assert.equal(result.commit, "config-commit");
    assert.match(requests[1].url, /contents\/public\/report-access\.json\?ref=base-head$/);
    assert.match(requests[2].url, /git\/commits\/base-head$/);
    const treeBody = JSON.parse(requests[4].options.body);
    assert.deepEqual(treeBody.tree.map((entry) => entry.path), [
      "public/report-access.json",
      "docs/report-access.json",
    ]);
    const commitBody = JSON.parse(requests[5].options.body);
    assert.deepEqual(commitBody.parents, ["base-head"]);
    assert.deepEqual(result.config.unlockedEntries, ["reports/concurrency-safe/"]);
  } finally {
    globalThis.fetch = originalFetch;
    rememberGithubSessionToken("");
  }
});
