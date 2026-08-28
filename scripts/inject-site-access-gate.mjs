import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = resolve(projectRoot, process.argv[2] || "docs");
const gateAsset = join(outputRoot, "access-gate.js");
const marker = "data-clair-access-gate";

if (!existsSync(gateAsset)) throw new Error(`Missing access gate asset: ${gateAsset}`);

const walkHtml = (directory, results = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(path, results);
    else if (entry.isFile() && entry.name.endsWith(".html")) results.push(path);
  }
  return results;
};

const robotsMeta = '<meta name="robots" content="noindex,nofollow,noarchive" data-clair-access-robots />';
let injected = 0;

for (const htmlPath of walkHtml(outputRoot)) {
  let html = readFileSync(htmlPath, "utf8");
  const relativeAsset = relative(dirname(htmlPath), gateAsset).replaceAll("\\", "/");
  const assetPath = relativeAsset.startsWith(".") ? relativeAsset : `./${relativeAsset}`;
  const gateScript = `<script ${marker} src="${assetPath}"></script>`;

  html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi, "");
  const headInsert = `${robotsMeta}\n    ${gateScript}`;
  if (html.includes(marker)) {
    html = html.replace(/<script\b[^>]*data-clair-access-gate[^>]*><\/script>/i, gateScript);
    if (!html.includes("data-clair-access-robots")) {
      html = html.replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${robotsMeta}`);
    }
  } else if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${headInsert}`);
  } else {
    html = `${gateScript}\n${html}`;
  }

  writeFileSync(htmlPath, html);
  injected += 1;
}

console.log(`Injected the site access gate into ${injected} HTML files.`);
