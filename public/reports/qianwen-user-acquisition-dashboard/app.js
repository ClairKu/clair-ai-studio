const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41791";
const LOCAL_DATA_KEY = "clair-qianwen-acquisition-latest-v2";
const LOCAL_HEADER = { "X-Clair-Dashboard": "qianwen-user-acquisition-v1" };
const number = new Intl.NumberFormat("zh-CN");
const percent = new Intl.NumberFormat("zh-CN", { style: "percent", maximumFractionDigits: 1 });
const $ = (selector) => document.querySelector(selector);

let currentData = null;
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

function formatDay(value) {
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${Number(month)}月${Number(day)}日` : value;
}

function validateData(data) {
  if (!data || data.schema_version !== "qianwen-user-acquisition-v2") {
    throw new Error("数据版本不兼容");
  }
  const metrics = data.metrics || {};
  const required = [
    "bound_accounts",
    "existing_accounts",
    "new_accounts",
    "missing_registration_time",
    "duplicate_bindings",
    "unmatched_accounts",
    "boundary_records",
  ];
  for (const key of required) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.bound_accounts !== metrics.existing_accounts + metrics.new_accounts + metrics.missing_registration_time) {
    throw new Error("账号分组与总数无法闭合");
  }
  if (!Array.isArray(data.daily) || !data.daily.length) throw new Error("缺少每日趋势");
  let runningNew = 0;
  let runningExisting = 0;
  let runningUnclassified = 0;
  let runningBound = 0;
  let previousDate = null;
  for (const row of data.daily) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) throw new Error("趋势日期格式异常");
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
    if (row.bound_accounts_today !== row.new_accounts_today + row.existing_accounts_today + row.unclassified_accounts_today) {
      throw new Error("每日账号分组无法闭合");
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
    if (previousDate) {
      const expected = new Date(`${previousDate}T12:00:00Z`);
      expected.setUTCDate(expected.getUTCDate() + 1);
      if (row.date !== expected.toISOString().slice(0, 10)) throw new Error("趋势日期不连续");
    }
    previousDate = row.date;
  }
  if (
    runningNew !== metrics.new_accounts
    || runningExisting !== metrics.existing_accounts
    || runningUnclassified !== metrics.missing_registration_time
    || runningBound !== metrics.bound_accounts
  ) throw new Error("趋势总数与核心数据不一致");
  if (!parseTime(data.meta?.data_cutoff)) throw new Error("数据截止时间缺失");
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
    const response = await fetch(`${DATA_URL}${fresh ? `?v=${Date.now()}` : ""}`, {
      cache: "no-store",
    });
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
}

function renderHero(data) {
  const { metrics, meta } = data;
  const newShare = metrics.bound_accounts ? metrics.new_accounts / metrics.bound_accounts : 0;
  const existingShare = metrics.bound_accounts ? metrics.existing_accounts / metrics.bound_accounts : 0;
  $("#bound-total").textContent = number.format(metrics.bound_accounts);
  $("#new-accounts").textContent = number.format(metrics.new_accounts);
  $("#existing-accounts").textContent = number.format(metrics.existing_accounts);
  $("#new-share").textContent = percent.format(newShare);
  $("#existing-share").textContent = percent.format(existingShare);
  requestAnimationFrame(() => {
    $("#new-meter").style.width = `${newShare * 100}%`;
    $("#existing-meter").style.width = `${existingShare * 100}%`;
  });
  $("#hero-lead").textContent = `截至 ${formatCutoff(meta.data_cutoff)}，通过千问完成且慢账号绑定的用户达到 ${number.format(metrics.bound_accounts)} 个，其中新注册 ${number.format(metrics.new_accounts)} 个、老用户 ${number.format(metrics.existing_accounts)} 个。`;
  $("#verdict").textContent = `新注册用户占 ${percent.format(newShare)}，已经成为主要增长来源；随着首批老用户集中绑定完成，后续增长预计将以新注册为主。`;
  $("#footer-cutoff").textContent = `数据截至 ${formatCutoff(meta.data_cutoff, true)}`;
  setFreshness("ready", `数据截至 ${formatCutoff(meta.data_cutoff)}`);
}

function chartMarkup(data) {
  const rows = data.daily;
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const width = mobile ? 390 : 840;
  const height = mobile ? 300 : 330;
  const margin = mobile
    ? { top: 34, right: 18, bottom: 44, left: 38 }
    : { top: 30, right: 24, bottom: 48, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rawMax = Math.max(data.metrics.bound_accounts, 1);
  const unit = rawMax > 1000 ? 200 : 100;
  const maxTotal = Math.ceil(rawMax / unit) * unit;
  const step = plotWidth / rows.length;
  const baseline = margin.top + plotHeight;
  const y = (value) => baseline - (value / maxTotal) * plotHeight;
  const x = (index) => margin.left + step * index + step / 2;
  const grids = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const gridY = baseline - ratio * plotHeight;
    return `<line class="chart-grid" x1="${margin.left}" y1="${gridY}" x2="${width - margin.right}" y2="${gridY}"></line>
      <text class="chart-axis-label" x="${margin.left - 9}" y="${gridY + 4}" text-anchor="end">${number.format(Math.round(maxTotal * ratio))}</text>`;
  }).join("");
  const newPoints = rows.map((row, index) => [x(index), y(row.cumulative_new_accounts)]);
  const knownPoints = rows.map((row, index) => [x(index), y(row.cumulative_new_accounts + row.cumulative_existing_accounts)]);
  const boundPoints = rows.map((row, index) => [x(index), y(row.cumulative_bound_accounts)]);
  const pointList = (points) => points.map((point) => point.join(",")).join(" ");
  const newArea = `${newPoints[0][0]},${baseline} ${pointList(newPoints)} ${newPoints.at(-1)[0]},${baseline}`;
  const existingArea = `${pointList(knownPoints)} ${pointList([...newPoints].reverse())}`;
  const unclassifiedArea = `${pointList(boundPoints)} ${pointList([...knownPoints].reverse())}`;
  const hasUnclassified = data.metrics.missing_registration_time > 0;
  const points = rows.map((row, index) => {
    const center = x(index);
    const [month, day] = row.date.slice(5).split("-");
    const note = index === 0 ? "上线日" : "";
    return `<g class="chart-point" tabindex="0" data-index="${index}" data-x="${center}" data-y="${boundPoints[index][1]}" aria-label="${escapeHtml(formatDay(row.date))}，绑定且慢账号累计 ${row.cumulative_bound_accounts}，新注册累计 ${row.cumulative_new_accounts}，老用户累计 ${row.cumulative_existing_accounts}${row.partial ? "，非完整自然日" : ""}">
      <rect class="chart-hit" x="${center - step / 2}" y="${margin.top}" width="${step}" height="${plotHeight}"></rect>
      <line class="chart-hover-line" x1="${center}" y1="${margin.top}" x2="${center}" y2="${baseline}"></line>
      <circle class="chart-dot chart-dot-bound" cx="${center}" cy="${boundPoints[index][1]}" r="4"></circle>
      <circle class="chart-dot chart-dot-new" cx="${center}" cy="${newPoints[index][1]}" r="3.5"></circle>
      ${note ? `<text class="chart-partial" x="${center}" y="${Math.max(14, boundPoints[index][1] - 8)}" text-anchor="middle">${note}</text>` : ""}
      <text class="chart-axis-label" x="${center}" y="${height - 18}" text-anchor="middle">${Number(month)}.${Number(day)}</text>
    </g>`;
  }).join("");
  const latest = rows.at(-1);
  const labelX = x(rows.length - 1) - 8;
  const existingCenterY = (knownPoints.at(-1)[1] + newPoints.at(-1)[1]) / 2;
  const newLabelY = newPoints.at(-1)[1] + Math.min(28, (baseline - newPoints.at(-1)[1]) / 2);
  return {
    markup: `<title id="chart-title">千问引流且慢用户增长走势图</title>
      <desc id="chart-desc">累计面积图展示每天新注册、老用户及绑定且慢账号总量。</desc>
      ${grids}
      <polygon class="chart-area chart-area-new" points="${newArea}"></polygon>
      <polygon class="chart-area chart-area-existing" points="${existingArea}"></polygon>
      ${hasUnclassified ? `<polygon class="chart-area chart-area-unclassified" points="${unclassifiedArea}"></polygon>` : ""}
      <polyline class="chart-line chart-line-new" points="${pointList(newPoints)}"></polyline>
      <polyline class="chart-line chart-line-bound" points="${pointList(boundPoints)}"></polyline>
      ${points}
      <text class="chart-area-label chart-area-label-bound" x="${labelX}" y="${Math.max(16, boundPoints.at(-1)[1] - 9)}" text-anchor="end">绑定 ${number.format(latest.cumulative_bound_accounts)}</text>
      <text class="chart-area-label chart-area-label-existing" x="${labelX}" y="${existingCenterY + 4}" text-anchor="end">老用户 ${number.format(latest.cumulative_existing_accounts)}</text>
      <text class="chart-area-label chart-area-label-new" x="${labelX}" y="${newLabelY}" text-anchor="end">新注册 ${number.format(latest.cumulative_new_accounts)}</text>`,
    width,
    height,
  };
}

function bindChartTooltips(data) {
  const tooltip = $("#chart-tooltip");
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const show = (element) => {
    const row = data.daily[Number(element.dataset.index)];
    tooltip.innerHTML = `<strong>${escapeHtml(formatDay(row.date))}${row.partial ? " · 非完整日" : ""}</strong>绑定且慢账号 ${number.format(row.cumulative_bound_accounts)}<br />新注册 ${number.format(row.cumulative_new_accounts)} · 老用户 ${number.format(row.cumulative_existing_accounts)}<br /><small>当日新增：${number.format(row.bound_accounts_today)}</small>`;
    tooltip.style.left = `${Number(element.dataset.x) / viewBox.width * 100}%`;
    tooltip.style.top = `${Number(element.dataset.y) / viewBox.height * 100}%`;
    tooltip.hidden = false;
  };
  const hide = () => { tooltip.hidden = true; };
  document.querySelectorAll(".chart-point").forEach((point) => {
    point.addEventListener("mouseenter", () => show(point));
    point.addEventListener("focus", () => show(point));
    point.addEventListener("click", () => show(point));
    point.addEventListener("mouseleave", hide);
    point.addEventListener("blur", hide);
  });
}

function renderTrend(data) {
  const chart = chartMarkup(data);
  $("#trend-chart").setAttribute("viewBox", `0 0 ${chart.width} ${chart.height}`);
  $("#trend-chart").innerHTML = chart.markup;
  bindChartTooltips(data);
  const rows = data.daily;
  const newShare = data.metrics.new_accounts / data.metrics.bound_accounts;
  $("#pulse-notes").innerHTML = [
    ["新注册累计", number.format(data.metrics.new_accounts), `占当前绑定用户的 ${percent.format(newShare)}，是主要增长来源。`],
    ["老用户累计", number.format(data.metrics.existing_accounts), "老用户主要集中在上线初期完成绑定。"],
    ["增长结构", "新注册为主", "随着首批老用户完成绑定，后续新增预计仍以新注册为主。"],
  ].map(([label, value, detail]) => `<article class="pulse-note"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></article>`).join("");
  $("#daily-table").innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDay(row.date))}</td><td>${number.format(row.cumulative_bound_accounts)}</td><td>${number.format(row.cumulative_new_accounts)}</td><td>${number.format(row.cumulative_existing_accounts)}</td><td class="${row.partial ? "partial-tag" : ""}">${row.partial ? (row === rows[0] ? "上线日 08:00 起" : "非全天") : "完整日"}</td></tr>`).join("");
  const latest = rows.at(-1);
  $("#chart-note").textContent = latest?.partial
    ? `${formatDay(latest.date)} 截至 ${formatCutoff(data.meta.data_cutoff).split(" ").at(-1)}，是非完整自然日；走势按首次完成绑定日期累计。`
    : "走势按首次完成绑定日期累计。";
}

function renderQuality(data) {
  $("#quality-grid").innerHTML = data.quality_checks.map((item) => `<article class="quality-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join("");
  $("#definition-grid").innerHTML = data.definitions.map((item) => `<article class="definition-card ${item.state === "missing" ? "is-missing" : ""}"><span>${item.state === "missing" ? "待补充" : "已确认"}</span><strong>${escapeHtml(item.term)}</strong><p>${escapeHtml(item.definition)}</p></article>`).join("");
}

function buildDocument(data) {
  const { metrics, meta } = data;
  const newShare = metrics.new_accounts / metrics.bound_accounts;
  const dailyRows = data.daily.map((row) => `| ${row.date} | ${row.cumulative_bound_accounts} | ${row.cumulative_new_accounts} | ${row.cumulative_existing_accounts} | ${row.partial ? "非完整日" : "完整日"} |`).join("\n");
  return `# 千问 X 且慢AI小顾 用户数据看板

> 数据截至：${formatCutoff(meta.data_cutoff, true)}（Asia/Shanghai）
> 来源：${meta.source}
> 状态：已确认

## 1. 汇报结论

千问上线后，通过千问完成且慢账号绑定的用户达到 ${number.format(metrics.bound_accounts)} 个。新注册占 ${percent.format(newShare)}，已经成为主要增长来源；后续增长预计将继续以新注册为主。

## 2. 核心结果

- 绑定且慢账号：${number.format(metrics.bound_accounts)}
- 新注册：${number.format(metrics.new_accounts)}（${percent.format(newShare)}）
- 老用户：${number.format(metrics.existing_accounts)}

## 3. 千问引流且慢用户增长走势图

| 日期 | 绑定且慢账号 | 新注册 | 老用户 | 数据完整性 |
|---|---:|---:|---:|---|
${dailyRows}

## 4. 数据说明

- 绑定且慢账号：8 月 10 日 08:00 之后，通过千问完成且慢账号绑定的用户；同一账号只计算一次。
- 新注册：8 月 10 日 08:00 及之后注册且慢，并完成账号绑定的用户。
- 老用户：8 月 10 日 08:00 前已注册且慢，之后完成账号绑定的用户。
- 本页统计完成且慢账号绑定的用户，不含仅访问、未绑定或绑定失败的用户；完整转化率需补充千问侧访问人数。

## 5. 后续关注

1. 24 小时激活：绑定后首次打开且慢或完成首次有效服务。
2. 7 日回访：首周再次使用小顾或且慢。
3. 服务转化：进入诊断、规划、签约或交易链路。

## 6. 更新方式

在 Clair 的 Mac 上点击“更新数据”，即可从盈米本体查询最新生产数据；其他设备显示最近发布的数据。页面仅展示用户统计结果，不含账号明细与数据库凭证。`;
}

function render(data, mode = "published") {
  currentData = validateData(data);
  renderHero(currentData);
  renderTrend(currentData);
  renderQuality(currentData);
  $("#doc-content").textContent = buildDocument(currentData);
  document.documentElement.dataset.dataMode = mode;
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function startLocalRefresh() {
  const health = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/health`, {
    cache: "no-store",
    headers: LOCAL_HEADER,
  }, 1800);
  if (!health.ok) throw new Error("更新服务未就绪");
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

  for (let attempt = 0; attempt < 180; attempt += 1) {
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
  throw new Error("数据查询超过 6 分钟，请稍后重试");
}

async function refreshData() {
  const button = $("#refresh-button");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("is-loading");
  button.querySelector("span").textContent = "正在更新";
  setFreshness("loading", "正在查询数据");
  setRefreshStatus("正在连接盈米本体，查询最新数据…");
  try {
    const refreshed = await startLocalRefresh();
    render(refreshed, "local-live");
    setRefreshStatus(`更新完成，数据已刷新至 ${formatCutoff(refreshed.meta.data_cutoff)}。`);
    showToast("最新用户数据已更新");
  } catch (localError) {
    try {
      const published = await loadPublishedData(true);
      const saved = loadSavedLocalData();
      const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
      render(newest, newest === saved ? "local-cache" : "published");
      setRefreshStatus(`更新服务未连接，已读取最近可用数据（截至 ${formatCutoff(newest.meta.data_cutoff)}）。`);
      showToast("已读取最近可用数据");
    } catch {
      setFreshness("error", "更新失败");
      setRefreshStatus(`更新失败：${localError.message || "无法查询或读取数据"}`);
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
      showToast("数据说明已复制");
      window.setTimeout(() => { button.textContent = "复制 Markdown"; }, 1800);
    } catch {
      showToast("浏览器未授权复制，请手动选择文本");
    }
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
    setRefreshStatus(newest === saved
      ? `当前展示这台 Mac 最近一次更新结果，数据截至 ${formatCutoff(newest.meta.data_cutoff)}。`
      : `当前展示最近发布数据，数据截至 ${formatCutoff(newest.meta.data_cutoff)}。`);
  } catch {
    setFreshness("error", "数据读取失败");
    setRefreshStatus("数据读取失败，请点击“更新数据”重试。");
  }
}

init();
