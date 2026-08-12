const STATUS_ORDER = ["submitted", "building", "merged", "released", "impact_confirmed"];
const STATUS_LABELS = {
  submitted: "已提交",
  building: "开发中",
  merged: "已合并",
  released: "已上线",
  impact_confirmed: "效果确认",
  unknown: "待核验",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

async function loadData() {
  try {
    const response = await fetch(`./data/latest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return window.DEMAND_PULSE_DATA || { meta: {}, records: [], people: [], boundaries: [] };
  }
}

function derive(data) {
  const records = Array.isArray(data.records) ? data.records : [];
  const painPoints = records.filter((item) => item.kind === "user_pain" && item.unique !== false);
  const resolvedPainPoints = painPoints.filter((item) => ["released", "impact_confirmed"].includes(item.status));
  const impactConfirmed = painPoints.filter((item) => item.status === "impact_confirmed");
  const landed = records.filter((item) => ["released", "impact_confirmed"].includes(item.status));
  const inDelivery = records.filter((item) => ["building", "merged"].includes(item.status));
  const contributors = new Set(records.map((item) => item.person_id).filter(Boolean));
  return { records, painPoints, resolvedPainPoints, impactConfirmed, landed, inDelivery, contributors };
}

function renderScore(data, derived) {
  const total = derived.records.filter((item) => item.unique !== false).length;
  const confirmed = derived.resolvedPainPoints.length;
  const coverage = data.meta?.coverage || {};
  const checked = Number(coverage.checked_members) || 0;
  const active = Number(coverage.active_members) || 0;
  const stats = [
    ["已上线用户痛点", confirmed, "生产环境可直接验证，不把测试完成当上线"],
    ["累计唯一需求", total, "追问、补充与重复任务不重复计算"],
    ["全团队已核验", active ? `${checked}/${active}` : checked, "先拿完整名单，再逐人查记录"],
    ["提交过的队友", derived.contributors.size, "需求提出人与代码协作者分开识别"],
    ["仍在推进", derived.inDelivery.length, "已开发或测试完成、生产待核"],
  ];
  document.querySelector("#score-grid").innerHTML = stats.map(([label, value, note]) => `
    <article class="score-card">
      <span class="label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </article>`).join("");

  document.querySelector("#pain-count").textContent = derived.painPoints.length;
  document.querySelector("#impact-stamp").textContent = `${confirmed} 个上线 · ${derived.inDelivery.length} 个推进`;
  document.querySelector("#hero-lead").textContent = data.meta?.headline
    || `累计识别 ${derived.painPoints.length} 个用户痛点，其中 ${confirmed} 个已在生产环境验证。`;
}

function renderLeaders(data) {
  const people = Array.isArray(data.people) ? [...data.people] : [];
  people.sort((a, b) => (b.total || 0) - (a.total || 0) || (b.landed || 0) - (a.landed || 0));
  const max = Math.max(1, ...people.map((item) => item.total || 0));
  const target = document.querySelector("#leaderboard");
  if (!people.length) {
    target.innerHTML = '<div class="empty-state">正在等待第一批可确认的贡献记录。</div>';
    return;
  }
  target.innerHTML = people.map((person, index) => `
    <article class="leader-row">
      <span class="rank">${String(index + 1).padStart(2, "0")}</span>
      <div class="person"><span class="avatar">${escapeHtml(person.avatar || "✦")}</span><span class="person-copy"><b>${escapeHtml(person.display_name || "共创队友")}</b><small>${person.total ? `${person.landed || 0} 项已上线` : "已核验 · 暂无记录"}</small></span></div>
      <div class="energy" aria-label="累计 ${person.total || 0} 项"><div class="energy-track"><div class="energy-fill${person.total ? "" : " is-zero"}" style="width:${person.total ? Math.round(((person.total || 0) / max) * 100) : 0}%"></div></div></div>
      <div class="leader-metric"><b>${person.total || 0}</b><span>累计需求</span></div>
      <div class="leader-metric landed"><b>${person.landed || 0}</b><span>已上线</span></div>
    </article>`).join("");
}

function renderPipeline(derived) {
  const target = document.querySelector("#pipeline-board");
  target.innerHTML = STATUS_ORDER.map((status) => {
    const records = derived.records.filter((item) => item.status === status);
    return `<section class="lane" aria-label="${STATUS_LABELS[status]}">
      <div class="lane-head">${STATUS_LABELS[status]}<span>${records.length}</span></div>
      <div class="lane-stack">${records.length ? records.map((item) => `
        <article class="ticket"><b>${escapeHtml(item.public_title || "脱敏需求")}</b><span>${escapeHtml(item.person_display || "共创队友")} · ${formatDate(item.submitted_at)}</span></article>`).join("") : '<div class="empty-lane">等待新的证据</div>'}</div>
    </section>`;
  }).join("");
}

function renderWall(derived) {
  const painPoints = derived.painPoints;
  const target = document.querySelector("#impact-wall");
  if (!painPoints.length) {
    target.innerHTML = '<div class="empty-state">尚无达到公开展示门槛的用户痛点记录。</div>';
    return;
  }
  target.innerHTML = painPoints.map((item, index) => `
    <article class="impact-card">
      <span class="status">${escapeHtml(STATUS_LABELS[item.status] || STATUS_LABELS.unknown)}</span>
      <h3>${escapeHtml(item.pain_category || `用户痛点 ${String(index + 1).padStart(2, "0")}`)}</h3>
      <p>${escapeHtml(item.public_outcome || "改动结果仍在核验，不提前宣称已解决。")}</p>
      <footer>${escapeHtml(item.person_display || "共创队友")} · ${escapeHtml(item.evidence_level || "证据待补")}</footer>
    </article>`).join("");
}

function renderMeta(data, derived) {
  const cutoff = data.meta?.cutoff || "—";
  document.querySelector("#cutoff-label").textContent = `数据截止：${formatDate(cutoff)}`;
  document.querySelector("#freshness-label").textContent = `定期核验 · 最近变化 ${formatDate(data.meta?.last_change_at || cutoff)}`;
  const boundaries = Array.isArray(data.boundaries) && data.boundaries.length
    ? data.boundaries
    : ["只统计有可定位证据的记录", "同一需求的追问与补充不重复计算", "代码合并不自动等于用户痛点已解决"];
  document.querySelector("#boundary-list").innerHTML = boundaries.map((item) => `<div class="boundary-item">${escapeHtml(item)}</div>`).join("");
  document.querySelector("#source-note").textContent = data.meta?.source_note
    || `当前公开数据包含 ${derived.records.length} 条脱敏记录；内部原始证据不进入 GitHub Pages。`;
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

const data = await loadData();
const derived = derive(data);
renderScore(data, derived);
renderLeaders(data);
renderPipeline(derived);
renderWall(derived);
renderMeta(data, derived);
document.querySelector("#celebrate-button").addEventListener("click", celebrate);
