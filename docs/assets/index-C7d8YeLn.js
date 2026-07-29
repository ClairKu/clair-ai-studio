(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=s(o);fetch(o.href,r)}})();const at="clair-ai-studio-tasks-v1",F=[{id:"auto",name:"智能识别",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",icon:"历",hint:"事实、能力、匹配、核验"}];let I=ct(),h={skillId:"auto",goal:"",material:"",files:[]},w="",x="compose";function ct(){try{const t=JSON.parse(localStorage.getItem(at));return Array.isArray(t)?t:[]}catch{return[]}}function N(){localStorage.setItem(at,JSON.stringify(I))}function it(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function st(t){return F.find(e=>e.id===t)||F[0]}function lt(t){var a;const e=t.toLowerCase();return((a=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,o])=>o.some(r=>e.includes(r))))==null?void 0:a[0])||"solution"}function V(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function dt(t,e){const s=t.files.length?t.files.map(o=>`${o.name}（${o.sizeLabel}）`).join("、"):"无附件",a=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(s)}</li>
      <li>粘贴内容：${a} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function pt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function ut(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function X(t){const e=[...t].slice(0,20);return Promise.all(e.map(async s=>{const a=s.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(s.name);let o="";if(a&&s.size<=1024*1024)try{o=(await s.text()).slice(0,12e3)}catch{o=""}return{id:it(),name:s.name,type:s.type||"文件",size:s.size,sizeLabel:ut(s.size),excerpt:o}}))}function mt(t){return F.map(e=>`
    <button class="skill-choice ${h.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}">
      <span>${t(e.icon)}</span>
      <strong>${t(e.name)}</strong>
      <small>${t(e.hint)}</small>
    </button>`).join("")}function gt(t){return h.files.length?`<div class="attachment-list">${h.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function ft(t){const e=I.filter(s=>s.status!=="confirmed").slice().reverse();return e.length?e.map(s=>`
    <button class="task-row" type="button" data-task-action="open-task" data-task-id="${s.id}">
      <span class="task-status-dot"></span>
      <span><strong>${t(s.title)}</strong><small>${t(s.skillName)} · ${V(s.updatedAt)}</small></span>
      <em>${s.status==="review"?"待确认":"处理中"}</em>
    </button>`).join(""):'<div class="task-empty"><span>○</span><strong>还没有进行中的任务</strong><small>投入材料，第一项任务会出现在这里。</small></div>'}function _(t){if(w){const e=I.find(s=>s.id===w);if(e)return ht(e,t);w=""}return`
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
            <div class="skill-grid">${mt(t)}</div>
          </section>
          <section class="composer-section">
            <div class="composer-heading"><span>02</span><div><strong>投入材料</strong><small>拖文件，或直接粘贴一堆信息</small></div></div>
            <label class="material-drop" id="material-drop">
              <input id="task-files" type="file" multiple />
              <span class="drop-icon">＋</span>
              <strong>拖入文件</strong>
              <small>PDF、Word、PPT、表格、图片都可以</small>
            </label>
            ${gt(t)}
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
          <div class="task-list">${ft(t)}</div>
          <div class="evolution-note">
            <span>↻</span><div><strong>Skill 会学习，但不会擅自改</strong><small>人工修改只形成候选版本，经你确认后发布。</small></div>
          </div>
        </aside>
      </div>
    </section>`}function ht(t,e){var a;const s=t.status==="confirmed";return`
    <section class="task-center workspace task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← ${s?"返回成果区":"返回任务中心"}</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${e(t.skillName)} · SKILL V${e(t.skillVersion)}</span><h1>${e(t.title)}</h1></div>
        <span class="status-pill ${s?"done":""}">${s?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${e(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${(a=t.revisions)!=null&&a.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${s?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${V(t.updatedAt)}</small></div>
          ${x==="edit"&&!s?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${s?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':x==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function vt(t){const e=I.filter(s=>s.status==="confirmed").sort((s,a)=>new Date(a.confirmedAt)-new Date(s.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><span class="section-kicker">AI RESULTS</span><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(s=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${s.id}">
          <span>${t(st(s.skillId).icon)}</span>
          <div><small>${t(s.skillName)} · V${t(s.skillVersion)}</small><strong>${t(s.title)}</strong><em>${V(s.confirmedAt)}</em></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function bt(){return{active:I.filter(t=>t.status!=="confirmed").length,confirmed:I.filter(t=>t.status==="confirmed").length}}function yt(){return!!w}function Q(){w="",x="compose"}function $t({render:t,escapeHtml:e,showToast:s,showResults:a}){document.querySelectorAll("[data-task-action]").forEach(i=>{i.addEventListener("click",async l=>{var g;const c=l.currentTarget.dataset.taskAction;if(c==="choose-skill")h.skillId=l.currentTarget.dataset.skillId,O(),t();else if(c==="remove-file")O(),h.files=h.files.filter(d=>d.id!==l.currentTarget.dataset.fileId),t();else if(c==="open-task")w=l.currentTarget.dataset.taskId,x="compose",t();else if(c==="close-task"){const d=I.find(v=>v.id===w);w="",x="compose",(d==null?void 0:d.status)==="confirmed"&&(a==null||a()),t()}else if(c==="edit-result")x="edit",t();else if(c==="cancel-edit")x="compose",t();else if(c==="save-revision"){const d=I.find(q=>q.id===l.currentTarget.dataset.taskId),v=(g=document.getElementById("task-result-input"))==null?void 0:g.value.trim();if(!d||!v)return;d.revisions||(d.revisions=[]),d.revisions.push({at:new Date().toISOString(),before:d.resultText||"",after:v}),d.resultText=v,d.resultHtml=`<p>${e(v).replaceAll(`
`,"</p><p>")}</p>`,d.updatedAt=new Date().toISOString(),N(),x="compose",t(),s("已保存人工修改，并记录为进化样本")}else if(c==="supplement-task"){const d=I.find(v=>v.id===w);if(!d)return;h={skillId:d.requestedSkillId,goal:d.goal,material:d.material,files:d.files},I=I.filter(v=>v.id!==d.id),N(),w="",x="compose",t()}else if(c==="confirm-task"){const d=I.find(v=>v.id===l.currentTarget.dataset.taskId);if(!d)return;d.status="confirmed",d.confirmedAt=new Date().toISOString(),d.updatedAt=d.confirmedAt,N(),w="",x="compose",a==null||a(),t(),s("已确认并放入成果区")}})});const o=document.getElementById("task-composer");o==null||o.addEventListener("submit",i=>{var v;if(i.preventDefault(),O(),!h.goal.trim()){s("请先写下希望解决的目标"),(v=document.getElementById("task-goal"))==null||v.focus();return}if(!h.material.trim()&&!h.files.length){s("请拖入文件或粘贴一些材料");return}const l=h.skillId==="auto"?lt(`${h.goal}
${h.material}
${h.files.map(q=>q.name).join(" ")}`):h.skillId,c=st(l),g=new Date().toISOString(),d={id:it(),title:pt(h.goal,c.name),requestedSkillId:h.skillId,skillId:l,skillName:c.name,skillVersion:"1.0.0",goal:h.goal.trim(),material:h.material.trim(),files:h.files,status:"review",createdAt:g,updatedAt:g,revisions:[]};d.resultHtml=dt(d,e),d.resultText=`材料已收齐并匹配 ${d.skillName}。目标：${d.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,I.push(d),N(),w=d.id,h={skillId:"auto",goal:"",material:"",files:[]},t(),s(`已创建任务，并匹配“${c.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async i=>{O(),h.files.push(...await X(i.target.files)),t(),s(`已加入 ${i.target.files.length} 个文件`)});const n=document.getElementById("material-drop");n==null||n.addEventListener("dragover",i=>{i.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async i=>{i.preventDefault(),n.classList.remove("drag-over"),O();const l=i.dataTransfer.files;h.files.push(...await X(l)),t(),s(`已加入 ${l.length} 个文件`)})}function O(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal");t&&(h.material=t.value),e&&(h.goal=e.value)}const W="clair-service-report-workbench-v1",Y="clair-service-report-workbench-access",J=4,U={version:J,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"product-planning",name:"产品规划与需求评审",description:"PRD、原型、需求评审与体验优化",accent:"blue",position:1},{id:"xiaogu",name:"AI 小顾与且慢体验",description:"AI 小顾、且慢服务与对客体验",accent:"green",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"research",name:"投研与服务内容",description:"基金研究、策略分析与服务报告",accent:"amber",position:4},{id:"knowledge",name:"SOUL 知识治理",description:"来源治理与可复用知识资产",accent:"slate",position:5},{id:"reporting",name:"经营汇报与协同",description:"周报、汇报、招聘与跨团队推进",accent:"blue",position:6}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"}]};let m=kt(),$="",L="",P="tasks",S=!1,E="",A="",C="",b=null,H=0;function rt(t){return JSON.parse(JSON.stringify(t))}function G(t=""){try{const e=new URL(t);e.hash="",e.search="";const s=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${s}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function kt(){try{const t=JSON.parse(localStorage.getItem(W));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return It(t)}catch{}return rt(U)}function It(t){const e=rt(U),s=new Set(e.groups.map(u=>u.id)),a=new Set(["inbox","today","product","research"]),o=new Map(t.groups.map(u=>[u.id,u])),r=e.groups.map(u=>{const y=o.get(u.id);return!y||t.version<2?u:{...u,name:y.name||u.name,description:y.description||u.description,position:Number.isFinite(y.position)?y.position:u.position}});t.groups.filter(u=>!s.has(u.id)&&!a.has(u.id)).forEach((u,y)=>{r.push({...u,description:u.description||"自定义工作分组",position:Number.isFinite(u.position)?u.position:U.groups.length+y})});const n=r.filter((u,y,T)=>T.findIndex(j=>j.id===u.id)===y);n.sort((u,y)=>(u.position||0)-(y.position||0));const i={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform"},l={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},c=t.reports.map(u=>({...u,groupId:i[u.id]||l[u.groupId]||u.groupId||"inbox"})),g=new Map(c.map(u=>[u.id,u])),d=new Map(c.map(u=>[G(u.url),u])),v=new Set,q=e.reports.map(u=>{const y=G(u.url);v.add(y);const T=g.get(u.id)||d.get(y);return T?{...u,title:T.title||u.title,groupId:n.some(j=>j.id===T.groupId)?T.groupId:u.groupId,pinned:!!T.pinned,position:Number.isFinite(T.position)?T.position:u.position,archived:!!T.archived,archivedAt:T.archivedAt||""}:u});c.forEach(u=>{const y=G(u.url);v.has(y)||(v.add(y),q.push(u))});const Z={version:J,groups:n,reports:q};return localStorage.setItem(W,JSON.stringify(Z)),Z}function D(){m.version=J,m.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(W,JSON.stringify(m))}function K(t,e){const s=m.groups.findIndex(r=>r.id===t),a=m.groups.findIndex(r=>r.id===e);if(s<0||a<0||s===a)return!1;const[o]=m.groups.splice(s,1);return m.groups.splice(a,0,o),D(),!0}function M(t,e,s=""){const a=m.reports.find(i=>i.id===t);if(!a||a.archived||!m.groups.find(i=>i.id===e))return!1;const r=m.reports.filter(i=>!i.archived&&i.groupId===e&&i.id!==t).sort((i,l)=>(i.position||0)-(l.position||0)),n=s?r.findIndex(i=>i.id===s):r.length;return a.groupId=e,r.splice(n<0?r.length:n,0,a),r.forEach((i,l)=>{i.position=l}),D(),!0}function tt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function p(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function R(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function ot(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function k(t){var s;(s=document.querySelector(".toast"))==null||s.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(H),H=window.setTimeout(()=>e.remove(),2600)}function nt(t,e=!1){const s=t.access!=="production",a=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=!s&&U.reports.some(n=>n.id===t.id)?`<img src="./previews/${p(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${s?"preview-restricted":""}">
        <span>${s?"ACCESS":p(t.title.slice(0,2))}</span>
        <strong>${s?a:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${s?"restricted-card":""} ${e?"archived-card":""} ${C===t.id?"is-move-selected":""}" data-report-id="${p(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${p(t.id)}" aria-label="打开${p(t.title)}">
        <span class="report-preview">
          ${r}
        </span>
        <span class="report-copy">
          <span class="report-source">${p(t.source||"手动添加")}</span>
          <strong>${p(t.title)}</strong>
          ${s?`<span class="report-access-note">${p(a)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${p(t.id)}"
          aria-label="拖动《${p(t.title)}》到其他工作主题" title="拖动到其他工作主题">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${p(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${p(t.id)}">永久删除</button>`:`
            <button type="button" data-action="edit" data-id="${p(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${p(t.id)}">归档</button>`}
      </div>
    </article>`}function z(){var s;if(!b)return"";if(b.type==="group"){const a=b.mode==="edit"?m.groups.find(o=>o.id===b.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${a?"编辑工作主题":"新建工作主题"}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${p((a==null?void 0:a.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${p((a==null?void 0:a.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${a?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=b.mode==="edit"?m.reports.find(a=>a.id===b.reportId):null,e=(t==null?void 0:t.groupId)||b.groupId||((s=m.groups[0])==null?void 0:s.id)||"";return`
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
            ${m.groups.map(a=>`<option value="${p(a.id)}" ${a.id===e?"selected":""}>${p(a.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function At(){return`
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
    </main>`}function wt(t){const e=t.access!=="production",s=t.access==="org"?"组织账号":"站点账号",a=e?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该报告需要${s}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${s}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${p(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${p(R(t.url))}</p>
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
          <span>${p(R(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${p(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          <button class="quiet-button" type="button" data-action="edit" data-id="${p(t.id)}">编辑</button>
        </div>
      </header>
      ${a}
      ${z()}
    </main>`}function B(t){const e=bt();return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair的工作台</strong><span>AI WORKSPACE</span></div>
      </div>
      <nav class="workspace-tabs" aria-label="工作台导航">
        <button type="button" data-action="show-tasks" class="${P==="tasks"&&!S?"active":""}">
          任务中心${e.active?`<span>${e.active}</span>`:""}
        </button>
        <button type="button" data-action="show-results" class="${P==="results"&&!S?"active":""}">
          成果区${e.confirmed?`<span>${e.confirmed}</span>`:""}
        </button>
      </nav>
      <div class="top-actions">
        ${P==="results"||S?`<button class="quiet-button archive-nav-button" type="button" data-action="${S?"show-results":"show-archive"}">
              ${S?"返回成果区":`归档${t?`<span>${t}</span>`:""}`}
            </button>
            ${S?"":'<button class="primary-button" type="button" data-action="add-report">新增成果</button>'}`:'<button class="quiet-button" type="button" data-action="lock">退出</button>'}
      </div>
    </header>`}function St(){const t=m.reports.filter(s=>s.archived).filter(s=>{if(!$.trim())return!0;const a=$.trim().toLowerCase();return`${s.title} ${s.url} ${s.source||""}`.toLowerCase().includes(a)}).sort((s,a)=>new Date(a.archivedAt||0)-new Date(s.archivedAt||0)),e=m.reports.filter(s=>s.archived).length;return`
    <main class="app-shell archive-shell">
      ${B(e)}
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
            <div class="archive-grid">${t.map(s=>nt(s,!0)).join("")}</div>
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
      ${z()}
    </main>`}function Tt(){if(S)return St();if(yt())return`
      <main class="app-shell">
        ${B(m.reports.filter(i=>i.archived).length)}
        ${_(p)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
      </main>`;if(P==="tasks")return`
      <main class="app-shell">
        ${B(m.reports.filter(i=>i.archived).length)}
        ${_(p)}
        <footer><span>CLAIR'S WORKSPACE</span><span>Human in the loop · 2026-07-29</span></footer>
        ${z()}
      </main>`;const t=$.trim().toLowerCase(),e=m.reports.filter(i=>!i.archived),s=t?e.filter(i=>`${i.title} ${i.url} ${i.source||""} ${i.access||""}`.toLowerCase().includes(t)):e,a=m.reports.filter(i=>i.archived).length,o=e.filter(i=>i.access==="production").length,r=e.filter(i=>i.access!=="production").length,n=m.groups.map(i=>({...i,reports:s.filter(l=>l.groupId===i.id).sort((l,c)=>(l.position||0)-(c.position||0))})).filter(i=>!t||i.reports.length||`${i.name} ${i.description||""}`.toLowerCase().includes(t));return`
    <main class="app-shell">
      ${B(a)}
      <section class="workspace">
        <div class="results-toolbar">
          <div><span class="eyebrow">RESULTS</span><h1>成果区</h1></div>
          <label class="search results-search">
            <input id="search-input" value="${p($)}" placeholder="搜索成果" aria-label="搜索成果" />
            ${$?'<button type="button" data-action="clear-search">清除</button>':""}
          </label>
        </div>
        ${vt(p)}
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
            <strong>${o}</strong>
            <span>可直接访问</span>
          </div>
        </div>
        <section class="groups-section">
          ${C?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在移动报告</strong><span>选择目标主题的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div>
              <span class="section-kicker">WORK TOPICS</span>
              <h2>工作主题与分组</h2>
              <p>拖动卡片可调整顺序或移入其他主题；拖动主题标题左侧把手可调整主题顺序。</p>
            </div>
            <button class="primary-button" type="button" data-action="add-group">＋ 新建工作主题</button>
          </div>
          ${n.length?`
            <nav class="topic-nav" aria-label="报告主题">
              ${n.map(i=>`<a href="#topic-${p(i.id)}">${p(i.name)}<span>${i.reports.length}</span></a>`).join("")}
            </nav>
            <div class="board">
              ${n.map((i,l)=>`
                <section id="topic-${p(i.id)}" class="group-column topic-section accent-${p(i.accent)}" data-group-id="${p(i.id)}">
                  <header class="group-header">
                    <span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${p(i.id)}"
                      aria-label="拖动“${p(i.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                      <span aria-hidden="true">⠿</span>
                      <small>${String(l+1).padStart(2,"0")}</small>
                    </span>
                    <div class="group-heading-copy">
                      <div><h2>${p(i.name)}</h2><p>${p(i.description||"自定义工作主题")}</p></div>
                      <span class="count">${i.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${C?`<button class="move-here-button" type="button" data-action="move-here" data-id="${p(i.id)}">移到这里</button>`:""}
                      <button type="button" data-action="add-to-group" data-id="${p(i.id)}">添加报告</button>
                      <button type="button" data-action="rename-group" data-id="${p(i.id)}">编辑主题</button>
                      ${i.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${p(i.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${i.reports.length?i.reports.map(c=>nt(c)).join(""):`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${p(i.id)}">
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
            <span>${r} 份报告需要组织或账号登录${a?` · ${a} 份已安全归档`:""}</span>
            <div><span>主题与卡片顺序仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR AI STUDIO</span><span>Production archive · 2026-07-29</span></footer>
      ${z()}
    </main>`}function f(){const t=document.getElementById("app");if(sessionStorage.getItem(Y)!=="ok"){t.innerHTML=At(),qt();return}const e=L&&m.reports.find(s=>s.id===L);t.innerHTML=e?wt(e):Tt(),Et(),$t({render:f,escapeHtml:p,showToast:k,showResults:()=>{P="results",S=!1}})}function qt(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(Y,"ok"),f()})}async function et(t){var n,i;const e=t.elements.url,s=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),o=t.querySelector(".field-hint"),r=e.value.trim();if(!ot(r))return o.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',o.textContent="正在读取网页标题…";try{const l=`https://api.microlink.io/?url=${encodeURIComponent(r)}`,c=await fetch(l,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!c.ok)throw new Error("read failed");const g=await c.json(),d=((i=(n=g==null?void 0:g.data)==null?void 0:n.title)==null?void 0:i.trim())||R(r);return s.value=d.slice(0,180),o.textContent="已识别网页标题",s.value}catch{const l=R(r);return s.value||(s.value=l),o.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",s.value}finally{a.disabled=!1,a.textContent="识别标题"}}function Et(){var s;(s=document.getElementById("search-input"))==null||s.addEventListener("input",a=>{$=a.target.value,f();const o=document.getElementById("search-input");o==null||o.focus(),o==null||o.setSelectionRange($.length,$.length)}),document.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",async o=>{var i,l;const r=o.currentTarget.dataset.action,n=o.currentTarget.dataset.id;if(r==="open")L=n,f();else if(r==="back")L="",b=null,f();else if(r==="lock")sessionStorage.removeItem(Y),f();else if(r==="clear-search")$="",f();else if(r==="cancel-move")C="",f();else if(r==="move-here")C&&M(C,n)&&(C="",f(),k("报告已移入目标主题"));else if(r==="show-tasks")P="tasks",S=!1,L="",Q(),f();else if(r==="show-results")P="results",S=!1,L="",$="",Q(),f();else if(r==="show-archive")P="results",S=!0,$="",L="",f();else if(r==="show-catalog")S=!1,$="",L="",f();else if(r==="add-report")b={type:"report",mode:"create",groupId:((i=m.groups[1])==null?void 0:i.id)||((l=m.groups[0])==null?void 0:l.id)},f();else if(r==="add-to-group")b={type:"report",mode:"create",groupId:n},f();else if(r==="edit")b={type:"report",mode:"edit",reportId:n},f();else if(r==="close-modal")b=null,f();else if(r==="detect-title")await et(o.currentTarget.closest("form"));else if(r==="archive"){const c=m.reports.find(g=>g.id===n);if(!c)return;c.archived=!0,c.archivedAt=new Date().toISOString(),D(),f(),k("已归档，可随时恢复")}else if(r==="restore"){const c=m.reports.find(g=>g.id===n);if(!c)return;c.archived=!1,c.archivedAt="",D(),f(),k("报告已恢复到原主题")}else if(r==="delete"){const c=m.reports.find(g=>g.id===n);c!=null&&c.archived&&confirm(`二次确认：永久删除“${c.title}”？

删除后无法从归档区恢复。`)&&(m.reports=m.reports.filter(g=>g.id!==n),L===n&&(L=""),D(),f(),k("报告已永久删除"))}else if(r==="add-group")b={type:"group",mode:"create"},f();else if(r==="rename-group")m.groups.find(g=>g.id===n)&&(b={type:"group",mode:"edit",groupId:n},f());else if(r==="delete-group"){const c=m.groups.find(g=>g.id===n);c&&confirm(`删除“${c.name}”？其中的报告会移到“待整理”。`)&&(m.reports.forEach(g=>{g.groupId===n&&(g.groupId="inbox")}),m.groups=m.groups.filter(g=>g.id!==n),D(),f(),k("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(a=>{let o=null,r=!1;const n=()=>{var i;E="",o=null,r=!1,(i=a.closest(".report-card"))==null||i.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(l=>{l.classList.remove("is-card-drop-target","is-drop-ready")})};a.addEventListener("pointerdown",i=>{var l,c;i.preventDefault(),E=a.dataset.reportDragId,A="",o={x:i.clientX,y:i.clientY},r=!1,(l=a.setPointerCapture)==null||l.call(a,i.pointerId),(c=a.closest(".report-card"))==null||c.classList.add("is-dragging")}),a.addEventListener("pointermove",i=>{if(!E||o&&Math.hypot(i.clientX-o.x,i.clientY-o.y)<7)return;r=!0;const l=document.elementFromPoint(i.clientX,i.clientY),c=l==null?void 0:l.closest(".report-card"),g=l==null?void 0:l.closest(".group-column");document.querySelectorAll(".report-card").forEach(d=>{d.classList.toggle("is-card-drop-target",!!(c&&c!==a.closest(".report-card")&&d===c))}),document.querySelectorAll(".group-column").forEach(d=>{d.classList.toggle("is-drop-ready",!!(g&&d===g))})}),a.addEventListener("pointerup",i=>{if(!E)return;const l=E;if(!r){C=l,n(),f(),k("请选择目标主题");return}const c=document.elementFromPoint(i.clientX,i.clientY),g=c==null?void 0:c.closest(".report-card"),d=c==null?void 0:c.closest(".group-column"),v=(g==null?void 0:g.dataset.reportId)||"",q=(d==null?void 0:d.dataset.groupId)||"",Z=v&&v!==l?M(l,q,v):q?M(l,q):!1;n(),Z&&(f(),k(v?"报告顺序已更新":"已移入新主题"))}),a.addEventListener("pointercancel",n)}),document.querySelectorAll(".group-drag-handle").forEach(a=>{const o=()=>{var r;A="",(r=a.closest(".group-column"))==null||r.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(n=>{n.classList.remove("is-group-drop-target","is-drop-ready")})};a.addEventListener("pointerdown",r=>{var n,i;r.preventDefault(),A=a.dataset.groupDragId,E="",(n=a.setPointerCapture)==null||n.call(a,r.pointerId),(i=a.closest(".group-column"))==null||i.classList.add("is-group-dragging")}),a.addEventListener("pointermove",r=>{A&&document.querySelectorAll(".group-column").forEach(n=>{var i;n.classList.toggle("is-group-drop-target",n===((i=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:i.closest(".group-column")))})}),a.addEventListener("pointerup",r=>{var l;if(!A)return;const n=A,i=(l=document.elementFromPoint(r.clientX,r.clientY))==null?void 0:l.closest(".group-column");if(i&&K(n,i.dataset.groupId)){A="",f(),k("分组顺序已更新");return}o()}),a.addEventListener("pointercancel",o),a.addEventListener("keydown",r=>{var c;if(!["ArrowLeft","ArrowRight"].includes(r.key))return;r.preventDefault();const n=m.groups.findIndex(g=>g.id===a.dataset.groupDragId),i=r.key==="ArrowLeft"?n-1:n+1,l=m.groups[i];!l||!K(a.dataset.groupDragId,l.id)||(f(),k("分组顺序已更新"),(c=document.querySelector(`[data-group-drag-id="${CSS.escape(a.dataset.groupDragId)}"]`))==null||c.focus())})}),document.querySelectorAll(".group-column").forEach(a=>{a.addEventListener("dragover",o=>{o.preventDefault(),a.classList.add(A?"is-group-drop-target":"is-drop-ready")}),a.addEventListener("dragleave",()=>{a.classList.remove("is-drop-ready","is-group-drop-target")}),a.addEventListener("drop",o=>{if(o.preventDefault(),A){if(K(A,a.dataset.groupId)){A="",f(),k("分组顺序已更新");return}A="",a.classList.remove("is-group-drop-target");return}m.reports.find(n=>n.id===E)&&M(E,a.dataset.groupId)&&(E="",f(),k("已移入新分组")),E=""})});const t=document.getElementById("group-form");t==null||t.addEventListener("submit",a=>{var i,l;a.preventDefault();const o=(i=new FormData(t).get("name"))==null?void 0:i.trim(),r=(l=new FormData(t).get("description"))==null?void 0:l.trim();if(!o)return;if(b.mode==="edit"){const c=m.groups.find(g=>g.id===b.groupId);if(!c)return;c.name=o.slice(0,60),c.description=(r==null?void 0:r.slice(0,80))||"自定义工作主题"}else m.groups.push({id:tt("group"),name:o.slice(0,60),description:(r==null?void 0:r.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][m.groups.length%4],position:m.groups.length});D();const n=b.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";b=null,f(),k(n)});const e=document.getElementById("report-form");e==null||e.addEventListener("submit",async a=>{a.preventDefault();const o=e.elements.url.value.trim();if(!ot(o))return;const r=e.querySelector('button[type="submit"]');r.disabled=!0,r.innerHTML='<span class="mini-spinner"></span>';let n=e.elements.title.value.trim();n||(n=await et(e));const i=e.elements.groupId.value;if(b.mode==="edit"){const l=m.reports.find(c=>c.id===b.reportId);Object.assign(l,{title:n,url:o,groupId:i})}else m.reports.push({id:tt("report"),groupId:i,title:n||R(o),url:o,pinned:!1,position:m.reports.filter(l=>l.groupId===i).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:""});D(),b=null,f(),k("报告已保存")})}function Lt(){f()}Lt(document.getElementById("app"));
