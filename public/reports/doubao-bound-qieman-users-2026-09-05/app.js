const $ = (selector) => document.querySelector(selector);
const fmt = new Intl.NumberFormat("zh-CN");
const pct = (n, d) => d ? `${(n / d * 100).toFixed(1)}%` : "—";

fetch("./data/latest.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch((error) => {
    document.body.insertAdjacentHTML("afterbegin", `<div class="data-error">数据加载失败：${error.message}</div>`);
  });

function render(data) {
  $("#hero-total").textContent = fmt.format(data.headline.activeAuthorizedUsers);
  $("#data-time").textContent = `数据生成 ${data.generatedAt.slice(0, 16).replace("T", " ")}`;
  renderDaily(data.dailyBindings);
  renderBars("#hours-chart", data.authorizationHours, "users");
  renderBars("#tenure-chart", data.existingTenure, "users");
  renderFunnel("#new-funnel", [
    ["有效授权", data.funnel.new.authorized],
    ["身份映射", data.funnel.new.mapped],
    ["资金账户", data.funnel.new.fundAccounts],
    ["完成绑卡", data.funnel.new.bankCards],
    ["风险测评", data.funnel.new.riskAssessed],
    ["绑定后买入", data.funnel.new.postBindBuyers],
  ], data.funnel.new.authorized);
  renderFunnel("#existing-funnel", [
    ["有效授权", data.funnel.existing.authorized],
    ["资金账户", data.funnel.existing.fundAccounts],
    ["风险测评", data.funnel.existing.riskAssessed],
    ["历史买入", data.funnel.existing.everInvested],
    ["当前持仓", data.funnel.existing.currentHolders],
    ["绑定后买入", data.funnel.existing.postBindBuyers],
  ], data.funnel.existing.authorized);
  renderRoutes(data.usage.topRoutes);
  renderDefinitions(data);
}

function renderDaily(rows) {
  const max = Math.max(...rows.map((row) => row.new + row.existing));
  $("#daily-chart").innerHTML = rows.map((row) => {
    const total = row.new + row.existing;
    const overall = Math.max(16, total / max * 260);
    const newHeight = overall * row.new / total;
    const existingHeight = overall - newHeight;
    return `<div class="stack-col" title="${row.date}：新身份 ${row.new}，存量身份 ${row.existing}">
      <span class="total">${total}</span><div class="stack"><i class="new" style="height:${newHeight}px"></i><i class="existing" style="height:${existingHeight}px"></i></div>
      <label>${row.date.slice(5).replace("-", "/")}</label>${row.partial ? "<small>截至21:41</small>" : ""}</div>`;
  }).join("");
}

function renderBars(target, rows, key) {
  const max = Math.max(...rows.map((row) => row[key]));
  $(target).innerHTML = rows.map((row) => `<div class="bar-row"><span>${row.bucket}</span><div class="bar-track"><i style="width:${row[key] / max * 100}%"></i></div><b>${fmt.format(row[key])}</b></div>`).join("");
}

function renderFunnel(target, rows, denominator) {
  $(target).innerHTML = rows.map(([label, value]) => `<div class="funnel-row"><label>${label}</label><div class="funnel-track"><i style="width:${value / denominator * 100}%"></i></div><strong>${fmt.format(value)}<small>${pct(value, denominator)}</small></strong></div>`).join("");
}

function renderRoutes(rows) {
  const max = Math.max(...rows.map((row) => row.calls));
  $("#route-chart").innerHTML = rows.map((row) => `<div class="route-row" title="${row.operation}"><span>${row.label}</span><div class="route-track"><i style="width:${row.calls / max * 100}%"></i></div><strong>${fmt.format(row.calls)}<small>${row.users}人</small></strong></div>`).join("");
}

function renderDefinitions(data) {
  const labels = {activeAuthorizedUser:"有效授权用户",newIdentity:"授权即新建身份",postBindBuyer:"绑定后买入",currentHolder:"当前持仓",managedHolder:"在管持仓",profitableHolder:"累计收益为正"};
  const definitions = Object.entries(data.definitions).map(([key, value]) => `<div class="definition"><b>${labels[key] || key}</b><p>${value}</p></div>`).join("");
  const sources = data.sources.map((source) => `<li>${source}</li>`).join("");
  $("#definitions").innerHTML = `${definitions}<div class="source-list"><b>生产聚合来源</b><ul>${sources}</ul><p>${data.privacy.note}</p></div>`;
}

function updateProgress() {
  const height = document.documentElement.scrollHeight - innerHeight;
  $("#progress-bar").style.width = `${height > 0 ? scrollY / height * 100 : 0}%`;
}
addEventListener("scroll", updateProgress, {passive:true});
updateProgress();
