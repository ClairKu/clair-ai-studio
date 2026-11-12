import test from "node:test";
import assert from "node:assert/strict";

import worker, {
  BASE_POLICY,
  accessStatus,
  normalizePolicy,
  validEntry,
} from "../src/index.js";

class MemoryKV {
  constructor() {
    this.values = new Map();
  }

  async get(key, type) {
    const value = this.values.get(key);
    if (value === undefined) return null;
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.values.set(key, String(value));
  }
}

const origin = "https://clairku.github.io";

function request(path, init = {}) {
  return new Request(`https://studio-access-state.example${path}`, {
    ...init,
    headers: { Origin: origin, ...(init.headers || {}) },
  });
}

function env() {
  return {
    STUDIO_ACCESS: new MemoryKV(),
    STUDIO_ADMIN_PASSCODE: "workspace-secret",
    ALLOWED_ORIGINS: origin,
  };
}

test("normalizes entries, keeps encrypted reports immutable, and fails closed", () => {
  const policy = normalizePolicy({
    defaultLocked: false,
    unlockedEntries: ["/reports/public/", BASE_POLICY.immutableLockedEntries[0]],
  });
  assert.equal(policy.defaultLocked, false);
  assert.deepEqual(policy.unlockedEntries, ["reports/public/"]);
  assert.equal(accessStatus(policy, BASE_POLICY.immutableLockedEntries[0]).locked, true);
  assert.equal(accessStatus(policy, "").locked, true);
  assert.equal(validEntry("../secret"), "");
});

test("exposes the current public state without authentication", async () => {
  const runtime = env();
  for (const entry of BASE_POLICY.unlockedEntries) {
    const response = await worker.fetch(request(
      `/v1/report-access?entry=${encodeURIComponent(entry)}`,
    ), runtime);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.status.locked, false, entry);
    assert.equal(payload.config.defaultLocked, true);
  }
});

test("exchanges the workspace passcode for a short-lived admin session", async () => {
  const runtime = env();
  const denied = await worker.fetch(request("/v1/session", {
    method: "POST",
    headers: { "X-Studio-Passcode": "wrong" },
  }), runtime);
  assert.equal(denied.status, 403);

  const granted = await worker.fetch(request("/v1/session", {
    method: "POST",
    headers: { "X-Studio-Passcode": "workspace-secret" },
  }), runtime);
  assert.equal(granted.status, 200);
  const payload = await granted.json();
  assert.ok(payload.token.length >= 40);
  assert.ok(payload.expiresAt > Date.now());
});

test("one authenticated switch updates live state without a site deployment", async () => {
  const runtime = env();
  const sessionResponse = await worker.fetch(request("/v1/session", {
    method: "POST",
    headers: { "X-Studio-Passcode": "workspace-secret" },
  }), runtime);
  const { token } = await sessionResponse.json();

  const update = await worker.fetch(request("/v1/report-access", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ entry: "reports/instant-toggle/", locked: false }),
  }), runtime);
  assert.equal(update.status, 200);
  assert.equal((await update.json()).status.locked, false);

  const read = await worker.fetch(request(
    "/v1/report-access?entry=reports%2Finstant-toggle%2F",
  ), runtime);
  assert.equal((await read.json()).status.locked, false);
});

test("encrypted reports cannot be unlocked even with an admin session", async () => {
  const runtime = env();
  const sessionResponse = await worker.fetch(request("/v1/session", {
    method: "POST",
    headers: { "X-Studio-Passcode": "workspace-secret" },
  }), runtime);
  const { token } = await sessionResponse.json();
  const response = await worker.fetch(request("/v1/report-access", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ entry: BASE_POLICY.immutableLockedEntries[0], locked: false }),
  }), runtime);
  assert.equal(response.status, 409);
});

const selectPath = "/v1/apps/clair-select/entry";
const selectKey = "synthetic-handoff-key-" + "a".repeat(40);

async function studioSession(runtime) {
  const response = await worker.fetch(request("/v1/session", {
    method: "POST", headers: { "X-Studio-Passcode": "workspace-secret" },
  }), runtime);
  assert.equal(response.status, 200);
  return response.json();
}

function entryRequest(token, init = {}) {
  return request(selectPath, {
    method: "POST", ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    body: init.body || "{}",
  });
}

test("the original unversioned Studio owner session issues a fixed short-lived signed recruitment handoff", async () => {
  const runtime = { ...env(), SELECT_SSO_SIGNING_KEY: selectKey };
  const { token } = await studioSession(runtime);
  const before = Date.now();
  const response = await worker.fetch(entryRequest(token, {
    body: JSON.stringify({ aud: "other-app", sub: "other-owner", exp: 9999999999, entryUrl: "https://other.invalid" }),
  }), runtime);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0");
  const result = await response.json();
  assert.equal(result.entryUrl, "https://clair-select.pages.dev/studio-entry");
  const [payload, signature] = result.ticket.split(".");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(selectKey), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  assert.equal(await crypto.subtle.verify("HMAC", key, Buffer.from(signature, "base64url"), new TextEncoder().encode(payload)), true);
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.deepEqual(Object.keys(claims).sort(), ["aud", "exp", "iat", "iss", "jti", "sub", "v"]);
  assert.equal(claims.v, 1);
  assert.equal(claims.iss, "https://clair-studio-access.pages.dev/v1");
  assert.equal(claims.aud, "clair-select");
  assert.equal(claims.sub, "portable-private-owner-clair");
  assert.equal(claims.exp - claims.iat, 60);
  assert.match(claims.jti, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(result.expiresAt, claims.exp * 1000);
  assert.ok(result.expiresAt > before && result.expiresAt <= before + 60000);
  assert.equal(result.ticket.includes(token), false);
  assert.equal(JSON.stringify(result).includes("workspace-secret"), false);
  for (const value of runtime.STUDIO_ACCESS.values.values()) assert.equal(value.includes("authVersion"), false);
  const next = await (await worker.fetch(entryRequest(token), runtime)).json();
  assert.notEqual(next.ticket, result.ticket);
});

test("a query, forged referrer, missing bearer or invented bearer cannot obtain a recruitment handoff", async () => {
  const runtime = { ...env(), SELECT_SSO_SIGNING_KEY: selectKey };
  for (const attempted of [
    request(selectPath, { method: "POST", headers: { Referer: "https://clairku.github.io/clair-ai-studio/" } }),
    request(selectPath + "?clair-workbench-reader=1&authenticated=true", { method: "POST" }),
    entryRequest("invented"),
  ]) {
    const response = await worker.fetch(attempted, runtime);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).ticket, undefined);
  }
});

test("expired Studio sessions and unapproved origins fail without changing report policy", async () => {
  const runtime = { ...env(), SELECT_SSO_SIGNING_KEY: selectKey };
  const { token } = await studioSession(runtime);
  const foreign = await worker.fetch(entryRequest(token, { headers: { Origin: "https://foreign.invalid" } }), runtime);
  assert.equal(foreign.status, 403);
  for (const [key, value] of runtime.STUDIO_ACCESS.values) {
    if (key.startsWith("studio:admin-session:")) runtime.STUDIO_ACCESS.values.set(key, JSON.stringify({ ...JSON.parse(value), expiresAt: Date.now() - 1 }));
  }
  assert.equal((await worker.fetch(entryRequest(token), runtime)).status, 401);
  assert.equal(runtime.STUDIO_ACCESS.values.has("studio:report-access:v1"), false);
});

test("an absent handoff signing key fails closed and the original workspace session still works", async () => {
  const runtime = env();
  const { token } = await studioSession(runtime);
  assert.equal((await worker.fetch(entryRequest(token), runtime)).status, 503);
  const update = await worker.fetch(request("/v1/report-access", {
    method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ entry: "reports/still-supported/", locked: false }),
  }), runtime);
  assert.equal(update.status, 200);
});

test("recruitment handoff bursts have their own bounded rate bucket", async () => {
  const runtime = { ...env(), SELECT_SSO_SIGNING_KEY: selectKey };
  const { token } = await studioSession(runtime);
  for (let index = 0; index < 40; index += 1) assert.equal((await worker.fetch(entryRequest(token), runtime)).status, 200);
  assert.equal((await worker.fetch(entryRequest(token), runtime)).status, 429);
  assert.equal((await worker.fetch(request("/v1/report-access"), runtime)).status, 200);
});
