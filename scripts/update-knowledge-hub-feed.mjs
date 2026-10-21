import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicPath = join(root, "public/reports/knowledge-report-hub/data/latest.json");
const docsPath = join(root, "docs/reports/knowledge-report-hub/data/latest.json");
const authorityPath = join(root, "public/reports/knowledge-report-hub/data/ai-industry-authority.json");
const authorityFeed = JSON.parse(readFileSync(authorityPath, "utf8"));

const reports = (authorityFeed.reports || []).map((report) => ({
  ...report,
  studioId: "",
  kind: report.kind || "url",
  origin: "industry",
  archived: false,
  extractionError: "",
  fileName: "",
  fileSize: 0,
}));

const cards = (authorityFeed.cards || []).map((card) => ({
  ...card,
  origin: "industry",
  relatedCardIds: card.relatedCardIds || [],
}));

const content = {
  schema: "clair-knowledge-hub-feed/v1",
  scope: "external-ai-industry-only",
  generatedAt: new Date().toISOString(),
  source: "Curated authoritative public AI industry reports",
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
  console.log(`AI 行业情报源没有变化：${reports.length} 份权威报告，${cards.length} 张证据卡。`);
  process.exit(0);
}

for (const path of [publicPath, docsPath]) {
  if (path === docsPath && !existsSync(dirname(path))) continue;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

console.log(`AI 行业情报源已更新：${reports.length} 份权威报告，${cards.length} 张证据卡。`);
