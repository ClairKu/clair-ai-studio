(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function i(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(a){if(a.ep)return;a.ep=!0;const r=i(a);fetch(a.href,r)}})();const lt="clair-ai-studio-tasks-v1",V=[{id:"auto",name:"智能识别",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",icon:"历",hint:"事实、能力、匹配、核验"}];let q=vt(),v={skillId:"auto",goal:"",material:"",files:[]},L="",D="compose",C=!1;function vt(){try{const t=JSON.parse(localStorage.getItem(lt));return Array.isArray(t)?t:[]}catch{return[]}}function z(){localStorage.setItem(lt,JSON.stringify(q))}function dt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function Q(t){return V.find(e=>e.id===t)||V[0]}function bt(t){var n;const e=t.toLowerCase();return((n=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,a])=>a.some(r=>e.includes(r))))==null?void 0:n[0])||"solution"}function ut(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function yt(t,e){const i=t.files.length?t.files.map(a=>`${a.name}（${a.sizeLabel}）`).join("、"):"无附件",n=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(i)}</li>
      <li>粘贴内容：${n} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function kt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function $t(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function st(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const n=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name);let a="";if(n&&i.size<=1024*1024)try{a=(await i.text()).slice(0,12e3)}catch{a=""}return{id:dt(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:$t(i.size),excerpt:a}}))}function It(t){return V.map(e=>`
    <button class="skill-choice ${v.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}">
      <span>${t(e.icon)}</span>
      <strong>${t(e.name)}</strong>
      <small>${t(e.hint)}</small>
    </button>`).join("")}function wt(t){return v.files.length?`<div class="attachment-list">${v.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function nt(t){const e=q.filter(i=>i.status!=="confirmed").sort((i,n)=>new Date(n.updatedAt)-new Date(i.updatedAt));return e.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${e.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(i=>`
          <button type="button" data-task-action="open-task" data-task-id="${i.id}">
            <span>${t(Q(i.skillId).icon)}</span>
            <div><strong>${t(i.title)}</strong><small>${i.status==="review"?"待确认":"处理中"} · ${ut(i.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function At(t){if(L){const e=q.find(i=>i.id===L);if(e)return qt(e,t);L=""}return C?`
    <section class="inline-task-launcher expanded" aria-label="任务工作区">
      <form class="task-composer inline-task-composer" id="task-composer">
        <header class="inline-composer-header">
          <div><h2>发起任务</h2></div>
          <button class="quiet-button" type="button" data-task-action="collapse-launcher">收起</button>
        </header>
        <section class="inline-goal-panel">
          <label for="task-goal">希望最后帮你解决什么？</label>
          <textarea id="task-goal" rows="3" placeholder="例如：判断这个需求能否进入研发，并给出必须补齐的 P0 问题">${t(v.goal)}</textarea>
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
            ${wt(t)}
            <textarea id="task-material" rows="6" placeholder="粘贴文字、聊天记录、链接、会议纪要……">${t(v.material)}</textarea>
          </section>
          <section class="inline-skill-panel">
            <div class="inline-panel-heading"><span>02</span><div><strong>选择能力</strong></div></div>
            <div class="skill-grid">${It(t)}</div>
          </section>
        </div>
        <div class="composer-submit">
          <button class="primary-button task-start-button" type="submit">开始工作 <i>↗</i></button>
        </div>
      </form>
      ${nt(t)}
    </section>`:`
      <section class="inline-task-launcher" aria-label="发起任务">
        <div class="quick-task-entry">
          <span class="quick-task-icon" aria-hidden="true">✦</span>
          <input id="task-quick-goal" value="${t(v.goal)}" placeholder="今天想完成什么？" aria-label="今天想完成什么" />
          <div class="quick-task-actions">
            <button class="attachment-shortcut" type="button" data-task-action="expand-launcher">＋ 素材</button>
            <button class="primary-button" type="button" data-task-action="expand-launcher">发起任务</button>
          </div>
        </div>
        ${nt(t)}
      </section>`}function qt(t,e){var n;const i=t.status==="confirmed";return`
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${e(t.skillName)} · SKILL V${e(t.skillVersion)}</span><h1>${e(t.title)}</h1></div>
        <span class="status-pill ${i?"done":""}">${i?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${e(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${(n=t.revisions)!=null&&n.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${i?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${ut(t.updatedAt)}</small></div>
          ${D==="edit"&&!i?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${i?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':D==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function Tt(t){const e=q.filter(i=>i.status==="confirmed").sort((i,n)=>new Date(n.confirmedAt)-new Date(i.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(i=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${i.id}">
          <span>${t(Q(i.skillId).icon)}</span>
          <div><small>${t(i.skillName)}</small><strong>${t(i.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function St(){return{active:q.filter(t=>t.status!=="confirmed").length,confirmed:q.filter(t=>t.status==="confirmed").length}}function Et({render:t,escapeHtml:e,showToast:i,showResults:n}){document.querySelectorAll("[data-task-action]").forEach(s=>{s.addEventListener("click",async p=>{var f;const l=p.currentTarget.dataset.taskAction;if(l==="expand-launcher")Z(),C=!0,t(),requestAnimationFrame(()=>{var u;return(u=document.getElementById("task-goal"))==null?void 0:u.focus()});else if(l==="collapse-launcher")Z(),C=!1,t();else if(l==="choose-skill")v.skillId=p.currentTarget.dataset.skillId,Z(),t();else if(l==="remove-file")Z(),v.files=v.files.filter(u=>u.id!==p.currentTarget.dataset.fileId),t();else if(l==="open-task")L=p.currentTarget.dataset.taskId,D="compose",t();else if(l==="close-task"){const u=q.find(y=>y.id===L);L="",D="compose",C=!1,(u==null?void 0:u.status)==="confirmed"&&(n==null||n()),t()}else if(l==="edit-result")D="edit",t();else if(l==="cancel-edit")D="compose",t();else if(l==="save-revision"){const u=q.find(E=>E.id===p.currentTarget.dataset.taskId),y=(f=document.getElementById("task-result-input"))==null?void 0:f.value.trim();if(!u||!y)return;u.revisions||(u.revisions=[]),u.revisions.push({at:new Date().toISOString(),before:u.resultText||"",after:y}),u.resultText=y,u.resultHtml=`<p>${e(y).replaceAll(`
`,"</p><p>")}</p>`,u.updatedAt=new Date().toISOString(),z(),D="compose",t(),i("已保存人工修改，并记录为进化样本")}else if(l==="supplement-task"){const u=q.find(y=>y.id===L);if(!u)return;v={skillId:u.requestedSkillId,goal:u.goal,material:u.material,files:u.files},q=q.filter(y=>y.id!==u.id),z(),L="",D="compose",C=!0,t()}else if(l==="confirm-task"){const u=q.find(y=>y.id===p.currentTarget.dataset.taskId);if(!u)return;u.status="confirmed",u.confirmedAt=new Date().toISOString(),u.updatedAt=u.confirmedAt,z(),L="",D="compose",C=!1,n==null||n(),t(),i("已确认并放入成果区")}})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",s=>{var y;if(s.preventDefault(),Z(),!v.goal.trim()){i("请先写下希望解决的目标"),(y=document.getElementById("task-goal"))==null||y.focus();return}if(!v.material.trim()&&!v.files.length){i("请拖入文件或粘贴一些材料");return}const p=v.skillId==="auto"?bt(`${v.goal}
${v.material}
${v.files.map(E=>E.name).join(" ")}`):v.skillId,l=Q(p),f=new Date().toISOString(),u={id:dt(),title:kt(v.goal,l.name),requestedSkillId:v.skillId,skillId:p,skillName:l.name,skillVersion:"1.0.0",goal:v.goal.trim(),material:v.material.trim(),files:v.files,status:"review",createdAt:f,updatedAt:f,revisions:[]};u.resultHtml=yt(u,e),u.resultText=`材料已收齐并匹配 ${u.skillName}。目标：${u.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,q.push(u),z(),L=u.id,C=!1,v={skillId:"auto",goal:"",material:"",files:[]},t(),i(`已创建任务，并匹配“${l.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async s=>{Z(),v.files.push(...await st(s.target.files)),t(),i(`已加入 ${s.target.files.length} 个文件`)});const o=document.getElementById("material-drop");o==null||o.addEventListener("dragover",s=>{s.preventDefault(),o.classList.add("drag-over")}),o==null||o.addEventListener("dragleave",()=>o.classList.remove("drag-over")),o==null||o.addEventListener("drop",async s=>{s.preventDefault(),o.classList.remove("drag-over"),Z();const p=s.dataTransfer.files;v.files.push(...await st(p)),t(),i(`已加入 ${p.length} 个文件`)});const c=document.getElementById("task-quick-goal");c==null||c.addEventListener("input",()=>{v.goal=c.value}),c==null||c.addEventListener("focus",()=>{v.goal=c.value,C=!0,t(),requestAnimationFrame(()=>{const s=document.getElementById("task-goal");s==null||s.focus(),s==null||s.setSelectionRange(s.value.length,s.value.length)})},{once:!0})}function Z(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal"),i=document.getElementById("task-quick-goal");t&&(v.material=t.value),e&&(v.goal=e.value),i&&(v.goal=i.value)}const H="clair-service-report-workbench-v1",tt="clair-service-report-workbench-access",X="clair-service-report-workbench-view",R=6,K=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],F=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],N={version:R,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},J={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","yingmi-ai-capability-system":"reporting"},pt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function et(t){const e=`${t.title||""} ${t.source||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|工作台|原型/.test(e)?"product-demo":"product-planning"}function it(t,e=et(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""}`,n=[],a=r=>{n.includes(r)||n.push(r)};return/ontology\.yingmi-inc\.com|本体/.test(i)&&a("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&a("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&a("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&a("AI 小顾"),(/workbench|工作台|skill-audit/.test(i)||t.groupId==="ai-workbench")&&a("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&a("AI 开放平台"),/且慢|qieman/.test(i)&&a("且慢"),/投顾|advisor|财务规划/.test(i)&&a("投顾服务"),/OAP|oap-/.test(i)&&a("OAP"),/MCP|mcp-/.test(i)&&a("MCP"),/Skills|skill-/.test(i)&&a("Skills"),(e==="investment-research"||t.groupId==="research")&&a("投研"),e==="data-analysis"&&a("数据分析"),e==="requirement-review"&&a("需求评审"),e==="reporting"&&a("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&a("知识治理"),n.slice(0,5)}N.reports=N.reports.map(t=>{const e=pt[t.id]||t.groupId,i=J[t.id]||et(t),n={...t,groupId:e,workType:i};return{...n,tags:it(n,i)}});let m=xt(),w="",B="",O=!1,$=["topic","type","tag"].includes(localStorage.getItem(X))?localStorage.getItem(X):"topic",x="",T="",P="",b=null,rt=0;function gt(t){return JSON.parse(JSON.stringify(t))}function G(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function xt(){try{const t=JSON.parse(localStorage.getItem(H));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Lt(t)}catch{}return gt(N)}function Lt(t){const e=gt(N),i=new Set(e.groups.map(d=>d.id)),n=new Set(["inbox","today","product","research"]),a=new Map(t.groups.map(d=>[d.id,d])),r=e.groups.map(d=>{const k=a.get(d.id);return!k||t.version<R?d:{...d,name:k.name||d.name,description:k.description||d.description,position:Number.isFinite(k.position)?k.position:d.position}});t.groups.filter(d=>!i.has(d.id)&&!n.has(d.id)).forEach((d,k)=>{r.push({...d,description:d.description||"自定义工作分组",position:Number.isFinite(d.position)?d.position:N.groups.length+k})});const o=r.filter((d,k,I)=>I.findIndex(_=>_.id===d.id)===k);o.sort((d,k)=>(d.position||0)-(k.position||0));const c={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},s={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},p=t.reports.map(d=>({...d,groupId:pt[d.id]||c[d.id]||s[d.groupId]||d.groupId||"inbox",workType:d.workType||J[d.id]||et(d),tags:Array.isArray(d.tags)&&d.tags.length?d.tags:it(d,d.workType||J[d.id])})),l=new Map(p.map(d=>[d.id,d])),f=new Map(p.map(d=>[G(d.url),d])),u=new Set,y=e.reports.map(d=>{const k=G(d.url);u.add(k);const I=l.get(d.id)||f.get(k);return I?{...d,title:I.title||d.title,groupId:t.version>=R&&o.some(_=>_.id===I.groupId)?I.groupId:d.groupId,workType:t.version>=R&&I.workType?I.workType:d.workType,tags:t.version>=R&&Array.isArray(I.tags)&&I.tags.length?I.tags:d.tags,pinned:!!I.pinned,position:Number.isFinite(I.position)?I.position:d.position,archived:!!I.archived,archivedAt:I.archivedAt||""}:d});p.forEach(d=>{const k=G(d.url);u.has(k)||(u.add(k),y.push(d))});const E={version:R,groups:o,reports:y};return localStorage.setItem(H,JSON.stringify(E)),E}function S(){m.version=R,m.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(H,JSON.stringify(m))}function Y(t,e){const i=m.groups.findIndex(r=>r.id===t),n=m.groups.findIndex(r=>r.id===e);if(i<0||n<0||i===n)return!1;const[a]=m.groups.splice(i,1);return m.groups.splice(n,0,a),S(),!0}function Dt(t,e,i=""){const n=m.reports.find(c=>c.id===t);if(!n||n.archived||!m.groups.find(c=>c.id===e))return!1;const r=m.reports.filter(c=>!c.archived&&c.groupId===e&&c.id!==t).sort((c,s)=>(c.position||0)-(s.position||0)),o=i?r.findIndex(c=>c.id===i):r.length;return n.groupId=e,r.splice(o<0?r.length:o,0,n),r.forEach((c,s)=>{c.position=s}),S(),!0}function Pt(t){var e;return((e=K.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function Ot(t,e=""){const i=n=>!e||n.toLowerCase().includes(e);if($==="type")return K.map(n=>({id:n.id,name:n.name,kind:"type",accent:"blue",reports:t.filter(a=>a.workType===n.id).sort((a,r)=>+!!r.pinned-+!!a.pinned||new Date(r.createdAt)-new Date(a.createdAt))})).filter(n=>!e||n.reports.length||i(n.name));if($==="tag"){const n=new Set(F);return m.reports.forEach(r=>{(r.tags||[]).forEach(o=>n.add(o))}),[...n].sort((r,o)=>{const c=F.indexOf(r),s=F.indexOf(o);return c>=0||s>=0?(c<0?Number.MAX_SAFE_INTEGER:c)-(s<0?Number.MAX_SAFE_INTEGER:s):r.localeCompare(o,"zh-CN")}).map(r=>({id:r,name:r,kind:"tag",accent:"violet",reports:t.filter(o=>(o.tags||[]).includes(r)).sort((o,c)=>+!!c.pinned-+!!o.pinned||new Date(c.createdAt)-new Date(o.createdAt))})).filter(r=>r.reports.length&&(!e||i(r.name)||r.reports.length))}return m.groups.map(n=>({...n,kind:"topic",reports:t.filter(a=>a.groupId===n.id).sort((a,r)=>(a.position||0)-(r.position||0))})).filter(n=>!e||n.reports.length||i(`${n.name} ${n.description||""}`))}function U(t,e,i,n=""){const a=m.reports.find(r=>r.id===t);return!a||a.archived?!1:e==="topic"?Dt(t,i,n):e==="type"?K.some(r=>r.id===i)?(a.workType=i,S(),!0):!1:e==="tag"?(a.tags=Array.isArray(a.tags)?a.tags:[],a.tags.includes(i)||a.tags.push(i),S(),!0):!1}function M(){return $==="type"?"工作类型":$==="tag"?"标签":"主题"}function ot(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function g(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function j(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function mt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function W(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function A(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(rt),rt=window.setTimeout(()=>e.remove(),2600)}function ft(t,e=!1){const i=t.access!=="production",n=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=!i&&N.reports.some(o=>o.id===t.id)?`<img src="./previews/${g(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${i?"preview-restricted":""}">
        <span>${i?"ACCESS":g(t.title.slice(0,2))}</span>
        <strong>${i?n:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${i?"restricted-card":""} ${e?"archived-card":""} ${P===t.id?"is-move-selected":""}" data-report-id="${g(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${g(t.id)}" aria-label="打开${g(t.title)}">
        <span class="report-preview">
          ${r}
        </span>
        <span class="report-copy">
          <span class="report-source">${g(t.source||"手动添加")}</span>
          <strong>${g(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(o=>`<span>${g(o)}</span>`).join("")}</span>`:""}
          ${i?`<span class="report-access-note">${g(n)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${g(t.id)}"
          aria-label="拖动《${g(t.title)}》到其他${M()}" title="拖动到其他${M()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${g(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${g(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${g(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            <button type="button" data-action="edit" data-id="${g(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${g(t.id)}">归档</button>`}
      </div>
    </article>`}function at(){var i;if(!b)return"";if(b.type==="tags"){const n=m.reports.find(a=>a.id===b.reportId);return n?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${g(n.title)}</p>
          <label>标签
            <input name="tags" value="${g((n.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${F.map(a=>`<button type="button" class="${(n.tags||[]).includes(a)?"selected":""}" data-tag-suggestion="${g(a)}">${g(a)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(b.type==="group"){const n=b.mode==="edit"?m.groups.find(a=>a.id===b.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${n?"编辑工作主题":"新建工作主题"}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${g((n==null?void 0:n.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${g((n==null?void 0:n.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${n?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=b.mode==="edit"?m.reports.find(n=>n.id===b.reportId):null,e=(t==null?void 0:t.groupId)||b.groupId||((i=m.groups[0])==null?void 0:i.id)||"";return`
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
            <input name="url" type="url" value="${g((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${g((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${m.groups.map(n=>`<option value="${g(n.id)}" ${n.id===e?"selected":""}>${g(n.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${K.map(n=>`<option value="${g(n.id)}" ${n.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${g(n.name)}</option>`).join("")}
          </select>
        </label>
        <label>关键标签
          <input name="tags" value="${g(((t==null?void 0:t.tags)||[]).join("、"))}" placeholder="本体、飞书、调研" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function Ct(){return`
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
    </main>`}function Bt(t){const e=t.access!=="production",i=t.access==="org"?"组织账号":"站点账号",n=e?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${i}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${i}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${g(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${g(j(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}" src="${g(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${g(t.title)}</strong>
          <span>${g(j(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${g(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${g(t.id)}">编辑</button>
        </div>
      </header>
      ${n}
      ${at()}
    </main>`}function ht(t){const e=St();return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair的工作台</strong></div>
      </div>
      <div class="topbar-location">
        <strong>${O?"归档区":"成果区"}</strong>
        ${!O&&e.active?`<span>${e.active} 项待处理</span>`:""}
      </div>
      <div class="top-actions">
        <button class="quiet-button archive-nav-button" type="button" data-action="${O?"show-catalog":"show-archive"}">
          ${O?"返回成果区":`归档${t?`<span>${t}</span>`:""}`}
        </button>
        ${O?"":'<button class="primary-button" type="button" data-action="add-report">新增成果</button>'}
      </div>
    </header>`}function Zt(){const t=m.reports.filter(i=>i.archived).filter(i=>{if(!w.trim())return!0;const n=w.trim().toLowerCase();return`${i.title} ${i.url} ${i.source||""}`.toLowerCase().includes(n)}).sort((i,n)=>new Date(n.archivedAt||0)-new Date(i.archivedAt||0)),e=m.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${ht(e)}
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
              <div><h2>${w?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(i=>ft(i,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${w?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${w?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${w?"clear-search":"show-catalog"}">${w?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Safe archive</span></footer>
      ${at()}
    </main>`}function Rt(){if(O)return Zt();const t=w.trim().toLowerCase(),e=m.reports.filter(s=>!s.archived),i=t?e.filter(s=>`${s.title} ${s.source||""} ${s.access||""} ${Pt(s.workType)} ${(s.tags||[]).join(" ")}`.toLowerCase().includes(t)):e,n=m.reports.filter(s=>s.archived).length,a=e.filter(s=>s.access==="production").length,r=e.filter(s=>s.access!=="production").length,o=Ot(i,t),c=$==="type"?"工作类型":$==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${ht(n)}
      <section class="workspace">
        ${At(g)}
        <div class="results-toolbar unified-results-toolbar">
          <div class="results-title">
            <h1>我的成果</h1>
          </div>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${e.length}</strong><span>份成果</span>
              <i></i>
              <strong>${m.groups.length}</strong><span>个主题</span>
              <i></i>
              <strong>${a}</strong><span>可直接访问</span>
            </div>
            <label class="search results-search">
              <input id="search-input" value="${g(w)}" placeholder="搜索成果" aria-label="搜索成果" />
              ${w?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${Tt(g)}
        <section class="groups-section">
          ${P?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${M()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div>
              <h2>${c}</h2>
              <span>${$==="tag"?"一份报告可属于多个标签":"拖动卡片即可调整归类"}</span>
            </div>
            <div class="classification-actions">
              <div class="view-switcher" role="tablist" aria-label="成果分类方式">
                <button type="button" role="tab" aria-selected="${$==="topic"}" class="${$==="topic"?"active":""}" data-action="set-view" data-id="topic">按主题</button>
                <button type="button" role="tab" aria-selected="${$==="type"}" class="${$==="type"?"active":""}" data-action="set-view" data-id="type">按工作类型</button>
                <button type="button" role="tab" aria-selected="${$==="tag"}" class="${$==="tag"?"active":""}" data-action="set-view" data-id="tag">按标签</button>
              </div>
              <button class="primary-button add-topic-button" type="button" data-action="add-group">＋ 新建工作主题</button>
            </div>
          </div>
          ${o.length?`
            <nav class="topic-nav" aria-label="报告${c}">
              ${o.map((s,p)=>`<a href="#bucket-${p}">${g(s.name)}<span>${s.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board catalog-view-${$}">
              ${o.map((s,p)=>`
                <section id="bucket-${p}" class="group-column topic-section bucket-${g(s.kind)} accent-${g(s.accent||"blue")}"
                  data-bucket-kind="${g(s.kind)}"
                  data-bucket-id="${g(s.id)}"
                  ${s.kind==="topic"?`data-group-id="${g(s.id)}"`:""}>
                  <header class="group-header">
                    ${s.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${g(s.id)}"
                          aria-label="拖动“${g(s.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(p+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${s.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${g(s.name)}</h2></div>
                      <span class="count">${s.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${P?`<button class="move-here-button" type="button" data-action="move-here" data-id="${g(s.id)}" data-bucket-kind="${g(s.kind)}">移到这里</button>`:""}
                      ${s.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${g(s.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${g(s.id)}">编辑主题</button>
                           ${s.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${g(s.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${s.reports.length?s.reports.map(l=>ft(l)).join(""):s.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${g(s.id)}">
                            <strong>拖报告到这里</strong>
                            <span>或点击添加第一份报告</span>
                          </button>`:'<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>'}
                  </div>
                </section>`).join("")}
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${r} 份报告需要组织或账号登录${n?` · ${n} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${at()}
    </main>`}function h(){const t=document.getElementById("app");if(sessionStorage.getItem(tt)!=="ok"){t.innerHTML=Ct(),Nt();return}const e=B&&m.reports.find(i=>i.id===B);t.innerHTML=e?Bt(e):Rt(),Mt(),Et({render:h,escapeHtml:g,showToast:A,showResults:()=>{O=!1}})}function Nt(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const n=t.querySelector(".form-error");n.hidden=!1,n.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(tt,"ok"),h()})}async function ct(t){var o,c;const e=t.elements.url,i=t.elements.title,n=t.querySelector('[data-action="detect-title"]'),a=t.querySelector(".field-hint"),r=e.value.trim();if(!mt(r))return a.textContent="请输入完整的 http 或 https 网址","";n.disabled=!0,n.innerHTML='<span class="mini-spinner"></span>',a.textContent="正在读取网页标题…";try{const s=`https://api.microlink.io/?url=${encodeURIComponent(r)}`,p=await fetch(s,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!p.ok)throw new Error("read failed");const l=await p.json(),f=((c=(o=l==null?void 0:l.data)==null?void 0:o.title)==null?void 0:c.trim())||j(r);return i.value=f.slice(0,180),a.textContent="已识别网页标题",i.value}catch{const s=j(r);return i.value||(i.value=s),a.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{n.disabled=!1,n.textContent="识别标题"}}function Mt(){var n;(n=document.getElementById("search-input"))==null||n.addEventListener("input",a=>{w=a.target.value,h();const r=document.getElementById("search-input");r==null||r.focus(),r==null||r.setSelectionRange(w.length,w.length)}),document.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",async r=>{var s,p;const o=r.currentTarget.dataset.action,c=r.currentTarget.dataset.id;if(o==="open")B=c,h();else if(o==="back")B="",b=null,h();else if(o==="lock")sessionStorage.removeItem(tt),h();else if(o==="clear-search")w="",h();else if(o==="set-view"){if(!["topic","type","tag"].includes(c))return;$=c,P="",localStorage.setItem(X,$),h()}else if(o==="cancel-move")P="",h();else if(o==="move-here"){const l=r.currentTarget.dataset.bucketKind||$;P&&U(P,l,c)&&(P="",h(),A(l==="tag"?"已添加目标标签":`报告已移入目标${M()}`))}else if(o==="show-archive")O=!0,w="",B="",h();else if(o==="show-catalog")O=!1,w="",B="",h();else if(o==="add-report")b={type:"report",mode:"create",groupId:((s=m.groups[1])==null?void 0:s.id)||((p=m.groups[0])==null?void 0:p.id)},h();else if(o==="add-to-group")b={type:"report",mode:"create",groupId:c},h();else if(o==="edit")b={type:"report",mode:"edit",reportId:c},h();else if(o==="edit-tags")b={type:"tags",reportId:c},h();else if(o==="close-modal")b=null,h();else if(o==="detect-title")await ct(r.currentTarget.closest("form"));else if(o==="archive"){const l=m.reports.find(f=>f.id===c);if(!l)return;l.archived=!0,l.archivedAt=new Date().toISOString(),S(),h(),A("已归档，可随时恢复")}else if(o==="restore"){const l=m.reports.find(f=>f.id===c);if(!l)return;l.archived=!1,l.archivedAt="",S(),h(),A("报告已恢复到原主题")}else if(o==="delete"){const l=m.reports.find(f=>f.id===c);l!=null&&l.archived&&confirm(`二次确认：永久删除“${l.title}”？

删除后无法从归档区恢复。`)&&(m.reports=m.reports.filter(f=>f.id!==c),B===c&&(B=""),S(),h(),A("报告已永久删除"))}else if(o==="add-group")b={type:"group",mode:"create"},h();else if(o==="rename-group")m.groups.find(f=>f.id===c)&&(b={type:"group",mode:"edit",groupId:c},h());else if(o==="delete-group"){const l=m.groups.find(f=>f.id===c);l&&confirm(`删除“${l.name}”？其中的报告会移到“待整理”。`)&&(m.reports.forEach(f=>{f.groupId===c&&(f.groupId="inbox")}),m.groups=m.groups.filter(f=>f.id!==c),S(),h(),A("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(a=>{let r=null,o=!1;const c=()=>{var s;x="",r=null,o=!1,(s=a.closest(".report-card"))==null||s.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};a.addEventListener("pointerdown",s=>{var p,l;s.preventDefault(),x=a.dataset.reportDragId,T="",r={x:s.clientX,y:s.clientY},o=!1,(p=a.setPointerCapture)==null||p.call(a,s.pointerId),(l=a.closest(".report-card"))==null||l.classList.add("is-dragging")}),a.addEventListener("pointermove",s=>{if(!x||r&&Math.hypot(s.clientX-r.x,s.clientY-r.y)<7)return;o=!0;const p=document.elementFromPoint(s.clientX,s.clientY),l=p==null?void 0:p.closest(".report-card"),f=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(u=>{u.classList.toggle("is-card-drop-target",!!(l&&l!==a.closest(".report-card")&&u===l))}),document.querySelectorAll(".group-column").forEach(u=>{u.classList.toggle("is-drop-ready",!!(f&&u===f))})}),a.addEventListener("pointerup",s=>{if(!x)return;const p=x;if(!o){P=p,c(),h(),A(`请选择目标${M()}`);return}const l=document.elementFromPoint(s.clientX,s.clientY),f=l==null?void 0:l.closest(".report-card"),u=l==null?void 0:l.closest(".group-column"),y=(f==null?void 0:f.dataset.reportId)||"",E=(u==null?void 0:u.dataset.bucketId)||"",d=(u==null?void 0:u.dataset.bucketKind)||$,k=y&&y!==p?U(p,d,E,y):E?U(p,d,E):!1;c(),k&&(h(),A(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":y?"报告顺序已更新":"已移入新主题"))}),a.addEventListener("pointercancel",c)}),document.querySelectorAll(".group-drag-handle").forEach(a=>{const r=()=>{var o;T="",(o=a.closest(".group-column"))==null||o.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(c=>{c.classList.remove("is-group-drop-target","is-drop-ready")})};a.addEventListener("pointerdown",o=>{var c,s;o.preventDefault(),T=a.dataset.groupDragId,x="",(c=a.setPointerCapture)==null||c.call(a,o.pointerId),(s=a.closest(".group-column"))==null||s.classList.add("is-group-dragging")}),a.addEventListener("pointermove",o=>{T&&document.querySelectorAll(".group-column").forEach(c=>{var s;c.classList.toggle("is-group-drop-target",c===((s=document.elementFromPoint(o.clientX,o.clientY))==null?void 0:s.closest(".group-column")))})}),a.addEventListener("pointerup",o=>{var p;if(!T)return;const c=T,s=(p=document.elementFromPoint(o.clientX,o.clientY))==null?void 0:p.closest(".group-column");if(s&&Y(c,s.dataset.groupId)){T="",h(),A("分组顺序已更新");return}r()}),a.addEventListener("pointercancel",r),a.addEventListener("keydown",o=>{var l;if(!["ArrowLeft","ArrowRight"].includes(o.key))return;o.preventDefault();const c=m.groups.findIndex(f=>f.id===a.dataset.groupDragId),s=o.key==="ArrowLeft"?c-1:c+1,p=m.groups[s];!p||!Y(a.dataset.groupDragId,p.id)||(h(),A("分组顺序已更新"),(l=document.querySelector(`[data-group-drag-id="${CSS.escape(a.dataset.groupDragId)}"]`))==null||l.focus())})}),document.querySelectorAll(".group-column").forEach(a=>{a.addEventListener("dragover",r=>{r.preventDefault(),a.classList.add(T?"is-group-drop-target":"is-drop-ready")}),a.addEventListener("dragleave",()=>{a.classList.remove("is-drop-ready","is-group-drop-target")}),a.addEventListener("drop",r=>{if(r.preventDefault(),T){if(a.dataset.bucketKind==="topic"&&Y(T,a.dataset.groupId)){T="",h(),A("分组顺序已更新");return}T="",a.classList.remove("is-group-drop-target");return}const o=m.reports.find(s=>s.id===x),c=a.dataset.bucketKind||$;o&&U(x,c,a.dataset.bucketId)&&(x="",h(),A(c==="tag"?"已添加目标标签":c==="type"?"工作类型已更新":"已移入新主题")),x=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(a=>{a.addEventListener("click",()=>{const r=document.querySelector('#tag-form input[name="tags"]');if(!r)return;const o=W(r.value),c=a.dataset.tagSuggestion;r.value=o.includes(c)?o.filter(s=>s!==c).join("、"):[...o,c].slice(0,8).join("、"),a.classList.toggle("selected",!o.includes(c)),r.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",a=>{a.preventDefault();const r=m.reports.find(o=>o.id===b.reportId);r&&(r.tags=W(new FormData(t).get("tags")),S(),b=null,h(),A("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",a=>{var s,p;a.preventDefault();const r=(s=new FormData(e).get("name"))==null?void 0:s.trim(),o=(p=new FormData(e).get("description"))==null?void 0:p.trim();if(!r)return;if(b.mode==="edit"){const l=m.groups.find(f=>f.id===b.groupId);if(!l)return;l.name=r.slice(0,60),l.description=(o==null?void 0:o.slice(0,80))||"自定义工作主题"}else m.groups.push({id:ot("group"),name:r.slice(0,60),description:(o==null?void 0:o.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][m.groups.length%4],position:m.groups.length});S();const c=b.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";b=null,h(),A(c)});const i=document.getElementById("report-form");i==null||i.addEventListener("submit",async a=>{a.preventDefault();const r=i.elements.url.value.trim();if(!mt(r))return;const o=i.querySelector('button[type="submit"]');o.disabled=!0,o.innerHTML='<span class="mini-spinner"></span>';let c=i.elements.title.value.trim();c||(c=await ct(i));const s=i.elements.groupId.value,p=i.elements.workType.value,l=W(i.elements.tags.value);if(b.mode==="edit"){const f=m.reports.find(u=>u.id===b.reportId);Object.assign(f,{title:c,url:r,groupId:s,workType:p,tags:l})}else{const f={id:ot("report"),groupId:s,title:c||j(r),url:r,pinned:!1,position:m.reports.filter(u=>u.groupId===s).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:p,tags:l};f.tags.length||(f.tags=it(f,f.workType)),m.reports.push(f)}S(),b=null,h(),A("报告已保存")})}function jt(){h()}jt(document.getElementById("app"));
