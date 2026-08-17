const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41791";
const LOCAL_DATA_KEY = "clair-qianwen-acquisition-latest-v3";
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

function safeShare(part, total) {
  return total > 0 ? part / total : null;
}

function formatShare(part, total) {
  const share = safeShare(part, total);
  return share === null ? "—" : percent.format(share);
}

function launchDay(data) {
  return String(data.meta.launch_at).slice(0, 10);
}

function rowPhase(row, data) {
  const day = launchDay(data);
  if (row.date < day) return "上线前";
  if (row.date === day) return "上线节点日";
  return "上线后";
}

function validateData(data) {
  if (!data || data.schema_version !== "qianwen-user-acquisition-v3") {
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
  ];
  for (const key of required) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.bound_accounts !== metrics.existing_accounts + metrics.new_accounts + metrics.missing_registration_time) {
    throw new Error("账号分组与总数无法闭合");
  }
  const launchMetrics = data.launch_metrics || {};
  for (const key of [
    "pre_launch_bound_accounts",
    "post_launch_bound_accounts",
    "post_launch_new_accounts",
    "post_launch_existing_accounts",
    "post_launch_unclassified_accounts",
  ]) {
    if (!Number.isInteger(launchMetrics[key]) || launchMetrics[key] < 0) throw new Error(`上线阶段指标 ${key} 无效`);
  }
  if (
    launchMetrics.post_launch_bound_accounts !== launchMetrics.post_launch_new_accounts
      + launchMetrics.post_launch_existing_accounts
      + launchMetrics.post_launch_unclassified_accounts
    || metrics.bound_accounts !== launchMetrics.pre_launch_bound_accounts + launchMetrics.post_launch_bound_accounts
  ) throw new Error("上线前后数据无法闭合");
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
  if (!parseTime(data.meta?.data_cutoff) || !parseTime(data.meta?.window_start_at) || !parseTime(data.meta?.launch_at)) {
    throw new Error("数据时间范围缺失");
  }
  if (data.daily[0].date !== String(data.meta.window_start_at).slice(0, 10)) throw new Error("趋势起始日期异常");
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
  const newShare = safeShare(metrics.new_accounts, metrics.bound_accounts) || 0;
  const existingShare = safeShare(metrics.existing_accounts, metrics.bound_accounts) || 0;
  $("#bound-total").textContent = number.format(metrics.bound_accounts);
  $("#new-accounts").textContent = number.format(metrics.new_accounts);
  $("#existing-accounts").textContent = number.format(metrics.existing_accounts);
  $("#new-share").textContent = percent.format(newShare);
  $("#existing-share").textContent = percent.format(existingShare);
  requestAnimationFrame(() => {
    $("#new-meter").style.width = `${newShare * 100}%`;
    $("#existing-meter").style.width = `${existingShare * 100}%`;
  });
  $("#hero-lead").textContent = `截至 ${formatCutoff(meta.data_cutoff)}，8 月 3 日以来累计绑定用户 ${number.format(metrics.bound_accounts)} 人，其中新用户 ${number.format(metrics.new_accounts)} 人，占 ${percent.format(newShare)}。`;
  $("#footer-cutoff").textContent = `数据截至 ${formatCutoff(meta.data_cutoff, true)}`;
  setFreshness("ready", `数据截至 ${formatCutoff(meta.data_cutoff)}`);
}

function chartMarkup(data) {
  const rows = data.daily;
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const width = mobile ? 390 : 900;
  const height = mobile ? 330 : 400;
  const margin = mobile
    ? { top: 40, right: 18, bottom: 52, left: 40 }
    : { top: 38, right: 28, bottom: 54, left: 56 };
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
  const launchIndex = rows.findIndex((row) => row.date === launchDay(data));
  const launchX = launchIndex >= 0 ? x(launchIndex) : null;
  const points = rows.map((row, index) => {
    const center = x(index);
    const [month, day] = row.date.slice(5).split("-");
    const showDate = rows.length <= 10 || index === 0 || index === launchIndex || index === rows.length - 1 || (!mobile && index % 2 === 0);
    return `<g class="chart-point" tabindex="0" data-index="${index}" data-x="${center}" data-y="${boundPoints[index][1]}" aria-label="${escapeHtml(formatDay(row.date))}，累计绑定用户 ${row.cumulative_bound_accounts}，累计新用户 ${row.cumulative_new_accounts}，累计老用户 ${row.cumulative_existing_accounts}；当日新增 ${row.bound_accounts_today}${row.partial ? "，非完整自然日" : ""}">
      <rect class="chart-hit" x="${center - step / 2}" y="${margin.top}" width="${step}" height="${plotHeight}"></rect>
      <line class="chart-hover-line" x1="${center}" y1="${margin.top}" x2="${center}" y2="${baseline}"></line>
      <circle class="chart-dot chart-dot-bound" cx="${center}" cy="${boundPoints[index][1]}" r="4"></circle>
      <circle class="chart-dot chart-dot-new" cx="${center}" cy="${newPoints[index][1]}" r="3.5"></circle>
      ${showDate ? `<text class="chart-axis-label chart-date-label" x="${center}" y="${height - 19}" text-anchor="middle">${Number(month)}.${Number(day)}</text>` : ""}
    </g>`;
  }).join("");
  const latest = rows.at(-1);
  const labelX = x(rows.length - 1) - 8;
  const existingCenterY = (knownPoints.at(-1)[1] + newPoints.at(-1)[1]) / 2;
  const newLabelY = newPoints.at(-1)[1] + Math.min(28, (baseline - newPoints.at(-1)[1]) / 2);
  return {
    markup: `<title id="chart-title">千问引流且慢用户增长走势图</title>
      <desc id="chart-desc">累计面积图展示 8 月 3 日以来每天的新用户、老用户和累计绑定用户，并标出 8 月 10 日正式上线节点。</desc>
      ${grids}
      ${launchX === null ? "" : `<line class="chart-launch-line" x1="${launchX}" y1="${margin.top}" x2="${launchX}" y2="${baseline}"></line><text class="chart-launch-label" x="${launchX + 7}" y="${margin.top + 12}">8.10 正式上线</text>`}
      <polygon class="chart-area chart-area-new" points="${newArea}"></polygon>
      <polygon class="chart-area chart-area-existing" points="${existingArea}"></polygon>
      ${hasUnclassified ? `<polygon class="chart-area chart-area-unclassified" points="${unclassifiedArea}"></polygon>` : ""}
      <polyline class="chart-line chart-line-new" points="${pointList(newPoints)}"></polyline>
      <polyline class="chart-line chart-line-bound" points="${pointList(boundPoints)}"></polyline>
      ${points}
      <text class="chart-area-label chart-area-label-bound" x="${labelX}" y="${Math.max(20, boundPoints.at(-1)[1] - 12)}" text-anchor="end">累计绑定 ${number.format(latest.cumulative_bound_accounts)}</text>
      <text class="chart-area-label chart-area-label-existing" x="${labelX}" y="${existingCenterY + 4}" text-anchor="end">老用户 ${number.format(latest.cumulative_existing_accounts)}</text>
      <text class="chart-area-label chart-area-label-new" x="${labelX}" y="${newLabelY}" text-anchor="end">新用户 ${number.format(latest.cumulative_new_accounts)}</text>`,
    width,
    height,
  };
}

function bindChartTooltips(data) {
  const tooltip = $("#chart-tooltip");
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const show = (element) => {
    const row = data.daily[Number(element.dataset.index)];
    tooltip.innerHTML = `<strong>${escapeHtml(formatDay(row.date))} · ${escapeHtml(rowPhase(row, data))}${row.partial ? " · 非完整日" : ""}</strong><b>累计绑定 ${number.format(row.cumulative_bound_accounts)}</b><br />累计新用户 ${number.format(row.cumulative_new_accounts)} · 老用户 ${number.format(row.cumulative_existing_accounts)}<hr />当日新增 ${number.format(row.bound_accounts_today)}<br /><small>新用户 ${number.format(row.new_accounts_today)}（${formatShare(row.new_accounts_today, row.bound_accounts_today)}） · 老用户 ${number.format(row.existing_accounts_today)}（${formatShare(row.existing_accounts_today, row.bound_accounts_today)}）</small>`;
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
  const newShare = safeShare(data.metrics.new_accounts, data.metrics.bound_accounts) || 0;
  const existingShare = safeShare(data.metrics.existing_accounts, data.metrics.bound_accounts) || 0;
  const postLaunchNewShare = safeShare(data.launch_metrics.post_launch_new_accounts, data.launch_metrics.post_launch_bound_accounts) || 0;
  const postLaunchExistingShare = safeShare(data.launch_metrics.post_launch_existing_accounts, data.launch_metrics.post_launch_bound_accounts) || 0;
  $("#pulse-notes").innerHTML = [
    ["累计绑定用户", number.format(data.metrics.bound_accounts), "", `8 月 3 日以来；其中正式上线后 ${number.format(data.launch_metrics.post_launch_bound_accounts)} 人。`, "primary"],
    ["其中新用户", number.format(data.metrics.new_accounts), percent.format(newShare), `占全观察期 ${percent.format(newShare)}；正式上线后占 ${percent.format(postLaunchNewShare)}。`, "new"],
    ["老用户", number.format(data.metrics.existing_accounts), percent.format(existingShare), `占全观察期 ${percent.format(existingShare)}；正式上线后占 ${percent.format(postLaunchExistingShare)}。`, "existing"],
  ].map(([label, value, share, detail, tone]) => `<article class="pulse-note pulse-note-${tone}"><span>${escapeHtml(label)}</span><div><strong>${escapeHtml(value)}</strong>${share ? `<em>${escapeHtml(share)}</em>` : ""}</div><p>${escapeHtml(detail)}</p></article>`).join("");
  $("#daily-table").innerHTML = rows.map((row) => {
    const cumulativeNewShare = formatShare(row.cumulative_new_accounts, row.cumulative_bound_accounts);
    const cumulativeExistingShare = formatShare(row.cumulative_existing_accounts, row.cumulative_bound_accounts);
    const status = row.partial
      ? `截至 ${formatCutoff(data.meta.data_cutoff).split(" ").at(-1)}`
      : row.date === launchDay(data) ? "完整日 · 08:00 上线" : "完整日";
    return `<tr>
      <td>${escapeHtml(formatDay(row.date))}</td>
      <td><span class="phase-tag phase-${row.date < launchDay(data) ? "before" : row.date === launchDay(data) ? "launch" : "after"}">${escapeHtml(rowPhase(row, data))}</span></td>
      <td class="today-total">+${number.format(row.bound_accounts_today)}</td>
      <td class="new-cell">+${number.format(row.new_accounts_today)}</td>
      <td class="existing-cell">+${number.format(row.existing_accounts_today)}</td>
      <td class="new-cell">${formatShare(row.new_accounts_today, row.bound_accounts_today)}</td>
      <td class="existing-cell">${formatShare(row.existing_accounts_today, row.bound_accounts_today)}</td>
      <td class="cumulative-total">${number.format(row.cumulative_bound_accounts)}</td>
      <td class="new-cell cumulative-cell">${number.format(row.cumulative_new_accounts)}<small>${cumulativeNewShare}</small></td>
      <td class="existing-cell cumulative-cell">${number.format(row.cumulative_existing_accounts)}<small>${cumulativeExistingShare}</small></td>
      <td class="${row.partial ? "partial-tag" : ""}">${escapeHtml(status)}</td>
    </tr>`;
  }).join("");
  $("#daily-range").textContent = `${formatDay(rows[0].date)}—${formatDay(rows.at(-1).date)} · ${rows.length} 天`;
  const latest = rows.at(-1);
  $("#chart-note").textContent = latest?.partial
    ? `${formatDay(latest.date)} 截至 ${formatCutoff(data.meta.data_cutoff).split(" ").at(-1)}，是非完整自然日；曲线按首次完成绑定日期累计。`
    : "曲线按首次完成绑定日期累计。";
}

function buildDocument(data) {
  const { metrics, meta } = data;
  const newShare = safeShare(metrics.new_accounts, metrics.bound_accounts) || 0;
  const dailyRows = data.daily.map((row) => `| ${row.date} | ${rowPhase(row, data)} | ${row.bound_accounts_today} | ${row.new_accounts_today} | ${formatShare(row.new_accounts_today, row.bound_accounts_today)} | ${row.existing_accounts_today} | ${formatShare(row.existing_accounts_today, row.bound_accounts_today)} | ${row.cumulative_bound_accounts} | ${row.cumulative_new_accounts} | ${row.cumulative_existing_accounts} | ${row.partial ? "非完整日" : row.date === launchDay(data) ? "完整日 · 08:00 上线" : "完整日"} |`).join("\n");
  return `# 千问 X 且慢AI小顾 用户数据看板

> 数据截至：${formatCutoff(meta.data_cutoff, true)}（Asia/Shanghai）
> 来源：${meta.source}
> 观察范围：2026-08-03 起；2026-08-10 08:00 正式上线

## 1. 核心结果

- 累计绑定用户：${number.format(metrics.bound_accounts)}
- 其中新用户：${number.format(metrics.new_accounts)}（${percent.format(newShare)}）
- 老用户：${number.format(metrics.existing_accounts)}
- 正式上线后绑定：${number.format(data.launch_metrics.post_launch_bound_accounts)}

## 2. 完整逐日明细

| 日期 | 阶段 | 当日绑定 | 当日新用户 | 新用户占比 | 当日老用户 | 老用户占比 | 累计绑定 | 累计新用户 | 累计老用户 | 数据状态 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
${dailyRows}

新用户指 8 月 10 日 08:00 及之后注册且慢的用户；老用户指此前已注册且慢的用户。每日占比以当天绑定用户为分母；同一账号只计算一次。

## 3. 更新方式

在 Clair 的 Mac 上点击“更新数据”，即可从盈米本体查询最新生产数据；其他设备显示最近发布的数据。页面仅展示用户统计结果，不含账号明细与数据库凭证。`;
}

function render(data, mode = "published") {
  currentData = validateData(data);
  renderHero(currentData);
  renderTrend(currentData);
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
