import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildRefreshPrompt,
  createRefreshService,
  isAllowedOrigin,
  sanitizeAgentResult,
} from "../scripts/qianwen-user-acquisition-refresh-server.mjs";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const REPORT = "public/reports/qianwen-user-acquisition-dashboard";
const ORIGIN = "https://clairku.github.io";
const CUTOFF = "2026-08-20T16:40:29+08:00";

test("production page triggers the private refresh service and polls publication", async () => {
  const app = await read(`${REPORT}/app.js`);
  assert.match(app, /LOCAL_REFRESH_BASE = "http:\/\/127\.0\.0\.1:43119"/);
  assert.match(app, /X-Qianwen-Action/);
  assert.match(app, /qianwen-user-acquisition-refresh\/v1/);
  assert.match(app, /waitForRefresh/);
  assert.match(app, /waitForPublishedData/);
  assert.doesNotMatch(app, /ontology\.yingmi-inc\.com/);
});

test("refresh service accepts only the production origin", () => {
  assert.equal(isAllowedOrigin(ORIGIN), true);
  assert.equal(isAllowedOrigin("https://evil.example"), false);
  assert.equal(isAllowedOrigin(undefined), false);
});

test("agent result is reduced to public progress fields", () => {
  assert.deepEqual(sanitizeAgentResult({
    status: "updated",
    summary: "已更新 https://internal.example/secret",
    data_cutoff: CUTOFF,
    metrics: { bound_accounts: 1723, new_accounts: 1318, existing_accounts: 405, secret: "x" },
    production_url: "https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/",
    token: "must-not-pass",
  }), {
    status: "updated",
    summary: "已更新",
    data_cutoff: CUTOFF,
    metrics: { bound_accounts: 1723, new_accounts: 1318, existing_accounts: 405 },
    production_url: "https://clairku.github.io/clair-ai-studio/reports/qianwen-user-acquisition-dashboard/",
  });
});

test("refresh prompt requires one real production query, privacy checks, and safe publishing", () => {
  const prompt = buildRefreshPrompt({ repo: "/repo", publishedCutoff: CUTOFF, ontologyBin: "/ontology" });
  for (const signal of ["只发起一次", "实时查询生产数据库", "k=20", "互补抑制", "临时 worktree", "禁止 force push", "轮询生产 latest.json"]) {
    assert.match(prompt, new RegExp(signal));
  }
});

test("dry-run service exposes the full trigger and status protocol", async (context) => {
  const service = createRefreshService({
    port: 0,
    env: {
      QIANWEN_REFRESH_ALLOWED_ORIGINS: ORIGIN,
      QIANWEN_REFRESH_DRY_RUN: "1",
    },
  });
  await service.start();
  context.after(() => new Promise((resolve) => service.server.close(resolve)));
  const address = service.server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const response = await fetch(`${base}/refresh`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "X-Qianwen-Action": "refresh-v1",
    },
    body: JSON.stringify({ schema: "qianwen-user-acquisition-refresh/v1", published_cutoff: CUTOFF }),
  });
  assert.equal(response.status, 202);
  const started = await response.json();
  assert.equal(started.status, "running");
  assert.ok(started.run_id);

  await new Promise((resolve) => setTimeout(resolve, 10));
  const statusResponse = await fetch(`${base}/status?run_id=${encodeURIComponent(started.run_id)}`, { headers: { Origin: ORIGIN } });
  assert.equal(statusResponse.status, 200);
  const status = await statusResponse.json();
  assert.equal(status.status, "no_change");
  assert.equal(status.data_cutoff, CUTOFF);
});

test("service rejects requests without the trusted browser origin", async (context) => {
  const service = createRefreshService({ port: 0, env: { QIANWEN_REFRESH_DRY_RUN: "1" } });
  await service.start();
  context.after(() => new Promise((resolve) => service.server.close(resolve)));
  const address = service.server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 403);
});
