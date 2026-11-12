import { loadReportAccessConfig, reportAccessConnectionState } from "./report-access-settings.js";

const ACCESS_ENDPOINT = "https://clair-studio-access.pages.dev/v1";
const ENTRY_URL = "https://clair-select.pages.dev/studio-entry";
const ADMIN_TOKEN_KEY = "clair-ai-studio-access-admin-token-v1";
const ADMIN_EXPIRES_KEY = "clair-ai-studio-access-admin-expires-v1";
const WORKSPACE_SESSION_KEY = "clair-ai-studio-access-v4";

function sessionRequired() {
  // The existing workspace gate owns sign-in. Clearing an expired server
  // session makes its normal reload path show that same sign-in again.
  try {
    for (const key of [ADMIN_TOKEN_KEY, ADMIN_EXPIRES_KEY, WORKSPACE_SESSION_KEY]) {
      globalThis.sessionStorage?.removeItem(key);
    }
  } catch {}
  const error = new Error("工作台登录已过期，请重新进入 Clair Studio。");
  error.code = "studio_session_required";
  return error;
}

export async function issueClairSelectEntry() {
  if (!reportAccessConnectionState().hasToken) throw sessionRequired();
  const config = await loadReportAccessConfig();
  if (config.stateEndpoint !== ACCESS_ENDPOINT) {
    throw new Error("招聘工作台入口暂时不可用，请稍后重试。");
  }
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 4000);
  let payload;
  try {
    const response = await fetch(`${ACCESS_ENDPOINT}/apps/clair-select/entry`, {
      method: "POST",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${globalThis.sessionStorage?.getItem(ADMIN_TOKEN_KEY) || ""}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (response.status === 401) throw sessionRequired();
    payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || "暂时未能打开招聘工作台，请稍后重试。");
  } finally {
    globalThis.clearTimeout(timeout);
  }
  const now = Date.now();
  if (payload?.entryUrl !== ENTRY_URL
    || typeof payload.ticket !== "string" || payload.ticket.length > 2048
    || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(payload.ticket)
    || !Number.isSafeInteger(payload.expiresAt)
    || payload.expiresAt <= now || payload.expiresAt > now + 65_000) {
    throw new Error("招聘工作台入口验证失败，请重新打开。");
  }
  return { ticket: payload.ticket, expiresAt: payload.expiresAt, entryUrl: ENTRY_URL };
}
