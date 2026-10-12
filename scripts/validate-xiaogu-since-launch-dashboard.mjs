import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const publicPath = new URL("../public/reports/xiaogu-since-launch-usage-question-dashboard-2026-10-10/index.html", import.meta.url);
const previewPath = new URL("../public/previews/xiaogu-since-launch-usage-question-dashboard-2026-10-10.svg", import.meta.url);
const appPath = new URL("../src/app.js", import.meta.url);

assert.ok(existsSync(publicPath), "missing Xiaogu since-launch dashboard");
assert.ok(existsSync(previewPath), "missing Xiaogu since-launch preview");

const html = readFileSync(publicPath, "utf8");
const app = readFileSync(appPath, "utf8");
for (const marker of [
  "233,571",
  "49,926",
  "237,085",
  "29,343",
  "167,429",
  "73.7%",
  "4.17%",
  "D-015",
  "D-016",
  "2024-01-23",
  "460,281",
  "107,815",
  "644,219",
  "historyChart",
  "AI 小顾上线以来",
  "report-data",
]) assert.ok(html.includes(marker), `dashboard missing ${marker}`);

assert.ok(app.includes('id: "xiaogu-since-launch-usage-question-dashboard-2026-10-10"'), "workbench card missing");
assert.ok(app.includes('preview: "xiaogu-since-launch-usage-question-dashboard-2026-10-10.svg"'), "preview registration missing");

const payload = JSON.parse(html.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/)?.[1] || "null");
assert.ok(payload, "missing report data payload");
assert.equal(payload.history.length, 34, "history must contain 34 months");
const historyYear = (year) => payload.history.filter((row) => row.month.startsWith(year)).reduce((sum, row) => sum + (row.inputs || 0), 0);
assert.equal(historyYear("2024"), 81095, "2024 history inputs do not reconcile");
assert.equal(historyYear("2025"), 326039, "2025 history inputs do not reconcile");
assert.equal(historyYear("2026"), 237085, "2026 history inputs do not reconcile");
assert.equal(payload.front.reduce((sum, row) => sum + row.inputs, 0), 237085, "front inputs do not reconcile");
assert.equal(payload.backend.reduce((sum, row) => sum + row.questions, 0), 167429, "backend questions do not reconcile");
assert.equal(Object.values(payload.themes.all).reduce((sum, value) => sum + value, 0), 167429, "themes do not reconcile");
assert.equal(payload.depth.reduce((sum, row) => sum + row.users, 0), 29343, "depth does not reconcile");

const forbidden = /(ying99_|qmuser|user_id|po_manager|redash|api[_ -]?key|access[_ -]?token|view[_ -]?token)/i;
assert.equal(forbidden.test(html), false, "dashboard leaks an internal identifier or credential marker");

console.log("AI 小顾上线以来使用与提问看板校验通过：历史证据、总量、分类、深度、工作台卡片与隐私边界一致。");
