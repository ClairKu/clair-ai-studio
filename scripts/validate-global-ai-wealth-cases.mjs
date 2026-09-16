import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const slug = "global-ai-advice-advisor-copilot-cases-2026-09-16";
const pubPath = join(root, "public", "reports", slug, "index.html");
const docsPath = join(root, "docs", "reports", slug, "index.html");
const pubPreview = join(root, "public", "previews", `${slug}.png`);
const docsPreview = join(root, "docs", "previews", `${slug}.png`);

for (const path of [pubPath, docsPath, pubPreview, docsPreview]) {
  if (!existsSync(path)) throw new Error(`Missing report asset: ${path}`);
}

const html = readFileSync(pubPath, "utf8");
const docs = readFileSync(docsPath, "utf8");
const normalizedDocs = docs
  .replace(/^\s*<meta name="robots"[^\n]*\n/m, "")
  .replace(/^\s*<script data-clair-access-gate[^\n]*<\/script>\n/m, "");
if (html !== normalizedDocs) throw new Error("docs/public report mirrors differ beyond the expected production access gate");

const required = [
  "全球智能投顾与顾问 AI 副驾",
  "智能投顾 8 家总览",
  "赋能顾问 8 家总览",
  "Betterment",
  "WealthNavi",
  "Morgan Stanley AI @ MS",
  "Envestnet Insights AI",
  "OpenAI 的进攻",
  "六个可复用模式",
  "且慢更优解",
  "来源、口径与自我纠察",
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Missing report marker: ${marker}`);
  if (!docs.includes(marker)) throw new Error(`Missing docs report marker: ${marker}`);
}

const smartPages = (html.match(/class="page case-page"/g) || []).length;
const copilotPages = (html.match(/class="page case-page copilot"/g) || []).length;
if (smartPages !== 8) throw new Error(`Expected 8 smart-advice pages, found ${smartPages}`);
if (copilotPages !== 8) throw new Error(`Expected 8 advisor-copilot pages, found ${copilotPages}`);

const evidenceLinks = new Set(html.match(/EV-\d{3}/g) || []);
if (evidenceLinks.size < 30) throw new Error(`Expected at least 30 evidence IDs, found ${evidenceLinks.size}`);

if (/TODO|TBD|lorem ipsum/i.test(html)) throw new Error("Report contains unfinished placeholder text");
if (html.includes("10%–15% 生产率提升/每位顾问") && !html.includes("未见本案例官方测量")) {
  throw new Error("Unverified productivity claim escaped its correction context");
}

console.log(`全球 AI 财富管理案例报告校验通过：8+8 个案例，${evidenceLinks.size} 个证据编号。`);
