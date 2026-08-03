import fs from "node:fs";

const htmlPath = process.argv[2];

if (!htmlPath) {
  throw new Error("Usage: node scripts/enhance-qieman-mcp-top20.mjs <report-html>");
}

let html = fs.readFileSync(htmlPath, "utf8");

if (html.includes("function horizontalBars(section)")) {
  console.log(`横向长条图已存在：${htmlPath}`);
  process.exit(0);
}

const styleAnchor = "  </style>";
const renderAnchor = "    function sectionMarkup(section,index){";
const contentAnchor = 'const content=section.layout==="demo"?demo(section):';

for (const anchor of [styleAnchor, renderAnchor, contentAnchor]) {
  if (!html.includes(anchor)) {
    throw new Error(`未找到报告模板锚点：${anchor}`);
  }
}

const chartCss = `
    .bar-chart{display:grid;gap:7px;margin-top:18px}
    .bar-chart-scale{display:grid;grid-template-columns:32px minmax(180px,260px) 1fr 72px;align-items:center;gap:10px;color:var(--muted);font-size:11px;letter-spacing:.04em}
    .bar-chart-scale span:nth-child(2){grid-column:3;text-align:center}.bar-chart-scale span:last-child{text-align:right}
    .bar-chart-list{display:grid;gap:5px}
    .bar-row{display:grid;grid-template-columns:32px minmax(180px,260px) minmax(180px,1fr) 72px;align-items:center;gap:10px;min-height:24px}
    .bar-rank{color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums;text-align:right}
    .bar-label{display:flex;align-items:baseline;gap:7px;min-width:0}.bar-label b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar-label span{flex:none;color:var(--muted);font-size:11px}
    .bar-track{height:14px;border-radius:999px;background:rgba(73,82,104,.09);overflow:visible;position:relative}
    .bar-fill{display:block;width:var(--bar-width);min-width:3px;height:100%;border-radius:999px;background:linear-gradient(90deg,#8067e8,#9f8df0)}
    .bar-fill.cat-data{background:linear-gradient(90deg,#4f77c8,#6f98e8)}
    .bar-fill.cat-research{background:linear-gradient(90deg,#3e8a73,#62ad92)}
    .bar-fill.cat-advisor{background:linear-gradient(90deg,#ad628f,#ca86af)}
    .bar-fill.cat-utility{background:linear-gradient(90deg,#b77c37,#d6a257)}
    .bar-value{text-align:right;font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
    .bar-chart-note{margin:4px 0 0 42px;color:var(--muted);font-size:11px}
    @media(max-width:700px){
      .bar-chart{gap:6px;margin-top:14px}.bar-chart-scale{grid-template-columns:24px 1fr 58px;gap:7px}.bar-chart-scale span:first-child{grid-column:2}.bar-chart-scale span:nth-child(2){display:none}.bar-chart-scale span:last-child{grid-column:3}
      .bar-chart-list{gap:7px}.bar-row{grid-template-columns:24px minmax(0,1fr) 58px;grid-template-rows:auto 10px;gap:4px 7px;min-height:31px}.bar-rank{grid-row:1/3}.bar-label{grid-column:2}.bar-label b{font-size:12px}.bar-label span{font-size:10px}.bar-value{grid-column:3;font-size:12px}.bar-track{grid-column:2/4;grid-row:2;height:10px}.bar-chart-note{margin-left:31px;font-size:10px}
    }
`;

const chartFunction = `    function horizontalBars(section){
      const values=section.items.map(item=>Number(item.valueWan)||0);
      const maxValue=Math.max(...values,1);
      const categoryClass={"金融数据":"cat-data","投研服务":"cat-research","投顾服务":"cat-advisor","通用服务":"cat-utility","投顾内容":"cat-content"};
      const rows=section.items.map((item,index)=>{
        const width=Math.max(0,(Number(item.valueWan)||0)/maxValue*100).toFixed(2);
        const rank=String(item.rank||index+1).padStart(2,"0");
        const category=esc(item.category||item.subCategory||"");
        const cssClass=categoryClass[item.category]||"cat-content";
        const aria=esc(\`第\${rank}名，\${item.title}，\${item.metric}次，\${item.category||"未分类"}\`);
        return \`<div class="bar-row" aria-label="\${aria}"><span class="bar-rank">\${rank}</span><div class="bar-label"><b>\${esc(item.title)}</b><span>\${category}</span></div><div class="bar-track" aria-hidden="true"><span class="bar-fill \${cssClass}" style="--bar-width:\${width}%"></span></div><strong class="bar-value">\${esc(item.metric)}</strong></div>\`;
      }).join("");
      return \`<div class="items bar-chart reveal" role="img" aria-label="MCP 业务调用量前二十横向长条图，按调用量从高到低排序，单位为万次"><div class="bar-chart-scale" aria-hidden="true"><span>0</span><span>调用量 · 万次 · 线性刻度</span><span>\${esc(String(maxValue))}万</span></div><div class="bar-chart-list">\${rows}</div><p class="bar-chart-note">统一线性尺度；榜尾保留最小可见宽度，精确值以右侧数字为准。</p></div>\`;
    }
`;

html = html.replace(styleAnchor, `${chartCss}\n${styleAnchor}`);
html = html.replace(renderAnchor, `${chartFunction}\n${renderAnchor}`);
html = html.replace(
  contentAnchor,
  'const content=section.chart==="horizontal-bars"?horizontalBars(section):section.layout==="demo"?demo(section):',
);

fs.writeFileSync(htmlPath, html);
console.log(`已注入横向长条图：${htmlPath}`);
