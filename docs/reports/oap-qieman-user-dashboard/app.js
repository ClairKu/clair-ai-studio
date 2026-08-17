const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41792";
const LOCAL_DATA_KEY = "clair-oap-qieman-dashboard-latest-v1";
const LOCAL_HEADER = { "X-Clair-Dashboard": "oap-qieman-user-dashboard-v1" };

const number = new Intl.NumberFormat("zh-CN");
const oneDecimal = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);

let currentData = null;
let selectedCohortId = "active_30d";
let behaviorMode = "penetration";
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTime(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isNewerSnapshot(candidate, baseline) {
  if (!candidate) return false;
  if (!baseline) return true;
  const candidateCutoff = parseTime(candidate.meta?.data_cutoff);
  const baselineCutoff = parseTime(baseline.meta?.data_cutoff);
  if (candidateCutoff !== baselineCutoff) return candidateCutoff > baselineCutoff;
  return parseTime(candidate.meta?.generated_at) > parseTime(baseline.meta?.generated_at);
}

function approximately(left, right, tolerance = 0.0015) {
  return Math.abs(Number(left) - Number(right)) <= tolerance;
}

function formatDateTime(value, includeYear = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: includeYear ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value || "—";
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function compact(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 100000000) return `${oneDecimal.format(amount / 100000000)} 亿`;
  if (Math.abs(amount) >= 10000) return `${oneDecimal.format(amount / 10000)} 万`;
  return number.format(amount);
}

function money(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 100000000) return `${(amount / 100000000).toFixed(2)} 亿`;
  if (Math.abs(amount) >= 10000) return `${oneDecimal.format(amount / 10000)} 万`;
  return `${number.format(amount)} 元`;
}

function validateData(data) {
  if (!data || data.schema_version !== "oap-qieman-user-dashboard-v1") throw new Error("数据版本不兼容");
  if (!parseTime(data.meta?.data_cutoff) || !/^\d{4}-\d{2}-\d{2}$/.test(data.meta?.asset_snapshot_date || "")) {
    throw new Error("数据截止时间缺失");
  }
  if (data.meta?.timezone !== "Asia/Shanghai" || data.meta?.minimum_public_cell !== 20) throw new Error("时间或隐私口径异常");

  const usage = data.usage || {};
  const requiredUsage = ["approved_users", "ever_called_users", "active_30d_users", "total_calls", "attributed_calls", "unattributed_calls", "calls_30d"];
  for (const key of requiredUsage) {
    if (!Number.isInteger(usage[key]) || usage[key] < 0) throw new Error(`使用指标 ${key} 无效`);
  }
  if (!(usage.approved_users >= usage.ever_called_users && usage.ever_called_users >= usage.active_30d_users)) throw new Error("三组人群层级不闭合");
  if (usage.total_calls !== usage.attributed_calls + usage.unattributed_calls) throw new Error("调用归属无法闭合");

  const expectedIds = ["approved", "called", "active_30d"];
  if (!Array.isArray(data.cohorts) || data.cohorts.length !== expectedIds.length) throw new Error("人群数据缺失");
  for (const [index, cohort] of data.cohorts.entries()) {
    if (cohort.id !== expectedIds[index]) throw new Error("人群顺序或标识异常");
    if (!Number.isInteger(cohort.users) || cohort.users !== usage[`${cohort.id === "called" ? "ever_called" : cohort.id}_users`]) throw new Error(`${cohort.id} 人数不一致`);
    for (const key of ["qieman_accounts", "holders", "managed_accounts", "profitable_holders"]) {
      if (!Number.isInteger(cohort[key]) || cohort[key] < 0) throw new Error(`${cohort.id}.${key} 无效`);
    }
    if (!(cohort.users >= cohort.qieman_accounts && cohort.qieman_accounts >= cohort.holders && cohort.holders >= cohort.managed_accounts)) throw new Error(`${cohort.id} 持仓层级不闭合`);
    if (cohort.profitable_holders > cohort.holders || cohort.aum_yuan < 0 || cohort.average_holder_asset_yuan < 0) throw new Error(`${cohort.id} 资产指标异常`);
    const ratePairs = [
      ["qieman_account_rate", cohort.qieman_accounts / cohort.users],
      ["holder_rate", cohort.holders / cohort.users],
      ["managed_rate", cohort.managed_accounts / cohort.users],
      ["profitable_holder_rate", cohort.holders ? cohort.profitable_holders / cohort.holders : 0],
    ];
    for (const [key, expected] of ratePairs) {
      if (!approximately(cohort[key], expected)) throw new Error(`${cohort.id}.${key} 与分子分母不一致`);
    }
    if (!Array.isArray(cohort.asset_buckets) || cohort.asset_buckets.length !== 5) throw new Error(`${cohort.id} 资产分层缺失`);
    const bucketTotal = cohort.asset_buckets.reduce((sum, row) => sum + row.count, 0);
    const shareTotal = cohort.asset_buckets.reduce((sum, row) => sum + row.share, 0);
    if (bucketTotal !== cohort.holders || !approximately(shareTotal, 1, 0.006)) throw new Error(`${cohort.id} 资产分层不闭合`);
    if (cohort.asset_buckets.some((row) => row.count < data.meta.minimum_public_cell)) throw new Error(`${cohort.id} 出现小于公开阈值的分组`);
  }

  if (!data.behavior?.by_cohort || !Array.isArray(data.behavior.categories)) throw new Error("行为数据缺失");
  const categoryKeys = data.behavior.categories.map((item) => item.key);
  for (const cohort of data.cohorts) {
    const rows = data.behavior.by_cohort[cohort.id];
    if (!Array.isArray(rows) || rows.length !== categoryKeys.length) throw new Error(`${cohort.id} 行为分类缺失`);
    for (const [index, row] of rows.entries()) {
      if (row.key !== categoryKeys[index] || !Number.isInteger(row.actors) || !Number.isInteger(row.events)) throw new Error(`${cohort.id} 行为字段异常`);
      if (row.actors > cohort.users || row.actors < data.meta.minimum_public_cell || row.events < row.actors) throw new Error(`${cohort.id}.${row.key} 行为数量异常`);
      if (!approximately(row.penetration, row.actors / cohort.users, 0.00025)) throw new Error(`${cohort.id}.${row.key} 参与率不一致`);
      if (!approximately(row.events_per_actor, row.events / row.actors, 0.015)) throw new Error(`${cohort.id}.${row.key} 人均频次不一致`);
    }
  }

  if (!Array.isArray(data.profile?.dimensions) || data.profile.dimensions.length < 4) throw new Error("画像维度不足");
  for (const item of data.profile.dimensions) {
    if (item.sample < data.meta.minimum_public_cell || item.count > item.sample || !approximately(item.share, item.count / item.sample, 0.002)) throw new Error(`画像 ${item.key} 不闭合`);
  }
  if (!Array.isArray(data.quality_checks) || data.quality_checks.length < 4 || !Array.isArray(data.definitions)) throw new Error("数据健康或口径缺失");

  const publicText = JSON.stringify(data);
  const forbidden = /(account3|broker_user|union_id|user_id|po_manager|手机号|phone|email|邮箱|ying99_|redash|api[_ -]?key|access[_ -]?token|view[_ -]?token)/i;
  if (forbidden.test(publicText)) throw new Error("公开数据包含内部标识、PII 或凭证字段");
  return data;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadPublishedData(fresh = false) {
  try {
    const response = await fetch(`${DATA_URL}${fresh ? `?v=${Date.now()}` : ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateData(await response.json());
  } catch (error) {
    if (window.OAP_QIEMAN_DASHBOARD_DATA) return validateData(window.OAP_QIEMAN_DASHBOARD_DATA);
    throw error;
  }
}

function loadSavedLocalData() {
  try { return validateData(JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "null")); } catch { return null; }
}

function saveLocalData(data) {
  try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data)); } catch { /* optional cache */ }
}

function cohortById(id = selectedCohortId) {
  return currentData?.cohorts.find((item) => item.id === id) || currentData?.cohorts.at(-1);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function setFreshness(mode, text) {
  const freshness = $("#freshness");
  freshness.classList.toggle("is-loading", mode === "loading");
  freshness.classList.toggle("is-error", mode === "error");
  freshness.querySelector("span").textContent = text;
}

function setRefreshStatus(message, progressUrl = "") {
  const status = $("#refresh-status");
  status.textContent = message;
  if (!progressUrl) return;
  try {
    const url = new URL(progressUrl);
    if (url.protocol === "https:" && url.hostname === "ontology.yingmi-inc.com") {
      status.append(" ");
      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "查看本体进度";
      status.append(link);
    }
  } catch { /* ignore invalid progress URLs */ }
}

function renderHero() {
  const { usage, meta } = currentData;
  const cohort = cohortById("active_30d");
  const humanRate = usage.attributed_calls / usage.total_calls;
  const serviceRate = usage.unattributed_calls / usage.total_calls;
  $("#total-calls").textContent = compact(usage.total_calls);
  $("#human-call-rate").textContent = percent.format(humanRate);
  $("#service-call-rate").textContent = percent.format(serviceRate);
  requestAnimationFrame(() => { $("#human-call-share").style.width = `${humanRate * 100}%`; });
  $("#hero-aum").textContent = money(cohort.aum_yuan);
  $("#hero-holders").textContent = number.format(cohort.holders);
  $("#hero-holder-rate").textContent = percent.format(cohort.holder_rate);
  $("#hero-lead").textContent = `截至 ${formatDateTime(meta.data_cutoff)}，${number.format(usage.approved_users)} 位批准用户中，${percent.format(usage.ever_called_users / usage.approved_users)} 曾调用，${percent.format(usage.active_30d_users / usage.approved_users)} 在近 30 日保持活跃。`;
  $("#verdict").textContent = `近 30 日活跃人群的且慢持仓率为 ${percent.format(cohort.holder_rate)}，高于批准用户的 ${percent.format(cohortById("approved").holder_rate)}；但 ${percent.format(serviceRate)} 调用仍无法归属到人，规模与用户价值必须拆账。`;
  $("#footer-cutoff").textContent = `OAP / 行为截至 ${formatDateTime(meta.data_cutoff, true)} · 资产快照 ${formatDay(meta.asset_snapshot_date)}`;
  setFreshness("ready", `数据截至 ${formatDateTime(meta.data_cutoff)}`);
}

function cohortButtonMarkup(cohort, index, compactMode = false) {
  const usage = currentData.usage;
  const ratioLabel = index === 0
    ? "人群起点"
    : index === 1
      ? `${percent.format(cohort.users / usage.approved_users)} / 批准用户`
      : `${percent.format(cohort.users / usage.ever_called_users)} / 历史调用`;
  if (compactMode) {
    return `<button type="button" data-cohort="${cohort.id}" class="${cohort.id === selectedCohortId ? "active" : ""}">${escapeHtml(cohort.short_label)}</button>`;
  }
  return `<button type="button" class="cohort-button ${cohort.id === selectedCohortId ? "active" : ""}" data-cohort="${cohort.id}" aria-pressed="${cohort.id === selectedCohortId}">
    <span>0${index + 1} · ${escapeHtml(cohort.label)}</span>
    <strong>${number.format(cohort.users)}</strong>
    <em>${escapeHtml(ratioLabel)}</em>
    <p>${escapeHtml(cohort.definition)}</p>
  </button>`;
}

function renderCohortControls() {
  $("#cohort-ladder").innerHTML = currentData.cohorts.map((cohort, index) => cohortButtonMarkup(cohort, index)).join("");
  $("#cohort-switch").innerHTML = currentData.cohorts.map((cohort, index) => cohortButtonMarkup(cohort, index, true)).join("");
  const usage = currentData.usage;
  $("#cohort-footnotes").innerHTML = [
    `<p><b>${percent.format(usage.ever_called_users / usage.approved_users)}</b> 的批准用户曾产生可归属调用。</p>`,
    `<p><b>${percent.format(usage.active_30d_users / usage.ever_called_users)}</b> 的历史调用用户近 30 日仍活跃。</p>`,
    `<p>近 30 日共 <b>${compact(usage.calls_30d)}</b> 次调用；三组嵌套，不可相加。</p>`,
  ].join("");
  document.querySelectorAll("[data-cohort]").forEach((button) => {
    button.addEventListener("click", () => selectCohort(button.dataset.cohort));
  });
}

function compareRowsMarkup() {
  return currentData.cohorts.map((cohort) => {
    const maximum = 0.3;
    return `<div class="compare-row ${cohort.id === selectedCohortId ? "active" : ""}">
      <span>${escapeHtml(cohort.short_label)}</span>
      <div>
        <div class="compare-track account" title="可关联且慢账户率 ${percent.format(cohort.qieman_account_rate)}"><i style="width:${Math.min(100, cohort.qieman_account_rate / maximum * 100)}%"></i></div>
        <div class="compare-track holder" title="持仓率 ${percent.format(cohort.holder_rate)}"><i style="width:${Math.min(100, cohort.holder_rate / maximum * 100)}%"></i></div>
        <div class="compare-track managed" title="在管率 ${percent.format(cohort.managed_rate)}"><i style="width:${Math.min(100, cohort.managed_rate / maximum * 100)}%"></i></div>
        <small>账户 ${percent.format(cohort.qieman_account_rate)} · 持仓 ${percent.format(cohort.holder_rate)} · 在管 ${percent.format(cohort.managed_rate)}</small>
      </div>
      <em>${percent.format(cohort.holder_rate)}</em>
    </div>`;
  }).join("");
}

function renderHoldings() {
  const cohort = cohortById();
  const baseline = currentData.qieman_baseline;
  $("#selected-cohort-title").textContent = cohort.short_label;
  $("#qieman-accounts").textContent = number.format(cohort.qieman_accounts);
  $("#qieman-account-rate").textContent = `${percent.format(cohort.qieman_account_rate)} / 人群`;
  $("#holders").textContent = number.format(cohort.holders);
  $("#holder-rate").textContent = `${percent.format(cohort.holder_rate)} / 人群`;
  $("#aum").textContent = money(cohort.aum_yuan);
  $("#aum-user-share").textContent = `${number.format(cohort.managed_accounts)} 位在管用户`;
  $("#avg-asset").textContent = money(cohort.average_holder_asset_yuan);
  $("#baseline-multiple").textContent = `${oneDecimal.format(cohort.average_holder_asset_yuan / baseline.average_asset_yuan)}× 且慢户均`;
  $("#cohort-compare").innerHTML = compareRowsMarkup();
  const ring = $("#profit-ring");
  ring.style.setProperty("--rate", (cohort.profitable_holder_rate * 100).toFixed(2));
  ring.setAttribute("aria-label", `${cohort.short_label}中累计收益为正的持仓用户占${percent.format(cohort.profitable_holder_rate)}`);
  $("#profit-rate").textContent = percent.format(cohort.profitable_holder_rate);
  $("#profit-count").textContent = `${number.format(cohort.profitable_holders)} / ${number.format(cohort.holders)} 位持仓用户`;
  $("#profit-note").textContent = `且慢可比口径约为 ${percent.format(baseline.profitable_holder_rate)}。这里只描述历史累计状态，不能解释为 OAP 带来的收益。`;
}

function renderAssets() {
  const cohort = cohortById();
  const buckets = cohort.asset_buckets;
  $("#asset-stacked").innerHTML = buckets.map((row) => `<div class="asset-segment" style="width:${row.share * 100}%" title="${escapeHtml(row.label)}：${number.format(row.count)} 人，${percent.format(row.share)}"><strong>${percent.format(row.share)}</strong></div>`).join("");
  $("#asset-legend").innerHTML = buckets.map((row) => `<article><span>${escapeHtml(row.label)}</span><strong>${percent.format(row.share)}</strong><em>${number.format(row.count)} 人</em></article>`).join("");
  const highAsset = buckets.at(-1).share + buckets.at(-2).share;
  const baseline = currentData.qieman_baseline;
  $("#baseline-callout").innerHTML = `<span><strong>${escapeHtml(cohort.short_label)}</strong>中，50 万以上占 <strong>${percent.format(highAsset)}</strong>，100 万以上占 <strong>${percent.format(buckets.at(-1).share)}</strong>。</span><span>且慢全量参照：50 万以上约 <strong>${percent.format(baseline.share_500k_plus)}</strong>，100 万以上约 <strong>${percent.format(baseline.share_1m_plus)}</strong>。</span>`;
  $("#asset-summary").textContent = `${cohort.short_label}共有 ${number.format(cohort.holders)} 位持仓用户；户均 ${money(cohort.average_holder_asset_yuan)}，但 ${percent.format(buckets[0].share + buckets[1].share)} 的持仓仍低于 10 万。`;
}

function behaviorValue(row) {
  if (behaviorMode === "events") return { value: row.events, label: number.format(row.events), maxKey: "events", note: `${number.format(row.actors)} 位参与者` };
  if (behaviorMode === "frequency") return { value: row.events_per_actor, label: `${oneDecimal.format(row.events_per_actor)} 次`, maxKey: "events_per_actor", note: `${number.format(row.actors)} 位参与者` };
  return { value: row.penetration, label: percent.format(row.penetration), maxKey: "penetration", note: `${number.format(row.actors)} 人 · ${number.format(row.events)} 次事件` };
}

function renderBehavior() {
  const cohort = cohortById();
  const rows = currentData.behavior.by_cohort[cohort.id];
  const categoryMap = new Map(currentData.behavior.categories.map((item) => [item.key, item]));
  const values = rows.map((row) => behaviorValue(row).value);
  const max = Math.max(...values, 1e-9);
  $("#behavior-chart").innerHTML = rows.map((row) => {
    const category = categoryMap.get(row.key);
    const metric = behaviorValue(row);
    return `<div class="behavior-row" data-state="${escapeHtml(category.state)}">
      <span><i></i>${escapeHtml(category.label)}</span>
      <div class="behavior-bar"><i style="width:${metric.value / max * 100}%"></i></div>
      <strong>${escapeHtml(metric.label)}</strong>
      <small>${escapeHtml(metric.note)}${row.amount_yuan ? ` · 金额约 ${money(row.amount_yuan)}` : ""}</small>
    </div>`;
  }).join("");
  const confirmedKeys = new Set(currentData.behavior.categories.filter((item) => item.state === "confirmed").map((item) => item.key));
  const strongest = [...rows].filter((row) => confirmedKeys.has(row.key)).sort((a, b) => b.penetration - a.penetration)[0];
  const strongestCategory = categoryMap.get(strongest.key);
  $("#behavior-highlight").textContent = strongestCategory.label;
  $("#behavior-highlight-copy").textContent = `${cohort.short_label}中有 ${number.format(strongest.actors)} 人参与，渗透率 ${percent.format(strongest.penetration)}，人均 ${oneDecimal.format(strongest.events_per_actor)} 次。活跃人群的多类行为参与率更高，但不能直接解释为 OAP 促成。`;
}

function renderProfile() {
  const profile = currentData.profile;
  $("#survey-coverage").textContent = percent.format(profile.survey_coverage_approx);
  $("#profile-rows").textContent = `${number.format(profile.structured_profile_rows)} 条`;
  $("#profile-note").textContent = profile.note;
  $("#profile-chart").innerHTML = profile.dimensions.map((item) => {
    const baseline = Number.isFinite(item.qieman_baseline) ? item.qieman_baseline : null;
    const left = baseline === null ? item.share : Math.min(item.share, baseline);
    const width = baseline === null ? 0 : Math.abs(item.share - baseline);
    return `<div class="profile-row">
      <span>${escapeHtml(item.label)}</span>
      <div class="dumbbell" aria-label="${escapeHtml(item.label)}：OAP 样本 ${percent.format(item.share)}${baseline === null ? "" : `，且慢基线 ${percent.format(baseline)}`}">
        ${baseline === null ? "" : `<i style="left:${left * 100}%;width:${width * 100}%"></i><b style="left:${baseline * 100}%" title="且慢基线 ${percent.format(baseline)}"></b>`}
        <b style="left:${item.share * 100}%" title="OAP 样本 ${percent.format(item.share)}"></b>
      </div>
      <strong>${percent.format(item.share)}</strong>
      <small>OAP 样本 n=${number.format(item.sample)}${baseline === null ? " · 暂无可比基线" : ` · 且慢基线 ${percent.format(baseline)}`}</small>
    </div>`;
  }).join("");
}

function renderQuality() {
  const counts = currentData.quality_checks.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {});
  $("#quality-score").textContent = `${counts.pass || 0} PASS · ${counts.warn || 0} WARN · ${counts.missing || 0} MISSING`;
  $("#quality-grid").innerHTML = currentData.quality_checks.map((item) => `<article class="quality-card" data-status="${escapeHtml(item.status)}"><span>${escapeHtml(item.status.toUpperCase())}</span><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join("");
}

function buildDocument() {
  const data = currentData;
  const cohort = cohortById();
  const humanRate = data.usage.attributed_calls / data.usage.total_calls;
  const cohortRows = data.cohorts.map((item) => `| ${item.label} | ${number.format(item.users)} | ${percent.format(item.qieman_account_rate)} | ${percent.format(item.holder_rate)} | ${money(item.aum_yuan)} | ${money(item.average_holder_asset_yuan)} |`).join("\n");
  const behaviorRows = data.behavior.by_cohort[cohort.id].map((row) => {
    const category = data.behavior.categories.find((item) => item.key === row.key);
    return `| ${category.label} | ${number.format(row.actors)} | ${percent.format(row.penetration)} | ${number.format(row.events)} | ${oneDecimal.format(row.events_per_actor)} | ${category.state} |`;
  }).join("\n");
  const profileRows = data.profile.dimensions.map((item) => `| ${item.label} | ${item.count}/${item.sample} | ${percent.format(item.share)} | ${item.qieman_baseline === null ? "—" : percent.format(item.qieman_baseline)} |`).join("\n");
  return `# OAP 用户画像 × 且慢持仓与行为看板

> OAP / 行为数据截至：${formatDateTime(data.meta.data_cutoff, true)}
> 资产快照：${formatDay(data.meta.asset_snapshot_date)}
> 近 90 日行为窗口：${formatDay(data.meta.behavior_window_start)}—${formatDay(data.meta.behavior_window_end)}
> 来源：${data.meta.source}
> 隐私：${data.meta.privacy}

## 1. 核心判断

OAP 的“平台规模”和“真人用户价值”必须分开经营。累计 ${compact(data.usage.total_calls)} 次调用中，只有 ${percent.format(humanRate)} 可归属到具体用户；近 30 日活跃人群的且慢持仓率为 ${percent.format(cohortById("active_30d").holder_rate)}，高于批准用户的 ${percent.format(cohortById("approved").holder_rate)}，说明活跃人群与更强的且慢资产、行为特征相关，但尚不能证明由 OAP 导致。

## 2. 三组人群

| 人群 | 用户数 | 且慢账户率 | 持仓率 | 持仓规模 | 持仓户均 |
|---|---:|---:|---:|---:|---:|
${cohortRows}

- 历史调用用户占批准用户 ${percent.format(data.usage.ever_called_users / data.usage.approved_users)}。
- 近 30 日活跃用户占历史调用用户 ${percent.format(data.usage.active_30d_users / data.usage.ever_called_users)}。
- 三组为嵌套关系，不可相加。

## 3. 当前选择：${cohort.label}

- 用户：${number.format(cohort.users)}
- 可关联且慢账户：${number.format(cohort.qieman_accounts)}（${percent.format(cohort.qieman_account_rate)}）
- 当前持仓：${number.format(cohort.holders)}（${percent.format(cohort.holder_rate)}）
- 在管用户：${number.format(cohort.managed_accounts)}（${percent.format(cohort.managed_rate)}）
- 持仓规模：${money(cohort.aum_yuan)}
- 持仓户均：${money(cohort.average_holder_asset_yuan)}；且慢可比口径约 ${money(data.qieman_baseline.average_asset_yuan)}
- 累计收益为正：${number.format(cohort.profitable_holders)}/${number.format(cohort.holders)}（${percent.format(cohort.profitable_holder_rate)}）

## 4. 近 90 日行为

行为按未撤销事件汇总，不等同于最终成交或确认份额。

| 行为 | 参与人数 | 人群参与率 | 事件数 | 人均频次 | 语义状态 |
|---|---:|---:|---:|---:|---|
${behaviorRows}

“其他计划交易”仅部分确认；“SI 交易”含义待补，不能擅自解释成定投。

## 5. 画像样本

画像问卷覆盖约 ${percent.format(data.profile.survey_coverage_approx)}，关键字段缺失率约 84%–89%。以下结论只代表非缺失样本。

| 维度 | 命中/样本 | OAP 样本 | 且慢基线 |
|---|---:|---:|---:|
${profileRows}

## 6. 证据边界

${data.quality_checks.map((item) => `- **${item.status.toUpperCase()}｜${item.label}**：${item.detail}`).join("\n")}

## 7. 产品动作

1. 平台规模拆账：固定分开真人可归属调用与服务/集成调用。
2. 活跃增量验证：按注册时点与资产层级匹配对照，持续观察后续持仓和服务行为。
3. 补画像采集：把画像采集嵌入高价值服务链路；覆盖未达阈值前不做全量外推。

## 8. 更新机制

Clair 的 Mac 上通过仅监听本机的只读更新器调用盈米本体，网页只接收脱敏聚合；浏览器不能传 SQL。结构、口径或隐私校验失败时，保留上一版快照。其他设备只读取最近发布快照。`;
}

function renderDocument() {
  $("#doc-content").textContent = buildDocument();
}

function render(data, mode = "published") {
  currentData = validateData(data);
  if (!currentData.cohorts.some((item) => item.id === selectedCohortId)) selectedCohortId = "active_30d";
  renderHero();
  renderCohortControls();
  renderHoldings();
  renderAssets();
  renderBehavior();
  renderProfile();
  renderQuality();
  renderDocument();
  document.documentElement.dataset.dataMode = mode;
}

function selectCohort(id) {
  if (!currentData?.cohorts.some((item) => item.id === id)) return;
  selectedCohortId = id;
  renderCohortControls();
  renderHoldings();
  renderAssets();
  renderBehavior();
  renderDocument();
}

function selectBehaviorMode(mode) {
  if (!["penetration", "events", "frequency"].includes(mode)) return;
  behaviorMode = mode;
  document.querySelectorAll("[data-behavior-mode]").forEach((button) => button.classList.toggle("active", button.dataset.behaviorMode === mode));
  renderBehavior();
}

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

async function startLocalRefresh() {
  const health = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/health`, { cache: "no-store", headers: LOCAL_HEADER }, 2000);
  if (!health.ok) throw new Error("本机更新器未就绪");
  const healthData = await health.json();
  if (healthData.schema_version && healthData.schema_version !== "oap-qieman-user-dashboard-v1") throw new Error("本机更新器版本不兼容");

  const response = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: { ...LOCAL_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh" }),
  }, 5000);
  if (!response.ok) throw new Error(`本机更新器返回 ${response.status}`);
  const started = await response.json();
  if (!started.job_id) throw new Error("本机更新器没有返回任务编号");
  setRefreshStatus(started.message || "本体查询已开始。", started.progress_url || "");

  for (let attempt = 0; attempt < 360; attempt += 1) {
    await delay(2500);
    const statusResponse = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/status?job=${encodeURIComponent(started.job_id)}&v=${Date.now()}`, {
      cache: "no-store",
      headers: LOCAL_HEADER,
    }, 6000);
    if (!statusResponse.ok) throw new Error(`查询状态返回 ${statusResponse.status}`);
    const status = await statusResponse.json();
    setRefreshStatus(status.message || "本体正在查询。", status.progress_url || "");
    if (status.status === "completed") {
      const refreshed = validateData(status.data);
      saveLocalData(refreshed);
      return refreshed;
    }
    if (status.status === "failed") throw new Error(status.message || "本体查询失败");
  }
  throw new Error("本体查询超过 15 分钟，请稍后重试");
}

async function refreshData() {
  const button = $("#refresh-button");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("is-loading");
  button.querySelector("span").textContent = "正在更新";
  setFreshness("loading", "正在连接本体");
  setRefreshStatus("正在连接 Clair Mac 上的本体更新器…");
  try {
    const refreshed = await startLocalRefresh();
    render(refreshed, "local-live");
    setRefreshStatus(`本体查询与校验完成，数据已更新至 ${formatDateTime(refreshed.meta.data_cutoff)}。`);
    showToast("已换成最新脱敏生产聚合数据");
  } catch (localError) {
    try {
      const published = await loadPublishedData(true);
      const saved = loadSavedLocalData();
      const newest = isNewerSnapshot(saved, published) ? saved : published;
      render(newest, newest === saved ? "local-cache" : "published");
      setRefreshStatus(`本机更新器未连接，已保留最近可用快照（截至 ${formatDateTime(newest.meta.data_cutoff)}）。`);
      showToast("未连接本机更新器，已保留最近快照");
    } catch {
      setFreshness("error", "更新失败");
      setRefreshStatus(`更新失败：${localError.message || "无法连接本体或读取快照"}`);
      showToast("更新失败，请稍后再试");
    }
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.querySelector("span").textContent = "更新数据";
  }
}

function setDocumentOpen(open) {
  const panel = $("#doc-panel");
  const overlay = $("#doc-overlay");
  const fab = $("#doc-fab");
  panel.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", String(!open));
  fab.setAttribute("aria-expanded", String(open));
  if (open) $("#close-doc").focus();
  else fab.focus();
}

function bindInteractions() {
  $("#refresh-button").addEventListener("click", refreshData);
  document.querySelectorAll("[data-behavior-mode]").forEach((button) => button.addEventListener("click", () => selectBehaviorMode(button.dataset.behaviorMode)));
  $("#doc-fab").addEventListener("click", () => setDocumentOpen(true));
  $("#close-doc").addEventListener("click", () => setDocumentOpen(false));
  $("#doc-overlay").addEventListener("click", () => setDocumentOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("#doc-panel").classList.contains("open")) setDocumentOpen(false);
  });
  $("#copy-doc").addEventListener("click", async () => {
    const button = $("#copy-doc");
    try {
      await navigator.clipboard.writeText($("#doc-content").textContent);
      button.textContent = "已复制";
      showToast("分析与口径文档已复制");
      window.setTimeout(() => { button.textContent = "复制 Markdown"; }, 1800);
    } catch { showToast("浏览器未授权复制，请手动选择文本"); }
  });
}

async function init() {
  bindInteractions();
  setFreshness("loading", "正在读取数据");
  try {
    const published = await loadPublishedData();
    const saved = loadSavedLocalData();
    const newest = isNewerSnapshot(saved, published) ? saved : published;
    render(newest, newest === saved ? "local-cache" : "published");
    setRefreshStatus(newest === saved
      ? `当前展示这台 Mac 上次本体查询结果，数据截至 ${formatDateTime(newest.meta.data_cutoff)}。`
      : `当前展示最近发布快照，数据截至 ${formatDateTime(newest.meta.data_cutoff)}。`);
  } catch (error) {
    setFreshness("error", "数据读取失败");
    setRefreshStatus(`数据读取失败：${error.message || "请点击更新数据重试"}`);
  }
}

init();
