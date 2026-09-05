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
for (const prohibited of ["REDASH_API_KEY", "client_secret", "token_hash", '"user_id"', '"phone"', "po_manager_id"]) {
  assert.ok(!readFileSync(join(report, "data", "latest.json"), "utf8").includes(prohibited), `公开数据包含敏感字段：${prohibited}`);
}
assert.match(preview, /豆包 × 且慢/);
assert.match(workbench, /id: "doubao-qieman-user-dashboard"/);
assert.match(workbench, /reports\/doubao-qieman-user-dashboard\//);

console.log(`豆包且慢使用后转化看板校验通过：授权 ${data.metrics.boundAccounts} 人，使用代理 ${data.journey.readyAccounts} 人，入金 ${data.journey.inflowWanAfterReady} 万。`);
