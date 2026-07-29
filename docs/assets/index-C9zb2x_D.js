(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`clair-ai-studio-tasks-v1`,t=[{id:`save`,name:`保存`,hint:`自动识别并进入成果库`},{id:`decision`,name:`决策`,hint:`发起决策推演`},{id:`review`,name:`评审`,hint:`自动匹配合适的评审 Skill`}],n={save:`
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
    </svg>`},r=[{id:`requirement`,name:`需求评审`},{id:`solution`,name:`方案评审`},{id:`decision`,name:`决策推演`},{id:`agreement`,name:`协议审查`},{id:`career`,name:`履历评估`}],i=o(),a=``;function o(){return{material:``,files:[]}}function s(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}function c(e){let t=e.toLowerCase(),n=[[`agreement`,[`协议`,`合同`,`条款`,`保密`,`签署`,`数据处理`]],[`career`,[`简历`,`履历`,`候选人`,`晋升`,`岗位`,`面试`]],[`decision`,[`决策`,`选型`,`取舍`,`是否推进`,`选择`]],[`requirement`,[`需求`,`prd`,`用户故事`,`验收`,`原型`]],[`solution`,[`方案`,`流程`,`架构`,`设计`,`上线`]]].find(([,e])=>e.some(e=>t.includes(e)))?.[0]||`solution`;return r.find(e=>e.id===n)||r[1]}function l(e){let t=new Date(e||0);return Number.isFinite(t.getTime())?new Intl.DateTimeFormat(`zh-CN`,{month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`}).format(t):`时间待补`}function u(){return g().filter(e=>![`completed`,`confirmed`,`dismissed`].includes(e.status)).sort((e,t)=>new Date(t.updatedAt||t.createdAt||0)-new Date(e.updatedAt||e.createdAt||0))}function d(e){return e.mode===`decision`?`决策推演`:`专业评审`}function f(e){return e.status===`review`?`待人工确认`:e.status===`processing`?`处理中`:`待执行`}function p(e){let t=(e.files||[]).map(e=>`- ${e.name}${e.sizeLabel?`（${e.sizeLabel}）`:``}`).join(`
`);return[`任务类型：${d(e)}`,`匹配 Skill：${e.skillName||`方案评审`}`,``,`任务材料：`,e.material||`（无粘贴文字）`,t?`\n附件：\n${t}`:``].filter(Boolean).join(`
`)}function m(e){return e<1024?`${e} B`:e<1024*1024?`${Math.ceil(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}async function h(e){let t=[...e].slice(0,20);return Promise.all(t.map(async e=>{let t=e.type.startsWith(`text/`)||/\.(md|txt|csv|json|html|xml)$/i.test(e.name),n=/\.html?$/i.test(e.name),r=``,i=``;if(t&&e.size<=1024*1024)try{let t=await e.text();r=t.slice(0,12e3),n&&(i=t)}catch{r=``,i=``}return{id:s(),name:e.name,type:e.type||`文件`,size:e.size,sizeLabel:m(e.size),excerpt:r,content:i}}))}function ee(e){return i.files.length?`<div class="attachment-list">${i.files.map(t=>`
    <span class="attachment-chip">
      <b>${e(t.name)}</b><small>${e(t.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${e(t.name)}"
        data-task-action="remove-file" data-file-id="${t.id}">×</button>
    </span>`).join(``)}</div>`:``}function te(e){return t.map(t=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${t.id}" aria-label="${e(t.name)}"
      title="${e(t.name)} · ${e(t.hint)}">
      ${n[t.id]}
      <span class="intake-action-label">${e(t.name)}</span>
    </button>`).join(``)}function ne(e){let t=u();return t.length?`
    <div class="inline-task-progress" aria-label="待处理任务">
      <div class="progress-summary">
        <span class="task-status-dot" aria-hidden="true"></span>
        <div>
          <strong>${t.length} 项任务等待处理</strong>
          <small>任务保存在当前浏览器，不会在后台自动执行</small>
        </div>
      </div>
      <div class="progress-task-list">
        ${t.slice(0,3).map(t=>`
          <button type="button" data-task-action="open-task" data-task-id="${t.id}">
            <span>${e(t.skillName?.slice(0,1)||`任`)}</span>
            <div>
              <strong>${e(t.title||`未命名任务`)}</strong>
              <small>${e(f(t))} · ${e(l(t.updatedAt||t.createdAt))}</small>
            </div>
            <i>→</i>
          </button>`).join(``)}
      </div>
    </div>`:``}function re(e,t){let n=e.files||[];return`
    <section class="task-center task-detail inline-task-detail" aria-labelledby="task-detail-title">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果库</button>
      <div class="task-detail-header">
        <div>
          <span class="eyebrow">${t(e.skillName||`方案评审`)} · ${t(d(e))}</span>
          <h1 id="task-detail-title">${t(e.title||`未命名任务`)}</h1>
        </div>
        <span class="status-pill">${t(f(e))}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>处理方式</span><p>${t(d(e))}</p></section>
          <section><span>匹配能力</span><p>${t(e.skillName||`方案评审`)}</p></section>
          <section><span>创建时间</span><p>${t(l(e.createdAt))}</p></section>
          <section><span>附件</span><p>${n.length?n.map(e=>t(e.name)).join(`、`):`无附件`}</p></section>
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
            <p>${t(e.material||`未粘贴文字材料`).replaceAll(`
`,`<br />`)}</p>
            ${n.length?`
              <h3>附件记录</h3>
              <ul>${n.map(e=>`<li>${t(e.name)}${e.sizeLabel?` · ${t(e.sizeLabel)}`:``}</li>`).join(``)}</ul>`:``}
          </article>
          <div class="task-review-actions">
            <button class="quiet-button" type="button" data-task-action="dismiss-task"
              data-task-id="${e.id}">移出队列</button>
            <button class="primary-button" type="button" data-task-action="copy-task"
              data-task-id="${e.id}">复制任务单</button>
          </div>
        </main>
      </div>
    </section>`}function ie(e){if(a){let t=g().find(e=>e.id===a);if(t)return re(t,e);a=``}return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="输入或粘贴内容"
            placeholder="粘贴链接、文字，或拖入一份材料…">${e(i.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${n.upload}
              <span class="intake-action-label">材料</span>
            </label>
            ${te(e)}
          </div>
        </div>
        ${ee(e)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
      ${ne(e)}
    </section>`}function ae({render:t,showToast:n,saveToLibrary:l}){document.querySelectorAll(`[data-task-action]`).forEach(r=>{r.addEventListener(`click`,async r=>{let o=r.currentTarget.dataset.taskAction;if(o===`remove-file`)_(),i.files=i.files.filter(e=>e.id!==r.currentTarget.dataset.fileId),t();else if(o===`open-task`)a=r.currentTarget.dataset.taskId,t();else if(o===`close-task`)a=``,t();else if(o===`copy-task`){let e=g().find(e=>e.id===r.currentTarget.dataset.taskId);if(!e)return;try{await navigator.clipboard.writeText(p(e)),n(`任务单已复制，可交给 Codex 执行`)}catch{n(`复制失败，请手动选择任务内容`)}}else if(o===`dismiss-task`){let i=g(),o=i.find(e=>e.id===r.currentTarget.dataset.taskId);if(!o)return;o.status=`dismissed`,o.updatedAt=new Date().toISOString(),localStorage.setItem(e,JSON.stringify(i)),a=``,t(),n(`已移出待处理队列`)}})});let u=document.getElementById(`task-composer`);u?.addEventListener(`submit`,async a=>{if(a.preventDefault(),_(),!i.material.trim()&&!i.files.length){n(`先粘贴内容，或加入一份材料`),document.getElementById(`task-goal`)?.focus();return}let d=a.submitter?.dataset.submitAction||`save`,f=a.submitter,p={material:i.material.trim(),files:i.files};if(d===`save`){let e=u.querySelector(`#intake-save-status`),r=[...u.querySelectorAll(`button, textarea, input`)],a=t=>{r.forEach(e=>{e.disabled=!0}),u.setAttribute(`aria-busy`,`true`),u.classList.add(`is-saving`),e.hidden=!1,e.querySelector(`strong`).textContent=t,f.setAttribute(`aria-label`,`保存中`),f.innerHTML=`<span class="mini-spinner"></span>`};a(`正在检查成果库与页面访问状态…`);try{let e=await l(p,a);if(e.rejected){t(),n(e.reason);return}if(e.duplicate){t(),n(`成果库已有“${e.title}” · 位于“${e.groupName}”，未重复保存`);return}i=o(),t(),n(`已保存到“${e.groupName}” · ${e.workTypeName} · 标签：${e.tags.join(` / `)||`待补标签`}`)}catch{r.forEach(e=>{e.disabled=!1}),t(),n(`保存失败，请稍后重试`)}return}f.disabled=!0;let m=c([p.material,...p.files.map(e=>`${e.name}\n${e.excerpt}`)].join(`
`)),h=d===`decision`?r.find(e=>e.id===`decision`):m.id===`decision`?r.find(e=>e.id===`solution`):m,ee=new Date().toISOString(),te=g();te.push({id:s(),title:oe(p),mode:d,skillId:h.id,skillName:h.name,material:p.material,files:p.files,status:`queued`,createdAt:ee,updatedAt:ee}),localStorage.setItem(e,JSON.stringify(te)),i=o(),t(),n(`已加入待处理队列 · ${h.name} · 当前不会自动执行`)}),document.getElementById(`task-files`)?.addEventListener(`change`,async e=>{_(),i.files.push(...await h(e.target.files)),t(),n(`已加入 ${e.target.files.length} 个文件`)});let d=document.querySelector(`.prompt-composer`);d?.addEventListener(`dragover`,e=>{e.preventDefault(),d.classList.add(`drag-over`)}),d?.addEventListener(`dragleave`,()=>d.classList.remove(`drag-over`)),d?.addEventListener(`drop`,async e=>{e.preventDefault(),e.stopPropagation(),d.classList.remove(`drag-over`),_();let r=e.dataTransfer.files;i.files.push(...await h(r)),t(),n(`已加入 ${r.length} 个文件`)});let f=document.getElementById(`task-goal`);requestAnimationFrame(()=>se(f)),f?.addEventListener(`input`,()=>{i.material=f.value,se(f)}),f?.addEventListener(`paste`,async e=>{let r=[...e.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean);if(!r.length)return;e.preventDefault();let a=e.clipboardData.getData(`text/plain`),o=f.selectionStart??f.value.length,s=f.selectionEnd??o;i.material=`${f.value.slice(0,o)}${a}${f.value.slice(s)}`,i.files.push(...await h(r)),t(),n(`已从剪贴板加入 ${r.length} 个材料`)}),ue({render:t,showToast:n})}function g(){try{let t=JSON.parse(localStorage.getItem(e));return Array.isArray(t)?t:[]}catch{return[]}}function oe(e){return(e.material.split(/\n/).map(e=>e.trim()).find(Boolean)||e.files[0]?.name||`未命名任务`).replace(/[。；;！!？?]+$/,``).slice(0,64)}function _(){let e=document.getElementById(`task-goal`);e&&(i.material=e.value)}function se(e){if(!e)return;e.style.height=`auto`;let t=Math.min(Math.max(e.scrollHeight,40),180);e.style.height=`${t}px`,e.style.overflowY=e.scrollHeight>180?`auto`:`hidden`}function ce(){document.querySelector(`.prompt-composer`)?.scrollIntoView({behavior:`smooth`,block:`center`}),requestAnimationFrame(()=>document.getElementById(`task-goal`)?.focus())}function le(e){return!!e?.closest?.(`input, textarea, select, [contenteditable='true']`)}function ue({render:e,showToast:t}){document.onpaste=async n=>{if(le(n.target)||!document.querySelector(`.prompt-composer`))return;let r=[...n.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean),a=n.clipboardData?.getData(`text/plain`)||``;!r.length&&!a.trim()||(n.preventDefault(),i.material=[i.material.trim(),a.trim()].filter(Boolean).join(`

`),r.length&&i.files.push(...await h(r)),e(),requestAnimationFrame(ce),t(r.length?`已从剪贴板加入 ${r.length} 个材料`:`已把粘贴内容放入输入框`))},document.ondragover=e=>{[...e.dataTransfer?.types||[]].includes(`Files`)&&e.preventDefault()},document.ondrop=async n=>{if(n.target?.closest?.(`.prompt-composer`))return;let r=n.dataTransfer?.files||[];r.length&&(n.preventDefault(),i.files.push(...await h(r)),e(),requestAnimationFrame(ce),t(`已拖入 ${r.length} 个文件`))}}var v=`clair-report-editor-v1`,de=`https://api.github.com`,fe=`2026`,pe=`clair-report-editor-draft-v1:`,y={reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,token:``,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null},b=new Map,me=!1;function he(e){return[...new Set(e.filter(Boolean))]}function ge(e=y.target){return e?{...e.path&&e.sha?{[e.path]:e.sha}:{},...Object.fromEntries((e.mirrors||[]).map(e=>[e.path,e.sha])),...e.baseFiles||{}}:{}}function _e(e){return`${pe}${e}`}function ve(e){try{let t=sessionStorage.getItem(_e(e));if(!t)return null;let n=JSON.parse(t);return!n?.html||typeof n.html!=`string`?null:n}catch{return null}}function ye(e=y.reportId){try{sessionStorage.removeItem(_e(e))}catch{}}function be(){return y.dirty&&y.hasDraft?{tone:`changed`,label:y.isLocal?`有新修订 · 上次暂存待保存`:`有新修订 · 上次暂存待推送`}:y.dirty?{tone:`changed`,label:`已修订 · 未暂存`}:y.hasDraft?{tone:`staged`,label:y.isLocal?`已暂存 · 待保存成果库`:`已暂存 · 待推送生产`}:y.lastCommit?{tone:`published`,label:y.isLocal?`成果库 HTML 已更新`:`生产档案已更新`}:{tone:`clean`,label:`未修改`}}function x(){let e=be(),t=document.querySelector(`.editor-revision-status`);t&&(t.className=`editor-revision-status is-${e.tone}`,t.textContent=e.label);let n=document.querySelector(`[data-editor-action="stash"]`);if(n){n.disabled=y.status!==`ready`||y.saving||!y.dirty;let e=!y.dirty&&y.hasDraft?`已暂存`:`暂存修改`;n.setAttribute(`aria-label`,e),n.title=e}let r=document.querySelector(`[data-editor-action="publish"]`);if(r){r.disabled=y.status!==`ready`||y.saving||!y.dirty&&!y.hasDraft;let e=y.saving?y.isLocal?`正在保存到成果库`:`正在推送生产`:y.isLocal?`保存到成果库`:`推送生产`;r.setAttribute(`aria-label`,e),r.title=e,r.classList.toggle(`is-saving`,y.saving)}let i=document.querySelector(`[data-editor-action="preview"]`);i&&(i.disabled=y.status!==`ready`||y.saving||!y.hasDraft)}function xe(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function Se(e){let t=atob(String(e||``).replace(/\s/g,``)),n=Uint8Array.from(t,e=>e.charCodeAt(0));return new TextDecoder().decode(n)}function Ce(e){let t=new TextEncoder().encode(e),n=``,r=32768;for(let e=0;e<t.length;e+=r)n+=String.fromCharCode(...t.subarray(e,e+r));return btoa(n)}function we(e){let t=``,n=32768;for(let r=0;r<e.length;r+=n)t+=String.fromCharCode(...e.subarray(r,r+n));return btoa(t)}function Te(e){return Uint8Array.from(atob(e),e=>e.charCodeAt(0))}async function Ee(e,t){let n=await crypto.subtle.importKey(`raw`,new TextEncoder().encode(e),`PBKDF2`,!1,[`deriveKey`]);return crypto.subtle.deriveKey({name:`PBKDF2`,salt:t,iterations:21e4,hash:`SHA-256`},n,{name:`AES-GCM`,length:256},!1,[`encrypt`,`decrypt`])}async function De(e){let t=e.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!t)return{html:e,protection:null};try{let n=JSON.parse(t[1]),r=Te(n.salt),i=Te(n.iv),a=await Ee(fe,r),o=await crypto.subtle.decrypt({name:`AES-GCM`,iv:i},a,Te(n.data)),s=new TextDecoder().decode(o);if(!/<html[\s>]/i.test(s))throw Error(`解密结果不是 HTML`);return{html:s,protection:{type:`aes-gcm-wrapper`,wrapperHtml:e,payloadSource:t[1]}}}catch{throw Error(`检测到加密报告，但无法用工作台口令解锁`)}}async function Oe(e){if(y.protection?.type!==`aes-gcm-wrapper`)return e;let t=crypto.getRandomValues(new Uint8Array(16)),n=crypto.getRandomValues(new Uint8Array(12)),r=await Ee(fe,t),i=await crypto.subtle.encrypt({name:`AES-GCM`,iv:n},r,new TextEncoder().encode(e)),a=JSON.stringify({salt:we(t),iv:we(n),data:we(new Uint8Array(i))});return y.protection.wrapperHtml.replace(y.protection.payloadSource,a)}function ke(e){try{let t=new URL(e);if(t.hostname.toLowerCase()!==`clairku.github.io`)return null;let n=t.pathname.split(`/`).filter(Boolean).map(decodeURIComponent),r=n.shift()||`ClairKu.github.io`,i=n.join(`/`);(!i||t.pathname.endsWith(`/`))&&(i=`${i?`${i}/`:``}index.html`);let a=he([`docs/${i}`,i,`public/${i}`]);return{owner:`ClairKu`,repository:r,branch:`main`,path:a[0],candidates:a,source:`auto`}}catch{return null}}async function S(e,{token:t=``,method:n=`GET`,body:r}={}){let i={Accept:`application/vnd.github+json`,"X-GitHub-Api-Version":`2022-11-28`};t&&(i.Authorization=`Bearer ${t}`),r!==void 0&&(i[`Content-Type`]=`application/json`);let a=await fetch(`${de}${e}`,{method:n,headers:i,body:r===void 0?void 0:JSON.stringify(r)});if(!a.ok){let e=``;try{e=(await a.json())?.message||``}catch{e=await a.text()}let t=Error(e||`GitHub API ${a.status}`);throw t.status=a.status,t}return a.status===204?null:a.json()}async function Ae(e){e.branch=(await S(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}`)).default_branch||e.branch||`main`;let t=he(e.candidates?.length?e.candidates:[e.path]),n=null,r=null,i=[];for(let a of t)try{let n=a.split(`/`).map(encodeURIComponent).join(`/`),o=await S(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${n}?ref=${encodeURIComponent(e.branch)}`),s=``;if(o.encoding===`base64`&&o.content)s=Se(o.content);else if(o.download_url){let e=await fetch(o.download_url,{cache:`no-store`});if(!e.ok)throw Error(`无法读取 GitHub 原始文件`);s=await e.text()}if(!s)throw Error(`GitHub 文件内容为空`);r?s===r.html&&i.push({path:a,sha:o.sha}):r={html:s,target:{...e,path:a,sha:o.sha,candidates:t}}}catch(e){if(n=e,e.status&&![403,404].includes(e.status))break}if(r)return r.target.mirrors=i,r;throw n||Error(`没有找到对应的 GitHub HTML 文件`)}function je(e){e.querySelectorAll(`script`).forEach(e=>{e.dataset.clairOriginalType=e.getAttribute(`type`)??`__empty__`,e.setAttribute(`type`,`application/x-clair-disabled`)}),e.querySelectorAll(`*`).forEach(e=>{[...e.attributes].forEach(t=>{/^on/i.test(t.name)&&(e.setAttribute(`data-clair-event-${t.name.toLowerCase()}`,t.value),e.removeAttribute(t.name))});let t=e.getAttribute(`href`);t&&/^\s*javascript:/i.test(t)&&(e.dataset.clairJavascriptHref=t,e.removeAttribute(`href`))})}function Me(){return`
(() => {
  const channel = ${JSON.stringify(v)};
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
`}function Ne(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelectorAll(`meta[http-equiv="Content-Security-Policy" i]`).forEach(e=>{e.dataset.clairEditorHttpEquiv=e.getAttribute(`http-equiv`)||`Content-Security-Policy`,e.setAttribute(`http-equiv`,`x-clair-csp-disabled`)}),je(n);let r=n.createElement(`base`);r.href=t,r.dataset.clairEditorBase=`true`,n.head.prepend(r);let i=n.createElement(`style`);i.id=`clair-editor-style`,i.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,n.head.append(i);let a=n.createElement(`script`);return a.id=`clair-editor-bridge`,a.textContent=Me(),n.body.append(a),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function Pe(e){if(e.url)return``;if(e.savedHtml)return e.savedHtml;let t=(e.savedFiles||[]).find(e=>/\.html?$/i.test(e.name||``));return t?.content||t?.excerpt?t.content||t.excerpt:/<!doctype\s+html|<html[\s>]/i.test(e.savedContent||``)?e.savedContent.trim():``}async function Fe(e){try{let t=Pe(e),n=t?null:ke(e.url),r=null;if(t)r={html:t,target:null};else if(n)try{r=await Ae(n)}catch{}if(!r&&e.url){let t=await fetch(e.url,{cache:`no-store`});if(!t.ok)throw Error(`报告读取失败（HTTP ${t.status}）`);r={html:await t.text(),target:n}}let i=await De(r.html);y.protection=i.protection,y.target=r.target||n;let a=i.html,o=ve(e.id);if(o?.html)try{let e=await De(o.html);a=e.html,y.hasDraft=!0,y.draftHtml=e.html,y.draftAt=o.savedAt||``,o.baseFiles&&y.target&&(y.target.baseFiles=o.baseFiles)}catch{ye(e.id)}y.html=a,y.editorDocument=Ne(a,e.url||window.location.href),y.status=`ready`,y.error=``}catch(e){y.status=`error`,y.error=e?.message||`无法读取这份 HTML`}finally{y.loadPromise=null,y.render?.()}}function Ie(){let e=y.render,t=y.showToast;Object.assign(y,{reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:e,showToast:t})}function Le(){return document.querySelector(`.report-editor-frame`)}function Re(e,t=null){Le()?.contentWindow?.postMessage({channel:v,type:`command`,command:e,value:t},`*`)}function C(){let e=Le();if(!e?.contentWindow)return Promise.reject(Error(`编辑画布尚未就绪`));let t=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;return new Promise((n,r)=>{let i=window.setTimeout(()=>{b.delete(t),r(Error(`读取编辑内容超时`))},1e4);b.set(t,{resolve:e=>{clearTimeout(i),n(e)}}),e.contentWindow.postMessage({channel:v,type:`serialize`,requestId:t},`*`)})}function ze(e){return`${String(e||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``).slice(0,80)||`report`}.html`}function Be(e,t){let n=new Blob([e],{type:`text/html;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=ze(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),1e3)}async function Ve(e){await navigator.clipboard.writeText(e)}function He(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelector(`base[data-clair-preview-base]`)?.remove();let r=n.createElement(`base`);return r.href=t,r.dataset.clairPreviewBase=`true`,n.head.prepend(r),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function Ue(e){if(!y.hasDraft||!y.draftHtml)throw Error(`请先暂存当前修订，再另开预览`);let t=new Blob([He(y.draftHtml,e.url||window.location.href)],{type:`text/html;charset=utf-8`}),n=URL.createObjectURL(t),r=window.open(n,`_blank`);if(!r)throw URL.revokeObjectURL(n),Error(`浏览器拦截了新窗口，请允许弹窗后重试`);r.opener=null,window.setTimeout(()=>URL.revokeObjectURL(n),6e4)}async function w(e,{silent:t=!1}={}){let n=await C(),r=await Oe(n),i=new Date().toISOString();try{sessionStorage.setItem(_e(e.id),JSON.stringify({reportId:e.id,reportUrl:e.url,savedAt:i,baseFiles:ge(),html:r}))}catch{throw Error(`浏览器暂存空间不足，请先下载 HTML 备份`)}return y.html=n,y.draftHtml=n,y.draftAt=i,y.hasDraft=!0,y.dirty=!1,y.lastCommit=``,x(),t||y.showToast?.(y.isLocal?`已暂存在当前浏览器会话，尚未写回成果库`:`已暂存在当前浏览器会话，尚未更新 GitHub`),n}async function We(e){if(!(y.saving||!y.saveLocal)){y.saving=!0,x();try{let t=y.dirty?await w(e,{silent:!0}):y.draftHtml||await C();await y.saveLocal(t),y.html=t,y.dirty=!1,y.hasDraft=!1,y.draftHtml=``,y.draftAt=``,y.lastCommit=`local`,ye(e.id),y.showToast?.(`已更新成果库中的 HTML`)}catch(e){y.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{y.saving=!1,x()}}}async function Ge(e){let t=y.target;if(!t?.owner||!t.repository||!t.path||!t.branch)throw Error(`请先填写 GitHub 仓库、分支和 HTML 路径`);if(!y.token)throw Error(`请先提供 GitHub Fine-grained Token`);let n=await Oe(e),r=(t.mirrors||[]).map(e=>e.path),i=he([...r.filter(e=>e.startsWith(`public/`)),...r.filter(e=>!e.startsWith(`public/`)&&e!==t.path),t.path]),a=``,o=[];for(let e of i)try{let r=e.split(`/`).map(encodeURIComponent).join(`/`),i=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${r}`,s=await S(`${i}?ref=${encodeURIComponent(t.branch)}`,{token:y.token}),c=ge(t)[e];if(c&&s.sha!==c)throw Error(`生产文件 ${e} 已在本次编辑后更新，请重新打开报告合并修改`);let l=await S(i,{token:y.token,method:`PUT`,body:{message:`Update ${y.reportTitle} from Clair's Studio`,content:Ce(n),sha:s.sha,branch:t.branch}});a=l?.commit?.sha||a,t.baseFiles={...ge(t),[e]:l?.content?.sha||s.sha},o.push(e)}catch(t){throw o.length?Error(`已更新 ${o.join(`、`)}，但 ${e} 同步失败：${t.message}`):t}return{commit:a,files:o.length}}async function Ke(e){if(!y.saving){y.saving=!0,x();try{let t=y.dirty?await w(e,{silent:!0}):y.draftHtml||await C(),n=await Ge(t);y.html=t,y.dirty=!1,y.hasDraft=!1,y.draftHtml=``,y.draftAt=``,y.lastCommit=n.commit,ye(e.id),y.showToast?.(n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:`已提交 GitHub，Pages 正在更新`)}catch(e){y.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{y.saving=!1,x()}}}function qe(e){let t=y.target||{owner:`ClairKu`,repository:``,branch:`main`,path:``};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${y.settingsOpen?``:`hidden`}>
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
            <input name="owner" value="${e(t.owner||`ClairKu`)}" required />
          </label>
          <label>仓库
            <input name="repository" value="${e(t.repository||``)}" placeholder="clair-ai-studio" required />
          </label>
          <label>分支
            <input name="branch" value="${e(t.branch||`main`)}" required />
          </label>
          <label class="editor-path-field">HTML 文件路径
            <input name="path" value="${e(t.path||``)}" placeholder="docs/reports/example/index.html" required />
          </label>
        </div>
        <label>Fine-grained personal access token
          <input class="github-token-input" name="github-token-not-password" type="text" value=""
            autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-1p-ignore
            placeholder="${y.token?`已连接；留空可继续使用当前 Token`:`github_pat_…`}" ${y.token?``:`required`} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">取消</button>
          <button type="submit" class="primary-button">${y.pendingSave?`连接并保存`:`保存设置`}</button>
        </div>
      </form>
    </div>`}function Je(e){let t=y.target?`${y.target.owner}/${y.target.repository} · ${y.target.path}`:`尚未识别 GitHub 文件路径`;return`
    <div class="dialog-backdrop editor-publish-backdrop" ${y.publishConfirmOpen?``:`hidden`}>
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
          <strong>${e(t)}</strong>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-publish">继续编辑</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">确认推送生产</button>
        </div>
      </section>
    </div>`}function Ye({pendingSave:e=!1}={}){y.settingsOpen=!0,y.pendingSave=e;let t=document.querySelector(`.editor-settings-backdrop`);if(!t)return;t.hidden=!1;let n=t.querySelector(`#editor-settings-form`),r=y.target||{};if(n){n.elements.owner.value=r.owner||`ClairKu`,n.elements.repository.value=r.repository||``,n.elements.branch.value=r.branch||`main`,n.elements.path.value=r.path||``;let t=n.querySelector(`button[type="submit"]`);t&&(t.textContent=e?`连接并保存`:`保存设置`)}}function T(){y.settingsOpen=!1,y.pendingSave=!1;let e=document.querySelector(`.editor-settings-backdrop`);e&&(e.hidden=!0)}function Xe(){y.publishConfirmOpen=!0;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!1)}function E(){y.publishConfirmOpen=!1;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!0)}function Ze(e=``){return!!(y.reportId&&(!e||y.reportId===e))}function Qe(e,{render:t,showToast:n,saveLocal:r=null}){Ie(),Object.assign(y,{reportId:e.id,reportTitle:e.title,reportUrl:e.url,status:`loading`,render:t,showToast:n,isLocal:!!(Pe(e)&&r),saveLocal:r}),t(),y.loadPromise=Fe(e)}function $e(e,t){let n=y.isLocal?`本地成果 · 保存在当前浏览器`:y.target?`${y.target.owner}/${y.target.repository} · ${y.target.path}${y.target.mirrors?.length?` · 同步 ${y.target.mirrors.length+1} 处`:``}`:`尚未识别 GitHub 源文件`,r=be(),i=y.status===`ready`?`
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
      </div>`:``,a=y.status===`loading`?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${y.isLocal?`修改后可保存回成果库，也可下载 HTML。`:`会自动识别对应 GitHub 仓库与源文件。`}</p></div>`:y.status===`error`?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${t(y.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${t(e.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${xe(y.editorDocument)}"></iframe></div>`,o=e=>({back:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>`,settings:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>`,stash:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>`,preview:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,download:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>`,copy:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`,publish:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>`})[e],s=!y.dirty&&y.hasDraft?`已暂存`:`暂存修改`,c=y.saving?y.isLocal?`正在保存到成果库`:`正在推送生产`:y.isLocal?`保存到成果库`:`推送生产`;return`
    <main class="reader-shell report-editor-shell compact-editor-shell">
      <header class="reader-header editor-header compact-reader-header compact-editor-header">
        <button class="reader-icon-button back-button" type="button" data-editor-action="exit"
          aria-label="退出编辑" title="退出编辑">${o(`back`)}</button>
        <div class="reader-title">
          <strong>${t(e.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${r.tone}">${t(r.label)}</span>
            <span class="editor-target-label" title="${t(n)}">${t(n)}</span>
          </div>
        </div>
        <div class="reader-actions editor-actions compact-reader-actions compact-editor-actions" aria-label="编辑操作">
          ${y.isLocal?``:`
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${o(`settings`)}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${s}" title="${s}"
            ${y.status!==`ready`||y.saving||!y.dirty?`disabled`:``}>${o(`stash`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${y.status!==`ready`||!y.hasDraft?`disabled`:``}>${o(`preview`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${o(`download`)}</button>
          ${e.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${o(`copy`)}</button>`:``}
          <button class="reader-icon-button publish-icon-action${y.saving?` is-saving`:``}" type="button"
            data-editor-action="publish" aria-label="${c}" title="${c}"
            ${y.status!==`ready`||y.saving||!y.dirty&&!y.hasDraft?`disabled`:``}>${o(`publish`)}</button>
        </div>
      </header>
      ${i}
      ${a}
      ${qe(t)}
      ${Je(t)}
    </main>`}function et(e){if(!Ze(e.id))return;me||(me=!0,window.addEventListener(`message`,e=>{let t=Le();if(!(!t?.contentWindow||e.source!==t.contentWindow)&&e.data?.channel===v){if(e.data.type===`dirty`&&(y.dirty=!0,y.lastCommit=``,x()),e.data.type===`serialized`){let t=b.get(e.data.requestId);if(!t)return;b.delete(e.data.requestId),t.resolve(e.data.html)}e.data.type===`selection`&&document.querySelectorAll(`[data-editor-command]`).forEach(t=>{let n=t.dataset.editorCommand;[`bold`,`italic`,`underline`].includes(n)&&t.classList.toggle(`active`,!!e.data[n])})}}),window.addEventListener(`beforeunload`,e=>{!y.reportId||!y.dirty||(e.preventDefault(),e.returnValue=``)}),window.addEventListener(`keydown`,e=>{e.key!==`Escape`||!y.reportId||(y.publishConfirmOpen?E():y.settingsOpen&&T())})),document.querySelectorAll(`[data-editor-command]`).forEach(e=>{e.addEventListener(`mousedown`,e=>e.preventDefault()),e.addEventListener(`click`,()=>Re(e.dataset.editorCommand))});let t=document.querySelector(`[data-editor-format]`);t?.addEventListener(`change`,()=>{Re(`formatBlock`,t.value),t.value=`p`}),document.querySelectorAll(`[data-editor-action]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.editorAction;if(n===`exit`){if(y.dirty&&!confirm(`还有未暂存的修改。确定退出编辑模式吗？`))return;let e=y.render;Ie(),e?.()}else if(n===`settings`)Ye();else if(n===`close-settings`)T();else if(n===`stash`)try{await w(e)}catch(e){y.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`preview`)try{Ue(e),y.showToast?.(`已在新窗口打开暂存修订`)}catch(e){y.showToast?.(e?.message||`无法打开预览`)}else if(n===`publish`)try{if(y.isLocal){await We(e);return}if(y.dirty&&await w(e,{silent:!0}),!y.hasDraft){y.showToast?.(`当前没有待推送的修订`);return}Xe()}catch(e){y.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`close-publish`)E();else if(n===`confirm-publish`)E(),!y.token||!y.target?.path?Ye({pendingSave:!0}):await Ke(e);else if(n===`download`)try{Be(await Oe(await C()),e.title),y.showToast?.(`HTML 已下载`)}catch(e){y.showToast?.(e?.message||`下载失败`)}else if(n===`download-published`)await tt(e,y.showToast);else if(n===`share`)try{await Ve(e.url),y.showToast?.(`报告链接已复制`)}catch{y.showToast?.(`复制失败，请从地址栏复制`)}else if(n===`link`){let e=prompt(`输入链接地址（https://…）`);if(!e)return;try{let t=new URL(e);if(![`http:`,`https:`,`mailto:`].includes(t.protocol))throw Error();Re(`createLink`,t.href)}catch{y.showToast?.(`请输入有效的 http、https 或 mailto 链接`)}}else n===`retry`&&(y.status=`loading`,y.error=``,y.render?.(),y.loadPromise||=Fe(e))})}),document.querySelectorAll(`.editor-settings-backdrop, .editor-publish-backdrop`).forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&(e.classList.contains(`editor-settings-backdrop`)?T():E())})});let n=document.getElementById(`editor-settings-form`);n?.addEventListener(`submit`,async t=>{t.preventDefault();let r=new FormData(n),i=String(r.get(`github-token-not-password`)||``).trim();i&&(y.token=i);let a=String(r.get(`path`)||``).trim().replace(/^\/+/,``);y.target={...y.target||{},owner:String(r.get(`owner`)||``).trim(),repository:String(r.get(`repository`)||``).trim(),branch:String(r.get(`branch`)||`main`).trim(),path:a,mirrors:a===y.target?.path&&y.target?.mirrors||[],source:`manual`};let o=y.pendingSave;T();let s=document.querySelector(`.editor-target-label`);if(s){let e=`${y.target.owner}/${y.target.repository} · ${y.target.path}`;s.textContent=e,s.title=e}y.showToast?.(`保存权限已连接`),o&&await Ke(e)})}async function tt(e,t){try{let n=await fetch(e.url,{cache:`no-store`});if(!n.ok)throw Error();Be(await n.text(),e.title),t?.(`HTML 已下载`)}catch{window.open(e.url,`_blank`,`noopener,noreferrer`),t?.(`浏览器限制了直接下载，已打开原页面`)}}async function nt(e,t){try{await Ve(e.url),t?.(`报告链接已复制`)}catch{t?.(`复制失败，请从地址栏复制`)}}var rt={production:`生产 直达 public`,org:`组织 登录 restricted`,account:`账号 登录 restricted`};function D(e=``){return String(e).normalize(`NFKC`).toLocaleLowerCase(`zh-CN`).normalize(`NFD`).replace(/\p{Diacritic}/gu,``).replace(/\s+/g,` `).trim()}function it(e=``){return D(e).split(` `).filter(Boolean)}function at(e,t,{group:n={},workTypeName:r=``}={}){let i=it(t);if(!i.length)return!0;let a=D([e.title,e.source,e.url,e.access,rt[e.access],r,...e.tags||[],n.name,n.description].filter(Boolean).join(` `));return i.every(e=>a.includes(e))}var ot=`clair-service-report-workbench-v1`,st=`clair-service-report-workbench-access`,O=`clair-service-report-workbench-view`,k=8,ct=[{id:`requirement-review`,name:`需求评审`},{id:`reporting`,name:`汇报材料`},{id:`competitive-research`,name:`竞品调研`},{id:`product-planning`,name:`产品规划`},{id:`data-analysis`,name:`数据分析`},{id:`investment-research`,name:`投研分析`},{id:`governance-review`,name:`治理审查`},{id:`product-demo`,name:`原型 Demo`}],lt=[`手动保存`,`生产`,`个人`,`HTML`,`本体`,`飞书`,`调研`,`产品规划`,`AI 小顾`,`AI 工作台`,`AI 开放平台`,`且慢`,`OAP`,`MCP`,`Skills`,`投顾服务`,`投研`,`数据分析`,`需求评审`,`经营汇报`,`知识治理`],A={version:k,groups:[{id:`inbox`,name:`待整理`,description:`临时入口，等待归档`,accent:`slate`,position:0},{id:`xiaogu`,name:`AI 小顾与投顾服务`,description:`AI 小顾、顾问服务与客户体验`,accent:`green`,position:1},{id:`ai-workbench`,name:`AI 工作台与生产力`,description:`个人工作台、评审工具与 AI 生产力`,accent:`blue`,position:2},{id:`ai-platform`,name:`AI 开放平台`,description:`OAP、MCP、Skills、Agents 与治理`,accent:`violet`,position:3},{id:`product-planning`,name:`且慢产品与体验`,description:`产品规划、体验分析与交互方案`,accent:`blue`,position:4},{id:`research`,name:`投研与策略研究`,description:`基金、策略与资产配置研究`,accent:`amber`,position:5},{id:`reporting`,name:`经营分析与汇报`,description:`业务分析、周报与管理汇报`,accent:`blue`,position:6},{id:`knowledge`,name:`知识治理与组织协同`,description:`本体、飞书、SOUL 与知识资产`,accent:`slate`,position:7}],reports:[{id:`workbench-quality-audit-2026-07-30`,groupId:`ai-workbench`,title:`Clair's Studio｜全站质量审计与修复报告`,url:`https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/`,preview:`workbench-quality-audit-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-29T18:20:00.000Z`,source:`生产质量审计`,access:`production`},{id:`seed-mcp-benchmark`,groupId:`ai-platform`,title:`三家金融 MCP / Skills 服务最完整对比｜010350 同题实测`,url:`https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/`,pinned:!0,position:0,createdAt:`2026-07-28T10:00:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-fund-report`,groupId:`research`,title:`东方财富妙想版｜010350 基金深度诊断`,url:`https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/`,pinned:!1,position:1,createdAt:`2026-07-28T09:30:00.000Z`,source:`近月新增`,access:`production`},{id:`storage-big-three-fund-screening`,groupId:`research`,title:`存储三巨头基金筛选｜境内 QDII 与港股通`,url:`https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T04:49:24.000Z`,source:`盈米 Skills / MCP`,access:`production`},{id:`seed-agreement`,groupId:`ai-platform`,title:`盈米 MCP 协议审查台`,url:`https://clairku.github.io/yingmi-mcp-agreement-review/`,pinned:!0,position:0,createdAt:`2026-07-28T08:50:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-xiaogu`,groupId:`xiaogu`,title:`且慢小顾介绍｜AI 投资助手`,url:`https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/`,pinned:!1,position:1,createdAt:`2026-07-27T07:40:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-strategy`,groupId:`research`,title:`公募策略多指标双轴探索器｜四笔钱`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html`,pinned:!1,position:0,createdAt:`2026-07-27T07:20:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-ecosystem`,groupId:`ai-platform`,title:`盈米 AI 实验室｜服务组件编排 Demo`,url:`https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/`,pinned:!1,position:2,createdAt:`2026-07-26T14:40:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-library-index`,groupId:`knowledge`,title:`且慢产品研究页面库｜原始总入口`,url:`https://clairku.github.io/qieman-product-research-library/`,pinned:!0,position:0,createdAt:`2026-07-26T09:23:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-inventory`,groupId:`product-planning`,title:`且慢投顾模块现况盘点报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html`,pinned:!1,position:0,createdAt:`2026-07-24T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-direction-research`,groupId:`product-planning`,title:`且慢 APP 投顾模块｜现况盘点与改版方向`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html`,pinned:!1,position:1,createdAt:`2026-07-23T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-v09`,groupId:`product-planning`,title:`且慢投顾页改版｜方向与方案设计 V0.9`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html`,pinned:!0,position:2,createdAt:`2026-07-24T09:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-network-research`,groupId:`product-planning`,title:`且慢产品现况网络调研报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html`,pinned:!1,position:3,createdAt:`2026-07-24T09:20:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-final`,groupId:`product-planning`,title:`且慢投顾页改版｜推荐方案定稿与备选`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html`,pinned:!1,position:4,createdAt:`2026-07-24T09:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-demo`,groupId:`product-planning`,title:`且慢投顾页改版交互 Demo｜方案 B`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html`,pinned:!1,position:5,createdAt:`2026-07-24T09:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-plan`,groupId:`product-planning`,title:`且慢投顾页改版｜产品规划与计划书`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html`,pinned:!1,position:6,createdAt:`2026-07-24T09:50:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-home-entry-analysis`,groupId:`xiaogu`,title:`且慢 App 首页金刚位分析报告｜修正版`,url:`https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8`,pinned:!1,position:2,createdAt:`2026-07-23T10:00:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-advisor-click-analysis`,groupId:`product-planning`,title:`且慢投顾页点击与转化分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html`,pinned:!1,position:7,createdAt:`2026-07-24T10:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-map`,groupId:`xiaogu`,title:`且慢 APP 完整功能全景`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html`,pinned:!1,position:3,createdAt:`2026-07-24T10:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-deep-analysis`,groupId:`xiaogu`,title:`且慢 App 深度产品分析报告`,url:`https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN`,pinned:!1,position:4,createdAt:`2026-07-24T10:20:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-app-usage`,groupId:`xiaogu`,title:`且慢 APP 使用情况与证据`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html`,pinned:!1,position:5,createdAt:`2026-07-24T10:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-roadmap`,groupId:`xiaogu`,title:`且慢 APP 深度产品判断与路线图`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html`,pinned:!1,position:6,createdAt:`2026-07-24T10:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-ai-native`,groupId:`xiaogu`,title:`且慢 APP AI 原生转型三案`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html`,pinned:!0,position:7,createdAt:`2026-07-24T10:50:00.000Z`,source:`研究库`,access:`production`},{id:`oap-progress-roadmap`,groupId:`ai-platform`,title:`OAP 进展与规划汇报`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html`,pinned:!1,position:3,createdAt:`2026-07-24T11:00:00.000Z`,source:`研究库`,access:`production`},{id:`oap-metrics-trend`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜上线以来运营趋势`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html`,pinned:!0,position:4,createdAt:`2026-07-28T10:11:00.000Z`,source:`近月新增`,access:`production`},{id:`oap-reporting-framework`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html`,pinned:!0,position:5,createdAt:`2026-07-30T08:00:00.000Z`,source:`OAP 管理层汇报成稿`,access:`production`},{id:`oap-traffic-analysis`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜全站访问与点击分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html`,pinned:!0,position:6,createdAt:`2026-07-28T12:10:00.000Z`,source:`近月新增`,access:`production`},{id:`eastmoney-platform`,groupId:`ai-platform`,title:`东方财富 AI Skills 平台深度竞品分析`,url:`https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/`,pinned:!1,position:7,createdAt:`2026-07-28T08:57:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-strategy-explorer`,groupId:`research`,title:`四笔钱策略检视台｜筛选、对比与全指标分析`,url:`https://clairku.github.io/qieman-strategy-explorer/`,pinned:!1,position:2,createdAt:`2026-07-27T16:43:00.000Z`,source:`近月新增`,access:`production`},{id:`financial-planning-review`,groupId:`research`,title:`财务规划报告｜现金流与目标可达性改稿建议`,url:`https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/`,pinned:!1,position:3,createdAt:`2026-07-27T11:27:00.000Z`,source:`近月新增`,access:`production`},{id:`investment-behavior-report`,groupId:`research`,title:`投资行为画像｜行为金融洞察报告（脱敏版）`,url:`https://clairku.github.io/my-investment-behavior-report/`,pinned:!1,position:4,createdAt:`2026-07-16T14:56:00.000Z`,source:`近月新增`,access:`production`},{id:`product-review-workbench`,groupId:`product-planning`,title:`产品需求评审工作台`,url:`https://clairku.github.io/product-review-workbench/`,pinned:!0,position:8,createdAt:`2026-07-08T06:43:00.000Z`,source:`近月新增`,access:`production`},{id:`community-ai-review`,groupId:`product-planning`,title:`社区 AI 运营方案｜需求评审报告`,url:`https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/`,pinned:!1,position:9,createdAt:`2026-07-28T08:20:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-review`,groupId:`reporting`,title:`金榛子奖申报材料审查报告`,url:`https://clairku.github.io/jinzhenzi-submission-review/`,pinned:!1,position:0,createdAt:`2026-07-28T11:01:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-history`,groupId:`reporting`,title:`金榛子奖历届获奖项目档案`,url:`https://clairku.github.io/jinzhenzi-submission-review/history.html`,pinned:!1,position:1,createdAt:`2026-07-28T11:20:00.000Z`,source:`近月新增`,access:`production`},{id:`xiaogu-user-needs`,groupId:`xiaogu`,title:`小顾用户需求分析与关键钩子工具方案`,url:`https://clairku.github.io/xiaogu-user-needs-report/`,pinned:!1,position:8,createdAt:`2026-07-16T09:58:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-ai-advisor-ecosystem`,groupId:`xiaogu`,title:`且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo`,url:`https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site`,pinned:!0,position:9,createdAt:`2026-07-26T15:05:00.000Z`,source:`近月新增`,access:`account`},{id:`oap-h2-plan`,groupId:`reporting`,title:`2026 下半年 AI 开放平台目标计划与里程碑`,url:`https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf`,pinned:!1,position:2,createdAt:`2026-07-26T09:00:00.000Z`,source:`研究库`,access:`org`},{id:`ai-productization-roadshow-2026-07-30`,groupId:`reporting`,title:`AI 产品化实践路演｜CEO / CTO`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/`,pinned:!0,position:0,createdAt:`2026-07-30T00:00:00.000Z`,source:`CEO / CTO 路演材料`,access:`production`},{id:`advisor-report-skill-ai-practice`,groupId:`reporting`,title:`AI 工具实践案例｜顾问报告 Skill`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T15:30:00.000Z`,source:`顾问报告 Skill 材料`,access:`production`},{id:`ai-weekly-2026-07-13`,groupId:`reporting`,title:`AI 项目周报｜2026-07-13`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/`,pinned:!1,position:3,createdAt:`2026-07-13T02:20:23.000Z`,source:`近月补录`,access:`production`},{id:`pension-business-analysis`,groupId:`reporting`,title:`盈米及且慢养老金业务分析`,url:`https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/`,pinned:!1,position:4,createdAt:`2026-07-13T08:47:33.000Z`,source:`近月补录`,access:`production`},{id:`advisor-2-business-onboarding`,groupId:`reporting`,title:`盈米投顾 2.0｜新负责人业务入职报告`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/`,pinned:!1,position:5,createdAt:`2026-07-13T09:12:10.000Z`,source:`近月补录`,access:`production`},{id:`schwab-ria-benchmark`,groupId:`reporting`,title:`嘉信 2026 RIA 基准调研｜对盈米与且慢的启示`,url:`https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/`,pinned:!1,position:6,createdAt:`2026-07-22T02:40:53.000Z`,source:`近月补录`,access:`production`},{id:`skill-audit-2026-07-16`,groupId:`ai-workbench`,title:`25 项 Skills 可用性与一致性审查`,url:`https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/`,pinned:!1,position:0,createdAt:`2026-07-16T03:30:04.000Z`,source:`近月补录`,access:`production`},{id:`html-editor-guide`,groupId:`ai-workbench`,title:`Clair's Studio｜HTML 编辑器使用与安全说明`,url:`https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/`,pinned:!0,position:1,createdAt:`2026-07-29T16:00:00.000Z`,source:`产品能力`,access:`production`},{id:`yingmi-ai-capability-system`,groupId:`ai-platform`,title:`盈米 AI 能力体系专业报告｜2026.07`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/`,pinned:!1,position:8,createdAt:`2026-07-13T09:43:42.000Z`,source:`近月补录`,access:`production`}]},ut={"workbench-quality-audit-2026-07-30":`governance-review`,"seed-mcp-benchmark":`competitive-research`,"seed-fund-report":`investment-research`,"storage-big-three-fund-screening":`investment-research`,"seed-agreement":`governance-review`,"seed-xiaogu":`product-planning`,"seed-strategy":`investment-research`,"seed-ecosystem":`product-demo`,"qieman-library-index":`governance-review`,"qieman-advisor-inventory":`product-planning`,"qieman-advisor-direction-research":`product-planning`,"qieman-advisor-v09":`product-planning`,"qieman-network-research":`competitive-research`,"qieman-advisor-final":`product-planning`,"qieman-advisor-demo":`product-demo`,"qieman-advisor-plan":`product-planning`,"qieman-home-entry-analysis":`data-analysis`,"qieman-advisor-click-analysis":`data-analysis`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`data-analysis`,"qieman-app-usage":`data-analysis`,"qieman-app-roadmap":`product-planning`,"qieman-ai-native":`product-planning`,"oap-progress-roadmap":`reporting`,"oap-metrics-trend":`data-analysis`,"oap-reporting-framework":`reporting`,"oap-traffic-analysis":`data-analysis`,"eastmoney-platform":`competitive-research`,"qieman-strategy-explorer":`investment-research`,"financial-planning-review":`requirement-review`,"investment-behavior-report":`data-analysis`,"product-review-workbench":`product-demo`,"community-ai-review":`requirement-review`,"jinzhenzi-review":`governance-review`,"jinzhenzi-history":`competitive-research`,"xiaogu-user-needs":`product-planning`,"qieman-ai-advisor-ecosystem":`product-demo`,"oap-h2-plan":`reporting`,"ai-productization-roadshow-2026-07-30":`reporting`,"advisor-report-skill-ai-practice":`reporting`,"ai-weekly-2026-07-13":`reporting`,"pension-business-analysis":`reporting`,"advisor-2-business-onboarding":`reporting`,"schwab-ria-benchmark":`competitive-research`,"skill-audit-2026-07-16":`governance-review`,"html-editor-guide":`product-demo`,"yingmi-ai-capability-system":`reporting`},dt={"qieman-home-entry-analysis":`product-planning`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`product-planning`,"qieman-app-usage":`product-planning`,"qieman-app-roadmap":`product-planning`,"financial-planning-review":`xiaogu`,"investment-behavior-report":`xiaogu`,"product-review-workbench":`ai-workbench`,"community-ai-review":`ai-workbench`,"qieman-ai-advisor-ecosystem":`ai-platform`,"oap-h2-plan":`ai-platform`};function j(e){let t=`${e.title||``} ${e.source||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/需求评审|评审工作台/.test(t)?`requirement-review`:/竞品|对比|调研|研究/.test(t)?`competitive-research`:/周报|汇报|进展|规划|里程碑|业务分析/.test(t)?`reporting`:/数据|趋势|点击|转化|画像|使用/.test(t)?`data-analysis`:/基金|策略|投研|资产配置/.test(t)?`investment-research`:/审查|治理|知识/.test(t)?`governance-review`:/Demo|Studio|工作台|原型/i.test(t)?`product-demo`:`product-planning`}function M(e,t=j(e)){let n=`${e.id||``} ${e.groupId||``} ${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`,r=[],i=e=>{r.includes(e)||r.push(e)};return e.manualSaved&&i(`手动保存`),e.isProduction&&i(`生产`),e.isPersonal&&i(`个人`),e.isHtml&&i(`HTML`),/ontology\.yingmi-inc\.com|本体/.test(n)&&i(`本体`),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(n)&&i(`飞书`),(t===`competitive-research`||/调研|研究|盘点/.test(n))&&i(`调研`),t===`product-planning`&&i(`产品规划`),(/xiaogu|小顾|财务规划|投资行为/.test(n)||e.groupId===`xiaogu`)&&i(`AI 小顾`),(/studio|workbench|工作台|skill-audit/i.test(n)||e.groupId===`ai-workbench`)&&i(`AI 工作台`),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(n)||e.groupId===`ai-platform`)&&i(`AI 开放平台`),/且慢|qieman/.test(n)&&i(`且慢`),/投顾|advisor|财务规划/.test(n)&&i(`投顾服务`),/OAP|oap-/.test(n)&&i(`OAP`),/MCP|mcp-/.test(n)&&i(`MCP`),/Skills|skill-/.test(n)&&i(`Skills`),(t===`investment-research`||e.groupId===`research`)&&i(`投研`),t===`data-analysis`&&i(`数据分析`),t===`requirement-review`&&i(`需求评审`),t===`reporting`&&i(`经营汇报`),(t===`governance-review`||e.groupId===`knowledge`)&&i(`知识治理`),r.slice(0,5)}function ft(e){let t=`${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(t)?`xiaogu`:/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(t)?`ai-platform`:/Studio|工作台|生产力|Copilot|编辑器/i.test(t)?`ai-workbench`:/基金|投研|策略|资产配置|股票|债券/.test(t)?`research`:/汇报|周报|月报|经营|进展|里程碑/.test(t)?`reporting`:/知识|SOUL|飞书|治理|本体|文档库/.test(t)?`knowledge`:/且慢|产品|需求|方案|原型|体验|PRD/i.test(t)?`product-planning`:{"requirement-review":`product-planning`,"competitive-research":`product-planning`,reporting:`reporting`,"data-analysis":`reporting`,"investment-research":`research`,"governance-review":`knowledge`,"product-demo":`ai-workbench`,"product-planning":`product-planning`}[e.workType]||`inbox`}A.reports=A.reports.map(e=>{let t=dt[e.id]||e.groupId,n=ut[e.id]||j(e),r={...e,groupId:t,workType:n};return{...r,tags:M(r,n)}});var N=ht(),P=``,F=``,I=!1,L=[`topic`,`type`,`tag`,`time`].includes(localStorage.getItem(O))?localStorage.getItem(O):`topic`,R=``,z=``,B=``,V=null,pt=0;function mt(e){return JSON.parse(JSON.stringify(e))}function H(e=``){try{let t=new URL(e);t.hash=``,t.search=``;let n=decodeURI(t.pathname).replace(/\/index\.html$/,`/`).replace(/\/+$/,`/`);return`${t.origin}${n}`}catch{return String(e).trim().replace(/\/+$/,`/`)}}function ht(){try{let e=JSON.parse(localStorage.getItem(ot));if(Array.isArray(e?.groups)&&Array.isArray(e?.reports))return gt(e)}catch{}return mt(A)}function gt(e){let t=mt(A),n=new Set(t.groups.map(e=>e.id)),r=new Set([`inbox`,`today`,`product`,`research`]),i=new Map(e.groups.map(e=>[e.id,e])),a=t.groups.map(t=>{let n=i.get(t.id);return!n||e.version<k?t:{...t,name:n.name||t.name,description:n.description||t.description,position:Number.isFinite(n.position)?n.position:t.position}});e.groups.filter(e=>!n.has(e.id)&&!r.has(e.id)).forEach((e,t)=>{a.push({...e,description:e.description||`自定义工作分组`,position:Number.isFinite(e.position)?e.position:A.groups.length+t})});let o=a.filter((e,t,n)=>n.findIndex(t=>t.id===e.id)===t);o.sort((e,t)=>(e.position||0)-(t.position||0));let s={"seed-mcp-benchmark":`ai-platform`,"seed-fund-report":`research`,"seed-agreement":`ai-platform`,"seed-xiaogu":`xiaogu`,"seed-strategy":`research`,"seed-ecosystem":`ai-platform`,"storage-big-three-fund-screening":`research`},c={inbox:`inbox`,today:`product-planning`,product:`xiaogu`,research:`research`},l=e.reports.map(e=>({...e,groupId:dt[e.id]||s[e.id]||c[e.groupId]||e.groupId||`inbox`,workType:e.workType||ut[e.id]||j(e),tags:Array.isArray(e.tags)&&e.tags.length?e.tags:M(e,e.workType||ut[e.id])})),u=new Map(l.map(e=>[e.id,e])),d=new Map(l.map(e=>[H(e.url),e])),f=new Set,p=new Set,m=t.reports.map(t=>{let n=H(t.url);f.add(n),p.add(t.id);let r=u.get(t.id)||d.get(n);return r?{...t,title:e.version>=k&&r.title||t.title,groupId:e.version>=k&&o.some(e=>e.id===r.groupId)?r.groupId:t.groupId,workType:e.version>=k&&r.workType?r.workType:t.workType,tags:e.version>=k&&Array.isArray(r.tags)&&r.tags.length?r.tags:t.tags,pinned:!!r.pinned,position:Number.isFinite(r.position)?r.position:t.position,archived:!!r.archived,archivedAt:r.archivedAt||``}:t});l.forEach(e=>{let t=H(e.url);p.has(e.id)||t&&f.has(t)||(p.add(e.id),t&&f.add(t),m.push(e))});let h={version:k,groups:o,reports:m};return localStorage.setItem(ot,JSON.stringify(h)),h}function U(){N.version=k,N.groups.forEach((e,t)=>{e.position=t}),localStorage.setItem(ot,JSON.stringify(N))}function _t(e=``){return(String(e).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(Z)||``}function vt(e,t,n){let r=W(e,t).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,` `).trim();if(r)return r.slice(0,100);let i=String(e).split(/\n/).map(e=>e.trim().replace(/^#+\s*/,``)).find(e=>e&&!/^https?:\/\//i.test(e));return i?i.replace(/[。；;！!？?]+$/,``).slice(0,100):t[0]?.name?t[0].name.replace(/\.[^.]+$/,``).slice(0,100):n?X(n):`未命名成果`}function yt(e=``){return String(e).trim().replace(/\s+/g,` `).toLocaleLowerCase()}function bt(e=[]){return e.map(e=>`${String(e.name||``).trim().toLocaleLowerCase()}:${e.size||0}:${e.type||``}`).sort().join(`|`)}function xt({material:e,files:t,url:n,excludeId:r=``}){let i=n?H(n):``,a=yt(e),o=bt(t);return N.reports.find(e=>e.id===r?!1:i&&H(e.url)===i||a&&yt(e.savedContent)===a?!0:!a&&!!o&&bt(e.savedFiles)===o)||null}function St(e=``){try{let t=new URL(e),n=t.hostname.toLowerCase(),r=t.pathname.split(`/`).filter(Boolean)[0]?.toLowerCase();return n===`clairku.github.io`||(n===`github.com`||n===`raw.githubusercontent.com`)&&r===`clairku`}catch{return!1}}function Ct(e=``){try{return/\.html?$/i.test(new URL(e).pathname)}catch{return!1}}function W(e=``,t=[]){if(/<!doctype\s+html|<html[\s>]/i.test(e))return e.trim();let n=t.find(e=>/\.html?$/i.test(e.name));return n?.content||n?.excerpt||``}function wt(e=``){try{let t=new URL(e).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(t))return{access:`org`,provider:`飞书组织帐号`};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(t))return{access:`account`,provider:`腾讯文档帐号`};if(/(^|\.)yingmi-inc\.com$/.test(t))return{access:`org`,provider:`盈米组织帐号`};if(t===`github.com`&&/^\/login(?:\/|$)/.test(new URL(e).pathname))return{access:`account`,provider:`GitHub 帐号`}}catch{return null}return null}async function Tt(e){if(!Z(e))return{title:``,description:``,reachable:!1,checked:!0};let t=new URL(e);if(t.origin!==window.location.origin)return{title:``,description:``,reachable:!1,checked:!1};try{let e=await fetch(t.href,{headers:{Accept:`text/html`},signal:AbortSignal.timeout(1e4)});if(!e.ok)return{title:``,description:``,reachable:!1,checked:!0};let n=await e.text(),r=new DOMParser().parseFromString(n,`text/html`);return{title:r.title.trim().slice(0,180),description:r.querySelector(`meta[name="description"]`)?.getAttribute(`content`)?.trim().slice(0,500)||``,reachable:!0,checked:!0}}catch{return{title:``,description:``,reachable:!1,checked:!1}}}async function Et({material:e=``,files:t=[],url:n=``},r=()=>{}){let i=W(e,t),a=t.some(e=>/\.html?$/i.test(e.name));if(!n)return i?{allowed:!0,access:`local`,metadata:{title:``,description:``,reachable:!0,checked:!0},isHtml:!0,savedHtml:i,loginProvider:``}:{allowed:!1,reason:a?`HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML`:`只能保存可正常访问的网址或 HTML 内容`};let o=wt(n);r(o?`正在识别权限页面与登录入口…`:`正在检查页面是否可正常访问…`);let s=o?{title:``,description:``,reachable:!0,checked:!0}:await Tt(n);return!o&&s.checked&&!s.reachable?{allowed:!1,reason:`页面无法正常访问，且不是可读取的 HTML，未保存`}:{allowed:!0,access:o?.access||`production`,metadata:s,isHtml:Ct(n),savedHtml:``,loginProvider:o?.provider||``}}async function Dt({material:e,files:t},n=()=>{}){let r=_t(e);n(`正在检查成果库是否已有相同内容…`);let i=xt({material:e,files:t,url:r});if(i)return{...i,duplicate:!0,groupName:N.groups.find(e=>e.id===i.groupId)?.name||`待整理`,workTypeName:G(i.workType)};let a=await Et({material:e,files:t,url:r},n);if(!a.allowed)return{rejected:!0,duplicate:!1,reason:a.reason};let o=vt(e,t,r),s=a.metadata;n(`正在识别标题、分组、类型与标签…`);let c=new Date().toISOString(),l={id:Ft(`report`),groupId:`inbox`,title:s.title||o,url:r,pinned:!1,position:0,createdAt:c,source:r?`快捷保存`:`本地保存`,access:a.access,archived:!1,archivedAt:``,savedContent:e,savedFiles:t,detectedDescription:s.description,manualSaved:!0,isProduction:a.access===`production`,isPersonal:St(r),isHtml:a.isHtml,savedHtml:a.savedHtml,loginProvider:a.loginProvider};l.workType=j(l),l.groupId=ft(l),l.tags=M(l,l.workType),n(`正在保存到成果库…`),l.position=N.reports.filter(e=>!e.archived&&e.groupId===l.groupId).length,N.reports.push(l);try{U()}catch{return N.reports.pop(),{rejected:!0,duplicate:!1,reason:`HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试`}}return I=!1,L!==`time`&&(L=`topic`),P=``,localStorage.setItem(O,L),{...l,duplicate:!1,groupName:N.groups.find(e=>e.id===l.groupId)?.name||`待整理`,workTypeName:G(l.workType)}}function Ot(e,t){let n=N.groups.findIndex(t=>t.id===e),r=N.groups.findIndex(e=>e.id===t);if(n<0||r<0||n===r)return!1;let[i]=N.groups.splice(n,1);return N.groups.splice(r,0,i),U(),!0}function kt(e,t,n=``){let r=N.reports.find(t=>t.id===e);if(!r||r.archived||!N.groups.find(e=>e.id===t))return!1;let i=N.reports.filter(n=>!n.archived&&n.groupId===t&&n.id!==e).sort((e,t)=>(e.position||0)-(t.position||0)),a=n?i.findIndex(e=>e.id===n):i.length;return r.groupId=t,i.splice(a<0?i.length:a,0,r),i.forEach((e,t)=>{e.position=t}),U(),!0}function G(e){return ct.find(t=>t.id===e)?.name||`产品规划`}function At(e){let t=new Date(e.createdAt||0).getTime();return Number.isFinite(t)?t:0}function jt(e){let t=new Date(e||0);return Number.isFinite(t.getTime())?[t.getFullYear(),String(t.getMonth()+1).padStart(2,`0`),String(t.getDate()).padStart(2,`0`)].join(`-`):`unknown`}function Mt(e){if(e===`unknown`)return`时间待补`;let[t,n,r]=e.split(`-`).map(Number),i=new Date(t,n-1,r),a=new Date,o=jt(a),s=new Date(a.getFullYear(),a.getMonth(),a.getDate()-1),c=new Intl.DateTimeFormat(`zh-CN`,{month:`numeric`,day:`numeric`,weekday:`short`}).format(i);return e===o?`今天 · ${c}`:e===jt(s)?`昨天 · ${c}`:t===a.getFullYear()?c:`${t}年 · ${c}`}function Nt(e){let t=new Date(e||0);return Number.isFinite(t.getTime())?`新增于 ${new Intl.DateTimeFormat(`zh-CN`,{month:`numeric`,day:`numeric`,hour:`2-digit`,minute:`2-digit`,hour12:!1}).format(t)}`:`新增时间待补`}function Pt(e,t=``){let n=e=>!t||D(e).includes(t);if(L===`time`){let t=new Map;return[...e].sort((e,t)=>At(t)-At(e)).forEach(e=>{let n=jt(e.createdAt);t.has(n)||t.set(n,[]),t.get(n).push(e)}),[...t.entries()].map(([e,t])=>({id:e,name:Mt(e),kind:`time`,accent:`slate`,reports:t}))}if(L===`type`)return ct.map(t=>({id:t.id,name:t.name,kind:`type`,accent:`blue`,reports:e.filter(e=>e.workType===t.id).sort((e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>!t||e.reports.length||n(e.name));if(L===`tag`){let r=new Set(lt);return N.reports.forEach(e=>{(e.tags||[]).forEach(e=>r.add(e))}),[...r].sort((e,t)=>{let n=lt.indexOf(e),r=lt.indexOf(t);return n>=0||r>=0?(n<0?2**53-1:n)-(r<0?2**53-1:r):e.localeCompare(t,`zh-CN`)}).map(t=>({id:t,name:t,kind:`tag`,accent:`violet`,reports:e.filter(e=>(e.tags||[]).includes(t)).sort((e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>e.reports.length&&(!t||n(e.name)||e.reports.length))}return N.groups.map(t=>({...t,kind:`topic`,reports:e.filter(e=>e.groupId===t.id).sort((e,t)=>(e.position||0)-(t.position||0))})).filter(e=>!t||e.reports.length||n(`${e.name} ${e.description||``}`))}function K(e,t,n,r=``){let i=N.reports.find(t=>t.id===e);return!i||i.archived?!1:t===`topic`?kt(e,n,r):t===`type`?ct.some(e=>e.id===n)?(i.workType=n,U(),!0):!1:t===`tag`?(i.tags=Array.isArray(i.tags)?i.tags:[],i.tags.includes(n)||i.tags.push(n),U(),!0):!1}function q(){return L===`type`?`工作类型`:L===`tag`?`标签`:L===`time`?`新增时间`:`主题`}function Ft(e){return`${e}-${crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}`}function J(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}var It={back:`
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
    </svg>`};function Y(e){return It[e]||``}function X(e){try{return new URL(e).hostname.replace(/^www\./,``)}catch{return e}}function Z(e){try{return[`http:`,`https:`].includes(new URL(e).protocol)}catch{return!1}}function Lt(e=``){return[...new Set(String(e).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function Q(e){document.querySelector(`.toast`)?.remove();let t=document.createElement(`div`);t.className=`toast`,t.setAttribute(`role`,`status`),t.textContent=e,document.body.append(t),clearTimeout(pt),pt=window.setTimeout(()=>t.remove(),2600)}function Rt(e){return e.savedHtml||W(e.savedContent,e.savedFiles)}function zt(e){return`${String(e.title||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,` `).trim().slice(0,80)||`report`}.html`}function Bt(e){let t=Rt(e);return t?URL.createObjectURL(new Blob([t],{type:`text/html;charset=utf-8`})):``}function Vt(e){let t=Bt(e);if(!t)return!1;let n=document.createElement(`a`);return n.href=t,n.download=zt(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(t),1e3),!0}function Ht(e){let t=e.url||Bt(e);return t?(window.open(t,`_blank`,`noopener,noreferrer`),e.url||window.setTimeout(()=>URL.revokeObjectURL(t),6e4),!0):!1}function Ut(e,t=!1){let n=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),r=[`org`,`account`].includes(e.access),i=e.access===`org`?`需组织登录`:e.access===`account`?`需账号登录`:`生产可访问`,a=Rt(e),o=L===`time`?Nt(e.createdAt):e.source||`手动添加`,s=!r&&A.reports.some(t=>t.id===e.id),c=e.preview||`${e.id}.png`,l=a&&e.isHtml?`<iframe class="local-html-preview-frame" title="${J(e.title)}视觉预览"
        srcdoc="${J(a)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:s?`<img src="./previews/${J(c)}" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${r?`preview-restricted`:``}">
        <span>${r?`ACCESS`:J(e.title.slice(0,2))}</span>
        <strong>${r?i:n?`本地内容`:`预览待补充`}</strong>
      </div>`;return`
    <article class="report-card ${r?`restricted-card`:``} ${t?`archived-card`:``} ${B===e.id?`is-move-selected`:``}" data-report-id="${J(e.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${J(e.id)}" aria-label="打开${J(e.title)}">
        <span class="report-preview">
          ${l}
        </span>
        <span class="report-copy">
          <span class="report-source">${J(o)}</span>
          <strong>${J(e.title)}</strong>
          ${(e.tags||[]).length?`<span class="report-tags">${e.tags.slice(0,3).map(e=>`<span>${J(e)}</span>`).join(``)}</span>`:``}
          ${r?`<span class="report-access-note">${J(i)}</span>`:``}
        </span>
      </button>
      ${t||L===`time`?``:`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${J(e.id)}"
          aria-label="拖动《${J(e.title)}》到其他${q()}" title="拖动到其他${q()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${t?`
            <button type="button" data-action="restore" data-id="${J(e.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${J(e.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${J(e.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${e.url?`<button type="button" data-action="edit" data-id="${J(e.id)}">编辑</button>`:``}
            <button type="button" data-action="archive" data-id="${J(e.id)}">归档</button>`}
      </div>
    </article>`}function Wt(){if(!V)return``;if(V.type===`tags`){let e=N.reports.find(e=>e.id===V.reportId);return e?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${J(e.title)}</p>
          <label>标签
            <input name="tags" value="${J((e.tags||[]).join(`、`))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${lt.map(t=>`<button type="button" class="${(e.tags||[]).includes(t)?`selected`:``}" data-tag-suggestion="${J(t)}">${J(t)}</button>`).join(``)}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:``}if(V.type===`group`){let e=V.mode===`edit`?N.groups.find(e=>e.id===V.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${e?`编辑工作主题`:`新建工作主题`}</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${J(e?.name||``)}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${J(e?.description||``)}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${e?`保存修改`:`创建主题`}</button>
          </div>
        </form>
      </div>`}let e=V.mode===`edit`?N.reports.find(e=>e.id===V.reportId):null,t=e?.groupId||V.groupId||N.groups[0]?.id||``;return`
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${e?`EDIT REPORT`:`NEW REPORT`}</span>
            <h2>${e?`编辑服务报告`:`新增服务报告`}</h2>
          </div>
          <button type="button" data-action="close-modal">×</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${J(e?.url||``)}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${e?`修改网址后可重新识别`:`保存时会自动识别网页标题`}</small>
        </label>
        <label>报告标题
          <input name="title" value="${J(e?.title||``)}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${N.groups.map(e=>`<option value="${J(e.id)}" ${e.id===t?`selected`:``}>${J(e.name)}</option>`).join(``)}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${ct.map(t=>`<option value="${J(t.id)}" ${t.id===(e?.workType||`product-planning`)?`selected`:``}>${J(t.name)}</option>`).join(``)}
          </select>
        </label>
        <label>关键标签
          <input name="tags" value="${J((e?.tags||[]).join(`、`))}" placeholder="本体、飞书、调研" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function Gt(){return`
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
    </main>`}function Kt(e){if(Ze(e.id))return $e(e,J);let t=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),n=[`org`,`account`].includes(e.access),r=e.loginProvider||wt(e.url)?.provider||(e.access===`org`?`组织帐号`:`站点帐号`),i=e.savedHtml||W(e.savedContent,e.savedFiles),a=i?`edit-local-document`:e.url?n?`edit`:`edit-document`:``,o=i?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${J(e.title)}"
          srcdoc="${J(i)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:t?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${J(e.title)}</h1>
          ${e.savedContent?`<div class="saved-material-content">${J(e.savedContent).replaceAll(`
`,`<br />`)}</div>`:``}
          ${(e.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${e.savedFiles.map(e=>`<span><b>${J(e.name)}</b><small>${J(e.sizeLabel||``)}</small></span>`).join(``)}
              </section>`:``}
          <p class="saved-material-note">内容保存在当前浏览器；原文件不会上传到 GitHub Pages。</p>
        </article>
      </div>`:n?`
      <div class="login-handoff-wrap">
        <section class="login-handoff-card" aria-labelledby="login-handoff-title">
          <div class="login-handoff-icon" aria-hidden="true">↗</div>
          <span class="section-kicker">${e.access===`org`?`ORGANIZATION SIGN-IN`:`ACCOUNT SIGN-IN`}</span>
          <h1 id="login-handoff-title">请在新窗口完成登录</h1>
          <p>该页面需要${r}验证。登录页受浏览器安全策略保护，不能嵌入工作台，因此这里不再显示空白页面。</p>
          <ol class="login-handoff-steps">
            <li><span>1</span><div><strong>打开登录页</strong><small>点击下方按钮，会进入浏览器顶层新窗口。</small></div></li>
            <li><span>2</span><div><strong>手动完成验证</strong><small>使用你的${r}登录，验证码与授权只在原网站处理。</small></div></li>
            <li><span>3</span><div><strong>继续查看报告</strong><small>登录成功后留在新窗口阅读，工作台仍保留在当前页。</small></div></li>
          </ol>
          <div class="login-handoff-actions">
            <a class="primary-button" href="${J(e.url)}" target="_blank" rel="noreferrer">打开${J(r)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${J(X(e.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${J(e.title)}" src="${J(e.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${Y(`back`)}</button>
        <div class="reader-title">
          <strong>${J(e.title)}</strong>
          <span>${t?`本地保存`:J(X(e.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${a?`
            <button class="reader-icon-button" type="button" data-action="${a}"
              data-id="${J(e.id)}" aria-label="编辑" title="编辑">
              ${Y(`edit`)}
            </button>`:``}
          ${e.url&&e.access===`production`?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${J(e.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${Y(`copy`)}
            </button>`:``}
          ${!n&&(e.url||i)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${J(e.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${Y(`download`)}
            </button>`:``}
          ${e.url||i?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${J(e.id)}"
              aria-label="${n?`打开${J(r)}登录页`:`在浏览器打开`}"
              title="${n?`打开${J(r)}登录页`:`在浏览器打开`}">
              ${Y(`external`)}
            </button>`:``}
        </div>
      </header>
      ${o}
      ${Wt()}
    </main>`}function qt(e){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${I?`<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>`:``}
    </header>`}function Jt(){let e=N.reports.filter(e=>e.archived).filter(e=>at(e,P,{group:N.groups.find(t=>t.id===e.groupId),workTypeName:G(e.workType)})).sort((e,t)=>new Date(t.archivedAt||0)-new Date(e.archivedAt||0)),t=N.reports.filter(e=>e.archived).length;return`
    <main class="app-shell archive-shell">
      ${qt(t)}
      <section class="workspace archive-workspace">
        <div class="archive-hero">
          <div>
            <span class="eyebrow">SAFE ARCHIVE · REVERSIBLE</span>
            <h1>先收起来，<br />随时找回来。</h1>
            <p>归档只会让报告离开主目录，不会删除内容。预览、主题和原始入口都会保留，也可以随时恢复。</p>
          </div>
          <div class="archive-total"><strong>${t}</strong><span>份已归档</span></div>
        </div>
        <label class="search archive-search">
          <span aria-hidden="true">⌕</span>
          <input id="search-input" value="${J(P)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${P?`<button type="button" data-action="clear-search">清除</button>`:``}
        </label>
        ${e.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${P?`搜索结果`:`归档内容`}</h2><p>按最近归档时间排列</p></div>
              <span>${e.length} 份</span>
            </div>
            <div class="archive-grid">${e.map(e=>Ut(e,!0)).join(``)}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${P?`没有找到相关归档`:`归档区还是空的`}</h2>
            <p>${P?`换个关键词，或返回查看全部归档内容。`:`在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。`}</p>
            <button class="quiet-button" type="button" data-action="${P?`clear-search`:`show-catalog`}">${P?`清除搜索`:`返回主目录`}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${Wt()}
    </main>`}function Yt(){if(I)return Jt();let e=D(P),t=N.reports.filter(e=>!e.archived),n=e?t.filter(t=>at(t,e,{group:N.groups.find(e=>e.id===t.groupId),workTypeName:G(t.workType)})):t,r=N.reports.filter(e=>e.archived).length,i=t.filter(e=>e.access===`production`).length,a=t.filter(e=>e.access!==`production`).length,o=Pt(n,e).filter(t=>t.reports.length||B||L===`topic`&&!e),s=L===`type`?`工作类型`:L===`tag`?`关键标签`:L===`time`?`新增时间`:`工作主题`;return`
    <main class="app-shell">
      ${qt(r)}
      <section class="workspace">
        ${ie(J)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${J(P)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${P?`<button type="button" data-action="clear-search">清除</button>`:``}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${e?n.length:t.length}</strong><span>${e?`匹配`:`成果`}</span>
              <i></i>
              <strong>${N.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${i}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${B?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${q()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:``}
          ${o.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${s}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${L===`topic`}" class="${L===`topic`?`active`:``}" data-action="set-view" data-id="topic">主题</button>
                    <button type="button" role="tab" aria-selected="${L===`type`}" class="${L===`type`?`active`:``}" data-action="set-view" data-id="type">类型</button>
                    <button type="button" role="tab" aria-selected="${L===`tag`}" class="${L===`tag`?`active`:``}" data-action="set-view" data-id="tag">标签</button>
                    <button type="button" role="tab" aria-selected="${L===`time`}" class="${L===`time`?`active`:``}" data-action="set-view" data-id="time">时间</button>
                  </div>
                  <button class="add-topic-icon" type="button" data-action="add-group"
                    aria-label="添加主题" title="添加主题">＋</button>
                </div>
                ${o.map((e,t)=>`<a href="#bucket-${t}"><span class="nav-index">${String(t+1).padStart(2,`0`)}</span>${J(e.name)}<span>${e.reports.length}</span></a>`).join(``)}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${r?`<em>${r}</em>`:``}
                </button>
              </nav>
              <div class="board catalog-view-${L}">
              ${o.map((e,t)=>`
                <section id="bucket-${t}" class="group-column topic-section bucket-${J(e.kind)} accent-${J(e.accent||`blue`)}"
                  data-bucket-kind="${J(e.kind)}"
                  data-bucket-id="${J(e.id)}"
                  ${e.kind===`topic`?`data-group-id="${J(e.id)}"`:``}>
                  <header class="group-header">
                    ${e.kind===`topic`?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${J(e.id)}"
                          aria-label="拖动“${J(e.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(t+1).padStart(2,`0`)}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${e.kind===`tag`?`#`:e.kind===`time`?`时`:`类`}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${J(e.name)}</h2></div>
                      <span class="count">${e.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${B?`<button class="move-here-button" type="button" data-action="move-here" data-id="${J(e.id)}" data-bucket-kind="${J(e.kind)}">移到这里</button>`:``}
                      ${e.kind===`topic`?`<button type="button" data-action="add-to-group" data-id="${J(e.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${J(e.id)}">编辑主题</button>
                           ${e.id===`inbox`?``:`<button type="button" data-action="delete-group" data-id="${J(e.id)}">删除</button>`}`:``}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${e.reports.length?e.reports.map(e=>Ut(e)).join(``):e.kind===`topic`?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${J(e.id)}">
                            <strong>拖报告到这里</strong>
                            <span>或点击添加第一份报告</span>
                          </button>`:`<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>`}
                  </div>
                </section>`).join(``)}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到“${J(P.trim())}”</strong>
              <span>可搜索标题、标签、来源、任务类型或主题</span>
              <button type="button" data-action="clear-search">清除搜索</button>
            </div>`}
          <div class="catalog-note">
            <span>${a} 份报告需要组织或账号登录${r?` · ${r} 份已安全归档`:``}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${Wt()}
    </main>`}function $(){let e=document.getElementById(`app`);if(sessionStorage.getItem(st)!==`ok`){e.innerHTML=Gt(),Xt();return}let t=F&&N.reports.find(e=>e.id===F);e.innerHTML=t?Kt(t):Yt(),Qt(),ae({render:$,showToast:Q,saveToLibrary:Dt})}function Xt(){let e=document.getElementById(`login-form`);e?.addEventListener(`submit`,t=>{if(t.preventDefault(),new FormData(e).get(`password`)!==`2026`){let t=e.querySelector(`.form-error`);t.hidden=!1,t.textContent=`口令不正确，请再试一次`;return}sessionStorage.setItem(st,`ok`),$()})}async function Zt(e){let t=e.elements.url,n=e.elements.title,r=e.querySelector(`[data-action="detect-title"]`),i=e.querySelector(`.field-hint`),a=t.value.trim();if(!Z(a))return i.textContent=`请输入完整的 http 或 https 网址`,``;r.disabled=!0,r.innerHTML=`<span class="mini-spinner"></span>`,i.textContent=`正在读取网页标题…`;try{let{title:e}=await Tt(a);if(!e)throw Error(`read failed`);return n.value=e,i.textContent=`已识别网页标题`,n.value}catch{let e=X(a);return n.value||=e,i.textContent=`网页暂时无法读取，已用域名作为标题，你可以手动修改`,n.value}finally{r.disabled=!1,r.textContent=`识别标题`}}function Qt(){let e=document.getElementById(`search-input`);e?.addEventListener(`input`,e=>{if(e.isComposing)return;P=e.target.value;let t=e.target.selectionStart,n=e.target.selectionEnd;$();let r=document.getElementById(`search-input`);r?.focus(),r?.setSelectionRange(t,n)}),e?.addEventListener(`keydown`,e=>{e.key!==`Escape`||!P||(e.preventDefault(),P=``,$(),document.getElementById(`search-input`)?.focus())}),document.querySelectorAll(`[data-action]`).forEach(e=>{e.addEventListener(`click`,async e=>{let t=e.currentTarget.dataset.action,n=e.currentTarget.dataset.id;if(t===`open`)F=n,$();else if(t===`edit-document`){let e=N.reports.find(e=>e.id===n);if(!e||e.access!==`production`)return;Qe(e,{render:$,showToast:Q})}else if(t===`edit-local-document`){let e=N.reports.find(e=>e.id===n);if(!e||!Rt(e))return;Qe(e,{render:$,showToast:Q,saveLocal:async t=>{let n=e.savedHtml;e.savedHtml=t,e.isHtml=!0,e.tags=M(e,e.workType);try{U()}catch{throw e.savedHtml=n,Error(`修改后的 HTML 超过当前浏览器可保存容量，请先下载备份`)}}})}else if(t===`download-report`){let e=N.reports.find(e=>e.id===n);if(!e)return;Rt(e)?Vt(e)&&Q(`HTML 已下载`):await tt(e,Q)}else if(t===`share-report`||t===`copy-production-url`){let e=N.reports.find(e=>e.id===n);e?.url&&await nt(e,e=>{Q(e===`报告链接已复制`?`生产 URL 已复制`:e)})}else if(t===`open-browser`){let e=N.reports.find(e=>e.id===n);if(!e)return;Ht(e)||Q(`浏览器未能打开该报告`)}else if(t===`back`)F=``,V=null,$();else if(t===`lock`)sessionStorage.removeItem(st),$();else if(t===`clear-search`)P=``,$(),document.getElementById(`search-input`)?.focus();else if(t===`set-view`){if(![`topic`,`type`,`tag`,`time`].includes(n))return;L=n,B=``,localStorage.setItem(O,L),$()}else if(t===`cancel-move`)B=``,$();else if(t===`move-here`){let t=e.currentTarget.dataset.bucketKind||L;B&&K(B,t,n)&&(B=``,$(),Q(t===`tag`?`已添加目标标签`:`报告已移入目标${q()}`))}else if(t===`show-archive`)I=!0,P=``,F=``,$();else if(t===`show-catalog`)I=!1,P=``,F=``,$();else if(t===`add-report`)V={type:`report`,mode:`create`,groupId:N.groups[1]?.id||N.groups[0]?.id},$();else if(t===`add-to-group`)V={type:`report`,mode:`create`,groupId:n},$();else if(t===`edit`)V={type:`report`,mode:`edit`,reportId:n},$();else if(t===`edit-tags`)V={type:`tags`,reportId:n},$();else if(t===`close-modal`)V=null,$();else if(t===`detect-title`)await Zt(e.currentTarget.closest(`form`));else if(t===`archive`){let e=N.reports.find(e=>e.id===n);if(!e)return;e.archived=!0,e.archivedAt=new Date().toISOString(),U(),$(),Q(`已归档，可随时恢复`)}else if(t===`restore`){let e=N.reports.find(e=>e.id===n);if(!e)return;e.archived=!1,e.archivedAt=``,U(),$(),Q(`报告已恢复到原主题`)}else if(t===`delete`){let e=N.reports.find(e=>e.id===n);e?.archived&&confirm(`二次确认：永久删除“${e.title}”？\n\n删除后无法从归档区恢复。`)&&(N.reports=N.reports.filter(e=>e.id!==n),F===n&&(F=``),U(),$(),Q(`报告已永久删除`))}else if(t===`add-group`)V={type:`group`,mode:`create`},$();else if(t===`rename-group`)N.groups.find(e=>e.id===n)&&(V={type:`group`,mode:`edit`,groupId:n},$());else if(t===`delete-group`){let e=N.groups.find(e=>e.id===n);e&&confirm(`删除“${e.name}”？其中的报告会移到“待整理”。`)&&(N.reports.forEach(e=>{e.groupId===n&&(e.groupId=`inbox`)}),N.groups=N.groups.filter(e=>e.id!==n),U(),$(),Q(`分组已删除，报告已移到待整理`))}})}),document.querySelectorAll(`.report-drag-handle`).forEach(e=>{let t=null,n=!1,r=()=>{R=``,t=null,n=!1,e.closest(`.report-card`)?.classList.remove(`is-dragging`),document.querySelectorAll(`.report-card, .group-column`).forEach(e=>{e.classList.remove(`is-card-drop-target`,`is-drop-ready`)})};e.addEventListener(`pointerdown`,r=>{r.preventDefault(),R=e.dataset.reportDragId,z=``,t={x:r.clientX,y:r.clientY},n=!1,e.setPointerCapture?.(r.pointerId),e.closest(`.report-card`)?.classList.add(`is-dragging`)}),e.addEventListener(`pointermove`,r=>{if(!R||t&&Math.hypot(r.clientX-t.x,r.clientY-t.y)<7)return;n=!0;let i=document.elementFromPoint(r.clientX,r.clientY),a=i?.closest(`.report-card`),o=i?.closest(`.group-column`);document.querySelectorAll(`.report-card`).forEach(t=>{t.classList.toggle(`is-card-drop-target`,!!(a&&a!==e.closest(`.report-card`)&&t===a))}),document.querySelectorAll(`.group-column`).forEach(e=>{e.classList.toggle(`is-drop-ready`,!!(o&&e===o))})}),e.addEventListener(`pointerup`,e=>{if(!R)return;let t=R;if(!n){B=t,r(),$(),Q(`请选择目标${q()}`);return}let i=document.elementFromPoint(e.clientX,e.clientY),a=i?.closest(`.report-card`),o=i?.closest(`.group-column`),s=a?.dataset.reportId||``,c=o?.dataset.bucketId||``,l=o?.dataset.bucketKind||L,u=s&&s!==t?K(t,l,c,s):c?K(t,l,c):!1;r(),u&&($(),Q(l===`tag`?`已添加目标标签`:l===`type`?`工作类型已更新`:s?`报告顺序已更新`:`已移入新主题`))}),e.addEventListener(`pointercancel`,r)}),document.querySelectorAll(`.group-drag-handle`).forEach(e=>{let t=()=>{z=``,e.closest(`.group-column`)?.classList.remove(`is-group-dragging`),document.querySelectorAll(`.group-column`).forEach(e=>{e.classList.remove(`is-group-drop-target`,`is-drop-ready`)})};e.addEventListener(`pointerdown`,t=>{t.preventDefault(),z=e.dataset.groupDragId,R=``,e.setPointerCapture?.(t.pointerId),e.closest(`.group-column`)?.classList.add(`is-group-dragging`)}),e.addEventListener(`pointermove`,e=>{z&&document.querySelectorAll(`.group-column`).forEach(t=>{t.classList.toggle(`is-group-drop-target`,t===document.elementFromPoint(e.clientX,e.clientY)?.closest(`.group-column`))})}),e.addEventListener(`pointerup`,e=>{if(!z)return;let n=z,r=document.elementFromPoint(e.clientX,e.clientY)?.closest(`.group-column`);if(r&&Ot(n,r.dataset.groupId)){z=``,$(),Q(`分组顺序已更新`);return}t()}),e.addEventListener(`pointercancel`,t),e.addEventListener(`keydown`,t=>{if(![`ArrowLeft`,`ArrowRight`].includes(t.key))return;t.preventDefault();let n=N.groups.findIndex(t=>t.id===e.dataset.groupDragId),r=t.key===`ArrowLeft`?n-1:n+1,i=N.groups[r];!i||!Ot(e.dataset.groupDragId,i.id)||($(),Q(`分组顺序已更新`),document.querySelector(`[data-group-drag-id="${CSS.escape(e.dataset.groupDragId)}"]`)?.focus())})}),document.querySelectorAll(`.group-column`).forEach(e=>{e.addEventListener(`dragover`,t=>{t.preventDefault(),e.classList.add(z?`is-group-drop-target`:`is-drop-ready`)}),e.addEventListener(`dragleave`,()=>{e.classList.remove(`is-drop-ready`,`is-group-drop-target`)}),e.addEventListener(`drop`,t=>{if(t.preventDefault(),z){if(e.dataset.bucketKind===`topic`&&Ot(z,e.dataset.groupId)){z=``,$(),Q(`分组顺序已更新`);return}z=``,e.classList.remove(`is-group-drop-target`);return}let n=N.reports.find(e=>e.id===R),r=e.dataset.bucketKind||L;n&&K(R,r,e.dataset.bucketId)&&(R=``,$(),Q(r===`tag`?`已添加目标标签`:r===`type`?`工作类型已更新`:`已移入新主题`)),R=``})}),document.querySelectorAll(`[data-tag-suggestion]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=document.querySelector(`#tag-form input[name="tags"]`);if(!t)return;let n=Lt(t.value),r=e.dataset.tagSuggestion;t.value=n.includes(r)?n.filter(e=>e!==r).join(`、`):[...n,r].slice(0,8).join(`、`),e.classList.toggle(`selected`,!n.includes(r)),t.focus()})});let t=document.getElementById(`tag-form`);t?.addEventListener(`submit`,e=>{e.preventDefault();let n=N.reports.find(e=>e.id===V.reportId);n&&(n.tags=Lt(new FormData(t).get(`tags`)),U(),V=null,$(),Q(`标签已更新`))});let n=document.getElementById(`group-form`);n?.addEventListener(`submit`,e=>{e.preventDefault();let t=new FormData(n).get(`name`)?.trim(),r=new FormData(n).get(`description`)?.trim();if(!t)return;if(V.mode===`edit`){let e=N.groups.find(e=>e.id===V.groupId);if(!e)return;e.name=t.slice(0,60),e.description=r?.slice(0,80)||`自定义工作主题`}else N.groups.push({id:Ft(`group`),name:t.slice(0,60),description:r?.slice(0,80)||`自定义工作主题`,accent:[`blue`,`violet`,`amber`,`green`][N.groups.length%4],position:N.groups.length}),L=`topic`,localStorage.setItem(O,L);U();let i=V.mode===`edit`?`工作主题已更新`:`工作主题已创建，可直接拖入报告`;V=null,$(),Q(i)});let r=document.getElementById(`report-form`);r?.addEventListener(`submit`,async e=>{e.preventDefault();let t=r.elements.url.value.trim();if(!Z(t))return;let n=r.querySelector(`button[type="submit"]`),i=r.querySelector(`.field-hint`);n.disabled=!0,n.innerHTML=`<span class="mini-spinner"></span>`;let a=xt({material:t,files:[],url:t,excludeId:V.mode===`edit`?V.reportId:``});if(a){n.disabled=!1,n.textContent=`保存`,i.textContent=`成果库已有“${a.title}”，未重复保存`,Q(`成果库已有“${a.title}”，未重复保存`);return}let o=await Et({material:t,files:[],url:t},e=>{i.textContent=e});if(!o.allowed){n.disabled=!1,n.textContent=`保存`,i.textContent=o.reason,Q(o.reason);return}let s=r.elements.title.value.trim()||o.metadata.title,c=r.elements.groupId.value,l=r.elements.workType.value,u=Lt(r.elements.tags.value),d={title:s||X(t),url:t,groupId:c,workType:l,source:`手动添加`,access:o.access,detectedDescription:o.metadata.description,manualSaved:!0,isProduction:o.access===`production`,isPersonal:St(t),isHtml:o.isHtml,loginProvider:o.loginProvider},f=[...new Set([...M(d,l),...u])].slice(0,8);if(V.mode===`edit`){let e=N.reports.find(e=>e.id===V.reportId);Object.assign(e,d,{tags:f})}else{let e={id:Ft(`report`),groupId:c,...d,pinned:!1,position:N.reports.filter(e=>e.groupId===c).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:``,tags:f};N.reports.push(e)}U(),V=null,$(),Q(`报告已保存`)});let i=F&&N.reports.find(e=>e.id===F);i&&et(i)}function $t(){$()}$t(document.getElementById(`app`));