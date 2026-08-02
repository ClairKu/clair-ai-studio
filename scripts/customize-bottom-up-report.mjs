#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [htmlPath] = process.argv.slice(2);
if (!htmlPath) throw new Error("Usage: node scripts/customize-bottom-up-report.mjs <index.html>");

const target = resolve(htmlPath);
let html = await readFile(target, "utf8");

const css = String.raw`
    /* Report-specific vertical architecture diagrams */
    .system-visual,.service-visual{position:relative;display:grid;gap:7px;margin:0;padding:14px;border:1px solid rgba(116,87,232,.18);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(243,240,255,.94));box-shadow:0 22px 60px rgba(27,23,54,.12);overflow:hidden}
    .dark .system-visual{border-color:rgba(255,255,255,.1);background:radial-gradient(circle at 88% 8%,rgba(130,105,245,.19),transparent 27%),linear-gradient(145deg,#111a32,#0a1122);box-shadow:0 28px 70px rgba(0,0,0,.24)}
    .diagram-note{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 3px;color:#818aa0;font-size:9px;letter-spacing:.08em}
    .diagram-note b{color:#5d48c6}.dark .diagram-note{color:#7f8aa1}.dark .diagram-note b{color:#b9aaff}
    .sys-stack{display:flex;flex-direction:column;gap:5px;min-width:0}
    .sys-layer{position:relative;display:grid;grid-template-columns:132px minmax(0,1fr);gap:12px;align-items:center;min-width:0;padding:10px 12px;border:1px solid #e1def0;border-radius:15px;background:#fff;color:#20243a;box-shadow:0 8px 26px rgba(41,32,89,.07)}
    .dark .sys-layer{border-color:rgba(255,255,255,.11);background:rgba(255,255,255,.07);color:#fff;box-shadow:none}
    .sys-layer.foundation{border-color:transparent;background:linear-gradient(125deg,#5638c8,#876df2 55%,#a48fff);color:#fff;box-shadow:0 16px 38px rgba(79,53,180,.3)}
    .sys-layer.assets{border-color:#9a87ef;background:linear-gradient(110deg,#f0ecff,#fff)}
    .dark .sys-layer.assets{border-color:#8068df;background:linear-gradient(110deg,rgba(128,103,232,.2),rgba(255,255,255,.07))}
    .sys-layer.delivery{border-color:#9ec7ff;background:linear-gradient(110deg,#eef6ff,#fff)}
    .dark .sys-layer.delivery{border-color:#4779c5;background:linear-gradient(110deg,rgba(56,118,221,.18),rgba(255,255,255,.07))}
    .sys-layer.service{border-color:#ffb28a;background:linear-gradient(110deg,#fff4ed,#fff)}
    .dark .sys-layer.service{border-color:#c96e43;background:linear-gradient(110deg,rgba(255,116,58,.17),rgba(255,255,255,.07))}
    .layer-heading{display:flex;align-items:center;gap:10px;min-width:0}
    .layer-number{display:grid;place-items:center;flex:0 0 auto;width:31px;height:31px;border-radius:10px;background:#eeeaff;color:#6249cf;font:800 10px var(--serif)}
    .foundation .layer-number{background:rgba(255,255,255,.17);color:#fff}
    .layer-copy{min-width:0}.layer-copy b{display:block;font-size:14px;line-height:1.1}.layer-copy span{display:block;margin-top:3px;color:#7d8597;font-size:9px}.foundation .layer-copy span{color:#e7e0ff}.dark .layer-copy span{color:#9da9bf}
    .node-row{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;min-width:0}
    .node{display:inline-flex;align-items:center;justify-content:center;min-height:27px;padding:5px 9px;border:1px solid rgba(116,87,232,.16);border-radius:9px;background:rgba(255,255,255,.76);color:#454d63;font-size:9.5px;line-height:1.2;text-align:center;white-space:nowrap}
    .dark .node{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#e3e8f2}.foundation .node{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.12);color:#fff}
    .system-pair{display:grid;grid-template-columns:1fr 1fr;gap:7px}.system-pair .sys-layer{grid-template-columns:128px minmax(0,1fr)}
    .rise{height:13px;display:flex;align-items:center;justify-content:center;gap:7px;color:#947df1;font:800 9px var(--serif);letter-spacing:.08em}.rise:before{content:"↑";display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#7658e8;color:#fff;font-size:12px;box-shadow:0 5px 15px rgba(116,87,232,.28)}
    .service-visual{padding-right:64px;background:radial-gradient(circle at 12% 90%,rgba(255,120,60,.09),transparent 28%),linear-gradient(145deg,#fff,#f4f1ff)}
    .service-stack{display:flex;flex-direction:column;gap:5px;min-width:0}
    .svc-layer{position:relative;display:grid;grid-template-columns:118px minmax(0,1fr);gap:10px;align-items:center;min-width:0;padding:7px 10px;border:1px solid #e2e1eb;border-radius:15px;background:#fff;box-shadow:0 8px 24px rgba(37,30,80,.07)}
    .svc-layer.foundation{border-color:transparent;background:linear-gradient(125deg,#5638c8,#8469ef 55%,#9f89ff);color:#fff;box-shadow:0 16px 36px rgba(82,57,179,.28)}
    .svc-layer.lab{border-color:#e8b89f;background:linear-gradient(110deg,#fff5ee,#fff 52%,#eef5ff)}
    .svc-layer.workbench{border-color:#a9c9f8;background:linear-gradient(110deg,#eef6ff,#fff)}
    .svc-layer.apps{border-color:#b7a8ef;background:linear-gradient(110deg,#f4f0ff,#fff)}
    .svc-layer.roles{border-color:#ded9ef;background:#fff}
    .svc-title{display:flex;align-items:center;gap:8px}.svc-title i{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#eeeaff;color:#644bce;font:normal 800 9px var(--serif)}.foundation .svc-title i{background:rgba(255,255,255,.16);color:#fff}.svc-title b{display:block;font-size:12px}.svc-title span{display:block;margin-top:1px;color:#858c9c;font-size:8.5px}.foundation .svc-title span{color:#e5ddff}
    .svc-content{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.svc-chip{display:inline-flex;align-items:center;min-height:23px;padding:3px 7px;border:1px solid #e1deed;border-radius:8px;background:rgba(255,255,255,.86);color:#4f566c;font-size:9px;white-space:nowrap}.foundation .svc-chip{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.12);color:#fff}.svc-chip.creator{border-color:#ffc4a6;background:#fff5ef;color:#d8642c}.svc-chip.user{border-color:#b8d3ff;background:#f0f6ff;color:#3f6fb9}
    .feedback-rail{position:absolute;right:13px;top:43px;bottom:41px;width:39px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:1px dashed rgba(116,87,232,.38);border-radius:19px;background:rgba(255,255,255,.72);color:#6752c8}.feedback-rail b{font-size:14px}.feedback-rail span{writing-mode:vertical-rl;font-size:9px;letter-spacing:.12em}.feedback-rail i{font-style:normal;font-size:17px}
    .role-key{display:flex;gap:8px;align-items:center;padding:0 3px;color:#7a8294;font-size:9px}.role-key span{display:inline-flex;align-items:center;gap:4px}.role-key i{width:7px;height:7px;border-radius:50%}.role-key .creator i{background:#ff7b3c}.role-key .user i{background:#528be4}
    @media(max-width:980px){.sys-layer,.system-pair .sys-layer,.svc-layer{grid-template-columns:1fr}.node-row,.svc-content{justify-content:flex-start}.system-pair{grid-template-columns:1fr 1fr}.system-pair .node-row{justify-content:flex-start}.service-visual{padding-right:58px}}
    @media(max-width:720px){.system-visual,.service-visual{padding:10px;border-radius:18px}.service-visual{padding-right:48px}.system-pair{grid-template-columns:1fr}.sys-layer,.system-pair .sys-layer,.svc-layer{grid-template-columns:1fr;gap:8px;padding:9px}.node-row,.svc-content{justify-content:flex-start;gap:4px}.node,.svc-chip{font-size:9px;white-space:normal}.diagram-note{align-items:flex-start}.diagram-note span{display:none}.feedback-rail{right:8px;top:38px;bottom:37px;width:31px}.feedback-rail span{font-size:8px}.role-key{flex-wrap:wrap}.section#system-stack .callout,.section#service-stack .callout{margin-top:10px}}
    @media print{.system-visual,.service-visual{break-inside:avoid}.feedback-rail span{writing-mode:horizontal-tb}}
`;

const script = String.raw`
  <script>
    (()=>{
      const system=document.querySelector("#system-stack .architecture");
      if(system){
        system.className="system-visual reveal visible";
        system.setAttribute("aria-label","自下而上的盈米 AI 系统关系图");
        system.innerHTML=
          '<div class="diagram-note"><b>05 · 越向上越接近用户</b><span>从最底层 01 开始向上阅读</span></div>'+
          '<div class="sys-stack">'+
            '<div class="sys-layer service"><div class="layer-heading"><span class="layer-number">05</span><span class="layer-copy"><b>服务与生态层</b><span>用户真正看见和使用的触点</span></span></div><div class="node-row"><span class="node">官网 / 开放门户</span><span class="node">AI 小顾</span><span class="node">自建 AI 应用</span><span class="node">专家 Agent / 行业应用</span><span class="node">个人中心</span></div></div>'+
            '<div class="rise">服务交付 · 生态接入</div>'+
            '<div class="sys-layer delivery"><div class="layer-heading"><span class="layer-number">04</span><span class="layer-copy"><b>交付与协同层</b><span>组织、分发与持续使用</span></span></div><div class="node-row"><span class="node">AI 工作台</span><span class="node">我的 / 团队应用</span><span class="node">场景入口</span><span class="node">消息协作</span></div></div>'+
            '<div class="rise">发布 · 分发</div>'+
            '<div class="system-pair"><div class="sys-layer"><div class="layer-heading"><span class="layer-number">03A</span><span class="layer-copy"><b>AI 实验室</b><span>生产环境 · 目标态</span></span></div><div class="node-row"><span class="node">搭建</span><span class="node">编排</span><span class="node">测试</span></div></div><div class="sys-layer"><div class="layer-heading"><span class="layer-number">03B</span><span class="layer-copy"><b>Stargate</b><span>治理中枢</span></span></div><div class="node-row"><span class="node">权限</span><span class="node">发布</span><span class="node">运营</span><span class="node">统计</span></div></div></div>'+
            '<div class="rise">编排 · 治理</div>'+
            '<div class="sys-layer assets"><div class="layer-heading"><span class="layer-number">02</span><span class="layer-copy"><b>AI 资产层</b><span>能力从接口到任务逐级沉淀</span></span></div><div class="node-row"><span class="node">MCP · 标准调用</span><span class="node">Skills · 专业流程</span><span class="node">Agent · 完整任务</span></div></div>'+
            '<div class="rise">标准化 · 资产化</div>'+
            '<div class="sys-layer foundation"><div class="layer-heading"><span class="layer-number">01</span><span class="layer-copy"><b>AI 开放平台</b><span>服务与能力底座</span></span></div><div class="node-row"><span class="node">金融数据</span><span class="node">工具能力</span><span class="node">账号权限</span><span class="node">能力目录</span><span class="node">可观测 / 运营数据</span></div></div>'+
          '</div>'+
          '<div class="diagram-note"><b>01 · 越向下越强调复用与治理</b><span>开放平台固定在全链路最底层</span></div>';
      }
      const service=document.querySelector("#service-stack .process");
      if(service){
        service.className="service-visual reveal visible";
        service.setAttribute("aria-label","自下而上的盈米 AI 服务关系图");
        service.innerHTML=
          '<div class="diagram-note"><b>05 · 用户价值</b><span>主链向上 / 反馈向下</span></div>'+
          '<div class="service-stack">'+
            '<div class="svc-layer roles"><div class="svc-title"><i>05</i><span><b>角色与结果</b><span>同一链路，两类进入方式</span></span></div><div class="svc-content"><span class="svc-chip creator">创作者 · 运营 / 产品 / 业务</span><span class="svc-chip user">使用者 · 顾问 / 员工 / 用户</span></div></div>'+
            '<div class="rise">服务触达 · 任务完成</div>'+
            '<div class="svc-layer apps"><div class="svc-title"><i>04</i><span><b>AI 服务</b><span>面向具体人群与场景</span></span></div><div class="svc-content"><span class="svc-chip">AI 小顾</span><span class="svc-chip">自建 AI 应用</span><span class="svc-chip">专家 Agent / 行业应用</span><span class="svc-chip">官网 / 开放门户</span></div></div>'+
            '<div class="rise">组织 · 发布 · 分发</div>'+
            '<div class="svc-layer workbench"><div class="svc-title"><i>03</i><span><b>AI 工作台</b><span>个人 / 团队交付环境</span></span></div><div class="svc-content"><span class="svc-chip">我的应用</span><span class="svc-chip">团队应用</span><span class="svc-chip">场景入口</span><span class="svc-chip">消息协作</span></div></div>'+
            '<div class="rise">搭建 · 试用 · 发布</div>'+
            '<div class="svc-layer lab"><div class="svc-title"><i>02</i><span><b>AI 实验室</b><span>低代码生产环境 · 目标态</span></span></div><div class="svc-content"><span class="svc-chip creator">创作：Agent / Workflow / Skills / MCP</span><span class="svc-chip user">试用：浏览 / 收藏 / 启用 / 体验</span></div></div>'+
            '<div class="rise">统一能力调用</div>'+
            '<div class="svc-layer foundation"><div class="svc-title"><i>01</i><span><b>AI 开放平台</b><span>服务与能力底座 · 固定在最下面</span></span></div><div class="svc-content"><span class="svc-chip">数据 / 工具</span><span class="svc-chip">MCP / Skills / Agent</span><span class="svc-chip">账号 / 权限</span><span class="svc-chip">Stargate 治理</span></div></div>'+
          '</div>'+
          '<aside class="feedback-rail" aria-label="使用反馈回流"><b>↓</b><span>使用反馈 · 数据沉淀 · 迭代优化</span><i>↺</i></aside>'+
          '<div class="role-key"><span class="creator"><i></i>橙色＝创作生产</span><span class="user"><i></i>蓝色＝使用交付</span></div>';
      }
    })();
  </script>
`;

if (!html.includes("/* Report-specific vertical architecture diagrams */")) {
  html = html.replace("  </style>", `${css}\n  </style>`);
}
if (!html.includes('aria-label="自下而上的盈米 AI 系统关系图"')) {
  html = html.replace("</body>", `${script}\n</body>`);
}

await writeFile(target, html, "utf8");
console.log(`Customized ${target}`);
