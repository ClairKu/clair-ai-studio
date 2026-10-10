/**
 * Clair's Studio · 成果访问状态服务
 *
 * GitHub Pages 只负责页面本身；每份成果当前是否上锁保存在 KV。
 * 工作台密码只用于换取短期管理会话，既不写入页面，也不写入 KV。
 */

const POLICY_KEY = "studio:report-access:v1";
const SESSION_PREFIX = "studio:admin-session:";
const AUTH_RATE_PREFIX = "studio:auth-rate:";
const WRITE_RATE_PREFIX = "studio:write-rate:";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const RATE_WINDOW_SECONDS = 60;
const AUTH_RATE_MAX = 8;
const WRITE_RATE_MAX = 40;
const DEFAULT_ORIGINS = ["https://clairku.github.io"];

export const BASE_POLICY = Object.freeze({
  version: 3,
  defaultLocked: true,
  lockedEntries: [],
  unlockedEntries: [
    "reports/personal-agent-market-atlas-2026-10-10/",
    "reports/qieman-four-money-redesign-2026-09-24/",
  ],
  immutableLockedEntries: [
    "reports/doubao-user-acquisition-dashboard/",
    "reports/doubao-user-conversion-cases-2026-09-20/",
    "reports/qianwen-first-investor-cases-2026-09-17/",
    "reports/qianwen-user-acquisition-dashboard/",
    "reports/qianwen-user-question-analysis-2026-09-05/",
    "reports/qianwen-user-question-detail-2026-09-05/",
  ],
  updatedAt: "2026-10-10T00:00:00.000Z",
});

function uniqueEntries(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim().replace(/^\/+/, ""))
    .filter((value) => value.startsWith("reports/") || value.startsWith("apps/")))]
    .sort((left, right) => left.localeCompare(right));
}

export function normalizePolicy(value = {}) {
  const immutableLockedEntries = uniqueEntries([
    ...BASE_POLICY.immutableLockedEntries,
    ...(value.immutableLockedEntries || []),
  ]);
  const immutable = new Set(immutableLockedEntries);
  const unlockedEntries = uniqueEntries(value.unlockedEntries)
    .filter((entry) => !immutable.has(entry));
  const unlocked = new Set(unlockedEntries);
  const lockedEntries = uniqueEntries(value.lockedEntries)
    .filter((entry) => !unlocked.has(entry));
  return {
    version: 3,
    defaultLocked: value.defaultLocked !== false,
    lockedEntries,
    unlockedEntries,
    immutableLockedEntries,
    updatedAt: String(value.updatedAt || BASE_POLICY.updatedAt),
  };
}

export function validEntry(value) {
  const entry = String(value || "").trim().replace(/^\/+/, "");
  if (!entry || entry.length > 320 || entry.includes("..") || /[?#\\]/.test(entry)) return "";
  if (!entry.startsWith("reports/") && !entry.startsWith("apps/")) return "";
  return entry;
}

export function accessStatus(policyValue, entryValue) {
  const policy = normalizePolicy(policyValue);
  const entry = validEntry(entryValue);
  const immutable = policy.immutableLockedEntries.includes(entry);
  const explicitlyLocked = policy.lockedEntries.includes(entry);
  const explicitlyUnlocked = policy.unlockedEntries.includes(entry);
  return {
    entry,
    locked: !entry || immutable || (!explicitlyUnlocked && (explicitlyLocked || policy.defaultLocked)),
    immutable,
  };
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function originAllowed(request, env) {
  const origin = request.headers.get("Origin") || "";
  return Boolean(origin) && allowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origins = allowedOrigins(env);
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": origins.includes(origin) ? origin : origins[0],
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Studio-Passcode",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(request, env),
    },
  });
}

function safeEqual(leftValue, rightValue) {
  const left = String(leftValue || "");
  const right = String(rightValue || "");
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function digestToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  let binary = "";
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function rateLimited(request, env, prefix, limit) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const windowId = Math.floor(Date.now() / (RATE_WINDOW_SECONDS * 1000));
  const key = `${prefix}${ip}:${windowId}`;
  const count = Number((await env.STUDIO_ACCESS.get(key)) || "0") + 1;
  await env.STUDIO_ACCESS.put(key, String(count), { expirationTtl: RATE_WINDOW_SECONDS * 2 });
  return count > limit;
}

async function readPolicy(env) {
  const stored = await env.STUDIO_ACCESS.get(POLICY_KEY, "json");
  return normalizePolicy(stored || BASE_POLICY);
}

async function writePolicy(env, policy) {
  await env.STUDIO_ACCESS.put(POLICY_KEY, JSON.stringify(policy));
}

async function issueSession(env) {
  const token = randomToken();
  const digest = await digestToken(token);
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await env.STUDIO_ACCESS.put(
    `${SESSION_PREFIX}${digest}`,
    JSON.stringify({ expiresAt }),
    { expirationTtl: SESSION_TTL_SECONDS },
  );
  return { token, expiresAt };
}

async function authorizedSession(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;
  const digest = await digestToken(token);
  const session = await env.STUDIO_ACCESS.get(`${SESSION_PREFIX}${digest}`, "json");
  return Boolean(session?.expiresAt && Number(session.expiresAt) > Date.now());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (path === "/health" && request.method === "GET") {
      const policy = await readPolicy(env);
      return json(request, env, { ok: true, version: policy.version, updatedAt: policy.updatedAt });
    }

    if (path === "/v1/report-access" && request.method === "GET") {
      const policy = await readPolicy(env);
      const entry = validEntry(url.searchParams.get("entry"));
      return json(request, env, {
        config: policy,
        ...(entry ? { status: accessStatus(policy, entry) } : {}),
      });
    }

    if (path === "/v1/session" && request.method === "POST") {
      if (!originAllowed(request, env)) return json(request, env, { error: "origin_not_allowed" }, 403);
      if (await rateLimited(request, env, AUTH_RATE_PREFIX, AUTH_RATE_MAX)) {
        return json(request, env, { error: "rate_limited", message: "验证过于频繁，请稍后再试。" }, 429);
      }
      const passcode = request.headers.get("X-Studio-Passcode") || "";
      if (!env.STUDIO_ADMIN_PASSCODE || !safeEqual(passcode, env.STUDIO_ADMIN_PASSCODE)) {
        return json(request, env, { error: "bad_passcode" }, 403);
      }
      return json(request, env, await issueSession(env));
    }

    if (path === "/v1/report-access" && request.method === "PUT") {
      if (!originAllowed(request, env)) return json(request, env, { error: "origin_not_allowed" }, 403);
      if (!(await authorizedSession(request, env))) {
        return json(request, env, { error: "admin_session_required", message: "工作台授权已过期，请刷新后重新登录。" }, 401);
      }
      if (await rateLimited(request, env, WRITE_RATE_PREFIX, WRITE_RATE_MAX)) {
        return json(request, env, { error: "rate_limited", message: "切换过于频繁，请稍后再试。" }, 429);
      }
      const body = await request.json().catch(() => ({}));
      const entry = validEntry(body.entry);
      if (!entry || typeof body.locked !== "boolean") {
        return json(request, env, { error: "invalid_request", message: "成果访问设置无效。" }, 400);
      }
      const current = await readPolicy(env);
      const currentStatus = accessStatus(current, entry);
      if (currentStatus.immutable && !body.locked) {
        return json(request, env, { error: "immutable", message: "该成果含加密数据，不能取消保护。" }, 409);
      }
      const lockedEntries = new Set(current.lockedEntries);
      const unlockedEntries = new Set(current.unlockedEntries);
      if (body.locked) {
        lockedEntries.add(entry);
        unlockedEntries.delete(entry);
      } else {
        lockedEntries.delete(entry);
        unlockedEntries.add(entry);
      }
      const next = normalizePolicy({
        ...current,
        lockedEntries: [...lockedEntries],
        unlockedEntries: [...unlockedEntries],
        updatedAt: new Date().toISOString(),
      });
      await writePolicy(env, next);
      return json(request, env, { config: next, status: accessStatus(next, entry) });
    }

    return json(request, env, { error: "not_found" }, 404);
  },
};
