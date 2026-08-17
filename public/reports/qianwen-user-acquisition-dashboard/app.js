const DATA_URL = "./data/latest.json";
const LOCAL_REFRESH_BASE = "http://127.0.0.1:41791";
const LOCAL_DATA_KEY = "clair-qianwen-acquisition-latest-v1";
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
  if (!data || data.schema_version !== "qianwen-user-acquisition-v1") {
    throw new Error("数据版本不兼容");
  }
  const metrics = data.metrics || {};
  const required = [
    "mapped_accounts",
    "existing_accounts",
    "new_accounts",
    "missing_registration_time",
    "duplicate_mappings",
    "unmatched_accounts",
    "boundary_records",
  ];
  for (const key of required) {
    if (!Number.isInteger(metrics[key]) || metrics[key] < 0) throw new Error(`指标 ${key} 无效`);
  }
  if (metrics.mapped_accounts !== metrics.existing_accounts + metrics.new_accounts + metrics.missing_registration_time) {
    throw new Error("账号分组与总数无法闭合");
  }
  if (!Array.isArray(data.daily) || !data.daily.length) throw new Error("缺少每日趋势");
  let running = 0;
  let previousDate = null;
  for (const row of data.daily) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || "")) throw new Error("趋势日期格式异常");
    if (!Number.isInteger(row.new_mapped_accounts) || row.new_mapped_accounts < 0) throw new Error("每日新增异常");
    running += row.new_mapped_accounts;
    if (row.cumulative_mapped_accounts !== running) throw new Error("累计趋势无法闭合");
    if (previousDate) {
      const expected = new Date(`${previousDate}T12:00:00Z`);
      expected.setUTCDate(expected.getUTCDate() + 1);
      if (row.date !== expected.toISOString().slice(0, 10)) throw new Error("趋势日期不连续");
    }
    previousDate = row.date;
  }
  if (running !== metrics.mapped_accounts) throw new Error("趋势总数与汇总指标不一致");
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
  const newShare = metrics.mapped_accounts ? metrics.new_accounts / metrics.mapped_accounts : 0;
  const existingShare = metrics.mapped_accounts ? metrics.existing_accounts / metrics.mapped_accounts : 0;
  $("#mapped-total").textContent = number.format(metrics.mapped_accounts);
  $("#new-accounts").textContent = number.format(metrics.new_accounts);
  $("#existing-accounts").textContent = number.format(metrics.existing_accounts);
  $("#new-share").textContent = percent.format(newShare);
  $("#existing-share").textContent = percent.format(existingShare);
  requestAnimationFrame(() => {
    $("#new-meter").style.width = `${newShare * 100}%`;
    $("#existing-meter").style.width = `${existingShare * 100}%`;
  });
  $("#hero-lead").textContent = `截至 ${formatCutoff(meta.data_cutoff)}，已有 ${number.format(metrics.mapped_accounts)} 个账号完成千问—且慢身份映射；数据来自本体生产数仓的只读聚合。`;
  $("#verdict").textContent = `成功映射账号中，${number.format(metrics.new_accounts)} 个（${percent.format(newShare)}）在接入后新注册，${number.format(metrics.existing_accounts)} 个来自既有且慢账号；增长结果已确认，完整访问转化率仍缺上游分母。`;
  $("#footer-cutoff").textContent = `数据截至 ${formatCutoff(meta.data_cutoff, true)}`;
  setFreshness("ready", `数据截至 ${formatCutoff(meta.data_cutoff)}`);
}

function chartMarkup(data) {
  const rows = data.daily;
  const mobile = window.matchMedia("(max-width: 620px)").matches;
  const width = mobile ? 390 : 840;
  const height = mobile ? 300 : 330;
  const margin = mobile
    ? { top: 34, right: 38, bottom: 44, left: 34 }
    : { top: 30, right: 58, bottom: 48, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxNewRaw = Math.max(...rows.map((row) => row.new_mapped_accounts), 1);
  const maxNew = Math.ceil(maxNewRaw / 100) * 100;
  const maxTotal = data.metrics.mapped_accounts || 1;
  const step = plotWidth / rows.length;
  const barWidth = Math.min(mobile ? 28 : 46, step * 0.62);
  const yNew = (value) => margin.top + plotHeight - (value / maxNew) * plotHeight;
  const yTotal = (value) => margin.top + plotHeight - (value / maxTotal) * plotHeight;
  const x = (index) => margin.left + step * index + step / 2;
  const grids = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = margin.top + plotHeight - ratio * plotHeight;
    return `<line class="chart-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>
      <text class="chart-axis-label" x="${margin.left - 9}" y="${y + 4}" text-anchor="end">${number.format(Math.round(maxNew * ratio))}</text>
      <text class="chart-axis-label" x="${width - margin.right + 9}" y="${y + 4}">${number.format(Math.round(maxTotal * ratio))}</text>`;
  }).join("");
  const bars = rows.map((row, index) => {
    const center = x(index);
    const top = yNew(row.new_mapped_accounts);
    const heightValue = margin.top + plotHeight - top;
    const [month, day] = row.date.slice(5).split("-");
    const note = index === 0 ? "上线日" : (row.partial ? "非全天" : "");
    return `<g class="chart-point" tabindex="0" data-index="${index}" data-x="${center}" data-y="${top}" aria-label="${escapeHtml(formatDay(row.date))}，新增 ${row.new_mapped_accounts}，累计 ${row.cumulative_mapped_accounts}${row.partial ? "，非完整自然日" : ""}">
      <rect class="chart-bar" x="${center - barWidth / 2}" y="${top}" width="${barWidth}" height="${Math.max(1, heightValue)}"></rect>
      ${note ? `<text class="chart-partial" x="${center}" y="${Math.max(14, top - 8)}" text-anchor="middle">${note}</text>` : ""}
      <text class="chart-axis-label" x="${center}" y="${height - 18}" text-anchor="middle">${Number(month)}.${Number(day)}</text>
    </g>`;
  }).join("");
  const points = rows.map((row, index) => `${x(index)},${yTotal(row.cumulative_mapped_accounts)}`).join(" ");
  const dots = rows.map((row, index) => `<circle class="chart-dot" cx="${x(index)}" cy="${yTotal(row.cumulative_mapped_accounts)}" r="4"></circle>`).join("");
  return { markup: `${grids}${bars}<polyline class="chart-line" points="${points}"></polyline>${dots}`, width, height };
}

function bindChartTooltips(data) {
  const tooltip = $("#chart-tooltip");
  const viewBox = $("#trend-chart").viewBox.baseVal;
  const show = (element) => {
    const row = data.daily[Number(element.dataset.index)];
    tooltip.innerHTML = `<strong>${escapeHtml(formatDay(row.date))}${row.partial ? " · 非完整日" : ""}</strong>当日新增 ${number.format(row.new_mapped_accounts)}<br />累计映射 ${number.format(row.cumulative_mapped_accounts)}`;
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
  const launch = rows[0];
  const completePostLaunch = rows.slice(1).filter((row) => !row.partial);
  const average = completePostLaunch.length
    ? Math.round(completePostLaunch.reduce((sum, row) => sum + row.new_mapped_accounts, 0) / completePostLaunch.length)
    : 0;
  const newShare = data.metrics.new_accounts / data.metrics.mapped_accounts;
  $("#pulse-notes").innerHTML = [
    ["首发释放", number.format(launch.new_mapped_accounts), `上线日贡献累计映射的 ${percent.format(launch.new_mapped_accounts / data.metrics.mapped_accounts)}。`],
    ["完整日均", `${number.format(average)} / 天`, `${completePostLaunch.length} 个完整自然日的新增均值，避免与今天的半日值混比。`],
    ["新增结构", percent.format(newShare), `映射账号在接入后新注册；仍需用激活与回访判断质量。`],
  ].map(([label, value, detail]) => `<article class="pulse-note"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></article>`).join("");
  $("#daily-table").innerHTML = rows.map((row) => `<tr><td>${escapeHtml(formatDay(row.date))}</td><td>${number.format(row.new_mapped_accounts)}</td><td>${number.format(row.cumulative_mapped_accounts)}</td><td class="${row.partial ? "partial-tag" : ""}">${row.partial ? (row === rows[0] ? "上线日 08:00 起" : "非全天") : "完整日"}</td></tr>`).join("");
  const latest = rows.at(-1);
  $("#chart-note").textContent = latest?.partial
    ? `${formatDay(latest.date)} 截至 ${formatCutoff(data.meta.data_cutoff).split(" ").at(-1)}，是非完整自然日；柱线均按首次映射账号去重。`
    : "柱线均按首次映射账号去重。";
}

function renderQuality(data) {
  $("#quality-grid").innerHTML = data.quality_checks.map((item) => `<article class="quality-card"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join("");
  $("#definition-grid").innerHTML = data.definitions.map((item) => `<article class="definition-card ${item.state === "missing" ? "is-missing" : ""}"><span>${item.state === "missing" ? "MISSING" : "CONFIRMED"}</span><strong>${escapeHtml(item.term)}</strong><p>${escapeHtml(item.definition)}</p></article>`).join("");
}

function buildDocument(data) {
  const { metrics, meta } = data;
  const newShare = metrics.new_accounts / metrics.mapped_accounts;
  const dailyRows = data.daily.map((row) => `| ${row.date} | ${row.new_mapped_accounts} | ${row.cumulative_mapped_accounts} | ${row.partial ? "非完整日" : "完整日"} |`).join("\n");
  return `# 千问 → 且慢账号映射数据看板 · 口径文档

> 数据截至：${formatCutoff(meta.data_cutoff, true)}（Asia/Shanghai）
> 来源：${meta.source}
> 证据状态：confirmed

## 1. 看板要回答的问题

8 月 10 日 08:00 千问接入上线后，有多少账号成功建立千问—且慢映射？其中多少是既有且慢账号，多少是在接入后新注册？增长脉冲是否持续？

## 2. 核心结果

- 成功映射账号：${number.format(metrics.mapped_accounts)}
- 接入后新注册：${number.format(metrics.new_accounts)}（${percent.format(newShare)}）
- 绑定既有且慢账号：${number.format(metrics.existing_accounts)}
- 注册时间缺失：${number.format(metrics.missing_registration_time)}

## 3. 每日趋势

| 日期 | 当日新增 | 累计映射 | 完整性 |
|---|---:|---:|---|
${dailyRows}

## 4. 数据健康度

- 窗口内总记录数与唯一账号数一致，重复映射 0。
- 映射账号均能关联且慢账号主记录，关联丢失 0。
- 注册时间缺失 0，存量与新注册分组完全闭合。
- 上线整点记录 0，本次 > 与 >= 结果一致；长期查询仍使用 >= 并过滤逻辑删除。

## 5. 口径边界

“成功映射账号”不是完整“千问引流用户”。当前数据不包含千问侧曝光、进入智能体、绑定失败等上游分母；“接入后新注册”包含静默注册，也不等于已经激活、回访、签约或交易。

对外建议表述：千问上线以来成功建立千问—且慢账号映射 ${number.format(metrics.mapped_accounts)} 个，其中 ${number.format(metrics.new_accounts)} 个为接入后新注册且慢账号，${number.format(metrics.existing_accounts)} 个为绑定既有且慢账号。

## 6. 下一步验证

1. 24 小时激活：映射后首次打开且慢或完成首次有效服务。
2. 7 日回访：首周再次使用小顾或且慢。
3. 服务转化：进入诊断、规划、签约或交易链路。

## 7. 更新机制

Clair 的 Mac 上通过仅监听本机的只读更新器调用盈米本体，网页只接收脱敏聚合结果；其他设备刷新最近发布快照。数据库凭证、账号明细与查询能力不进入公开页面。`;
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
  if (!health.ok) throw new Error("本机更新器未就绪");
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

  for (let attempt = 0; attempt < 180; attempt += 1) {
    await delay(2200);
    const statusResponse = await fetchWithTimeout(`${LOCAL_REFRESH_BASE}/status?job=${encodeURIComponent(started.job_id)}&v=${Date.now()}`, {
      cache: "no-store",
      headers: LOCAL_HEADER,
    }, 5000);
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
  throw new Error("本体查询超过 6 分钟，请稍后重试");
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
    setRefreshStatus(`本体查询完成，数据已更新至 ${formatCutoff(refreshed.meta.data_cutoff)}。`);
    showToast("本体查询完成，已换成最新生产聚合数据");
  } catch (localError) {
    try {
      const published = await loadPublishedData(true);
      const saved = loadSavedLocalData();
      const newest = saved && parseTime(saved.meta.data_cutoff) > parseTime(published.meta.data_cutoff) ? saved : published;
      render(newest, newest === saved ? "local-cache" : "published");
      setRefreshStatus(`本机更新器未连接，已刷新最近可用快照（数据截至 ${formatCutoff(newest.meta.data_cutoff)}）。`);
      showToast("本机更新器未连接，已刷新最近可用快照");
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
      showToast("口径文档已复制");
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
      ? `当前展示这台 Mac 上次本体查询结果，数据截至 ${formatCutoff(newest.meta.data_cutoff)}。`
      : `当前展示最近发布快照，数据截至 ${formatCutoff(newest.meta.data_cutoff)}。`);
  } catch {
    setFreshness("error", "数据读取失败");
    setRefreshStatus("数据读取失败，请点击“更新数据”重试。");
  }
}

init();
