import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = join(root, "public/reports/knowledge-report-hub");
const docsRoot = join(root, "docs/reports/knowledge-report-hub");
const feedGeneratedAt = JSON.parse(readFileSync(join(publicRoot, "data/latest.json"), "utf8")).generatedAt;

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return entry.name === "asset-manifest.json" ? [] : [path];
  });
}

const entries = files(publicRoot).map((path) => {
  const contents = readFileSync(path);
  return {
    path: relative(publicRoot, path).replaceAll("\\", "/"),
    bytes: statSync(path).size,
    sha256: createHash("sha256").update(contents).digest("hex"),
  };
}).sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  schema: "clair-report-assets/v1",
  report: "knowledge-report-hub",
  generatedAt: feedGeneratedAt,
  files: entries,
};

for (const path of [join(publicRoot, "asset-manifest.json"), join(docsRoot, "asset-manifest.json")]) {
  if (path.includes("/docs/") && !existsSync(dirname(path))) continue;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`知识卡片台资源清单已更新：${entries.length} 个文件。`);
