(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function i(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(r){if(r.ep)return;r.ep=!0;const n=i(r);fetch(r.href,n)}})();const Pt="clair-ai-studio-tasks-v1",te=[{id:"save",name:"保存",hint:"自动识别并进入成果库"},{id:"decision",name:"决策",hint:"发起决策推演"},{id:"review",name:"评审",hint:"自动匹配合适的评审 Skill"}],Dt={save:`
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
      <path d="M12 16V4M8 8l4-4 4 4"></path>
      <path d="M5 14v5.5h14V14"></path>
    </svg>`},K=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let A=ct();function ct(){return{material:"",files:[]}}function Rt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function ee(t){var r;const e=t.toLowerCase(),a=((r=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(c=>e.includes(c))))==null?void 0:r[0])||"solution";return K.find(n=>n.id===a)||K[1]}function ae(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function H(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const a=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name);let r="";if(a&&i.size<=1024*1024)try{r=(await i.text()).slice(0,12e3)}catch{r=""}return{id:Rt(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:ae(i.size),excerpt:r}}))}function ie(t){return A.files.length?`<div class="attachment-list">${A.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function re(t){return te.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${t(e.name)}"
      title="${t(e.name)} · ${t(e.hint)}">
      ${Dt[e.id]}
    </button>`).join("")}function ne(t){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="输入或粘贴内容">${t(A.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            ${re(t)}
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${Dt.upload}
            </label>
          </div>
        </div>
        ${ie(t)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function oe({render:t,showToast:e,saveToLibrary:i}){document.querySelectorAll("[data-task-action]").forEach(s=>{s.addEventListener("click",d=>{d.currentTarget.dataset.taskAction==="remove-file"&&(F(),A.files=A.files.filter(p=>p.id!==d.currentTarget.dataset.fileId),t())})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",async s=>{var m,w;if(s.preventDefault(),F(),!A.material.trim()&&!A.files.length){e("先粘贴内容，或加入一份材料"),(m=document.getElementById("task-goal"))==null||m.focus();return}const d=((w=s.submitter)==null?void 0:w.dataset.submitAction)||"save",l=s.submitter,p={material:A.material.trim(),files:A.files};if(d==="save"){const h=a.querySelector("#intake-save-status"),T=[...a.querySelectorAll("button, textarea, input")],O=E=>{T.forEach(Qt=>{Qt.disabled=!0}),a.setAttribute("aria-busy","true"),a.classList.add("is-saving"),h.hidden=!1,h.querySelector("strong").textContent=E,l.setAttribute("aria-label","保存中"),l.innerHTML='<span class="mini-spinner"></span>'};O("正在检查成果库与页面访问状态…");try{const E=await i(p,O);if(E.rejected){t(),e(E.reason);return}if(E.duplicate){t(),e(`成果库已有“${E.title}” · 位于“${E.groupName}”，未重复保存`);return}A=ct(),t(),e(`已保存到“${E.groupName}” · ${E.workTypeName} · 标签：${E.tags.join(" / ")||"待补标签"}`)}catch{T.forEach(E=>{E.disabled=!1}),t(),e("保存失败，请稍后重试")}return}l.disabled=!0;const u=ee([p.material,...p.files.map(h=>`${h.name}
${h.excerpt}`)].join(`
`)),g=d==="decision"?K.find(h=>h.id==="decision"):u.id==="decision"?K.find(h=>h.id==="solution"):u,y=new Date().toISOString(),$=se();$.push({id:Rt(),title:ce(p),mode:d,skillId:g.id,skillName:g.name,material:p.material,files:p.files,status:"queued",createdAt:y,updatedAt:y}),localStorage.setItem(Pt,JSON.stringify($)),A=ct(),t(),e(`${d==="decision"?"已发起决策":"已发起评审"} · ${g.name}`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async s=>{F(),A.files.push(...await H(s.target.files)),t(),e(`已加入 ${s.target.files.length} 个文件`)});const n=document.querySelector(".prompt-composer");n==null||n.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async s=>{s.preventDefault(),s.stopPropagation(),n.classList.remove("drag-over"),F();const d=s.dataTransfer.files;A.files.push(...await H(d)),t(),e(`已加入 ${d.length} 个文件`)});const c=document.getElementById("task-goal");requestAnimationFrame(()=>At(c)),c==null||c.addEventListener("input",()=>{A.material=c.value,At(c)}),c==null||c.addEventListener("paste",async s=>{var g;const d=[...((g=s.clipboardData)==null?void 0:g.items)||[]].filter(y=>y.kind==="file").map(y=>y.getAsFile()).filter(Boolean);if(!d.length)return;s.preventDefault();const l=s.clipboardData.getData("text/plain"),p=c.selectionStart??c.value.length,u=c.selectionEnd??p;A.material=`${c.value.slice(0,p)}${l}${c.value.slice(u)}`,A.files.push(...await H(d)),t(),e(`已从剪贴板加入 ${d.length} 个材料`)}),de({render:t,showToast:e})}function se(){try{const t=JSON.parse(localStorage.getItem(Pt));return Array.isArray(t)?t:[]}catch{return[]}}function ce(t){var i;return(t.material.split(/\n/).map(a=>a.trim()).find(Boolean)||((i=t.files[0])==null?void 0:i.name)||"未命名任务").replace(/[。；;！!？?]+$/,"").slice(0,64)}function F(){const t=document.getElementById("task-goal");t&&(A.material=t.value)}function At(t){if(!t)return;t.style.height="auto";const e=Math.min(Math.max(t.scrollHeight,40),180);t.style.height=`${e}px`,t.style.overflowY=t.scrollHeight>180?"auto":"hidden"}function It(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function le(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function de({render:t,showToast:e}){document.onpaste=async i=>{var c,s;if(le(i.target)||!document.querySelector(".prompt-composer"))return;const r=[...((c=i.clipboardData)==null?void 0:c.items)||[]].filter(d=>d.kind==="file").map(d=>d.getAsFile()).filter(Boolean),n=((s=i.clipboardData)==null?void 0:s.getData("text/plain"))||"";!r.length&&!n.trim()||(i.preventDefault(),A.material=[A.material.trim(),n.trim()].filter(Boolean).join(`

`),r.length&&A.files.push(...await H(r)),t(),requestAnimationFrame(It),e(r.length?`已从剪贴板加入 ${r.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=i=>{var a;[...((a=i.dataTransfer)==null?void 0:a.types)||[]].includes("Files")&&i.preventDefault()},document.ondrop=async i=>{var r,n,c;if((n=(r=i.target)==null?void 0:r.closest)!=null&&n.call(r,".prompt-composer"))return;const a=((c=i.dataTransfer)==null?void 0:c.files)||[];a.length&&(i.preventDefault(),A.files.push(...await H(a)),t(),requestAnimationFrame(It),e(`已拖入 ${a.length} 个文件`))}}const X="clair-report-editor-v1",ue="https://api.github.com",Ot="2026",pe="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:null,showToast:null},W=new Map;let St=!1;function gt(t){return[...new Set(t.filter(Boolean))]}function lt(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function ft(t){return`${pe}${t}`}function me(t){try{const e=sessionStorage.getItem(ft(t));if(!e)return null;const i=JSON.parse(e);return!(i!=null&&i.html)||typeof i.html!="string"?null:i}catch{return null}}function Mt(t=o.reportId){try{sessionStorage.removeItem(ft(t))}catch{}}function Ht(){return o.dirty&&o.hasDraft?{tone:"changed",label:"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:"生产档案已更新"}:{tone:"clean",label:"未修改"}}function V(){const t=Ht(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const i=document.querySelector('[data-editor-action="stash"]');i&&(i.disabled=o.status!=="ready"||o.saving||!o.dirty,i.textContent=!o.dirty&&o.hasDraft?"已暂存":"暂存");const a=document.querySelector('[data-editor-action="publish"]');a&&(a.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft,a.textContent=o.saving?"推送中…":"推送生产");const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function ge(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function fe(t){const e=atob(String(t||"").replace(/\s/g,"")),i=Uint8Array.from(e,a=>a.charCodeAt(0));return new TextDecoder().decode(i)}function he(t){const e=new TextEncoder().encode(t);let i="";const a=32768;for(let r=0;r<e.length;r+=a)i+=String.fromCharCode(...e.subarray(r,r+a));return btoa(i)}function it(t){let e="";for(let a=0;a<t.length;a+=32768)e+=String.fromCharCode(...t.subarray(a,a+32768));return btoa(e)}function rt(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Bt(t,e){const i=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function qt(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const i=JSON.parse(e[1]),a=rt(i.salt),r=rt(i.iv),n=await Bt(Ot,a),c=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},n,rt(i.data)),s=new TextDecoder().decode(c);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function ht(t){var c;if(((c=o.protection)==null?void 0:c.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await Bt(Ot,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,new TextEncoder().encode(t)),n=JSON.stringify({salt:it(e),iv:it(i),data:it(new Uint8Array(r))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,n)}function be(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const i=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),a=i.shift()||"ClairKu.github.io";let r=i.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const n=gt([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:a,branch:"main",path:n[0],candidates:n,source:"auto"}}catch{return null}}async function Y(t,{token:e="",method:i="GET",body:a}={}){var c;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),a!==void 0&&(r["Content-Type"]="application/json");const n=await fetch(`${ue}${t}`,{method:i,headers:r,body:a===void 0?void 0:JSON.stringify(a)});if(!n.ok){let s="";try{s=((c=await n.json())==null?void 0:c.message)||""}catch{s=await n.text()}const d=new Error(s||`GitHub API ${n.status}`);throw d.status=n.status,d}return n.status===204?null:n.json()}async function ve(t){var c;const e=await Y(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const i=gt((c=t.candidates)!=null&&c.length?t.candidates:[t.path]);let a=null,r=null;const n=[];for(const s of i)try{const d=s.split("/").map(encodeURIComponent).join("/"),l=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${d}?ref=${encodeURIComponent(t.branch)}`,p=await Y(l);let u="";if(p.encoding==="base64"&&p.content)u=fe(p.content);else if(p.download_url){const g=await fetch(p.download_url,{cache:"no-store"});if(!g.ok)throw new Error("无法读取 GitHub 原始文件");u=await g.text()}if(!u)throw new Error("GitHub 文件内容为空");r?u===r.html&&n.push({path:s,sha:p.sha}):r={html:u,target:{...t,path:s,sha:p.sha,candidates:i}}}catch(d){if(a=d,d.status&&![403,404].includes(d.status))break}if(r)return r.target.mirrors=n,r;throw a||new Error("没有找到对应的 GitHub HTML 文件")}function ye(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{/^on/i.test(a.name)&&(e.setAttribute(`data-clair-event-${a.name.toLowerCase()}`,a.value),e.removeAttribute(a.name))});const i=e.getAttribute("href");i&&/^\s*javascript:/i.test(i)&&(e.dataset.clairJavascriptHref=i,e.removeAttribute("href"))})}function we(){return`
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
`}function ke(t,e){const a=new DOMParser().parseFromString(t,"text/html");a.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),ye(a);const r=a.createElement("base");r.href=e,r.dataset.clairEditorBase="true",a.head.prepend(r);const n=a.createElement("style");n.id="clair-editor-style",n.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,a.head.append(n);const c=a.createElement("script");return c.id="clair-editor-bridge",c.textContent=we(),a.body.append(c),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}async function Ut(t){var e;try{const i=be(t.url);let a=null;if(i)try{a=await ve(i)}catch{}if(!a){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);a={html:await s.text(),target:i}}const r=await qt(a.html);o.protection=r.protection,o.target=a.target||i;let n=r.html;const c=me(t.id);if(c!=null&&c.html)try{const s=await qt(c.html);n=s.html,o.hasDraft=!0,o.draftHtml=s.html,o.draftAt=c.savedAt||"",c.baseFiles&&o.target&&(o.target.baseFiles=c.baseFiles)}catch{Mt(t.id)}o.html=n,o.editorDocument=ke(n,t.url),o.status="ready",o.error=""}catch(i){o.status="error",o.error=(i==null?void 0:i.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function Nt(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:t,showToast:e})}function bt(){return document.querySelector(".report-editor-frame")}function nt(t,e=null){var a;const i=bt();(a=i==null?void 0:i.contentWindow)==null||a.postMessage({channel:X,type:"command",command:t,value:e},"*")}function vt(){var i;const t=bt();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((a,r)=>{const n=window.setTimeout(()=>{W.delete(e),r(new Error("读取编辑内容超时"))},1e4);W.set(e,{resolve:c=>{clearTimeout(n),a(c)}}),t.contentWindow.postMessage({channel:X,type:"serialize",requestId:e},"*")})}function $e(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function jt(t,e){const i=new Blob([t],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(i),r=document.createElement("a");r.href=a,r.download=$e(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Ft(t){await navigator.clipboard.writeText(t)}function Ae(t,e){var r;const i=new DOMParser().parseFromString(t,"text/html");(r=i.querySelector("base[data-clair-preview-base]"))==null||r.remove();const a=i.createElement("base");return a.href=e,a.dataset.clairPreviewBase="true",i.head.prepend(a),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}function Ie(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([Ae(o.draftHtml,t.url)],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(e),a=window.open(i,"_blank");if(!a)throw URL.revokeObjectURL(i),new Error("浏览器拦截了新窗口，请允许弹窗后重试");a.opener=null,window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}async function dt(t,{silent:e=!1}={}){var n;const i=await vt(),a=await ht(i),r=new Date().toISOString();try{sessionStorage.setItem(ft(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:lt(),html:a}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=i,o.draftHtml=i,o.draftAt=r,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",V(),e||(n=o.showToast)==null||n.call(o,"已暂存在当前浏览器会话，尚未更新 GitHub"),i}async function Se(t){var s,d;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const i=await ht(t),a=(e.mirrors||[]).map(l=>l.path),r=gt([...a.filter(l=>l.startsWith("public/")),...a.filter(l=>!l.startsWith("public/")&&l!==e.path),e.path]);let n="";const c=[];for(const l of r)try{const p=l.split("/").map(encodeURIComponent).join("/"),u=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${p}`,g=await Y(`${u}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),y=lt(e)[l];if(y&&g.sha!==y)throw new Error(`生产文件 ${l} 已在本次编辑后更新，请重新打开报告合并修改`);const $=await Y(u,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:he(i),sha:g.sha,branch:e.branch}});n=((s=$==null?void 0:$.commit)==null?void 0:s.sha)||n,e.baseFiles={...lt(e),[l]:((d=$==null?void 0:$.content)==null?void 0:d.sha)||g.sha},c.push(l)}catch(p){throw c.length?new Error(`已更新 ${c.join("、")}，但 ${l} 同步失败：${p.message}`):p}return{commit:n,files:c.length}}async function Tt(t){var e,i;if(!o.saving){o.saving=!0,V();try{const a=o.dirty?await dt(t,{silent:!0}):o.draftHtml||await vt(),r=await Se(a);o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=r.commit,Mt(t.id),(e=o.showToast)==null||e.call(o,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,V()}}}function qe(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
    </div>`}function Te(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
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
    </div>`}function Et({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const i=e.querySelector("#editor-settings-form"),a=o.target||{};if(i){i.elements.owner.value=a.owner||"ClairKu",i.elements.repository.value=a.repository||"",i.elements.branch.value=a.branch||"main",i.elements.path.value=a.path||"";const r=i.querySelector('button[type="submit"]');r&&(r.textContent=t?"连接并保存":"保存设置")}}function G(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function Ee(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function Z(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Gt(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function Le(t,{render:e,showToast:i}){Nt(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:i}),e(),o.loadPromise=Ut(t)}function xe(t,e){var c;const i=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(c=o.target.mirrors)!=null&&c.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",a=Ht(),r=o.status==="ready"?`
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
      </div>`:"",n=o.status==="loading"?'<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>会自动识别对应 GitHub 仓库与源文件。</p></div>':o.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(o.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${ge(o.editorDocument)}"></iframe></div>`;return`
    <main class="reader-shell report-editor-shell">
      <header class="reader-header editor-header">
        <button class="back-button" type="button" data-editor-action="exit"><span aria-hidden="true">←</span>退出编辑</button>
        <div class="reader-title">
          <strong>${e(t.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${a.tone}">${e(a.label)}</span>
            <span class="editor-target-label" title="${e(i)}">${e(i)}</span>
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
      ${r}
      ${n}
      ${qe(e)}
      ${Te(e)}
    </main>`}function Ce(t){if(!Gt(t.id))return;St||(St=!0,window.addEventListener("message",a=>{var n;const r=bt();if(!(!(r!=null&&r.contentWindow)||a.source!==r.contentWindow)&&((n=a.data)==null?void 0:n.channel)===X){if(a.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",V()),a.data.type==="serialized"){const c=W.get(a.data.requestId);if(!c)return;W.delete(a.data.requestId),c.resolve(a.data.html)}a.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(c=>{const s=c.dataset.editorCommand;["bold","italic","underline"].includes(s)&&c.classList.toggle("active",!!a.data[s])})}}),window.addEventListener("beforeunload",a=>{!o.reportId||!o.dirty||(a.preventDefault(),a.returnValue="")}),window.addEventListener("keydown",a=>{a.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?Z():o.settingsOpen&&G())})),document.querySelectorAll("[data-editor-command]").forEach(a=>{a.addEventListener("mousedown",r=>r.preventDefault()),a.addEventListener("click",()=>nt(a.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{nt("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(a=>{a.addEventListener("click",async()=>{var n,c,s,d,l,p,u,g,y,$,m,w;const r=a.dataset.editorAction;if(r==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const h=o.render;Nt(),h==null||h()}else if(r==="settings")Et();else if(r==="close-settings")G();else if(r==="stash")try{await dt(t)}catch(h){(n=o.showToast)==null||n.call(o,(h==null?void 0:h.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{Ie(t),(c=o.showToast)==null||c.call(o,"已在新窗口打开暂存修订")}catch(h){(s=o.showToast)==null||s.call(o,(h==null?void 0:h.message)||"无法打开预览")}else if(r==="publish")try{if(o.dirty&&await dt(t,{silent:!0}),!o.hasDraft){(d=o.showToast)==null||d.call(o,"当前没有待推送的修订");return}Ee()}catch(h){(l=o.showToast)==null||l.call(o,(h==null?void 0:h.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")Z();else if(r==="confirm-publish")Z(),!o.token||!((p=o.target)!=null&&p.path)?Et({pendingSave:!0}):await Tt(t);else if(r==="download")try{const h=await vt();jt(await ht(h),t.title),(u=o.showToast)==null||u.call(o,"HTML 已下载")}catch(h){(g=o.showToast)==null||g.call(o,(h==null?void 0:h.message)||"下载失败")}else if(r==="download-published")await Zt(t,o.showToast);else if(r==="share")try{await Ft(t.url),(y=o.showToast)==null||y.call(o,"报告链接已复制")}catch{($=o.showToast)==null||$.call(o,"复制失败，请从地址栏复制")}else if(r==="link"){const h=prompt("输入链接地址（https://…）");if(!h)return;try{const T=new URL(h);if(!["http:","https:","mailto:"].includes(T.protocol))throw new Error;nt("createLink",T.href)}catch{(m=o.showToast)==null||m.call(o,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(o.status="loading",o.error="",(w=o.render)==null||w.call(o),o.loadPromise||(o.loadPromise=Ut(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(a=>{a.addEventListener("click",r=>{r.target===a&&(a.classList.contains("editor-settings-backdrop")?G():Z())})});const i=document.getElementById("editor-settings-form");i==null||i.addEventListener("submit",async a=>{var l,p,u;a.preventDefault();const r=new FormData(i),n=String(r.get("github-token-not-password")||"").trim();n&&(o.token=n);const c=String(r.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:c,mirrors:c===((l=o.target)==null?void 0:l.path)?((p=o.target)==null?void 0:p.mirrors)||[]:[],source:"manual"};const s=o.pendingSave;G();const d=document.querySelector(".editor-target-label");if(d){const g=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;d.textContent=g,d.title=g}(u=o.showToast)==null||u.call(o,"保存权限已连接"),s&&await Tt(t)})}async function Zt(t,e){try{const i=await fetch(t.url,{cache:"no-store"});if(!i.ok)throw new Error;jt(await i.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function Pe(t,e){try{await Ft(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const yt="clair-service-report-workbench-v1",wt="clair-service-report-workbench-access",J="clair-service-report-workbench-view",R=6,Q=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],_=["手动保存","生产","个人","HTML","本体","飞书","调研","产品规划","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],M={version:R,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-productization-roadshow-2026-07-30",groupId:"reporting",title:"AI 产品化实践路演｜CEO / CTO",url:"https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T00:00:00.000Z",source:"CEO / CTO 路演材料",access:"production"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},ut={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-productization-roadshow-2026-07-30":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},zt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function tt(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|Studio|工作台|原型/i.test(e)?"product-demo":"product-planning"}function et(t,e=tt(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`,a=[],r=n=>{a.includes(n)||a.push(n)};return t.manualSaved&&r("手动保存"),t.isProduction&&r("生产"),t.isPersonal&&r("个人"),t.isHtml&&r("HTML"),/ontology\.yingmi-inc\.com|本体/.test(i)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&r("调研"),e==="product-planning"&&r("产品规划"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&r("AI 小顾"),(/studio|workbench|工作台|skill-audit/i.test(i)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(i)&&r("且慢"),/投顾|advisor|财务规划/.test(i)&&r("投顾服务"),/OAP|oap-/.test(i)&&r("OAP"),/MCP|mcp-/.test(i)&&r("MCP"),/Skills|skill-/.test(i)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),a.slice(0,5)}function De(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/Studio|工作台|生产力|Copilot|编辑器/i.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":{"requirement-review":"product-planning","competitive-research":"product-planning",reporting:"reporting","data-analysis":"reporting","investment-research":"research","governance-review":"knowledge","product-demo":"ai-workbench","product-planning":"product-planning"}[t.workType]||"inbox"}M.reports=M.reports.map(t=>{const e=zt[t.id]||t.groupId,i=ut[t.id]||tt(t),a={...t,groupId:e,workType:i};return{...a,tags:et(a,i)}});let b=Re(),q="",P="",U=!1,S=["topic","type","tag"].includes(localStorage.getItem(J))?localStorage.getItem(J):"topic",C="",L="",D="",k=null,Lt=0;function _t(t){return JSON.parse(JSON.stringify(t))}function B(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function Re(){try{const t=JSON.parse(localStorage.getItem(yt));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Oe(t)}catch{}return _t(M)}function Oe(t){const e=_t(M),i=new Set(e.groups.map(m=>m.id)),a=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(m=>[m.id,m])),n=e.groups.map(m=>{const w=r.get(m.id);return!w||t.version<R?m:{...m,name:w.name||m.name,description:w.description||m.description,position:Number.isFinite(w.position)?w.position:m.position}});t.groups.filter(m=>!i.has(m.id)&&!a.has(m.id)).forEach((m,w)=>{n.push({...m,description:m.description||"自定义工作分组",position:Number.isFinite(m.position)?m.position:M.groups.length+w})});const c=n.filter((m,w,h)=>h.findIndex(T=>T.id===m.id)===w);c.sort((m,w)=>(m.position||0)-(w.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},d={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},l=t.reports.map(m=>({...m,groupId:zt[m.id]||s[m.id]||d[m.groupId]||m.groupId||"inbox",workType:m.workType||ut[m.id]||tt(m),tags:Array.isArray(m.tags)&&m.tags.length?m.tags:et(m,m.workType||ut[m.id])})),p=new Map(l.map(m=>[m.id,m])),u=new Map(l.map(m=>[B(m.url),m])),g=new Set,y=e.reports.map(m=>{const w=B(m.url);g.add(w);const h=p.get(m.id)||u.get(w);return h?{...m,title:h.title||m.title,groupId:t.version>=R&&c.some(T=>T.id===h.groupId)?h.groupId:m.groupId,workType:t.version>=R&&h.workType?h.workType:m.workType,tags:t.version>=R&&Array.isArray(h.tags)&&h.tags.length?h.tags:m.tags,pinned:!!h.pinned,position:Number.isFinite(h.position)?h.position:m.position,archived:!!h.archived,archivedAt:h.archivedAt||""}:m});l.forEach(m=>{const w=B(m.url);g.has(w)||(g.add(w),y.push(m))});const $={version:R,groups:c,reports:y};return localStorage.setItem(yt,JSON.stringify($)),$}function x(){b.version=R,b.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(yt,JSON.stringify(b))}function Me(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(at)||""}function He(t,e,i){var c,s,d;const r=(s=(c=kt(t,e).match(/<title[^>]*>([\s\S]*?)<\/title>/i))==null?void 0:c[1])==null?void 0:s.replace(/\s+/g," ").trim();if(r)return r.slice(0,100);const n=String(t).split(/\n/).map(l=>l.trim().replace(/^#+\s*/,"")).find(l=>l&&!/^https?:\/\//i.test(l));return n?n.replace(/[。；;！!？?]+$/,"").slice(0,100):(d=e[0])!=null&&d.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):i?j(i):"未命名成果"}function xt(t=""){return String(t).trim().replace(/\s+/g," ").toLocaleLowerCase()}function Ct(t=[]){return t.map(e=>`${String(e.name||"").trim().toLocaleLowerCase()}:${e.size||0}:${e.type||""}`).sort().join("|")}function Kt({material:t,files:e,url:i,excludeId:a=""}){const r=i?B(i):"",n=xt(t),c=Ct(e);return b.reports.find(s=>s.id===a?!1:r&&B(s.url)===r||n&&xt(s.savedContent)===n?!0:!n&&!!c&&Ct(s.savedFiles)===c)||null}function Wt(t=""){var e;try{const i=new URL(t),a=i.hostname.toLowerCase(),r=(e=i.pathname.split("/").filter(Boolean)[0])==null?void 0:e.toLowerCase();return a==="clairku.github.io"||(a==="github.com"||a==="raw.githubusercontent.com")&&r==="clairku"}catch{return!1}}function Be(t=""){try{return/\.html?$/i.test(new URL(t).pathname)}catch{return!1}}function kt(t="",e=[]){var i;return/<!doctype\s+html|<html[\s>]/i.test(t)?t.trim():((i=e.find(a=>/\.html?$/i.test(a.name)&&a.excerpt))==null?void 0:i.excerpt)||""}function Ue(t=""){try{const e=new URL(t).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(e))return{access:"org",provider:"飞书组织帐号"};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(e))return{access:"account",provider:"腾讯文档帐号"};if(/(^|\.)yingmi-inc\.com$/.test(e))return{access:"org",provider:"盈米组织帐号"};if(e==="github.com"&&/^\/login(?:\/|$)/.test(new URL(t).pathname))return{access:"account",provider:"GitHub 帐号"}}catch{return null}return null}async function Vt(t){var e,i,a,r,n;if(!at(t))return{title:"",description:"",reachable:!1};try{const c=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,s=await fetch(c,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!s.ok)throw new Error("read failed");const d=await s.json();return{title:((i=(e=d==null?void 0:d.data)==null?void 0:e.title)==null?void 0:i.trim().slice(0,180))||"",description:((r=(a=d==null?void 0:d.data)==null?void 0:a.description)==null?void 0:r.trim().slice(0,500))||"",reachable:(d==null?void 0:d.status)==="success"&&!!((n=d==null?void 0:d.data)!=null&&n.url)}}catch{return{title:"",description:"",reachable:!1}}}async function Yt({material:t="",files:e=[],url:i=""},a=()=>{}){const r=kt(t,e),n=e.some(d=>/\.html?$/i.test(d.name));if(!i)return r?{allowed:!0,access:"local",metadata:{title:"",description:"",reachable:!0},isHtml:!0,savedHtml:r,loginProvider:""}:{allowed:!1,reason:n?"HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML":"只能保存可正常访问的网址或 HTML 内容"};const c=Ue(i);a(c?"正在识别权限页面与登录入口…":"正在检查页面是否可正常访问…");const s=c?{title:"",description:"",reachable:!0}:await Vt(i);return!c&&!s.reachable?{allowed:!1,reason:"页面无法正常访问，且不是可读取的 HTML，未保存"}:{allowed:!0,access:(c==null?void 0:c.access)||"production",metadata:s,isHtml:Be(i),savedHtml:"",loginProvider:(c==null?void 0:c.provider)||""}}async function Ne({material:t,files:e},i=()=>{}){var p,u;const a=Me(t);i("正在检查成果库是否已有相同内容…");const r=Kt({material:t,files:e,url:a});if(r)return{...r,duplicate:!0,groupName:((p=b.groups.find(g=>g.id===r.groupId))==null?void 0:p.name)||"待整理",workTypeName:pt(r.workType)};const n=await Yt({material:t,files:e,url:a},i);if(!n.allowed)return{rejected:!0,duplicate:!1,reason:n.reason};const c=He(t,e,a),s=n.metadata;i("正在识别标题、分组、类型与标签…");const d=new Date().toISOString(),l={id:mt("report"),groupId:"inbox",title:s.title||c,url:a,pinned:!1,position:0,createdAt:d,source:a?"快捷保存":"本地保存",access:n.access,archived:!1,archivedAt:"",savedContent:t,savedFiles:e,detectedDescription:s.description,manualSaved:!0,isProduction:n.access==="production",isPersonal:Wt(a),isHtml:n.isHtml,savedHtml:n.savedHtml,loginProvider:n.loginProvider};return l.workType=tt(l),l.groupId=De(l),l.tags=et(l,l.workType),i("正在保存到成果库…"),l.position=b.reports.filter(g=>!g.archived&&g.groupId===l.groupId).length,b.reports.push(l),x(),U=!1,S="topic",q="",localStorage.setItem(J,S),{...l,duplicate:!1,groupName:((u=b.groups.find(g=>g.id===l.groupId))==null?void 0:u.name)||"待整理",workTypeName:pt(l.workType)}}function ot(t,e){const i=b.groups.findIndex(n=>n.id===t),a=b.groups.findIndex(n=>n.id===e);if(i<0||a<0||i===a)return!1;const[r]=b.groups.splice(i,1);return b.groups.splice(a,0,r),x(),!0}function je(t,e,i=""){const a=b.reports.find(s=>s.id===t);if(!a||a.archived||!b.groups.find(s=>s.id===e))return!1;const n=b.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,d)=>(s.position||0)-(d.position||0)),c=i?n.findIndex(s=>s.id===i):n.length;return a.groupId=e,n.splice(c<0?n.length:c,0,a),n.forEach((s,d)=>{s.position=d}),x(),!0}function pt(t){var e;return((e=Q.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function Fe(t,e=""){const i=a=>!e||a.toLowerCase().includes(e);if(S==="type")return Q.map(a=>({id:a.id,name:a.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===a.id).sort((r,n)=>+!!n.pinned-+!!r.pinned||new Date(n.createdAt)-new Date(r.createdAt))})).filter(a=>!e||a.reports.length||i(a.name));if(S==="tag"){const a=new Set(_);return b.reports.forEach(n=>{(n.tags||[]).forEach(c=>a.add(c))}),[...a].sort((n,c)=>{const s=_.indexOf(n),d=_.indexOf(c);return s>=0||d>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(d<0?Number.MAX_SAFE_INTEGER:d):n.localeCompare(c,"zh-CN")}).map(n=>({id:n,name:n,kind:"tag",accent:"violet",reports:t.filter(c=>(c.tags||[]).includes(n)).sort((c,s)=>+!!s.pinned-+!!c.pinned||new Date(s.createdAt)-new Date(c.createdAt))})).filter(n=>n.reports.length&&(!e||i(n.name)||n.reports.length))}return b.groups.map(a=>({...a,kind:"topic",reports:t.filter(r=>r.groupId===a.id).sort((r,n)=>(r.position||0)-(n.position||0))})).filter(a=>!e||a.reports.length||i(`${a.name} ${a.description||""}`))}function z(t,e,i,a=""){const r=b.reports.find(n=>n.id===t);return!r||r.archived?!1:e==="topic"?je(t,i,a):e==="type"?Q.some(n=>n.id===i)?(r.workType=i,x(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(i)||r.tags.push(i),x(),!0):!1}function N(){return S==="type"?"工作类型":S==="tag"?"标签":"主题"}function mt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function f(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function j(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function at(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function st(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function I(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Lt),Lt=window.setTimeout(()=>e.remove(),2600)}function Jt(t,e=!1){const i=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),a=["org","account"].includes(t.access),r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",c=!a&&M.reports.some(s=>s.id===t.id)?`<img src="./previews/${f(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":f(t.title.slice(0,2))}</span>
        <strong>${a?r:i?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${D===t.id?"is-move-selected":""}" data-report-id="${f(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${f(t.id)}" aria-label="打开${f(t.title)}">
        <span class="report-preview">
          ${c}
        </span>
        <span class="report-copy">
          <span class="report-source">${f(t.source||"手动添加")}</span>
          <strong>${f(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(s=>`<span>${f(s)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${f(r)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${f(t.id)}"
          aria-label="拖动《${f(t.title)}》到其他${N()}" title="拖动到其他${N()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${f(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${f(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${f(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${t.url?`<button type="button" data-action="edit" data-id="${f(t.id)}">编辑</button>`:""}
            <button type="button" data-action="archive" data-id="${f(t.id)}">归档</button>`}
      </div>
    </article>`}function $t(){var i;if(!k)return"";if(k.type==="tags"){const a=b.reports.find(r=>r.id===k.reportId);return a?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${f(a.title)}</p>
          <label>标签
            <input name="tags" value="${f((a.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${_.map(r=>`<button type="button" class="${(a.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${f(r)}">${f(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(k.type==="group"){const a=k.mode==="edit"?b.groups.find(r=>r.id===k.groupId):null;return`
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
            <input name="name" value="${f((a==null?void 0:a.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${f((a==null?void 0:a.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${a?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=k.mode==="edit"?b.reports.find(a=>a.id===k.reportId):null,e=(t==null?void 0:t.groupId)||k.groupId||((i=b.groups[0])==null?void 0:i.id)||"";return`
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
            <input name="url" type="url" value="${f((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${f((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${b.groups.map(a=>`<option value="${f(a.id)}" ${a.id===e?"selected":""}>${f(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${Q.map(a=>`<option value="${f(a.id)}" ${a.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${f(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>关键标签
          <input name="tags" value="${f(((t==null?void 0:t.tags)||[]).join("、"))}" placeholder="本体、飞书、调研" />
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
    </main>`}function Ze(t){if(Gt(t.id))return xe(t,f);const e=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),i=["org","account"].includes(t.access),a=t.loginProvider||(t.access==="org"?"组织帐号":"站点帐号"),r=t.savedHtml||kt(t.savedContent,t.savedFiles),n=r?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${f(t.title)}"
          srcdoc="${f(r)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:e?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${f(t.title)}</h1>
          ${t.savedContent?`<div class="saved-material-content">${f(t.savedContent).replaceAll(`
`,"<br />")}</div>`:""}
          ${(t.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${t.savedFiles.map(c=>`<span><b>${f(c.name)}</b><small>${f(c.sizeLabel||"")}</small></span>`).join("")}
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
            <a class="primary-button" href="${f(t.url)}" target="_blank" rel="noreferrer">打开${f(a)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${f(j(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${f(t.title)}" src="${f(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${f(t.title)}</strong>
          <span>${e?"本地保存":f(j(t.url))}</span>
        </div>
        <div class="reader-actions">
          ${e?"":`
            <a class="${i?"primary-button":"quiet-button"}" href="${f(t.url)}" target="_blank" rel="noreferrer">${i?"登录打开 ↗":"新窗口 ↗"}</a>
            ${i?"":`<button class="primary-button" type="button" data-action="edit-document" data-id="${f(t.id)}">编辑文档</button>`}
            <button class="quiet-button" type="button" data-action="download-report" data-id="${f(t.id)}">下载 HTML</button>
            <button class="quiet-button" type="button" data-action="share-report" data-id="${f(t.id)}">分享</button>
            <button class="quiet-button" type="button" data-action="edit" data-id="${f(t.id)}">编辑信息</button>`}
        </div>
      </header>
      ${n}
      ${$t()}
    </main>`}function Xt(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${U?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>':""}
    </header>`}function ze(){const t=b.reports.filter(i=>i.archived).filter(i=>{if(!q.trim())return!0;const a=q.trim().toLowerCase();return`${i.title} ${i.url} ${i.source||""}`.toLowerCase().includes(a)}).sort((i,a)=>new Date(a.archivedAt||0)-new Date(i.archivedAt||0)),e=b.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${Xt()}
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
              <div><h2>${q?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(i=>Jt(i,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${q?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${q?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${q?"clear-search":"show-catalog"}">${q?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${$t()}
    </main>`}function _e(){if(U)return ze();const t=q.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),i=b.reports.filter(l=>!l.archived),a=e.length?i.filter(l=>{const p=`${l.title} ${l.source||""} ${l.access||""} ${pt(l.workType)} ${(l.tags||[]).join(" ")}`.toLowerCase();return e.every(u=>p.includes(u))}):i,r=b.reports.filter(l=>l.archived).length,n=i.filter(l=>l.access==="production").length,c=i.filter(l=>l.access!=="production").length,s=Fe(a,t).filter(l=>l.reports.length||D),d=S==="type"?"工作类型":S==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${Xt()}
      <section class="workspace">
        ${ne(f)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${i.length}</strong><span>成果</span>
              <i></i>
              <strong>${b.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${n}</strong><span>直达</span>
            </div>
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${f(q)}" placeholder="搜索标题、标签或来源" aria-label="搜索成果" />
              ${q?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        <section class="groups-section">
          ${D?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${N()}的“移到这里”，或直接拖动卡片。</span></div>
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
                ${s.map((l,p)=>`<a href="#bucket-${p}"><span class="nav-index">${String(p+1).padStart(2,"0")}</span>${f(l.name)}<span>${l.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${r?`<em>${r}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${S}">
              ${s.map((l,p)=>`
                <section id="bucket-${p}" class="group-column topic-section bucket-${f(l.kind)} accent-${f(l.accent||"blue")}"
                  data-bucket-kind="${f(l.kind)}"
                  data-bucket-id="${f(l.id)}"
                  ${l.kind==="topic"?`data-group-id="${f(l.id)}"`:""}>
                  <header class="group-header">
                    ${l.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${f(l.id)}"
                          aria-label="拖动“${f(l.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(p+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${l.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${f(l.name)}</h2></div>
                      <span class="count">${l.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${D?`<button class="move-here-button" type="button" data-action="move-here" data-id="${f(l.id)}" data-bucket-kind="${f(l.kind)}">移到这里</button>`:""}
                      ${l.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${f(l.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${f(l.id)}">编辑主题</button>
                           ${l.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${f(l.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${l.reports.length?l.reports.map(u=>Jt(u)).join(""):l.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${f(l.id)}">
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
            <span>${c} 份报告需要组织或账号登录${r?` · ${r} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${$t()}
    </main>`}function v(){const t=document.getElementById("app");if(sessionStorage.getItem(wt)!=="ok"){t.innerHTML=Ge(),Ke();return}const e=P&&b.reports.find(i=>i.id===P);t.innerHTML=e?Ze(e):_e(),Ve(),oe({render:v,showToast:I,saveToLibrary:Ne})}function Ke(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(wt,"ok"),v()})}async function We(t){const e=t.elements.url,i=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),n=e.value.trim();if(!at(n))return r.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const{title:c}=await Vt(n);if(!c)throw new Error("read failed");return i.value=c,r.textContent="已识别网页标题",i.value}catch{const c=j(n);return i.value||(i.value=c),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{a.disabled=!1,a.textContent="识别标题"}}function Ve(){var r;(r=document.getElementById("search-input"))==null||r.addEventListener("input",n=>{q=n.target.value,v();const c=document.getElementById("search-input");c==null||c.focus(),c==null||c.setSelectionRange(q.length,q.length)}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",async c=>{var l,p;const s=c.currentTarget.dataset.action,d=c.currentTarget.dataset.id;if(s==="open")P=d,v();else if(s==="edit-document"){const u=b.reports.find(g=>g.id===d);if(!u||u.access!=="production")return;Le(u,{render:v,showToast:I})}else if(s==="download-report"){const u=b.reports.find(g=>g.id===d);u&&await Zt(u,I)}else if(s==="share-report"){const u=b.reports.find(g=>g.id===d);u&&await Pe(u,I)}else if(s==="back")P="",k=null,v();else if(s==="lock")sessionStorage.removeItem(wt),v();else if(s==="clear-search")q="",v();else if(s==="set-view"){if(!["topic","type","tag"].includes(d))return;S=d,D="",localStorage.setItem(J,S),v()}else if(s==="cancel-move")D="",v();else if(s==="move-here"){const u=c.currentTarget.dataset.bucketKind||S;D&&z(D,u,d)&&(D="",v(),I(u==="tag"?"已添加目标标签":`报告已移入目标${N()}`))}else if(s==="show-archive")U=!0,q="",P="",v();else if(s==="show-catalog")U=!1,q="",P="",v();else if(s==="add-report")k={type:"report",mode:"create",groupId:((l=b.groups[1])==null?void 0:l.id)||((p=b.groups[0])==null?void 0:p.id)},v();else if(s==="add-to-group")k={type:"report",mode:"create",groupId:d},v();else if(s==="edit")k={type:"report",mode:"edit",reportId:d},v();else if(s==="edit-tags")k={type:"tags",reportId:d},v();else if(s==="close-modal")k=null,v();else if(s==="detect-title")await We(c.currentTarget.closest("form"));else if(s==="archive"){const u=b.reports.find(g=>g.id===d);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),x(),v(),I("已归档，可随时恢复")}else if(s==="restore"){const u=b.reports.find(g=>g.id===d);if(!u)return;u.archived=!1,u.archivedAt="",x(),v(),I("报告已恢复到原主题")}else if(s==="delete"){const u=b.reports.find(g=>g.id===d);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(b.reports=b.reports.filter(g=>g.id!==d),P===d&&(P=""),x(),v(),I("报告已永久删除"))}else if(s==="add-group")k={type:"group",mode:"create"},v();else if(s==="rename-group")b.groups.find(g=>g.id===d)&&(k={type:"group",mode:"edit",groupId:d},v());else if(s==="delete-group"){const u=b.groups.find(g=>g.id===d);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(b.reports.forEach(g=>{g.groupId===d&&(g.groupId="inbox")}),b.groups=b.groups.filter(g=>g.id!==d),x(),v(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(n=>{let c=null,s=!1;const d=()=>{var l;C="",c=null,s=!1,(l=n.closest(".report-card"))==null||l.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",l=>{var p,u;l.preventDefault(),C=n.dataset.reportDragId,L="",c={x:l.clientX,y:l.clientY},s=!1,(p=n.setPointerCapture)==null||p.call(n,l.pointerId),(u=n.closest(".report-card"))==null||u.classList.add("is-dragging")}),n.addEventListener("pointermove",l=>{if(!C||c&&Math.hypot(l.clientX-c.x,l.clientY-c.y)<7)return;s=!0;const p=document.elementFromPoint(l.clientX,l.clientY),u=p==null?void 0:p.closest(".report-card"),g=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(y=>{y.classList.toggle("is-card-drop-target",!!(u&&u!==n.closest(".report-card")&&y===u))}),document.querySelectorAll(".group-column").forEach(y=>{y.classList.toggle("is-drop-ready",!!(g&&y===g))})}),n.addEventListener("pointerup",l=>{if(!C)return;const p=C;if(!s){D=p,d(),v(),I(`请选择目标${N()}`);return}const u=document.elementFromPoint(l.clientX,l.clientY),g=u==null?void 0:u.closest(".report-card"),y=u==null?void 0:u.closest(".group-column"),$=(g==null?void 0:g.dataset.reportId)||"",m=(y==null?void 0:y.dataset.bucketId)||"",w=(y==null?void 0:y.dataset.bucketKind)||S,h=$&&$!==p?z(p,w,m,$):m?z(p,w,m):!1;d(),h&&(v(),I(w==="tag"?"已添加目标标签":w==="type"?"工作类型已更新":$?"报告顺序已更新":"已移入新主题"))}),n.addEventListener("pointercancel",d)}),document.querySelectorAll(".group-drag-handle").forEach(n=>{const c=()=>{var s;L="",(s=n.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(d=>{d.classList.remove("is-group-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",s=>{var d,l;s.preventDefault(),L=n.dataset.groupDragId,C="",(d=n.setPointerCapture)==null||d.call(n,s.pointerId),(l=n.closest(".group-column"))==null||l.classList.add("is-group-dragging")}),n.addEventListener("pointermove",s=>{L&&document.querySelectorAll(".group-column").forEach(d=>{var l;d.classList.toggle("is-group-drop-target",d===((l=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:l.closest(".group-column")))})}),n.addEventListener("pointerup",s=>{var p;if(!L)return;const d=L,l=(p=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:p.closest(".group-column");if(l&&ot(d,l.dataset.groupId)){L="",v(),I("分组顺序已更新");return}c()}),n.addEventListener("pointercancel",c),n.addEventListener("keydown",s=>{var u;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const d=b.groups.findIndex(g=>g.id===n.dataset.groupDragId),l=s.key==="ArrowLeft"?d-1:d+1,p=b.groups[l];!p||!ot(n.dataset.groupDragId,p.id)||(v(),I("分组顺序已更新"),(u=document.querySelector(`[data-group-drag-id="${CSS.escape(n.dataset.groupDragId)}"]`))==null||u.focus())})}),document.querySelectorAll(".group-column").forEach(n=>{n.addEventListener("dragover",c=>{c.preventDefault(),n.classList.add(L?"is-group-drop-target":"is-drop-ready")}),n.addEventListener("dragleave",()=>{n.classList.remove("is-drop-ready","is-group-drop-target")}),n.addEventListener("drop",c=>{if(c.preventDefault(),L){if(n.dataset.bucketKind==="topic"&&ot(L,n.dataset.groupId)){L="",v(),I("分组顺序已更新");return}L="",n.classList.remove("is-group-drop-target");return}const s=b.reports.find(l=>l.id===C),d=n.dataset.bucketKind||S;s&&z(C,d,n.dataset.bucketId)&&(C="",v(),I(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":"已移入新主题")),C=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(n=>{n.addEventListener("click",()=>{const c=document.querySelector('#tag-form input[name="tags"]');if(!c)return;const s=st(c.value),d=n.dataset.tagSuggestion;c.value=s.includes(d)?s.filter(l=>l!==d).join("、"):[...s,d].slice(0,8).join("、"),n.classList.toggle("selected",!s.includes(d)),c.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",n=>{n.preventDefault();const c=b.reports.find(s=>s.id===k.reportId);c&&(c.tags=st(new FormData(t).get("tags")),x(),k=null,v(),I("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",n=>{var l,p;n.preventDefault();const c=(l=new FormData(e).get("name"))==null?void 0:l.trim(),s=(p=new FormData(e).get("description"))==null?void 0:p.trim();if(!c)return;if(k.mode==="edit"){const u=b.groups.find(g=>g.id===k.groupId);if(!u)return;u.name=c.slice(0,60),u.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else b.groups.push({id:mt("group"),name:c.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][b.groups.length%4],position:b.groups.length});x();const d=k.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";k=null,v(),I(d)});const i=document.getElementById("report-form");i==null||i.addEventListener("submit",async n=>{n.preventDefault();const c=i.elements.url.value.trim();if(!at(c))return;const s=i.querySelector('button[type="submit"]'),d=i.querySelector(".field-hint");s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';const l=k.mode==="edit"?k.reportId:"",p=Kt({material:c,files:[],url:c,excludeId:l});if(p){s.disabled=!1,s.textContent="保存",d.textContent=`成果库已有“${p.title}”，未重复保存`,I(`成果库已有“${p.title}”，未重复保存`);return}const u=await Yt({material:c,files:[],url:c},T=>{d.textContent=T});if(!u.allowed){s.disabled=!1,s.textContent="保存",d.textContent=u.reason,I(u.reason);return}let g=i.elements.title.value.trim()||u.metadata.title;const y=i.elements.groupId.value,$=i.elements.workType.value,m=st(i.elements.tags.value),w={title:g||j(c),url:c,groupId:y,workType:$,source:"手动添加",access:u.access,detectedDescription:u.metadata.description,manualSaved:!0,isProduction:u.access==="production",isPersonal:Wt(c),isHtml:u.isHtml,loginProvider:u.loginProvider},h=[...new Set([...et(w,$),...m])].slice(0,8);if(k.mode==="edit"){const T=b.reports.find(O=>O.id===k.reportId);Object.assign(T,w,{tags:h})}else{const T={id:mt("report"),groupId:y,...w,pinned:!1,position:b.reports.filter(O=>O.groupId===y).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:"",tags:h};b.reports.push(T)}x(),k=null,v(),I("报告已保存")});const a=P&&b.reports.find(n=>n.id===P);a&&Ce(a)}function Ye(){v()}Ye(document.getElementById("app"));
