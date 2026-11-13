import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import publicConfig from "../catalog/standalone-public-entries.json" with { type: "json" };
import { reportAccessStatus } from "../src/report-access-settings.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const entry = "reports/yingmi-ai-capability-catalog-2026-11-10/";
const publicPath = `${entry}index.html`;
const url = (path) => `https://clairku.github.io/clair-ai-studio/${path}`;
const gate = '<script data-clair-access-gate data-clair-access-scope="report" src="../../access-gate.js"></script>';
const page = (title, body = "", head = "") => `<!doctype html><html><head><title>${title}</title>${head}</head><body>${body}</body></html>`;
const gateCount = (html) => (html.match(/data-clair-access-gate/g) || []).length;

function fixture(t, immutable = []) {
  const directory = mkdtempSync(join(tmpdir(), "clair-public-catalog-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const write = (path, contents) => {
    const target = join(directory, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  write("access-gate.js", "/* unchanged shared access gate fixture */");
  write("report-access.json", JSON.stringify({ defaultLocked: true, immutableLockedEntries: immutable }));
  return {
    directory, write,
    read: (path) => readFileSync(join(directory, path), "utf8"),
    inject: () => spawnSync(process.execPath, [join(root, "scripts/inject-site-access-gate.mjs"), directory], {
      cwd: root, encoding: "utf8",
    }),
  };
}

test("the standalone-public allowlist contains only explicitly public deliverables", () => {
  assert.deepEqual(publicConfig.entries, [
    publicPath,
    "reports/financial-advisor-100-questions-2026-11-11/index.html",
    "reports/advisor-console-demo-2026-11-11/index.html",
    "reports/yingmi-108-tool-prompts-2026-11-11/index.html",
    "reports/pension-y-a-fund-comparison-2026-11-12/index.html",
  ]);
});

test("the synthetic advisor console is public only at its exact entry", () => {
  const entry = "reports/advisor-console-demo-2026-11-11/";
  assert.equal(reportAccessStatus({ url: url(entry) }, { defaultLocked: true, lockedEntries: [entry] }).locked, false);
  for (const path of [`${entry}details.html`, "reports/advisor-console-demo-2026-11-11-copy/"]) {
    const state = reportAccessStatus({ url: url(path) }, { defaultLocked: true });
    assert.equal(state.managed, true);
    assert.equal(state.locked, true);
  }
});

test("a stale live lock cannot present a password toggle for this unencrypted public deliverable", () => {
  const state = reportAccessStatus({ url: url(entry) }, { defaultLocked: true, lockedEntries: [entry] });
  assert.equal(state.entry, entry);
  assert.equal(state.managed, false);
  assert.equal(state.locked, false);
  assert.equal(state.loaded, true);
  assert.equal(reportAccessStatus({ url: url(`${entry}index.html?v=fresh`) }, { defaultLocked: true }).locked, false);
});

test("nearby paths and other protected reports keep the existing management policy", () => {
  for (const path of [
    "reports/yingmi-ai-capability-catalog-2026-11-10-copy/",
    "reports/yingmi-ai-capability-catalog-2026-11-11/",
    `${entry}details.html`,
    "reports/customer-dashboard/",
  ]) {
    const state = reportAccessStatus({ url: url(path) }, { defaultLocked: true });
    assert.equal(state.managed, true, path);
    assert.equal(state.locked, true, path);
  }
});

test("immutable protection always takes precedence over a public entry", () => {
  const state = reportAccessStatus({ url: url(entry) }, {
    defaultLocked: true, unlockedEntries: [entry], immutableLockedEntries: [entry],
  });
  assert.equal(state.immutable, true);
  assert.equal(state.managed, true);
  assert.equal(state.locked, true);
});

test("the build removes only the exact catalog gate and preserves protected neighbors across repeated builds", (t) => {
  const f = fixture(t);
  f.write(publicPath, page("Public catalog", "<main>108 capabilities</main>", gate));
  const protectedPaths = [
    "reports/ordinary-protected/index.html",
    "reports/yingmi-ai-capability-catalog-2026-11-10-copy/index.html",
    "reports/yingmi-ai-capability-catalog-2026-11-11/index.html",
    `${entry}details.html`,
    "index.html",
  ];
  for (const path of protectedPaths) f.write(path, page("Protected neighbor"));
  for (let pass = 0; pass < 2; pass += 1) {
    const result = f.inject();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(gateCount(f.read(publicPath)), 0);
    assert(f.read(publicPath).includes("108 capabilities"));
    for (const path of protectedPaths) assert.equal(gateCount(f.read(path)), 1, path);
  }
  assert(f.read("index.html").includes('data-clair-access-scope="workspace"'));
  assert(f.read(protectedPaths[0]).includes('data-clair-access-scope="report"'));
});

test("the build rejects an immutable/public collision before modifying the protected page", (t) => {
  const f = fixture(t, [entry]);
  f.write(publicPath, page("Protected catalog", "", gate));
  const result = f.inject();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid standalone public report entry/);
  assert.equal(gateCount(f.read(publicPath)), 1);
});

test("the build rejects password or encrypted content in the public exception", (t) => {
  const f = fixture(t);
  f.write(publicPath, page("Unexpected password", '<input type="password">', gate));
  const result = f.inject();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Encrypted or password-protected public report/);
  assert.equal(gateCount(f.read(publicPath)), 1);
});
