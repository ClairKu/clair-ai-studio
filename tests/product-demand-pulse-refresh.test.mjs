import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");
const REPORT = "public/reports/product-demand-pulse";

test("页面不再指望本机服务——公网点更新必须能走通", async () => {
  const app = await read(`${REPORT}/app.js`);
  assert.doesNotMatch(app, /127\.0\.0\.1|localhost:\d+/, "公网页面连不上本机地址");
  assert.doesNotMatch(app, /codex:\/\//, "公网访客装不了 Codex，不能拿它当兜底");
  assert.doesNotMatch(app, /link\.download|exportUpdatePacket|data-export-update/);
});

test("更新入口按『先拉快照，必要时才回内网重算』两段走", async () => {
  const app = await read(`${REPORT}/app.js`);
  const html = await read(`${REPORT}/index.html`);
  assert.match(app, /async function updateData/);
  assert.match(app, /loadSnapshot/);
  assert.match(app, /relay-config\.json/, "中继地址要可配置，不能写死在代码里");
  assert.match(html, /data-refresh-update/);
});

test("口令只发给中继校验，页面里不留任何凭据", async () => {
  const app = await read(`${REPORT}/app.js`);
  assert.match(app, /X-Pulse-Passcode/);
  // 页面里出现明文口令或哈希就等于没有口令
  assert.doesNotMatch(app, /PASSCODE\s*=\s*["'][^"']+["']/);
  assert.doesNotMatch(app, /AGENT_TOKEN/);
});

test("中继地址没配置时，页面要说清楚而不是假装在更新", async () => {
  const app = await read(`${REPORT}/app.js`);
  const config = JSON.parse(await read(`${REPORT}/data/relay-config.json`));
  assert.ok("worker_base" in config);
  assert.match(app, /实时重算尚未启用/);
});

test("链路追溯模块存在，且链接一律新窗口打开", async () => {
  const app = await read(`${REPORT}/app.js`);
  const html = await read(`${REPORT}/index.html`);
  assert.match(html, /id="trace-list"/);
  assert.match(app, /function renderTrace/);
  assert.match(app, /rel="noopener noreferrer"/);
  assert.match(app, /target="_blank"/);
});

test("四象限标题与底部统计始终按实际展示卡片计数", async () => {
  const app = await read(`${REPORT}/app.js`);
  assert.match(app, /<b>\$\{items\.length\}<\/b>/);
  assert.match(app, /\$\{items\.length - released\} 待解决/);
  assert.doesNotMatch(app, /scoped\.length|· 口径外/);
});

test("已核验历史基线可补齐尚未刷新到新口径的中继快照", async () => {
  const app = await read(`${REPORT}/app.js`);
  assert.match(app, /EMBEDDED_BASELINES/);
  assert.match(app, /record\.in_scope !== false/);
  assert.match(app, /normalized\.summary =/);
});

test("嘉鸿与家亮已确认上线的历史需求保留在正式统计中", async () => {
  // 人工核验口径：R1/R3/R4 已上线（8·12 核验，research/product-demand-pulse-2026-08-12.md）；
  // R2 经 refs 核验未进 master（e527b48），如实计 merged——它上线与否交给每日自动刷新判定，
  // 这里只守「已核验上线的历史需求不丢、不降级」，不把未上线的硬写成上线。
  const data = JSON.parse(await read(`${REPORT}/data/latest.json`));
  const jiahong = data.people.find((person) => person.display_name === "嘉鸿");
  const jialiang = data.people.find((person) => person.display_name === "家亮");
  const r1 = data.records.find((record) => record.id === "R1");
  const r2 = data.records.find((record) => record.id === "R2");
  const r3 = data.records.find((record) => record.id === "R3");
  const r4 = data.records.find((record) => record.id === "R4");

  assert.equal(r1.status, "released");
  assert.ok(jiahong.released >= 1);
  assert.equal(jiahong.end_to_end, true);

  assert.ok(jialiang.released >= 2, "家亮两条已核验上线需求（R3 自动取数 + R4 人工补录）都要计入");
  assert.equal(r3.status, "released");
  assert.equal(r4.in_scope, true, "R4 人工补录需求必须挂上口径内需求，不许因刷新掉出统计");
  assert.equal(r4.status, "released");

  // R2 仍在正式统计里（in_scope），且没上线就不许留 released_at。
  assert.equal(r2.in_scope, true);
  if (r2.status !== "released") assert.equal(r2.released_at, null);
});

test("取数口径与链接暴露策略都写在配置里，不散落在脚本中", async () => {
  const rules = JSON.parse(await read("automation/pain-off/config/rules.json"));
  assert.equal(rules.source.system, "GitLab");
  assert.ok(rules.released.requires.target_branch_in.includes("master"));
  assert.equal(rules.demand_key.strategy, "source_branch+fix_folding");
  assert.ok(["public", "internal_only"].includes(rules.publish_policy.link_exposure));
  assert.equal("publish_mr_titles" in rules.publish_policy, false, "MR 标题不设开关，一律不发");
});
