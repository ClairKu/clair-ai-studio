#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [inputPath, outputDir] = process.argv.slice(2);
if (!inputPath || !outputDir) {
  throw new Error("Usage: node render_report.mjs <report.json> <output-dir>");
}

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = join(here, "..", "assets", "report-template.html");
const report = JSON.parse(await readFile(resolve(inputPath), "utf8"));
const template = await readFile(templatePath, "utf8");
const payload = JSON.stringify(report).replaceAll("<", "\\u003c");
const html = template.replace("__REPORT_DATA__", payload);

if (html === template) throw new Error("Template placeholder not found");
await mkdir(resolve(outputDir), { recursive: true });
await writeFile(join(resolve(outputDir), "index.html"), html, "utf8");
console.log(`Generated ${join(resolve(outputDir), "index.html")}`);
