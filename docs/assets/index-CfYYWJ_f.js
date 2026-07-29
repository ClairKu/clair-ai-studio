(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function a(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(r){if(r.ep)return;r.ep=!0;const n=a(r);fetch(r.href,n)}})();const qt="clair-ai-studio-tasks-v1",Gt=[{id:"save",name:"保存",hint:"自动识别并进入成果库"},{id:"execute",name:"执行任务",hint:"自动匹配合适的评审 Skill"}],yt=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let w=nt();function nt(){return{action:"save",material:"",files:[]}}function Et(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function _t(t){var r;const e=t.toLowerCase(),i=((r=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(c=>e.includes(c))))==null?void 0:r[0])||"solution";return yt.find(n=>n.id===i)||yt[1]}function zt(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function B(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let r="";if(i&&a.size<=1024*1024)try{r=(await a.text()).slice(0,12e3)}catch{r=""}return{id:Et(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:zt(a.size),excerpt:r}}))}function Kt(t){return w.files.length?`<div class="attachment-list">${w.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function Wt(t){return Gt.map(e=>`
    <button class="intake-action ${w.action===e.id?"selected":""}" type="button"
      data-task-action="choose-action" data-action-id="${e.id}"
      aria-pressed="${w.action===e.id}" title="${t(e.hint)}">
      <strong>${t(e.name)}</strong>
    </button>`).join("")}function Vt(t){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3"
            placeholder="直接粘贴文字、链接，或拖入文档、图片……"
            aria-label="新增内容">${t(w.material)}</textarea>
        </div>
        ${Kt(t)}
        <div class="prompt-footer">
          <div class="prompt-material-actions">
            <label class="prompt-file-button" for="task-files">
              <input id="task-files" type="file" multiple />
              <span aria-hidden="true">＋</span>
              <strong>材料</strong>
            </label>
            <span class="paste-hint">输入框粘贴 · 页面直接 ⌘V · 可拖入文件</span>
          </div>
          <div class="intake-actions simple-intake-actions" aria-label="处理方式">
            ${Wt(t)}
          </div>
          <button class="prompt-submit" type="submit"
            aria-label="${w.action==="save"?"保存到成果库":"执行任务"}">
            <span>${w.action==="save"?"保存":"执行"}</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
    </section>`}function Yt({render:t,showToast:e,saveToLibrary:a}){document.querySelectorAll("[data-task-action]").forEach(s=>{s.addEventListener("click",d=>{const l=d.currentTarget.dataset.taskAction;l==="choose-action"?(R(),w.action=d.currentTarget.dataset.actionId,t(),requestAnimationFrame(ot)):l==="remove-file"&&(R(),w.files=w.files.filter(p=>p.id!==d.currentTarget.dataset.fileId),t())})});const i=document.getElementById("task-composer");i==null||i.addEventListener("submit",async s=>{var y;if(s.preventDefault(),R(),!w.material.trim()&&!w.files.length){e("先粘贴内容，或加入一份材料"),(y=document.getElementById("task-goal"))==null||y.focus();return}const d=i.querySelector(".prompt-submit");d.disabled=!0;const l={material:w.material.trim(),files:w.files};if(w.action==="save"){try{const A=await a(l);w=nt(),t(),e(`已保存：${A.title} · ${A.groupName} · ${A.workTypeName}`)}catch{d.disabled=!1,e("保存失败，请稍后重试")}return}const p=_t([l.material,...l.files.map(A=>`${A.name}
${A.excerpt}`)].join(`
`)),u=new Date().toISOString(),m=Jt();m.push({id:Et(),title:Xt(l),skillId:p.id,skillName:p.name,material:l.material,files:l.files,status:"queued",createdAt:u,updatedAt:u}),localStorage.setItem(qt,JSON.stringify(m)),w=nt(),t(),e(`已执行任务，并匹配“${p.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async s=>{R(),w.files.push(...await B(s.target.files)),t(),e(`已加入 ${s.target.files.length} 个文件`)});const n=document.querySelector(".prompt-composer");n==null||n.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async s=>{s.preventDefault(),s.stopPropagation(),n.classList.remove("drag-over"),R();const d=s.dataTransfer.files;w.files.push(...await B(d)),t(),e(`已加入 ${d.length} 个文件`)});const c=document.getElementById("task-goal");c==null||c.addEventListener("input",()=>{w.material=c.value}),c==null||c.addEventListener("paste",async s=>{var m;const d=[...((m=s.clipboardData)==null?void 0:m.items)||[]].filter(y=>y.kind==="file").map(y=>y.getAsFile()).filter(Boolean);if(!d.length)return;s.preventDefault();const l=s.clipboardData.getData("text/plain"),p=c.selectionStart??c.value.length,u=c.selectionEnd??p;w.material=`${c.value.slice(0,p)}${l}${c.value.slice(u)}`,w.files.push(...await B(d)),t(),e(`已从剪贴板加入 ${d.length} 个材料`)}),te({render:t,showToast:e})}function Jt(){try{const t=JSON.parse(localStorage.getItem(qt));return Array.isArray(t)?t:[]}catch{return[]}}function Xt(t){var a;return(t.material.split(/\n/).map(i=>i.trim()).find(Boolean)||((a=t.files[0])==null?void 0:a.name)||"未命名任务").replace(/[。；;！!？?]+$/,"").slice(0,64)}function R(){const t=document.getElementById("task-goal");t&&(w.material=t.value)}function ot(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function Qt(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function te({render:t,showToast:e}){document.onpaste=async a=>{var c,s;if(Qt(a.target)||!document.querySelector(".prompt-composer"))return;const r=[...((c=a.clipboardData)==null?void 0:c.items)||[]].filter(d=>d.kind==="file").map(d=>d.getAsFile()).filter(Boolean),n=((s=a.clipboardData)==null?void 0:s.getData("text/plain"))||"";!r.length&&!n.trim()||(a.preventDefault(),w.material=[w.material.trim(),n.trim()].filter(Boolean).join(`

`),r.length&&w.files.push(...await B(r)),t(),requestAnimationFrame(ot),e(r.length?`已从剪贴板加入 ${r.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=a=>{var i;[...((i=a.dataTransfer)==null?void 0:i.types)||[]].includes("Files")&&a.preventDefault()},document.ondrop=async a=>{var r,n,c;if((n=(r=a.target)==null?void 0:r.closest)!=null&&n.call(r,".prompt-composer"))return;const i=((c=a.dataTransfer)==null?void 0:c.files)||[];i.length&&(a.preventDefault(),w.files.push(...await B(i)),t(),requestAnimationFrame(ot),e(`已拖入 ${i.length} 个文件`))}}const V="clair-report-editor-v1",ee="https://api.github.com",Tt="2026",ae="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:null,showToast:null},_=new Map;let wt=!1;function ut(t){return[...new Set(t.filter(Boolean))]}function st(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function pt(t){return`${ae}${t}`}function ie(t){try{const e=sessionStorage.getItem(pt(t));if(!e)return null;const a=JSON.parse(e);return!(a!=null&&a.html)||typeof a.html!="string"?null:a}catch{return null}}function Lt(t=o.reportId){try{sessionStorage.removeItem(pt(t))}catch{}}function xt(){return o.dirty&&o.hasDraft?{tone:"changed",label:"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:"生产档案已更新"}:{tone:"clean",label:"未修改"}}function z(){const t=xt(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const a=document.querySelector('[data-editor-action="stash"]');a&&(a.disabled=o.status!=="ready"||o.saving||!o.dirty,a.textContent=!o.dirty&&o.hasDraft?"已暂存":"暂存");const i=document.querySelector('[data-editor-action="publish"]');i&&(i.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft,i.textContent=o.saving?"推送中…":"推送生产");const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function re(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function ne(t){const e=atob(String(t||"").replace(/\s/g,"")),a=Uint8Array.from(e,i=>i.charCodeAt(0));return new TextDecoder().decode(a)}function oe(t){const e=new TextEncoder().encode(t);let a="";const i=32768;for(let r=0;r<e.length;r+=i)a+=String.fromCharCode(...e.subarray(r,r+i));return btoa(a)}function tt(t){let e="";for(let i=0;i<t.length;i+=32768)e+=String.fromCharCode(...t.subarray(i,i+32768));return btoa(e)}function et(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Ct(t,e){const a=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},a,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function kt(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const a=JSON.parse(e[1]),i=et(a.salt),r=et(a.iv),n=await Ct(Tt,i),c=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},n,et(a.data)),s=new TextDecoder().decode(c);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function mt(t){var c;if(((c=o.protection)==null?void 0:c.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),a=crypto.getRandomValues(new Uint8Array(12)),i=await Ct(Tt,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:a},i,new TextEncoder().encode(t)),n=JSON.stringify({salt:tt(e),iv:tt(a),data:tt(new Uint8Array(r))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,n)}function se(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const a=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),i=a.shift()||"ClairKu.github.io";let r=a.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const n=ut([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:i,branch:"main",path:n[0],candidates:n,source:"auto"}}catch{return null}}async function K(t,{token:e="",method:a="GET",body:i}={}){var c;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),i!==void 0&&(r["Content-Type"]="application/json");const n=await fetch(`${ee}${t}`,{method:a,headers:r,body:i===void 0?void 0:JSON.stringify(i)});if(!n.ok){let s="";try{s=((c=await n.json())==null?void 0:c.message)||""}catch{s=await n.text()}const d=new Error(s||`GitHub API ${n.status}`);throw d.status=n.status,d}return n.status===204?null:n.json()}async function ce(t){var c;const e=await K(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const a=ut((c=t.candidates)!=null&&c.length?t.candidates:[t.path]);let i=null,r=null;const n=[];for(const s of a)try{const d=s.split("/").map(encodeURIComponent).join("/"),l=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${d}?ref=${encodeURIComponent(t.branch)}`,p=await K(l);let u="";if(p.encoding==="base64"&&p.content)u=ne(p.content);else if(p.download_url){const m=await fetch(p.download_url,{cache:"no-store"});if(!m.ok)throw new Error("无法读取 GitHub 原始文件");u=await m.text()}if(!u)throw new Error("GitHub 文件内容为空");r?u===r.html&&n.push({path:s,sha:p.sha}):r={html:u,target:{...t,path:s,sha:p.sha,candidates:a}}}catch(d){if(i=d,d.status&&![403,404].includes(d.status))break}if(r)return r.target.mirrors=n,r;throw i||new Error("没有找到对应的 GitHub HTML 文件")}function le(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(i=>{/^on/i.test(i.name)&&(e.setAttribute(`data-clair-event-${i.name.toLowerCase()}`,i.value),e.removeAttribute(i.name))});const a=e.getAttribute("href");a&&/^\s*javascript:/i.test(a)&&(e.dataset.clairJavascriptHref=a,e.removeAttribute("href"))})}function de(){return`
(() => {
  const channel = ${JSON.stringify(V)};
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
`}function ue(t,e){const i=new DOMParser().parseFromString(t,"text/html");i.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),le(i);const r=i.createElement("base");r.href=e,r.dataset.clairEditorBase="true",i.head.prepend(r);const n=i.createElement("style");n.id="clair-editor-style",n.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,i.head.append(n);const c=i.createElement("script");return c.id="clair-editor-bridge",c.textContent=de(),i.body.append(c),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}async function Dt(t){var e;try{const a=se(t.url);let i=null;if(a)try{i=await ce(a)}catch{}if(!i){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);i={html:await s.text(),target:a}}const r=await kt(i.html);o.protection=r.protection,o.target=i.target||a;let n=r.html;const c=ie(t.id);if(c!=null&&c.html)try{const s=await kt(c.html);n=s.html,o.hasDraft=!0,o.draftHtml=s.html,o.draftAt=c.savedAt||"",c.baseFiles&&o.target&&(o.target.baseFiles=c.baseFiles)}catch{Lt(t.id)}o.html=n,o.editorDocument=ue(n,t.url),o.status="ready",o.error=""}catch(a){o.status="error",o.error=(a==null?void 0:a.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function Pt(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:t,showToast:e})}function gt(){return document.querySelector(".report-editor-frame")}function at(t,e=null){var i;const a=gt();(i=a==null?void 0:a.contentWindow)==null||i.postMessage({channel:V,type:"command",command:t,value:e},"*")}function ft(){var a;const t=gt();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((i,r)=>{const n=window.setTimeout(()=>{_.delete(e),r(new Error("读取编辑内容超时"))},1e4);_.set(e,{resolve:c=>{clearTimeout(n),i(c)}}),t.contentWindow.postMessage({channel:V,type:"serialize",requestId:e},"*")})}function pe(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Ot(t,e){const a=new Blob([t],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(a),r=document.createElement("a");r.href=i,r.download=pe(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),1e3)}async function Rt(t){await navigator.clipboard.writeText(t)}function me(t,e){var r;const a=new DOMParser().parseFromString(t,"text/html");(r=a.querySelector("base[data-clair-preview-base]"))==null||r.remove();const i=a.createElement("base");return i.href=e,i.dataset.clairPreviewBase="true",a.head.prepend(i),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function ge(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([me(o.draftHtml,t.url)],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(e),i=window.open(a,"_blank");if(!i)throw URL.revokeObjectURL(a),new Error("浏览器拦截了新窗口，请允许弹窗后重试");i.opener=null,window.setTimeout(()=>URL.revokeObjectURL(a),6e4)}async function ct(t,{silent:e=!1}={}){var n;const a=await ft(),i=await mt(a),r=new Date().toISOString();try{sessionStorage.setItem(pt(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:st(),html:i}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=a,o.draftHtml=a,o.draftAt=r,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",z(),e||(n=o.showToast)==null||n.call(o,"已暂存在当前浏览器会话，尚未更新 GitHub"),a}async function fe(t){var s,d;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const a=await mt(t),i=(e.mirrors||[]).map(l=>l.path),r=ut([...i.filter(l=>l.startsWith("public/")),...i.filter(l=>!l.startsWith("public/")&&l!==e.path),e.path]);let n="";const c=[];for(const l of r)try{const p=l.split("/").map(encodeURIComponent).join("/"),u=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${p}`,m=await K(`${u}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),y=st(e)[l];if(y&&m.sha!==y)throw new Error(`生产文件 ${l} 已在本次编辑后更新，请重新打开报告合并修改`);const A=await K(u,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:oe(a),sha:m.sha,branch:e.branch}});n=((s=A==null?void 0:A.commit)==null?void 0:s.sha)||n,e.baseFiles={...st(e),[l]:((d=A==null?void 0:A.content)==null?void 0:d.sha)||m.sha},c.push(l)}catch(p){throw c.length?new Error(`已更新 ${c.join("、")}，但 ${l} 同步失败：${p.message}`):p}return{commit:n,files:c.length}}async function $t(t){var e,a;if(!o.saving){o.saving=!0,z();try{const i=o.dirty?await ct(t,{silent:!0}):o.draftHtml||await ft(),r=await fe(i);o.html=i,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=r.commit,Lt(t.id),(e=o.showToast)==null||e.call(o,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(i){(a=o.showToast)==null||a.call(o,(i==null?void 0:i.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,z()}}}function he(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
    </div>`}function be(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
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
    </div>`}function At({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const a=e.querySelector("#editor-settings-form"),i=o.target||{};if(a){a.elements.owner.value=i.owner||"ClairKu",a.elements.repository.value=i.repository||"",a.elements.branch.value=i.branch||"main",a.elements.path.value=i.path||"";const r=a.querySelector('button[type="submit"]');r&&(r.textContent=t?"连接并保存":"保存设置")}}function j(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function ve(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function F(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Bt(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function ye(t,{render:e,showToast:a}){Pt(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:a}),e(),o.loadPromise=Dt(t)}function we(t,e){var c;const a=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(c=o.target.mirrors)!=null&&c.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",i=xt(),r=o.status==="ready"?`
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
          sandbox="allow-scripts allow-modals" srcdoc="${re(o.editorDocument)}"></iframe></div>`;return`
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
      ${r}
      ${n}
      ${he(e)}
      ${be(e)}
    </main>`}function ke(t){if(!Bt(t.id))return;wt||(wt=!0,window.addEventListener("message",i=>{var n;const r=gt();if(!(!(r!=null&&r.contentWindow)||i.source!==r.contentWindow)&&((n=i.data)==null?void 0:n.channel)===V){if(i.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",z()),i.data.type==="serialized"){const c=_.get(i.data.requestId);if(!c)return;_.delete(i.data.requestId),c.resolve(i.data.html)}i.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(c=>{const s=c.dataset.editorCommand;["bold","italic","underline"].includes(s)&&c.classList.toggle("active",!!i.data[s])})}}),window.addEventListener("beforeunload",i=>{!o.reportId||!o.dirty||(i.preventDefault(),i.returnValue="")}),window.addEventListener("keydown",i=>{i.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?F():o.settingsOpen&&j())})),document.querySelectorAll("[data-editor-command]").forEach(i=>{i.addEventListener("mousedown",r=>r.preventDefault()),i.addEventListener("click",()=>at(i.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{at("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(i=>{i.addEventListener("click",async()=>{var n,c,s,d,l,p,u,m,y,A,g,$;const r=i.dataset.editorAction;if(r==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const b=o.render;Pt(),b==null||b()}else if(r==="settings")At();else if(r==="close-settings")j();else if(r==="stash")try{await ct(t)}catch(b){(n=o.showToast)==null||n.call(o,(b==null?void 0:b.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{ge(t),(c=o.showToast)==null||c.call(o,"已在新窗口打开暂存修订")}catch(b){(s=o.showToast)==null||s.call(o,(b==null?void 0:b.message)||"无法打开预览")}else if(r==="publish")try{if(o.dirty&&await ct(t,{silent:!0}),!o.hasDraft){(d=o.showToast)==null||d.call(o,"当前没有待推送的修订");return}ve()}catch(b){(l=o.showToast)==null||l.call(o,(b==null?void 0:b.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")F();else if(r==="confirm-publish")F(),!o.token||!((p=o.target)!=null&&p.path)?At({pendingSave:!0}):await $t(t);else if(r==="download")try{const b=await ft();Ot(await mt(b),t.title),(u=o.showToast)==null||u.call(o,"HTML 已下载")}catch(b){(m=o.showToast)==null||m.call(o,(b==null?void 0:b.message)||"下载失败")}else if(r==="download-published")await Mt(t,o.showToast);else if(r==="share")try{await Rt(t.url),(y=o.showToast)==null||y.call(o,"报告链接已复制")}catch{(A=o.showToast)==null||A.call(o,"复制失败，请从地址栏复制")}else if(r==="link"){const b=prompt("输入链接地址（https://…）");if(!b)return;try{const P=new URL(b);if(!["http:","https:","mailto:"].includes(P.protocol))throw new Error;at("createLink",P.href)}catch{(g=o.showToast)==null||g.call(o,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(o.status="loading",o.error="",($=o.render)==null||$.call(o),o.loadPromise||(o.loadPromise=Dt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(i=>{i.addEventListener("click",r=>{r.target===i&&(i.classList.contains("editor-settings-backdrop")?j():F())})});const a=document.getElementById("editor-settings-form");a==null||a.addEventListener("submit",async i=>{var l,p,u;i.preventDefault();const r=new FormData(a),n=String(r.get("github-token-not-password")||"").trim();n&&(o.token=n);const c=String(r.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:c,mirrors:c===((l=o.target)==null?void 0:l.path)?((p=o.target)==null?void 0:p.mirrors)||[]:[],source:"manual"};const s=o.pendingSave;j();const d=document.querySelector(".editor-target-label");if(d){const m=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;d.textContent=m,d.title=m}(u=o.showToast)==null||u.call(o,"保存权限已连接"),s&&await $t(t)})}async function Mt(t,e){try{const a=await fetch(t.url,{cache:"no-store"});if(!a.ok)throw new Error;Ot(await a.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function $e(t,e){try{await Rt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const ht="clair-service-report-workbench-v1",bt="clair-service-report-workbench-access",W="clair-service-report-workbench-view",D=6,Y=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],G=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],O={version:D,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},lt={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},Ut={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function J(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|工作台|原型/.test(e)?"product-demo":"product-planning"}function X(t,e=J(t)){const a=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""}`,i=[],r=n=>{i.includes(n)||i.push(n)};return/ontology\.yingmi-inc\.com|本体/.test(a)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(a)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(a))&&r("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(a)||t.groupId==="xiaogu")&&r("AI 小顾"),(/workbench|工作台|skill-audit/.test(a)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(a)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(a)&&r("且慢"),/投顾|advisor|财务规划/.test(a)&&r("投顾服务"),/OAP|oap-/.test(a)&&r("OAP"),/MCP|mcp-/.test(a)&&r("MCP"),/Skills|skill-/.test(a)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),i.slice(0,5)}function Ae(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/工作台|生产力|Copilot|编辑器/.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":"inbox"}O.reports=O.reports.map(t=>{const e=Ut[t.id]||t.groupId,a=lt[t.id]||J(t),i={...t,groupId:e,workType:a};return{...i,tags:X(i,a)}});let h=Ie(),q="",x="",U=!1,I=["topic","type","tag"].includes(localStorage.getItem(W))?localStorage.getItem(W):"topic",L="",E="",C="",k=null,It=0;function Ht(t){return JSON.parse(JSON.stringify(t))}function M(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function Ie(){try{const t=JSON.parse(localStorage.getItem(ht));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Se(t)}catch{}return Ht(O)}function Se(t){const e=Ht(O),a=new Set(e.groups.map(g=>g.id)),i=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(g=>[g.id,g])),n=e.groups.map(g=>{const $=r.get(g.id);return!$||t.version<D?g:{...g,name:$.name||g.name,description:$.description||g.description,position:Number.isFinite($.position)?$.position:g.position}});t.groups.filter(g=>!a.has(g.id)&&!i.has(g.id)).forEach((g,$)=>{n.push({...g,description:g.description||"自定义工作分组",position:Number.isFinite(g.position)?g.position:O.groups.length+$})});const c=n.filter((g,$,b)=>b.findIndex(P=>P.id===g.id)===$);c.sort((g,$)=>(g.position||0)-($.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},d={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},l=t.reports.map(g=>({...g,groupId:Ut[g.id]||s[g.id]||d[g.groupId]||g.groupId||"inbox",workType:g.workType||lt[g.id]||J(g),tags:Array.isArray(g.tags)&&g.tags.length?g.tags:X(g,g.workType||lt[g.id])})),p=new Map(l.map(g=>[g.id,g])),u=new Map(l.map(g=>[M(g.url),g])),m=new Set,y=e.reports.map(g=>{const $=M(g.url);m.add($);const b=p.get(g.id)||u.get($);return b?{...g,title:b.title||g.title,groupId:t.version>=D&&c.some(P=>P.id===b.groupId)?b.groupId:g.groupId,workType:t.version>=D&&b.workType?b.workType:g.workType,tags:t.version>=D&&Array.isArray(b.tags)&&b.tags.length?b.tags:g.tags,pinned:!!b.pinned,position:Number.isFinite(b.position)?b.position:g.position,archived:!!b.archived,archivedAt:b.archivedAt||""}:g});l.forEach(g=>{const $=M(g.url);m.has($)||(m.add($),y.push(g))});const A={version:D,groups:c,reports:y};return localStorage.setItem(ht,JSON.stringify(A)),A}function T(){h.version=D,h.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(ht,JSON.stringify(h))}function qe(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(Q)||""}function Ee(t,e,a){var r;const i=String(t).split(/\n/).map(n=>n.trim().replace(/^#+\s*/,"")).find(n=>n&&!/^https?:\/\//i.test(n));return i?i.replace(/[。；;！!？?]+$/,"").slice(0,100):(r=e[0])!=null&&r.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):a?N(a):"未命名成果"}async function Nt(t){var e,a;if(!Q(t))return"";try{const i=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,r=await fetch(i,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!r.ok)throw new Error("read failed");const n=await r.json();return((a=(e=n==null?void 0:n.data)==null?void 0:e.title)==null?void 0:a.trim().slice(0,180))||""}catch{return""}}async function Te({material:t,files:e}){var p;const a=qe(t),i=Ee(t,e,a),n=!!a&&t.replace(a,"").replace(/\s+/g,"").length===0&&!e.length?await Nt(a):"",c=new Date().toISOString(),s={id:dt("report"),groupId:"inbox",title:n||i,url:a,pinned:!1,position:0,createdAt:c,source:a?"快捷保存":"本地保存",access:/feishu\.cn|yingmi-inc\.com|docs\.qq\.com/i.test(a)?"org":"production",archived:!1,archivedAt:"",savedContent:t,savedFiles:e};s.workType=J(s),s.groupId=Ae(s),s.tags=X(s,s.workType),s.position=h.reports.filter(u=>!u.archived&&u.groupId===s.groupId).length;const d=a?h.reports.find(u=>M(u.url)===M(a)):null;d?Object.assign(d,{title:s.title,groupId:s.groupId,workType:s.workType,tags:s.tags,source:s.source,access:s.access,savedContent:s.savedContent,savedFiles:s.savedFiles,archived:!1,archivedAt:""}):h.reports.push(s),T(),U=!1,I="topic",q="",localStorage.setItem(W,I);const l=d||s;return{...l,groupName:((p=h.groups.find(u=>u.id===l.groupId))==null?void 0:p.name)||"待整理",workTypeName:jt(l.workType)}}function it(t,e){const a=h.groups.findIndex(n=>n.id===t),i=h.groups.findIndex(n=>n.id===e);if(a<0||i<0||a===i)return!1;const[r]=h.groups.splice(a,1);return h.groups.splice(i,0,r),T(),!0}function Le(t,e,a=""){const i=h.reports.find(s=>s.id===t);if(!i||i.archived||!h.groups.find(s=>s.id===e))return!1;const n=h.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,d)=>(s.position||0)-(d.position||0)),c=a?n.findIndex(s=>s.id===a):n.length;return i.groupId=e,n.splice(c<0?n.length:c,0,i),n.forEach((s,d)=>{s.position=d}),T(),!0}function jt(t){var e;return((e=Y.find(a=>a.id===t))==null?void 0:e.name)||"产品规划"}function xe(t,e=""){const a=i=>!e||i.toLowerCase().includes(e);if(I==="type")return Y.map(i=>({id:i.id,name:i.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===i.id).sort((r,n)=>+!!n.pinned-+!!r.pinned||new Date(n.createdAt)-new Date(r.createdAt))})).filter(i=>!e||i.reports.length||a(i.name));if(I==="tag"){const i=new Set(G);return h.reports.forEach(n=>{(n.tags||[]).forEach(c=>i.add(c))}),[...i].sort((n,c)=>{const s=G.indexOf(n),d=G.indexOf(c);return s>=0||d>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(d<0?Number.MAX_SAFE_INTEGER:d):n.localeCompare(c,"zh-CN")}).map(n=>({id:n,name:n,kind:"tag",accent:"violet",reports:t.filter(c=>(c.tags||[]).includes(n)).sort((c,s)=>+!!s.pinned-+!!c.pinned||new Date(s.createdAt)-new Date(c.createdAt))})).filter(n=>n.reports.length&&(!e||a(n.name)||n.reports.length))}return h.groups.map(i=>({...i,kind:"topic",reports:t.filter(r=>r.groupId===i.id).sort((r,n)=>(r.position||0)-(n.position||0))})).filter(i=>!e||i.reports.length||a(`${i.name} ${i.description||""}`))}function Z(t,e,a,i=""){const r=h.reports.find(n=>n.id===t);return!r||r.archived?!1:e==="topic"?Le(t,a,i):e==="type"?Y.some(n=>n.id===a)?(r.workType=a,T(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(a)||r.tags.push(a),T(),!0):!1}function H(){return I==="type"?"工作类型":I==="tag"?"标签":"主题"}function dt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function f(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function N(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function Q(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function rt(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function S(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(It),It=window.setTimeout(()=>e.remove(),2600)}function Ft(t,e=!1){const a=!!t.savedContent&&!t.url,i=t.access!=="production",r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",c=!i&&O.reports.some(s=>s.id===t.id)?`<img src="./previews/${f(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${i?"preview-restricted":""}">
        <span>${i?"ACCESS":f(t.title.slice(0,2))}</span>
        <strong>${i?r:a?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${i?"restricted-card":""} ${e?"archived-card":""} ${C===t.id?"is-move-selected":""}" data-report-id="${f(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${f(t.id)}" aria-label="打开${f(t.title)}">
        <span class="report-preview">
          ${c}
        </span>
        <span class="report-copy">
          <span class="report-source">${f(t.source||"手动添加")}</span>
          <strong>${f(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(s=>`<span>${f(s)}</span>`).join("")}</span>`:""}
          ${i?`<span class="report-access-note">${f(r)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${f(t.id)}"
          aria-label="拖动《${f(t.title)}》到其他${H()}" title="拖动到其他${H()}">
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
    </article>`}function vt(){var a;if(!k)return"";if(k.type==="tags"){const i=h.reports.find(r=>r.id===k.reportId);return i?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${f(i.title)}</p>
          <label>标签
            <input name="tags" value="${f((i.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${G.map(r=>`<button type="button" class="${(i.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${f(r)}">${f(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(k.type==="group"){const i=k.mode==="edit"?h.groups.find(r=>r.id===k.groupId):null;return`
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
            <input name="name" value="${f((i==null?void 0:i.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${f((i==null?void 0:i.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">${i?"保存修改":"创建主题"}</button>
          </div>
        </form>
      </div>`}const t=k.mode==="edit"?h.reports.find(i=>i.id===k.reportId):null,e=(t==null?void 0:t.groupId)||k.groupId||((a=h.groups[0])==null?void 0:a.id)||"";return`
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
            ${h.groups.map(i=>`<option value="${f(i.id)}" ${i.id===e?"selected":""}>${f(i.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${Y.map(i=>`<option value="${f(i.id)}" ${i.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${f(i.name)}</option>`).join("")}
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
    </div>`}function Ce(){return`
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
    </main>`}function De(t){if(Bt(t.id))return we(t,f);const e=!!t.savedContent&&!t.url,a=t.access!=="production",i=t.access==="org"?"组织账号":"站点账号",r=e?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${f(t.title)}</h1>
          ${t.savedContent?`<div class="saved-material-content">${f(t.savedContent).replaceAll(`
`,"<br />")}</div>`:""}
          ${(t.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${t.savedFiles.map(n=>`<span><b>${f(n.name)}</b><small>${f(n.sizeLabel||"")}</small></span>`).join("")}
              </section>`:""}
          <p class="saved-material-note">内容保存在当前浏览器；原文件不会上传到 GitHub Pages。</p>
        </article>
      </div>`:a?`
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
            <a class="primary-button" href="${f(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${f(N(t.url))}</p>
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
          <span>${e?"本地保存":f(N(t.url))}</span>
        </div>
        <div class="reader-actions">
          ${e?"":`
            <a class="${a?"primary-button":"quiet-button"}" href="${f(t.url)}" target="_blank" rel="noreferrer">${a?"登录打开 ↗":"新窗口 ↗"}</a>
            ${a?"":`<button class="primary-button" type="button" data-action="edit-document" data-id="${f(t.id)}">编辑文档</button>`}
            <button class="quiet-button" type="button" data-action="download-report" data-id="${f(t.id)}">下载 HTML</button>
            <button class="quiet-button" type="button" data-action="share-report" data-id="${f(t.id)}">分享</button>
            <button class="quiet-button" type="button" data-action="edit" data-id="${f(t.id)}">编辑信息</button>`}
        </div>
      </header>
      ${r}
      ${vt()}
    </main>`}function Zt(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${U?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>':""}
    </header>`}function Pe(){const t=h.reports.filter(a=>a.archived).filter(a=>{if(!q.trim())return!0;const i=q.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=h.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${Zt()}
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
            <div class="archive-grid">${t.map(a=>Ft(a,!0)).join("")}</div>
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
      ${vt()}
    </main>`}function Oe(){if(U)return Pe();const t=q.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),a=h.reports.filter(l=>!l.archived),i=e.length?a.filter(l=>{const p=`${l.title} ${l.source||""} ${l.access||""} ${jt(l.workType)} ${(l.tags||[]).join(" ")}`.toLowerCase();return e.every(u=>p.includes(u))}):a,r=h.reports.filter(l=>l.archived).length,n=a.filter(l=>l.access==="production").length,c=a.filter(l=>l.access!=="production").length,s=xe(i,t).filter(l=>l.reports.length||C),d=I==="type"?"工作类型":I==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${Zt()}
      <section class="workspace">
        ${Vt(f)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${a.length}</strong><span>成果</span>
              <i></i>
              <strong>${h.groups.length}</strong><span>主题</span>
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
          ${C?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${H()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div class="classification-actions">
              <div class="view-switcher" role="tablist" aria-label="成果分类方式">
                <button type="button" role="tab" aria-selected="${I==="topic"}" class="${I==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                <button type="button" role="tab" aria-selected="${I==="type"}" class="${I==="type"?"active":""}" data-action="set-view" data-id="type">类型</button>
                <button type="button" role="tab" aria-selected="${I==="tag"}" class="${I==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
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
              <div class="board catalog-view-${I}">
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
                      ${C?`<button class="move-here-button" type="button" data-action="move-here" data-id="${f(l.id)}" data-bucket-kind="${f(l.kind)}">移到这里</button>`:""}
                      ${l.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${f(l.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${f(l.id)}">编辑主题</button>
                           ${l.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${f(l.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${l.reports.length?l.reports.map(u=>Ft(u)).join(""):l.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${f(l.id)}">
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
      ${vt()}
    </main>`}function v(){const t=document.getElementById("app");if(sessionStorage.getItem(bt)!=="ok"){t.innerHTML=Ce(),Re();return}const e=x&&h.reports.find(a=>a.id===x);t.innerHTML=e?De(e):Oe(),Be(),Yt({render:v,showToast:S,saveToLibrary:Te})}function Re(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(bt,"ok"),v()})}async function St(t){const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),n=e.value.trim();if(!Q(n))return r.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const c=await Nt(n);if(!c)throw new Error("read failed");return a.value=c,r.textContent="已识别网页标题",a.value}catch{const c=N(n);return a.value||(a.value=c),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function Be(){var r;(r=document.getElementById("search-input"))==null||r.addEventListener("input",n=>{q=n.target.value,v();const c=document.getElementById("search-input");c==null||c.focus(),c==null||c.setSelectionRange(q.length,q.length)}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",async c=>{var l,p;const s=c.currentTarget.dataset.action,d=c.currentTarget.dataset.id;if(s==="open")x=d,v();else if(s==="edit-document"){const u=h.reports.find(m=>m.id===d);if(!u||u.access!=="production")return;ye(u,{render:v,showToast:S})}else if(s==="download-report"){const u=h.reports.find(m=>m.id===d);u&&await Mt(u,S)}else if(s==="share-report"){const u=h.reports.find(m=>m.id===d);u&&await $e(u,S)}else if(s==="back")x="",k=null,v();else if(s==="lock")sessionStorage.removeItem(bt),v();else if(s==="clear-search")q="",v();else if(s==="set-view"){if(!["topic","type","tag"].includes(d))return;I=d,C="",localStorage.setItem(W,I),v()}else if(s==="cancel-move")C="",v();else if(s==="move-here"){const u=c.currentTarget.dataset.bucketKind||I;C&&Z(C,u,d)&&(C="",v(),S(u==="tag"?"已添加目标标签":`报告已移入目标${H()}`))}else if(s==="show-archive")U=!0,q="",x="",v();else if(s==="show-catalog")U=!1,q="",x="",v();else if(s==="add-report")k={type:"report",mode:"create",groupId:((l=h.groups[1])==null?void 0:l.id)||((p=h.groups[0])==null?void 0:p.id)},v();else if(s==="add-to-group")k={type:"report",mode:"create",groupId:d},v();else if(s==="edit")k={type:"report",mode:"edit",reportId:d},v();else if(s==="edit-tags")k={type:"tags",reportId:d},v();else if(s==="close-modal")k=null,v();else if(s==="detect-title")await St(c.currentTarget.closest("form"));else if(s==="archive"){const u=h.reports.find(m=>m.id===d);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),T(),v(),S("已归档，可随时恢复")}else if(s==="restore"){const u=h.reports.find(m=>m.id===d);if(!u)return;u.archived=!1,u.archivedAt="",T(),v(),S("报告已恢复到原主题")}else if(s==="delete"){const u=h.reports.find(m=>m.id===d);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(h.reports=h.reports.filter(m=>m.id!==d),x===d&&(x=""),T(),v(),S("报告已永久删除"))}else if(s==="add-group")k={type:"group",mode:"create"},v();else if(s==="rename-group")h.groups.find(m=>m.id===d)&&(k={type:"group",mode:"edit",groupId:d},v());else if(s==="delete-group"){const u=h.groups.find(m=>m.id===d);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(h.reports.forEach(m=>{m.groupId===d&&(m.groupId="inbox")}),h.groups=h.groups.filter(m=>m.id!==d),T(),v(),S("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(n=>{let c=null,s=!1;const d=()=>{var l;L="",c=null,s=!1,(l=n.closest(".report-card"))==null||l.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",l=>{var p,u;l.preventDefault(),L=n.dataset.reportDragId,E="",c={x:l.clientX,y:l.clientY},s=!1,(p=n.setPointerCapture)==null||p.call(n,l.pointerId),(u=n.closest(".report-card"))==null||u.classList.add("is-dragging")}),n.addEventListener("pointermove",l=>{if(!L||c&&Math.hypot(l.clientX-c.x,l.clientY-c.y)<7)return;s=!0;const p=document.elementFromPoint(l.clientX,l.clientY),u=p==null?void 0:p.closest(".report-card"),m=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(y=>{y.classList.toggle("is-card-drop-target",!!(u&&u!==n.closest(".report-card")&&y===u))}),document.querySelectorAll(".group-column").forEach(y=>{y.classList.toggle("is-drop-ready",!!(m&&y===m))})}),n.addEventListener("pointerup",l=>{if(!L)return;const p=L;if(!s){C=p,d(),v(),S(`请选择目标${H()}`);return}const u=document.elementFromPoint(l.clientX,l.clientY),m=u==null?void 0:u.closest(".report-card"),y=u==null?void 0:u.closest(".group-column"),A=(m==null?void 0:m.dataset.reportId)||"",g=(y==null?void 0:y.dataset.bucketId)||"",$=(y==null?void 0:y.dataset.bucketKind)||I,b=A&&A!==p?Z(p,$,g,A):g?Z(p,$,g):!1;d(),b&&(v(),S($==="tag"?"已添加目标标签":$==="type"?"工作类型已更新":A?"报告顺序已更新":"已移入新主题"))}),n.addEventListener("pointercancel",d)}),document.querySelectorAll(".group-drag-handle").forEach(n=>{const c=()=>{var s;E="",(s=n.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(d=>{d.classList.remove("is-group-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",s=>{var d,l;s.preventDefault(),E=n.dataset.groupDragId,L="",(d=n.setPointerCapture)==null||d.call(n,s.pointerId),(l=n.closest(".group-column"))==null||l.classList.add("is-group-dragging")}),n.addEventListener("pointermove",s=>{E&&document.querySelectorAll(".group-column").forEach(d=>{var l;d.classList.toggle("is-group-drop-target",d===((l=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:l.closest(".group-column")))})}),n.addEventListener("pointerup",s=>{var p;if(!E)return;const d=E,l=(p=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:p.closest(".group-column");if(l&&it(d,l.dataset.groupId)){E="",v(),S("分组顺序已更新");return}c()}),n.addEventListener("pointercancel",c),n.addEventListener("keydown",s=>{var u;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const d=h.groups.findIndex(m=>m.id===n.dataset.groupDragId),l=s.key==="ArrowLeft"?d-1:d+1,p=h.groups[l];!p||!it(n.dataset.groupDragId,p.id)||(v(),S("分组顺序已更新"),(u=document.querySelector(`[data-group-drag-id="${CSS.escape(n.dataset.groupDragId)}"]`))==null||u.focus())})}),document.querySelectorAll(".group-column").forEach(n=>{n.addEventListener("dragover",c=>{c.preventDefault(),n.classList.add(E?"is-group-drop-target":"is-drop-ready")}),n.addEventListener("dragleave",()=>{n.classList.remove("is-drop-ready","is-group-drop-target")}),n.addEventListener("drop",c=>{if(c.preventDefault(),E){if(n.dataset.bucketKind==="topic"&&it(E,n.dataset.groupId)){E="",v(),S("分组顺序已更新");return}E="",n.classList.remove("is-group-drop-target");return}const s=h.reports.find(l=>l.id===L),d=n.dataset.bucketKind||I;s&&Z(L,d,n.dataset.bucketId)&&(L="",v(),S(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":"已移入新主题")),L=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(n=>{n.addEventListener("click",()=>{const c=document.querySelector('#tag-form input[name="tags"]');if(!c)return;const s=rt(c.value),d=n.dataset.tagSuggestion;c.value=s.includes(d)?s.filter(l=>l!==d).join("、"):[...s,d].slice(0,8).join("、"),n.classList.toggle("selected",!s.includes(d)),c.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",n=>{n.preventDefault();const c=h.reports.find(s=>s.id===k.reportId);c&&(c.tags=rt(new FormData(t).get("tags")),T(),k=null,v(),S("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",n=>{var l,p;n.preventDefault();const c=(l=new FormData(e).get("name"))==null?void 0:l.trim(),s=(p=new FormData(e).get("description"))==null?void 0:p.trim();if(!c)return;if(k.mode==="edit"){const u=h.groups.find(m=>m.id===k.groupId);if(!u)return;u.name=c.slice(0,60),u.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else h.groups.push({id:dt("group"),name:c.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][h.groups.length%4],position:h.groups.length});T();const d=k.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";k=null,v(),S(d)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async n=>{n.preventDefault();const c=a.elements.url.value.trim();if(!Q(c))return;const s=a.querySelector('button[type="submit"]');s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';let d=a.elements.title.value.trim();d||(d=await St(a));const l=a.elements.groupId.value,p=a.elements.workType.value,u=rt(a.elements.tags.value);if(k.mode==="edit"){const m=h.reports.find(y=>y.id===k.reportId);Object.assign(m,{title:d,url:c,groupId:l,workType:p,tags:u})}else{const m={id:dt("report"),groupId:l,title:d||N(c),url:c,pinned:!1,position:h.reports.filter(y=>y.groupId===l).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:p,tags:u};m.tags.length||(m.tags=X(m,m.workType)),h.reports.push(m)}T(),k=null,v(),S("报告已保存")});const i=x&&h.reports.find(n=>n.id===x);i&&ke(i)}function Me(){v()}Me(document.getElementById("app"));
