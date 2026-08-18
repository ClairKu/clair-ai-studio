/**
 * 和公网中继 Worker 说话的那一端（本机 agent 用）。
 * 所有写操作都要 PAIN_OFF_AGENT_TOKEN；公网页面拿不到这个 token。
 */

const TIMEOUT_MS = 15000;

function config() {
  const base = process.env.PAIN_OFF_WORKER_URL;
  const token = process.env.PAIN_OFF_AGENT_TOKEN;
  if (!base) throw new Error("未配置 PAIN_OFF_WORKER_URL");
  if (!token) throw new Error("未配置 PAIN_OFF_AGENT_TOKEN");
  return { base: base.replace(/\/$/, ""), token };
}

export function workerConfigured() {
  return Boolean(process.env.PAIN_OFF_WORKER_URL && process.env.PAIN_OFF_AGENT_TOKEN);
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
  await call("/snapshot", { method: "PUT", body: JSON.stringify(snapshot) });
  return { url: `${config().base}/snapshot` };
}

/** 领一个公网排队的刷新请求；没有就返回 null。 */
export async function claimJob() {
  const result = await call("/jobs/next", { method: "POST" });
  return result.job || null;
}

/** 回报某个 job 的结果。 */
export async function completeJob(jobId, { status, summary, delta, snapshot }) {
  return call(`/jobs/${encodeURIComponent(jobId)}/result`, {
    method: "POST",
    body: JSON.stringify({ status, summary, delta, snapshot }),
  });
}
