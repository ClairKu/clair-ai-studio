/**
 * 和公网中继 Worker 说话的那一端（本机 agent 用）。
 * 所有写操作都要 PAIN_OFF_AGENT_TOKEN；公网页面拿不到这个 token。
 *
 * 部分内网会阻断 workers.dev。此时 agent 可通过 Wrangler 直连同一 KV；
 * 公网页面仍走 Worker，不受影响。
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const TIMEOUT_MS = 15000;
const JOB_TTL_SECONDS = 60 * 60 * 6;
const SNAPSHOT_KEY = "snapshot:latest";
const PENDING_KEY = "job:pending";
const JOB_PREFIX = "job:";
const execFileAsync = promisify(execFile);

function config() {
  const base = process.env.PAIN_OFF_WORKER_URL;
  const token = process.env.PAIN_OFF_AGENT_TOKEN;
  if (!base) throw new Error("未配置 PAIN_OFF_WORKER_URL");
  if (!token) throw new Error("未配置 PAIN_OFF_AGENT_TOKEN");
  return { base: base.replace(/\/$/, ""), token };
}

export function workerConfigured() {
  return Boolean(
    (process.env.PAIN_OFF_WORKER_URL && process.env.PAIN_OFF_AGENT_TOKEN)
    || (process.env.PAIN_OFF_KV_NAMESPACE_ID && process.env.PAIN_OFF_WRANGLER),
  );
}

function kvConfig() {
  const namespace = process.env.PAIN_OFF_KV_NAMESPACE_ID;
  const wrangler = process.env.PAIN_OFF_WRANGLER;
  return namespace && wrangler ? { namespace, wrangler } : null;
}

async function kv(args) {
  const direct = kvConfig();
  if (!direct) throw new Error("未配置 PAIN_OFF_KV_NAMESPACE_ID / PAIN_OFF_WRANGLER");
  const { stdout } = await execFileAsync(direct.wrangler, ["kv", "key", ...args, "--namespace-id", direct.namespace, "--remote"], {
    timeout: TIMEOUT_MS,
    maxBuffer: 2 * 1024 * 1024,
  });
  return stdout.trim();
}

async function kvGet(key) {
  try {
    return await kv(["get", key]);
  } catch (error) {
    if (String(error?.stderr || error?.message).includes("404")) return "";
    throw error;
  }
}

async function kvPut(key, value, ttl = null) {
  const args = ["put", key, value];
  if (ttl) args.push("--ttl", String(ttl));
  await kv(args);
}

async function kvDelete(key) {
  await kv(["delete", key]);
}

async function call(path, init = {}) {
  const { base, token } = config();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Worker HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return response.json();
}

/** 把新快照放到公网中继上，公网页面下一次拉取就能看到。 */
export async function pushToWorker(snapshot) {
  if (kvConfig()) {
    await kvPut(SNAPSHOT_KEY, JSON.stringify(snapshot));
    return { url: `${config().base}/snapshot` };
  }
  await call("/snapshot", { method: "PUT", body: JSON.stringify(snapshot) });
  return { url: `${config().base}/snapshot` };
}

/** 领一个公网排队的刷新请求；没有就返回 null。 */
export async function claimJob() {
  if (kvConfig()) {
    const pendingId = await kvGet(PENDING_KEY);
    if (!pendingId) return null;
    const raw = await kvGet(`${JOB_PREFIX}${pendingId}`);
    if (!raw) {
      await kvDelete(PENDING_KEY);
      return null;
    }
    const job = JSON.parse(raw);
    if (job.status !== "pending") return null;
    job.status = "running";
    job.claimed_at = new Date().toISOString();
    await kvPut(`${JOB_PREFIX}${job.id}`, JSON.stringify(job), JOB_TTL_SECONDS);
    return job;
  }
  const result = await call("/jobs/next", { method: "POST" });
  return result.job || null;
}

/** 回报某个 job 的结果。 */
export async function completeJob(jobId, { status, summary, delta, snapshot }) {
  if (kvConfig()) {
    const key = `${JOB_PREFIX}${jobId}`;
    const raw = await kvGet(key);
    if (!raw) throw new Error(`中继任务不存在：${jobId}`);
    const job = JSON.parse(raw);
    Object.assign(job, { status, summary, delta, finished_at: new Date().toISOString() });
    await kvPut(key, JSON.stringify(job), JOB_TTL_SECONDS);
    if (snapshot) await kvPut(SNAPSHOT_KEY, JSON.stringify(snapshot));
    if ((await kvGet(PENDING_KEY)) === jobId) await kvDelete(PENDING_KEY);
    return { ok: true };
  }
  return call(`/jobs/${encodeURIComponent(jobId)}/result`, {
    method: "POST",
    body: JSON.stringify({ status, summary, delta, snapshot }),
  });
}
