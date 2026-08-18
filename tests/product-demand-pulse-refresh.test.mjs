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

test("取数口径与链接暴露策略都写在配置里，不散落在脚本中", async () => {
  const rules = JSON.parse(await read("automation/pain-off/config/rules.json"));
  assert.equal(rules.source.system, "GitLab");
  assert.ok(rules.released.requires.target_branch_in.includes("master"));
  assert.equal(rules.demand_key.strategy, "project_id+source_branch");
  assert.ok(["public", "internal_only"].includes(rules.publish_policy.link_exposure));
  assert.equal("publish_mr_titles" in rules.publish_policy, false, "MR 标题不设开关，一律不发");
});
