const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./lib-DZSZPu5o.js","./jszip.min-HHwTHcn1.js","./pptx-preview.es-qpklzjky.js"])))=>i.map(i=>d[i]);
var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(e){throw n=[e],e}},s=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),c=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r},l=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},u=(n,r,a)=>(a=n==null?{}:e(i(n)),l(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n)),d=e=>a.call(e,`module.exports`)?e[`module.exports`]:l(t({},`__esModule`,{value:!0}),e),f=(e=>typeof require<`u`?require:typeof Proxy<`u`?new Proxy(e,{get:(e,t)=>(typeof require<`u`?require:e)[t]}):e)(function(e){if(typeof require<`u`)return require.apply(this,arguments);throw Error('Calling `require` for "'+e+"\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.")});(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var p=[`.pdf`,`.html`,`.htm`,`.png`,`.jpg`,`.jpeg`,`.webp`,`.doc`,`.docx`,`.xls`,`.xlsx`,`.ppt`,`.pptx`,`.md`,`.markdown`].join(`,`),m=[{kind:`pdf`,label:`PDF`,extensions:[`pdf`],mime:[`application/pdf`],preview:`pdf`},{kind:`html`,label:`HTML`,extensions:[`html`,`htm`],mime:[`text/html`],preview:`html`},{kind:`image`,label:`PNG`,extensions:[`png`],mime:[`image/png`],preview:`image`},{kind:`image`,label:`IMAGE`,extensions:[`jpg`,`jpeg`,`webp`],mime:[`image/jpeg`,`image/webp`],preview:`image`},{kind:`word`,label:`WORD`,extensions:[`doc`,`docx`],mime:[`application/msword`,`application/vnd.openxmlformats-officedocument.wordprocessingml.document`],preview:`word`},{kind:`excel`,label:`EXCEL`,extensions:[`xls`,`xlsx`],mime:[`application/vnd.ms-excel`,`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`],preview:`excel`},{kind:`ppt`,label:`PPT`,extensions:[`ppt`,`pptx`],mime:[`application/vnd.ms-powerpoint`,`application/vnd.openxmlformats-officedocument.presentationml.presentation`],preview:`ppt`},{kind:`markdown`,label:`MD`,extensions:[`md`,`markdown`],mime:[`text/markdown`],preview:`text`}];function h(e=``){return String(e).split(`.`).pop()?.toLowerCase()||``}function g(e={}){let t=h(e.name),n=String(e.type||``).toLowerCase(),r=m.find(e=>e.extensions.includes(t)||e.mime.includes(n));return r?{...r,extension:t,supported:!0}:{kind:`file`,label:t?t.toUpperCase().slice(0,8):`FILE`,extension:t,preview:`download`,supported:!1}}function ee(e={}){return g(e).supported}var te=[{id:`save`,name:`Save`,hint:`Recognize and add to the library`},{id:`decision`,name:`Decide`,hint:`Copy a decision brief`},{id:`review`,name:`Review`,hint:`Copy a review brief`}],ne={save:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11"></path>
      <path d="m8 11 4 4 4-4"></path>
      <path d="M5 19h14"></path>
    </svg>`,decision:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8l2 3-2 3H8z"></path>
      <path d="M12 10v10"></path>
      <path d="M12 14H7l-2 3 2 3h5"></path>
    </svg>`,review:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8"></circle>
      <path d="m8.5 12 2.3 2.3 4.8-5"></path>
    </svg>`,upload:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 12 5.8-5.8a3 3 0 1 1 4.2 4.2l-7.2 7.2a5 5 0 0 1-7.1-7.1l7.5-7.5"></path>
    </svg>`,close:`
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18"></path>
    </svg>`},re=[{id:`requirement`,name:`需求评审`},{id:`solution`,name:`方案评审`},{id:`decision`,name:`决策推演`},{id:`agreement`,name:`协议审查`},{id:`career`,name:`履历评估`}],_=ie();function ie(){return{material:``,files:[]}}function ae(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}function oe(e){let t=e.toLowerCase(),n=[[`agreement`,[`协议`,`合同`,`条款`,`保密`,`签署`,`数据处理`]],[`career`,[`简历`,`履历`,`候选人`,`晋升`,`岗位`,`面试`]],[`decision`,[`决策`,`选型`,`取舍`,`是否推进`,`选择`]],[`requirement`,[`需求`,`prd`,`用户故事`,`验收`,`原型`]],[`solution`,[`方案`,`流程`,`架构`,`设计`,`上线`]]].find(([,e])=>e.some(e=>t.includes(e)))?.[0]||`solution`;return re.find(e=>e.id===n)||re[1]}function se(e,t,n){let r=(e.files||[]).map(e=>`- ${e.name}${e.sizeLabel?`（${e.sizeLabel}）`:``}`).join(`
`);return[`Task: ${n===`decision`?`Decision`:`Review`}`,`Matched skill: ${t.name}`,``,`Material:`,e.material||`(No pasted text)`,r?`\nAttachments:\n${r}`:``].filter(Boolean).join(`
`)}function ce(e){return e<1024?`${e} B`:e<1024*1024?`${Math.ceil(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}async function le(e){let t=[...e];return Promise.all(t.map(async e=>{let t=g(e),n=e.type.startsWith(`text/`)||/\.(md|txt|csv|json|html|xml)$/i.test(e.name),r=/\.html?$/i.test(e.name),i=``,a=``;if(n&&e.size<=1024*1024)try{let t=await e.text();i=t.slice(0,12e3),r&&(a=t)}catch{i=``,a=``}return{id:ae(),name:e.name,type:e.type||`application/octet-stream`,size:e.size,sizeLabel:ce(e.size),kind:t.kind,format:t.label,extension:t.extension,previewMode:t.preview,excerpt:i,content:a,blob:e}}))}async function ue(e){let t=[...e],n=t.filter(ee),r=Math.max(0,20-_.files.length),i=n.slice(0,r),a=await le(i);return _.files.push(...a),{added:a.length,unsupported:t.length-n.length,overflow:Math.max(0,n.length-i.length)}}function de(e){let t=[`已加入 ${e.added} 个文件`];return e.unsupported&&t.push(`${e.unsupported} 个格式不支持`),e.overflow&&t.push(`${e.overflow} 个超过 20 个上限`),t.join(` · `)}function fe(e){return _.files.length?`<div class="attachment-list">${_.files.map(t=>`
    <span class="attachment-chip file-kind-${e(t.kind||`file`)}" title="${e(t.format||`FILE`)} · ${e(t.name)}">
      <span class="attachment-format">${e(t.format||`FILE`)}</span>
      <span class="attachment-copy"><b>${e(t.name)}</b><small>${e(t.sizeLabel)}</small></span>
      <button type="button" aria-label="移除 ${e(t.name)}"
        data-task-action="remove-file" data-file-id="${t.id}">${ne.close}</button>
    </span>`).join(``)}</div>`:``}function pe(e){return te.map(t=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${t.id}" aria-label="${e(t.name)}"
      title="${e(t.name)} · ${e(t.hint)}">
      ${ne[t.id]}
    </button>`).join(``)}function me(e){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer ${_.material.trim()||_.files.length?`has-intake-content`:``}" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="Set an idea in motion"
            placeholder="Set an idea in motion">${e(_.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="Actions">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="Attach files" title="Attach files">
              <input id="task-files" type="file" accept="${p}" multiple />
              ${ne.upload}
            </label>
            ${pe(e)}
          </div>
        </div>
        ${fe(e)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function he({render:e,showToast:t,saveToLibrary:n}){document.querySelectorAll(`[data-task-action]`).forEach(t=>{t.addEventListener(`click`,async t=>{t.currentTarget.dataset.taskAction===`remove-file`&&(ge(),_.files=_.files.filter(e=>e.id!==t.currentTarget.dataset.fileId),e())})});let r=document.getElementById(`task-composer`);r?.addEventListener(`submit`,async i=>{if(i.preventDefault(),ge(),!_.material.trim()&&!_.files.length){t(`先粘贴内容，或加入一份材料`),document.getElementById(`task-goal`)?.focus();return}let a=i.submitter?.dataset.submitAction||`save`,o=i.submitter,s={material:_.material.trim(),files:_.files};if(a===`save`){let i=r.querySelector(`#intake-save-status`),a=[...r.querySelectorAll(`button, textarea, input`)],c=e=>{a.forEach(e=>{e.disabled=!0}),r.setAttribute(`aria-busy`,`true`),r.classList.add(`is-saving`),i.hidden=!1,i.querySelector(`strong`).textContent=e,o.setAttribute(`aria-label`,`保存中`),o.innerHTML=`<span class="mini-spinner"></span>`};c(`正在检查成果库与页面访问状态…`);try{let r=await n(s,c);if(r.rejected){e(),t(r.reason);return}if(r.duplicate){e(),t(`成果库已有“${r.title}” · 位于“${r.groupName}”，未重复保存`);return}_=ie(),e(),t(`已保存到“${r.groupName}” · ${r.workTypeName} · 标签：${r.tags.join(` / `)||`待补标签`}`)}catch{a.forEach(e=>{e.disabled=!1}),e(),t(`保存失败，请稍后重试`)}return}let c=oe([s.material,...s.files.map(e=>`${e.name}\n${e.excerpt}`)].join(`
`)),l=a===`decision`?re.find(e=>e.id===`decision`):c.id===`decision`?re.find(e=>e.id===`solution`):c;try{await navigator.clipboard.writeText(se(s,l,a)),t(`${a===`decision`?`Decision`:`Review`} brief copied`)}catch{t(`Copy failed — select the material and try again`);return}_=ie(),e()}),document.getElementById(`task-files`)?.addEventListener(`change`,async n=>{ge();let r=await ue(n.target.files);e(),t(de(r))});let i=document.querySelector(`.prompt-composer`);i?.addEventListener(`dragover`,e=>{e.preventDefault(),i.classList.add(`drag-over`)}),i?.addEventListener(`dragleave`,()=>i.classList.remove(`drag-over`)),i?.addEventListener(`drop`,async n=>{n.preventDefault(),n.stopPropagation(),i.classList.remove(`drag-over`),ge();let r=n.dataTransfer.files,a=await ue(r);e(),t(de(a))});let a=document.getElementById(`task-goal`);requestAnimationFrame(()=>_e(a)),a?.addEventListener(`input`,()=>{_.material=a.value,i?.classList.toggle(`has-intake-content`,!!(a.value.trim()||_.files.length)),_e(a)}),a?.addEventListener(`paste`,async n=>{let r=[...n.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean);if(!r.length)return;n.preventDefault();let i=n.clipboardData.getData(`text/plain`),o=a.selectionStart??a.value.length,s=a.selectionEnd??o;_.material=`${a.value.slice(0,o)}${i}${a.value.slice(s)}`;let c=await ue(r);e(),t(`已从剪贴板${de(c)}`)}),be({render:e,showToast:t})}function ge(){let e=document.getElementById(`task-goal`);e&&(_.material=e.value)}function _e(e){if(!e)return;e.style.height=`auto`;let t=Math.min(Math.max(e.scrollHeight,40),180);e.style.height=`${t}px`,e.style.overflowY=e.scrollHeight>180?`auto`:`hidden`}function ve(){document.querySelector(`.prompt-composer`)&&requestAnimationFrame(()=>{document.getElementById(`task-goal`)?.focus({preventScroll:!0})})}function ye(e){return!!e?.closest?.(`input, textarea, select, [contenteditable='true']`)}function be({render:e,showToast:t}){document.onpaste=async n=>{if(ye(n.target)||!document.querySelector(`.prompt-composer`))return;let r=[...n.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean),i=n.clipboardData?.getData(`text/plain`)||``;if(!r.length&&!i.trim())return;n.preventDefault(),_.material=[_.material.trim(),i.trim()].filter(Boolean).join(`

`);let a=r.length?await ue(r):null;e(),requestAnimationFrame(ve),t(a?`已从剪贴板${de(a)}`:`已把粘贴内容放入输入框`)},document.ondragover=e=>{[...e.dataTransfer?.types||[]].includes(`Files`)&&e.preventDefault()},document.ondrop=async n=>{if(n.target?.closest?.(`.prompt-composer`))return;let r=n.dataTransfer?.files||[];if(!r.length)return;n.preventDefault();let i=await ue(r);e(),requestAnimationFrame(ve),t(de(i))}}var xe=`clair-report-editor-v1`,Se=`https://api.github.com`,Ce=`clair-report-editor-draft-v1:`,v={reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,token:``,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null,currentPage:0,pageCount:1},we=new Map,Te=!1,Ee=null;function De(e){return[...new Set(e.filter(Boolean))]}function Oe(e=v.target){return e?{...e.path&&e.sha?{[e.path]:e.sha}:{},...Object.fromEntries((e.mirrors||[]).map(e=>[e.path,e.sha])),...e.baseFiles||{}}:{}}function ke(e){return`${Ce}${e}`}function Ae(e){try{let t=sessionStorage.getItem(ke(e));if(!t)return null;let n=JSON.parse(t);return!n?.html||typeof n.html!=`string`?null:n}catch{return null}}function je(e=v.reportId){try{sessionStorage.removeItem(ke(e))}catch{}}function Me(){return v.dirty&&v.hasDraft?{tone:`changed`,label:v.isLocal?`有新修订 · 上次暂存待保存`:`有新修订 · 上次暂存待推送`}:v.dirty?{tone:`changed`,label:`已修订 · 未暂存`}:v.hasDraft?{tone:`staged`,label:v.isLocal?`已暂存 · 待保存成果库`:`已暂存 · 待推送生产`}:v.lastCommit?{tone:`published`,label:v.isLocal?`成果库 HTML 已更新`:`生产档案已更新`}:{tone:`clean`,label:`未修改`}}function y(){let e=Me(),t=document.querySelector(`.editor-revision-status`);t&&(t.className=`editor-revision-status is-${e.tone}`,t.textContent=e.label);let n=document.querySelector(`[data-editor-action="stash"]`);if(n){n.disabled=v.status!==`ready`||v.saving||!v.dirty;let e=!v.dirty&&v.hasDraft?`已暂存`:`暂存修改`;n.setAttribute(`aria-label`,e),n.title=e}let r=document.querySelector(`[data-editor-action="publish"]`);if(r){r.disabled=v.status!==`ready`||v.saving||!v.dirty&&!v.hasDraft;let e=v.saving?v.isLocal?`正在保存到成果库`:`正在推送生产`:v.isLocal?`保存到成果库`:`推送生产`;r.setAttribute(`aria-label`,e),r.title=e,r.classList.toggle(`is-saving`,v.saving)}let i=document.querySelector(`[data-editor-action="preview"]`);i&&(i.disabled=v.status!==`ready`||v.saving||!v.hasDraft);let a=document.querySelector(`[data-editor-page-counter]`),o=document.querySelector(`[data-editor-page-controls]`);a&&(a.textContent=`${v.currentPage+1} / ${Math.max(1,v.pageCount)}`),o&&(o.hidden=v.pageCount<=1);let s=document.querySelector(`[data-editor-action="prev-page"]`),c=document.querySelector(`[data-editor-action="next-page"]`);s&&(s.disabled=v.currentPage<=0),c&&(c.disabled=v.currentPage>=v.pageCount-1)}function Ne(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function Pe(e){let t=atob(String(e||``).replace(/\s/g,``)),n=Uint8Array.from(t,e=>e.charCodeAt(0));return new TextDecoder().decode(n)}function Fe(e){let t=new TextEncoder().encode(e),n=``,r=32768;for(let e=0;e<t.length;e+=r)n+=String.fromCharCode(...t.subarray(e,e+r));return btoa(n)}async function Ie(e){return{html:e,protection:null}}async function Le(e){return e}function Re(e){try{let t=new URL(e);if(t.hostname.toLowerCase()!==`clairku.github.io`)return null;let n=t.pathname.split(`/`).filter(Boolean).map(decodeURIComponent),r=n.shift()||`ClairKu.github.io`,i=n.join(`/`);(!i||t.pathname.endsWith(`/`))&&(i=`${i?`${i}/`:``}index.html`);let a=De([`docs/${i}`,i,`public/${i}`]);return{owner:`ClairKu`,repository:r,branch:`main`,path:a[0],candidates:a,source:`auto`}}catch{return null}}function ze(e){try{let t=new URL(e);return t.hostname.toLowerCase()!==`clairku.github.io`||!t.pathname.startsWith(`/clair-ai-studio/reports/`)?``:`./reports/${t.pathname.slice(25).replace(/\/+$/,``)}/index.html`}catch{return``}}async function Be(e,{token:t=``,method:n=`GET`,body:r}={}){let i={Accept:`application/vnd.github+json`,"X-GitHub-Api-Version":`2022-11-28`};t&&(i.Authorization=`Bearer ${t}`),r!==void 0&&(i[`Content-Type`]=`application/json`);let a=await fetch(`${Se}${e}`,{method:n,headers:i,body:r===void 0?void 0:JSON.stringify(r)});if(!a.ok){let e=``;try{e=(await a.json())?.message||``}catch{e=await a.text()}let t=Error(e||`GitHub API ${a.status}`);throw t.status=a.status,t}return a.status===204?null:a.json()}async function Ve(e){e.branch=(await Be(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}`)).default_branch||e.branch||`main`;let t=De(e.candidates?.length?e.candidates:[e.path]),n=null,r=null,i=[];for(let a of t)try{let n=a.split(`/`).map(encodeURIComponent).join(`/`),o=await Be(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${n}?ref=${encodeURIComponent(e.branch)}`),s=``;if(o.encoding===`base64`&&o.content)s=Pe(o.content);else if(o.download_url){let e=await fetch(o.download_url,{cache:`no-store`});if(!e.ok)throw Error(`无法读取 GitHub 原始文件`);s=await e.text()}if(!s)throw Error(`GitHub 文件内容为空`);r?s===r.html&&i.push({path:a,sha:o.sha}):r={html:s,target:{...e,path:a,sha:o.sha,candidates:t}}}catch(e){if(n=e,e.status&&![403,404].includes(e.status))break}if(r)return r.target.mirrors=i,r;throw n||Error(`没有找到对应的 GitHub HTML 文件`)}function He(e){let t=new Set([...e.querySelectorAll(`script[type="application/json"][id]`)].map(e=>e.id));e.querySelectorAll(`script`).forEach(e=>{let n=(e.getAttribute(`type`)||``).toLowerCase(),r=e.textContent||``,i=n===`application/json`,a=!e.src&&[...t].some(e=>r.includes(e))&&/(?:innerHTML|insertAdjacentHTML|appendChild|\.append\(|textContent\s*=)/.test(r);if(i||a){a&&(e.dataset.clairHydrationScript=`true`);return}e.dataset.clairOriginalType=e.getAttribute(`type`)??`__empty__`,e.setAttribute(`type`,`application/x-clair-disabled`)}),e.querySelectorAll(`*`).forEach(e=>{[...e.attributes].forEach(t=>{/^on/i.test(t.name)&&(e.setAttribute(`data-clair-event-${t.name.toLowerCase()}`,t.value),e.removeAttribute(t.name))});let t=e.getAttribute(`href`);t&&/^\s*javascript:/i.test(t)&&(e.dataset.clairJavascriptHref=t,e.removeAttribute(`href`))})}function Ue(){return`
(() => {
  const channel = ${JSON.stringify(xe)};
  const send = (type, payload = {}) => parent.postMessage({ channel, type, ...payload }, "*");
  const body = document.body;
  body.contentEditable = "true";
  body.spellcheck = true;
  body.dataset.clairEditable = "true";

  const pageSelectors = [
    "[data-editor-page]",
    "[data-slide]",
    "[data-page]",
    ".report-page",
    ".slide",
    ".screen",
    "main > section",
    "body > section"
  ];
  const collectPageNodes = () => {
    for (const selector of pageSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .filter((node) => !node.closest("nav, header, footer") && (node.textContent || "").trim().length > 8);
      if (candidates.length < 2) continue;
      const groups = new Map();
      candidates.forEach((node) => {
        const parent = node.parentElement;
        if (!parent) return;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(node);
      });
      const peers = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0] || [];
      if (peers.length > 1) return peers;
    }
    return [body];
  };
  let pageNodes = collectPageNodes();
  let activePageIndex = 0;
  const renderPage = () => {
    pageNodes.forEach((page, index) => {
      page.classList.toggle("clair-editor-page-hidden", pageNodes.length > 1 && index !== activePageIndex);
    });
    send("page-info", { page: activePageIndex, pageCount: pageNodes.length });
  };
  const setPage = (value) => {
    pageNodes = collectPageNodes();
    activePageIndex = Math.max(0, Math.min(pageNodes.length - 1, Number(value) || 0));
    renderPage();
    pageNodes[activePageIndex]?.scrollIntoView({ block: "start" });
    pageNodes[activePageIndex]?.focus?.({ preventScroll: true });
  };

  let selectedBlock = null;
  let blockClipboardHtml = "";
  let draggedBlock = null;
  const blockSelector = "[data-clair-editor-block]";
  const markBlocks = () => {
    const candidates = document.querySelectorAll([
      "main > section", "main > article", "main > div",
      "body > section", "body > article", "body > div",
      "section > article", "figure", "table", "pre", "img", "[data-block-kind]"
    ].join(","));
    candidates.forEach((node) => {
      if (node.closest("nav, header, footer, script, style")) return;
      node.dataset.clairEditorBlock = "true";
    });
  };
  const selectBlock = (block) => {
    selectedBlock?.classList.remove("clair-editor-selected");
    selectedBlock?.removeAttribute("draggable");
    selectedBlock = block?.closest?.(blockSelector) || null;
    if (!selectedBlock) {
      send("block-selection", { selected: false });
      return;
    }
    selectedBlock.classList.add("clair-editor-selected");
    selectedBlock.draggable = true;
    send("block-selection", {
      selected: true,
      kind: selectedBlock.tagName.toLowerCase()
    });
  };
  const cleanInsertedHtml = (html) => {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        if (["href", "src"].includes(attribute.name) && /^\s*javascript:/i.test(attribute.value)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  };
  const insertAfterSelection = (html) => {
    const holder = document.createElement("div");
    holder.innerHTML = cleanInsertedHtml(html);
    const nodes = [...holder.childNodes];
    const activePage = pageNodes[activePageIndex] || body;
    if (selectedBlock?.parentNode) {
      let reference = selectedBlock;
      nodes.forEach((node) => {
        reference.parentNode?.insertBefore(node, reference.nextSibling);
        reference = node;
      });
    } else {
      const container = activePage === body ? body : activePage;
      nodes.forEach((node) => container.appendChild(node));
    }
    markBlocks();
    const inserted = nodes.find((node) => node.nodeType === 1);
    if (inserted) selectBlock(inserted);
    send("dirty");
  };
  const moveSelectedBlock = (direction) => {
    if (!selectedBlock) return;
    const sibling = direction === "up"
      ? selectedBlock.previousElementSibling
      : selectedBlock.nextElementSibling;
    if (!sibling) return;
    if (direction === "up") sibling.before(selectedBlock);
    else sibling.after(selectedBlock);
    selectedBlock.scrollIntoView({ block: "nearest", behavior: "smooth" });
    send("dirty");
  };
  const runBlockCommand = async (command) => {
    if (command === "copy" && selectedBlock) {
      blockClipboardHtml = selectedBlock.outerHTML;
      try { await navigator.clipboard.writeText(blockClipboardHtml); } catch {}
      send("block-feedback", { message: "区块已复制" });
      return;
    }
    if (command === "paste") {
      let html = blockClipboardHtml;
      if (!html) {
        try { html = await navigator.clipboard.readText(); } catch {}
      }
      if (html) insertAfterSelection(html);
      return;
    }
    if (command === "delete" && selectedBlock) {
      const next = selectedBlock.nextElementSibling || selectedBlock.previousElementSibling;
      selectedBlock.remove();
      selectBlock(next);
      send("dirty");
      return;
    }
    if (command === "up" || command === "down") moveSelectedBlock(command);
  };

  const restoreDocument = () => {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("spellcheck");
    clone.querySelector("body")?.removeAttribute("data-clair-editable");
    clone.querySelectorAll(".clair-editor-page-hidden").forEach((page) => {
      page.classList.remove("clair-editor-page-hidden");
    });
    clone.querySelectorAll(".clair-editor-selected").forEach((node) => node.classList.remove("clair-editor-selected"));
    clone.querySelectorAll("[data-clair-editor-block]").forEach((node) => {
      node.removeAttribute("data-clair-editor-block");
      node.removeAttribute("draggable");
    });
    clone.querySelectorAll("[data-clair-hydration-script]").forEach((node) => {
      node.removeAttribute("data-clair-hydration-script");
    });
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
    if (message.type === "block-command") {
      runBlockCommand(message.command);
      return;
    }
    if (message.type === "insert-block") {
      insertAfterSelection(message.html || "");
      return;
    }
    if (message.type === "set-page") {
      setPage(message.page);
      return;
    }
    if (message.type === "serialize") {
      send("serialized", { requestId: message.requestId, html: restoreDocument() });
    }
  });

  document.addEventListener("input", () => send("dirty"), true);
  document.addEventListener("click", (event) => {
    const block = event.target.closest?.(blockSelector);
    if (block) selectBlock(block);
  }, true);
  document.addEventListener("dragstart", (event) => {
    const block = event.target.closest?.(blockSelector);
    if (!block || block !== selectedBlock) return;
    draggedBlock = block;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", block.textContent?.slice(0, 80) || "区块");
    block.classList.add("clair-editor-dragging");
  });
  document.addEventListener("dragover", (event) => {
    if (!draggedBlock) return;
    const target = event.target.closest?.(blockSelector);
    if (!target || target === draggedBlock) return;
    event.preventDefault();
    document.querySelectorAll(".clair-editor-drop-target").forEach((node) => node.classList.remove("clair-editor-drop-target"));
    target.classList.add("clair-editor-drop-target");
  });
  document.addEventListener("drop", (event) => {
    if (!draggedBlock) return;
    const target = event.target.closest?.(blockSelector);
    if (!target || target === draggedBlock) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) target.before(draggedBlock);
    else target.after(draggedBlock);
    send("dirty");
  });
  document.addEventListener("dragend", () => {
    draggedBlock?.classList.remove("clair-editor-dragging");
    document.querySelectorAll(".clair-editor-drop-target").forEach((node) => node.classList.remove("clair-editor-drop-target"));
    draggedBlock = null;
  });
  document.addEventListener("selectionchange", () => {
    send("selection", {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline")
    });
  });
  const startEditor = () => requestAnimationFrame(() => {
    pageNodes = collectPageNodes();
    markBlocks();
    renderPage();
    send("ready");
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startEditor, { once: true });
  } else {
    startEditor();
  }
})();
`}function We(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelectorAll(`meta[http-equiv="Content-Security-Policy" i]`).forEach(e=>{e.dataset.clairEditorHttpEquiv=e.getAttribute(`http-equiv`)||`Content-Security-Policy`,e.setAttribute(`http-equiv`,`x-clair-csp-disabled`)}),He(n);let r=n.createElement(`base`);r.href=t,r.dataset.clairEditorBase=`true`,n.head.prepend(r);let i=n.createElement(`style`);i.id=`clair-editor-style`,i.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] [data-clair-editor-block]:hover {
      outline: 1px dashed rgba(102, 91, 195, .38);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] .clair-editor-selected {
      position: relative;
      min-width: 72px;
      min-height: 36px;
      overflow: auto !important;
      outline: 2px solid rgba(102, 91, 195, .82) !important;
      outline-offset: 3px !important;
      resize: both;
      cursor: move;
    }
    body[data-clair-editable="true"] .clair-editor-selected::after {
      content: "拖动移动 · 右下角缩放";
      position: absolute;
      z-index: 2147483000;
      right: 2px;
      bottom: 2px;
      border-radius: 5px;
      background: #17191e;
      padding: 3px 5px;
      color: #fff;
      font: 10px/1.2 system-ui, sans-serif;
      pointer-events: none;
    }
    body[data-clair-editable="true"] .clair-editor-dragging { opacity: .38; }
    body[data-clair-editable="true"] .clair-editor-drop-target {
      box-shadow: 0 0 0 4px rgba(102, 91, 195, .18) !important;
      outline-color: #665bc3 !important;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    .clair-editor-page-hidden { display: none !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,n.head.append(i);let a=n.createElement(`script`);return a.id=`clair-editor-bridge`,a.textContent=Ue(),n.body.append(a),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function Ge(e){if(e.url)return``;if(e.savedHtml)return e.savedHtml;let t=(e.savedFiles||[]).find(e=>/\.html?$/i.test(e.name||``));return t?.content||t?.excerpt?t.content||t.excerpt:/<!doctype\s+html|<html[\s>]/i.test(e.savedContent||``)?e.savedContent.trim():``}async function Ke(e){try{let t=Ge(e),n=t?null:Re(e.url),r=t?``:ze(e.url),i=null;if(t)i={html:t,target:null};else if(r)try{let e=await fetch(r,{cache:`no-store`});e.ok&&(i={html:await e.text(),target:n})}catch{}if(!i&&n)try{i=await Ve(n)}catch{}if(!i&&e.url){let t=await fetch(e.url,{cache:`no-store`});if(!t.ok)throw Error(`报告读取失败（HTTP ${t.status}）`);i={html:await t.text(),target:n}}let a=await Ie(i.html);v.protection=a.protection,v.target=i.target||n;let o=a.html,s=Ae(e.id);if(s?.html)try{let e=await Ie(s.html);o=e.html,v.hasDraft=!0,v.draftHtml=e.html,v.draftAt=s.savedAt||``,s.baseFiles&&v.target&&(v.target.baseFiles=s.baseFiles)}catch{je(e.id)}v.html=o,v.editorDocument=We(o,e.url||window.location.href),v.status=`ready`,v.error=``}catch(e){v.status=`error`,v.error=e?.message||`无法读取这份 HTML`}finally{v.loadPromise=null,v.render?.()}}function qe(){let e=v.render,t=v.showToast;Object.assign(v,{reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,currentPage:0,pageCount:1,render:e,showToast:t})}function Je(){return document.querySelector(`.report-editor-frame`)}function Ye(e,t=null){Je()?.contentWindow?.postMessage({channel:xe,type:`command`,command:e,value:t},`*`)}function b(e,t={}){Je()?.contentWindow?.postMessage({channel:xe,type:e,...t},`*`)}function Xe(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function Ze(e){let t=Je();if(!t?.contentWindow)return;let n=Math.max(0,Math.min(v.pageCount-1,Number(e)||0));v.currentPage=n,t.contentWindow.postMessage({channel:xe,type:`set-page`,page:n},`*`),y()}function Qe(){let e=Je();if(!e?.contentWindow)return Promise.reject(Error(`编辑画布尚未就绪`));let t=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;return new Promise((n,r)=>{let i=window.setTimeout(()=>{we.delete(t),r(Error(`读取编辑内容超时`))},1e4);we.set(t,{resolve:e=>{clearTimeout(i),n(e)}}),e.contentWindow.postMessage({channel:xe,type:`serialize`,requestId:t},`*`)})}function $e(e){return`${String(e||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``).slice(0,80)||`report`}.html`}function et(e,t){let n=new Blob([e],{type:`text/html;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=$e(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),1e3)}async function tt(e){await navigator.clipboard.writeText(e)}function nt(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelector(`base[data-clair-preview-base]`)?.remove();let r=n.createElement(`base`);return r.href=t,r.dataset.clairPreviewBase=`true`,n.head.prepend(r),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function rt(e){if(!v.hasDraft||!v.draftHtml)throw Error(`请先暂存当前修订，再另开预览`);let t=new Blob([nt(v.draftHtml,e.url||window.location.href)],{type:`text/html;charset=utf-8`}),n=URL.createObjectURL(t),r=window.open(n,`_blank`);if(!r)throw URL.revokeObjectURL(n),Error(`浏览器拦截了新窗口，请允许弹窗后重试`);r.opener=null,window.setTimeout(()=>URL.revokeObjectURL(n),6e4)}async function it(e,{silent:t=!1}={}){let n=await Qe(),r=await Le(n),i=new Date().toISOString();try{sessionStorage.setItem(ke(e.id),JSON.stringify({reportId:e.id,reportUrl:e.url,savedAt:i,baseFiles:Oe(),html:r}))}catch{throw Error(`浏览器暂存空间不足，请先下载 HTML 备份`)}return v.html=n,v.draftHtml=n,v.draftAt=i,v.hasDraft=!0,v.dirty=!1,v.lastCommit=``,y(),t||v.showToast?.(v.isLocal?`已暂存在当前浏览器会话，尚未写回成果库`:`已暂存在当前浏览器会话，尚未更新 GitHub`),n}async function at(e){if(!(v.saving||!v.saveLocal)){v.saving=!0,y();try{let t=v.dirty?await it(e,{silent:!0}):v.draftHtml||await Qe();await v.saveLocal(t),v.html=t,v.dirty=!1,v.hasDraft=!1,v.draftHtml=``,v.draftAt=``,v.lastCommit=`local`,je(e.id),v.showToast?.(`已更新成果库中的 HTML`)}catch(e){v.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{v.saving=!1,y()}}}async function ot(e){let t=v.target;if(!t?.owner||!t.repository||!t.path||!t.branch)throw Error(`请先填写 GitHub 仓库、分支和 HTML 路径`);if(!v.token)throw Error(`请先提供 GitHub Fine-grained Token`);let n=await Le(e),r=(t.mirrors||[]).map(e=>e.path),i=De([...r.filter(e=>e.startsWith(`public/`)),...r.filter(e=>!e.startsWith(`public/`)&&e!==t.path),t.path]),a=``,o=[];for(let e of i)try{let r=e.split(`/`).map(encodeURIComponent).join(`/`),i=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${r}`,s=await Be(`${i}?ref=${encodeURIComponent(t.branch)}`,{token:v.token}),c=Oe(t)[e];if(c&&s.sha!==c)throw Error(`生产文件 ${e} 已在本次编辑后更新，请重新打开报告合并修改`);let l=await Be(i,{token:v.token,method:`PUT`,body:{message:`Update ${v.reportTitle} from Clair's Studio`,content:Fe(n),sha:s.sha,branch:t.branch}});a=l?.commit?.sha||a,t.baseFiles={...Oe(t),[e]:l?.content?.sha||s.sha},o.push(e)}catch(t){throw o.length?Error(`已更新 ${o.join(`、`)}，但 ${e} 同步失败：${t.message}`):t}return{commit:a,files:o.length}}async function st(e){if(!v.saving){v.saving=!0,y();try{let t=v.dirty?await it(e,{silent:!0}):v.draftHtml||await Qe(),n=await ot(t);v.html=t,v.dirty=!1,v.hasDraft=!1,v.draftHtml=``,v.draftAt=``,v.lastCommit=n.commit,je(e.id),v.showToast?.(n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:`已提交 GitHub，Pages 正在更新`)}catch(e){v.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{v.saving=!1,y()}}}function ct(e){let t=v.target||{owner:`ClairKu`,repository:``,branch:`main`,path:``};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${v.settingsOpen?``:`hidden`}>
      <form class="dialog editor-settings-dialog" id="editor-settings-form" role="dialog" aria-modal="true"
        aria-labelledby="editor-settings-title" tabindex="-1">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">GITHUB SAVE PERMISSION</span>
            <h2 id="editor-settings-title">设置安全保存</h2>
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
            placeholder="${v.token?`已连接；留空可继续使用当前 Token`:`github_pat_…`}" ${v.token?``:`required`} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">Cancel</button>
          <button type="submit" class="primary-button">${v.pendingSave?`Connect & save`:`Save settings`}</button>
        </div>
      </form>
    </div>`}function lt(e){let t=v.target?`${v.target.owner}/${v.target.repository} · ${v.target.path}`:`尚未识别 GitHub 文件路径`;return`
    <div class="dialog-backdrop editor-publish-backdrop" ${v.publishConfirmOpen?``:`hidden`}>
      <section class="dialog compact-dialog editor-publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-confirm-title" tabindex="-1">
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
          <button type="button" class="quiet-button" data-editor-action="close-publish">Continue editing</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">Publish</button>
        </div>
      </section>
    </div>`}function ut(e){return[...e.querySelectorAll([`a[href]`,`button:not([disabled])`,`input:not([disabled]):not([type='hidden'])`,`select:not([disabled])`,`textarea:not([disabled])`,`[tabindex]:not([tabindex='-1'])`].join(`,`))].filter(e=>!e.hidden&&e.getClientRects().length)}function dt(e){Ee=document.activeElement,document.body.style.setProperty(`--studio-modal-scroll-top`,`${-window.scrollY}px`),document.body.classList.add(`studio-modal-open`),[...e.parentElement.children].forEach(t=>{t===e||t.classList.contains(`dialog-backdrop`)||(t.inert=!0,t.dataset.editorModalInert=`true`,t.setAttribute(`aria-hidden`,`true`))});let t=e.querySelector(`[role="dialog"]`);t&&(e.onkeydown=n=>{if(n.key===`Escape`){n.preventDefault(),n.stopPropagation(),e.classList.contains(`editor-settings-backdrop`)?mt():gt();return}if(n.key!==`Tab`)return;let r=ut(t),i=r[0],a=r.at(-1);i?n.shiftKey&&document.activeElement===i?(n.preventDefault(),a.focus({preventScroll:!0})):!n.shiftKey&&document.activeElement===a&&(n.preventDefault(),i.focus({preventScroll:!0})):(n.preventDefault(),t.focus({preventScroll:!0}))},requestAnimationFrame(()=>{(ut(t)[0]||t).focus({preventScroll:!0})}))}function ft(){document.querySelectorAll(`[data-editor-modal-inert]`).forEach(e=>{e.inert=!1,e.removeAttribute(`data-editor-modal-inert`),e.removeAttribute(`aria-hidden`)}),document.body.classList.remove(`studio-modal-open`),document.body.style.removeProperty(`--studio-modal-scroll-top`);let e=Ee;Ee=null,requestAnimationFrame(()=>e?.focus?.({preventScroll:!0}))}function pt({pendingSave:e=!1}={}){v.settingsOpen=!0,v.pendingSave=e;let t=document.querySelector(`.editor-settings-backdrop`);if(!t)return;t.hidden=!1,dt(t);let n=t.querySelector(`#editor-settings-form`),r=v.target||{};if(n){n.elements.owner.value=r.owner||`ClairKu`,n.elements.repository.value=r.repository||``,n.elements.branch.value=r.branch||`main`,n.elements.path.value=r.path||``;let t=n.querySelector(`button[type="submit"]`);t&&(t.textContent=e?`Connect & save`:`Save settings`)}}function mt(){v.settingsOpen=!1,v.pendingSave=!1;let e=document.querySelector(`.editor-settings-backdrop`);e&&(e.hidden=!0),ft()}function ht(){v.publishConfirmOpen=!0;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!1,dt(e))}function gt(){v.publishConfirmOpen=!1;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!0),ft()}function _t(e=``){return!!(v.reportId&&(!e||v.reportId===e))}function vt(e,{render:t,showToast:n,saveLocal:r=null}){qe(),Object.assign(v,{reportId:e.id,reportTitle:e.title,reportUrl:e.url,status:`loading`,render:t,showToast:n,isLocal:!!(Ge(e)&&r),saveLocal:r,currentPage:0,pageCount:1}),t(),v.loadPromise=Ke(e)}function yt(e,t){let n=v.isLocal?`本地成果 · 保存在当前浏览器`:v.target?`${v.target.owner}/${v.target.repository} · ${v.target.path}${v.target.mirrors?.length?` · 同步 ${v.target.mirrors.length+1} 处`:``}`:`尚未识别 GitHub 源文件`,r=Me(),i=v.status===`ready`?`
      <div class="editor-toolbar" role="toolbar" aria-label="文本排版工具">
        <select data-editor-format aria-label="段落格式">
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
          <option value="blockquote">引用</option>
          <option value="pre">代码</option>
        </select>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="bold" title="粗体"><strong>B</strong></button>
        <button type="button" data-editor-command="italic" title="斜体"><em>I</em></button>
        <button type="button" data-editor-command="underline" title="下划线"><u>U</u></button>
        <button type="button" data-editor-command="strikeThrough" title="删除线"><s>S</s></button>
        <button type="button" data-editor-command="removeFormat" title="清除格式">Clear</button>
        <label class="editor-color-control" title="文字颜色"><span>A</span><input type="color" data-editor-color="foreColor" value="#222222" aria-label="文字颜色" /></label>
        <label class="editor-color-control" title="高亮颜色"><span>▰</span><input type="color" data-editor-color="hiliteColor" value="#fff0a8" aria-label="高亮颜色" /></label>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="insertUnorderedList" title="项目列表">• List</button>
        <button type="button" data-editor-command="insertOrderedList" title="编号列表">1. List</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="justifyLeft" title="左对齐">Left</button>
        <button type="button" data-editor-command="justifyCenter" title="居中">Center</button>
        <button type="button" data-editor-command="justifyRight" title="右对齐">Right</button>
        <button type="button" data-editor-command="justifyFull" title="两端对齐">Justify</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-action="link" title="添加链接">🔗 Link</button>
        <button type="button" data-editor-command="unlink" title="移除链接">Unlink</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="undo" title="撤销">↶</button>
        <button type="button" data-editor-command="redo" title="重做">↷</button>
        <span class="editor-divider"></span>
        <button type="button" data-editor-command="copy" title="复制选中内容">Copy</button>
        <button type="button" data-editor-action="paste" title="粘贴纯文本">Paste</button>
        <button type="button" data-editor-command="delete" title="删除选中内容">Delete</button>
        <span class="editor-divider"></span>
        <select data-editor-insert aria-label="插入内容区块">
          <option value="">＋ 插入区块</option>
          <option value="text">文本</option>
          <option value="rich">富文本</option>
          <option value="image">图片</option>
          <option value="table">表格</option>
          <option value="file">文件</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
        <span class="editor-divider"></span>
        <span class="editor-block-tools" aria-label="区块操作">
          <button type="button" data-editor-block="copy" title="复制区块" disabled>Copy block</button>
          <button type="button" data-editor-block="paste" title="粘贴区块">Paste block</button>
          <button type="button" data-editor-block="up" title="上移区块" disabled>↑</button>
          <button type="button" data-editor-block="down" title="下移区块" disabled>↓</button>
          <button type="button" data-editor-block="delete" title="删除区块" disabled>Delete block</button>
        </span>
        <input type="file" data-editor-image-input accept="image/*" hidden />
        <input type="file" data-editor-file-input hidden />
        <span class="editor-divider"></span>
        <span class="editor-page-controls" data-editor-page-controls hidden>
          <button type="button" data-editor-action="prev-page" title="上一页">←</button>
          <span data-editor-page-counter>1 / 1</span>
          <button type="button" data-editor-action="next-page" title="下一页">→</button>
        </span>
      </div>`:``,a=v.status===`loading`?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${v.isLocal?`修改后可保存回成果库，也可下载 HTML。`:`会自动识别对应 GitHub 仓库与源文件。`}</p></div>`:v.status===`error`?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${t(v.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">Retry</button><button class="primary-button" type="button" data-editor-action="download-published">Download source HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${t(e.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${Ne(v.editorDocument)}"></iframe></div>`,o=e=>({back:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>`,settings:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>`,stash:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>`,preview:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,download:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>`,copy:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`,publish:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>`})[e],s=!v.dirty&&v.hasDraft?`已暂存`:`暂存修改`,c=v.saving?v.isLocal?`正在保存到成果库`:`正在推送生产`:v.isLocal?`保存到成果库`:`推送生产`;return`
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
          ${v.isLocal?``:`
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${o(`settings`)}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${s}" title="${s}"
            ${v.status!==`ready`||v.saving||!v.dirty?`disabled`:``}>${o(`stash`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${v.status!==`ready`||!v.hasDraft?`disabled`:``}>${o(`preview`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${o(`download`)}</button>
          ${e.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${o(`copy`)}</button>`:``}
          <button class="reader-icon-button publish-icon-action${v.saving?` is-saving`:``}" type="button"
            data-editor-action="publish" aria-label="${c}" title="${c}"
            ${v.status!==`ready`||v.saving||!v.dirty&&!v.hasDraft?`disabled`:``}>${o(`publish`)}</button>
        </div>
      </header>
      ${i}
      ${a}
      ${ct(t)}
      ${lt(t)}
    </main>`}function bt(e){if(!_t(e.id))return;Te||(Te=!0,window.addEventListener(`message`,e=>{let t=Je();if(!(!t?.contentWindow||e.source!==t.contentWindow)&&e.data?.channel===xe){if(e.data.type===`dirty`&&(v.dirty=!0,v.lastCommit=``,y()),e.data.type===`page-info`&&(v.pageCount=Math.max(1,Number(e.data.pageCount)||1),v.currentPage=Math.max(0,Math.min(v.pageCount-1,Number(e.data.page)||0)),y()),e.data.type===`serialized`){let t=we.get(e.data.requestId);if(!t)return;we.delete(e.data.requestId),t.resolve(e.data.html)}e.data.type===`selection`&&document.querySelectorAll(`[data-editor-command]`).forEach(t=>{let n=t.dataset.editorCommand;[`bold`,`italic`,`underline`].includes(n)&&t.classList.toggle(`active`,!!e.data[n])}),e.data.type===`block-selection`&&document.querySelectorAll(`[data-editor-block]`).forEach(t=>{t.disabled=!e.data.selected&&t.dataset.editorBlock!==`paste`}),e.data.type===`block-feedback`&&v.showToast?.(e.data.message||`区块操作已完成`)}}),window.addEventListener(`beforeunload`,e=>{!v.reportId||!v.dirty||(e.preventDefault(),e.returnValue=``)}),window.addEventListener(`keydown`,e=>{e.key!==`Escape`||!v.reportId||(v.publishConfirmOpen?gt():v.settingsOpen&&mt())})),document.querySelectorAll(`[data-editor-command]`).forEach(e=>{e.addEventListener(`mousedown`,e=>e.preventDefault()),e.addEventListener(`click`,()=>Ye(e.dataset.editorCommand))});let t=document.querySelector(`[data-editor-format]`);t?.addEventListener(`change`,()=>{Ye(`formatBlock`,t.value),t.value=`p`}),document.querySelectorAll(`[data-editor-color]`).forEach(e=>{e.addEventListener(`input`,()=>Ye(e.dataset.editorColor,e.value))}),document.querySelectorAll(`[data-editor-block]`).forEach(e=>{e.addEventListener(`mousedown`,e=>e.preventDefault()),e.addEventListener(`click`,()=>{b(`block-command`,{command:e.dataset.editorBlock})})});let n=document.querySelector(`[data-editor-image-input]`),r=document.querySelector(`[data-editor-file-input]`),i=e=>new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(r.result),r.onerror=()=>n(r.error||Error(`文件读取失败`)),r.readAsDataURL(e)});n?.addEventListener(`change`,async()=>{let e=n.files?.[0];if(e)try{b(`insert-block`,{html:`<figure data-block-kind="image"><img src="${await i(e)}" alt="${Xe(e.name)}" style="max-width:100%;height:auto" /><figcaption>${Xe(e.name)}</figcaption></figure>`})}catch{v.showToast?.(`图片读取失败`)}finally{n.value=``}}),r?.addEventListener(`change`,async()=>{let e=r.files?.[0];if(e)try{b(`insert-block`,{html:`<div data-block-kind="file"><a href="${await i(e)}" download="${Xe(e.name)}">📎 ${Xe(e.name)}</a></div>`})}catch{v.showToast?.(`文件读取失败`)}finally{r.value=``}});let a=document.querySelector(`[data-editor-insert]`);a?.addEventListener(`change`,()=>{let e=a.value;if(a.value=``,e){if(e===`text`)b(`insert-block`,{html:`<p data-block-kind="text">新文本</p>`});else if(e===`rich`)b(`insert-block`,{html:`<section data-block-kind="rich"><h2>新区块</h2><p>在这里编辑富文本内容。</p></section>`});else if(e===`image`)n?.click();else if(e===`file`)r?.click();else if(e===`table`){let e=(prompt(`表格大小，例如 3x4`,`3x3`)||`3x3`).toLowerCase().split(`x`).map(e=>Math.max(1,Math.min(12,Number(e)||3))),t=e[0]||3,n=e[1]||e[0]||3,r=e=>Array.from({length:n},(t,n)=>`<${e}>${e===`th`?`标题 ${n+1}`:`内容`}</${e}>`).join(``);b(`insert-block`,{html:`<table data-block-kind="table"><thead><tr>${r(`th`)}</tr></thead><tbody>${Array.from({length:t},()=>`<tr>${r(`td`)}</tr>`).join(``)}</tbody></table>`})}else if(e===`markdown`){let e=prompt(`输入 Markdown 内容`);e!==null&&b(`insert-block`,{html:`<pre data-block-kind="markdown" data-format="markdown">${Xe(e)}</pre>`})}else if(e===`html`){let e=prompt(`输入 HTML 区块（脚本与危险属性会自动移除）`);e&&b(`insert-block`,{html:`<div data-block-kind="html">${e}</div>`})}}}),document.querySelectorAll(`[data-editor-action]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.editorAction;if(n===`exit`){if(v.dirty&&!confirm(`还有未暂存的修改。确定退出编辑模式吗？`))return;let e=v.render;qe(),e?.()}else if(n===`settings`)pt();else if(n===`close-settings`)mt();else if(n===`stash`)try{await it(e)}catch(e){v.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`preview`)try{rt(e),v.showToast?.(`已在新窗口打开暂存修订`)}catch(e){v.showToast?.(e?.message||`无法打开预览`)}else if(n===`publish`)try{if(v.isLocal){await at(e);return}if(v.dirty&&await it(e,{silent:!0}),!v.hasDraft){v.showToast?.(`当前没有待推送的修订`);return}ht()}catch(e){v.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`close-publish`)gt();else if(n===`confirm-publish`)gt(),!v.token||!v.target?.path?pt({pendingSave:!0}):await st(e);else if(n===`download`)try{et(await Le(await Qe()),e.title),v.showToast?.(`HTML 已下载`)}catch(e){v.showToast?.(e?.message||`下载失败`)}else if(n===`download-published`)await xt(e,v.showToast);else if(n===`share`)try{await tt(e.url),v.showToast?.(`报告链接已复制`)}catch{v.showToast?.(`复制失败，请从地址栏复制`)}else if(n===`link`){let e=prompt(`输入链接地址（https://…）`);if(!e)return;try{let t=new URL(e);if(![`http:`,`https:`,`mailto:`].includes(t.protocol))throw Error();Ye(`createLink`,t.href)}catch{v.showToast?.(`请输入有效的 http、https 或 mailto 链接`)}}else if(n===`paste`)try{let e=await navigator.clipboard.readText();if(!e)return;Ye(`insertText`,e)}catch{v.showToast?.(`请在编辑区域使用 ⌘V 粘贴`)}else n===`prev-page`?Ze(v.currentPage-1):n===`next-page`?Ze(v.currentPage+1):n===`retry`&&(v.status=`loading`,v.error=``,v.render?.(),v.loadPromise||=Ke(e))})}),document.querySelectorAll(`.editor-settings-backdrop, .editor-publish-backdrop`).forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&(e.classList.contains(`editor-settings-backdrop`)?mt():gt())})});let o=document.getElementById(`editor-settings-form`);o?.addEventListener(`submit`,async t=>{t.preventDefault();let n=new FormData(o),r=String(n.get(`github-token-not-password`)||``).trim();r&&(v.token=r);let i=String(n.get(`path`)||``).trim().replace(/^\/+/,``);v.target={...v.target||{},owner:String(n.get(`owner`)||``).trim(),repository:String(n.get(`repository`)||``).trim(),branch:String(n.get(`branch`)||`main`).trim(),path:i,mirrors:i===v.target?.path&&v.target?.mirrors||[],source:`manual`};let a=v.pendingSave;mt();let s=document.querySelector(`.editor-target-label`);if(s){let e=`${v.target.owner}/${v.target.repository} · ${v.target.path}`;s.textContent=e,s.title=e}v.showToast?.(`保存权限已连接`),a&&await st(e)})}async function xt(e,t){try{let n=await fetch(e.url,{cache:`no-store`});if(!n.ok)throw Error();et(await n.text(),e.title),t?.(`HTML 已下载`)}catch{window.open(e.url,`_blank`,`noopener,noreferrer`),t?.(`浏览器限制了直接下载，已打开原页面`)}}async function St(e,t){try{await tt(e.url),t?.(`报告链接已复制`)}catch{t?.(`复制失败，请从地址栏复制`)}}var Ct=`modulepreload`,wt=function(e,t){return new URL(e,t).href},Tt={},Et=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=wt(t,n),t=s(t),t in Tt)return;Tt[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:Ct,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function Dt(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Ot(e=``){return Dt(e).replace(/`([^`]+)`/g,`<code>$1</code>`).replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`).replace(/__([^_]+)__/g,`<strong>$1</strong>`).replace(/(^|[^*])\*([^*]+)\*/g,`$1<em>$2</em>`).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,`<a href="$2" target="_blank" rel="noreferrer">$1</a>`)}function kt(e=``){let t=String(e).replaceAll(`\r
`,`
`).split(`
`),n=[],r=[],i=``,a=[],o=[],s=``,c=()=>{r.length&&(n.push(`<p>${r.map(Ot).join(`<br>`)}</p>`),r=[])},l=()=>{i&&=(n.push(`</${i}>`),``)},u=()=>{a.length&&(n.push(`<blockquote>${a.map(Ot).join(`<br>`)}</blockquote>`),a=[])},d=()=>{!o.length&&!s||(n.push(`<pre><code${s?` data-language="${Dt(s)}"`:``}>${Dt(o.join(`
`))}</code></pre>`),o=[],s=``)},f=()=>{c(),l(),u()},p=!1;for(let e of t){let t=e.match(/^```\s*([\w.+-]*)\s*$/);if(t){p?d():(f(),s=t[1]||``),p=!p;continue}if(p){o.push(e);continue}if(!e.trim()){f();continue}let m=e.match(/^(#{1,6})\s+(.+)$/);if(m){f();let e=m[1].length;n.push(`<h${e}>${Ot(m[2])}</h${e}>`);continue}let h=e.match(/^\s*[-*+]\s+(.+)$/),g=e.match(/^\s*\d+[.)]\s+(.+)$/);if(h||g){c(),u();let e=g?`ol`:`ul`;i!==e&&(l(),i=e,n.push(`<${i}>`)),n.push(`<li>${Ot((h||g)[1])}</li>`);continue}let ee=e.match(/^>\s?(.*)$/);if(ee){c(),l(),a.push(ee[1]);continue}l(),u(),r.push(e)}return p&&d(),f(),n.join(`
`)}function At(e=``){let t=document.createElement(`template`);return t.innerHTML=String(e),t.content.querySelectorAll(`script, style, link, meta, base, iframe, frame, object, embed, form, input, button, textarea, select`).forEach(e=>e.remove()),t.content.querySelectorAll(`*`).forEach(e=>{[...e.attributes].forEach(t=>{let n=t.name.toLowerCase(),r=t.value.trim().toLowerCase();(n.startsWith(`on`)||n===`srcdoc`||(n===`href`||n===`src`||n===`xlink:href`)&&/^(javascript|vbscript):/.test(r))&&e.removeAttribute(t.name)})}),t.innerHTML}function jt(e,t,n=`document`){return`<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:;">
        <title>${Dt(t)}</title>
        <style>
          :root { color-scheme: light; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: clamp(20px, 4vw, 54px); color: #202329; background: #fff; font-size: 15px; line-height: 1.75; }
          main { width: min(100%, 980px); margin: 0 auto; }
          h1,h2,h3,h4,h5,h6 { margin: 1.5em 0 .55em; color: #17191e; font-family: Georgia, "Noto Serif SC", serif; line-height: 1.2; letter-spacing: -.025em; }
          h1 { margin-top: 0; font-size: clamp(30px, 5vw, 50px); }
          h2 { font-size: clamp(24px, 3.8vw, 34px); }
          h3 { font-size: clamp(19px, 3vw, 25px); }
          p, ul, ol, blockquote, pre, table { margin: 0 0 1.2em; }
          a { color: #6457d8; text-decoration-thickness: 1px; text-underline-offset: 3px; }
          img { display: block; max-width: 100%; height: auto; margin: 18px auto; }
          blockquote { border-left: 3px solid #7667e8; background: #f7f5ff; padding: 14px 18px; color: #555b66; }
          code { border-radius: 5px; background: #f0f1f4; padding: .12em .38em; font: .88em/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
          pre { overflow: auto; border: 1px solid #e4e6eb; border-radius: 12px; background: #f6f7f9; padding: 18px; }
          pre code { background: transparent; padding: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { min-width: 88px; border: 1px solid #dfe2e7; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { position: sticky; top: 0; background: #f2f3f6; font-weight: 700; }
          .sheet { margin-bottom: 40px; overflow: auto; border: 1px solid #e2e4e8; border-radius: 12px; }
          .sheet h2 { position: sticky; left: 0; margin: 0; border-bottom: 1px solid #e2e4e8; background: #f8f8fa; padding: 13px 16px; font: 700 14px/1.4 ui-sans-serif, sans-serif; letter-spacing: 0; }
          .sheet table { margin: 0; }
          body[data-type="spreadsheet"] main { width: 100%; }
          body[data-type="spreadsheet"] { padding: 18px; }
        </style>
      </head>
      <body data-type="${Dt(n)}"><main>${e}</main></body>
    </html>`}function Mt(e,t,n,r){let i=document.createElement(`iframe`);i.className=`embedded-generated-frame embedded-${r}-frame`,i.title=`${n}内容`,i.setAttribute(`sandbox`,``),i.srcdoc=t,e.replaceChildren(i)}async function Nt(e,t,n,r=!1){let[{default:i},a]=await Promise.all([Et(()=>import(`./pdf.worker.min-CycdM0Xo.js`),[],import.meta.url),Et(()=>import(`./pdf-Dfm5heB6.js`),[],import.meta.url)]);a.GlobalWorkerOptions.workerSrc=i;let o=await a.getDocument({data:await t.arrayBuffer()}).promise,s=document.createElement(`div`);s.className=`embedded-pdf-pages`;let c=r?Math.min(1,o.numPages):o.numPages,l=Array.from({length:c},(e,t)=>{let r=document.createElement(`figure`);r.className=`embedded-pdf-page`,r.dataset.pageNumber=String(t+1);let i=document.createElement(`canvas`);i.setAttribute(`aria-label`,`${n.name} 第 ${t+1} 页`);let a=document.createElement(`figcaption`);return a.textContent=`${t+1} / ${o.numPages}`,r.append(i,a),s.append(r),r});e.replaceChildren(s);let u=async t=>{if(t.dataset.rendered===`true`||t.dataset.rendering===`true`)return;t.dataset.rendering=`true`;let n=Number(t.dataset.pageNumber),r=await o.getPage(n),i=r.getViewport({scale:1}),a=Math.max(280,Math.min(e.clientWidth||980,1200))/i.width,s=r.getViewport({scale:a}),c=Math.min(window.devicePixelRatio||1,2),l=t.querySelector(`canvas`),u=l.getContext(`2d`,{alpha:!1});l.width=Math.floor(s.width*c),l.height=Math.floor(s.height*c),l.style.width=`${Math.floor(s.width)}px`,l.style.height=`${Math.floor(s.height)}px`;let d=c===1?null:[c,0,0,c,0,0];await r.render({canvasContext:u,transform:d,viewport:s}).promise,t.dataset.rendered=`true`,delete t.dataset.rendering};if(await u(l[0]),l.length<=1)return;if(!(`IntersectionObserver`in window)){for(let e of l.slice(1))await u(e);return}let d=new IntersectionObserver(e=>{e.filter(e=>e.isIntersecting).forEach(e=>{d.unobserve(e.target),u(e.target).catch(()=>{e.target.classList.add(`has-render-error`)})})},{rootMargin:`1400px 0px`});l.slice(1).forEach(e=>d.observe(e))}async function Pt(e,t,n){if(!/\.docx$/i.test(n.name||``))throw Error(`旧版 .doc 暂不能在浏览器中可靠解析，请另存为 .docx 后重新上传`);let r=await Et(()=>import(`./lib-DZSZPu5o.js`).then(e=>u(e.default,1)),__vite__mapDeps([0,1]),import.meta.url),i=r.convertToHtml||r.default?.convertToHtml;if(!i)throw Error(`Word 解析器加载失败`);Mt(e,jt(At((await i({arrayBuffer:await t.arrayBuffer()})).value||``),n.name,`word`),n.name,`word`)}async function Ft(e,t,n){let r=await Et(()=>import(`./xlsx-Cl_0CZaL.js`),[],import.meta.url),i=r.read(await t.arrayBuffer(),{type:`array`,cellDates:!0});Mt(e,jt(i.SheetNames.map(e=>{let t=r.utils.sheet_to_html(i.Sheets[e],{header:``,footer:``});return`<section class="sheet"><h2>${Dt(e)}</h2>${At(t)}</section>`}).join(``),n.name,`spreadsheet`),n.name,`spreadsheet`)}async function It(e,t,n){if(!/\.pptx$/i.test(n.name||``))throw Error(`旧版 .ppt 暂不能在浏览器中可靠解析，请另存为 .pptx 后重新上传`);let r=await Et(()=>import(`./pptx-preview.es-qpklzjky.js`),__vite__mapDeps([2,1]),import.meta.url),i=r.init||r.default?.init;if(!i)throw Error(`PPT 解析器加载失败`);let a=document.createElement(`div`);a.className=`embedded-ppt-viewport`;let o=document.createElement(`div`);o.className=`embedded-ppt-stage`,a.append(o),e.replaceChildren(a),await i(o,{width:960,height:540,mode:`list`}).preview(await t.arrayBuffer())}async function Lt(e,t,n,r){if(r===`pdf`||r===`pdf-thumb`){await Nt(e,t,n,r===`pdf-thumb`);return}if(r===`text`){Mt(e,jt(kt(await t.text()),n.name,`markdown`),n.name,`markdown`);return}if(r===`word`){await Pt(e,t,n);return}if(r===`excel`){await Ft(e,t,n);return}if(r===`ppt`){await It(e,t,n);return}throw Error(`该格式暂不支持页面内解析`)}var Rt={production:`生产 直达 public`,org:`组织 登录 restricted`,account:`账号 登录 restricted`};function x(e=``){return String(e).normalize(`NFKC`).toLocaleLowerCase(`zh-CN`).normalize(`NFD`).replace(/\p{Diacritic}/gu,``).replace(/\s+/g,` `).trim()}function zt(e=``){return x(e).split(` `).filter(Boolean)}function Bt(e,t,{group:n={},workTypeName:r=``}={}){return Wt(e,t,{group:n,workTypeName:r})>0}function Vt(e){let t=Array.isArray(e.savedFiles)?e.savedFiles.flatMap(e=>[e?.name,e?.content,e?.excerpt]):[];return[e.description,e.savedContent,e.savedHtml,e.searchContent,...t].filter(Boolean).join(` `)}function Ht(e,{group:t={},workTypeName:n=``}={}){return{title:x(e.title),tags:x((e.tags||[]).join(` `)),source:x(e.source),content:x(Vt(e)),type:x(n),topic:x([t.name,t.description].filter(Boolean).join(` `)),url:x(e.url),access:x([e.access,Rt[e.access]].filter(Boolean).join(` `))}}function Ut(e,t,n={}){let r=zt(t);if(!r.length)return[];let i=Ht(e,n);return Object.entries(i).filter(([,e])=>e&&r.some(t=>e.includes(t))).map(([e])=>e)}function Wt(e,t,{group:n={},workTypeName:r=``}={}){let i=zt(t);if(!i.length)return 1;let a=Ht(e,{group:n,workTypeName:r}),o=x([e.title,e.source,e.url,e.access,Rt[e.access],r,...e.tags||[],n.name,n.description,Vt(e)].filter(Boolean).join(` `)),s=0;for(let t of i){if(!o.includes(t))return 0;a.title===t?s+=600:a.title.startsWith(t)?s+=360:a.title.includes(t)&&(s+=280),(e.tags||[]).some(e=>x(e)===t)?s+=150:a.tags.includes(t)&&(s+=110),a.source.includes(t)&&(s+=75),a.type.includes(t)&&(s+=60),a.topic.includes(t)&&(s+=45),a.content.includes(t)&&(s+=32),a.url.includes(t)&&(s+=18),a.access.includes(t)&&(s+=8)}return s}var Gt=`clair-service-report-workbench-v1`,Kt=`clair-service-report-workbench-view`,qt=`clair-service-report-time-sort-v1`,Jt=`clair-service-report-workbench-bucket-order-v1`,Yt=`clair-service-report-workbench-report-order-v1`,Xt=`clair-ai-studio-files`,S=`files`,C=40,Zt=[{id:`requirement-review`,name:`需求评审`},{id:`reporting`,name:`汇报材料`},{id:`competitive-research`,name:`竞品调研`},{id:`product-planning`,name:`产品规划`},{id:`data-analysis`,name:`数据分析`},{id:`investment-research`,name:`投研分析`},{id:`governance-review`,name:`治理审查`},{id:`product-demo`,name:`原型 Demo`}],Qt=[`手动保存`,`生产`,`个人`,`HTML`,`本体`,`飞书`,`调研`,`产品规划`,`AI 小顾`,`AI 工作台`,`AI 开放平台`,`且慢`,`OAP`,`MCP`,`Skills`,`投顾服务`,`投研`,`数据分析`,`需求评审`,`经营汇报`,`知识治理`],w={plus:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>`,minus:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg>`,edit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13 7 4 4"></path></svg>`,archive:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z"></path><path d="M3 4h18v3H3zM9 11h6"></path></svg>`,close:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>`,star:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"></path></svg>`,top:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 19V8m0 0-4 4m4-4 4 4"></path></svg>`,up:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"></path></svg>`,down:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg>`,bottom:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14M12 5v11m0 0-4-4m4 4 4-4"></path></svg>`},T={version:C,groups:[{id:`xiaogu`,name:`AI 小顾与投顾服务`,description:`AI 小顾、顾问服务与客户体验`,accent:`green`,position:0},{id:`ai-workbench`,name:`AI 工作台与生产力`,description:`个人工作台、评审工具与 AI 生产力`,accent:`blue`,position:1},{id:`ai-platform`,name:`AI 开放平台`,description:`OAP、MCP、Skills、Agents 与治理`,accent:`violet`,position:2},{id:`product-planning`,name:`且慢产品与体验`,description:`产品规划、体验分析与交互方案`,accent:`blue`,position:3},{id:`research`,name:`投研与策略研究`,description:`基金、策略与资产配置研究`,accent:`amber`,position:4},{id:`reporting`,name:`经营分析与汇报`,description:`业务分析、周报与管理汇报`,accent:`blue`,position:5},{id:`knowledge`,name:`知识治理与组织协同`,description:`本体、飞书、SOUL 与知识资产`,accent:`slate`,position:6}],reports:[{id:`yingmi-skill-stability-eval-2026-08-09`,groupId:`ai-platform`,title:`yingmi-skill 三轮稳定性评测｜真实波动与测试误报`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-skill-stability-eval-2026-08-09/`,preview:`yingmi-skill-stability-eval-2026-08-09.svg`,pinned:!0,position:0,createdAt:`2026-08-09T20:00:00.000+08:00`,source:`skill-upper 0.7.0 × yingmi-skill 0.1.5｜4 个核心用例 × 3 次独立运行｜公开页仅保留脱敏结果与治理建议`,access:`production`,workType:`data-analysis`,tags:[`AI 开放平台`,`Skills`,`yingmi-skill`,`稳定性评测`,`MCP`,`数据分析`,`HTML`,`脱敏`,`生产`]},{id:`skill-governance-audit-2026-08-09`,groupId:`knowledge`,title:`Skill 全量治理审计｜重复、失效、风险与可删减清单`,url:`https://clairku.github.io/clair-ai-studio/reports/skill-governance-audit-2026-08-09/`,preview:`skill-governance-audit-2026-08-09.svg`,pinned:!0,position:0,createdAt:`2026-08-09T19:28:00.000+08:00`,source:`248 个 Skill 目录实时盘点｜公开页仅保留数量、方法与治理结论；完整名称、路径、逐项判断和 CSV 仅本地保存`,access:`production`,workType:`governance-review`,tags:[`Skill 治理`,`知识治理`,`安全审查`,`重复清理`,`Codex`,`HTML`,`脱敏`,`生产`]},{id:`obsidian-agent-stack-install-2026-08-09`,groupId:`knowledge`,title:`Obsidian × Agent 本地知识栈｜安装与安全验证`,url:`https://clairku.github.io/clair-ai-studio/reports/obsidian-agent-stack-install-2026-08-09/`,preview:`obsidian-agent-stack-install-2026-08-09.svg`,pinned:!0,position:0,createdAt:`2026-08-09T18:50:00.000+08:00`,source:`9 个公共仓库 × 69 个 Skills × ctx 本地索引 × 4 个 Obsidian 插件｜分层安装、真实运行验证与自动写入门禁`,access:`production`,workType:`governance-review`,tags:[`Obsidian`,`Agent Skills`,`Codex`,`知识治理`,`本地优先`,`安全审查`,`HTML`,`生产`]},{id:`third-party-platform-regulatory-filing-2026-08-08`,groupId:`knowledge`,title:`第三方平台合作监管报送｜受控材料索引`,url:`https://clairku.github.io/clair-ai-studio/reports/third-party-platform-regulatory-filing-2026-08-08/`,preview:`third-party-platform-regulatory-filing-2026-08-08.svg`,pinned:!0,position:0,createdAt:`2026-08-08T23:20:00.000+08:00`,source:`内部监管报送准备｜公开页仅保留脱敏索引，不存储申请正文、业务流程、系统边界、测试截图或个人信息`,access:`production`,workType:`governance-review`,tags:[`知识治理`,`治理审查`,`监管报备`,`第三方平台`,`HTML`,`生产`]},{id:`qieman-advisor-service-redesign-2026-08-07`,groupId:`xiaogu`,title:`且慢投顾全生命周期盘点与重构｜从页面经营到个人投资服务`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-advisor-service-redesign-2026-08-07/`,preview:`qieman-advisor-service-redesign-2026-08-07.svg`,pinned:!0,position:0,createdAt:`2026-08-07T18:20:00.000+08:00`,source:`全量页面 × 2026月度趋势 × 资金归因审计｜规划默认、定制优先、主动编排、自助筛选与用户组件自定义`,access:`production`,workType:`product-planning`,tags:[`且慢`,`投顾服务`,`AI 小顾`,`产品规划`,`数据分析`,`本体`,`概念原型`,`HTML`,`生产`]},{id:`qieman-advisor-page-redesign-2026-08-07`,groupId:`product-planning`,title:`且慢投顾页｜本体盘点与新版设计方案`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-advisor-page-redesign-2026-08-07/`,preview:`qieman-advisor-page-redesign-2026-08-07.svg`,pinned:!0,position:0,createdAt:`2026-08-07T10:00:00.000Z`,source:`投顾页 × 投资工具 × 策略营销 × AI 小顾｜本体实测 + 埋点转化 + 十年迭代史 → 五问题诊断 · 五条洞察 · 小顾驱动的七层新版蓝图与组件化路线`,access:`production`,workType:`product-planning`,tags:[`且慢`,`投顾服务`,`产品规划`,`AI 小顾`,`投顾页改版`,`使用转化`,`配置地图`,`服务组件`,`CLAIR`,`HTML`,`生产`]},{id:`clair-product-design-reviewer-2026-08-06`,groupId:`ai-workbench`,title:`Clair Review OS｜产品与设计智能评审器`,url:`https://clairku.github.io/clair-ai-studio/reports/clair-product-design-reviewer-2026-08-06/`,preview:`clair-product-design-reviewer-2026-08-06.svg`,pinned:!0,position:0,createdAt:`2026-08-06T16:30:00.000Z`,source:`高级产品原则 × 且慢业务红线 × Clair 个人规则 × 正反边界案例｜原文定位、PM 版复制、案例学习与受控进化`,access:`production`,workType:`requirement-review`,tags:[`AI 工作台`,`需求评审`,`产品设计`,`案例库`,`受控进化`,`且慢`,`Skills`,`HTML`,`生产`]},{id:`gpt-codex-plan-analysis-2026-08-04`,groupId:`ai-workbench`,title:`GPT / Codex 使用分析与方案建议`,url:`https://clairku.github.io/clair-ai-studio/reports/gpt-codex-plan-analysis-2026-08-04/`,preview:`gpt-codex-plan-analysis-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T09:25:00.000Z`,source:`近两个月本地 Codex Token 结构 × 官方套餐与费率核验 × 模型路由建议｜公开直达`,access:`production`,workType:`data-analysis`,tags:[`个人`,`Codex`,`GPT`,`Token`,`数据分析`,`模型路由`,`套餐建议`,`公开`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-oap-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（增长可视化内嵌版）`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-report-2026-08-03/`,preview:`yingmi-oap-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T22:30:00.000Z`,source:`飞书十项框架 × Clair 视觉模版｜用户增长章节内嵌 OAP 历程·里程碑与增长走势交互图（oap-journey-metrics-2026-08-02）`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`飞书框架`,`用户增长`,`微信`,`千问`,`AI 实验室`,`商化准备`,`HTML`,`生产`]},{id:`oap-executive-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（Executive 视觉版）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-executive-report-2026-08-03/`,preview:`oap-executive-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T20:00:00.000Z`,source:`飞书 revision 30 十项框架｜OKR 复算 · 微信千问双入口 · 九平台三层货架 · AI 实验室 · 商化闭环`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR 复算`,`微信`,`千问`,`AI 实验室`,`商业化`,`HTML`,`生产`]},{id:`oap-project-report-feishu-framework-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 汇报（十项框架）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-report-feishu-framework-2026-08-03/`,preview:`oap-project-report-feishu-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T19:45:00.000Z`,source:`飞书 v2 revision 66 十项大纲｜用户增长可视化已纳入 · 四类机构榜单 · OKR 复算 · 千问微信双入口 · 公开直达`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR 复算`,`千问`,`微信`,`货架矩阵`,`AI 实验室`,`公开`,`HTML`,`生产`]},{id:`yingmi-ai-oap-h2-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜2026 H2 项目汇报`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-h2-2026-08-03/`,preview:`yingmi-ai-oap-h2-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T19:00:00.000Z`,source:`飞书文档五条主线｜项目进展 × 产品规划 × 商化准备 × 往外看 × 向内看 → OAP 商业闭环`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`千问`,`商化准备`,`竞品分析`,`HTML`,`生产`]},{id:`yingmi-ai-open-platform-progress-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台项目汇报`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-open-platform-progress-2026-08-03/`,preview:`yingmi-ai-oap-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T18:00:00.000Z`,source:`飞书文档｜平台架构、业务规模与商业化进展全景视图`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`商业化`,`项目汇报`,`HTML`,`生产`]},{id:`oap-project-review-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（证据版）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-review-2026-08-03/`,preview:`oap-project-review-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-02T19:30:00.000Z`,source:`指定飞书 Wiki revision 30｜OKR 数据 × 用户增长可视化 × 微信/千问双入口 × 渠道矩阵 × 能力治理 × AI 实验室 × 商化，15 章节 13 张原图证据`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR`,`微信`,`千问`,`AI 实验室`,`商化准备`,`HTML`,`生产`]},{id:`yingmi-oap-project-briefing-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（框架全景）`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-project-briefing-2026-08-03/`,preview:`yingmi-oap-project-briefing-2026-08-03.svg`,pinned:!1,createdAt:`2026-08-02T19:15:00.000Z`,source:`飞书源稿十项框架（revision 1934）｜OKR → 关键举措 → 里程碑 → 微信/千问 → 渠道矩阵 → 能力体系 → 系统建设 → AI 实验室 → 商化 → 行业 → 问题回顾`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`飞书框架`,`微信`,`千问`,`渠道矩阵`,`AI 实验室`,`HTML`,`生产`]},{id:`oap-report-collaboration-retrospective-2026-08-04`,groupId:`ai-platform`,title:`一次报告，如何变成一套系统｜OAP 协作复盘`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-report-collaboration-retrospective-2026-08-04/`,preview:`oap-report-collaboration-retrospective-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T11:30:00.000Z`,source:`2026-08-02—03 OAP 报告任务｜证据审计 × 管理叙事 × 多版本收敛 × CLAIR 生产发布`,access:`production`,workType:`reporting`,tags:[`项目复盘`,`AI 开放平台`,`OAP`,`报告方法`,`协作`,`证据治理`,`版本管理`,`CLAIR`,`HTML`,`生产`]},{id:`qieman-ai-product-practice-oap-edition-2026-08-04`,groupId:`ai-platform`,title:`盈米 AI 产品实践｜OAP 模版重制版`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-oap-edition-2026-08-04/`,preview:`qieman-ai-product-practice-oap-edition-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T13:30:00.000Z`,source:`原《盈米 AI 产品实践》完整内容｜套用 OAP 22 屏框架、视觉系统与交互｜新增独立报告`,access:`production`,workType:`reporting`,tags:[`盈米 AI`,`且慢产品`,`OAP 模版`,`金融服务操作系统`,`AI 小顾`,`投顾工作台`,`微信`,`千问`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-ai-oap-outline-concepts-2026-08-04`,groupId:`ai-platform`,title:`OAP 报告大纲页｜三版设计预览`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-outline-concepts-2026-08-04/`,preview:`yingmi-ai-oap-outline-concepts-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T07:10:00.000Z`,source:`盈米 AI OAP 28 屏正式报告｜管理层决策地图 × 增长叙事路线 × 平台系统全景`,access:`production`,workType:`product-planning`,tags:[`AI 开放平台`,`OAP`,`报告大纲`,`管理汇报`,`信息架构`,`视觉设计`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-ai-oap-framework-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜把能力做成增长`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-framework-2026-08-03/`,preview:`yingmi-ai-oap-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T02:55:00.000Z`,source:`飞书文档 revision 1978｜真实增长图 × 微信/千问场景 × 五层能力生产线 × AI 实验室用户共创 × 商化收费路由 × 机构使用 × MCP TOP20`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`微信`,`千问`,`能力生产线`,`AI 实验室`,`用户共创`,`商化收费`,`企业年包`,`按量预付`,`机构使用`,`MCP TOP20`,`HTML`,`生产`]},{id:`qieman-mcp-top20-2026-08-03`,groupId:`ai-platform`,title:`MCP 全量调用 TOP20｜69 项接口审计`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-mcp-top20-2026-08-03/`,preview:`qieman-mcp-top20-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T05:00:00.000Z`,source:`盈米 MCP 接口市场 7 页 69 项全量审计｜剔除时间查询后的业务 TOP20、集中度与类别结构`,access:`production`,workType:`data-analysis`,tags:[`AI 开放平台`,`OAP`,`MCP`,`数据分析`,`调用统计`,`且慢`,`HTML`,`生产`]},{id:`yingmi-ai-bottom-up-architecture-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI｜双关系图视觉重绘`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-bottom-up-architecture-2026-08-03/`,preview:`yingmi-ai-bottom-up-architecture-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T10:30:00.000Z`,source:`服务关系图 × 系统关系图｜原图内容与关系不变 · CLAIR 紫色系宋体重绘`,access:`production`,workType:`product-planning`,tags:[`AI 开放平台`,`OAP`,`AI 实验室`,`AI 工作台`,`Stargate`,`产品规划`,`经营汇报`,`HTML`,`生产`]},{id:`yingmi-ai-brand-building-effects-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI｜品牌建设与效果`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-brand-building-effects-2026-08-03/`,preview:`yingmi-ai-brand-building-effects-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T02:00:00.000Z`,source:`MCP 首发 → 分层内容 → 生态共建 → 行业标准｜品牌效果与经营闭环`,access:`production`,workType:`reporting`,tags:[`盈米 AI`,`品牌建设`,`MCP`,`传播复盘`,`生态合作`,`经营汇报`,`HTML`,`生产`]},{id:`yingmi-ai-two-modes-four-continuous-2026-08-02`,groupId:`ai-platform`,title:`盈米 AI｜持续引擎与势能放大`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-two-modes-four-continuous-2026-08-02/`,preview:`yingmi-ai-two-modes-four-continuous-2026-08-02.svg`,pinned:!0,position:0,createdAt:`2026-08-02T14:30:00.000Z`,source:`一张总图｜四个持续核心引擎 → 开放平台 → 两种接入模式 → 更多群体与势能`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`经营汇报`,`渠道布局`,`HTML`,`生产`]},{id:`clair-executive-visual-report-template-2026-08-02`,groupId:`ai-workbench`,title:`Clair 专用报告模板 2.1`,url:`https://clairku.github.io/clair-ai-studio/reports/clair-executive-visual-report-template-2026-08-02/`,preview:`clair-executive-visual-report-template-2026-08-02.png`,pinned:!0,position:0,createdAt:`2026-08-02T15:30:00.000Z`,source:`Clair Editorial System 2.1｜OAP 同款封面封底 × 统一标题基线 × 报告大纲 × 九类模块 × 双端校验`,access:`production`,workType:`reporting`,tags:[`AI 工作台`,`Skills`,`专用模板`,`经营汇报`,`设计系统`,`HTML`,`生产`]},{id:`yingmi-ai-communications-evidence-report-2026-07-31`,groupId:`ai-platform`,title:`盈米 AI｜阶段成果与三路布局`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-communications-evidence-report-2026-07-31/`,preview:`yingmi-ai-stage-summary-2026-08-02.svg`,pinned:!0,position:0,createdAt:`2026-07-31T08:30:00.000Z`,source:`目标完成 × 三路分发 × 机构使用 × 商业验证 × 品牌影响力`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agents`,`经营汇报`,`渠道布局`,`HTML`,`生产`]},{id:`oap-project-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台项目汇报｜从势能走向经营闭环`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-report-2026-08-03/`,preview:`oap-project-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-02T16:30:00.000Z`,source:`飞书 P1—P15｜项目进展、双模式四持续、新流量、三层能力、治理、商化与 90 天行动`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`商业化`,`老板汇报`,`HTML`,`生产`]},{id:`stargate-financial-institutions-2026-08-02`,groupId:`ai-platform`,title:`Stargate 金融机构使用统计｜488 家接入、需求聚焦基金 AI 投研`,url:`https://clairku.github.io/clair-ai-studio/reports/stargate-financial-institutions-2026-08-02/`,preview:`stargate-financial-institutions-2026-08-02.svg`,pinned:!1,position:1,createdAt:`2026-08-02T14:30:00.000Z`,source:`生产数仓实查（ying99_oap）｜剔除盈米口径、类型 TOP10、需求场景与重点机构`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`Stargate`,`金融机构`,`数据报告`,`CLAIR`,`公开`,`HTML`,`生产`]},{id:`ai-h1-review-h2-okr-2026`,groupId:`ai-platform`,title:`AI 产品上半年复盘｜下半年 OKR`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-h1-review-h2-okr-2026/`,preview:`ai-h1-review-h2-okr-2026.svg`,pinned:!0,position:0,createdAt:`2026-08-02T09:55:00.000Z`,source:`飞书源文档｜挑战、规模证据、千问/微信、小顾、顾问提效、开放生态与组织转型`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`AI 小顾`,`顾问工作台`,`OKR`,`经营汇报`,`产品规划`,`HTML`,`生产`]},{id:`qieman-return-rate-incident-review-2026-08-04`,groupId:`product-planning`,title:`且慢累计收益率异常｜口径、边界与修复决策`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-return-rate-incident-review-2026-08-04/`,preview:`qieman-return-rate-incident-review-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T14:30:00.000Z`,source:`QMRD-46867｜三页面同一收益额对应三种收益率；证据审计、算法有效域、指标治理与 PM 决策，公开直达`,access:`production`,workType:`data-analysis`,tags:[`且慢`,`累计收益率`,`数据分析`,`产品规划`,`需求评审`,`Modified Dietz`,`TWR`,`口径治理`,`公开`,`HTML`,`生产`]},{id:`family-asset-report-five-visual-directions-2026-07-31`,groupId:`product-planning`,title:`家庭资产报告｜五套全新视觉方向`,url:`https://clairku.github.io/clair-ai-studio/reports/family-asset-report-five-visual-directions-2026-07-31/`,preview:`family-asset-report-five-visual-directions-2026-07-31.svg`,pinned:!0,position:0,createdAt:`2026-07-31T14:30:00.000Z`,source:`五套 Figma 原生视觉系统｜30 张 A4 样张与选型建议`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`产品规划`,`投顾服务`,`HTML`,`生产`]},{id:`family-asset-report-visual-review-2026-07-31`,groupId:`product-planning`,title:`家庭资产报告｜旧版视觉评审（已迭代）`,url:`https://clairku.github.io/clair-ai-studio/reports/family-asset-report-visual-review-2026-07-31/`,preview:`family-asset-report-visual-review-2026-07-31.svg`,pinned:!1,position:0,createdAt:`2026-07-31T13:30:00.000Z`,source:`旧版 Figma 视觉方案评审｜已由五套全新视觉方向替代`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`产品规划`,`投顾服务`,`HTML`,`生产`]},{id:`content-classification-review-sop-2026-07-30`,groupId:`knowledge`,title:`宣传推介材料｜内容分层标准与审核 SOP`,url:`https://clairku.github.io/clair-ai-studio/reports/content-classification-review-sop-2026-07-30/`,preview:`content-classification-review-sop-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T10:40:00.000Z`,source:`盈米内容治理｜两级分类、事前审核、双轨巡检与记录留痕`,access:`production`,workType:`governance-review`,tags:[`知识治理`,`HTML`,`生产`]},{id:`qieman-longwin-group-page-review-2026-07-30`,groupId:`product-planning`,title:`长赢同路人小组详情页｜双版产品评审`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-longwin-group-page-review-2026-07-30/`,preview:`qieman-longwin-group-page-review-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T08:57:42.000Z`,source:`左右双版视觉稿｜信息层级、加入资格、协议状态与转化闭环`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`投顾服务`,`产品规划`,`HTML`,`生产`]},{id:`ai-xiaogu-personal-service-demo-2026-07-30`,groupId:`xiaogu`,title:`AI 小顾｜个人投资服务与卡片广场 Demo`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-personal-service-demo-2026-07-30/`,preview:`ai-xiaogu-personal-service-demo-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T18:00:00.000Z`,source:`AI 小顾主动服务、追问归因、账户报告与卡片市场产品原型`,access:`production`,workType:`product-demo`,tags:[`AI 小顾`,`投顾服务`,`产品规划`,`HTML`,`生产`]},{id:`ai-service-blueprint-serif-2026-07-30`,groupId:`reporting`,title:`盈米 AI 服务蓝图｜统一能力底座与三端业务`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-service-blueprint-serif-2026-07-30/`,preview:`ai-service-blueprint-serif-2026-07-30.png`,pinned:!0,position:0,createdAt:`2026-07-30T16:30:00.000Z`,source:`两张业务蓝图视觉稿｜统一宋体版`,access:`production`},{id:`ai-xiaogu-product-experience-2026-07-30`,groupId:`xiaogu`,title:`且慢 AI 小顾｜八条关键产品经验`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-product-experience-2026-07-30/`,preview:`ai-xiaogu-product-experience-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T12:00:00.000Z`,source:`AI 小顾产品经验总结`,access:`production`},{id:`workbench-quality-audit-2026-07-30`,groupId:`ai-workbench`,title:`Clair's Studio｜全站质量审计与修复报告`,url:`https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/`,preview:`workbench-quality-audit-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-29T18:20:00.000Z`,source:`生产质量审计`,access:`production`},{id:`yingmi-ai-materials-compendium-2026-07-30`,groupId:`ai-platform`,title:`盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/`,pinned:!0,position:0,createdAt:`2026-07-30T06:30:00.000Z`,source:`飞书根材料与 40 个档案节点`,access:`production`},{id:`qieman-ai-product-practice-2026-07-30`,groupId:`ai-platform`,title:`盈米 AI 产品实践｜且慢产品团队`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-2026-07-30/`,preview:`qieman-ai-product-practice-2026-07-30.svg`,pinned:!0,position:1,createdAt:`2026-07-30T10:30:00.000Z`,source:`且慢产品团队｜业务蓝图 × 微信/千问外部入口 × 小顾全局规划 × 服务生态`,access:`production`},{id:`ai-three-projects-management-deck-2026-07-30`,groupId:`reporting`,title:`盈米 AI 金融服务操作系统蓝图｜用 AI 重做服务生产`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-three-projects-management-deck-2026-07-30/`,preview:`ai-three-projects-management-deck-2026-07-30.png`,pinned:!0,position:0,createdAt:`2026-07-30T07:00:00.000Z`,source:`飞书根材料与三个项目汇总`,access:`production`},{id:`seed-mcp-benchmark`,groupId:`ai-platform`,title:`三家金融 MCP / Skills 服务最完整对比｜010350 同题实测`,url:`https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/`,pinned:!0,position:0,createdAt:`2026-07-28T10:00:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-fund-report`,groupId:`research`,title:`东方财富妙想版｜010350 基金深度诊断`,url:`https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/`,pinned:!1,position:1,createdAt:`2026-07-28T09:30:00.000Z`,source:`近月新增`,access:`production`},{id:`storage-big-three-fund-screening`,groupId:`research`,title:`存储三巨头基金筛选｜境内 QDII 与港股通`,url:`https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T04:49:24.000Z`,source:`盈米 Skills / MCP`,access:`production`},{id:`seed-agreement`,groupId:`ai-platform`,title:`盈米 MCP 协议审查台`,url:`https://clairku.github.io/yingmi-mcp-agreement-review/`,pinned:!0,position:0,createdAt:`2026-07-28T08:50:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-xiaogu`,groupId:`xiaogu`,title:`且慢小顾介绍｜AI 投资助手`,url:`https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/`,pinned:!1,position:1,createdAt:`2026-07-27T07:40:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-strategy`,groupId:`research`,title:`公募策略多指标双轴探索器｜四笔钱`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html`,pinned:!1,position:0,createdAt:`2026-07-27T07:20:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-ecosystem`,groupId:`ai-platform`,title:`盈米 AI 实验室｜服务组件编排 Demo`,url:`https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/`,pinned:!1,position:2,createdAt:`2026-07-26T14:40:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-library-index`,groupId:`knowledge`,title:`且慢产品研究页面库｜原始总入口`,url:`https://clairku.github.io/qieman-product-research-library/`,pinned:!0,position:0,createdAt:`2026-07-26T09:23:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-inventory`,groupId:`product-planning`,title:`且慢投顾模块现况盘点报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html`,pinned:!1,position:0,createdAt:`2026-07-24T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-direction-research`,groupId:`product-planning`,title:`且慢 APP 投顾模块｜现况盘点与改版方向`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html`,pinned:!1,position:1,createdAt:`2026-07-23T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-v09`,groupId:`product-planning`,title:`且慢投顾页改版｜方向与方案设计 V0.9`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html`,pinned:!0,position:2,createdAt:`2026-07-24T09:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-network-research`,groupId:`product-planning`,title:`且慢产品现况网络调研报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html`,pinned:!1,position:3,createdAt:`2026-07-24T09:20:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-final`,groupId:`product-planning`,title:`且慢投顾页改版｜推荐方案定稿与备选`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html`,pinned:!1,position:4,createdAt:`2026-07-24T09:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-demo`,groupId:`product-planning`,title:`且慢投顾页改版交互 Demo｜方案 B`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html`,pinned:!1,position:5,createdAt:`2026-07-24T09:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-plan`,groupId:`product-planning`,title:`且慢投顾页改版｜产品规划与计划书`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html`,pinned:!1,position:6,createdAt:`2026-07-24T09:50:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-home-entry-analysis`,groupId:`xiaogu`,title:`且慢 App 首页金刚位分析报告｜修正版`,url:`https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8`,pinned:!1,position:2,createdAt:`2026-07-23T10:00:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-advisor-click-analysis`,groupId:`product-planning`,title:`且慢投顾页点击与转化分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html`,pinned:!1,position:7,createdAt:`2026-07-24T10:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-map`,groupId:`xiaogu`,title:`且慢 APP 完整功能全景`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html`,pinned:!1,position:3,createdAt:`2026-07-24T10:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-deep-analysis`,groupId:`xiaogu`,title:`且慢 App 深度产品分析报告`,url:`https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN`,pinned:!1,position:4,createdAt:`2026-07-24T10:20:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-app-usage`,groupId:`xiaogu`,title:`且慢 APP 使用情况与证据`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html`,pinned:!1,position:5,createdAt:`2026-07-24T10:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-roadmap`,groupId:`xiaogu`,title:`且慢 APP 深度产品判断与路线图`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html`,pinned:!1,position:6,createdAt:`2026-07-24T10:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-ai-native`,groupId:`xiaogu`,title:`且慢 APP AI 原生转型三案`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html`,pinned:!0,position:7,createdAt:`2026-07-24T10:50:00.000Z`,source:`研究库`,access:`production`},{id:`oap-progress-roadmap`,groupId:`ai-platform`,title:`OAP 进展与规划汇报`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html`,pinned:!1,position:3,createdAt:`2026-07-24T11:00:00.000Z`,source:`研究库`,access:`production`},{id:`oap-metrics-trend`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜上线以来运营趋势`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html`,pinned:!0,position:4,createdAt:`2026-07-28T10:11:00.000Z`,source:`近月新增`,access:`production`},{id:`oap-journey-metrics-2026-08-02`,groupId:`ai-platform`,title:`盈米 AI｜关键历程 × 用户增长`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html`,preview:`oap-journey-metrics-2026-08-02.svg`,pinned:!0,position:5,createdAt:`2026-08-02T13:40:00.000Z`,source:`16 个时间组 × 32 件事项 × 置顶联动 × 用户增长走势`,access:`production`},{id:`oap-reporting-framework`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html`,pinned:!0,position:6,createdAt:`2026-07-30T08:00:00.000Z`,source:`OAP 管理层汇报成稿`,access:`production`},{id:`oap-h2-okr-iteration-review`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜上线以来迭代复盘与下半年 OKR 汇报`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html`,pinned:!0,position:7,createdAt:`2026-07-31T15:30:00.000Z`,source:`OAP 管理层汇报`,access:`production`},{id:`oap-traffic-analysis`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜全站访问与点击分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html`,pinned:!0,position:8,createdAt:`2026-07-28T12:10:00.000Z`,source:`近月新增`,access:`production`},{id:`eastmoney-platform`,groupId:`ai-platform`,title:`东方财富 AI Skills 平台深度竞品分析`,url:`https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/`,pinned:!1,position:9,createdAt:`2026-07-28T08:57:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-strategy-explorer`,groupId:`research`,title:`四笔钱策略检视台｜筛选、对比与全指标分析`,url:`https://clairku.github.io/qieman-strategy-explorer/`,pinned:!1,position:2,createdAt:`2026-07-27T16:43:00.000Z`,source:`近月新增`,access:`production`},{id:`financial-planning-review`,groupId:`research`,title:`财务规划报告｜现金流与目标可达性改稿建议`,url:`https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/`,pinned:!1,position:3,createdAt:`2026-07-27T11:27:00.000Z`,source:`近月新增`,access:`production`},{id:`investment-behavior-report`,groupId:`research`,title:`投资行为画像｜行为金融洞察报告（脱敏版）`,url:`https://clairku.github.io/my-investment-behavior-report/`,pinned:!1,position:4,createdAt:`2026-07-16T14:56:00.000Z`,source:`近月新增`,access:`production`},{id:`product-review-workbench`,groupId:`product-planning`,title:`产品需求评审工作台`,url:`https://clairku.github.io/product-review-workbench/`,pinned:!0,position:8,createdAt:`2026-07-08T06:43:00.000Z`,source:`近月新增`,access:`production`},{id:`community-ai-review`,groupId:`product-planning`,title:`社区 AI 运营方案｜需求评审报告`,url:`https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/`,pinned:!1,position:9,createdAt:`2026-07-28T08:20:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-review`,groupId:`reporting`,title:`金榛子奖申报材料审查报告`,url:`https://clairku.github.io/jinzhenzi-submission-review/`,pinned:!1,position:0,createdAt:`2026-07-28T11:01:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-history`,groupId:`reporting`,title:`金榛子奖历届获奖项目档案`,url:`https://clairku.github.io/jinzhenzi-submission-review/history.html`,pinned:!1,position:1,createdAt:`2026-07-28T11:20:00.000Z`,source:`近月新增`,access:`production`},{id:`xiaogu-user-needs`,groupId:`xiaogu`,title:`小顾用户需求分析与关键钩子工具方案`,url:`https://clairku.github.io/xiaogu-user-needs-report/`,pinned:!1,position:8,createdAt:`2026-07-16T09:58:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-ai-advisor-ecosystem`,groupId:`xiaogu`,title:`且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo`,url:`https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site`,pinned:!0,position:9,createdAt:`2026-07-26T15:05:00.000Z`,source:`近月新增`,access:`account`},{id:`oap-h2-plan`,groupId:`reporting`,title:`2026 下半年 AI 开放平台目标计划与里程碑`,url:`https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf`,pinned:!1,position:2,createdAt:`2026-07-26T09:00:00.000Z`,source:`研究库`,access:`org`},{id:`ai-productization-roadshow-2026-07-30`,groupId:`reporting`,title:`AI 产品化实践路演｜CEO / CTO`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/`,pinned:!0,position:0,createdAt:`2026-07-30T00:00:00.000Z`,source:`CEO / CTO 路演材料`,access:`production`},{id:`advisor-report-skill-ai-practice`,groupId:`reporting`,title:`AI 工具实践案例｜顾问报告 Skill`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T15:30:00.000Z`,source:`顾问报告 Skill 材料`,access:`production`},{id:`ai-weekly-2026-07-13`,groupId:`reporting`,title:`AI 项目周报｜2026-07-13`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/`,pinned:!1,position:3,createdAt:`2026-07-13T02:20:23.000Z`,source:`近月补录`,access:`production`},{id:`pension-business-analysis`,groupId:`reporting`,title:`盈米及且慢养老金业务分析`,url:`https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/`,pinned:!1,position:4,createdAt:`2026-07-13T08:47:33.000Z`,source:`近月补录`,access:`production`},{id:`advisor-2-business-onboarding`,groupId:`reporting`,title:`盈米投顾 2.0｜新负责人业务入职报告`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/`,pinned:!1,position:5,createdAt:`2026-07-13T09:12:10.000Z`,source:`近月补录`,access:`production`},{id:`schwab-ria-benchmark`,groupId:`reporting`,title:`嘉信 2026 RIA 基准调研｜对盈米与且慢的启示`,url:`https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/`,pinned:!1,position:6,createdAt:`2026-07-22T02:40:53.000Z`,source:`近月补录`,access:`production`},{id:`skill-audit-2026-07-16`,groupId:`ai-workbench`,title:`25 项 Skills 可用性与一致性审查`,url:`https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/`,pinned:!1,position:0,createdAt:`2026-07-16T03:30:04.000Z`,source:`近月补录`,access:`production`},{id:`html-editor-guide`,groupId:`ai-workbench`,title:`Clair's Studio｜HTML 编辑器使用与安全说明`,url:`https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/`,pinned:!0,position:1,createdAt:`2026-07-29T16:00:00.000Z`,source:`产品能力`,access:`production`},{id:`yingmi-ai-capability-system`,groupId:`ai-platform`,title:`盈米 AI 能力体系专业报告｜2026.07`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/`,pinned:!1,position:8,createdAt:`2026-07-13T09:43:42.000Z`,source:`近月补录`,access:`production`}]},$t={"clair-product-design-reviewer-2026-08-06":`requirement-review`,"ai-xiaogu-product-experience-2026-07-30":`product-planning`,"workbench-quality-audit-2026-07-30":`governance-review`,"yingmi-ai-materials-compendium-2026-07-30":`reporting`,"qieman-ai-product-practice-2026-07-30":`product-planning`,"seed-mcp-benchmark":`competitive-research`,"seed-fund-report":`investment-research`,"storage-big-three-fund-screening":`investment-research`,"seed-agreement":`governance-review`,"seed-xiaogu":`product-planning`,"seed-strategy":`investment-research`,"seed-ecosystem":`product-demo`,"qieman-library-index":`governance-review`,"qieman-advisor-inventory":`product-planning`,"qieman-advisor-direction-research":`product-planning`,"qieman-advisor-v09":`product-planning`,"qieman-network-research":`competitive-research`,"qieman-advisor-final":`product-planning`,"qieman-advisor-demo":`product-demo`,"qieman-advisor-plan":`product-planning`,"qieman-home-entry-analysis":`data-analysis`,"qieman-advisor-click-analysis":`data-analysis`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`data-analysis`,"qieman-app-usage":`data-analysis`,"qieman-app-roadmap":`product-planning`,"qieman-ai-native":`product-planning`,"oap-progress-roadmap":`reporting`,"oap-metrics-trend":`data-analysis`,"oap-reporting-framework":`reporting`,"oap-h2-okr-iteration-review":`reporting`,"oap-traffic-analysis":`data-analysis`,"eastmoney-platform":`competitive-research`,"qieman-strategy-explorer":`investment-research`,"financial-planning-review":`requirement-review`,"investment-behavior-report":`data-analysis`,"product-review-workbench":`product-demo`,"community-ai-review":`requirement-review`,"jinzhenzi-review":`governance-review`,"jinzhenzi-history":`competitive-research`,"xiaogu-user-needs":`product-planning`,"qieman-ai-advisor-ecosystem":`product-demo`,"oap-h2-plan":`reporting`,"ai-productization-roadshow-2026-07-30":`reporting`,"advisor-report-skill-ai-practice":`reporting`,"ai-weekly-2026-07-13":`reporting`,"pension-business-analysis":`reporting`,"advisor-2-business-onboarding":`reporting`,"schwab-ria-benchmark":`competitive-research`,"skill-audit-2026-07-16":`governance-review`,"html-editor-guide":`product-demo`,"yingmi-ai-capability-system":`reporting`},en={"clair-product-design-reviewer-2026-08-06":`ai-workbench`,"ai-service-blueprint-serif-2026-07-30":`reporting`,"yingmi-ai-materials-compendium-2026-07-30":`ai-platform`,"qieman-ai-product-practice-2026-07-30":`ai-platform`,"qieman-home-entry-analysis":`product-planning`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`product-planning`,"qieman-app-usage":`product-planning`,"qieman-app-roadmap":`product-planning`,"financial-planning-review":`xiaogu`,"investment-behavior-report":`xiaogu`,"product-review-workbench":`ai-workbench`,"community-ai-review":`ai-workbench`,"qieman-ai-advisor-ecosystem":`ai-platform`,"oap-h2-plan":`ai-platform`,"oap-h2-okr-iteration-review":`ai-platform`};function tn(e){let t=`${e.title||``} ${e.source||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/需求评审|评审工作台/.test(t)?`requirement-review`:/竞品|对比|调研|研究/.test(t)?`competitive-research`:/周报|汇报|进展|规划|里程碑|业务分析/.test(t)?`reporting`:/数据|趋势|点击|转化|画像|使用/.test(t)?`data-analysis`:/基金|策略|投研|资产配置/.test(t)?`investment-research`:/审查|治理|知识/.test(t)?`governance-review`:/Demo|Studio|工作台|原型/i.test(t)?`product-demo`:`product-planning`}function nn(e,t=tn(e)){let n=`${e.id||``} ${e.groupId||``} ${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`,r=[],i=e=>{r.includes(e)||r.push(e)};return e.isProduction&&i(`生产`),e.isPersonal&&i(`个人`),/ontology\.yingmi-inc\.com|本体/.test(n)&&i(`本体`),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(n)&&i(`飞书`),(t===`competitive-research`||/调研|研究|盘点/.test(n))&&i(`调研`),t===`product-planning`&&i(`产品规划`),(/xiaogu|小顾|财务规划|投资行为/.test(n)||e.groupId===`xiaogu`)&&i(`AI 小顾`),(/studio|workbench|工作台|skill-audit/i.test(n)||e.groupId===`ai-workbench`)&&i(`AI 工作台`),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(n)||e.groupId===`ai-platform`)&&i(`AI 开放平台`),/且慢|qieman/.test(n)&&i(`且慢`),/投顾|advisor|财务规划/.test(n)&&i(`投顾服务`),/OAP|oap-/.test(n)&&i(`OAP`),/MCP|mcp-/.test(n)&&i(`MCP`),/Skills|skill-/.test(n)&&i(`Skills`),(t===`investment-research`||e.groupId===`research`)&&i(`投研`),t===`data-analysis`&&i(`数据分析`),t===`requirement-review`&&i(`需求评审`),t===`reporting`&&i(`经营汇报`),(t===`governance-review`||e.groupId===`knowledge`)&&i(`知识治理`),r.slice(0,5)}function rn(e){let t=`${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(t)?`xiaogu`:/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(t)?`ai-platform`:/Studio|工作台|生产力|Copilot|编辑器/i.test(t)?`ai-workbench`:/基金|投研|策略|资产配置|股票|债券/.test(t)?`research`:/汇报|周报|月报|经营|进展|里程碑/.test(t)?`reporting`:/知识|SOUL|飞书|治理|本体|文档库/.test(t)?`knowledge`:/且慢|产品|需求|方案|原型|体验|PRD/i.test(t)?`product-planning`:{"requirement-review":`product-planning`,"competitive-research":`product-planning`,reporting:`reporting`,"data-analysis":`reporting`,"investment-research":`research`,"governance-review":`knowledge`,"product-demo":`ai-workbench`,"product-planning":`product-planning`}[e.workType]||`product-planning`}T.reports=T.reports.map(e=>{let t=en[e.id]||e.groupId,n=$t[e.id]||tn(e),r={...e,groupId:t,workType:n};return{...r,tags:nn(r,n)}});var E=kn(),an=Tn(),D=En(),O=``,k=``,on=!1,A=[`topic`,`type`,`tag`,`time`].includes(localStorage.getItem(Kt))?localStorage.getItem(Kt):`topic`,j=[`created`,`modified`].includes(localStorage.getItem(qt))?localStorage.getItem(qt):`created`,M=``,N=``,P=null,F=null,I=null,sn=0,cn=null,ln=0,L=0,R=0,un=0,dn=``,fn=0,pn=null,mn=null,z={},hn=null,gn=!1;function B(e){return JSON.parse(JSON.stringify(e))}function _n(e){try{let t=new URL(e.url).pathname.split(`/`).filter(Boolean),n=t.indexOf(`reports`);return n>=0&&t[n+1]||e.id}catch{return e.id}}function vn(e){return{...e,searchContent:z[e.id]||z[_n(e)]||``}}function yn(e){if([`org`,`account`].includes(e.access))return`restricted`;if(z[e.id]||z[_n(e)])return`body`;if(!e.url)return`metadata`;try{let t=new URL(e.url);return t.hostname.toLowerCase()===`clairku.github.io`&&t.pathname.startsWith(`/clair-ai-studio/reports/`)?`metadata`:`external`}catch{return`metadata`}}function bn(e){let t={body:0,metadata:0,restricted:0,external:0};return e.forEach(e=>{t[yn(e)]+=1}),t}var xn={title:`标题`,tags:`标签`,content:`正文`,source:`来源`,type:`类型`,topic:`主题`,url:`网址`,access:`权限`},Sn={body:`已索引正文`,metadata:`仅标题 / 标签`,restricted:`受限不可索引`,external:`外部页面不可抓取`};function Cn(e,t){let n={group:E.groups.find(t=>t.id===e.groupId),workTypeName:Yn(e.workType)};return Ut(vn(e),t,n).map(e=>xn[e]).filter(Boolean)}function wn(){return hn||(hn=fetch(`./search-index.json`,{cache:`no-store`}).then(e=>e.ok?e.json():{}).then(e=>{if(z=e&&typeof e==`object`?e:{},gn=!0,!k&&!on){let e=document.getElementById(`search-input`)?.selectionStart??O.length;Q(()=>document.querySelector(`.results-toolbar, .archive-search`));let t=document.getElementById(`search-input`);O&&(t?.focus({preventScroll:!0}),t?.setSelectionRange(e,e))}return z}).catch(()=>(gn=!0,z={},z)),hn)}function Tn(){try{let e=JSON.parse(localStorage.getItem(Jt));if(e&&typeof e==`object`)return Object.fromEntries(Object.entries(e).map(([e,t])=>[e,Array.isArray(t)?t.filter(e=>typeof e==`string`):[]]))}catch{}return{}}function En(){try{let e=JSON.parse(localStorage.getItem(Yt));if(e&&typeof e==`object`)return e}catch{}return{}}function Dn(){localStorage.setItem(Yt,JSON.stringify(D))}function On(e=``){try{let t=new URL(e);t.hash=``,t.search=``;let n=decodeURI(t.pathname).replace(/\/index\.html$/,`/`).replace(/\/+$/,`/`);return`${t.origin}${n}`}catch{return String(e).trim().replace(/\/+$/,`/`)}}function kn(){try{let e=JSON.parse(localStorage.getItem(Gt));if(Array.isArray(e?.groups)&&Array.isArray(e?.reports))return An(e)}catch{}return B(T)}function An(e){let t=B(T),n=new Set(t.groups.map(e=>e.id)),r=new Set([`inbox`,`today`,`product`,`research`]),i=new Map(e.groups.map(e=>[e.id,e])),a=t.groups.map(t=>{let n=i.get(t.id);return!n||e.version<C?t:{...t,name:n.name||t.name,description:n.description||t.description,position:Number.isFinite(n.position)?n.position:t.position}});e.groups.filter(e=>!n.has(e.id)&&!r.has(e.id)).forEach((e,t)=>{a.push({...e,description:e.description||`自定义工作分组`,position:Number.isFinite(e.position)?e.position:T.groups.length+t})});let o=a.filter((e,t,n)=>n.findIndex(t=>t.id===e.id)===t);o.sort((e,t)=>(e.position||0)-(t.position||0));let s={"seed-mcp-benchmark":`ai-platform`,"seed-fund-report":`research`,"seed-agreement":`ai-platform`,"seed-xiaogu":`xiaogu`,"seed-strategy":`research`,"seed-ecosystem":`ai-platform`,"storage-big-three-fund-screening":`research`},c={inbox:`product-planning`,today:`product-planning`,product:`xiaogu`,research:`research`},l=e.reports.map(e=>({...e,groupId:en[e.id]||s[e.id]||(e.groupId===`inbox`?rn(e):c[e.groupId])||e.groupId||rn(e),workType:e.workType||$t[e.id]||tn(e),tags:Array.isArray(e.tags)&&e.tags.length?e.tags:nn(e,e.workType||$t[e.id])})),u=new Map(l.map(e=>[e.id,e])),d=new Map(l.map(e=>[On(e.url),e])),f=new Set,p=new Set,m=t.reports.map(t=>{let n=On(t.url);f.add(n),p.add(t.id);let r=u.get(t.id)||d.get(n);return r?{...t,title:e.version>=C&&r.title||t.title,groupId:e.version>=C&&o.some(e=>e.id===r.groupId)?r.groupId:t.groupId,workType:e.version>=C&&r.workType?r.workType:t.workType,tags:e.version>=C&&Array.isArray(r.tags)&&r.tags.length?r.tags:t.tags,pinned:!!r.pinned,modifiedAt:r.modifiedAt||t.modifiedAt||t.createdAt,position:Number.isFinite(r.position)?r.position:t.position,archived:!!r.archived,archivedAt:r.archivedAt||``}:t});l.forEach(e=>{let t=On(e.url);p.has(e.id)||t&&f.has(t)||(p.add(e.id),t&&f.add(t),m.push(e))});let h={version:C,groups:o,reports:m};return localStorage.setItem(Gt,JSON.stringify(h)),h}function V(){E.version=C,E.groups.forEach((e,t)=>{e.position=t}),localStorage.setItem(Gt,JSON.stringify(E))}function jn(e=``){return(String(e).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(sr)||``}function Mn(e,t,n){let r=Rn(e,t).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,` `).trim();if(r)return r.slice(0,100);let i=String(e).split(/\n/).map(e=>e.trim().replace(/^#+\s*/,``)).find(e=>e&&!/^https?:\/\//i.test(e));return i?i.replace(/[。；;！!？?]+$/,``).slice(0,100):t[0]?.name?t[0].name.replace(/\.[^.]+$/,``).slice(0,100):n?or(n):`未命名成果`}function Nn(e=``){return String(e).trim().replace(/\s+/g,` `).toLocaleLowerCase()}function Pn(e=[]){return e.map(e=>`${String(e.name||``).trim().toLocaleLowerCase()}:${e.size||0}:${e.type||``}`).sort().join(`|`)}function Fn({material:e,files:t,url:n,excludeId:r=``}){let i=n?On(n):``,a=Nn(e),o=Pn(t);return E.reports.find(e=>e.id===r?!1:i&&On(e.url)===i||a&&Nn(e.savedContent)===a?!0:!a&&!!o&&Pn(e.savedFiles)===o)||null}function In(e=``){try{let t=new URL(e),n=t.hostname.toLowerCase(),r=t.pathname.split(`/`).filter(Boolean)[0]?.toLowerCase();return n===`clairku.github.io`||(n===`github.com`||n===`raw.githubusercontent.com`)&&r===`clairku`}catch{return!1}}function Ln(e=``){try{return/\.html?$/i.test(new URL(e).pathname)}catch{return!1}}function Rn(e=``,t=[]){if(/<!doctype\s+html|<html[\s>]/i.test(e))return e.trim();let n=t.length===1&&/\.html?$/i.test(t[0]?.name)?t[0]:null;return n?.content||n?.excerpt||``}function zn(e=``){try{let t=new URL(e).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(t))return{access:`org`,provider:`飞书组织帐号`};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(t))return{access:`account`,provider:`腾讯文档帐号`};if(/(^|\.)yingmi-inc\.com$/.test(t))return{access:`org`,provider:`盈米组织帐号`};if(t===`github.com`&&/^\/login(?:\/|$)/.test(new URL(e).pathname))return{access:`account`,provider:`GitHub 帐号`}}catch{return null}return null}async function Bn(e){if(!sr(e))return{title:``,description:``,reachable:!1,checked:!0};let t=new URL(e);if(t.origin!==window.location.origin)return{title:``,description:``,reachable:!1,checked:!1};try{let e=await fetch(t.href,{headers:{Accept:`text/html`},signal:AbortSignal.timeout(1e4)});if(!e.ok)return{title:``,description:``,reachable:!1,checked:!0};let n=await e.text(),r=new DOMParser().parseFromString(n,`text/html`);return{title:r.title.trim().slice(0,180),description:r.querySelector(`meta[name="description"]`)?.getAttribute(`content`)?.trim().slice(0,500)||``,reachable:!0,checked:!0}}catch{return{title:``,description:``,reachable:!1,checked:!1}}}async function Vn({material:e=``,files:t=[],url:n=``},r=()=>{}){let i=Rn(e,t),a=t.some(e=>/\.html?$/i.test(e.name));if(!n)return!i&&!t.length?{allowed:!1,reason:a?`HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML`:`请上传支持的档案、粘贴内容，或输入可正常访问的网址`}:{allowed:!0,access:`local`,metadata:{title:``,description:``,reachable:!0,checked:!0},isHtml:!!i,savedHtml:i,loginProvider:``};let o=zn(n);r(o?`正在识别权限页面与登录入口…`:`正在检查页面是否可正常访问…`);let s=o?{title:``,description:``,reachable:!0,checked:!0}:await Bn(n);return!o&&s.checked&&!s.reachable?{allowed:!1,reason:`页面无法正常访问，且不是可读取的 HTML，未保存`}:{allowed:!0,access:o?.access||`production`,metadata:s,isHtml:Ln(n),savedHtml:``,loginProvider:o?.provider||``}}async function Hn({material:e,files:t},n=()=>{}){let r=jn(e);n(`正在检查成果库是否已有相同内容…`);let i=Fn({material:e,files:t,url:r});if(i)return{...i,duplicate:!0,groupName:E.groups.find(e=>e.id===i.groupId)?.name||`未归类`,workTypeName:Yn(i.workType)};let a=await Vn({material:e,files:t,url:r},n);if(!a.allowed)return{rejected:!0,duplicate:!1,reason:a.reason};let o=Mn(e,t,r),s=a.metadata;n(`正在识别标题、分组、类型与标签…`);let c=new Date().toISOString(),l={id:rr(`report`),groupId:`product-planning`,title:s.title||o,url:r,pinned:!1,position:0,createdAt:c,modifiedAt:c,source:r?`快捷保存`:`本地保存`,access:a.access,archived:!1,archivedAt:``,savedContent:e,savedFiles:[],detectedDescription:s.description,manualSaved:!0,isProduction:a.access===`production`,isPersonal:In(r),isHtml:a.isHtml,savedHtml:a.savedHtml,loginProvider:a.loginProvider};try{l.savedFiles=await Dr(l.id,t)}catch{return{rejected:!0,duplicate:!1,reason:`档案无法写入浏览器文件库，请检查浏览器储存空间后重试`}}l.workType=tn(l),l.groupId=rn(l),l.tags=nn(l,l.workType),n(`正在保存到成果库…`),l.position=E.reports.filter(e=>!e.archived&&e.groupId===l.groupId).length,E.reports.push(l);try{V()}catch{return E.reports.pop(),await kr(l.id),{rejected:!0,duplicate:!1,reason:`成果资料超过当前浏览器可保存容量，请先精简内容后重试`}}return on=!1,A!==`time`&&(A=`topic`),O=``,localStorage.setItem(Kt,A),{...l,duplicate:!1,groupName:E.groups.find(e=>e.id===l.groupId)?.name||`未归类`,workTypeName:Yn(l.workType)}}function Un(e,t){if(t===`topic`)return e;let n=an[t]||[];if(!n.length)return e;let r=new Map(n.map((e,t)=>[e,t]));return[...e].sort((e,t)=>(r.has(e.id)?r.get(e.id):2**53-1)-(r.has(t.id)?r.get(t.id):2**53-1))}function Wn(e,t,n=A){if(!e||![`top`,`up`,`down`,`bottom`].includes(t)||n===`time`||n===`featured`)return!1;let r=n===`topic`?E.groups.map(e=>e.id):Qn(E.reports.filter(e=>!e.archived)).filter(e=>e.kind===n).map(e=>e.id),i=r.indexOf(e);if(i<0)return!1;let a=t===`top`?0:t===`up`?i-1:t===`down`?i+1:r.length-1;if(a<0||a>=r.length||a===i)return!1;let[o]=r.splice(i,1);if(r.splice(a,0,o),n===`topic`){let e=new Map(r.map((e,t)=>[e,t]));return E.groups.sort((t,n)=>e.get(t.id)-e.get(n.id)),E.groups.forEach((e,t)=>{e.position=t}),V(),!0}return an[n]=r,localStorage.setItem(Jt,JSON.stringify(an)),!0}function H(e){e.modifiedAt=new Date().toISOString()}function Gn(e,t){return`${e}:${t}`}function Kn(e,t,n,r){let i=typeof r==`function`?[...e].sort(r):[...e],a=D[Gn(t,n)]||[];if(!a.length)return i;let o=new Map(a.map((e,t)=>[e,t]));return i.sort((e,t)=>(o.has(e.id)?o.get(e.id):2**53-1)-(o.has(t.id)?o.get(t.id):2**53-1))}function qn(e,t,n,r=``,i=!1){if(![`type`,`tag`,`featured`].includes(e)||!t)return;let a=Kn(e===`featured`?E.reports.filter(e=>!e.archived&&e.pinned):e===`type`?E.reports.filter(e=>!e.archived&&e.workType===t):E.reports.filter(e=>!e.archived&&(e.tags||[]).includes(t)),e,t,(e,t)=>Xn(t)-Xn(e)).map(e=>e.id).filter(e=>e!==n),o=r?a.indexOf(r):a.length;o<0&&(o=a.length),r&&i&&(o+=1),a.splice(o,0,n),D[Gn(e,t)]=a,Dn()}function Jn(e,t,n=``,r=!1){let i=E.reports.find(t=>t.id===e);if(!i||i.archived||!E.groups.find(e=>e.id===t))return!1;let a=E.reports.filter(n=>!n.archived&&n.groupId===t&&n.id!==e).sort((e,t)=>(e.position||0)-(t.position||0)),o=n?a.findIndex(e=>e.id===n):a.length;return o>=0&&n&&r&&(o+=1),i.groupId=t,H(i),a.splice(o<0?a.length:o,0,i),a.forEach((e,t)=>{e.position=t}),V(),!0}function Yn(e){return Zt.find(t=>t.id===e)?.name||`产品规划`}function Xn(e){let t=new Date(e.createdAt||0).getTime();return Number.isFinite(t)?t:0}function Zn(e){let t=new Date(e.modifiedAt||e.createdAt||0).getTime();return Number.isFinite(t)?t:0}function Qn(e,t=``){let n=e=>!t||x(e).includes(t);if(A===`time`){let t=[...e].sort((e,t)=>j===`modified`?Zn(t)-Zn(e):Xn(t)-Xn(e));return[{id:j,name:j===`modified`?`Modified`:`Created`,kind:`time`,accent:`slate`,reports:t}]}if(A===`type`)return Un(Zt.map(t=>({id:t.id,name:t.name,kind:`type`,accent:`blue`,reports:Kn(e.filter(e=>e.workType===t.id),`type`,t.id,(e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>!t||e.reports.length||n(e.name)),`type`);if(A===`tag`){let r=new Set(Qt);return E.reports.forEach(e=>{(e.tags||[]).forEach(e=>r.add(e))}),Un([...r].sort((e,t)=>{let n=Qt.indexOf(e),r=Qt.indexOf(t);return n>=0||r>=0?(n<0?2**53-1:n)-(r<0?2**53-1:r):e.localeCompare(t,`zh-CN`)}).map(t=>({id:t,name:t,kind:`tag`,accent:`violet`,reports:Kn(e.filter(e=>(e.tags||[]).includes(t)),`tag`,t,(e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>e.reports.length&&(!t||n(e.name)||e.reports.length)),`tag`)}return E.groups.map(t=>({...t,kind:`topic`,reports:e.filter(e=>e.groupId===t.id).sort((e,t)=>(e.position||0)-(t.position||0))})).filter(e=>!t||e.reports.length||n(`${e.name} ${e.description||``}`))}function $n(e,t,n,r=``,i=!1){let a=E.reports.find(t=>t.id===e);return!a||a.archived?!1:t===`topic`?Jn(e,n,r,i):t===`type`?Zt.some(e=>e.id===n)?(a.workType=n,H(a),V(),qn(`type`,n,e,r,i),!0):!1:t===`tag`?(a.tags=Array.isArray(a.tags)?a.tags:[],a.tags.includes(n)||a.tags.push(n),H(a),V(),qn(`tag`,n,e,r,i),!0):t===`featured`?(a.pinned=!0,H(a),V(),qn(`featured`,`featured`,e,r,i),!0):!1}function er(){return A===`type`?`工作类型`:A===`tag`?`标签`:A===`time`?`新增时间`:`主题`}function tr(e,t){return e.map(e=>({report:e,score:Wt(vn(e),t,{group:E.groups.find(t=>t.id===e.groupId),workTypeName:Yn(e.workType)})})).filter(e=>e.score>0).sort((e,t)=>t.score-e.score||Zn(t.report)-Zn(e.report)||String(e.report.title).localeCompare(t.report.title,`zh-CN`)).map(e=>e.report)}function nr(e,t){let n=z[e.id]||z[_n(e)]||``,r=[e.source,e.description,e.savedContent,e.savedHtml,...(e.savedFiles||[]).flatMap(e=>[e?.name,e?.excerpt,e?.content]),n].filter(Boolean).join(` · `).replace(/<style[\s\S]*?<\/style>/gi,` `).replace(/<script[\s\S]*?<\/script>/gi,` `).replace(/<[^>]+>/g,` `).replace(/\s+/g,` `).trim();if(!r)return``;let i=x(r),a=zt(t).find(e=>i.includes(e));if(!a)return r.slice(0,96);let o=i.indexOf(a),s=Math.max(0,o-34),c=Math.min(r.length,o+a.length+62);return`${s?`…`:``}${r.slice(s,c).trim()}${c<r.length?`…`:``}`}function rr(e){return`${e}-${crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}`}function U(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}var ir={back:`
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
    </svg>`};function ar(e){return ir[e]||``}function or(e){try{return new URL(e).hostname.replace(/^www\./,``)}catch{return e}}function sr(e){try{return[`http:`,`https:`].includes(new URL(e).protocol)}catch{return!1}}function W(e=``){return[...new Set(String(e).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function cr(){let e=new Set(Qt);return E.reports.forEach(t=>{(t.tags||[]).forEach(t=>e.add(t))}),[...e].filter(e=>![`HTML`,`手动保存`,`生产`].includes(e))}function G(e,{duration:t=2600,actionLabel:n=``,onAction:r=null}={}){document.querySelector(`.toast`)?.remove();let i=document.createElement(`div`);i.className=`toast`,i.setAttribute(`role`,`status`);let a=document.createElement(`span`);if(a.textContent=e,i.append(a),n&&typeof r==`function`){let e=document.createElement(`button`);e.type=`button`,e.className=`toast-action`,e.textContent=n,e.addEventListener(`click`,()=>{clearTimeout(sn),i.remove(),r()}),i.append(e)}document.body.append(i),clearTimeout(sn),sn=window.setTimeout(()=>i.remove(),t)}function lr(e,t){G(e,{duration:8e3,actionLabel:`撤销`,onAction:()=>{t(),G(`已撤销刚才的操作`)}})}function ur(e){let t=e?.closest?.(`[data-action]`);return t?{action:t.dataset.action||``,id:t.dataset.id||``,bucketKind:t.dataset.bucketKind||``,direction:t.dataset.direction||``}:null}function dr(e){if(!e?.action)return null;let t=[`[data-action="${CSS.escape(e.action)}"]`,e.id?`[data-id="${CSS.escape(e.id)}"]`:``,e.bucketKind?`[data-bucket-kind="${CSS.escape(e.bucketKind)}"]`:``,e.direction?`[data-direction="${CSS.escape(e.direction)}"]`:``].join(``);return document.querySelector(t)}function fr(e,t,n){mn=t||X(),cn=ur(n||document.activeElement),ln=window.scrollY,I=e,Z(mn)}function K({fallbackSelector:e=`.results-toolbar, .archive-search, .reader-header`}={}){if(!I)return;let t=mn||{scrollY:ln},n=cn;I=null,Z(t),mn=null,cn=null,requestAnimationFrame(()=>{let t=document.querySelector(e);(dr(n)||t?.querySelector(`button, input, [tabindex]:not([tabindex='-1'])`)||t)?.focus?.({preventScroll:!0})})}function pr(){let e=document.querySelector(`.app-shell > .dialog-backdrop`);if(e?document.body.style.setProperty(`--studio-modal-scroll-top`,`${-ln}px`):document.body.style.removeProperty(`--studio-modal-scroll-top`),document.body.classList.toggle(`studio-modal-open`,!!e),!e)return;[...e.parentElement.children].forEach(t=>{t!==e&&(t.inert=!0,t.setAttribute(`aria-hidden`,`true`))});let t=e.querySelector(`[role="dialog"]`);if(!t)return;let n=()=>[...t.querySelectorAll([`a[href]`,`button:not([disabled])`,`input:not([disabled]):not([type='hidden'])`,`select:not([disabled])`,`textarea:not([disabled])`,`[tabindex]:not([tabindex='-1'])`].join(`,`))].filter(e=>!e.hidden&&e.getClientRects().length);e.addEventListener(`keydown`,e=>{if(e.key===`Escape`){e.preventDefault(),K();return}if(e.key!==`Tab`)return;let r=n();if(!r.length){e.preventDefault(),t.focus({preventScroll:!0});return}let i=r[0],a=r.at(-1);e.shiftKey&&document.activeElement===i?(e.preventDefault(),a.focus({preventScroll:!0})):!e.shiftKey&&document.activeElement===a&&(e.preventDefault(),i.focus({preventScroll:!0}))}),e.addEventListener(`click`,t=>{t.target===e&&K()}),requestAnimationFrame(()=>{(t.querySelector(`[autofocus]`)||n()[0]||t)?.focus?.({preventScroll:!0})})}function mr(e=`auto`){q(),R=requestAnimationFrame(()=>{R=0,window.scrollTo({top:0,left:0,behavior:e})})}function q(){L&&cancelAnimationFrame(L),R&&cancelAnimationFrame(R),un&&cancelAnimationFrame(un),L=0,R=0,un=0}function hr(){let e=document.querySelector(`.topbar`)?.getBoundingClientRect().bottom||0,t=document.querySelector(`.topic-nav`),n=t?getComputedStyle(t):null,r=t?.getBoundingClientRect();if(!window.matchMedia(`(max-width: 840px)`).matches){let t=n?.position===`sticky`&&Number.parseFloat(n.top)||0;return Math.max(e+22,t)}let i=n?.position===`sticky`&&r?.bottom>0?r.bottom:0;return Math.max(e,i)+10}function gr(e,t=`smooth`){if(!e)return;q();let n=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),r=Math.max(0,Math.min(n,window.scrollY+e.getBoundingClientRect().top-hr())),i=window.scrollY,a=r-i;if(Math.abs(a)<2)return;if(t!==`smooth`||matchMedia(`(prefers-reduced-motion: reduce)`).matches){window.scrollTo({top:r,left:0,behavior:`auto`});return}let o=Math.min(360,Math.max(180,Math.abs(a)*.22)),s=performance.now(),c=t=>{if(!e.isConnected){L=0;return}let n=Math.min(1,(t-s)/o),r=1-(1-n)**3,l=Math.max(0,Math.min(Math.max(0,document.documentElement.scrollHeight-window.innerHeight),window.scrollY+e.getBoundingClientRect().top-hr()));a=l-i,window.scrollTo(0,i+a*r),n<1?L=requestAnimationFrame(c):(L=0,window.scrollTo(0,l))};L=requestAnimationFrame(c)}function J(e,t){return document.querySelector(`.group-column[data-bucket-kind="${CSS.escape(e)}"][data-bucket-id="${CSS.escape(t)}"]`)}function Y(e){return document.querySelector(`.board .report-card[data-report-id="${CSS.escape(e)}"]`)}function _r(e){if(!e)return null;let t=e.closest?.(`.report-card[data-report-id]`);if(t){let e=t.closest(`.group-column[data-bucket-kind][data-bucket-id]`);return{type:`report`,id:t.dataset.reportId,bucketKind:e?.dataset.bucketKind||``,bucketId:e?.dataset.bucketId||``}}let n=e.closest?.(`.group-column[data-bucket-kind][data-bucket-id]`);if(n)return{type:`bucket`,kind:n.dataset.bucketKind,id:n.dataset.bucketId};let r=e.closest?.(`.results-toolbar, .archive-search, .prompt-composer, .groups-section, .library-layout`);return r?{type:`selector`,selector:r.classList.contains(`results-toolbar`)?`.results-toolbar`:r.classList.contains(`archive-search`)?`.archive-search`:r.classList.contains(`prompt-composer`)?`.prompt-composer`:r.classList.contains(`groups-section`)?`.groups-section`:`.library-layout`}:null}function vr(e){return e?e.type===`report`?(e.bucketKind&&e.bucketId?J(e.bucketKind,e.bucketId):null)?.querySelector(`.report-card[data-report-id="${CSS.escape(e.id)}"]`)||Y(e.id):e.type===`bucket`?J(e.kind,e.id):e.type===`selector`?document.querySelector(e.selector):null:null}function yr(){let e=hr(),t=t=>[...document.querySelectorAll(t)].filter(t=>{let n=t.getBoundingClientRect();return n.bottom>e&&n.top<window.innerHeight}).sort((t,n)=>Math.abs(t.getBoundingClientRect().top-e)-Math.abs(n.getBoundingClientRect().top-e))[0];return t(`.board .report-card[data-report-id]`)||t(`.group-column[data-bucket-id]`)||t(`.results-toolbar, .archive-search, .prompt-composer`)||document.querySelector(`.results-toolbar, .archive-search, .groups-section, .library-layout`)}function X(e=null){q();let t=e||yr();return{scrollY:window.scrollY,identity:_r(t),viewportTop:t?.getBoundingClientRect().top??null}}function br(e){if(!e)return;q();let t=()=>{let t=vr(e.identity),n=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),r=t&&Number.isFinite(e.viewportTop)?window.scrollY+t.getBoundingClientRect().top-e.viewportTop:e.scrollY;window.scrollTo({top:Math.max(0,Math.min(n,r)),left:0,behavior:`auto`})};t(),un=requestAnimationFrame(()=>{un=requestAnimationFrame(()=>{un=0,t()})})}function Z(e){$(),br(e)}function xr(e,t=null){let n=t||Y(e),r=n?.nextElementSibling?.matches?.(`.report-card[data-report-id]`)?n.nextElementSibling:n?.previousElementSibling?.matches?.(`.report-card[data-report-id]`)?n.previousElementSibling:null;if(!r){let e=n?.closest(`.group-column[data-bucket-id]`),t=e?.nextElementSibling?.matches?.(`.group-column[data-bucket-id]`)?e.nextElementSibling:e?.previousElementSibling?.matches?.(`.group-column[data-bucket-id]`)?e.previousElementSibling:null;r=t?.querySelector(`.report-card[data-report-id]`)||t||n}return X(r)}function Sr(e,t){let n=J(e,t);return X(n?.nextElementSibling?.matches?.(`.group-column[data-bucket-id]`)?n.nextElementSibling:n?.previousElementSibling?.matches?.(`.group-column[data-bucket-id]`)?n.previousElementSibling:n)}function Cr(e,t=`smooth`){q(),R=requestAnimationFrame(()=>{R=requestAnimationFrame(()=>{R=0,gr(e(),t)})})}function Q(e=null){Z(X(typeof e==`function`?e():e))}[`wheel`,`touchstart`,`pointerdown`].forEach(e=>{window.addEventListener(e,q,{passive:!0})});var wr=null,Tr=new Set;function Er(){return wr||(wr=new Promise((e,t)=>{if(!window.indexedDB){t(Error(`IndexedDB unavailable`));return}let n=indexedDB.open(Xt,1);n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(S)||e.createObjectStore(S,{keyPath:`id`}).createIndex(`reportId`,`reportId`,{unique:!1})},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error||Error(`File database failed`))}),wr)}async function Dr(e,t=[]){let n=t.map(t=>{let{blob:n,...r}=t;return{...r,storageId:n instanceof Blob?`${e}:${t.id}`:t.storageId||``,blob:n}}),r=n.filter(e=>e.blob instanceof Blob&&e.storageId);if(r.length){let t=await Er();await new Promise((n,i)=>{let a=t.transaction(S,`readwrite`),o=a.objectStore(S);r.forEach(t=>{o.put({id:t.storageId,reportId:e,name:t.name,type:t.type,size:t.size,blob:t.blob,updatedAt:new Date().toISOString()})}),a.oncomplete=n,a.onerror=()=>i(a.error||Error(`File save failed`)),a.onabort=()=>i(a.error||Error(`File save aborted`))})}return n.map(({blob:e,...t})=>t)}async function Or(e){if(e?.storageId)try{let t=await Er(),n=await new Promise((n,r)=>{let i=t.transaction(S,`readonly`).objectStore(S).get(e.storageId);i.onsuccess=()=>n(i.result),i.onerror=()=>r(i.error||Error(`File read failed`))});if(n?.blob instanceof Blob)return n.blob}catch{return null}let t=e?.content||e?.excerpt;return t?new Blob([t],{type:e.type||`text/plain;charset=utf-8`}):null}async function kr(e){try{let t=await Er();await new Promise((n,r)=>{let i=t.transaction(S,`readwrite`),a=i.objectStore(S),o=a.index(`reportId`).openKeyCursor(IDBKeyRange.only(e));o.onsuccess=()=>{let e=o.result;e&&(a.delete(e.primaryKey),e.continue())},o.onerror=()=>r(o.error||Error(`File cleanup failed`)),i.oncomplete=n,i.onerror=()=>r(i.error||Error(`File cleanup failed`))})}catch{}}function Ar(){Tr.forEach(e=>URL.revokeObjectURL(e)),Tr.clear()}function jr(e){let t=URL.createObjectURL(e);return Tr.add(t),t}async function Mr(){let e=[...document.querySelectorAll(`[data-saved-file-preview]`)];await Promise.all(e.map(async e=>{let t=E.reports.find(t=>t.id===e.dataset.reportId)?.savedFiles?.find(t=>t.id===e.dataset.fileId);if(!t)return;e.classList.add(`is-loading`),e.setAttribute(`aria-busy`,`true`);let n=await Or(t);if(!n||!e.isConnected){e.classList.remove(`is-loading`),e.setAttribute(`aria-busy`,`false`);return}let r=e.dataset.previewMode;try{if(r===`image`){let r=document.createElement(`img`);r.src=jr(n),r.alt=t.name||`图片预览`,r.draggable=!1,e.replaceChildren(r)}else if(r===`html`){let r=document.createElement(`iframe`);r.src=jr(n),r.title=`${t.name||`HTML`}内容`,r.setAttribute(`sandbox`,`allow-forms allow-modals allow-popups allow-scripts`),e.replaceChildren(r)}else await Lt(e,n,t,r);e.classList.add(`is-ready`)}catch(t){let n=document.createElement(`div`);n.className=`saved-file-render-error`;let r=document.createElement(`strong`);r.textContent=`暂时无法直接显示这个文件`;let i=document.createElement(`p`);i.textContent=t?.message||`请下载原文件后使用对应应用打开`,n.append(r,i),e.replaceChildren(n),e.classList.add(`has-error`)}finally{e.classList.remove(`is-loading`),e.setAttribute(`aria-busy`,`false`)}}))}async function Nr(e){let t=await Or(e);if(!t)return!1;let n=jr(t),r=document.createElement(`a`);return r.href=n,r.download=e.name||`download`,document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>{URL.revokeObjectURL(n),Tr.delete(n)},1e3),!0}async function Pr(e){let t=window.open(``,`_blank`),n=await Or(e);if(!n)return t?.close(),!1;let r=jr(n);return t?t.location.href=r:window.open(r,`_blank`,`noopener,noreferrer`),window.setTimeout(()=>{URL.revokeObjectURL(r),Tr.delete(r)},6e4),!0}function Fr(e){return e.savedHtml||Rn(e.savedContent,e.savedFiles)}function Ir(e){return`${String(e.title||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,` `).trim().slice(0,80)||`report`}.html`}function Lr(e){let t=Fr(e);return t?URL.createObjectURL(new Blob([t],{type:`text/html;charset=utf-8`})):``}function Rr(e){let t=Lr(e);if(!t)return!1;let n=document.createElement(`a`);return n.href=t,n.download=Ir(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(t),1e3),!0}function zr(e){let t=e.url||Lr(e);return t?(window.open(t,`_blank`,`noopener,noreferrer`),e.url||window.setTimeout(()=>URL.revokeObjectURL(t),6e4),!0):!1}function Br(e,t,n=!1){let r=g(t),i=t.format||r.label,a=!!(t.storageId&&[`image`,`pdf`,`html`].includes(r.preview)),o=n&&r.preview===`pdf`?`pdf-thumb`:r.preview,s=a?`data-saved-file-preview data-report-id="${U(e.id)}" data-file-id="${U(t.id)}" data-preview-mode="${o}"`:``,c=r.preview===`text`&&(t.excerpt||t.content)?`<pre>${U((t.excerpt||t.content).slice(0,n?280:8e3))}</pre>`:``;return`
    <div class="saved-file-visual file-kind-${r.kind} ${n?`compact`:``}" ${s}>
      <span class="saved-file-format">${U(i)}</span>
      ${c||`<div class="saved-file-fallback">
        <strong>${U(i)}</strong>
        <small>${U(t.name||`未命名文件`)}</small>
      </div>`}
    </div>`}function Vr(e,t,n,r){let i=g(t),a=t.format||i.label,o=t.storageId||t.content||t.excerpt?`data-saved-file-preview data-report-id="${U(e.id)}" data-file-id="${U(t.id)}" data-preview-mode="${U(i.preview)}"`:``;return`<article class="saved-file-embed file-kind-${i.kind}">
    <header class="saved-file-embed-header">
      <div class="saved-file-identity">
        <span class="saved-file-format">${U(a)}</span>
        <div><b>${U(t.name||`未命名文件`)}</b><small>${U(t.sizeLabel||``)} · ${n+1}/${r}</small></div>
      </div>
      <button type="button" class="saved-file-download" data-action="download-saved-file" data-id="${U(e.id)}" data-file-id="${U(t.id)}">下载原文件</button>
    </header>
    <div class="saved-file-embedded-content" ${o}>
      <div class="saved-file-loading" aria-hidden="true"><span></span><strong>正在展开 ${U(a)} 内容</strong></div>
    </div>
  </article>`}function Hr(e){let t=e.savedFiles||[];return t.length?`<section class="saved-file-list embedded-file-list" aria-label="档案正文">
    <div class="embedded-file-list-heading"><strong>档案正文</strong><span>${t.length} 个文件 · 已直接展开</span></div>
    ${t.map((n,r)=>Vr(e,n,r,t.length)).join(``)}
  </section>`:``}function Ur(e,t=!1,n={}){let r=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),i=[`org`,`account`].includes(e.access),a=e.access===`org`?`需组织登录`:e.access===`account`?`需账号登录`:`生产可访问`,o=Fr(e),s=!!e.pinned,c=E.groups.find(t=>t.id===e.groupId)?.name||`未归类`,l=new Set([`HTML`,`手动保存`,`生产`]),u=[...new Set([c,Yn(e.workType),...e.tags||[]])].filter(e=>!l.has(e)),d=!i&&T.reports.some(t=>t.id===e.id),f=e.preview||`${e.id}.png`,p=(e.savedFiles||[])[0],m=o&&e.isHtml?`<iframe class="local-html-preview-frame" title="${U(e.title)}视觉预览"
        srcdoc="${U(o)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:d?`<img src="./previews/${U(f)}" alt="" loading="lazy" decoding="async" draggable="false" />`:r&&p?Br(e,p,!0):`
      <div class="preview-placeholder ${i?`preview-restricted`:``}">
        <span>${i?`ACCESS`:U(e.title.slice(0,2))}</span>
        <strong>${i?a:r?`本地内容`:`预览待补充`}</strong>
      </div>`;return`
    <article class="report-card ${i?`restricted-card`:``} ${t?`archived-card`:``} ${s?`is-featured`:``} ${N===e.id?`is-move-selected`:``}"
      data-report-id="${U(e.id)}" ${t||A===`time`?``:`data-report-draggable="true"`}>
      <button class="card-main" type="button" data-action="open" data-id="${U(e.id)}" aria-label="打开${U(e.title)}">
        <span class="report-preview">
          ${m}
        </span>
        <span class="report-copy">
          <strong>${U(e.title)}</strong>
          <span class="report-tags">${u.map((e,t)=>`<span class="${t<2?`report-context-tag`:``}">${U(e)}</span>`).join(``)}</span>
          ${n.searchMatches?.length||n.searchCoverage?`<span class="report-search-meta">
            ${n.searchMatches?.length?`<span class="report-match-source">匹配于 ${U(n.searchMatches.join(` · `))}</span>`:``}
            ${n.searchCoverage?`<span class="report-index-state">${U(n.searchCoverage)}</span>`:``}
          </span>`:``}
          ${n.searchExcerpt?`<span class="report-search-excerpt">${U(n.searchExcerpt)}</span>`:``}
          ${i?`<span class="report-access-note">${U(a)}</span>`:``}
        </span>
      </button>
      <div class="card-actions">
        ${t?`
            <button type="button" data-action="restore" data-id="${U(e.id)}">Restore</button>
            <button type="button" data-action="delete" data-id="${U(e.id)}">Delete permanently</button>`:`
            <button type="button" class="studio-icon-button card-icon-action" data-action="archive" data-id="${U(e.id)}" title="归档成果" aria-label="归档成果">
              ${w.archive}
            </button>
            <button type="button" class="studio-icon-button card-icon-action" data-action="edit" data-id="${U(e.id)}" title="编辑成果" aria-label="编辑成果">
              ${w.edit}
            </button>
            <button type="button" class="studio-icon-button feature-action" data-action="toggle-pin" data-id="${U(e.id)}"
              title="${s?`取消精选`:`设为精选`}" aria-label="${s?`取消精选`:`设为精选`}">${w.star}</button>`}
      </div>
    </article>`}function Wr(){if(!I)return``;if(I.type===`delete-report`){let e=E.reports.find(e=>e.id===I.reportId);return e?`
      <div class="dialog-backdrop">
        <section class="dialog compact-dialog destructive-dialog" role="dialog" aria-modal="true"
          aria-labelledby="delete-report-dialog-title" aria-describedby="delete-report-dialog-description" tabindex="-1">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">PERMANENT DELETE</span>
              <h2 id="delete-report-dialog-title">永久删除这份成果？</h2>
            </div>
            <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${w.close}</button>
          </div>
          <p id="delete-report-dialog-description" class="destructive-dialog-copy">
            将永久删除“<strong>${U(e.title)}</strong>”。此操作完成后无法从归档区恢复。
          </p>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal" autofocus>Cancel</button>
            <button type="button" class="danger-button" data-action="confirm-delete" data-id="${U(e.id)}">Delete permanently</button>
          </div>
        </section>
      </div>`:``}if(I.type===`group`){let e=I.mode===`edit`?E.groups.find(e=>e.id===I.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form" role="dialog" aria-modal="true"
          aria-labelledby="group-dialog-title" tabindex="-1">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2 id="group-dialog-title">${e?`编辑工作主题`:`新建工作主题`}</h2>
            </div>
            <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${w.close}</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${U(e?.name||``)}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${U(e?.description||``)}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">${e?`Save changes`:`Create topic`}</button>
          </div>
        </form>
      </div>`}let e=I.mode===`edit`?E.reports.find(e=>e.id===I.reportId):null,t=e?.groupId||I.groupId||E.groups[0]?.id||``,n=W((e?.tags||[]).join(`、`)).filter(e=>![`HTML`,`手动保存`,`生产`].includes(e));return`
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form" role="dialog" aria-modal="true"
        aria-labelledby="report-dialog-title" tabindex="-1">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${e?`EDIT REPORT`:`NEW REPORT`}</span>
            <h2 id="report-dialog-title">${e?`编辑服务报告`:`新增服务报告`}</h2>
          </div>
          <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${w.close}</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${U(e?.url||``)}" placeholder="https://..." ${!e||e.url?`required`:``} autofocus />
            <button type="button" class="detect-button" data-action="detect-title">Detect title</button>
          </div>
          <small class="field-hint">${e?`修改网址后可重新识别`:`保存时会自动识别网页标题`}</small>
        </label>
        <label>报告标题
          <input name="title" value="${U(e?.title||``)}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${E.groups.map(e=>`<option value="${U(e.id)}" ${e.id===t?`selected`:``}>${U(e.name)}</option>`).join(``)}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${Zt.map(t=>`<option value="${U(t.id)}" ${t.id===(e?.workType||`product-planning`)?`selected`:``}>${U(t.name)}</option>`).join(``)}
          </select>
        </label>
        <fieldset class="report-tag-field">
          <legend>关键标签</legend>
          <input type="hidden" name="tags" value="${U(n.join(`、`))}" />
          <div class="report-tag-picker" aria-label="选择关键标签">
            ${cr().map(e=>`<button type="button" class="${n.includes(e)?`selected`:``}"
              data-report-tag="${U(e)}" aria-pressed="${n.includes(e)}">${U(e)}</button>`).join(``)}
            <button type="button" class="add-report-tag" data-add-report-tag aria-label="新增标签" title="新增标签">＋</button>
          </div>
          <div class="new-report-tag-row" hidden>
            <input type="text" data-new-report-tag maxlength="20" placeholder="输入新的标签名称" />
            <button type="button" data-confirm-report-tag>添加</button>
          </div>
          <small class="field-hint">选择已有标签，或点＋新增；最多 8 个</small>
        </fieldset>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
          <button type="submit" class="primary-button">Save</button>
        </div>
      </form>
    </div>`}function Gr(e){if(_t(e.id))return yt(e,U);let t=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),n=[`org`,`account`].includes(e.access),r=e.loginProvider||zn(e.url)?.provider||(e.access===`org`?`组织帐号`:`站点帐号`),i=e.savedHtml||Rn(e.savedContent,e.savedFiles),a=i?`edit-local-document`:e.url?n?`edit`:`edit-document`:``,o=i?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${U(e.title)}"
          srcdoc="${U(i)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:t?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">LOCAL FILE · INLINE READER</span>
          <h1>${U(e.title)}</h1>
          ${e.savedContent?`<div class="saved-material-content">${U(e.savedContent).replaceAll(`
`,`<br />`)}</div>`:``}
          ${Hr(e)}
          <p class="saved-material-note">档案正文已在本页直接展开；原文件仍完整保存在当前浏览器的专用文件库，不会上传到 GitHub Pages。</p>
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
            <a class="primary-button" href="${U(e.url)}" target="_blank" rel="noreferrer">打开${U(r)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">Back</button>
          </div>
          <p class="login-handoff-domain">${U(or(e.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${U(e.title)}" src="${U(e.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${ar(`back`)}</button>
        <div class="reader-title">
          <strong>${U(e.title)}</strong>
          <span>${t?`本地保存`:U(or(e.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${a?`
            <button class="reader-icon-button" type="button" data-action="${a}"
              data-id="${U(e.id)}" aria-label="编辑" title="编辑">
              ${ar(`edit`)}
            </button>`:``}
          ${e.url&&e.access===`production`?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${U(e.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${ar(`copy`)}
            </button>`:``}
          ${!n&&(e.url||i)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${U(e.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${ar(`download`)}
            </button>`:``}
          ${e.url||i?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${U(e.id)}"
              aria-label="${n?`打开${U(r)}登录页`:`在浏览器打开`}"
              title="${n?`打开${U(r)}登录页`:`在浏览器打开`}">
              ${ar(`external`)}
            </button>`:``}
        </div>
      </header>
      ${o}
      ${Wr()}
    </main>`}function Kr(e){return`
    <header class="topbar">
      <button class="brand topbar-home" type="button" data-action="scroll-top"
        aria-label="Back to top" title="Back to top">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </button>
      ${on?`<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← Library</button></div>`:``}
    </header>`}function qr(){let e=E.reports.filter(e=>e.archived).filter(e=>Bt(e,O,{group:E.groups.find(t=>t.id===e.groupId),workTypeName:Yn(e.workType)})).sort((e,t)=>new Date(t.archivedAt||0)-new Date(e.archivedAt||0)),t=E.reports.filter(e=>e.archived).length;return`
    <main class="app-shell archive-shell">
      ${Kr(t)}
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
          <input id="search-input" value="${U(O)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${O?`<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${w.close}</button>`:``}
        </label>
        ${e.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${O?`搜索结果`:`归档内容`}</h2><p>按最近归档时间排列</p></div>
              <span>${e.length} 份</span>
            </div>
            <div class="archive-grid">${e.map(e=>Ur(e,!0)).join(``)}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${O?`没有找到相关归档`:`归档区还是空的`}</h2>
            <p>${O?`换个关键词，或返回查看全部归档内容。`:`在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。`}</p>
            <button class="quiet-button" type="button" data-action="${O?`clear-search`:`show-catalog`}">${O?`Clear search`:`Back to library`}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${Wr()}
    </main>`}function Jr(e,t){if(![`topic`,`type`,`tag`].includes(e.kind))return``;let n=t.filter(t=>t.kind===e.kind),r=n.findIndex(t=>t.id===e.id);if(r<0)return``;let i=r===0,a=r===n.length-1,o=(t,n,r,i)=>`
    <button type="button" class="studio-icon-button group-order-button" data-action="move-group"
      data-id="${U(e.id)}" data-bucket-kind="${U(e.kind)}" data-direction="${t}"
      title="${n}" aria-label="${n}" ${i?`disabled`:``}>${r}</button>`;return[o(`top`,`置顶`,w.top,i),o(`up`,`上移`,w.up,i),o(`down`,`下移`,w.down,a),o(`bottom`,`置底`,w.bottom,a)].join(``)}function Yr(){if(on)return qr();let e=x(O),t=E.reports.filter(e=>!e.archived),n=e?tr(t,e):t,r=Kn(t.filter(e=>e.pinned),`featured`,`featured`,(e,t)=>Zn(t)-Zn(e)),i={id:`featured`,name:`精选成果`,kind:`featured`,accent:`violet`,reports:r},a=E.reports.filter(e=>e.archived).length,o=t.filter(e=>e.access===`production`).length,s=t.filter(e=>e.access!==`production`).length,c=bn(t),l=Qn(t,``),u=A===`topic`&&r.length?[i,...l]:l,d=A===`time`&&l[0]?.reports||[],f=e?[]:(A===`topic`&&r.length?[i,...l]:l).filter(e=>e.reports.length||N||A===`topic`),p=A===`type`?`工作类型`:A===`tag`?`关键标签`:A===`time`?`新增时间`:`工作主题`;return`
    <main class="app-shell">
      ${Kr(a)}
      <section class="workspace">
        ${me(U)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${U(O)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${O?`<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${w.close}</button>`:``}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${e?n.length:t.length}</strong><span>${e?`匹配`:`成果`}</span>
              <i></i>
              <strong>${E.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${o}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <div class="search-coverage-strip" aria-label="搜索索引覆盖">
          ${gn?`
            <span><b>${c.body}</b> 已索引正文</span>
            <span><b>${c.metadata}</b> 仅标题 / 标签</span>
            <span><b>${c.restricted}</b> 受限不可索引</span>
            <span><b>${c.external}</b> 外部页面不可抓取</span>
            <em>索引库 ${Object.keys(z).length} 条 · ${t.length}/${t.length} 份成果的标题与标签可搜索</em>`:`<span>正在载入正文搜索索引…</span>`}
        </div>
        <section class="groups-section">
          ${N?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${er()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">Cancel</button>
            </div>`:``}
          ${e||f.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${p}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${A===`topic`}" class="${A===`topic`?`active`:``}" data-action="set-view" data-id="topic">Topic</button>
                    <button type="button" role="tab" aria-selected="${A===`type`}" class="${A===`type`?`active`:``}" data-action="set-view" data-id="type">Type</button>
                    <button type="button" role="tab" aria-selected="${A===`tag`}" class="${A===`tag`?`active`:``}" data-action="set-view" data-id="tag">Tag</button>
                    <button type="button" role="tab" aria-selected="${A===`time`}" class="${A===`time`?`active`:``}" data-action="set-view" data-id="time">Time</button>
                  </div>
                  <button class="studio-icon-button add-topic-icon" type="button" data-action="add-group"
                    aria-label="Add topic" title="Add topic">${w.plus}</button>
                </div>
                ${A===`time`?`
                  <div class="library-time-order" aria-label="时间排序">
                    <span>${j===`modified`?`Modified`:`Created`}</span>
                    <button type="button" data-action="toggle-time-sort"
                      title="切换为按${j===`modified`?`创建`:`修改`}时间排序"
                      aria-label="切换为按${j===`modified`?`创建`:`修改`}时间倒序">
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v9m0 0L2 10m2 2 2-2M12 13V4m0 0-2 2m2-2 2 2"></path></svg>
                    </button>
                  </div>
                  <div class="library-time-titles" aria-label="按${j===`modified`?`修改`:`创建`}时间排列的成果">
                    ${d.map(e=>`
                      <a href="#" data-nav-report-id="${U(e.id)}"
                        title="${U(e.title)}">${U(e.title)}</a>`).join(``)}
                  </div>`:u.map(e=>`
                  <a href="#" data-nav-bucket-kind="${U(e.kind)}"
                    data-nav-bucket-id="${U(e.id)}">
                    ${U(e.name)}<span>${e.reports.length}</span>
                  </a>`).join(``)}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>Archive</strong>
                  ${a?`<em>${a}</em>`:``}
                </button>
              </nav>
              <div class="board catalog-view-${A}">
              ${e?`
                <section class="search-results-panel">
                  <header class="search-results-header">
                    <div><span>SEARCH RESULTS</span><h2>“${U(O.trim())}”</h2></div>
                    <strong class="search-results-announcement" role="status" aria-live="polite">${n.length} 份匹配</strong>
                  </header>
                  ${n.length?`<div class="group-cards search-results-cards">${n.map(t=>Ur(t,!1,{searchMatches:Cn(t,e),searchCoverage:Sn[yn(t)],searchExcerpt:nr(t,e)})).join(``)}</div>`:`<div class="no-results search-no-results">
                        <strong>没有找到“${U(O.trim())}”</strong>
                        <span>可搜索标题、标签、成果正文、来源、任务类型或主题</span>
                        <button type="button" data-action="clear-search">Clear search</button>
                      </div>`}
                </section>`:f.map(e=>`
                <section class="group-column topic-section bucket-${U(e.kind)} accent-${U(e.accent||`blue`)}"
                  data-bucket-kind="${U(e.kind)}"
                  data-bucket-id="${U(e.id)}"
                  data-group-id="${U(e.id)}">
                  <header class="group-header">
                    <div class="group-heading-area">
                      <div class="group-heading-copy">
                        <div><h2>${U(e.name)}</h2></div>
                        <span class="count">${e.reports.length} 份</span>
                      </div>
                      ${e.kind===`topic`?`<div class="group-primary-actions" aria-label="分组快捷操作">
                        <button type="button" class="studio-icon-button" data-action="add-to-group" data-id="${U(e.id)}" title="新增成果" aria-label="新增成果">${w.plus}</button>
                        <button type="button" class="studio-icon-button" data-action="rename-group" data-id="${U(e.id)}" title="编辑分组" aria-label="编辑分组">${w.edit}</button>
                      </div>`:``}
                    </div>
                    <div class="group-menu" aria-label="分组排序操作">
                      ${N&&e.kind!==`time`?`<button class="move-here-button" type="button" data-action="move-here" data-id="${U(e.id)}" data-bucket-kind="${U(e.kind)}">Move here</button>`:``}
                      ${Jr(e,l)}
                      ${e.kind===`topic`?`<button type="button" class="studio-icon-button group-delete-button" data-action="delete-group" data-id="${U(e.id)}" title="删除分组" aria-label="删除分组">${w.minus}</button>`:``}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${e.reports.length?e.reports.map(e=>Ur(e)).join(``):e.kind===`topic`?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${U(e.id)}">
                            <strong>Drop reports here</strong>
                            <span>or add the first report</span>
                          </button>`:`<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>`}
                  </div>
                </section>`).join(``)}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到“${U(O.trim())}”</strong>
              <span>可搜索标题、标签、来源、任务类型或主题</span>
              <button type="button" data-action="clear-search">Clear search</button>
            </div>`}
          <div class="catalog-note">
            <span>${s} 份报告需要组织或账号登录${a?` · ${a} 份已安全归档`:``}</span>
            <div><span>分类调整仅保存在当前浏览器</span></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${Wr()}
    </main>`}function $(){let e=document.getElementById(`app`),t=k&&E.reports.find(e=>e.id===k);Ar(),e.innerHTML=t?Gr(t):Yr(),pr(),Qr(),he({render:()=>Q(()=>document.querySelector(`.prompt-composer`)),showToast:G,saveToLibrary:Hn}),Mr()}async function Xr(e){let t=e.elements.url,n=e.elements.title,r=e.querySelector(`[data-action="detect-title"]`),i=e.querySelector(`.field-hint`),a=t.value.trim();if(!sr(a))return i.textContent=`请输入完整的 http 或 https 网址`,``;r.disabled=!0,r.innerHTML=`<span class="mini-spinner"></span>`,i.textContent=`正在读取网页标题…`;try{let{title:e}=await Bn(a);if(!e)throw Error(`read failed`);return n.value=e,i.textContent=`已识别网页标题`,n.value}catch{let e=or(a);return n.value||=e,i.textContent=`网页暂时无法读取，已用域名作为标题，你可以手动修改`,n.value}finally{r.disabled=!1,r.textContent=`Detect title`}}function Zr(){let e=document.querySelector(`.board`);if(!e)return;let t=null,n=()=>{document.querySelectorAll(`.report-card, .group-column, .topic-nav a`).forEach(e=>{e.classList.remove(`is-nav-drop-target`)})},r=e=>e?[e.bucketKind,e.bucketId,e.targetReportId,Number(e.placeAfter),Number(e.nav)].join(`|`):``,i=()=>{let e=t.sourceCard.getBoundingClientRect(),n=t.sourceCard.cloneNode(!0);return n.removeAttribute(`id`),n.className=`report-card report-drag-preview`,n.style.width=`${e.width}px`,n.style.height=`${e.height}px`,n.querySelectorAll(`button, [role='button'], iframe`).forEach(e=>{e.removeAttribute(`data-action`),e.setAttribute(`tabindex`,`-1`)}),document.body.append(n),t.previewWidth=e.width,t.previewHeight=e.height,t.previewOffsetX=Math.max(18,Math.min(e.width-18,t.startX-e.left)),t.previewOffsetY=Math.max(18,Math.min(e.height-18,t.startY-e.top)),n},a=()=>{if(!t?.preview)return;let e=Math.max(8,window.innerWidth-t.previewWidth-8),n=Math.max(8,window.innerHeight-t.previewHeight-8),r=Math.max(8,Math.min(e,t.x-t.previewOffsetX)),i=Math.max(8,Math.min(n,t.y-t.previewOffsetY));t.preview.style.transform=`translate3d(${r}px, ${i}px, 0)`},o=()=>{!t?.active||t.updateFrame||(t.updateFrame=requestAnimationFrame(()=>{t?.active&&(t.updateFrame=0,a(),u())}))},s=(e,n=null,r=!1)=>{if(!(!e||!t?.placeholder)){if(!n||n.parentElement!==e){e.append(t.placeholder);return}e.insertBefore(t.placeholder,r?n.nextSibling:n)}},c=()=>{let e=document.elementFromPoint(t.x,t.y);if(e?.closest(`.report-card-placeholder`))return t.target;let n=e?.closest(`.topic-nav a[data-nav-bucket-id]`);if(n)return{bucketKind:n.dataset.navBucketKind,bucketId:n.dataset.navBucketId,targetReportId:``,placeAfter:!1,nav:!0,element:n};let r=e?.closest(`.report-card:not(.report-card-placeholder):not(.report-drag-preview)`),i=e?.closest(`.group-column`);if(r&&r!==t.sourceCard){let e=r.closest(`.group-column`);if(!e||e.dataset.bucketKind===`time`)return null;let n=r.getBoundingClientRect(),i=t.y>n.bottom-n.height*.22||t.y>=n.top+n.height*.22&&t.y<=n.bottom-n.height*.22&&t.x>n.left+n.width/2;return{bucketKind:e.dataset.bucketKind||A,bucketId:e.dataset.bucketId||``,targetReportId:r.dataset.reportId||``,placeAfter:i,nav:!1,element:r,container:e.querySelector(`.group-cards`)}}return i&&i.dataset.bucketKind!==`time`?{bucketKind:i.dataset.bucketKind||A,bucketId:i.dataset.bucketId||``,targetReportId:``,placeAfter:!1,nav:!1,element:i,container:i.querySelector(`.group-cards`)}:null},l=e=>{if(!(!t||r(e)===r(t.target))&&(n(),t.target=e,P=e,e)){if(e.nav){e.element.classList.add(`is-nav-drop-target`);return}if(e.targetReportId){s(e.container,e.element,e.placeAfter);return}s(e.container)}},u=()=>{t?.active&&l(c())},d=()=>{let e=Math.min(window.innerHeight*.34,hr()+72),n=window.innerHeight-72;if(t.y<e){let n=Math.min(1,(e-t.y)/84);return-Math.max(1,Math.round(12*n*n))}if(t.y>n){let e=Math.min(1,(t.y-n)/84);return Math.max(1,Math.round(12*e*e))}return 0},f=()=>{if(!t?.active)return;let e=d();if(e){let t=window.scrollY;window.scrollBy(0,e),window.scrollY!==t&&u()}t.autoScrollFrame=requestAnimationFrame(f)},p=()=>{!t||t.active||(clearTimeout(t.holdTimer),t.sourceCard.setPointerCapture?.(t.pointerId),t.active=!0,M=t.reportId,t.preview=i(),t.placeholder=document.createElement(`div`),t.placeholder.className=`report-card report-card-placeholder`,t.placeholder.innerHTML=`<span>放在这里</span>`,t.placeholder.style.minHeight=`${t.sourceCard.getBoundingClientRect().height}px`,t.sourceCard.before(t.placeholder),t.sourceCard.classList.add(`is-dragging`),document.body.classList.add(`report-drag-session`),a(),u(),t.autoScrollFrame=requestAnimationFrame(f))},m=()=>{t&&(clearTimeout(t.holdTimer),t.autoScrollFrame&&cancelAnimationFrame(t.autoScrollFrame),t.updateFrame&&cancelAnimationFrame(t.updateFrame),t.preview?.remove(),t.placeholder?.remove(),t.sourceCard.classList.remove(`is-dragging`),document.body.classList.remove(`report-drag-session`),n(),M=``,P=null)},h=()=>{if(!t)return;let e=t,n=e.active?e.target:null,r=e.reportId;if(e.active&&(dn=r,fn=Date.now()+500),m(),t=null,!n?.bucketId||n.bucketKind===`time`)return;let i=B(E),a=B(D);$n(r,n.bucketKind,n.bucketId,n.targetReportId||``,!!n.placeAfter)&&(Q(()=>Y(r)),n.nav&&Cr(()=>J(n.bucketKind,n.bucketId)),lr(n.bucketKind===`featured`?`已加入精选成果`:n.bucketKind===`tag`?`已添加目标标签`:n.bucketKind===`type`?`工作类型已更新`:n.targetReportId?`报告顺序已更新`:`已移入新主题`,()=>{E=i,D=a,V(),Dn(),Q(()=>Y(r))}))};e.addEventListener(`pointerdown`,e=>{if(e.button!==0||e.target.closest(`.card-actions`))return;let n=e.target.closest(`.report-card[data-report-draggable="true"]`);n?.closest(`.group-column`)&&(e.pointerType===`mouse`&&e.preventDefault(),t={pointerId:e.pointerId,reportId:n.dataset.reportId,sourceCard:n,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:!1,target:null,preview:null,placeholder:null,autoScrollFrame:0,updateFrame:0,holdTimer:0},t.holdTimer=window.setTimeout(()=>p(),240))}),e.addEventListener(`pointermove`,e=>{!t||e.pointerId!==t.pointerId||(t.x=e.clientX,t.y=e.clientY,!t.active&&Math.hypot(t.x-t.startX,t.y-t.startY)>=8&&p(),t.active&&(e.preventDefault(),o()))}),e.addEventListener(`pointerup`,e=>{!t||e.pointerId!==t.pointerId||h()}),e.addEventListener(`pointercancel`,()=>{m(),t=null})}function Qr(){let e=document.getElementById(`search-input`),t=!1,n=e=>{let t=e?.value||``;if(t===O)return;let n=e.selectionStart,r=e.selectionEnd;O=t,Q(()=>document.querySelector(`.results-toolbar, .archive-search`));let i=document.getElementById(`search-input`);i?.focus({preventScroll:!0}),i?.setSelectionRange(n,r)};e?.addEventListener(`compositionstart`,()=>{t=!0}),e?.addEventListener(`compositionend`,e=>{t=!1,n(e.currentTarget)}),e?.addEventListener(`input`,e=>{e.isComposing||t||n(e.currentTarget)}),e?.addEventListener(`search`,e=>n(e.currentTarget)),e?.addEventListener(`keydown`,e=>{e.key!==`Escape`||!O||(e.preventDefault(),O=``,Q(()=>document.querySelector(`.results-toolbar, .archive-search`)),document.getElementById(`search-input`)?.focus({preventScroll:!0}))}),document.querySelectorAll(`[data-action]`).forEach(e=>{e.addEventListener(`click`,async e=>{let t=e.currentTarget.dataset.action,n=e.currentTarget.dataset.id,r=e.currentTarget.closest(`.report-card`);if(t===`scroll-top`)mr(`smooth`);else if(t===`open`){if(n===dn&&Date.now()<fn)return;pn=X(r||Y(n)),k=n,$(),mr()}else if(t===`preview-saved-file`||t===`download-saved-file`){let r=E.reports.find(e=>e.id===n)?.savedFiles?.find(t=>t.id===e.currentTarget.dataset.fileId);if(!r)return;(t===`preview-saved-file`?await Pr(r):await Nr(r))||G(`原文件未找到，请重新上传后保存`)}else if(t===`edit-document`){let e=E.reports.find(e=>e.id===n);if(!e||e.access!==`production`)return;vt(e,{render:$,showToast:G})}else if(t===`edit-local-document`){let e=E.reports.find(e=>e.id===n);if(!e||!Fr(e))return;vt(e,{render:$,showToast:G,saveLocal:async t=>{let n=e.savedHtml;e.savedHtml=t,e.isHtml=!0,e.tags=nn(e,e.workType),H(e);try{V()}catch{throw e.savedHtml=n,Error(`修改后的 HTML 超过当前浏览器可保存容量，请先下载备份`)}}})}else if(t===`download-report`){let e=E.reports.find(e=>e.id===n);if(!e)return;Fr(e)?Rr(e)&&G(`HTML 已下载`):await xt(e,G)}else if(t===`share-report`||t===`copy-production-url`){let e=E.reports.find(e=>e.id===n);e?.url&&await St(e,e=>{G(e===`报告链接已复制`?`生产 URL 已复制`:e)})}else if(t===`open-browser`){let e=E.reports.find(e=>e.id===n);if(!e)return;zr(e)||G(`浏览器未能打开该报告`)}else if(t===`back`)k=``,I=null,Z(pn||{scrollY:0}),pn=null;else if(t===`clear-search`)O=``,Q(()=>document.querySelector(`.results-toolbar, .archive-search`)),document.getElementById(`search-input`)?.focus({preventScroll:!0});else if(t===`set-view`){if(![`topic`,`type`,`tag`,`time`].includes(n))return;let e={scrollY:window.scrollY,identity:null,viewportTop:null};A=n,N=``,localStorage.setItem(Kt,A),Z(e),requestAnimationFrame(()=>{document.querySelector(`[data-action="set-view"][data-id="${CSS.escape(n)}"]`)?.focus({preventScroll:!0})})}else if(t===`toggle-time-sort`)j=j===`created`?`modified`:`created`,localStorage.setItem(qt,j),Q();else if(t===`cancel-move`)N=``,Q();else if(t===`move-here`){let t=e.currentTarget.dataset.bucketKind||A,r=B(E),i=B(D);if(N&&$n(N,t,n)){let e=N;N=``,Q(()=>Y(e)),lr(t===`tag`?`已添加目标标签`:`报告已移入目标${er()}`,()=>{E=r,D=i,V(),Dn(),Q(()=>Y(e))})}}else if(t===`show-archive`)on=!0,O=``,k=``,$(),mr();else if(t===`show-catalog`)on=!1,O=``,k=``,$(),mr();else if(t===`add-report`)fr({type:`report`,mode:`create`,groupId:E.groups[0]?.id},X(document.querySelector(`.results-toolbar`)),e.currentTarget);else if(t===`add-to-group`)fr({type:`report`,mode:`create`,groupId:n},X(J(`topic`,n)),e.currentTarget);else if(t===`edit`)fr({type:`report`,mode:`edit`,reportId:n},X(r||Y(n)),e.currentTarget);else if(t===`toggle-pin`){let e=E.reports.find(e=>e.id===n);if(!e)return;let t=B(e),i=e.pinned&&r?.closest(`[data-bucket-kind="featured"]`)?xr(n,r):X(r||Y(n));e.pinned=!e.pinned,H(e),V(),Z(i),lr(e.pinned?`已加入精选成果`:`已移出精选成果`,()=>{let e=E.reports.find(e=>e.id===n);e&&(Object.assign(e,t),e.archived=!!t.archived,e.archivedAt=t.archivedAt||``,V(),Q(()=>Y(n)))})}else if(t===`close-modal`)K();else if(t===`detect-title`)await Xr(e.currentTarget.closest(`form`));else if(t===`archive`){let e=E.reports.find(e=>e.id===n);if(!e)return;let t=B(e),i=xr(n,r);e.archived=!0,e.archivedAt=new Date().toISOString(),V(),Z(i),lr(`已归档，可随时恢复`,()=>{let e=E.reports.find(e=>e.id===n);e&&(Object.assign(e,t),e.archived=!!t.archived,e.archivedAt=t.archivedAt||``,V(),Q(()=>Y(n)))})}else if(t===`restore`){let e=E.reports.find(e=>e.id===n);if(!e)return;let t=B(e),r=xr(n);e.archived=!1,e.archivedAt=``,V(),Z(r),lr(`报告已恢复到原主题`,()=>{let e=E.reports.find(e=>e.id===n);e&&(Object.assign(e,t),V(),Q(()=>Y(n)))})}else if(t===`delete`){if(!E.reports.find(e=>e.id===n)?.archived)return;fr({type:`delete-report`,reportId:n},xr(n),e.currentTarget)}else if(t===`confirm-delete`){let e=E.reports.find(e=>e.id===n);if(!e?.archived||I?.type!==`delete-report`)return;E.reports=E.reports.filter(e=>e.id!==n),k===n&&(k=``),V(),await kr(n),K({fallbackSelector:`.archive-grid, .archive-search`}),G(`已永久删除“${e.title}”`)}else if(t===`add-group`)fr({type:`group`,mode:`create`},X(document.querySelector(`.results-toolbar`)),e.currentTarget);else if(t===`rename-group`)E.groups.find(e=>e.id===n)&&fr({type:`group`,mode:`edit`,groupId:n},X(J(`topic`,n)),e.currentTarget);else if(t===`move-group`){let t=e.currentTarget.dataset.bucketKind,r=e.currentTarget.dataset.direction,i=X(J(t,n));Wn(n,r,t)&&(Z(i),requestAnimationFrame(()=>{document.querySelector(`[data-action="move-group"][data-id="${CSS.escape(n)}"][data-direction="${CSS.escape(r)}"]`)?.focus({preventScroll:!0})}),G(`分组顺序已更新`))}else if(t===`delete-group`){let e=E.groups.find(e=>e.id===n),t=E.groups.find(e=>e.id!==n);if(e&&!t)G(`请先新增另一个分组，再删除当前分组`);else if(e&&confirm(`删除“${e.name}”？其中的报告会移到“${t.name}”。`)){let e=Sr(`topic`,n);E.reports.forEach(e=>{e.groupId===n&&(e.groupId=t.id)}),E.groups=E.groups.filter(e=>e.id!==n),V(),Z(e),G(`分组已删除，报告已移到“${t.name}”`)}}})}),document.querySelector(`.topbar`)?.addEventListener(`click`,e=>{e.target.closest(`button, a`)||mr(`smooth`)}),document.querySelectorAll(`.topic-nav a[data-nav-bucket-id]`).forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault();let n=e.dataset.navBucketKind,r=e.dataset.navBucketId;if(O){O=``,Q(),Cr(()=>J(n,r));return}gr(J(n,r))})}),document.querySelectorAll(`.topic-nav a[data-nav-report-id]`).forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault(),gr(Y(e.dataset.navReportId))})}),Zr(),document.querySelectorAll(`.legacy-report-drag-handle`).forEach(e=>{let t=null,n=!1,r=null,i=0,a=0,o=()=>{i&&=(cancelAnimationFrame(i),0)},s=()=>{if(!M)return o();let e=Math.min(110,window.innerHeight*.18),t=a<e?a-e:a>window.innerHeight-e?a-(window.innerHeight-e):0;if(!t)return o();let n=Math.sign(t)*Math.min(24,5+Math.abs(t)*.2);window.scrollBy(0,n),i=requestAnimationFrame(s)},c=t=>{let n=e.closest(`.report-card`);if(n){if(!r){let e=n.getBoundingClientRect();r=n.cloneNode(!0),r.className=`report-card report-drag-preview`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`,r.querySelectorAll(`button, [role='button']`).forEach(e=>{e.removeAttribute(`data-action`),e.setAttribute(`tabindex`,`-1`)}),document.body.append(r)}r.style.transform=`translate3d(${t.clientX+16}px, ${t.clientY+16}px, 0)`}},l=()=>{P=null,F?.remove(),F=null,document.querySelectorAll(`.report-card, .group-column, .topic-nav a`).forEach(e=>e.classList.remove(`is-card-drop-target`,`is-card-drop-before`,`is-card-drop-after`,`is-drop-ready`,`is-nav-drop-target`))},u=(t,n,r)=>{if(t){if(!F){F=document.createElement(`div`),F.className=`report-card report-card-placeholder`,F.innerHTML=`<span>放在这里</span>`;let t=e.closest(`.report-card`)?.getBoundingClientRect().height;t&&(F.style.minHeight=`${t}px`)}if(!n||n.parentElement!==t){t.append(F);return}t.insertBefore(F,r?n.nextSibling:n)}},d=t=>{let n=document.elementFromPoint(t.clientX,t.clientY),r=n?.closest(`.topic-nav a[data-nav-bucket-id]`);if(l(),r){r.classList.add(`is-nav-drop-target`),P={bucketKind:r.dataset.navBucketKind,bucketId:r.dataset.navBucketId,targetReportId:``,placeAfter:!1,nav:!0};return}let i=e.closest(`.report-card`),a=n?.closest(`.report-card:not(.report-card-placeholder)`),o=n?.closest(`.group-column`);if(a&&a!==i){let e=a.closest(`.group-column`),n=a.getBoundingClientRect(),r=t.clientY>n.top+n.height/2;a.classList.add(`is-card-drop-target`,r?`is-card-drop-after`:`is-card-drop-before`),u(e?.querySelector(`.group-cards`),a,r),P={bucketKind:e?.dataset.bucketKind||A,bucketId:e?.dataset.bucketId||``,targetReportId:a.dataset.reportId||``,placeAfter:r,nav:!1};return}o&&o.dataset.bucketKind!==`time`&&(o.classList.add(`is-drop-ready`),u(o.querySelector(`.group-cards`),null,!1),P={bucketKind:o.dataset.bucketKind||A,bucketId:o.dataset.bucketId||``,targetReportId:``,placeAfter:!1,nav:!1})},f=()=>{M=``,t=null,n=!1,o(),r?.remove(),r=null,l(),e.closest(`.report-card`)?.classList.remove(`is-dragging`)};e.addEventListener(`pointerdown`,r=>{r.preventDefault(),M=e.dataset.reportDragId,t={x:r.clientX,y:r.clientY},n=!1,e.setPointerCapture?.(r.pointerId),e.closest(`.report-card`)?.classList.add(`is-dragging`)}),e.addEventListener(`pointermove`,e=>{M&&(t&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<7||(n=!0,a=e.clientY,c(e),d(e),i||=requestAnimationFrame(s)))}),e.addEventListener(`pointerup`,e=>{if(!M)return;let t=M;if(!n){N=t,f(),Q(()=>Y(t)),G(`请选择目标${er()}`);return}let r=P,i=r?.targetReportId||``,a=r?.bucketId||``,o=r?.bucketKind||A,s=a&&o!==`time`?$n(t,o,a,i,!!r?.placeAfter):!1;f(),s&&(Q(()=>Y(t)),requestAnimationFrame(()=>{let e=`.group-column[data-bucket-kind="${CSS.escape(o)}"][data-bucket-id="${CSS.escape(a)}"]`,n=document.querySelector(`${e} .report-card[data-report-id="${CSS.escape(t)}"]`)||document.querySelector(`.search-results-cards .report-card[data-report-id="${CSS.escape(t)}"]`);gr(n),n?.classList.add(`is-drop-landed`),window.setTimeout(()=>n?.classList.remove(`is-drop-landed`),900)}),G(o===`featured`?`已加入精选成果`:o===`tag`?`已添加目标标签`:o===`type`?`工作类型已更新`:i?`报告顺序已更新`:`已移入新主题`))}),e.addEventListener(`pointercancel`,f)});let r=document.getElementById(`group-form`);r?.addEventListener(`submit`,e=>{e.preventDefault();let t=new FormData(r).get(`name`)?.trim(),n=new FormData(r).get(`description`)?.trim();if(!t)return;if(I.mode===`edit`){let e=E.groups.find(e=>e.id===I.groupId);if(!e)return;e.name=t.slice(0,60),e.description=n?.slice(0,80)||`自定义工作主题`}else E.groups.push({id:rr(`group`),name:t.slice(0,60),description:n?.slice(0,80)||`自定义工作主题`,accent:[`blue`,`violet`,`amber`,`green`][E.groups.length%4],position:E.groups.length}),A=`topic`,localStorage.setItem(Kt,A);V();let i=I.mode===`edit`?`工作主题已更新`:`工作主题已创建，可直接拖入报告`;K(),G(i)});let i=document.getElementById(`report-form`),a=i?.elements.tags,o=e=>{let t=W(a?.value).includes(e.dataset.reportTag);e.classList.toggle(`selected`,t),e.setAttribute(`aria-pressed`,String(t))},s=e=>{e.addEventListener(`click`,()=>{let t=W(a.value),n=e.dataset.reportTag;a.value=t.includes(n)?t.filter(e=>e!==n).join(`、`):[...t,n].slice(0,8).join(`、`),o(e)})};i?.querySelectorAll(`[data-report-tag]`).forEach(s);let c=i?.querySelector(`[data-add-report-tag]`),l=i?.querySelector(`.new-report-tag-row`),u=i?.querySelector(`[data-new-report-tag]`),d=()=>{l.hidden=!1,u.focus()},f=()=>{let[e]=W(u.value);if(!e)return;let t=W(a.value);if(!t.includes(e)&&t.length>=8){G(`最多选择 8 个标签`);return}a.value=[...new Set([...t,e])].slice(0,8).join(`、`);let n=[...i.querySelectorAll(`[data-report-tag]`)].find(t=>t.dataset.reportTag===e);n||(n=document.createElement(`button`),n.type=`button`,n.dataset.reportTag=e,n.textContent=e,c.before(n),s(n)),o(n),u.value=``,l.hidden=!0,c.focus()};c?.addEventListener(`click`,d),i?.querySelector(`[data-confirm-report-tag]`)?.addEventListener(`click`,f),u?.addEventListener(`keydown`,e=>{e.key===`Enter`?(e.preventDefault(),f()):e.key===`Escape`&&(e.preventDefault(),u.value=``,l.hidden=!0,c.focus())}),i?.addEventListener(`submit`,async e=>{e.preventDefault();let t=i.elements.url.value.trim(),n=I.mode===`edit`?I.reportId:``,r=n?E.reports.find(e=>e.id===n):null,a=!!(r&&!r.url&&!t);if(!sr(t)&&!a)return;let o=i.querySelector(`button[type="submit"]`),s=i.querySelector(`.field-hint`);if(o.disabled=!0,o.innerHTML=`<span class="mini-spinner"></span>`,a){let e=i.elements.title.value.trim()||r.title,t=i.elements.groupId.value,n=i.elements.workType.value,a=W(i.elements.tags.value).filter(e=>![`HTML`,`手动保存`,`生产`].includes(e));Object.assign(r,{title:e,groupId:t,workType:n,tags:a}),H(r),V(),K(),G(`报告已保存`);return}let c=Fn({material:t,files:[],url:t,excludeId:n});if(c){o.disabled=!1,o.textContent=`Save`,s.textContent=`成果库已有“${c.title}”，未重复保存`,G(`成果库已有“${c.title}”，未重复保存`);return}let l=await Vn({material:t,files:[],url:t},e=>{s.textContent=e});if(!l.allowed){o.disabled=!1,o.textContent=`Save`,s.textContent=l.reason,G(l.reason);return}let u=i.elements.title.value.trim()||l.metadata.title,d=i.elements.groupId.value,f=i.elements.workType.value,p=W(i.elements.tags.value),m={title:u||or(t),url:t,groupId:d,workType:f,source:`手动添加`,access:l.access,detectedDescription:l.metadata.description,manualSaved:!0,isProduction:l.access===`production`,isPersonal:In(t),isHtml:l.isHtml,loginProvider:l.loginProvider},h=I.mode===`edit`?p:[...new Set([...nn(m,f),...p])].slice(0,8);if(I.mode===`edit`){let e=E.reports.find(e=>e.id===I.reportId);Object.assign(e,m,{tags:h}),H(e)}else{let e=new Date().toISOString(),t={id:rr(`report`),groupId:d,...m,pinned:!1,position:E.reports.filter(e=>e.groupId===d).length,createdAt:e,modifiedAt:e,archived:!1,archivedAt:``,tags:h};E.reports.push(t)}V(),K(),G(`报告已保存`)});let p=k&&E.reports.find(e=>e.id===k);p&&bt(p)}function $r(){wn(),$()}$r(document.getElementById(`app`));export{f as a,c as i,s as n,d as o,o as r,u as s,Et as t};