import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "oap-channel-attribution-dashboard-2026-09-04";
const base = join(root, "public", "reports", slug);
const read = (path) => readFileSync(join(base, path), "utf8");
const data = JSON.parse(read("data/latest.json"));

assert.equal(data.schema, "oap-channel-attribution/v1");
assert.ok(data.generatedAt.endsWith("+08:00"));
assert.ok(data.totals.calls30d > 0);
assert.ok(data.totals.activeKeys30d > 0);
assert.equal(data.platforms.reduce((sum, row) => sum + row.calls30d, 0), data.totals.calls30d);
assert.equal(data.platforms.reduce((sum, row) => sum + row.activeKeys30d, 0), data.totals.activeKeys30d);
assert.equal(data.trend.reduce((sum, row) => sum + row.qianwen + row.otherIdentified + row.unattributed, 0), data.totals.calls30d);
assert.ok(data.platforms.some((row) => row.platform === "千问" && row.calls30d > 0));
assert.ok(data.oauthClients.some((row) => row.client === "豆包" && row.currentUsers >= 20));
assert.ok(!data.platforms.some((row) => row.platform === "WorkBuddy" && row.calls30d > 0));
assert.ok(data.oauthClients.filter((row) => row.currentUsersDisplay === "<5").every((row) => row.currentUsers === null));
assert.ok(data.coverage.callAttributionRate > data.coverage.activeKeyAttributionRate);

const serialized = JSON.stringify(data);
for (const prohibited of ["REDASH_API_KEY", "client_secret_hash", "token_hash", '"client_id":', '"user_id":', '"request_id":', '"api_key_id":']) {
  assert.ok(!serialized.includes(prohibited), `public payload exposes ${prohibited}`);
}
assert.doesNotMatch(serialized, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);

const html = read("index.html");
const css = read("styles.css");
const app = read("app.js");
for (const marker of ["OAP 全平台渠道归因看板", "你关心的三个入口", "全平台贡献榜", "身份渠道和客户端平台", "补一层归因"]) {
  assert.ok(html.includes(marker), `missing HTML marker: ${marker}`);
}
for (const marker of ["renderPlatformChart", "renderTrend", "WorkBuddy", "未标注平台", "platform_type = 0008"]) {
  assert.ok(app.includes(marker) || html.includes(marker), `missing behavior marker: ${marker}`);
}
assert.ok(css.includes("@media(max-width:680px)"));
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(existsSync(join(root, "public", "previews", `${slug}.svg`)));

console.log(`OAP 渠道归因看板校验通过：${data.asOf}，${data.totals.calls30d} 次调用，${data.platforms.length} 类平台。`);
