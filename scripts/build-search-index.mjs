import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportsRoot = join(root, "public", "reports");
const outputPath = join(root, "public", "search-index.json");

const decodeEntities = (value) => value
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

const jsonStrings = (value, output = []) => {
  if (typeof value === "string") {
    const text = value.trim();
    const structuralToken = /^[a-z][a-z0-9_-]{1,31}$/.test(text);
    if (text.length > 1 && !structuralToken) output.push(text);
  }
  else if (Array.isArray(value)) value.forEach((item) => jsonStrings(item, output));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => jsonStrings(item, output));
  }
  return output;
};

const visibleText = (html) => {
  const structuredText = [...html.matchAll(
    /<script\b[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].flatMap((match) => {
    try {
      return jsonStrings(JSON.parse(match[1]));
    } catch {
      return [];
    }
  })
    .join(" ");
  return decodeEntities(`${html} ${structuredText}`
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(script|style|svg|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120_000);
};

const index = {};
for (const entry of readdirSync(reportsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(reportsRoot, entry.name, "index.html");
  try {
    const text = visibleText(readFileSync(path, "utf8"));
    if (text) index[entry.name] = text;
  } catch {
    // A report without a readable index file stays searchable by catalog metadata.
  }
}

writeFileSync(outputPath, `${JSON.stringify(index)}\n`);
console.log(`正文搜索索引已生成：${Object.keys(index).length} 份 HTML 成果。`);
