(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const e of i)if(e.type==="childList")for(const s of e.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function n(i){const e={};return i.integrity&&(e.integrity=i.integrity),i.referrerPolicy&&(e.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?e.credentials="include":i.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function r(i){if(i.ep)return;i.ep=!0;const e=n(i);fetch(i.href,e)}})();const D="clair-service-report-workbench-v1",Z="clair-service-report-workbench-access",O=4,S={version:O,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let d=H(),f="",$="",w=!1,k="",b="",v=null,M=0;function B(t){return JSON.parse(JSON.stringify(t))}function x(t=""){try{const o=new URL(t);o.hash="",o.search="";const n=decodeURI(o.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${o.origin}${n}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function H(){try{const t=JSON.parse(localStorage.getItem(D));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return J(t)}catch{}return B(S)}function J(t){const o=B(S),n=new Set(o.groups.map(c=>c.id)),r=new Set(["inbox","today","product","research"]),i=new Map(t.groups.map(c=>[c.id,c])),e=o.groups.map(c=>{const h=i.get(c.id);return!h||t.version<2?c:{...c,name:h.name||c.name,description:h.description||c.description,position:Number.isFinite(h.position)?h.position:c.position}});t.groups.filter(c=>!n.has(c.id)&&!r.has(c.id)).forEach((c,h)=>{e.push({...c,description:c.description||"自定义工作分组",position:S.groups.length+h})});const s=e.filter((c,h,y)=>y.findIndex(E=>E.id===c.id)===h);s.sort((c,h)=>(c.position||0)-(h.position||0));const a={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},m={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},l=t.reports.map(c=>({...c,groupId:a[c.id]||m[c.groupId]||c.groupId||"inbox"})),u=new Map(l.map(c=>[c.id,c])),q=new Map(l.map(c=>[x(c.url),c])),L=new Set,R=o.reports.map(c=>{const h=x(c.url);L.add(h);const y=u.get(c.id)||q.get(h);return y?{...c,title:y.title||c.title,groupId:s.some(E=>E.id===y.groupId)?y.groupId:c.groupId,pinned:!!y.pinned,position:Number.isFinite(y.position)?y.position:c.position,archived:!!y.archived,archivedAt:y.archivedAt||""}:c});l.forEach(c=>{const h=x(c.url);L.has(h)||(L.add(h),R.push(c))});const N={version:O,groups:s,reports:R};return localStorage.setItem(D,JSON.stringify(N)),N}function A(){d.version=O,d.groups.forEach((t,o)=>{t.position=o}),localStorage.setItem(D,JSON.stringify(d))}function C(t,o){const n=d.groups.findIndex(e=>e.id===t),r=d.groups.findIndex(e=>e.id===o);if(n<0||r<0||n===r)return!1;const[i]=d.groups.splice(n,1);return d.groups.splice(r,0,i),A(),!0}function U(t){var o;return`${t}-${((o=crypto.randomUUID)==null?void 0:o.call(crypto))||`${Date.now()}-${Math.random()}`}`}function p(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function T(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function z(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function I(t){var n;(n=document.querySelector(".toast"))==null||n.remove();const o=document.createElement("div");o.className="toast",o.setAttribute("role","status"),o.textContent=t,document.body.append(o),clearTimeout(M),M=window.setTimeout(()=>o.remove(),2600)}function j(t,o=!1){const n=t.access!=="production",r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",e=!n&&S.reports.some(s=>s.id===t.id)?`<img src="./previews/${p(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${n?"preview-restricted":""}">
        <span>${n?"ACCESS":p(t.title.slice(0,2))}</span>
        <strong>${n?r:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${n?"restricted-card":""} ${o?"archived-card":""}" draggable="${o?"false":"true"}" data-report-id="${p(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${p(t.id)}">
        <span class="report-preview">
          ${e}
        </span>
        <span class="report-copy">
          <span class="report-source">${p(t.source||"手动添加")}</span>
          <strong>${p(t.title)}</strong>
          <span class="report-open-label">${o?"查看归档内容":n?"登录后查看":"查看完整报告"}</span>
        </span>
      </button>
      <div class="card-actions">
        ${o?`
            <button type="button" data-action="restore" data-id="${p(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${p(t.id)}">永久删除</button>`:`
            <button type="button" data-action="edit" data-id="${p(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${p(t.id)}">归档</button>`}
      </div>
    </article>`}function P(){var n;if(!v)return"";if(v.type==="group")return`
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
      </div>`;const t=v.mode==="edit"?d.reports.find(r=>r.id===v.reportId):null,o=(t==null?void 0:t.groupId)||v.groupId||((n=d.groups[0])==null?void 0:n.id)||"";return`
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${t?"EDIT REPORT":"NEW REPORT"}</span>
            <h2>${t?"编辑服务报告":"新增服务报告"}</h2>
          </div>
          <button type="button" data-action="close-modal">×</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${p((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${p((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${d.groups.map(r=>`<option value="${p(r.id)}" ${r.id===o?"selected":""}>${p(r.name)}</option>`).join("")}
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
    </main>`}function V(t){const o=t.access!=="production",n=t.access==="org"?"组织账号":"站点账号",r=o?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${n}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${n}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${p(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${p(T(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${p(t.title)}" src="${p(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${p(t.title)}</strong>
          <span>${p(T(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${o?"primary-button":"quiet-button"}" href="${p(t.url)}" target="_blank" rel="noreferrer">${o?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${p(t.id)}">编辑</button>
        </div>
      </header>
      ${r}
      ${P()}
    </main>`}function F(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair AI Studio</strong><span>Decision Library</span></div>
      </div>
      <label class="search">
        <input id="search-input" value="${p(f)}" placeholder="${w?"搜索归档报告":"搜索报告"}" aria-label="${w?"搜索归档报告":"搜索报告"}" />
        ${f?'<button type="button" data-action="clear-search">清除</button>':""}
      </label>
      <div class="top-actions">
        <button class="quiet-button archive-nav-button" type="button" data-action="${w?"show-catalog":"show-archive"}">
          ${w?"返回主目录":`归档区${t?`<span>${t}</span>`:""}`}
        </button>
        ${w?"":'<button class="primary-button" type="button" data-action="add-report">新增报告</button>'}
      </div>
    </header>`}function Y(){const t=d.reports.filter(n=>n.archived).filter(n=>{if(!f.trim())return!0;const r=f.trim().toLowerCase();return`${n.title} ${n.url} ${n.source||""}`.toLowerCase().includes(r)}).sort((n,r)=>new Date(r.archivedAt||0)-new Date(n.archivedAt||0)),o=d.reports.filter(n=>n.archived).length;return`
    <main class="app-shell archive-shell">
      ${F(o)}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${o}</strong><span>份已归档</span></div>
        </div>
        ${t.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${f?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(n=>j(n,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${f?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${f?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${f?"clear-search":"show-catalog"}">${f?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Safe archive</span></footer>
      ${P()}
    </main>`}function _(){if(w)return Y();const t=f.trim().toLowerCase(),o=d.reports.filter(a=>!a.archived),n=t?o.filter(a=>`${a.title} ${a.url} ${a.source||""} ${a.access||""}`.toLowerCase().includes(t)):o,r=d.reports.filter(a=>a.archived).length,i=o.filter(a=>a.access==="production").length,e=o.filter(a=>a.access!=="production").length,s=d.groups.map(a=>({...a,reports:n.filter(m=>m.groupId===a.id).sort((m,l)=>(m.position||0)-(l.position||0))})).filter(a=>a.reports.length);return`
    <main class="app-shell">
      ${F(r)}
      <section class="workspace">
        <div class="hero-row">
          <div class="hero-copy">
            <span class="eyebrow">CLAIR AI STUDIO · PRODUCTION ARCHIVE</span>
            <h1>把分散的研究，<br />变成可复用的决策资产。</h1>
            <p>围绕产品、AI、投研与经营，按主题归档已发布成果。先看关键画面，再进入完整报告；需要权限的内容也有明确登录路径。</p>
          </div>
          <div class="studio-summary" aria-label="报告统计">
            <strong>${o.length}</strong>
            <span>份成果</span>
            <i></i>
            <strong>${s.length}</strong>
            <span>个主题</span>
            <i></i>
            <strong>${i}</strong>
            <span>可直接访问</span>
          </div>
        </div>
        <section class="groups-section">
          ${s.length?`
            <nav class="topic-nav" aria-label="报告主题">
              ${s.map(a=>`<a href="#topic-${p(a.id)}">${p(a.name)}<span>${a.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${s.map((a,m)=>`
                <section id="topic-${p(a.id)}" class="group-column topic-section accent-${p(a.accent)}" data-group-id="${p(a.id)}">
                  <header class="group-header">
                    <div class="topic-number">${String(m+1).padStart(2,"0")}</div>
                    <div class="group-heading-copy">
                      <div><h2>${p(a.name)}</h2><p>${p(a.description||"自定义工作主题")}</p></div>
                      <span class="count">${a.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      <button type="button" data-action="add-to-group" data-id="${p(a.id)}">添加</button>
                      <button type="button" data-action="rename-group" data-id="${p(a.id)}">改名</button>
                      ${a.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${p(a.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">${a.reports.map(l=>j(l)).join("")}</div>
                </section>`).join("")}
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${e} 份报告需要组织或账号登录${r?` · ${r} 份已安全归档`:""}</span>
            <div><button type="button" data-action="add-group">新增主题</button><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${P()}
    </main>`}function g(){const t=document.getElementById("app");if(sessionStorage.getItem(Z)!=="ok"){t.innerHTML=K(),X();return}const o=$&&d.reports.find(n=>n.id===$);t.innerHTML=o?V(o):_(),Q()}function X(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",o=>{if(o.preventDefault(),new FormData(t).get("password")!=="2026"){const r=t.querySelector(".form-error");r.hidden=!1,r.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(Z,"ok"),g()})}async function G(t){var s,a;const o=t.elements.url,n=t.elements.title,r=t.querySelector('[data-action="detect-title"]'),i=t.querySelector(".field-hint"),e=o.value.trim();if(!z(e))return i.textContent="请输入完整的 http 或 https 网址","";r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>',i.textContent="正在读取网页标题…";try{const m=`https://api.microlink.io/?url=${encodeURIComponent(e)}`,l=await fetch(m,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!l.ok)throw new Error("read failed");const u=await l.json(),q=((a=(s=u==null?void 0:u.data)==null?void 0:s.title)==null?void 0:a.trim())||T(e);return n.value=q.slice(0,180),i.textContent="已识别网页标题",n.value}catch{const m=T(e);return n.value||(n.value=m),i.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",n.value}finally{r.disabled=!1,r.textContent="识别标题"}}function Q(){var n;(n=document.getElementById("search-input"))==null||n.addEventListener("input",r=>{f=r.target.value,g();const i=document.getElementById("search-input");i==null||i.focus(),i==null||i.setSelectionRange(f.length,f.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async i=>{var a,m;const e=i.currentTarget.dataset.action,s=i.currentTarget.dataset.id;if(e==="open")$=s,g();else if(e==="back")$="",v=null,g();else if(e==="lock")sessionStorage.removeItem(Z),g();else if(e==="clear-search")f="",g();else if(e==="show-archive")w=!0,f="",$="",g();else if(e==="show-catalog")w=!1,f="",$="",g();else if(e==="add-report")v={type:"report",mode:"create",groupId:((a=d.groups[1])==null?void 0:a.id)||((m=d.groups[0])==null?void 0:m.id)},g();else if(e==="add-to-group")v={type:"report",mode:"create",groupId:s},g();else if(e==="edit")v={type:"report",mode:"edit",reportId:s},g();else if(e==="close-modal")v=null,g();else if(e==="detect-title")await G(i.currentTarget.closest("form"));else if(e==="archive"){const l=d.reports.find(u=>u.id===s);if(!l)return;l.archived=!0,l.archivedAt=new Date().toISOString(),A(),g(),I("已归档，可随时恢复")}else if(e==="restore"){const l=d.reports.find(u=>u.id===s);if(!l)return;l.archived=!1,l.archivedAt="",A(),g(),I("报告已恢复到原主题")}else if(e==="delete"){const l=d.reports.find(u=>u.id===s);l!=null&&l.archived&&confirm(`永久删除“${l.title}”？删除后无法从归档区恢复。`)&&(d.reports=d.reports.filter(u=>u.id!==s),$===s&&($=""),A(),g(),I("报告已永久删除"))}else if(e==="add-group")v={type:"group"},g();else if(e==="rename-group"){const l=d.groups.find(q=>q.id===s),u=l&&prompt("新的分组名称",l.name);u!=null&&u.trim()&&(l.name=u.trim().slice(0,60),A(),g(),I("分组名称已更新"))}else if(e==="delete-group"){const l=d.groups.find(u=>u.id===s);l&&confirm(`删除“${l.name}”？其中的报告会移到“待整理”。`)&&(d.reports.forEach(u=>{u.groupId===s&&(u.groupId="inbox")}),d.groups=d.groups.filter(u=>u.id!==s),A(),g(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(r=>{r.addEventListener("dragstart",i=>{k=r.dataset.reportId,b="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",k),r.classList.add("is-dragging")}),r.addEventListener("dragend",()=>{k="",r.classList.remove("is-dragging")})}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const i=()=>{var e;b="",(e=r.closest(".group-column"))==null||e.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(s=>{s.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",e=>{var s,a;e.pointerType!=="mouse"&&(e.preventDefault(),b=r.dataset.groupDragId,k="",(s=r.setPointerCapture)==null||s.call(r,e.pointerId),(a=r.closest(".group-column"))==null||a.classList.add("is-group-dragging"))}),r.addEventListener("pointermove",e=>{e.pointerType!=="mouse"&&b&&document.querySelectorAll(".group-column").forEach(s=>{var a;s.classList.toggle("is-group-drop-target",s===((a=document.elementFromPoint(e.clientX,e.clientY))==null?void 0:a.closest(".group-column")))})}),r.addEventListener("pointerup",e=>{var m;if(e.pointerType==="mouse"||!b)return;const s=b,a=(m=document.elementFromPoint(e.clientX,e.clientY))==null?void 0:m.closest(".group-column");if(a&&C(s,a.dataset.groupId)){b="",g(),I("分组顺序已更新");return}i()}),r.addEventListener("pointercancel",i),r.addEventListener("keydown",e=>{var l;if(!["ArrowLeft","ArrowRight"].includes(e.key))return;e.preventDefault();const s=d.groups.findIndex(u=>u.id===r.dataset.groupDragId),a=e.key==="ArrowLeft"?s-1:s+1,m=d.groups[a];!m||!C(r.dataset.groupDragId,m.id)||(g(),I("分组顺序已更新"),(l=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||l.focus())})}),document.querySelectorAll(".group-header").forEach(r=>{r.addEventListener("dragstart",i=>{var e;b=r.dataset.groupDragId,k="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",b),(e=r.closest(".group-column"))==null||e.classList.add("is-group-dragging")}),r.addEventListener("dragend",()=>{var i;b="",(i=r.closest(".group-column"))==null||i.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(e=>{e.classList.remove("is-group-drop-target","is-drop-ready")})})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",i=>{i.preventDefault(),r.classList.add(b?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",i=>{if(i.preventDefault(),b){if(C(b,r.dataset.groupId)){b="",g(),I("分组顺序已更新");return}b="",r.classList.remove("is-group-drop-target");return}const e=d.reports.find(s=>s.id===k);e&&(e.groupId=r.dataset.groupId,e.position=Math.max(-1,...d.reports.filter(s=>s.groupId===e.groupId).map(s=>s.position||0))+1,A(),g(),I("已移入新分组")),k=""})});const t=document.getElementById("group-form");t==null||t.addEventListener("submit",r=>{var s,a;r.preventDefault();const i=(s=new FormData(t).get("name"))==null?void 0:s.trim(),e=(a=new FormData(t).get("description"))==null?void 0:a.trim();i&&(d.groups.push({id:U("group"),name:i.slice(0,60),description:(e==null?void 0:e.slice(0,80))||"自定义工作分组",accent:["blue","violet","amber","green"][d.groups.length%4],position:d.groups.length}),A(),v=null,g(),I("分组已新增"))});const o=document.getElementById("report-form");o==null||o.addEventListener("submit",async r=>{r.preventDefault();const i=o.elements.url.value.trim();if(!z(i))return;const e=o.querySelector('button[type="submit"]');e.disabled=!0,e.innerHTML='<span class="mini-spinner"></span>';let s=o.elements.title.value.trim();s||(s=await G(o));const a=o.elements.groupId.value;if(v.mode==="edit"){const m=d.reports.find(l=>l.id===v.reportId);Object.assign(m,{title:s,url:i,groupId:a})}else d.reports.push({id:U("report"),groupId:a,title:s||T(i),url:i,pinned:!1,position:d.reports.filter(m=>m.groupId===a).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:""});A(),v=null,g(),I("报告已保存")})}function W(){g()}W(document.getElementById("app"));
