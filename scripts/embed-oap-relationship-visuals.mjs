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
    .relationship-module{display:grid;gap:8px;margin:0}
    .relationship-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;color:#667084;font-size:11px}
    .relationship-toolbar strong{color:#5d48c4;letter-spacing:.08em}
    .relationship-actions{display:flex;align-items:center;gap:6px}
    .relationship-action{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #dcd6ef;border-radius:9px;background:#fff;color:#5c49bd;text-decoration:none;font:700 11px var(--serif);cursor:pointer}
    .relationship-action:hover{border-color:#a896e7;background:#f5f2ff}.relationship-action:focus-visible{outline:2px solid #7457e8;outline-offset:2px}
    .relationship-stage{position:relative;height:min(560px,calc(100svh - var(--nav-h) - 160px));min-height:440px;margin:0;border:1px solid rgba(116,87,232,.18);border-radius:22px;background:linear-gradient(145deg,#fbfaff,#f0edfa);box-shadow:0 22px 60px rgba(42,31,88,.12);overflow:hidden}
    .relationship-scroll{width:100%;height:100%;display:grid;place-items:center;overflow:auto;scrollbar-width:none;overscroll-behavior:contain}
    .relationship-scroll::-webkit-scrollbar{display:none}
    .relationship-scroll img{display:block;font-family:"Songti SC","STSong","SimSun",serif}.relationship-scroll:not(.detail) img{position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;object-fit:contain}
    .relationship-scroll.detail{place-items:start}.relationship-scroll.detail img{position:static;width:auto;min-width:1280px;max-width:none;height:auto;min-height:720px;max-height:none}
    .relationship-caption{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;color:#737c90;font-size:10.5px}.relationship-caption b{color:#7457e8}
    @media(max-width:720px){#system-relationship .section-head,#service-relationship .section-head{height:auto;min-height:136px}.relationship-toolbar{align-items:flex-start}.relationship-toolbar>span{display:none}.relationship-stage{height:250px;min-height:250px;border-radius:17px}.relationship-stage:has(.relationship-scroll.detail){height:480px;min-height:480px}.relationship-action{min-height:32px}.relationship-scroll.detail img{min-width:1280px;min-height:720px}.relationship-caption span:last-child{display:none}.section#system-relationship .callout,.section#service-relationship .callout{margin-top:10px}}
    @media print{.relationship-toolbar{display:none}.relationship-stage{height:auto;min-height:0;overflow:visible;box-shadow:none}.relationship-scroll{overflow:visible}.relationship-scroll img,.relationship-scroll.detail img{width:100%;height:auto;max-width:100%;min-width:0;min-height:0}.relationship-caption{margin-top:8px}}
`;

const script = String.raw`
  <script>
    (()=>{
      const mount=(sectionId,src,alt,label)=>{
        const root=document.querySelector(sectionId+" .architecture");
        if(!root)return;
        root.className="relationship-module reveal visible";
        root.setAttribute("aria-label",alt);
        root.innerHTML=
          '<div class="relationship-toolbar"><strong>完整关系图 · SVG</strong><span>宋体 · CLAIR 紫色系 · 内容与关系保持不变</span><div class="relationship-actions"><button class="relationship-action" type="button" data-relationship-zoom aria-pressed="false">放大阅读</button><a class="relationship-action" href="'+src+'" target="_blank" rel="noopener">打开 SVG</a></div></div>'+
          '<figure class="relationship-stage"><div class="relationship-scroll"><img src="'+src+'" alt="'+alt+'"></div></figure>'+
          '<div class="relationship-caption"><span><b>'+label+'</b> · 完整节点、层级、箭头与反馈关系</span><span>放大后可在图框内横向与纵向浏览</span></div>';
      };
      mount("#system-relationship","assets/system-relationship.svg","盈米 AI 系统关系图完整可视化","系统关系图");
      mount("#service-relationship","assets/service-relationship.svg","盈米 AI 服务关系图完整可视化","服务关系图");
      document.addEventListener("click",event=>{
        const button=event.target.closest("[data-relationship-zoom]");
        if(!button)return;
        const scroll=button.closest(".relationship-module").querySelector(".relationship-scroll");
        const detail=scroll.classList.toggle("detail");
        scroll.scrollTo({left:0,top:0,behavior:"auto"});
        button.textContent=detail?"完整适配":"放大阅读";
        button.setAttribute("aria-pressed",String(detail));
      });
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
