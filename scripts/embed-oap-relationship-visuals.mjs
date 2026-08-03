#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [htmlPath] = process.argv.slice(2);
if (!htmlPath) throw new Error("Usage: node scripts/embed-oap-relationship-visuals.mjs <index.html>");

const target = resolve(htmlPath);
let html = await readFile(target, "utf8");
const report = JSON.parse(await readFile(resolve(dirname(target), "report.json"), "utf8"));
const inlineReport = JSON.stringify(report).replaceAll("<", "\\u003c");
html = html.replace(
  /(<script type="application\/json" id="report-data">)[\s\S]*?(<\/script>)/,
  `$1${inlineReport}$2`,
);

const css = String.raw`
    /* Embedded relationship visualizations */
    #system-relationship .section-head,#service-relationship .section-head{height:104px;margin-bottom:8px}
    .relationship-module{display:block;margin:0}
    .relationship-stage{position:relative;height:min(560px,calc(100svh - var(--nav-h) - 160px));min-height:440px;margin:0;border:1px solid rgba(116,87,232,.18);border-radius:22px;background:linear-gradient(145deg,#fbfaff,#f0edfa);box-shadow:0 22px 60px rgba(42,31,88,.12);overflow:hidden}
    .relationship-scroll{width:100%;height:100%;display:grid;place-items:center;overflow:auto;scrollbar-width:none;overscroll-behavior:contain}
    .relationship-scroll::-webkit-scrollbar{display:none}
    .relationship-scroll img{display:block;font-family:"Songti SC","STSong","SimSun",serif}.relationship-scroll:not(.detail) img{position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:contain}
    @media(max-width:720px){#system-relationship .section-head,#service-relationship .section-head{height:auto;min-height:136px}.relationship-stage{height:250px;min-height:250px;border-radius:17px}}
    @media print{.relationship-stage{height:auto;min-height:0;overflow:visible;box-shadow:none}.relationship-scroll{overflow:visible}.relationship-scroll img{width:100%;height:auto;max-width:100%;min-width:0;min-height:0}}
`;

const script = String.raw`
  <script>
    (()=>{
      const mount=(sectionId,src,alt)=>{
        const root=document.querySelector(sectionId+" .architecture");
        if(!root)return;
        root.className="relationship-module reveal visible";
        root.setAttribute("aria-label",alt);
        root.innerHTML='<figure class="relationship-stage"><div class="relationship-scroll"><img src="'+src+'" alt="'+alt+'"></div></figure>';
      };
      mount("#system-relationship","assets/system-relationship.svg","盈米 AI 系统关系图完整可视化");
      mount("#service-relationship","assets/service-relationship.svg","盈米 AI 服务关系图完整可视化");
    })();
  </script>
`;

if (!html.includes("/* Embedded relationship visualizations */")) {
  html = html.replace("  </style>", `${css}\n  </style>`);
}
if (!html.includes("assets/system-relationship.svg")) {
  html = html.replace("</body>", `${script}\n</body>`);
}

await writeFile(target, html, "utf8");
console.log(`Embedded OAP relationship visuals in ${target}`);
