import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/reports/", import.meta.url));

async function findManifests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const manifests = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) manifests.push(...await findManifests(path));
    else if (entry.name === "asset-manifest.json") manifests.push(path);
  }
  return manifests;
}

const manifests = await findManifests(root);
if (!manifests.length) throw new Error("未找到报告资源清单");

let checked = 0;
for (const manifestPath of manifests) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const entry of manifest.files || []) {
    const assetPath = join(dirname(manifestPath), entry.path);
    const assetStat = await stat(assetPath);
    if (!assetStat.isFile() || assetStat.size === 0) throw new Error(`报告资源缺失或为空：${assetPath}`);
    const contents = await readFile(assetPath);
    const digest = createHash("sha256").update(contents).digest("hex");
    if (entry.sha256 && digest !== entry.sha256) throw new Error(`报告资源校验失败：${assetPath}`);
    checked += 1;
  }
}

console.log(`报告资源校验通过：${checked} 个文件，${manifests.length} 份清单。`);
