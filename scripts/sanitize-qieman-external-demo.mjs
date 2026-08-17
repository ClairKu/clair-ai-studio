import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL(
  "../public/reports/qieman-ai-product-practice-oap-edition-2026-08-04/index.html",
  import.meta.url,
));

const html = readFileSync(target, "utf8");
const pattern = /(<script type="application\/json" id="report-data">)([\s\S]*?)(<\/script>)/;
const match = html.match(pattern);
if (!match) throw new Error("未找到 report-data");

const report = JSON.parse(match[2]);
const replaceSection = (id, replacement) => {
  const index = report.sections.findIndex((section) => section.id === id);
  if (index < 0) throw new Error(`未找到章节：${id}`);
  report.sections[index] = { ...report.sections[index], ...replacement };
};

replaceSection("qwen-demo", {
  kicker: "12 · EXTERNAL PLATFORM GOVERNANCE",
  title: "第三方入口治理边界",
  lead: "原联调界面已从公开版移除并转入受控内审。本节只展示目标治理原则，不证明当前生产能力或监管认可。",
  layout: "cards",
  tone: "dark",
  items: [
    { index: "01", title: "主体清晰", body: "明确第三方平台与盈米的身份、责任和投诉渠道。", status: "target" },
    { index: "02", title: "内容锁定", body: "金融内容由盈米审核、版本化，第三方不得擅自改写。", status: "target" },
    { index: "03", title: "数据最小", body: "字段、用途、期限、保存和训练范围逐项核验。", status: "target" },
    { index: "04", title: "动作回自营", body: "鉴权、适当性、合同、账户与交易回到盈米自营载体。", status: "target" },
  ],
  callout: {
    label: "公开边界",
    text: "不展示账户金额、持仓、风险等级、具体产品、交易流程或内部联调画面。",
    status: "target",
  },
});

replaceSection("wechat-demo", {
  kicker: "13 · MULTI-PLATFORM BASELINE",
  title: "多入口共用一套合规基线",
  lead: "无论采用 MCP、Skill、Agent 还是 A2A，技术名词都不改变业务实质和持牌主体责任。",
  layout: "process",
  tone: "soft",
  items: [
    { index: "01", title: "先定业务性质", body: "按真实功能判断展示、路由、咨询、建议或销售环节。", status: "target" },
    { index: "02", title: "再分风险等级", body: "从公开投教和静态内容起步，逐级评估个性化能力。", status: "target" },
    { index: "03", title: "最后验收上线", body: "合同、数据流、安全、模型、宣传和应急共同通过闸门。", status: "target" },
  ],
  callout: {
    label: "责任原则",
    text: "入口可以外部化，金融能力保持自营，持牌责任不转移。",
    status: "target",
  },
});

const next = html.replace(pattern, `$1${JSON.stringify(report)}$3`);
writeFileSync(target, next);
console.log("已移除公开版千问/微信联调图片引用，并替换为治理示意。");
