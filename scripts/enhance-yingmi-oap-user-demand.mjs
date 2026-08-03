import fs from "node:fs";

const htmlPath = process.argv[2];
const reportPath = process.argv[3];

if (!htmlPath || !reportPath) {
  throw new Error(
    "Usage: node scripts/enhance-yingmi-oap-user-demand.mjs <report-html> <report-json>",
  );
}

let html = fs.readFileSync(htmlPath, "utf8");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const userDemand = report.sections?.find((section) => section.id === "user-demand");

if (!userDemand || userDemand.items?.length !== 20) {
  throw new Error("report.json 必须包含 20 项 user-demand 数据");
}

const reportDataPattern =
  /<script type="application\/json" id="report-data">[\s\S]*?<\/script>/;
if (!reportDataPattern.test(html)) {
  throw new Error("未找到 report-data 内嵌数据");
}

const embeddedReport = JSON.stringify(report).replaceAll("<", "\\u003c");
html = html.replace(
  reportDataPattern,
  `<script type="application/json" id="report-data">\n${embeddedReport}\n  </script>`,
);

const styleMarker = "/* user-demand-chart:start */";
if (!html.includes(styleMarker)) {
  const styleAnchor = "  </style>";
  if (!html.includes(styleAnchor)) throw new Error("未找到样式注入锚点");

  const chartCss = `
    /* user-demand-chart:start */
    #user-demand .section-head{grid-template-columns:minmax(0,620px) minmax(300px,1fr);gap:36px;align-items:end;height:80px;margin-bottom:8px}
    .demand-chart{display:grid;gap:5px;margin-top:2px}
    .demand-scale{display:grid;grid-template-columns:30px minmax(180px,250px) 1fr 68px;align-items:center;gap:9px;color:var(--muted);font-size:10px;letter-spacing:.03em}
    .demand-scale span:nth-child(2){grid-column:3;text-align:center}.demand-scale span:last-child{text-align:right}
    .demand-list{display:grid;gap:3px}
    .demand-row{display:grid;grid-template-columns:30px minmax(180px,250px) minmax(160px,1fr) 68px;align-items:center;gap:9px;min-height:20px}
    .demand-rank{color:#7d879a;font-size:10px;font-variant-numeric:tabular-nums;text-align:right}
    .demand-label{display:flex;align-items:baseline;gap:7px;min-width:0}.demand-label b{font-size:12px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.demand-label span{flex:none;color:var(--muted);font-size:9px}
    .demand-track{height:11px;border-radius:999px;background:rgba(73,82,104,.09);overflow:visible;position:relative}
    .demand-fill{display:block;width:var(--bar-width);min-width:3px;height:100%;border-radius:999px;background:linear-gradient(90deg,#8067e8,#9f8df0)}
    .demand-fill.cat-data{background:linear-gradient(90deg,#4f77c8,#6f98e8)}
    .demand-fill.cat-research{background:linear-gradient(90deg,#3e8a73,#62ad92)}
    .demand-fill.cat-advisor{background:linear-gradient(90deg,#ad628f,#ca86af)}
    .demand-fill.cat-utility{background:linear-gradient(90deg,#b77c37,#d6a257)}
    .demand-value{text-align:right;font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap}
    .demand-note{margin:2px 0 0 39px;color:var(--muted);font-size:9px;line-height:1.4}
    #user-demand .callout{margin-top:8px;padding:9px 14px}#user-demand .callout p{font-size:12px}
    @media(max-width:980px){#user-demand .section-head{grid-template-columns:minmax(0,760px);gap:10px;align-items:start;height:116px}}
    @media(max-width:700px){
      #user-demand .section-head{height:122px;margin-bottom:8px}
      .demand-chart{gap:5px}.demand-scale{grid-template-columns:22px 1fr 54px;gap:6px}.demand-scale span:first-child{grid-column:2}.demand-scale span:nth-child(2){display:none}.demand-scale span:last-child{grid-column:3}
      .demand-list{gap:5px}.demand-row{grid-template-columns:22px minmax(0,1fr) 54px;grid-template-rows:auto 8px;gap:3px 6px;min-height:27px}.demand-rank{grid-row:1/3}.demand-label{grid-column:2}.demand-label b{font-size:11px}.demand-label span{font-size:9px}.demand-value{grid-column:3;font-size:10px}.demand-track{grid-column:2/4;grid-row:2;height:8px}.demand-note{margin-left:28px;font-size:9px}
      #user-demand .callout{grid-template-columns:1fr;margin-top:8px;padding:10px 12px}#user-demand .callout .status{display:none}
    }
    /* user-demand-chart:end */
`;
  html = html.replace(styleAnchor, `${chartCss}\n${styleAnchor}`);
}

const functionMarker = "function userDemandBars(section)";
if (!html.includes(functionMarker)) {
  const renderAnchor = "    function sectionMarkup(section,index){";
  if (!html.includes(renderAnchor)) throw new Error("未找到渲染函数注入锚点");

  const chartFunction = `    function userDemandBars(section){
      const values=section.items.map(item=>Number(item.valueWan)||0);
      const secondValue=values[1]||Math.max(...values,1);
      const categoryClass={"金融数据":"cat-data","投研服务":"cat-research","投顾服务":"cat-advisor","通用服务":"cat-utility","投顾内容":"cat-content"};
      const rows=section.items.map((item,index)=>{
        const value=Number(item.valueWan)||0;
        const width=(index===0?100:Math.max(0,value/secondValue*80)).toFixed(2);
        const rank=String(item.rank||index+1).padStart(2,"0");
        const category=item.category||item.subCategory||"";
        const cssClass=categoryClass[category]||"cat-content";
        const aria=esc(\`第\${rank}名，\${item.title}，调用\${item.metric}次，\${category}\`);
        return \`<div class="demand-row" role="listitem" aria-label="\${aria}"><span class="demand-rank">\${rank}</span><div class="demand-label"><b>\${esc(item.title)}</b><span>\${esc(category)}</span></div><div class="demand-track" aria-hidden="true"><span class="demand-fill \${cssClass}" style="--bar-width:\${width}%"></span></div><strong class="demand-value">\${esc(item.metric)}</strong></div>\`;
      }).join("");
      return \`<div class="items demand-chart reveal" role="group" aria-label="MCP 业务调用量前二十横向长条图，已剔除时间查询。第一名固定为百分之百，第二名固定为百分之八十，第三至第二十名按相对第二名的真实调用量比例缩放；精确调用量以右侧万次数字为准"><div class="demand-scale" aria-hidden="true"><span>0</span><span>视觉压缩尺度 · 第2名 = 80%</span><span>第1名 = 100%</span></div><div class="demand-list" role="list">\${rows}</div><p class="demand-note">已剔除时间查询。视觉压缩：第1名固定100%、第2名固定80%，第3—20名按相对第2名的调用量同比缩放；真实调用量以右侧数字为准。</p></div>\`;
    }
`;
  html = html.replace(renderAnchor, `${chartFunction}\n${renderAnchor}`);
}

const originalContent = 'const content=section.layout==="demo"?demo(section):';
const enhancedContent =
  'const content=section.chart==="horizontal-bars"?userDemandBars(section):section.layout==="demo"?demo(section):';
if (!html.includes(enhancedContent)) {
  if (!html.includes(originalContent)) throw new Error("未找到内容路由注入锚点");
  html = html.replace(originalContent, enhancedContent);
}

fs.writeFileSync(htmlPath, html);
console.log(`已同步报告数据并注入用户需求图：${htmlPath}`);
