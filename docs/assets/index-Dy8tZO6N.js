(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function a(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=a(o);fetch(o.href,r)}})();const tt="clair-ai-studio-tasks-v1",F=[{id:"auto",name:"智能识别",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",icon:"历",hint:"事实、能力、匹配、核验"}];let A=nt(),f={skillId:"auto",goal:"",material:"",files:[]},x="",E="compose",D=!1;function nt(){try{const t=JSON.parse(localStorage.getItem(tt));return Array.isArray(t)?t:[]}catch{return[]}}function B(){localStorage.setItem(tt,JSON.stringify(A))}function et(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function G(t){return F.find(e=>e.id===t)||F[0]}function ct(t){var i;const e=t.toLowerCase();return((i=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,o])=>o.some(r=>e.includes(r))))==null?void 0:i[0])||"solution"}function it(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function lt(t,e){const a=t.files.length?t.files.map(o=>`${o.name}（${o.sizeLabel}）`).join("、"):"无附件",i=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(a)}</li>
      <li>粘贴内容：${i} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function dt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function ut(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function W(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let o="";if(i&&a.size<=1024*1024)try{o=(await a.text()).slice(0,12e3)}catch{o=""}return{id:et(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:ut(a.size),excerpt:o}}))}function pt(t){return F.map(e=>`
    <button class="skill-choice ${f.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}">
      <span>${t(e.icon)}</span>
      <strong>${t(e.name)}</strong>
      <small>${t(e.hint)}</small>
    </button>`).join("")}function mt(t){return f.files.length?`<div class="attachment-list">${f.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function X(t){const e=A.filter(a=>a.status!=="confirmed").sort((a,i)=>new Date(i.updatedAt)-new Date(a.updatedAt));return e.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${e.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(a=>`
          <button type="button" data-task-action="open-task" data-task-id="${a.id}">
            <span>${t(G(a.skillId).icon)}</span>
            <div><strong>${t(a.title)}</strong><small>${a.status==="review"?"待确认":"处理中"} · ${it(a.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function gt(t){if(x){const e=A.find(a=>a.id===x);if(e)return ft(e,t);x=""}return D?`
    <section class="inline-task-launcher expanded" aria-label="任务工作区">
      <form class="task-composer inline-task-composer" id="task-composer">
        <header class="inline-composer-header">
          <div><h2>发起任务</h2></div>
          <button class="quiet-button" type="button" data-task-action="collapse-launcher">收起</button>
        </header>
        <section class="inline-goal-panel">
          <label for="task-goal">希望最后帮你解决什么？</label>
          <textarea id="task-goal" rows="3" placeholder="例如：判断这个需求能否进入研发，并给出必须补齐的 P0 问题">${t(f.goal)}</textarea>
        </section>
        <div class="inline-composer-grid">
          <section class="inline-material-panel">
            <div class="inline-panel-heading"><span>01</span><div><strong>投入材料</strong></div></div>
            <label class="material-drop" id="material-drop">
              <input id="task-files" type="file" multiple />
              <span class="drop-icon">＋</span>
              <strong>添加文件</strong>
              <small>PDF、Word、PPT、表格、图片</small>
            </label>
            ${mt(t)}
            <textarea id="task-material" rows="6" placeholder="粘贴文字、聊天记录、链接、会议纪要……">${t(f.material)}</textarea>
          </section>
          <section class="inline-skill-panel">
            <div class="inline-panel-heading"><span>02</span><div><strong>选择能力</strong></div></div>
            <div class="skill-grid">${pt(t)}</div>
          </section>
        </div>
        <div class="composer-submit">
          <button class="primary-button task-start-button" type="submit">开始工作 <i>↗</i></button>
        </div>
      </form>
      ${X(t)}
    </section>`:`
      <section class="inline-task-launcher" aria-label="发起任务">
        <div class="quick-task-entry">
          <span class="quick-task-icon" aria-hidden="true">✦</span>
          <input id="task-quick-goal" value="${t(f.goal)}" placeholder="今天想完成什么？" aria-label="今天想完成什么" />
          <div class="quick-task-actions">
            <button class="attachment-shortcut" type="button" data-task-action="expand-launcher">＋ 素材</button>
            <button class="primary-button" type="button" data-task-action="expand-launcher">发起任务</button>
          </div>
        </div>
        ${X(t)}
      </section>`}function ft(t,e){var i;const a=t.status==="confirmed";return`
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
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
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${a?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${it(t.updatedAt)}</small></div>
          ${E==="edit"&&!a?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${a?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':E==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function ht(t){const e=A.filter(a=>a.status==="confirmed").sort((a,i)=>new Date(i.confirmedAt)-new Date(a.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(a=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${a.id}">
          <span>${t(G(a.skillId).icon)}</span>
          <div><small>${t(a.skillName)}</small><strong>${t(a.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function vt(){return{active:A.filter(t=>t.status!=="confirmed").length,confirmed:A.filter(t=>t.status==="confirmed").length}}function bt({render:t,escapeHtml:e,showToast:a,showResults:i}){document.querySelectorAll("[data-task-action]").forEach(c=>{c.addEventListener("click",async l=>{var y;const d=l.currentTarget.dataset.taskAction;if(d==="expand-launcher")Z(),D=!0,t(),requestAnimationFrame(()=>{var u;return(u=document.getElementById("task-goal"))==null?void 0:u.focus()});else if(d==="collapse-launcher")Z(),D=!1,t();else if(d==="choose-skill")f.skillId=l.currentTarget.dataset.skillId,Z(),t();else if(d==="remove-file")Z(),f.files=f.files.filter(u=>u.id!==l.currentTarget.dataset.fileId),t();else if(d==="open-task")x=l.currentTarget.dataset.taskId,E="compose",t();else if(d==="close-task"){const u=A.find(v=>v.id===x);x="",E="compose",D=!1,(u==null?void 0:u.status)==="confirmed"&&(i==null||i()),t()}else if(d==="edit-result")E="edit",t();else if(d==="cancel-edit")E="compose",t();else if(d==="save-revision"){const u=A.find(L=>L.id===l.currentTarget.dataset.taskId),v=(y=document.getElementById("task-result-input"))==null?void 0:y.value.trim();if(!u||!v)return;u.revisions||(u.revisions=[]),u.revisions.push({at:new Date().toISOString(),before:u.resultText||"",after:v}),u.resultText=v,u.resultHtml=`<p>${e(v).replaceAll(`
`,"</p><p>")}</p>`,u.updatedAt=new Date().toISOString(),B(),E="compose",t(),a("已保存人工修改，并记录为进化样本")}else if(d==="supplement-task"){const u=A.find(v=>v.id===x);if(!u)return;f={skillId:u.requestedSkillId,goal:u.goal,material:u.material,files:u.files},A=A.filter(v=>v.id!==u.id),B(),x="",E="compose",D=!0,t()}else if(d==="confirm-task"){const u=A.find(v=>v.id===l.currentTarget.dataset.taskId);if(!u)return;u.status="confirmed",u.confirmedAt=new Date().toISOString(),u.updatedAt=u.confirmedAt,B(),x="",E="compose",D=!1,i==null||i(),t(),a("已确认并放入成果区")}})});const o=document.getElementById("task-composer");o==null||o.addEventListener("submit",c=>{var v;if(c.preventDefault(),Z(),!f.goal.trim()){a("请先写下希望解决的目标"),(v=document.getElementById("task-goal"))==null||v.focus();return}if(!f.material.trim()&&!f.files.length){a("请拖入文件或粘贴一些材料");return}const l=f.skillId==="auto"?ct(`${f.goal}
${f.material}
${f.files.map(L=>L.name).join(" ")}`):f.skillId,d=G(l),y=new Date().toISOString(),u={id:et(),title:dt(f.goal,d.name),requestedSkillId:f.skillId,skillId:l,skillName:d.name,skillVersion:"1.0.0",goal:f.goal.trim(),material:f.material.trim(),files:f.files,status:"review",createdAt:y,updatedAt:y,revisions:[]};u.resultHtml=lt(u,e),u.resultText=`材料已收齐并匹配 ${u.skillName}。目标：${u.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,A.push(u),B(),x=u.id,D=!1,f={skillId:"auto",goal:"",material:"",files:[]},t(),a(`已创建任务，并匹配“${d.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async c=>{Z(),f.files.push(...await W(c.target.files)),t(),a(`已加入 ${c.target.files.length} 个文件`)});const n=document.getElementById("material-drop");n==null||n.addEventListener("dragover",c=>{c.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async c=>{c.preventDefault(),n.classList.remove("drag-over"),Z();const l=c.dataTransfer.files;f.files.push(...await W(l)),t(),a(`已加入 ${l.length} 个文件`)});const s=document.getElementById("task-quick-goal");s==null||s.addEventListener("input",()=>{f.goal=s.value}),s==null||s.addEventListener("focus",()=>{f.goal=s.value,D=!0,t(),requestAnimationFrame(()=>{const c=document.getElementById("task-goal");c==null||c.focus(),c==null||c.setSelectionRange(c.value.length,c.value.length)})},{once:!0})}function Z(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal"),a=document.getElementById("task-quick-goal");t&&(f.material=t.value),e&&(f.goal=e.value),a&&(f.goal=a.value)}const K="clair-service-report-workbench-v1",Y="clair-service-report-workbench-access",J=5,R={version:J,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let g=yt(),$="",P="",T=!1,q="",w="",O="",b=null,_=0;function at(t){return JSON.parse(JSON.stringify(t))}function U(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function yt(){try{const t=JSON.parse(localStorage.getItem(K));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return kt(t)}catch{}return at(R)}function kt(t){const e=at(R),a=new Set(e.groups.map(p=>p.id)),i=new Set(["inbox","today","product","research"]),o=new Map(t.groups.map(p=>[p.id,p])),r=e.groups.map(p=>{const k=o.get(p.id);return!k||t.version<2?p:{...p,name:k.name||p.name,description:k.description||p.description,position:Number.isFinite(k.position)?k.position:p.position}});t.groups.filter(p=>!a.has(p.id)&&!i.has(p.id)).forEach((p,k)=>{r.push({...p,description:p.description||"自定义工作分组",position:Number.isFinite(p.position)?p.position:R.groups.length+k})});const n=r.filter((p,k,S)=>S.findIndex(z=>z.id===p.id)===k);n.sort((p,k)=>(p.position||0)-(k.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},c={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},l=t.reports.map(p=>({...p,groupId:s[p.id]||c[p.groupId]||p.groupId||"inbox"})),d=new Map(l.map(p=>[p.id,p])),y=new Map(l.map(p=>[U(p.url),p])),u=new Set,v=e.reports.map(p=>{const k=U(p.url);u.add(k);const S=d.get(p.id)||y.get(k);return S?{...p,title:S.title||p.title,groupId:n.some(z=>z.id===S.groupId)?S.groupId:p.groupId,pinned:!!S.pinned,position:Number.isFinite(S.position)?S.position:p.position,archived:!!S.archived,archivedAt:S.archivedAt||""}:p});l.forEach(p=>{const k=U(p.url);u.has(k)||(u.add(k),v.push(p))});const L={version:J,groups:n,reports:v};return localStorage.setItem(K,JSON.stringify(L)),L}function C(){g.version=J,g.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(K,JSON.stringify(g))}function j(t,e){const a=g.groups.findIndex(r=>r.id===t),i=g.groups.findIndex(r=>r.id===e);if(a<0||i<0||a===i)return!1;const[o]=g.groups.splice(a,1);return g.groups.splice(i,0,o),C(),!0}function N(t,e,a=""){const i=g.reports.find(s=>s.id===t);if(!i||i.archived||!g.groups.find(s=>s.id===e))return!1;const r=g.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,c)=>(s.position||0)-(c.position||0)),n=a?r.findIndex(s=>s.id===a):r.length;return i.groupId=e,r.splice(n<0?r.length:n,0,i),r.forEach((s,c)=>{s.position=c}),C(),!0}function Q(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function m(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function M(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function st(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function I(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(_),_=window.setTimeout(()=>e.remove(),2600)}function rt(t,e=!1){const a=t.access!=="production",i=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=!a&&R.reports.some(n=>n.id===t.id)?`<img src="./previews/${m(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":m(t.title.slice(0,2))}</span>
        <strong>${a?i:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${O===t.id?"is-move-selected":""}" data-report-id="${m(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${m(t.id)}" aria-label="打开${m(t.title)}">
        <span class="report-preview">
          ${r}
        </span>
        <span class="report-copy">
          <span class="report-source">${m(t.source||"手动添加")}</span>
          <strong>${m(t.title)}</strong>
          ${a?`<span class="report-access-note">${m(i)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${m(t.id)}"
          aria-label="拖动《${m(t.title)}》到其他工作主题" title="拖动到其他工作主题">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${m(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${m(t.id)}">永久删除</button>`:`
            <button type="button" data-action="edit" data-id="${m(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${m(t.id)}">归档</button>`}
      </div>
    </article>`}function V(){var a;if(!b)return"";if(b.type==="group"){const i=b.mode==="edit"?g.groups.find(o=>o.id===b.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${i?"编辑工作主题":"新建工作主题"}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${m((i==null?void 0:i.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${m((i==null?void 0:i.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${i?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=b.mode==="edit"?g.reports.find(i=>i.id===b.reportId):null,e=(t==null?void 0:t.groupId)||b.groupId||((a=g.groups[0])==null?void 0:a.id)||"";return`
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
            ${g.groups.map(i=>`<option value="${m(i.id)}" ${i.id===e?"selected":""}>${m(i.name)}</option>`).join("")}
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
          <p class="login-handoff-domain">${m(M(t.url))}</p>
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
          <span>${m(M(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${m(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${m(t.id)}">编辑</button>
        </div>
      </header>
      ${i}
      ${V()}
    </main>`}function ot(t){const e=vt();return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair的工作台</strong></div>
      </div>
      <div class="topbar-location">
        <strong>${T?"归档区":"成果区"}</strong>
        ${!T&&e.active?`<span>${e.active} 项待处理</span>`:""}
      </div>
      <div class="top-actions">
        <button class="quiet-button archive-nav-button" type="button" data-action="${T?"show-catalog":"show-archive"}">
          ${T?"返回成果区":`归档${t?`<span>${t}</span>`:""}`}
        </button>
        ${T?"":'<button class="primary-button" type="button" data-action="add-report">新增成果</button>'}
      </div>
    </header>`}function At(){const t=g.reports.filter(a=>a.archived).filter(a=>{if(!$.trim())return!0;const i=$.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=g.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${ot(e)}
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
              <div><h2>${$?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(a=>rt(a,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${$?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${$?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${$?"clear-search":"show-catalog"}">${$?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Safe archive</span></footer>
      ${V()}
    </main>`}function wt(){if(T)return At();const t=$.trim().toLowerCase(),e=g.reports.filter(s=>!s.archived),a=t?e.filter(s=>`${s.title} ${s.url} ${s.source||""} ${s.access||""}`.toLowerCase().includes(t)):e,i=g.reports.filter(s=>s.archived).length,o=e.filter(s=>s.access==="production").length,r=e.filter(s=>s.access!=="production").length,n=g.groups.map(s=>({...s,reports:a.filter(c=>c.groupId===s.id).sort((c,l)=>(c.position||0)-(l.position||0))})).filter(s=>!t||s.reports.length||`${s.name} ${s.description||""}`.toLowerCase().includes(t));return`
    <main class="app-shell">
      ${ot(i)}
      <section class="workspace">
        ${gt(m)}
        <div class="results-toolbar unified-results-toolbar">
          <div class="results-title">
            <h1>我的成果</h1>
          </div>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${e.length}</strong><span>份成果</span>
              <i></i>
              <strong>${n.length}</strong><span>个主题</span>
              <i></i>
              <strong>${o}</strong><span>可直接访问</span>
            </div>
            <label class="search results-search">
              <input id="search-input" value="${m($)}" placeholder="搜索成果" aria-label="搜索成果" />
              ${$?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${ht(m)}
        <section class="groups-section">
          ${O?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在移动报告</strong><span>选择目标主题的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div>
              <h2>工作主题</h2>
            </div>
            <button class="primary-button" type="button" data-action="add-group">＋ 新建工作主题</button>
          </div>
          ${n.length?`
            <nav class="topic-nav" aria-label="报告主题">
              ${n.map(s=>`<a href="#topic-${m(s.id)}">${m(s.name)}<span>${s.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${n.map((s,c)=>`
                <section id="topic-${m(s.id)}" class="group-column topic-section accent-${m(s.accent)}" data-group-id="${m(s.id)}">
                  <header class="group-header">
                    <span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${m(s.id)}"
                      aria-label="拖动“${m(s.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                      <span aria-hidden="true">⠿</span>
                      <small>${String(c+1).padStart(2,"0")}</small>
                    </span>
                    <div class="group-heading-copy">
                      <div><h2>${m(s.name)}</h2></div>
                      <span class="count">${s.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${O?`<button class="move-here-button" type="button" data-action="move-here" data-id="${m(s.id)}">移到这里</button>`:""}
                      <button type="button" data-action="add-to-group" data-id="${m(s.id)}">添加报告</button>
                      <button type="button" data-action="rename-group" data-id="${m(s.id)}">编辑主题</button>
                      ${s.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${m(s.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${s.reports.length?s.reports.map(l=>rt(l)).join(""):`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${m(s.id)}">
                          <strong>拖报告到这里</strong>
                          <span>或点击添加第一份报告</span>
                        </button>`}
                  </div>
                </section>`).join("")}
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${r} 份报告需要组织或账号登录${i?` · ${i} 份已安全归档`:""}</span>
            <div><span>主题与卡片顺序仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${V()}
    </main>`}function h(){const t=document.getElementById("app");if(sessionStorage.getItem(Y)!=="ok"){t.innerHTML=$t(),St();return}const e=P&&g.reports.find(a=>a.id===P);t.innerHTML=e?It(e):wt(),qt(),bt({render:h,escapeHtml:m,showToast:I,showResults:()=>{T=!1}})}function St(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(Y,"ok"),h()})}async function H(t){var n,s;const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),o=t.querySelector(".field-hint"),r=e.value.trim();if(!st(r))return o.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',o.textContent="正在读取网页标题…";try{const c=`https://api.microlink.io/?url=${encodeURIComponent(r)}`,l=await fetch(c,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!l.ok)throw new Error("read failed");const d=await l.json(),y=((s=(n=d==null?void 0:d.data)==null?void 0:n.title)==null?void 0:s.trim())||M(r);return a.value=y.slice(0,180),o.textContent="已识别网页标题",a.value}catch{const c=M(r);return a.value||(a.value=c),o.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function qt(){var a;(a=document.getElementById("search-input"))==null||a.addEventListener("input",i=>{$=i.target.value,h();const o=document.getElementById("search-input");o==null||o.focus(),o==null||o.setSelectionRange($.length,$.length)}),document.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",async o=>{var s,c;const r=o.currentTarget.dataset.action,n=o.currentTarget.dataset.id;if(r==="open")P=n,h();else if(r==="back")P="",b=null,h();else if(r==="lock")sessionStorage.removeItem(Y),h();else if(r==="clear-search")$="",h();else if(r==="cancel-move")O="",h();else if(r==="move-here")O&&N(O,n)&&(O="",h(),I("报告已移入目标主题"));else if(r==="show-archive")T=!0,$="",P="",h();else if(r==="show-catalog")T=!1,$="",P="",h();else if(r==="add-report")b={type:"report",mode:"create",groupId:((s=g.groups[1])==null?void 0:s.id)||((c=g.groups[0])==null?void 0:c.id)},h();else if(r==="add-to-group")b={type:"report",mode:"create",groupId:n},h();else if(r==="edit")b={type:"report",mode:"edit",reportId:n},h();else if(r==="close-modal")b=null,h();else if(r==="detect-title")await H(o.currentTarget.closest("form"));else if(r==="archive"){const l=g.reports.find(d=>d.id===n);if(!l)return;l.archived=!0,l.archivedAt=new Date().toISOString(),C(),h(),I("已归档，可随时恢复")}else if(r==="restore"){const l=g.reports.find(d=>d.id===n);if(!l)return;l.archived=!1,l.archivedAt="",C(),h(),I("报告已恢复到原主题")}else if(r==="delete"){const l=g.reports.find(d=>d.id===n);l!=null&&l.archived&&confirm(`二次确认：永久删除“${l.title}”？

删除后无法从归档区恢复。`)&&(g.reports=g.reports.filter(d=>d.id!==n),P===n&&(P=""),C(),h(),I("报告已永久删除"))}else if(r==="add-group")b={type:"group",mode:"create"},h();else if(r==="rename-group")g.groups.find(d=>d.id===n)&&(b={type:"group",mode:"edit",groupId:n},h());else if(r==="delete-group"){const l=g.groups.find(d=>d.id===n);l&&confirm(`删除“${l.name}”？其中的报告会移到“待整理”。`)&&(g.reports.forEach(d=>{d.groupId===n&&(d.groupId="inbox")}),g.groups=g.groups.filter(d=>d.id!==n),C(),h(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(i=>{let o=null,r=!1;const n=()=>{var s;q="",o=null,r=!1,(s=i.closest(".report-card"))==null||s.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(c=>{c.classList.remove("is-card-drop-target","is-drop-ready")})};i.addEventListener("pointerdown",s=>{var c,l;s.preventDefault(),q=i.dataset.reportDragId,w="",o={x:s.clientX,y:s.clientY},r=!1,(c=i.setPointerCapture)==null||c.call(i,s.pointerId),(l=i.closest(".report-card"))==null||l.classList.add("is-dragging")}),i.addEventListener("pointermove",s=>{if(!q||o&&Math.hypot(s.clientX-o.x,s.clientY-o.y)<7)return;r=!0;const c=document.elementFromPoint(s.clientX,s.clientY),l=c==null?void 0:c.closest(".report-card"),d=c==null?void 0:c.closest(".group-column");document.querySelectorAll(".report-card").forEach(y=>{y.classList.toggle("is-card-drop-target",!!(l&&l!==i.closest(".report-card")&&y===l))}),document.querySelectorAll(".group-column").forEach(y=>{y.classList.toggle("is-drop-ready",!!(d&&y===d))})}),i.addEventListener("pointerup",s=>{if(!q)return;const c=q;if(!r){O=c,n(),h(),I("请选择目标主题");return}const l=document.elementFromPoint(s.clientX,s.clientY),d=l==null?void 0:l.closest(".report-card"),y=l==null?void 0:l.closest(".group-column"),u=(d==null?void 0:d.dataset.reportId)||"",v=(y==null?void 0:y.dataset.groupId)||"",L=u&&u!==c?N(c,v,u):v?N(c,v):!1;n(),L&&(h(),I(u?"报告顺序已更新":"已移入新主题"))}),i.addEventListener("pointercancel",n)}),document.querySelectorAll(".group-drag-handle").forEach(i=>{const o=()=>{var r;w="",(r=i.closest(".group-column"))==null||r.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(n=>{n.classList.remove("is-group-drop-target","is-drop-ready")})};i.addEventListener("pointerdown",r=>{var n,s;r.preventDefault(),w=i.dataset.groupDragId,q="",(n=i.setPointerCapture)==null||n.call(i,r.pointerId),(s=i.closest(".group-column"))==null||s.classList.add("is-group-dragging")}),i.addEventListener("pointermove",r=>{w&&document.querySelectorAll(".group-column").forEach(n=>{var s;n.classList.toggle("is-group-drop-target",n===((s=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:s.closest(".group-column")))})}),i.addEventListener("pointerup",r=>{var c;if(!w)return;const n=w,s=(c=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:c.closest(".group-column");if(s&&j(n,s.dataset.groupId)){w="",h(),I("分组顺序已更新");return}o()}),i.addEventListener("pointercancel",o),i.addEventListener("keydown",r=>{var l;if(!["ArrowLeft","ArrowRight"].includes(r.key))return;r.preventDefault();const n=g.groups.findIndex(d=>d.id===i.dataset.groupDragId),s=r.key==="ArrowLeft"?n-1:n+1,c=g.groups[s];!c||!j(i.dataset.groupDragId,c.id)||(h(),I("分组顺序已更新"),(l=document.querySelector(`[data-group-drag-id="${CSS.escape(i.dataset.groupDragId)}"]`))==null||l.focus())})}),document.querySelectorAll(".group-column").forEach(i=>{i.addEventListener("dragover",o=>{o.preventDefault(),i.classList.add(w?"is-group-drop-target":"is-drop-ready")}),i.addEventListener("dragleave",()=>{i.classList.remove("is-drop-ready","is-group-drop-target")}),i.addEventListener("drop",o=>{if(o.preventDefault(),w){if(j(w,i.dataset.groupId)){w="",h(),I("分组顺序已更新");return}w="",i.classList.remove("is-group-drop-target");return}g.reports.find(n=>n.id===q)&&N(q,i.dataset.groupId)&&(q="",h(),I("已移入新分组")),q=""})});const t=document.getElementById("group-form");t==null||t.addEventListener("submit",i=>{var s,c;i.preventDefault();const o=(s=new FormData(t).get("name"))==null?void 0:s.trim(),r=(c=new FormData(t).get("description"))==null?void 0:c.trim();if(!o)return;if(b.mode==="edit"){const l=g.groups.find(d=>d.id===b.groupId);if(!l)return;l.name=o.slice(0,60),l.description=(r==null?void 0:r.slice(0,80))||"自定义工作主题"}else g.groups.push({id:Q("group"),name:o.slice(0,60),description:(r==null?void 0:r.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][g.groups.length%4],position:g.groups.length});C();const n=b.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";b=null,h(),I(n)});const e=document.getElementById("report-form");e==null||e.addEventListener("submit",async i=>{i.preventDefault();const o=e.elements.url.value.trim();if(!st(o))return;const r=e.querySelector('button[type="submit"]');r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>';let n=e.elements.title.value.trim();n||(n=await H(e));const s=e.elements.groupId.value;if(b.mode==="edit"){const c=g.reports.find(l=>l.id===b.reportId);Object.assign(c,{title:n,url:o,groupId:s})}else g.reports.push({id:Q("report"),groupId:s,title:n||M(o),url:o,pinned:!1,position:g.reports.filter(c=>c.groupId===s).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:""});C(),b=null,h(),I("报告已保存")})}function xt(){h()}xt(document.getElementById("app"));
