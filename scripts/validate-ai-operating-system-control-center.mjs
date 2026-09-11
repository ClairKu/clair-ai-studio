import { existsSync, readFileSync } from "node:fs";

const fail = (message) => { throw new Error(message); };
const root = new URL("../", import.meta.url);
const publicReportPath = new URL("public/reports/ai-operating-system-control-center-2026-09-11/index.html", root);
const docsReportPath = new URL("docs/reports/ai-operating-system-control-center-2026-09-11/index.html", root);
const publicPreviewPath = new URL("public/previews/ai-operating-system-control-center-2026-09-11.png", root);
const docsPreviewPath = new URL("docs/previews/ai-operating-system-control-center-2026-09-11.png", root);
const appPath = new URL("src/app.js", root);

for (const path of [publicReportPath, docsReportPath, publicPreviewPath, docsPreviewPath, appPath]) {
  if (!existsSync(path)) fail(`缺少 AI 工作总控资产：${path.pathname}`);
}

const report = readFileSync(publicReportPath, "utf8");
const docsReport = readFileSync(docsReportPath, "utf8");
const app = readFileSync(appPath, "utf8");
const requiredSignals = [
  "不是多开 AI",
  "是带一支 AI 团队",
  "生成分工与验收单",
  "Configured",
  "Connected",
  "Executed",
  "Verified",
  "Delivered",
  "不跨平台传递凭证或客户标识",
  "chooseRoute(task)",
  "downloadBrief()",
];
for (const signal of requiredSignals) {
  if (!report.includes(signal)) fail(`AI 工作总控缺少信号：${signal}`);
  if (!docsReport.includes(signal)) fail(`线上 AI 工作总控缺少信号：${signal}`);
}
if (!docsReport.includes("data-clair-access-gate")) fail("线上 AI 工作总控缺少工作台访问门");
if (!app.includes('id: "ai-operating-system-control-center-2026-09-11"')) fail("工作台未登记 AI 工作总控");
for (const sensitive of [/\/Users\//, /api[_-]?key\s*[:=]/i, /bearer\s+[a-z0-9._-]{12,}/i, /account3_id/i]) {
  if (sensitive.test(report)) fail(`公开 AI 工作总控命中敏感模式：${sensitive}`);
}
console.log("AI operating system control center validation passed");
