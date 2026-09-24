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
    "颐养天年经营简报", "净流入改善", "经营结论", "老板需要知道的四件事",
    "增长势头", "下一步怎么做", "养老业务盘面", "管理规模", "当前持有人",
    "19,742", "3,019", "4,608", "681", "370", "678.71", "23.02", "1.99",
    "21.04", "1.83", "158.71", "优先级 P0", "做深 370 位在持客户"
  ];
  for (const marker of required) assert(content.includes(marker), `${label} 缺少：${marker}`);
  const forbidden = [
    "口径纠正版", "本次纠错", "禁止直接相除", "数据索引", "自检记录", "D-001",
    "D-015", "QMP", "TD", "PC00010026", "不是 421 万", "421 万", "5,862 万",
    "实时账户元数据", "日快照比实时元数据"
  ];
  for (const marker of forbidden) assert(!content.includes(marker), `${label} 仍含老板版不应出现的话术：${marker}`);
  assert(content.includes("不能相加，也不能当作同一条漏斗直接计算"), `${label} 缺少必要的对象边界`);
  assert(content.includes("两者差额不能直接视为流失"), `${label} 对历史签约与当前持有人作了过度推断`);
}

assert(fs.existsSync(publicFile), "缺少 public 养老看板");
validate(fs.readFileSync(publicFile, "utf8"), "public 养老看板");
if (process.argv.includes("--docs")) {
  assert(fs.existsSync(docsFile), "缺少 docs 养老看板");
  validate(fs.readFileSync(docsFile, "utf8"), "docs 养老看板");
}

console.log("颐养天年老板版经营简报校验通过：结论、洞察、行动与必要的数据边界均完整。");
