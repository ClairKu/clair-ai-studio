const EDITOR_CHANNEL = "clair-report-editor-v1";
const GITHUB_API = "https://api.github.com";
const DRAFT_STORAGE_PREFIX = "clair-report-editor-draft-v1:";

const editor = {
  reportId: "",
  reportTitle: "",
  reportUrl: "",
  status: "idle",
  error: "",
  html: "",
  editorDocument: "",
  dirty: false,
  hasDraft: false,
  draftHtml: "",
  draftAt: "",
  target: null,
  token: "",
  settingsOpen: false,
  publishConfirmOpen: false,
  pendingSave: false,
  saving: false,
  lastCommit: "",
  isLocal: false,
  saveLocal: null,
  protection: null,
  loadPromise: null,
  render: null,
  showToast: null,
  currentPage: 0,
  pageCount: 1,
};

const serializeRequests = new Map();
let hooksBound = false;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function targetShaMap(target = editor.target) {
  if (!target) return {};
  return {
    ...(target.path && target.sha ? { [target.path]: target.sha } : {}),
    ...Object.fromEntries((target.mirrors || []).map((item) => [item.path, item.sha])),
    ...(target.baseFiles || {}),
  };
}

function draftStorageKey(reportId) {
  return `${DRAFT_STORAGE_PREFIX}${reportId}`;
}

function readStoredDraft(reportId) {
  try {
    const value = sessionStorage.getItem(draftStorageKey(reportId));
    if (!value) return null;
    const draft = JSON.parse(value);
    if (!draft?.html || typeof draft.html !== "string") return null;
    return draft;
  } catch {
    return null;
  }
}

function clearStoredDraft(reportId = editor.reportId) {
  try {
    sessionStorage.removeItem(draftStorageKey(reportId));
  } catch {
    // A failed cleanup should not block publishing.
  }
}

function revisionState() {
  if (editor.dirty && editor.hasDraft) {
    return {
      tone: "changed",
      label: editor.isLocal
        ? "有新修订 · 上次暂存待保存"
        : "有新修订 · 上次暂存待推送",
    };
  }
  if (editor.dirty) {
    return { tone: "changed", label: "已修订 · 未暂存" };
  }
  if (editor.hasDraft) {
    return {
      tone: "staged",
      label: editor.isLocal ? "已暂存 · 待保存成果库" : "已暂存 · 待推送生产",
    };
  }
  if (editor.lastCommit) {
    return {
      tone: "published",
      label: editor.isLocal ? "成果库 HTML 已更新" : "生产档案已更新",
    };
  }
  return { tone: "clean", label: "未修改" };
}

function updateEditorChrome() {
  const state = revisionState();
  const status = document.querySelector(".editor-revision-status");
  if (status) {
    status.className = `editor-revision-status is-${state.tone}`;
    status.textContent = state.label;
  }
  const stashButton = document.querySelector('[data-editor-action="stash"]');
  if (stashButton) {
    stashButton.disabled = editor.status !== "ready" || editor.saving || !editor.dirty;
    const label = !editor.dirty && editor.hasDraft ? "已暂存" : "暂存修改";
    stashButton.setAttribute("aria-label", label);
    stashButton.title = label;
  }
  const publishButton = document.querySelector('[data-editor-action="publish"]');
  if (publishButton) {
    publishButton.disabled =
      editor.status !== "ready" || editor.saving || (!editor.dirty && !editor.hasDraft);
    const label = editor.saving
      ? editor.isLocal ? "正在保存到成果库" : "正在推送生产"
      : editor.isLocal ? "保存到成果库" : "推送生产";
    publishButton.setAttribute("aria-label", label);
    publishButton.title = label;
    publishButton.classList.toggle("is-saving", editor.saving);
  }
  const previewButton = document.querySelector('[data-editor-action="preview"]');
  if (previewButton) {
    previewButton.disabled = editor.status !== "ready" || editor.saving || !editor.hasDraft;
  }
  const pageCounter = document.querySelector("[data-editor-page-counter]");
  const pageControls = document.querySelector("[data-editor-page-controls]");
  if (pageCounter) pageCounter.textContent = `${editor.currentPage + 1} / ${Math.max(1, editor.pageCount)}`;
  if (pageControls) pageControls.hidden = editor.pageCount <= 1;
  const previous = document.querySelector('[data-editor-action="prev-page"]');
  const next = document.querySelector('[data-editor-action="next-page"]');
  if (previous) previous.disabled = editor.currentPage <= 0;
  if (next) next.disabled = editor.currentPage >= editor.pageCount - 1;
}

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeBase64Utf8(value) {
  const binary = atob(String(value || "").replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function unpackProtectedHtml(wrapperHtml) {
  return { html: wrapperHtml, protection: null };
}

async function repackProtectedHtml(plainHtml) {
  return plainHtml;
}

function githubPagesTarget(urlValue) {
  try {
    const url = new URL(urlValue);
    if (url.hostname.toLowerCase() !== "clairku.github.io") return null;
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const repository = segments.shift() || "ClairKu.github.io";
    let pagePath = segments.join("/");
    if (!pagePath || url.pathname.endsWith("/")) {
      pagePath = `${pagePath ? `${pagePath}/` : ""}index.html`;
    }
    const candidates = unique([
      `docs/${pagePath}`,
      pagePath,
      `public/${pagePath}`,
    ]);
    return {
      owner: "ClairKu",
      repository,
      branch: "main",
      path: candidates[0],
      candidates,
      source: "auto",
    };
  } catch {
    return null;
  }
}

async function githubRequest(path, { token = "", method = "GET", body } = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers,
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

async function readGithubFile(target) {
  const repo = await githubRequest(
    `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repository)}`,
  );
  target.branch = repo.default_branch || target.branch || "main";
  const candidates = unique(target.candidates?.length ? target.candidates : [target.path]);
  let lastError = null;
  let selected = null;
  const mirrors = [];
  for (const candidate of candidates) {
    try {
      const encodedPath = candidate.split("/").map(encodeURIComponent).join("/");
      const endpoint = `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repository)}/contents/${encodedPath}?ref=${encodeURIComponent(target.branch)}`;
      const payload = await githubRequest(endpoint);
      let html = "";
      if (payload.encoding === "base64" && payload.content) {
        html = decodeBase64Utf8(payload.content);
      } else if (payload.download_url) {
        const rawResponse = await fetch(payload.download_url, { cache: "no-store" });
        if (!rawResponse.ok) throw new Error("无法读取 GitHub 原始文件");
        html = await rawResponse.text();
      }
      if (!html) throw new Error("GitHub 文件内容为空");
      if (!selected) {
        selected = {
          html,
          target: {
            ...target,
            path: candidate,
            sha: payload.sha,
            candidates,
          },
        };
      } else if (html === selected.html) {
        mirrors.push({ path: candidate, sha: payload.sha });
      }
    } catch (error) {
      lastError = error;
      if (error.status && ![403, 404].includes(error.status)) break;
    }
  }
  if (selected) {
    selected.target.mirrors = mirrors;
    return selected;
  }
  throw lastError || new Error("没有找到对应的 GitHub HTML 文件");
}

function disableActiveContent(documentNode) {
  documentNode.querySelectorAll("script").forEach((script) => {
    script.dataset.clairOriginalType = script.getAttribute("type") ?? "__empty__";
    script.setAttribute("type", "application/x-clair-disabled");
  });
  documentNode.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name)) {
        element.setAttribute(`data-clair-event-${attribute.name.toLowerCase()}`, attribute.value);
        element.removeAttribute(attribute.name);
      }
    });
    const href = element.getAttribute("href");
    if (href && /^\s*javascript:/i.test(href)) {
      element.dataset.clairJavascriptHref = href;
      element.removeAttribute("href");
    }
  });
}

function editorBridgeScript() {
  return `
(() => {
  const channel = ${JSON.stringify(EDITOR_CHANNEL)};
  const send = (type, payload = {}) => parent.postMessage({ channel, type, ...payload }, "*");
  const body = document.body;
  body.contentEditable = "true";
  body.spellcheck = true;
  body.dataset.clairEditable = "true";

  const pageSelectors = [
    "[data-editor-page]",
    "[data-slide]",
    "[data-page]",
    ".report-page",
    ".slide",
    ".screen",
    "main > section",
    "body > section"
  ];
  const collectPageNodes = () => {
    for (const selector of pageSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .filter((node) => !node.closest("nav, header, footer") && (node.textContent || "").trim().length > 8);
      if (candidates.length < 2) continue;
      const groups = new Map();
      candidates.forEach((node) => {
        const parent = node.parentElement;
        if (!parent) return;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(node);
      });
      const peers = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0] || [];
      if (peers.length > 1) return peers;
    }
    return [body];
  };
  let pageNodes = collectPageNodes();
  let activePageIndex = 0;
  const renderPage = () => {
    pageNodes.forEach((page, index) => {
      page.classList.toggle("clair-editor-page-hidden", pageNodes.length > 1 && index !== activePageIndex);
    });
    send("page-info", { page: activePageIndex, pageCount: pageNodes.length });
  };
  const setPage = (value) => {
    pageNodes = collectPageNodes();
    activePageIndex = Math.max(0, Math.min(pageNodes.length - 1, Number(value) || 0));
    renderPage();
    pageNodes[activePageIndex]?.scrollIntoView({ block: "start" });
    pageNodes[activePageIndex]?.focus?.({ preventScroll: true });
  };

  const restoreDocument = () => {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("spellcheck");
    clone.querySelector("body")?.removeAttribute("data-clair-editable");
    clone.querySelectorAll(".clair-editor-page-hidden").forEach((page) => {
      page.classList.remove("clair-editor-page-hidden");
    });
    clone.querySelector("#clair-editor-style")?.remove();
    clone.querySelector("#clair-editor-bridge")?.remove();
    clone.querySelector("base[data-clair-editor-base]")?.remove();
    clone.querySelectorAll("meta[data-clair-editor-http-equiv]").forEach((meta) => {
      meta.setAttribute("http-equiv", meta.dataset.clairEditorHttpEquiv);
      meta.removeAttribute("data-clair-editor-http-equiv");
    });
    clone.querySelectorAll("script[data-clair-original-type]").forEach((script) => {
      const originalType = script.dataset.clairOriginalType;
      script.removeAttribute("data-clair-original-type");
      if (originalType === "__empty__") script.removeAttribute("type");
      else script.setAttribute("type", originalType);
    });
    clone.querySelectorAll("*").forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (!attribute.name.startsWith("data-clair-event-on")) return;
        element.setAttribute(attribute.name.slice("data-clair-event-".length), attribute.value);
        element.removeAttribute(attribute.name);
      });
      if (element.hasAttribute("data-clair-javascript-href")) {
        element.setAttribute("href", element.dataset.clairJavascriptHref);
        element.removeAttribute("data-clair-javascript-href");
      }
    });
    return "<!DOCTYPE html>\\n" + clone.outerHTML;
  };

  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.channel !== channel) return;
    const message = event.data;
    if (message.type === "command") {
      body.focus();
      document.execCommand(message.command, false, message.value ?? null);
      send("command-state", { command: message.command });
      return;
    }
    if (message.type === "set-page") {
      setPage(message.page);
      return;
    }
    if (message.type === "serialize") {
      send("serialized", { requestId: message.requestId, html: restoreDocument() });
    }
  });

  document.addEventListener("input", () => send("dirty"), true);
  document.addEventListener("selectionchange", () => {
    send("selection", {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline")
    });
  });
  renderPage();
  send("ready");
})();
`;
}

function buildEditorDocument(html, baseUrl) {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");
  documentNode.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach((meta) => {
    meta.dataset.clairEditorHttpEquiv =
      meta.getAttribute("http-equiv") || "Content-Security-Policy";
    meta.setAttribute("http-equiv", "x-clair-csp-disabled");
  });
  disableActiveContent(documentNode);

  const base = documentNode.createElement("base");
  base.href = baseUrl;
  base.dataset.clairEditorBase = "true";
  documentNode.head.prepend(base);

  const style = documentNode.createElement("style");
  style.id = "clair-editor-style";
  style.textContent = `
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    .clair-editor-page-hidden { display: none !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `;
  documentNode.head.append(style);

  const bridge = documentNode.createElement("script");
  bridge.id = "clair-editor-bridge";
  bridge.textContent = editorBridgeScript();
  documentNode.body.append(bridge);
  return `<!DOCTYPE html>\n${documentNode.documentElement.outerHTML}`;
}

function localReportHtml(report) {
  if (report.url) return "";
  if (report.savedHtml) return report.savedHtml;
  const htmlFile = (report.savedFiles || []).find((file) =>
    /\.html?$/i.test(file.name || ""));
  if (htmlFile?.content || htmlFile?.excerpt) {
    return htmlFile.content || htmlFile.excerpt;
  }
  return /<!doctype\s+html|<html[\s>]/i.test(report.savedContent || "")
    ? report.savedContent.trim()
    : "";
}

async function loadReport(report) {
  try {
    const localHtml = localReportHtml(report);
    const inferred = localHtml ? null : githubPagesTarget(report.url);
    let result = null;
    if (localHtml) {
      result = { html: localHtml, target: null };
    } else if (inferred) {
      try {
        result = await readGithubFile(inferred);
      } catch {
        // Production Pages can still be read directly when the repository path is unusual.
      }
    }
    if (!result && report.url) {
      const response = await fetch(report.url, { cache: "no-store" });
      if (!response.ok) throw new Error(`报告读取失败（HTTP ${response.status}）`);
      result = { html: await response.text(), target: inferred };
    }
    const unpacked = await unpackProtectedHtml(result.html);
    editor.protection = unpacked.protection;
    editor.target = result.target || inferred;
    let activeHtml = unpacked.html;
    const storedDraft = readStoredDraft(report.id);
    if (storedDraft?.html) {
      try {
        const restored = await unpackProtectedHtml(storedDraft.html);
        activeHtml = restored.html;
        editor.hasDraft = true;
        editor.draftHtml = restored.html;
        editor.draftAt = storedDraft.savedAt || "";
        if (storedDraft.baseFiles && editor.target) {
          editor.target.baseFiles = storedDraft.baseFiles;
        }
      } catch {
        clearStoredDraft(report.id);
      }
    }
    editor.html = activeHtml;
    editor.editorDocument = buildEditorDocument(
      activeHtml,
      report.url || window.location.href,
    );
    editor.status = "ready";
    editor.error = "";
  } catch (error) {
    editor.status = "error";
    editor.error = error?.message || "无法读取这份 HTML";
  } finally {
    editor.loadPromise = null;
    editor.render?.();
  }
}

function resetEditor() {
  const render = editor.render;
  const showToast = editor.showToast;
  Object.assign(editor, {
    reportId: "",
    reportTitle: "",
    reportUrl: "",
    status: "idle",
    error: "",
    html: "",
    editorDocument: "",
    dirty: false,
    hasDraft: false,
    draftHtml: "",
    draftAt: "",
    target: null,
    settingsOpen: false,
    publishConfirmOpen: false,
    pendingSave: false,
    saving: false,
    lastCommit: "",
    isLocal: false,
    saveLocal: null,
    protection: null,
    loadPromise: null,
    currentPage: 0,
    pageCount: 1,
    render,
    showToast,
  });
}

function editorFrame() {
  return document.querySelector(".report-editor-frame");
}

function sendCommand(command, value = null) {
  const frame = editorFrame();
  frame?.contentWindow?.postMessage({
    channel: EDITOR_CHANNEL,
    type: "command",
    command,
    value,
  }, "*");
}

function setEditorPage(page) {
  const frame = editorFrame();
  if (!frame?.contentWindow) return;
  const nextPage = Math.max(0, Math.min(editor.pageCount - 1, Number(page) || 0));
  editor.currentPage = nextPage;
  frame.contentWindow.postMessage({
    channel: EDITOR_CHANNEL,
    type: "set-page",
    page: nextPage,
  }, "*");
  updateEditorChrome();
}

function requestSerializedHtml() {
  const frame = editorFrame();
  if (!frame?.contentWindow) return Promise.reject(new Error("编辑画布尚未就绪"));
  const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      serializeRequests.delete(requestId);
      reject(new Error("读取编辑内容超时"));
    }, 10000);
    serializeRequests.set(requestId, {
      resolve: (html) => {
        clearTimeout(timer);
        resolve(html);
      },
    });
    frame.contentWindow.postMessage({
      channel: EDITOR_CHANNEL,
      type: "serialize",
      requestId,
    }, "*");
  });
}

function safeFilename(title) {
  const cleaned = String(title || "report")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${cleaned || "report"}.html`;
}

function downloadHtml(html, title) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename(title);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyReportLink(url) {
  await navigator.clipboard.writeText(url);
}

function htmlWithPreviewBase(html, baseUrl) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelector("base[data-clair-preview-base]")?.remove();
  const base = documentNode.createElement("base");
  base.href = baseUrl;
  base.dataset.clairPreviewBase = "true";
  documentNode.head.prepend(base);
  return `<!DOCTYPE html>\n${documentNode.documentElement.outerHTML}`;
}

function openDraftPreview(report) {
  if (!editor.hasDraft || !editor.draftHtml) {
    throw new Error("请先暂存当前修订，再另开预览");
  }
  const blob = new Blob([
    htmlWithPreviewBase(editor.draftHtml, report.url || window.location.href),
  ], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const preview = window.open(url, "_blank");
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error("浏览器拦截了新窗口，请允许弹窗后重试");
  }
  preview.opener = null;
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function performStash(report, { silent = false } = {}) {
  const plainHtml = await requestSerializedHtml();
  const outputHtml = await repackProtectedHtml(plainHtml);
  const savedAt = new Date().toISOString();
  try {
    sessionStorage.setItem(
      draftStorageKey(report.id),
      JSON.stringify({
        reportId: report.id,
        reportUrl: report.url,
        savedAt,
        baseFiles: targetShaMap(),
        html: outputHtml,
      }),
    );
  } catch {
    throw new Error("浏览器暂存空间不足，请先下载 HTML 备份");
  }
  editor.html = plainHtml;
  editor.draftHtml = plainHtml;
  editor.draftAt = savedAt;
  editor.hasDraft = true;
  editor.dirty = false;
  editor.lastCommit = "";
  updateEditorChrome();
  if (!silent) {
    editor.showToast?.(
      editor.isLocal
        ? "已暂存在当前浏览器会话，尚未写回成果库"
        : "已暂存在当前浏览器会话，尚未更新 GitHub",
    );
  }
  return plainHtml;
}

async function performLocalSave(report) {
  if (editor.saving || !editor.saveLocal) return;
  editor.saving = true;
  updateEditorChrome();
  try {
    const html = editor.dirty
      ? await performStash(report, { silent: true })
      : editor.draftHtml || await requestSerializedHtml();
    await editor.saveLocal(html);
    editor.html = html;
    editor.dirty = false;
    editor.hasDraft = false;
    editor.draftHtml = "";
    editor.draftAt = "";
    editor.lastCommit = "local";
    clearStoredDraft(report.id);
    editor.showToast?.("已更新成果库中的 HTML");
  } catch (error) {
    editor.showToast?.(error?.message || "保存失败，请下载 HTML 备份");
  } finally {
    editor.saving = false;
    updateEditorChrome();
  }
}

async function saveToGithub(plainHtml) {
  const target = editor.target;
  if (!target?.owner || !target.repository || !target.path || !target.branch) {
    throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");
  }
  if (!editor.token) throw new Error("请先提供 GitHub Fine-grained Token");
  const outputHtml = await repackProtectedHtml(plainHtml);
  const mirrorPaths = (target.mirrors || []).map((item) => item.path);
  const paths = unique([
    ...mirrorPaths.filter((path) => path.startsWith("public/")),
    ...mirrorPaths.filter((path) => !path.startsWith("public/") && path !== target.path),
    target.path,
  ]);
  let commit = "";
  const completed = [];
  for (const path of paths) {
    try {
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const endpoint = `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repository)}/contents/${encodedPath}`;
      const current = await githubRequest(`${endpoint}?ref=${encodeURIComponent(target.branch)}`, {
        token: editor.token,
      });
      const expectedSha = targetShaMap(target)[path];
      if (expectedSha && current.sha !== expectedSha) {
        throw new Error(`生产文件 ${path} 已在本次编辑后更新，请重新打开报告合并修改`);
      }
      const payload = await githubRequest(endpoint, {
        token: editor.token,
        method: "PUT",
        body: {
          message: `Update ${editor.reportTitle} from Clair's Studio`,
          content: encodeBase64Utf8(outputHtml),
          sha: current.sha,
          branch: target.branch,
        },
      });
      commit = payload?.commit?.sha || commit;
      target.baseFiles = {
        ...targetShaMap(target),
        [path]: payload?.content?.sha || current.sha,
      };
      completed.push(path);
    } catch (error) {
      if (completed.length) {
        throw new Error(`已更新 ${completed.join("、")}，但 ${path} 同步失败：${error.message}`);
      }
      throw error;
    }
  }
  return { commit, files: completed.length };
}

async function performSave(report) {
  if (editor.saving) return;
  editor.saving = true;
  updateEditorChrome();
  try {
    const html = editor.dirty
      ? await performStash(report, { silent: true })
      : editor.draftHtml || await requestSerializedHtml();
    const result = await saveToGithub(html);
    editor.html = html;
    editor.dirty = false;
    editor.hasDraft = false;
    editor.draftHtml = "";
    editor.draftAt = "";
    editor.lastCommit = result.commit;
    clearStoredDraft(report.id);
    editor.showToast?.(
      result.files > 1
        ? `已同步 ${result.files} 个 GitHub 文件，Pages 正在更新`
        : "已提交 GitHub，Pages 正在更新",
    );
  } catch (error) {
    editor.showToast?.(error?.message || "保存失败，请下载 HTML 备份");
  } finally {
    editor.saving = false;
    updateEditorChrome();
  }
}

function settingsMarkup(escapeHtml) {
  const target = editor.target || {
    owner: "ClairKu",
    repository: "",
    branch: "main",
    path: "",
  };
  return `
    <div class="dialog-backdrop editor-settings-backdrop" ${editor.settingsOpen ? "" : "hidden"}>
      <form class="dialog editor-settings-dialog" id="editor-settings-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">GITHUB SAVE PERMISSION</span>
            <h2>设置安全保存</h2>
          </div>
          <button type="button" data-editor-action="close-settings" aria-label="关闭">×</button>
        </div>
        <div class="editor-security-note">
          <strong>Token 只保留在当前页面内存</strong>
          <span>刷新或关闭页面后自动清除，不写入 localStorage，也不会传给被编辑的 HTML。</span>
        </div>
        <div class="editor-target-grid">
          <label>GitHub 所有者
            <input name="owner" value="${escapeHtml(target.owner || "ClairKu")}" required />
          </label>
          <label>仓库
            <input name="repository" value="${escapeHtml(target.repository || "")}" placeholder="clair-ai-studio" required />
          </label>
          <label>分支
            <input name="branch" value="${escapeHtml(target.branch || "main")}" required />
          </label>
          <label class="editor-path-field">HTML 文件路径
            <input name="path" value="${escapeHtml(target.path || "")}" placeholder="docs/reports/example/index.html" required />
          </label>
        </div>
        <label>Fine-grained personal access token
          <input class="github-token-input" name="github-token-not-password" type="text" value=""
            autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-1p-ignore
            placeholder="${editor.token ? "已连接；留空可继续使用当前 Token" : "github_pat_…"}" ${editor.token ? "" : "required"} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">Cancel</button>
          <button type="submit" class="primary-button">${editor.pendingSave ? "Connect & save" : "Save settings"}</button>
        </div>
      </form>
    </div>`;
}

function publishConfirmMarkup(escapeHtml) {
  const target = editor.target
    ? `${editor.target.owner}/${editor.target.repository} · ${editor.target.path}`
    : "尚未识别 GitHub 文件路径";
  return `
    <div class="dialog-backdrop editor-publish-backdrop" ${editor.publishConfirmOpen ? "" : "hidden"}>
      <section class="dialog compact-dialog editor-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-confirm-title">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">PRODUCTION ARCHIVE</span>
            <h2 id="publish-confirm-title">更新 GitHub 生产档案？</h2>
          </div>
          <button type="button" data-editor-action="close-publish" aria-label="关闭">×</button>
        </div>
        <div class="editor-publish-summary">
          <span class="editor-revision-status is-staged">已暂存 · 待推送生产</span>
          <p>暂存内容仍只在当前浏览器会话。确认后才会提交 GitHub，并更新原报告生产链接。</p>
        </div>
        <div class="editor-publish-target">
          <small>目标文件</small>
          <strong>${escapeHtml(target)}</strong>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-publish">Continue editing</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">Publish</button>
        </div>
      </section>
    </div>`;
}

function showSettings({ pendingSave = false } = {}) {
  editor.settingsOpen = true;
  editor.pendingSave = pendingSave;
  const backdrop = document.querySelector(".editor-settings-backdrop");
  if (!backdrop) return;
  backdrop.hidden = false;
  const form = backdrop.querySelector("#editor-settings-form");
  const target = editor.target || {};
  if (form) {
    form.elements.owner.value = target.owner || "ClairKu";
    form.elements.repository.value = target.repository || "";
    form.elements.branch.value = target.branch || "main";
    form.elements.path.value = target.path || "";
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.textContent = pendingSave ? "Connect & save" : "Save settings";
  }
}

function hideSettings() {
  editor.settingsOpen = false;
  editor.pendingSave = false;
  const backdrop = document.querySelector(".editor-settings-backdrop");
  if (backdrop) backdrop.hidden = true;
}

function showPublishConfirm() {
  editor.publishConfirmOpen = true;
  const backdrop = document.querySelector(".editor-publish-backdrop");
  if (backdrop) backdrop.hidden = false;
}

function hidePublishConfirm() {
  editor.publishConfirmOpen = false;
  const backdrop = document.querySelector(".editor-publish-backdrop");
  if (backdrop) backdrop.hidden = true;
}

export function isEditingReport(reportId = "") {
  return Boolean(editor.reportId && (!reportId || editor.reportId === reportId));
}

export function beginReportEditing(report, { render, showToast, saveLocal = null }) {
  resetEditor();
  Object.assign(editor, {
    reportId: report.id,
    reportTitle: report.title,
    reportUrl: report.url,
    status: "loading",
    render,
    showToast,
    isLocal: Boolean(localReportHtml(report) && saveLocal),
    saveLocal,
    currentPage: 0,
    pageCount: 1,
  });
  render();
  editor.loadPromise = loadReport(report);
}

export function reportEditorMarkup(report, escapeHtml) {
  const targetLabel = editor.isLocal
    ? "本地成果 · 保存在当前浏览器"
    : editor.target
    ? `${editor.target.owner}/${editor.target.repository} · ${editor.target.path}${editor.target.mirrors?.length ? ` · 同步 ${editor.target.mirrors.length + 1} 处` : ""}`
    : "尚未识别 GitHub 源文件";
  const revision = revisionState();
  const toolbar = editor.status === "ready"
    ? `
      <div class="editor-toolbar" role="toolbar" aria-label="文本排版工具">
        <select data-editor-format aria-label="段落格式">
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
          <option value="blockquote">引用</option>
        </select>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="bold" title="粗体"><strong>B</strong></button>
        <button type="button" data-editor-command="italic" title="斜体"><em>I</em></button>
        <button type="button" data-editor-command="underline" title="下划线"><u>U</u></button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="insertUnorderedList" title="项目列表">• List</button>
        <button type="button" data-editor-command="insertOrderedList" title="编号列表">1. List</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="justifyLeft" title="左对齐">Left</button>
        <button type="button" data-editor-command="justifyCenter" title="居中">Center</button>
        <button type="button" data-editor-command="justifyRight" title="右对齐">Right</button>
        <button type="button" data-editor-command="justifyFull" title="两端对齐">Justify</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-action="link" title="添加链接">🔗 Link</button>
        <button type="button" data-editor-command="unlink" title="移除链接">Unlink</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="undo" title="撤销">↶</button>
        <button type="button" data-editor-command="redo" title="重做">↷</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="copy" title="复制选中内容">Copy</button>
        <button type="button" data-editor-action="paste" title="粘贴纯文本">Paste</button>
        <button type="button" data-editor-command="delete" title="删除选中内容">Delete</button>
        <span class="editor-divider"></span>
        <span class="editor-page-controls" data-editor-page-controls hidden>
          <button type="button" data-editor-action="prev-page" title="上一页">←</button>
          <span data-editor-page-counter>1 / 1</span>
          <button type="button" data-editor-action="next-page" title="下一页">→</button>
        </span>
      </div>`
    : "";
  const body = editor.status === "loading"
    ? `<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${editor.isLocal ? "修改后可保存回成果库，也可下载 HTML。" : "会自动识别对应 GitHub 仓库与源文件。"}</p></div>`
    : editor.status === "error"
      ? `<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${escapeHtml(editor.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">Retry</button><button class="primary-button" type="button" data-editor-action="download-published">Download source HTML</button></div></div>`
      : `<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${escapeHtml(report.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${escapeAttribute(editor.editorDocument)}"></iframe></div>`;
  const icon = (name) => ({
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>`,
    settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>`,
    stash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>`,
    preview: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,
    download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>`,
    copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`,
    publish: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>`,
  })[name];
  const stashLabel = !editor.dirty && editor.hasDraft ? "已暂存" : "暂存修改";
  const publishLabel = editor.saving
    ? editor.isLocal ? "正在保存到成果库" : "正在推送生产"
    : editor.isLocal ? "保存到成果库" : "推送生产";
  return `
    <main class="reader-shell report-editor-shell compact-editor-shell">
      <header class="reader-header editor-header compact-reader-header compact-editor-header">
        <button class="reader-icon-button back-button" type="button" data-editor-action="exit"
          aria-label="退出编辑" title="退出编辑">${icon("back")}</button>
        <div class="reader-title">
          <strong>${escapeHtml(report.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${revision.tone}">${escapeHtml(revision.label)}</span>
            <span class="editor-target-label" title="${escapeHtml(targetLabel)}">${escapeHtml(targetLabel)}</span>
          </div>
        </div>
        <div class="reader-actions editor-actions compact-reader-actions compact-editor-actions" aria-label="编辑操作">
          ${editor.isLocal ? "" : `
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${icon("settings")}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${stashLabel}" title="${stashLabel}"
            ${editor.status !== "ready" || editor.saving || !editor.dirty ? "disabled" : ""}>${icon("stash")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${editor.status !== "ready" || !editor.hasDraft ? "disabled" : ""}>${icon("preview")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${icon("download")}</button>
          ${report.url ? `
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${icon("copy")}</button>` : ""}
          <button class="reader-icon-button publish-icon-action${editor.saving ? " is-saving" : ""}" type="button"
            data-editor-action="publish" aria-label="${publishLabel}" title="${publishLabel}"
            ${editor.status !== "ready" || editor.saving || (!editor.dirty && !editor.hasDraft) ? "disabled" : ""}>${icon("publish")}</button>
        </div>
      </header>
      ${toolbar}
      ${body}
      ${settingsMarkup(escapeHtml)}
      ${publishConfirmMarkup(escapeHtml)}
    </main>`;
}

export function bindReportEditor(report) {
  if (!isEditingReport(report.id)) return;
  if (!hooksBound) {
    hooksBound = true;
    window.addEventListener("message", (event) => {
      const frame = editorFrame();
      if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
      if (event.data?.channel !== EDITOR_CHANNEL) return;
      if (event.data.type === "dirty") {
        editor.dirty = true;
        editor.lastCommit = "";
        updateEditorChrome();
      }
      if (event.data.type === "page-info") {
        editor.pageCount = Math.max(1, Number(event.data.pageCount) || 1);
        editor.currentPage = Math.max(0, Math.min(editor.pageCount - 1, Number(event.data.page) || 0));
        updateEditorChrome();
      }
      if (event.data.type === "serialized") {
        const pending = serializeRequests.get(event.data.requestId);
        if (!pending) return;
        serializeRequests.delete(event.data.requestId);
        pending.resolve(event.data.html);
      }
      if (event.data.type === "selection") {
        document.querySelectorAll("[data-editor-command]").forEach((button) => {
          const command = button.dataset.editorCommand;
          if (!["bold", "italic", "underline"].includes(command)) return;
          button.classList.toggle("active", Boolean(event.data[command]));
        });
      }
    });
    window.addEventListener("beforeunload", (event) => {
      if (!editor.reportId || !editor.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !editor.reportId) return;
      if (editor.publishConfirmOpen) hidePublishConfirm();
      else if (editor.settingsOpen) hideSettings();
    });
  }

  document.querySelectorAll("[data-editor-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => sendCommand(button.dataset.editorCommand));
  });

  const format = document.querySelector("[data-editor-format]");
  format?.addEventListener("change", () => {
    sendCommand("formatBlock", format.value);
    format.value = "p";
  });

  document.querySelectorAll("[data-editor-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.editorAction;
      if (action === "exit") {
        if (editor.dirty && !confirm("还有未暂存的修改。确定退出编辑模式吗？")) return;
        const render = editor.render;
        resetEditor();
        render?.();
      } else if (action === "settings") {
        showSettings();
      } else if (action === "close-settings") {
        hideSettings();
      } else if (action === "stash") {
        try {
          await performStash(report);
        } catch (error) {
          editor.showToast?.(error?.message || "暂存失败，请下载 HTML 备份");
        }
      } else if (action === "preview") {
        try {
          openDraftPreview(report);
          editor.showToast?.("已在新窗口打开暂存修订");
        } catch (error) {
          editor.showToast?.(error?.message || "无法打开预览");
        }
      } else if (action === "publish") {
        try {
          if (editor.isLocal) {
            await performLocalSave(report);
            return;
          }
          if (editor.dirty) await performStash(report, { silent: true });
          if (!editor.hasDraft) {
            editor.showToast?.("当前没有待推送的修订");
            return;
          }
          showPublishConfirm();
        } catch (error) {
          editor.showToast?.(error?.message || "暂存失败，请下载 HTML 备份");
        }
      } else if (action === "close-publish") {
        hidePublishConfirm();
      } else if (action === "confirm-publish") {
        hidePublishConfirm();
        if (!editor.token || !editor.target?.path) showSettings({ pendingSave: true });
        else await performSave(report);
      } else if (action === "download") {
        try {
          const plainHtml = await requestSerializedHtml();
          downloadHtml(await repackProtectedHtml(plainHtml), report.title);
          editor.showToast?.("HTML 已下载");
        } catch (error) {
          editor.showToast?.(error?.message || "下载失败");
        }
      } else if (action === "download-published") {
        await downloadPublishedReport(report, editor.showToast);
      } else if (action === "share") {
        try {
          await copyReportLink(report.url);
          editor.showToast?.("报告链接已复制");
        } catch {
          editor.showToast?.("复制失败，请从地址栏复制");
        }
      } else if (action === "link") {
        const link = prompt("输入链接地址（https://…）");
        if (!link) return;
        try {
          const url = new URL(link);
          if (!["http:", "https:", "mailto:"].includes(url.protocol)) throw new Error();
          sendCommand("createLink", url.href);
        } catch {
          editor.showToast?.("请输入有效的 http、https 或 mailto 链接");
        }
      } else if (action === "paste") {
        try {
          const text = await navigator.clipboard.readText();
          if (!text) return;
          sendCommand("insertText", text);
        } catch {
          editor.showToast?.("请在编辑区域使用 ⌘V 粘贴");
        }
      } else if (action === "prev-page") {
        setEditorPage(editor.currentPage - 1);
      } else if (action === "next-page") {
        setEditorPage(editor.currentPage + 1);
      } else if (action === "retry") {
        editor.status = "loading";
        editor.error = "";
        editor.render?.();
        editor.loadPromise ||= loadReport(report);
      }
    });
  });

  document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target !== backdrop) return;
      if (backdrop.classList.contains("editor-settings-backdrop")) hideSettings();
      else hidePublishConfirm();
    });
  });

  const settingsForm = document.getElementById("editor-settings-form");
  settingsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(settingsForm);
    const nextToken = String(data.get("github-token-not-password") || "").trim();
    if (nextToken) editor.token = nextToken;
    const nextPath = String(data.get("path") || "").trim().replace(/^\/+/, "");
    editor.target = {
      ...(editor.target || {}),
      owner: String(data.get("owner") || "").trim(),
      repository: String(data.get("repository") || "").trim(),
      branch: String(data.get("branch") || "main").trim(),
      path: nextPath,
      mirrors: nextPath === editor.target?.path ? editor.target?.mirrors || [] : [],
      source: "manual",
    };
    const shouldSave = editor.pendingSave;
    hideSettings();
    const targetLabel = document.querySelector(".editor-target-label");
    if (targetLabel) {
      const value = `${editor.target.owner}/${editor.target.repository} · ${editor.target.path}`;
      targetLabel.textContent = value;
      targetLabel.title = value;
    }
    editor.showToast?.("保存权限已连接");
    if (shouldSave) await performSave(report);
  });
}

export async function downloadPublishedReport(report, showToast) {
  try {
    const response = await fetch(report.url, { cache: "no-store" });
    if (!response.ok) throw new Error();
    downloadHtml(await response.text(), report.title);
    showToast?.("HTML 已下载");
  } catch {
    window.open(report.url, "_blank", "noopener,noreferrer");
    showToast?.("浏览器限制了直接下载，已打开原页面");
  }
}

export async function sharePublishedReport(report, showToast) {
  try {
    await copyReportLink(report.url);
    showToast?.("报告链接已复制");
  } catch {
    showToast?.("复制失败，请从地址栏复制");
  }
}
