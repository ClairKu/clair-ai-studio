import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fail = (message) => { throw new Error(message); };
const git = (args) => execFileSync("git", ["-C", root, ...args], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

function matchingBracket(source, start, open, close) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function reportIdsFromSource(source) {
  const initialAt = source.indexOf("const initialState");
  const reportsAt = source.indexOf("reports:", initialAt);
  const arrayStart = source.indexOf("[", reportsAt);
  if (initialAt < 0 || reportsAt < 0 || arrayStart < 0) return [];
  const arrayEnd = matchingBracket(source, arrayStart, "[", "]");
  if (arrayEnd < 0) return [];
  const reportArray = source.slice(arrayStart + 1, arrayEnd);
  const ids = [];
  for (let index = 0; index < reportArray.length; index += 1) {
    if (reportArray[index] !== "{") continue;
    const end = matchingBracket(reportArray, index, "{", "}");
    if (end < 0) break;
    const chunk = reportArray.slice(index, end + 1);
    const id = chunk.match(/\n\s*id:\s*(["'])(.*?)\1/)?.[2] || "";
    if (id) ids.push(id);
    index = end;
  }
  return ids;
}

function currentReportDirectories() {
  const directory = join(root, "docs", "reports");
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(join(directory, slug, "index.html")));
}

const currentIds = new Set(reportIdsFromSource(readFileSync(join(root, "src", "app.js"), "utf8")));
const registry = JSON.parse(readFileSync(join(root, "catalog", "report-registry.json"), "utf8"));
const retiredIds = new Set((registry.retiredReports || []).map((report) => report.id));
const allKnownIds = new Set([...currentIds, ...retiredIds]);

const commits = git(["log", "--all", "--format=%H", "--", "src/app.js"])
  .trim()
  .split(/\s+/)
  .filter(Boolean);
const historicalIds = new Set();
for (const commit of commits) {
  let source = "";
  try {
    source = git(["show", `${commit}:src/app.js`]);
  } catch {
    continue;
  }
  for (const id of reportIdsFromSource(source)) historicalIds.add(id);
}

const unaccountedHistoricalIds = [...historicalIds]
  .filter((id) => !allKnownIds.has(id))
  .sort();
if (unaccountedHistoricalIds.length) {
  fail(`历史成果既未恢复也未登记下架：${unaccountedHistoricalIds.join("、")}`);
}

const historicalReportPaths = git([
  "log",
  "--all",
  "--format=",
  "--name-only",
  "--",
  "docs/reports",
])
  .split(/\r?\n/)
  .map((path) => path.match(/^docs\/reports\/([^/]+)\/index\.html$/)?.[1] || "")
  .filter(Boolean);
const currentDirectories = new Set(currentReportDirectories());
const missingHistoricalDirectories = [...new Set(historicalReportPaths)]
  .filter((slug) => !currentDirectories.has(slug) && !retiredIds.has(slug))
  .sort();
if (missingHistoricalDirectories.length) {
  fail(`历史分支仍有未找回的报告文件：${missingHistoricalDirectories.join("、")}`);
}

console.log(
  `全历史成果审计通过：${commits.length} 个目录版本，` +
  `${historicalIds.size} 个历史 ID（${currentIds.size} 个在册，${retiredIds.size} 个明确下架），` +
  `${currentDirectories.size} 个报告目录，0 个遗漏。`,
);
