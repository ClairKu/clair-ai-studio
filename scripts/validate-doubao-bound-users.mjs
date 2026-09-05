import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../public/reports/doubao-bound-qieman-users-2026-09-05/", import.meta.url);
const data = JSON.parse(readFileSync(new URL("data/latest.json", root), "utf8"));
const html = readFileSync(new URL("index.html", root), "utf8");
const app = readFileSync(new URL("app.js", root), "utf8");
const source = readFileSync(new URL("source-register.md", root), "utf8");

assert.equal(data.schema, "doubao-bound-qieman-users/public-v1");
assert.equal(data.headline.activeAuthorizedUsers, 341);
assert.equal(data.headline.newIdentityUsers, 194);
assert.equal(data.headline.existingIdentityUsers, 147);
assert.ok(data.headline.newIdentityUsers + data.headline.existingIdentityUsers <= data.headline.activeAuthorizedUsers);
assert.equal(data.funnel.new.fundAccounts, 0);
assert.equal(data.funnel.new.bankCards, 0);
assert.equal(data.funnel.new.postBindBuyers, 0);
assert.equal(data.funnel.existing.postBindBuyers, 11);
assert.equal(data.assets.holders, 30);
assert.equal(data.assets.total, 4344854.28);
assert.equal(data.usage.callingUsers, 35);
assert.equal(data.usage.calls, 3408);
assert.equal(data.consent.emptyScopeUsers, data.consent.currentUsers);
assert.equal(data.consent.nullDataPermissionUsers, data.consent.currentUsers);
assert.equal(data.dailyBindings.reduce((sum, row) => sum + row.new, 0), data.headline.newIdentityUsers);
assert.ok(data.usage.topRoutes.every((row) => row.users >= data.privacy.minimumCell));

for (const signal of [
  "还没有带来财富账户",
  "不等于豆包直接贡献",
  "绑定后 7 日完成有效财富任务",
  "时间先后不等于渠道因果",
]) assert.ok(`${html}\n${source}`.includes(signal), `缺少关键证据边界：${signal}`);

for (const forbidden of [
  /\b1[3-9]\d{9}\b/,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  /REDASH_API_KEY/,
]) assert.ok(!forbidden.test(`${JSON.stringify(data)}\n${html}\n${app}\n${source}`), `公开报告命中敏感模式：${forbidden}`);

console.log(`豆包绑定且慢用户报告通过：${data.headline.activeAuthorizedUsers} 名有效授权，${data.headline.newIdentityUsers} 名新身份，资产快照 ${data.assetAsOf}。`);
