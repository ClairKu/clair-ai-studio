(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function i(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(r){if(r.ep)return;r.ep=!0;const n=i(r);fetch(r.href,n)}})();const Ut="clair-ai-studio-tasks-v1",de=[{id:"save",name:"保存",hint:"自动识别并进入成果库"},{id:"decision",name:"决策",hint:"发起决策推演"},{id:"review",name:"评审",hint:"自动匹配合适的评审 Skill"}],Nt={save:`
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
    </svg>`},W=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let S=ht();function ht(){return{material:"",files:[]}}function Ft(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function ue(t){var r;const e=t.toLowerCase(),a=((r=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(l=>e.includes(l))))==null?void 0:r[0])||"solution";return W.find(n=>n.id===a)||W[1]}function pe(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function U(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const a=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name),r=/\.html?$/i.test(i.name);let n="",l="";if(a&&i.size<=1024*1024)try{const c=await i.text();n=c.slice(0,12e3),r&&(l=c)}catch{n="",l=""}return{id:Ft(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:pe(i.size),excerpt:n,content:l}}))}function me(t){return S.files.length?`<div class="attachment-list">${S.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function ge(t){return de.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${t(e.name)}"
      title="${t(e.name)} · ${t(e.hint)}">
      ${Nt[e.id]}
    </button>`).join("")}function he(t){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" placeholder="Run a task"
            aria-label="执行一个任务；输入或粘贴内容">${t(S.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${Nt.upload}
            </label>
            ${ge(t)}
          </div>
        </div>
        ${me(t)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function fe({render:t,showToast:e,saveToLibrary:i}){document.querySelectorAll("[data-task-action]").forEach(c=>{c.addEventListener("click",s=>{s.currentTarget.dataset.taskAction==="remove-file"&&(G(),S.files=S.files.filter(m=>m.id!==s.currentTarget.dataset.fileId),t())})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",async c=>{var L,p;if(c.preventDefault(),G(),!S.material.trim()&&!S.files.length){e("先粘贴内容，或加入一份材料"),(L=document.getElementById("task-goal"))==null||L.focus();return}const s=((p=c.submitter)==null?void 0:p.dataset.submitAction)||"save",d=c.submitter,m={material:S.material.trim(),files:S.files};if(s==="save"){const b=a.querySelector("#intake-save-status"),w=[...a.querySelectorAll("button, textarea, input")],C=q=>{w.forEach(le=>{le.disabled=!0}),a.setAttribute("aria-busy","true"),a.classList.add("is-saving"),b.hidden=!1,b.querySelector("strong").textContent=q,d.setAttribute("aria-label","保存中"),d.innerHTML='<span class="mini-spinner"></span>'};C("正在检查成果库与页面访问状态…");try{const q=await i(m,C);if(q.rejected){t(),e(q.reason);return}if(q.duplicate){t(),e(`成果库已有“${q.title}” · 位于“${q.groupName}”，未重复保存`);return}S=ht(),t(),e(`已保存到“${q.groupName}” · ${q.workTypeName} · 标签：${q.tags.join(" / ")||"待补标签"}`)}catch{w.forEach(q=>{q.disabled=!1}),t(),e("保存失败，请稍后重试")}return}d.disabled=!0;const v=ue([m.material,...m.files.map(b=>`${b.name}
${b.excerpt}`)].join(`
`)),u=s==="decision"?W.find(b=>b.id==="decision"):v.id==="decision"?W.find(b=>b.id==="solution"):v,h=new Date().toISOString(),A=be();A.push({id:Ft(),title:ve(m),mode:s,skillId:u.id,skillName:u.name,material:m.material,files:m.files,status:"queued",createdAt:h,updatedAt:h}),localStorage.setItem(Ut,JSON.stringify(A)),S=ht(),t(),e(`${s==="decision"?"已发起决策":"已发起评审"} · ${u.name}`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async c=>{G(),S.files.push(...await U(c.target.files)),t(),e(`已加入 ${c.target.files.length} 个文件`)});const n=document.querySelector(".prompt-composer");n==null||n.addEventListener("dragover",c=>{c.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async c=>{c.preventDefault(),c.stopPropagation(),n.classList.remove("drag-over"),G();const s=c.dataTransfer.files;S.files.push(...await U(s)),t(),e(`已加入 ${s.length} 个文件`)});const l=document.getElementById("task-goal");requestAnimationFrame(()=>Et(l)),l==null||l.addEventListener("input",()=>{S.material=l.value,Et(l)}),l==null||l.addEventListener("paste",async c=>{var u;const s=[...((u=c.clipboardData)==null?void 0:u.items)||[]].filter(h=>h.kind==="file").map(h=>h.getAsFile()).filter(Boolean);if(!s.length)return;c.preventDefault();const d=c.clipboardData.getData("text/plain"),m=l.selectionStart??l.value.length,v=l.selectionEnd??m;S.material=`${l.value.slice(0,m)}${d}${l.value.slice(v)}`,S.files.push(...await U(s)),t(),e(`已从剪贴板加入 ${s.length} 个材料`)}),we({render:t,showToast:e})}function be(){try{const t=JSON.parse(localStorage.getItem(Ut));return Array.isArray(t)?t:[]}catch{return[]}}function ve(t){var i;return(t.material.split(/\n/).map(a=>a.trim()).find(Boolean)||((i=t.files[0])==null?void 0:i.name)||"未命名任务").replace(/[。；;！!？?]+$/,"").slice(0,64)}function G(){const t=document.getElementById("task-goal");t&&(S.material=t.value)}function Et(t){if(!t)return;t.style.height="auto";const e=Math.min(Math.max(t.scrollHeight,40),180);t.style.height=`${e}px`,t.style.overflowY=t.scrollHeight>180?"auto":"hidden"}function qt(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function ye(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function we({render:t,showToast:e}){document.onpaste=async i=>{var l,c;if(ye(i.target)||!document.querySelector(".prompt-composer"))return;const r=[...((l=i.clipboardData)==null?void 0:l.items)||[]].filter(s=>s.kind==="file").map(s=>s.getAsFile()).filter(Boolean),n=((c=i.clipboardData)==null?void 0:c.getData("text/plain"))||"";!r.length&&!n.trim()||(i.preventDefault(),S.material=[S.material.trim(),n.trim()].filter(Boolean).join(`

`),r.length&&S.files.push(...await U(r)),t(),requestAnimationFrame(qt),e(r.length?`已从剪贴板加入 ${r.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=i=>{var a;[...((a=i.dataTransfer)==null?void 0:a.types)||[]].includes("Files")&&i.preventDefault()},document.ondrop=async i=>{var r,n,l;if((n=(r=i.target)==null?void 0:r.closest)!=null&&n.call(r,".prompt-composer"))return;const a=((l=i.dataTransfer)==null?void 0:l.files)||[];a.length&&(i.preventDefault(),S.files.push(...await U(a)),t(),requestAnimationFrame(qt),e(`已拖入 ${a.length} 个文件`))}}const it="clair-report-editor-v1",$e="https://api.github.com",jt="2026",ke="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null},J=new Map;let xt=!1;function wt(t){return[...new Set(t.filter(Boolean))]}function ft(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function $t(t){return`${ke}${t}`}function Ae(t){try{const e=sessionStorage.getItem($t(t));if(!e)return null;const i=JSON.parse(e);return!(i!=null&&i.html)||typeof i.html!="string"?null:i}catch{return null}}function kt(t=o.reportId){try{sessionStorage.removeItem($t(t))}catch{}}function zt(){return o.dirty&&o.hasDraft?{tone:"changed",label:o.isLocal?"有新修订 · 上次暂存待保存":"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:o.isLocal?"已暂存 · 待保存成果库":"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:o.isLocal?"成果库 HTML 已更新":"生产档案已更新"}:{tone:"clean",label:"未修改"}}function P(){const t=zt(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const i=document.querySelector('[data-editor-action="stash"]');if(i){i.disabled=o.status!=="ready"||o.saving||!o.dirty;const n=!o.dirty&&o.hasDraft?"已暂存":"暂存修改";i.setAttribute("aria-label",n),i.title=n}const a=document.querySelector('[data-editor-action="publish"]');if(a){a.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft;const n=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";a.setAttribute("aria-label",n),a.title=n,a.classList.toggle("is-saving",o.saving)}const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function Ie(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Se(t){const e=atob(String(t||"").replace(/\s/g,"")),i=Uint8Array.from(e,a=>a.charCodeAt(0));return new TextDecoder().decode(i)}function Te(t){const e=new TextEncoder().encode(t);let i="";const a=32768;for(let r=0;r<e.length;r+=a)i+=String.fromCharCode(...e.subarray(r,r+a));return btoa(i)}function dt(t){let e="";for(let a=0;a<t.length;a+=32768)e+=String.fromCharCode(...t.subarray(a,a+32768));return btoa(e)}function ut(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Zt(t,e){const i=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function Ct(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const i=JSON.parse(e[1]),a=ut(i.salt),r=ut(i.iv),n=await Zt(jt,a),l=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},n,ut(i.data)),c=new TextDecoder().decode(l);if(!/<html[\s>]/i.test(c))throw new Error("解密结果不是 HTML");return{html:c,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function At(t){var l;if(((l=o.protection)==null?void 0:l.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await Zt(jt,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,new TextEncoder().encode(t)),n=JSON.stringify({salt:dt(e),iv:dt(i),data:dt(new Uint8Array(r))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,n)}function Le(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const i=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),a=i.shift()||"ClairKu.github.io";let r=i.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const n=wt([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:a,branch:"main",path:n[0],candidates:n,source:"auto"}}catch{return null}}async function X(t,{token:e="",method:i="GET",body:a}={}){var l;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),a!==void 0&&(r["Content-Type"]="application/json");const n=await fetch(`${$e}${t}`,{method:i,headers:r,body:a===void 0?void 0:JSON.stringify(a)});if(!n.ok){let c="";try{c=((l=await n.json())==null?void 0:l.message)||""}catch{c=await n.text()}const s=new Error(c||`GitHub API ${n.status}`);throw s.status=n.status,s}return n.status===204?null:n.json()}async function Ee(t){var l;const e=await X(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const i=wt((l=t.candidates)!=null&&l.length?t.candidates:[t.path]);let a=null,r=null;const n=[];for(const c of i)try{const s=c.split("/").map(encodeURIComponent).join("/"),d=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${s}?ref=${encodeURIComponent(t.branch)}`,m=await X(d);let v="";if(m.encoding==="base64"&&m.content)v=Se(m.content);else if(m.download_url){const u=await fetch(m.download_url,{cache:"no-store"});if(!u.ok)throw new Error("无法读取 GitHub 原始文件");v=await u.text()}if(!v)throw new Error("GitHub 文件内容为空");r?v===r.html&&n.push({path:c,sha:m.sha}):r={html:v,target:{...t,path:c,sha:m.sha,candidates:i}}}catch(s){if(a=s,s.status&&![403,404].includes(s.status))break}if(r)return r.target.mirrors=n,r;throw a||new Error("没有找到对应的 GitHub HTML 文件")}function qe(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{/^on/i.test(a.name)&&(e.setAttribute(`data-clair-event-${a.name.toLowerCase()}`,a.value),e.removeAttribute(a.name))});const i=e.getAttribute("href");i&&/^\s*javascript:/i.test(i)&&(e.dataset.clairJavascriptHref=i,e.removeAttribute("href"))})}function xe(){return`
(() => {
  const channel = ${JSON.stringify(it)};
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
`}function Ce(t,e){const a=new DOMParser().parseFromString(t,"text/html");a.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(c=>{c.dataset.clairEditorHttpEquiv=c.getAttribute("http-equiv")||"Content-Security-Policy",c.setAttribute("http-equiv","x-clair-csp-disabled")}),qe(a);const r=a.createElement("base");r.href=e,r.dataset.clairEditorBase="true",a.head.prepend(r);const n=a.createElement("style");n.id="clair-editor-style",n.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,a.head.append(n);const l=a.createElement("script");return l.id="clair-editor-bridge",l.textContent=xe(),a.body.append(l),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function Gt(t){if(t.url)return"";if(t.savedHtml)return t.savedHtml;const e=(t.savedFiles||[]).find(i=>/\.html?$/i.test(i.name||""));return e!=null&&e.content||e!=null&&e.excerpt?e.content||e.excerpt:/<!doctype\s+html|<html[\s>]/i.test(t.savedContent||"")?t.savedContent.trim():""}async function _t(t){var e;try{const i=Gt(t),a=i?null:Le(t.url);let r=null;if(i)r={html:i,target:null};else if(a)try{r=await Ee(a)}catch{}if(!r&&t.url){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);r={html:await s.text(),target:a}}const n=await Ct(r.html);o.protection=n.protection,o.target=r.target||a;let l=n.html;const c=Ae(t.id);if(c!=null&&c.html)try{const s=await Ct(c.html);l=s.html,o.hasDraft=!0,o.draftHtml=s.html,o.draftAt=c.savedAt||"",c.baseFiles&&o.target&&(o.target.baseFiles=c.baseFiles)}catch{kt(t.id)}o.html=l,o.editorDocument=Ce(l,t.url||window.location.href),o.status="ready",o.error=""}catch(i){o.status="error",o.error=(i==null?void 0:i.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function Kt(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:t,showToast:e})}function It(){return document.querySelector(".report-editor-frame")}function pt(t,e=null){var a;const i=It();(a=i==null?void 0:i.contentWindow)==null||a.postMessage({channel:it,type:"command",command:t,value:e},"*")}function rt(){var i;const t=It();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((a,r)=>{const n=window.setTimeout(()=>{J.delete(e),r(new Error("读取编辑内容超时"))},1e4);J.set(e,{resolve:l=>{clearTimeout(n),a(l)}}),t.contentWindow.postMessage({channel:it,type:"serialize",requestId:e},"*")})}function De(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Vt(t,e){const i=new Blob([t],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(i),r=document.createElement("a");r.href=a,r.download=De(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Yt(t){await navigator.clipboard.writeText(t)}function Me(t,e){var r;const i=new DOMParser().parseFromString(t,"text/html");(r=i.querySelector("base[data-clair-preview-base]"))==null||r.remove();const a=i.createElement("base");return a.href=e,a.dataset.clairPreviewBase="true",i.head.prepend(a),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}function Re(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([Me(o.draftHtml,t.url||window.location.href)],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(e),a=window.open(i,"_blank");if(!a)throw URL.revokeObjectURL(i),new Error("浏览器拦截了新窗口，请允许弹窗后重试");a.opener=null,window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}async function Q(t,{silent:e=!1}={}){var n;const i=await rt(),a=await At(i),r=new Date().toISOString();try{sessionStorage.setItem($t(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:ft(),html:a}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=i,o.draftHtml=i,o.draftAt=r,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",P(),e||(n=o.showToast)==null||n.call(o,o.isLocal?"已暂存在当前浏览器会话，尚未写回成果库":"已暂存在当前浏览器会话，尚未更新 GitHub"),i}async function He(t){var e,i;if(!(o.saving||!o.saveLocal)){o.saving=!0,P();try{const a=o.dirty?await Q(t,{silent:!0}):o.draftHtml||await rt();await o.saveLocal(a),o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit="local",kt(t.id),(e=o.showToast)==null||e.call(o,"已更新成果库中的 HTML")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,P()}}}async function Pe(t){var c,s;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const i=await At(t),a=(e.mirrors||[]).map(d=>d.path),r=wt([...a.filter(d=>d.startsWith("public/")),...a.filter(d=>!d.startsWith("public/")&&d!==e.path),e.path]);let n="";const l=[];for(const d of r)try{const m=d.split("/").map(encodeURIComponent).join("/"),v=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${m}`,u=await X(`${v}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),h=ft(e)[d];if(h&&u.sha!==h)throw new Error(`生产文件 ${d} 已在本次编辑后更新，请重新打开报告合并修改`);const A=await X(v,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:Te(i),sha:u.sha,branch:e.branch}});n=((c=A==null?void 0:A.commit)==null?void 0:c.sha)||n,e.baseFiles={...ft(e),[d]:((s=A==null?void 0:A.content)==null?void 0:s.sha)||u.sha},l.push(d)}catch(m){throw l.length?new Error(`已更新 ${l.join("、")}，但 ${d} 同步失败：${m.message}`):m}return{commit:n,files:l.length}}async function Dt(t){var e,i;if(!o.saving){o.saving=!0,P();try{const a=o.dirty?await Q(t,{silent:!0}):o.draftHtml||await rt(),r=await Pe(a);o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=r.commit,kt(t.id),(e=o.showToast)==null||e.call(o,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,P()}}}function Oe(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
    </div>`}function Be(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
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
    </div>`}function Mt({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const i=e.querySelector("#editor-settings-form"),a=o.target||{};if(i){i.elements.owner.value=a.owner||"ClairKu",i.elements.repository.value=a.repository||"",i.elements.branch.value=a.branch||"main",i.elements.path.value=a.path||"";const r=i.querySelector('button[type="submit"]');r&&(r.textContent=t?"连接并保存":"保存设置")}}function _(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function Ue(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function K(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Wt(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function Rt(t,{render:e,showToast:i,saveLocal:a=null}){Kt(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:i,isLocal:!!(Gt(t)&&a),saveLocal:a}),e(),o.loadPromise=_t(t)}function Ne(t,e){var d;const i=o.isLocal?"本地成果 · 保存在当前浏览器":o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(d=o.target.mirrors)!=null&&d.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",a=zt(),r=o.status==="ready"?`
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
      </div>`:"",n=o.status==="loading"?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${o.isLocal?"修改后可保存回成果库，也可下载 HTML。":"会自动识别对应 GitHub 仓库与源文件。"}</p></div>`:o.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(o.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${Ie(o.editorDocument)}"></iframe></div>`,l=m=>({back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>',stash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>',preview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>',publish:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>'})[m],c=!o.dirty&&o.hasDraft?"已暂存":"暂存修改",s=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";return`
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
            aria-label="${c}" title="${c}"
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
            data-editor-action="publish" aria-label="${s}" title="${s}"
            ${o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft?"disabled":""}>${l("publish")}</button>
        </div>
      </header>
      ${r}
      ${n}
      ${Oe(e)}
      ${Be(e)}
    </main>`}function Fe(t){if(!Wt(t.id))return;xt||(xt=!0,window.addEventListener("message",a=>{var n;const r=It();if(!(!(r!=null&&r.contentWindow)||a.source!==r.contentWindow)&&((n=a.data)==null?void 0:n.channel)===it){if(a.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",P()),a.data.type==="serialized"){const l=J.get(a.data.requestId);if(!l)return;J.delete(a.data.requestId),l.resolve(a.data.html)}a.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(l=>{const c=l.dataset.editorCommand;["bold","italic","underline"].includes(c)&&l.classList.toggle("active",!!a.data[c])})}}),window.addEventListener("beforeunload",a=>{!o.reportId||!o.dirty||(a.preventDefault(),a.returnValue="")}),window.addEventListener("keydown",a=>{a.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?K():o.settingsOpen&&_())})),document.querySelectorAll("[data-editor-command]").forEach(a=>{a.addEventListener("mousedown",r=>r.preventDefault()),a.addEventListener("click",()=>pt(a.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{pt("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(a=>{a.addEventListener("click",async()=>{var n,l,c,s,d,m,v,u,h,A,L,p;const r=a.dataset.editorAction;if(r==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const b=o.render;Kt(),b==null||b()}else if(r==="settings")Mt();else if(r==="close-settings")_();else if(r==="stash")try{await Q(t)}catch(b){(n=o.showToast)==null||n.call(o,(b==null?void 0:b.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{Re(t),(l=o.showToast)==null||l.call(o,"已在新窗口打开暂存修订")}catch(b){(c=o.showToast)==null||c.call(o,(b==null?void 0:b.message)||"无法打开预览")}else if(r==="publish")try{if(o.isLocal){await He(t);return}if(o.dirty&&await Q(t,{silent:!0}),!o.hasDraft){(s=o.showToast)==null||s.call(o,"当前没有待推送的修订");return}Ue()}catch(b){(d=o.showToast)==null||d.call(o,(b==null?void 0:b.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")K();else if(r==="confirm-publish")K(),!o.token||!((m=o.target)!=null&&m.path)?Mt({pendingSave:!0}):await Dt(t);else if(r==="download")try{const b=await rt();Vt(await At(b),t.title),(v=o.showToast)==null||v.call(o,"HTML 已下载")}catch(b){(u=o.showToast)==null||u.call(o,(b==null?void 0:b.message)||"下载失败")}else if(r==="download-published")await Jt(t,o.showToast);else if(r==="share")try{await Yt(t.url),(h=o.showToast)==null||h.call(o,"报告链接已复制")}catch{(A=o.showToast)==null||A.call(o,"复制失败，请从地址栏复制")}else if(r==="link"){const b=prompt("输入链接地址（https://…）");if(!b)return;try{const w=new URL(b);if(!["http:","https:","mailto:"].includes(w.protocol))throw new Error;pt("createLink",w.href)}catch{(L=o.showToast)==null||L.call(o,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(o.status="loading",o.error="",(p=o.render)==null||p.call(o),o.loadPromise||(o.loadPromise=_t(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(a=>{a.addEventListener("click",r=>{r.target===a&&(a.classList.contains("editor-settings-backdrop")?_():K())})});const i=document.getElementById("editor-settings-form");i==null||i.addEventListener("submit",async a=>{var d,m,v;a.preventDefault();const r=new FormData(i),n=String(r.get("github-token-not-password")||"").trim();n&&(o.token=n);const l=String(r.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:l,mirrors:l===((d=o.target)==null?void 0:d.path)?((m=o.target)==null?void 0:m.mirrors)||[]:[],source:"manual"};const c=o.pendingSave;_();const s=document.querySelector(".editor-target-label");if(s){const u=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;s.textContent=u,s.title=u}(v=o.showToast)==null||v.call(o,"保存权限已连接"),c&&await Dt(t)})}async function Jt(t,e){try{const i=await fetch(t.url,{cache:"no-store"});if(!i.ok)throw new Error;Vt(await i.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function je(t,e){try{await Yt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const ze={production:"生产 直达 public",org:"组织 登录 restricted",account:"账号 登录 restricted"};function nt(t=""){return String(t).normalize("NFKC").toLocaleLowerCase("zh-CN").normalize("NFD").replace(new RegExp("\\p{Diacritic}","gu"),"").replace(/\s+/g," ").trim()}function Ze(t=""){return nt(t).split(" ").filter(Boolean)}function Xt(t,e,{group:i={},workTypeName:a=""}={}){const r=Ze(e);if(!r.length)return!0;const n=nt([t.title,t.source,t.url,t.access,ze[t.access],a,...t.tags||[],i.name,i.description].filter(Boolean).join(" "));return r.every(l=>n.includes(l))}const St="clair-service-report-workbench-v1",Tt="clair-service-report-workbench-access",tt="clair-service-report-workbench-view",H=8,ot=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],Y=["手动保存","生产","个人","HTML","本体","飞书","调研","产品规划","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],O={version:H,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"yingmi-ai-materials-compendium-2026-07-30",groupId:"ai-platform",title:"盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T06:30:00.000Z",source:"飞书根材料与 40 个档案节点",access:"production"},{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!0,position:5,createdAt:"2026-07-30T08:00:00.000Z",source:"OAP 管理层汇报成稿",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-productization-roadshow-2026-07-30",groupId:"reporting",title:"AI 产品化实践路演｜CEO / CTO",url:"https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T00:00:00.000Z",source:"CEO / CTO 路演材料",access:"production"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},bt={"yingmi-ai-materials-compendium-2026-07-30":"reporting","seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-productization-roadshow-2026-07-30":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},Qt={"yingmi-ai-materials-compendium-2026-07-30":"ai-platform","qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function st(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|Studio|工作台|原型/i.test(e)?"product-demo":"product-planning"}function F(t,e=st(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`,a=[],r=n=>{a.includes(n)||a.push(n)};return t.manualSaved&&r("手动保存"),t.isProduction&&r("生产"),t.isPersonal&&r("个人"),t.isHtml&&r("HTML"),/ontology\.yingmi-inc\.com|本体/.test(i)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&r("调研"),e==="product-planning"&&r("产品规划"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&r("AI 小顾"),(/studio|workbench|工作台|skill-audit/i.test(i)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(i)&&r("且慢"),/投顾|advisor|财务规划/.test(i)&&r("投顾服务"),/OAP|oap-/.test(i)&&r("OAP"),/MCP|mcp-/.test(i)&&r("MCP"),/Skills|skill-/.test(i)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),a.slice(0,5)}function Ge(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/Studio|工作台|生产力|Copilot|编辑器/i.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":{"requirement-review":"product-planning","competitive-research":"product-planning",reporting:"reporting","data-analysis":"reporting","investment-research":"research","governance-review":"knowledge","product-demo":"ai-workbench","product-planning":"product-planning"}[t.workType]||"inbox"}O.reports=O.reports.map(t=>{const e=Qt[t.id]||t.groupId,i=bt[t.id]||st(t),a={...t,groupId:e,workType:i};return{...a,tags:F(a,i)}});let f=_e(),T="",M="",j=!1,k=["topic","type","tag","time"].includes(localStorage.getItem(tt))?localStorage.getItem(tt):"topic",D="",x="",R="",$=null,Ht=0;function te(t){return JSON.parse(JSON.stringify(t))}function N(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function _e(){try{const t=JSON.parse(localStorage.getItem(St));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Ke(t)}catch{}return te(O)}function Ke(t){const e=te(O),i=new Set(e.groups.map(p=>p.id)),a=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(p=>[p.id,p])),n=e.groups.map(p=>{const b=r.get(p.id);return!b||t.version<H?p:{...p,name:b.name||p.name,description:b.description||p.description,position:Number.isFinite(b.position)?b.position:p.position}});t.groups.filter(p=>!i.has(p.id)&&!a.has(p.id)).forEach((p,b)=>{n.push({...p,description:p.description||"自定义工作分组",position:Number.isFinite(p.position)?p.position:O.groups.length+b})});const l=n.filter((p,b,w)=>w.findIndex(C=>C.id===p.id)===b);l.sort((p,b)=>(p.position||0)-(b.position||0));const c={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},s={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},d=t.reports.map(p=>({...p,groupId:Qt[p.id]||c[p.id]||s[p.groupId]||p.groupId||"inbox",workType:p.workType||bt[p.id]||st(p),tags:Array.isArray(p.tags)&&p.tags.length?p.tags:F(p,p.workType||bt[p.id])})),m=new Map(d.map(p=>[p.id,p])),v=new Map(d.map(p=>[N(p.url),p])),u=new Set,h=new Set,A=e.reports.map(p=>{const b=N(p.url);u.add(b),h.add(p.id);const w=m.get(p.id)||v.get(b);return w?{...p,title:t.version>=H&&w.title||p.title,groupId:t.version>=H&&l.some(C=>C.id===w.groupId)?w.groupId:p.groupId,workType:t.version>=H&&w.workType?w.workType:p.workType,tags:t.version>=H&&Array.isArray(w.tags)&&w.tags.length?w.tags:p.tags,pinned:!!w.pinned,position:Number.isFinite(w.position)?w.position:p.position,archived:!!w.archived,archivedAt:w.archivedAt||""}:p});d.forEach(p=>{const b=N(p.url);h.has(p.id)||b&&u.has(b)||(h.add(p.id),b&&u.add(b),A.push(p))});const L={version:H,groups:l,reports:A};return localStorage.setItem(St,JSON.stringify(L)),L}function E(){f.version=H,f.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(St,JSON.stringify(f))}function Ve(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(lt)||""}function Ye(t,e,i){var l,c,s;const r=(c=(l=ct(t,e).match(/<title[^>]*>([\s\S]*?)<\/title>/i))==null?void 0:l[1])==null?void 0:c.replace(/\s+/g," ").trim();if(r)return r.slice(0,100);const n=String(t).split(/\n/).map(d=>d.trim().replace(/^#+\s*/,"")).find(d=>d&&!/^https?:\/\//i.test(d));return n?n.replace(/[。；;！!？?]+$/,"").slice(0,100):(s=e[0])!=null&&s.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):i?Z(i):"未命名成果"}function Pt(t=""){return String(t).trim().replace(/\s+/g," ").toLocaleLowerCase()}function Ot(t=[]){return t.map(e=>`${String(e.name||"").trim().toLocaleLowerCase()}:${e.size||0}:${e.type||""}`).sort().join("|")}function ee({material:t,files:e,url:i,excludeId:a=""}){const r=i?N(i):"",n=Pt(t),l=Ot(e);return f.reports.find(c=>c.id===a?!1:r&&N(c.url)===r||n&&Pt(c.savedContent)===n?!0:!n&&!!l&&Ot(c.savedFiles)===l)||null}function ae(t=""){var e;try{const i=new URL(t),a=i.hostname.toLowerCase(),r=(e=i.pathname.split("/").filter(Boolean)[0])==null?void 0:e.toLowerCase();return a==="clairku.github.io"||(a==="github.com"||a==="raw.githubusercontent.com")&&r==="clairku"}catch{return!1}}function We(t=""){try{return/\.html?$/i.test(new URL(t).pathname)}catch{return!1}}function ct(t="",e=[]){if(/<!doctype\s+html|<html[\s>]/i.test(t))return t.trim();const i=e.find(a=>/\.html?$/i.test(a.name));return(i==null?void 0:i.content)||(i==null?void 0:i.excerpt)||""}function ie(t=""){try{const e=new URL(t).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(e))return{access:"org",provider:"飞书组织帐号"};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(e))return{access:"account",provider:"腾讯文档帐号"};if(/(^|\.)yingmi-inc\.com$/.test(e))return{access:"org",provider:"盈米组织帐号"};if(e==="github.com"&&/^\/login(?:\/|$)/.test(new URL(t).pathname))return{access:"account",provider:"GitHub 帐号"}}catch{return null}return null}async function re(t){var e,i,a,r,n;if(!lt(t))return{title:"",description:"",reachable:!1};try{const l=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,c=await fetch(l,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!c.ok)throw new Error("read failed");const s=await c.json();return{title:((i=(e=s==null?void 0:s.data)==null?void 0:e.title)==null?void 0:i.trim().slice(0,180))||"",description:((r=(a=s==null?void 0:s.data)==null?void 0:a.description)==null?void 0:r.trim().slice(0,500))||"",reachable:(s==null?void 0:s.status)==="success"&&!!((n=s==null?void 0:s.data)!=null&&n.url)}}catch{return{title:"",description:"",reachable:!1}}}async function ne({material:t="",files:e=[],url:i=""},a=()=>{}){const r=ct(t,e),n=e.some(s=>/\.html?$/i.test(s.name));if(!i)return r?{allowed:!0,access:"local",metadata:{title:"",description:"",reachable:!0},isHtml:!0,savedHtml:r,loginProvider:""}:{allowed:!1,reason:n?"HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML":"只能保存可正常访问的网址或 HTML 内容"};const l=ie(i);a(l?"正在识别权限页面与登录入口…":"正在检查页面是否可正常访问…");const c=l?{title:"",description:"",reachable:!0}:await re(i);return!l&&!c.reachable?{allowed:!1,reason:"页面无法正常访问，且不是可读取的 HTML，未保存"}:{allowed:!0,access:(l==null?void 0:l.access)||"production",metadata:c,isHtml:We(i),savedHtml:"",loginProvider:(l==null?void 0:l.provider)||""}}async function Je({material:t,files:e},i=()=>{}){var m,v;const a=Ve(t);i("正在检查成果库是否已有相同内容…");const r=ee({material:t,files:e,url:a});if(r)return{...r,duplicate:!0,groupName:((m=f.groups.find(u=>u.id===r.groupId))==null?void 0:m.name)||"待整理",workTypeName:et(r.workType)};const n=await ne({material:t,files:e,url:a},i);if(!n.allowed)return{rejected:!0,duplicate:!1,reason:n.reason};const l=Ye(t,e,a),c=n.metadata;i("正在识别标题、分组、类型与标签…");const s=new Date().toISOString(),d={id:yt("report"),groupId:"inbox",title:c.title||l,url:a,pinned:!1,position:0,createdAt:s,source:a?"快捷保存":"本地保存",access:n.access,archived:!1,archivedAt:"",savedContent:t,savedFiles:e,detectedDescription:c.description,manualSaved:!0,isProduction:n.access==="production",isPersonal:ae(a),isHtml:n.isHtml,savedHtml:n.savedHtml,loginProvider:n.loginProvider};d.workType=st(d),d.groupId=Ge(d),d.tags=F(d,d.workType),i("正在保存到成果库…"),d.position=f.reports.filter(u=>!u.archived&&u.groupId===d.groupId).length,f.reports.push(d);try{E()}catch{return f.reports.pop(),{rejected:!0,duplicate:!1,reason:"HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试"}}return j=!1,k!=="time"&&(k="topic"),T="",localStorage.setItem(tt,k),{...d,duplicate:!1,groupName:((v=f.groups.find(u=>u.id===d.groupId))==null?void 0:v.name)||"待整理",workTypeName:et(d.workType)}}function mt(t,e){const i=f.groups.findIndex(n=>n.id===t),a=f.groups.findIndex(n=>n.id===e);if(i<0||a<0||i===a)return!1;const[r]=f.groups.splice(i,1);return f.groups.splice(a,0,r),E(),!0}function Xe(t,e,i=""){const a=f.reports.find(c=>c.id===t);if(!a||a.archived||!f.groups.find(c=>c.id===e))return!1;const n=f.reports.filter(c=>!c.archived&&c.groupId===e&&c.id!==t).sort((c,s)=>(c.position||0)-(s.position||0)),l=i?n.findIndex(c=>c.id===i):n.length;return a.groupId=e,n.splice(l<0?n.length:l,0,a),n.forEach((c,s)=>{c.position=s}),E(),!0}function et(t){var e;return((e=ot.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function Bt(t){const e=new Date(t.createdAt||0).getTime();return Number.isFinite(e)?e:0}function vt(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?[e.getFullYear(),String(e.getMonth()+1).padStart(2,"0"),String(e.getDate()).padStart(2,"0")].join("-"):"unknown"}function Qe(t){if(t==="unknown")return"时间待补";const[e,i,a]=t.split("-").map(Number),r=new Date(e,i-1,a),n=new Date,l=vt(n),c=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1),s=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(r);return t===l?`今天 · ${s}`:t===vt(c)?`昨天 · ${s}`:e===n.getFullYear()?s:`${e}年 · ${s}`}function ta(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?`新增于 ${new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}`:"新增时间待补"}function ea(t,e=""){const i=a=>!e||nt(a).includes(e);if(k==="time"){const a=new Map;return[...t].sort((r,n)=>Bt(n)-Bt(r)).forEach(r=>{const n=vt(r.createdAt);a.has(n)||a.set(n,[]),a.get(n).push(r)}),[...a.entries()].map(([r,n])=>({id:r,name:Qe(r),kind:"time",accent:"slate",reports:n}))}if(k==="type")return ot.map(a=>({id:a.id,name:a.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===a.id).sort((r,n)=>+!!n.pinned-+!!r.pinned||new Date(n.createdAt)-new Date(r.createdAt))})).filter(a=>!e||a.reports.length||i(a.name));if(k==="tag"){const a=new Set(Y);return f.reports.forEach(n=>{(n.tags||[]).forEach(l=>a.add(l))}),[...a].sort((n,l)=>{const c=Y.indexOf(n),s=Y.indexOf(l);return c>=0||s>=0?(c<0?Number.MAX_SAFE_INTEGER:c)-(s<0?Number.MAX_SAFE_INTEGER:s):n.localeCompare(l,"zh-CN")}).map(n=>({id:n,name:n,kind:"tag",accent:"violet",reports:t.filter(l=>(l.tags||[]).includes(n)).sort((l,c)=>+!!c.pinned-+!!l.pinned||new Date(c.createdAt)-new Date(l.createdAt))})).filter(n=>n.reports.length&&(!e||i(n.name)||n.reports.length))}return f.groups.map(a=>({...a,kind:"topic",reports:t.filter(r=>r.groupId===a.id).sort((r,n)=>(r.position||0)-(n.position||0))})).filter(a=>!e||a.reports.length||i(`${a.name} ${a.description||""}`))}function V(t,e,i,a=""){const r=f.reports.find(n=>n.id===t);return!r||r.archived?!1:e==="topic"?Xe(t,i,a):e==="type"?ot.some(n=>n.id===i)?(r.workType=i,E(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(i)||r.tags.push(i),E(),!0):!1}function z(){return k==="type"?"工作类型":k==="tag"?"标签":k==="time"?"新增时间":"主题"}function yt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function g(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}const aa={back:`
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
    </svg>`};function B(t){return aa[t]||""}function Z(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function lt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function gt(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function I(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Ht),Ht=window.setTimeout(()=>e.remove(),2600)}function at(t){return t.savedHtml||ct(t.savedContent,t.savedFiles)}function ia(t){return`${String(t.title||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,80)||"report"}.html`}function oe(t){const e=at(t);return e?URL.createObjectURL(new Blob([e],{type:"text/html;charset=utf-8"})):""}function ra(t){const e=oe(t);if(!e)return!1;const i=document.createElement("a");return i.href=e,i.download=ia(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(e),1e3),!0}function na(t){const e=t.url||oe(t);return e?(window.open(e,"_blank","noopener,noreferrer"),t.url||window.setTimeout(()=>URL.revokeObjectURL(e),6e4),!0):!1}function se(t,e=!1){const i=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),a=["org","account"].includes(t.access),r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",n=at(t),l=k==="time"?ta(t.createdAt):t.source||"手动添加",c=!a&&O.reports.some(d=>d.id===t.id),s=n&&t.isHtml?`<iframe class="local-html-preview-frame" title="${g(t.title)}视觉预览"
        srcdoc="${g(n)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:c?`<img src="./previews/${g(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":g(t.title.slice(0,2))}</span>
        <strong>${a?r:i?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${R===t.id?"is-move-selected":""}" data-report-id="${g(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${g(t.id)}" aria-label="打开${g(t.title)}">
        <span class="report-preview">
          ${s}
        </span>
        <span class="report-copy">
          <span class="report-source">${g(l)}</span>
          <strong>${g(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(d=>`<span>${g(d)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${g(r)}</span>`:""}
        </span>
      </button>
      ${e||k==="time"?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${g(t.id)}"
          aria-label="拖动《${g(t.title)}》到其他${z()}" title="拖动到其他${z()}">
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
    </article>`}function Lt(){var i;if(!$)return"";if($.type==="tags"){const a=f.reports.find(r=>r.id===$.reportId);return a?`
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
            ${Y.map(r=>`<button type="button" class="${(a.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${g(r)}">${g(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if($.type==="group"){const a=$.mode==="edit"?f.groups.find(r=>r.id===$.groupId):null;return`
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
      </div>`}const t=$.mode==="edit"?f.reports.find(a=>a.id===$.reportId):null,e=(t==null?void 0:t.groupId)||$.groupId||((i=f.groups[0])==null?void 0:i.id)||"";return`
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
            ${f.groups.map(a=>`<option value="${g(a.id)}" ${a.id===e?"selected":""}>${g(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${ot.map(a=>`<option value="${g(a.id)}" ${a.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${g(a.name)}</option>`).join("")}
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
    </div>`}function oa(){return`
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
    </main>`}function sa(t){var c;if(Wt(t.id))return Ne(t,g);const e=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),i=["org","account"].includes(t.access),a=t.loginProvider||((c=ie(t.url))==null?void 0:c.provider)||(t.access==="org"?"组织帐号":"站点帐号"),r=t.savedHtml||ct(t.savedContent,t.savedFiles),n=r?"edit-local-document":t.url?i?"edit":"edit-document":"",l=r?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}"
          srcdoc="${g(r)}"
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
                ${t.savedFiles.map(s=>`<span><b>${g(s.name)}</b><small>${g(s.sizeLabel||"")}</small></span>`).join("")}
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
          <p class="login-handoff-domain">${g(Z(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}" src="${g(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${B("back")}</button>
        <div class="reader-title">
          <strong>${g(t.title)}</strong>
          <span>${e?"本地保存":g(Z(t.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${n?`
            <button class="reader-icon-button" type="button" data-action="${n}"
              data-id="${g(t.id)}" aria-label="编辑" title="编辑">
              ${B("edit")}
            </button>`:""}
          ${t.url&&t.access==="production"?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${g(t.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${B("copy")}
            </button>`:""}
          ${!i&&(t.url||r)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${g(t.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${B("download")}
            </button>`:""}
          ${t.url||r?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${g(t.id)}"
              aria-label="${i?`打开${g(a)}登录页`:"在浏览器打开"}"
              title="${i?`打开${g(a)}登录页`:"在浏览器打开"}">
              ${B("external")}
            </button>`:""}
        </div>
      </header>
      ${l}
      ${Lt()}
    </main>`}function ce(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${j?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>':""}
    </header>`}function ca(){const t=f.reports.filter(i=>i.archived).filter(i=>Xt(i,T,{group:f.groups.find(a=>a.id===i.groupId),workTypeName:et(i.workType)})).sort((i,a)=>new Date(a.archivedAt||0)-new Date(i.archivedAt||0)),e=f.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${ce()}
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
              <div><h2>${T?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(i=>se(i,!0)).join("")}</div>
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
      ${Lt()}
    </main>`}function la(){if(j)return ca();const t=nt(T),e=f.reports.filter(s=>!s.archived),i=t?e.filter(s=>Xt(s,t,{group:f.groups.find(d=>d.id===s.groupId),workTypeName:et(s.workType)})):e,a=f.reports.filter(s=>s.archived).length,r=e.filter(s=>s.access==="production").length,n=e.filter(s=>s.access!=="production").length,l=ea(i,t).filter(s=>s.reports.length||R),c=k==="type"?"工作类型":k==="tag"?"关键标签":k==="time"?"新增时间":"工作主题";return`
    <main class="app-shell">
      ${ce()}
      <section class="workspace">
        ${he(g)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${g(T)}"
                placeholder="Find a result" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${T?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${t?i.length:e.length}</strong><span>${t?"匹配":"成果"}</span>
              <i></i>
              <strong>${f.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${r}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${R?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${z()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          ${l.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${c}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${k==="topic"}" class="${k==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                    <button type="button" role="tab" aria-selected="${k==="type"}" class="${k==="type"?"active":""}" data-action="set-view" data-id="type">任务</button>
                    <button type="button" role="tab" aria-selected="${k==="tag"}" class="${k==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
                    <button type="button" role="tab" aria-selected="${k==="time"}" class="${k==="time"?"active":""}" data-action="set-view" data-id="time">时间</button>
                  </div>
                  <button class="add-topic-icon" type="button" data-action="add-group"
                    aria-label="添加主题" title="添加主题">＋</button>
                </div>
                ${l.map((s,d)=>`<a href="#bucket-${d}"><span class="nav-index">${String(d+1).padStart(2,"0")}</span>${g(s.name)}<span>${s.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${a?`<em>${a}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${k}">
              ${l.map((s,d)=>`
                <section id="bucket-${d}" class="group-column topic-section bucket-${g(s.kind)} accent-${g(s.accent||"blue")}"
                  data-bucket-kind="${g(s.kind)}"
                  data-bucket-id="${g(s.id)}"
                  ${s.kind==="topic"?`data-group-id="${g(s.id)}"`:""}>
                  <header class="group-header">
                    ${s.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${g(s.id)}"
                          aria-label="拖动“${g(s.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(d+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${s.kind==="tag"?"#":s.kind==="time"?"时":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${g(s.name)}</h2></div>
                      <span class="count">${s.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${R?`<button class="move-here-button" type="button" data-action="move-here" data-id="${g(s.id)}" data-bucket-kind="${g(s.kind)}">移到这里</button>`:""}
                      ${s.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${g(s.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${g(s.id)}">编辑主题</button>
                           ${s.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${g(s.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${s.reports.length?s.reports.map(m=>se(m)).join(""):s.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${g(s.id)}">
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
            <span>${n} 份报告需要组织或账号登录${a?` · ${a} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${Lt()}
    </main>`}function y(){const t=document.getElementById("app");if(sessionStorage.getItem(Tt)!=="ok"){t.innerHTML=oa(),da();return}const e=M&&f.reports.find(i=>i.id===M);t.innerHTML=e?sa(e):la(),pa(),fe({render:y,showToast:I,saveToLibrary:Je})}function da(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(Tt,"ok"),y()})}async function ua(t){const e=t.elements.url,i=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),n=e.value.trim();if(!lt(n))return r.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const{title:l}=await re(n);if(!l)throw new Error("read failed");return i.value=l,r.textContent="已识别网页标题",i.value}catch{const l=Z(n);return i.value||(i.value=l),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{a.disabled=!1,a.textContent="识别标题"}}function pa(){const t=document.getElementById("search-input");t==null||t.addEventListener("input",n=>{if(n.isComposing)return;T=n.target.value;const l=n.target.selectionStart,c=n.target.selectionEnd;y();const s=document.getElementById("search-input");s==null||s.focus(),s==null||s.setSelectionRange(l,c)}),t==null||t.addEventListener("keydown",n=>{var l;n.key!=="Escape"||!T||(n.preventDefault(),T="",y(),(l=document.getElementById("search-input"))==null||l.focus())}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",async l=>{var d,m,v;const c=l.currentTarget.dataset.action,s=l.currentTarget.dataset.id;if(c==="open")M=s,y();else if(c==="edit-document"){const u=f.reports.find(h=>h.id===s);if(!u||u.access!=="production")return;Rt(u,{render:y,showToast:I})}else if(c==="edit-local-document"){const u=f.reports.find(h=>h.id===s);if(!u||!at(u))return;Rt(u,{render:y,showToast:I,saveLocal:async h=>{const A=u.savedHtml;u.savedHtml=h,u.isHtml=!0,u.tags=F(u,u.workType);try{E()}catch{throw u.savedHtml=A,new Error("修改后的 HTML 超过当前浏览器可保存容量，请先下载备份")}}})}else if(c==="download-report"){const u=f.reports.find(h=>h.id===s);if(!u)return;at(u)?ra(u)&&I("HTML 已下载"):await Jt(u,I)}else if(c==="share-report"||c==="copy-production-url"){const u=f.reports.find(h=>h.id===s);u!=null&&u.url&&await je(u,h=>{I(h==="报告链接已复制"?"生产 URL 已复制":h)})}else if(c==="open-browser"){const u=f.reports.find(h=>h.id===s);if(!u)return;na(u)||I("浏览器未能打开该报告")}else if(c==="back")M="",$=null,y();else if(c==="lock")sessionStorage.removeItem(Tt),y();else if(c==="clear-search")T="",y(),(d=document.getElementById("search-input"))==null||d.focus();else if(c==="set-view"){if(!["topic","type","tag","time"].includes(s))return;k=s,R="",localStorage.setItem(tt,k),y()}else if(c==="cancel-move")R="",y();else if(c==="move-here"){const u=l.currentTarget.dataset.bucketKind||k;R&&V(R,u,s)&&(R="",y(),I(u==="tag"?"已添加目标标签":`报告已移入目标${z()}`))}else if(c==="show-archive")j=!0,T="",M="",y();else if(c==="show-catalog")j=!1,T="",M="",y();else if(c==="add-report")$={type:"report",mode:"create",groupId:((m=f.groups[1])==null?void 0:m.id)||((v=f.groups[0])==null?void 0:v.id)},y();else if(c==="add-to-group")$={type:"report",mode:"create",groupId:s},y();else if(c==="edit")$={type:"report",mode:"edit",reportId:s},y();else if(c==="edit-tags")$={type:"tags",reportId:s},y();else if(c==="close-modal")$=null,y();else if(c==="detect-title")await ua(l.currentTarget.closest("form"));else if(c==="archive"){const u=f.reports.find(h=>h.id===s);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),E(),y(),I("已归档，可随时恢复")}else if(c==="restore"){const u=f.reports.find(h=>h.id===s);if(!u)return;u.archived=!1,u.archivedAt="",E(),y(),I("报告已恢复到原主题")}else if(c==="delete"){const u=f.reports.find(h=>h.id===s);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(f.reports=f.reports.filter(h=>h.id!==s),M===s&&(M=""),E(),y(),I("报告已永久删除"))}else if(c==="add-group")$={type:"group",mode:"create"},y();else if(c==="rename-group")f.groups.find(h=>h.id===s)&&($={type:"group",mode:"edit",groupId:s},y());else if(c==="delete-group"){const u=f.groups.find(h=>h.id===s);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(f.reports.forEach(h=>{h.groupId===s&&(h.groupId="inbox")}),f.groups=f.groups.filter(h=>h.id!==s),E(),y(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(n=>{let l=null,c=!1;const s=()=>{var d;D="",l=null,c=!1,(d=n.closest(".report-card"))==null||d.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(m=>{m.classList.remove("is-card-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",d=>{var m,v;d.preventDefault(),D=n.dataset.reportDragId,x="",l={x:d.clientX,y:d.clientY},c=!1,(m=n.setPointerCapture)==null||m.call(n,d.pointerId),(v=n.closest(".report-card"))==null||v.classList.add("is-dragging")}),n.addEventListener("pointermove",d=>{if(!D||l&&Math.hypot(d.clientX-l.x,d.clientY-l.y)<7)return;c=!0;const m=document.elementFromPoint(d.clientX,d.clientY),v=m==null?void 0:m.closest(".report-card"),u=m==null?void 0:m.closest(".group-column");document.querySelectorAll(".report-card").forEach(h=>{h.classList.toggle("is-card-drop-target",!!(v&&v!==n.closest(".report-card")&&h===v))}),document.querySelectorAll(".group-column").forEach(h=>{h.classList.toggle("is-drop-ready",!!(u&&h===u))})}),n.addEventListener("pointerup",d=>{if(!D)return;const m=D;if(!c){R=m,s(),y(),I(`请选择目标${z()}`);return}const v=document.elementFromPoint(d.clientX,d.clientY),u=v==null?void 0:v.closest(".report-card"),h=v==null?void 0:v.closest(".group-column"),A=(u==null?void 0:u.dataset.reportId)||"",L=(h==null?void 0:h.dataset.bucketId)||"",p=(h==null?void 0:h.dataset.bucketKind)||k,b=A&&A!==m?V(m,p,L,A):L?V(m,p,L):!1;s(),b&&(y(),I(p==="tag"?"已添加目标标签":p==="type"?"工作类型已更新":A?"报告顺序已更新":"已移入新主题"))}),n.addEventListener("pointercancel",s)}),document.querySelectorAll(".group-drag-handle").forEach(n=>{const l=()=>{var c;x="",(c=n.closest(".group-column"))==null||c.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(s=>{s.classList.remove("is-group-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",c=>{var s,d;c.preventDefault(),x=n.dataset.groupDragId,D="",(s=n.setPointerCapture)==null||s.call(n,c.pointerId),(d=n.closest(".group-column"))==null||d.classList.add("is-group-dragging")}),n.addEventListener("pointermove",c=>{x&&document.querySelectorAll(".group-column").forEach(s=>{var d;s.classList.toggle("is-group-drop-target",s===((d=document.elementFromPoint(c.clientX,c.clientY))==null?void 0:d.closest(".group-column")))})}),n.addEventListener("pointerup",c=>{var m;if(!x)return;const s=x,d=(m=document.elementFromPoint(c.clientX,c.clientY))==null?void 0:m.closest(".group-column");if(d&&mt(s,d.dataset.groupId)){x="",y(),I("分组顺序已更新");return}l()}),n.addEventListener("pointercancel",l),n.addEventListener("keydown",c=>{var v;if(!["ArrowLeft","ArrowRight"].includes(c.key))return;c.preventDefault();const s=f.groups.findIndex(u=>u.id===n.dataset.groupDragId),d=c.key==="ArrowLeft"?s-1:s+1,m=f.groups[d];!m||!mt(n.dataset.groupDragId,m.id)||(y(),I("分组顺序已更新"),(v=document.querySelector(`[data-group-drag-id="${CSS.escape(n.dataset.groupDragId)}"]`))==null||v.focus())})}),document.querySelectorAll(".group-column").forEach(n=>{n.addEventListener("dragover",l=>{l.preventDefault(),n.classList.add(x?"is-group-drop-target":"is-drop-ready")}),n.addEventListener("dragleave",()=>{n.classList.remove("is-drop-ready","is-group-drop-target")}),n.addEventListener("drop",l=>{if(l.preventDefault(),x){if(n.dataset.bucketKind==="topic"&&mt(x,n.dataset.groupId)){x="",y(),I("分组顺序已更新");return}x="",n.classList.remove("is-group-drop-target");return}const c=f.reports.find(d=>d.id===D),s=n.dataset.bucketKind||k;c&&V(D,s,n.dataset.bucketId)&&(D="",y(),I(s==="tag"?"已添加目标标签":s==="type"?"工作类型已更新":"已移入新主题")),D=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(n=>{n.addEventListener("click",()=>{const l=document.querySelector('#tag-form input[name="tags"]');if(!l)return;const c=gt(l.value),s=n.dataset.tagSuggestion;l.value=c.includes(s)?c.filter(d=>d!==s).join("、"):[...c,s].slice(0,8).join("、"),n.classList.toggle("selected",!c.includes(s)),l.focus()})});const e=document.getElementById("tag-form");e==null||e.addEventListener("submit",n=>{n.preventDefault();const l=f.reports.find(c=>c.id===$.reportId);l&&(l.tags=gt(new FormData(e).get("tags")),E(),$=null,y(),I("标签已更新"))});const i=document.getElementById("group-form");i==null||i.addEventListener("submit",n=>{var d,m;n.preventDefault();const l=(d=new FormData(i).get("name"))==null?void 0:d.trim(),c=(m=new FormData(i).get("description"))==null?void 0:m.trim();if(!l)return;if($.mode==="edit"){const v=f.groups.find(u=>u.id===$.groupId);if(!v)return;v.name=l.slice(0,60),v.description=(c==null?void 0:c.slice(0,80))||"自定义工作主题"}else f.groups.push({id:yt("group"),name:l.slice(0,60),description:(c==null?void 0:c.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][f.groups.length%4],position:f.groups.length});E();const s=$.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";$=null,y(),I(s)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async n=>{n.preventDefault();const l=a.elements.url.value.trim();if(!lt(l))return;const c=a.querySelector('button[type="submit"]'),s=a.querySelector(".field-hint");c.disabled=!0,c.innerHTML='<span class="mini-spinner"></span>';const d=$.mode==="edit"?$.reportId:"",m=ee({material:l,files:[],url:l,excludeId:d});if(m){c.disabled=!1,c.textContent="保存",s.textContent=`成果库已有“${m.title}”，未重复保存`,I(`成果库已有“${m.title}”，未重复保存`);return}const v=await ne({material:l,files:[],url:l},w=>{s.textContent=w});if(!v.allowed){c.disabled=!1,c.textContent="保存",s.textContent=v.reason,I(v.reason);return}let u=a.elements.title.value.trim()||v.metadata.title;const h=a.elements.groupId.value,A=a.elements.workType.value,L=gt(a.elements.tags.value),p={title:u||Z(l),url:l,groupId:h,workType:A,source:"手动添加",access:v.access,detectedDescription:v.metadata.description,manualSaved:!0,isProduction:v.access==="production",isPersonal:ae(l),isHtml:v.isHtml,loginProvider:v.loginProvider},b=[...new Set([...F(p,A),...L])].slice(0,8);if($.mode==="edit"){const w=f.reports.find(C=>C.id===$.reportId);Object.assign(w,p,{tags:b})}else{const w={id:yt("report"),groupId:h,...p,pinned:!1,position:f.reports.filter(C=>C.groupId===h).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:"",tags:b};f.reports.push(w)}E(),$=null,y(),I("报告已保存")});const r=M&&f.reports.find(n=>n.id===M);r&&Fe(r)}function ma(){y()}ma(document.getElementById("app"));
