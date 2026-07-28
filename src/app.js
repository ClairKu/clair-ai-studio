const STORAGE_KEY = "clair-service-report-workbench-v1";
const AUTH_KEY = "clair-service-report-workbench-access";

const initialState = {
  groups: [
    { id: "inbox", name: "待整理", accent: "slate", position: 0 },
    { id: "today", name: "今日产出 · 7月28日", accent: "blue", position: 1 },
    { id: "product", name: "产品与 AI 服务", accent: "violet", position: 2 },
    { id: "research", name: "投研与竞品", accent: "amber", position: 3 },
  ],
  reports: [
    {
      id: "seed-mcp-benchmark",
      groupId: "today",
      title: "三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",
      url: "https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-28T10:00:00.000Z",
    },
    {
      id: "seed-fund-report",
      groupId: "today",
      title: "东方财富妙想版｜010350 基金深度诊断",
      url: "https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",
      pinned: false,
      position: 1,
      createdAt: "2026-07-28T09:30:00.000Z",
    },
    {
      id: "seed-agreement",
      groupId: "product",
      title: "盈米 MCP 协议审查台",
      url: "https://clairku.github.io/yingmi-mcp-agreement-review/",
      pinned: true,
      position: 0,
      createdAt: "2026-07-28T08:50:00.000Z",
    },
    {
      id: "seed-xiaogu",
      groupId: "product",
      title: "且慢小顾介绍｜AI 投资助手",
      url: "https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",
      pinned: false,
      position: 1,
      createdAt: "2026-07-27T07:40:00.000Z",
    },
    {
      id: "seed-strategy",
      groupId: "research",
      title: "公募策略多指标双轴探索器｜四笔钱",
      url: "https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",
      pinned: false,
      position: 0,
      createdAt: "2026-07-27T07:20:00.000Z",
    },
    {
      id: "seed-ecosystem",
      groupId: "product",
      title: "盈米 AI 实验室｜服务组件编排 Demo",
      url: "https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",
      pinned: false,
      position: 2,
      createdAt: "2026-07-26T14:40:00.000Z",
    },
  ],
};

let state = loadState();
let query = "";
let readerId = "";
let draggingId = "";
let modal = null;
let toastTimer = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.groups) && Array.isArray(saved?.reports)) return saved;
  } catch {
    // Use initial state when local data is invalid.
  }
  return clone(initialState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function domainOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function validUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 2600);
}

function cardMarkup(report, pinnedView = false) {
  return `
    <article class="report-card ${pinnedView ? "pinned-card" : ""}" draggable="true" data-report-id="${escapeHtml(report.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${escapeHtml(report.id)}">
        <span class="report-icon">${escapeHtml(report.title.slice(0, 1))}</span>
        <span class="report-copy">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${escapeHtml(domainOf(report.url))}</span>
        </span>
        <span class="open-arrow" aria-hidden="true">↗</span>
      </button>
      <div class="card-meta">
        <span>${escapeHtml(dateLabel(report.createdAt))}</span>
        <span class="drag-hint" title="拖动到其他分组">⠿ 拖动</span>
        <div class="card-actions">
          <button type="button" data-action="pin" data-id="${escapeHtml(report.id)}" title="${report.pinned ? "取消置顶" : "置顶"}">${report.pinned ? "★" : "☆"}</button>
          <button type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(report.id)}">删除</button>
        </div>
      </div>
    </article>`;
}

function modalMarkup() {
  if (!modal) return "";
  if (modal.type === "group") {
    return `
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div><span class="section-kicker">NEW COLLECTION</span><h2>新增分组</h2></div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>分组名称
            <input name="name" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">创建分组</button>
          </div>
        </form>
      </div>`;
  }

  const editing = modal.mode === "edit"
    ? state.reports.find((report) => report.id === modal.reportId)
    : null;
  const groupId = editing?.groupId || modal.groupId || state.groups[0]?.id || "";
  return `
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${editing ? "EDIT REPORT" : "NEW REPORT"}</span>
            <h2>${editing ? "编辑服务报告" : "新增服务报告"}</h2>
          </div>
          <button type="button" data-action="close-modal">×</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${escapeHtml(editing?.url || "")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${editing ? "修改网址后可重新识别" : "保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${escapeHtml(editing?.title || "")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${state.groups.map((group) => `<option value="${escapeHtml(group.id)}" ${group.id === groupId ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`;
}

function gateMarkup() {
  return `
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · SERVICE DESK</span>
        <h1>你的服务报告，都在这里</h1>
        <p>一个入口，管理每天生成的报告与服务页面。</p>
        <form class="login-form" id="login-form">
          <label for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入口令" autofocus />
            <button type="submit" class="primary-button">进入工作台</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>免平台登录</span><span>当前浏览器保存</span></div>
      </section>
    </main>`;
}

function readerMarkup(report) {
  return `
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${escapeHtml(report.title)}</strong>
          <span>${escapeHtml(domainOf(report.url))}</span>
        </div>
        <button class="quiet-button" type="button" data-action="edit" data-id="${escapeHtml(report.id)}">编辑</button>
      </header>
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${escapeHtml(report.title)}" src="${escapeHtml(report.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>
      ${modalMarkup()}
    </main>`;
}

function workbenchMarkup() {
  const normalized = query.trim().toLowerCase();
  const reports = normalized
    ? state.reports.filter((report) => `${report.title} ${report.url}`.toLowerCase().includes(normalized))
    : state.reports;
  const pinned = reports.filter((report) => report.pinned);
  return `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark small">C</div>
          <div><strong>Clair 的服务工作台</strong><span>Service report desk</span></div>
        </div>
        <label class="search"><span aria-hidden="true">⌕</span>
          <input id="search-input" value="${escapeHtml(query)}" placeholder="搜索报告名称或网址" aria-label="搜索报告" />
          ${query ? '<button type="button" data-action="clear-search">清除</button>' : ""}
        </label>
        <div class="top-actions">
          <button class="quiet-button desktop-only" type="button" data-action="lock">锁定</button>
          <button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span>新增报告</button>
        </div>
      </header>
      <section class="workspace">
        <div class="hero-row">
          <div><span class="eyebrow">2026 · DAILY OUTPUTS</span><h1>每天生产的服务，<br />在这里持续生长。</h1><p>拖动卡片即可调整分组。所有标题与地址都可以随时修改。</p></div>
          <div class="metrics">
            <div><strong>${state.reports.length}</strong><span>服务报告</span></div>
            <div><strong>${state.groups.length}</strong><span>自定义分组</span></div>
            <div><strong>${state.reports.filter((report) => report.pinned).length}</strong><span>已置顶</span></div>
          </div>
        </div>
        ${pinned.length ? `
          <section class="pinned-section">
            <div class="section-heading"><div><span class="section-kicker">PINNED</span><h2>置顶服务</h2></div><span>${pinned.length} 个常用入口</span></div>
            <div class="pinned-grid">${pinned.map((report) => cardMarkup(report, true)).join("")}</div>
          </section>` : ""}
        <section class="groups-section">
          <div class="section-heading"><div><span class="section-kicker">COLLECTIONS</span><h2>报告分组</h2></div><button class="text-button" type="button" data-action="add-group">＋ 新增分组</button></div>
          <div class="board">
            ${state.groups.map((group) => {
              const groupReports = reports.filter((report) => report.groupId === group.id);
              return `
                <section class="group-column accent-${escapeHtml(group.accent)}" data-group-id="${escapeHtml(group.id)}">
                  <header class="group-header">
                    <div><span class="accent-dot"></span><h3>${escapeHtml(group.name)}</h3><span class="count">${groupReports.length}</span></div>
                    <div class="group-menu">
                      <button type="button" data-action="rename-group" data-id="${escapeHtml(group.id)}">改名</button>
                      ${group.id !== "inbox" ? `<button type="button" data-action="delete-group" data-id="${escapeHtml(group.id)}">删除</button>` : ""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${groupReports.map((report) => cardMarkup(report)).join("")}
                    ${groupReports.length
                      ? `<button type="button" class="add-inline" data-action="add-to-group" data-id="${escapeHtml(group.id)}">＋ 添加到此分组</button>`
                      : `<button type="button" class="empty-drop" data-action="add-to-group" data-id="${escapeHtml(group.id)}"><span>拖报告到这里</span><small>或点击新增</small></button>`}
                  </div>
                </section>`;
            }).join("")}
            <button type="button" class="new-group-card" data-action="add-group"><span>＋</span><strong>新增分组</strong><small>让报告按你的方式归位</small></button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR SERVICE DESK · GITHUB PAGES</span><span>自动保存到当前浏览器</span></footer>
      ${modalMarkup()}
    </main>`;
}

function render() {
  const app = document.getElementById("app");
  if (sessionStorage.getItem(AUTH_KEY) !== "ok") {
    app.innerHTML = gateMarkup();
    bindGate();
    return;
  }
  const report = readerId && state.reports.find((item) => item.id === readerId);
  app.innerHTML = report ? readerMarkup(report) : workbenchMarkup();
  bindApp();
}

function bindGate() {
  const form = document.getElementById("login-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(form).get("password");
    if (password !== "2026") {
      const error = form.querySelector(".form-error");
      error.hidden = false;
      error.textContent = "口令不正确，请再试一次";
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "ok");
    render();
  });
}

async function detectTitle(form) {
  const urlInput = form.elements.url;
  const titleInput = form.elements.title;
  const button = form.querySelector('[data-action="detect-title"]');
  const hint = form.querySelector(".field-hint");
  const url = urlInput.value.trim();
  if (!validUrl(url)) {
    hint.textContent = "请输入完整的 http 或 https 网址";
    return "";
  }
  button.disabled = true;
  button.innerHTML = '<span class="mini-spinner"></span>';
  hint.textContent = "正在读取网页标题…";
  try {
    const metadataUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const response = await fetch(metadataUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("read failed");
    const payload = await response.json();
    const title = payload?.data?.title?.trim() || domainOf(url);
    titleInput.value = title.slice(0, 180);
    hint.textContent = "已识别网页标题";
    return titleInput.value;
  } catch {
    const fallback = domainOf(url);
    titleInput.value ||= fallback;
    hint.textContent = "网页暂时无法读取，已用域名作为标题，你可以手动修改";
    return titleInput.value;
  } finally {
    button.disabled = false;
    button.textContent = "识别标题";
  }
}

function bindApp() {
  document.getElementById("search-input")?.addEventListener("input", (event) => {
    query = event.target.value;
    render();
    const input = document.getElementById("search-input");
    input?.focus();
    input?.setSelectionRange(query.length, query.length);
  });

  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.action;
      const itemId = event.currentTarget.dataset.id;
      if (action === "open") {
        readerId = itemId;
        render();
      } else if (action === "back") {
        readerId = "";
        modal = null;
        render();
      } else if (action === "lock") {
        sessionStorage.removeItem(AUTH_KEY);
        render();
      } else if (action === "clear-search") {
        query = "";
        render();
      } else if (action === "add-report") {
        modal = { type: "report", mode: "create", groupId: state.groups[1]?.id || state.groups[0]?.id };
        render();
      } else if (action === "add-to-group") {
        modal = { type: "report", mode: "create", groupId: itemId };
        render();
      } else if (action === "edit") {
        modal = { type: "report", mode: "edit", reportId: itemId };
        render();
      } else if (action === "close-modal") {
        modal = null;
        render();
      } else if (action === "detect-title") {
        await detectTitle(event.currentTarget.closest("form"));
      } else if (action === "pin") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report) report.pinned = !report.pinned;
        saveState();
        render();
        showToast(report?.pinned ? "报告已置顶" : "已取消置顶");
      } else if (action === "delete") {
        const report = state.reports.find((item) => item.id === itemId);
        if (report && confirm(`确定删除“${report.title}”吗？此操作不可撤销。`)) {
          state.reports = state.reports.filter((item) => item.id !== itemId);
          if (readerId === itemId) readerId = "";
          saveState();
          render();
          showToast("报告已删除");
        }
      } else if (action === "add-group") {
        modal = { type: "group" };
        render();
      } else if (action === "rename-group") {
        const group = state.groups.find((item) => item.id === itemId);
        const name = group && prompt("新的分组名称", group.name);
        if (name?.trim()) {
          group.name = name.trim().slice(0, 60);
          saveState();
          render();
          showToast("分组名称已更新");
        }
      } else if (action === "delete-group") {
        const group = state.groups.find((item) => item.id === itemId);
        if (group && confirm(`删除“${group.name}”？其中的报告会移到“待整理”。`)) {
          state.reports.forEach((report) => {
            if (report.groupId === itemId) report.groupId = "inbox";
          });
          state.groups = state.groups.filter((item) => item.id !== itemId);
          saveState();
          render();
          showToast("分组已删除，报告已移到待整理");
        }
      }
    });
  });

  document.querySelectorAll(".report-card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggingId = card.dataset.reportId;
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => {
      draggingId = "";
      card.classList.remove("is-dragging");
    });
  });

  document.querySelectorAll(".group-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("is-drop-ready");
    });
    column.addEventListener("dragleave", () => column.classList.remove("is-drop-ready"));
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      const report = state.reports.find((item) => item.id === draggingId);
      if (report) {
        report.groupId = column.dataset.groupId;
        report.position = Math.max(
          -1,
          ...state.reports.filter((item) => item.groupId === report.groupId).map((item) => item.position || 0),
        ) + 1;
        saveState();
        render();
        showToast("已移入新分组");
      }
      draggingId = "";
    });
  });

  const groupForm = document.getElementById("group-form");
  groupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(groupForm).get("name")?.trim();
    if (!name) return;
    state.groups.push({
      id: id("group"),
      name: name.slice(0, 60),
      accent: ["blue", "violet", "amber", "green"][state.groups.length % 4],
      position: state.groups.length,
    });
    saveState();
    modal = null;
    render();
    showToast("分组已新增");
  });

  const reportForm = document.getElementById("report-form");
  reportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const url = reportForm.elements.url.value.trim();
    if (!validUrl(url)) return;
    const submit = reportForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.innerHTML = '<span class="mini-spinner"></span>';
    let title = reportForm.elements.title.value.trim();
    if (!title) title = await detectTitle(reportForm);
    const groupId = reportForm.elements.groupId.value;
    if (modal.mode === "edit") {
      const report = state.reports.find((item) => item.id === modal.reportId);
      Object.assign(report, { title, url, groupId });
    } else {
      state.reports.push({
        id: id("report"),
        groupId,
        title: title || domainOf(url),
        url,
        pinned: false,
        position: state.reports.filter((report) => report.groupId === groupId).length,
        createdAt: new Date().toISOString(),
      });
    }
    saveState();
    modal = null;
    render();
    showToast("报告已保存");
  });
}

export function renderApp() {
  render();
}
