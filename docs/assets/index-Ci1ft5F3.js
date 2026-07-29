(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();const bt="clair-ai-studio-tasks-v1",he=[{id:"save",name:"保存",hint:"自动识别并进入成果库"},{id:"decision",name:"决策",hint:"发起决策推演"},{id:"review",name:"评审",hint:"自动匹配合适的评审 Skill"}],zt={save:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h11l3 3v12H5z"></path>
      <path d="M8 4.5v5h7v-5M8 19.5v-6h8v6"></path>
    </svg>`,decision:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="6" r="2"></circle>
      <circle cx="18" cy="6" r="2"></circle>
      <circle cx="12" cy="18" r="2"></circle>
      <path d="M7.8 7.2 10.8 16M16.2 7.2 13.2 16M8 6h8"></path>
    </svg>`,review:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h8M9 3h6v3H9zM6 5.5H4.5v15h15v-15H18"></path>
      <path d="m8 13 2.2 2.2L16 9.5"></path>
    </svg>`,upload:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14"></path>
    </svg>`},Q=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let S=vt(),O="";function vt(){return{material:"",files:[]}}function Zt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function fe(t){var n;const e=t.toLowerCase(),a=((n=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,r])=>r.some(l=>e.includes(l))))==null?void 0:n[0])||"solution";return Q.find(r=>r.id===a)||Q[1]}function Gt(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(e):"时间待补"}function be(){return F().filter(t=>!["completed","confirmed","dismissed"].includes(t.status)).sort((t,e)=>new Date(e.updatedAt||e.createdAt||0)-new Date(t.updatedAt||t.createdAt||0))}function yt(t){return t.mode==="decision"?"决策推演":"专业评审"}function _t(t){return t.status==="review"?"待人工确认":t.status==="processing"?"处理中":"待执行"}function ve(t){const e=(t.files||[]).map(i=>`- ${i.name}${i.sizeLabel?`（${i.sizeLabel}）`:""}`).join(`
`);return[`任务类型：${yt(t)}`,`匹配 Skill：${t.skillName||"方案评审"}`,"","任务材料：",t.material||"（无粘贴文字）",e?`
附件：
${e}`:""].filter(Boolean).join(`
`)}function ye(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function N(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const a=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name),n=/\.html?$/i.test(i.name);let r="",l="";if(a&&i.size<=1024*1024)try{const s=await i.text();r=s.slice(0,12e3),n&&(l=s)}catch{r="",l=""}return{id:Zt(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:ye(i.size),excerpt:r,content:l}}))}function we(t){return S.files.length?`<div class="attachment-list">${S.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function ke(t){return he.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${t(e.name)}"
      title="${t(e.name)} · ${t(e.hint)}">
      ${zt[e.id]}
      <span class="intake-action-label">${t(e.name)}</span>
    </button>`).join("")}function $e(t){const e=be();return e.length?`
    <div class="inline-task-progress" aria-label="待处理任务">
      <div class="progress-summary">
        <span class="task-status-dot" aria-hidden="true"></span>
        <div>
          <strong>${e.length} 项任务等待处理</strong>
          <small>任务保存在当前浏览器，不会在后台自动执行</small>
        </div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(i=>{var a;return`
          <button type="button" data-task-action="open-task" data-task-id="${i.id}">
            <span>${t(((a=i.skillName)==null?void 0:a.slice(0,1))||"任")}</span>
            <div>
              <strong>${t(i.title||"未命名任务")}</strong>
              <small>${t(_t(i))} · ${t(Gt(i.updatedAt||i.createdAt))}</small>
            </div>
            <i>→</i>
          </button>`}).join("")}
      </div>
    </div>`:""}function Ae(t,e){const i=t.files||[];return`
    <section class="task-center task-detail inline-task-detail" aria-labelledby="task-detail-title">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果库</button>
      <div class="task-detail-header">
        <div>
          <span class="eyebrow">${e(t.skillName||"方案评审")} · ${e(yt(t))}</span>
          <h1 id="task-detail-title">${e(t.title||"未命名任务")}</h1>
        </div>
        <span class="status-pill">${e(_t(t))}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>处理方式</span><p>${e(yt(t))}</p></section>
          <section><span>匹配能力</span><p>${e(t.skillName||"方案评审")}</p></section>
          <section><span>创建时间</span><p>${e(Gt(t.createdAt))}</p></section>
          <section><span>附件</span><p>${i.length?i.map(a=>e(a.name)).join("、"):"无附件"}</p></section>
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading">
            <div><span class="section-kicker">LOCAL TASK BRIEF</span><h2>待执行任务单</h2></div>
            <small>仅保存在当前浏览器</small>
          </div>
          <article class="task-result-content">
            <div class="task-local-warning">
              <strong>这是一张本地待处理单，不代表任务已在后台运行。</strong>
              <p>复制任务单后可交给 Codex 执行；完成后再把确认结果保存进成果库。</p>
            </div>
            <h3>输入材料</h3>
            <p>${e(t.material||"未粘贴文字材料").replaceAll(`
`,"<br />")}</p>
            ${i.length?`
              <h3>附件记录</h3>
              <ul>${i.map(a=>`<li>${e(a.name)}${a.sizeLabel?` · ${e(a.sizeLabel)}`:""}</li>`).join("")}</ul>`:""}
          </article>
          <div class="task-review-actions">
            <button class="quiet-button" type="button" data-task-action="dismiss-task"
              data-task-id="${t.id}">移出队列</button>
            <button class="primary-button" type="button" data-task-action="copy-task"
              data-task-id="${t.id}">复制任务单</button>
          </div>
        </main>
      </div>
    </section>`}function Ie(t){if(O){const e=F().find(i=>i.id===O);if(e)return Ae(e,t);O=""}return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="输入或粘贴内容"
            placeholder="粘贴链接、文字，或拖入一份材料…">${t(S.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${zt.upload}
              <span class="intake-action-label">材料</span>
            </label>
            ${ke(t)}
          </div>
        </div>
        ${we(t)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
      ${$e(t)}
    </section>`}function Se({render:t,showToast:e,saveToLibrary:i}){document.querySelectorAll("[data-task-action]").forEach(s=>{s.addEventListener("click",async c=>{const d=c.currentTarget.dataset.taskAction;if(d==="remove-file")Y(),S.files=S.files.filter(p=>p.id!==c.currentTarget.dataset.fileId),t();else if(d==="open-task")O=c.currentTarget.dataset.taskId,t();else if(d==="close-task")O="",t();else if(d==="copy-task"){const p=F().find(f=>f.id===c.currentTarget.dataset.taskId);if(!p)return;try{await navigator.clipboard.writeText(ve(p)),e("任务单已复制，可交给 Codex 执行")}catch{e("复制失败，请手动选择任务内容")}}else if(d==="dismiss-task"){const p=F(),f=p.find(u=>u.id===c.currentTarget.dataset.taskId);if(!f)return;f.status="dismissed",f.updatedAt=new Date().toISOString(),localStorage.setItem(bt,JSON.stringify(p)),O="",t(),e("已移出待处理队列")}})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",async s=>{var L,m;if(s.preventDefault(),Y(),!S.material.trim()&&!S.files.length){e("先粘贴内容，或加入一份材料"),(L=document.getElementById("task-goal"))==null||L.focus();return}const c=((m=s.submitter)==null?void 0:m.dataset.submitAction)||"save",d=s.submitter,p={material:S.material.trim(),files:S.files};if(c==="save"){const v=a.querySelector("#intake-save-status"),k=[...a.querySelectorAll("button, textarea, input")],C=q=>{k.forEach(ge=>{ge.disabled=!0}),a.setAttribute("aria-busy","true"),a.classList.add("is-saving"),v.hidden=!1,v.querySelector("strong").textContent=q,d.setAttribute("aria-label","保存中"),d.innerHTML='<span class="mini-spinner"></span>'};C("正在检查成果库与页面访问状态…");try{const q=await i(p,C);if(q.rejected){t(),e(q.reason);return}if(q.duplicate){t(),e(`成果库已有“${q.title}” · 位于“${q.groupName}”，未重复保存`);return}S=vt(),t(),e(`已保存到“${q.groupName}” · ${q.workTypeName} · 标签：${q.tags.join(" / ")||"待补标签"}`)}catch{k.forEach(q=>{q.disabled=!1}),t(),e("保存失败，请稍后重试")}return}d.disabled=!0;const f=fe([p.material,...p.files.map(v=>`${v.name}
${v.excerpt}`)].join(`
`)),u=c==="decision"?Q.find(v=>v.id==="decision"):f.id==="decision"?Q.find(v=>v.id==="solution"):f,h=new Date().toISOString(),A=F();A.push({id:Zt(),title:Te(p),mode:c,skillId:u.id,skillName:u.name,material:p.material,files:p.files,status:"queued",createdAt:h,updatedAt:h}),localStorage.setItem(bt,JSON.stringify(A)),S=vt(),t(),e(`已加入待处理队列 · ${u.name} · 当前不会自动执行`)});const n=document.getElementById("task-files");n==null||n.addEventListener("change",async s=>{Y(),S.files.push(...await N(s.target.files)),t(),e(`已加入 ${s.target.files.length} 个文件`)});const r=document.querySelector(".prompt-composer");r==null||r.addEventListener("dragover",s=>{s.preventDefault(),r.classList.add("drag-over")}),r==null||r.addEventListener("dragleave",()=>r.classList.remove("drag-over")),r==null||r.addEventListener("drop",async s=>{s.preventDefault(),s.stopPropagation(),r.classList.remove("drag-over"),Y();const c=s.dataTransfer.files;S.files.push(...await N(c)),t(),e(`已加入 ${c.length} 个文件`)});const l=document.getElementById("task-goal");requestAnimationFrame(()=>Dt(l)),l==null||l.addEventListener("input",()=>{S.material=l.value,Dt(l)}),l==null||l.addEventListener("paste",async s=>{var u;const c=[...((u=s.clipboardData)==null?void 0:u.items)||[]].filter(h=>h.kind==="file").map(h=>h.getAsFile()).filter(Boolean);if(!c.length)return;s.preventDefault();const d=s.clipboardData.getData("text/plain"),p=l.selectionStart??l.value.length,f=l.selectionEnd??p;S.material=`${l.value.slice(0,p)}${d}${l.value.slice(f)}`,S.files.push(...await N(c)),t(),e(`已从剪贴板加入 ${c.length} 个材料`)}),Ee({render:t,showToast:e})}function F(){try{const t=JSON.parse(localStorage.getItem(bt));return Array.isArray(t)?t:[]}catch{return[]}}function Te(t){var i;return(t.material.split(/\n/).map(a=>a.trim()).find(Boolean)||((i=t.files[0])==null?void 0:i.name)||"未命名任务").replace(/[。；;！!？?]+$/,"").slice(0,64)}function Y(){const t=document.getElementById("task-goal");t&&(S.material=t.value)}function Dt(t){if(!t)return;t.style.height="auto";const e=Math.min(Math.max(t.scrollHeight,40),180);t.style.height=`${e}px`,t.style.overflowY=t.scrollHeight>180?"auto":"hidden"}function Mt(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function Le(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function Ee({render:t,showToast:e}){document.onpaste=async i=>{var l,s;if(Le(i.target)||!document.querySelector(".prompt-composer"))return;const n=[...((l=i.clipboardData)==null?void 0:l.items)||[]].filter(c=>c.kind==="file").map(c=>c.getAsFile()).filter(Boolean),r=((s=i.clipboardData)==null?void 0:s.getData("text/plain"))||"";!n.length&&!r.trim()||(i.preventDefault(),S.material=[S.material.trim(),r.trim()].filter(Boolean).join(`

`),n.length&&S.files.push(...await N(n)),t(),requestAnimationFrame(Mt),e(n.length?`已从剪贴板加入 ${n.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=i=>{var a;[...((a=i.dataTransfer)==null?void 0:a.types)||[]].includes("Files")&&i.preventDefault()},document.ondrop=async i=>{var n,r,l;if((r=(n=i.target)==null?void 0:n.closest)!=null&&r.call(n,".prompt-composer"))return;const a=((l=i.dataTransfer)==null?void 0:l.files)||[];a.length&&(i.preventDefault(),S.files.push(...await N(a)),t(),requestAnimationFrame(Mt),e(`已拖入 ${a.length} 个文件`))}}const rt="clair-report-editor-v1",qe="https://api.github.com",Kt="2026",xe="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null},tt=new Map;let Rt=!1;function It(t){return[...new Set(t.filter(Boolean))]}function wt(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function St(t){return`${xe}${t}`}function Ce(t){try{const e=sessionStorage.getItem(St(t));if(!e)return null;const i=JSON.parse(e);return!(i!=null&&i.html)||typeof i.html!="string"?null:i}catch{return null}}function Tt(t=o.reportId){try{sessionStorage.removeItem(St(t))}catch{}}function Yt(){return o.dirty&&o.hasDraft?{tone:"changed",label:o.isLocal?"有新修订 · 上次暂存待保存":"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:o.isLocal?"已暂存 · 待保存成果库":"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:o.isLocal?"成果库 HTML 已更新":"生产档案已更新"}:{tone:"clean",label:"未修改"}}function B(){const t=Yt(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const i=document.querySelector('[data-editor-action="stash"]');if(i){i.disabled=o.status!=="ready"||o.saving||!o.dirty;const r=!o.dirty&&o.hasDraft?"已暂存":"暂存修改";i.setAttribute("aria-label",r),i.title=r}const a=document.querySelector('[data-editor-action="publish"]');if(a){a.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft;const r=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";a.setAttribute("aria-label",r),a.title=r,a.classList.toggle("is-saving",o.saving)}const n=document.querySelector('[data-editor-action="preview"]');n&&(n.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function De(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Me(t){const e=atob(String(t||"").replace(/\s/g,"")),i=Uint8Array.from(e,a=>a.charCodeAt(0));return new TextDecoder().decode(i)}function Re(t){const e=new TextEncoder().encode(t);let i="";const a=32768;for(let n=0;n<e.length;n+=a)i+=String.fromCharCode(...e.subarray(n,n+a));return btoa(i)}function pt(t){let e="";for(let a=0;a<t.length;a+=32768)e+=String.fromCharCode(...t.subarray(a,a+32768));return btoa(e)}function mt(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Vt(t,e){const i=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function Pt(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const i=JSON.parse(e[1]),a=mt(i.salt),n=mt(i.iv),r=await Vt(Kt,a),l=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},r,mt(i.data)),s=new TextDecoder().decode(l);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function Lt(t){var l;if(((l=o.protection)==null?void 0:l.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await Vt(Kt,e),n=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,new TextEncoder().encode(t)),r=JSON.stringify({salt:pt(e),iv:pt(i),data:pt(new Uint8Array(n))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,r)}function Pe(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const i=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),a=i.shift()||"ClairKu.github.io";let n=i.join("/");(!n||e.pathname.endsWith("/"))&&(n=`${n?`${n}/`:""}index.html`);const r=It([`docs/${n}`,n,`public/${n}`]);return{owner:"ClairKu",repository:a,branch:"main",path:r[0],candidates:r,source:"auto"}}catch{return null}}async function et(t,{token:e="",method:i="GET",body:a}={}){var l;const n={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(n.Authorization=`Bearer ${e}`),a!==void 0&&(n["Content-Type"]="application/json");const r=await fetch(`${qe}${t}`,{method:i,headers:n,body:a===void 0?void 0:JSON.stringify(a)});if(!r.ok){let s="";try{s=((l=await r.json())==null?void 0:l.message)||""}catch{s=await r.text()}const c=new Error(s||`GitHub API ${r.status}`);throw c.status=r.status,c}return r.status===204?null:r.json()}async function Oe(t){var l;const e=await et(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const i=It((l=t.candidates)!=null&&l.length?t.candidates:[t.path]);let a=null,n=null;const r=[];for(const s of i)try{const c=s.split("/").map(encodeURIComponent).join("/"),d=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${c}?ref=${encodeURIComponent(t.branch)}`,p=await et(d);let f="";if(p.encoding==="base64"&&p.content)f=Me(p.content);else if(p.download_url){const u=await fetch(p.download_url,{cache:"no-store"});if(!u.ok)throw new Error("无法读取 GitHub 原始文件");f=await u.text()}if(!f)throw new Error("GitHub 文件内容为空");n?f===n.html&&r.push({path:s,sha:p.sha}):n={html:f,target:{...t,path:s,sha:p.sha,candidates:i}}}catch(c){if(a=c,c.status&&![403,404].includes(c.status))break}if(n)return n.target.mirrors=r,n;throw a||new Error("没有找到对应的 GitHub HTML 文件")}function Be(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{/^on/i.test(a.name)&&(e.setAttribute(`data-clair-event-${a.name.toLowerCase()}`,a.value),e.removeAttribute(a.name))});const i=e.getAttribute("href");i&&/^\s*javascript:/i.test(i)&&(e.dataset.clairJavascriptHref=i,e.removeAttribute("href"))})}function He(){return`
(() => {
  const channel = ${JSON.stringify(rt)};
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
`}function Ue(t,e){const a=new DOMParser().parseFromString(t,"text/html");a.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),Be(a);const n=a.createElement("base");n.href=e,n.dataset.clairEditorBase="true",a.head.prepend(n);const r=a.createElement("style");r.id="clair-editor-style",r.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,a.head.append(r);const l=a.createElement("script");return l.id="clair-editor-bridge",l.textContent=He(),a.body.append(l),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function Wt(t){if(t.url)return"";if(t.savedHtml)return t.savedHtml;const e=(t.savedFiles||[]).find(i=>/\.html?$/i.test(i.name||""));return e!=null&&e.content||e!=null&&e.excerpt?e.content||e.excerpt:/<!doctype\s+html|<html[\s>]/i.test(t.savedContent||"")?t.savedContent.trim():""}async function Jt(t){var e;try{const i=Wt(t),a=i?null:Pe(t.url);let n=null;if(i)n={html:i,target:null};else if(a)try{n=await Oe(a)}catch{}if(!n&&t.url){const c=await fetch(t.url,{cache:"no-store"});if(!c.ok)throw new Error(`报告读取失败（HTTP ${c.status}）`);n={html:await c.text(),target:a}}const r=await Pt(n.html);o.protection=r.protection,o.target=n.target||a;let l=r.html;const s=Ce(t.id);if(s!=null&&s.html)try{const c=await Pt(s.html);l=c.html,o.hasDraft=!0,o.draftHtml=c.html,o.draftAt=s.savedAt||"",s.baseFiles&&o.target&&(o.target.baseFiles=s.baseFiles)}catch{Tt(t.id)}o.html=l,o.editorDocument=Ue(l,t.url||window.location.href),o.status="ready",o.error=""}catch(i){o.status="error",o.error=(i==null?void 0:i.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function Xt(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:t,showToast:e})}function Et(){return document.querySelector(".report-editor-frame")}function gt(t,e=null){var a;const i=Et();(a=i==null?void 0:i.contentWindow)==null||a.postMessage({channel:rt,type:"command",command:t,value:e},"*")}function ot(){var i;const t=Et();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((a,n)=>{const r=window.setTimeout(()=>{tt.delete(e),n(new Error("读取编辑内容超时"))},1e4);tt.set(e,{resolve:l=>{clearTimeout(r),a(l)}}),t.contentWindow.postMessage({channel:rt,type:"serialize",requestId:e},"*")})}function Ne(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Qt(t,e){const i=new Blob([t],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(i),n=document.createElement("a");n.href=a,n.download=Ne(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function te(t){await navigator.clipboard.writeText(t)}function Fe(t,e){var n;const i=new DOMParser().parseFromString(t,"text/html");(n=i.querySelector("base[data-clair-preview-base]"))==null||n.remove();const a=i.createElement("base");return a.href=e,a.dataset.clairPreviewBase="true",i.head.prepend(a),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}function je(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([Fe(o.draftHtml,t.url||window.location.href)],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(e),a=window.open(i,"_blank");if(!a)throw URL.revokeObjectURL(i),new Error("浏览器拦截了新窗口，请允许弹窗后重试");a.opener=null,window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}async function at(t,{silent:e=!1}={}){var r;const i=await ot(),a=await Lt(i),n=new Date().toISOString();try{sessionStorage.setItem(St(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:n,baseFiles:wt(),html:a}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=i,o.draftHtml=i,o.draftAt=n,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",B(),e||(r=o.showToast)==null||r.call(o,o.isLocal?"已暂存在当前浏览器会话，尚未写回成果库":"已暂存在当前浏览器会话，尚未更新 GitHub"),i}async function ze(t){var e,i;if(!(o.saving||!o.saveLocal)){o.saving=!0,B();try{const a=o.dirty?await at(t,{silent:!0}):o.draftHtml||await ot();await o.saveLocal(a),o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit="local",Tt(t.id),(e=o.showToast)==null||e.call(o,"已更新成果库中的 HTML")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,B()}}}async function Ze(t){var s,c;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const i=await Lt(t),a=(e.mirrors||[]).map(d=>d.path),n=It([...a.filter(d=>d.startsWith("public/")),...a.filter(d=>!d.startsWith("public/")&&d!==e.path),e.path]);let r="";const l=[];for(const d of n)try{const p=d.split("/").map(encodeURIComponent).join("/"),f=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${p}`,u=await et(`${f}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),h=wt(e)[d];if(h&&u.sha!==h)throw new Error(`生产文件 ${d} 已在本次编辑后更新，请重新打开报告合并修改`);const A=await et(f,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:Re(i),sha:u.sha,branch:e.branch}});r=((s=A==null?void 0:A.commit)==null?void 0:s.sha)||r,e.baseFiles={...wt(e),[d]:((c=A==null?void 0:A.content)==null?void 0:c.sha)||u.sha},l.push(d)}catch(p){throw l.length?new Error(`已更新 ${l.join("、")}，但 ${d} 同步失败：${p.message}`):p}return{commit:r,files:l.length}}async function Ot(t){var e,i;if(!o.saving){o.saving=!0,B();try{const a=o.dirty?await at(t,{silent:!0}):o.draftHtml||await ot(),n=await Ze(a);o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=n.commit,Tt(t.id),(e=o.showToast)==null||e.call(o,n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,B()}}}function Ge(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
    </div>`}function _e(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
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
    </div>`}function Bt({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const i=e.querySelector("#editor-settings-form"),a=o.target||{};if(i){i.elements.owner.value=a.owner||"ClairKu",i.elements.repository.value=a.repository||"",i.elements.branch.value=a.branch||"main",i.elements.path.value=a.path||"";const n=i.querySelector('button[type="submit"]');n&&(n.textContent=t?"连接并保存":"保存设置")}}function V(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function Ke(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function W(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function ee(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function Ht(t,{render:e,showToast:i,saveLocal:a=null}){Xt(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:i,isLocal:!!(Wt(t)&&a),saveLocal:a}),e(),o.loadPromise=Jt(t)}function Ye(t,e){var d;const i=o.isLocal?"本地成果 · 保存在当前浏览器":o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(d=o.target.mirrors)!=null&&d.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",a=Yt(),n=o.status==="ready"?`
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
      </div>`:"",r=o.status==="loading"?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${o.isLocal?"修改后可保存回成果库，也可下载 HTML。":"会自动识别对应 GitHub 仓库与源文件。"}</p></div>`:o.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(o.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${De(o.editorDocument)}"></iframe></div>`,l=p=>({back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>',stash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>',preview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>',publish:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>'})[p],s=!o.dirty&&o.hasDraft?"已暂存":"暂存修改",c=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";return`
    <main class="reader-shell report-editor-shell compact-editor-shell">
      <header class="reader-header editor-header compact-reader-header compact-editor-header">
        <button class="reader-icon-button back-button" type="button" data-editor-action="exit"
          aria-label="退出编辑" title="退出编辑">${l("back")}</button>
        <div class="reader-title">
          <strong>${e(t.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${a.tone}">${e(a.label)}</span>
            <span class="editor-target-label" title="${e(i)}">${e(i)}</span>
          </div>
        </div>
        <div class="reader-actions editor-actions compact-reader-actions compact-editor-actions" aria-label="编辑操作">
          ${o.isLocal?"":`
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${l("settings")}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${s}" title="${s}"
            ${o.status!=="ready"||o.saving||!o.dirty?"disabled":""}>${l("stash")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${o.status!=="ready"||!o.hasDraft?"disabled":""}>${l("preview")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${l("download")}</button>
          ${t.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${l("copy")}</button>`:""}
          <button class="reader-icon-button publish-icon-action${o.saving?" is-saving":""}" type="button"
            data-editor-action="publish" aria-label="${c}" title="${c}"
            ${o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft?"disabled":""}>${l("publish")}</button>
        </div>
      </header>
      ${n}
      ${r}
      ${Ge(e)}
      ${_e(e)}
    </main>`}function Ve(t){if(!ee(t.id))return;Rt||(Rt=!0,window.addEventListener("message",a=>{var r;const n=Et();if(!(!(n!=null&&n.contentWindow)||a.source!==n.contentWindow)&&((r=a.data)==null?void 0:r.channel)===rt){if(a.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",B()),a.data.type==="serialized"){const l=tt.get(a.data.requestId);if(!l)return;tt.delete(a.data.requestId),l.resolve(a.data.html)}a.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(l=>{const s=l.dataset.editorCommand;["bold","italic","underline"].includes(s)&&l.classList.toggle("active",!!a.data[s])})}}),window.addEventListener("beforeunload",a=>{!o.reportId||!o.dirty||(a.preventDefault(),a.returnValue="")}),window.addEventListener("keydown",a=>{a.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?W():o.settingsOpen&&V())})),document.querySelectorAll("[data-editor-command]").forEach(a=>{a.addEventListener("mousedown",n=>n.preventDefault()),a.addEventListener("click",()=>gt(a.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{gt("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(a=>{a.addEventListener("click",async()=>{var r,l,s,c,d,p,f,u,h,A,L,m;const n=a.dataset.editorAction;if(n==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const v=o.render;Xt(),v==null||v()}else if(n==="settings")Bt();else if(n==="close-settings")V();else if(n==="stash")try{await at(t)}catch(v){(r=o.showToast)==null||r.call(o,(v==null?void 0:v.message)||"暂存失败，请下载 HTML 备份")}else if(n==="preview")try{je(t),(l=o.showToast)==null||l.call(o,"已在新窗口打开暂存修订")}catch(v){(s=o.showToast)==null||s.call(o,(v==null?void 0:v.message)||"无法打开预览")}else if(n==="publish")try{if(o.isLocal){await ze(t);return}if(o.dirty&&await at(t,{silent:!0}),!o.hasDraft){(c=o.showToast)==null||c.call(o,"当前没有待推送的修订");return}Ke()}catch(v){(d=o.showToast)==null||d.call(o,(v==null?void 0:v.message)||"暂存失败，请下载 HTML 备份")}else if(n==="close-publish")W();else if(n==="confirm-publish")W(),!o.token||!((p=o.target)!=null&&p.path)?Bt({pendingSave:!0}):await Ot(t);else if(n==="download")try{const v=await ot();Qt(await Lt(v),t.title),(f=o.showToast)==null||f.call(o,"HTML 已下载")}catch(v){(u=o.showToast)==null||u.call(o,(v==null?void 0:v.message)||"下载失败")}else if(n==="download-published")await ae(t,o.showToast);else if(n==="share")try{await te(t.url),(h=o.showToast)==null||h.call(o,"报告链接已复制")}catch{(A=o.showToast)==null||A.call(o,"复制失败，请从地址栏复制")}else if(n==="link"){const v=prompt("输入链接地址（https://…）");if(!v)return;try{const k=new URL(v);if(!["http:","https:","mailto:"].includes(k.protocol))throw new Error;gt("createLink",k.href)}catch{(L=o.showToast)==null||L.call(o,"请输入有效的 http、https 或 mailto 链接")}}else n==="retry"&&(o.status="loading",o.error="",(m=o.render)==null||m.call(o),o.loadPromise||(o.loadPromise=Jt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(a=>{a.addEventListener("click",n=>{n.target===a&&(a.classList.contains("editor-settings-backdrop")?V():W())})});const i=document.getElementById("editor-settings-form");i==null||i.addEventListener("submit",async a=>{var d,p,f;a.preventDefault();const n=new FormData(i),r=String(n.get("github-token-not-password")||"").trim();r&&(o.token=r);const l=String(n.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(n.get("owner")||"").trim(),repository:String(n.get("repository")||"").trim(),branch:String(n.get("branch")||"main").trim(),path:l,mirrors:l===((d=o.target)==null?void 0:d.path)?((p=o.target)==null?void 0:p.mirrors)||[]:[],source:"manual"};const s=o.pendingSave;V();const c=document.querySelector(".editor-target-label");if(c){const u=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;c.textContent=u,c.title=u}(f=o.showToast)==null||f.call(o,"保存权限已连接"),s&&await Ot(t)})}async function ae(t,e){try{const i=await fetch(t.url,{cache:"no-store"});if(!i.ok)throw new Error;Qt(await i.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function We(t,e){try{await te(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const Je={production:"生产 直达 public",org:"组织 登录 restricted",account:"账号 登录 restricted"};function st(t=""){return String(t).normalize("NFKC").toLocaleLowerCase("zh-CN").normalize("NFD").replace(new RegExp("\\p{Diacritic}","gu"),"").replace(/\s+/g," ").trim()}function Xe(t=""){return st(t).split(" ").filter(Boolean)}function ie(t,e,{group:i={},workTypeName:a=""}={}){const n=Xe(e);if(!n.length)return!0;const r=st([t.title,t.source,t.url,t.access,Je[t.access],a,...t.tags||[],i.name,i.description].filter(Boolean).join(" "));return n.every(l=>r.includes(l))}const qt="clair-service-report-workbench-v1",xt="clair-service-report-workbench-access",z="clair-service-report-workbench-view",P=8,ct=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],X=["手动保存","生产","个人","HTML","本体","飞书","调研","产品规划","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],H={version:P,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"workbench-quality-audit-2026-07-30",groupId:"ai-workbench",title:"Clair's Studio｜全站质量审计与修复报告",url:"https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/",preview:"workbench-quality-audit-2026-07-30.svg",pinned:!0,position:0,createdAt:"2026-07-29T18:20:00.000Z",source:"生产质量审计",access:"production"},{id:"yingmi-ai-materials-compendium-2026-07-30",groupId:"ai-platform",title:"盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T06:30:00.000Z",source:"飞书根材料与 40 个档案节点",access:"production"},{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!0,position:5,createdAt:"2026-07-30T08:00:00.000Z",source:"OAP 管理层汇报成稿",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-productization-roadshow-2026-07-30",groupId:"reporting",title:"AI 产品化实践路演｜CEO / CTO",url:"https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T00:00:00.000Z",source:"CEO / CTO 路演材料",access:"production"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},kt={"workbench-quality-audit-2026-07-30":"governance-review","yingmi-ai-materials-compendium-2026-07-30":"reporting","seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-productization-roadshow-2026-07-30":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},ne={"yingmi-ai-materials-compendium-2026-07-30":"ai-platform","qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function lt(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|Studio|工作台|原型/i.test(e)?"product-demo":"product-planning"}function Z(t,e=lt(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`,a=[],n=r=>{a.includes(r)||a.push(r)};return t.manualSaved&&n("手动保存"),t.isProduction&&n("生产"),t.isPersonal&&n("个人"),t.isHtml&&n("HTML"),/ontology\.yingmi-inc\.com|本体/.test(i)&&n("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&n("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&n("调研"),e==="product-planning"&&n("产品规划"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&n("AI 小顾"),(/studio|workbench|工作台|skill-audit/i.test(i)||t.groupId==="ai-workbench")&&n("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&n("AI 开放平台"),/且慢|qieman/.test(i)&&n("且慢"),/投顾|advisor|财务规划/.test(i)&&n("投顾服务"),/OAP|oap-/.test(i)&&n("OAP"),/MCP|mcp-/.test(i)&&n("MCP"),/Skills|skill-/.test(i)&&n("Skills"),(e==="investment-research"||t.groupId==="research")&&n("投研"),e==="data-analysis"&&n("数据分析"),e==="requirement-review"&&n("需求评审"),e==="reporting"&&n("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&n("知识治理"),a.slice(0,5)}function Qe(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/Studio|工作台|生产力|Copilot|编辑器/i.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":{"requirement-review":"product-planning","competitive-research":"product-planning",reporting:"reporting","data-analysis":"reporting","investment-research":"research","governance-review":"knowledge","product-demo":"ai-workbench","product-planning":"product-planning"}[t.workType]||"inbox"}H.reports=H.reports.map(t=>{const e=ne[t.id]||t.groupId,i=kt[t.id]||lt(t),a={...t,groupId:e,workType:i};return{...a,tags:Z(a,i)}});let b=ta(),T="",M="",G=!1,w=["topic","type","tag","time"].includes(localStorage.getItem(z))?localStorage.getItem(z):"topic",D="",x="",R="",$=null,Ut=0;function re(t){return JSON.parse(JSON.stringify(t))}function j(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function ta(){try{const t=JSON.parse(localStorage.getItem(qt));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return ea(t)}catch{}return re(H)}function ea(t){const e=re(H),i=new Set(e.groups.map(m=>m.id)),a=new Set(["inbox","today","product","research"]),n=new Map(t.groups.map(m=>[m.id,m])),r=e.groups.map(m=>{const v=n.get(m.id);return!v||t.version<P?m:{...m,name:v.name||m.name,description:v.description||m.description,position:Number.isFinite(v.position)?v.position:m.position}});t.groups.filter(m=>!i.has(m.id)&&!a.has(m.id)).forEach((m,v)=>{r.push({...m,description:m.description||"自定义工作分组",position:Number.isFinite(m.position)?m.position:H.groups.length+v})});const l=r.filter((m,v,k)=>k.findIndex(C=>C.id===m.id)===v);l.sort((m,v)=>(m.position||0)-(v.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},c={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},d=t.reports.map(m=>({...m,groupId:ne[m.id]||s[m.id]||c[m.groupId]||m.groupId||"inbox",workType:m.workType||kt[m.id]||lt(m),tags:Array.isArray(m.tags)&&m.tags.length?m.tags:Z(m,m.workType||kt[m.id])})),p=new Map(d.map(m=>[m.id,m])),f=new Map(d.map(m=>[j(m.url),m])),u=new Set,h=new Set,A=e.reports.map(m=>{const v=j(m.url);u.add(v),h.add(m.id);const k=p.get(m.id)||f.get(v);return k?{...m,title:t.version>=P&&k.title||m.title,groupId:t.version>=P&&l.some(C=>C.id===k.groupId)?k.groupId:m.groupId,workType:t.version>=P&&k.workType?k.workType:m.workType,tags:t.version>=P&&Array.isArray(k.tags)&&k.tags.length?k.tags:m.tags,pinned:!!k.pinned,position:Number.isFinite(k.position)?k.position:m.position,archived:!!k.archived,archivedAt:k.archivedAt||""}:m});d.forEach(m=>{const v=j(m.url);h.has(m.id)||v&&u.has(v)||(h.add(m.id),v&&u.add(v),A.push(m))});const L={version:P,groups:l,reports:A};return localStorage.setItem(qt,JSON.stringify(L)),L}function E(){b.version=P,b.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(qt,JSON.stringify(b))}function aa(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(ut)||""}function ia(t,e,i){var l,s,c;const n=(s=(l=dt(t,e).match(/<title[^>]*>([\s\S]*?)<\/title>/i))==null?void 0:l[1])==null?void 0:s.replace(/\s+/g," ").trim();if(n)return n.slice(0,100);const r=String(t).split(/\n/).map(d=>d.trim().replace(/^#+\s*/,"")).find(d=>d&&!/^https?:\/\//i.test(d));return r?r.replace(/[。；;！!？?]+$/,"").slice(0,100):(c=e[0])!=null&&c.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):i?K(i):"未命名成果"}function Nt(t=""){return String(t).trim().replace(/\s+/g," ").toLocaleLowerCase()}function Ft(t=[]){return t.map(e=>`${String(e.name||"").trim().toLocaleLowerCase()}:${e.size||0}:${e.type||""}`).sort().join("|")}function oe({material:t,files:e,url:i,excludeId:a=""}){const n=i?j(i):"",r=Nt(t),l=Ft(e);return b.reports.find(s=>s.id===a?!1:n&&j(s.url)===n||r&&Nt(s.savedContent)===r?!0:!r&&!!l&&Ft(s.savedFiles)===l)||null}function se(t=""){var e;try{const i=new URL(t),a=i.hostname.toLowerCase(),n=(e=i.pathname.split("/").filter(Boolean)[0])==null?void 0:e.toLowerCase();return a==="clairku.github.io"||(a==="github.com"||a==="raw.githubusercontent.com")&&n==="clairku"}catch{return!1}}function na(t=""){try{return/\.html?$/i.test(new URL(t).pathname)}catch{return!1}}function dt(t="",e=[]){if(/<!doctype\s+html|<html[\s>]/i.test(t))return t.trim();const i=e.find(a=>/\.html?$/i.test(a.name));return(i==null?void 0:i.content)||(i==null?void 0:i.excerpt)||""}function ce(t=""){try{const e=new URL(t).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(e))return{access:"org",provider:"飞书组织帐号"};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(e))return{access:"account",provider:"腾讯文档帐号"};if(/(^|\.)yingmi-inc\.com$/.test(e))return{access:"org",provider:"盈米组织帐号"};if(e==="github.com"&&/^\/login(?:\/|$)/.test(new URL(t).pathname))return{access:"account",provider:"GitHub 帐号"}}catch{return null}return null}async function le(t){var i,a;if(!ut(t))return{title:"",description:"",reachable:!1,checked:!0};const e=new URL(t);if(e.origin!==window.location.origin)return{title:"",description:"",reachable:!1,checked:!1};try{const n=await fetch(e.href,{headers:{Accept:"text/html"},signal:AbortSignal.timeout(1e4)});if(!n.ok)return{title:"",description:"",reachable:!1,checked:!0};const r=await n.text(),l=new DOMParser().parseFromString(r,"text/html");return{title:l.title.trim().slice(0,180),description:((a=(i=l.querySelector('meta[name="description"]'))==null?void 0:i.getAttribute("content"))==null?void 0:a.trim().slice(0,500))||"",reachable:!0,checked:!0}}catch{return{title:"",description:"",reachable:!1,checked:!1}}}async function de({material:t="",files:e=[],url:i=""},a=()=>{}){const n=dt(t,e),r=e.some(c=>/\.html?$/i.test(c.name));if(!i)return n?{allowed:!0,access:"local",metadata:{title:"",description:"",reachable:!0,checked:!0},isHtml:!0,savedHtml:n,loginProvider:""}:{allowed:!1,reason:r?"HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML":"只能保存可正常访问的网址或 HTML 内容"};const l=ce(i);a(l?"正在识别权限页面与登录入口…":"正在检查页面是否可正常访问…");const s=l?{title:"",description:"",reachable:!0,checked:!0}:await le(i);return!l&&s.checked&&!s.reachable?{allowed:!1,reason:"页面无法正常访问，且不是可读取的 HTML，未保存"}:{allowed:!0,access:(l==null?void 0:l.access)||"production",metadata:s,isHtml:na(i),savedHtml:"",loginProvider:(l==null?void 0:l.provider)||""}}async function ra({material:t,files:e},i=()=>{}){var p,f;const a=aa(t);i("正在检查成果库是否已有相同内容…");const n=oe({material:t,files:e,url:a});if(n)return{...n,duplicate:!0,groupName:((p=b.groups.find(u=>u.id===n.groupId))==null?void 0:p.name)||"待整理",workTypeName:it(n.workType)};const r=await de({material:t,files:e,url:a},i);if(!r.allowed)return{rejected:!0,duplicate:!1,reason:r.reason};const l=ia(t,e,a),s=r.metadata;i("正在识别标题、分组、类型与标签…");const c=new Date().toISOString(),d={id:At("report"),groupId:"inbox",title:s.title||l,url:a,pinned:!1,position:0,createdAt:c,source:a?"快捷保存":"本地保存",access:r.access,archived:!1,archivedAt:"",savedContent:t,savedFiles:e,detectedDescription:s.description,manualSaved:!0,isProduction:r.access==="production",isPersonal:se(a),isHtml:r.isHtml,savedHtml:r.savedHtml,loginProvider:r.loginProvider};d.workType=lt(d),d.groupId=Qe(d),d.tags=Z(d,d.workType),i("正在保存到成果库…"),d.position=b.reports.filter(u=>!u.archived&&u.groupId===d.groupId).length,b.reports.push(d);try{E()}catch{return b.reports.pop(),{rejected:!0,duplicate:!1,reason:"HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试"}}return G=!1,w!=="time"&&(w="topic"),T="",localStorage.setItem(z,w),{...d,duplicate:!1,groupName:((f=b.groups.find(u=>u.id===d.groupId))==null?void 0:f.name)||"待整理",workTypeName:it(d.workType)}}function ht(t,e){const i=b.groups.findIndex(r=>r.id===t),a=b.groups.findIndex(r=>r.id===e);if(i<0||a<0||i===a)return!1;const[n]=b.groups.splice(i,1);return b.groups.splice(a,0,n),E(),!0}function oa(t,e,i=""){const a=b.reports.find(s=>s.id===t);if(!a||a.archived||!b.groups.find(s=>s.id===e))return!1;const r=b.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,c)=>(s.position||0)-(c.position||0)),l=i?r.findIndex(s=>s.id===i):r.length;return a.groupId=e,r.splice(l<0?r.length:l,0,a),r.forEach((s,c)=>{s.position=c}),E(),!0}function it(t){var e;return((e=ct.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function jt(t){const e=new Date(t.createdAt||0).getTime();return Number.isFinite(e)?e:0}function $t(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?[e.getFullYear(),String(e.getMonth()+1).padStart(2,"0"),String(e.getDate()).padStart(2,"0")].join("-"):"unknown"}function sa(t){if(t==="unknown")return"时间待补";const[e,i,a]=t.split("-").map(Number),n=new Date(e,i-1,a),r=new Date,l=$t(r),s=new Date(r.getFullYear(),r.getMonth(),r.getDate()-1),c=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(n);return t===l?`今天 · ${c}`:t===$t(s)?`昨天 · ${c}`:e===r.getFullYear()?c:`${e}年 · ${c}`}function ca(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?`新增于 ${new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}`:"新增时间待补"}function la(t,e=""){const i=a=>!e||st(a).includes(e);if(w==="time"){const a=new Map;return[...t].sort((n,r)=>jt(r)-jt(n)).forEach(n=>{const r=$t(n.createdAt);a.has(r)||a.set(r,[]),a.get(r).push(n)}),[...a.entries()].map(([n,r])=>({id:n,name:sa(n),kind:"time",accent:"slate",reports:r}))}if(w==="type")return ct.map(a=>({id:a.id,name:a.name,kind:"type",accent:"blue",reports:t.filter(n=>n.workType===a.id).sort((n,r)=>+!!r.pinned-+!!n.pinned||new Date(r.createdAt)-new Date(n.createdAt))})).filter(a=>!e||a.reports.length||i(a.name));if(w==="tag"){const a=new Set(X);return b.reports.forEach(r=>{(r.tags||[]).forEach(l=>a.add(l))}),[...a].sort((r,l)=>{const s=X.indexOf(r),c=X.indexOf(l);return s>=0||c>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(c<0?Number.MAX_SAFE_INTEGER:c):r.localeCompare(l,"zh-CN")}).map(r=>({id:r,name:r,kind:"tag",accent:"violet",reports:t.filter(l=>(l.tags||[]).includes(r)).sort((l,s)=>+!!s.pinned-+!!l.pinned||new Date(s.createdAt)-new Date(l.createdAt))})).filter(r=>r.reports.length&&(!e||i(r.name)||r.reports.length))}return b.groups.map(a=>({...a,kind:"topic",reports:t.filter(n=>n.groupId===a.id).sort((n,r)=>(n.position||0)-(r.position||0))})).filter(a=>!e||a.reports.length||i(`${a.name} ${a.description||""}`))}function J(t,e,i,a=""){const n=b.reports.find(r=>r.id===t);return!n||n.archived?!1:e==="topic"?oa(t,i,a):e==="type"?ct.some(r=>r.id===i)?(n.workType=i,E(),!0):!1:e==="tag"?(n.tags=Array.isArray(n.tags)?n.tags:[],n.tags.includes(i)||n.tags.push(i),E(),!0):!1}function _(){return w==="type"?"工作类型":w==="tag"?"标签":w==="time"?"新增时间":"主题"}function At(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function g(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}const da={back:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6"></path>
    </svg>`,edit:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0 0-2.8l-.4-.4a2 2 0 0 0-2.8 0L5 15.8z"></path>
      <path d="m14.5 6.5 3 3"></path>
    </svg>`,copy:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2"></rect>
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
    </svg>`,download:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11M8 11l4 4 4-4"></path>
      <path d="M5 18v2h14v-2"></path>
    </svg>`,external:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 5h6v6M19 5l-9 9"></path>
      <path d="M17 13v6H5V7h6"></path>
    </svg>`};function U(t){return da[t]||""}function K(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function ut(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function ft(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function I(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Ut),Ut=window.setTimeout(()=>e.remove(),2600)}function nt(t){return t.savedHtml||dt(t.savedContent,t.savedFiles)}function ua(t){return`${String(t.title||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,80)||"report"}.html`}function ue(t){const e=nt(t);return e?URL.createObjectURL(new Blob([e],{type:"text/html;charset=utf-8"})):""}function pa(t){const e=ue(t);if(!e)return!1;const i=document.createElement("a");return i.href=e,i.download=ua(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(e),1e3),!0}function ma(t){const e=t.url||ue(t);return e?(window.open(e,"_blank","noopener,noreferrer"),t.url||window.setTimeout(()=>URL.revokeObjectURL(e),6e4),!0):!1}function pe(t,e=!1){const i=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),a=["org","account"].includes(t.access),n=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=nt(t),l=w==="time"?ca(t.createdAt):t.source||"手动添加",s=!a&&H.reports.some(p=>p.id===t.id),c=t.preview||`${t.id}.png`,d=r&&t.isHtml?`<iframe class="local-html-preview-frame" title="${g(t.title)}视觉预览"
        srcdoc="${g(r)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:s?`<img src="./previews/${g(c)}" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":g(t.title.slice(0,2))}</span>
        <strong>${a?n:i?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${R===t.id?"is-move-selected":""}" data-report-id="${g(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${g(t.id)}" aria-label="打开${g(t.title)}">
        <span class="report-preview">
          ${d}
        </span>
        <span class="report-copy">
          <span class="report-source">${g(l)}</span>
          <strong>${g(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(p=>`<span>${g(p)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${g(n)}</span>`:""}
        </span>
      </button>
      ${e||w==="time"?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${g(t.id)}"
          aria-label="拖动《${g(t.title)}》到其他${_()}" title="拖动到其他${_()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${g(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${g(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${g(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${t.url?`<button type="button" data-action="edit" data-id="${g(t.id)}">编辑</button>`:""}
            <button type="button" data-action="archive" data-id="${g(t.id)}">归档</button>`}
      </div>
    </article>`}function Ct(){var i;if(!$)return"";if($.type==="tags"){const a=b.reports.find(n=>n.id===$.reportId);return a?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${g(a.title)}</p>
          <label>标签
            <input name="tags" value="${g((a.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${X.map(n=>`<button type="button" class="${(a.tags||[]).includes(n)?"selected":""}" data-tag-suggestion="${g(n)}">${g(n)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if($.type==="group"){const a=$.mode==="edit"?b.groups.find(n=>n.id===$.groupId):null;return`
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
            <input name="name" value="${g((a==null?void 0:a.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${g((a==null?void 0:a.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${a?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=$.mode==="edit"?b.reports.find(a=>a.id===$.reportId):null,e=(t==null?void 0:t.groupId)||$.groupId||((i=b.groups[0])==null?void 0:i.id)||"";return`
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
            ${b.groups.map(a=>`<option value="${g(a.id)}" ${a.id===e?"selected":""}>${g(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${ct.map(a=>`<option value="${g(a.id)}" ${a.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${g(a.name)}</option>`).join("")}
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
    </div>`}function ga(){return`
    <main class="gate-shell">
      <section class="gate-card">
        <div class="gate-brand">
          <div class="brand-mark">C</div>
          <span>PERSONAL STUDIO</span>
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
        <div class="gate-foot"><span>Light access gate</span><span>Local-only data</span></div>
      </section>
    </main>`}function ha(t){var s;if(ee(t.id))return Ye(t,g);const e=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),i=["org","account"].includes(t.access),a=t.loginProvider||((s=ce(t.url))==null?void 0:s.provider)||(t.access==="org"?"组织帐号":"站点帐号"),n=t.savedHtml||dt(t.savedContent,t.savedFiles),r=n?"edit-local-document":t.url?i?"edit":"edit-document":"",l=n?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}"
          srcdoc="${g(n)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:e?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${g(t.title)}</h1>
          ${t.savedContent?`<div class="saved-material-content">${g(t.savedContent).replaceAll(`
`,"<br />")}</div>`:""}
          ${(t.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${t.savedFiles.map(c=>`<span><b>${g(c.name)}</b><small>${g(c.sizeLabel||"")}</small></span>`).join("")}
              </section>`:""}
          <p class="saved-material-note">内容保存在当前浏览器；原文件不会上传到 GitHub Pages。</p>
        </article>
      </div>`:i?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${t.access==="org"?"ORGANIZATION SIGN-IN":"ACCOUNT SIGN-IN"}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该页面需要${a}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${a}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${g(t.url)}" target="_blank" rel="noreferrer">打开${g(a)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${g(K(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}" src="${g(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${U("back")}</button>
        <div class="reader-title">
          <strong>${g(t.title)}</strong>
          <span>${e?"本地保存":g(K(t.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${r?`
            <button class="reader-icon-button" type="button" data-action="${r}"
              data-id="${g(t.id)}" aria-label="编辑" title="编辑">
              ${U("edit")}
            </button>`:""}
          ${t.url&&t.access==="production"?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${g(t.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${U("copy")}
            </button>`:""}
          ${!i&&(t.url||n)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${g(t.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${U("download")}
            </button>`:""}
          ${t.url||n?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${g(t.id)}"
              aria-label="${i?`打开${g(a)}登录页`:"在浏览器打开"}"
              title="${i?`打开${g(a)}登录页`:"在浏览器打开"}">
              ${U("external")}
            </button>`:""}
        </div>
      </header>
      ${l}
      ${Ct()}
    </main>`}function me(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${G?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>':""}
    </header>`}function fa(){const t=b.reports.filter(i=>i.archived).filter(i=>ie(i,T,{group:b.groups.find(a=>a.id===i.groupId),workTypeName:it(i.workType)})).sort((i,a)=>new Date(a.archivedAt||0)-new Date(i.archivedAt||0)),e=b.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${me()}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${e}</strong><span>份已归档</span></div>
        </div>
        <label class="search archive-search">
          <span aria-hidden="true">⌕</span>
          <input id="search-input" value="${g(T)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${T?'<button type="button" data-action="clear-search">清除</button>':""}
        </label>
        ${t.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${T?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(i=>pe(i,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${T?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${T?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${T?"clear-search":"show-catalog"}">${T?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${Ct()}
    </main>`}function ba(){if(G)return fa();const t=st(T),e=b.reports.filter(c=>!c.archived),i=t?e.filter(c=>ie(c,t,{group:b.groups.find(d=>d.id===c.groupId),workTypeName:it(c.workType)})):e,a=b.reports.filter(c=>c.archived).length,n=e.filter(c=>c.access==="production").length,r=e.filter(c=>c.access!=="production").length,l=la(i,t).filter(c=>c.reports.length||R||w==="topic"&&!t),s=w==="type"?"工作类型":w==="tag"?"关键标签":w==="time"?"新增时间":"工作主题";return`
    <main class="app-shell">
      ${me()}
      <section class="workspace">
        ${Ie(g)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${g(T)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${T?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${t?i.length:e.length}</strong><span>${t?"匹配":"成果"}</span>
              <i></i>
              <strong>${b.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${n}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${R?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${_()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          ${l.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${s}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${w==="topic"}" class="${w==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                    <button type="button" role="tab" aria-selected="${w==="type"}" class="${w==="type"?"active":""}" data-action="set-view" data-id="type">类型</button>
                    <button type="button" role="tab" aria-selected="${w==="tag"}" class="${w==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
                    <button type="button" role="tab" aria-selected="${w==="time"}" class="${w==="time"?"active":""}" data-action="set-view" data-id="time">时间</button>
                  </div>
                  <button class="add-topic-icon" type="button" data-action="add-group"
                    aria-label="添加主题" title="添加主题">＋</button>
                </div>
                ${l.map((c,d)=>`<a href="#bucket-${d}"><span class="nav-index">${String(d+1).padStart(2,"0")}</span>${g(c.name)}<span>${c.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${a?`<em>${a}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${w}">
              ${l.map((c,d)=>`
                <section id="bucket-${d}" class="group-column topic-section bucket-${g(c.kind)} accent-${g(c.accent||"blue")}"
                  data-bucket-kind="${g(c.kind)}"
                  data-bucket-id="${g(c.id)}"
                  ${c.kind==="topic"?`data-group-id="${g(c.id)}"`:""}>
                  <header class="group-header">
                    ${c.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${g(c.id)}"
                          aria-label="拖动“${g(c.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(d+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${c.kind==="tag"?"#":c.kind==="time"?"时":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${g(c.name)}</h2></div>
                      <span class="count">${c.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${R?`<button class="move-here-button" type="button" data-action="move-here" data-id="${g(c.id)}" data-bucket-kind="${g(c.kind)}">移到这里</button>`:""}
                      ${c.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${g(c.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${g(c.id)}">编辑主题</button>
                           ${c.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${g(c.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${c.reports.length?c.reports.map(p=>pe(p)).join(""):c.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${g(c.id)}">
                            <strong>拖报告到这里</strong>
                            <span>或点击添加第一份报告</span>
                          </button>`:'<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>'}
                  </div>
                </section>`).join("")}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到“${g(T.trim())}”</strong>
              <span>可搜索标题、标签、来源、任务类型或主题</span>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${r} 份报告需要组织或账号登录${a?` · ${a} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${Ct()}
    </main>`}function y(){const t=document.getElementById("app");if(sessionStorage.getItem(xt)!=="ok"){t.innerHTML=ga(),va();return}const e=M&&b.reports.find(i=>i.id===M);t.innerHTML=e?ha(e):ba(),wa(),Se({render:y,showToast:I,saveToLibrary:ra})}function va(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(xt,"ok"),y()})}async function ya(t){const e=t.elements.url,i=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),n=t.querySelector(".field-hint"),r=e.value.trim();if(!ut(r))return n.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',n.textContent="正在读取网页标题…";try{const{title:l}=await le(r);if(!l)throw new Error("read failed");return i.value=l,n.textContent="已识别网页标题",i.value}catch{const l=K(r);return i.value||(i.value=l),n.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{a.disabled=!1,a.textContent="识别标题"}}function wa(){const t=document.getElementById("search-input");t==null||t.addEventListener("input",r=>{if(r.isComposing)return;T=r.target.value;const l=r.target.selectionStart,s=r.target.selectionEnd;y();const c=document.getElementById("search-input");c==null||c.focus(),c==null||c.setSelectionRange(l,s)}),t==null||t.addEventListener("keydown",r=>{var l;r.key!=="Escape"||!T||(r.preventDefault(),T="",y(),(l=document.getElementById("search-input"))==null||l.focus())}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async l=>{var d,p,f;const s=l.currentTarget.dataset.action,c=l.currentTarget.dataset.id;if(s==="open")M=c,y();else if(s==="edit-document"){const u=b.reports.find(h=>h.id===c);if(!u||u.access!=="production")return;Ht(u,{render:y,showToast:I})}else if(s==="edit-local-document"){const u=b.reports.find(h=>h.id===c);if(!u||!nt(u))return;Ht(u,{render:y,showToast:I,saveLocal:async h=>{const A=u.savedHtml;u.savedHtml=h,u.isHtml=!0,u.tags=Z(u,u.workType);try{E()}catch{throw u.savedHtml=A,new Error("修改后的 HTML 超过当前浏览器可保存容量，请先下载备份")}}})}else if(s==="download-report"){const u=b.reports.find(h=>h.id===c);if(!u)return;nt(u)?pa(u)&&I("HTML 已下载"):await ae(u,I)}else if(s==="share-report"||s==="copy-production-url"){const u=b.reports.find(h=>h.id===c);u!=null&&u.url&&await We(u,h=>{I(h==="报告链接已复制"?"生产 URL 已复制":h)})}else if(s==="open-browser"){const u=b.reports.find(h=>h.id===c);if(!u)return;ma(u)||I("浏览器未能打开该报告")}else if(s==="back")M="",$=null,y();else if(s==="lock")sessionStorage.removeItem(xt),y();else if(s==="clear-search")T="",y(),(d=document.getElementById("search-input"))==null||d.focus();else if(s==="set-view"){if(!["topic","type","tag","time"].includes(c))return;w=c,R="",localStorage.setItem(z,w),y()}else if(s==="cancel-move")R="",y();else if(s==="move-here"){const u=l.currentTarget.dataset.bucketKind||w;R&&J(R,u,c)&&(R="",y(),I(u==="tag"?"已添加目标标签":`报告已移入目标${_()}`))}else if(s==="show-archive")G=!0,T="",M="",y();else if(s==="show-catalog")G=!1,T="",M="",y();else if(s==="add-report")$={type:"report",mode:"create",groupId:((p=b.groups[1])==null?void 0:p.id)||((f=b.groups[0])==null?void 0:f.id)},y();else if(s==="add-to-group")$={type:"report",mode:"create",groupId:c},y();else if(s==="edit")$={type:"report",mode:"edit",reportId:c},y();else if(s==="edit-tags")$={type:"tags",reportId:c},y();else if(s==="close-modal")$=null,y();else if(s==="detect-title")await ya(l.currentTarget.closest("form"));else if(s==="archive"){const u=b.reports.find(h=>h.id===c);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),E(),y(),I("已归档，可随时恢复")}else if(s==="restore"){const u=b.reports.find(h=>h.id===c);if(!u)return;u.archived=!1,u.archivedAt="",E(),y(),I("报告已恢复到原主题")}else if(s==="delete"){const u=b.reports.find(h=>h.id===c);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(b.reports=b.reports.filter(h=>h.id!==c),M===c&&(M=""),E(),y(),I("报告已永久删除"))}else if(s==="add-group")$={type:"group",mode:"create"},y();else if(s==="rename-group")b.groups.find(h=>h.id===c)&&($={type:"group",mode:"edit",groupId:c},y());else if(s==="delete-group"){const u=b.groups.find(h=>h.id===c);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(b.reports.forEach(h=>{h.groupId===c&&(h.groupId="inbox")}),b.groups=b.groups.filter(h=>h.id!==c),E(),y(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(r=>{let l=null,s=!1;const c=()=>{var d;D="",l=null,s=!1,(d=r.closest(".report-card"))==null||d.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",d=>{var p,f;d.preventDefault(),D=r.dataset.reportDragId,x="",l={x:d.clientX,y:d.clientY},s=!1,(p=r.setPointerCapture)==null||p.call(r,d.pointerId),(f=r.closest(".report-card"))==null||f.classList.add("is-dragging")}),r.addEventListener("pointermove",d=>{if(!D||l&&Math.hypot(d.clientX-l.x,d.clientY-l.y)<7)return;s=!0;const p=document.elementFromPoint(d.clientX,d.clientY),f=p==null?void 0:p.closest(".report-card"),u=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(h=>{h.classList.toggle("is-card-drop-target",!!(f&&f!==r.closest(".report-card")&&h===f))}),document.querySelectorAll(".group-column").forEach(h=>{h.classList.toggle("is-drop-ready",!!(u&&h===u))})}),r.addEventListener("pointerup",d=>{if(!D)return;const p=D;if(!s){R=p,c(),y(),I(`请选择目标${_()}`);return}const f=document.elementFromPoint(d.clientX,d.clientY),u=f==null?void 0:f.closest(".report-card"),h=f==null?void 0:f.closest(".group-column"),A=(u==null?void 0:u.dataset.reportId)||"",L=(h==null?void 0:h.dataset.bucketId)||"",m=(h==null?void 0:h.dataset.bucketKind)||w,v=A&&A!==p?J(p,m,L,A):L?J(p,m,L):!1;c(),v&&(y(),I(m==="tag"?"已添加目标标签":m==="type"?"工作类型已更新":A?"报告顺序已更新":"已移入新主题"))}),r.addEventListener("pointercancel",c)}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const l=()=>{var s;x="",(s=r.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(c=>{c.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",s=>{var c,d;s.preventDefault(),x=r.dataset.groupDragId,D="",(c=r.setPointerCapture)==null||c.call(r,s.pointerId),(d=r.closest(".group-column"))==null||d.classList.add("is-group-dragging")}),r.addEventListener("pointermove",s=>{x&&document.querySelectorAll(".group-column").forEach(c=>{var d;c.classList.toggle("is-group-drop-target",c===((d=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:d.closest(".group-column")))})}),r.addEventListener("pointerup",s=>{var p;if(!x)return;const c=x,d=(p=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:p.closest(".group-column");if(d&&ht(c,d.dataset.groupId)){x="",y(),I("分组顺序已更新");return}l()}),r.addEventListener("pointercancel",l),r.addEventListener("keydown",s=>{var f;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const c=b.groups.findIndex(u=>u.id===r.dataset.groupDragId),d=s.key==="ArrowLeft"?c-1:c+1,p=b.groups[d];!p||!ht(r.dataset.groupDragId,p.id)||(y(),I("分组顺序已更新"),(f=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||f.focus())})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",l=>{l.preventDefault(),r.classList.add(x?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",l=>{if(l.preventDefault(),x){if(r.dataset.bucketKind==="topic"&&ht(x,r.dataset.groupId)){x="",y(),I("分组顺序已更新");return}x="",r.classList.remove("is-group-drop-target");return}const s=b.reports.find(d=>d.id===D),c=r.dataset.bucketKind||w;s&&J(D,c,r.dataset.bucketId)&&(D="",y(),I(c==="tag"?"已添加目标标签":c==="type"?"工作类型已更新":"已移入新主题")),D=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(r=>{r.addEventListener("click",()=>{const l=document.querySelector('#tag-form input[name="tags"]');if(!l)return;const s=ft(l.value),c=r.dataset.tagSuggestion;l.value=s.includes(c)?s.filter(d=>d!==c).join("、"):[...s,c].slice(0,8).join("、"),r.classList.toggle("selected",!s.includes(c)),l.focus()})});const e=document.getElementById("tag-form");e==null||e.addEventListener("submit",r=>{r.preventDefault();const l=b.reports.find(s=>s.id===$.reportId);l&&(l.tags=ft(new FormData(e).get("tags")),E(),$=null,y(),I("标签已更新"))});const i=document.getElementById("group-form");i==null||i.addEventListener("submit",r=>{var d,p;r.preventDefault();const l=(d=new FormData(i).get("name"))==null?void 0:d.trim(),s=(p=new FormData(i).get("description"))==null?void 0:p.trim();if(!l)return;if($.mode==="edit"){const f=b.groups.find(u=>u.id===$.groupId);if(!f)return;f.name=l.slice(0,60),f.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else b.groups.push({id:At("group"),name:l.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][b.groups.length%4],position:b.groups.length}),w="topic",localStorage.setItem(z,w);E();const c=$.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";$=null,y(),I(c)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async r=>{r.preventDefault();const l=a.elements.url.value.trim();if(!ut(l))return;const s=a.querySelector('button[type="submit"]'),c=a.querySelector(".field-hint");s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';const d=$.mode==="edit"?$.reportId:"",p=oe({material:l,files:[],url:l,excludeId:d});if(p){s.disabled=!1,s.textContent="保存",c.textContent=`成果库已有“${p.title}”，未重复保存`,I(`成果库已有“${p.title}”，未重复保存`);return}const f=await de({material:l,files:[],url:l},k=>{c.textContent=k});if(!f.allowed){s.disabled=!1,s.textContent="保存",c.textContent=f.reason,I(f.reason);return}let u=a.elements.title.value.trim()||f.metadata.title;const h=a.elements.groupId.value,A=a.elements.workType.value,L=ft(a.elements.tags.value),m={title:u||K(l),url:l,groupId:h,workType:A,source:"手动添加",access:f.access,detectedDescription:f.metadata.description,manualSaved:!0,isProduction:f.access==="production",isPersonal:se(l),isHtml:f.isHtml,loginProvider:f.loginProvider},v=[...new Set([...Z(m,A),...L])].slice(0,8);if($.mode==="edit"){const k=b.reports.find(C=>C.id===$.reportId);Object.assign(k,m,{tags:v})}else{const k={id:At("report"),groupId:h,...m,pinned:!1,position:b.reports.filter(C=>C.groupId===h).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:"",tags:v};b.reports.push(k)}E(),$=null,y(),I("报告已保存")});const n=M&&b.reports.find(r=>r.id===M);n&&Ve(n)}function ka(){y()}ka(document.getElementById("app"));
