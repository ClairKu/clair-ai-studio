import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicFile = path.join(root, "public/apps/yingmi-advisor-workbench-2026-09-10/qieman-pension-dashboard.html");
const docsFile = path.join(root, "docs/apps/yingmi-advisor-workbench-2026-09-10/qieman-pension-dashboard.html");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate(content, label) {
  const required = [
    "口径纠正版经营看板", "四个对象，四套口径", "养老专区记录", "且慢养老金账户",
    "个人养老金账户", "颐养天年", "19,742", "3,019", "4,608", "681", "756",
    "599", "370", "394", "678.71", "23.02", "1.99", "21.04", "972.12",
    "362.64", "609.48", "数据索引", "D-001", "D-015", "自检记录"
  ];
  for (const marker of required) assert(content.includes(marker), `${label} 缺少：${marker}`);
  const forbidden = ["class=\"value num\">5,862", ">421<", "const flow=[168", "月定投占比</b>", "测算转化率</b>"];
  for (const marker of forbidden) assert(!content.includes(marker), `${label} 仍含旧版无证据数据：${marker}`);
  assert(content.includes("不是 421 万"), `${label} 未明确纠正 421 万`);
  assert(content.includes("禁止直接相除"), `${label} 未声明跨对象转化率边界`);
  assert(content.includes("日快照比实时元数据多 2 位用户"), `${label} 未解释时点差异`);
}

assert(fs.existsSync(publicFile), "缺少 public 养老看板");
validate(fs.readFileSync(publicFile, "utf8"), "public 养老看板");
if (process.argv.includes("--docs")) {
  assert(fs.existsSync(docsFile), "缺少 docs 养老看板");
  validate(fs.readFileSync(docsFile, "utf8"), "docs 养老看板");
}

console.log("颐养天年口径纠正版校验通过：对象分层、真实数值、旧示意值清除、索引与自检记录均完整。");
