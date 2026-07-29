(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const t of o)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function c(o){const t={};return o.integrity&&(t.integrity=o.integrity),o.referrerPolicy&&(t.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?t.credentials="include":o.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(o){if(o.ep)return;o.ep=!0;const t=c(o);fetch(o.href,t)}})();const Z="clair-service-report-workbench-v1",D="clair-service-report-workbench-access",C=3,T={version:C,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let n=z(),w="",k="",I="",h="",b=null,N=0;function M(e){return JSON.parse(JSON.stringify(e))}function L(e=""){try{const i=new URL(e);i.hash="",i.search="";const c=decodeURI(i.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${i.origin}${c}`}catch{return String(e).trim().replace(/\/+$/,"/")}}function z(){try{const e=JSON.parse(localStorage.getItem(Z));if(Array.isArray(e==null?void 0:e.groups)&&Array.isArray(e==null?void 0:e.reports))return j(e)}catch{}return M(T)}function j(e){const i=M(T),c=new Set(i.groups.map(s=>s.id)),r=new Set(["inbox","today","product","research"]),o=new Map(e.groups.map(s=>[s.id,s])),t=i.groups.map(s=>{const f=o.get(s.id);return!f||e.version<2?s:{...s,name:f.name||s.name,description:f.description||s.description,position:Number.isFinite(f.position)?f.position:s.position}});e.groups.filter(s=>!c.has(s.id)&&!r.has(s.id)).forEach((s,f)=>{t.push({...s,description:s.description||"自定义工作分组",position:T.groups.length+f})});const a=t.filter((s,f,v)=>v.findIndex(x=>x.id===s.id)===f);a.sort((s,f)=>(s.position||0)-(f.position||0));const p={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},m={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},u=e.reports.map(s=>({...s,groupId:p[s.id]||m[s.groupId]||s.groupId||"inbox"})),l=new Map(u.map(s=>[s.id,s])),$=new Map(u.map(s=>[L(s.url),s])),S=new Set,O=i.reports.map(s=>{const f=L(s.url);S.add(f);const v=l.get(s.id)||$.get(f);return v?{...s,title:v.title||s.title,groupId:a.some(x=>x.id===v.groupId)?v.groupId:s.groupId,pinned:!!v.pinned,position:Number.isFinite(v.position)?v.position:s.position}:s});u.forEach(s=>{const f=L(s.url);S.has(f)||(S.add(f),O.push(s))});const P={version:C,groups:a,reports:O};return localStorage.setItem(Z,JSON.stringify(P)),P}function A(){n.version=C,n.groups.forEach((e,i)=>{e.position=i}),localStorage.setItem(Z,JSON.stringify(n))}function E(e,i){const c=n.groups.findIndex(t=>t.id===e),r=n.groups.findIndex(t=>t.id===i);if(c<0||r<0||c===r)return!1;const[o]=n.groups.splice(c,1);return n.groups.splice(r,0,o),A(),!0}function R(e){var i;return`${e}-${((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`}`}function d(e=""){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function q(e){try{return new URL(e).hostname.replace(/^www\./,"")}catch{return e}}function G(e){try{return["http:","https:"].includes(new URL(e).protocol)}catch{return!1}}function y(e){var c;(c=document.querySelector(".toast"))==null||c.remove();const i=document.createElement("div");i.className="toast",i.setAttribute("role","status"),i.textContent=e,document.body.append(i),clearTimeout(N),N=window.setTimeout(()=>i.remove(),2600)}function F(e){const i=e.access!=="production",c=e.access==="org"?"需组织登录":e.access==="account"?"需账号登录":"生产可访问",o=!i&&T.reports.some(t=>t.id===e.id)?`<img src="./previews/${d(e.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${i?"preview-restricted":""}">
        <span>${i?"ACCESS":d(e.title.slice(0,2))}</span>
        <strong>${i?c:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${i?"restricted-card":""}" draggable="true" data-report-id="${d(e.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${d(e.id)}">
        <span class="report-preview">
          ${o}
        </span>
        <span class="report-copy">
          <span class="report-source">${d(e.source||"手动添加")}</span>
          <strong>${d(e.title)}</strong>
          <span class="report-open-label">${i?"登录后查看":"查看完整报告"}</span>
        </span>
      </button>
      <div class="card-actions">
        <button type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
        <button type="button" data-action="delete" data-id="${d(e.id)}">删除</button>
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
      </div>`;const e=b.mode==="edit"?n.reports.find(r=>r.id===b.reportId):null,i=(e==null?void 0:e.groupId)||b.groupId||((c=n.groups[0])==null?void 0:c.id)||"";return`
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
            ${n.groups.map(r=>`<option value="${d(r.id)}" ${r.id===i?"selected":""}>${d(r.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function H(){return`
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · DECISION LIBRARY</span>
        <h1>Clair AI Studio</h1>
        <p>把分散的产品研究、AI 实践与投研成果，整理成可预览、可检索、可复用的决策资产。</p>
        <form class="login-form" id="login-form">
          <label for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入口令" autofocus />
            <button type="submit" class="primary-button">进入 Studio</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>免平台登录</span><span>当前浏览器保存</span></div>
      </section>
    </main>`}function J(e){const i=e.access!=="production",c=e.access==="org"?"组织账号":"站点账号",r=i?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${e.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${c}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${c}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${d(e.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${d(q(e.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${d(e.title)}" src="${d(e.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${d(e.title)}</strong>
          <span>${d(q(e.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${i?"primary-button":"quiet-button"}" href="${d(e.url)}" target="_blank" rel="noreferrer">${i?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
        </div>
      </header>
      ${r}
      ${B()}
    </main>`}function K(){const e=w.trim().toLowerCase(),i=e?n.reports.filter(t=>`${t.title} ${t.url} ${t.source||""} ${t.access||""}`.toLowerCase().includes(e)):n.reports,c=n.reports.filter(t=>t.access==="production").length,r=n.reports.filter(t=>t.access!=="production").length,o=n.groups.map(t=>({...t,reports:i.filter(a=>a.groupId===t.id).sort((a,p)=>(a.position||0)-(p.position||0))})).filter(t=>t.reports.length);return`
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark small">C</div>
          <div><strong>Clair AI Studio</strong><span>Decision Library</span></div>
        </div>
        <label class="search">
          <input id="search-input" value="${d(w)}" placeholder="搜索报告" aria-label="搜索报告" />
          ${w?'<button type="button" data-action="clear-search">清除</button>':""}
        </label>
        <div class="top-actions">
          <button class="quiet-button desktop-only" type="button" data-action="add-group">新增主题</button>
          <button class="primary-button" type="button" data-action="add-report">新增报告</button>
        </div>
      </header>
      <section class="workspace">
        <div class="hero-row">
          <div class="hero-copy">
            <span class="eyebrow">CLAIR AI STUDIO · PRODUCTION ARCHIVE</span>
            <h1>把分散的研究，<br />变成可复用的决策资产。</h1>
            <p>围绕产品、AI、投研与经营，按主题归档已发布成果。先看关键画面，再进入完整报告；需要权限的内容也有明确登录路径。</p>
          </div>
          <div class="studio-summary" aria-label="报告统计">
            <strong>${n.reports.length}</strong>
            <span>份成果</span>
            <i></i>
            <strong>${o.length}</strong>
            <span>个主题</span>
            <i></i>
            <strong>${c}</strong>
            <span>可直接访问</span>
          </div>
        </div>
        <section class="groups-section">
          ${o.length?`
            <nav class="topic-nav" aria-label="报告主题">
              ${o.map(t=>`<a href="#topic-${d(t.id)}">${d(t.name)}<span>${t.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${o.map((t,a)=>`
                <section id="topic-${d(t.id)}" class="group-column topic-section accent-${d(t.accent)}" data-group-id="${d(t.id)}">
                  <header class="group-header">
                    <div class="topic-number">${String(a+1).padStart(2,"0")}</div>
                    <div class="group-heading-copy">
                      <div><h2>${d(t.name)}</h2><p>${d(t.description||"自定义工作主题")}</p></div>
                      <span class="count">${t.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      <button type="button" data-action="add-to-group" data-id="${d(t.id)}">添加</button>
                      <button type="button" data-action="rename-group" data-id="${d(t.id)}">改名</button>
                      ${t.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${d(t.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">${t.reports.map(p=>F(p)).join("")}</div>
                </section>`).join("")}
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${r} 份报告需要组织或账号登录</span>
            <button type="button" data-action="lock">退出工作台</button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${B()}
    </main>`}function g(){const e=document.getElementById("app");if(sessionStorage.getItem(D)!=="ok"){e.innerHTML=H(),Y();return}const i=k&&n.reports.find(c=>c.id===k);e.innerHTML=i?J(i):K(),_()}function Y(){const e=document.getElementById("login-form");e==null||e.addEventListener("submit",i=>{if(i.preventDefault(),new FormData(e).get("password")!=="2026"){const r=e.querySelector(".form-error");r.hidden=!1,r.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(D,"ok"),g()})}async function U(e){var a,p;const i=e.elements.url,c=e.elements.title,r=e.querySelector('[data-action="detect-title"]'),o=e.querySelector(".field-hint"),t=i.value.trim();if(!G(t))return o.textContent="请输入完整的 http 或 https 网址","";r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>',o.textContent="正在读取网页标题…";try{const m=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,u=await fetch(m,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!u.ok)throw new Error("read failed");const l=await u.json(),$=((p=(a=l==null?void 0:l.data)==null?void 0:a.title)==null?void 0:p.trim())||q(t);return c.value=$.slice(0,180),o.textContent="已识别网页标题",c.value}catch{const m=q(t);return c.value||(c.value=m),o.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",c.value}finally{r.disabled=!1,r.textContent="识别标题"}}function _(){var c;(c=document.getElementById("search-input"))==null||c.addEventListener("input",r=>{w=r.target.value,g();const o=document.getElementById("search-input");o==null||o.focus(),o==null||o.setSelectionRange(w.length,w.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async o=>{var p,m;const t=o.currentTarget.dataset.action,a=o.currentTarget.dataset.id;if(t==="open")k=a,g();else if(t==="back")k="",b=null,g();else if(t==="lock")sessionStorage.removeItem(D),g();else if(t==="clear-search")w="",g();else if(t==="add-report")b={type:"report",mode:"create",groupId:((p=n.groups[1])==null?void 0:p.id)||((m=n.groups[0])==null?void 0:m.id)},g();else if(t==="add-to-group")b={type:"report",mode:"create",groupId:a},g();else if(t==="edit")b={type:"report",mode:"edit",reportId:a},g();else if(t==="close-modal")b=null,g();else if(t==="detect-title")await U(o.currentTarget.closest("form"));else if(t==="delete"){const u=n.reports.find(l=>l.id===a);u&&confirm(`确定删除“${u.title}”吗？此操作不可撤销。`)&&(n.reports=n.reports.filter(l=>l.id!==a),k===a&&(k=""),A(),g(),y("报告已删除"))}else if(t==="add-group")b={type:"group"},g();else if(t==="rename-group"){const u=n.groups.find($=>$.id===a),l=u&&prompt("新的分组名称",u.name);l!=null&&l.trim()&&(u.name=l.trim().slice(0,60),A(),g(),y("分组名称已更新"))}else if(t==="delete-group"){const u=n.groups.find(l=>l.id===a);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(n.reports.forEach(l=>{l.groupId===a&&(l.groupId="inbox")}),n.groups=n.groups.filter(l=>l.id!==a),A(),g(),y("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(r=>{r.addEventListener("dragstart",o=>{I=r.dataset.reportId,h="",o.dataTransfer.effectAllowed="move",o.dataTransfer.setData("text/plain",I),r.classList.add("is-dragging")}),r.addEventListener("dragend",()=>{I="",r.classList.remove("is-dragging")})}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const o=()=>{var t;h="",(t=r.closest(".group-column"))==null||t.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(a=>{a.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",t=>{var a,p;t.pointerType!=="mouse"&&(t.preventDefault(),h=r.dataset.groupDragId,I="",(a=r.setPointerCapture)==null||a.call(r,t.pointerId),(p=r.closest(".group-column"))==null||p.classList.add("is-group-dragging"))}),r.addEventListener("pointermove",t=>{t.pointerType!=="mouse"&&h&&document.querySelectorAll(".group-column").forEach(a=>{var p;a.classList.toggle("is-group-drop-target",a===((p=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:p.closest(".group-column")))})}),r.addEventListener("pointerup",t=>{var m;if(t.pointerType==="mouse"||!h)return;const a=h,p=(m=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:m.closest(".group-column");if(p&&E(a,p.dataset.groupId)){h="",g(),y("分组顺序已更新");return}o()}),r.addEventListener("pointercancel",o),r.addEventListener("keydown",t=>{var u;if(!["ArrowLeft","ArrowRight"].includes(t.key))return;t.preventDefault();const a=n.groups.findIndex(l=>l.id===r.dataset.groupDragId),p=t.key==="ArrowLeft"?a-1:a+1,m=n.groups[p];!m||!E(r.dataset.groupDragId,m.id)||(g(),y("分组顺序已更新"),(u=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||u.focus())})}),document.querySelectorAll(".group-header").forEach(r=>{r.addEventListener("dragstart",o=>{var t;h=r.dataset.groupDragId,I="",o.dataTransfer.effectAllowed="move",o.dataTransfer.setData("text/plain",h),(t=r.closest(".group-column"))==null||t.classList.add("is-group-dragging")}),r.addEventListener("dragend",()=>{var o;h="",(o=r.closest(".group-column"))==null||o.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(t=>{t.classList.remove("is-group-drop-target","is-drop-ready")})})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",o=>{o.preventDefault(),r.classList.add(h?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",o=>{if(o.preventDefault(),h){if(E(h,r.dataset.groupId)){h="",g(),y("分组顺序已更新");return}h="",r.classList.remove("is-group-drop-target");return}const t=n.reports.find(a=>a.id===I);t&&(t.groupId=r.dataset.groupId,t.position=Math.max(-1,...n.reports.filter(a=>a.groupId===t.groupId).map(a=>a.position||0))+1,A(),g(),y("已移入新分组")),I=""})});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",r=>{var a,p;r.preventDefault();const o=(a=new FormData(e).get("name"))==null?void 0:a.trim(),t=(p=new FormData(e).get("description"))==null?void 0:p.trim();o&&(n.groups.push({id:R("group"),name:o.slice(0,60),description:(t==null?void 0:t.slice(0,80))||"自定义工作分组",accent:["blue","violet","amber","green"][n.groups.length%4],position:n.groups.length}),A(),b=null,g(),y("分组已新增"))});const i=document.getElementById("report-form");i==null||i.addEventListener("submit",async r=>{r.preventDefault();const o=i.elements.url.value.trim();if(!G(o))return;const t=i.querySelector('button[type="submit"]');t.disabled=!0,t.innerHTML='<span class="mini-spinner"></span>';let a=i.elements.title.value.trim();a||(a=await U(i));const p=i.elements.groupId.value;if(b.mode==="edit"){const m=n.reports.find(u=>u.id===b.reportId);Object.assign(m,{title:a,url:o,groupId:p})}else n.reports.push({id:R("report"),groupId:p,title:a||q(o),url:o,pinned:!1,position:n.reports.filter(m=>m.groupId===p).length,createdAt:new Date().toISOString()});A(),b=null,g(),y("报告已保存")})}function V(){g()}V(document.getElementById("app"));
