import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportRoot = join(root, "public/reports/knowledge-report-hub");
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => { throw new Error(message); };

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "extractor.js",
  "storage.js",
  "data/latest.json",
  "vendor/pdf.mjs",
  "vendor/pdf.worker.min.mjs",
  "vendor/mammoth.browser.min.js",
  "vendor/xlsx.full.min.js",
  "vendor/jszip.min.js",
];
for (const file of requiredFiles) {
  const path = join(reportRoot, file);
  if (!existsSync(path) || statSync(path).size === 0) fail(`知识卡片台缺少资源：${file}`);
}

const html = read("public/reports/knowledge-report-hub/index.html");
const app = read("public/reports/knowledge-report-hub/app.js");
const extractor = read("public/reports/knowledge-report-hub/extractor.js");
const storage = read("public/reports/knowledge-report-hub/storage.js");
const styles = read("public/reports/knowledge-report-hub/styles.css");
const workbench = read("src/app.js");
const registry = JSON.parse(read("catalog/report-registry.json"));
const feed = JSON.parse(read("public/reports/knowledge-report-hub/data/latest.json"));
const workflow = read(".github/workflows/knowledge-hub-daily.yml");

const checks = [
  [html, "知识采集与证据卡片台", "页面标题缺失"],
  [html, "vendor/mammoth.browser.min.js", "Word 解析器未接入"],
  [html, "vendor/xlsx.full.min.js", "Excel 解析器未接入"],
  [app, "extractKnowledgeCards", "关键卡抽取未接入"],
  [app, "linkKnowledgeGraph", "知识关联未接入"],
  [app, "完整原文", "报告全文回溯入口缺失"],
  [app, "关联关键卡", "关联关键卡入口缺失"],
  [app, "关联报告", "关联报告入口缺失"],
  [app, "data-import", "备份导入缺失"],
  [app, "data-export", "备份导出缺失"],
  [app, "window.setInterval", "页面定时同步缺失"],
  [extractor, "extractPdf", "PDF 抽取器缺失"],
  [extractor, "extractWord", "Word 抽取器缺失"],
  [extractor, "extractWorkbook", "Excel 抽取器缺失"],
  [extractor, "extractSlides", "PPT 抽取器缺失"],
  [storage, "indexedDB.open", "本地持久化未使用 IndexedDB"],
  [storage, "saveOriginalFile", "原始档案无法保存"],
  [styles, "--paper: #f2efe7", "未沿用米白工作台视觉"],
  [styles, "--teal: #078f85", "关键卡缺少青绿色数据语义"],
  [workflow, 'cron: "15 0 * * *"', "每日同步计划缺失"],
  [workflow, "update-knowledge-hub-feed.mjs", "每日同步未调用生成器"],
  [workbench, 'id: "knowledge-report-hub"', "工作台未登记知识卡片台"],
];
for (const [source, signal, message] of checks) if (!source.includes(signal)) fail(message);

if (!registry.protectedReportIds?.includes("knowledge-report-hub")) fail("知识卡片台未加入防静默删减登记册");
if (feed.schema !== "clair-knowledge-hub-feed/v1") fail("每日数据源 schema 不正确");
if (!Array.isArray(feed.reports) || feed.reports.length < 10) fail("每日数据源报告数量不足");
if (!Array.isArray(feed.cards) || feed.cards.length < 20) fail("每日数据源关键卡数量不足");
if (feed.reports.some((report) => !report.id || !report.title || !report.url || !report.createdAt)) fail("每日数据源报告字段不完整");
if (feed.cards.some((card) => !card.id || !card.reportId || !card.title || !card.quote || !card.anchor)) fail("每日数据源关键卡缺少证据字段");

const publicText = [html, app, extractor, storage, JSON.stringify(feed)].join("\n");
for (const pattern of [/\/Users\/[^\s"']+/i, /file:\/\//i, /wxid_/i]) {
  if (pattern.test(publicText)) fail(`知识卡片台包含不应公开的本机或身份信息：${pattern}`);
}

console.log(`知识采集与证据卡片台校验通过：${feed.reports.length} 份每日报告，${feed.cards.length} 张每日关键卡。`);
