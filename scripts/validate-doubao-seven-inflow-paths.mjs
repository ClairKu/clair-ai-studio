import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "doubao-seven-inflow-paths-2026-09-05";
const report = join(root, "public", "reports", slug);
const raw = readFileSync(join(report, "data", "latest.json"), "utf8");
const data = JSON.parse(raw);
const html = readFileSync(join(report, "index.html"), "utf8");
const preview = readFileSync(join(root, "public", "previews", `${slug}.svg`), "utf8");
const workbench = readFileSync(join(root, "src", "app.js"), "utf8");

const sum = (key) => data.users.reduce((total, user) => total + Number(user[key] || 0), 0);

assert.equal(data.schema_version, "doubao-seven-inflow-paths-v1");
assert.equal(data.users.length, 7);
assert.deepEqual(data.users.map((user) => user.id), ["U01", "U02", "U03", "U04", "U05", "U06", "U07"]);
assert.equal(sum("inflow"), data.headline.dayLevelInflow);
assert.equal(sum("strictInflow"), data.headline.strictInflow);
assert.equal(sum("sameDayInflow"), data.headline.sameDayAmbiguousInflow);
assert.equal(sum("sessionTokens"), data.headline.sessionTokens);
assert.equal(sum("activeSessionDays"), data.headline.activeSessionDays);
assert.equal(sum("postBuyAmount"), data.headline.postUseBuyAmount);
assert.equal(sum("postBuyOrders"), data.headline.postUseBuyOrders);
assert.equal(data.users.filter((user) => user.strictInflow > 0).length, data.headline.strictUsers);
assert.equal(data.users.filter((user) => user.inflow > 0).length, data.headline.dayLevelUsers);
assert.equal(data.users.filter((user) => user.postBuyAmount > 0).length, data.headline.postUseBuyers);
assert.equal(data.users.filter((user) => user.sameDayInflow > 0).length, data.headline.sameDayUsers);
assert.equal(data.users.filter((user) => user.sameDayInflow > 0 && user.strictInflow === 0).length, data.headline.sameDayOnlyUsers);
assert.ok(data.users.every((user) => user.milestonesBefore.length === 4), "7 人都应在会话前完成四个里程碑");
assert.equal(data.evidence.length, 3);
assert.ok(data.sources.length >= 5);

for (const marker of ["这 7 人不是新增用户", "6 人 / 8,258 元", "817×", "四种不同路径", "使用后发生不等于豆包导致", "path-svg"]) {
  assert.match(html, new RegExp(marker), `页面缺少关键标记：${marker}`);
}
for (const prohibited of ["po_manager_id", "account3_id", "account_id", "phone", "mobile", "id_card", "bank_no", "order_id", "client_secret", "token_hash"]) {
  assert.ok(!raw.includes(prohibited), `公开数据包含敏感字段：${prohibited}`);
}
assert.match(preview, /存量投资者的再行动/);
assert.match(workbench, new RegExp(`id: "${slug}"`));
assert.match(workbench, new RegExp(`reports\/${slug}\/`));

console.log(`豆包七人路径报告校验通过：自然日 ${data.headline.dayLevelUsers} 人 / ${data.headline.dayLevelInflow} 元，严格后续 ${data.headline.strictUsers} 人 / ${data.headline.strictInflow} 元。`);
