import {
  cardSearchText,
  createReportRecord,
  extractFile,
  extractKnowledgeCards,
  inferTitle,
  linkKnowledgeGraph,
  normalizeText,
  reportSearchText,
} from "./extractor.js";
import {
  deleteOriginalFile,
  exportState,
  importStateFile,
  loadOriginalFile,
  loadState,
  saveOriginalFile,
  saveState,
} from "./storage.js";

const app = document.getElementById("app");
const DEFAULT_CATEGORIES = ["AI 与 Agent", "用户与增长", "产品与体验", "投研与市场", "经营与组织", "其他"];
const TYPE_LABELS = { metric: "关键数据", risk: "风险信号", opportunity: "机会判断", action: "行动建议", insight: "核心结论" };
const FORMAT_LABELS = { pdf: "PDF", word: "DOC", sheet: "XLS", slides: "PPT", html: "HTML", video: "VIDEO", audio: "AUDIO", image: "IMAGE", url: "URL", text: "TEXT", studio: "REPORT" };

let state = {
  version: 1,
  reports: [],
  cards: [],
  categories: DEFAULT_CATEGORIES,
  lastDailySync: null,
};

let ui = {
  view: "overview",
  category: "all",
  type: "all",
  sort: "newest",
  query: "",
  drawer: null,
  ingestMode: "text",
  ingestBusy: false,
  ingestStatus: "粘贴文字、网址，或拖入档案",
  pendingFiles: [],
};

let toastTimer;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatDate(value, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function formatBytes(bytes = 0) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function shortText(value = "", limit = 140) {
  const text = normalizeText(value).replace(/\n+/g, " ");
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 3600);
}

function cardCount(reportId) {
  return state.cards.filter((card) => card.reportId === reportId).length;
}

function reportById(id) {
  return state.reports.find((report) => report.id === id);
}

function cardById(id) {
  return state.cards.find((card) => card.id === id);
}

function activeReports() {
  return state.reports.filter((report) => !report.archived);
}

function visibleReports() {
  const query = ui.query.trim().toLowerCase();
  const reports = state.reports.filter((report) => ui.view === "archive" ? report.archived : !report.archived);
  const filtered = reports.filter((report) => {
    if (ui.category !== "all" && report.category !== ui.category) return false;
    if (query && !reportSearchText(report, state.cards).includes(query)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    if (ui.sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (ui.sort === "cards") return cardCount(b.id) - cardCount(a.id);
    if (ui.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function visibleCards() {
  const reportIds = new Set(visibleReports().map((report) => report.id));
  const query = ui.query.trim().toLowerCase();
  const cards = state.cards.filter((card) => {
    const report = reportById(card.reportId);
    if (!reportIds.has(card.reportId)) return false;
    if (ui.type !== "all" && card.type !== ui.type) return false;
    if (query && !cardSearchText(card, report).includes(query)) return false;
    return true;
  });
  return cards.sort((a, b) => {
    if (ui.sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (ui.sort === "title") return a.title.localeCompare(b.title, "zh-CN");
    return new Date(b.createdAt) - new Date(a.createdAt) || (a.order || 0) - (b.order || 0);
  });
}

function ensureCategories() {
  state.categories = [...new Set([...DEFAULT_CATEGORIES, ...(state.categories || []), ...state.reports.map((report) => report.category).filter(Boolean)])];
}

async function persist() {
  ensureCategories();
  state = await saveState(state);
}

function mergeDailyFeed(feed) {
  if (!feed?.reports?.length) return false;
  let changed = false;
  const incomingReportIds = new Set(feed.reports.map((report) => report.id));
  for (const report of feed.reports) {
    const index = state.reports.findIndex((item) => item.id === report.id);
    if (index < 0) {
      state.reports.push({ ...report, origin: "daily", archived: false });
      changed = true;
    } else if (state.reports[index].origin === "daily" && !state.reports[index].userEdited) {
      state.reports[index] = { ...state.reports[index], ...report, archived: state.reports[index].archived, origin: "daily" };
    }
  }
  const userCards = state.cards.filter((card) => !incomingReportIds.has(card.reportId) || card.userEdited);
  const incomingCards = (feed.cards || []).map((card) => ({ ...card, origin: "daily" }));
  const merged = [...userCards];
  for (const card of incomingCards) {
    if (!merged.some((item) => item.id === card.id)) merged.push(card);
  }
  state.cards = merged;
  state.lastDailySync = feed.generatedAt || new Date().toISOString();
  return changed;
}

async function syncDailyFeed({ quiet = false } = {}) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const response = await fetch(`./data/latest.json?day=${day}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = await response.json();
    mergeDailyFeed(feed);
    const linked = linkKnowledgeGraph(state.reports, state.cards);
    state.reports = linked.reports;
    state.cards = linked.cards;
    await persist();
    if (!quiet) showToast(`已同步工作台最新报告 · ${formatDate(state.lastDailySync, true)}`);
  } catch (error) {
    if (!quiet) showToast(`暂时无法同步线上资料：${error.message}`);
  }
}

function navMarkup() {
  const reports = activeReports();
  const categoryRows = state.categories.map((category) => {
    const count = reports.filter((report) => report.category === category).length;
    if (!count) return "";
    return `<button class="nav-button ${ui.category === category ? "is-active" : ""}" data-category="${escapeHtml(category)}">
      <span class="category-dot"></span><span class="category-name">${escapeHtml(category)}</span><span class="nav-count">${count}</span>
    </button>`;
  }).join("");
  const rows = [
    ["overview", "今日精选", Math.min(state.cards.length, 12)],
    ["reports", "全部报告", reports.length],
    ["cards", "关键卡片", state.cards.filter((card) => !reportById(card.reportId)?.archived).length],
    ["relations", "关联图谱", state.cards.filter((card) => card.relatedCardIds?.length).length],
    ["archive", "已归档", state.reports.filter((report) => report.archived).length],
  ].map(([view, label, count]) => `<button class="nav-button ${ui.view === view && ui.category === "all" ? "is-active" : ""}" data-view="${view}">
    <span class="category-name">${label}</span><span class="nav-count">${count}</span>
  </button>`).join("");
  return `<aside class="sidebar" aria-label="资料库导航">
    <section class="sidebar-section"><p class="sidebar-label">Workspace</p>${rows}</section>
    <section class="sidebar-section"><p class="sidebar-label">Categories</p>${categoryRows}</section>
    <div class="privacy-note"><strong>原档案留在你的浏览器</strong>上传文件使用 IndexedDB 保存，不会自动传到公开网站；每日线上同步只读取已发布到 Clair’s Studio 的公开报告。</div>
  </aside>`;
}

function ingestBodyMarkup() {
  if (ui.ingestMode === "url") {
    return `<div class="ingest-body">
      <label class="sr-only" for="ingest-url">报告或影片网址</label>
      <input id="ingest-url" class="ingest-field" type="url" placeholder="贴上报告、文章或影片 URL" />
      <label class="sr-only" for="ingest-url-text">可选的全文或字幕</label>
      <textarea id="ingest-url-text" class="ingest-text" placeholder="若网页限制读取，可把正文、摘要或影片字幕贴在这里（建议）"></textarea>
    </div>`;
  }
  if (ui.ingestMode === "file") {
    const files = ui.pendingFiles.length ? ui.pendingFiles.map((file) => `${file.name} · ${formatBytes(file.size)}`).join("；") : "PDF、Word、Excel、PPT、网页、字幕、音影片或任意档案";
    return `<div class="ingest-body"><label class="drop-zone" id="drop-zone" for="ingest-files">
      <input id="ingest-files" type="file" multiple />
      <strong>${ui.pendingFiles.length ? `已选择 ${ui.pendingFiles.length} 个档案` : "点击选择，或直接拖进来"}</strong>
      <small>${escapeHtml(files)}</small>
    </label></div>`;
  }
  return `<div class="ingest-body">
    <label class="sr-only" for="ingest-text">粘贴报告或内容</label>
    <textarea id="ingest-text" class="ingest-text" placeholder="把报告、会议纪要、文章、研究摘要或影片字幕直接贴进来…"></textarea>
  </div>`;
}

function heroMarkup() {
  const lastSync = state.lastDailySync ? formatDate(state.lastDailySync, true) : "准备同步";
  return `<section class="hero">
    <div class="hero-intro">
      <p class="eyebrow">Clair’s Knowledge Studio · Evidence First</p>
      <h1>把整份报告，变成能回到证据的关键卡。</h1>
      <p class="hero-lead">导入材料后，不只做摘要：每个数字、判断、风险与行动都保留原文片段、段落位置、完整正文和关联来源，方便搜索、比较与再利用。</p>
      <div class="hero-meta"><span class="meta-pill is-live">每日自动同步 · ${escapeHtml(lastSync)}</span><span class="meta-pill">浏览器私密保存</span><span class="meta-pill">PDF / Office / URL / 字幕</span></div>
    </div>
    <form class="ingest-panel" id="ingest-form">
      <div class="ingest-title"><div><small>NEW MATERIAL</small><h2>加入一份材料</h2></div><small>自动抽取与连线</small></div>
      <div class="ingest-mode">
        ${[["text", "贴内容"], ["url", "贴网址"], ["file", "传档案"]].map(([mode, label]) => `<button type="button" class="${ui.ingestMode === mode ? "is-active" : ""}" data-ingest-mode="${mode}">${label}</button>`).join("")}
      </div>
      ${ingestBodyMarkup()}
      <div class="ingest-footer"><span class="ingest-status" id="ingest-status">${escapeHtml(ui.ingestStatus)}</span><button class="primary-button extract-button" type="submit" ${ui.ingestBusy ? "disabled" : ""}>${ui.ingestBusy ? "处理中…" : "抽取关键卡"}</button></div>
    </form>
  </section>`;
}

function summaryMarkup() {
  const reports = activeReports();
  const activeCards = state.cards.filter((card) => !reportById(card.reportId)?.archived);
  const linked = activeCards.filter((card) => card.relatedCardIds?.length).length;
  const newest = reports.map((report) => new Date(report.createdAt).getTime()).filter(Number.isFinite).sort((a, b) => b - a)[0];
  return `<section class="summary-grid" aria-label="知识库摘要">
    <article class="stat-card is-teal"><strong>${reports.length}</strong><small>份可检索报告</small></article>
    <article class="stat-card is-gold"><strong>${activeCards.length}</strong><small>张证据卡片</small></article>
    <article class="stat-card is-coral"><strong>${linked}</strong><small>张已有知识关联</small></article>
    <article class="stat-card is-blue"><strong>${newest ? formatDate(newest).replace(/\d{4}年/, "") : "—"}</strong><small>最近一份报告</small></article>
  </section>`;
}

function cardMarkup(card, index = 0) {
  const report = reportById(card.reportId);
  if (!report) return "";
  const related = card.relatedCardIds?.length || 0;
  const wide = index % 7 === 4;
  return `<article class="knowledge-card ${wide ? "is-wide" : ""}" data-open-card="${escapeHtml(card.id)}">
    <div class="card-top"><span class="card-type type-${escapeHtml(card.type)}"><span class="type-dot"></span>${escapeHtml(card.label || TYPE_LABELS[card.type] || "核心结论")}</span><span class="card-source" title="${escapeHtml(report.title)}">${escapeHtml(report.title)}</span></div>
    <h3>${escapeHtml(card.title)}</h3>
    <p class="card-summary">${escapeHtml(shortText(card.summary, wide ? 210 : 150))}</p>
    ${card.metric ? `<div class="metric-row"><span class="metric-value">${escapeHtml(card.metric)}</span><span class="metric-context">来自原文中的可核对数据，不代表跨报告统一口径</span></div>` : ""}
    <div class="evidence-strip"><p class="evidence-quote">“${escapeHtml(shortText(card.quote || card.summary, 115))}”</p><div class="evidence-meta"><span>${escapeHtml(card.anchor || "原文片段")}</span><span>${related ? `${related} 张关联卡` : "待建立关联"}</span></div>
      <div class="card-actions"><button class="chip-button" type="button" data-open-card="${escapeHtml(card.id)}">看证据</button><button class="chip-button" type="button" data-open-report="${escapeHtml(report.id)}">看全文</button>${related ? `<button class="chip-button" type="button" data-open-card="${escapeHtml(card.relatedCardIds[0])}">关联卡</button>` : ""}</div>
    </div>
  </article>`;
}

function reportMarkup(report) {
  const kind = report.kind || "text";
  const tags = (report.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  return `<article class="report-row" data-open-report="${escapeHtml(report.id)}">
    <div class="file-badge is-${escapeHtml(kind)}">${escapeHtml(FORMAT_LABELS[kind] || String(kind).slice(0, 6).toUpperCase())}</div>
    <div class="report-copy"><h3>${escapeHtml(report.title)}</h3><div class="report-meta"><span>${escapeHtml(report.category || "其他")}</span><span>${formatDate(report.createdAt)}</span>${tags}</div></div>
    <div class="report-card-count">${cardCount(report.id)} 张关键卡</div>
  </article>`;
}

function relationsMarkup() {
  const tokenMap = new Map();
  for (const card of visibleCards()) {
    for (const tag of card.tags || []) {
      if (String(tag).length < 2) continue;
      const bucket = tokenMap.get(tag) || [];
      bucket.push(card);
      tokenMap.set(tag, bucket);
    }
  }
  const clusters = [...tokenMap.entries()]
    .filter(([, cards]) => cards.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 9);
  return `<section class="relation-panel"><div class="relation-legend"><span class="legend-report">报告</span><span class="legend-card">关键卡</span><span class="legend-shared">共同主题连接</span></div>
    <div class="relation-canvas">${clusters.length ? clusters.map(([tag, cards]) => {
      const reportCount = new Set(cards.map((card) => card.reportId)).size;
      return `<article class="relation-cluster"><strong>${escapeHtml(tag)}</strong><small>${cards.length} 张卡 · ${reportCount} 份报告</small><div class="relation-items">${cards.slice(0, 4).map((card) => `<button type="button" data-open-card="${escapeHtml(card.id)}">${escapeHtml(shortText(card.title, 12))}</button>`).join("")}</div></article>`;
    }).join("") : `<div class="empty-state"><h3>再加入一份材料，就会长出关联</h3><p>共同主题、关键词和报告关系会自动聚成知识簇。</p></div>`}</div>
  </section>`;
}

function toolbarMarkup() {
  return `<div class="toolbar">
    <select id="type-filter" aria-label="卡片类型"><option value="all">全部类型</option>${Object.entries(TYPE_LABELS).map(([value, label]) => `<option value="${value}" ${ui.type === value ? "selected" : ""}>${label}</option>`).join("")}</select>
    <select id="sort-filter" aria-label="排序方式"><option value="newest" ${ui.sort === "newest" ? "selected" : ""}>最新优先</option><option value="oldest" ${ui.sort === "oldest" ? "selected" : ""}>最早优先</option><option value="cards" ${ui.sort === "cards" ? "selected" : ""}>卡片最多</option><option value="title" ${ui.sort === "title" ? "selected" : ""}>标题排序</option></select>
    <span class="toolbar-spacer"></span><span class="result-count">${visibleReports().length} 份报告 · ${visibleCards().length} 张卡</span>
  </div>`;
}

function contentMarkup() {
  const cards = visibleCards();
  const reports = visibleReports();
  let title = "今日最新知识";
  let subtitle = "最新报告与高信号关键卡会在这里自动更新";
  let body = "";
  if (ui.view === "overview") body = `<section class="knowledge-grid">${cards.slice(0, 8).map(cardMarkup).join("") || emptyMarkup()}</section>`;
  if (ui.view === "cards") { title = "关键卡片"; subtitle = "按数字、结论、风险、机会与行动过滤"; body = `<section class="knowledge-grid">${cards.map(cardMarkup).join("") || emptyMarkup()}</section>`; }
  if (ui.view === "reports") { title = "报告清单"; subtitle = "上传材料、线上报告与影片资料的统一目录"; body = `<section class="report-list">${reports.map(reportMarkup).join("") || emptyMarkup("还没有符合条件的报告")}</section>`; }
  if (ui.view === "archive") { title = "已归档"; subtitle = "可恢复的资料，不会从知识库永久消失"; body = `<section class="report-list">${reports.map(reportMarkup).join("") || emptyMarkup("归档区是空的")}</section>`; }
  if (ui.view === "relations") { title = "关联图谱"; subtitle = "从共同主题进入相关关键卡与报告"; body = relationsMarkup(); }
  return `<section class="content-head"><div><h2>${escapeHtml(ui.category === "all" ? title : ui.category)}</h2><p>${escapeHtml(subtitle)}</p></div>
    <nav class="view-tabs" aria-label="视图切换">${[["overview","精选"],["reports","报告"],["cards","卡片"],["relations","关联"]].map(([view,label]) => `<button class="view-tab ${ui.view === view ? "is-active" : ""}" data-view="${view}">${label}</button>`).join("")}</nav></section>
    ${ui.view !== "relations" ? toolbarMarkup() : ""}${body}`;
}

function emptyMarkup(title = "没有找到匹配内容") {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>换个关键词、分类或筛选条件，也可以直接导入一份新材料。</p></div>`;
}

function reportDrawerMarkup(report) {
  const linkedReports = (report.relatedReportIds || []).map(reportById).filter(Boolean);
  const cards = state.cards.filter((card) => card.reportId === report.id);
  const originalButton = report.fileName ? `<button type="button" class="soft-button" data-open-original="${escapeHtml(report.id)}">打开原始档案</button>` : "";
  const sourceButton = safeUrl(report.url) ? `<a class="soft-button" href="${escapeHtml(safeUrl(report.url))}" target="_blank" rel="noreferrer">打开来源网址</a>` : "";
  return `<div class="drawer-backdrop" data-close-drawer><aside class="drawer" role="dialog" aria-modal="true" aria-label="报告详情">
    <header class="drawer-head"><div><span class="card-type"><span class="type-dot"></span>${escapeHtml(report.category || "报告")}</span><h2>${escapeHtml(report.title)}</h2></div><button class="drawer-close" type="button" data-close-drawer aria-label="关闭">×</button></header>
    <div class="drawer-body">
      <section class="drawer-section"><h3>报告信息</h3><div class="report-meta"><span>${formatDate(report.createdAt, true)}</span><span>${escapeHtml(report.source || "手动导入")}</span><span>${cardCount(report.id)} 张关键卡</span>${report.fileSize ? `<span>${formatBytes(report.fileSize)}</span>` : ""}</div><div class="editor-actions">${sourceButton}${originalButton}</div></section>
      ${report.extractionError ? `<section class="drawer-section"><h3>解析提示</h3><div class="source-quote">${escapeHtml(report.extractionError)}</div></section>` : ""}
      <section class="drawer-section"><h3>关键卡</h3><div class="linked-list">${cards.map((card) => `<button class="linked-item" type="button" data-open-card="${escapeHtml(card.id)}"><span>${escapeHtml(card.title)}</span><small>${escapeHtml(card.label || TYPE_LABELS[card.type])}</small></button>`).join("") || "暂无关键卡"}</div></section>
      <section class="drawer-section"><h3>完整原文</h3><div class="full-text">${escapeHtml(report.body || "当前没有可读取正文。可在下方编辑区补贴全文或字幕，再重新抽取。")}</div></section>
      <section class="drawer-section"><h3>关联报告</h3><div class="linked-list">${linkedReports.map((item) => `<button class="linked-item" type="button" data-open-report="${escapeHtml(item.id)}"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.category)}</small></button>`).join("") || "尚未发现跨报告关联"}</div></section>
      ${reportEditorMarkup(report)}
    </div>
  </aside></div>`;
}

function reportEditorMarkup(report) {
  return `<section class="drawer-section"><h3>编辑与管理</h3><form class="editor-grid" id="report-editor" data-report-id="${escapeHtml(report.id)}">
    <label>标题<input name="title" value="${escapeHtml(report.title)}" required /></label>
    <label>分类<select name="category">${state.categories.map((category) => `<option value="${escapeHtml(category)}" ${report.category === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}</select></label>
    <label>标签（逗号分隔）<input name="tags" value="${escapeHtml((report.tags || []).join(", "))}" /></label>
    <label>完整正文 / 字幕<textarea name="body">${escapeHtml(report.body || "")}</textarea></label>
    <div class="editor-actions"><button class="danger-button" type="button" data-delete-report="${escapeHtml(report.id)}">永久删除</button><button class="soft-button" type="button" data-archive-report="${escapeHtml(report.id)}">${report.archived ? "恢复报告" : "归档报告"}</button><button class="primary-button" type="submit">保存并重新抽取</button></div>
  </form></section>`;
}

function cardDrawerMarkup(card) {
  const report = reportById(card.reportId);
  if (!report) return "";
  const relatedCards = (card.relatedCardIds || []).map(cardById).filter(Boolean);
  const relatedReports = [...new Set(relatedCards.map((item) => item.reportId))].map(reportById).filter(Boolean);
  return `<div class="drawer-backdrop" data-close-drawer><aside class="drawer" role="dialog" aria-modal="true" aria-label="关键卡详情">
    <header class="drawer-head"><div><span class="card-type type-${escapeHtml(card.type)}"><span class="type-dot"></span>${escapeHtml(card.label || TYPE_LABELS[card.type])}</span><h2>${escapeHtml(card.title)}</h2></div><button class="drawer-close" type="button" data-close-drawer aria-label="关闭">×</button></header>
    <div class="drawer-body">
      <section class="drawer-section"><h3>证据片段</h3><div class="source-quote">“${escapeHtml(card.quote || card.summary)}”<div class="source-anchor">${escapeHtml(report.title)} · ${escapeHtml(card.anchor || "原文")}</div></div><div class="editor-actions"><button class="soft-button" type="button" data-open-report="${escapeHtml(report.id)}">查看完整原文</button></div></section>
      ${card.metric ? `<section class="drawer-section"><h3>关键数字</h3><div class="metric-value">${escapeHtml(card.metric)}</div><p class="metric-context">数字保留原报告口径，请回到证据片段核对定义、时间与样本范围。</p></section>` : ""}
      <section class="drawer-section"><h3>关联关键卡</h3><div class="linked-list">${relatedCards.map((item) => `<button class="linked-item" type="button" data-open-card="${escapeHtml(item.id)}"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(reportById(item.reportId)?.title || "")}</small></button>`).join("") || "尚未发现足够强的关联"}</div></section>
      <section class="drawer-section"><h3>关联报告</h3><div class="linked-list">${relatedReports.map((item) => `<button class="linked-item" type="button" data-open-report="${escapeHtml(item.id)}"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.category)}</small></button>`).join("") || "暂无跨报告关联"}</div></section>
      <section class="drawer-section"><h3>编辑卡片</h3><form class="editor-grid" id="card-editor" data-card-id="${escapeHtml(card.id)}">
        <label>卡片标题<input name="title" value="${escapeHtml(card.title)}" required /></label>
        <label>类型<select name="type">${Object.entries(TYPE_LABELS).map(([type,label]) => `<option value="${type}" ${card.type === type ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>关键信息<textarea name="summary">${escapeHtml(card.summary)}</textarea></label>
        <label>关键数字<input name="metric" value="${escapeHtml(card.metric || "")}" /></label>
        <label>标签（逗号分隔）<input name="tags" value="${escapeHtml((card.tags || []).join(", "))}" /></label>
        <div class="editor-actions"><button class="danger-button" type="button" data-delete-card="${escapeHtml(card.id)}">删除卡片</button><button class="primary-button" type="submit">保存修改</button></div>
      </form></section>
    </div>
  </aside></div>`;
}

function drawerMarkup() {
  if (!ui.drawer) return "";
  if (ui.drawer.kind === "report") {
    const report = reportById(ui.drawer.id);
    return report ? reportDrawerMarkup(report) : "";
  }
  const card = cardById(ui.drawer.id);
  return card ? cardDrawerMarkup(card) : "";
}

function render({ preserveSearchFocus = false } = {}) {
  const search = document.getElementById("global-search");
  const selection = preserveSearchFocus && search ? [search.selectionStart, search.selectionEnd] : null;
  app.className = "shell";
  app.innerHTML = `<header class="topbar">
    <div class="brand"><span class="brand-mark">C</span><span class="brand-copy"><span class="brand-title">知识采集与证据卡片台</span><span class="brand-subtitle">Clair’s Studio</span></span></div>
    <label class="global-search"><span class="sr-only">搜索报告、卡片与原文</span><input id="global-search" type="search" value="${escapeHtml(ui.query)}" placeholder="搜索报告、关键卡、数字或原文…" /><span class="search-hint">⌘ K</span></label>
    <div class="top-actions"><button class="ghost-button" type="button" data-export>导出备份</button><button class="ghost-button" type="button" data-import>导入备份</button><button class="soft-button" type="button" data-sync>同步最新</button><input id="backup-file" class="sr-only" type="file" accept="application/json,.json" /></div>
  </header>
  <div class="layout">${navMarkup()}<main class="main">${heroMarkup()}${summaryMarkup()}${contentMarkup()}</main></div>${drawerMarkup()}`;
  bindEvents();
  if (selection) {
    const next = document.getElementById("global-search");
    next?.focus({ preventScroll: true });
    next?.setSelectionRange(selection[0], selection[1]);
  }
}

function openDrawer(kind, id) {
  ui.drawer = { kind, id };
  render();
  document.querySelector(".drawer-close")?.focus();
}

async function fetchUrlContent(url) {
  const safe = safeUrl(url);
  if (!safe) throw new Error("网址格式不正确");
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(safe, { signal: controller.signal });
    if (!response.ok) throw new Error(`网页返回 HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text") && !type.includes("json") && !type.includes("xml")) return { title: new URL(safe).hostname, text: "" };
    const raw = await response.text();
    const document = new DOMParser().parseFromString(raw, type.includes("html") ? "text/html" : "text/plain");
    document.querySelectorAll("script,style,noscript,svg,canvas,nav,footer,form").forEach((node) => node.remove());
    return { title: document.title || new URL(safe).hostname, text: normalizeText(document.body?.innerText || raw) };
  } finally {
    window.clearTimeout(timer);
  }
}

function isVideoUrl(url) {
  return /(youtube\.com|youtu\.be|vimeo\.com|bilibili\.com|xiaoyuzhoufm\.com|podcasts\.apple\.com)/i.test(url);
}

async function addReport(report, file = null) {
  const cards = extractKnowledgeCards(report);
  state.reports.push(report);
  state.cards.push(...cards);
  const linked = linkKnowledgeGraph(state.reports, state.cards);
  state.reports = linked.reports;
  state.cards = linked.cards;
  if (file) {
    try {
      await saveOriginalFile(report.id, file);
    } catch (error) {
      report.extractionError = [report.extractionError, `原始文件保存失败：${error.message}`].filter(Boolean).join("；");
    }
  }
  await persist();
  return report;
}

async function handleIngest(event) {
  event.preventDefault();
  if (ui.ingestBusy) return;
  const captured = {
    text: document.getElementById("ingest-text")?.value?.trim() || "",
    url: document.getElementById("ingest-url")?.value?.trim() || "",
    urlText: document.getElementById("ingest-url-text")?.value?.trim() || "",
    files: [...ui.pendingFiles],
  };
  ui.ingestBusy = true;
  ui.ingestStatus = "正在读取与抽取…";
  render();
  const created = [];
  try {
    if (ui.ingestMode === "text") {
      const body = captured.text;
      if (!body) throw new Error("请先贴上一段报告、内容或字幕");
      const report = createReportRecord({ title: inferTitle(body), body, kind: "text", source: "粘贴内容" });
      created.push(await addReport(report));
    } else if (ui.ingestMode === "url") {
      const url = captured.url;
      let body = captured.urlText;
      if (!safeUrl(url)) throw new Error("请贴上完整的 http:// 或 https:// 网址");
      let title = new URL(url).hostname;
      let extractionError = "";
      if (!body) {
        try {
          const fetched = await fetchUrlContent(url);
          body = fetched.text;
          title = fetched.title;
        } catch {
          extractionError = isVideoUrl(url) ? "影片网址已保存；请在编辑区补贴字幕，才能抽取可核对的知识卡。" : "网址已保存；该站限制浏览器直接读取，请在编辑区补贴正文后重新抽取。";
        }
      }
      const report = createReportRecord({ title, body, url, kind: isVideoUrl(url) ? "video" : "url", source: "网址导入", extractionError });
      created.push(await addReport(report));
    } else {
      if (!captured.files.length) throw new Error("请先选择或拖入至少一个档案");
      for (const [index, file] of captured.files.slice(0, 12).entries()) {
        ui.ingestStatus = `正在处理 ${index + 1}/${Math.min(captured.files.length, 12)} · ${file.name}`;
        document.getElementById("ingest-status").textContent = ui.ingestStatus;
        const extracted = await extractFile(file, (message) => {
          ui.ingestStatus = message;
          const status = document.getElementById("ingest-status");
          if (status) status.textContent = message;
        });
        const report = createReportRecord({
          title: extracted.title || file.name,
          body: extracted.text,
          kind: extracted.kind,
          file,
          source: "本机档案",
          extractionError: extracted.error || (extracted.needsTranscript ? "原始档案已保存；此格式需要补贴文字或字幕后再抽取。" : ""),
        });
        created.push(await addReport(report, file));
      }
    }
    ui.pendingFiles = [];
    ui.view = "cards";
    ui.category = "all";
    ui.drawer = created.length === 1 ? { kind: "report", id: created[0].id } : null;
    ui.ingestStatus = `完成 · 新增 ${created.length} 份报告`;
    showToast(`已加入 ${created.length} 份报告，并抽取 ${created.reduce((sum, report) => sum + cardCount(report.id), 0)} 张关键卡`);
  } catch (error) {
    ui.ingestStatus = error.message || "处理失败，请重试";
    showToast(ui.ingestStatus);
  } finally {
    ui.ingestBusy = false;
    render();
  }
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => {
    ui.view = button.dataset.view;
    ui.category = "all";
    ui.drawer = null;
    render();
  }));
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    ui.category = button.dataset.category;
    ui.view = "reports";
    ui.drawer = null;
    render();
  }));
  document.querySelectorAll("[data-ingest-mode]").forEach((button) => button.addEventListener("click", () => {
    ui.ingestMode = button.dataset.ingestMode;
    ui.ingestStatus = ui.ingestMode === "file" ? "档案只保存在当前浏览器" : "粘贴内容后会自动保留证据位置";
    render();
  }));
  document.querySelectorAll("[data-open-report]").forEach((element) => element.addEventListener("click", (event) => {
    event.stopPropagation();
    openDrawer("report", element.dataset.openReport);
  }));
  document.querySelectorAll("[data-open-card]").forEach((element) => element.addEventListener("click", (event) => {
    event.stopPropagation();
    openDrawer("card", element.dataset.openCard);
  }));
  document.querySelectorAll("[data-close-drawer]").forEach((element) => element.addEventListener("click", (event) => {
    if (event.target.closest(".drawer") && !event.target.matches("[data-close-drawer]")) return;
    ui.drawer = null;
    render();
  }));
  document.getElementById("ingest-form")?.addEventListener("submit", handleIngest);
  document.getElementById("global-search")?.addEventListener("input", (event) => {
    ui.query = event.target.value;
    render({ preserveSearchFocus: true });
  });
  document.getElementById("type-filter")?.addEventListener("change", (event) => { ui.type = event.target.value; render(); });
  document.getElementById("sort-filter")?.addEventListener("change", (event) => { ui.sort = event.target.value; render(); });

  const fileInput = document.getElementById("ingest-files");
  fileInput?.addEventListener("change", () => {
    ui.pendingFiles = [...fileInput.files].slice(0, 12);
    ui.ingestStatus = ui.pendingFiles.length ? `已选 ${ui.pendingFiles.length} 个档案` : "尚未选择档案";
    render();
  });
  const dropZone = document.getElementById("drop-zone");
  dropZone?.addEventListener("dragover", (event) => { event.preventDefault(); dropZone.classList.add("is-dragging"); });
  dropZone?.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
  dropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    ui.pendingFiles = [...event.dataTransfer.files].slice(0, 12);
    ui.ingestStatus = `已选 ${ui.pendingFiles.length} 个档案`;
    render();
  });

  document.querySelector("[data-sync]")?.addEventListener("click", async () => { await syncDailyFeed(); render(); });
  document.querySelector("[data-export]")?.addEventListener("click", () => exportState(state));
  document.querySelector("[data-import]")?.addEventListener("click", () => document.getElementById("backup-file")?.click());
  document.getElementById("backup-file")?.addEventListener("change", async (event) => {
    try {
      const imported = await importStateFile(event.target.files[0]);
      state = { ...state, ...imported };
      const linked = linkKnowledgeGraph(state.reports || [], state.cards || []);
      state.reports = linked.reports;
      state.cards = linked.cards;
      await persist();
      showToast("备份已导入");
      render();
    } catch (error) {
      showToast(error.message || "备份导入失败");
    }
  });

  document.getElementById("report-editor")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const report = reportById(event.currentTarget.dataset.reportId);
    const form = new FormData(event.currentTarget);
    report.title = String(form.get("title") || report.title).trim();
    report.category = String(form.get("category") || report.category);
    report.tags = String(form.get("tags") || "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
    report.body = normalizeText(form.get("body") || "");
    report.updatedAt = new Date().toISOString();
    report.userEdited = true;
    state.cards = state.cards.filter((card) => card.reportId !== report.id || card.userEdited);
    state.cards.push(...extractKnowledgeCards(report).filter((card) => !state.cards.some((item) => item.id === card.id)));
    const linked = linkKnowledgeGraph(state.reports, state.cards);
    state.reports = linked.reports;
    state.cards = linked.cards;
    await persist();
    showToast("报告已保存，关键卡已重新抽取");
    render();
  });
  document.getElementById("card-editor")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const card = cardById(event.currentTarget.dataset.cardId);
    const form = new FormData(event.currentTarget);
    card.title = String(form.get("title") || card.title).trim();
    card.type = String(form.get("type") || card.type);
    card.label = TYPE_LABELS[card.type];
    card.summary = String(form.get("summary") || "").trim();
    card.metric = String(form.get("metric") || "").trim();
    card.tags = String(form.get("tags") || "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
    card.userEdited = true;
    const linked = linkKnowledgeGraph(state.reports, state.cards);
    state.reports = linked.reports;
    state.cards = linked.cards;
    await persist();
    showToast("关键卡已保存");
    render();
  });
  document.querySelector("[data-archive-report]")?.addEventListener("click", async (event) => {
    const report = reportById(event.currentTarget.dataset.archiveReport);
    report.archived = !report.archived;
    await persist();
    ui.drawer = null;
    showToast(report.archived ? "报告已归档" : "报告已恢复");
    render();
  });
  document.querySelector("[data-delete-report]")?.addEventListener("click", async (event) => {
    const id = event.currentTarget.dataset.deleteReport;
    const report = reportById(id);
    if (!window.confirm(`永久删除「${report.title}」及其关键卡？此操作无法撤销。`)) return;
    state.reports = state.reports.filter((item) => item.id !== id);
    state.cards = state.cards.filter((card) => card.reportId !== id);
    await deleteOriginalFile(id);
    await persist();
    ui.drawer = null;
    showToast("报告与关键卡已删除");
    render();
  });
  document.querySelector("[data-delete-card]")?.addEventListener("click", async (event) => {
    const id = event.currentTarget.dataset.deleteCard;
    state.cards = state.cards.filter((card) => card.id !== id);
    const linked = linkKnowledgeGraph(state.reports, state.cards);
    state.reports = linked.reports;
    state.cards = linked.cards;
    await persist();
    ui.drawer = null;
    showToast("关键卡已删除");
    render();
  });
  document.querySelector("[data-open-original]")?.addEventListener("click", async (event) => {
    const record = await loadOriginalFile(event.currentTarget.dataset.openOriginal);
    if (!record?.blob) { showToast("当前浏览器中找不到原始档案"); return; }
    const url = URL.createObjectURL(record.blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && ui.drawer) { ui.drawer = null; render(); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("global-search")?.focus();
  }
});

async function init() {
  const saved = await loadState();
  if (saved?.reports && saved?.cards) state = { ...state, ...saved };
  await syncDailyFeed({ quiet: true });
  ensureCategories();
  render();
  window.setInterval(() => syncDailyFeed({ quiet: true }).then(() => render()), 60 * 60 * 1000);
}

init().catch((error) => {
  app.className = "app-loading";
  app.innerHTML = `<div class="loading-mark">!</div><p>知识库启动失败：${escapeHtml(error.message)}</p>`;
});
