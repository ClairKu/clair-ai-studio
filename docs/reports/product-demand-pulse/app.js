/**
 * 痛点消消乐 · 前端
 *
 * 数据只有一个方向：内网 agent 取数 → 中继 Worker / GitHub Pages → 这里读。
 * 页面从不直接连内网，也不持有任何取数凭据。
 *
 * 「更新数据」分两步：
 *   1. 先拉一次最新已发布快照（任何人、任何网络都能做，不要口令）
 *   2. 快照过期、或用户主动要求时，才凭口令让中继排一个刷新请求，等内网 agent 回填
 */

const STORAGE_KEY = "pain-off-wishlist-v1";
const PASSCODE_KEY = "pain-off-passcode";
const RELAY_CONFIG_URL = "./data/relay-config.json";
const SNAPSHOT_URL = "./data/latest.json";
const JOB_POLL_MS = 3000;
const JOB_TIMEOUT_MS = 10 * 60 * 1000;
const DAY_MS = 86400000;

const LANDED = new Set(["released", "impact_confirmed"]);
const STATUS_LABELS = {
  submitted: "待处理",
  building: "开发中",
  merged: "待上线",
  released: "已上线",
  impact_confirmed: "效果确认",
  unknown: "待确认",
};
const CATEGORY_META = {
  urgent_bug: { title: "紧急 BUG", kicker: "用户牵引 × 必须尽快", symbol: "!" },
  important: { title: "重要建设", kicker: "团队牵引 × 必须尽快", symbol: "◆" },
  user_request: { title: "用户想要", kicker: "用户牵引 × 日常改善", symbol: "♥" },
  surprise: { title: "惊喜探索", kicker: "团队牵引 × 日常改善", symbol: "✦" },
};
const CATEGORY_ORDER = ["urgent_bug", "important", "user_request", "surprise"];
const CRITERIA_LABELS = {
  submitted: "累计提交",
  released: "累计上线",
  dedupe: "去重",
  end_to_end: "端到端",
  window: "统计区间",
  trace: "链路追溯",
};

const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const formatDate = (value, withYear = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", withYear
    ? { year: "numeric", month: "2-digit", day: "2-digit" }
    : { month: "2-digit", day: "2-digit" }).format(date);
};

function formatAge(value) {
  if (!value) return "时间未知";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return formatDate(value, true);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} 小时前`;
  return `${Math.round(minutes / (60 * 24))} 天前`;
}

/* ---------------------------------------------------------------- 数据加载 */

/**
 * 老快照（v1）只有 records，没有汇总；新快照（v2）由内网 agent 从 GitLab 算好。
 * 这里统一成一种形状，页面下面就不用再关心版本了。
 */
function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const people = Array.isArray(raw.people) ? raw.people : [];
  const records = Array.isArray(raw.records) ? raw.records : [];

  if (raw.schema_version === "product-demand-pulse/v2" && raw.summary) {
    return { ...raw, people, records, demands: Array.isArray(raw.demands) ? raw.demands : [] };
  }

  const counted = records.filter((item) => item.unique !== false);
  const released = counted.filter((item) => LANDED.has(item.status));
  return {
    schema_version: "product-demand-pulse/v1",
    meta: {
      ...(raw.meta || {}),
      generated_at: raw.meta?.cutoff || null,
      source_of_truth: "人工登记",
      stale_after_minutes: raw.meta?.stale_after_minutes || 180,
    },
    summary: {
      submitted: counted.length,
      released: released.length,
      in_flight: counted.length - released.length,
      end_to_end_people: new Set(released.map((item) => item.person_id)).size,
    },
    people: people.map((person) => {
      const mine = counted.filter((item) => item.person_id === person.id);
      const mineReleased = mine.filter((item) => LANDED.has(item.status));
      return {
        ...person,
        submitted: mine.length,
        released: mineReleased.length,
        in_flight: mine.length - mineReleased.length,
        end_to_end: mineReleased.length > 0,
      };
    }),
    demands: counted.map((item, index) => ({
      id: item.id || `L${index}`,
      person_id: item.person_id,
      submitted_at: item.submitted_at,
      released_at: item.released_at || null,
      status: item.status,
    })),
    records,
    criteria: raw.criteria || { submitted: "人工登记的需求条目。" },
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

let relayBase = null;

async function loadRelayConfig() {
  try {
    const config = await fetchJson(`${RELAY_CONFIG_URL}?v=${Date.now()}`);
    relayBase = config.worker_base ? String(config.worker_base).replace(/\/$/, "") : null;
  } catch (error) {
    relayBase = null;
  }
}

/** 中继上的快照最新（内网一算完就推过去），Pages 上那份是兜底，内置数据是最后一道。 */
async function loadSnapshot() {
  if (relayBase) {
    try {
      return { data: normalize(await fetchJson(`${relayBase}/snapshot?v=${Date.now()}`)), origin: "relay" };
    } catch (error) {
      /* 中继不可用就往下走 */
    }
  }
  try {
    return { data: normalize(await fetchJson(`${SNAPSHOT_URL}?v=${Date.now()}`)), origin: "pages" };
  } catch (error) {
    return { data: normalize(window.DEMAND_PULSE_DATA), origin: "builtin" };
  }
}

/* ---------------------------------------------------------------- 状态 */

let data = normalize(window.DEMAND_PULSE_DATA) || { meta: {}, summary: {}, people: [], demands: [], records: [] };
let dataOrigin = "builtin";
let wishlist = loadWishlist();
let refreshing = false;

function loadWishlist() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveWishlist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  renderWishlist();
  renderQuadrants();
}

function personById(id) {
  return (data.people || []).find((person) => person.id === id);
}

function isStale() {
  const generatedAt = data.meta?.generated_at || data.meta?.cutoff;
  if (!generatedAt) return true;
  const limit = (data.meta?.stale_after_minutes || 180) * 60000;
  return Date.now() - new Date(generatedAt).getTime() > limit;
}

/* ---------------------------------------------------------------- 渲染 */

function renderStats() {
  const summary = data.summary || {};
  const stats = [
    { label: "累计提交需求", value: summary.submitted ?? 0, tone: "paper" },
    { label: "累计上线需求", value: summary.released ?? 0, tone: "acid" },
    { label: "端到端能力升级", value: `${summary.end_to_end_people ?? 0}人`, tone: "cyan" },
  ];
  $("#score-grid").innerHTML = stats.map((item) => `
    <article class="score-card ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>`).join("");
  $("#hero-lead").textContent = data.meta?.headline
    || `${summary.submitted ?? 0} 个已提交，${summary.released ?? 0} 个已上线。`;
  $("#impact-stamp").textContent = `${summary.released ?? 0} 个痛点 OFF`;
}

function renderCriteria() {
  const criteria = data.criteria || {};
  $("#criteria-grid").innerHTML = Object.entries(criteria)
    .filter(([, value]) => typeof value === "string" && value)
    .map(([key, value]) => `
      <div class="criteria-item">
        <dt>${escapeHtml(CRITERIA_LABELS[key] || key)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>`).join("");
  $("#criteria-source").textContent = `来源：${data.meta?.source_of_truth || "未标注"}`;
}

function renderTeam() {
  const people = data.people || [];
  const achievers = people.filter((person) => (person.submitted || 0) > 0)
    .sort((a, b) => (b.released || 0) - (a.released || 0) || (b.submitted || 0) - (a.submitted || 0));
  const starters = people.filter((person) => !(person.submitted > 0));

  $("#achiever-grid").innerHTML = achievers.map((person, index) => `
    <article class="achiever-card">
      <span class="achiever-rank">${String(index + 1).padStart(2, "0")}</span>
      <span class="avatar">${escapeHtml(person.avatar || "✦")}</span>
      <div><h3>${escapeHtml(person.display_name)}</h3><p>${person.released ? "<b>端到端已跑通</b>" : "正在推进首个需求"}</p></div>
      <dl><div><dt>已提交</dt><dd>${person.submitted || 0}</dd></div><div><dt>已上线</dt><dd>${person.released || 0}</dd></div></dl>
    </article>`).join("");

  $("#starter-dock").innerHTML = starters.length ? `
    <div class="starter-copy"><span>READY?</span><b>等待首发</b></div>
    <div class="starter-people">${starters.map((person) => `
      <button type="button" data-start-pm="${escapeHtml(person.id)}"><span>${escapeHtml(person.avatar || "✦")}</span><b>${escapeHtml(person.display_name)}</b><small>给 TA 记一个 ＋</small></button>`).join("")}</div>` : "";
}

function renderValue() {
  const cycles = (data.demands || [])
    .filter((demand) => demand.released_at && demand.submitted_at)
    .map((demand) => (new Date(demand.released_at) - new Date(demand.submitted_at)) / DAY_MS)
    .filter((days) => Number.isFinite(days) && days >= 0);

  const average = cycles.length
    ? `${(cycles.reduce((sum, value) => sum + value, 0) / cycles.length).toFixed(1)}天`
    : "待积累";
  const fastest = cycles.length ? `${Math.min(...cycles).toFixed(1)}天` : "待积累";

  const cards = [
    { symbol: "↯", label: "平均交付周期", value: average, note: "从发起到合入生产主干" },
    { symbol: "⚡", label: "最快一次", value: fastest, note: cycles.length ? `${cycles.length} 个需求可计算` : "还没有可计算的样本" },
    { symbol: "∞", label: "在途需求", value: String(data.summary?.in_flight ?? 0), note: "已提交、尚未合入生产主干" },
  ];
  $("#value-grid").innerHTML = cards.map((item) => `
    <article class="value-card"><span>${item.symbol}</span><div><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong><em>${escapeHtml(item.note)}</em></div></article>`).join("");
}

/** 需求类型只有人工登记过才有；GitLab 上的 MR 不带这个字段，所以这张图不等于全量。 */
function renderQuadrants() {
  const tagged = [
    ...(data.records || []).map((item) => ({ ...item, source: "curated" })),
    ...wishlist.map((item) => ({
      ...item,
      person_display: personById(item.person_id)?.display_name || "待认领",
      pain_category: item.title,
      public_title: item.title,
      status: "submitted",
      source: "local",
    })),
  ];

  // 只有「口径内」的登记记录参与计数——四象限的数字必须和上面 GitLab 汇总严格对上。
  // 口径外（历史改进）与本地想法只展示、不计数，各带标签说明。
  const inScope = (item) => item.source === "curated" && item.in_scope !== false;

  $("#quadrant-grid").innerHTML = CATEGORY_ORDER.map((categoryKey) => {
    const meta = CATEGORY_META[categoryKey];
    const items = tagged.filter((item) => item.category === categoryKey);
    const scoped = items.filter(inScope);
    const released = scoped.filter((item) => LANDED.has(item.status)).length;
    return `
      <section class="quadrant quadrant-${categoryKey}">
        <header><span class="quadrant-symbol">${meta.symbol}</span><div><h3>${escapeHtml(meta.title)}</h3></div><b>${scoped.length}</b></header>
        <div class="quadrant-items">${items.length ? items.map((item) => `
          <div class="map-ticket ${LANDED.has(item.status) ? "is-done" : "is-open"}">
            <i aria-hidden="true"></i><span>${escapeHtml(item.public_title || item.pain_category || "")}</span><small>${escapeHtml(item.person_display || "")} · ${escapeHtml(STATUS_LABELS[item.status] || "待处理")}${item.source === "local" ? " · 本地" : ""}${item.source === "curated" && item.in_scope === false ? " · 口径外" : ""}</small>
          </div>`).join("") : '<span class="quadrant-empty">等待一个值得做的想法</span>'}</div>
        <footer><span>${released} 已解决</span><span>${scoped.length - released} 待解决</span></footer>
      </section>`;
  }).join("");

  const total = data.summary?.submitted ?? 0;
  const scopedRecords = (data.records || []).filter((record) => record.in_scope !== false);
  const outOfScope = (data.records || []).length - scopedRecords.length;
  $("#map-summary").textContent = `${data.summary?.released ?? 0} 个已上线 · ${data.summary?.in_flight ?? 0} 个在途`;
  $("#map-note").textContent = [
    total > scopedRecords.length
      ? `需求类型来自人工登记：口径内共 ${total} 个需求，其中 ${scopedRecords.length} 个登记了类型并出现在上图；其余只计入总数。`
      : "需求类型与简述来自人工登记，口径内需求已全部登记，四象限合计与上方汇总一致。",
    outOfScope ? `标注「口径外」的 ${outOfScope} 条是统计口径之外的历史改进，只展示不计数。` : "",
  ].filter(Boolean).join(" ");
}

/* ---- 链路追溯：每个需求的 MR 与上线单 ---- */

let traceFilter = "all";
let tracePerson = "all";

const externalLink = (href, label) =>
  `<a class="trace-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`;

function traceLinkGroup(label, links, emptyText) {
  return `
    <div class="trace-link-group">
      <span>${escapeHtml(label)}</span>
      <div>${links.length ? links.join("") : `<em>${escapeHtml(emptyText)}</em>`}</div>
    </div>`;
}

function renderTrace() {
  const list = $("#trace-list");
  const note = $("#trace-note");
  const demands = data.demands || [];
  const linked = demands.filter((demand) => demand.links);

  const personSelect = $("#trace-person");
  const previous = personSelect.value;
  personSelect.innerHTML = [
    '<option value="all">全部成员</option>',
    ...(data.people || [])
      .filter((person) => (person.submitted || 0) > 0)
      .map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.display_name)}</option>`),
  ].join("");
  personSelect.value = [...personSelect.options].some((option) => option.value === previous) ? previous : "all";
  tracePerson = personSelect.value;

  if (!linked.length) {
    list.innerHTML = `
      <div class="empty-state">
        当前快照还没有链路数据——它是 GitLab 取数接通前的人工登记版本。<br />
        下一次内网取数之后，这里会逐条列出每个需求的 MR 与上线单，点了就能跳。
      </div>`;
    note.textContent = "";
    return;
  }

  const rows = linked
    .filter((demand) => (traceFilter === "all" ? true : traceFilter === "released" ? demand.status === "released" : demand.status !== "released"))
    .filter((demand) => tracePerson === "all" || demand.person_id === tracePerson)
    .sort((a, b) => String(b.released_at || b.submitted_at).localeCompare(String(a.released_at || a.submitted_at)));

  if (!rows.length) {
    list.innerHTML = '<div class="empty-state">这个筛选下暂时没有需求。</div>';
  } else {
    list.innerHTML = rows.map((demand) => {
      const person = personById(demand.person_id);
      const links = demand.links || {};
      const demandTickets = (links.demand_tickets || []).map((ticket) => externalLink(ticket.url, ticket.key));
      const releaseTickets = (links.release_tickets || []).map((ticket) =>
        externalLink(ticket.url, ticket.status ? `${ticket.key} · ${ticket.status}` : ticket.key));
      const mergeRequests = (links.merge_requests || []).map((mr) =>
        externalLink(mr.url, `!${mr.iid} → ${mr.target_branch}${mr.is_release ? " ✔" : ""}`));

      const heading = demand.brief || links.demand_tickets?.[0]?.key || `需求 ${demand.id.slice(0, 6)}`;
      const dates = [
        `提交 ${formatDate(demand.submitted_at)}`,
        demand.released_at ? `上线 ${formatDate(demand.released_at)}` : "尚未合入生产主干",
      ].join(" → ");

      return `
        <article class="trace-row" data-status="${escapeHtml(demand.status)}">
          <div class="trace-main">
            <div class="tag-row">
              <span class="tag trace-status trace-${escapeHtml(demand.status)}">${escapeHtml(STATUS_LABELS[demand.status] || demand.status)}</span>
              <span class="tag">${escapeHtml(person?.avatar || "✦")} ${escapeHtml(person?.display_name || "未知")}</span>
            </div>
            <h3>${escapeHtml(heading)}</h3>
            <p>${escapeHtml(dates)} · ${(links.merge_requests || []).length} 条 MR</p>
          </div>
          <div class="trace-links">
            ${traceLinkGroup("需求单", demandTickets, "分支名里没带单号")}
            ${traceLinkGroup("合并请求", mergeRequests, "无")}
            ${traceLinkGroup("上线单", releaseTickets, demand.status === "released" ? "未登记" : "尚未提交")}
          </div>
        </article>`;
    }).join("");
  }

  const lookup = data.meta?.release_ticket_lookup;
  note.textContent = [
    `共 ${linked.length} 个需求可追溯，当前筛选显示 ${rows.length} 个。`,
    lookup === "skipped_no_token"
      ? "上线单未接入：内网取数时没有配置 JIRA_TOKEN，本次只解析了需求单。"
      : "上线单来自 Jira YR（发布管控）项目，按需求单号反查。",
    data.meta?.links_note || "链接需要内网与相应系统权限才能打开。",
  ].filter(Boolean).join(" ");
}

function renderWall() {
  const target = $("#impact-wall");
  const records = data.records || [];
  if (!records.length) {
    target.innerHTML = '<div class="empty-state">等待第一个可以被用户感受到的改变。</div>';
    return;
  }
  target.innerHTML = records.map((item) => {
    const category = CATEGORY_META[item.category] || CATEGORY_META.user_request;
    return `
      <article class="impact-card ${LANDED.has(item.status) ? "done" : "moving"}">
        <div class="tag-row"><span class="tag category-${escapeHtml(item.category)}">${category.symbol} ${escapeHtml(category.title)}</span><span class="tag priority">${escapeHtml(item.priority || "")}</span></div>
        <h3>${escapeHtml(item.pain_category)}</h3>
        <p>${escapeHtml(item.public_outcome)}</p>
        <footer><span>${escapeHtml(item.person_display)}</span><b>${escapeHtml(STATUS_LABELS[item.status] || item.evidence_level)}</b></footer>
      </article>`;
  }).join("");
}

function renderWishlist() {
  const target = $("#pending-list");
  if (!wishlist.length) {
    target.innerHTML = `
      <div class="pending-empty">
        <span>✦</span>
        <div><b>清单还是空的</b></div>
        <button class="text-button" type="button" data-open-composer>记下第一个想法 →</button>
      </div>`;
    return;
  }
  target.innerHTML = wishlist.map((item, index) => {
    const person = personById(item.person_id);
    const category = CATEGORY_META[item.category] || CATEGORY_META.user_request;
    return `
      <article class="pending-card" data-pending-id="${escapeHtml(item.id)}">
        <div class="pending-index">${String(index + 1).padStart(2, "0")}</div>
        <div class="pending-main">
          <div class="tag-row"><span class="tag category-${escapeHtml(item.category)}">${category.symbol} ${escapeHtml(category.title)}</span><span class="tag priority">${escapeHtml(item.priority)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.detail || "还可以补充场景、影响范围或参考信息。")}</p>
          <div class="pending-edit" hidden>
            <textarea maxlength="240" aria-label="补充需求信息">${escapeHtml(item.detail || "")}</textarea>
            <button class="text-button" type="button" data-save-detail>保存补充</button>
          </div>
        </div>
        <div class="pending-owner">
          <label>PM<select data-reassign aria-label="重新选择 PM">${(data.people || []).map((option) => `<option value="${escapeHtml(option.id)}"${option.id === item.person_id ? " selected" : ""}>${escapeHtml(option.display_name)}</option>`).join("")}</select></label>
          <span>${escapeHtml(person?.avatar || "✦")} ${formatDate(item.submitted_at)}</span>
        </div>
        <div class="pending-actions">
          <button type="button" data-edit-detail>补充信息</button>
          <button type="button" data-remove-pending>移除</button>
        </div>
      </article>`;
  }).join("");
}

function renderMeta() {
  const generatedAt = data.meta?.generated_at || data.meta?.cutoff;
  const originLabel = { relay: "实时中继", pages: "已发布快照", builtin: "内置兜底" }[dataOrigin] || "";
  $("#freshness-label").textContent = `数据 ${formatAge(generatedAt)}`;
  $("#freshness-chip").dataset.state = isStale() ? "stale" : "fresh";
  $("#freshness-chip").title = `${originLabel}｜${formatDate(generatedAt, true)}`;
  $("#cutoff-label").textContent = `数据截至 ${formatDate(generatedAt, true)}`;
  $("#hero-source").textContent = `数据口径：${data.meta?.source_of_truth || "未标注"} · ${originLabel} · ${formatAge(generatedAt)}`;
  $("#demand-pm").innerHTML = (data.people || [])
    .map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.display_name)}</option>`).join("");
}

function renderAll() {
  renderMeta();
  renderStats();
  renderCriteria();
  renderTeam();
  renderValue();
  renderWishlist();
  renderQuadrants();
  renderTrace();
  renderWall();
}

/* ---------------------------------------------------------------- 更新数据 */

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function setRefreshButtons(busy) {
  refreshing = busy;
  document.querySelectorAll("[data-refresh-update]").forEach((button) => {
    button.disabled = busy;
    button.classList.toggle("is-refreshing", busy);
    if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent.trim();
    button.textContent = busy ? "正在更新" : button.dataset.idleLabel;
  });
}

function showRefreshResult(state, title, message, delta = null, { offerRecompute = false } = {}) {
  const panel = $("#refresh-result");
  panel.hidden = false;
  panel.dataset.state = state;
  $("#refresh-result-badge").textContent = {
    running: "LIVE CHECK",
    updated: "已更新",
    no_change: "无变化",
    blocked: "需要处理",
  }[state] || "本次结果";
  $("#refresh-result-title").textContent = title;
  $("#refresh-result-message").textContent = message;

  const counts = $("#refresh-counts");
  counts.hidden = !delta;
  if (delta) {
    $("#refresh-new-submitted").textContent = delta.new_submitted ?? 0;
    $("#refresh-pending-release").textContent = delta.pending_release ?? 0;
    $("#refresh-new-released").textContent = delta.new_released ?? 0;
  }
  $("#refresh-extra").hidden = !(offerRecompute && relayBase);
}

/** 两份快照之间发生了什么——公网这边只能靠比对，不做业务判断。 */
function compareSnapshots(before, after) {
  const beforeIds = new Set((before?.demands || []).map((demand) => demand.id));
  const beforeReleased = new Set((before?.demands || []).filter((d) => d.status === "released").map((d) => d.id));
  const afterDemands = after?.demands || [];
  const newSubmitted = afterDemands.filter((demand) => !beforeIds.has(demand.id));
  const newReleased = afterDemands.filter((demand) => demand.status === "released" && !beforeReleased.has(demand.id));
  return {
    new_submitted: newSubmitted.length,
    pending_release: after?.summary?.in_flight ?? 0,
    new_released: newReleased.length,
    changed: newSubmitted.length > 0 || newReleased.length > 0,
  };
}

function applySnapshot(next, origin) {
  data = next;
  dataOrigin = origin;
  renderAll();
}

/* ---- 口令对话框 ---- */

let passcodeResolver = null;

function askPasscode(errorMessage = "") {
  const backdrop = $("#passcode-backdrop");
  const error = $("#passcode-error");
  error.hidden = !errorMessage;
  error.textContent = errorMessage;
  backdrop.hidden = false;
  window.setTimeout(() => $("#passcode-input").focus(), 50);
  return new Promise((resolve) => {
    passcodeResolver = resolve;
  });
}

function closePasscode(value) {
  $("#passcode-backdrop").hidden = true;
  $("#passcode-input").value = "";
  const resolve = passcodeResolver;
  passcodeResolver = null;
  if (resolve) resolve(value);
}

$("#passcode-form").addEventListener("submit", (event) => {
  event.preventDefault();
  closePasscode($("#passcode-input").value.trim());
});
$("#passcode-cancel").addEventListener("click", () => closePasscode(null));
$("#passcode-backdrop").addEventListener("click", (event) => {
  if (event.target === $("#passcode-backdrop")) closePasscode(null);
});

/* ---- 让内网重算一次 ---- */

async function requestRecompute(reason) {
  let passcode = sessionStorage.getItem(PASSCODE_KEY) || "";
  let hint = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!passcode) {
      passcode = await askPasscode(hint);
      if (!passcode) return { cancelled: true };
    }
    const response = await fetch(`${relayBase}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Pulse-Passcode": passcode },
      body: JSON.stringify({ reason }),
    });
    if (response.ok) {
      sessionStorage.setItem(PASSCODE_KEY, passcode);
      return { job: (await response.json()).job };
    }
    if (response.status === 403) {
      sessionStorage.removeItem(PASSCODE_KEY);
      passcode = "";
      hint = "口令不对，再试一次。";
      continue;
    }
    if (response.status === 429) return { error: "触发太频繁了，等一分钟再点。" };
    return { error: `中继返回 HTTP ${response.status}` };
  }
  return { error: "口令连续输错，已停止。" };
}

async function waitForJob(jobId) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < JOB_TIMEOUT_MS) {
    await new Promise((resolve) => window.setTimeout(resolve, JOB_POLL_MS));
    const { job } = await fetchJson(`${relayBase}/jobs/${encodeURIComponent(jobId)}?v=${Date.now()}`);
    if (job.status === "pending" || job.status === "running") continue;
    return job;
  }
  throw new Error("等待超过 10 分钟——内网取数 agent 可能没在运行。");
}

async function recompute(reason) {
  const requested = await requestRecompute(reason);
  if (requested.cancelled) {
    showRefreshResult("no_change", "已取消重算", "当前显示的仍是最近一次已发布的快照。", null, { offerRecompute: true });
    return;
  }
  if (requested.error) {
    showRefreshResult("blocked", "没能发起重算", requested.error, null, { offerRecompute: true });
    return;
  }

  showRefreshResult("running", "内网正在重算", "已排入队列，取数完成后本页会自动刷新。通常 10–60 秒。");
  const before = data;
  const job = await waitForJob(requested.job.id);

  if (job.status === "failed") {
    showRefreshResult("blocked", "内网重算失败", job.summary || "取数没有完成。", null, { offerRecompute: true });
    return;
  }

  const { data: next, origin } = await loadSnapshot();
  if (next) applySnapshot(next, origin);
  const delta = job.delta || compareSnapshots(before, next);
  showRefreshResult(
    job.status === "updated" ? "updated" : "no_change",
    job.status === "updated" ? "重算完成，数字已更新" : "重算完成，没有新变化",
    job.summary || "已按 GitLab 最新状态重算。",
    delta,
  );
  showToast(job.summary || "重算完成。");
  if ((delta?.new_released || 0) > 0) celebrate();
}

/**
 * 「更新数据」的主入口。
 * 先拉最新已发布快照（免口令、任何网络都行）；只有在快照过期或用户主动要求时，
 * 才凭口令让内网重算——这样绝大多数点击是零成本的，也不用天天输口令。
 */
async function updateData({ force = false } = {}) {
  if (refreshing) return;
  setRefreshButtons(true);
  showRefreshResult("running", "正在取最新进展", "先拉一次已发布的最新快照。");

  try {
    const before = data;
    const { data: next, origin } = await loadSnapshot();
    if (next) applySnapshot(next, origin);
    const delta = compareSnapshots(before, next);

    if (force) {
      await recompute("公网手动强制重算");
      return;
    }

    if (delta.changed) {
      showRefreshResult("updated", "已拿到更新的数据", `快照生成于 ${formatAge(next?.meta?.generated_at)}。`, delta, {
        offerRecompute: true,
      });
      showToast("战报已更新。");
      if (delta.new_released > 0) celebrate();
      return;
    }

    if (!relayBase) {
      showRefreshResult(
        "no_change",
        "已是当前已发布的最新数据",
        `快照生成于 ${formatAge(data.meta?.generated_at)}。实时重算尚未启用（中继未配置），本页只能读到定时发布的快照。`,
        delta,
      );
      return;
    }

    if (isStale()) {
      showRefreshResult("running", "快照有点旧了", "正在唤起内网重算，拿此刻的真实数字。");
      await recompute("公网点击更新，快照已过期");
      return;
    }

    showRefreshResult(
      "no_change",
      "已是最新，没有变化",
      `快照生成于 ${formatAge(data.meta?.generated_at)}，还在新鲜期内，不需要打扰内网。`,
      delta,
      { offerRecompute: true },
    );
  } catch (error) {
    showRefreshResult("blocked", "更新没有完成", error.message, null, { offerRecompute: true });
    showToast(`更新失败：${error.message}`);
  } finally {
    setRefreshButtons(false);
  }
}

/* ---------------------------------------------------------------- 本地清单 */

function openComposer(personId = "") {
  const form = $("#demand-composer");
  form.hidden = false;
  if (personId) $("#demand-pm").value = personId;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => $("#demand-title").focus(), 350);
}

function closeComposer() {
  $("#demand-composer").hidden = true;
}

function createWish(form) {
  const fields = new FormData(form);
  const title = String(fields.get("title") || "").trim();
  const personId = String(fields.get("person_id") || "");
  if (!title || !personById(personId)) return;
  wishlist.unshift({
    id: `LOCAL-${Date.now()}`,
    title,
    detail: String(fields.get("detail") || "").trim(),
    person_id: personId,
    category: String(fields.get("category") || "user_request"),
    priority: String(fields.get("priority") || "P1"),
    submitted_at: new Date().toISOString(),
  });
  form.reset();
  closeComposer();
  saveWishlist();
  showToast("已记进你的本地清单；真正开工后会在 GitLab 上被自动统计到。");
}

function celebrate() {
  const target = $("#confetti");
  const colors = ["#dfff4f", "#ff6b58", "#7b61ff", "#50d6d1", "#fffdf7"];
  target.replaceChildren(...Array.from({ length: 42 }, (_, index) => {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--drift", `${(Math.random() - .5) * 220}px`);
    piece.style.animationDelay = `${Math.random() * .35}s`;
    return piece;
  }));
  window.setTimeout(() => target.replaceChildren(), 2300);
}

/* ---------------------------------------------------------------- 事件 */

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-refresh-update]")) return void updateData();
  if (event.target.closest("#force-recompute")) return void updateData({ force: true });
  if (event.target.closest("[data-open-composer]")) return openComposer();
  if (event.target.closest("[data-close-composer]")) return closeComposer();
  const starter = event.target.closest("[data-start-pm]");
  if (starter) return openComposer(starter.dataset.startPm);
  if (event.target.closest("#celebrate-button")) return celebrate();

  const filter = event.target.closest("[data-trace-filter]");
  if (filter) {
    traceFilter = filter.dataset.traceFilter;
    document.querySelectorAll("[data-trace-filter]").forEach((chip) => chip.classList.toggle("is-on", chip === filter));
    return renderTrace();
  }

  const card = event.target.closest("[data-pending-id]");
  if (!card) return;
  const id = card.dataset.pendingId;
  if (event.target.closest("[data-remove-pending]")) {
    wishlist = wishlist.filter((item) => item.id !== id);
    saveWishlist();
    showToast("已从清单移除。");
  }
  if (event.target.closest("[data-edit-detail]")) {
    const editor = card.querySelector(".pending-edit");
    editor.hidden = !editor.hidden;
    if (!editor.hidden) editor.querySelector("textarea").focus();
  }
  if (event.target.closest("[data-save-detail]")) {
    const item = wishlist.find((entry) => entry.id === id);
    if (item) item.detail = card.querySelector(".pending-edit textarea").value.trim();
    saveWishlist();
    showToast("补充信息已保存。");
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "trace-person") {
    tracePerson = event.target.value;
    return renderTrace();
  }

  const select = event.target.closest("[data-reassign]");
  if (!select) return;
  const card = select.closest("[data-pending-id]");
  const item = wishlist.find((entry) => entry.id === card.dataset.pendingId);
  if (item && personById(select.value)) {
    item.person_id = select.value;
    saveWishlist();
    showToast(`已交给 ${personById(select.value).display_name}。`);
  }
});

$("#demand-composer").addEventListener("submit", (event) => {
  event.preventDefault();
  createWish(event.currentTarget);
});

/* ---------------------------------------------------------------- 启动 */

renderAll();
await loadRelayConfig();
const initial = await loadSnapshot();
if (initial.data) applySnapshot(initial.data, initial.origin);
