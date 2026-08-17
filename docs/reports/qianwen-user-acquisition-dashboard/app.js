const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41791";
const LOCAL_DATA_KEY = "clair-qianwen-acquisition-latest-v4";
const LOCAL_HEADER = { "X-Clair-Dashboard": "qianwen-user-acquisition-v1" };
const SCHEMA_VERSION = "qianwen-user-acquisition-v4";
const LAUNCH_AT = "2026-08-10T08:00:00+08:00";
const number = new Intl.NumberFormat("zh-CN");
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);

const METRICS = {
  bound: {
    label: "绑定用户",
    cumulativeLabel: "累计绑定用户",
    today: "bound_accounts_today",
    cumulative: "window_cumulative_bound",
    color: "#8068f2",
    soft: "rgba(128, 104, 242, 0.28)",
  },
  new: {
    label: "新用户",
    cumulativeLabel: "累计新用户",
    today: "new_accounts_today",
    cumulative: "window_cumulative_new",
    color: "#25c9a5",
    soft: "rgba(37, 201, 165, 0.28)",
  },
  existing: {
    label: "老用户",
    cumulativeLabel: "累计老用户",
    today: "existing_accounts_today",
    cumulative: "window_cumulative_existing",
    color: "#aa97d8",
    soft: "rgba(170, 151, 216, 0.28)",
  },
};

const viewState = {
  metric: "bound",
  trend: "cumulative",
  range: "since-launch",
  start: "",
  end: "",
  selectedDate: "",
};

let currentData = null;
let currentRows = [];
let toastTimer = null;
let resizeTimer = null;

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

function formatCutoff(value, includeYear = false) {
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

function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDay(value) {
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${Number(month)}月${Number(day)}日` : String(value);
}

function safeShare(part, total) {
  return total > 0 ? part / total : null;
}

function formatShare(part, total) {
  const share = safeShare(part, total);
  return share === null ? "—" : percent.format(share);
}

function nextDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function validateData(data) {
  if (!data || data.schema_version !== SCHEMA_VERSION) throw new Error("数据版本不兼容");
  const { meta = {}, metrics = {} } = data;
  if (meta.window_start_at !== LAUNCH_AT || meta.launch_at !== LAUNCH_AT || meta.timezone !== "Asia/Shanghai") {
    throw new Error("服务上线时间口径异常");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/.test(meta.data_cutoff || "") || !parseTime(meta.data_cutoff)) {
    throw new Error("数据截止时间异常");
  }
  if (!parseTime(meta.generated_at) || parseTime(meta.data_cutoff) < parseTime(meta.launch_at)) throw new Error("数据生成时间异常");
  const metricKeys = [
    "bound_accounts",
    "new_accounts",
    "existing_accounts",
    "missing_registration_time",
    "duplicate_bindings",
    "unmatched_accounts",
  ];
  for (const key of metricKeys) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.bound_accounts !== metrics.new_accounts + metrics.existing_accounts + metrics.missing_registration_time) {
    throw new Error("用户分类与总数无法闭合");
  }
  if (!Array.isArray(data.daily) || !data.daily.length) throw new Error("缺少每日趋势");
  const cutoffDay = meta.data_cutoff.slice(0, 10);
  let runningNew = 0;
  let runningExisting = 0;
  let runningUnclassified = 0;
  let runningBound = 0;
  let previousDate = "";
  data.daily.forEach((row, index) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) throw new Error("趋势日期格式异常");
    if (index === 0 && row.date !== LAUNCH_AT.slice(0, 10)) throw new Error("趋势没有从服务上线日开始");
    if (previousDate && row.date !== nextDate(previousDate)) throw new Error("趋势日期不连续");
    previousDate = row.date;
    for (const key of [
      "new_accounts_today",
      "existing_accounts_today",
      "unclassified_accounts_today",
      "bound_accounts_today",
      "cumulative_new_accounts",
      "cumulative_existing_accounts",
      "cumulative_unclassified_accounts",
      "cumulative_bound_accounts",
    ]) {
      if (!Number.isInteger(row[key]) || row[key] < 0) throw new Error(`每日趋势 ${key} 异常`);
    }
    if (typeof row.partial !== "boolean") throw new Error("每日完整性标记异常");
    const shouldBePartial = index === 0 || index === data.daily.length - 1;
    if (row.partial !== shouldBePartial) throw new Error("首日或最新日完整性标记异常");
    if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
      throw new Error("每日用户分类无法闭合");
    }
    runningNew += row.new_accounts_today;
    runningExisting += row.existing_accounts_today;
    runningUnclassified += row.unclassified_accounts_today;
    runningBound += row.bound_accounts_today;
    if (
      row.cumulative_new_accounts !== runningNew
      || row.cumulative_existing_accounts !== runningExisting
      || row.cumulative_unclassified_accounts !== runningUnclassified
      || row.cumulative_bound_accounts !== runningBound
    ) throw new Error("累计趋势无法闭合");
  });
  if (data.daily.at(-1).date !== cutoffDay) throw new Error("趋势没有覆盖到数据截止日");
  if (meta.latest_day_is_partial !== true || data.daily.at(-1).partial !== true) throw new Error("最新日必须标记为非完整日");
  if (
    runningNew !== metrics.new_accounts
    || runningExisting !== metrics.existing_accounts
    || runningUnclassified !== metrics.missing_registration_time
    || runningBound !== metrics.bound_accounts
  ) throw new Error("趋势总数与关键数据不一致");
  return data;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 1800) {
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
    if (window.QIANWEN_ACQUISITION_DATA) return validateData(window.QIANWEN_ACQUISITION_DATA);
    throw error;
  }
}

function loadSavedLocalData() {
  try {
    return validateData(JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "null"));
  } catch {
    return null;
  }
}

function saveLocalData(data) {
  try { localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data)); } catch { /* optional cache */ }
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
  if (progressUrl) {
    try {
      const url = new URL(progressUrl);
      if (url.protocol === "https:" && url.hostname === "ontology.yingmi-inc.com") {
        status.append(" · ");
        const link = document.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "查看查询进度";
        status.append(link);
      }
    } catch { /* ignore invalid progress URLs */ }
  }
}

function decorateRows(rows) {
  let cumulativeNew = 0;
  let cumulativeExisting = 0;
  let cumulativeUnclassified = 0;
  let cumulativeBound = 0;
  return rows.map((row) => {
    cumulativeNew += row.new_accounts_today;
    cumulativeExisting += row.existing_accounts_today;
    cumulativeUnclassified += row.unclassified_accounts_today;
    cumulativeBound += row.bound_accounts_today;
    return {
      ...row,
      window_cumulative_new: cumulativeNew,
      window_cumulative_existing: cumulativeExisting,
      window_cumulative_unclassified: cumulativeUnclassified,
      window_cumulative_bound: cumulativeBound,
    };
  });
}

function filteredRows() {
  if (!currentData) return [];
  let rows = currentData.daily;
  if (viewState.range === "last-7") rows = rows.slice(-7);
  if (viewState.range === "custom") rows = rows.filter((row) => row.date >= viewState.start && row.date <= viewState.end);
  return decorateRows(rows);
}

function scopeLabel(rows, short = false) {
  if (viewState.range === "since-launch") return short ? "上线以来" : "服务上线以来";
  if (viewState.range === "last-7") return "近 7 日";
  if (!rows.length) return "自定义日期";
  return `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
}

function rangeTotals(rows) {
  const latest = rows.at(-1);
  return latest ? {
    bound: latest.window_cumulative_bound,
    new: latest.window_cumulative_new,
    existing: latest.window_cumulative_existing,
    unclassified: latest.window_cumulative_unclassified,
  } : { bound: 0, new: 0, existing: 0, unclassified: 0 };
}

function renderKpis(rows) {
  const totals = rangeTotals(rows);
  const scope = scopeLabel(rows);
  $("#bound-total").textContent = number.format(totals.bound);
  $("#new-accounts").textContent = number.format(totals.new);
  $("#existing-accounts").textContent = number.format(totals.existing);
  $("#new-share").textContent = formatShare(totals.new, totals.bound);
  $("#existing-share").textContent = formatShare(totals.existing, totals.bound);
  $("#kpi-scope").textContent = scope;
  $("#bound-context").textContent = `${rows.length} 个日期累计`;
  $("#hero-lead").textContent = `截至 ${formatCutoff(currentData.meta.data_cutoff)}，${scope}绑定用户 ${number.format(totals.bound)} 人，其中新用户 ${number.format(totals.new)} 人，占 ${formatShare(totals.new, totals.bound)}。`;
  setFreshness("ready", `数据截至 ${formatCutoff(currentData.meta.data_cutoff)}`);
}

function niceMaximum(value) {
  if (value <= 10) return 10;
  const target = value * 1.04;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const normalized = target / magnitude;
  const rounded = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => candidate >= normalized) || 10;
  return rounded * magnitude;
}

function chartMarkup(rows) {
  const metric = METRICS[viewState.metric];
  const field = viewState.trend === "daily" ? metric.today : metric.cumulative;
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const width = mobile ? 430 : 1040;
  const height = mobile ? 350 : 420;
  const margin = mobile
    ? { top: 42, right: 16, bottom: 54, left: 46 }
    : { top: 46, right: 30, bottom: 58, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const values = rows.map((row) => row[field]);
  const maxValue = niceMaximum(Math.max(...values, 1));
  const baseline = margin.top + plotHeight;
  const step = plotWidth / Math.max(rows.length, 1);
  const x = (index) => margin.left + step * index + step / 2;
  const y = (value) => baseline - (value / maxValue) * plotHeight;
  const grids = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const gridY = baseline - ratio * plotHeight;
    return `<line class="chart-grid" x1="${margin.left}" y1="${gridY}" x2="${width - margin.right}" y2="${gridY}"></line>
      <text class="chart-axis-label" x="${margin.left - 10}" y="${gridY + 4}" text-anchor="end">${number.format(Math.round(maxValue * ratio))}</text>`;
  }).join("");
  const points = rows.map((row, index) => [x(index), y(row[field])]);
  const pointList = points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ");
  const areaPoints = points.length ? `${points[0][0]},${baseline} ${pointList} ${points.at(-1)[0]},${baseline}` : "";
  const bars = viewState.trend === "daily" ? rows.map((row, index) => {
    const barWidth = Math.max(12, Math.min(56, step * 0.48));
    const barY = y(row[field]);
    return `<rect class="chart-bar" x="${x(index) - barWidth / 2}" y="${barY}" width="${barWidth}" height="${Math.max(0, baseline - barY)}" fill="${metric.color}"></rect>`;
  }).join("") : "";
  const series = viewState.trend === "cumulative"
    ? `<polygon class="chart-area" points="${areaPoints}" fill="${metric.soft}"></polygon><polyline class="chart-line" points="${pointList}" stroke="${metric.color}"></polyline>`
    : bars;
  const showEvery = rows.length <= 10 ? 1 : Math.ceil(rows.length / (mobile ? 5 : 9));
  const selectedDate = viewState.selectedDate;
  const interactivePoints = rows.map((row, index) => {
    const centerX = x(index);
    const centerY = y(row[field]);
    const [month, day] = row.date.slice(5).split("-");
    const showDate = index === 0 || index === rows.length - 1 || index % showEvery === 0;
    const selected = row.date === selectedDate;
    return `<g class="chart-point${selected ? " is-selected" : ""}" data-index="${index}" data-date="${row.date}" data-x="${centerX}" data-y="${centerY}" tabindex="${selected ? "0" : "-1"}" role="button" aria-pressed="${selected}" aria-label="${escapeHtml(formatDay(row.date))}，${escapeHtml(metric.label)}${viewState.trend === "daily" ? "新增" : "累计"} ${number.format(row[field])} 人">
      <rect class="chart-hit" x="${centerX - step / 2}" y="${margin.top}" width="${step}" height="${plotHeight}"></rect>
      <line class="chart-hover-line" x1="${centerX}" y1="${margin.top}" x2="${centerX}" y2="${baseline}"></line>
      <circle class="chart-dot" cx="${centerX}" cy="${centerY}" r="5" stroke="${metric.color}"></circle>
      ${showDate ? `<text class="chart-axis-label" x="${centerX}" y="${height - 20}" text-anchor="middle">${Number(month)}.${Number(day)}</text>` : ""}
    </g>`;
  }).join("");
  const latest = rows.at(-1);
  const endLabel = latest ? `<text class="chart-value-label" x="${points.at(-1)[0] - 6}" y="${Math.max(22, points.at(-1)[1] - 14)}" text-anchor="end" fill="${metric.color}">${number.format(latest[field])}</text>` : "";
  const firstLabel = rows[0]?.date === LAUNCH_AT.slice(0, 10)
    ? `<text class="chart-launch-label" x="${x(0)}" y="${margin.top - 14}" text-anchor="middle">首日 08:00 起</text>`
    : "";
  return { width, height, field, markup: `${grids}${series}${interactivePoints}${firstLabel}${endLabel}` };
}

function selectedRowLabel(row) {
  const firstDate = currentData.daily[0].date;
  const lastDate = currentData.daily.at(-1).date;
  if (row.date === firstDate && row.date === lastDate) return `${formatDay(row.date)} · 08:00—${formatTime(currentData.meta.data_cutoff)}`;
  if (row.date === firstDate) return `${formatDay(row.date)} · 08:00 起`;
  if (row.date === lastDate) return `${formatDay(row.date)} · 截至 ${formatTime(currentData.meta.data_cutoff)}`;
  return formatDay(row.date);
}

function showChartTooltip(element, row) {
  const tooltip = $("#chart-tooltip");
  const metric = METRICS[viewState.metric];
  const primaryValue = viewState.trend === "daily" ? row[metric.today] : row[metric.cumulative];
  tooltip.innerHTML = `<strong>${escapeHtml(selectedRowLabel(row))}</strong>
    <b>${escapeHtml(metric.label)}${viewState.trend === "daily" ? "新增" : "累计"} ${number.format(primaryValue)}</b><br />
    <small>当日绑定 ${number.format(row.bound_accounts_today)} · 新用户 ${number.format(row.new_accounts_today)}（${formatShare(row.new_accounts_today, row.bound_accounts_today)}） · 老用户 ${number.format(row.existing_accounts_today)}（${formatShare(row.existing_accounts_today, row.bound_accounts_today)}）</small>`;
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const left = Number(element.dataset.x) / viewBox.width * 100;
  tooltip.style.left = `${Math.max(12, Math.min(88, left))}%`;
  tooltip.style.top = `${Number(element.dataset.y) / viewBox.height * 100}%`;
  tooltip.hidden = false;
}

function announceSelection(row) {
  const metric = METRICS[viewState.metric];
  const value = viewState.trend === "daily" ? row[metric.today] : row[metric.cumulative];
  $("#selection-announcement").textContent = `${formatDay(row.date)}，${metric.label}${viewState.trend === "daily" ? "新增" : "累计"}${number.format(value)}人。`;
}

function applySelectedDate(date, { announce = true, focusPoint = false, showTooltip = false } = {}) {
  const row = currentRows.find((item) => item.date === date);
  if (!row) return;
  viewState.selectedDate = date;
  document.querySelectorAll(".chart-point").forEach((point) => {
    const selected = point.dataset.date === date;
    point.classList.toggle("is-selected", selected);
    point.tabIndex = selected ? 0 : -1;
    point.setAttribute("aria-pressed", String(selected));
    if (selected && focusPoint) point.focus();
    if (selected && showTooltip) showChartTooltip(point, row);
  });
  document.querySelectorAll("#daily-table tr").forEach((tableRow) => tableRow.classList.toggle("is-selected", tableRow.dataset.date === date));
  document.querySelectorAll(".date-button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.date === date)));
  if (announce) announceSelection(row);
}

function bindChartInteractions(rows) {
  const tooltip = $("#chart-tooltip");
  document.querySelectorAll(".chart-point").forEach((point) => {
    const row = rows[Number(point.dataset.index)];
    point.addEventListener("mouseenter", () => showChartTooltip(point, row));
    point.addEventListener("focus", () => showChartTooltip(point, row));
    point.addEventListener("mouseleave", () => { tooltip.hidden = true; });
    point.addEventListener("blur", () => { tooltip.hidden = true; });
    point.addEventListener("click", () => applySelectedDate(row.date, { showTooltip: true }));
    point.addEventListener("keydown", (event) => {
      const index = Number(point.dataset.index);
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = Math.min(rows.length - 1, index + 1);
      else if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = rows.length - 1;
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applySelectedDate(row.date, { showTooltip: true });
        return;
      } else return;
      event.preventDefault();
      applySelectedDate(rows[nextIndex].date, { focusPoint: true, showTooltip: true });
    });
  });
}

function renderChart(rows) {
  const metric = METRICS[viewState.metric];
  const totals = rangeTotals(rows);
  const chart = chartMarkup(rows);
  const svg = $("#trend-chart");
  svg.setAttribute("viewBox", `0 0 ${chart.width} ${chart.height}`);
  svg.dataset.metric = viewState.metric;
  svg.dataset.trend = viewState.trend;
  svg.innerHTML = `<title id="chart-title">${escapeHtml(scopeLabel(rows))}${escapeHtml(metric.label)}${viewState.trend === "daily" ? "每日新增" : "累计"}走势</title>
    <desc id="chart-desc">当前展示${escapeHtml(scopeLabel(rows))}${escapeHtml(metric.label)}${viewState.trend === "daily" ? "每日新增" : "所选时间范围累计"}随日期变化，图表与下方明细表联动。</desc>${chart.markup}`;
  const selectedTotal = totals[viewState.metric];
  const todayValues = rows.map((row) => row[metric.today]);
  const average = rows.length ? selectedTotal / rows.length : 0;
  const peak = todayValues.length ? Math.max(...todayValues) : 0;
  $("#analysis-label").textContent = viewState.trend === "daily" ? `${scopeLabel(rows)}新增${metric.label}` : `${scopeLabel(rows)}累计${metric.label}`;
  $("#analysis-value").textContent = number.format(selectedTotal);
  $("#analysis-context").textContent = viewState.trend === "daily"
    ? `日均 ${number.format(Math.round(average))} 人，单日峰值 ${number.format(peak)} 人。`
    : `所选范围从 0 起累计；最新一天新增 ${number.format(rows.at(-1)?.[metric.today] || 0)} 人。`;
  $("#chart-note").textContent = `当前范围：${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}。服务上线首日从 08:00 起统计，最新数据截至 ${formatTime(currentData.meta.data_cutoff)}。`;
  bindChartInteractions(rows);
}

function metricCell(value, share, className, prefix = "") {
  return `<td class="metric-cell ${className}"><strong>${prefix}${number.format(value)}</strong><small>${share}</small></td>`;
}

function renderTable(rows) {
  const totals = rangeTotals(rows);
  const hasUnclassified = totals.unclassified > 0;
  const columnCount = hasUnclassified ? 4 : 3;
  $("#detail-head").innerHTML = `<tr>
      <th rowspan="2">日期</th>
      <th class="group-heading" colspan="${columnCount}">当日新增</th>
      <th class="group-heading" colspan="${columnCount}">所选范围累计</th>
    </tr>
    <tr>
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
      <th class="metric-bound">绑定用户</th><th class="metric-new">新用户</th><th class="metric-existing">老用户</th>${hasUnclassified ? "<th>待识别</th>" : ""}
    </tr>`;
  $("#daily-table").innerHTML = rows.map((row) => `<tr data-date="${row.date}" class="${row.date === viewState.selectedDate ? "is-selected" : ""}">
      <td><button class="date-button" type="button" data-date="${row.date}" aria-pressed="${row.date === viewState.selectedDate}">${escapeHtml(formatDay(row.date))}</button></td>
      ${metricCell(row.bound_accounts_today, "当日总量", "metric-bound", "+")}
      ${metricCell(row.new_accounts_today, formatShare(row.new_accounts_today, row.bound_accounts_today), "metric-new", "+")}
      ${metricCell(row.existing_accounts_today, formatShare(row.existing_accounts_today, row.bound_accounts_today), "metric-existing", "+")}
      ${hasUnclassified ? metricCell(row.unclassified_accounts_today, formatShare(row.unclassified_accounts_today, row.bound_accounts_today), "", "+") : ""}
      ${metricCell(row.window_cumulative_bound, "区间总量", "metric-bound")}
      ${metricCell(row.window_cumulative_new, formatShare(row.window_cumulative_new, row.window_cumulative_bound), "metric-new")}
      ${metricCell(row.window_cumulative_existing, formatShare(row.window_cumulative_existing, row.window_cumulative_bound), "metric-existing")}
      ${hasUnclassified ? metricCell(row.window_cumulative_unclassified, formatShare(row.window_cumulative_unclassified, row.window_cumulative_bound), "") : ""}
    </tr>`).join("");
  document.querySelectorAll(".date-button").forEach((button) => button.addEventListener("click", () => applySelectedDate(button.dataset.date, { showTooltip: true })));
  $("#detail-range").textContent = `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)}`;
  $("#detail-count").textContent = `${rows.length} 个日期 · 增量、占比与累计`;
  $("#data-footnote").textContent = `新用户指 8 月 10 日 08:00 及之后注册且慢；老用户指此前已注册且慢。8 月 10 日首日从 08:00 起统计；${formatDay(currentData.daily.at(-1).date)}截至 ${formatTime(currentData.meta.data_cutoff)}，首日与最新日均不是完整自然日。`;
}

function syncControls() {
  document.documentElement.dataset.metric = viewState.metric;
  document.querySelectorAll('input[name="metric"]').forEach((input) => { input.checked = input.value === viewState.metric; });
  document.querySelectorAll('input[name="trend"]').forEach((input) => { input.checked = input.value === viewState.trend; });
  document.querySelectorAll('input[name="range"]').forEach((input) => { input.checked = input.value === viewState.range; });
  $("#custom-range").hidden = viewState.range !== "custom";
}

function renderView({ announce = false } = {}) {
  if (!currentData) return;
  const rows = filteredRows();
  if (!rows.length) return;
  currentRows = rows;
  if (!rows.some((row) => row.date === viewState.selectedDate)) viewState.selectedDate = rows.at(-1).date;
  syncControls();
  renderKpis(rows);
  renderChart(rows);
  renderTable(rows);
  applySelectedDate(viewState.selectedDate, { announce });
}

function render(data, mode = "published") {
  currentData = validateData(data);
  const firstDate = currentData.daily[0].date;
  const lastDate = currentData.daily.at(-1).date;
  const startInput = $("#range-start");
  const endInput = $("#range-end");
  startInput.min = firstDate;
  startInput.max = lastDate;
  endInput.min = firstDate;
  endInput.max = lastDate;
  if (!viewState.start || viewState.start < firstDate || viewState.start > lastDate) viewState.start = firstDate;
  if (!viewState.end || viewState.end < firstDate || viewState.end > lastDate) viewState.end = lastDate;
  startInput.value = viewState.start;
  endInput.value = viewState.end;
  $("#range-error").textContent = "";
  document.documentElement.dataset.dataMode = mode;
  renderView();
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function startLocalRefresh() {
  const health = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/health`, { cache: "no-store", headers: LOCAL_HEADER }, 1800);
  if (!health.ok) throw new Error("更新服务未就绪");
  const healthData = await health.json();
  if (healthData.schema_version !== SCHEMA_VERSION || healthData.window_start_at !== LAUNCH_AT) {
    throw new Error("本机更新服务需要升级并重启");
  }
  const response = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: { ...LOCAL_HEADER, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh" }),
  }, 5000);
  if (!response.ok) throw new Error(`更新服务返回 ${response.status}`);
  const started = await response.json();
  if (!started.job_id) throw new Error("更新服务没有返回任务编号");
  setRefreshStatus(started.message || "正在查询最新数据。", started.progress_url || "");
  for (let attempt = 0; attempt < 330; attempt += 1) {
    await delay(2200);
    const statusResponse = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/status?job=${encodeURIComponent(started.job_id)}&v=${Date.now()}`, {
      cache: "no-store",
      headers: LOCAL_HEADER,
    }, 5000);
    if (!statusResponse.ok) throw new Error(`查询状态返回 ${statusResponse.status}`);
    const status = await statusResponse.json();
    setRefreshStatus(status.message || "正在查询最新数据。", status.progress_url || "");
    if (status.status === "completed") {
      const refreshed = validateData(status.data);
      saveLocalData(refreshed);
      return refreshed;
    }
    if (status.status === "failed") throw new Error(status.message || "数据查询失败");
  }
  throw new Error("数据查询超过 12 分钟，请稍后重试");
}

async function refreshData() {
  const button = $("#refresh-button");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("is-loading");
  button.setAttribute("aria-busy", "true");
  button.querySelector("span").textContent = "正在更新";
  setFreshness("loading", "正在查询数据");
  setRefreshStatus("正在连接盈米本体，查询最新数据…");
  try {
    const refreshed = await startLocalRefresh();
    render(refreshed, "local-live");
    setRefreshStatus(`更新完成，数据已刷新至 ${formatCutoff(refreshed.meta.data_cutoff)}。`);
    showToast("最新用户数据已更新");
    window.setTimeout(() => setRefreshStatus(""), 6000);
  } catch (localError) {
    try {
      const published = await loadPublishedData(true);
      const saved = loadSavedLocalData();
      const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
      render(newest, newest === saved ? "local-cache" : "published");
      setRefreshStatus(`暂未连接本机更新服务，已保留最近数据（截至 ${formatCutoff(newest.meta.data_cutoff)}）。`);
      showToast(localError.message || "已读取最近可用数据");
    } catch {
      setFreshness("error", "更新失败");
      setRefreshStatus(`更新失败：${localError.message || "无法查询或读取数据"}`);
      showToast("更新失败，请稍后再试");
    }
  } finally {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.setAttribute("aria-busy", "false");
    button.querySelector("span").textContent = "更新数据";
  }
}

function bindInteractions() {
  $("#refresh-button").addEventListener("click", refreshData);
  document.querySelectorAll('input[name="metric"]').forEach((input) => input.addEventListener("change", () => {
    viewState.metric = input.value;
    renderView({ announce: true });
  }));
  document.querySelectorAll('input[name="trend"]').forEach((input) => input.addEventListener("change", () => {
    viewState.trend = input.value;
    renderView({ announce: true });
  }));
  document.querySelectorAll('input[name="range"]').forEach((input) => input.addEventListener("change", () => {
    viewState.range = input.value;
    $("#range-error").textContent = "";
    renderView({ announce: true });
  }));
  $("#custom-range").addEventListener("submit", (event) => {
    event.preventDefault();
    const start = $("#range-start").value;
    const end = $("#range-end").value;
    if (!start || !end || start > end) {
      $("#range-error").textContent = "开始日期不能晚于结束日期。";
      return;
    }
    viewState.start = start;
    viewState.end = end;
    $("#range-error").textContent = "";
    renderView({ announce: true });
  });
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => renderView(), 140);
  });
}

async function init() {
  bindInteractions();
  setFreshness("loading", "正在读取数据");
  try {
    const published = await loadPublishedData();
    const saved = loadSavedLocalData();
    const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
    render(newest, newest === saved ? "local-cache" : "published");
    setRefreshStatus("");
  } catch {
    setFreshness("error", "数据读取失败");
    setRefreshStatus("数据读取失败，请点击“更新数据”重试。");
  }
}

init();
