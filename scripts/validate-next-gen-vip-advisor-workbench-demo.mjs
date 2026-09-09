import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const slug = "next-gen-vip-advisor-workbench-demo-2026-09-09";
const reportPath = join(root, "public", "reports", slug, "index.html");

assert.ok(existsSync(reportPath), `缺少交互 Demo：${reportPath}`);

const html = readFileSync(reportPath, "utf8");
const normalized = html.replace(/\s+/g, " ");

const requiredSignals = [
  [/融合(?:模式)?/, "融合模式"],
  [/(?:副驾|对话)(?:模式)?/, "副驾模式"],
  [/(?:专业|工作台)(?:模式)?/, "专业模式"],
  [/客户\s*360/i, "客户360"],
  [/承接/, "承接"],
  [/KYC/i, "KYC"],
  [/诊断/, "诊断"],
  [/规划/, "规划"],
  [/执行/, "执行"],
  [/复盘/, "复盘"],
  [/(?:AI\s*)?证据|事实/, "AI证据标签"],
  [/模拟数据/, "模拟数据声明"],
  [/重置演示/, "重置演示"],
  [/@media\s*\(/, "移动端 CSS"],
];

for (const [pattern, label] of requiredSignals) {
  assert.match(normalized, pattern, `页面缺少关键能力：${label}`);
}

assert.ok(
  /(合成|脱敏).{0,20}模拟数据|模拟数据.{0,20}(合成|脱敏)/.test(normalized),
  "模拟数据声明必须明确合成或脱敏",
);

for (const tag of html.match(/<script\b[^>]*>/gi) || []) {
  const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || "";
  assert.ok(!/^(?:https?:)?\/\//i.test(src), `页面包含外链脚本：${src}`);
}
for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
  const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "";
  const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
  if (/\bstylesheet\b/i.test(rel)) {
    assert.ok(!/^(?:https?:)?\/\//i.test(href), `页面包含外链样式：${href}`);
  }
}
assert.ok(!/@import\s+(?:url\()?\s*["']?(?:https?:)?\/\//i.test(html), "页面包含外链样式 @import");

for (const sensitive of [
  /\b1[3-9]\d{9}\b/,
  /\b\d{17}[\dXx]\b/,
  /(?:access[_-]?token|refresh[_-]?token|client[_-]?secret|api[_-]?key)\s*[:=]\s*["'][^"']+["']/i,
  /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/i,
]) {
  assert.ok(!sensitive.test(html), `页面疑似包含手机号、身份证或凭证：${sensitive}`);
}

console.log("新一代 VIP 顾问工作台交互 Demo 校验通过。");
