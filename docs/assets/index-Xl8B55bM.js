(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const t of i)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function c(i){const t={};return i.integrity&&(t.integrity=i.integrity),i.referrerPolicy&&(t.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?t.credentials="include":i.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(i){if(i.ep)return;i.ep=!0;const t=c(i);fetch(i.href,t)}})();const x="clair-service-report-workbench-v1",L="clair-service-report-workbench-access",S=3,E={version:S,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let n=z(),k="",$="",w="",f="",b=null,O=0;function M(e){return JSON.parse(JSON.stringify(e))}function T(e=""){try{const a=new URL(e);a.hash="",a.search="";const c=decodeURI(a.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${a.origin}${c}`}catch{return String(e).trim().replace(/\/+$/,"/")}}function z(){try{const e=JSON.parse(localStorage.getItem(x));if(Array.isArray(e==null?void 0:e.groups)&&Array.isArray(e==null?void 0:e.reports))return j(e)}catch{}return M(E)}function j(e){const a=M(E),c=new Set(a.groups.map(s=>s.id)),r=new Set(["inbox","today","product","research"]),i=new Map(e.groups.map(s=>[s.id,s])),t=a.groups.map(s=>{const h=i.get(s.id);return!h||e.version<2?s:{...s,name:h.name||s.name,description:h.description||s.description,position:Number.isFinite(h.position)?h.position:s.position}});e.groups.filter(s=>!c.has(s.id)&&!r.has(s.id)).forEach((s,h)=>{t.push({...s,description:s.description||"自定义工作分组",position:E.groups.length+h})}),t.sort((s,h)=>(s.position||0)-(h.position||0));const o={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},p={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},m=e.reports.map(s=>({...s,groupId:o[s.id]||p[s.groupId]||s.groupId||"inbox"})),l=new Map(m.map(s=>[s.id,s])),u=new Map(m.map(s=>[T(s.url),s])),I=new Set,P=a.reports.map(s=>{const h=T(s.url);I.add(h);const A=l.get(s.id)||u.get(h);return A?{...s,title:A.title||s.title,groupId:t.some(G=>G.id===A.groupId)?A.groupId:s.groupId,pinned:!!A.pinned,position:Number.isFinite(A.position)?A.position:s.position}:s});m.forEach(s=>{const h=T(s.url);I.has(h)||(I.add(h),P.push(s))});const Z={version:S,groups:t,reports:P};return localStorage.setItem(x,JSON.stringify(Z)),Z}function y(){n.version=S,n.groups.forEach((e,a)=>{e.position=a}),localStorage.setItem(x,JSON.stringify(n))}function D(e,a){const c=n.groups.findIndex(t=>t.id===e),r=n.groups.findIndex(t=>t.id===a);if(c<0||r<0||c===r)return!1;const[i]=n.groups.splice(c,1);return n.groups.splice(r,0,i),y(),!0}function C(e){var a;return`${e}-${((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`}`}function d(e=""){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function q(e){try{return new URL(e).hostname.replace(/^www\./,"")}catch{return e}}function F(e){return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric"}).format(new Date(e))}function U(e){try{return["http:","https:"].includes(new URL(e).protocol)}catch{return!1}}function v(e){var c;(c=document.querySelector(".toast"))==null||c.remove();const a=document.createElement("div");a.className="toast",a.setAttribute("role","status"),a.textContent=e,document.body.append(a),clearTimeout(O),O=window.setTimeout(()=>a.remove(),2600)}function R(e,a=!1){const c=e.access==="org"?"需组织登录":e.access==="account"?"需账号登录":"生产可访问";return`
    <article class="report-card ${a?"pinned-card":""}" draggable="true" data-report-id="${d(e.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${d(e.id)}">
        <span class="report-icon">${d(e.title.slice(0,1))}</span>
        <span class="report-copy">
          <strong>${d(e.title)}</strong>
          <span>${d(q(e.url))}</span>
        </span>
        <span class="open-arrow" aria-hidden="true">↗</span>
      </button>
      <div class="card-meta">
        <span>${d(F(e.createdAt))}</span>
        <span class="source-badge">${d(e.source||"手动添加")}</span>
        <span class="access-badge ${e.access!=="production"?"access-org":""}">${c}</span>
        <span class="drag-hint" title="拖动到其他分组">⠿ 拖动</span>
        <a class="external-link" href="${d(e.url)}" target="_blank" rel="noreferrer" title="在新窗口打开">新窗口 ↗</a>
        <div class="card-actions">
          <button type="button" data-action="pin" data-id="${d(e.id)}" title="${e.pinned?"取消置顶":"置顶"}">${e.pinned?"★":"☆"}</button>
          <button type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${d(e.id)}">删除</button>
        </div>
      </div>
    </article>`}function B(){var c;if(!b)return"";if(b.type==="group")return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div><span class="section-kicker">NEW COLLECTION</span><h2>新增分组</h2></div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>分组名称
            <input name="name" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>分组说明
            <input name="description" placeholder="这个分组主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">创建分组</button>
          </div>
        </form>
      </div>`;const e=b.mode==="edit"?n.reports.find(r=>r.id===b.reportId):null,a=(e==null?void 0:e.groupId)||b.groupId||((c=n.groups[0])==null?void 0:c.id)||"";return`
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${e?"EDIT REPORT":"NEW REPORT"}</span>
            <h2>${e?"编辑服务报告":"新增服务报告"}</h2>
          </div>
          <button type="button" data-action="close-modal">×</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${d((e==null?void 0:e.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${e?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${d((e==null?void 0:e.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${n.groups.map(r=>`<option value="${d(r.id)}" ${r.id===a?"selected":""}>${d(r.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function K(){return`
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · PERSONAL WORKSPACE</span>
        <h1>Clair的工作台</h1>
        <p>产品方案、服务报告、投研结论与知识资产，一个入口持续管理。</p>
        <form class="login-form" id="login-form">
          <label for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入口令" autofocus />
            <button type="submit" class="primary-button">进入工作台</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>免平台登录</span><span>当前浏览器保存</span></div>
      </section>
    </main>`}function H(e){return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${d(e.title)}</strong>
          <span>${d(q(e.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="quiet-button" href="${d(e.url)}" target="_blank" rel="noreferrer">新窗口 ↗</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
        </div>
      </header>
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${d(e.title)}" src="${d(e.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>
      ${B()}
    </main>`}function J(){const e=k.trim().toLowerCase(),a=e?n.reports.filter(t=>`${t.title} ${t.url} ${t.source||""} ${t.access||""}`.toLowerCase().includes(e)):n.reports,c=a.filter(t=>t.pinned).sort((t,o)=>new Date(o.createdAt)-new Date(t.createdAt)),r=n.reports.filter(t=>t.access==="production").length,i=n.reports.filter(t=>t.access!=="production").length;return`
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark small">C</div>
          <div><strong>Clair的工作台</strong><span>Product · AI · Wealth</span></div>
        </div>
        <label class="search"><span aria-hidden="true">⌕</span>
          <input id="search-input" value="${d(k)}" placeholder="搜索报告名称或网址" aria-label="搜索报告" />
          ${k?'<button type="button" data-action="clear-search">清除</button>':""}
        </label>
        <div class="top-actions">
          <button class="quiet-button desktop-only" type="button" data-action="lock">锁定</button>
          <button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span>新增报告</button>
        </div>
      </header>
      <section class="workspace">
        <div class="hero-row">
          <div><span class="eyebrow">PRODUCTION CATALOG · VERIFIED 2026-07-29</span><h1>把每天的产品判断，<br />沉淀成工作资产。</h1><p>已整合且慢产品研究库与最近一个月的生产产出；重复版本、失效页面和仅本地草稿未进入主清单。</p></div>
          <div class="metrics">
            <div><strong>${n.reports.length}</strong><span>整理后产出</span></div>
            <div><strong>${r}</strong><span>生产可访问</span></div>
            <div><strong>${i}</strong><span>需账号权限</span></div>
          </div>
        </div>
        ${c.length?`
          <section class="pinned-section">
            <div class="section-heading"><div><span class="section-kicker">PINNED</span><h2>置顶服务</h2></div><span>${c.length} 个常用入口</span></div>
            <div class="pinned-grid">${c.map(t=>R(t,!0)).join("")}</div>
          </section>`:""}
        <section class="groups-section">
          <div class="section-heading"><div><span class="section-kicker">ROLE-BASED COLLECTIONS</span><h2>我的工作分组</h2></div><button class="text-button" type="button" data-action="add-group">＋ 新增分组</button></div>
          <div class="board">
            ${n.groups.map(t=>{const o=a.filter(p=>p.groupId===t.id).sort((p,m)=>(p.position||0)-(m.position||0));return`
                <section class="group-column accent-${d(t.accent)}" data-group-id="${d(t.id)}">
                  <header class="group-header" draggable="true" data-group-drag-id="${d(t.id)}">
                    <div class="group-heading-copy">
                      <span class="accent-dot"></span>
                      <div><h3>${d(t.name)}</h3><small>${d(t.description||"自定义工作分组")}</small></div>
                      <span class="count">${o.length}</span>
                    </div>
                    <div class="group-header-actions">
                      <button class="group-drag-handle" type="button" data-group-drag-id="${d(t.id)}" title="拖动分组排序" aria-label="拖动分组：${d(t.name)}">⠿</button>
                      <div class="group-menu">
                        <button type="button" data-action="rename-group" data-id="${d(t.id)}">改名</button>
                        ${t.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${d(t.id)}">删除</button>`:""}
                      </div>
                    </div>
                  </header>
                  <div class="group-cards">
                    ${o.map(p=>R(p)).join("")}
                    ${o.length?`<button type="button" class="add-inline" data-action="add-to-group" data-id="${d(t.id)}">＋ 添加到此分组</button>`:`<button type="button" class="empty-drop" data-action="add-to-group" data-id="${d(t.id)}"><span>拖报告到这里</span><small>或点击新增</small></button>`}
                  </div>
                </section>`}).join("")}
            <button type="button" class="new-group-card" data-action="add-group"><span>＋</span><strong>新增分组</strong><small>让报告按你的方式归位</small></button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR WORKSPACE · GITHUB PAGES</span><span>自动保存到当前浏览器</span></footer>
      ${B()}
    </main>`}function g(){const e=document.getElementById("app");if(sessionStorage.getItem(L)!=="ok"){e.innerHTML=K(),W();return}const a=$&&n.reports.find(c=>c.id===$);e.innerHTML=a?H(a):J(),_()}function W(){const e=document.getElementById("login-form");e==null||e.addEventListener("submit",a=>{if(a.preventDefault(),new FormData(e).get("password")!=="2026"){const r=e.querySelector(".form-error");r.hidden=!1,r.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(L,"ok"),g()})}async function N(e){var o,p;const a=e.elements.url,c=e.elements.title,r=e.querySelector('[data-action="detect-title"]'),i=e.querySelector(".field-hint"),t=a.value.trim();if(!U(t))return i.textContent="请输入完整的 http 或 https 网址","";r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>',i.textContent="正在读取网页标题…";try{const m=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,l=await fetch(m,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!l.ok)throw new Error("read failed");const u=await l.json(),I=((p=(o=u==null?void 0:u.data)==null?void 0:o.title)==null?void 0:p.trim())||q(t);return c.value=I.slice(0,180),i.textContent="已识别网页标题",c.value}catch{const m=q(t);return c.value||(c.value=m),i.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",c.value}finally{r.disabled=!1,r.textContent="识别标题"}}function _(){var c;(c=document.getElementById("search-input"))==null||c.addEventListener("input",r=>{k=r.target.value,g();const i=document.getElementById("search-input");i==null||i.focus(),i==null||i.setSelectionRange(k.length,k.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async i=>{var p,m;const t=i.currentTarget.dataset.action,o=i.currentTarget.dataset.id;if(t==="open")$=o,g();else if(t==="back")$="",b=null,g();else if(t==="lock")sessionStorage.removeItem(L),g();else if(t==="clear-search")k="",g();else if(t==="add-report")b={type:"report",mode:"create",groupId:((p=n.groups[1])==null?void 0:p.id)||((m=n.groups[0])==null?void 0:m.id)},g();else if(t==="add-to-group")b={type:"report",mode:"create",groupId:o},g();else if(t==="edit")b={type:"report",mode:"edit",reportId:o},g();else if(t==="close-modal")b=null,g();else if(t==="detect-title")await N(i.currentTarget.closest("form"));else if(t==="pin"){const l=n.reports.find(u=>u.id===o);l&&(l.pinned=!l.pinned),y(),g(),v(l!=null&&l.pinned?"报告已置顶":"已取消置顶")}else if(t==="delete"){const l=n.reports.find(u=>u.id===o);l&&confirm(`确定删除“${l.title}”吗？此操作不可撤销。`)&&(n.reports=n.reports.filter(u=>u.id!==o),$===o&&($=""),y(),g(),v("报告已删除"))}else if(t==="add-group")b={type:"group"},g();else if(t==="rename-group"){const l=n.groups.find(I=>I.id===o),u=l&&prompt("新的分组名称",l.name);u!=null&&u.trim()&&(l.name=u.trim().slice(0,60),y(),g(),v("分组名称已更新"))}else if(t==="delete-group"){const l=n.groups.find(u=>u.id===o);l&&confirm(`删除“${l.name}”？其中的报告会移到“待整理”。`)&&(n.reports.forEach(u=>{u.groupId===o&&(u.groupId="inbox")}),n.groups=n.groups.filter(u=>u.id!==o),y(),g(),v("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(r=>{r.addEventListener("dragstart",i=>{w=r.dataset.reportId,f="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",w),r.classList.add("is-dragging")}),r.addEventListener("dragend",()=>{w="",r.classList.remove("is-dragging")})}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const i=()=>{var t;f="",(t=r.closest(".group-column"))==null||t.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(o=>{o.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",t=>{var o,p;t.preventDefault(),f=r.dataset.groupDragId,w="",(o=r.setPointerCapture)==null||o.call(r,t.pointerId),(p=r.closest(".group-column"))==null||p.classList.add("is-group-dragging")}),r.addEventListener("pointermove",t=>{f&&document.querySelectorAll(".group-column").forEach(o=>{var p;o.classList.toggle("is-group-drop-target",o===((p=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:p.closest(".group-column")))})}),r.addEventListener("pointerup",t=>{var m;if(!f)return;const o=f,p=(m=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:m.closest(".group-column");if(p&&D(o,p.dataset.groupId)){f="",g(),v("分组顺序已更新");return}i()}),r.addEventListener("pointercancel",i)}),document.querySelectorAll(".group-header").forEach(r=>{r.addEventListener("dragstart",i=>{var t;f=r.dataset.groupDragId,w="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",f),(t=r.closest(".group-column"))==null||t.classList.add("is-group-dragging")}),r.addEventListener("dragend",()=>{var i;f="",(i=r.closest(".group-column"))==null||i.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(t=>{t.classList.remove("is-group-drop-target","is-drop-ready")})})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",i=>{i.preventDefault(),r.classList.add(f?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",i=>{if(i.preventDefault(),f){if(D(f,r.dataset.groupId)){f="",g(),v("分组顺序已更新");return}f="",r.classList.remove("is-group-drop-target");return}const t=n.reports.find(o=>o.id===w);t&&(t.groupId=r.dataset.groupId,t.position=Math.max(-1,...n.reports.filter(o=>o.groupId===t.groupId).map(o=>o.position||0))+1,y(),g(),v("已移入新分组")),w=""})});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",r=>{var o,p;r.preventDefault();const i=(o=new FormData(e).get("name"))==null?void 0:o.trim(),t=(p=new FormData(e).get("description"))==null?void 0:p.trim();i&&(n.groups.push({id:C("group"),name:i.slice(0,60),description:(t==null?void 0:t.slice(0,80))||"自定义工作分组",accent:["blue","violet","amber","green"][n.groups.length%4],position:n.groups.length}),y(),b=null,g(),v("分组已新增"))});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async r=>{r.preventDefault();const i=a.elements.url.value.trim();if(!U(i))return;const t=a.querySelector('button[type="submit"]');t.disabled=!0,t.innerHTML='<span class="mini-spinner"></span>';let o=a.elements.title.value.trim();o||(o=await N(a));const p=a.elements.groupId.value;if(b.mode==="edit"){const m=n.reports.find(l=>l.id===b.reportId);Object.assign(m,{title:o,url:i,groupId:p})}else n.reports.push({id:C("report"),groupId:p,title:o||q(i),url:i,pinned:!1,position:n.reports.filter(m=>m.groupId===p).length,createdAt:new Date().toISOString()});y(),b=null,g(),v("报告已保存")})}function V(){g()}V(document.getElementById("app"));
