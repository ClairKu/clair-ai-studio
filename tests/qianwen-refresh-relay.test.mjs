import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker from "../relay/src/index.js";
import { validateQianwenDashboardData } from "../scripts/qianwen-dashboard-data-validator.mjs";

const ORIGIN = "https://clairku.github.io";
const PASSWORD = "test-password";
const AGENT_TOKEN = "test-agent-token";
const DASHBOARD = "qianwen-user-acquisition";
const snapshot = JSON.parse(await readFile(new URL("../public/reports/qianwen-user-acquisition-dashboard/data/latest.json", import.meta.url), "utf8"));

/** 够用的 KV 替身：支持 expirationTtl，行为上与 Workers KV 一致。 */
function makeKV() {
  const store = new Map();
  return {
    async get(key, type) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expires && Date.now() > entry.expires) { store.delete(key); return null; }
      return type === "json" ? JSON.parse(entry.value) : entry.value;
    },
    async put(key, value, options = {}) {
      store.set(key, { value, expires: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : 0 });
    },
    async delete(key) { store.delete(key); },
  };
}

const makeEnv = () => ({ RELAY: makeKV(), DASHBOARD_PASSWORD: PASSWORD, AGENT_TOKEN });

async function call(env, method, path, { body, origin, token, ip = "1.2.3.4" } = {}) {
  const headers = { "cf-connecting-ip": ip };
  if (origin) headers.origin = origin;
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await worker.fetch(new Request(`https://relay.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  return { status: response.status, payload: await response.json().catch(() => ({})), headers: response.headers };
}

const refresh = (env, password, extra) => call(env, "POST", "/refresh", { body: { dashboard: DASHBOARD, password }, origin: ORIGIN, ...extra });
const beat = (env) => call(env, "POST", "/agent/heartbeat", { body: { dashboard: DASHBOARD }, token: AGENT_TOKEN });
const claim = (env) => call(env, "POST", "/agent/claim", { body: { dashboard: DASHBOARD }, token: AGENT_TOKEN });
const complete = (env, jobId, data = snapshot) => call(env, "POST", "/agent/complete", { body: { job_id: jobId, data }, token: AGENT_TOKEN });

test("口令不对就不建任务", async () => {
  const env = makeEnv();
  const { status, payload } = await refresh(env, "wrong");
  assert.equal(status, 401);
  assert.equal(payload.error, "bad_password");
});

test("同一 IP 连错 5 次后被节流，且此后正确口令也进不去", async () => {
  const env = makeEnv();
  for (let i = 0; i < 5; i += 1) assert.equal((await refresh(env, "wrong")).status, 401);
  assert.equal((await refresh(env, "wrong")).status, 429);
  // 口令很短，穷举防护主要就靠这条：节流期内连对的口令也挡住。
  assert.equal((await refresh(env, PASSWORD)).status, 429);
  // 节流按 IP 计
  assert.equal((await refresh(env, "wrong", { ip: "5.6.7.8" })).status, 401);
});

test("本机侧离线时如实告知，不建任务", async () => {
  const env = makeEnv();
  const { status, payload } = await refresh(env, PASSWORD);
  assert.equal(status, 503);
  assert.equal(payload.error, "agent_offline");
});

test("完整链路：建任务 → 领取 → 回传 → 访客拿到数据", async () => {
  const env = makeEnv();
  await beat(env);
  const started = await refresh(env, PASSWORD);
  assert.equal(started.status, 202);
  assert.equal(started.payload.status, "queued");

  const claimed = await claim(env);
  assert.equal(claimed.payload.job.job_id, started.payload.job_id);
  assert.equal(claimed.payload.job.status, "running");
  assert.equal((await claim(env)).payload.job, null, "同一个任务不该被重复派发");

  const running = await call(env, "GET", `/status?job=${started.payload.job_id}`, { origin: ORIGIN });
  assert.equal(running.payload.data, undefined, "未完成时不下发数据");

  await complete(env, started.payload.job_id);
  const done = await call(env, "GET", `/status?job=${started.payload.job_id}`, { origin: ORIGIN });
  assert.equal(done.payload.status, "completed");
  assert.equal(done.payload.data.metrics.bound_accounts, snapshot.metrics.bound_accounts);
});

test("并发点击合并到同一个任务，冷却期内复用结果", async () => {
  const env = makeEnv();
  await beat(env);
  const first = await refresh(env, PASSWORD);
  assert.equal((await refresh(env, PASSWORD)).payload.job_id, first.payload.job_id);

  await claim(env);
  await complete(env, first.payload.job_id);
  const reused = await refresh(env, PASSWORD);
  assert.equal(reused.payload.reused, true);
  assert.equal(reused.payload.status, "completed");
  assert.ok(reused.payload.data, "复用时直接带回数据，不再打扰本体");
});

test("每小时任务闸门到顶后拒绝新任务", async () => {
  const env = makeEnv();
  await beat(env);
  for (let i = 0; i < 6; i += 1) {
    const started = await refresh(env, PASSWORD);
    assert.equal(started.status, 202, `第 ${i + 1} 次应建任务成功`);
    await claim(env);
    await call(env, "POST", "/agent/fail", { body: { job_id: started.payload.job_id, message: "测试" }, token: AGENT_TOKEN });
  }
  const blocked = await refresh(env, PASSWORD);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.payload.error, "rate_limited");
});

test("agent 端点必须带令牌，且拒收非本看板快照", async () => {
  const env = makeEnv();
  assert.equal((await call(env, "POST", "/agent/claim", { body: {} })).status, 401);
  assert.equal((await call(env, "POST", "/agent/claim", { body: {}, token: "wrong" })).status, 401);

  await beat(env);
  const started = await refresh(env, PASSWORD);
  await claim(env);
  assert.equal((await complete(env, started.payload.job_id, { schema_version: "something-else" })).status, 400);
});

test("CORS 只放行看板所在站点", async () => {
  const env = makeEnv();
  const allowed = await call(env, "OPTIONS", "/refresh", { origin: ORIGIN });
  assert.equal(allowed.headers.get("access-control-allow-origin"), ORIGIN);
  const denied = await call(env, "OPTIONS", "/refresh", { origin: "https://evil.example" });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("中继回传的快照结构与构建期校验一致", () => {
  // 中继只做浅校验，真正的口径把关在 agent 落盘前；这里确认两端认的是同一份快照。
  assert.doesNotThrow(() => validateQianwenDashboardData(snapshot));
});

test("看板前端不再依赖本机守护进程，也不保存口令", async () => {
  const app = await readFile(new URL("../public/reports/qianwen-user-acquisition-dashboard/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/reports/qianwen-user-acquisition-dashboard/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(app, /127\.0\.0\.1|LOCAL_REFRESH_BASE|startLocalRefresh/);
  assert.doesNotMatch(app, /sessionStorage|localStorage\.setItem\("clair-qianwen-refresh/);
  assert.match(app, /RELAY_BASE/);
  assert.match(app, /requestRelayRefresh/);
  assert.match(html, /id="refresh-dialog"/);
  assert.match(html, /id="refresh-password"/);
});
