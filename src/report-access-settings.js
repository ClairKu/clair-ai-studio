import {
  githubSessionToken,
  rememberGithubSessionToken,
} from "./github-session.js";

const GITHUB_API = "https://api.github.com";
const SITE_ORIGIN = "https://clairku.github.io";
const SITE_ROOT_PATH = "/clair-ai-studio/";
const REPOSITORY = {
  owner: "ClairKu",
  name: "clair-ai-studio",
  branch: "main",
};
const CONFIG_PATHS = ["public/report-access.json", "docs/report-access.json"];

const EMPTY_CONFIG = {
  version: 2,
  defaultLocked: true,
  lockedEntries: [],
  unlockedEntries: [],
  immutableLockedEntries: [],
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

export function normalizeReportAccessConfig(value = {}) {
  return {
    version: 2,
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

export function reportAccessConnectionState() {
  return {
    loaded: accessState.loaded,
    error: accessState.error,
    hasToken: Boolean(githubSessionToken()),
  };
}

export async function loadReportAccessConfig({ force = false } = {}) {
  if (accessState.loaded && !force) return accessState.config;
  if (accessState.loading && !force) return accessState.loading;
  const configUrl = new URL("./report-access.json", globalThis.location?.href || `${SITE_ORIGIN}${SITE_ROOT_PATH}`);
  configUrl.searchParams.set("v", Date.now().toString(36));
  accessState.loading = fetch(configUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`无法读取成果访问设置（${response.status}）`);
      return response.json();
    })
    .then((config) => {
      accessState.config = normalizeReportAccessConfig(config);
      accessState.loaded = true;
      accessState.error = "";
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

function decodeBase64Utf8(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

async function githubRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.json())?.message || "";
    } catch {
      detail = await response.text();
    }
    const error = new Error(detail || `GitHub API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

async function readProductionConfig(token) {
  const repoPath = `/repos/${REPOSITORY.owner}/${REPOSITORY.name}`;
  const ref = await githubRequest(`${repoPath}/git/ref/heads/${REPOSITORY.branch}`, { token });
  const headSha = ref?.object?.sha;
  if (!headSha) throw new Error("无法读取生产分支");
  const path = CONFIG_PATHS[0].split("/").map(encodeURIComponent).join("/");
  const payload = await githubRequest(
    `${repoPath}/contents/${path}?ref=${encodeURIComponent(headSha)}`,
    { token },
  );
  if (payload.encoding !== "base64" || !payload.content) {
    throw new Error("生产访问配置无法解析");
  }
  return {
    config: normalizeReportAccessConfig(JSON.parse(decodeBase64Utf8(payload.content))),
    headSha,
  };
}

async function commitConfigFiles(config, token, reportTitle, headSha) {
  const repoPath = `/repos/${REPOSITORY.owner}/${REPOSITORY.name}`;
  const parent = await githubRequest(`${repoPath}/git/commits/${headSha}`, { token });
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const blob = await githubRequest(`${repoPath}/git/blobs`, {
    token,
    method: "POST",
    body: { content: encodeBase64Utf8(content), encoding: "base64" },
  });
  const tree = await githubRequest(`${repoPath}/git/trees`, {
    token,
    method: "POST",
    body: {
      base_tree: parent.tree.sha,
      tree: CONFIG_PATHS.map((path) => ({
        path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      })),
    },
  });
  const commit = await githubRequest(`${repoPath}/git/commits`, {
    token,
    method: "POST",
    body: {
      message: `${config.lockedEntries.length ? "Update" : "Set"} report access for ${reportTitle || "Clair's Studio report"}`,
      tree: tree.sha,
      parents: [headSha],
    },
  });
  try {
    await githubRequest(`${repoPath}/git/refs/heads/${REPOSITORY.branch}`, {
      token,
      method: "PATCH",
      body: { sha: commit.sha, force: false },
    });
  } catch (error) {
    if (error.status === 422) {
      throw new Error("生产分支刚刚有新更新，请再点一次以合并最新设置");
    }
    throw error;
  }
  return commit.sha;
}

export async function publishReportAccessSetting(report, { locked, token = "" } = {}) {
  const status = reportAccessStatus(report);
  if (!status.managed) throw new Error("该成果不在 Clair’s Studio 生产站点，无法设置访问密码");
  if (status.immutable && !locked) throw new Error("该成果含加密数据，不能取消保护");
  const nextToken = rememberGithubSessionToken(token || githubSessionToken());
  if (!nextToken) throw new Error("请先连接一次发布权限");
  const { config: latest, headSha } = await readProductionConfig(nextToken);
  if (latest.immutableLockedEntries.includes(status.entry) && !locked) {
    throw new Error("该成果含加密数据，不能取消保护");
  }
  const lockedEntries = new Set(latest.lockedEntries);
  const unlockedEntries = new Set(latest.unlockedEntries);
  if (locked) {
    lockedEntries.add(status.entry);
    unlockedEntries.delete(status.entry);
  } else {
    lockedEntries.delete(status.entry);
    unlockedEntries.add(status.entry);
  }
  const nextConfig = normalizeReportAccessConfig({
    ...latest,
    lockedEntries: [...lockedEntries],
    unlockedEntries: [...unlockedEntries],
  });
  const commit = await commitConfigFiles(nextConfig, nextToken, report.title, headSha);
  accessState.config = nextConfig;
  accessState.loaded = true;
  accessState.error = "";
  return { commit, config: nextConfig, locked: Boolean(locked), entry: status.entry };
}
