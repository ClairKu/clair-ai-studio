import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const slug = "yingmi-ai-oap-framework-2026-08-03";
const reportPath = path.join(root, "public", "reports", slug, "report.json");
const htmlPath = path.join(root, "public", "reports", slug, "index.html");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const index = report.sections.findIndex((section) => section.id === "monetization");
if (index < 0) throw new Error("Missing monetization section");

report.sections[index] = {
  id: "monetization",
  kicker: "18 · 商化准备",
  title: "稳定卖承诺，波动卖额度",
  lead: "30+ 额度扩充与付费咨询证明需求已出现；底层统一积分 / 调用计量，个人与企业根据使用稳定性选择主收费。",
  layout: "pricing-routing",
  tone: "soft",
  items: [],
  pricingModes: [
    {
      segment: "企业合同 / SLA",
      position: "variable",
      title: "企业按量预付",
      main: "API 接入、调用量波动",
      facts: ["T1 / T2 / T3 = ¥0.3 / 0.5 / 0.9 每次", "多工具混用，单位成本透明"],
      status: "target",
      source: "飞书 API 收费表 · 2026-08-03"
    },
    {
      segment: "企业合同 / SLA",
      position: "stable",
      title: "企业年包",
      main: "稳定主链路、采购 / SLA",
      facts: ["参考 ¥10 / 20 / 60 万 · 200 / 500 / 1,000 QPS", "POC / 主链路 / 多部门并行"],
      status: "target",
      source: "用户提供企业年包设计 · 2026-08-03"
    },
    {
      segment: "个人自助",
      position: "variable",
      title: "个人资源包",
      main: "低频、临时、试用与扩容",
      facts: ["参考 ¥9.9—¥9,999 · 1 个月—2 年", "一次性额度，作为订阅补充"],
      status: "target",
      source: "用户提供资源包设计 · 2026-08-03"
    },
    {
      segment: "个人自助",
      position: "stable",
      title: "个人订阅",
      main: "持续、高频、固定预算",
      facts: ["单月 / 连续包月 / 按年", "月度积分 + 分享邀请促活"],
      status: "target",
      source: "用户提供订阅与积分设计 · 2026-08-03"
    }
  ],
  pricingPhases: [
    { index: "01", title: "上线期｜验证付费闭环", body: "个人订阅为主；企业按量预付为主" },
    { index: "02", title: "稳定期｜推动长期承诺", body: "个人转年订；稳定企业转轻量 / 高阶年包" },
    { index: "03", title: "规模期｜提高客单与保障", body: "旗舰 / 定制年包 + 阶梯折扣 + 专属 SLA" }
  ],
  pricingFoundation: {
    title: "统一计量底座",
    body: "工具统一映射 T1 / T2 / T3；个人按 3 / 5 / 9 积分消耗，企业按调用量计价。套餐只是在额度、有效期、并发与服务上的不同封装。"
  },
  readiness: [
    "个人：微信 / 支付宝、连续扣费、退款与到期提醒",
    "企业：打款、合同、开票、对账、用量预警与 SLA"
  ],
  callout: {
    label: "建议主线 · 管理判断",
    text: "上线期个人订阅为主、资源包补充；企业按量预付为主，稳定主链路再转年包。",
    status: "inferred"
  }
};

const source = {
  label: "商化收费方案与场景路由",
  detail: "飞书 API 收费表 + 用户提供订阅、积分、个人资源包与企业年包设计 · 2026-08-03；价格与包型为方案参考，不代表已上线"
};
const existingSource = report.sources.findIndex((item) => item.label === source.label);
if (existingSource >= 0) report.sources[existingSource] = source;
else report.sources.push(source);

const reportJson = `${JSON.stringify(report, null, 2)}\n`;
fs.writeFileSync(reportPath, reportJson);

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(
  /<script type="application\/json" id="report-data">[\s\S]*?<\/script>/,
  `<script type="application/json" id="report-data">${JSON.stringify(report).replace(/<\//g, "<\\/")}</script>`
);

const pricingCss = `
    /* pricing-routing: report chapter 18 */
    .pricing-routing{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.78fr);gap:12px}
    .pricing-map{padding:12px;border:1px solid #dedbea;border-radius:20px;background:#fff}
    .pricing-axis,.pricing-row{display:grid;grid-template-columns:112px repeat(2,minmax(0,1fr));gap:8px}
    .pricing-axis{align-items:end;margin-bottom:8px}.pricing-axis span{padding:0 10px;color:#7b8495;font-size:9px;font-weight:800;letter-spacing:.06em}.pricing-axis span:not(:first-child){text-align:center}.pricing-axis .stable{color:#5e49c7}
    .pricing-row{margin-bottom:8px}.pricing-segment{display:grid;place-content:center;padding:10px;border-radius:14px;background:#f2f1f7;color:#596477;text-align:center;font-size:10px;font-weight:800}.pricing-segment b{display:block;color:#1c2232;font-size:13px}
    .pricing-mode{position:relative;min-height:116px;padding:13px 13px 10px;border:1px solid #e4e2ec;border-radius:15px;background:linear-gradient(145deg,#fff,#faf9fe);overflow:hidden}.pricing-mode.primary{border-color:#ae9cf5;background:linear-gradient(145deg,#f5f1ff,#fff);box-shadow:0 10px 24px rgba(98,73,199,.09)}.pricing-mode:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:#c9c3dc}.pricing-mode.primary:before{background:var(--accent)}
    .pricing-condition{display:none}.pricing-mode-top{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}.pricing-mode h3{margin:0;font:600 17px/1.2 var(--serif)}.pricing-mode .status{margin:0;white-space:nowrap}.pricing-main{display:block;margin:5px 0 7px;color:#654fc9;font-size:10px;font-weight:800}.pricing-facts{display:grid;gap:2px;margin:0;padding:0;list-style:none;color:#596477;font-size:9.5px}.pricing-facts li:before{content:"·";margin-right:5px;color:var(--accent);font-weight:900}.pricing-mode small{display:block;margin-top:5px;color:#9198a6;font-size:8px}
    .pricing-foundation{display:grid;grid-template-columns:125px 1fr;gap:10px;align-items:center;padding:9px 12px;border-radius:13px;background:#111a30;color:#dfe4ef}.pricing-foundation b{color:#c8bbff;font-size:11px}.pricing-foundation span{font-size:9.5px;line-height:1.45}
    .pricing-path{display:flex;flex-direction:column;padding:15px;border-radius:20px;background:linear-gradient(150deg,#10182d,#171f38);color:#fff}.pricing-path-kicker{color:#b8a7ff;font:800 9px var(--mono);letter-spacing:.12em}.pricing-path h3{margin:5px 0 10px;font:600 19px/1.25 var(--serif)}.pricing-phase{display:grid;grid-template-columns:28px 1fr;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.11)}.pricing-phase i{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:rgba(169,146,255,.16);color:#cfc5ff;font:800 9px var(--mono);font-style:normal}.pricing-phase b{display:block;font-size:10.5px}.pricing-phase span{display:block;color:#aeb8cd;font-size:9px}.pricing-readiness{margin-top:auto;padding-top:9px;border-top:1px solid rgba(255,255,255,.11)}.pricing-readiness b{display:block;margin-bottom:4px;color:#cfc5ff;font-size:9px}.pricing-readiness span{display:block;color:#aeb8cd;font-size:8.5px;line-height:1.55}
    #monetization .callout{margin-top:10px}
    @media(max-width:840px){.pricing-routing{grid-template-columns:1fr}.pricing-path{min-height:260px}}
    @media(max-width:720px){#monetization .section-head{height:auto;min-height:118px}.pricing-map{padding:9px}.pricing-axis{display:none}.pricing-row{grid-template-columns:1fr;gap:6px}.pricing-segment{display:block;padding:6px 10px;text-align:left;font-size:10px}.pricing-segment b{display:inline;margin-right:5px;font-size:12px}.pricing-mode{min-height:138px;padding:11px 12px 9px}.pricing-condition{display:block;margin-bottom:3px;color:#7a8395;font-size:9px;font-weight:800}.pricing-mode h3{font-size:16px}.pricing-main{font-size:10.5px}.pricing-facts{font-size:10px}.pricing-mode small{font-size:8px}.pricing-foundation{grid-template-columns:1fr;gap:2px}.pricing-path{padding:13px}.pricing-path h3{font-size:17px}}
`;
if (!html.includes("/* pricing-routing: report chapter 18 */")) {
  const styleClose = "  </style>";
  if (!html.includes(styleClose)) throw new Error("Missing main style closing tag");
  html = html.replace(styleClose, `${pricingCss}${styleClose}`);
}

const pricingFunction = `
    function pricingRouting(section){
      const modes=Array.isArray(section.pricingModes)?section.pricingModes:[];
      const segments=["企业合同 / SLA","个人自助"];
      const modeCard=(item)=>\`<article class="pricing-mode \${item.position==="stable"?"primary":""}"><span class="pricing-condition">\${item.position==="stable"?"用量稳定 / 可承诺":"用量波动 / 临时"}</span><div class="pricing-mode-top"><h3>\${esc(item.title)}</h3><span class="status target">方案参考</span></div><span class="pricing-main">主场景：\${esc(item.main)}</span><ul class="pricing-facts">\${(item.facts||[]).map(fact=>\`<li>\${esc(fact)}</li>\`).join("")}</ul><small>来源：\${esc(item.source||"")}</small></article>\`;
      const rows=segments.map(segment=>{const variable=modes.find(item=>item.segment===segment&&item.position==="variable")||{};const stable=modes.find(item=>item.segment===segment&&item.position==="stable")||{};return \`<div class="pricing-row"><div class="pricing-segment"><b>\${esc(segment.split(" / ")[0])}</b>\${segment.includes(" / ")?esc(segment.split(" / ")[1]):""}</div>\${modeCard(variable)}\${modeCard(stable)}</div>\`}).join("");
      const phases=(section.pricingPhases||[]).map(item=>\`<div class="pricing-phase"><i>\${esc(item.index)}</i><div><b>\${esc(item.title)}</b><span>\${esc(item.body)}</span></div></div>\`).join("");
      const foundation=section.pricingFoundation||{};
      const readiness=(section.readiness||[]).map(item=>\`<span>\${esc(item)}</span>\`).join("");
      return \`<div class="pricing-routing reveal"><section class="pricing-map" aria-label="按客户类型与用量稳定性选择收费模式"><div class="pricing-axis"><span>客户 × 用量</span><span>用量波动 / 临时</span><span class="stable">用量稳定 / 可承诺</span></div>\${rows}<div class="pricing-foundation"><b>\${esc(foundation.title||"")}</b><span>\${esc(foundation.body||"")}</span></div></section><aside class="pricing-path"><span class="pricing-path-kicker">COMMERCIAL PATH</span><h3>先跑通交易，再推动长期承诺</h3>\${phases}<div class="pricing-readiness"><b>支付与交付准备</b>\${readiness}</div></aside></div>\`;
    }
`;
if (!html.includes("function pricingRouting(section)")) {
  const anchor = "    function sectionMarkup(section,index)";
  if (!html.includes(anchor)) throw new Error("Missing sectionMarkup anchor");
  html = html.replace(anchor, `${pricingFunction}${anchor}`);
}

const routeNeedle = 'const content=section.chart==="horizontal-bars"?userDemandBars(section):';
const routeReplacement = 'const content=section.layout==="pricing-routing"?pricingRouting(section):section.chart==="horizontal-bars"?userDemandBars(section):';
if (!html.includes(routeReplacement)) {
  if (!html.includes(routeNeedle)) throw new Error("Missing content routing anchor");
  html = html.replace(routeNeedle, routeReplacement);
}

fs.writeFileSync(htmlPath, html);
console.log(`Updated ${reportPath}`);
console.log(`Updated ${htmlPath}`);
