(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const t of i)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function n(i){const t={};return i.integrity&&(t.integrity=i.integrity),i.referrerPolicy&&(t.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?t.credentials="include":i.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(i){if(i.ep)return;i.ep=!0;const t=n(i);fetch(i.href,t)}})();const D="clair-service-report-workbench-v1",O="clair-service-report-workbench-access",Z=3,S={version:Z,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let c=j(),k="",w="",A="",h="",b=null,N=0;function G(e){return JSON.parse(JSON.stringify(e))}function x(e=""){try{const a=new URL(e);a.hash="",a.search="";const n=decodeURI(a.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${a.origin}${n}`}catch{return String(e).trim().replace(/\/+$/,"/")}}function j(){try{const e=JSON.parse(localStorage.getItem(D));if(Array.isArray(e==null?void 0:e.groups)&&Array.isArray(e==null?void 0:e.reports))return F(e)}catch{}return G(S)}function F(e){const a=G(S),n=new Set(a.groups.map(s=>s.id)),r=new Set(["inbox","today","product","research"]),i=new Map(e.groups.map(s=>[s.id,s])),t=a.groups.map(s=>{const f=i.get(s.id);return!f||e.version<2?s:{...s,name:f.name||s.name,description:f.description||s.description,position:Number.isFinite(f.position)?f.position:s.position}});e.groups.filter(s=>!n.has(s.id)&&!r.has(s.id)).forEach((s,f)=>{t.push({...s,description:s.description||"自定义工作分组",position:S.groups.length+f})});const o=t.filter((s,f,y)=>y.findIndex(E=>E.id===s.id)===f);o.sort((s,f)=>(s.position||0)-(f.position||0));const l={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},m={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},p=e.reports.map(s=>({...s,groupId:l[s.id]||m[s.groupId]||s.groupId||"inbox"})),u=new Map(p.map(s=>[s.id,s])),q=new Map(p.map(s=>[x(s.url),s])),T=new Set,P=a.reports.map(s=>{const f=x(s.url);T.add(f);const y=u.get(s.id)||q.get(f);return y?{...s,title:y.title||s.title,groupId:o.some(E=>E.id===y.groupId)?y.groupId:s.groupId,pinned:!!y.pinned,position:Number.isFinite(y.position)?y.position:s.position}:s});p.forEach(s=>{const f=x(s.url);T.has(f)||(T.add(f),P.push(s))});const C={version:Z,groups:o,reports:P};return localStorage.setItem(D,JSON.stringify(C)),C}function I(){c.version=Z,c.groups.forEach((e,a)=>{e.position=a}),localStorage.setItem(D,JSON.stringify(c))}function L(e,a){const n=c.groups.findIndex(t=>t.id===e),r=c.groups.findIndex(t=>t.id===a);if(n<0||r<0||n===r)return!1;const[i]=c.groups.splice(n,1);return c.groups.splice(r,0,i),I(),!0}function R(e){var a;return`${e}-${((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`}`}function d(e=""){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function $(e){try{return new URL(e).hostname.replace(/^www\./,"")}catch{return e}}function K(e){return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric"}).format(new Date(e))}function B(e){try{return["http:","https:"].includes(new URL(e).protocol)}catch{return!1}}function v(e){var n;(n=document.querySelector(".toast"))==null||n.remove();const a=document.createElement("div");a.className="toast",a.setAttribute("role","status"),a.textContent=e,document.body.append(a),clearTimeout(N),N=window.setTimeout(()=>a.remove(),2600)}function M(e,a=!1){const n=e.access!=="production",r=e.access==="org"?"需组织登录":e.access==="account"?"需账号登录":"生产可访问";return`
    <article class="report-card ${a?"pinned-card":""}" draggable="true" data-report-id="${d(e.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${d(e.id)}">
        <span class="report-icon">${d(e.title.slice(0,1))}</span>
        <span class="report-copy">
          <strong>${d(e.title)}</strong>
          <span>${d($(e.url))}</span>
        </span>
        <span class="open-arrow ${n?"login-arrow":""}" aria-hidden="true">${n?"登录":"↗"}</span>
      </button>
      <div class="card-meta">
        <span>${d(K(e.createdAt))}</span>
        <span class="source-badge">${d(e.source||"手动添加")}</span>
        <span class="access-badge ${e.access!=="production"?"access-org":""}">${r}</span>
        <span class="drag-hint" title="拖动到其他分组">⠿ 拖动</span>
        <a class="external-link" href="${d(e.url)}" target="_blank" rel="noreferrer" title="${n?"在新窗口登录并打开":"在新窗口打开"}">${n?"登录打开 ↗":"新窗口 ↗"}</a>
        <div class="card-actions">
          <button type="button" data-action="pin" data-id="${d(e.id)}" title="${e.pinned?"取消置顶":"置顶"}">${e.pinned?"★":"☆"}</button>
          <button type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${d(e.id)}">删除</button>
        </div>
      </div>
    </article>`}function z(){var n;if(!b)return"";if(b.type==="group")return`
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
      </div>`;const e=b.mode==="edit"?c.reports.find(r=>r.id===b.reportId):null,a=(e==null?void 0:e.groupId)||b.groupId||((n=c.groups[0])==null?void 0:n.id)||"";return`
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
            ${c.groups.map(r=>`<option value="${d(r.id)}" ${r.id===a?"selected":""}>${d(r.name)}</option>`).join("")}
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
    </main>`}function J(e){const a=e.access!=="production",n=e.access==="org"?"组织账号":"站点账号",r=a?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${e.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${n}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${n}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${d(e.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${d($(e.url))}</p>
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
          <span>${d($(e.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${a?"primary-button":"quiet-button"}" href="${d(e.url)}" target="_blank" rel="noreferrer">${a?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${d(e.id)}">编辑</button>
        </div>
      </header>
      ${r}
      ${z()}
    </main>`}function _(){const e=k.trim().toLowerCase(),a=e?c.reports.filter(t=>`${t.title} ${t.url} ${t.source||""} ${t.access||""}`.toLowerCase().includes(e)):c.reports,n=a.filter(t=>t.pinned).sort((t,o)=>new Date(o.createdAt)-new Date(t.createdAt)),r=c.reports.filter(t=>t.access==="production").length,i=c.reports.filter(t=>t.access!=="production").length;return`
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
            <div><strong>${c.reports.length}</strong><span>整理后产出</span></div>
            <div><strong>${r}</strong><span>生产可访问</span></div>
            <div><strong>${i}</strong><span>需账号权限</span></div>
          </div>
        </div>
        ${n.length?`
          <section class="pinned-section">
            <div class="section-heading"><div><span class="section-kicker">PINNED</span><h2>置顶服务</h2></div><span>${n.length} 个常用入口</span></div>
            <div class="pinned-grid">${n.map(t=>M(t,!0)).join("")}</div>
          </section>`:""}
        <section class="groups-section">
          <div class="section-heading"><div><span class="section-kicker">ROLE-BASED COLLECTIONS</span><h2>我的工作分组</h2></div><button class="text-button" type="button" data-action="add-group">＋ 新增分组</button></div>
          <div class="board">
            ${c.groups.map(t=>{const o=a.filter(l=>l.groupId===t.id).sort((l,m)=>(l.position||0)-(m.position||0));return`
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
                    ${o.map(l=>M(l)).join("")}
                    ${o.length?`<button type="button" class="add-inline" data-action="add-to-group" data-id="${d(t.id)}">＋ 添加到此分组</button>`:`<button type="button" class="empty-drop" data-action="add-to-group" data-id="${d(t.id)}"><span>拖报告到这里</span><small>或点击新增</small></button>`}
                  </div>
                </section>`}).join("")}
            <button type="button" class="new-group-card" data-action="add-group"><span>＋</span><strong>新增分组</strong><small>让报告按你的方式归位</small></button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR WORKSPACE · GITHUB PAGES</span><span>自动保存到当前浏览器</span></footer>
      ${z()}
    </main>`}function g(){const e=document.getElementById("app");if(sessionStorage.getItem(O)!=="ok"){e.innerHTML=H(),W();return}const a=w&&c.reports.find(n=>n.id===w);e.innerHTML=a?J(a):_(),V()}function W(){const e=document.getElementById("login-form");e==null||e.addEventListener("submit",a=>{if(a.preventDefault(),new FormData(e).get("password")!=="2026"){const r=e.querySelector(".form-error");r.hidden=!1,r.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(O,"ok"),g()})}async function U(e){var o,l;const a=e.elements.url,n=e.elements.title,r=e.querySelector('[data-action="detect-title"]'),i=e.querySelector(".field-hint"),t=a.value.trim();if(!B(t))return i.textContent="请输入完整的 http 或 https 网址","";r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>',i.textContent="正在读取网页标题…";try{const m=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,p=await fetch(m,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!p.ok)throw new Error("read failed");const u=await p.json(),q=((l=(o=u==null?void 0:u.data)==null?void 0:o.title)==null?void 0:l.trim())||$(t);return n.value=q.slice(0,180),i.textContent="已识别网页标题",n.value}catch{const m=$(t);return n.value||(n.value=m),i.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",n.value}finally{r.disabled=!1,r.textContent="识别标题"}}function V(){var n;(n=document.getElementById("search-input"))==null||n.addEventListener("input",r=>{k=r.target.value,g();const i=document.getElementById("search-input");i==null||i.focus(),i==null||i.setSelectionRange(k.length,k.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async i=>{var l,m;const t=i.currentTarget.dataset.action,o=i.currentTarget.dataset.id;if(t==="open")w=o,g();else if(t==="back")w="",b=null,g();else if(t==="lock")sessionStorage.removeItem(O),g();else if(t==="clear-search")k="",g();else if(t==="add-report")b={type:"report",mode:"create",groupId:((l=c.groups[1])==null?void 0:l.id)||((m=c.groups[0])==null?void 0:m.id)},g();else if(t==="add-to-group")b={type:"report",mode:"create",groupId:o},g();else if(t==="edit")b={type:"report",mode:"edit",reportId:o},g();else if(t==="close-modal")b=null,g();else if(t==="detect-title")await U(i.currentTarget.closest("form"));else if(t==="pin"){const p=c.reports.find(u=>u.id===o);p&&(p.pinned=!p.pinned),I(),g(),v(p!=null&&p.pinned?"报告已置顶":"已取消置顶")}else if(t==="delete"){const p=c.reports.find(u=>u.id===o);p&&confirm(`确定删除“${p.title}”吗？此操作不可撤销。`)&&(c.reports=c.reports.filter(u=>u.id!==o),w===o&&(w=""),I(),g(),v("报告已删除"))}else if(t==="add-group")b={type:"group"},g();else if(t==="rename-group"){const p=c.groups.find(q=>q.id===o),u=p&&prompt("新的分组名称",p.name);u!=null&&u.trim()&&(p.name=u.trim().slice(0,60),I(),g(),v("分组名称已更新"))}else if(t==="delete-group"){const p=c.groups.find(u=>u.id===o);p&&confirm(`删除“${p.name}”？其中的报告会移到“待整理”。`)&&(c.reports.forEach(u=>{u.groupId===o&&(u.groupId="inbox")}),c.groups=c.groups.filter(u=>u.id!==o),I(),g(),v("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(r=>{r.addEventListener("dragstart",i=>{A=r.dataset.reportId,h="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",A),r.classList.add("is-dragging")}),r.addEventListener("dragend",()=>{A="",r.classList.remove("is-dragging")})}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const i=()=>{var t;h="",(t=r.closest(".group-column"))==null||t.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(o=>{o.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",t=>{var o,l;t.pointerType!=="mouse"&&(t.preventDefault(),h=r.dataset.groupDragId,A="",(o=r.setPointerCapture)==null||o.call(r,t.pointerId),(l=r.closest(".group-column"))==null||l.classList.add("is-group-dragging"))}),r.addEventListener("pointermove",t=>{t.pointerType!=="mouse"&&h&&document.querySelectorAll(".group-column").forEach(o=>{var l;o.classList.toggle("is-group-drop-target",o===((l=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:l.closest(".group-column")))})}),r.addEventListener("pointerup",t=>{var m;if(t.pointerType==="mouse"||!h)return;const o=h,l=(m=document.elementFromPoint(t.clientX,t.clientY))==null?void 0:m.closest(".group-column");if(l&&L(o,l.dataset.groupId)){h="",g(),v("分组顺序已更新");return}i()}),r.addEventListener("pointercancel",i),r.addEventListener("keydown",t=>{var p;if(!["ArrowLeft","ArrowRight"].includes(t.key))return;t.preventDefault();const o=c.groups.findIndex(u=>u.id===r.dataset.groupDragId),l=t.key==="ArrowLeft"?o-1:o+1,m=c.groups[l];!m||!L(r.dataset.groupDragId,m.id)||(g(),v("分组顺序已更新"),(p=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||p.focus())})}),document.querySelectorAll(".group-header").forEach(r=>{r.addEventListener("dragstart",i=>{var t;h=r.dataset.groupDragId,A="",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",h),(t=r.closest(".group-column"))==null||t.classList.add("is-group-dragging")}),r.addEventListener("dragend",()=>{var i;h="",(i=r.closest(".group-column"))==null||i.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(t=>{t.classList.remove("is-group-drop-target","is-drop-ready")})})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",i=>{i.preventDefault(),r.classList.add(h?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",i=>{if(i.preventDefault(),h){if(L(h,r.dataset.groupId)){h="",g(),v("分组顺序已更新");return}h="",r.classList.remove("is-group-drop-target");return}const t=c.reports.find(o=>o.id===A);t&&(t.groupId=r.dataset.groupId,t.position=Math.max(-1,...c.reports.filter(o=>o.groupId===t.groupId).map(o=>o.position||0))+1,I(),g(),v("已移入新分组")),A=""})});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",r=>{var o,l;r.preventDefault();const i=(o=new FormData(e).get("name"))==null?void 0:o.trim(),t=(l=new FormData(e).get("description"))==null?void 0:l.trim();i&&(c.groups.push({id:R("group"),name:i.slice(0,60),description:(t==null?void 0:t.slice(0,80))||"自定义工作分组",accent:["blue","violet","amber","green"][c.groups.length%4],position:c.groups.length}),I(),b=null,g(),v("分组已新增"))});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async r=>{r.preventDefault();const i=a.elements.url.value.trim();if(!B(i))return;const t=a.querySelector('button[type="submit"]');t.disabled=!0,t.innerHTML='<span class="mini-spinner"></span>';let o=a.elements.title.value.trim();o||(o=await U(a));const l=a.elements.groupId.value;if(b.mode==="edit"){const m=c.reports.find(p=>p.id===b.reportId);Object.assign(m,{title:o,url:i,groupId:l})}else c.reports.push({id:R("report"),groupId:l,title:o||$(i),url:i,pinned:!1,position:c.reports.filter(m=>m.groupId===l).length,createdAt:new Date().toISOString()});I(),b=null,g(),v("报告已保存")})}function Y(){g()}Y(document.getElementById("app"));
