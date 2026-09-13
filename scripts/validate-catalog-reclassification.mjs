import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const slug = "clair-studio-catalog-audit-2026-09-13";
const read = (path) => readFileSync(new URL(path, root), "utf8");
const fail = (message) => { throw new Error(message); };

const app = read("src/app.js");
const publicReport = read(`public/reports/${slug}/index.html`);
const docsReport = read(`docs/reports/${slug}/index.html`);
const publicPreview = new URL(`public/previews/${slug}.png`, root);
const docsPreview = new URL(`docs/previews/${slug}.png`, root);

if (!existsSync(publicPreview) || !existsSync(docsPreview)) fail("盘点报告预览图缺失");
if (!app.includes("const DATA_VERSION = 72;")) fail("目录迁移版本未升级");

const reportStart = app.indexOf("  reports: [");
const reportEnd = app.indexOf("\n  ],\n};", reportStart);
const reportBlock = app.slice(reportStart, reportEnd);
const reportIds = [...reportBlock.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
if (reportIds.length !== 163) fail(`成果数量异常：预期 163，实际 ${reportIds.length}`);

const topicStart = app.indexOf("const TOPIC_BY_REPORT = {");
const topicEnd = app.indexOf("\n};\n\nfunction inferWorkType", topicStart);
const topicBlock = app.slice(topicStart, topicEnd);
const topicIds = new Set([...topicBlock.matchAll(/^\s*"([^"]+)":\s*"[^"]+",/gm)].map((match) => match[1]));
const missingTopics = reportIds.filter((id) => !topicIds.has(id));
if (missingTopics.length) fail(`存在未显式归类成果：${missingTopics.join("、")}`);

const requiredGroups = [
  "AI 产品与顾问服务",
  "AI 生产力与工作台",
  "AI 开放平台与生态",
  "用户增长与数据洞察",
  "且慢产品与客户体验",
  "投研与资产配置",
  "战略经营与项目复盘",
  "组织能力与知识治理",
];
for (const name of requiredGroups) {
  if (!app.includes(`name: "${name}"`)) fail(`缺少新主题：${name}`);
}

const featuredStart = app.indexOf("const FEATURED_REPORT_IDS = new Set([");
const featuredEnd = app.indexOf("\n]);", featuredStart);
const featuredBlock = app.slice(featuredStart, featuredEnd);
const featuredIds = [...featuredBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
if (featuredIds.length !== 9) fail(`精选数量异常：预期 9，实际 ${featuredIds.length}`);
if (!featuredIds.includes(slug)) fail("盘点报告未加入精选入口");

for (const marker of [
  "162 份成果逐项归位",
  "87 份历史成果重新归位",
  "119→9",
  "276/278",
  "公网不可判定的内网本体地址",
  "catalog-search",
  "category-filter",
  "movement-filter",
]) {
  if (!publicReport.includes(marker)) fail(`盘点报告缺少标记：${marker}`);
  if (!docsReport.includes(marker)) fail(`docs 盘点报告缺少标记：${marker}`);
}

const sensitivePattern = /((?:^|[\s"'=])sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |EC )?PRIVATE KEY)/m;
if (sensitivePattern.test([app, publicReport].join("\n"))) fail("盘点报告或目录疑似包含敏感凭证");
if (/https?:\/\/(?:ontology\.yingmi-inc\.com|[^/]*feishu\.cn)\//i.test(publicReport)) {
  fail("公开盘点报告不得展开内网本体或飞书原始地址");
}

console.log(`Catalog reclassification validated: ${reportIds.length} reports, ${topicIds.size} explicit topics, ${featuredIds.length} featured.`);
