const STORAGE_KEY = "pain-off-pending-v1";
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

async function loadData() {
  try {
    const response = await fetch(`./data/latest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return window.DEMAND_PULSE_DATA || { meta: {}, records: [], people: [] };
  }
}

function loadPending() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

const data = await loadData();
let pending = loadPending();

function personById(id) {
  return data.people.find((person) => person.id === id);
}

function normalizedPending() {
  return pending.map((item) => ({
    ...item,
    kind: "user_pain",
    unique: true,
    status: "submitted",
    person_display: personById(item.person_id)?.display_name || "待认领",
    pain_category: item.title,
    public_title: item.title,
    public_outcome: item.detail || "等待补充处理信息。",
    evidence_level: "待处理",
    local: true,
  }));
}

function combinedRecords() {
  return [...data.records, ...normalizedPending()];
}

function savePending() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  renderAll();
}

function derive() {
  const records = combinedRecords().filter((item) => item.unique !== false);
  const released = records.filter((item) => LANDED.has(item.status));
  const e2ePeople = new Set(released.map((item) => item.person_id));
  return { records, released, e2ePeople };
}

function renderStats(derived) {
  const stats = [
    { label: "已上线用户痛点", value: derived.released.length, note: "用户已经用得上", tone: "acid" },
    { label: "已提交", value: derived.records.length, note: pending.length ? `含 ${pending.length} 个本地待处理` : "累计唯一需求", tone: "paper" },
    { label: "端到端能力升级", value: `${derived.e2ePeople.size}人`, note: "已从需求跑到上线", tone: "cyan" },
  ];
  document.querySelector("#score-grid").innerHTML = stats.map((item) => `
    <article class="score-card ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.note)}</small>
    </article>`).join("");
  document.querySelector("#hero-lead").textContent = data.meta?.headline
    || `${derived.records.length} 个已提交，${derived.released.length} 个已上线。`;
  document.querySelector("#impact-stamp").textContent = `${derived.released.length} 个痛点 OFF`;
}

function renderPending() {
  const target = document.querySelector("#pending-list");
  if (!pending.length) {
    target.innerHTML = `
      <div class="pending-empty">
        <span>✦</span>
        <div><b>待处理区还是空的</b><p>把那些“小到排不上、大到用户天天遇见”的问题先放进来。</p></div>
        <button class="text-button" type="button" data-open-composer>创建第一个需求 →</button>
      </div>`;
    return;
  }
  target.innerHTML = pending.map((item, index) => {
    const person = personById(item.person_id);
    const category = CATEGORY_META[item.category] || CATEGORY_META.user_request;
    return `
      <article class="pending-card" data-pending-id="${escapeHtml(item.id)}">
        <div class="pending-index">${String(index + 1).padStart(2, "0")}</div>
        <div class="pending-main">
          <div class="tag-row"><span class="tag category-${escapeHtml(item.category)}">${category.symbol} ${escapeHtml(category.title)}</span><span class="tag priority">${escapeHtml(item.priority)}</span>${item.originally_unscheduled ? '<span class="tag unlocked">原本无排期</span>' : ""}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.detail || "还可以补充场景、影响范围或参考信息。")}</p>
          <div class="pending-edit" hidden>
            <textarea maxlength="240" aria-label="补充需求信息">${escapeHtml(item.detail || "")}</textarea>
            <button class="text-button" type="button" data-save-detail>保存补充</button>
          </div>
        </div>
        <div class="pending-owner">
          <label>PM<select data-reassign aria-label="重新选择 PM">${data.people.map((option) => `<option value="${escapeHtml(option.id)}"${option.id === item.person_id ? " selected" : ""}>${escapeHtml(option.display_name)}</option>`).join("")}</select></label>
          <span>${escapeHtml(person?.avatar || "✦")} ${formatDate(item.submitted_at)}</span>
        </div>
        <div class="pending-actions">
          <button type="button" data-edit-detail>补充信息</button>
          <button type="button" data-remove-pending>移除</button>
        </div>
      </article>`;
  }).join("");
}

function renderQuadrants(derived) {
  document.querySelector("#quadrant-grid").innerHTML = CATEGORY_ORDER.map((categoryKey) => {
    const meta = CATEGORY_META[categoryKey];
    const records = derived.records.filter((item) => item.category === categoryKey);
    const released = records.filter((item) => LANDED.has(item.status)).length;
    return `
      <section class="quadrant quadrant-${categoryKey}">
        <header><span class="quadrant-symbol">${meta.symbol}</span><div><h3>${escapeHtml(meta.title)}</h3><small>${escapeHtml(meta.kicker)}</small></div><b>${records.length}</b></header>
        <div class="quadrant-items">${records.length ? records.map((item) => `
          <div class="map-ticket ${LANDED.has(item.status) ? "is-done" : "is-open"}">
            <i aria-hidden="true"></i><span>${escapeHtml(item.public_title || item.pain_category)}</span><small>${escapeHtml(item.person_display)} · ${escapeHtml(STATUS_LABELS[item.status] || "待处理")}</small>
          </div>`).join("") : '<span class="quadrant-empty">等待一个值得做的想法</span>'}</div>
        <footer><span>${released} 已解决</span><span>${records.length - released} 待解决</span></footer>
      </section>`;
  }).join("");
  document.querySelector("#map-summary").textContent = `${derived.released.length} 个已解决 · ${derived.records.length - derived.released.length} 个待解决`;
}

function renderTeam(derived) {
  const peopleStats = data.people.map((person) => {
    const records = derived.records.filter((item) => item.person_id === person.id);
    const released = records.filter((item) => LANDED.has(item.status));
    return { ...person, total: records.length, released: released.length };
  });
  const achievers = peopleStats.filter((person) => person.total > 0)
    .sort((a, b) => b.released - a.released || b.total - a.total);
  const starters = peopleStats.filter((person) => person.total === 0);
  document.querySelector("#achiever-grid").innerHTML = achievers.map((person, index) => `
    <article class="achiever-card">
      <span class="achiever-rank">0${index + 1}</span>
      <span class="avatar">${escapeHtml(person.avatar)}</span>
      <div><h3>${escapeHtml(person.display_name)}</h3><p>${person.released ? '<b>端到端已跑通</b>' : "正在推进首个需求"}</p></div>
      <dl><div><dt>已提交</dt><dd>${person.total}</dd></div><div><dt>已上线</dt><dd>${person.released}</dd></div></dl>
    </article>`).join("");
  document.querySelector("#starter-dock").innerHTML = starters.length ? `
    <div class="starter-copy"><span>READY?</span><b>等待首发</b><p>给一个真实问题，就能开始。</p></div>
    <div class="starter-people">${starters.map((person) => `
      <button type="button" data-start-pm="${escapeHtml(person.id)}"><span>${escapeHtml(person.avatar)}</span><b>${escapeHtml(person.display_name)}</b><small>给 TA 一个需求 ＋</small></button>`).join("")}</div>` : "";
}

function renderValue(derived) {
  const timed = derived.released.filter((item) => item.baseline_date && item.released_at);
  const dayValues = timed.map((item) => Math.max(0, Math.round((new Date(item.baseline_date) - new Date(item.released_at)) / 86400000)))
    .filter(Number.isFinite);
  const average = dayValues.length ? `${Math.round(dayValues.reduce((sum, value) => sum + value, 0) / dayValues.length)}天` : "待基线";
  const trackedUnscheduled = derived.records.filter((item) => typeof item.originally_unscheduled === "boolean");
  const unlocked = trackedUnscheduled.length
    ? derived.released.filter((item) => item.originally_unscheduled === true).length
    : "待记录";
  const cards = [
    { symbol: "↯", label: "平均提前交付", value: average, note: dayValues.length ? "用户少等的平均天数" : "有计划日与上线日后自动计算" },
    { symbol: "∞", label: "排期外解锁", value: unlocked, note: trackedUnscheduled.length ? "原本无排期但最终上线" : "从新需求开始标记" },
  ];
  document.querySelector("#value-grid").innerHTML = cards.map((item) => `
    <article class="value-card"><span>${item.symbol}</span><div><small>${item.label}</small><strong>${item.value}</strong><p>${item.note}</p></div></article>`).join("");
}

function renderWall(derived) {
  const target = document.querySelector("#impact-wall");
  if (!data.records.length) {
    target.innerHTML = '<div class="empty-state">等待第一个可以被用户感受到的改变。</div>';
    return;
  }
  target.innerHTML = data.records.map((item) => {
    const category = CATEGORY_META[item.category] || CATEGORY_META.user_request;
    return `
      <article class="impact-card ${LANDED.has(item.status) ? "done" : "moving"}">
        <div class="tag-row"><span class="tag category-${escapeHtml(item.category)}">${category.symbol} ${escapeHtml(category.title)}</span><span class="tag priority">${escapeHtml(item.priority)}</span></div>
        <h3>${escapeHtml(item.pain_category)}</h3>
        <p>${escapeHtml(item.public_outcome)}</p>
        <footer><span>${escapeHtml(item.person_display)}</span><b>${escapeHtml(STATUS_LABELS[item.status] || item.evidence_level)}</b></footer>
      </article>`;
  }).join("");
}

function renderMeta() {
  const cutoff = data.meta?.last_change_at || data.meta?.cutoff;
  document.querySelector("#freshness-label").textContent = `更新于 ${formatDate(cutoff)}`;
  document.querySelector("#cutoff-label").textContent = `更新于 ${formatDate(cutoff, true)}`;
  document.querySelector("#demand-pm").innerHTML = data.people.map((person) => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.display_name)}</option>`).join("");
}

function renderAll() {
  const derived = derive();
  renderStats(derived);
  renderPending();
  renderQuadrants(derived);
  renderTeam(derived);
  renderValue(derived);
  renderWall(derived);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function openComposer(personId = "") {
  const form = document.querySelector("#demand-composer");
  form.hidden = false;
  if (personId) document.querySelector("#demand-pm").value = personId;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => document.querySelector("#demand-title").focus(), 350);
}

function closeComposer() {
  document.querySelector("#demand-composer").hidden = true;
}

function createPending(form) {
  const fields = new FormData(form);
  const title = String(fields.get("title") || "").trim();
  const personId = String(fields.get("person_id") || "");
  if (!title || !personById(personId)) return;
  pending.unshift({
    id: `LOCAL-${Date.now()}`,
    title,
    detail: String(fields.get("detail") || "").trim(),
    person_id: personId,
    category: String(fields.get("category") || "user_request"),
    priority: String(fields.get("priority") || "P1"),
    baseline_date: String(fields.get("baseline_date") || "") || null,
    originally_unscheduled: fields.get("originally_unscheduled") === "on",
    submitted_at: new Date().toISOString(),
  });
  form.reset();
  closeComposer();
  savePending();
  showToast("已加入待处理区；可以继续补充信息或调整 PM。");
}

async function exportUpdatePacket() {
  const packet = {
    schema: "pain-off-update-packet/v1",
    generated_at: new Date().toISOString(),
    action: pending.length ? "verify_and_merge_delta" : "recheck_latest_delta",
    source_cutoff: data.meta?.cutoff || null,
    changes: pending.map(({ id, ...item }) => ({ client_id: id, ...item })),
    current_snapshot: {
      confirmed_records: data.records.length,
      pending_records: pending.length,
      pm_scope: data.people.map((person) => ({ id: person.id, display_name: person.display_name })),
    },
    update_rule: [
      "只核验 source_cutoff 之后的新增或状态变化",
      "按问题与交付结果去重，补充信息不新增计数",
      "生产可用才标记 released，代码合并只标记 merged",
      "核验后更新 latest.json、构建测试并发布",
    ],
  };
  const json = `${JSON.stringify(packet, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pain-off-update-packet-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  try { await navigator.clipboard.writeText(json); } catch (error) { /* 下载已完成 */ }
  showToast(pending.length
    ? `更新包已生成：${pending.length} 个待核验需求。交给 Codex 即可增量更新。`
    : "空增量包已生成，可用于复核截止时间后的最新变化。");
}

function celebrate() {
  const target = document.querySelector("#confetti");
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

document.addEventListener("click", (event) => {
  const open = event.target.closest("[data-open-composer]");
  if (open) return openComposer();
  if (event.target.closest("[data-close-composer]")) return closeComposer();
  if (event.target.closest("[data-export-update]")) return exportUpdatePacket();
  const starter = event.target.closest("[data-start-pm]");
  if (starter) return openComposer(starter.dataset.startPm);
  if (event.target.closest("#celebrate-button")) return celebrate();
  const card = event.target.closest("[data-pending-id]");
  if (!card) return;
  const id = card.dataset.pendingId;
  if (event.target.closest("[data-remove-pending]")) {
    pending = pending.filter((item) => item.id !== id);
    savePending();
    showToast("已从待处理区移除。");
  }
  if (event.target.closest("[data-edit-detail]")) {
    const editor = card.querySelector(".pending-edit");
    editor.hidden = !editor.hidden;
    if (!editor.hidden) editor.querySelector("textarea").focus();
  }
  if (event.target.closest("[data-save-detail]")) {
    const item = pending.find((entry) => entry.id === id);
    if (item) item.detail = card.querySelector(".pending-edit textarea").value.trim();
    savePending();
    showToast("补充信息已保存。");
  }
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-reassign]");
  if (!select) return;
  const card = select.closest("[data-pending-id]");
  const item = pending.find((entry) => entry.id === card.dataset.pendingId);
  if (item && personById(select.value)) {
    item.person_id = select.value;
    savePending();
    showToast(`已交给 ${personById(select.value).display_name}。`);
  }
});

document.querySelector("#demand-composer").addEventListener("submit", (event) => {
  event.preventDefault();
  createPending(event.currentTarget);
});

renderMeta();
renderAll();
