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

assert.equal(data.schema_version, "doubao-qieman-user-dashboard-v1");
assert.ok(data.metrics.boundAccounts >= 300, "豆包绑定用户数异常偏低");
assert.equal(data.metrics.boundAccounts, data.metrics.currentAccounts + data.metrics.inactiveAccounts);
assert.equal(data.metrics.boundAccounts, data.metrics.newAccounts + data.metrics.existingAccounts + data.metrics.unclassifiedAccounts);
assert.equal(data.metrics.boundAccounts, data.cohorts.all.population);
assert.equal(data.daily.at(-1).cumulativeTotal, data.metrics.boundAccounts);
assert.equal(data.cohorts.new.assets.holdingWan, 0, "新用户不应凭空出现历史资产");
assert.equal(data.cohorts.new.behavior.firstInvestmentAfter, 0, "新用户首投口径发生变化，请人工复核");
assert.equal(data.cohorts.all.behavior.xiaoguUsage, null, "缺少用户级使用归因时不得填入小顾使用人数");
assert.match(data.evidence.usageGap, /不能替代 AI 小顾使用人数/);

for (const key of ["all", "new", "existing"]) {
  const cohort = data.cohorts[key];
  assert.equal(Object.values(cohort.profile.gender).reduce((sum, value) => sum + value, 0), cohort.population);
  assert.equal(Object.values(cohort.assets.buckets).reduce((sum, value) => sum + value, 0), cohort.population);
}

for (const marker of ["绑定不是终点", "VALUE FUNNEL", "EVIDENCE BOUNDARY", "data-cohort", "growth-chart"]) {
  assert.match(html, new RegExp(marker), `页面缺少关键标记：${marker}`);
}
for (const prohibited of ["REDASH_API_KEY", "client_secret", "token_hash", '"user_id"', '"phone"', "po_manager_id"]) {
  assert.ok(!readFileSync(join(report, "data", "latest.json"), "utf8").includes(prohibited), `公开数据包含敏感字段：${prohibited}`);
}
assert.match(preview, /豆包 × 且慢/);
assert.match(workbench, /id: "doubao-qieman-user-dashboard"/);
assert.match(workbench, /reports\/doubao-qieman-user-dashboard\//);

console.log(`豆包且慢绑定用户看板校验通过：${data.metrics.boundAccounts} 人，${data.daily.length} 天，3 个用户分群。`);
