(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();const Ct="clair-ai-studio-tasks-v1",rt=[{id:"save",name:"仅保存",icon:"◇",hint:"收进成果区，不执行分析"},{id:"review",name:"执行评审",icon:"审",hint:"智能判断最合适的评审路径"},{id:"skill",name:"触发 Skill",icon:"✦",hint:"明确指定一个工具执行"}],st=[{id:"auto",name:"智能识别",summon:"自动派单",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",summon:"需求专家",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",summon:"方案专家",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",summon:"决策顾问",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",summon:"协议专家",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",summon:"履历顾问",icon:"历",hint:"事实、能力、匹配、核验"}];let x=Yt(),g=Dt(),T="",D="compose";function Dt(){return{action:"review",skillId:"auto",goal:"",material:"",files:[],collabEnabled:!1,collabUrl:""}}function Yt(){try{const t=JSON.parse(localStorage.getItem(Ct));return Array.isArray(t)?t:[]}catch{return[]}}function _(){localStorage.setItem(Ct,JSON.stringify(x))}function Ot(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function pt(t){return st.find(e=>e.id===t)||st[0]}function Jt(t){return rt.find(e=>e.id===t)||rt[1]}function Xt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function Qt(t){return(t.match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(a=>/feishu\.cn|docs\.qq\.com|notion\.(so|site)|docs\.google\.com|yuque\.com|shimo\.im|office\.com|sharepoint\.com/i.test(a))||""}function te(t){var i;const e=t.toLowerCase();return((i=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(r=>e.includes(r))))==null?void 0:i[0])||"solution"}function Pt(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function ee(t,e){const a=t.files.length?t.files.map(r=>`${r.name}（${r.sizeLabel}）`).join("、"):"无附件",i=t.material.trim().length,n=t.collabUrl?`<li>协作文档：<a href="${e(t.collabUrl)}" target="_blank" rel="noreferrer">打开协作文档 ↗</a></li>`:"";return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(a)}</li>
      <li>粘贴内容：${i} 字</li>
      ${n}
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function ae(t,e){const a=t.files.length?t.files.map(n=>`${n.name}（${n.sizeLabel}）`).join("、"):"无附件",i=t.collabUrl?`<p><strong>协作文档</strong><br /><a href="${e(t.collabUrl)}" target="_blank" rel="noreferrer">${e(t.collabUrl)} ↗</a></p>`:"";return`
    <h2>资料已保存</h2>
    <p>${e(t.goal).replaceAll(`
`,"<br />")}</p>
    <h3>保存内容</h3>
    <ul>
      <li>附件记录：${e(a)}</li>
      <li>文本内容：${t.material.trim().length} 字</li>
      <li>保存位置：当前浏览器成果区</li>
    </ul>
    ${i}
    <p><small>静态版本不会上传原文件；这里只保存文字、链接、文件名及可读取文本摘要。</small></p>`}function ie(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function ne(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function N(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let n="";if(i&&a.size<=1024*1024)try{n=(await a.text()).slice(0,12e3)}catch{n=""}return{id:Ot(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:ne(a.size),excerpt:n}}))}function oe(t){return st.map(e=>`
    <button class="expert-choice ${g.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}"
      title="${t(e.hint)}" aria-pressed="${g.skillId===e.id}">
      <span>${t(e.icon)}</span>
      <strong>@${t(e.summon)}</strong>
    </button>`).join("")}function re(t){return rt.map(e=>`
    <button class="intake-action ${g.action===e.id?"selected":""}" type="button"
      data-task-action="choose-action" data-action-id="${e.id}"
      aria-pressed="${g.action===e.id}" title="${t(e.hint)}">
      <span>${t(e.icon)}</span>
      <strong>${t(e.name)}</strong>
    </button>`).join("")}function se(t){return g.files.length?`<div class="attachment-list">${g.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function le(t){const e=x.filter(a=>a.status!=="confirmed").sort((a,i)=>new Date(i.updatedAt)-new Date(a.updatedAt));return e.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${e.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(a=>`
          <button type="button" data-task-action="open-task" data-task-id="${a.id}">
            <span>${t(pt(a.skillId).icon)}</span>
            <div><strong>${t(a.title)}</strong><small>${a.status==="review"?"待确认":"处理中"} · ${Pt(a.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function ce(t){if(T){const e=x.find(a=>a.id===T);if(e)return de(e,t);T=""}return`
    <section class="inline-task-launcher prompt-launcher" aria-label="发起任务">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3" placeholder="描述你想完成的事，或把文档、图片直接拖进来……" aria-label="任务描述">${t(g.goal)}</textarea>
        </div>
        ${se(t)}
        <div class="intake-route-row">
          <div class="intake-actions" aria-label="处理方式">${re(t)}</div>
          <button class="collab-toggle ${g.collabEnabled?"selected":""}" type="button"
            data-task-action="toggle-collab" aria-expanded="${g.collabEnabled}">
            <span aria-hidden="true">↗</span><strong>协作文档</strong><small>可选</small>
          </button>
        </div>
        ${g.collabEnabled?`
          <label class="collab-url-row" for="task-collab-url">
            <span>协作文档链接</span>
            <input id="task-collab-url" type="url" value="${t(g.collabUrl)}"
              placeholder="粘贴飞书、腾讯文档、Notion 等协作链接" />
          </label>`:""}
        <div class="prompt-footer">
          <div class="prompt-material-actions">
            <label class="prompt-file-button" for="task-files">
              <input id="task-files" type="file" multiple />
              <span aria-hidden="true">＋</span>
              <strong>材料</strong>
            </label>
            <span class="paste-hint">拖入文件 · ⌘V 粘贴图片</span>
          </div>
          ${g.action==="save"?'<div class="save-mode-note"><span>◇</span><small>只保存记录，不执行分析</small></div>':`<div class="expert-summoner" aria-label="召唤专家">
                <span class="summon-label">${g.action==="skill"?"选择 Skill":"评审路径"}</span>
                <div class="expert-strip">${oe(t)}</div>
              </div>`}
          <button class="prompt-submit" type="submit" aria-label="${g.action==="save"?"保存资料":g.action==="skill"?"运行 Skill":"执行评审"}">
            <span>${g.action==="save"?"保存":g.action==="skill"?"运行":"评审"}</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
      ${le(t)}
    </section>
    <div class="global-drop-overlay" aria-hidden="true">
      <div><span>＋</span><strong>松手，创建任务</strong><small>文件会加入统一任务入口</small></div>
    </div>`}function de(t,e){var n;const a=t.status==="confirmed",i=t.collabUrl?`<section><span>协作文档</span><p><a href="${e(t.collabUrl)}" target="_blank" rel="noreferrer">打开协作文档 ↗</a></p></section>`:"";return`
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${t.workflow==="save"?"SAVED MATERIAL":`${e(t.skillName)} · SKILL V${e(t.skillVersion)}`}</span><h1>${e(t.title)}</h1></div>
        <span class="status-pill ${a?"done":""}">${a?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${e(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          ${i}
          <section><span>${t.workflow==="save"?"保存方式":"人工路径"}</span><p>${t.workflow==="save"?"仅保存记录与可读取摘要，不执行分析":"补充材料 → 修改初稿 → 再分析 → 确认入库"}</p></section>
          ${(n=t.revisions)!=null&&n.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${a?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${Pt(t.updatedAt)}</small></div>
          ${D==="edit"&&!a?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${a?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':D==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function ue(t){const e=x.filter(a=>a.status==="confirmed").sort((a,i)=>new Date(i.confirmedAt)-new Date(a.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(a=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${a.id}">
          <span>${a.workflow==="save"?"◇":t(pt(a.skillId).icon)}</span>
          <div><small>${t(a.skillName)}</small><strong>${t(a.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function pe({render:t,escapeHtml:e,showToast:a,showResults:i}){document.querySelectorAll("[data-task-action]").forEach(c=>{c.addEventListener("click",async p=>{var b;const u=p.currentTarget.dataset.taskAction;if(u==="expand-launcher")R(),t(),requestAnimationFrame(()=>{var f;return(f=document.getElementById("task-goal"))==null?void 0:f.focus()});else if(u==="collapse-launcher")R(),t();else if(u==="focus-composer")document.querySelector(".prompt-composer")?j():(T="",D="compose",t(),requestAnimationFrame(j));else if(u==="choose-action")R(),g.action=p.currentTarget.dataset.actionId,g.action==="skill"&&g.skillId==="auto"&&(g.skillId="requirement"),g.action==="review"&&(g.skillId="auto"),t(),requestAnimationFrame(j);else if(u==="toggle-collab")R(),g.collabEnabled=!g.collabEnabled,t(),g.collabEnabled&&requestAnimationFrame(()=>{var f;return(f=document.getElementById("task-collab-url"))==null?void 0:f.focus()});else if(u==="choose-skill")R(),g.skillId=p.currentTarget.dataset.skillId,g.action=g.skillId==="auto"?"review":"skill",t();else if(u==="remove-file")R(),g.files=g.files.filter(f=>f.id!==p.currentTarget.dataset.fileId),t();else if(u==="open-task")T=p.currentTarget.dataset.taskId,D="compose",t();else if(u==="close-task"){const f=x.find(w=>w.id===T);T="",D="compose",(f==null?void 0:f.status)==="confirmed"&&(i==null||i()),t()}else if(u==="edit-result")D="edit",t();else if(u==="cancel-edit")D="compose",t();else if(u==="save-revision"){const f=x.find(m=>m.id===p.currentTarget.dataset.taskId),w=(b=document.getElementById("task-result-input"))==null?void 0:b.value.trim();if(!f||!w)return;f.revisions||(f.revisions=[]),f.revisions.push({at:new Date().toISOString(),before:f.resultText||"",after:w}),f.resultText=w,f.resultHtml=`<p>${e(w).replaceAll(`
`,"</p><p>")}</p>`,f.updatedAt=new Date().toISOString(),_(),D="compose",t(),a("已保存人工修改，并记录为进化样本")}else if(u==="supplement-task"){const f=x.find(w=>w.id===T);if(!f)return;g={action:f.workflow||"review",skillId:f.requestedSkillId,goal:f.goal,material:f.material,files:f.files,collabEnabled:!!f.collabUrl,collabUrl:f.collabUrl||""},x=x.filter(w=>w.id!==f.id),_(),T="",D="compose",t()}else if(u==="confirm-task"){const f=x.find(w=>w.id===p.currentTarget.dataset.taskId);if(!f)return;f.status="confirmed",f.confirmedAt=new Date().toISOString(),f.updatedAt=f.confirmedAt,_(),T="",D="compose",i==null||i(),t(),a("已确认并放入成果区")}})});const n=document.getElementById("task-composer");n==null||n.addEventListener("submit",c=>{var $,y;if(c.preventDefault(),R(),!g.goal.trim())if(g.files.length)g.goal="分析已提供的材料";else{a("写下任务，或先加入一份材料"),($=document.getElementById("task-goal"))==null||$.focus();return}if(g.collabEnabled&&g.collabUrl.trim()&&!Xt(g.collabUrl.trim())){a("协作文档需要完整的 http 或 https 链接"),(y=document.getElementById("task-collab-url"))==null||y.focus();return}if(g.action==="skill"&&g.skillId==="auto"){a("请先选择要触发的 Skill");return}const p=g.skillId==="auto"?te(`${g.goal}
${g.material}
${g.files.map(U=>U.name).join(" ")}`):g.skillId,u=pt(p),b=Jt(g.action),f=new Date().toISOString(),w=g.action==="save",m={id:Ot(),title:ie(g.goal,w?"已保存":u.name),workflow:g.action,workflowName:b.name,requestedSkillId:g.skillId,skillId:p,skillName:w?"资料收纳":u.name,skillVersion:w?"local":"1.0.0",goal:g.goal.trim(),material:g.material.trim()||g.goal.trim(),files:g.files,collabUrl:g.collabEnabled?g.collabUrl.trim():"",status:w?"confirmed":"review",createdAt:f,updatedAt:f,confirmedAt:w?f:"",revisions:[]};m.resultHtml=w?ae(m,e):ee(m,e),m.resultText=w?`资料已保存。${m.goal}`:`材料已收齐并匹配 ${m.skillName}。目标：${m.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,x.push(m),_(),T=m.id,g=Dt(),t(),a(w?"已保存到成果区":`已创建任务，并匹配“${u.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async c=>{R(),g.files.push(...await N(c.target.files)),t(),a(`已加入 ${c.target.files.length} 个文件`)});const l=document.getElementById("material-drop")||document.querySelector(".prompt-composer");l==null||l.addEventListener("dragover",c=>{c.preventDefault(),l.classList.add("drag-over")}),l==null||l.addEventListener("dragleave",()=>l.classList.remove("drag-over")),l==null||l.addEventListener("drop",async c=>{c.preventDefault(),c.stopPropagation(),l.classList.remove("drag-over"),R();const p=c.dataTransfer.files;g.files.push(...await N(p)),t(),a(`已加入 ${p.length} 个文件`)});const s=document.getElementById("task-goal");s==null||s.addEventListener("input",()=>{g.goal=s.value}),s==null||s.addEventListener("paste",async c=>{var w;const p=[...((w=c.clipboardData)==null?void 0:w.items)||[]].filter(m=>m.kind==="file"&&m.type.startsWith("image/")).map(m=>m.getAsFile()).filter(Boolean);if(!p.length)return;c.preventDefault();const u=c.clipboardData.getData("text/plain"),b=s.selectionStart??s.value.length,f=s.selectionEnd??b;g.goal=`${s.value.slice(0,b)}${u}${s.value.slice(f)}`,g.files.push(...await N(p)),t(),a(`已从剪贴板加入 ${p.length} 张图片`)});const d=document.getElementById("task-collab-url");d==null||d.addEventListener("input",()=>{g.collabUrl=d.value}),ge({render:t,showToast:a})}function R(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal"),a=document.getElementById("task-quick-goal"),i=document.getElementById("task-collab-url");t&&(g.material=t.value),e&&(g.goal=e.value),a&&(g.goal=a.value),i&&(g.collabUrl=i.value)}function j(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function me(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function It(t){const e=t.trim();if(!e)return;g.goal=[g.goal.trim(),e].filter(Boolean).join(`

`);const a=Qt(e);a&&!g.collabUrl&&(g.collabEnabled=!0,g.collabUrl=a)}function ge({render:t,showToast:e}){document.onpaste=async a=>{var l,s;if(me(a.target)||!document.querySelector(".prompt-composer"))return;const n=[...((l=a.clipboardData)==null?void 0:l.items)||[]].filter(d=>d.kind==="file").map(d=>d.getAsFile()).filter(Boolean),r=((s=a.clipboardData)==null?void 0:s.getData("text/plain"))||"";!n.length&&!r.trim()||(a.preventDefault(),It(r),n.length&&g.files.push(...await N(n)),t(),requestAnimationFrame(j),e(n.length?`已从剪贴板加入 ${n.length} 个材料`:"已把粘贴内容放入新任务"))},document.ondragover=a=>{var i;[...((i=a.dataTransfer)==null?void 0:i.types)||[]].some(n=>n==="Files"||n==="text/uri-list")&&(a.preventDefault(),document.body.classList.add("global-drag-ready"))},document.ondragleave=a=>{a.relatedTarget||document.body.classList.remove("global-drag-ready")},document.ondrop=async a=>{var r,l,s,d;if(document.body.classList.remove("global-drag-ready"),(l=(r=a.target)==null?void 0:r.closest)!=null&&l.call(r,".prompt-composer"))return;const i=((s=a.dataTransfer)==null?void 0:s.files)||[],n=((d=a.dataTransfer)==null?void 0:d.getData("text/uri-list"))||"";!i.length&&!n.trim()||(a.preventDefault(),i.length&&g.files.push(...await N(i)),It(n),t(),requestAnimationFrame(j),e(i.length?`已拖入 ${i.length} 个文件`:"已把链接放入新任务"))}}const X="clair-report-editor-v1",fe="https://api.github.com",Rt="2026",be="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:null,showToast:null},V=new Map;let At=!1;function mt(t){return[...new Set(t.filter(Boolean))]}function lt(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function gt(t){return`${be}${t}`}function he(t){try{const e=sessionStorage.getItem(gt(t));if(!e)return null;const a=JSON.parse(e);return!(a!=null&&a.html)||typeof a.html!="string"?null:a}catch{return null}}function Ut(t=o.reportId){try{sessionStorage.removeItem(gt(t))}catch{}}function Bt(){return o.dirty&&o.hasDraft?{tone:"changed",label:"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:"生产档案已更新"}:{tone:"clean",label:"未修改"}}function Y(){const t=Bt(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const a=document.querySelector('[data-editor-action="stash"]');a&&(a.disabled=o.status!=="ready"||o.saving||!o.dirty,a.textContent=!o.dirty&&o.hasDraft?"已暂存":"暂存");const i=document.querySelector('[data-editor-action="publish"]');i&&(i.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft,i.textContent=o.saving?"推送中…":"推送生产");const n=document.querySelector('[data-editor-action="preview"]');n&&(n.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function ve(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function ye(t){const e=atob(String(t||"").replace(/\s/g,"")),a=Uint8Array.from(e,i=>i.charCodeAt(0));return new TextDecoder().decode(a)}function we(t){const e=new TextEncoder().encode(t);let a="";const i=32768;for(let n=0;n<e.length;n+=i)a+=String.fromCharCode(...e.subarray(n,n+i));return btoa(a)}function tt(t){let e="";for(let i=0;i<t.length;i+=32768)e+=String.fromCharCode(...t.subarray(i,i+32768));return btoa(e)}function et(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Mt(t,e){const a=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},a,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function St(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const a=JSON.parse(e[1]),i=et(a.salt),n=et(a.iv),r=await Mt(Rt,i),l=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},r,et(a.data)),s=new TextDecoder().decode(l);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function ft(t){var l;if(((l=o.protection)==null?void 0:l.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),a=crypto.getRandomValues(new Uint8Array(12)),i=await Mt(Rt,e),n=await crypto.subtle.encrypt({name:"AES-GCM",iv:a},i,new TextEncoder().encode(t)),r=JSON.stringify({salt:tt(e),iv:tt(a),data:tt(new Uint8Array(n))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,r)}function ke(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const a=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),i=a.shift()||"ClairKu.github.io";let n=a.join("/");(!n||e.pathname.endsWith("/"))&&(n=`${n?`${n}/`:""}index.html`);const r=mt([`docs/${n}`,n,`public/${n}`]);return{owner:"ClairKu",repository:i,branch:"main",path:r[0],candidates:r,source:"auto"}}catch{return null}}async function J(t,{token:e="",method:a="GET",body:i}={}){var l;const n={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(n.Authorization=`Bearer ${e}`),i!==void 0&&(n["Content-Type"]="application/json");const r=await fetch(`${fe}${t}`,{method:a,headers:n,body:i===void 0?void 0:JSON.stringify(i)});if(!r.ok){let s="";try{s=((l=await r.json())==null?void 0:l.message)||""}catch{s=await r.text()}const d=new Error(s||`GitHub API ${r.status}`);throw d.status=r.status,d}return r.status===204?null:r.json()}async function $e(t){var l;const e=await J(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const a=mt((l=t.candidates)!=null&&l.length?t.candidates:[t.path]);let i=null,n=null;const r=[];for(const s of a)try{const d=s.split("/").map(encodeURIComponent).join("/"),c=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${d}?ref=${encodeURIComponent(t.branch)}`,p=await J(c);let u="";if(p.encoding==="base64"&&p.content)u=ye(p.content);else if(p.download_url){const b=await fetch(p.download_url,{cache:"no-store"});if(!b.ok)throw new Error("无法读取 GitHub 原始文件");u=await b.text()}if(!u)throw new Error("GitHub 文件内容为空");n?u===n.html&&r.push({path:s,sha:p.sha}):n={html:u,target:{...t,path:s,sha:p.sha,candidates:a}}}catch(d){if(i=d,d.status&&![403,404].includes(d.status))break}if(n)return n.target.mirrors=r,n;throw i||new Error("没有找到对应的 GitHub HTML 文件")}function Ie(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(i=>{/^on/i.test(i.name)&&(e.setAttribute(`data-clair-event-${i.name.toLowerCase()}`,i.value),e.removeAttribute(i.name))});const a=e.getAttribute("href");a&&/^\s*javascript:/i.test(a)&&(e.dataset.clairJavascriptHref=a,e.removeAttribute("href"))})}function Ae(){return`
(() => {
  const channel = ${JSON.stringify(X)};
  const send = (type, payload = {}) => parent.postMessage({ channel, type, ...payload }, "*");
  const body = document.body;
  body.contentEditable = "true";
  body.spellcheck = true;
  body.dataset.clairEditable = "true";

  const restoreDocument = () => {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("spellcheck");
    clone.querySelector("body")?.removeAttribute("data-clair-editable");
    clone.querySelector("#clair-editor-style")?.remove();
    clone.querySelector("#clair-editor-bridge")?.remove();
    clone.querySelector("base[data-clair-editor-base]")?.remove();
    clone.querySelectorAll("meta[data-clair-editor-http-equiv]").forEach((meta) => {
      meta.setAttribute("http-equiv", meta.dataset.clairEditorHttpEquiv);
      meta.removeAttribute("data-clair-editor-http-equiv");
    });
    clone.querySelectorAll("script[data-clair-original-type]").forEach((script) => {
      const originalType = script.dataset.clairOriginalType;
      script.removeAttribute("data-clair-original-type");
      if (originalType === "__empty__") script.removeAttribute("type");
      else script.setAttribute("type", originalType);
    });
    clone.querySelectorAll("*").forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (!attribute.name.startsWith("data-clair-event-on")) return;
        element.setAttribute(attribute.name.slice("data-clair-event-".length), attribute.value);
        element.removeAttribute(attribute.name);
      });
      if (element.hasAttribute("data-clair-javascript-href")) {
        element.setAttribute("href", element.dataset.clairJavascriptHref);
        element.removeAttribute("data-clair-javascript-href");
      }
    });
    return "<!DOCTYPE html>\\n" + clone.outerHTML;
  };

  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.channel !== channel) return;
    const message = event.data;
    if (message.type === "command") {
      body.focus();
      document.execCommand(message.command, false, message.value ?? null);
      send("command-state", { command: message.command });
      return;
    }
    if (message.type === "serialize") {
      send("serialized", { requestId: message.requestId, html: restoreDocument() });
    }
  });

  document.addEventListener("input", () => send("dirty"), true);
  document.addEventListener("selectionchange", () => {
    send("selection", {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline")
    });
  });
  send("ready");
})();
`}function Se(t,e){const i=new DOMParser().parseFromString(t,"text/html");i.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),Ie(i);const n=i.createElement("base");n.href=e,n.dataset.clairEditorBase="true",i.head.prepend(n);const r=i.createElement("style");r.id="clair-editor-style",r.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,i.head.append(r);const l=i.createElement("script");return l.id="clair-editor-bridge",l.textContent=Ae(),i.body.append(l),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}async function Nt(t){var e;try{const a=ke(t.url);let i=null;if(a)try{i=await $e(a)}catch{}if(!i){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);i={html:await s.text(),target:a}}const n=await St(i.html);o.protection=n.protection,o.target=i.target||a;let r=n.html;const l=he(t.id);if(l!=null&&l.html)try{const s=await St(l.html);r=s.html,o.hasDraft=!0,o.draftHtml=s.html,o.draftAt=l.savedAt||"",l.baseFiles&&o.target&&(o.target.baseFiles=l.baseFiles)}catch{Ut(t.id)}o.html=r,o.editorDocument=Se(r,t.url),o.status="ready",o.error=""}catch(a){o.status="error",o.error=(a==null?void 0:a.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function jt(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:t,showToast:e})}function bt(){return document.querySelector(".report-editor-frame")}function at(t,e=null){var i;const a=bt();(i=a==null?void 0:a.contentWindow)==null||i.postMessage({channel:X,type:"command",command:t,value:e},"*")}function ht(){var a;const t=bt();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((i,n)=>{const r=window.setTimeout(()=>{V.delete(e),n(new Error("读取编辑内容超时"))},1e4);V.set(e,{resolve:l=>{clearTimeout(r),i(l)}}),t.contentWindow.postMessage({channel:X,type:"serialize",requestId:e},"*")})}function Ee(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Ft(t,e){const a=new Blob([t],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(a),n=document.createElement("a");n.href=i,n.download=Ee(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),1e3)}async function Gt(t){await navigator.clipboard.writeText(t)}function qe(t,e){var n;const a=new DOMParser().parseFromString(t,"text/html");(n=a.querySelector("base[data-clair-preview-base]"))==null||n.remove();const i=a.createElement("base");return i.href=e,i.dataset.clairPreviewBase="true",a.head.prepend(i),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function Te(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([qe(o.draftHtml,t.url)],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(e),i=window.open(a,"_blank");if(!i)throw URL.revokeObjectURL(a),new Error("浏览器拦截了新窗口，请允许弹窗后重试");i.opener=null,window.setTimeout(()=>URL.revokeObjectURL(a),6e4)}async function ct(t,{silent:e=!1}={}){var r;const a=await ht(),i=await ft(a),n=new Date().toISOString();try{sessionStorage.setItem(gt(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:n,baseFiles:lt(),html:i}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=a,o.draftHtml=a,o.draftAt=n,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",Y(),e||(r=o.showToast)==null||r.call(o,"已暂存在当前浏览器会话，尚未更新 GitHub"),a}async function xe(t){var s,d;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const a=await ft(t),i=(e.mirrors||[]).map(c=>c.path),n=mt([...i.filter(c=>c.startsWith("public/")),...i.filter(c=>!c.startsWith("public/")&&c!==e.path),e.path]);let r="";const l=[];for(const c of n)try{const p=c.split("/").map(encodeURIComponent).join("/"),u=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${p}`,b=await J(`${u}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),f=lt(e)[c];if(f&&b.sha!==f)throw new Error(`生产文件 ${c} 已在本次编辑后更新，请重新打开报告合并修改`);const w=await J(u,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:we(a),sha:b.sha,branch:e.branch}});r=((s=w==null?void 0:w.commit)==null?void 0:s.sha)||r,e.baseFiles={...lt(e),[c]:((d=w==null?void 0:w.content)==null?void 0:d.sha)||b.sha},l.push(c)}catch(p){throw l.length?new Error(`已更新 ${l.join("、")}，但 ${c} 同步失败：${p.message}`):p}return{commit:r,files:l.length}}async function Et(t){var e,a;if(!o.saving){o.saving=!0,Y();try{const i=o.dirty?await ct(t,{silent:!0}):o.draftHtml||await ht(),n=await xe(i);o.html=i,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=n.commit,Ut(t.id),(e=o.showToast)==null||e.call(o,n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(i){(a=o.showToast)==null||a.call(o,(i==null?void 0:i.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,Y()}}}function Le(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${o.settingsOpen?"":"hidden"}>
      <form class="dialog editor-settings-dialog" id="editor-settings-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">GITHUB SAVE PERMISSION</span>
            <h2>设置安全保存</h2>
          </div>
          <button type="button" data-editor-action="close-settings" aria-label="关闭">×</button>
        </div>
        <div class="editor-security-note">
          <strong>Token 只保留在当前页面内存</strong>
          <span>刷新或关闭页面后自动清除，不写入 localStorage，也不会传给被编辑的 HTML。</span>
        </div>
        <div class="editor-target-grid">
          <label>GitHub 所有者
            <input name="owner" value="${t(e.owner||"ClairKu")}" required />
          </label>
          <label>仓库
            <input name="repository" value="${t(e.repository||"")}" placeholder="clair-ai-studio" required />
          </label>
          <label>分支
            <input name="branch" value="${t(e.branch||"main")}" required />
          </label>
          <label class="editor-path-field">HTML 文件路径
            <input name="path" value="${t(e.path||"")}" placeholder="docs/reports/example/index.html" required />
          </label>
        </div>
        <label>Fine-grained personal access token
          <input class="github-token-input" name="github-token-not-password" type="text" value=""
            autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-1p-ignore
            placeholder="${o.token?"已连接；留空可继续使用当前 Token":"github_pat_…"}" ${o.token?"":"required"} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">取消</button>
          <button type="submit" class="primary-button">${o.pendingSave?"连接并保存":"保存设置"}</button>
        </div>
      </form>
    </div>`}function Ce(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
    <div class="dialog-backdrop editor-publish-backdrop" ${o.publishConfirmOpen?"":"hidden"}>
      <section class="dialog compact-dialog editor-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-confirm-title">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">PRODUCTION ARCHIVE</span>
            <h2 id="publish-confirm-title">更新 GitHub 生产档案？</h2>
          </div>
          <button type="button" data-editor-action="close-publish" aria-label="关闭">×</button>
        </div>
        <div class="editor-publish-summary">
          <span class="editor-revision-status is-staged">已暂存 · 待推送生产</span>
          <p>暂存内容仍只在当前浏览器会话。确认后才会提交 GitHub，并更新原报告生产链接。</p>
        </div>
        <div class="editor-publish-target">
          <small>目标文件</small>
          <strong>${t(e)}</strong>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-publish">继续编辑</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">确认推送生产</button>
        </div>
      </section>
    </div>`}function qt({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const a=e.querySelector("#editor-settings-form"),i=o.target||{};if(a){a.elements.owner.value=i.owner||"ClairKu",a.elements.repository.value=i.repository||"",a.elements.branch.value=i.branch||"main",a.elements.path.value=i.path||"";const n=a.querySelector('button[type="submit"]');n&&(n.textContent=t?"连接并保存":"保存设置")}}function z(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function De(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function H(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Zt(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function Oe(t,{render:e,showToast:a}){jt(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:a}),e(),o.loadPromise=Nt(t)}function Pe(t,e){var l;const a=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(l=o.target.mirrors)!=null&&l.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",i=Bt(),n=o.status==="ready"?`
      <div class="editor-toolbar" role="toolbar" aria-label="文本排版工具">
        <select data-editor-format aria-label="段落格式">
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
          <option value="blockquote">引用</option>
        </select>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="bold" title="粗体"><strong>B</strong></button>
        <button type="button" data-editor-command="italic" title="斜体"><em>I</em></button>
        <button type="button" data-editor-command="underline" title="下划线"><u>U</u></button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="insertUnorderedList" title="项目列表">• 列表</button>
        <button type="button" data-editor-command="insertOrderedList" title="编号列表">1. 列表</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="justifyLeft" title="左对齐">左</button>
        <button type="button" data-editor-command="justifyCenter" title="居中">中</button>
        <button type="button" data-editor-command="justifyRight" title="右对齐">右</button>
        <button type="button" data-editor-command="justifyFull" title="两端对齐">齐</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-action="link" title="添加链接">🔗 链接</button>
        <button type="button" data-editor-command="unlink" title="移除链接">取消链接</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="undo" title="撤销">↶</button>
        <button type="button" data-editor-command="redo" title="重做">↷</button>
      </div>`:"",r=o.status==="loading"?'<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>会自动识别对应 GitHub 仓库与源文件。</p></div>':o.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(o.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${ve(o.editorDocument)}"></iframe></div>`;return`
    <main class="reader-shell report-editor-shell">
      <header class="reader-header editor-header">
        <button class="back-button" type="button" data-editor-action="exit"><span aria-hidden="true">←</span>退出编辑</button>
        <div class="reader-title">
          <strong>${e(t.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${i.tone}">${e(i.label)}</span>
            <span class="editor-target-label" title="${e(a)}">${e(a)}</span>
          </div>
        </div>
        <div class="reader-actions editor-actions">
          <button class="quiet-button" type="button" data-editor-action="settings">保存权限</button>
          <button class="quiet-button" type="button" data-editor-action="stash"
            ${o.status!=="ready"||o.saving||!o.dirty?"disabled":""}>${!o.dirty&&o.hasDraft?"已暂存":"暂存"}</button>
          <button class="quiet-button" type="button" data-editor-action="preview"
            title="在新窗口打开已暂存修订" ${o.status!=="ready"||!o.hasDraft?"disabled":""}>另开启</button>
          <button class="quiet-button" type="button" data-editor-action="download">下载 HTML</button>
          <button class="quiet-button" type="button" data-editor-action="share">分享</button>
          <button class="primary-button" type="button" data-editor-action="publish"
            ${o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft?"disabled":""}>${o.saving?"推送中…":"推送生产"}</button>
        </div>
      </header>
      ${n}
      ${r}
      ${Le(e)}
      ${Ce(e)}
    </main>`}function Re(t){if(!Zt(t.id))return;At||(At=!0,window.addEventListener("message",i=>{var r;const n=bt();if(!(!(n!=null&&n.contentWindow)||i.source!==n.contentWindow)&&((r=i.data)==null?void 0:r.channel)===X){if(i.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",Y()),i.data.type==="serialized"){const l=V.get(i.data.requestId);if(!l)return;V.delete(i.data.requestId),l.resolve(i.data.html)}i.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(l=>{const s=l.dataset.editorCommand;["bold","italic","underline"].includes(s)&&l.classList.toggle("active",!!i.data[s])})}}),window.addEventListener("beforeunload",i=>{!o.reportId||!o.dirty||(i.preventDefault(),i.returnValue="")}),window.addEventListener("keydown",i=>{i.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?H():o.settingsOpen&&z())})),document.querySelectorAll("[data-editor-command]").forEach(i=>{i.addEventListener("mousedown",n=>n.preventDefault()),i.addEventListener("click",()=>at(i.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{at("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(i=>{i.addEventListener("click",async()=>{var r,l,s,d,c,p,u,b,f,w,m,$;const n=i.dataset.editorAction;if(n==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const y=o.render;jt(),y==null||y()}else if(n==="settings")qt();else if(n==="close-settings")z();else if(n==="stash")try{await ct(t)}catch(y){(r=o.showToast)==null||r.call(o,(y==null?void 0:y.message)||"暂存失败，请下载 HTML 备份")}else if(n==="preview")try{Te(t),(l=o.showToast)==null||l.call(o,"已在新窗口打开暂存修订")}catch(y){(s=o.showToast)==null||s.call(o,(y==null?void 0:y.message)||"无法打开预览")}else if(n==="publish")try{if(o.dirty&&await ct(t,{silent:!0}),!o.hasDraft){(d=o.showToast)==null||d.call(o,"当前没有待推送的修订");return}De()}catch(y){(c=o.showToast)==null||c.call(o,(y==null?void 0:y.message)||"暂存失败，请下载 HTML 备份")}else if(n==="close-publish")H();else if(n==="confirm-publish")H(),!o.token||!((p=o.target)!=null&&p.path)?qt({pendingSave:!0}):await Et(t);else if(n==="download")try{const y=await ht();Ft(await ft(y),t.title),(u=o.showToast)==null||u.call(o,"HTML 已下载")}catch(y){(b=o.showToast)==null||b.call(o,(y==null?void 0:y.message)||"下载失败")}else if(n==="download-published")await _t(t,o.showToast);else if(n==="share")try{await Gt(t.url),(f=o.showToast)==null||f.call(o,"报告链接已复制")}catch{(w=o.showToast)==null||w.call(o,"复制失败，请从地址栏复制")}else if(n==="link"){const y=prompt("输入链接地址（https://…）");if(!y)return;try{const U=new URL(y);if(!["http:","https:","mailto:"].includes(U.protocol))throw new Error;at("createLink",U.href)}catch{(m=o.showToast)==null||m.call(o,"请输入有效的 http、https 或 mailto 链接")}}else n==="retry"&&(o.status="loading",o.error="",($=o.render)==null||$.call(o),o.loadPromise||(o.loadPromise=Nt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(i=>{i.addEventListener("click",n=>{n.target===i&&(i.classList.contains("editor-settings-backdrop")?z():H())})});const a=document.getElementById("editor-settings-form");a==null||a.addEventListener("submit",async i=>{var c,p,u;i.preventDefault();const n=new FormData(a),r=String(n.get("github-token-not-password")||"").trim();r&&(o.token=r);const l=String(n.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(n.get("owner")||"").trim(),repository:String(n.get("repository")||"").trim(),branch:String(n.get("branch")||"main").trim(),path:l,mirrors:l===((c=o.target)==null?void 0:c.path)?((p=o.target)==null?void 0:p.mirrors)||[]:[],source:"manual"};const s=o.pendingSave;z();const d=document.querySelector(".editor-target-label");if(d){const b=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;d.textContent=b,d.title=b}(u=o.showToast)==null||u.call(o,"保存权限已连接"),s&&await Et(t)})}async function _t(t,e){try{const a=await fetch(t.url,{cache:"no-store"});if(!a.ok)throw new Error;Ft(await a.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function Ue(t,e){try{await Gt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const vt="clair-service-report-workbench-v1",yt="clair-service-report-workbench-access",dt="clair-service-report-workbench-view",B=6,Q=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],W=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],M={version:B,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},ut={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},zt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function wt(t){const e=`${t.title||""} ${t.source||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|工作台|原型/.test(e)?"product-demo":"product-planning"}function kt(t,e=wt(t)){const a=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""}`,i=[],n=r=>{i.includes(r)||i.push(r)};return/ontology\.yingmi-inc\.com|本体/.test(a)&&n("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(a)&&n("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(a))&&n("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(a)||t.groupId==="xiaogu")&&n("AI 小顾"),(/workbench|工作台|skill-audit/.test(a)||t.groupId==="ai-workbench")&&n("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(a)||t.groupId==="ai-platform")&&n("AI 开放平台"),/且慢|qieman/.test(a)&&n("且慢"),/投顾|advisor|财务规划/.test(a)&&n("投顾服务"),/OAP|oap-/.test(a)&&n("OAP"),/MCP|mcp-/.test(a)&&n("MCP"),/Skills|skill-/.test(a)&&n("Skills"),(e==="investment-research"||t.groupId==="research")&&n("投研"),e==="data-analysis"&&n("数据分析"),e==="requirement-review"&&n("需求评审"),e==="reporting"&&n("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&n("知识治理"),i.slice(0,5)}M.reports=M.reports.map(t=>{const e=zt[t.id]||t.groupId,a=ut[t.id]||wt(t),i={...t,groupId:e,workType:a};return{...i,tags:kt(i,a)}});let v=Be(),E="",O="",F=!1,S=["topic","type","tag"].includes(localStorage.getItem(dt))?localStorage.getItem(dt):"topic",C="",q="",P="",I=null,Tt=0;function Ht(t){return JSON.parse(JSON.stringify(t))}function it(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function Be(){try{const t=JSON.parse(localStorage.getItem(vt));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Me(t)}catch{}return Ht(M)}function Me(t){const e=Ht(M),a=new Set(e.groups.map(m=>m.id)),i=new Set(["inbox","today","product","research"]),n=new Map(t.groups.map(m=>[m.id,m])),r=e.groups.map(m=>{const $=n.get(m.id);return!$||t.version<B?m:{...m,name:$.name||m.name,description:$.description||m.description,position:Number.isFinite($.position)?$.position:m.position}});t.groups.filter(m=>!a.has(m.id)&&!i.has(m.id)).forEach((m,$)=>{r.push({...m,description:m.description||"自定义工作分组",position:Number.isFinite(m.position)?m.position:M.groups.length+$})});const l=r.filter((m,$,y)=>y.findIndex(U=>U.id===m.id)===$);l.sort((m,$)=>(m.position||0)-($.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},d={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},c=t.reports.map(m=>({...m,groupId:zt[m.id]||s[m.id]||d[m.groupId]||m.groupId||"inbox",workType:m.workType||ut[m.id]||wt(m),tags:Array.isArray(m.tags)&&m.tags.length?m.tags:kt(m,m.workType||ut[m.id])})),p=new Map(c.map(m=>[m.id,m])),u=new Map(c.map(m=>[it(m.url),m])),b=new Set,f=e.reports.map(m=>{const $=it(m.url);b.add($);const y=p.get(m.id)||u.get($);return y?{...m,title:y.title||m.title,groupId:t.version>=B&&l.some(U=>U.id===y.groupId)?y.groupId:m.groupId,workType:t.version>=B&&y.workType?y.workType:m.workType,tags:t.version>=B&&Array.isArray(y.tags)&&y.tags.length?y.tags:m.tags,pinned:!!y.pinned,position:Number.isFinite(y.position)?y.position:m.position,archived:!!y.archived,archivedAt:y.archivedAt||""}:m});c.forEach(m=>{const $=it(m.url);b.has($)||(b.add($),f.push(m))});const w={version:B,groups:l,reports:f};return localStorage.setItem(vt,JSON.stringify(w)),w}function L(){v.version=B,v.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(vt,JSON.stringify(v))}function nt(t,e){const a=v.groups.findIndex(r=>r.id===t),i=v.groups.findIndex(r=>r.id===e);if(a<0||i<0||a===i)return!1;const[n]=v.groups.splice(a,1);return v.groups.splice(i,0,n),L(),!0}function Ne(t,e,a=""){const i=v.reports.find(s=>s.id===t);if(!i||i.archived||!v.groups.find(s=>s.id===e))return!1;const r=v.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,d)=>(s.position||0)-(d.position||0)),l=a?r.findIndex(s=>s.id===a):r.length;return i.groupId=e,r.splice(l<0?r.length:l,0,i),r.forEach((s,d)=>{s.position=d}),L(),!0}function je(t){var e;return((e=Q.find(a=>a.id===t))==null?void 0:e.name)||"产品规划"}function Fe(t,e=""){const a=i=>!e||i.toLowerCase().includes(e);if(S==="type")return Q.map(i=>({id:i.id,name:i.name,kind:"type",accent:"blue",reports:t.filter(n=>n.workType===i.id).sort((n,r)=>+!!r.pinned-+!!n.pinned||new Date(r.createdAt)-new Date(n.createdAt))})).filter(i=>!e||i.reports.length||a(i.name));if(S==="tag"){const i=new Set(W);return v.reports.forEach(r=>{(r.tags||[]).forEach(l=>i.add(l))}),[...i].sort((r,l)=>{const s=W.indexOf(r),d=W.indexOf(l);return s>=0||d>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(d<0?Number.MAX_SAFE_INTEGER:d):r.localeCompare(l,"zh-CN")}).map(r=>({id:r,name:r,kind:"tag",accent:"violet",reports:t.filter(l=>(l.tags||[]).includes(r)).sort((l,s)=>+!!s.pinned-+!!l.pinned||new Date(s.createdAt)-new Date(l.createdAt))})).filter(r=>r.reports.length&&(!e||a(r.name)||r.reports.length))}return v.groups.map(i=>({...i,kind:"topic",reports:t.filter(n=>n.groupId===i.id).sort((n,r)=>(n.position||0)-(r.position||0))})).filter(i=>!e||i.reports.length||a(`${i.name} ${i.description||""}`))}function K(t,e,a,i=""){const n=v.reports.find(r=>r.id===t);return!n||n.archived?!1:e==="topic"?Ne(t,a,i):e==="type"?Q.some(r=>r.id===a)?(n.workType=a,L(),!0):!1:e==="tag"?(n.tags=Array.isArray(n.tags)?n.tags:[],n.tags.includes(a)||n.tags.push(a),L(),!0):!1}function G(){return S==="type"?"工作类型":S==="tag"?"标签":"主题"}function xt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function h(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Z(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function Kt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function ot(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function A(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Tt),Tt=window.setTimeout(()=>e.remove(),2600)}function Wt(t,e=!1){const a=t.access!=="production",i=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=!a&&M.reports.some(l=>l.id===t.id)?`<img src="./previews/${h(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":h(t.title.slice(0,2))}</span>
        <strong>${a?i:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${P===t.id?"is-move-selected":""}" data-report-id="${h(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${h(t.id)}" aria-label="打开${h(t.title)}">
        <span class="report-preview">
          ${r}
        </span>
        <span class="report-copy">
          <span class="report-source">${h(t.source||"手动添加")}</span>
          <strong>${h(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(l=>`<span>${h(l)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${h(i)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${h(t.id)}"
          aria-label="拖动《${h(t.title)}》到其他${G()}" title="拖动到其他${G()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${h(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${h(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${h(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            <button type="button" data-action="edit" data-id="${h(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${h(t.id)}">归档</button>`}
      </div>
    </article>`}function $t(){var a;if(!I)return"";if(I.type==="tags"){const i=v.reports.find(n=>n.id===I.reportId);return i?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${h(i.title)}</p>
          <label>标签
            <input name="tags" value="${h((i.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${W.map(n=>`<button type="button" class="${(i.tags||[]).includes(n)?"selected":""}" data-tag-suggestion="${h(n)}">${h(n)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(I.type==="group"){const i=I.mode==="edit"?v.groups.find(n=>n.id===I.groupId):null;return`
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
            <input name="name" value="${h((i==null?void 0:i.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${h((i==null?void 0:i.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${i?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=I.mode==="edit"?v.reports.find(i=>i.id===I.reportId):null,e=(t==null?void 0:t.groupId)||I.groupId||((a=v.groups[0])==null?void 0:a.id)||"";return`
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
            <input name="url" type="url" value="${h((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${h((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${v.groups.map(i=>`<option value="${h(i.id)}" ${i.id===e?"selected":""}>${h(i.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${Q.map(i=>`<option value="${h(i.id)}" ${i.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${h(i.name)}</option>`).join("")}
          </select>
        </label>
        <label>关键标签
          <input name="tags" value="${h(((t==null?void 0:t.tags)||[]).join("、"))}" placeholder="本体、飞书、调研" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function Ge(){return`
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
        <div class="gate-foot"><span>Access protected</span><span>Local settings</span></div>
      </section>
    </main>`}function Ze(t){if(Zt(t.id))return Pe(t,h);const e=t.access!=="production",a=t.access==="org"?"组织账号":"站点账号",i=e?`
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
            <a class="primary-button" href="${h(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${h(Z(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${h(t.title)}" src="${h(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${h(t.title)}</strong>
          <span>${h(Z(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${h(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          ${e?"":`<button class="primary-button" type="button" data-action="edit-document" data-id="${h(t.id)}">编辑文档</button>`}
          <button class="quiet-button" type="button" data-action="download-report" data-id="${h(t.id)}">下载 HTML</button>
          <button class="quiet-button" type="button" data-action="share-report" data-id="${h(t.id)}">分享</button>
          <button class="quiet-button" type="button" data-action="edit" data-id="${h(t.id)}">编辑信息</button>
        </div>
      </header>
      ${i}
      ${$t()}
    </main>`}function Vt(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      <div class="top-actions">
        ${F?'<button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button>':'<button class="primary-button new-task-button" type="button" data-task-action="focus-composer"><span aria-hidden="true">＋</span> 新增任务</button>'}
      </div>
    </header>`}function _e(){const t=v.reports.filter(a=>a.archived).filter(a=>{if(!E.trim())return!0;const i=E.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=v.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${Vt()}
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
              <div><h2>${E?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(a=>Wt(a,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${E?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${E?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${E?"clear-search":"show-catalog"}">${E?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${$t()}
    </main>`}function ze(){if(F)return _e();const t=E.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),a=v.reports.filter(c=>!c.archived),i=e.length?a.filter(c=>{const p=`${c.title} ${c.source||""} ${c.access||""} ${je(c.workType)} ${(c.tags||[]).join(" ")}`.toLowerCase();return e.every(u=>p.includes(u))}):a,n=v.reports.filter(c=>c.archived).length,r=a.filter(c=>c.access==="production").length,l=a.filter(c=>c.access!=="production").length,s=Fe(i,t).filter(c=>c.reports.length||P),d=S==="type"?"工作类型":S==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${Vt()}
      <section class="workspace">
        ${ce(h)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${a.length}</strong><span>成果</span>
              <i></i>
              <strong>${v.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${r}</strong><span>直达</span>
            </div>
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${h(E)}" placeholder="搜索标题、标签或来源" aria-label="搜索成果" />
              ${E?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${ue(h)}
        <section class="groups-section">
          ${P?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${G()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div class="classification-actions">
              <div class="view-switcher" role="tablist" aria-label="成果分类方式">
                <button type="button" role="tab" aria-selected="${S==="topic"}" class="${S==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                <button type="button" role="tab" aria-selected="${S==="type"}" class="${S==="type"?"active":""}" data-action="set-view" data-id="type">类型</button>
                <button type="button" role="tab" aria-selected="${S==="tag"}" class="${S==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
              </div>
              <button class="quiet-button add-topic-button" type="button" data-action="add-group">＋ 主题</button>
            </div>
          </div>
          ${s.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${d}">
                ${s.map((c,p)=>`<a href="#bucket-${p}"><span class="nav-index">${String(p+1).padStart(2,"0")}</span>${h(c.name)}<span>${c.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${n?`<em>${n}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${S}">
              ${s.map((c,p)=>`
                <section id="bucket-${p}" class="group-column topic-section bucket-${h(c.kind)} accent-${h(c.accent||"blue")}"
                  data-bucket-kind="${h(c.kind)}"
                  data-bucket-id="${h(c.id)}"
                  ${c.kind==="topic"?`data-group-id="${h(c.id)}"`:""}>
                  <header class="group-header">
                    ${c.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${h(c.id)}"
                          aria-label="拖动“${h(c.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(p+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${c.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${h(c.name)}</h2></div>
                      <span class="count">${c.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${P?`<button class="move-here-button" type="button" data-action="move-here" data-id="${h(c.id)}" data-bucket-kind="${h(c.kind)}">移到这里</button>`:""}
                      ${c.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${h(c.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${h(c.id)}">编辑主题</button>
                           ${c.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${h(c.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${c.reports.length?c.reports.map(u=>Wt(u)).join(""):c.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${h(c.id)}">
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
            <span>${l} 份报告需要组织或账号登录${n?` · ${n} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${$t()}
    </main>`}function k(){const t=document.getElementById("app");if(sessionStorage.getItem(yt)!=="ok"){t.innerHTML=Ge(),He();return}const e=O&&v.reports.find(a=>a.id===O);t.innerHTML=e?Ze(e):ze(),Ke(),pe({render:k,escapeHtml:h,showToast:A,showResults:()=>{F=!1}})}function He(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(yt,"ok"),k()})}async function Lt(t){var l,s;const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),n=t.querySelector(".field-hint"),r=e.value.trim();if(!Kt(r))return n.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',n.textContent="正在读取网页标题…";try{const d=`https://api.microlink.io/?url=${encodeURIComponent(r)}`,c=await fetch(d,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!c.ok)throw new Error("read failed");const p=await c.json(),u=((s=(l=p==null?void 0:p.data)==null?void 0:l.title)==null?void 0:s.trim())||Z(r);return a.value=u.slice(0,180),n.textContent="已识别网页标题",a.value}catch{const d=Z(r);return a.value||(a.value=d),n.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function Ke(){var n;(n=document.getElementById("search-input"))==null||n.addEventListener("input",r=>{E=r.target.value,k();const l=document.getElementById("search-input");l==null||l.focus(),l==null||l.setSelectionRange(E.length,E.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async l=>{var c,p;const s=l.currentTarget.dataset.action,d=l.currentTarget.dataset.id;if(s==="open")O=d,k();else if(s==="edit-document"){const u=v.reports.find(b=>b.id===d);if(!u||u.access!=="production")return;Oe(u,{render:k,showToast:A})}else if(s==="download-report"){const u=v.reports.find(b=>b.id===d);u&&await _t(u,A)}else if(s==="share-report"){const u=v.reports.find(b=>b.id===d);u&&await Ue(u,A)}else if(s==="back")O="",I=null,k();else if(s==="lock")sessionStorage.removeItem(yt),k();else if(s==="clear-search")E="",k();else if(s==="set-view"){if(!["topic","type","tag"].includes(d))return;S=d,P="",localStorage.setItem(dt,S),k()}else if(s==="cancel-move")P="",k();else if(s==="move-here"){const u=l.currentTarget.dataset.bucketKind||S;P&&K(P,u,d)&&(P="",k(),A(u==="tag"?"已添加目标标签":`报告已移入目标${G()}`))}else if(s==="show-archive")F=!0,E="",O="",k();else if(s==="show-catalog")F=!1,E="",O="",k();else if(s==="add-report")I={type:"report",mode:"create",groupId:((c=v.groups[1])==null?void 0:c.id)||((p=v.groups[0])==null?void 0:p.id)},k();else if(s==="add-to-group")I={type:"report",mode:"create",groupId:d},k();else if(s==="edit")I={type:"report",mode:"edit",reportId:d},k();else if(s==="edit-tags")I={type:"tags",reportId:d},k();else if(s==="close-modal")I=null,k();else if(s==="detect-title")await Lt(l.currentTarget.closest("form"));else if(s==="archive"){const u=v.reports.find(b=>b.id===d);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),L(),k(),A("已归档，可随时恢复")}else if(s==="restore"){const u=v.reports.find(b=>b.id===d);if(!u)return;u.archived=!1,u.archivedAt="",L(),k(),A("报告已恢复到原主题")}else if(s==="delete"){const u=v.reports.find(b=>b.id===d);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(v.reports=v.reports.filter(b=>b.id!==d),O===d&&(O=""),L(),k(),A("报告已永久删除"))}else if(s==="add-group")I={type:"group",mode:"create"},k();else if(s==="rename-group")v.groups.find(b=>b.id===d)&&(I={type:"group",mode:"edit",groupId:d},k());else if(s==="delete-group"){const u=v.groups.find(b=>b.id===d);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(v.reports.forEach(b=>{b.groupId===d&&(b.groupId="inbox")}),v.groups=v.groups.filter(b=>b.id!==d),L(),k(),A("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(r=>{let l=null,s=!1;const d=()=>{var c;C="",l=null,s=!1,(c=r.closest(".report-card"))==null||c.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",c=>{var p,u;c.preventDefault(),C=r.dataset.reportDragId,q="",l={x:c.clientX,y:c.clientY},s=!1,(p=r.setPointerCapture)==null||p.call(r,c.pointerId),(u=r.closest(".report-card"))==null||u.classList.add("is-dragging")}),r.addEventListener("pointermove",c=>{if(!C||l&&Math.hypot(c.clientX-l.x,c.clientY-l.y)<7)return;s=!0;const p=document.elementFromPoint(c.clientX,c.clientY),u=p==null?void 0:p.closest(".report-card"),b=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(f=>{f.classList.toggle("is-card-drop-target",!!(u&&u!==r.closest(".report-card")&&f===u))}),document.querySelectorAll(".group-column").forEach(f=>{f.classList.toggle("is-drop-ready",!!(b&&f===b))})}),r.addEventListener("pointerup",c=>{if(!C)return;const p=C;if(!s){P=p,d(),k(),A(`请选择目标${G()}`);return}const u=document.elementFromPoint(c.clientX,c.clientY),b=u==null?void 0:u.closest(".report-card"),f=u==null?void 0:u.closest(".group-column"),w=(b==null?void 0:b.dataset.reportId)||"",m=(f==null?void 0:f.dataset.bucketId)||"",$=(f==null?void 0:f.dataset.bucketKind)||S,y=w&&w!==p?K(p,$,m,w):m?K(p,$,m):!1;d(),y&&(k(),A($==="tag"?"已添加目标标签":$==="type"?"工作类型已更新":w?"报告顺序已更新":"已移入新主题"))}),r.addEventListener("pointercancel",d)}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const l=()=>{var s;q="",(s=r.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(d=>{d.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",s=>{var d,c;s.preventDefault(),q=r.dataset.groupDragId,C="",(d=r.setPointerCapture)==null||d.call(r,s.pointerId),(c=r.closest(".group-column"))==null||c.classList.add("is-group-dragging")}),r.addEventListener("pointermove",s=>{q&&document.querySelectorAll(".group-column").forEach(d=>{var c;d.classList.toggle("is-group-drop-target",d===((c=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:c.closest(".group-column")))})}),r.addEventListener("pointerup",s=>{var p;if(!q)return;const d=q,c=(p=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:p.closest(".group-column");if(c&&nt(d,c.dataset.groupId)){q="",k(),A("分组顺序已更新");return}l()}),r.addEventListener("pointercancel",l),r.addEventListener("keydown",s=>{var u;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const d=v.groups.findIndex(b=>b.id===r.dataset.groupDragId),c=s.key==="ArrowLeft"?d-1:d+1,p=v.groups[c];!p||!nt(r.dataset.groupDragId,p.id)||(k(),A("分组顺序已更新"),(u=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||u.focus())})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",l=>{l.preventDefault(),r.classList.add(q?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",l=>{if(l.preventDefault(),q){if(r.dataset.bucketKind==="topic"&&nt(q,r.dataset.groupId)){q="",k(),A("分组顺序已更新");return}q="",r.classList.remove("is-group-drop-target");return}const s=v.reports.find(c=>c.id===C),d=r.dataset.bucketKind||S;s&&K(C,d,r.dataset.bucketId)&&(C="",k(),A(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":"已移入新主题")),C=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(r=>{r.addEventListener("click",()=>{const l=document.querySelector('#tag-form input[name="tags"]');if(!l)return;const s=ot(l.value),d=r.dataset.tagSuggestion;l.value=s.includes(d)?s.filter(c=>c!==d).join("、"):[...s,d].slice(0,8).join("、"),r.classList.toggle("selected",!s.includes(d)),l.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",r=>{r.preventDefault();const l=v.reports.find(s=>s.id===I.reportId);l&&(l.tags=ot(new FormData(t).get("tags")),L(),I=null,k(),A("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",r=>{var c,p;r.preventDefault();const l=(c=new FormData(e).get("name"))==null?void 0:c.trim(),s=(p=new FormData(e).get("description"))==null?void 0:p.trim();if(!l)return;if(I.mode==="edit"){const u=v.groups.find(b=>b.id===I.groupId);if(!u)return;u.name=l.slice(0,60),u.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else v.groups.push({id:xt("group"),name:l.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][v.groups.length%4],position:v.groups.length});L();const d=I.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";I=null,k(),A(d)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async r=>{r.preventDefault();const l=a.elements.url.value.trim();if(!Kt(l))return;const s=a.querySelector('button[type="submit"]');s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';let d=a.elements.title.value.trim();d||(d=await Lt(a));const c=a.elements.groupId.value,p=a.elements.workType.value,u=ot(a.elements.tags.value);if(I.mode==="edit"){const b=v.reports.find(f=>f.id===I.reportId);Object.assign(b,{title:d,url:l,groupId:c,workType:p,tags:u})}else{const b={id:xt("report"),groupId:c,title:d||Z(l),url:l,pinned:!1,position:v.reports.filter(f=>f.groupId===c).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:p,tags:u};b.tags.length||(b.tags=kt(b,b.workType)),v.reports.push(b)}L(),I=null,k(),A("报告已保存")});const i=O&&v.reports.find(r=>r.id===O);i&&Re(i)}function We(){k()}We(document.getElementById("app"));
