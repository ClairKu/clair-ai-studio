/**
 * clair-refresh-relay —— 看板「更新数据」中继
 *
 * 存在的理由：盈米本体是内网服务，GitHub Pages 上的静态看板、以及任何公网机器都查不到它。
 * 能查数的只有「挂着 VPN + 本体登录态」的本机 agent。中继就是两者之间那块公网跳板：
 *
 *   公网访客 --口令--> 中继(建任务) <--出站轮询-- 本机 agent --> 盈米本体
 *                        \__ 访客轮询状态 __/        \__ 查完把快照回传 __/
 *
 * 中继自己不碰任何内网资源，也不持有本体凭证；本机 agent 只发出站请求，不用开放端口。
 * 口令只在这里校验（页面上做校验等于没做），本体查询有成本，所以还要挡住重复触发和暴力猜测。
 */

const DASHBOARDS = new Set(["qianwen-user-acquisition"]);
const ALLOWED_ORIGINS = new Set(["https://clairku.github.io"]);

// 本机 agent 每 20s 心跳一次；超过这个时间没心跳就认为更新服务离线。
const HEARTBEAT_TTL_SECONDS = 90;
// 一次成功查询后的冷却期：期内所有人点更新都直接拿这份结果，不再打扰本体。
const RESULT_COOLDOWN_SECONDS = 600;
// 单个任务允许跑多久，超时后视为失败，允许重新发起。
const JOB_TIMEOUT_SECONDS = 30 * 60;
// 建好任务却一直没人来领，说明本机侧刚好掉线了，别让访客干等 30 分钟。
const CLAIM_TIMEOUT_SECONDS = 180;
const JOB_RECORD_TTL_SECONDS = 24 * 60 * 60;
// 口令错误的节流：同一 IP 15 分钟内最多试 5 次。
const ATTEMPT_WINDOW_SECONDS = 15 * 60;
const ATTEMPT_LIMIT = 5;
// 全局闸门：一小时内最多真正触发 6 次本体查询。
const HOURLY_JOB_LIMIT = 6;

const json = (body, status = 200, origin = "") => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...corsHeaders(origin),
  },
});

function corsHeaders(origin) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

/** 常量时间比较：用一次性随机密钥对两边做 HMAC 再比摘要，避免按字符提前返回泄漏口令长度与前缀。 */
async function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const key = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);
  const x = new Uint8Array(left);
  const y = new Uint8Array(right);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) diff |= x[i] ^ y[i];
  return diff === 0;
}

const nowIso = () => new Date().toISOString();
const secondsSince = (iso) => (Date.now() - Date.parse(iso || 0)) / 1000;

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 512 * 1024) throw new Error("请求体过大");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("请求格式不正确");
  }
}

function dashboardOf(input) {
  const dashboard = typeof input === "string" && input ? input : "qianwen-user-acquisition";
  return DASHBOARDS.has(dashboard) ? dashboard : null;
}

const jobKey = (id) => `job:${id}`;
const activeKey = (dashboard) => `active:${dashboard}`;
const recentKey = (dashboard) => `recent:${dashboard}`;
const latestKey = (dashboard) => `latest:${dashboard}`;
const heartbeatKey = (dashboard) => `hb:${dashboard}`;

async function loadJob(env, id) {
  if (!id) return null;
  const job = await env.RELAY.get(jobKey(id), "json");
  if (!job) return null;
  if ((job.status === "queued" || job.status === "running") && secondsSince(job.created_at) > JOB_TIMEOUT_SECONDS) {
    return { ...job, status: "failed", message: "查询超过 30 分钟没有完成，请稍后重试。" };
  }
  if (job.status === "queued" && secondsSince(job.created_at) > CLAIM_TIMEOUT_SECONDS) {
    return { ...job, status: "failed", message: "更新服务没有响应，请稍后重试。" };
  }
  return job;
}

async function saveJob(env, job) {
  await env.RELAY.put(jobKey(job.job_id), JSON.stringify(job), { expirationTtl: JOB_RECORD_TTL_SECONDS });
  return job;
}

/** 对外暴露的任务视图：完成时带上快照数据，其余只给状态与进度。 */
function publicJob(job, extra = {}) {
  return {
    job_id: job.job_id,
    status: job.status,
    message: job.message || "",
    progress_url: job.progress_url || "",
    created_at: job.created_at,
    updated_at: job.updated_at,
    data_cutoff: job.data?.meta?.data_cutoff || "",
    data: job.status === "completed" ? job.data : undefined,
    ...extra,
  };
}

async function agentOnline(env, dashboard) {
  const beat = await env.RELAY.get(heartbeatKey(dashboard));
  return Boolean(beat) && secondsSince(beat) < HEARTBEAT_TTL_SECONDS;
}

async function publishedCutoff(env, dashboard) {
  const latest = await env.RELAY.get(latestKey(dashboard), "json");
  return latest?.data?.meta?.data_cutoff || "";
}

/** 口令错误节流。返回 true 表示已超限。 */
async function tooManyAttempts(env, ip) {
  const key = `attempts:${ip}`;
  const count = Number(await env.RELAY.get(key)) || 0;
  return count >= ATTEMPT_LIMIT;
}

async function recordFailedAttempt(env, ip) {
  const key = `attempts:${ip}`;
  const count = (Number(await env.RELAY.get(key)) || 0) + 1;
  await env.RELAY.put(key, String(count), { expirationTtl: ATTEMPT_WINDOW_SECONDS });
}

/** 全局每小时任务闸门，防止有人拿到口令后把本体算力刷爆。 */
async function hourlyBudgetExhausted(env, dashboard) {
  const key = `budget:${dashboard}:${new Date().toISOString().slice(0, 13)}`;
  const count = Number(await env.RELAY.get(key)) || 0;
  return { exhausted: count >= HOURLY_JOB_LIMIT, key, count };
}

async function handleRefresh(request, env, origin) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const body = await readJson(request);
  const dashboard = dashboardOf(body.dashboard);
  if (!dashboard) return json({ error: "unknown_dashboard", message: "看板标识不正确。" }, 400, origin);

  if (await tooManyAttempts(env, ip)) {
    return json({ error: "too_many_attempts", message: "口令错误次数过多，请 15 分钟后再试。" }, 429, origin);
  }
  if (!(await safeEqual(String(body.password || ""), env.DASHBOARD_PASSWORD))) {
    await recordFailedAttempt(env, ip);
    return json({ error: "bad_password", message: "口令不正确。" }, 401, origin);
  }

  // 已有任务在跑，直接把它交回去，避免同一时刻重复查本体。
  const active = await loadJob(env, await env.RELAY.get(activeKey(dashboard)));
  if (active && (active.status === "queued" || active.status === "running")) {
    return json(publicJob(active, { reused: true }), 200, origin);
  }

  // 冷却期内复用上一次成功结果。
  const recent = await loadJob(env, await env.RELAY.get(recentKey(dashboard)));
  if (recent && recent.status === "completed" && secondsSince(recent.updated_at) < RESULT_COOLDOWN_SECONDS) {
    return json(publicJob(recent, {
      reused: true,
      message: `刚刚已更新过，这是 ${Math.round(secondsSince(recent.updated_at) / 60)} 分钟内的最新数据。`,
    }), 200, origin);
  }

  if (!(await agentOnline(env, dashboard))) {
    return json({
      error: "agent_offline",
      message: "更新服务当前离线，已为你展示最近一次发布的数据。",
      data_cutoff: await publishedCutoff(env, dashboard),
    }, 503, origin);
  }

  const budget = await hourlyBudgetExhausted(env, dashboard);
  if (budget.exhausted) {
    return json({
      error: "rate_limited",
      message: "本小时的更新次数已用完，请稍后再试。",
      data_cutoff: await publishedCutoff(env, dashboard),
    }, 429, origin);
  }
  await env.RELAY.put(budget.key, String(budget.count + 1), { expirationTtl: 3600 });

  const job = await saveJob(env, {
    job_id: crypto.randomUUID(),
    dashboard,
    status: "queued",
    message: "已排队，正在等待更新服务领取任务。",
    progress_url: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  await env.RELAY.put(activeKey(dashboard), job.job_id, { expirationTtl: JOB_TIMEOUT_SECONDS });
  return json(publicJob(job), 202, origin);
}

async function handleStatus(url, env, origin) {
  const job = await loadJob(env, url.searchParams.get("job"));
  if (!job) return json({ error: "unknown_job", message: "任务不存在或已过期。" }, 404, origin);
  return json(publicJob(job), 200, origin);
}

async function handleLatest(url, env, origin) {
  const dashboard = dashboardOf(url.searchParams.get("dashboard"));
  if (!dashboard) return json({ error: "unknown_dashboard" }, 400, origin);
  const latest = await env.RELAY.get(latestKey(dashboard), "json");
  if (!latest) return json({ error: "no_snapshot" }, 404, origin);
  return json({ ...latest, agent_online: await agentOnline(env, dashboard) }, 200, origin);
}

function agentAuthorized(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(token, env.AGENT_TOKEN);
}

async function handleAgent(path, request, env) {
  if (!(await agentAuthorized(request, env))) {
    return json({ error: "unauthorized" }, 401);
  }
  const body = await readJson(request);

  if (path === "/agent/heartbeat") {
    const dashboard = dashboardOf(body.dashboard);
    if (!dashboard) return json({ error: "unknown_dashboard" }, 400);
    await env.RELAY.put(heartbeatKey(dashboard), nowIso(), { expirationTtl: HEARTBEAT_TTL_SECONDS * 3 });
    return json({ ok: true });
  }

  if (path === "/agent/claim") {
    const dashboard = dashboardOf(body.dashboard);
    if (!dashboard) return json({ error: "unknown_dashboard" }, 400);
    await env.RELAY.put(heartbeatKey(dashboard), nowIso(), { expirationTtl: HEARTBEAT_TTL_SECONDS * 3 });
    const job = await loadJob(env, await env.RELAY.get(activeKey(dashboard)));
    if (!job || job.status !== "queued") return json({ job: null });
    const claimed = await saveJob(env, {
      ...job,
      status: "running",
      message: "更新服务已接手，正在向盈米本体查询。",
      updated_at: nowIso(),
    });
    return json({ job: claimed });
  }

  const job = await loadJob(env, body.job_id);
  if (!job) return json({ error: "unknown_job" }, 404);

  if (path === "/agent/progress") {
    await saveJob(env, {
      ...job,
      message: String(body.message || job.message).slice(0, 300),
      progress_url: String(body.progress_url || job.progress_url || "").slice(0, 500),
      updated_at: nowIso(),
    });
    return json({ ok: true });
  }

  if (path === "/agent/complete") {
    const data = body.data;
    // 中继不重复做口径校验（那是 agent 落盘前的事），但拒收明显不是本看板快照的东西。
    if (data?.schema_version !== "qianwen-user-acquisition-v5" || !Array.isArray(data.daily) || !data.daily.length) {
      return json({ error: "bad_snapshot", message: "快照格式不正确" }, 400);
    }
    const completed = await saveJob(env, {
      ...job,
      status: "completed",
      message: "更新完成。",
      data,
      updated_at: nowIso(),
    });
    await env.RELAY.put(latestKey(job.dashboard), JSON.stringify({ data, stored_at: nowIso() }));
    await env.RELAY.put(recentKey(job.dashboard), job.job_id, { expirationTtl: RESULT_COOLDOWN_SECONDS });
    await env.RELAY.delete(activeKey(job.dashboard));
    return json({ ok: true, job_id: completed.job_id });
  }

  if (path === "/agent/fail") {
    await saveJob(env, {
      ...job,
      status: "failed",
      message: String(body.message || "查询失败").slice(0, 300),
      updated_at: nowIso(),
    });
    await env.RELAY.delete(activeKey(job.dashboard));
    return json({ ok: true });
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (path === "/health") return json({ ok: true, time: nowIso() }, 200, origin);
      if (path === "/refresh" && request.method === "POST") return await handleRefresh(request, env, origin);
      if (path === "/status" && request.method === "GET") return await handleStatus(url, env, origin);
      if (path === "/latest" && request.method === "GET") return await handleLatest(url, env, origin);
      if (path.startsWith("/agent/") && request.method === "POST") return await handleAgent(path, request, env);
      return json({ error: "not_found" }, 404, origin);
    } catch (error) {
      return json({ error: "internal", message: String(error?.message || error).slice(0, 200) }, 500, origin);
    }
  },
};
