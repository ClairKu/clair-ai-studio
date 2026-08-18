/**
 * 痛点消消乐 · 公网中继
 *
 * 公网页面进不了内网，内网 agent 出得来。所以中继只做两件事：
 *   1. 存一份最新快照，任何人可读（GET /snapshot）
 *   2. 收公网的刷新请求排队，等内网 agent 来领、来交作业
 *
 * 口令只在这里校验，页面上不存任何密钥。取数 token 也只在内网 agent 手里。
 *
 * 需要的 KV：PAIN_OFF（wrangler.toml 里绑定）
 * 需要的 secret：PULSE_PASSCODE（公网口令）、AGENT_TOKEN（内网 agent 凭据）
 */

interface Env {
  PAIN_OFF: KVNamespace;
  PULSE_PASSCODE: string;
  AGENT_TOKEN: string;
  ALLOWED_ORIGINS?: string;
}

type JobStatus = "pending" | "running" | "updated" | "no_change" | "failed";

interface Job {
  id: string;
  status: JobStatus;
  reason: string;
  created_at: string;
  claimed_at?: string;
  finished_at?: string;
  summary?: string;
  delta?: unknown;
}

const SNAPSHOT_KEY = "snapshot:latest";
const JOB_PREFIX = "job:";
const PENDING_KEY = "job:pending";
const JOB_TTL_SECONDS = 60 * 60 * 6;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 6;

const DEFAULT_ORIGINS = ["https://clairku.github.io"];

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? DEFAULT_ORIGINS);
  const origin = request.headers.get("Origin") ?? "";
  const allow = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Pulse-Passcode",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(request, env),
    },
  });
}

/** 定长比较，避免用响应时间猜口令。 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAgent(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return Boolean(token) && safeEqual(token, env.AGENT_TOKEN);
}

/** 同一个 IP 每分钟最多 RATE_LIMIT_MAX 次触发，挡住拿口令暴力刷的。 */
async function rateLimited(request: Request, env: Env): Promise<boolean> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const bucket = `rate:${ip}:${Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000))}`;
  const count = Number((await env.PAIN_OFF.get(bucket)) ?? "0") + 1;
  await env.PAIN_OFF.put(bucket, String(count), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2 });
  return count > RATE_LIMIT_MAX;
}

async function readJob(env: Env, id: string): Promise<Job | null> {
  return env.PAIN_OFF.get<Job>(`${JOB_PREFIX}${id}`, "json");
}

async function writeJob(env: Env, job: Job): Promise<void> {
  await env.PAIN_OFF.put(`${JOB_PREFIX}${job.id}`, JSON.stringify(job), { expirationTtl: JOB_TTL_SECONDS });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // --- 公开只读：最新快照 ---
    if (path === "/snapshot" && request.method === "GET") {
      const snapshot = await env.PAIN_OFF.get(SNAPSHOT_KEY, "json");
      if (!snapshot) return json(request, env, { error: "no_snapshot" }, 404);
      return json(request, env, snapshot);
    }

    // --- 内网 agent：覆盖快照 ---
    if (path === "/snapshot" && request.method === "PUT") {
      if (!isAgent(request, env)) return json(request, env, { error: "unauthorized" }, 401);
      const snapshot = await request.json();
      await env.PAIN_OFF.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
      return json(request, env, { ok: true });
    }

    // --- 公网：排一个刷新请求（要口令）---
    if (path === "/jobs" && request.method === "POST") {
      if (await rateLimited(request, env)) {
        return json(request, env, { error: "rate_limited", message: "触发太频繁，稍后再试。" }, 429);
      }
      const passcode = request.headers.get("X-Pulse-Passcode") ?? "";
      if (!safeEqual(passcode, env.PULSE_PASSCODE)) {
        return json(request, env, { error: "bad_passcode", message: "口令不对。" }, 403);
      }

      // 已经有人在排队了就复用同一个 job，别把内网 agent 淹了。
      const pendingId = await env.PAIN_OFF.get(PENDING_KEY);
      if (pendingId) {
        const existing = await readJob(env, pendingId);
        if (existing && (existing.status === "pending" || existing.status === "running")) {
          return json(request, env, { job: existing, deduped: true });
        }
      }

      const body = (await request.json().catch(() => ({}))) as { reason?: string };
      const job: Job = {
        id: crypto.randomUUID(),
        status: "pending",
        reason: String(body.reason ?? "公网手动触发").slice(0, 120),
        created_at: new Date().toISOString(),
      };
      await writeJob(env, job);
      await env.PAIN_OFF.put(PENDING_KEY, job.id, { expirationTtl: JOB_TTL_SECONDS });
      return json(request, env, { job });
    }

    // --- 内网 agent：领活 ---
    if (path === "/jobs/next" && request.method === "POST") {
      if (!isAgent(request, env)) return json(request, env, { error: "unauthorized" }, 401);
      const pendingId = await env.PAIN_OFF.get(PENDING_KEY);
      if (!pendingId) return json(request, env, { job: null });
      const job = await readJob(env, pendingId);
      if (!job || job.status !== "pending") {
        await env.PAIN_OFF.delete(PENDING_KEY);
        return json(request, env, { job: null });
      }
      job.status = "running";
      job.claimed_at = new Date().toISOString();
      await writeJob(env, job);
      return json(request, env, { job });
    }

    // --- 内网 agent：交作业 ---
    const resultMatch = path.match(/^\/jobs\/([^/]+)\/result$/);
    if (resultMatch && request.method === "POST") {
      if (!isAgent(request, env)) return json(request, env, { error: "unauthorized" }, 401);
      const job = await readJob(env, resultMatch[1]);
      if (!job) return json(request, env, { error: "unknown_job" }, 404);
      const body = (await request.json()) as { status: JobStatus; summary?: string; delta?: unknown; snapshot?: unknown };
      job.status = body.status;
      job.summary = body.summary;
      job.delta = body.delta;
      job.finished_at = new Date().toISOString();
      await writeJob(env, job);
      if (body.snapshot) await env.PAIN_OFF.put(SNAPSHOT_KEY, JSON.stringify(body.snapshot));
      const pendingId = await env.PAIN_OFF.get(PENDING_KEY);
      if (pendingId === job.id) await env.PAIN_OFF.delete(PENDING_KEY);
      return json(request, env, { ok: true });
    }

    // --- 公网：查刷新进度 ---
    const jobMatch = path.match(/^\/jobs\/([^/]+)$/);
    if (jobMatch && request.method === "GET") {
      const job = await readJob(env, jobMatch[1]);
      if (!job) return json(request, env, { error: "unknown_job" }, 404);
      return json(request, env, { job });
    }

    if (path === "/health") {
      const snapshot = await env.PAIN_OFF.get<{ meta?: { generated_at?: string } }>(SNAPSHOT_KEY, "json");
      return json(request, env, {
        ok: true,
        has_snapshot: Boolean(snapshot),
        snapshot_generated_at: snapshot?.meta?.generated_at ?? null,
      });
    }

    return json(request, env, { error: "not_found" }, 404);
  },
};
