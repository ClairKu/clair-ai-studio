const GITHUB_API = "https://api.github.com";
const REPOSITORY = {
  owner: "ClairKu",
  name: "clair-ai-studio",
  branch: "main",
};
const CONFIG_PATHS = ["public/report-access.json", "docs/report-access.json"];

const accessState = {
  loaded: false,
  loading: null,
  error: "",
  token: "",
  config: {
    version: 1,
    defaultLocked: false,
    lockedReportIds: [],
    immutableLockedReportIds: [],
  },
};

function uniqueIds(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

export function normalizeReportAccessConfig(value = {}) {
  return {
    version: 1,
    defaultLocked: Boolean(value.defaultLocked),
    lockedReportIds: uniqueIds(value.lockedReportIds),
    immutableLockedReportIds: uniqueIds(value.immutableLockedReportIds),
  };
}

export function managedReportId(report) {
  if (!report?.url) return "";
  try {
    const url = new URL(report.url, globalThis.location?.href || "https://clairku.github.io/");
    if (url.hostname.toLowerCase() !== "clairku.github.io") return "";
    const prefix = "/clair-ai-studio/reports/";
    if (!url.pathname.startsWith(prefix)) return "";
    return decodeURIComponent(url.pathname.slice(prefix.length).split("/").filter(Boolean)[0] || "");
  } catch {
    return "";
  }
}

export function reportAccessStatus(report, config = accessState.config) {
  const reportId = managedReportId(report);
  if (!reportId) {
    return {
      reportId: "",
      managed: false,
      locked: false,
      immutable: false,
      loaded: accessState.loaded,
    };
  }
  const normalized = normalizeReportAccessConfig(config);
  const immutable = normalized.immutableLockedReportIds.includes(reportId);
  const explicitlyLocked = normalized.lockedReportIds.includes(reportId);
  return {
    reportId,
    managed: true,
    locked: immutable || explicitlyLocked || (normalized.defaultLocked && !explicitlyLocked),
    immutable,
    loaded: accessState.loaded,
  };
}

export function reportAccessConnectionState() {
  return {
    loaded: accessState.loaded,
    error: accessState.error,
    hasToken: Boolean(accessState.token),
  };
}

export async function loadReportAccessConfig({ force = false } = {}) {
  if (accessState.loaded && !force) return accessState.config;
  if (accessState.loading && !force) return accessState.loading;
  const configUrl = new URL("./report-access.json", globalThis.location?.href || "https://clairku.github.io/clair-ai-studio/");
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
  const path = CONFIG_PATHS[0].split("/").map(encodeURIComponent).join("/");
  const payload = await githubRequest(
    `/repos/${REPOSITORY.owner}/${REPOSITORY.name}/contents/${path}?ref=${REPOSITORY.branch}`,
    { token },
  );
  if (payload.encoding !== "base64" || !payload.content) {
    throw new Error("生产访问配置无法解析");
  }
  return normalizeReportAccessConfig(JSON.parse(decodeBase64Utf8(payload.content)));
}

async function commitConfigFiles(config, token, reportTitle) {
  const repoPath = `/repos/${REPOSITORY.owner}/${REPOSITORY.name}`;
  const ref = await githubRequest(`${repoPath}/git/ref/heads/${REPOSITORY.branch}`, { token });
  const headSha = ref?.object?.sha;
  if (!headSha) throw new Error("无法读取生产分支");
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
      message: `Set report access for ${reportTitle || "Clair's Studio report"}`,
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
      throw new Error("生产分支刚刚有新更新，请重新保存以合并最新设置");
    }
    throw error;
  }
  return commit.sha;
}

export async function publishReportAccessSetting(report, { locked, token = "" } = {}) {
  const status = reportAccessStatus(report);
  if (!status.managed) throw new Error("该成果不在 Clair’s Studio 生产站点，无法设置访问密码");
  if (status.immutable && !locked) throw new Error("该成果含敏感数据并已加密，不能取消上锁");
  const nextToken = String(token || accessState.token || "").trim();
  if (!nextToken) throw new Error("请先提供 GitHub Fine-grained Token");
  const latest = await readProductionConfig(nextToken);
  if (latest.immutableLockedReportIds.includes(status.reportId) && !locked) {
    throw new Error("该成果含敏感数据并已加密，不能取消上锁");
  }
  const lockedIds = new Set(latest.lockedReportIds);
  if (locked) lockedIds.add(status.reportId);
  else lockedIds.delete(status.reportId);
  const nextConfig = normalizeReportAccessConfig({
    ...latest,
    lockedReportIds: [...lockedIds],
  });
  const commit = await commitConfigFiles(nextConfig, nextToken, report.title);
  accessState.token = nextToken;
  accessState.config = nextConfig;
  accessState.loaded = true;
  accessState.error = "";
  return { commit, config: nextConfig, locked: Boolean(locked), reportId: status.reportId };
}
