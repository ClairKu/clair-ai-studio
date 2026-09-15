import { readFile } from "node:fs/promises";

const report = new URL("../public/reports/vesta-mcp-capability-validation-2026-09-15/index.html", import.meta.url);
const html = await readFile(report, "utf8");

const required = [
  "VESTA MCP 全量能力验证",
  "119",
  "114",
  "业务数据验证",
  "隐私边界内跳过",
  "index__searchIndexByCodes",
  "当前 Codex 会话未原生挂载 VESTA",
  "不连接生产交易",
];

for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`VESTA 报告缺少关键标记：${marker}`);
}

const prohibited = [
  /Authorization\s*[:=]/i,
  /Bearer\s+[A-Za-z0-9._-]{12,}/,
  /mcp_key/i,
  /ZH\d{6,}/,
];

for (const pattern of prohibited) {
  if (pattern.test(html)) throw new Error(`VESTA 报告命中敏感信息模式：${pattern}`);
}

console.log("VESTA MCP 能力验证报告校验通过：关键结论、边界与脱敏规则完整。");
