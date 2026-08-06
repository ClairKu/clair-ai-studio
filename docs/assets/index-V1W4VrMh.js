(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[{id:`save`,name:`Save`,hint:`Recognize and add to the library`},{id:`decision`,name:`Decide`,hint:`Copy a decision brief`},{id:`review`,name:`Review`,hint:`Copy a review brief`}],t={save:`
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
    </svg>`},n=[{id:`requirement`,name:`需求评审`},{id:`solution`,name:`方案评审`},{id:`decision`,name:`决策推演`},{id:`agreement`,name:`协议审查`},{id:`career`,name:`履历评估`}],r=i();function i(){return{material:``,files:[]}}function a(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}function o(e){let t=e.toLowerCase(),r=[[`agreement`,[`协议`,`合同`,`条款`,`保密`,`签署`,`数据处理`]],[`career`,[`简历`,`履历`,`候选人`,`晋升`,`岗位`,`面试`]],[`decision`,[`决策`,`选型`,`取舍`,`是否推进`,`选择`]],[`requirement`,[`需求`,`prd`,`用户故事`,`验收`,`原型`]],[`solution`,[`方案`,`流程`,`架构`,`设计`,`上线`]]].find(([,e])=>e.some(e=>t.includes(e)))?.[0]||`solution`;return n.find(e=>e.id===r)||n[1]}function s(e,t,n){let r=(e.files||[]).map(e=>`- ${e.name}${e.sizeLabel?`（${e.sizeLabel}）`:``}`).join(`
`);return[`Task: ${n===`decision`?`Decision`:`Review`}`,`Matched skill: ${t.name}`,``,`Material:`,e.material||`(No pasted text)`,r?`\nAttachments:\n${r}`:``].filter(Boolean).join(`
`)}function c(e){return e<1024?`${e} B`:e<1024*1024?`${Math.ceil(e/1024)} KB`:`${(e/1024/1024).toFixed(1)} MB`}async function l(e){let t=[...e].slice(0,20);return Promise.all(t.map(async e=>{let t=e.type.startsWith(`text/`)||/\.(md|txt|csv|json|html|xml)$/i.test(e.name),n=/\.html?$/i.test(e.name),r=``,i=``;if(t&&e.size<=1024*1024)try{let t=await e.text();r=t.slice(0,12e3),n&&(i=t)}catch{r=``,i=``}return{id:a(),name:e.name,type:e.type||`文件`,size:e.size,sizeLabel:c(e.size),excerpt:r,content:i}}))}function u(e){return r.files.length?`<div class="attachment-list">${r.files.map(n=>`
    <span class="attachment-chip">
      <b>${e(n.name)}</b><small>${e(n.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${e(n.name)}"
        data-task-action="remove-file" data-file-id="${n.id}">${t.close}</button>
    </span>`).join(``)}</div>`:``}function d(n){return e.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${n(e.name)}"
      title="${n(e.name)} · ${n(e.hint)}">
      ${t[e.id]}
    </button>`).join(``)}function f(e){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer ${r.material.trim()||r.files.length?`has-intake-content`:``}" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="Set an idea in motion"
            placeholder="Set an idea in motion">${e(r.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="Actions">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="Attach files" title="Attach files">
              <input id="task-files" type="file" multiple />
              ${t.upload}
            </label>
            ${d(e)}
          </div>
        </div>
        ${u(e)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function p({render:e,showToast:t,saveToLibrary:a}){document.querySelectorAll(`[data-task-action]`).forEach(t=>{t.addEventListener(`click`,async t=>{t.currentTarget.dataset.taskAction===`remove-file`&&(m(),r.files=r.files.filter(e=>e.id!==t.currentTarget.dataset.fileId),e())})});let c=document.getElementById(`task-composer`);c?.addEventListener(`submit`,async l=>{if(l.preventDefault(),m(),!r.material.trim()&&!r.files.length){t(`先粘贴内容，或加入一份材料`),document.getElementById(`task-goal`)?.focus();return}let u=l.submitter?.dataset.submitAction||`save`,d=l.submitter,f={material:r.material.trim(),files:r.files};if(u===`save`){let n=c.querySelector(`#intake-save-status`),o=[...c.querySelectorAll(`button, textarea, input`)],s=e=>{o.forEach(e=>{e.disabled=!0}),c.setAttribute(`aria-busy`,`true`),c.classList.add(`is-saving`),n.hidden=!1,n.querySelector(`strong`).textContent=e,d.setAttribute(`aria-label`,`保存中`),d.innerHTML=`<span class="mini-spinner"></span>`};s(`正在检查成果库与页面访问状态…`);try{let n=await a(f,s);if(n.rejected){e(),t(n.reason);return}if(n.duplicate){e(),t(`成果库已有“${n.title}” · 位于“${n.groupName}”，未重复保存`);return}r=i(),e(),t(`已保存到“${n.groupName}” · ${n.workTypeName} · 标签：${n.tags.join(` / `)||`待补标签`}`)}catch{o.forEach(e=>{e.disabled=!1}),e(),t(`保存失败，请稍后重试`)}return}let p=o([f.material,...f.files.map(e=>`${e.name}\n${e.excerpt}`)].join(`
`)),h=u===`decision`?n.find(e=>e.id===`decision`):p.id===`decision`?n.find(e=>e.id===`solution`):p;try{await navigator.clipboard.writeText(s(f,h,u)),t(`${u===`decision`?`Decision`:`Review`} brief copied`)}catch{t(`Copy failed — select the material and try again`);return}r=i(),e()}),document.getElementById(`task-files`)?.addEventListener(`change`,async n=>{m(),r.files.push(...await l(n.target.files)),e(),t(`已加入 ${n.target.files.length} 个文件`)});let u=document.querySelector(`.prompt-composer`);u?.addEventListener(`dragover`,e=>{e.preventDefault(),u.classList.add(`drag-over`)}),u?.addEventListener(`dragleave`,()=>u.classList.remove(`drag-over`)),u?.addEventListener(`drop`,async n=>{n.preventDefault(),n.stopPropagation(),u.classList.remove(`drag-over`),m();let i=n.dataTransfer.files;r.files.push(...await l(i)),e(),t(`已加入 ${i.length} 个文件`)});let d=document.getElementById(`task-goal`);requestAnimationFrame(()=>h(d)),d?.addEventListener(`input`,()=>{r.material=d.value,u?.classList.toggle(`has-intake-content`,!!(d.value.trim()||r.files.length)),h(d)}),d?.addEventListener(`paste`,async n=>{let i=[...n.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean);if(!i.length)return;n.preventDefault();let a=n.clipboardData.getData(`text/plain`),o=d.selectionStart??d.value.length,s=d.selectionEnd??o;r.material=`${d.value.slice(0,o)}${a}${d.value.slice(s)}`,r.files.push(...await l(i)),e(),t(`已从剪贴板加入 ${i.length} 个材料`)}),ne({render:e,showToast:t})}function m(){let e=document.getElementById(`task-goal`);e&&(r.material=e.value)}function h(e){if(!e)return;e.style.height=`auto`;let t=Math.min(Math.max(e.scrollHeight,40),180);e.style.height=`${t}px`,e.style.overflowY=e.scrollHeight>180?`auto`:`hidden`}function ee(){document.querySelector(`.prompt-composer`)&&requestAnimationFrame(()=>{document.getElementById(`task-goal`)?.focus({preventScroll:!0})})}function te(e){return!!e?.closest?.(`input, textarea, select, [contenteditable='true']`)}function ne({render:e,showToast:t}){document.onpaste=async n=>{if(te(n.target)||!document.querySelector(`.prompt-composer`))return;let i=[...n.clipboardData?.items||[]].filter(e=>e.kind===`file`).map(e=>e.getAsFile()).filter(Boolean),a=n.clipboardData?.getData(`text/plain`)||``;!i.length&&!a.trim()||(n.preventDefault(),r.material=[r.material.trim(),a.trim()].filter(Boolean).join(`

`),i.length&&r.files.push(...await l(i)),e(),requestAnimationFrame(ee),t(i.length?`已从剪贴板加入 ${i.length} 个材料`:`已把粘贴内容放入输入框`))},document.ondragover=e=>{[...e.dataTransfer?.types||[]].includes(`Files`)&&e.preventDefault()},document.ondrop=async n=>{if(n.target?.closest?.(`.prompt-composer`))return;let i=n.dataTransfer?.files||[];i.length&&(n.preventDefault(),r.files.push(...await l(i)),e(),requestAnimationFrame(ee),t(`已拖入 ${i.length} 个文件`))}}var g=`clair-report-editor-v1`,re=`https://api.github.com`,ie=`clair-report-editor-draft-v1:`,_={reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,token:``,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null,currentPage:0,pageCount:1},ae=new Map,oe=!1;function se(e){return[...new Set(e.filter(Boolean))]}function ce(e=_.target){return e?{...e.path&&e.sha?{[e.path]:e.sha}:{},...Object.fromEntries((e.mirrors||[]).map(e=>[e.path,e.sha])),...e.baseFiles||{}}:{}}function le(e){return`${ie}${e}`}function ue(e){try{let t=sessionStorage.getItem(le(e));if(!t)return null;let n=JSON.parse(t);return!n?.html||typeof n.html!=`string`?null:n}catch{return null}}function de(e=_.reportId){try{sessionStorage.removeItem(le(e))}catch{}}function fe(){return _.dirty&&_.hasDraft?{tone:`changed`,label:_.isLocal?`有新修订 · 上次暂存待保存`:`有新修订 · 上次暂存待推送`}:_.dirty?{tone:`changed`,label:`已修订 · 未暂存`}:_.hasDraft?{tone:`staged`,label:_.isLocal?`已暂存 · 待保存成果库`:`已暂存 · 待推送生产`}:_.lastCommit?{tone:`published`,label:_.isLocal?`成果库 HTML 已更新`:`生产档案已更新`}:{tone:`clean`,label:`未修改`}}function v(){let e=fe(),t=document.querySelector(`.editor-revision-status`);t&&(t.className=`editor-revision-status is-${e.tone}`,t.textContent=e.label);let n=document.querySelector(`[data-editor-action="stash"]`);if(n){n.disabled=_.status!==`ready`||_.saving||!_.dirty;let e=!_.dirty&&_.hasDraft?`已暂存`:`暂存修改`;n.setAttribute(`aria-label`,e),n.title=e}let r=document.querySelector(`[data-editor-action="publish"]`);if(r){r.disabled=_.status!==`ready`||_.saving||!_.dirty&&!_.hasDraft;let e=_.saving?_.isLocal?`正在保存到成果库`:`正在推送生产`:_.isLocal?`保存到成果库`:`推送生产`;r.setAttribute(`aria-label`,e),r.title=e,r.classList.toggle(`is-saving`,_.saving)}let i=document.querySelector(`[data-editor-action="preview"]`);i&&(i.disabled=_.status!==`ready`||_.saving||!_.hasDraft);let a=document.querySelector(`[data-editor-page-counter]`),o=document.querySelector(`[data-editor-page-controls]`);a&&(a.textContent=`${_.currentPage+1} / ${Math.max(1,_.pageCount)}`),o&&(o.hidden=_.pageCount<=1);let s=document.querySelector(`[data-editor-action="prev-page"]`),c=document.querySelector(`[data-editor-action="next-page"]`);s&&(s.disabled=_.currentPage<=0),c&&(c.disabled=_.currentPage>=_.pageCount-1)}function pe(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function me(e){let t=atob(String(e||``).replace(/\s/g,``)),n=Uint8Array.from(t,e=>e.charCodeAt(0));return new TextDecoder().decode(n)}function he(e){let t=new TextEncoder().encode(e),n=``,r=32768;for(let e=0;e<t.length;e+=r)n+=String.fromCharCode(...t.subarray(e,e+r));return btoa(n)}async function ge(e){return{html:e,protection:null}}async function _e(e){return e}function ve(e){try{let t=new URL(e);if(t.hostname.toLowerCase()!==`clairku.github.io`)return null;let n=t.pathname.split(`/`).filter(Boolean).map(decodeURIComponent),r=n.shift()||`ClairKu.github.io`,i=n.join(`/`);(!i||t.pathname.endsWith(`/`))&&(i=`${i?`${i}/`:``}index.html`);let a=se([`docs/${i}`,i,`public/${i}`]);return{owner:`ClairKu`,repository:r,branch:`main`,path:a[0],candidates:a,source:`auto`}}catch{return null}}async function ye(e,{token:t=``,method:n=`GET`,body:r}={}){let i={Accept:`application/vnd.github+json`,"X-GitHub-Api-Version":`2022-11-28`};t&&(i.Authorization=`Bearer ${t}`),r!==void 0&&(i[`Content-Type`]=`application/json`);let a=await fetch(`${re}${e}`,{method:n,headers:i,body:r===void 0?void 0:JSON.stringify(r)});if(!a.ok){let e=``;try{e=(await a.json())?.message||``}catch{e=await a.text()}let t=Error(e||`GitHub API ${a.status}`);throw t.status=a.status,t}return a.status===204?null:a.json()}async function be(e){e.branch=(await ye(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}`)).default_branch||e.branch||`main`;let t=se(e.candidates?.length?e.candidates:[e.path]),n=null,r=null,i=[];for(let a of t)try{let n=a.split(`/`).map(encodeURIComponent).join(`/`),o=await ye(`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${n}?ref=${encodeURIComponent(e.branch)}`),s=``;if(o.encoding===`base64`&&o.content)s=me(o.content);else if(o.download_url){let e=await fetch(o.download_url,{cache:`no-store`});if(!e.ok)throw Error(`无法读取 GitHub 原始文件`);s=await e.text()}if(!s)throw Error(`GitHub 文件内容为空`);r?s===r.html&&i.push({path:a,sha:o.sha}):r={html:s,target:{...e,path:a,sha:o.sha,candidates:t}}}catch(e){if(n=e,e.status&&![403,404].includes(e.status))break}if(r)return r.target.mirrors=i,r;throw n||Error(`没有找到对应的 GitHub HTML 文件`)}function xe(e){e.querySelectorAll(`script`).forEach(e=>{e.dataset.clairOriginalType=e.getAttribute(`type`)??`__empty__`,e.setAttribute(`type`,`application/x-clair-disabled`)}),e.querySelectorAll(`*`).forEach(e=>{[...e.attributes].forEach(t=>{/^on/i.test(t.name)&&(e.setAttribute(`data-clair-event-${t.name.toLowerCase()}`,t.value),e.removeAttribute(t.name))});let t=e.getAttribute(`href`);t&&/^\s*javascript:/i.test(t)&&(e.dataset.clairJavascriptHref=t,e.removeAttribute(`href`))})}function Se(){return`
(() => {
  const channel = ${JSON.stringify(g)};
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

  const restoreDocument = () => {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("contenteditable");
    clone.querySelector("body")?.removeAttribute("spellcheck");
    clone.querySelector("body")?.removeAttribute("data-clair-editable");
    clone.querySelectorAll(".clair-editor-page-hidden").forEach((page) => {
      page.classList.remove("clair-editor-page-hidden");
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
    if (message.type === "set-page") {
      setPage(message.page);
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
  renderPage();
  send("ready");
})();
`}function Ce(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelectorAll(`meta[http-equiv="Content-Security-Policy" i]`).forEach(e=>{e.dataset.clairEditorHttpEquiv=e.getAttribute(`http-equiv`)||`Content-Security-Policy`,e.setAttribute(`http-equiv`,`x-clair-csp-disabled`)}),xe(n);let r=n.createElement(`base`);r.href=t,r.dataset.clairEditorBase=`true`,n.head.prepend(r);let i=n.createElement(`style`);i.id=`clair-editor-style`,i.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    .clair-editor-page-hidden { display: none !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,n.head.append(i);let a=n.createElement(`script`);return a.id=`clair-editor-bridge`,a.textContent=Se(),n.body.append(a),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function we(e){if(e.url)return``;if(e.savedHtml)return e.savedHtml;let t=(e.savedFiles||[]).find(e=>/\.html?$/i.test(e.name||``));return t?.content||t?.excerpt?t.content||t.excerpt:/<!doctype\s+html|<html[\s>]/i.test(e.savedContent||``)?e.savedContent.trim():``}async function Te(e){try{let t=we(e),n=t?null:ve(e.url),r=null;if(t)r={html:t,target:null};else if(n)try{r=await be(n)}catch{}if(!r&&e.url){let t=await fetch(e.url,{cache:`no-store`});if(!t.ok)throw Error(`报告读取失败（HTTP ${t.status}）`);r={html:await t.text(),target:n}}let i=await ge(r.html);_.protection=i.protection,_.target=r.target||n;let a=i.html,o=ue(e.id);if(o?.html)try{let e=await ge(o.html);a=e.html,_.hasDraft=!0,_.draftHtml=e.html,_.draftAt=o.savedAt||``,o.baseFiles&&_.target&&(_.target.baseFiles=o.baseFiles)}catch{de(e.id)}_.html=a,_.editorDocument=Ce(a,e.url||window.location.href),_.status=`ready`,_.error=``}catch(e){_.status=`error`,_.error=e?.message||`无法读取这份 HTML`}finally{_.loadPromise=null,_.render?.()}}function Ee(){let e=_.render,t=_.showToast;Object.assign(_,{reportId:``,reportTitle:``,reportUrl:``,status:`idle`,error:``,html:``,editorDocument:``,dirty:!1,hasDraft:!1,draftHtml:``,draftAt:``,target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:``,isLocal:!1,saveLocal:null,protection:null,loadPromise:null,currentPage:0,pageCount:1,render:e,showToast:t})}function De(){return document.querySelector(`.report-editor-frame`)}function Oe(e,t=null){De()?.contentWindow?.postMessage({channel:g,type:`command`,command:e,value:t},`*`)}function ke(e){let t=De();if(!t?.contentWindow)return;let n=Math.max(0,Math.min(_.pageCount-1,Number(e)||0));_.currentPage=n,t.contentWindow.postMessage({channel:g,type:`set-page`,page:n},`*`),v()}function Ae(){let e=De();if(!e?.contentWindow)return Promise.reject(Error(`编辑画布尚未就绪`));let t=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;return new Promise((n,r)=>{let i=window.setTimeout(()=>{ae.delete(t),r(Error(`读取编辑内容超时`))},1e4);ae.set(t,{resolve:e=>{clearTimeout(i),n(e)}}),e.contentWindow.postMessage({channel:g,type:`serialize`,requestId:t},`*`)})}function je(e){return`${String(e||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``).slice(0,80)||`report`}.html`}function Me(e,t){let n=new Blob([e],{type:`text/html;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=je(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),1e3)}async function Ne(e){await navigator.clipboard.writeText(e)}function Pe(e,t){let n=new DOMParser().parseFromString(e,`text/html`);n.querySelector(`base[data-clair-preview-base]`)?.remove();let r=n.createElement(`base`);return r.href=t,r.dataset.clairPreviewBase=`true`,n.head.prepend(r),`<!DOCTYPE html>\n${n.documentElement.outerHTML}`}function Fe(e){if(!_.hasDraft||!_.draftHtml)throw Error(`请先暂存当前修订，再另开预览`);let t=new Blob([Pe(_.draftHtml,e.url||window.location.href)],{type:`text/html;charset=utf-8`}),n=URL.createObjectURL(t),r=window.open(n,`_blank`);if(!r)throw URL.revokeObjectURL(n),Error(`浏览器拦截了新窗口，请允许弹窗后重试`);r.opener=null,window.setTimeout(()=>URL.revokeObjectURL(n),6e4)}async function Ie(e,{silent:t=!1}={}){let n=await Ae(),r=await _e(n),i=new Date().toISOString();try{sessionStorage.setItem(le(e.id),JSON.stringify({reportId:e.id,reportUrl:e.url,savedAt:i,baseFiles:ce(),html:r}))}catch{throw Error(`浏览器暂存空间不足，请先下载 HTML 备份`)}return _.html=n,_.draftHtml=n,_.draftAt=i,_.hasDraft=!0,_.dirty=!1,_.lastCommit=``,v(),t||_.showToast?.(_.isLocal?`已暂存在当前浏览器会话，尚未写回成果库`:`已暂存在当前浏览器会话，尚未更新 GitHub`),n}async function Le(e){if(!(_.saving||!_.saveLocal)){_.saving=!0,v();try{let t=_.dirty?await Ie(e,{silent:!0}):_.draftHtml||await Ae();await _.saveLocal(t),_.html=t,_.dirty=!1,_.hasDraft=!1,_.draftHtml=``,_.draftAt=``,_.lastCommit=`local`,de(e.id),_.showToast?.(`已更新成果库中的 HTML`)}catch(e){_.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{_.saving=!1,v()}}}async function Re(e){let t=_.target;if(!t?.owner||!t.repository||!t.path||!t.branch)throw Error(`请先填写 GitHub 仓库、分支和 HTML 路径`);if(!_.token)throw Error(`请先提供 GitHub Fine-grained Token`);let n=await _e(e),r=(t.mirrors||[]).map(e=>e.path),i=se([...r.filter(e=>e.startsWith(`public/`)),...r.filter(e=>!e.startsWith(`public/`)&&e!==t.path),t.path]),a=``,o=[];for(let e of i)try{let r=e.split(`/`).map(encodeURIComponent).join(`/`),i=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${r}`,s=await ye(`${i}?ref=${encodeURIComponent(t.branch)}`,{token:_.token}),c=ce(t)[e];if(c&&s.sha!==c)throw Error(`生产文件 ${e} 已在本次编辑后更新，请重新打开报告合并修改`);let l=await ye(i,{token:_.token,method:`PUT`,body:{message:`Update ${_.reportTitle} from Clair's Studio`,content:he(n),sha:s.sha,branch:t.branch}});a=l?.commit?.sha||a,t.baseFiles={...ce(t),[e]:l?.content?.sha||s.sha},o.push(e)}catch(t){throw o.length?Error(`已更新 ${o.join(`、`)}，但 ${e} 同步失败：${t.message}`):t}return{commit:a,files:o.length}}async function ze(e){if(!_.saving){_.saving=!0,v();try{let t=_.dirty?await Ie(e,{silent:!0}):_.draftHtml||await Ae(),n=await Re(t);_.html=t,_.dirty=!1,_.hasDraft=!1,_.draftHtml=``,_.draftAt=``,_.lastCommit=n.commit,de(e.id),_.showToast?.(n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:`已提交 GitHub，Pages 正在更新`)}catch(e){_.showToast?.(e?.message||`保存失败，请下载 HTML 备份`)}finally{_.saving=!1,v()}}}function Be(e){let t=_.target||{owner:`ClairKu`,repository:``,branch:`main`,path:``};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${_.settingsOpen?``:`hidden`}>
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
            placeholder="${_.token?`已连接；留空可继续使用当前 Token`:`github_pat_…`}" ${_.token?``:`required`} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">Cancel</button>
          <button type="submit" class="primary-button">${_.pendingSave?`Connect & save`:`Save settings`}</button>
        </div>
      </form>
    </div>`}function Ve(e){let t=_.target?`${_.target.owner}/${_.target.repository} · ${_.target.path}`:`尚未识别 GitHub 文件路径`;return`
    <div class="dialog-backdrop editor-publish-backdrop" ${_.publishConfirmOpen?``:`hidden`}>
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
          <button type="button" class="quiet-button" data-editor-action="close-publish">Continue editing</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">Publish</button>
        </div>
      </section>
    </div>`}function He({pendingSave:e=!1}={}){_.settingsOpen=!0,_.pendingSave=e;let t=document.querySelector(`.editor-settings-backdrop`);if(!t)return;t.hidden=!1;let n=t.querySelector(`#editor-settings-form`),r=_.target||{};if(n){n.elements.owner.value=r.owner||`ClairKu`,n.elements.repository.value=r.repository||``,n.elements.branch.value=r.branch||`main`,n.elements.path.value=r.path||``;let t=n.querySelector(`button[type="submit"]`);t&&(t.textContent=e?`Connect & save`:`Save settings`)}}function Ue(){_.settingsOpen=!1,_.pendingSave=!1;let e=document.querySelector(`.editor-settings-backdrop`);e&&(e.hidden=!0)}function We(){_.publishConfirmOpen=!0;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!1)}function Ge(){_.publishConfirmOpen=!1;let e=document.querySelector(`.editor-publish-backdrop`);e&&(e.hidden=!0)}function Ke(e=``){return!!(_.reportId&&(!e||_.reportId===e))}function qe(e,{render:t,showToast:n,saveLocal:r=null}){Ee(),Object.assign(_,{reportId:e.id,reportTitle:e.title,reportUrl:e.url,status:`loading`,render:t,showToast:n,isLocal:!!(we(e)&&r),saveLocal:r,currentPage:0,pageCount:1}),t(),_.loadPromise=Te(e)}function Je(e,t){let n=_.isLocal?`本地成果 · 保存在当前浏览器`:_.target?`${_.target.owner}/${_.target.repository} · ${_.target.path}${_.target.mirrors?.length?` · 同步 ${_.target.mirrors.length+1} 处`:``}`:`尚未识别 GitHub 源文件`,r=fe(),i=_.status===`ready`?`
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
        <span class="editor-page-controls" data-editor-page-controls hidden>
          <button type="button" data-editor-action="prev-page" title="上一页">←</button>
          <span data-editor-page-counter>1 / 1</span>
          <button type="button" data-editor-action="next-page" title="下一页">→</button>
        </span>
      </div>`:``,a=_.status===`loading`?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${_.isLocal?`修改后可保存回成果库，也可下载 HTML。`:`会自动识别对应 GitHub 仓库与源文件。`}</p></div>`:_.status===`error`?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${t(_.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">Retry</button><button class="primary-button" type="button" data-editor-action="download-published">Download source HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${t(e.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${pe(_.editorDocument)}"></iframe></div>`,o=e=>({back:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>`,settings:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>`,stash:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>`,preview:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>`,download:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>`,copy:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`,publish:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>`})[e],s=!_.dirty&&_.hasDraft?`已暂存`:`暂存修改`,c=_.saving?_.isLocal?`正在保存到成果库`:`正在推送生产`:_.isLocal?`保存到成果库`:`推送生产`;return`
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
          ${_.isLocal?``:`
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${o(`settings`)}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${s}" title="${s}"
            ${_.status!==`ready`||_.saving||!_.dirty?`disabled`:``}>${o(`stash`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${_.status!==`ready`||!_.hasDraft?`disabled`:``}>${o(`preview`)}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${o(`download`)}</button>
          ${e.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${o(`copy`)}</button>`:``}
          <button class="reader-icon-button publish-icon-action${_.saving?` is-saving`:``}" type="button"
            data-editor-action="publish" aria-label="${c}" title="${c}"
            ${_.status!==`ready`||_.saving||!_.dirty&&!_.hasDraft?`disabled`:``}>${o(`publish`)}</button>
        </div>
      </header>
      ${i}
      ${a}
      ${Be(t)}
      ${Ve(t)}
    </main>`}function Ye(e){if(!Ke(e.id))return;oe||(oe=!0,window.addEventListener(`message`,e=>{let t=De();if(!(!t?.contentWindow||e.source!==t.contentWindow)&&e.data?.channel===g){if(e.data.type===`dirty`&&(_.dirty=!0,_.lastCommit=``,v()),e.data.type===`page-info`&&(_.pageCount=Math.max(1,Number(e.data.pageCount)||1),_.currentPage=Math.max(0,Math.min(_.pageCount-1,Number(e.data.page)||0)),v()),e.data.type===`serialized`){let t=ae.get(e.data.requestId);if(!t)return;ae.delete(e.data.requestId),t.resolve(e.data.html)}e.data.type===`selection`&&document.querySelectorAll(`[data-editor-command]`).forEach(t=>{let n=t.dataset.editorCommand;[`bold`,`italic`,`underline`].includes(n)&&t.classList.toggle(`active`,!!e.data[n])})}}),window.addEventListener(`beforeunload`,e=>{!_.reportId||!_.dirty||(e.preventDefault(),e.returnValue=``)}),window.addEventListener(`keydown`,e=>{e.key!==`Escape`||!_.reportId||(_.publishConfirmOpen?Ge():_.settingsOpen&&Ue())})),document.querySelectorAll(`[data-editor-command]`).forEach(e=>{e.addEventListener(`mousedown`,e=>e.preventDefault()),e.addEventListener(`click`,()=>Oe(e.dataset.editorCommand))});let t=document.querySelector(`[data-editor-format]`);t?.addEventListener(`change`,()=>{Oe(`formatBlock`,t.value),t.value=`p`}),document.querySelectorAll(`[data-editor-action]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.editorAction;if(n===`exit`){if(_.dirty&&!confirm(`还有未暂存的修改。确定退出编辑模式吗？`))return;let e=_.render;Ee(),e?.()}else if(n===`settings`)He();else if(n===`close-settings`)Ue();else if(n===`stash`)try{await Ie(e)}catch(e){_.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`preview`)try{Fe(e),_.showToast?.(`已在新窗口打开暂存修订`)}catch(e){_.showToast?.(e?.message||`无法打开预览`)}else if(n===`publish`)try{if(_.isLocal){await Le(e);return}if(_.dirty&&await Ie(e,{silent:!0}),!_.hasDraft){_.showToast?.(`当前没有待推送的修订`);return}We()}catch(e){_.showToast?.(e?.message||`暂存失败，请下载 HTML 备份`)}else if(n===`close-publish`)Ge();else if(n===`confirm-publish`)Ge(),!_.token||!_.target?.path?He({pendingSave:!0}):await ze(e);else if(n===`download`)try{Me(await _e(await Ae()),e.title),_.showToast?.(`HTML 已下载`)}catch(e){_.showToast?.(e?.message||`下载失败`)}else if(n===`download-published`)await Xe(e,_.showToast);else if(n===`share`)try{await Ne(e.url),_.showToast?.(`报告链接已复制`)}catch{_.showToast?.(`复制失败，请从地址栏复制`)}else if(n===`link`){let e=prompt(`输入链接地址（https://…）`);if(!e)return;try{let t=new URL(e);if(![`http:`,`https:`,`mailto:`].includes(t.protocol))throw Error();Oe(`createLink`,t.href)}catch{_.showToast?.(`请输入有效的 http、https 或 mailto 链接`)}}else if(n===`paste`)try{let e=await navigator.clipboard.readText();if(!e)return;Oe(`insertText`,e)}catch{_.showToast?.(`请在编辑区域使用 ⌘V 粘贴`)}else n===`prev-page`?ke(_.currentPage-1):n===`next-page`?ke(_.currentPage+1):n===`retry`&&(_.status=`loading`,_.error=``,_.render?.(),_.loadPromise||=Te(e))})}),document.querySelectorAll(`.editor-settings-backdrop, .editor-publish-backdrop`).forEach(e=>{e.addEventListener(`click`,t=>{t.target===e&&(e.classList.contains(`editor-settings-backdrop`)?Ue():Ge())})});let n=document.getElementById(`editor-settings-form`);n?.addEventListener(`submit`,async t=>{t.preventDefault();let r=new FormData(n),i=String(r.get(`github-token-not-password`)||``).trim();i&&(_.token=i);let a=String(r.get(`path`)||``).trim().replace(/^\/+/,``);_.target={..._.target||{},owner:String(r.get(`owner`)||``).trim(),repository:String(r.get(`repository`)||``).trim(),branch:String(r.get(`branch`)||`main`).trim(),path:a,mirrors:a===_.target?.path&&_.target?.mirrors||[],source:`manual`};let o=_.pendingSave;Ue();let s=document.querySelector(`.editor-target-label`);if(s){let e=`${_.target.owner}/${_.target.repository} · ${_.target.path}`;s.textContent=e,s.title=e}_.showToast?.(`保存权限已连接`),o&&await ze(e)})}async function Xe(e,t){try{let n=await fetch(e.url,{cache:`no-store`});if(!n.ok)throw Error();Me(await n.text(),e.title),t?.(`HTML 已下载`)}catch{window.open(e.url,`_blank`,`noopener,noreferrer`),t?.(`浏览器限制了直接下载，已打开原页面`)}}async function Ze(e,t){try{await Ne(e.url),t?.(`报告链接已复制`)}catch{t?.(`复制失败，请从地址栏复制`)}}var Qe={production:`生产 直达 public`,org:`组织 登录 restricted`,account:`账号 登录 restricted`};function y(e=``){return String(e).normalize(`NFKC`).toLocaleLowerCase(`zh-CN`).normalize(`NFD`).replace(/\p{Diacritic}/gu,``).replace(/\s+/g,` `).trim()}function $e(e=``){return y(e).split(` `).filter(Boolean)}function et(e,t,{group:n={},workTypeName:r=``}={}){return nt(e,t,{group:n,workTypeName:r})>0}function tt(e){let t=Array.isArray(e.savedFiles)?e.savedFiles.flatMap(e=>[e?.name,e?.content,e?.excerpt]):[];return[e.description,e.savedContent,e.savedHtml,e.searchContent,...t].filter(Boolean).join(` `)}function nt(e,t,{group:n={},workTypeName:r=``}={}){let i=$e(t);if(!i.length)return 1;let a={title:y(e.title),tags:y((e.tags||[]).join(` `)),source:y(e.source),content:y(tt(e)),type:y(r),topic:y([n.name,n.description].filter(Boolean).join(` `)),url:y(e.url),access:y([e.access,Qe[e.access]].filter(Boolean).join(` `))},o=y([e.title,e.source,e.url,e.access,Qe[e.access],r,...e.tags||[],n.name,n.description,tt(e)].filter(Boolean).join(` `)),s=0;for(let t of i){if(!o.includes(t))return 0;a.title===t?s+=600:a.title.startsWith(t)?s+=360:a.title.includes(t)&&(s+=280),(e.tags||[]).some(e=>y(e)===t)?s+=150:a.tags.includes(t)&&(s+=110),a.source.includes(t)&&(s+=75),a.type.includes(t)&&(s+=60),a.topic.includes(t)&&(s+=45),a.content.includes(t)&&(s+=32),a.url.includes(t)&&(s+=18),a.access.includes(t)&&(s+=8)}return s}var rt=`clair-service-report-workbench-v1`,it=`clair-service-report-workbench-view`,at=`clair-service-report-time-sort-v1`,ot=`clair-service-report-workbench-bucket-order-v1`,st=`clair-service-report-workbench-report-order-v1`,b=36,ct=[{id:`requirement-review`,name:`需求评审`},{id:`reporting`,name:`汇报材料`},{id:`competitive-research`,name:`竞品调研`},{id:`product-planning`,name:`产品规划`},{id:`data-analysis`,name:`数据分析`},{id:`investment-research`,name:`投研分析`},{id:`governance-review`,name:`治理审查`},{id:`product-demo`,name:`原型 Demo`}],lt=[`手动保存`,`生产`,`个人`,`HTML`,`本体`,`飞书`,`调研`,`产品规划`,`AI 小顾`,`AI 工作台`,`AI 开放平台`,`且慢`,`OAP`,`MCP`,`Skills`,`投顾服务`,`投研`,`数据分析`,`需求评审`,`经营汇报`,`知识治理`],x={plus:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>`,minus:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg>`,edit:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z"></path><path d="m13 7 4 4"></path></svg>`,archive:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z"></path><path d="M3 4h18v3H3zM9 11h6"></path></svg>`,close:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>`,star:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"></path></svg>`,top:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 19V8m0 0-4 4m4-4 4 4"></path></svg>`,up:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"></path></svg>`,down:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg>`,bottom:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14M12 5v11m0 0-4-4m4 4 4-4"></path></svg>`},S={version:b,groups:[{id:`xiaogu`,name:`AI 小顾与投顾服务`,description:`AI 小顾、顾问服务与客户体验`,accent:`green`,position:0},{id:`ai-workbench`,name:`AI 工作台与生产力`,description:`个人工作台、评审工具与 AI 生产力`,accent:`blue`,position:1},{id:`ai-platform`,name:`AI 开放平台`,description:`OAP、MCP、Skills、Agents 与治理`,accent:`violet`,position:2},{id:`product-planning`,name:`且慢产品与体验`,description:`产品规划、体验分析与交互方案`,accent:`blue`,position:3},{id:`research`,name:`投研与策略研究`,description:`基金、策略与资产配置研究`,accent:`amber`,position:4},{id:`reporting`,name:`经营分析与汇报`,description:`业务分析、周报与管理汇报`,accent:`blue`,position:5},{id:`knowledge`,name:`知识治理与组织协同`,description:`本体、飞书、SOUL 与知识资产`,accent:`slate`,position:6}],reports:[{id:`gpt-codex-plan-analysis-2026-08-04`,groupId:`ai-workbench`,title:`GPT / Codex 使用分析与方案建议`,url:`https://clairku.github.io/clair-ai-studio/reports/gpt-codex-plan-analysis-2026-08-04/`,preview:`gpt-codex-plan-analysis-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T09:25:00.000Z`,source:`近两个月本地 Codex Token 结构 × 官方套餐与费率核验 × 模型路由建议｜公开直达`,access:`production`,workType:`data-analysis`,tags:[`个人`,`Codex`,`GPT`,`Token`,`数据分析`,`模型路由`,`套餐建议`,`公开`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-oap-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（增长可视化内嵌版）`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-report-2026-08-03/`,preview:`yingmi-oap-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T22:30:00.000Z`,source:`飞书十项框架 × Clair 视觉模版｜用户增长章节内嵌 OAP 历程·里程碑与增长走势交互图（oap-journey-metrics-2026-08-02）`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`飞书框架`,`用户增长`,`微信`,`千问`,`AI 实验室`,`商化准备`,`HTML`,`生产`]},{id:`oap-executive-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（Executive 视觉版）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-executive-report-2026-08-03/`,preview:`oap-executive-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T20:00:00.000Z`,source:`飞书 revision 30 十项框架｜OKR 复算 · 微信千问双入口 · 九平台三层货架 · AI 实验室 · 商化闭环`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR 复算`,`微信`,`千问`,`AI 实验室`,`商业化`,`HTML`,`生产`]},{id:`oap-project-report-feishu-framework-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 汇报（十项框架）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-report-feishu-framework-2026-08-03/`,preview:`oap-project-report-feishu-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T19:45:00.000Z`,source:`飞书 v2 revision 66 十项大纲｜用户增长可视化已纳入 · 四类机构榜单 · OKR 复算 · 千问微信双入口 · 公开直达`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR 复算`,`千问`,`微信`,`货架矩阵`,`AI 实验室`,`公开`,`HTML`,`生产`]},{id:`yingmi-ai-oap-h2-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜2026 H2 项目汇报`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-h2-2026-08-03/`,preview:`yingmi-ai-oap-h2-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T19:00:00.000Z`,source:`飞书文档五条主线｜项目进展 × 产品规划 × 商化准备 × 往外看 × 向内看 → OAP 商业闭环`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`千问`,`商化准备`,`竞品分析`,`HTML`,`生产`]},{id:`yingmi-ai-open-platform-progress-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台项目汇报`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-open-platform-progress-2026-08-03/`,preview:`yingmi-ai-oap-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T18:00:00.000Z`,source:`飞书文档｜平台架构、业务规模与商业化进展全景视图`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`商业化`,`项目汇报`,`HTML`,`生产`]},{id:`oap-project-review-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（证据版）`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-review-2026-08-03/`,preview:`oap-project-review-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-02T19:30:00.000Z`,source:`指定飞书 Wiki revision 30｜OKR 数据 × 用户增长可视化 × 微信/千问双入口 × 渠道矩阵 × 能力治理 × AI 实验室 × 商化，15 章节 13 张原图证据`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`OKR`,`微信`,`千问`,`AI 实验室`,`商化准备`,`HTML`,`生产`]},{id:`yingmi-oap-project-briefing-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜8·3 项目汇报（框架全景）`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-oap-project-briefing-2026-08-03/`,preview:`yingmi-oap-project-briefing-2026-08-03.svg`,pinned:!1,createdAt:`2026-08-02T19:15:00.000Z`,source:`飞书源稿十项框架（revision 1934）｜OKR → 关键举措 → 里程碑 → 微信/千问 → 渠道矩阵 → 能力体系 → 系统建设 → AI 实验室 → 商化 → 行业 → 问题回顾`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`飞书框架`,`微信`,`千问`,`渠道矩阵`,`AI 实验室`,`HTML`,`生产`]},{id:`oap-report-collaboration-retrospective-2026-08-04`,groupId:`ai-platform`,title:`一次报告，如何变成一套系统｜OAP 协作复盘`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-report-collaboration-retrospective-2026-08-04/`,preview:`oap-report-collaboration-retrospective-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T11:30:00.000Z`,source:`2026-08-02—03 OAP 报告任务｜证据审计 × 管理叙事 × 多版本收敛 × CLAIR 生产发布`,access:`production`,workType:`reporting`,tags:[`项目复盘`,`AI 开放平台`,`OAP`,`报告方法`,`协作`,`证据治理`,`版本管理`,`CLAIR`,`HTML`,`生产`]},{id:`qieman-ai-product-practice-oap-edition-2026-08-04`,groupId:`ai-platform`,title:`盈米 AI 产品实践｜OAP 模版重制版`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-oap-edition-2026-08-04/`,preview:`qieman-ai-product-practice-oap-edition-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T13:30:00.000Z`,source:`原《盈米 AI 产品实践》完整内容｜套用 OAP 22 屏框架、视觉系统与交互｜新增独立报告`,access:`production`,workType:`reporting`,tags:[`盈米 AI`,`且慢产品`,`OAP 模版`,`金融服务操作系统`,`AI 小顾`,`投顾工作台`,`微信`,`千问`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-ai-oap-outline-concepts-2026-08-04`,groupId:`ai-platform`,title:`OAP 报告大纲页｜三版设计预览`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-outline-concepts-2026-08-04/`,preview:`yingmi-ai-oap-outline-concepts-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T07:10:00.000Z`,source:`盈米 AI OAP 28 屏正式报告｜管理层决策地图 × 增长叙事路线 × 平台系统全景`,access:`production`,workType:`product-planning`,tags:[`AI 开放平台`,`OAP`,`报告大纲`,`管理汇报`,`信息架构`,`视觉设计`,`CLAIR`,`HTML`,`生产`]},{id:`yingmi-ai-oap-framework-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜把能力做成增长`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-oap-framework-2026-08-03/`,preview:`yingmi-ai-oap-framework-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T02:55:00.000Z`,source:`飞书文档 revision 1978｜真实增长图 × 微信/千问场景 × 五层能力生产线 × AI 实验室用户共创 × 商化收费路由 × 机构使用 × MCP TOP20`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`项目汇报`,`微信`,`千问`,`能力生产线`,`AI 实验室`,`用户共创`,`商化收费`,`企业年包`,`按量预付`,`机构使用`,`MCP TOP20`,`HTML`,`生产`]},{id:`qieman-mcp-top20-2026-08-03`,groupId:`ai-platform`,title:`MCP 全量调用 TOP20｜69 项接口审计`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-mcp-top20-2026-08-03/`,preview:`qieman-mcp-top20-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T05:00:00.000Z`,source:`盈米 MCP 接口市场 7 页 69 项全量审计｜剔除时间查询后的业务 TOP20、集中度与类别结构`,access:`production`,workType:`data-analysis`,tags:[`AI 开放平台`,`OAP`,`MCP`,`数据分析`,`调用统计`,`且慢`,`HTML`,`生产`]},{id:`yingmi-ai-bottom-up-architecture-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI｜双关系图视觉重绘`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-bottom-up-architecture-2026-08-03/`,preview:`yingmi-ai-bottom-up-architecture-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T10:30:00.000Z`,source:`服务关系图 × 系统关系图｜原图内容与关系不变 · CLAIR 紫色系宋体重绘`,access:`production`,workType:`product-planning`,tags:[`AI 开放平台`,`OAP`,`AI 实验室`,`AI 工作台`,`Stargate`,`产品规划`,`经营汇报`,`HTML`,`生产`]},{id:`yingmi-ai-brand-building-effects-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI｜品牌建设与效果`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-brand-building-effects-2026-08-03/`,preview:`yingmi-ai-brand-building-effects-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-03T02:00:00.000Z`,source:`MCP 首发 → 分层内容 → 生态共建 → 行业标准｜品牌效果与经营闭环`,access:`production`,workType:`reporting`,tags:[`盈米 AI`,`品牌建设`,`MCP`,`传播复盘`,`生态合作`,`经营汇报`,`HTML`,`生产`]},{id:`yingmi-ai-two-modes-four-continuous-2026-08-02`,groupId:`ai-platform`,title:`盈米 AI｜持续引擎与势能放大`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-two-modes-four-continuous-2026-08-02/`,preview:`yingmi-ai-two-modes-four-continuous-2026-08-02.svg`,pinned:!0,position:0,createdAt:`2026-08-02T14:30:00.000Z`,source:`一张总图｜四个持续核心引擎 → 开放平台 → 两种接入模式 → 更多群体与势能`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`经营汇报`,`渠道布局`,`HTML`,`生产`]},{id:`clair-executive-visual-report-template-2026-08-02`,groupId:`ai-workbench`,title:`Clair 专用报告模板 2.1`,url:`https://clairku.github.io/clair-ai-studio/reports/clair-executive-visual-report-template-2026-08-02/`,preview:`clair-executive-visual-report-template-2026-08-02.png`,pinned:!0,position:0,createdAt:`2026-08-02T15:30:00.000Z`,source:`Clair Editorial System 2.1｜OAP 同款封面封底 × 统一标题基线 × 报告大纲 × 九类模块 × 双端校验`,access:`production`,workType:`reporting`,tags:[`AI 工作台`,`Skills`,`专用模板`,`经营汇报`,`设计系统`,`HTML`,`生产`]},{id:`yingmi-ai-communications-evidence-report-2026-07-31`,groupId:`ai-platform`,title:`盈米 AI｜阶段成果与三路布局`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-communications-evidence-report-2026-07-31/`,preview:`yingmi-ai-stage-summary-2026-08-02.svg`,pinned:!0,position:0,createdAt:`2026-07-31T08:30:00.000Z`,source:`目标完成 × 三路分发 × 机构使用 × 商业验证 × 品牌影响力`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agents`,`经营汇报`,`渠道布局`,`HTML`,`生产`]},{id:`oap-project-report-2026-08-03`,groupId:`ai-platform`,title:`盈米 AI 开放平台项目汇报｜从势能走向经营闭环`,url:`https://clairku.github.io/clair-ai-studio/reports/oap-project-report-2026-08-03/`,preview:`oap-project-report-2026-08-03.svg`,pinned:!0,position:0,createdAt:`2026-08-02T16:30:00.000Z`,source:`飞书 P1—P15｜项目进展、双模式四持续、新流量、三层能力、治理、商化与 90 天行动`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`MCP`,`Skills`,`Agent`,`商业化`,`老板汇报`,`HTML`,`生产`]},{id:`stargate-financial-institutions-2026-08-02`,groupId:`ai-platform`,title:`Stargate 金融机构使用统计｜488 家接入、需求聚焦基金 AI 投研`,url:`https://clairku.github.io/clair-ai-studio/reports/stargate-financial-institutions-2026-08-02/`,preview:`stargate-financial-institutions-2026-08-02.svg`,pinned:!1,position:1,createdAt:`2026-08-02T14:30:00.000Z`,source:`生产数仓实查（ying99_oap）｜剔除盈米口径、类型 TOP10、需求场景与重点机构`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`OAP`,`Stargate`,`金融机构`,`数据报告`,`CLAIR`,`公开`,`HTML`,`生产`]},{id:`ai-h1-review-h2-okr-2026`,groupId:`ai-platform`,title:`AI 产品上半年复盘｜下半年 OKR`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-h1-review-h2-okr-2026/`,preview:`ai-h1-review-h2-okr-2026.svg`,pinned:!0,position:0,createdAt:`2026-08-02T09:55:00.000Z`,source:`飞书源文档｜挑战、规模证据、千问/微信、小顾、顾问提效、开放生态与组织转型`,access:`production`,workType:`reporting`,tags:[`AI 开放平台`,`AI 小顾`,`顾问工作台`,`OKR`,`经营汇报`,`产品规划`,`HTML`,`生产`]},{id:`qieman-return-rate-incident-review-2026-08-04`,groupId:`product-planning`,title:`且慢累计收益率异常｜口径、边界与修复决策`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-return-rate-incident-review-2026-08-04/`,preview:`qieman-return-rate-incident-review-2026-08-04.svg`,pinned:!0,position:0,createdAt:`2026-08-04T14:30:00.000Z`,source:`QMRD-46867｜三页面同一收益额对应三种收益率；证据审计、算法有效域、指标治理与 PM 决策，公开直达`,access:`production`,workType:`data-analysis`,tags:[`且慢`,`累计收益率`,`数据分析`,`产品规划`,`需求评审`,`Modified Dietz`,`TWR`,`口径治理`,`公开`,`HTML`,`生产`]},{id:`family-asset-report-five-visual-directions-2026-07-31`,groupId:`product-planning`,title:`家庭资产报告｜五套全新视觉方向`,url:`https://clairku.github.io/clair-ai-studio/reports/family-asset-report-five-visual-directions-2026-07-31/`,preview:`family-asset-report-five-visual-directions-2026-07-31.svg`,pinned:!0,position:0,createdAt:`2026-07-31T14:30:00.000Z`,source:`五套 Figma 原生视觉系统｜30 张 A4 样张与选型建议`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`产品规划`,`投顾服务`,`HTML`,`生产`]},{id:`family-asset-report-visual-review-2026-07-31`,groupId:`product-planning`,title:`家庭资产报告｜旧版视觉评审（已迭代）`,url:`https://clairku.github.io/clair-ai-studio/reports/family-asset-report-visual-review-2026-07-31/`,preview:`family-asset-report-visual-review-2026-07-31.svg`,pinned:!1,position:0,createdAt:`2026-07-31T13:30:00.000Z`,source:`旧版 Figma 视觉方案评审｜已由五套全新视觉方向替代`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`产品规划`,`投顾服务`,`HTML`,`生产`]},{id:`content-classification-review-sop-2026-07-30`,groupId:`knowledge`,title:`宣传推介材料｜内容分层标准与审核 SOP`,url:`https://clairku.github.io/clair-ai-studio/reports/content-classification-review-sop-2026-07-30/`,preview:`content-classification-review-sop-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T10:40:00.000Z`,source:`盈米内容治理｜两级分类、事前审核、双轨巡检与记录留痕`,access:`production`,workType:`governance-review`,tags:[`知识治理`,`HTML`,`生产`]},{id:`qieman-longwin-group-page-review-2026-07-30`,groupId:`product-planning`,title:`长赢同路人小组详情页｜双版产品评审`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-longwin-group-page-review-2026-07-30/`,preview:`qieman-longwin-group-page-review-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T08:57:42.000Z`,source:`左右双版视觉稿｜信息层级、加入资格、协议状态与转化闭环`,access:`production`,workType:`requirement-review`,tags:[`且慢`,`需求评审`,`投顾服务`,`产品规划`,`HTML`,`生产`]},{id:`ai-xiaogu-personal-service-demo-2026-07-30`,groupId:`xiaogu`,title:`AI 小顾｜个人投资服务与卡片广场 Demo`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-personal-service-demo-2026-07-30/`,preview:`ai-xiaogu-personal-service-demo-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T18:00:00.000Z`,source:`AI 小顾主动服务、追问归因、账户报告与卡片市场产品原型`,access:`production`,workType:`product-demo`,tags:[`AI 小顾`,`投顾服务`,`产品规划`,`HTML`,`生产`]},{id:`ai-service-blueprint-serif-2026-07-30`,groupId:`reporting`,title:`盈米 AI 服务蓝图｜统一能力底座与三端业务`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-service-blueprint-serif-2026-07-30/`,preview:`ai-service-blueprint-serif-2026-07-30.png`,pinned:!0,position:0,createdAt:`2026-07-30T16:30:00.000Z`,source:`两张业务蓝图视觉稿｜统一宋体版`,access:`production`},{id:`ai-xiaogu-product-experience-2026-07-30`,groupId:`xiaogu`,title:`且慢 AI 小顾｜八条关键产品经验`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-xiaogu-product-experience-2026-07-30/`,preview:`ai-xiaogu-product-experience-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-30T12:00:00.000Z`,source:`AI 小顾产品经验总结`,access:`production`},{id:`workbench-quality-audit-2026-07-30`,groupId:`ai-workbench`,title:`Clair's Studio｜全站质量审计与修复报告`,url:`https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/`,preview:`workbench-quality-audit-2026-07-30.svg`,pinned:!0,position:0,createdAt:`2026-07-29T18:20:00.000Z`,source:`生产质量审计`,access:`production`},{id:`yingmi-ai-materials-compendium-2026-07-30`,groupId:`ai-platform`,title:`盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/`,pinned:!0,position:0,createdAt:`2026-07-30T06:30:00.000Z`,source:`飞书根材料与 40 个档案节点`,access:`production`},{id:`qieman-ai-product-practice-2026-07-30`,groupId:`ai-platform`,title:`盈米 AI 产品实践｜且慢产品团队`,url:`https://clairku.github.io/clair-ai-studio/reports/qieman-ai-product-practice-2026-07-30/`,preview:`qieman-ai-product-practice-2026-07-30.svg`,pinned:!0,position:1,createdAt:`2026-07-30T10:30:00.000Z`,source:`且慢产品团队｜业务蓝图 × 微信/千问外部入口 × 小顾全局规划 × 服务生态`,access:`production`},{id:`ai-three-projects-management-deck-2026-07-30`,groupId:`reporting`,title:`盈米 AI 金融服务操作系统蓝图｜用 AI 重做服务生产`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-three-projects-management-deck-2026-07-30/`,preview:`ai-three-projects-management-deck-2026-07-30.png`,pinned:!0,position:0,createdAt:`2026-07-30T07:00:00.000Z`,source:`飞书根材料与三个项目汇总`,access:`production`},{id:`seed-mcp-benchmark`,groupId:`ai-platform`,title:`三家金融 MCP / Skills 服务最完整对比｜010350 同题实测`,url:`https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/`,pinned:!0,position:0,createdAt:`2026-07-28T10:00:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-fund-report`,groupId:`research`,title:`东方财富妙想版｜010350 基金深度诊断`,url:`https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/`,pinned:!1,position:1,createdAt:`2026-07-28T09:30:00.000Z`,source:`近月新增`,access:`production`},{id:`storage-big-three-fund-screening`,groupId:`research`,title:`存储三巨头基金筛选｜境内 QDII 与港股通`,url:`https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T04:49:24.000Z`,source:`盈米 Skills / MCP`,access:`production`},{id:`seed-agreement`,groupId:`ai-platform`,title:`盈米 MCP 协议审查台`,url:`https://clairku.github.io/yingmi-mcp-agreement-review/`,pinned:!0,position:0,createdAt:`2026-07-28T08:50:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-xiaogu`,groupId:`xiaogu`,title:`且慢小顾介绍｜AI 投资助手`,url:`https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/`,pinned:!1,position:1,createdAt:`2026-07-27T07:40:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-strategy`,groupId:`research`,title:`公募策略多指标双轴探索器｜四笔钱`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html`,pinned:!1,position:0,createdAt:`2026-07-27T07:20:00.000Z`,source:`近月新增`,access:`production`},{id:`seed-ecosystem`,groupId:`ai-platform`,title:`盈米 AI 实验室｜服务组件编排 Demo`,url:`https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/`,pinned:!1,position:2,createdAt:`2026-07-26T14:40:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-library-index`,groupId:`knowledge`,title:`且慢产品研究页面库｜原始总入口`,url:`https://clairku.github.io/qieman-product-research-library/`,pinned:!0,position:0,createdAt:`2026-07-26T09:23:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-inventory`,groupId:`product-planning`,title:`且慢投顾模块现况盘点报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html`,pinned:!1,position:0,createdAt:`2026-07-24T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-direction-research`,groupId:`product-planning`,title:`且慢 APP 投顾模块｜现况盘点与改版方向`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html`,pinned:!1,position:1,createdAt:`2026-07-23T09:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-v09`,groupId:`product-planning`,title:`且慢投顾页改版｜方向与方案设计 V0.9`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html`,pinned:!0,position:2,createdAt:`2026-07-24T09:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-network-research`,groupId:`product-planning`,title:`且慢产品现况网络调研报告`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html`,pinned:!1,position:3,createdAt:`2026-07-24T09:20:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-final`,groupId:`product-planning`,title:`且慢投顾页改版｜推荐方案定稿与备选`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html`,pinned:!1,position:4,createdAt:`2026-07-24T09:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-demo`,groupId:`product-planning`,title:`且慢投顾页改版交互 Demo｜方案 B`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html`,pinned:!1,position:5,createdAt:`2026-07-24T09:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-advisor-plan`,groupId:`product-planning`,title:`且慢投顾页改版｜产品规划与计划书`,url:`https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html`,pinned:!1,position:6,createdAt:`2026-07-24T09:50:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-home-entry-analysis`,groupId:`xiaogu`,title:`且慢 App 首页金刚位分析报告｜修正版`,url:`https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8`,pinned:!1,position:2,createdAt:`2026-07-23T10:00:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-advisor-click-analysis`,groupId:`product-planning`,title:`且慢投顾页点击与转化分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html`,pinned:!1,position:7,createdAt:`2026-07-24T10:00:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-map`,groupId:`xiaogu`,title:`且慢 APP 完整功能全景`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html`,pinned:!1,position:3,createdAt:`2026-07-24T10:10:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-deep-analysis`,groupId:`xiaogu`,title:`且慢 App 深度产品分析报告`,url:`https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN`,pinned:!1,position:4,createdAt:`2026-07-24T10:20:00.000Z`,source:`研究库`,access:`org`},{id:`qieman-app-usage`,groupId:`xiaogu`,title:`且慢 APP 使用情况与证据`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html`,pinned:!1,position:5,createdAt:`2026-07-24T10:30:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-app-roadmap`,groupId:`xiaogu`,title:`且慢 APP 深度产品判断与路线图`,url:`https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html`,pinned:!1,position:6,createdAt:`2026-07-24T10:40:00.000Z`,source:`研究库`,access:`production`},{id:`qieman-ai-native`,groupId:`xiaogu`,title:`且慢 APP AI 原生转型三案`,url:`https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html`,pinned:!0,position:7,createdAt:`2026-07-24T10:50:00.000Z`,source:`研究库`,access:`production`},{id:`oap-progress-roadmap`,groupId:`ai-platform`,title:`OAP 进展与规划汇报`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html`,pinned:!1,position:3,createdAt:`2026-07-24T11:00:00.000Z`,source:`研究库`,access:`production`},{id:`oap-metrics-trend`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜上线以来运营趋势`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html`,pinned:!0,position:4,createdAt:`2026-07-28T10:11:00.000Z`,source:`近月新增`,access:`production`},{id:`oap-journey-metrics-2026-08-02`,groupId:`ai-platform`,title:`盈米 AI｜关键历程 × 用户增长`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-journey-metrics-2026-08-02.html`,preview:`oap-journey-metrics-2026-08-02.svg`,pinned:!0,position:5,createdAt:`2026-08-02T13:40:00.000Z`,source:`16 个时间组 × 32 件事项 × 置顶联动 × 用户增长走势`,access:`production`},{id:`oap-reporting-framework`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html`,pinned:!0,position:6,createdAt:`2026-07-30T08:00:00.000Z`,source:`OAP 管理层汇报成稿`,access:`production`},{id:`oap-h2-okr-iteration-review`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜上线以来迭代复盘与下半年 OKR 汇报`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html`,pinned:!0,position:7,createdAt:`2026-07-31T15:30:00.000Z`,source:`OAP 管理层汇报`,access:`production`},{id:`oap-traffic-analysis`,groupId:`ai-platform`,title:`盈米 AI 开放平台｜全站访问与点击分析`,url:`https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html`,pinned:!0,position:8,createdAt:`2026-07-28T12:10:00.000Z`,source:`近月新增`,access:`production`},{id:`eastmoney-platform`,groupId:`ai-platform`,title:`东方财富 AI Skills 平台深度竞品分析`,url:`https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/`,pinned:!1,position:9,createdAt:`2026-07-28T08:57:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-strategy-explorer`,groupId:`research`,title:`四笔钱策略检视台｜筛选、对比与全指标分析`,url:`https://clairku.github.io/qieman-strategy-explorer/`,pinned:!1,position:2,createdAt:`2026-07-27T16:43:00.000Z`,source:`近月新增`,access:`production`},{id:`financial-planning-review`,groupId:`research`,title:`财务规划报告｜现金流与目标可达性改稿建议`,url:`https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/`,pinned:!1,position:3,createdAt:`2026-07-27T11:27:00.000Z`,source:`近月新增`,access:`production`},{id:`investment-behavior-report`,groupId:`research`,title:`投资行为画像｜行为金融洞察报告（脱敏版）`,url:`https://clairku.github.io/my-investment-behavior-report/`,pinned:!1,position:4,createdAt:`2026-07-16T14:56:00.000Z`,source:`近月新增`,access:`production`},{id:`product-review-workbench`,groupId:`product-planning`,title:`产品需求评审工作台`,url:`https://clairku.github.io/product-review-workbench/`,pinned:!0,position:8,createdAt:`2026-07-08T06:43:00.000Z`,source:`近月新增`,access:`production`},{id:`community-ai-review`,groupId:`product-planning`,title:`社区 AI 运营方案｜需求评审报告`,url:`https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/`,pinned:!1,position:9,createdAt:`2026-07-28T08:20:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-review`,groupId:`reporting`,title:`金榛子奖申报材料审查报告`,url:`https://clairku.github.io/jinzhenzi-submission-review/`,pinned:!1,position:0,createdAt:`2026-07-28T11:01:00.000Z`,source:`近月新增`,access:`production`},{id:`jinzhenzi-history`,groupId:`reporting`,title:`金榛子奖历届获奖项目档案`,url:`https://clairku.github.io/jinzhenzi-submission-review/history.html`,pinned:!1,position:1,createdAt:`2026-07-28T11:20:00.000Z`,source:`近月新增`,access:`production`},{id:`xiaogu-user-needs`,groupId:`xiaogu`,title:`小顾用户需求分析与关键钩子工具方案`,url:`https://clairku.github.io/xiaogu-user-needs-report/`,pinned:!1,position:8,createdAt:`2026-07-16T09:58:00.000Z`,source:`近月新增`,access:`production`},{id:`qieman-ai-advisor-ecosystem`,groupId:`xiaogu`,title:`且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo`,url:`https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site`,pinned:!0,position:9,createdAt:`2026-07-26T15:05:00.000Z`,source:`近月新增`,access:`account`},{id:`oap-h2-plan`,groupId:`reporting`,title:`2026 下半年 AI 开放平台目标计划与里程碑`,url:`https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf`,pinned:!1,position:2,createdAt:`2026-07-26T09:00:00.000Z`,source:`研究库`,access:`org`},{id:`ai-productization-roadshow-2026-07-30`,groupId:`reporting`,title:`AI 产品化实践路演｜CEO / CTO`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/`,pinned:!0,position:0,createdAt:`2026-07-30T00:00:00.000Z`,source:`CEO / CTO 路演材料`,access:`production`},{id:`advisor-report-skill-ai-practice`,groupId:`reporting`,title:`AI 工具实践案例｜顾问报告 Skill`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/`,pinned:!0,position:0,createdAt:`2026-07-29T15:30:00.000Z`,source:`顾问报告 Skill 材料`,access:`production`},{id:`ai-weekly-2026-07-13`,groupId:`reporting`,title:`AI 项目周报｜2026-07-13`,url:`https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/`,pinned:!1,position:3,createdAt:`2026-07-13T02:20:23.000Z`,source:`近月补录`,access:`production`},{id:`pension-business-analysis`,groupId:`reporting`,title:`盈米及且慢养老金业务分析`,url:`https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/`,pinned:!1,position:4,createdAt:`2026-07-13T08:47:33.000Z`,source:`近月补录`,access:`production`},{id:`advisor-2-business-onboarding`,groupId:`reporting`,title:`盈米投顾 2.0｜新负责人业务入职报告`,url:`https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/`,pinned:!1,position:5,createdAt:`2026-07-13T09:12:10.000Z`,source:`近月补录`,access:`production`},{id:`schwab-ria-benchmark`,groupId:`reporting`,title:`嘉信 2026 RIA 基准调研｜对盈米与且慢的启示`,url:`https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/`,pinned:!1,position:6,createdAt:`2026-07-22T02:40:53.000Z`,source:`近月补录`,access:`production`},{id:`skill-audit-2026-07-16`,groupId:`ai-workbench`,title:`25 项 Skills 可用性与一致性审查`,url:`https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/`,pinned:!1,position:0,createdAt:`2026-07-16T03:30:04.000Z`,source:`近月补录`,access:`production`},{id:`html-editor-guide`,groupId:`ai-workbench`,title:`Clair's Studio｜HTML 编辑器使用与安全说明`,url:`https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/`,pinned:!0,position:1,createdAt:`2026-07-29T16:00:00.000Z`,source:`产品能力`,access:`production`},{id:`yingmi-ai-capability-system`,groupId:`ai-platform`,title:`盈米 AI 能力体系专业报告｜2026.07`,url:`https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/`,pinned:!1,position:8,createdAt:`2026-07-13T09:43:42.000Z`,source:`近月补录`,access:`production`}]},ut={"ai-xiaogu-product-experience-2026-07-30":`product-planning`,"workbench-quality-audit-2026-07-30":`governance-review`,"yingmi-ai-materials-compendium-2026-07-30":`reporting`,"qieman-ai-product-practice-2026-07-30":`product-planning`,"seed-mcp-benchmark":`competitive-research`,"seed-fund-report":`investment-research`,"storage-big-three-fund-screening":`investment-research`,"seed-agreement":`governance-review`,"seed-xiaogu":`product-planning`,"seed-strategy":`investment-research`,"seed-ecosystem":`product-demo`,"qieman-library-index":`governance-review`,"qieman-advisor-inventory":`product-planning`,"qieman-advisor-direction-research":`product-planning`,"qieman-advisor-v09":`product-planning`,"qieman-network-research":`competitive-research`,"qieman-advisor-final":`product-planning`,"qieman-advisor-demo":`product-demo`,"qieman-advisor-plan":`product-planning`,"qieman-home-entry-analysis":`data-analysis`,"qieman-advisor-click-analysis":`data-analysis`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`data-analysis`,"qieman-app-usage":`data-analysis`,"qieman-app-roadmap":`product-planning`,"qieman-ai-native":`product-planning`,"oap-progress-roadmap":`reporting`,"oap-metrics-trend":`data-analysis`,"oap-reporting-framework":`reporting`,"oap-h2-okr-iteration-review":`reporting`,"oap-traffic-analysis":`data-analysis`,"eastmoney-platform":`competitive-research`,"qieman-strategy-explorer":`investment-research`,"financial-planning-review":`requirement-review`,"investment-behavior-report":`data-analysis`,"product-review-workbench":`product-demo`,"community-ai-review":`requirement-review`,"jinzhenzi-review":`governance-review`,"jinzhenzi-history":`competitive-research`,"xiaogu-user-needs":`product-planning`,"qieman-ai-advisor-ecosystem":`product-demo`,"oap-h2-plan":`reporting`,"ai-productization-roadshow-2026-07-30":`reporting`,"advisor-report-skill-ai-practice":`reporting`,"ai-weekly-2026-07-13":`reporting`,"pension-business-analysis":`reporting`,"advisor-2-business-onboarding":`reporting`,"schwab-ria-benchmark":`competitive-research`,"skill-audit-2026-07-16":`governance-review`,"html-editor-guide":`product-demo`,"yingmi-ai-capability-system":`reporting`},dt={"ai-service-blueprint-serif-2026-07-30":`reporting`,"yingmi-ai-materials-compendium-2026-07-30":`ai-platform`,"qieman-ai-product-practice-2026-07-30":`ai-platform`,"qieman-home-entry-analysis":`product-planning`,"qieman-app-map":`product-planning`,"qieman-app-deep-analysis":`product-planning`,"qieman-app-usage":`product-planning`,"qieman-app-roadmap":`product-planning`,"financial-planning-review":`xiaogu`,"investment-behavior-report":`xiaogu`,"product-review-workbench":`ai-workbench`,"community-ai-review":`ai-workbench`,"qieman-ai-advisor-ecosystem":`ai-platform`,"oap-h2-plan":`ai-platform`,"oap-h2-okr-iteration-review":`ai-platform`};function ft(e){let t=`${e.title||``} ${e.source||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/需求评审|评审工作台/.test(t)?`requirement-review`:/竞品|对比|调研|研究/.test(t)?`competitive-research`:/周报|汇报|进展|规划|里程碑|业务分析/.test(t)?`reporting`:/数据|趋势|点击|转化|画像|使用/.test(t)?`data-analysis`:/基金|策略|投研|资产配置/.test(t)?`investment-research`:/审查|治理|知识/.test(t)?`governance-review`:/Demo|Studio|工作台|原型/i.test(t)?`product-demo`:`product-planning`}function C(e,t=ft(e)){let n=`${e.id||``} ${e.groupId||``} ${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`,r=[],i=e=>{r.includes(e)||r.push(e)};return e.manualSaved&&i(`手动保存`),e.isProduction&&i(`生产`),e.isPersonal&&i(`个人`),e.isHtml&&i(`HTML`),/ontology\.yingmi-inc\.com|本体/.test(n)&&i(`本体`),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(n)&&i(`飞书`),(t===`competitive-research`||/调研|研究|盘点/.test(n))&&i(`调研`),t===`product-planning`&&i(`产品规划`),(/xiaogu|小顾|财务规划|投资行为/.test(n)||e.groupId===`xiaogu`)&&i(`AI 小顾`),(/studio|workbench|工作台|skill-audit/i.test(n)||e.groupId===`ai-workbench`)&&i(`AI 工作台`),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(n)||e.groupId===`ai-platform`)&&i(`AI 开放平台`),/且慢|qieman/.test(n)&&i(`且慢`),/投顾|advisor|财务规划/.test(n)&&i(`投顾服务`),/OAP|oap-/.test(n)&&i(`OAP`),/MCP|mcp-/.test(n)&&i(`MCP`),/Skills|skill-/.test(n)&&i(`Skills`),(t===`investment-research`||e.groupId===`research`)&&i(`投研`),t===`data-analysis`&&i(`数据分析`),t===`requirement-review`&&i(`需求评审`),t===`reporting`&&i(`经营汇报`),(t===`governance-review`||e.groupId===`knowledge`)&&i(`知识治理`),r.slice(0,5)}function pt(e){let t=`${e.title||``} ${e.url||``} ${e.savedContent||``} ${e.detectedDescription||``}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(t)?`xiaogu`:/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(t)?`ai-platform`:/Studio|工作台|生产力|Copilot|编辑器/i.test(t)?`ai-workbench`:/基金|投研|策略|资产配置|股票|债券/.test(t)?`research`:/汇报|周报|月报|经营|进展|里程碑/.test(t)?`reporting`:/知识|SOUL|飞书|治理|本体|文档库/.test(t)?`knowledge`:/且慢|产品|需求|方案|原型|体验|PRD/i.test(t)?`product-planning`:{"requirement-review":`product-planning`,"competitive-research":`product-planning`,reporting:`reporting`,"data-analysis":`reporting`,"investment-research":`research`,"governance-review":`knowledge`,"product-demo":`ai-workbench`,"product-planning":`product-planning`}[e.workType]||`product-planning`}S.reports=S.reports.map(e=>{let t=dt[e.id]||e.groupId,n=ut[e.id]||ft(e),r={...e,groupId:t,workType:n};return{...r,tags:C(r,n)}});var w=Ot(),mt=Tt(),ht=Et(),T=``,E=``,D=!1,O=[`topic`,`type`,`tag`,`time`].includes(localStorage.getItem(it))?localStorage.getItem(it):`topic`,k=[`created`,`modified`].includes(localStorage.getItem(at))?localStorage.getItem(at):`created`,A=``,j=``,M=null,N=null,P=null,gt=0,F=0,I=0,L=0,_t=``,vt=0,yt=null,R=null,z={},bt=null;function xt(e){return JSON.parse(JSON.stringify(e))}function St(e){try{let t=new URL(e.url).pathname.split(`/`).filter(Boolean),n=t.indexOf(`reports`);return n>=0&&t[n+1]||e.id}catch{return e.id}}function Ct(e){return{...e,searchContent:z[e.id]||z[St(e)]||``}}function wt(){return bt||(bt=fetch(`./search-index.json`,{cache:`no-store`}).then(e=>e.ok?e.json():{}).then(e=>{if(z=e&&typeof e==`object`?e:{},T&&!E&&!D){let e=document.getElementById(`search-input`)?.selectionStart??T.length;Q(()=>document.querySelector(`.results-toolbar, .archive-search`));let t=document.getElementById(`search-input`);t?.focus({preventScroll:!0}),t?.setSelectionRange(e,e)}return z}).catch(()=>z={}),bt)}function Tt(){try{let e=JSON.parse(localStorage.getItem(ot));if(e&&typeof e==`object`)return Object.fromEntries(Object.entries(e).map(([e,t])=>[e,Array.isArray(t)?t.filter(e=>typeof e==`string`):[]]))}catch{}return{}}function Et(){try{let e=JSON.parse(localStorage.getItem(st));if(e&&typeof e==`object`)return e}catch{}return{}}function Dt(){localStorage.setItem(st,JSON.stringify(ht))}function B(e=``){try{let t=new URL(e);t.hash=``,t.search=``;let n=decodeURI(t.pathname).replace(/\/index\.html$/,`/`).replace(/\/+$/,`/`);return`${t.origin}${n}`}catch{return String(e).trim().replace(/\/+$/,`/`)}}function Ot(){try{let e=JSON.parse(localStorage.getItem(rt));if(Array.isArray(e?.groups)&&Array.isArray(e?.reports))return kt(e)}catch{}return xt(S)}function kt(e){let t=xt(S),n=new Set(t.groups.map(e=>e.id)),r=new Set([`inbox`,`today`,`product`,`research`]),i=new Map(e.groups.map(e=>[e.id,e])),a=t.groups.map(t=>{let n=i.get(t.id);return!n||e.version<b?t:{...t,name:n.name||t.name,description:n.description||t.description,position:Number.isFinite(n.position)?n.position:t.position}});e.groups.filter(e=>!n.has(e.id)&&!r.has(e.id)).forEach((e,t)=>{a.push({...e,description:e.description||`自定义工作分组`,position:Number.isFinite(e.position)?e.position:S.groups.length+t})});let o=a.filter((e,t,n)=>n.findIndex(t=>t.id===e.id)===t);o.sort((e,t)=>(e.position||0)-(t.position||0));let s={"seed-mcp-benchmark":`ai-platform`,"seed-fund-report":`research`,"seed-agreement":`ai-platform`,"seed-xiaogu":`xiaogu`,"seed-strategy":`research`,"seed-ecosystem":`ai-platform`,"storage-big-three-fund-screening":`research`},c={inbox:`product-planning`,today:`product-planning`,product:`xiaogu`,research:`research`},l=e.reports.map(e=>({...e,groupId:dt[e.id]||s[e.id]||(e.groupId===`inbox`?pt(e):c[e.groupId])||e.groupId||pt(e),workType:e.workType||ut[e.id]||ft(e),tags:Array.isArray(e.tags)&&e.tags.length?e.tags:C(e,e.workType||ut[e.id])})),u=new Map(l.map(e=>[e.id,e])),d=new Map(l.map(e=>[B(e.url),e])),f=new Set,p=new Set,m=t.reports.map(t=>{let n=B(t.url);f.add(n),p.add(t.id);let r=u.get(t.id)||d.get(n);return r?{...t,title:e.version>=b&&r.title||t.title,groupId:e.version>=b&&o.some(e=>e.id===r.groupId)?r.groupId:t.groupId,workType:e.version>=b&&r.workType?r.workType:t.workType,tags:e.version>=b&&Array.isArray(r.tags)&&r.tags.length?r.tags:t.tags,pinned:!!r.pinned,modifiedAt:r.modifiedAt||t.modifiedAt||t.createdAt,position:Number.isFinite(r.position)?r.position:t.position,archived:!!r.archived,archivedAt:r.archivedAt||``}:t});l.forEach(e=>{let t=B(e.url);p.has(e.id)||t&&f.has(t)||(p.add(e.id),t&&f.add(t),m.push(e))});let h={version:b,groups:o,reports:m};return localStorage.setItem(rt,JSON.stringify(h)),h}function V(){w.version=b,w.groups.forEach((e,t)=>{e.position=t}),localStorage.setItem(rt,JSON.stringify(w))}function At(e=``){return(String(e).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(on)||``}function jt(e,t,n){let r=Lt(e,t).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,` `).trim();if(r)return r.slice(0,100);let i=String(e).split(/\n/).map(e=>e.trim().replace(/^#+\s*/,``)).find(e=>e&&!/^https?:\/\//i.test(e));return i?i.replace(/[。；;！!？?]+$/,``).slice(0,100):t[0]?.name?t[0].name.replace(/\.[^.]+$/,``).slice(0,100):n?an(n):`未命名成果`}function Mt(e=``){return String(e).trim().replace(/\s+/g,` `).toLocaleLowerCase()}function Nt(e=[]){return e.map(e=>`${String(e.name||``).trim().toLocaleLowerCase()}:${e.size||0}:${e.type||``}`).sort().join(`|`)}function Pt({material:e,files:t,url:n,excludeId:r=``}){let i=n?B(n):``,a=Mt(e),o=Nt(t);return w.reports.find(e=>e.id===r?!1:i&&B(e.url)===i||a&&Mt(e.savedContent)===a?!0:!a&&!!o&&Nt(e.savedFiles)===o)||null}function Ft(e=``){try{let t=new URL(e),n=t.hostname.toLowerCase(),r=t.pathname.split(`/`).filter(Boolean)[0]?.toLowerCase();return n===`clairku.github.io`||(n===`github.com`||n===`raw.githubusercontent.com`)&&r===`clairku`}catch{return!1}}function It(e=``){try{return/\.html?$/i.test(new URL(e).pathname)}catch{return!1}}function Lt(e=``,t=[]){if(/<!doctype\s+html|<html[\s>]/i.test(e))return e.trim();let n=t.find(e=>/\.html?$/i.test(e.name));return n?.content||n?.excerpt||``}function Rt(e=``){try{let t=new URL(e).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(t))return{access:`org`,provider:`飞书组织帐号`};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(t))return{access:`account`,provider:`腾讯文档帐号`};if(/(^|\.)yingmi-inc\.com$/.test(t))return{access:`org`,provider:`盈米组织帐号`};if(t===`github.com`&&/^\/login(?:\/|$)/.test(new URL(e).pathname))return{access:`account`,provider:`GitHub 帐号`}}catch{return null}return null}async function zt(e){if(!on(e))return{title:``,description:``,reachable:!1,checked:!0};let t=new URL(e);if(t.origin!==window.location.origin)return{title:``,description:``,reachable:!1,checked:!1};try{let e=await fetch(t.href,{headers:{Accept:`text/html`},signal:AbortSignal.timeout(1e4)});if(!e.ok)return{title:``,description:``,reachable:!1,checked:!0};let n=await e.text(),r=new DOMParser().parseFromString(n,`text/html`);return{title:r.title.trim().slice(0,180),description:r.querySelector(`meta[name="description"]`)?.getAttribute(`content`)?.trim().slice(0,500)||``,reachable:!0,checked:!0}}catch{return{title:``,description:``,reachable:!1,checked:!1}}}async function Bt({material:e=``,files:t=[],url:n=``},r=()=>{}){let i=Lt(e,t),a=t.some(e=>/\.html?$/i.test(e.name));if(!n)return i?{allowed:!0,access:`local`,metadata:{title:``,description:``,reachable:!0,checked:!0},isHtml:!0,savedHtml:i,loginProvider:``}:{allowed:!1,reason:a?`HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML`:`只能保存可正常访问的网址或 HTML 内容`};let o=Rt(n);r(o?`正在识别权限页面与登录入口…`:`正在检查页面是否可正常访问…`);let s=o?{title:``,description:``,reachable:!0,checked:!0}:await zt(n);return!o&&s.checked&&!s.reachable?{allowed:!1,reason:`页面无法正常访问，且不是可读取的 HTML，未保存`}:{allowed:!0,access:o?.access||`production`,metadata:s,isHtml:It(n),savedHtml:``,loginProvider:o?.provider||``}}async function Vt({material:e,files:t},n=()=>{}){let r=At(e);n(`正在检查成果库是否已有相同内容…`);let i=Pt({material:e,files:t,url:r});if(i)return{...i,duplicate:!0,groupName:w.groups.find(e=>e.id===i.groupId)?.name||`未归类`,workTypeName:Jt(i.workType)};let a=await Bt({material:e,files:t,url:r},n);if(!a.allowed)return{rejected:!0,duplicate:!1,reason:a.reason};let o=jt(e,t,r),s=a.metadata;n(`正在识别标题、分组、类型与标签…`);let c=new Date().toISOString(),l={id:tn(`report`),groupId:`product-planning`,title:s.title||o,url:r,pinned:!1,position:0,createdAt:c,modifiedAt:c,source:r?`快捷保存`:`本地保存`,access:a.access,archived:!1,archivedAt:``,savedContent:e,savedFiles:t,detectedDescription:s.description,manualSaved:!0,isProduction:a.access===`production`,isPersonal:Ft(r),isHtml:a.isHtml,savedHtml:a.savedHtml,loginProvider:a.loginProvider};l.workType=ft(l),l.groupId=pt(l),l.tags=C(l,l.workType),n(`正在保存到成果库…`),l.position=w.reports.filter(e=>!e.archived&&e.groupId===l.groupId).length,w.reports.push(l);try{V()}catch{return w.reports.pop(),{rejected:!0,duplicate:!1,reason:`HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试`}}return D=!1,O!==`time`&&(O=`topic`),T=``,localStorage.setItem(it,O),{...l,duplicate:!1,groupName:w.groups.find(e=>e.id===l.groupId)?.name||`未归类`,workTypeName:Jt(l.workType)}}function Ht(e,t){if(t===`topic`)return e;let n=mt[t]||[];if(!n.length)return e;let r=new Map(n.map((e,t)=>[e,t]));return[...e].sort((e,t)=>(r.has(e.id)?r.get(e.id):2**53-1)-(r.has(t.id)?r.get(t.id):2**53-1))}function Ut(e,t,n=O){if(!e||![`top`,`up`,`down`,`bottom`].includes(t)||n===`time`||n===`featured`)return!1;let r=n===`topic`?w.groups.map(e=>e.id):Xt(w.reports.filter(e=>!e.archived)).filter(e=>e.kind===n).map(e=>e.id),i=r.indexOf(e);if(i<0)return!1;let a=t===`top`?0:t===`up`?i-1:t===`down`?i+1:r.length-1;if(a<0||a>=r.length||a===i)return!1;let[o]=r.splice(i,1);if(r.splice(a,0,o),n===`topic`){let e=new Map(r.map((e,t)=>[e,t]));return w.groups.sort((t,n)=>e.get(t.id)-e.get(n.id)),w.groups.forEach((e,t)=>{e.position=t}),V(),!0}return mt[n]=r,localStorage.setItem(ot,JSON.stringify(mt)),!0}function H(e){e.modifiedAt=new Date().toISOString()}function Wt(e,t){return`${e}:${t}`}function Gt(e,t,n,r){let i=typeof r==`function`?[...e].sort(r):[...e],a=ht[Wt(t,n)]||[];if(!a.length)return i;let o=new Map(a.map((e,t)=>[e,t]));return i.sort((e,t)=>(o.has(e.id)?o.get(e.id):2**53-1)-(o.has(t.id)?o.get(t.id):2**53-1))}function Kt(e,t,n,r=``,i=!1){if(![`type`,`tag`,`featured`].includes(e)||!t)return;let a=Gt(e===`featured`?w.reports.filter(e=>!e.archived&&e.pinned):e===`type`?w.reports.filter(e=>!e.archived&&e.workType===t):w.reports.filter(e=>!e.archived&&(e.tags||[]).includes(t)),e,t,(e,t)=>Yt(t)-Yt(e)).map(e=>e.id).filter(e=>e!==n),o=r?a.indexOf(r):a.length;o<0&&(o=a.length),r&&i&&(o+=1),a.splice(o,0,n),ht[Wt(e,t)]=a,Dt()}function qt(e,t,n=``,r=!1){let i=w.reports.find(t=>t.id===e);if(!i||i.archived||!w.groups.find(e=>e.id===t))return!1;let a=w.reports.filter(n=>!n.archived&&n.groupId===t&&n.id!==e).sort((e,t)=>(e.position||0)-(t.position||0)),o=n?a.findIndex(e=>e.id===n):a.length;return o>=0&&n&&r&&(o+=1),i.groupId=t,H(i),a.splice(o<0?a.length:o,0,i),a.forEach((e,t)=>{e.position=t}),V(),!0}function Jt(e){return ct.find(t=>t.id===e)?.name||`产品规划`}function Yt(e){let t=new Date(e.createdAt||0).getTime();return Number.isFinite(t)?t:0}function U(e){let t=new Date(e.modifiedAt||e.createdAt||0).getTime();return Number.isFinite(t)?t:0}function Xt(e,t=``){let n=e=>!t||y(e).includes(t);if(O===`time`){let t=[...e].sort((e,t)=>k===`modified`?U(t)-U(e):Yt(t)-Yt(e));return[{id:k,name:k===`modified`?`Modified`:`Created`,kind:`time`,accent:`slate`,reports:t}]}if(O===`type`)return Ht(ct.map(t=>({id:t.id,name:t.name,kind:`type`,accent:`blue`,reports:Gt(e.filter(e=>e.workType===t.id),`type`,t.id,(e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>!t||e.reports.length||n(e.name)),`type`);if(O===`tag`){let r=new Set(lt);return w.reports.forEach(e=>{(e.tags||[]).forEach(e=>r.add(e))}),Ht([...r].sort((e,t)=>{let n=lt.indexOf(e),r=lt.indexOf(t);return n>=0||r>=0?(n<0?2**53-1:n)-(r<0?2**53-1:r):e.localeCompare(t,`zh-CN`)}).map(t=>({id:t,name:t,kind:`tag`,accent:`violet`,reports:Gt(e.filter(e=>(e.tags||[]).includes(t)),`tag`,t,(e,t)=>Number(!!t.pinned)-Number(!!e.pinned)||new Date(t.createdAt)-new Date(e.createdAt))})).filter(e=>e.reports.length&&(!t||n(e.name)||e.reports.length)),`tag`)}return w.groups.map(t=>({...t,kind:`topic`,reports:e.filter(e=>e.groupId===t.id).sort((e,t)=>(e.position||0)-(t.position||0))})).filter(e=>!t||e.reports.length||n(`${e.name} ${e.description||``}`))}function Zt(e,t,n,r=``,i=!1){let a=w.reports.find(t=>t.id===e);return!a||a.archived?!1:t===`topic`?qt(e,n,r,i):t===`type`?ct.some(e=>e.id===n)?(a.workType=n,H(a),V(),Kt(`type`,n,e,r,i),!0):!1:t===`tag`?(a.tags=Array.isArray(a.tags)?a.tags:[],a.tags.includes(n)||a.tags.push(n),H(a),V(),Kt(`tag`,n,e,r,i),!0):t===`featured`?(a.pinned=!0,H(a),V(),Kt(`featured`,`featured`,e,r,i),!0):!1}function Qt(){return O===`type`?`工作类型`:O===`tag`?`标签`:O===`time`?`新增时间`:`主题`}function $t(e,t){return e.map(e=>({report:e,score:nt(Ct(e),t,{group:w.groups.find(t=>t.id===e.groupId),workTypeName:Jt(e.workType)})})).filter(e=>e.score>0).sort((e,t)=>t.score-e.score||U(t.report)-U(e.report)||String(e.report.title).localeCompare(t.report.title,`zh-CN`)).map(e=>e.report)}function en(e,t){let n=z[e.id]||z[St(e)]||``,r=[e.source,e.description,e.savedContent,e.savedHtml,...(e.savedFiles||[]).flatMap(e=>[e?.name,e?.excerpt,e?.content]),n].filter(Boolean).join(` · `).replace(/<style[\s\S]*?<\/style>/gi,` `).replace(/<script[\s\S]*?<\/script>/gi,` `).replace(/<[^>]+>/g,` `).replace(/\s+/g,` `).trim();if(!r)return``;let i=y(r),a=$e(t).find(e=>i.includes(e));if(!a)return r.slice(0,96);let o=i.indexOf(a),s=Math.max(0,o-34),c=Math.min(r.length,o+a.length+62);return`${s?`…`:``}${r.slice(s,c).trim()}${c<r.length?`…`:``}`}function tn(e){return`${e}-${crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`}`}function W(e=``){return String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}var nn={back:`
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
    </svg>`};function rn(e){return nn[e]||``}function an(e){try{return new URL(e).hostname.replace(/^www\./,``)}catch{return e}}function on(e){try{return[`http:`,`https:`].includes(new URL(e).protocol)}catch{return!1}}function G(e=``){return[...new Set(String(e).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function sn(){let e=new Set(lt);return w.reports.forEach(t=>{(t.tags||[]).forEach(t=>e.add(t))}),[...e]}function K(e){document.querySelector(`.toast`)?.remove();let t=document.createElement(`div`);t.className=`toast`,t.setAttribute(`role`,`status`),t.textContent=e,document.body.append(t),clearTimeout(gt),gt=window.setTimeout(()=>t.remove(),2600)}function cn(e=`auto`){q(),I=requestAnimationFrame(()=>{I=0,window.scrollTo({top:0,left:0,behavior:e})})}function q(){F&&cancelAnimationFrame(F),I&&cancelAnimationFrame(I),L&&cancelAnimationFrame(L),F=0,I=0,L=0}function ln(){let e=document.querySelector(`.topbar`)?.getBoundingClientRect().bottom||0,t=document.querySelector(`.topic-nav`),n=t?getComputedStyle(t):null,r=t?.getBoundingClientRect();if(!window.matchMedia(`(max-width: 840px)`).matches){let t=n?.position===`sticky`&&Number.parseFloat(n.top)||0;return Math.max(e+22,t)}let i=n?.position===`sticky`&&r?.bottom>0?r.bottom:0;return Math.max(e,i)+10}function un(e,t=`smooth`){if(!e)return;q();let n=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),r=Math.max(0,Math.min(n,window.scrollY+e.getBoundingClientRect().top-ln())),i=window.scrollY,a=r-i;if(Math.abs(a)<2)return;if(t!==`smooth`||matchMedia(`(prefers-reduced-motion: reduce)`).matches){window.scrollTo({top:r,left:0,behavior:`auto`});return}let o=Math.min(360,Math.max(180,Math.abs(a)*.22)),s=performance.now(),c=t=>{if(!e.isConnected){F=0;return}let n=Math.min(1,(t-s)/o),r=1-(1-n)**3,l=Math.max(0,Math.min(Math.max(0,document.documentElement.scrollHeight-window.innerHeight),window.scrollY+e.getBoundingClientRect().top-ln()));a=l-i,window.scrollTo(0,i+a*r),n<1?F=requestAnimationFrame(c):(F=0,window.scrollTo(0,l))};F=requestAnimationFrame(c)}function J(e,t){return document.querySelector(`.group-column[data-bucket-kind="${CSS.escape(e)}"][data-bucket-id="${CSS.escape(t)}"]`)}function Y(e){return document.querySelector(`.board .report-card[data-report-id="${CSS.escape(e)}"]`)}function dn(e){if(!e)return null;let t=e.closest?.(`.report-card[data-report-id]`);if(t){let e=t.closest(`.group-column[data-bucket-kind][data-bucket-id]`);return{type:`report`,id:t.dataset.reportId,bucketKind:e?.dataset.bucketKind||``,bucketId:e?.dataset.bucketId||``}}let n=e.closest?.(`.group-column[data-bucket-kind][data-bucket-id]`);if(n)return{type:`bucket`,kind:n.dataset.bucketKind,id:n.dataset.bucketId};let r=e.closest?.(`.results-toolbar, .archive-search, .prompt-composer, .groups-section, .library-layout`);return r?{type:`selector`,selector:r.classList.contains(`results-toolbar`)?`.results-toolbar`:r.classList.contains(`archive-search`)?`.archive-search`:r.classList.contains(`prompt-composer`)?`.prompt-composer`:r.classList.contains(`groups-section`)?`.groups-section`:`.library-layout`}:null}function fn(e){return e?e.type===`report`?(e.bucketKind&&e.bucketId?J(e.bucketKind,e.bucketId):null)?.querySelector(`.report-card[data-report-id="${CSS.escape(e.id)}"]`)||Y(e.id):e.type===`bucket`?J(e.kind,e.id):e.type===`selector`?document.querySelector(e.selector):null:null}function pn(){let e=ln(),t=t=>[...document.querySelectorAll(t)].filter(t=>{let n=t.getBoundingClientRect();return n.bottom>e&&n.top<window.innerHeight}).sort((t,n)=>Math.abs(t.getBoundingClientRect().top-e)-Math.abs(n.getBoundingClientRect().top-e))[0];return t(`.board .report-card[data-report-id]`)||t(`.group-column[data-bucket-id]`)||t(`.results-toolbar, .archive-search, .prompt-composer`)||document.querySelector(`.results-toolbar, .archive-search, .groups-section, .library-layout`)}function X(e=null){q();let t=e||pn();return{scrollY:window.scrollY,identity:dn(t),viewportTop:t?.getBoundingClientRect().top??null}}function mn(e){if(!e)return;q();let t=()=>{let t=fn(e.identity),n=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),r=t&&Number.isFinite(e.viewportTop)?window.scrollY+t.getBoundingClientRect().top-e.viewportTop:e.scrollY;window.scrollTo({top:Math.max(0,Math.min(n,r)),left:0,behavior:`auto`})};t(),L=requestAnimationFrame(()=>{L=requestAnimationFrame(()=>{L=0,t()})})}function Z(e){$(),mn(e)}function hn(e,t=null){let n=t||Y(e),r=n?.nextElementSibling?.matches?.(`.report-card[data-report-id]`)?n.nextElementSibling:n?.previousElementSibling?.matches?.(`.report-card[data-report-id]`)?n.previousElementSibling:null;if(!r){let e=n?.closest(`.group-column[data-bucket-id]`),t=e?.nextElementSibling?.matches?.(`.group-column[data-bucket-id]`)?e.nextElementSibling:e?.previousElementSibling?.matches?.(`.group-column[data-bucket-id]`)?e.previousElementSibling:null;r=t?.querySelector(`.report-card[data-report-id]`)||t||n}return X(r)}function gn(e,t){let n=J(e,t);return X(n?.nextElementSibling?.matches?.(`.group-column[data-bucket-id]`)?n.nextElementSibling:n?.previousElementSibling?.matches?.(`.group-column[data-bucket-id]`)?n.previousElementSibling:n)}function _n(e,t=`smooth`){q(),I=requestAnimationFrame(()=>{I=requestAnimationFrame(()=>{I=0,un(e(),t)})})}function Q(e=null){Z(X(typeof e==`function`?e():e))}[`wheel`,`touchstart`,`pointerdown`].forEach(e=>{window.addEventListener(e,q,{passive:!0})});function vn(e){return e.savedHtml||Lt(e.savedContent,e.savedFiles)}function yn(e){return`${String(e.title||`report`).replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,` `).trim().slice(0,80)||`report`}.html`}function bn(e){let t=vn(e);return t?URL.createObjectURL(new Blob([t],{type:`text/html;charset=utf-8`})):``}function xn(e){let t=bn(e);if(!t)return!1;let n=document.createElement(`a`);return n.href=t,n.download=yn(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(t),1e3),!0}function Sn(e){let t=e.url||bn(e);return t?(window.open(t,`_blank`,`noopener,noreferrer`),e.url||window.setTimeout(()=>URL.revokeObjectURL(t),6e4),!0):!1}function Cn(e,t=!1,n={}){let r=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),i=[`org`,`account`].includes(e.access),a=e.access===`org`?`需组织登录`:e.access===`account`?`需账号登录`:`生产可访问`,o=vn(e),s=!!e.pinned,c=w.groups.find(t=>t.id===e.groupId)?.name||`未归类`,l=[...new Set([c,Jt(e.workType),...e.tags||[]])],u=!i&&S.reports.some(t=>t.id===e.id),d=e.preview||`${e.id}.png`,f=o&&e.isHtml?`<iframe class="local-html-preview-frame" title="${W(e.title)}视觉预览"
        srcdoc="${W(o)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:u?`<img src="./previews/${W(d)}" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${i?`preview-restricted`:``}">
        <span>${i?`ACCESS`:W(e.title.slice(0,2))}</span>
        <strong>${i?a:r?`本地内容`:`预览待补充`}</strong>
      </div>`;return`
    <article class="report-card ${i?`restricted-card`:``} ${t?`archived-card`:``} ${s?`is-featured`:``} ${j===e.id?`is-move-selected`:``}"
      data-report-id="${W(e.id)}" ${t||O===`time`?``:`data-report-draggable="true"`}>
      <button class="card-main" type="button" data-action="open" data-id="${W(e.id)}" aria-label="打开${W(e.title)}">
        <span class="report-preview">
          ${f}
        </span>
        <span class="report-copy">
          <strong>${W(e.title)}</strong>
          <span class="report-tags">${l.map((e,t)=>`<span class="${t<2?`report-context-tag`:``}">${W(e)}</span>`).join(``)}</span>
          ${n.searchExcerpt?`<span class="report-search-excerpt">${W(n.searchExcerpt)}</span>`:``}
          ${i?`<span class="report-access-note">${W(a)}</span>`:``}
        </span>
      </button>
      <div class="card-actions">
        ${t?`
            <button type="button" data-action="restore" data-id="${W(e.id)}">Restore</button>
            <button type="button" data-action="delete" data-id="${W(e.id)}">Delete permanently</button>`:`
            <button type="button" class="studio-icon-button feature-action" data-action="toggle-pin" data-id="${W(e.id)}"
              title="${s?`取消精选`:`设为精选`}" aria-label="${s?`取消精选`:`设为精选`}">${x.star}</button>
            ${e.url?`<button type="button" class="studio-icon-button card-icon-action" data-action="edit" data-id="${W(e.id)}" title="编辑成果" aria-label="编辑成果">
              ${x.edit}
            </button>`:``}
            <button type="button" class="studio-icon-button card-icon-action" data-action="archive" data-id="${W(e.id)}" title="归档成果" aria-label="归档成果">
              ${x.archive}
            </button>`}
      </div>
    </article>`}function wn(){if(!P)return``;if(P.type===`group`){let e=P.mode===`edit`?w.groups.find(e=>e.id===P.groupId):null;return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">WORK TOPIC / GROUP</span>
              <h2>${e?`编辑工作主题`:`新建工作主题`}</h2>
            </div>
            <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${x.close}</button>
          </div>
          <label>主题 / 分组名称
            <input name="name" value="${W(e?.name||``)}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${W(e?.description||``)}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">${e?`Save changes`:`Create topic`}</button>
          </div>
        </form>
      </div>`}let e=P.mode===`edit`?w.reports.find(e=>e.id===P.reportId):null,t=e?.groupId||P.groupId||w.groups[0]?.id||``,n=G((e?.tags||[]).join(`、`));return`
    <div class="dialog-backdrop">
      <form class="dialog" id="report-form">
        <div class="dialog-title-row">
          <div>
            <span class="section-kicker">${e?`EDIT REPORT`:`NEW REPORT`}</span>
            <h2>${e?`编辑服务报告`:`新增服务报告`}</h2>
          </div>
          <button type="button" class="studio-icon-button dialog-close-button" data-action="close-modal" title="关闭" aria-label="关闭">${x.close}</button>
        </div>
        <label>网站地址
          <div class="url-input-row">
            <input name="url" type="url" value="${W(e?.url||``)}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">Detect title</button>
          </div>
          <small class="field-hint">${e?`修改网址后可重新识别`:`保存时会自动识别网页标题`}</small>
        </label>
        <label>报告标题
          <input name="title" value="${W(e?.title||``)}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${w.groups.map(e=>`<option value="${W(e.id)}" ${e.id===t?`selected`:``}>${W(e.name)}</option>`).join(``)}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${ct.map(t=>`<option value="${W(t.id)}" ${t.id===(e?.workType||`product-planning`)?`selected`:``}>${W(t.name)}</option>`).join(``)}
          </select>
        </label>
        <fieldset class="report-tag-field">
          <legend>关键标签</legend>
          <input type="hidden" name="tags" value="${W(n.join(`、`))}" />
          <div class="report-tag-picker" aria-label="选择关键标签">
            ${sn().map(e=>`<button type="button" class="${n.includes(e)?`selected`:``}"
              data-report-tag="${W(e)}" aria-pressed="${n.includes(e)}">${W(e)}</button>`).join(``)}
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
    </div>`}function Tn(e){if(Ke(e.id))return Je(e,W);let t=!e.url&&(!!e.savedContent||!!(e.savedFiles||[]).length),n=[`org`,`account`].includes(e.access),r=e.loginProvider||Rt(e.url)?.provider||(e.access===`org`?`组织帐号`:`站点帐号`),i=e.savedHtml||Lt(e.savedContent,e.savedFiles),a=i?`edit-local-document`:e.url?n?`edit`:`edit-document`:``,o=i?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${W(e.title)}"
          srcdoc="${W(i)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:t?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${W(e.title)}</h1>
          ${e.savedContent?`<div class="saved-material-content">${W(e.savedContent).replaceAll(`
`,`<br />`)}</div>`:``}
          ${(e.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${e.savedFiles.map(e=>`<span><b>${W(e.name)}</b><small>${W(e.sizeLabel||``)}</small></span>`).join(``)}
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
            <a class="primary-button" href="${W(e.url)}" target="_blank" rel="noreferrer">打开${W(r)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">Back</button>
          </div>
          <p class="login-handoff-domain">${W(an(e.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${W(e.title)}" src="${W(e.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${rn(`back`)}</button>
        <div class="reader-title">
          <strong>${W(e.title)}</strong>
          <span>${t?`本地保存`:W(an(e.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${a?`
            <button class="reader-icon-button" type="button" data-action="${a}"
              data-id="${W(e.id)}" aria-label="编辑" title="编辑">
              ${rn(`edit`)}
            </button>`:``}
          ${e.url&&e.access===`production`?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${W(e.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${rn(`copy`)}
            </button>`:``}
          ${!n&&(e.url||i)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${W(e.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${rn(`download`)}
            </button>`:``}
          ${e.url||i?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${W(e.id)}"
              aria-label="${n?`打开${W(r)}登录页`:`在浏览器打开`}"
              title="${n?`打开${W(r)}登录页`:`在浏览器打开`}">
              ${rn(`external`)}
            </button>`:``}
        </div>
      </header>
      ${o}
      ${wn()}
    </main>`}function En(e){return`
    <header class="topbar">
      <button class="brand topbar-home" type="button" data-action="scroll-top"
        aria-label="Back to top" title="Back to top">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </button>
      ${D?`<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← Library</button></div>`:``}
    </header>`}function Dn(){let e=w.reports.filter(e=>e.archived).filter(e=>et(e,T,{group:w.groups.find(t=>t.id===e.groupId),workTypeName:Jt(e.workType)})).sort((e,t)=>new Date(t.archivedAt||0)-new Date(e.archivedAt||0)),t=w.reports.filter(e=>e.archived).length;return`
    <main class="app-shell archive-shell">
      ${En(t)}
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
          <input id="search-input" value="${W(T)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${T?`<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${x.close}</button>`:``}
        </label>
        ${e.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${T?`搜索结果`:`归档内容`}</h2><p>按最近归档时间排列</p></div>
              <span>${e.length} 份</span>
            </div>
            <div class="archive-grid">${e.map(e=>Cn(e,!0)).join(``)}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${T?`没有找到相关归档`:`归档区还是空的`}</h2>
            <p>${T?`换个关键词，或返回查看全部归档内容。`:`在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。`}</p>
            <button class="quiet-button" type="button" data-action="${T?`clear-search`:`show-catalog`}">${T?`Clear search`:`Back to library`}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${wn()}
    </main>`}function On(e,t){if(![`topic`,`type`,`tag`].includes(e.kind))return``;let n=t.filter(t=>t.kind===e.kind),r=n.findIndex(t=>t.id===e.id);if(r<0)return``;let i=r===0,a=r===n.length-1,o=(t,n,r,i)=>`
    <button type="button" class="studio-icon-button group-order-button" data-action="move-group"
      data-id="${W(e.id)}" data-bucket-kind="${W(e.kind)}" data-direction="${t}"
      title="${n}" aria-label="${n}" ${i?`disabled`:``}>${r}</button>`;return[o(`top`,`置顶`,x.top,i),o(`up`,`上移`,x.up,i),o(`down`,`下移`,x.down,a),o(`bottom`,`置底`,x.bottom,a)].join(``)}function kn(){if(D)return Dn();let e=y(T),t=w.reports.filter(e=>!e.archived),n=e?$t(t,e):t,r=Gt(t.filter(e=>e.pinned),`featured`,`featured`,(e,t)=>U(t)-U(e)),i={id:`featured`,name:`精选成果`,kind:`featured`,accent:`violet`,reports:r},a=w.reports.filter(e=>e.archived).length,o=t.filter(e=>e.access===`production`).length,s=t.filter(e=>e.access!==`production`).length,c=Xt(t,``),l=O===`topic`&&r.length?[i,...c]:c,u=O===`time`&&c[0]?.reports||[],d=e?[]:(O===`topic`&&r.length?[i,...c]:c).filter(e=>e.reports.length||j||O===`topic`),p=O===`type`?`工作类型`:O===`tag`?`关键标签`:O===`time`?`新增时间`:`工作主题`;return`
    <main class="app-shell">
      ${En(a)}
      <section class="workspace">
        ${f(W)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${W(T)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${T?`<button type="button" class="studio-icon-button search-clear-button" data-action="clear-search" title="清除搜索" aria-label="清除搜索">${x.close}</button>`:``}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${e?n.length:t.length}</strong><span>${e?`匹配`:`成果`}</span>
              <i></i>
              <strong>${w.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${o}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${j?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${Qt()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">Cancel</button>
            </div>`:``}
          ${e||d.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${p}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${O===`topic`}" class="${O===`topic`?`active`:``}" data-action="set-view" data-id="topic">Topic</button>
                    <button type="button" role="tab" aria-selected="${O===`type`}" class="${O===`type`?`active`:``}" data-action="set-view" data-id="type">Type</button>
                    <button type="button" role="tab" aria-selected="${O===`tag`}" class="${O===`tag`?`active`:``}" data-action="set-view" data-id="tag">Tag</button>
                    <button type="button" role="tab" aria-selected="${O===`time`}" class="${O===`time`?`active`:``}" data-action="set-view" data-id="time">Time</button>
                  </div>
                  <button class="studio-icon-button add-topic-icon" type="button" data-action="add-group"
                    aria-label="Add topic" title="Add topic">${x.plus}</button>
                </div>
                ${O===`time`?`
                  <div class="library-time-order" aria-label="时间排序">
                    <span>${k===`modified`?`Modified`:`Created`}</span>
                    <button type="button" data-action="toggle-time-sort"
                      title="切换为按${k===`modified`?`创建`:`修改`}时间排序"
                      aria-label="切换为按${k===`modified`?`创建`:`修改`}时间倒序">
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v9m0 0L2 10m2 2 2-2M12 13V4m0 0-2 2m2-2 2 2"></path></svg>
                    </button>
                  </div>
                  <div class="library-time-titles" aria-label="按${k===`modified`?`修改`:`创建`}时间排列的成果">
                    ${u.map(e=>`
                      <a href="#" data-nav-report-id="${W(e.id)}"
                        title="${W(e.title)}">${W(e.title)}</a>`).join(``)}
                  </div>`:l.map(e=>`
                  <a href="#" data-nav-bucket-kind="${W(e.kind)}"
                    data-nav-bucket-id="${W(e.id)}">
                    ${W(e.name)}<span>${e.reports.length}</span>
                  </a>`).join(``)}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>Archive</strong>
                  ${a?`<em>${a}</em>`:``}
                </button>
              </nav>
              <div class="board catalog-view-${O}">
              ${e?`
                <section class="search-results-panel" aria-live="polite">
                  <header class="search-results-header">
                    <div><span>SEARCH RESULTS</span><h2>“${W(T.trim())}”</h2></div>
                    <strong>${n.length} 份匹配</strong>
                  </header>
                  ${n.length?`<div class="group-cards search-results-cards">${n.map(t=>Cn(t,!1,{searchExcerpt:en(t,e)})).join(``)}</div>`:`<div class="no-results search-no-results">
                        <strong>没有找到“${W(T.trim())}”</strong>
                        <span>可搜索标题、标签、成果正文、来源、任务类型或主题</span>
                        <button type="button" data-action="clear-search">Clear search</button>
                      </div>`}
                </section>`:d.map(e=>`
                <section class="group-column topic-section bucket-${W(e.kind)} accent-${W(e.accent||`blue`)}"
                  data-bucket-kind="${W(e.kind)}"
                  data-bucket-id="${W(e.id)}"
                  data-group-id="${W(e.id)}">
                  <header class="group-header">
                    <div class="group-heading-area">
                      <div class="group-heading-copy">
                        <div><h2>${W(e.name)}</h2></div>
                        <span class="count">${e.reports.length} 份</span>
                      </div>
                      ${e.kind===`topic`?`<div class="group-primary-actions" aria-label="分组快捷操作">
                        <button type="button" class="studio-icon-button" data-action="add-to-group" data-id="${W(e.id)}" title="新增成果" aria-label="新增成果">${x.plus}</button>
                        <button type="button" class="studio-icon-button" data-action="rename-group" data-id="${W(e.id)}" title="编辑分组" aria-label="编辑分组">${x.edit}</button>
                      </div>`:``}
                    </div>
                    <div class="group-menu" aria-label="分组排序操作">
                      ${j&&e.kind!==`time`?`<button class="move-here-button" type="button" data-action="move-here" data-id="${W(e.id)}" data-bucket-kind="${W(e.kind)}">Move here</button>`:``}
                      ${On(e,c)}
                      ${e.kind===`topic`?`<button type="button" class="studio-icon-button group-delete-button" data-action="delete-group" data-id="${W(e.id)}" title="删除分组" aria-label="删除分组">${x.minus}</button>`:``}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${e.reports.length?e.reports.map(e=>Cn(e)).join(``):e.kind===`topic`?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${W(e.id)}">
                            <strong>Drop reports here</strong>
                            <span>or add the first report</span>
                          </button>`:`<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>`}
                  </div>
                </section>`).join(``)}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到“${W(T.trim())}”</strong>
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
      ${wn()}
    </main>`}function $(){let e=document.getElementById(`app`),t=E&&w.reports.find(e=>e.id===E);e.innerHTML=t?Tn(t):kn(),Mn(),p({render:()=>Q(()=>document.querySelector(`.prompt-composer`)),showToast:K,saveToLibrary:Vt})}async function An(e){let t=e.elements.url,n=e.elements.title,r=e.querySelector(`[data-action="detect-title"]`),i=e.querySelector(`.field-hint`),a=t.value.trim();if(!on(a))return i.textContent=`请输入完整的 http 或 https 网址`,``;r.disabled=!0,r.innerHTML=`<span class="mini-spinner"></span>`,i.textContent=`正在读取网页标题…`;try{let{title:e}=await zt(a);if(!e)throw Error(`read failed`);return n.value=e,i.textContent=`已识别网页标题`,n.value}catch{let e=an(a);return n.value||=e,i.textContent=`网页暂时无法读取，已用域名作为标题，你可以手动修改`,n.value}finally{r.disabled=!1,r.textContent=`Detect title`}}function jn(){let e=document.querySelector(`.board`);if(!e)return;let t=null,n=()=>{document.querySelectorAll(`.report-card, .group-column, .topic-nav a`).forEach(e=>{e.classList.remove(`is-card-drop-target`,`is-card-drop-before`,`is-card-drop-after`,`is-drop-ready`,`is-nav-drop-target`)})},r=e=>e?[e.bucketKind,e.bucketId,e.targetReportId,Number(e.placeAfter),Number(e.nav)].join(`|`):``,i=()=>{let e=t.sourceCard.getBoundingClientRect(),n=t.sourceCard.cloneNode(!0);return n.removeAttribute(`id`),n.className=`report-card report-drag-preview`,n.style.width=`${e.width}px`,n.style.height=`${e.height}px`,n.querySelectorAll(`button, [role='button'], iframe`).forEach(e=>{e.removeAttribute(`data-action`),e.setAttribute(`tabindex`,`-1`)}),document.body.append(n),n},a=()=>{t?.preview&&(t.preview.style.transform=`translate3d(${t.x+14}px, ${t.y+14}px, 0)`)},o=(e,n=null,r=!1)=>{if(!(!e||!t?.placeholder)){if(!n||n.parentElement!==e){e.append(t.placeholder);return}e.insertBefore(t.placeholder,r?n.nextSibling:n)}},s=()=>{let e=document.elementFromPoint(t.x,t.y);if(e?.closest(`.report-card-placeholder`))return t.target;let n=e?.closest(`.topic-nav a[data-nav-bucket-id]`);if(n)return{bucketKind:n.dataset.navBucketKind,bucketId:n.dataset.navBucketId,targetReportId:``,placeAfter:!1,nav:!0,element:n};let r=e?.closest(`.report-card:not(.report-card-placeholder):not(.report-drag-preview)`),i=e?.closest(`.group-column`);if(r&&r!==t.sourceCard){let e=r.closest(`.group-column`);if(!e||e.dataset.bucketKind===`time`)return null;let n=r.getBoundingClientRect(),i=t.y>n.bottom-n.height*.22||t.y>=n.top+n.height*.22&&t.y<=n.bottom-n.height*.22&&t.x>n.left+n.width/2;return{bucketKind:e.dataset.bucketKind||O,bucketId:e.dataset.bucketId||``,targetReportId:r.dataset.reportId||``,placeAfter:i,nav:!1,element:r,container:e.querySelector(`.group-cards`)}}return i&&i.dataset.bucketKind!==`time`?{bucketKind:i.dataset.bucketKind||O,bucketId:i.dataset.bucketId||``,targetReportId:``,placeAfter:!1,nav:!1,element:i,container:i.querySelector(`.group-cards`)}:null},c=e=>{if(!(!t||r(e)===r(t.target))&&(n(),t.target=e,M=e,e)){if(e.nav){e.element.classList.add(`is-nav-drop-target`);return}if(e.targetReportId){e.element.classList.add(`is-card-drop-target`,e.placeAfter?`is-card-drop-after`:`is-card-drop-before`),o(e.container,e.element,e.placeAfter);return}e.element.classList.add(`is-drop-ready`),o(e.container)}},l=()=>{t?.active&&c(s())},u=()=>{let e=Math.min(window.innerHeight*.34,ln()+72),n=window.innerHeight-72;if(t.y<e){let n=Math.min(1,(e-t.y)/84);return-Math.max(1,Math.round(12*n*n))}if(t.y>n){let e=Math.min(1,(t.y-n)/84);return Math.max(1,Math.round(12*e*e))}return 0},d=()=>{if(!t?.active)return;let e=u();if(e){let t=window.scrollY;window.scrollBy(0,e),window.scrollY!==t&&l()}t.autoScrollFrame=requestAnimationFrame(d)},f=()=>{!t||t.active||(clearTimeout(t.holdTimer),t.sourceCard.setPointerCapture?.(t.pointerId),t.active=!0,A=t.reportId,t.preview=i(),t.placeholder=document.createElement(`div`),t.placeholder.className=`report-card report-card-placeholder`,t.placeholder.innerHTML=`<span>放在这里</span>`,t.placeholder.style.minHeight=`${t.sourceCard.getBoundingClientRect().height}px`,t.sourceCard.before(t.placeholder),t.sourceCard.classList.add(`is-dragging`),document.body.classList.add(`report-drag-session`),a(),l(),t.autoScrollFrame=requestAnimationFrame(d))},p=()=>{t&&(clearTimeout(t.holdTimer),t.autoScrollFrame&&cancelAnimationFrame(t.autoScrollFrame),t.preview?.remove(),t.placeholder?.remove(),t.sourceCard.classList.remove(`is-dragging`),document.body.classList.remove(`report-drag-session`),n(),A=``,M=null)},m=()=>{if(!t)return;let e=t,n=e.active?e.target:null,r=e.reportId;e.active&&(_t=r,vt=Date.now()+500),p(),t=null,!(!n?.bucketId||n.bucketKind===`time`)&&Zt(r,n.bucketKind,n.bucketId,n.targetReportId||``,!!n.placeAfter)&&(Q(()=>Y(r)),n.nav?_n(()=>J(n.bucketKind,n.bucketId)):requestAnimationFrame(()=>requestAnimationFrame(()=>{let e=Y(r);e?.classList.add(`is-drop-landed`),window.setTimeout(()=>e?.classList.remove(`is-drop-landed`),700)})),K(n.bucketKind===`featured`?`已加入精选成果`:n.bucketKind===`tag`?`已添加目标标签`:n.bucketKind===`type`?`工作类型已更新`:n.targetReportId?`报告顺序已更新`:`已移入新主题`))};e.addEventListener(`pointerdown`,e=>{if(e.button!==0||e.target.closest(`.card-actions`))return;let n=e.target.closest(`.report-card[data-report-draggable="true"]`);n?.closest(`.group-column`)&&(t={pointerId:e.pointerId,reportId:n.dataset.reportId,sourceCard:n,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:!1,target:null,preview:null,placeholder:null,autoScrollFrame:0,holdTimer:0},t.holdTimer=window.setTimeout(()=>f(),240))}),e.addEventListener(`pointermove`,e=>{!t||e.pointerId!==t.pointerId||(t.x=e.clientX,t.y=e.clientY,!t.active&&Math.hypot(t.x-t.startX,t.y-t.startY)>=8&&f(),t.active&&(e.preventDefault(),a(),l()))}),e.addEventListener(`pointerup`,e=>{!t||e.pointerId!==t.pointerId||m()}),e.addEventListener(`pointercancel`,()=>{p(),t=null})}function Mn(){let e=document.getElementById(`search-input`);e?.addEventListener(`input`,e=>{if(e.isComposing)return;T=e.target.value;let t=e.target.selectionStart,n=e.target.selectionEnd;Q(()=>document.querySelector(`.results-toolbar, .archive-search`));let r=document.getElementById(`search-input`);r?.focus({preventScroll:!0}),r?.setSelectionRange(t,n)}),e?.addEventListener(`keydown`,e=>{e.key!==`Escape`||!T||(e.preventDefault(),T=``,Q(()=>document.querySelector(`.results-toolbar, .archive-search`)),document.getElementById(`search-input`)?.focus({preventScroll:!0}))}),document.querySelectorAll(`[data-action]`).forEach(e=>{e.addEventListener(`click`,async e=>{let t=e.currentTarget.dataset.action,n=e.currentTarget.dataset.id,r=e.currentTarget.closest(`.report-card`);if(t===`scroll-top`)cn(`smooth`);else if(t===`open`){if(n===_t&&Date.now()<vt)return;yt=X(r||Y(n)),E=n,$(),cn()}else if(t===`edit-document`){let e=w.reports.find(e=>e.id===n);if(!e||e.access!==`production`)return;qe(e,{render:$,showToast:K})}else if(t===`edit-local-document`){let e=w.reports.find(e=>e.id===n);if(!e||!vn(e))return;qe(e,{render:$,showToast:K,saveLocal:async t=>{let n=e.savedHtml;e.savedHtml=t,e.isHtml=!0,e.tags=C(e,e.workType),H(e);try{V()}catch{throw e.savedHtml=n,Error(`修改后的 HTML 超过当前浏览器可保存容量，请先下载备份`)}}})}else if(t===`download-report`){let e=w.reports.find(e=>e.id===n);if(!e)return;vn(e)?xn(e)&&K(`HTML 已下载`):await Xe(e,K)}else if(t===`share-report`||t===`copy-production-url`){let e=w.reports.find(e=>e.id===n);e?.url&&await Ze(e,e=>{K(e===`报告链接已复制`?`生产 URL 已复制`:e)})}else if(t===`open-browser`){let e=w.reports.find(e=>e.id===n);if(!e)return;Sn(e)||K(`浏览器未能打开该报告`)}else if(t===`back`)E=``,P=null,Z(yt||{scrollY:0}),yt=null;else if(t===`clear-search`)T=``,Q(()=>document.querySelector(`.results-toolbar, .archive-search`)),document.getElementById(`search-input`)?.focus({preventScroll:!0});else if(t===`set-view`){if(![`topic`,`type`,`tag`,`time`].includes(n))return;O=n,j=``,localStorage.setItem(it,O),Q()}else if(t===`toggle-time-sort`)k=k===`created`?`modified`:`created`,localStorage.setItem(at,k),Q();else if(t===`cancel-move`)j=``,Q();else if(t===`move-here`){let t=e.currentTarget.dataset.bucketKind||O;if(j&&Zt(j,t,n)){let e=j;j=``,Q(()=>Y(e)),K(t===`tag`?`已添加目标标签`:`报告已移入目标${Qt()}`)}}else if(t===`show-archive`)D=!0,T=``,E=``,$(),cn();else if(t===`show-catalog`)D=!1,T=``,E=``,$(),cn();else if(t===`add-report`)R=X(document.querySelector(`.results-toolbar`)),P={type:`report`,mode:`create`,groupId:w.groups[0]?.id},Z(R);else if(t===`add-to-group`)R=X(J(`topic`,n)),P={type:`report`,mode:`create`,groupId:n},Z(R);else if(t===`edit`)R=X(r||Y(n)),P={type:`report`,mode:`edit`,reportId:n},Z(R);else if(t===`toggle-pin`){let e=w.reports.find(e=>e.id===n);if(!e)return;let t=e.pinned&&r?.closest(`[data-bucket-kind="featured"]`)?hn(n,r):X(r||Y(n));e.pinned=!e.pinned,H(e),V(),Z(t),K(e.pinned?`已加入精选成果`:`已移出精选成果`)}else if(t===`close-modal`)P=null,Z(R||X()),R=null;else if(t===`detect-title`)await An(e.currentTarget.closest(`form`));else if(t===`archive`){let e=w.reports.find(e=>e.id===n);if(!e)return;let t=hn(n,r);e.archived=!0,e.archivedAt=new Date().toISOString(),V(),Z(t),K(`已归档，可随时恢复`)}else if(t===`restore`){let e=w.reports.find(e=>e.id===n);if(!e)return;let t=hn(n);e.archived=!1,e.archivedAt=``,V(),Z(t),K(`报告已恢复到原主题`)}else if(t===`delete`){let e=w.reports.find(e=>e.id===n);if(e?.archived&&confirm(`二次确认：永久删除“${e.title}”？\n\n删除后无法从归档区恢复。`)){let e=hn(n);w.reports=w.reports.filter(e=>e.id!==n),E===n&&(E=``),V(),Z(e),K(`报告已永久删除`)}}else if(t===`add-group`)R=X(document.querySelector(`.results-toolbar`)),P={type:`group`,mode:`create`},Z(R);else if(t===`rename-group`)w.groups.find(e=>e.id===n)&&(R=X(J(`topic`,n)),P={type:`group`,mode:`edit`,groupId:n},Z(R));else if(t===`move-group`){let t=e.currentTarget.dataset.bucketKind,r=e.currentTarget.dataset.direction,i=X(J(t,n));Ut(n,r,t)&&(Z(i),requestAnimationFrame(()=>{document.querySelector(`[data-action="move-group"][data-id="${CSS.escape(n)}"][data-direction="${CSS.escape(r)}"]`)?.focus({preventScroll:!0})}),K(`分组顺序已更新`))}else if(t===`delete-group`){let e=w.groups.find(e=>e.id===n),t=w.groups.find(e=>e.id!==n);if(e&&!t)K(`请先新增另一个分组，再删除当前分组`);else if(e&&confirm(`删除“${e.name}”？其中的报告会移到“${t.name}”。`)){let e=gn(`topic`,n);w.reports.forEach(e=>{e.groupId===n&&(e.groupId=t.id)}),w.groups=w.groups.filter(e=>e.id!==n),V(),Z(e),K(`分组已删除，报告已移到“${t.name}”`)}}})}),document.querySelector(`.topbar`)?.addEventListener(`click`,e=>{e.target.closest(`button, a`)||cn(`smooth`)}),document.querySelectorAll(`.topic-nav a[data-nav-bucket-id]`).forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault();let n=e.dataset.navBucketKind,r=e.dataset.navBucketId;if(T){T=``,Q(),_n(()=>J(n,r));return}un(J(n,r))})}),document.querySelectorAll(`.topic-nav a[data-nav-report-id]`).forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault(),un(Y(e.dataset.navReportId))})}),jn(),document.querySelectorAll(`.legacy-report-drag-handle`).forEach(e=>{let t=null,n=!1,r=null,i=0,a=0,o=()=>{i&&=(cancelAnimationFrame(i),0)},s=()=>{if(!A)return o();let e=Math.min(110,window.innerHeight*.18),t=a<e?a-e:a>window.innerHeight-e?a-(window.innerHeight-e):0;if(!t)return o();let n=Math.sign(t)*Math.min(24,5+Math.abs(t)*.2);window.scrollBy(0,n),i=requestAnimationFrame(s)},c=t=>{let n=e.closest(`.report-card`);if(n){if(!r){let e=n.getBoundingClientRect();r=n.cloneNode(!0),r.className=`report-card report-drag-preview`,r.style.width=`${e.width}px`,r.style.height=`${e.height}px`,r.querySelectorAll(`button, [role='button']`).forEach(e=>{e.removeAttribute(`data-action`),e.setAttribute(`tabindex`,`-1`)}),document.body.append(r)}r.style.transform=`translate3d(${t.clientX+16}px, ${t.clientY+16}px, 0)`}},l=()=>{M=null,N?.remove(),N=null,document.querySelectorAll(`.report-card, .group-column, .topic-nav a`).forEach(e=>e.classList.remove(`is-card-drop-target`,`is-card-drop-before`,`is-card-drop-after`,`is-drop-ready`,`is-nav-drop-target`))},u=(t,n,r)=>{if(t){if(!N){N=document.createElement(`div`),N.className=`report-card report-card-placeholder`,N.innerHTML=`<span>放在这里</span>`;let t=e.closest(`.report-card`)?.getBoundingClientRect().height;t&&(N.style.minHeight=`${t}px`)}if(!n||n.parentElement!==t){t.append(N);return}t.insertBefore(N,r?n.nextSibling:n)}},d=t=>{let n=document.elementFromPoint(t.clientX,t.clientY),r=n?.closest(`.topic-nav a[data-nav-bucket-id]`);if(l(),r){r.classList.add(`is-nav-drop-target`),M={bucketKind:r.dataset.navBucketKind,bucketId:r.dataset.navBucketId,targetReportId:``,placeAfter:!1,nav:!0};return}let i=e.closest(`.report-card`),a=n?.closest(`.report-card:not(.report-card-placeholder)`),o=n?.closest(`.group-column`);if(a&&a!==i){let e=a.closest(`.group-column`),n=a.getBoundingClientRect(),r=t.clientY>n.top+n.height/2;a.classList.add(`is-card-drop-target`,r?`is-card-drop-after`:`is-card-drop-before`),u(e?.querySelector(`.group-cards`),a,r),M={bucketKind:e?.dataset.bucketKind||O,bucketId:e?.dataset.bucketId||``,targetReportId:a.dataset.reportId||``,placeAfter:r,nav:!1};return}o&&o.dataset.bucketKind!==`time`&&(o.classList.add(`is-drop-ready`),u(o.querySelector(`.group-cards`),null,!1),M={bucketKind:o.dataset.bucketKind||O,bucketId:o.dataset.bucketId||``,targetReportId:``,placeAfter:!1,nav:!1})},f=()=>{A=``,t=null,n=!1,o(),r?.remove(),r=null,l(),e.closest(`.report-card`)?.classList.remove(`is-dragging`)};e.addEventListener(`pointerdown`,r=>{r.preventDefault(),A=e.dataset.reportDragId,t={x:r.clientX,y:r.clientY},n=!1,e.setPointerCapture?.(r.pointerId),e.closest(`.report-card`)?.classList.add(`is-dragging`)}),e.addEventListener(`pointermove`,e=>{A&&(t&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<7||(n=!0,a=e.clientY,c(e),d(e),i||=requestAnimationFrame(s)))}),e.addEventListener(`pointerup`,e=>{if(!A)return;let t=A;if(!n){j=t,f(),Q(()=>Y(t)),K(`请选择目标${Qt()}`);return}let r=M,i=r?.targetReportId||``,a=r?.bucketId||``,o=r?.bucketKind||O,s=a&&o!==`time`?Zt(t,o,a,i,!!r?.placeAfter):!1;f(),s&&(Q(()=>Y(t)),requestAnimationFrame(()=>{let e=`.group-column[data-bucket-kind="${CSS.escape(o)}"][data-bucket-id="${CSS.escape(a)}"]`,n=document.querySelector(`${e} .report-card[data-report-id="${CSS.escape(t)}"]`)||document.querySelector(`.search-results-cards .report-card[data-report-id="${CSS.escape(t)}"]`);un(n),n?.classList.add(`is-drop-landed`),window.setTimeout(()=>n?.classList.remove(`is-drop-landed`),900)}),K(o===`featured`?`已加入精选成果`:o===`tag`?`已添加目标标签`:o===`type`?`工作类型已更新`:i?`报告顺序已更新`:`已移入新主题`))}),e.addEventListener(`pointercancel`,f)}),document.querySelectorAll(`.group-column`).forEach(e=>{e.addEventListener(`dragover`,t=>{t.preventDefault(),e.classList.add(`is-drop-ready`)}),e.addEventListener(`dragleave`,()=>{e.classList.remove(`is-drop-ready`)}),e.addEventListener(`drop`,t=>{t.preventDefault();let n=w.reports.find(e=>e.id===A),r=e.dataset.bucketKind||O;if(n&&Zt(A,r,e.dataset.bucketId)){let e=A;A=``,Q(()=>Y(e)),K(r===`tag`?`已添加目标标签`:r===`type`?`工作类型已更新`:`已移入新主题`)}A=``})});let t=document.getElementById(`group-form`);t?.addEventListener(`submit`,e=>{e.preventDefault();let n=new FormData(t).get(`name`)?.trim(),r=new FormData(t).get(`description`)?.trim();if(!n)return;if(P.mode===`edit`){let e=w.groups.find(e=>e.id===P.groupId);if(!e)return;e.name=n.slice(0,60),e.description=r?.slice(0,80)||`自定义工作主题`}else w.groups.push({id:tn(`group`),name:n.slice(0,60),description:r?.slice(0,80)||`自定义工作主题`,accent:[`blue`,`violet`,`amber`,`green`][w.groups.length%4],position:w.groups.length}),O=`topic`,localStorage.setItem(it,O);V();let i=P.mode===`edit`?`工作主题已更新`:`工作主题已创建，可直接拖入报告`;P=null,Z(R||X()),R=null,K(i)});let n=document.getElementById(`report-form`),r=n?.elements.tags,i=e=>{let t=G(r?.value).includes(e.dataset.reportTag);e.classList.toggle(`selected`,t),e.setAttribute(`aria-pressed`,String(t))},a=e=>{e.addEventListener(`click`,()=>{let t=G(r.value),n=e.dataset.reportTag;r.value=t.includes(n)?t.filter(e=>e!==n).join(`、`):[...t,n].slice(0,8).join(`、`),i(e)})};n?.querySelectorAll(`[data-report-tag]`).forEach(a);let o=n?.querySelector(`[data-add-report-tag]`),s=n?.querySelector(`.new-report-tag-row`),c=n?.querySelector(`[data-new-report-tag]`),l=()=>{s.hidden=!1,c.focus()},u=()=>{let[e]=G(c.value);if(!e)return;let t=G(r.value);if(!t.includes(e)&&t.length>=8){K(`最多选择 8 个标签`);return}r.value=[...new Set([...t,e])].slice(0,8).join(`、`);let l=[...n.querySelectorAll(`[data-report-tag]`)].find(t=>t.dataset.reportTag===e);l||(l=document.createElement(`button`),l.type=`button`,l.dataset.reportTag=e,l.textContent=e,o.before(l),a(l)),i(l),c.value=``,s.hidden=!0,o.focus()};o?.addEventListener(`click`,l),n?.querySelector(`[data-confirm-report-tag]`)?.addEventListener(`click`,u),c?.addEventListener(`keydown`,e=>{e.key===`Enter`?(e.preventDefault(),u()):e.key===`Escape`&&(e.preventDefault(),c.value=``,s.hidden=!0,o.focus())}),n?.addEventListener(`submit`,async e=>{e.preventDefault();let t=n.elements.url.value.trim();if(!on(t))return;let r=n.querySelector(`button[type="submit"]`),i=n.querySelector(`.field-hint`);r.disabled=!0,r.innerHTML=`<span class="mini-spinner"></span>`;let a=Pt({material:t,files:[],url:t,excludeId:P.mode===`edit`?P.reportId:``});if(a){r.disabled=!1,r.textContent=`Save`,i.textContent=`成果库已有“${a.title}”，未重复保存`,K(`成果库已有“${a.title}”，未重复保存`);return}let o=await Bt({material:t,files:[],url:t},e=>{i.textContent=e});if(!o.allowed){r.disabled=!1,r.textContent=`Save`,i.textContent=o.reason,K(o.reason);return}let s=n.elements.title.value.trim()||o.metadata.title,c=n.elements.groupId.value,l=n.elements.workType.value,u=G(n.elements.tags.value),d={title:s||an(t),url:t,groupId:c,workType:l,source:`手动添加`,access:o.access,detectedDescription:o.metadata.description,manualSaved:!0,isProduction:o.access===`production`,isPersonal:Ft(t),isHtml:o.isHtml,loginProvider:o.loginProvider},f=P.mode===`edit`?u:[...new Set([...C(d,l),...u])].slice(0,8);if(P.mode===`edit`){let e=w.reports.find(e=>e.id===P.reportId);Object.assign(e,d,{tags:f}),H(e)}else{let e=new Date().toISOString(),t={id:tn(`report`),groupId:c,...d,pinned:!1,position:w.reports.filter(e=>e.groupId===c).length,createdAt:e,modifiedAt:e,archived:!1,archivedAt:``,tags:f};w.reports.push(t)}V(),P=null,Z(R||X()),R=null,K(`报告已保存`)});let d=E&&w.reports.find(e=>e.id===E);d&&Ye(d)}function Nn(){wt(),$()}Nn(document.getElementById(`app`));