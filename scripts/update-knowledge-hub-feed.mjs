import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const appSource = readFileSync(join(root, "src/app.js"), "utf8");
const publicPath = join(root, "public/reports/knowledge-report-hub/data/latest.json");
const docsPath = join(root, "docs/reports/knowledge-report-hub/data/latest.json");
const authorityPath = join(root, "public/reports/knowledge-report-hub/data/ai-industry-authority.json");
const authorityFeed = JSON.parse(readFileSync(authorityPath, "utf8"));

const CATEGORY_BY_GROUP = {
  "ai-platform": "AI 与 Agent",
  "growth-insights": "用户与增长",
  "product-planning": "产品与体验",
  research: "投研与市场",
  reporting: "经营与组织",
  knowledge: "经营与组织",
};

function field(block, name) {
  return block.match(new RegExp(`\\b${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`))?.[1]
    ?.replaceAll('\\"', '"')
    ?.replaceAll("\\n", "\n") || "";
}

function arrayField(block, name) {
  const value = block.match(new RegExp(`\\b${name}:\\s*\\[([^\\]]*)\\]`))?.[1] || "";
  return [...value.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((match) => match[1].replaceAll('\\"', '"'));
}

function reportBlocks() {
  const start = appSource.indexOf("  reports: [");
  const end = appSource.indexOf("\n  ],\n};", start);
  if (start < 0 || end < 0) throw new Error("未找到 Clair’s Studio 报告目录");
  return appSource.slice(start, end)
    .split(/\n\s{4}\},\n\s{4}\{/)
    .map((chunk) => chunk.replace(/^.*?reports:\s*\[/s, "").trim())
    .filter((chunk) => /\bid:\s*"/.test(chunk));
}

function short(value, limit) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function sentences(value) {
  return String(value).split(/(?<=[。！？!?；;])\s*|[｜|]\s*/).map((item) => item.trim()).filter((item) => item.length >= 16);
}

function cardType(sentence) {
  if (/(风险|下降|不足|限制|挑战|缺口|失败|隐患|未能|不可)/.test(sentence)) return "risk";
  if (/(建议|需要|优先|行动|下一步|应当|必须)/.test(sentence)) return "action";
  if (/(机会|增长|提升|潜力|空间|领先|突破|加速)/.test(sentence)) return "opportunity";
  if (/\d[\d,.]*\s*(?:%|％|亿|万|元|人|家|项|个|次|倍|天|月|年)/.test(sentence)) return "metric";
  return "insight";
}

function metric(sentence) {
  return sentence.match(/(?:[$¥￥€£]\s*)?\d[\d,.]*(?:\.\d+)?\s*(?:%|％|亿|万|兆|B|M|K|美元|元|人|家|项|个|次|倍|天|月|年)?/i)?.[0]?.trim() || "";
}

function title(sentence) {
  const clean = sentence.replace(/^[-•·\d.)、\s]+/, "").trim();
  const pivot = clean.slice(0, 45).search(/[，,:：]/);
  if (pivot >= 12) return clean.slice(0, pivot);
  return short(clean, 34);
}

function stableHash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

const studioReports = reportBlocks().map((block) => {
  const id = field(block, "id");
  const source = field(block, "source");
  return {
    id: `daily-${id}`,
    studioId: id,
    title: field(block, "title"),
    url: field(block, "url"),
    body: source,
    kind: "studio",
    category: CATEGORY_BY_GROUP[field(block, "groupId")] || "其他",
    tags: arrayField(block, "tags").slice(0, 8),
    source: "Clair’s Studio 每日同步",
    createdAt: field(block, "createdAt") || new Date(0).toISOString(),
    updatedAt: field(block, "modifiedAt") || field(block, "createdAt") || new Date(0).toISOString(),
    extractionError: "",
    fileName: "",
    fileSize: 0,
    archived: false,
    relatedReportIds: [],
  };
}).filter((report) => report.studioId && report.title && report.url && report.studioId !== "knowledge-report-hub")
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 16);

const studioCards = studioReports.flatMap((report) => {
  const ranked = sentences(report.body)
    .map((sentence, index) => ({ sentence, index, score: (metric(sentence) ? 5 : 0) + (cardType(sentence) !== "insight" ? 3 : 0) + (index < 4 ? 2 : 0) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3);
  const selected = ranked.length ? ranked : [{ sentence: short(report.body || report.title, 180), index: 0 }];
  return selected.map(({ sentence, index }, order) => {
    const type = cardType(sentence);
    return {
      id: `daily-card-${stableHash(`${report.id}:${sentence}`)}`,
      reportId: report.id,
      type,
      label: ({ metric: "关键数据", risk: "风险信号", opportunity: "机会判断", action: "行动建议", insight: "核心结论" })[type],
      title: title(sentence),
      summary: sentence,
      metric: metric(sentence),
      quote: sentence,
      anchor: `工作台来源说明 · 片段 ${index + 1}`,
      offset: 0,
      tags: report.tags.slice(0, 5),
      createdAt: report.createdAt,
      order,
      relatedCardIds: [],
    };
  });
});

const authorityReports = (authorityFeed.reports || []).map((report) => ({
  ...report,
  studioId: "",
  kind: report.kind || "url",
  origin: "authority",
  archived: false,
  extractionError: "",
  fileName: "",
  fileSize: 0,
}));

const authorityCards = (authorityFeed.cards || []).map((card) => ({
  ...card,
  origin: "authority",
  relatedCardIds: card.relatedCardIds || [],
}));

const reports = [...authorityReports, ...studioReports];
const cards = [...authorityCards, ...studioCards];

const content = {
  schema: "clair-knowledge-hub-feed/v1",
  generatedAt: new Date().toISOString(),
  source: "Clair’s Studio production catalog + curated authoritative AI industry reports",
  reports,
  cards,
};

function comparable(payload) {
  if (!payload) return "";
  const clone = { ...payload, generatedAt: "" };
  return JSON.stringify(clone);
}

const previous = existsSync(publicPath) ? JSON.parse(readFileSync(publicPath, "utf8")) : null;
if (comparable(previous) === comparable(content) && !process.argv.includes("--force")) {
  console.log(`知识卡片台每日源没有变化：${reports.length} 份报告，${cards.length} 张卡。`);
  process.exit(0);
}

for (const path of [publicPath, docsPath]) {
  if (path === docsPath && !existsSync(dirname(path))) continue;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

console.log(`知识卡片台每日源已更新：${reports.length} 份报告，${cards.length} 张卡。`);
