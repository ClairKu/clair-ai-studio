const SITE_ORIGIN = "https://clairku.github.io";
const SITE_ROOT_PATH = "/clair-ai-studio/";
const ADMIN_TOKEN_KEY = "clair-ai-studio-access-admin-token-v1";
const ADMIN_TOKEN_EXPIRES_KEY = "clair-ai-studio-access-admin-expires-v1";
const ACCESS_STATE_TIMEOUT_MS = 4000;

const EMPTY_CONFIG = {
  version: 3,
  stateEndpoint: "",
  defaultLocked: true,
  lockedEntries: [],
  unlockedEntries: [],
  immutableLockedEntries: [],
  updatedAt: "",
};

const accessState = {
  loaded: false,
  loading: null,
  error: "",
  config: { ...EMPTY_CONFIG },
};

function uniqueEntries(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim().replace(/^\/+/, ""))
    .filter((value) => value.startsWith("reports/") || value.startsWith("apps/")))]
    .sort((left, right) => left.localeCompare(right));
}

function legacyReportEntries(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((reportId) => `reports/${reportId}/`);
}

function normalizedEndpoint(value) {
  const endpoint = String(value || "").trim().replace(/\/+$/, "");
  if (!endpoint) return "";
  try {
    const url = new URL(endpoint);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return url.protocol === "https:" || (url.protocol === "http:" && loopback) ? endpoint : "";
  } catch {
    return "";
  }
}

export function normalizeReportAccessConfig(value = {}, fallback = {}) {
  return {
    version: 3,
    stateEndpoint: normalizedEndpoint(value.stateEndpoint || fallback.stateEndpoint),
    // A missing flag must never turn an older or partially deployed config
    // into a site-wide public policy.
    defaultLocked: value.defaultLocked !== false,
    lockedEntries: uniqueEntries([
      ...(value.lockedEntries || []),
      ...legacyReportEntries(value.lockedReportIds),
    ]),
    unlockedEntries: uniqueEntries(value.unlockedEntries),
    immutableLockedEntries: uniqueEntries([
      ...(value.immutableLockedEntries || []),
      ...legacyReportEntries(value.immutableLockedReportIds),
    ]),
    updatedAt: String(value.updatedAt || ""),
  };
}

export function managedAccessEntry(report) {
  if (!report?.url) return "";
  try {
    const url = new URL(report.url, globalThis.location?.href || `${SITE_ORIGIN}${SITE_ROOT_PATH}`);
    if (url.origin.toLowerCase() !== SITE_ORIGIN) return "";
    if (!url.pathname.startsWith(SITE_ROOT_PATH)) return "";
    let entry = decodeURIComponent(url.pathname.slice(SITE_ROOT_PATH.length));
    if (!entry.startsWith("reports/") && !entry.startsWith("apps/")) return "";
    entry = entry.replace(/^\/+/, "").replace(/\/index\.html$/i, "/");
    if (!entry.endsWith("/") && !/\.[a-z0-9]+$/i.test(entry)) entry += "/";
    return entry;
  } catch {
    return "";
  }
}

export function reportAccessStatus(report, config = accessState.config) {
  const entry = managedAccessEntry(report);
  if (!entry) {
    return {
      entry: "",
      managed: false,
      locked: false,
      immutable: false,
      loaded: accessState.loaded,
    };
  }
  const normalized = normalizeReportAccessConfig(config);
  const immutable = normalized.immutableLockedEntries.includes(entry);
  const explicitlyLocked = normalized.lockedEntries.includes(entry);
  const explicitlyUnlocked = normalized.unlockedEntries.includes(entry);
  return {
    entry,
    managed: true,
    locked: immutable || (!explicitlyUnlocked && (explicitlyLocked || normalized.defaultLocked)),
    immutable,
    loaded: accessState.loaded,
  };
}

function sessionValue(key) {
  try {
    return globalThis.sessionStorage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function clearAdminSession() {
  try {
    globalThis.sessionStorage?.removeItem(ADMIN_TOKEN_KEY);
    globalThis.sessionStorage?.removeItem(ADMIN_TOKEN_EXPIRES_KEY);
  } catch {
    // The next write still fails safely when storage is unavailable.
  }
}

export function reportAccessConnectionState() {
  const token = sessionValue(ADMIN_TOKEN_KEY);
  const expiresAt = Number(sessionValue(ADMIN_TOKEN_EXPIRES_KEY) || "0");
  const hasToken = Boolean(token && expiresAt > Date.now());
  if (token && !hasToken) clearAdminSession();
  return {
    loaded: accessState.loaded,
    error: accessState.error,
    hasToken,
    expiresAt,
  };
}

function endpointUrl(endpoint, resource) {
  return `${String(endpoint || "").replace(/\/+$/, "")}/${resource.replace(/^\/+/, "")}`;
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), ACCESS_STATE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function responseJson(response, fallbackMessage) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = new Error(payload?.message || fallbackMessage || `访问状态服务返回 ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function loadReportAccessConfig({ force = false } = {}) {
  if (accessState.loaded && !force) return accessState.config;
  if (accessState.loading && !force) return accessState.loading;
  const configUrl = new URL("./report-access.json", globalThis.location?.href || `${SITE_ORIGIN}${SITE_ROOT_PATH}`);
  configUrl.searchParams.set("v", Date.now().toString(36));
  accessState.loading = fetchWithTimeout(configUrl, { cache: "no-store" })
    .then((response) => responseJson(response, `无法读取成果访问设置（${response.status}）`))
    .then(async (bootstrapValue) => {
      const bootstrap = normalizeReportAccessConfig(bootstrapValue);
      if (!bootstrap.stateEndpoint) throw new Error("成果访问状态服务尚未配置");
      try {
        const liveUrl = new URL(endpointUrl(bootstrap.stateEndpoint, "report-access"));
        liveUrl.searchParams.set("v", Date.now().toString(36));
        const response = await fetchWithTimeout(liveUrl, { cache: "no-store" });
        const payload = await responseJson(response, `无法读取在线访问状态（${response.status}）`);
        accessState.config = normalizeReportAccessConfig(payload?.config || payload, bootstrap);
        accessState.error = "";
      } catch (error) {
        // A service outage keeps the last deployed bootstrap policy. Protected
        // entries therefore stay protected, while intentional public exceptions
        // remain usable instead of taking the whole studio down.
        accessState.config = bootstrap;
        accessState.error = error?.message || "无法读取在线访问状态";
      }
      accessState.loaded = true;
      return accessState.config;
    })
    .catch((error) => {
      accessState.error = error?.message || "无法读取成果访问设置";
      throw error;
    })
    .finally(() => {
      accessState.loading = null;
    });
  return accessState.loading;
}

export async function publishReportAccessSetting(report, { locked } = {}) {
  const status = reportAccessStatus(report);
  if (!status.managed) throw new Error("该成果不在 Clair’s Studio 生产站点，无法设置访问密码");
  if (status.immutable && !locked) throw new Error("该成果含加密数据，不能取消保护");
  const connection = reportAccessConnectionState();
  if (!connection.hasToken) throw new Error("工作台授权已过期，请刷新页面重新登录");
  const endpoint = accessState.config.stateEndpoint;
  if (!endpoint) throw new Error("成果访问状态服务尚未配置");
  try {
    const response = await fetchWithTimeout(endpointUrl(endpoint, "report-access"), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${sessionValue(ADMIN_TOKEN_KEY)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entry: status.entry, locked: Boolean(locked) }),
    });
    const payload = await responseJson(response, `访问设置切换失败（${response.status}）`);
    accessState.config = normalizeReportAccessConfig(payload?.config || {}, accessState.config);
    accessState.loaded = true;
    accessState.error = "";
    return {
      config: accessState.config,
      locked: payload?.status?.locked !== false,
      entry: status.entry,
      updatedAt: accessState.config.updatedAt,
    };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) clearAdminSession();
    throw error;
  }
}
