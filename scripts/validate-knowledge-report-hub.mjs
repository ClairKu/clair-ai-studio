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
  "data/ai-industry-authority.json",
  "data/ai-institutions.json",
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
const packageJson = read("package.json");
const registry = JSON.parse(read("catalog/report-registry.json"));
const feed = JSON.parse(read("public/reports/knowledge-report-hub/data/latest.json"));
const authorityFeed = JSON.parse(read("public/reports/knowledge-report-hub/data/ai-industry-authority.json"));
const institutionFeed = JSON.parse(read("public/reports/knowledge-report-hub/data/ai-institutions.json"));

const checks = [
  [html, "AI 行业情报站", "页面标题缺失"],
  [html, "vendor/mammoth.browser.min.js", "Word 解析器未接入"],
  [html, "vendor/xlsx.full.min.js", "Excel 解析器未接入"],
  [app, "extractKnowledgeCards", "关键卡抽取未接入"],
  [app, "linkKnowledgeGraph", "知识关联未接入"],
  [app, "完整原文", "报告全文回溯入口缺失"],
  [app, "关联关键卡", "关联关键卡入口缺失"],
  [app, "关联报告", "关联报告入口缺失"],
  [app, "visualKnowledgeCardMarkup", "报告级信息图卡渲染缺失"],
  [app, "visualBarRows", "百分比横条图渲染缺失"],
  [app, "visualColumns", "采用漏斗柱图渲染缺失"],
  [app, "data-import", "备份导入缺失"],
  [app, "data-export", "备份导出缺失"],
  [app, "window.setInterval", "页面定时同步缺失"],
  [app, "external-ai-industry-only", "前端未校验外部行业专用数据源"],
  [app, "purgeLegacyStudioContent", "前端未清理历史工作台同步内容"],
  [app, "不接入个人材料、公司内容或内部工作记录", "页面未声明行业情报边界"],
  [app, "全球主流 AI 机构专题库", "AI 机构专题入口缺失"],
  [app, "institutionDrawerMarkup", "AI 机构完整档案缺失"],
  [app, "上市公司市值与私营公司估值分开比较", "资本口径边界缺失"],
  [extractor, "extractPdf", "PDF 抽取器缺失"],
  [extractor, "extractWord", "Word 抽取器缺失"],
  [extractor, "extractWorkbook", "Excel 抽取器缺失"],
  [extractor, "extractSlides", "PPT 抽取器缺失"],
  [storage, "indexedDB.open", "本地持久化未使用 IndexedDB"],
  [storage, "saveOriginalFile", "原始档案无法保存"],
  [styles, "--paper: #f2efe7", "未沿用米白工作台视觉"],
  [styles, "--teal: #078f85", "关键卡缺少青绿色数据语义"],
  [styles, ".visual-knowledge-card", "信息图卡视觉组件缺失"],
  [styles, ".visual-card-foot", "信息图卡来源脚注缺失"],
  [packageJson, '"sync:knowledge-hub"', "每日同步生成命令缺失"],
  [workbench, 'id: "knowledge-report-hub"', "工作台未登记知识卡片台"],
];
for (const [source, signal, message] of checks) if (!source.includes(signal)) fail(message);

if (!registry.protectedReportIds?.includes("knowledge-report-hub")) fail("知识卡片台未加入防静默删减登记册");
if (feed.schema !== "clair-knowledge-hub-feed/v1") fail("每日数据源 schema 不正确");
if (feed.scope !== "external-ai-industry-only") fail("每日数据源不是外部 AI 行业专用范围");
if (!Array.isArray(feed.reports) || feed.reports.length < 20) fail("每日数据源报告数量不足");
if (!Array.isArray(feed.cards) || feed.cards.length < 60) fail("每日数据源关键卡数量不足");
if (feed.reports.some((report) => !report.id || !report.title || !report.url || !report.createdAt)) fail("每日数据源报告字段不完整");
if (feed.cards.some((card) => !card.id || !card.reportId || !card.title || !card.quote || !card.anchor)) fail("每日数据源关键卡缺少证据字段");
if (authorityFeed.schema !== "clair-ai-industry-authority/v1" || authorityFeed.reports.length < 10 || authorityFeed.cards.length < 50) fail("权威 AI 报告精选数据不足");
if (authorityFeed.reports.some((report) => !report.authority || !report.methodology || !report.scopeNote || !report.publishedAt)) fail("权威报告缺少方法、口径或发布日期");
if (authorityFeed.cards.some((card) => !card.translation || !card.anchor)) fail("权威关键卡缺少译文或证据锚点");
if (institutionFeed.schema !== "clair-ai-institutions/v1" || institutionFeed.scope !== "external-public-ai-industry-only") fail("AI 机构专题 schema 或公开行业边界错误");
if (!Array.isArray(institutionFeed.institutions) || institutionFeed.institutions.length < 12) fail("AI 机构专题覆盖不足");
if (institutionFeed.institutions.some((item) => !item.id || !item.name || !item.listing?.status || !item.capital?.display || !item.score || !item.thesis || !item.limits)) fail("AI 机构档案核心字段不完整");
if (institutionFeed.institutions.some((item) => !Array.isArray(item.sources) || item.sources.length < 2 || item.sources.some((source) => !/^https:\/\//.test(source.url || "")))) fail("AI 机构档案缺少一手来源");
if (institutionFeed.institutions.some((item) => !Array.isArray(item.userSignals) || !Array.isArray(item.technologies) || !Array.isArray(item.timeline) || !Array.isArray(item.ma))) fail("AI 机构档案专题字段不完整");
if (institutionFeed.institutions.some((item) => item.capital?.type === "market-cap" && !item.capital.note.includes("市值"))) fail("上市机构资本口径未明确为市值");
if (institutionFeed.institutions.some((item) => item.capital?.type === "private-valuation" && !item.capital.note.includes("估值"))) fail("私营机构资本口径未明确为融资估值");
const institutionWeights = Object.fromEntries(institutionFeed.methodology.weights.map((item) => [item.key, item.weight / 100]));
if (institutionFeed.institutions.some((item) => {
  const computed = Object.entries(institutionWeights).reduce((sum, [key, weight]) => sum + Number(item.dimensions?.[key] || 0) * weight, 0);
  return Math.abs(computed - Number(item.score)) > 0.11;
})) fail("AI 机构综合分数与公开权重不一致");
if (new Set(institutionFeed.institutions.map((item) => item.rank)).size !== institutionFeed.institutions.length) fail("AI 机构综合排名存在重复名次");

const feedReportIds = feed.reports.map((report) => report.id).sort();
const authorityReportIds = authorityFeed.reports.map((report) => report.id).sort();
const feedCardIds = feed.cards.map((card) => card.id).sort();
const authorityCardIds = authorityFeed.cards.map((card) => card.id).sort();
if (JSON.stringify(feedReportIds) !== JSON.stringify(authorityReportIds)) fail("线上报告源混入了非权威精选报告，或遗漏了权威报告");
if (JSON.stringify(feedCardIds) !== JSON.stringify(authorityCardIds)) fail("线上证据卡混入了非权威精选卡片，或遗漏了权威卡片");
if (feed.reports.some((report) => String(report.id).startsWith("daily-") || report.studioId || report.origin !== "industry")) fail("线上报告源仍包含工作台同步内容");
if (feed.cards.some((card) => String(card.id).startsWith("daily-card-") || String(card.reportId).startsWith("daily-") || card.origin !== "industry")) fail("线上证据卡仍包含工作台同步内容");
if (feed.reports.some((report) => report.source === "Clair’s Studio 每日同步")) fail("线上报告源仍引用 Clair’s Studio 每日同步");
if (feed.reports.some((report) => !/^https:\/\//.test(report.url || ""))) fail("线上行业报告缺少 HTTPS 原始来源链接");

const publicText = [html, app, extractor, storage, JSON.stringify(feed), JSON.stringify(institutionFeed)].join("\n");
for (const pattern of [/\/Users\/[^\s"']+/i, /file:\/\//i, /wxid_/i]) {
  if (pattern.test(publicText)) fail(`知识卡片台包含不应公开的本机或身份信息：${pattern}`);
}

console.log(`AI 行业情报站校验通过：${feed.reports.length} 份外部权威报告，${feed.cards.length} 张证据卡，${institutionFeed.institutions.length} 家 AI 机构专题，0 份工作台同步内容。`);
