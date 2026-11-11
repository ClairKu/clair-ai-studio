import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { personalLaunchpadMarkup } from "../src/personal-home.js";
import { DEFAULT_FEATURED_REPORT_IDS, FEATURED_SELECTION_KEY, loadFeaturedReportIds } from "../src/featured-selection.js";

const selectId = "candidate-evaluator-2026-10-29";
const storage = (seed = {}) => ({ getItem: (key) => seed[key] ?? null });
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

test("the recruitment workspace is visibly named in the common launchpad", () => {
  const html = personalLaunchpadMarkup({
    reports: [{ id: selectId, title: "Clair Select｜招聘工作台" }],
    escapeHtml,
    storage: storage(),
  });
  assert.equal((html.match(new RegExp(`data-id="${selectId}"`, "g")) || []).length, 1);
  assert.match(html, /studio-shortcut-title">招聘工作台 · Clair Select/);
  assert.doesNotMatch(html, /云端原件 · 面试评价 · 随时上传/);
  assert.match(html, /aria-label="查看完整招聘档案"/);
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


const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const registry = JSON.parse(readFileSync(new URL("../catalog/report-registry.json", import.meta.url), "utf8"));
const hostedUrl = registry.hostedApplications.find((entry) => entry.id === selectId).url;
const appFunction = (name) => {
  const start = appSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing production function ${name}`);
  const end = appSource.indexOf("\n}", start);
  assert.ok(end >= 0);
  return appSource.slice(start, end + 2);
};

test("only an exactly registered owner-private hosted application opens outside the reader", () => {
  const calls = [], visits = [];
  const context = vm.createContext({
    reportRegistry: registry, URL, localStorage: {},
    rememberPersonalVisit: (_storage, id) => visits.push(id),
    showToast: () => {}, localHtmlUrl: () => "", window: {
      location: { href: "https://clairku.github.io/clair-ai-studio/" },
      open: (...args) => { calls.push(args); return {}; },
    },
  });
  vm.runInContext(["registeredHostedApplication", "openHostedApplication", "openReportInBrowser"].map(appFunction).join("\n"), context);
  const hosted = { id: selectId, url: hostedUrl };
  context.report = hosted;
  assert.equal(vm.runInContext("openHostedApplication(report)", context), true);
  assert.deepEqual(calls, [[hosted.url, "_blank", "noopener,noreferrer"]]);
  assert.deepEqual(visits, [selectId]);
  for (const record of [
    { ...hosted, id: "unregistered-id" },
    { ...hosted, url: "https://other.clairku.chatgpt.site" },
    { ...hosted, url: hosted.url + "/extra" },
    { ...hosted, url: hosted.url + "?next=another" },
    { ...hosted, url: hosted.url + "/" },
    { id: "ordinary-report", url: "https://clairku.github.io/clair-ai-studio/reports/example/" },
  ]) {
    context.report = record;
    assert.equal(vm.runInContext("openHostedApplication(report)", context), false);
  }
  context.reportRegistry = { hostedApplications: [{ ...hosted, access: "public" }] };
  context.report = hosted;
  assert.equal(vm.runInContext("openHostedApplication(report)", context), false);
  assert.equal(calls.length, 1, "ordinary reports retain their existing in-workbench reader");
});

test("the shared open action hands hosted apps to the browser before creating an iframe reader", () => {
  assert.match(appSource, /import reportRegistry from "\.\.\/catalog\/report-registry\.json"/);
  const start = appSource.indexOf('} else if (action === "open") {');
  const end = appSource.indexOf('} else if (action === "preview-saved-file"', start);
  const action = appSource.slice(start, end);
  assert.ok(action.indexOf("openHostedApplication(") < action.indexOf("readerId = itemId"));
  assert.match(action, /if \(openHostedApplication\(state\.reports\.find\(\(report\) => report\.id === itemId\)\)\) return;/);
  const markup = personalLaunchpadMarkup({ reports: [{ id: selectId, title: "Clair Select" }], escapeHtml, storage: storage() });
  assert.match(markup, /data-action="open" data-id="candidate-evaluator-2026-10-29"/);
});

test("the hosted-app search entry describes the cloud service without recruiting records", () => {
  const external = JSON.parse(readFileSync(new URL("../catalog/external-search-content.json", import.meta.url), "utf8"));
  const entry = external[selectId];
  assert.ok(entry.includes(hostedUrl));
  assert.match(entry, /独立云端|在线保存/);
  assert.doesNotMatch(entry, /HR|王印|王甜|候选人姓名|电话|邮箱|本机|恢复备份|浏览器保留名单/i);
});


test("hosted-site validation parses the hostname and cannot be bypassed with a query", () => {
  const validator = readFileSync(new URL("../scripts/validate-workbench.mjs", import.meta.url), "utf8");
  const start = validator.indexOf("function isChatGPTSiteUrl(");
  const end = validator.indexOf("\n}", start);
  const context = vm.createContext({ URL });
  vm.runInContext(validator.slice(start, end + 2), context);
  for (const url of ["https://clair-select.clairku.chatgpt.site", "https://unknown.chatgpt.site?return_to=somewhere", "https://unknown.chatgpt.site/path#section"]) {
    context.value = url;
    assert.equal(vm.runInContext("isChatGPTSiteUrl(value)", context), true);
  }
  context.value = "https://chatgpt.site.evil.invalid";
  assert.equal(vm.runInContext("isChatGPTSiteUrl(value)", context), false);
});

