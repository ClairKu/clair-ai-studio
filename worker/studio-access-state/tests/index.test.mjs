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
