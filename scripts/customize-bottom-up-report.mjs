#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [htmlPath] = process.argv.slice(2);
if (!htmlPath) throw new Error("Usage: node scripts/customize-bottom-up-report.mjs <index.html>");

const target = resolve(htmlPath);
let html = await readFile(target, "utf8");

const css = String.raw`
    /* Original-relationship visual redraw */
    #service-map .section-head,#system-map .section-head{height:108px;margin-bottom:8px}
    .diagram-module{display:grid;gap:8px;margin:0}
    .diagram-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;color:#777f92;font-size:9.5px}
    .diagram-toolbar strong{color:#5d48c4;letter-spacing:.08em}
    .diagram-actions{display:flex;align-items:center;gap:6px}
    .diagram-action{display:inline-flex;align-items:center;min-height:28px;padding:5px 9px;border:1px solid #dcd6ef;border-radius:9px;background:#fff;color:#5c49bd;text-decoration:none;font:700 9px var(--serif);cursor:pointer}
    .diagram-action:hover{border-color:#a896e7;background:#f5f2ff}.diagram-action:focus-visible{outline:2px solid #7457e8;outline-offset:2px}
    .diagram-stage{position:relative;height:min(470px,calc(100svh - var(--nav-h) - 220px));min-height:390px;border:1px solid rgba(116,87,232,.18);border-radius:22px;background:linear-gradient(145deg,#fbfaff,#f0edfa);box-shadow:0 22px 60px rgba(42,31,88,.12);overflow:hidden}
    .diagram-scroll{width:100%;height:100%;display:grid;place-items:center;overflow:auto;scrollbar-width:none;overscroll-behavior:contain}
    .diagram-scroll::-webkit-scrollbar{display:none}
    .diagram-scroll img{display:block;width:auto;height:min(470px,calc(100svh - var(--nav-h) - 220px));max-width:none;max-height:none;font-family:"Songti SC","STSong","SimSun",serif;transition:min-width .25s ease}
    .diagram-scroll.detail{place-items:start}.diagram-scroll.detail img{width:auto;min-width:1120px;max-width:none;height:auto;min-height:100%}
    .diagram-caption{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 4px;color:#858c9d;font-size:9px}.diagram-caption b{color:#7457e8}
    @media(max-width:720px){#service-map .section-head,#system-map .section-head{height:136px}.diagram-toolbar{align-items:flex-start}.diagram-toolbar>span{display:none}.diagram-stage{height:230px;min-height:230px;border-radius:17px}.diagram-stage:has(.diagram-scroll.detail){height:420px;min-height:420px}.diagram-action{min-height:30px}.diagram-scroll:not(.detail) img{width:100%;height:auto;max-width:100%;min-width:0}.diagram-scroll.detail img{min-width:980px}.diagram-caption span:last-child{display:none}.section#service-map .callout,.section#system-map .callout{margin-top:10px}}
    @media print{.diagram-toolbar{display:none}.diagram-stage{height:auto;min-height:0;overflow:visible;box-shadow:none}.diagram-scroll{overflow:visible}.diagram-scroll img,.diagram-scroll.detail img{width:100%;height:auto;max-width:100%;min-width:0}.diagram-caption{margin-top:8px}}
`;

const script = String.raw`
  <script>
    (()=>{
      const mount=(sectionId,src,alt,label)=>{
        const root=document.querySelector(sectionId+" .architecture");
        if(!root)return;
        root.className="diagram-module reveal visible";
        root.setAttribute("aria-label",alt);
        root.innerHTML=
          '<div class="diagram-toolbar"><strong>原图关系 1:1 保留</strong><span>宋体 · CLAIR 紫色系 · 仅视觉重绘</span><div class="diagram-actions"><button class="diagram-action" type="button" data-diagram-zoom>查看细节</button><a class="diagram-action" href="'+src+'" target="_blank" rel="noopener">打开 SVG</a></div></div>'+
          '<figure class="diagram-stage"><div class="diagram-scroll"><img src="'+src+'" alt="'+alt+'"></div></figure>'+
          '<div class="diagram-caption"><span><b>'+label+'</b> · 内容、层级、箭头与反馈关系均按原图</span><span>点击“查看细节”后可横向浏览</span></div>';
      };
      mount("#service-map","assets/service-relationship-redraw.svg","CLAIR 配色重绘的盈米 AI 服务关系图","服务关系图");
      mount("#system-map","assets/system-relationship-redraw.svg","CLAIR 配色重绘的盈米 AI 系统关系图","系统关系图");
      document.addEventListener("click",event=>{
        const button=event.target.closest("[data-diagram-zoom]");
        if(!button)return;
        const scroll=button.closest(".diagram-module").querySelector(".diagram-scroll");
        const detail=scroll.classList.toggle("detail");
        button.textContent=detail?"适配全图":"查看细节";
        button.setAttribute("aria-pressed",String(detail));
      });
    })();
  </script>
`;

if (!html.includes("/* Original-relationship visual redraw */")) {
  html = html.replace("  </style>", `${css}\n  </style>`);
}
if (!html.includes("service-relationship-redraw.svg")) {
  html = html.replace("</body>", `${script}\n</body>`);
}

await writeFile(target, html, "utf8");
console.log(`Customized ${target}`);
