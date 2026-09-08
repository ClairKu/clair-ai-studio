import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const report = join(root, "public", "reports", "doubao-qieman-user-dashboard");
const html = readFileSync(join(report, "index.html"), "utf8");
const data = JSON.parse(readFileSync(join(report, "data", "latest.json"), "utf8"));
const preview = readFileSync(join(root, "public", "previews", "doubao-qieman-user-dashboard.svg"), "utf8");
const workbench = readFileSync(join(root, "src", "app.js"), "utf8");
const numberFormat = new Intl.NumberFormat("zh-CN");
const coverage = `${(data.metrics.readyAccounts / data.metrics.boundAccounts * 100).toFixed(1)}%`;
const cutoff = data.meta.data_cutoff.slice(0, 16).replace("T", " ");

assert.equal(data.schema_version, "doubao-qieman-user-dashboard-v2");
assert.ok(data.metrics.boundAccounts >= 300, "豆包绑定用户数异常偏低");
assert.equal(data.metrics.boundAccounts, data.metrics.currentAccounts + data.metrics.inactiveAccounts);
assert.equal(data.metrics.boundAccounts, data.metrics.newAccounts + data.metrics.existingAccounts + data.metrics.unclassifiedAccounts);
assert.equal(data.metrics.boundAccounts, data.cohorts.all.population);
assert.equal(data.daily.at(-1).cumulativeTotal, data.metrics.boundAccounts);
assert.ok(data.metrics.readyAccounts >= 300, "进入可使用状态用户数异常偏低");
assert.equal(data.journey.readyAccounts, data.metrics.readyAccounts);
assert.ok(data.metrics.readyAccounts <= data.metrics.boundAccounts);
assert.equal(data.journey.actualToolUsers, null, "缺少豆包来源回连时不得填实际使用人数");
assert.equal(data.journey.actualToolUsersState, "unavailable_no_client_to_user_call_link");
for (const key of ["openedAfterReady", "cardBoundAfterReady", "riskAssessedAfterReady", "firstInvestmentAfterReady"]) {
  assert.ok(Number.isInteger(data.journey[key]) && data.journey[key] >= 0, `${key} 必须是非负整数`);
}
assert.ok(data.journey.inflowUsersAfterReady >= 0);
assert.ok(data.journey.inflowWanAfterReady >= 0);
assert.ok(data.journey.strictInflowUsersAfterReady <= data.journey.inflowUsersAfterReady);
assert.ok(data.journey.strictInflowWanAfterReady <= data.journey.inflowWanAfterReady);
assert.equal(data.journey.strictInflowUsersAfterReady, 6, "严格后续日入金用户口径发生变化，请人工复核");
assert.equal(data.journey.strictInflowWanAfterReady, 0.8258, "严格后续日入金金额发生变化，请人工复核");
assert.equal(data.journey.sameDayInflowWan, 0.11, "同日不确定入金金额发生变化，请人工复核");
assert.equal(data.cohorts.new.assets.holdingWan, 0, "新用户不应凭空出现历史资产");
assert.equal(data.cohorts.new.behavior.firstInvestmentAfter, 0, "新用户首投口径发生变化，请人工复核");
assert.equal(data.cohorts.all.behavior.xiaoguUsage, null, "缺少用户级使用归因时不得填入小顾使用人数");
assert.match(data.evidence.usageGap, /不能替代实际工具调用人数/);

for (const key of ["all", "new", "existing"]) {
  const cohort = data.cohorts[key];
  assert.equal(Object.values(cohort.profile.gender).reduce((sum, value) => sum + value, 0), cohort.population);
  assert.equal(Object.values(cohort.assets.buckets).reduce((sum, value) => sum + value, 0), cohort.population);
}

for (const marker of ["使用之后有没有转化", "POST-USE CONVERSION", "EVIDENCE BOUNDARY", "实际工具调用", "growth-chart"]) {
  assert.match(html, new RegExp(marker), `页面缺少关键标记：${marker}`);
}
assert.match(html, /id="growth-title"/, "增长标题必须从最新快照动态生成，避免静态人数过期");
assert.match(html, /class="chart-readout" id="chart-readout"/, "图表每日数据必须使用绘图区外的固定读数栏，避免遮挡图形");
assert.match(html, /CUMULATIVE · 累计绑定/, "增长模块必须把累计用户作为第一层关键数据");
assert.match(html, /AUDIENCE MIX · 用户构成/, "增长模块必须把新老用户分布作为第二层关键数据");
assert.match(html, /DAILY · 日维度/, "增长模块必须把日维度数据作为第三层明细");
assert.match(html, /id="growth-new-bar"/, "新老用户构成必须提供可视化比例条");
assert.match(html, /showReadout\(rows\.length-1\)/, "图表读数栏必须默认展示最新一天，触屏设备无需悬停也能读取");
assert.match(html, /hit\.addEventListener\("click",show\)/, "图表读数栏必须支持触屏点击切换日期");
assert.doesNotMatch(html, /class="tooltip"|id="tooltip"/, "图表不得恢复会遮挡绘图区的浮动提示卡");
assert.match(html, /aspect-ratio:760\/330/, "图表必须保持 viewBox 比例，避免响应式下出现大块无效留白");
for (const prohibited of ["REDASH_API_KEY", "client_secret", "token_hash", '"user_id"', '"phone"', "po_manager_id"]) {
  assert.ok(!readFileSync(join(report, "data", "latest.json"), "utf8").includes(prohibited), `公开数据包含敏感字段：${prohibited}`);
}
assert.match(preview, /豆包 × 且慢/);
assert.match(preview, new RegExp(`>${data.metrics.boundAccounts}<`), "工作台预览中的授权人数未同步");
assert.match(preview, new RegExp(`>${data.metrics.readyAccounts}<`), "工作台预览中的使用代理人数未同步");
assert.match(preview, new RegExp(coverage.replace(".", "\\.")), "工作台预览中的使用代理覆盖率未同步");
assert.match(workbench, /id: "doubao-qieman-user-dashboard"/);
assert.match(workbench, /reports\/doubao-qieman-user-dashboard\//);
assert.match(workbench, new RegExp(`数据截至 ${cutoff.replace(".", "\\.")}`), "工作台摘要中的数据截止时间未同步");
assert.match(workbench, new RegExp(`${data.metrics.boundAccounts} 人完成豆包授权`), "工作台摘要中的授权人数未同步");
assert.match(workbench, new RegExp(`${data.metrics.readyAccounts} 人产生至少一次 OAuth 会话令牌`), "工作台摘要中的使用代理人数未同步");
assert.match(workbench, new RegExp(`共 ${numberFormat.format(data.metrics.usageProxySessions)} 次`), "工作台摘要中的会话令牌次数未同步");

console.log(`豆包且慢使用后转化看板校验通过：授权 ${data.metrics.boundAccounts} 人，使用代理 ${data.journey.readyAccounts} 人，严格后续日入金 ${data.journey.strictInflowWanAfterReady} 万。`);
