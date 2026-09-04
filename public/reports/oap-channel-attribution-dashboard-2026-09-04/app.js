const number = new Intl.NumberFormat("zh-CN");
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
const percent = (value) => `${Number(value).toFixed(1)}%`;
const el = (id) => document.getElementById(id);
let report;
let metric = "calls30d";
let scale = "log";

const platform = (name) => report.platforms.find((row) => row.platform === name) || { apiKeys: 0, activeKeys30d: 0, calls30d: 0 };
const oauth = (name) => report.oauthClients.find((row) => row.client === name);
const displayUsers = (row) => row ? row.currentUsersDisplay : "未识别";

function renderHeadline() {
  const qianwen = platform("千问");
  const unknown = platform("未标注平台");
  const doubao = oauth("豆包");
  const qianwenShare = qianwen.calls30d / report.totals.calls30d * 100;
  el("freshness").textContent = `数据 ${report.asOf}${report.partialDay ? " · 部分日" : ""}`;
  el("cutoff").textContent = `截至 ${report.generatedAt.slice(0, 16).replace("T", " ")}`;
  el("footer-time").textContent = `DATA ${report.generatedAt.slice(0, 19).replace("T", " ")} CST`;
  el("verdict-copy").textContent = `千问贡献 ${percent(qianwenShare)} 的近 30 日成功调用；豆包有 ${displayUsers(doubao)} 名当前授权用户。WorkBuddy 没有独立 Client ID 或 Key 标签，因此暂时无法计数。`;
  el("kpi-calls").textContent = number.format(report.totals.calls30d);
  el("kpi-active-keys").textContent = number.format(report.totals.activeKeys30d);
  el("kpi-call-coverage").textContent = percent(report.coverage.callAttributionRate);
  el("kpi-key-coverage").textContent = percent(report.coverage.activeKeyAttributionRate);

  const cards = [
    { cls: "qianwen", badge: "调用强度 · 可确认", title: "千问", value: number.format(qianwen.calls30d), unit: "近 30 日成功调用", copy: `${qianwen.activeKeys30d} 个活跃共享 Key 承载主要流量；数据库没有千问侧终端用户标识，不能把 Key 数当用户数。`, evidence: "证据：Key 标签 + usage details" },
    { cls: "doubao", badge: "授权用户 · 可确认", title: "豆包", value: displayUsers(doubao), unit: "当前 OAuth 授权用户", copy: `Key 标签链仅记录 ${number.format(platform("豆包 / 字节").calls30d)} 次近 30 日调用，OAuth 用户与调用明细尚未稳定打通。`, evidence: "证据：OAuth client + consent" },
    { cls: "workbuddy", badge: "当前不可观测", title: "WorkBuddy", value: "—", unit: "无法给出可靠用户数", copy: "没有匹配到独立 OAuth 客户端、Key 标签或服务端来源字段；即便真实有调用，也会落进“未标注平台”。", evidence: "证据：三处显式字段均未命中" },
    { cls: "unknown", badge: "最大归因缺口", title: "未标注平台", value: number.format(unknown.activeKeys30d), unit: "近 30 日活跃 Key", copy: `${number.format(unknown.calls30d)} 次调用无法还原到具体 AI 客户端，是下一步优先补齐的观测面。`, evidence: "证据：排除全部已识别标签后" },
  ];
  el("focus-grid").innerHTML = cards.map((card) => `<article class="focus-card ${card.cls}"><span class="badge">${card.badge}</span><h3>${card.title}</h3><strong>${card.value}</strong><span class="unit">${card.unit}</span><p>${card.copy}</p><span class="evidence">${card.evidence}</span></article>`).join("");
}

function metricRows() {
  if (metric === "oauthUsers") {
    const rows = report.oauthClients.map((row) => ({ name: row.client, value: row.currentUsers || 0, display: row.currentUsersDisplay, unknown: false }));
    if (!rows.some((row) => /workbuddy/i.test(row.name))) rows.push({ name: "WorkBuddy", value: 0, display: "未识别", unknown: true });
    return rows.sort((a, b) => b.value - a.value);
  }
  return report.platforms.map((row) => ({ name: row.platform, value: row[metric], display: number.format(row[metric]), unknown: row.platform === "未标注平台" })).sort((a, b) => b.value - a.value);
}

function renderPlatformChart() {
  const rows = metricRows();
  const max = Math.max(...rows.map((row) => row.value), 1);
  const labels = {
    calls30d: "30 日成功调用量：衡量平台使用强度，不代表用户数。横条采用平方根尺度，让长尾平台可见。",
    activeKeys30d: "30 日活跃 Key：一个平台可能共享少量 Key，一个个人也可能拥有多个 Key。",
    oauthUsers: "当前有效 OAuth 授权用户：只有完成 Client ID 登记并走 consent 的客户端可数；小于 5 的单元格已脱敏。",
  };
  el("platform-context").textContent = labels[metric];
  el("platform-chart").innerHTML = rows.map((row) => {
    const width = metric === "calls30d" ? Math.sqrt(row.value / max) * 100 : row.value / max * 100;
    return `<div class="bar-row ${row.unknown ? "unknown" : ""}" title="${row.name}：${row.display}"><span class="bar-label">${row.name}</span><span class="bar-track"><i class="bar-fill" style="width:${Math.max(width, row.value ? 1 : 0)}%"></i></span><strong class="bar-value">${row.display}</strong></div>`;
  }).join("");
}

function renderLists() {
  el("oauth-summary").textContent = `${number.format(report.registeredClientUsers)} 名去重用户；跨客户端会重叠`;
  el("open-channel-summary").textContent = "同一用户可进入多条通道，列表不可直接相加";
  el("oauth-clients").innerHTML = report.oauthClients.map((row) => `<div class="data-row"><div><span>${row.client}</span><small>${row.status === "active" ? "有效客户端" : "已停用"} · 首次授权 ${row.firstAuthorizedDate || "—"}</small></div><strong>${row.currentUsersDisplay}<small> 用户</small></strong></div>`).join("");
  el("open-channels").innerHTML = report.openChannels.map((row) => `<div class="data-row"><div><span>${row.channel}</span><small>${row.slug} · ${row.clients} 个 Client ID</small></div><strong>${row.currentUsersDisplay}<small> 身份</small></strong></div>`).join("");
}

function renderMethods() {
  const methods = [
    ["调用口径", report.evidence.calls],
    ["OAuth 用户口径", report.evidence.oauth],
    ["OpenChannel 口径", report.evidence.openChannels],
    ["平台识别规则", report.evidence.classification],
    ["隐私边界", "只发布聚合结果；OAuth 用户数低于 5 时隐藏精确值；不发布用户明细、Key、Client ID、请求 ID 或任何凭证。"],
    ["当前结论强度", "千问调用量、豆包授权用户为可确认；WorkBuddy 缺少显式标识，结论是“不可观测”，不是“没有用户”。"],
  ];
  el("method-grid").innerHTML = methods.map(([title, copy]) => `<article class="method-card"><h3>${title}</h3><p>${copy}</p></article>`).join("");
}

function renderTrend() {
  const svg = el("trend-chart");
  const rows = report.trend;
  const width = 1080, height = 430, left = 62, right = 24, top = 28, bottom = 54;
  const innerW = width - left - right, innerH = height - top - bottom;
  const series = [
    { key: "qianwen", cls: "qianwen", color: "#1d7a55" },
    { key: "otherIdentified", cls: "other", color: "#5d7fee" },
    { key: "unattributed", cls: "unattributed", color: "#87928c" },
  ];
  const transform = (value) => scale === "log" ? Math.log10(value + 1) : value;
  const max = Math.max(...rows.flatMap((row) => series.map((item) => transform(row[item.key]))), 1);
  const x = (index) => left + index / Math.max(rows.length - 1, 1) * innerW;
  const y = (value) => top + innerH - transform(value) / max * innerH;
  const lines = Array.from({ length: 5 }, (_, index) => {
    const yy = top + index / 4 * innerH;
    const raw = scale === "log" ? Math.pow(10, max * (1 - index / 4)) - 1 : max * (1 - index / 4);
    return `<line class="grid-line" x1="${left}" x2="${width - right}" y1="${yy}" y2="${yy}"/><text class="axis-label" x="${left - 10}" y="${yy + 4}" text-anchor="end">${compact.format(Math.max(0, raw))}</text>`;
  }).join("");
  const paths = series.map((item) => {
    const d = rows.map((row, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(row[item.key]).toFixed(1)}`).join(" ");
    return `<path class="trend-path ${item.cls}" d="${d}"/>`;
  }).join("");
  const dates = [0, Math.floor((rows.length - 1) / 2), rows.length - 1].map((index) => `<text class="axis-label" x="${x(index)}" y="${height - 18}" text-anchor="middle">${rows[index].date.slice(5)}</text>`).join("");
  svg.innerHTML = `<desc id="trend-desc">近三十日千问、其他已识别平台与未归因调用趋势。</desc>${lines}${paths}${dates}<g id="hover-layer"></g><rect class="chart-hit" x="${left}" y="${top}" width="${innerW}" height="${innerH}"/>`;
  const hit = svg.querySelector(".chart-hit");
  const show = (event) => {
    const rect = svg.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width * width;
    const index = Math.max(0, Math.min(rows.length - 1, Math.round((px - left) / innerW * (rows.length - 1))));
    const row = rows[index];
    el("trend-readout").innerHTML = `<b>${row.date}</b>&nbsp;&nbsp; 千问 ${number.format(row.qianwen)} · 其他已识别 ${number.format(row.otherIdentified)} · 未归因 ${number.format(row.unattributed)}`;
    el("hover-layer").innerHTML = `<line class="hover-line" x1="${x(index)}" x2="${x(index)}" y1="${top}" y2="${top + innerH}"/>${series.map((item) => `<circle class="hover-dot" cx="${x(index)}" cy="${y(row[item.key])}" r="6" fill="${item.color}"/>`).join("")}`;
  };
  hit.addEventListener("mousemove", show);
  hit.addEventListener("touchmove", (event) => { event.preventDefault(); show(event.touches[0]); }, { passive: false });
}

document.querySelectorAll("[data-metric]").forEach((button) => button.addEventListener("click", () => {
  metric = button.dataset.metric;
  document.querySelectorAll("[data-metric]").forEach((item) => item.classList.toggle("active", item === button));
  renderPlatformChart();
}));
document.querySelectorAll("[data-scale]").forEach((button) => button.addEventListener("click", () => {
  scale = button.dataset.scale;
  document.querySelectorAll("[data-scale]").forEach((item) => item.classList.toggle("active", item === button));
  renderTrend();
}));

try {
  const response = await fetch(`./data/latest.json?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  report = await response.json();
  renderHeadline();
  renderPlatformChart();
  renderTrend();
  renderLists();
  renderMethods();
} catch (error) {
  el("freshness").textContent = "数据读取失败";
  el("verdict-copy").textContent = "当前无法读取聚合数据，请稍后刷新页面。";
  console.error(error);
}
