import { existsSync, readFileSync } from "node:fs";

const fail = (message) => { throw new Error(message); };
const root = new URL("../", import.meta.url);
const reportPath = new URL("public/reports/qieman-skill-library-install-audit-2026-09-09/index.html", root);
const previewPath = new URL("public/previews/qieman-skill-library-install-audit-2026-09-09.svg", root);
const appPath = new URL("src/app.js", root);

for (const file of [reportPath, previewPath, appPath]) {
  if (!existsSync(file)) fail(`缺少文件：${file.pathname}`);
}

const report = readFileSync(reportPath, "utf8");
const preview = readFileSync(previewPath, "utf8");
const app = readFileSync(appPath, "utf8");

const requiredReportSignals = [
  "21/21 官方结构校验",
  "14 个可直接使用",
  "5 个仍被数据工具或缺失附件卡住",
  "7 个业务数值断言",
  "登录凭证在前端",
  "未做破坏性写权限测试",
  "2026-09-30",
  "data-filter=\"blocked\"",
];
for (const signal of requiredReportSignals) {
  if (!report.includes(signal)) fail(`报告缺少信号：${signal}`);
}

for (const secretPattern of [/qieman@[\w.-]+/i, /sb_(?:publishable|secret)_/i, /[a-z0-9]{24,}\.app\.workbuddy\.link/i, /[a-z]{20}\.supabase\.co/i]) {
  if (secretPattern.test(report) || secretPattern.test(preview) || secretPattern.test(app)) {
    fail(`公开资产命中敏感模式：${secretPattern}`);
  }
}

if (!preview.includes("21/21") || !preview.includes("14")) fail("预览图缺少核心指标");
if (!app.includes('id: "qieman-skill-library-install-audit-2026-09-09"')) fail("工作台未登记报告");
console.log("qieman skill library audit validation passed");
