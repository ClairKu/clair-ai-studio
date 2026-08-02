#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/embed-report-assets.mjs <input.html> <output.html>");
}

const absoluteInput = resolve(inputPath);
let html = await readFile(absoluteInput, "utf8");
const matches = [...html.matchAll(/"image":"([^"]+)"/g)];
const mimeByExtension = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
]);

for (const match of matches) {
  const relativePath = match[1];
  if (/^(?:data:|https?:)/i.test(relativePath)) continue;
  const assetPath = resolve(dirname(absoluteInput), relativePath);
  const mime = mimeByExtension.get(extname(assetPath).toLowerCase());
  if (!mime) throw new Error(`Unsupported report asset: ${relativePath}`);
  const data = await readFile(assetPath);
  const dataUrl = `data:${mime};base64,${data.toString("base64")}`;
  html = html.replaceAll(JSON.stringify(relativePath), JSON.stringify(dataUrl));
}

await writeFile(resolve(outputPath), html, "utf8");
console.log(`${outputPath}\tembedded\t${matches.length} assets`);
