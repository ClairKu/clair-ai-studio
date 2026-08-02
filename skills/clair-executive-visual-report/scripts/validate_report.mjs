#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [inputPath, htmlPath] = process.argv.slice(2);
if (!inputPath) {
  throw new Error("Usage: node validate_report.mjs <report.json> [index.html]");
}

const absoluteInput = resolve(inputPath);
const report = JSON.parse(readFileSync(absoluteInput, "utf8"));
const errors = [];
const allowedLayouts = new Set([
  "cards", "metrics", "architecture", "timeline", "process",
  "evidence", "comparison", "demo", "actions",
]);
const allowedTones = new Set(["light", "soft", "dark"]);
const allowedStatuses = new Set(["confirmed", "inferred", "missing", "target"]);

const need = (value, label) => {
  if (typeof value !== "string" || !value.trim()) errors.push(`缺少 ${label}`);
};

need(report.meta?.title, "meta.title");
need(report.meta?.date, "meta.date");
need(report.meta?.cutoff, "meta.cutoff");
need(report.hero?.conclusion, "hero.conclusion");
if (report.meta?.accent && !/^#[0-9a-f]{6}$/i.test(report.meta.accent)) {
  errors.push("meta.accent 必须是六位十六进制颜色");
}
if (!Array.isArray(report.sections) || report.sections.length < 3) {
  errors.push("sections 至少需要 3 个章节");
}

const ids = new Set();
for (const [sectionIndex, section] of (report.sections || []).entries()) {
  const path = `sections[${sectionIndex}]`;
  need(section.id, `${path}.id`);
  need(section.title, `${path}.title`);
  if (ids.has(section.id)) errors.push(`章节 id 重复：${section.id}`);
  ids.add(section.id);
  if (!allowedLayouts.has(section.layout)) errors.push(`${path}.layout 未知：${section.layout}`);
  if (section.tone && !allowedTones.has(section.tone)) errors.push(`${path}.tone 未知：${section.tone}`);
  if (!Array.isArray(section.items) || !section.items.length) errors.push(`${path}.items 为空`);
  for (const [itemIndex, item] of (section.items || []).entries()) {
    const itemPath = `${path}.items[${itemIndex}]`;
    need(item.title, `${itemPath}.title`);
    if (item.status && !allowedStatuses.has(item.status)) errors.push(`${itemPath}.status 未知`);
    if (section.layout === "metrics" && !String(item.metric || "").trim()) errors.push(`${itemPath}.metric 缺失`);
    if (section.layout === "evidence") {
      need(item.source, `${itemPath}.source`);
      if (item.image) {
        need(item.alt, `${itemPath}.alt`);
        const assetPath = resolve(dirname(absoluteInput), item.image);
        if (!existsSync(assetPath)) errors.push(`图片不存在：${item.image}`);
      }
    }
    if (item.status === "confirmed" && /\d/.test(`${item.metric || ""}${item.body || ""}`) && !item.source && !item.meta) {
      errors.push(`${itemPath} 含确认数字但缺少来源或口径`);
    }
  }
  if (section.callout?.status && !allowedStatuses.has(section.callout.status)) {
    errors.push(`${path}.callout.status 未知`);
  }
}

if (htmlPath) {
  const html = readFileSync(resolve(htmlPath), "utf8");
  for (const [signal, message] of [
    ['<html lang="zh-CN">', "HTML 缺少中文语言声明"],
    ['name="viewport"', "HTML 缺少 viewport"],
    ['id="reading-progress"', "HTML 缺少阅读进度"],
    ['id="report-data"', "HTML 未嵌入报告数据"],
    ['@media(max-width:720px)', "HTML 缺少移动端规则"],
    ['prefers-reduced-motion', "HTML 未尊重减少动态偏好"],
  ]) {
    if (!html.includes(signal)) errors.push(message);
  }
  if (/https?:\/\/(?:cdn|fonts)\./i.test(html)) errors.push("HTML 含外部 CDN 或字体依赖");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`报告校验通过：${report.sections.length} 个章节，${(report.sources || []).length} 个来源。`);
