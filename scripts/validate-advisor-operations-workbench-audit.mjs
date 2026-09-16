import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const docs = new URL("docs/reports/advisor-operations-workbench-deep-audit-2026-09-16/index.html", root);
const pub = new URL("public/reports/advisor-operations-workbench-deep-audit-2026-09-16/index.html", root);
const docsPreview = new URL("docs/previews/advisor-operations-workbench-deep-audit-2026-09-16.svg", root);
const pubPreview = new URL("public/previews/advisor-operations-workbench-deep-audit-2026-09-16.svg", root);
const appPath = new URL("src/app.js", root);
const fail = (message) => { throw new Error(message); };

for (const file of [docs, pub, docsPreview, pubPreview, appPath]) {
  if (!existsSync(file)) fail(`缺少公开资产：${file.pathname}`);
}

const html = readFileSync(docs, "utf8");
const publicHtml = readFileSync(pub, "utf8");
const preview = readFileSync(docsPreview, "utf8");
const publicPreview = readFileSync(pubPreview, "utf8");
const app = readFileSync(appPath, "utf8");
const stripAccessGate = (source) => source
  .replace(/\s*<meta name="robots"[^>]*data-clair-access-robots\s*\/>/g, "")
  .replace(/\s*<script[^>]*data-clair-access-gate[^>]*><\/script>/g, "");
if (stripAccessGate(html) !== stripAccessGate(publicHtml)) fail("docs/public 报告源码镜像不一致");
if (preview !== publicPreview) fail("docs/public 预览镜像不一致");

const requiredSignals = [
  "核心工作区",
  "31 条可见记录",
  "29/29 技能主文安装",
  "52 条",
  "122 个投研/基金/组合/宏观/资讯工具",
  "脚本 35 vs 28",
  "没有进行越权或破坏性写测试",
  "data-filter=\"blocked\"",
  "顾问运营 AI 工作台｜全功能、数据与 Skill 深度审计",
];
for (const signal of requiredSignals) if (!html.includes(signal)) fail(`报告缺少信号：${signal}`);

const skillRows = [...html.matchAll(/\{n:'/g)].length;
const ready = [...html.matchAll(/s:'ready'/g)].length;
const conditional = [...html.matchAll(/s:'conditional'/g)].length;
const blocked = [...html.matchAll(/s:'blocked'/g)].length;
if (skillRows !== 29) fail(`技能条目应为 29，实际 ${skillRows}`);
if (ready !== 15 || conditional !== 6 || blocked !== 8) {
  fail(`运行状态计数异常：ready=${ready}, conditional=${conditional}, blocked=${blocked}`);
}

for (const signal of ["29", "52", "P0", "顾问运营 AI 工作台"]) {
  if (!preview.includes(signal)) fail(`预览缺少信号：${signal}`);
}
if (!app.includes('id: "advisor-operations-workbench-deep-audit-2026-09-16"')) fail("工作台未登记报告");

const publicAssets = `${html}\n${preview}\n${app}`;
const sensitivePatterns = [
  /[a-z0-9]{24,}\.app\.workbuddy\.link/i,
  /[a-z]{20}\.supabase\.co/i,
  /sb_(?:publishable|secret)_/i,
  /eyJ[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}/,
  /\/Users\/[A-Za-z0-9._-]+\//,
  /(?:password|passwd|口令)\s*[:=]\s*["'][^"']{4,}["']/i,
];
for (const pattern of sensitivePatterns) {
  if (pattern.test(publicAssets)) fail(`公开资产命中敏感模式：${pattern}`);
}

console.log(JSON.stringify({
  report: "advisor-operations-workbench-deep-audit-2026-09-16",
  skillRows,
  readiness: { ready, conditional, blocked },
  mirrors: true,
  sensitiveScan: "pass",
  workbench: "registered",
}, null, 2));
