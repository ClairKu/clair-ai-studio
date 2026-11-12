import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const helperSource = readFileSync(new URL("../src/clair-select-access.js", import.meta.url), "utf8")
  .replace(/^import .*\n/, "").replace("export async function", "async function");
const entryUrl = "https://clair-select.pages.dev/studio-entry";
const tokenKey = "clair-ai-studio-access-admin-token-v1";
const expiresKey = "clair-ai-studio-access-admin-expires-v1";
const workspaceKey = "clair-ai-studio-access-v4";
const validPayload = () => ({ entryUrl, ticket: "e30." + "a".repeat(43), expiresAt: Date.now() + 60000 });

function setup({ hasToken = true, endpoint = "https://clair-studio-access.pages.dev/v1", status = 200, payload = validPayload() } = {}) {
  const stored = new Map([[tokenKey, "synthetic-studio-token"], [expiresKey, String(Date.now() + 600000)], [workspaceKey, "existing-marker"], ["unrelated-report", "keep"]]);
  const calls = [];
  const context = vm.createContext({
    AbortController, setTimeout, clearTimeout, Date, Error, Number,
    sessionStorage: { getItem: (key) => stored.get(key), removeItem: (key) => stored.delete(key) },
    reportAccessConnectionState: () => ({ hasToken }),
    loadReportAccessConfig: async () => ({ stateEndpoint: endpoint }),
    fetch: async (url, init) => { calls.push({ url, init }); return { status, ok: status >= 200 && status < 300, json: async () => payload }; },
  });
  vm.runInContext(helperSource, context);
  return { context, calls, stored, run: () => vm.runInContext("issueClairSelectEntry()", context) };
}

test("the existing Studio server bearer only reaches its original service and returns a fixed signed entry", async () => {
  const f = setup();
  const result = await f.run();
  assert.equal(result.entryUrl, entryUrl);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "https://clair-studio-access.pages.dev/v1/apps/clair-select/entry");
  assert.equal(f.calls[0].init.headers.Authorization, "Bearer synthetic-studio-token");
  assert.equal(f.calls[0].init.body, "{}");
  assert.equal(f.calls[0].init.credentials, "omit");
  assert.equal(f.stored.get(workspaceKey), "existing-marker", "valid old workspace sessions remain intact");
});

test("missing or server-expired sessions return to the existing Studio gate without preserving a bypass marker", async () => {
  for (const options of [{ hasToken: false }, { status: 401, payload: { error: "admin_session_required" } }]) {
    const f = setup(options);
    await assert.rejects(f.run(), (error) => error.code === "studio_session_required");
    for (const key of [workspaceKey, tokenKey, expiresKey]) assert.equal(f.stored.has(key), false);
    assert.equal(f.stored.get("unrelated-report"), "keep");
    assert.equal(f.calls.length, options.hasToken === false ? 0 : 1);
  }
});

test("an altered policy endpoint never receives the Studio bearer", async () => {
  const f = setup({ endpoint: "https://malicious.invalid/v1" });
  await assert.rejects(f.run());
  assert.equal(f.calls.length, 0);
});

test("external targets, malformed assertions and invalid lifetimes cannot navigate the browser", async () => {
  for (const patch of [
    { entryUrl: "https://other.invalid/studio-entry" },
    { ticket: "not-signed" },
    { ticket: "x".repeat(2049) },
    { expiresAt: Date.now() - 1 },
    { expiresAt: Date.now() + 120000 },
    { expiresAt: String(Date.now() + 60000) },
  ]) {
    const f = setup({ payload: { ...validPayload(), ...patch } });
    await assert.rejects(f.run());
  }
});

test("service failures do not invent a credential or clear a still-valid workspace login", async () => {
  const f = setup({ status: 503, payload: { message: "稍后重试" } });
  await assert.rejects(f.run(), /稍后重试/);
  assert.equal(f.stored.get(workspaceKey), "existing-marker");
});
