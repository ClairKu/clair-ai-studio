import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/reports/", import.meta.url));
const prohibitedPublicArtifacts = new Set([
  "qwen-authorize.jpg",
  "qwen-assets.jpg",
  "qwen-diagnosis.jpg",
  "qwen-product.jpg",
  "wechat-agent-routing.jpg",
]);

async function assertNoProhibitedArtifacts(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await assertNoProhibitedArtifacts(path);
      continue;
    }
    if (prohibitedPublicArtifacts.has(entry.name)) {
      throw new Error(`公开成果包含已禁用的账户／交易联调素材：${path}`);
    }
    if (entry.name.endsWith(".html")) {
      const html = await readFile(path, "utf8");
      for (const filename of prohibitedPublicArtifacts) {
        if (html.includes(filename)) {
          throw new Error(`公开成果仍引用已禁用的账户／交易联调素材：${path} -> ${filename}`);
        }
      }
    }
  }
}

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
await assertNoProhibitedArtifacts(root);

let checked = 0;
for (const manifestPath of manifests) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entries = manifest.files?.length ? manifest.files : (manifest.assets || []);
  for (const entry of entries) {
    const assetPath = join(dirname(manifestPath), entry.path);
    const assetStat = await stat(assetPath);
    if (!assetStat.isFile() || assetStat.size === 0) throw new Error(`报告资源缺失或为空：${assetPath}`);
    if (entry.bytes && assetStat.size !== entry.bytes) throw new Error(`报告资源大小不匹配：${assetPath}`);
    const contents = await readFile(assetPath);
    const digest = createHash("sha256").update(contents).digest("hex");
    if (entry.sha256 && digest !== entry.sha256) throw new Error(`报告资源校验失败：${assetPath}`);
    checked += 1;
  }
}

console.log(`报告资源校验通过：${checked} 个文件，${manifests.length} 份清单。`);
