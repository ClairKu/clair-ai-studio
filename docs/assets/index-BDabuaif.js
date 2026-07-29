(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function a(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=a(r);fetch(r.href,s)}})();const tt="clair-ai-studio-tasks-v1",G=[{id:"auto",name:"智能识别",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",icon:"历",hint:"事实、能力、匹配、核验"}];let I=ot(),h={skillId:"auto",goal:"",material:"",files:[]},w="",q="compose";function ot(){try{const t=JSON.parse(localStorage.getItem(tt));return Array.isArray(t)?t:[]}catch{return[]}}function Z(){localStorage.setItem(tt,JSON.stringify(I))}function et(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function at(t){return G.find(e=>e.id===t)||G[0]}function nt(t){var i;const e=t.toLowerCase();return((i=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,r])=>r.some(s=>e.includes(s))))==null?void 0:i[0])||"solution"}function j(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function ct(t,e){const a=t.files.length?t.files.map(r=>`${r.name}（${r.sizeLabel}）`).join("、"):"无附件",i=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(a)}</li>
      <li>粘贴内容：${i} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function lt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function dt(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function J(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let r="";if(i&&a.size<=1024*1024)try{r=(await a.text()).slice(0,12e3)}catch{r=""}return{id:et(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:dt(a.size),excerpt:r}}))}function pt(t){return G.map(e=>`
    <button class="skill-choice ${h.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}">
      <span>${t(e.icon)}</span>
      <strong>${t(e.name)}</strong>
      <small>${t(e.hint)}</small>
    </button>`).join("")}function ut(t){return h.files.length?`<div class="attachment-list">${h.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function mt(t){const e=I.filter(a=>a.status!=="confirmed").slice().reverse();return e.length?e.map(a=>`
    <button class="task-row" type="button" data-task-action="open-task" data-task-id="${a.id}">
      <span class="task-status-dot"></span>
      <span><strong>${t(a.title)}</strong><small>${t(a.skillName)} · ${j(a.updatedAt)}</small></span>
      <em>${a.status==="review"?"待确认":"处理中"}</em>
    </button>`).join(""):'<div class="task-empty"><span>○</span><strong>还没有进行中的任务</strong><small>投入材料，第一项任务会出现在这里。</small></div>'}function _(t){if(w){const e=I.find(a=>a.id===w);if(e)return gt(e,t);w=""}return`
    <section class="task-center workspace">
      <div class="task-intro">
        <span class="eyebrow">TASK CENTER</span>
        <h1>把材料放进来，<br />把结果带走。</h1>
        <p>选择任务，也可以交给 AI 判断。</p>
      </div>
      <div class="task-layout">
        <form class="task-composer" id="task-composer">
          <section class="composer-section">
            <div class="composer-heading"><span>01</span><div><strong>选择任务</strong><small>不确定就保持智能识别</small></div></div>
            <div class="skill-grid">${pt(t)}</div>
          </section>
          <section class="composer-section">
            <div class="composer-heading"><span>02</span><div><strong>投入材料</strong><small>拖文件，或直接粘贴一堆信息</small></div></div>
            <label class="material-drop" id="material-drop">
              <input id="task-files" type="file" multiple />
              <span class="drop-icon">＋</span>
              <strong>拖入文件</strong>
              <small>PDF、Word、PPT、表格、图片都可以</small>
            </label>
            ${ut(t)}
            <textarea id="task-material" rows="7" placeholder="粘贴文字、聊天记录、链接、会议纪要……">${t(h.material)}</textarea>
          </section>
          <section class="composer-section goal-section">
            <div class="composer-heading"><span>03</span><div><strong>补充目标</strong><small>希望最后帮你解决什么</small></div></div>
            <textarea id="task-goal" rows="3" placeholder="例如：帮我判断这个需求能否进研发，并给出必须补齐的 P0 问题">${t(h.goal)}</textarea>
          </section>
          <div class="composer-submit">
            <span>AI 初稿 → 人工修改 → 确认入库</span>
            <button class="primary-button task-start-button" type="submit">开始工作 <i>↗</i></button>
          </div>
        </form>
        <aside class="task-sidebar">
          <div class="sidebar-title"><div><span class="section-kicker">IN PROGRESS</span><h2>进行中</h2></div><span>${I.filter(e=>e.status!=="confirmed").length}</span></div>
          <div class="task-list">${mt(t)}</div>
          <div class="evolution-note">
            <span>↻</span><div><strong>Skill 会学习，但不会擅自改</strong><small>人工修改只形成候选版本，经你确认后发布。</small></div>
          </div>
        </aside>
      </div>
    </section>`}function gt(t,e){var i;const a=t.status==="confirmed";return`
    <section class="task-center workspace task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← ${a?"返回成果区":"返回任务中心"}</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${e(t.skillName)} · SKILL V${e(t.skillVersion)}</span><h1>${e(t.title)}</h1></div>
        <span class="status-pill ${a?"done":""}">${a?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${e(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${(i=t.revisions)!=null&&i.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${a?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${j(t.updatedAt)}</small></div>
          ${q==="edit"&&!a?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${a?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':q==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function ft(t){const e=I.filter(a=>a.status==="confirmed").sort((a,i)=>new Date(i.confirmedAt)-new Date(a.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><span class="section-kicker">AI RESULTS</span><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(a=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${a.id}">
          <span>${t(at(a.skillId).icon)}</span>
          <div><small>${t(a.skillName)} · V${t(a.skillVersion)}</small><strong>${t(a.title)}</strong><em>${j(a.confirmedAt)}</em></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function ht(){return{active:I.filter(t=>t.status!=="confirmed").length,confirmed:I.filter(t=>t.status==="confirmed").length}}function vt(){return!!w}function Y(){w="",q="compose"}function bt({render:t,escapeHtml:e,showToast:a,showResults:i}){document.querySelectorAll("[data-task-action]").forEach(o=>{o.addEventListener("click",async u=>{var g;const c=u.currentTarget.dataset.taskAction;if(c==="choose-skill")h.skillId=u.currentTarget.dataset.skillId,O(),t();else if(c==="remove-file")O(),h.files=h.files.filter(d=>d.id!==u.currentTarget.dataset.fileId),t();else if(c==="open-task")w=u.currentTarget.dataset.taskId,q="compose",t();else if(c==="close-task"){const d=I.find(v=>v.id===w);w="",q="compose",(d==null?void 0:d.status)==="confirmed"&&(i==null||i()),t()}else if(c==="edit-result")q="edit",t();else if(c==="cancel-edit")q="compose",t();else if(c==="save-revision"){const d=I.find(C=>C.id===u.currentTarget.dataset.taskId),v=(g=document.getElementById("task-result-input"))==null?void 0:g.value.trim();if(!d||!v)return;d.revisions||(d.revisions=[]),d.revisions.push({at:new Date().toISOString(),before:d.resultText||"",after:v}),d.resultText=v,d.resultHtml=`<p>${e(v).replaceAll(`
`,"</p><p>")}</p>`,d.updatedAt=new Date().toISOString(),Z(),q="compose",t(),a("已保存人工修改，并记录为进化样本")}else if(c==="supplement-task"){const d=I.find(v=>v.id===w);if(!d)return;h={skillId:d.requestedSkillId,goal:d.goal,material:d.material,files:d.files},I=I.filter(v=>v.id!==d.id),Z(),w="",q="compose",t()}else if(c==="confirm-task"){const d=I.find(v=>v.id===u.currentTarget.dataset.taskId);if(!d)return;d.status="confirmed",d.confirmedAt=new Date().toISOString(),d.updatedAt=d.confirmedAt,Z(),w="",q="compose",i==null||i(),t(),a("已确认并放入成果区")}})});const r=document.getElementById("task-composer");r==null||r.addEventListener("submit",o=>{var v;if(o.preventDefault(),O(),!h.goal.trim()){a("请先写下希望解决的目标"),(v=document.getElementById("task-goal"))==null||v.focus();return}if(!h.material.trim()&&!h.files.length){a("请拖入文件或粘贴一些材料");return}const u=h.skillId==="auto"?nt(`${h.goal}
${h.material}
${h.files.map(C=>C.name).join(" ")}`):h.skillId,c=at(u),g=new Date().toISOString(),d={id:et(),title:lt(h.goal,c.name),requestedSkillId:h.skillId,skillId:u,skillName:c.name,skillVersion:"1.0.0",goal:h.goal.trim(),material:h.material.trim(),files:h.files,status:"review",createdAt:g,updatedAt:g,revisions:[]};d.resultHtml=ct(d,e),d.resultText=`材料已收齐并匹配 ${d.skillName}。目标：${d.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,I.push(d),Z(),w=d.id,h={skillId:"auto",goal:"",material:"",files:[]},t(),a(`已创建任务，并匹配“${c.name}”`)});const s=document.getElementById("task-files");s==null||s.addEventListener("change",async o=>{O(),h.files.push(...await J(o.target.files)),t(),a(`已加入 ${o.target.files.length} 个文件`)});const n=document.getElementById("material-drop");n==null||n.addEventListener("dragover",o=>{o.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async o=>{o.preventDefault(),n.classList.remove("drag-over"),O();const u=o.dataTransfer.files;h.files.push(...await J(u)),t(),a(`已加入 ${u.length} 个文件`)})}function O(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal");t&&(h.material=t.value),e&&(h.goal=e.value)}const K="clair-service-report-workbench-v1",F="clair-service-report-workbench-access",V=4,R={version:V,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let p=yt(),y="",E="",x="tasks",S=!1,D="",k="",$=null,X=0;function it(t){return JSON.parse(JSON.stringify(t))}function U(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function yt(){try{const t=JSON.parse(localStorage.getItem(K));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return kt(t)}catch{}return it(R)}function kt(t){const e=it(R),a=new Set(e.groups.map(l=>l.id)),i=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(l=>[l.id,l])),s=e.groups.map(l=>{const b=r.get(l.id);return!b||t.version<2?l:{...l,name:b.name||l.name,description:b.description||l.description,position:Number.isFinite(b.position)?b.position:l.position}});t.groups.filter(l=>!a.has(l.id)&&!i.has(l.id)).forEach((l,b)=>{s.push({...l,description:l.description||"自定义工作分组",position:R.groups.length+b})});const n=s.filter((l,b,T)=>T.findIndex(B=>B.id===l.id)===b);n.sort((l,b)=>(l.position||0)-(b.position||0));const o={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},u={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},c=t.reports.map(l=>({...l,groupId:o[l.id]||u[l.groupId]||l.groupId||"inbox"})),g=new Map(c.map(l=>[l.id,l])),d=new Map(c.map(l=>[U(l.url),l])),v=new Set,C=e.reports.map(l=>{const b=U(l.url);v.add(b);const T=g.get(l.id)||d.get(b);return T?{...l,title:T.title||l.title,groupId:n.some(B=>B.id===T.groupId)?T.groupId:l.groupId,pinned:!!T.pinned,position:Number.isFinite(T.position)?T.position:l.position,archived:!!T.archived,archivedAt:T.archivedAt||""}:l});c.forEach(l=>{const b=U(l.url);v.has(b)||(v.add(b),C.push(l))});const W={version:V,groups:n,reports:C};return localStorage.setItem(K,JSON.stringify(W)),W}function L(){p.version=V,p.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(K,JSON.stringify(p))}function z(t,e){const a=p.groups.findIndex(s=>s.id===t),i=p.groups.findIndex(s=>s.id===e);if(a<0||i<0||a===i)return!1;const[r]=p.groups.splice(a,1);return p.groups.splice(i,0,r),L(),!0}function Q(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function m(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function P(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function st(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function A(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(X),X=window.setTimeout(()=>e.remove(),2600)}function rt(t,e=!1){const a=t.access!=="production",i=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",s=!a&&R.reports.some(n=>n.id===t.id)?`<img src="./previews/${m(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":m(t.title.slice(0,2))}</span>
        <strong>${a?i:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""}" draggable="${e?"false":"true"}" data-report-id="${m(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${m(t.id)}">
        <span class="report-preview">
          ${s}
        </span>
        <span class="report-copy">
          <span class="report-source">${m(t.source||"手动添加")}</span>
          <strong>${m(t.title)}</strong>
          <span class="report-open-label">${e?"查看归档内容":a?"登录后查看":"查看完整报告"}</span>
        </span>
      </button>
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${m(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${m(t.id)}">永久删除</button>`:`
            <button type="button" data-action="edit" data-id="${m(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${m(t.id)}">归档</button>`}
      </div>
    </article>`}function M(){var a;if(!$)return"";if($.type==="group")return`
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
      </div>`;const t=$.mode==="edit"?p.reports.find(i=>i.id===$.reportId):null,e=(t==null?void 0:t.groupId)||$.groupId||((a=p.groups[0])==null?void 0:a.id)||"";return`
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
            <input name="url" type="url" value="${m((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${m((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${p.groups.map(i=>`<option value="${m(i.id)}" ${i.id===e?"selected":""}>${m(i.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function $t(){return`
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · AI WORKSPACE</span>
        <h1>Clair的工作台</h1>
        <p>投入材料，完成关键任务，把确认后的结果沉淀为可复用成果。</p>
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
    </main>`}function It(t){const e=t.access!=="production",a=t.access==="org"?"组织账号":"站点账号",i=e?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${a}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${a}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${m(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${m(P(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${m(t.title)}" src="${m(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${m(t.title)}</strong>
          <span>${m(P(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${m(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${m(t.id)}">编辑</button>
        </div>
      </header>
      ${i}
      ${M()}
    </main>`}function N(t){const e=ht();return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair的工作台</strong><span>AI WORKSPACE</span></div>
      </div>
      <nav class="workspace-tabs" aria-label="工作台导航">
        <button type="button" data-action="show-tasks" class="${x==="tasks"&&!S?"active":""}">
          任务中心${e.active?`<span>${e.active}</span>`:""}
        </button>
        <button type="button" data-action="show-results" class="${x==="results"&&!S?"active":""}">
          成果区${e.confirmed?`<span>${e.confirmed}</span>`:""}
        </button>
      </nav>
      <div class="top-actions">
        ${x==="results"||S?`<button class="quiet-button archive-nav-button" type="button" data-action="${S?"show-results":"show-archive"}">
              ${S?"返回成果区":`归档${t?`<span>${t}</span>`:""}`}
            </button>
            ${S?"":'<button class="primary-button" type="button" data-action="add-report">新增成果</button>'}`:'<button class="quiet-button" type="button" data-action="lock">退出</button>'}
      </div>
    </header>`}function At(){const t=p.reports.filter(a=>a.archived).filter(a=>{if(!y.trim())return!0;const i=y.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=p.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${N(e)}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${e}</strong><span>份已归档</span></div>
        </div>
        ${t.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${y?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(a=>rt(a,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${y?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${y?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${y?"clear-search":"show-catalog"}">${y?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Safe archive</span></footer>
      ${M()}
    </main>`}function wt(){if(S)return At();if(vt())return`
      <main class="app-shell">
        ${N(p.reports.filter(o=>o.archived).length)}
        ${_(m)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
      </main>`;if(x==="tasks")return`
      <main class="app-shell">
        ${N(p.reports.filter(o=>o.archived).length)}
        ${_(m)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
        ${M()}
      </main>`;const t=y.trim().toLowerCase(),e=p.reports.filter(o=>!o.archived),a=t?e.filter(o=>`${o.title} ${o.url} ${o.source||""} ${o.access||""}`.toLowerCase().includes(t)):e,i=p.reports.filter(o=>o.archived).length,r=e.filter(o=>o.access==="production").length,s=e.filter(o=>o.access!=="production").length,n=p.groups.map(o=>({...o,reports:a.filter(u=>u.groupId===o.id).sort((u,c)=>(u.position||0)-(c.position||0))})).filter(o=>o.reports.length);return`
    <main class="app-shell">
      ${N(i)}
      <section class="workspace">
        <div class="results-toolbar">
          <div><span class="eyebrow">RESULTS</span><h1>成果区</h1></div>
          <label class="search results-search">
            <input id="search-input" value="${m(y)}" placeholder="搜索成果" aria-label="搜索成果" />
            ${y?'<button type="button" data-action="clear-search">清除</button>':""}
          </label>
        </div>
        ${ft(m)}
        <div class="hero-row">
          <div class="hero-copy">
            <span class="eyebrow">PUBLISHED WORK</span>
            <h1>已发布成果</h1>
            <p>按工作主题整理，可拖动分组与内容。</p>
          </div>
          <div class="studio-summary" aria-label="报告统计">
            <strong>${e.length}</strong>
            <span>份成果</span>
            <i></i>
            <strong>${n.length}</strong>
            <span>个主题</span>
            <i></i>
            <strong>${r}</strong>
            <span>可直接访问</span>
          </div>
        </div>
        <section class="groups-section">
          ${n.length?`
            <nav class="topic-nav" aria-label="报告主题">
              ${n.map(o=>`<a href="#topic-${m(o.id)}">${m(o.name)}<span>${o.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${n.map((o,u)=>`
                <section id="topic-${m(o.id)}" class="group-column topic-section accent-${m(o.accent)}" data-group-id="${m(o.id)}">
                  <header class="group-header">
                    <div class="topic-number">${String(u+1).padStart(2,"0")}</div>
                    <div class="group-heading-copy">
                      <div><h2>${m(o.name)}</h2><p>${m(o.description||"自定义工作主题")}</p></div>
                      <span class="count">${o.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      <button type="button" data-action="add-to-group" data-id="${m(o.id)}">添加</button>
                      <button type="button" data-action="rename-group" data-id="${m(o.id)}">改名</button>
                      ${o.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${m(o.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">${o.reports.map(c=>rt(c)).join("")}</div>
                </section>`).join("")}
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${s} 份报告需要组织或账号登录${i?` · ${i} 份已安全归档`:""}</span>
            <div><button type="button" data-action="add-group">新增主题</button><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${M()}
    </main>`}function f(){const t=document.getElementById("app");if(sessionStorage.getItem(F)!=="ok"){t.innerHTML=$t(),St();return}const e=E&&p.reports.find(a=>a.id===E);t.innerHTML=e?It(e):wt(),Tt(),bt({render:f,escapeHtml:m,showToast:A,showResults:()=>{x="results",S=!1}})}function St(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(F,"ok"),f()})}async function H(t){var n,o;const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),s=e.value.trim();if(!st(s))return r.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const u=`https://api.microlink.io/?url=${encodeURIComponent(s)}`,c=await fetch(u,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!c.ok)throw new Error("read failed");const g=await c.json(),d=((o=(n=g==null?void 0:g.data)==null?void 0:n.title)==null?void 0:o.trim())||P(s);return a.value=d.slice(0,180),r.textContent="已识别网页标题",a.value}catch{const u=P(s);return a.value||(a.value=u),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function Tt(){var a;(a=document.getElementById("search-input"))==null||a.addEventListener("input",i=>{y=i.target.value,f();const r=document.getElementById("search-input");r==null||r.focus(),r==null||r.setSelectionRange(y.length,y.length)}),document.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",async r=>{var o,u;const s=r.currentTarget.dataset.action,n=r.currentTarget.dataset.id;if(s==="open")E=n,f();else if(s==="back")E="",$=null,f();else if(s==="lock")sessionStorage.removeItem(F),f();else if(s==="clear-search")y="",f();else if(s==="show-tasks")x="tasks",S=!1,E="",Y(),f();else if(s==="show-results")x="results",S=!1,E="",y="",Y(),f();else if(s==="show-archive")x="results",S=!0,y="",E="",f();else if(s==="show-catalog")S=!1,y="",E="",f();else if(s==="add-report")$={type:"report",mode:"create",groupId:((o=p.groups[1])==null?void 0:o.id)||((u=p.groups[0])==null?void 0:u.id)},f();else if(s==="add-to-group")$={type:"report",mode:"create",groupId:n},f();else if(s==="edit")$={type:"report",mode:"edit",reportId:n},f();else if(s==="close-modal")$=null,f();else if(s==="detect-title")await H(r.currentTarget.closest("form"));else if(s==="archive"){const c=p.reports.find(g=>g.id===n);if(!c)return;c.archived=!0,c.archivedAt=new Date().toISOString(),L(),f(),A("已归档，可随时恢复")}else if(s==="restore"){const c=p.reports.find(g=>g.id===n);if(!c)return;c.archived=!1,c.archivedAt="",L(),f(),A("报告已恢复到原主题")}else if(s==="delete"){const c=p.reports.find(g=>g.id===n);c!=null&&c.archived&&confirm(`二次确认：永久删除“${c.title}”？

删除后无法从归档区恢复。`)&&(p.reports=p.reports.filter(g=>g.id!==n),E===n&&(E=""),L(),f(),A("报告已永久删除"))}else if(s==="add-group")$={type:"group"},f();else if(s==="rename-group"){const c=p.groups.find(d=>d.id===n),g=c&&prompt("新的分组名称",c.name);g!=null&&g.trim()&&(c.name=g.trim().slice(0,60),L(),f(),A("分组名称已更新"))}else if(s==="delete-group"){const c=p.groups.find(g=>g.id===n);c&&confirm(`删除“${c.name}”？其中的报告会移到“待整理”。`)&&(p.reports.forEach(g=>{g.groupId===n&&(g.groupId="inbox")}),p.groups=p.groups.filter(g=>g.id!==n),L(),f(),A("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(i=>{i.addEventListener("dragstart",r=>{D=i.dataset.reportId,k="",r.dataTransfer.effectAllowed="move",r.dataTransfer.setData("text/plain",D),i.classList.add("is-dragging")}),i.addEventListener("dragend",()=>{D="",i.classList.remove("is-dragging")})}),document.querySelectorAll(".group-drag-handle").forEach(i=>{const r=()=>{var s;k="",(s=i.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(n=>{n.classList.remove("is-group-drop-target","is-drop-ready")})};i.addEventListener("pointerdown",s=>{var n,o;s.pointerType!=="mouse"&&(s.preventDefault(),k=i.dataset.groupDragId,D="",(n=i.setPointerCapture)==null||n.call(i,s.pointerId),(o=i.closest(".group-column"))==null||o.classList.add("is-group-dragging"))}),i.addEventListener("pointermove",s=>{s.pointerType!=="mouse"&&k&&document.querySelectorAll(".group-column").forEach(n=>{var o;n.classList.toggle("is-group-drop-target",n===((o=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:o.closest(".group-column")))})}),i.addEventListener("pointerup",s=>{var u;if(s.pointerType==="mouse"||!k)return;const n=k,o=(u=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:u.closest(".group-column");if(o&&z(n,o.dataset.groupId)){k="",f(),A("分组顺序已更新");return}r()}),i.addEventListener("pointercancel",r),i.addEventListener("keydown",s=>{var c;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const n=p.groups.findIndex(g=>g.id===i.dataset.groupDragId),o=s.key==="ArrowLeft"?n-1:n+1,u=p.groups[o];!u||!z(i.dataset.groupDragId,u.id)||(f(),A("分组顺序已更新"),(c=document.querySelector(`[data-group-drag-id="${CSS.escape(i.dataset.groupDragId)}"]`))==null||c.focus())})}),document.querySelectorAll(".group-header").forEach(i=>{i.addEventListener("dragstart",r=>{var s;k=i.dataset.groupDragId,D="",r.dataTransfer.effectAllowed="move",r.dataTransfer.setData("text/plain",k),(s=i.closest(".group-column"))==null||s.classList.add("is-group-dragging")}),i.addEventListener("dragend",()=>{var r;k="",(r=i.closest(".group-column"))==null||r.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(s=>{s.classList.remove("is-group-drop-target","is-drop-ready")})})}),document.querySelectorAll(".group-column").forEach(i=>{i.addEventListener("dragover",r=>{r.preventDefault(),i.classList.add(k?"is-group-drop-target":"is-drop-ready")}),i.addEventListener("dragleave",()=>{i.classList.remove("is-drop-ready","is-group-drop-target")}),i.addEventListener("drop",r=>{if(r.preventDefault(),k){if(z(k,i.dataset.groupId)){k="",f(),A("分组顺序已更新");return}k="",i.classList.remove("is-group-drop-target");return}const s=p.reports.find(n=>n.id===D);s&&(s.groupId=i.dataset.groupId,s.position=Math.max(-1,...p.reports.filter(n=>n.groupId===s.groupId).map(n=>n.position||0))+1,L(),f(),A("已移入新分组")),D=""})});const t=document.getElementById("group-form");t==null||t.addEventListener("submit",i=>{var n,o;i.preventDefault();const r=(n=new FormData(t).get("name"))==null?void 0:n.trim(),s=(o=new FormData(t).get("description"))==null?void 0:o.trim();r&&(p.groups.push({id:Q("group"),name:r.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作分组",accent:["blue","violet","amber","green"][p.groups.length%4],position:p.groups.length}),L(),$=null,f(),A("分组已新增"))});const e=document.getElementById("report-form");e==null||e.addEventListener("submit",async i=>{i.preventDefault();const r=e.elements.url.value.trim();if(!st(r))return;const s=e.querySelector('button[type="submit"]');s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';let n=e.elements.title.value.trim();n||(n=await H(e));const o=e.elements.groupId.value;if($.mode==="edit"){const u=p.reports.find(c=>c.id===$.reportId);Object.assign(u,{title:n,url:r,groupId:o})}else p.reports.push({id:Q("report"),groupId:o,title:n||P(r),url:r,pinned:!1,position:p.reports.filter(u=>u.groupId===o).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:""});L(),$=null,f(),A("报告已保存")})}function Et(){f()}Et(document.getElementById("app"));
