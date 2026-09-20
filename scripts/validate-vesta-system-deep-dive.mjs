import { readFile } from "node:fs/promises";

const paths = [
  new URL("../docs/reports/vesta-system-deep-dive-2026-09-16/index.html", import.meta.url),
  new URL("../public/reports/vesta-system-deep-dive-2026-09-16/index.html", import.meta.url),
];

const required = [
  "v3 · 2026.09.20",
  "123 项工具",
  "高级权限",
  "真实组合分析链",
  "私有云盘与管理权",
  "10 个端点定向回归",
  "9 个成功",
  "批量查询缺陷仍在",
  "data-clair-access-gate",
];

const prohibited = [
  /Authorization\s*[:=]/i,
  /Bearer\s+[A-Za-z0-9._-]{12,}/,
  /mcp_key/i,
  /requestId/i,
  /ossKey/i,
  /poCode/i,
  /userId/i,
  /instId/i,
  /VES\d{5,}/i,
];

const contents = await Promise.all(paths.map((path) => readFile(path, "utf8")));

for (const [index, html] of contents.entries()) {
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`VESTA v3 报告缺少关键标记：${marker}`);
  }
  for (const pattern of prohibited) {
    if (pattern.test(html)) throw new Error(`VESTA v3 报告命中敏感信息模式：${pattern}`);
  }
  if (index > 0 && html !== contents[0]) throw new Error("VESTA v3 docs/public 报告镜像不一致");
}

console.log("VESTA v3 深度调研报告校验通过：更新、权限边界、镜像与脱敏规则完整。");
