(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();const lt="clair-ai-studio-tasks-v1",W=[{id:"auto",name:"智能识别",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",icon:"历",hint:"事实、能力、匹配、核验"}];let q=vt(),v={skillId:"auto",goal:"",material:"",files:[]},L="",P="compose",C=!1;function vt(){try{const t=JSON.parse(localStorage.getItem(lt));return Array.isArray(t)?t:[]}catch{return[]}}function z(){localStorage.setItem(lt,JSON.stringify(q))}function dt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function Q(t){return W.find(a=>a.id===t)||W[0]}function bt(t){var s;const a=t.toLowerCase();return((s=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,i])=>i.some(n=>a.includes(n))))==null?void 0:s[0])||"solution"}function ut(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function yt(t,a){const e=t.files.length?t.files.map(i=>`${i.name}（${i.sizeLabel}）`).join("、"):"无附件",s=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${a(t.skillName)}</strong>，目标是：${a(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${a(e)}</li>
      <li>粘贴内容：${s} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function kt(t,a){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${a}`}function $t(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function st(t){const a=[...t].slice(0,20);return Promise.all(a.map(async e=>{const s=e.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(e.name);let i="";if(s&&e.size<=1024*1024)try{i=(await e.text()).slice(0,12e3)}catch{i=""}return{id:dt(),name:e.name,type:e.type||"文件",size:e.size,sizeLabel:$t(e.size),excerpt:i}}))}function It(t){return W.map(a=>`
    <button class="skill-choice ${v.skillId===a.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${a.id}">
      <span>${t(a.icon)}</span>
      <strong>${t(a.name)}</strong>
      <small>${t(a.hint)}</small>
    </button>`).join("")}function wt(t){return v.files.length?`<div class="attachment-list">${v.files.map(a=>`
    <span class="attachment-chip">
      <b>${t(a.name)}</b><small>${t(a.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(a.name)}" data-task-action="remove-file" data-file-id="${a.id}">×</button>
    </span>`).join("")}</div>`:""}function nt(t){const a=q.filter(e=>e.status!=="confirmed").sort((e,s)=>new Date(s.updatedAt)-new Date(e.updatedAt));return a.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${a.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${a.slice(0,3).map(e=>`
          <button type="button" data-task-action="open-task" data-task-id="${e.id}">
            <span>${t(Q(e.skillId).icon)}</span>
            <div><strong>${t(e.title)}</strong><small>${e.status==="review"?"待确认":"处理中"} · ${ut(e.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function At(t){if(L){const a=q.find(e=>e.id===L);if(a)return qt(a,t);L=""}return C?`
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
          <input id="task-quick-goal" value="${t(v.goal)}" placeholder="想完成什么？" aria-label="想完成什么" />
          <div class="quick-task-actions">
            <button class="attachment-shortcut" type="button" data-task-action="expand-launcher">添加材料</button>
            <button class="primary-button" type="button" data-task-action="expand-launcher">开始 <span aria-hidden="true">↗</span></button>
          </div>
        </div>
        ${nt(t)}
      </section>`}function qt(t,a){var s;const e=t.status==="confirmed";return`
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${a(t.skillName)} · SKILL V${a(t.skillVersion)}</span><h1>${a(t.title)}</h1></div>
        <span class="status-pill ${e?"done":""}">${e?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${a(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${(s=t.revisions)!=null&&s.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${e?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${ut(t.updatedAt)}</small></div>
          ${P==="edit"&&!e?`<textarea id="task-result-input" rows="20">${a(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${a(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${e?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':P==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function St(t){const a=q.filter(e=>e.status==="confirmed").sort((e,s)=>new Date(s.confirmedAt)-new Date(e.confirmedAt));return a.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${a.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${a.map(e=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${e.id}">
          <span>${t(Q(e.skillId).icon)}</span>
          <div><small>${t(e.skillName)}</small><strong>${t(e.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function Tt(){return{active:q.filter(t=>t.status!=="confirmed").length,confirmed:q.filter(t=>t.status==="confirmed").length}}function Et({render:t,escapeHtml:a,showToast:e,showResults:s}){document.querySelectorAll("[data-task-action]").forEach(l=>{l.addEventListener("click",async o=>{var m;const d=o.currentTarget.dataset.taskAction;if(d==="expand-launcher")Z(),C=!0,t(),requestAnimationFrame(()=>{var p;return(p=document.getElementById("task-goal"))==null?void 0:p.focus()});else if(d==="collapse-launcher")Z(),C=!1,t();else if(d==="choose-skill")v.skillId=o.currentTarget.dataset.skillId,Z(),t();else if(d==="remove-file")Z(),v.files=v.files.filter(p=>p.id!==o.currentTarget.dataset.fileId),t();else if(d==="open-task")L=o.currentTarget.dataset.taskId,P="compose",t();else if(d==="close-task"){const p=q.find(y=>y.id===L);L="",P="compose",C=!1,(p==null?void 0:p.status)==="confirmed"&&(s==null||s()),t()}else if(d==="edit-result")P="edit",t();else if(d==="cancel-edit")P="compose",t();else if(d==="save-revision"){const p=q.find(E=>E.id===o.currentTarget.dataset.taskId),y=(m=document.getElementById("task-result-input"))==null?void 0:m.value.trim();if(!p||!y)return;p.revisions||(p.revisions=[]),p.revisions.push({at:new Date().toISOString(),before:p.resultText||"",after:y}),p.resultText=y,p.resultHtml=`<p>${a(y).replaceAll(`
`,"</p><p>")}</p>`,p.updatedAt=new Date().toISOString(),z(),P="compose",t(),e("已保存人工修改，并记录为进化样本")}else if(d==="supplement-task"){const p=q.find(y=>y.id===L);if(!p)return;v={skillId:p.requestedSkillId,goal:p.goal,material:p.material,files:p.files},q=q.filter(y=>y.id!==p.id),z(),L="",P="compose",C=!0,t()}else if(d==="confirm-task"){const p=q.find(y=>y.id===o.currentTarget.dataset.taskId);if(!p)return;p.status="confirmed",p.confirmedAt=new Date().toISOString(),p.updatedAt=p.confirmedAt,z(),L="",P="compose",C=!1,s==null||s(),t(),e("已确认并放入成果区")}})});const i=document.getElementById("task-composer");i==null||i.addEventListener("submit",l=>{var y;if(l.preventDefault(),Z(),!v.goal.trim()){e("请先写下希望解决的目标"),(y=document.getElementById("task-goal"))==null||y.focus();return}if(!v.material.trim()&&!v.files.length){e("请拖入文件或粘贴一些材料");return}const o=v.skillId==="auto"?bt(`${v.goal}
${v.material}
${v.files.map(E=>E.name).join(" ")}`):v.skillId,d=Q(o),m=new Date().toISOString(),p={id:dt(),title:kt(v.goal,d.name),requestedSkillId:v.skillId,skillId:o,skillName:d.name,skillVersion:"1.0.0",goal:v.goal.trim(),material:v.material.trim(),files:v.files,status:"review",createdAt:m,updatedAt:m,revisions:[]};p.resultHtml=yt(p,a),p.resultText=`材料已收齐并匹配 ${p.skillName}。目标：${p.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,q.push(p),z(),L=p.id,C=!1,v={skillId:"auto",goal:"",material:"",files:[]},t(),e(`已创建任务，并匹配“${d.name}”`)});const n=document.getElementById("task-files");n==null||n.addEventListener("change",async l=>{Z(),v.files.push(...await st(l.target.files)),t(),e(`已加入 ${l.target.files.length} 个文件`)});const r=document.getElementById("material-drop");r==null||r.addEventListener("dragover",l=>{l.preventDefault(),r.classList.add("drag-over")}),r==null||r.addEventListener("dragleave",()=>r.classList.remove("drag-over")),r==null||r.addEventListener("drop",async l=>{l.preventDefault(),r.classList.remove("drag-over"),Z();const o=l.dataTransfer.files;v.files.push(...await st(o)),t(),e(`已加入 ${o.length} 个文件`)});const c=document.getElementById("task-quick-goal");c==null||c.addEventListener("input",()=>{v.goal=c.value}),c==null||c.addEventListener("focus",()=>{v.goal=c.value,C=!0,t(),requestAnimationFrame(()=>{const l=document.getElementById("task-goal");l==null||l.focus(),l==null||l.setSelectionRange(l.value.length,l.value.length)})},{once:!0})}function Z(){const t=document.getElementById("task-material"),a=document.getElementById("task-goal"),e=document.getElementById("task-quick-goal");t&&(v.material=t.value),a&&(v.goal=a.value),e&&(v.goal=e.value)}const H="clair-service-report-workbench-v1",tt="clair-service-report-workbench-access",X="clair-service-report-workbench-view",N=6,K=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],F=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],R={version:N,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},J={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","yingmi-ai-capability-system":"reporting"},pt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function et(t){const a=`${t.title||""} ${t.source||""}`;return/需求评审|评审工作台/.test(a)?"requirement-review":/竞品|对比|调研|研究/.test(a)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(a)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(a)?"data-analysis":/基金|策略|投研|资产配置/.test(a)?"investment-research":/审查|治理|知识/.test(a)?"governance-review":/Demo|工作台|原型/.test(a)?"product-demo":"product-planning"}function at(t,a=et(t)){const e=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""}`,s=[],i=n=>{s.includes(n)||s.push(n)};return/ontology\.yingmi-inc\.com|本体/.test(e)&&i("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(e)&&i("飞书"),(a==="competitive-research"||/调研|研究|盘点/.test(e))&&i("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(e)||t.groupId==="xiaogu")&&i("AI 小顾"),(/workbench|工作台|skill-audit/.test(e)||t.groupId==="ai-workbench")&&i("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(e)||t.groupId==="ai-platform")&&i("AI 开放平台"),/且慢|qieman/.test(e)&&i("且慢"),/投顾|advisor|财务规划/.test(e)&&i("投顾服务"),/OAP|oap-/.test(e)&&i("OAP"),/MCP|mcp-/.test(e)&&i("MCP"),/Skills|skill-/.test(e)&&i("Skills"),(a==="investment-research"||t.groupId==="research")&&i("投研"),a==="data-analysis"&&i("数据分析"),a==="requirement-review"&&i("需求评审"),a==="reporting"&&i("经营汇报"),(a==="governance-review"||t.groupId==="knowledge")&&i("知识治理"),s.slice(0,5)}R.reports=R.reports.map(t=>{const a=pt[t.id]||t.groupId,e=J[t.id]||et(t),s={...t,groupId:a,workType:e};return{...s,tags:at(s,e)}});let f=xt(),w="",B="",O=!1,$=["topic","type","tag"].includes(localStorage.getItem(X))?localStorage.getItem(X):"topic",x="",S="",D="",b=null,rt=0;function gt(t){return JSON.parse(JSON.stringify(t))}function G(t=""){try{const a=new URL(t);a.hash="",a.search="";const e=decodeURI(a.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${a.origin}${e}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function xt(){try{const t=JSON.parse(localStorage.getItem(H));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Lt(t)}catch{}return gt(R)}function Lt(t){const a=gt(R),e=new Set(a.groups.map(u=>u.id)),s=new Set(["inbox","today","product","research"]),i=new Map(t.groups.map(u=>[u.id,u])),n=a.groups.map(u=>{const k=i.get(u.id);return!k||t.version<N?u:{...u,name:k.name||u.name,description:k.description||u.description,position:Number.isFinite(k.position)?k.position:u.position}});t.groups.filter(u=>!e.has(u.id)&&!s.has(u.id)).forEach((u,k)=>{n.push({...u,description:u.description||"自定义工作分组",position:Number.isFinite(u.position)?u.position:R.groups.length+k})});const r=n.filter((u,k,I)=>I.findIndex(_=>_.id===u.id)===k);r.sort((u,k)=>(u.position||0)-(k.position||0));const c={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},l={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},o=t.reports.map(u=>({...u,groupId:pt[u.id]||c[u.id]||l[u.groupId]||u.groupId||"inbox",workType:u.workType||J[u.id]||et(u),tags:Array.isArray(u.tags)&&u.tags.length?u.tags:at(u,u.workType||J[u.id])})),d=new Map(o.map(u=>[u.id,u])),m=new Map(o.map(u=>[G(u.url),u])),p=new Set,y=a.reports.map(u=>{const k=G(u.url);p.add(k);const I=d.get(u.id)||m.get(k);return I?{...u,title:I.title||u.title,groupId:t.version>=N&&r.some(_=>_.id===I.groupId)?I.groupId:u.groupId,workType:t.version>=N&&I.workType?I.workType:u.workType,tags:t.version>=N&&Array.isArray(I.tags)&&I.tags.length?I.tags:u.tags,pinned:!!I.pinned,position:Number.isFinite(I.position)?I.position:u.position,archived:!!I.archived,archivedAt:I.archivedAt||""}:u});o.forEach(u=>{const k=G(u.url);p.has(k)||(p.add(k),y.push(u))});const E={version:N,groups:r,reports:y};return localStorage.setItem(H,JSON.stringify(E)),E}function T(){f.version=N,f.groups.forEach((t,a)=>{t.position=a}),localStorage.setItem(H,JSON.stringify(f))}function Y(t,a){const e=f.groups.findIndex(n=>n.id===t),s=f.groups.findIndex(n=>n.id===a);if(e<0||s<0||e===s)return!1;const[i]=f.groups.splice(e,1);return f.groups.splice(s,0,i),T(),!0}function Dt(t,a,e=""){const s=f.reports.find(c=>c.id===t);if(!s||s.archived||!f.groups.find(c=>c.id===a))return!1;const n=f.reports.filter(c=>!c.archived&&c.groupId===a&&c.id!==t).sort((c,l)=>(c.position||0)-(l.position||0)),r=e?n.findIndex(c=>c.id===e):n.length;return s.groupId=a,n.splice(r<0?n.length:r,0,s),n.forEach((c,l)=>{c.position=l}),T(),!0}function Pt(t){var a;return((a=K.find(e=>e.id===t))==null?void 0:a.name)||"产品规划"}function Ot(t,a=""){const e=s=>!a||s.toLowerCase().includes(a);if($==="type")return K.map(s=>({id:s.id,name:s.name,kind:"type",accent:"blue",reports:t.filter(i=>i.workType===s.id).sort((i,n)=>+!!n.pinned-+!!i.pinned||new Date(n.createdAt)-new Date(i.createdAt))})).filter(s=>!a||s.reports.length||e(s.name));if($==="tag"){const s=new Set(F);return f.reports.forEach(n=>{(n.tags||[]).forEach(r=>s.add(r))}),[...s].sort((n,r)=>{const c=F.indexOf(n),l=F.indexOf(r);return c>=0||l>=0?(c<0?Number.MAX_SAFE_INTEGER:c)-(l<0?Number.MAX_SAFE_INTEGER:l):n.localeCompare(r,"zh-CN")}).map(n=>({id:n,name:n,kind:"tag",accent:"violet",reports:t.filter(r=>(r.tags||[]).includes(n)).sort((r,c)=>+!!c.pinned-+!!r.pinned||new Date(c.createdAt)-new Date(r.createdAt))})).filter(n=>n.reports.length&&(!a||e(n.name)||n.reports.length))}return f.groups.map(s=>({...s,kind:"topic",reports:t.filter(i=>i.groupId===s.id).sort((i,n)=>(i.position||0)-(n.position||0))})).filter(s=>!a||s.reports.length||e(`${s.name} ${s.description||""}`))}function U(t,a,e,s=""){const i=f.reports.find(n=>n.id===t);return!i||i.archived?!1:a==="topic"?Dt(t,e,s):a==="type"?K.some(n=>n.id===e)?(i.workType=e,T(),!0):!1:a==="tag"?(i.tags=Array.isArray(i.tags)?i.tags:[],i.tags.includes(e)||i.tags.push(e),T(),!0):!1}function M(){return $==="type"?"工作类型":$==="tag"?"标签":"主题"}function ot(t){var a;return`${t}-${((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`}`}function g(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function j(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function mt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function V(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(a=>a.trim()).filter(Boolean).map(a=>a.slice(0,20)))].slice(0,8)}function A(t){var e;(e=document.querySelector(".toast"))==null||e.remove();const a=document.createElement("div");a.className="toast",a.setAttribute("role","status"),a.textContent=t,document.body.append(a),clearTimeout(rt),rt=window.setTimeout(()=>a.remove(),2600)}function ft(t,a=!1){const e=t.access!=="production",s=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",n=!e&&R.reports.some(r=>r.id===t.id)?`<img src="./previews/${g(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${e?"preview-restricted":""}">
        <span>${e?"ACCESS":g(t.title.slice(0,2))}</span>
        <strong>${e?s:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${e?"restricted-card":""} ${a?"archived-card":""} ${D===t.id?"is-move-selected":""}" data-report-id="${g(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${g(t.id)}" aria-label="打开${g(t.title)}">
        <span class="report-preview">
          ${n}
        </span>
        <span class="report-copy">
          <span class="report-source">${g(t.source||"手动添加")}</span>
          <strong>${g(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(r=>`<span>${g(r)}</span>`).join("")}</span>`:""}
          ${e?`<span class="report-access-note">${g(s)}</span>`:""}
        </span>
      </button>
      ${a?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${g(t.id)}"
          aria-label="拖动《${g(t.title)}》到其他${M()}" title="拖动到其他${M()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${a?`
            <button type="button" data-action="restore" data-id="${g(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${g(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${g(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            <button type="button" data-action="edit" data-id="${g(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${g(t.id)}">归档</button>`}
      </div>
    </article>`}function it(){var e;if(!b)return"";if(b.type==="tags"){const s=f.reports.find(i=>i.id===b.reportId);return s?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${g(s.title)}</p>
          <label>标签
            <input name="tags" value="${g((s.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${F.map(i=>`<button type="button" class="${(s.tags||[]).includes(i)?"selected":""}" data-tag-suggestion="${g(i)}">${g(i)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(b.type==="group"){const s=b.mode==="edit"?f.groups.find(i=>i.id===b.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${s?"编辑工作主题":"新建工作主题"}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${g((s==null?void 0:s.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${g((s==null?void 0:s.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${s?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=b.mode==="edit"?f.reports.find(s=>s.id===b.reportId):null,a=(t==null?void 0:t.groupId)||b.groupId||((e=f.groups[0])==null?void 0:e.id)||"";return`
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
            ${f.groups.map(s=>`<option value="${g(s.id)}" ${s.id===a?"selected":""}>${g(s.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${K.map(s=>`<option value="${g(s.id)}" ${s.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${g(s.name)}</option>`).join("")}
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
        <div class="gate-brand">
          <div class="brand-mark">C</div>
          <span>PRIVATE STUDIO</span>
        </div>
        <h1>Clair's Studio</h1>
        <p>把思考、决策与成果，放在同一个地方。</p>
        <form class="login-form" id="login-form">
          <label class="sr-only" for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="访问口令" autofocus />
            <button type="submit" class="primary-button" aria-label="进入 Clair's Studio">→</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>Private by design</span><span>Local-first</span></div>
      </section>
    </main>`}function Bt(t){const a=t.access!=="production",e=t.access==="org"?"组织账号":"站点账号",s=a?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${e}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${e}登录，验证码与授权只在原网站处理。</small></div></li>
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
          <a class="${a?"primary-button":"quiet-button"}" href="${g(t.url)}" target="_blank" rel="noreferrer">${a?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${g(t.id)}">编辑</button>
        </div>
      </header>
      ${s}
      ${it()}
    </main>`}function ht(t){const a=Tt();return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      <div class="topbar-location">
        <span class="location-dot"></span>
        <strong>${O?"Archive":"Library"}</strong>
        ${!O&&a.active?`<span>${a.active} 项待处理</span>`:""}
      </div>
      <div class="top-actions">
        <button class="quiet-button archive-nav-button" type="button" data-action="${O?"show-catalog":"show-archive"}">
          ${O?"返回":`归档${t?`<span>${t}</span>`:""}`}
        </button>
        ${O?"":'<button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span> 新增</button>'}
      </div>
    </header>`}function Zt(){const t=f.reports.filter(e=>e.archived).filter(e=>{if(!w.trim())return!0;const s=w.trim().toLowerCase();return`${e.title} ${e.url} ${e.source||""}`.toLowerCase().includes(s)}).sort((e,s)=>new Date(s.archivedAt||0)-new Date(e.archivedAt||0)),a=f.reports.filter(e=>e.archived).length;return`
    <main class="app-shell archive-shell">
      ${ht(a)}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${a}</strong><span>份已归档</span></div>
        </div>
        ${t.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${w?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(e=>ft(e,!0)).join("")}</div>
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
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${it()}
    </main>`}function Nt(){if(O)return Zt();const t=w.trim().toLowerCase(),a=t.split(/\s+/).filter(Boolean),e=f.reports.filter(o=>!o.archived),s=a.length?e.filter(o=>{const d=`${o.title} ${o.source||""} ${o.access||""} ${Pt(o.workType)} ${(o.tags||[]).join(" ")}`.toLowerCase();return a.every(m=>d.includes(m))}):e,i=f.reports.filter(o=>o.archived).length,n=e.filter(o=>o.access==="production").length,r=e.filter(o=>o.access!=="production").length,c=Ot(s,t).filter(o=>o.reports.length||D),l=$==="type"?"工作类型":$==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${ht(i)}
      <section class="workspace">
        ${At(g)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-title" aria-label="成果概览">
            <span class="library-label">Library</span>
            <strong>${e.length}</strong>
            <span>works</span>
          </div>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${f.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${n}</strong><span>直达</span>
            </div>
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${g(w)}" placeholder="搜索标题、标签或来源" aria-label="搜索成果" />
              ${w?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${St(g)}
        <section class="groups-section">
          ${D?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${M()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div class="classification-actions">
              <div class="view-switcher" role="tablist" aria-label="成果分类方式">
                <button type="button" role="tab" aria-selected="${$==="topic"}" class="${$==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                <button type="button" role="tab" aria-selected="${$==="type"}" class="${$==="type"?"active":""}" data-action="set-view" data-id="type">类型</button>
                <button type="button" role="tab" aria-selected="${$==="tag"}" class="${$==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
              </div>
              <button class="quiet-button add-topic-button" type="button" data-action="add-group">＋ 主题</button>
            </div>
          </div>
          ${c.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${l}">
                ${c.map((o,d)=>`<a href="#bucket-${d}"><span class="nav-index">${String(d+1).padStart(2,"0")}</span>${g(o.name)}<span>${o.reports.length}</span></a>`).join("")}
              </nav>
              <div class="board catalog-view-${$}">
              ${c.map((o,d)=>`
                <section id="bucket-${d}" class="group-column topic-section bucket-${g(o.kind)} accent-${g(o.accent||"blue")}"
                  data-bucket-kind="${g(o.kind)}"
                  data-bucket-id="${g(o.id)}"
                  ${o.kind==="topic"?`data-group-id="${g(o.id)}"`:""}>
                  <header class="group-header">
                    ${o.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${g(o.id)}"
                          aria-label="拖动“${g(o.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(d+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${o.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${g(o.name)}</h2></div>
                      <span class="count">${o.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${D?`<button class="move-here-button" type="button" data-action="move-here" data-id="${g(o.id)}" data-bucket-kind="${g(o.kind)}">移到这里</button>`:""}
                      ${o.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${g(o.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${g(o.id)}">编辑主题</button>
                           ${o.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${g(o.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${o.reports.length?o.reports.map(m=>ft(m)).join(""):o.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${g(o.id)}">
                            <strong>拖报告到这里</strong>
                            <span>或点击添加第一份报告</span>
                          </button>`:'<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>'}
                  </div>
                </section>`).join("")}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到相关报告</strong>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${r} 份报告需要组织或账号登录${i?` · ${i} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${it()}
    </main>`}function h(){const t=document.getElementById("app");if(sessionStorage.getItem(tt)!=="ok"){t.innerHTML=Ct(),Rt();return}const a=B&&f.reports.find(e=>e.id===B);t.innerHTML=a?Bt(a):Nt(),Mt(),Et({render:h,escapeHtml:g,showToast:A,showResults:()=>{O=!1}})}function Rt(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",a=>{if(a.preventDefault(),new FormData(t).get("password")!=="2026"){const s=t.querySelector(".form-error");s.hidden=!1,s.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(tt,"ok"),h()})}async function ct(t){var r,c;const a=t.elements.url,e=t.elements.title,s=t.querySelector('[data-action="detect-title"]'),i=t.querySelector(".field-hint"),n=a.value.trim();if(!mt(n))return i.textContent="请输入完整的 http 或 https 网址","";s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>',i.textContent="正在读取网页标题…";try{const l=`https://api.microlink.io/?url=${encodeURIComponent(n)}`,o=await fetch(l,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!o.ok)throw new Error("read failed");const d=await o.json(),m=((c=(r=d==null?void 0:d.data)==null?void 0:r.title)==null?void 0:c.trim())||j(n);return e.value=m.slice(0,180),i.textContent="已识别网页标题",e.value}catch{const l=j(n);return e.value||(e.value=l),i.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",e.value}finally{s.disabled=!1,s.textContent="识别标题"}}function Mt(){var s;(s=document.getElementById("search-input"))==null||s.addEventListener("input",i=>{w=i.target.value,h();const n=document.getElementById("search-input");n==null||n.focus(),n==null||n.setSelectionRange(w.length,w.length)}),document.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",async n=>{var l,o;const r=n.currentTarget.dataset.action,c=n.currentTarget.dataset.id;if(r==="open")B=c,h();else if(r==="back")B="",b=null,h();else if(r==="lock")sessionStorage.removeItem(tt),h();else if(r==="clear-search")w="",h();else if(r==="set-view"){if(!["topic","type","tag"].includes(c))return;$=c,D="",localStorage.setItem(X,$),h()}else if(r==="cancel-move")D="",h();else if(r==="move-here"){const d=n.currentTarget.dataset.bucketKind||$;D&&U(D,d,c)&&(D="",h(),A(d==="tag"?"已添加目标标签":`报告已移入目标${M()}`))}else if(r==="show-archive")O=!0,w="",B="",h();else if(r==="show-catalog")O=!1,w="",B="",h();else if(r==="add-report")b={type:"report",mode:"create",groupId:((l=f.groups[1])==null?void 0:l.id)||((o=f.groups[0])==null?void 0:o.id)},h();else if(r==="add-to-group")b={type:"report",mode:"create",groupId:c},h();else if(r==="edit")b={type:"report",mode:"edit",reportId:c},h();else if(r==="edit-tags")b={type:"tags",reportId:c},h();else if(r==="close-modal")b=null,h();else if(r==="detect-title")await ct(n.currentTarget.closest("form"));else if(r==="archive"){const d=f.reports.find(m=>m.id===c);if(!d)return;d.archived=!0,d.archivedAt=new Date().toISOString(),T(),h(),A("已归档，可随时恢复")}else if(r==="restore"){const d=f.reports.find(m=>m.id===c);if(!d)return;d.archived=!1,d.archivedAt="",T(),h(),A("报告已恢复到原主题")}else if(r==="delete"){const d=f.reports.find(m=>m.id===c);d!=null&&d.archived&&confirm(`二次确认：永久删除“${d.title}”？

删除后无法从归档区恢复。`)&&(f.reports=f.reports.filter(m=>m.id!==c),B===c&&(B=""),T(),h(),A("报告已永久删除"))}else if(r==="add-group")b={type:"group",mode:"create"},h();else if(r==="rename-group")f.groups.find(m=>m.id===c)&&(b={type:"group",mode:"edit",groupId:c},h());else if(r==="delete-group"){const d=f.groups.find(m=>m.id===c);d&&confirm(`删除“${d.name}”？其中的报告会移到“待整理”。`)&&(f.reports.forEach(m=>{m.groupId===c&&(m.groupId="inbox")}),f.groups=f.groups.filter(m=>m.id!==c),T(),h(),A("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(i=>{let n=null,r=!1;const c=()=>{var l;x="",n=null,r=!1,(l=i.closest(".report-card"))==null||l.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(o=>{o.classList.remove("is-card-drop-target","is-drop-ready")})};i.addEventListener("pointerdown",l=>{var o,d;l.preventDefault(),x=i.dataset.reportDragId,S="",n={x:l.clientX,y:l.clientY},r=!1,(o=i.setPointerCapture)==null||o.call(i,l.pointerId),(d=i.closest(".report-card"))==null||d.classList.add("is-dragging")}),i.addEventListener("pointermove",l=>{if(!x||n&&Math.hypot(l.clientX-n.x,l.clientY-n.y)<7)return;r=!0;const o=document.elementFromPoint(l.clientX,l.clientY),d=o==null?void 0:o.closest(".report-card"),m=o==null?void 0:o.closest(".group-column");document.querySelectorAll(".report-card").forEach(p=>{p.classList.toggle("is-card-drop-target",!!(d&&d!==i.closest(".report-card")&&p===d))}),document.querySelectorAll(".group-column").forEach(p=>{p.classList.toggle("is-drop-ready",!!(m&&p===m))})}),i.addEventListener("pointerup",l=>{if(!x)return;const o=x;if(!r){D=o,c(),h(),A(`请选择目标${M()}`);return}const d=document.elementFromPoint(l.clientX,l.clientY),m=d==null?void 0:d.closest(".report-card"),p=d==null?void 0:d.closest(".group-column"),y=(m==null?void 0:m.dataset.reportId)||"",E=(p==null?void 0:p.dataset.bucketId)||"",u=(p==null?void 0:p.dataset.bucketKind)||$,k=y&&y!==o?U(o,u,E,y):E?U(o,u,E):!1;c(),k&&(h(),A(u==="tag"?"已添加目标标签":u==="type"?"工作类型已更新":y?"报告顺序已更新":"已移入新主题"))}),i.addEventListener("pointercancel",c)}),document.querySelectorAll(".group-drag-handle").forEach(i=>{const n=()=>{var r;S="",(r=i.closest(".group-column"))==null||r.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(c=>{c.classList.remove("is-group-drop-target","is-drop-ready")})};i.addEventListener("pointerdown",r=>{var c,l;r.preventDefault(),S=i.dataset.groupDragId,x="",(c=i.setPointerCapture)==null||c.call(i,r.pointerId),(l=i.closest(".group-column"))==null||l.classList.add("is-group-dragging")}),i.addEventListener("pointermove",r=>{S&&document.querySelectorAll(".group-column").forEach(c=>{var l;c.classList.toggle("is-group-drop-target",c===((l=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:l.closest(".group-column")))})}),i.addEventListener("pointerup",r=>{var o;if(!S)return;const c=S,l=(o=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:o.closest(".group-column");if(l&&Y(c,l.dataset.groupId)){S="",h(),A("分组顺序已更新");return}n()}),i.addEventListener("pointercancel",n),i.addEventListener("keydown",r=>{var d;if(!["ArrowLeft","ArrowRight"].includes(r.key))return;r.preventDefault();const c=f.groups.findIndex(m=>m.id===i.dataset.groupDragId),l=r.key==="ArrowLeft"?c-1:c+1,o=f.groups[l];!o||!Y(i.dataset.groupDragId,o.id)||(h(),A("分组顺序已更新"),(d=document.querySelector(`[data-group-drag-id="${CSS.escape(i.dataset.groupDragId)}"]`))==null||d.focus())})}),document.querySelectorAll(".group-column").forEach(i=>{i.addEventListener("dragover",n=>{n.preventDefault(),i.classList.add(S?"is-group-drop-target":"is-drop-ready")}),i.addEventListener("dragleave",()=>{i.classList.remove("is-drop-ready","is-group-drop-target")}),i.addEventListener("drop",n=>{if(n.preventDefault(),S){if(i.dataset.bucketKind==="topic"&&Y(S,i.dataset.groupId)){S="",h(),A("分组顺序已更新");return}S="",i.classList.remove("is-group-drop-target");return}const r=f.reports.find(l=>l.id===x),c=i.dataset.bucketKind||$;r&&U(x,c,i.dataset.bucketId)&&(x="",h(),A(c==="tag"?"已添加目标标签":c==="type"?"工作类型已更新":"已移入新主题")),x=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(i=>{i.addEventListener("click",()=>{const n=document.querySelector('#tag-form input[name="tags"]');if(!n)return;const r=V(n.value),c=i.dataset.tagSuggestion;n.value=r.includes(c)?r.filter(l=>l!==c).join("、"):[...r,c].slice(0,8).join("、"),i.classList.toggle("selected",!r.includes(c)),n.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",i=>{i.preventDefault();const n=f.reports.find(r=>r.id===b.reportId);n&&(n.tags=V(new FormData(t).get("tags")),T(),b=null,h(),A("标签已更新"))});const a=document.getElementById("group-form");a==null||a.addEventListener("submit",i=>{var l,o;i.preventDefault();const n=(l=new FormData(a).get("name"))==null?void 0:l.trim(),r=(o=new FormData(a).get("description"))==null?void 0:o.trim();if(!n)return;if(b.mode==="edit"){const d=f.groups.find(m=>m.id===b.groupId);if(!d)return;d.name=n.slice(0,60),d.description=(r==null?void 0:r.slice(0,80))||"自定义工作主题"}else f.groups.push({id:ot("group"),name:n.slice(0,60),description:(r==null?void 0:r.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][f.groups.length%4],position:f.groups.length});T();const c=b.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";b=null,h(),A(c)});const e=document.getElementById("report-form");e==null||e.addEventListener("submit",async i=>{i.preventDefault();const n=e.elements.url.value.trim();if(!mt(n))return;const r=e.querySelector('button[type="submit"]');r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>';let c=e.elements.title.value.trim();c||(c=await ct(e));const l=e.elements.groupId.value,o=e.elements.workType.value,d=V(e.elements.tags.value);if(b.mode==="edit"){const m=f.reports.find(p=>p.id===b.reportId);Object.assign(m,{title:c,url:n,groupId:l,workType:o,tags:d})}else{const m={id:ot("report"),groupId:l,title:c||j(n),url:n,pinned:!1,position:f.reports.filter(p=>p.groupId===l).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:o,tags:d};m.tags.length||(m.tags=at(m,m.workType)),f.reports.push(m)}T(),b=null,h(),A("报告已保存")})}function jt(){h()}jt(document.getElementById("app"));
