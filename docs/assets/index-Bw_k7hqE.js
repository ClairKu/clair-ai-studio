(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const c of r)if(c.type==="childList")for(const o of c.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function i(r){const c={};return r.integrity&&(c.integrity=r.integrity),r.referrerPolicy&&(c.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?c.credentials="include":r.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function a(r){if(r.ep)return;r.ep=!0;const c=i(r);fetch(r.href,c)}})();const pe=[{id:"save",name:"Save",hint:"Recognize and add to the library"},{id:"decision",name:"Decide",hint:"Copy a decision brief"},{id:"review",name:"Review",hint:"Copy a review brief"}],Ft={save:`
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
    </svg>`},J=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let T=bt();function bt(){return{material:"",files:[]}}function me(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function ge(t){var r;const e=t.toLowerCase(),a=((r=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,c])=>c.some(o=>e.includes(o))))==null?void 0:r[0])||"solution";return J.find(c=>c.id===a)||J[1]}function he(t,e,i){const a=(t.files||[]).map(r=>`- ${r.name}${r.sizeLabel?`（${r.sizeLabel}）`:""}`).join(`
`);return[`Task: ${i==="decision"?"Decision":"Review"}`,`Matched skill: ${e.name}`,"","Material:",t.material||"(No pasted text)",a?`
Attachments:
${a}`:""].filter(Boolean).join(`
`)}function fe(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function U(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const a=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name),r=/\.html?$/i.test(i.name);let c="",o="";if(a&&i.size<=1024*1024)try{const l=await i.text();c=l.slice(0,12e3),r&&(o=l)}catch{c="",o=""}return{id:me(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:fe(i.size),excerpt:c,content:o}}))}function be(t){return T.files.length?`<div class="attachment-list">${T.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function ve(t){return pe.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${t(e.name)}"
      title="${t(e.name)} · ${t(e.hint)}">
      ${Ft[e.id]}
      <span class="intake-action-label">${t(e.name)}</span>
    </button>`).join("")}function ye(t){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="Set an idea in motion"
            placeholder="Set an idea in motion">${t(T.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="Actions">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="Attach files" title="Attach files">
              <input id="task-files" type="file" multiple />
              ${Ft.upload}
              <span class="intake-action-label">Attach</span>
            </label>
            ${ve(t)}
          </div>
        </div>
        ${be(t)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function we({render:t,showToast:e,saveToLibrary:i}){document.querySelectorAll("[data-task-action]").forEach(l=>{l.addEventListener("click",async s=>{s.currentTarget.dataset.taskAction==="remove-file"&&(G(),T.files=T.files.filter(u=>u.id!==s.currentTarget.dataset.fileId),t())})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",async l=>{var p,h;if(l.preventDefault(),G(),!T.material.trim()&&!T.files.length){e("先粘贴内容，或加入一份材料"),(p=document.getElementById("task-goal"))==null||p.focus();return}const s=((h=l.submitter)==null?void 0:h.dataset.submitAction)||"save",d=l.submitter,u={material:T.material.trim(),files:T.files};if(s==="save"){const I=a.querySelector("#intake-save-status"),m=[...a.querySelectorAll("button, textarea, input")],y=w=>{m.forEach(q=>{q.disabled=!0}),a.setAttribute("aria-busy","true"),a.classList.add("is-saving"),I.hidden=!1,I.querySelector("strong").textContent=w,d.setAttribute("aria-label","保存中"),d.innerHTML='<span class="mini-spinner"></span>'};y("正在检查成果库与页面访问状态…");try{const w=await i(u,y);if(w.rejected){t(),e(w.reason);return}if(w.duplicate){t(),e(`成果库已有“${w.title}” · 位于“${w.groupName}”，未重复保存`);return}T=bt(),t(),e(`已保存到“${w.groupName}” · ${w.workTypeName} · 标签：${w.tags.join(" / ")||"待补标签"}`)}catch{m.forEach(w=>{w.disabled=!1}),t(),e("保存失败，请稍后重试")}return}const v=ge([u.material,...u.files.map(I=>`${I.name}
${I.excerpt}`)].join(`
`)),f=s==="decision"?J.find(I=>I.id==="decision"):v.id==="decision"?J.find(I=>I.id==="solution"):v;try{await navigator.clipboard.writeText(he(u,f,s)),e(`${s==="decision"?"Decision":"Review"} brief copied`)}catch{e("Copy failed — select the material and try again");return}T=bt(),t()});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async l=>{G(),T.files.push(...await U(l.target.files)),t(),e(`已加入 ${l.target.files.length} 个文件`)});const c=document.querySelector(".prompt-composer");c==null||c.addEventListener("dragover",l=>{l.preventDefault(),c.classList.add("drag-over")}),c==null||c.addEventListener("dragleave",()=>c.classList.remove("drag-over")),c==null||c.addEventListener("drop",async l=>{l.preventDefault(),l.stopPropagation(),c.classList.remove("drag-over"),G();const s=l.dataTransfer.files;T.files.push(...await U(s)),t(),e(`已加入 ${s.length} 个文件`)});const o=document.getElementById("task-goal");requestAnimationFrame(()=>Ct(o)),o==null||o.addEventListener("input",()=>{T.material=o.value,Ct(o)}),o==null||o.addEventListener("paste",async l=>{var f;const s=[...((f=l.clipboardData)==null?void 0:f.items)||[]].filter(p=>p.kind==="file").map(p=>p.getAsFile()).filter(Boolean);if(!s.length)return;l.preventDefault();const d=l.clipboardData.getData("text/plain"),u=o.selectionStart??o.value.length,v=o.selectionEnd??u;T.material=`${o.value.slice(0,u)}${d}${o.value.slice(v)}`,T.files.push(...await U(s)),t(),e(`已从剪贴板加入 ${s.length} 个材料`)}),$e({render:t,showToast:e})}function G(){const t=document.getElementById("task-goal");t&&(T.material=t.value)}function Ct(t){if(!t)return;t.style.height="auto";const e=Math.min(Math.max(t.scrollHeight,40),180);t.style.height=`${e}px`,t.style.overflowY=t.scrollHeight>180?"auto":"hidden"}function Dt(){document.querySelector(".prompt-composer")&&requestAnimationFrame(()=>{var e;(e=document.getElementById("task-goal"))==null||e.focus({preventScroll:!0})})}function ke(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function $e({render:t,showToast:e}){document.onpaste=async i=>{var o,l;if(ke(i.target)||!document.querySelector(".prompt-composer"))return;const r=[...((o=i.clipboardData)==null?void 0:o.items)||[]].filter(s=>s.kind==="file").map(s=>s.getAsFile()).filter(Boolean),c=((l=i.clipboardData)==null?void 0:l.getData("text/plain"))||"";!r.length&&!c.trim()||(i.preventDefault(),T.material=[T.material.trim(),c.trim()].filter(Boolean).join(`

`),r.length&&T.files.push(...await U(r)),t(),requestAnimationFrame(Dt),e(r.length?`已从剪贴板加入 ${r.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=i=>{var a;[...((a=i.dataTransfer)==null?void 0:a.types)||[]].includes("Files")&&i.preventDefault()},document.ondrop=async i=>{var r,c,o;if((c=(r=i.target)==null?void 0:r.closest)!=null&&c.call(r,".prompt-composer"))return;const a=((o=i.dataTransfer)==null?void 0:o.files)||[];a.length&&(i.preventDefault(),T.files.push(...await U(a)),t(),requestAnimationFrame(Dt),e(`已拖入 ${a.length} 个文件`))}}const it="clair-report-editor-v1",Ae="https://api.github.com",zt="2026",Ie="clair-report-editor-draft-v1:",n={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null},X=new Map;let Mt=!1;function At(t){return[...new Set(t.filter(Boolean))]}function vt(t=n.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function It(t){return`${Ie}${t}`}function Se(t){try{const e=sessionStorage.getItem(It(t));if(!e)return null;const i=JSON.parse(e);return!(i!=null&&i.html)||typeof i.html!="string"?null:i}catch{return null}}function St(t=n.reportId){try{sessionStorage.removeItem(It(t))}catch{}}function Zt(){return n.dirty&&n.hasDraft?{tone:"changed",label:n.isLocal?"有新修订 · 上次暂存待保存":"有新修订 · 上次暂存待推送"}:n.dirty?{tone:"changed",label:"已修订 · 未暂存"}:n.hasDraft?{tone:"staged",label:n.isLocal?"已暂存 · 待保存成果库":"已暂存 · 待推送生产"}:n.lastCommit?{tone:"published",label:n.isLocal?"成果库 HTML 已更新":"生产档案已更新"}:{tone:"clean",label:"未修改"}}function H(){const t=Zt(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const i=document.querySelector('[data-editor-action="stash"]');if(i){i.disabled=n.status!=="ready"||n.saving||!n.dirty;const c=!n.dirty&&n.hasDraft?"已暂存":"暂存修改";i.setAttribute("aria-label",c),i.title=c}const a=document.querySelector('[data-editor-action="publish"]');if(a){a.disabled=n.status!=="ready"||n.saving||!n.dirty&&!n.hasDraft;const c=n.saving?n.isLocal?"正在保存到成果库":"正在推送生产":n.isLocal?"保存到成果库":"推送生产";a.setAttribute("aria-label",c),a.title=c,a.classList.toggle("is-saving",n.saving)}const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=n.status!=="ready"||n.saving||!n.hasDraft)}function Te(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Le(t){const e=atob(String(t||"").replace(/\s/g,"")),i=Uint8Array.from(e,a=>a.charCodeAt(0));return new TextDecoder().decode(i)}function Ee(t){const e=new TextEncoder().encode(t);let i="";const a=32768;for(let r=0;r<e.length;r+=a)i+=String.fromCharCode(...e.subarray(r,r+a));return btoa(i)}function ut(t){let e="";for(let a=0;a<t.length;a+=32768)e+=String.fromCharCode(...t.subarray(a,a+32768));return btoa(e)}function pt(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function _t(t,e){const i=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function Rt(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const i=JSON.parse(e[1]),a=pt(i.salt),r=pt(i.iv),c=await _t(zt,a),o=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},c,pt(i.data)),l=new TextDecoder().decode(o);if(!/<html[\s>]/i.test(l))throw new Error("解密结果不是 HTML");return{html:l,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function Tt(t){var o;if(((o=n.protection)==null?void 0:o.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await _t(zt,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,new TextEncoder().encode(t)),c=JSON.stringify({salt:ut(e),iv:ut(i),data:ut(new Uint8Array(r))});return n.protection.wrapperHtml.replace(n.protection.payloadSource,c)}function xe(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const i=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),a=i.shift()||"ClairKu.github.io";let r=i.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const c=At([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:a,branch:"main",path:c[0],candidates:c,source:"auto"}}catch{return null}}async function Q(t,{token:e="",method:i="GET",body:a}={}){var o;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),a!==void 0&&(r["Content-Type"]="application/json");const c=await fetch(`${Ae}${t}`,{method:i,headers:r,body:a===void 0?void 0:JSON.stringify(a)});if(!c.ok){let l="";try{l=((o=await c.json())==null?void 0:o.message)||""}catch{l=await c.text()}const s=new Error(l||`GitHub API ${c.status}`);throw s.status=c.status,s}return c.status===204?null:c.json()}async function qe(t){var o;const e=await Q(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const i=At((o=t.candidates)!=null&&o.length?t.candidates:[t.path]);let a=null,r=null;const c=[];for(const l of i)try{const s=l.split("/").map(encodeURIComponent).join("/"),d=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${s}?ref=${encodeURIComponent(t.branch)}`,u=await Q(d);let v="";if(u.encoding==="base64"&&u.content)v=Le(u.content);else if(u.download_url){const f=await fetch(u.download_url,{cache:"no-store"});if(!f.ok)throw new Error("无法读取 GitHub 原始文件");v=await f.text()}if(!v)throw new Error("GitHub 文件内容为空");r?v===r.html&&c.push({path:l,sha:u.sha}):r={html:v,target:{...t,path:l,sha:u.sha,candidates:i}}}catch(s){if(a=s,s.status&&![403,404].includes(s.status))break}if(r)return r.target.mirrors=c,r;throw a||new Error("没有找到对应的 GitHub HTML 文件")}function Ce(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{/^on/i.test(a.name)&&(e.setAttribute(`data-clair-event-${a.name.toLowerCase()}`,a.value),e.removeAttribute(a.name))});const i=e.getAttribute("href");i&&/^\s*javascript:/i.test(i)&&(e.dataset.clairJavascriptHref=i,e.removeAttribute("href"))})}function De(){return`
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
`}function Me(t,e){const a=new DOMParser().parseFromString(t,"text/html");a.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(l=>{l.dataset.clairEditorHttpEquiv=l.getAttribute("http-equiv")||"Content-Security-Policy",l.setAttribute("http-equiv","x-clair-csp-disabled")}),Ce(a);const r=a.createElement("base");r.href=e,r.dataset.clairEditorBase="true",a.head.prepend(r);const c=a.createElement("style");c.id="clair-editor-style",c.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,a.head.append(c);const o=a.createElement("script");return o.id="clair-editor-bridge",o.textContent=De(),a.body.append(o),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function Gt(t){if(t.url)return"";if(t.savedHtml)return t.savedHtml;const e=(t.savedFiles||[]).find(i=>/\.html?$/i.test(i.name||""));return e!=null&&e.content||e!=null&&e.excerpt?e.content||e.excerpt:/<!doctype\s+html|<html[\s>]/i.test(t.savedContent||"")?t.savedContent.trim():""}async function Kt(t){var e;try{const i=Gt(t),a=i?null:xe(t.url);let r=null;if(i)r={html:i,target:null};else if(a)try{r=await qe(a)}catch{}if(!r&&t.url){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);r={html:await s.text(),target:a}}const c=await Rt(r.html);n.protection=c.protection,n.target=r.target||a;let o=c.html;const l=Se(t.id);if(l!=null&&l.html)try{const s=await Rt(l.html);o=s.html,n.hasDraft=!0,n.draftHtml=s.html,n.draftAt=l.savedAt||"",l.baseFiles&&n.target&&(n.target.baseFiles=l.baseFiles)}catch{St(t.id)}n.html=o,n.editorDocument=Me(o,t.url||window.location.href),n.status="ready",n.error=""}catch(i){n.status="error",n.error=(i==null?void 0:i.message)||"无法读取这份 HTML"}finally{n.loadPromise=null,(e=n.render)==null||e.call(n)}}function Yt(){const t=n.render,e=n.showToast;Object.assign(n,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:t,showToast:e})}function Lt(){return document.querySelector(".report-editor-frame")}function mt(t,e=null){var a;const i=Lt();(a=i==null?void 0:i.contentWindow)==null||a.postMessage({channel:it,type:"command",command:t,value:e},"*")}function rt(){var i;const t=Lt();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((a,r)=>{const c=window.setTimeout(()=>{X.delete(e),r(new Error("读取编辑内容超时"))},1e4);X.set(e,{resolve:o=>{clearTimeout(c),a(o)}}),t.contentWindow.postMessage({channel:it,type:"serialize",requestId:e},"*")})}function Re(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Wt(t,e){const i=new Blob([t],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(i),r=document.createElement("a");r.href=a,r.download=Re(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Vt(t){await navigator.clipboard.writeText(t)}function Pe(t,e){var r;const i=new DOMParser().parseFromString(t,"text/html");(r=i.querySelector("base[data-clair-preview-base]"))==null||r.remove();const a=i.createElement("base");return a.href=e,a.dataset.clairPreviewBase="true",i.head.prepend(a),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}function He(t){if(!n.hasDraft||!n.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([Pe(n.draftHtml,t.url||window.location.href)],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(e),a=window.open(i,"_blank");if(!a)throw URL.revokeObjectURL(i),new Error("浏览器拦截了新窗口，请允许弹窗后重试");a.opener=null,window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}async function tt(t,{silent:e=!1}={}){var c;const i=await rt(),a=await Tt(i),r=new Date().toISOString();try{sessionStorage.setItem(It(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:vt(),html:a}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return n.html=i,n.draftHtml=i,n.draftAt=r,n.hasDraft=!0,n.dirty=!1,n.lastCommit="",H(),e||(c=n.showToast)==null||c.call(n,n.isLocal?"已暂存在当前浏览器会话，尚未写回成果库":"已暂存在当前浏览器会话，尚未更新 GitHub"),i}async function Oe(t){var e,i;if(!(n.saving||!n.saveLocal)){n.saving=!0,H();try{const a=n.dirty?await tt(t,{silent:!0}):n.draftHtml||await rt();await n.saveLocal(a),n.html=a,n.dirty=!1,n.hasDraft=!1,n.draftHtml="",n.draftAt="",n.lastCommit="local",St(t.id),(e=n.showToast)==null||e.call(n,"已更新成果库中的 HTML")}catch(a){(i=n.showToast)==null||i.call(n,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{n.saving=!1,H()}}}async function Be(t){var l,s;const e=n.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!n.token)throw new Error("请先提供 GitHub Fine-grained Token");const i=await Tt(t),a=(e.mirrors||[]).map(d=>d.path),r=At([...a.filter(d=>d.startsWith("public/")),...a.filter(d=>!d.startsWith("public/")&&d!==e.path),e.path]);let c="";const o=[];for(const d of r)try{const u=d.split("/").map(encodeURIComponent).join("/"),v=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${u}`,f=await Q(`${v}?ref=${encodeURIComponent(e.branch)}`,{token:n.token}),p=vt(e)[d];if(p&&f.sha!==p)throw new Error(`生产文件 ${d} 已在本次编辑后更新，请重新打开报告合并修改`);const h=await Q(v,{token:n.token,method:"PUT",body:{message:`Update ${n.reportTitle} from Clair's Studio`,content:Ee(i),sha:f.sha,branch:e.branch}});c=((l=h==null?void 0:h.commit)==null?void 0:l.sha)||c,e.baseFiles={...vt(e),[d]:((s=h==null?void 0:h.content)==null?void 0:s.sha)||f.sha},o.push(d)}catch(u){throw o.length?new Error(`已更新 ${o.join("、")}，但 ${d} 同步失败：${u.message}`):u}return{commit:c,files:o.length}}async function Pt(t){var e,i;if(!n.saving){n.saving=!0,H();try{const a=n.dirty?await tt(t,{silent:!0}):n.draftHtml||await rt(),r=await Be(a);n.html=a,n.dirty=!1,n.hasDraft=!1,n.draftHtml="",n.draftAt="",n.lastCommit=r.commit,St(t.id),(e=n.showToast)==null||e.call(n,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(a){(i=n.showToast)==null||i.call(n,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{n.saving=!1,H()}}}function Ue(t){const e=n.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${n.settingsOpen?"":"hidden"}>
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
            placeholder="${n.token?"已连接；留空可继续使用当前 Token":"github_pat_…"}" ${n.token?"":"required"} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">Cancel</button>
          <button type="submit" class="primary-button">${n.pendingSave?"Connect & save":"Save settings"}</button>
        </div>
      </form>
    </div>`}function Ne(t){const e=n.target?`${n.target.owner}/${n.target.repository} · ${n.target.path}`:"尚未识别 GitHub 文件路径";return`
    <div class="dialog-backdrop editor-publish-backdrop" ${n.publishConfirmOpen?"":"hidden"}>
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
          <button type="button" class="quiet-button" data-editor-action="close-publish">Continue editing</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">Publish</button>
        </div>
      </section>
    </div>`}function Ht({pendingSave:t=!1}={}){n.settingsOpen=!0,n.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const i=e.querySelector("#editor-settings-form"),a=n.target||{};if(i){i.elements.owner.value=a.owner||"ClairKu",i.elements.repository.value=a.repository||"",i.elements.branch.value=a.branch||"main",i.elements.path.value=a.path||"";const r=i.querySelector('button[type="submit"]');r&&(r.textContent=t?"Connect & save":"Save settings")}}function K(){n.settingsOpen=!1,n.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function je(){n.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function Y(){n.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Jt(t=""){return!!(n.reportId&&(!t||n.reportId===t))}function Ot(t,{render:e,showToast:i,saveLocal:a=null}){Yt(),Object.assign(n,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:i,isLocal:!!(Gt(t)&&a),saveLocal:a}),e(),n.loadPromise=Kt(t)}function Fe(t,e){var d;const i=n.isLocal?"本地成果 · 保存在当前浏览器":n.target?`${n.target.owner}/${n.target.repository} · ${n.target.path}${(d=n.target.mirrors)!=null&&d.length?` · 同步 ${n.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",a=Zt(),r=n.status==="ready"?`
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
      </div>`:"",c=n.status==="loading"?`<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>${n.isLocal?"修改后可保存回成果库，也可下载 HTML。":"会自动识别对应 GitHub 仓库与源文件。"}</p></div>`:n.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(n.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">Retry</button><button class="primary-button" type="button" data-editor-action="download-published">Download source HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${Te(n.editorDocument)}"></iframe></div>`,o=u=>({back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>',stash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>',preview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>',publish:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>'})[u],l=!n.dirty&&n.hasDraft?"已暂存":"暂存修改",s=n.saving?n.isLocal?"正在保存到成果库":"正在推送生产":n.isLocal?"保存到成果库":"推送生产";return`
    <main class="reader-shell report-editor-shell compact-editor-shell">
      <header class="reader-header editor-header compact-reader-header compact-editor-header">
        <button class="reader-icon-button back-button" type="button" data-editor-action="exit"
          aria-label="退出编辑" title="退出编辑">${o("back")}</button>
        <div class="reader-title">
          <strong>${e(t.title)}</strong>
          <div class="editor-meta-row">
            <span class="editor-revision-status is-${a.tone}">${e(a.label)}</span>
            <span class="editor-target-label" title="${e(i)}">${e(i)}</span>
          </div>
        </div>
        <div class="reader-actions editor-actions compact-reader-actions compact-editor-actions" aria-label="编辑操作">
          ${n.isLocal?"":`
            <button class="reader-icon-button" type="button" data-editor-action="settings"
              aria-label="保存权限" title="保存权限">${o("settings")}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${l}" title="${l}"
            ${n.status!=="ready"||n.saving||!n.dirty?"disabled":""}>${o("stash")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${n.status!=="ready"||!n.hasDraft?"disabled":""}>${o("preview")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${o("download")}</button>
          ${t.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${o("copy")}</button>`:""}
          <button class="reader-icon-button publish-icon-action${n.saving?" is-saving":""}" type="button"
            data-editor-action="publish" aria-label="${s}" title="${s}"
            ${n.status!=="ready"||n.saving||!n.dirty&&!n.hasDraft?"disabled":""}>${o("publish")}</button>
        </div>
      </header>
      ${r}
      ${c}
      ${Ue(e)}
      ${Ne(e)}
    </main>`}function ze(t){if(!Jt(t.id))return;Mt||(Mt=!0,window.addEventListener("message",a=>{var c;const r=Lt();if(!(!(r!=null&&r.contentWindow)||a.source!==r.contentWindow)&&((c=a.data)==null?void 0:c.channel)===it){if(a.data.type==="dirty"&&(n.dirty=!0,n.lastCommit="",H()),a.data.type==="serialized"){const o=X.get(a.data.requestId);if(!o)return;X.delete(a.data.requestId),o.resolve(a.data.html)}a.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(o=>{const l=o.dataset.editorCommand;["bold","italic","underline"].includes(l)&&o.classList.toggle("active",!!a.data[l])})}}),window.addEventListener("beforeunload",a=>{!n.reportId||!n.dirty||(a.preventDefault(),a.returnValue="")}),window.addEventListener("keydown",a=>{a.key!=="Escape"||!n.reportId||(n.publishConfirmOpen?Y():n.settingsOpen&&K())})),document.querySelectorAll("[data-editor-command]").forEach(a=>{a.addEventListener("mousedown",r=>r.preventDefault()),a.addEventListener("click",()=>mt(a.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{mt("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(a=>{a.addEventListener("click",async()=>{var c,o,l,s,d,u,v,f,p,h,I,m;const r=a.dataset.editorAction;if(r==="exit"){if(n.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const y=n.render;Yt(),y==null||y()}else if(r==="settings")Ht();else if(r==="close-settings")K();else if(r==="stash")try{await tt(t)}catch(y){(c=n.showToast)==null||c.call(n,(y==null?void 0:y.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{He(t),(o=n.showToast)==null||o.call(n,"已在新窗口打开暂存修订")}catch(y){(l=n.showToast)==null||l.call(n,(y==null?void 0:y.message)||"无法打开预览")}else if(r==="publish")try{if(n.isLocal){await Oe(t);return}if(n.dirty&&await tt(t,{silent:!0}),!n.hasDraft){(s=n.showToast)==null||s.call(n,"当前没有待推送的修订");return}je()}catch(y){(d=n.showToast)==null||d.call(n,(y==null?void 0:y.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")Y();else if(r==="confirm-publish")Y(),!n.token||!((u=n.target)!=null&&u.path)?Ht({pendingSave:!0}):await Pt(t);else if(r==="download")try{const y=await rt();Wt(await Tt(y),t.title),(v=n.showToast)==null||v.call(n,"HTML 已下载")}catch(y){(f=n.showToast)==null||f.call(n,(y==null?void 0:y.message)||"下载失败")}else if(r==="download-published")await Xt(t,n.showToast);else if(r==="share")try{await Vt(t.url),(p=n.showToast)==null||p.call(n,"报告链接已复制")}catch{(h=n.showToast)==null||h.call(n,"复制失败，请从地址栏复制")}else if(r==="link"){const y=prompt("输入链接地址（https://…）");if(!y)return;try{const w=new URL(y);if(!["http:","https:","mailto:"].includes(w.protocol))throw new Error;mt("createLink",w.href)}catch{(I=n.showToast)==null||I.call(n,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(n.status="loading",n.error="",(m=n.render)==null||m.call(n),n.loadPromise||(n.loadPromise=Kt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(a=>{a.addEventListener("click",r=>{r.target===a&&(a.classList.contains("editor-settings-backdrop")?K():Y())})});const i=document.getElementById("editor-settings-form");i==null||i.addEventListener("submit",async a=>{var d,u,v;a.preventDefault();const r=new FormData(i),c=String(r.get("github-token-not-password")||"").trim();c&&(n.token=c);const o=String(r.get("path")||"").trim().replace(/^\/+/,"");n.target={...n.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:o,mirrors:o===((d=n.target)==null?void 0:d.path)?((u=n.target)==null?void 0:u.mirrors)||[]:[],source:"manual"};const l=n.pendingSave;K();const s=document.querySelector(".editor-target-label");if(s){const f=`${n.target.owner}/${n.target.repository} · ${n.target.path}`;s.textContent=f,s.title=f}(v=n.showToast)==null||v.call(n,"保存权限已连接"),l&&await Pt(t)})}async function Xt(t,e){try{const i=await fetch(t.url,{cache:"no-store"});if(!i.ok)throw new Error;Wt(await i.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function Ze(t,e){try{await Vt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const _e={production:"生产 直达 public",org:"组织 登录 restricted",account:"账号 登录 restricted"};function nt(t=""){return String(t).normalize("NFKC").toLocaleLowerCase("zh-CN").normalize("NFD").replace(new RegExp("\\p{Diacritic}","gu"),"").replace(/\s+/g," ").trim()}function Ge(t=""){return nt(t).split(" ").filter(Boolean)}function Qt(t,e,{group:i={},workTypeName:a=""}={}){const r=Ge(e);if(!r.length)return!0;const c=nt([t.title,t.source,t.url,t.access,_e[t.access],a,...t.tags||[],i.name,i.description].filter(Boolean).join(" "));return r.every(o=>c.includes(o))}const Et="clair-service-report-workbench-v1",xt="clair-service-report-workbench-access",j="clair-service-report-workbench-view",te="clair-service-report-workbench-bucket-order-v1",R=8,ot=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],V=["手动保存","生产","个人","HTML","本体","飞书","调研","产品规划","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],O={version:R,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"workbench-quality-audit-2026-07-30",groupId:"ai-workbench",title:"Clair's Studio｜全站质量审计与修复报告",url:"https://clairku.github.io/clair-ai-studio/reports/workbench-quality-audit-2026-07-30/",preview:"workbench-quality-audit-2026-07-30.svg",pinned:!0,position:0,createdAt:"2026-07-29T18:20:00.000Z",source:"生产质量审计",access:"production"},{id:"yingmi-ai-materials-compendium-2026-07-30",groupId:"ai-platform",title:"盈米 AI 业务全景档案｜OAP × 小顾 × 顾问工作台",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-materials-compendium-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T06:30:00.000Z",source:"飞书根材料与 40 个档案节点",access:"production"},{id:"ai-three-projects-management-deck-2026-07-30",groupId:"reporting",title:"三个 AI 项目管理层汇报｜一条金融服务生产链",url:"https://clairku.github.io/clair-ai-studio/reports/ai-three-projects-management-deck-2026-07-30/",preview:"ai-three-projects-management-deck-2026-07-30.png",pinned:!0,position:0,createdAt:"2026-07-30T07:00:00.000Z",source:"飞书根材料与三个项目汇总",access:"production"},{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!0,position:5,createdAt:"2026-07-30T08:00:00.000Z",source:"OAP 管理层汇报成稿",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-productization-roadshow-2026-07-30",groupId:"reporting",title:"AI 产品化实践路演｜CEO / CTO",url:"https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T00:00:00.000Z",source:"CEO / CTO 路演材料",access:"production"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},yt={"workbench-quality-audit-2026-07-30":"governance-review","yingmi-ai-materials-compendium-2026-07-30":"reporting","seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-productization-roadshow-2026-07-30":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},ee={"yingmi-ai-materials-compendium-2026-07-30":"ai-platform","qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function st(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|Studio|工作台|原型/i.test(e)?"product-demo":"product-planning"}function F(t,e=st(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`,a=[],r=c=>{a.includes(c)||a.push(c)};return t.manualSaved&&r("手动保存"),t.isProduction&&r("生产"),t.isPersonal&&r("个人"),t.isHtml&&r("HTML"),/ontology\.yingmi-inc\.com|本体/.test(i)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&r("调研"),e==="product-planning"&&r("产品规划"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&r("AI 小顾"),(/studio|workbench|工作台|skill-audit/i.test(i)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(i)&&r("且慢"),/投顾|advisor|财务规划/.test(i)&&r("投顾服务"),/OAP|oap-/.test(i)&&r("OAP"),/MCP|mcp-/.test(i)&&r("MCP"),/Skills|skill-/.test(i)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),a.slice(0,5)}function Ke(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/Studio|工作台|生产力|Copilot|编辑器/i.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":{"requirement-review":"product-planning","competitive-research":"product-planning",reporting:"reporting","data-analysis":"reporting","investment-research":"research","governance-review":"knowledge","product-demo":"ai-workbench","product-planning":"product-planning"}[t.workType]||"inbox"}O.reports=O.reports.map(t=>{const e=ee[t.id]||t.groupId,i=yt[t.id]||st(t),a={...t,groupId:e,workType:i};return{...a,tags:F(a,i)}});let b=We(),wt=Ye(),L="",D="",z=!1,$=["topic","type","tag","time"].includes(localStorage.getItem(j))?localStorage.getItem(j):"topic",C="",x="",M="",A=null,Bt=0;function ae(t){return JSON.parse(JSON.stringify(t))}function Ye(){try{const t=JSON.parse(localStorage.getItem(te));if(t&&typeof t=="object")return Object.fromEntries(Object.entries(t).map(([e,i])=>[e,Array.isArray(i)?i.filter(a=>typeof a=="string"):[]]))}catch{}return{}}function N(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function We(){try{const t=JSON.parse(localStorage.getItem(Et));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return Ve(t)}catch{}return ae(O)}function Ve(t){const e=ae(O),i=new Set(e.groups.map(m=>m.id)),a=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(m=>[m.id,m])),c=e.groups.map(m=>{const y=r.get(m.id);return!y||t.version<R?m:{...m,name:y.name||m.name,description:y.description||m.description,position:Number.isFinite(y.position)?y.position:m.position}});t.groups.filter(m=>!i.has(m.id)&&!a.has(m.id)).forEach((m,y)=>{c.push({...m,description:m.description||"自定义工作分组",position:Number.isFinite(m.position)?m.position:O.groups.length+y})});const o=c.filter((m,y,w)=>w.findIndex(q=>q.id===m.id)===y);o.sort((m,y)=>(m.position||0)-(y.position||0));const l={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},s={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},d=t.reports.map(m=>({...m,groupId:ee[m.id]||l[m.id]||s[m.groupId]||m.groupId||"inbox",workType:m.workType||yt[m.id]||st(m),tags:Array.isArray(m.tags)&&m.tags.length?m.tags:F(m,m.workType||yt[m.id])})),u=new Map(d.map(m=>[m.id,m])),v=new Map(d.map(m=>[N(m.url),m])),f=new Set,p=new Set,h=e.reports.map(m=>{const y=N(m.url);f.add(y),p.add(m.id);const w=u.get(m.id)||v.get(y);return w?{...m,title:t.version>=R&&w.title||m.title,groupId:t.version>=R&&o.some(q=>q.id===w.groupId)?w.groupId:m.groupId,workType:t.version>=R&&w.workType?w.workType:m.workType,tags:t.version>=R&&Array.isArray(w.tags)&&w.tags.length?w.tags:m.tags,pinned:!!w.pinned,position:Number.isFinite(w.position)?w.position:m.position,archived:!!w.archived,archivedAt:w.archivedAt||""}:m});d.forEach(m=>{const y=N(m.url);p.has(m.id)||y&&f.has(y)||(p.add(m.id),y&&f.add(y),h.push(m))});const I={version:R,groups:o,reports:h};return localStorage.setItem(Et,JSON.stringify(I)),I}function E(){b.version=R,b.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(Et,JSON.stringify(b))}function Je(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(lt)||""}function Xe(t,e,i){var o,l,s;const r=(l=(o=ct(t,e).match(/<title[^>]*>([\s\S]*?)<\/title>/i))==null?void 0:o[1])==null?void 0:l.replace(/\s+/g," ").trim();if(r)return r.slice(0,100);const c=String(t).split(/\n/).map(d=>d.trim().replace(/^#+\s*/,"")).find(d=>d&&!/^https?:\/\//i.test(d));return c?c.replace(/[。；;！!？?]+$/,"").slice(0,100):(s=e[0])!=null&&s.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):i?_(i):"未命名成果"}function Ut(t=""){return String(t).trim().replace(/\s+/g," ").toLocaleLowerCase()}function Nt(t=[]){return t.map(e=>`${String(e.name||"").trim().toLocaleLowerCase()}:${e.size||0}:${e.type||""}`).sort().join("|")}function ie({material:t,files:e,url:i,excludeId:a=""}){const r=i?N(i):"",c=Ut(t),o=Nt(e);return b.reports.find(l=>l.id===a?!1:r&&N(l.url)===r||c&&Ut(l.savedContent)===c?!0:!c&&!!o&&Nt(l.savedFiles)===o)||null}function re(t=""){var e;try{const i=new URL(t),a=i.hostname.toLowerCase(),r=(e=i.pathname.split("/").filter(Boolean)[0])==null?void 0:e.toLowerCase();return a==="clairku.github.io"||(a==="github.com"||a==="raw.githubusercontent.com")&&r==="clairku"}catch{return!1}}function Qe(t=""){try{return/\.html?$/i.test(new URL(t).pathname)}catch{return!1}}function ct(t="",e=[]){if(/<!doctype\s+html|<html[\s>]/i.test(t))return t.trim();const i=e.find(a=>/\.html?$/i.test(a.name));return(i==null?void 0:i.content)||(i==null?void 0:i.excerpt)||""}function ne(t=""){try{const e=new URL(t).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(e))return{access:"org",provider:"飞书组织帐号"};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(e))return{access:"account",provider:"腾讯文档帐号"};if(/(^|\.)yingmi-inc\.com$/.test(e))return{access:"org",provider:"盈米组织帐号"};if(e==="github.com"&&/^\/login(?:\/|$)/.test(new URL(t).pathname))return{access:"account",provider:"GitHub 帐号"}}catch{return null}return null}async function oe(t){var i,a;if(!lt(t))return{title:"",description:"",reachable:!1,checked:!0};const e=new URL(t);if(e.origin!==window.location.origin)return{title:"",description:"",reachable:!1,checked:!1};try{const r=await fetch(e.href,{headers:{Accept:"text/html"},signal:AbortSignal.timeout(1e4)});if(!r.ok)return{title:"",description:"",reachable:!1,checked:!0};const c=await r.text(),o=new DOMParser().parseFromString(c,"text/html");return{title:o.title.trim().slice(0,180),description:((a=(i=o.querySelector('meta[name="description"]'))==null?void 0:i.getAttribute("content"))==null?void 0:a.trim().slice(0,500))||"",reachable:!0,checked:!0}}catch{return{title:"",description:"",reachable:!1,checked:!1}}}async function se({material:t="",files:e=[],url:i=""},a=()=>{}){const r=ct(t,e),c=e.some(s=>/\.html?$/i.test(s.name));if(!i)return r?{allowed:!0,access:"local",metadata:{title:"",description:"",reachable:!0,checked:!0},isHtml:!0,savedHtml:r,loginProvider:""}:{allowed:!1,reason:c?"HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML":"只能保存可正常访问的网址或 HTML 内容"};const o=ne(i);a(o?"正在识别权限页面与登录入口…":"正在检查页面是否可正常访问…");const l=o?{title:"",description:"",reachable:!0,checked:!0}:await oe(i);return!o&&l.checked&&!l.reachable?{allowed:!1,reason:"页面无法正常访问，且不是可读取的 HTML，未保存"}:{allowed:!0,access:(o==null?void 0:o.access)||"production",metadata:l,isHtml:Qe(i),savedHtml:"",loginProvider:(o==null?void 0:o.provider)||""}}async function ta({material:t,files:e},i=()=>{}){var u,v;const a=Je(t);i("正在检查成果库是否已有相同内容…");const r=ie({material:t,files:e,url:a});if(r)return{...r,duplicate:!0,groupName:((u=b.groups.find(f=>f.id===r.groupId))==null?void 0:u.name)||"待整理",workTypeName:et(r.workType)};const c=await se({material:t,files:e,url:a},i);if(!c.allowed)return{rejected:!0,duplicate:!1,reason:c.reason};const o=Xe(t,e,a),l=c.metadata;i("正在识别标题、分组、类型与标签…");const s=new Date().toISOString(),d={id:$t("report"),groupId:"inbox",title:l.title||o,url:a,pinned:!1,position:0,createdAt:s,source:a?"快捷保存":"本地保存",access:c.access,archived:!1,archivedAt:"",savedContent:t,savedFiles:e,detectedDescription:l.description,manualSaved:!0,isProduction:c.access==="production",isPersonal:re(a),isHtml:c.isHtml,savedHtml:c.savedHtml,loginProvider:c.loginProvider};d.workType=st(d),d.groupId=Ke(d),d.tags=F(d,d.workType),i("正在保存到成果库…"),d.position=b.reports.filter(f=>!f.archived&&f.groupId===d.groupId).length,b.reports.push(d);try{E()}catch{return b.reports.pop(),{rejected:!0,duplicate:!1,reason:"HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试"}}return z=!1,$!=="time"&&($="topic"),L="",localStorage.setItem(j,$),{...d,duplicate:!1,groupName:((v=b.groups.find(f=>f.id===d.groupId))==null?void 0:v.name)||"待整理",workTypeName:et(d.workType)}}function ea(t,e){const i=b.groups.findIndex(c=>c.id===t),a=b.groups.findIndex(c=>c.id===e);if(i<0||a<0||i===a)return!1;const[r]=b.groups.splice(i,1);return b.groups.splice(a,0,r),b.groups.forEach((c,o)=>{c.position=o}),E(),!0}function gt(t,e){if(e==="topic")return t;const i=wt[e]||[];if(!i.length)return t;const a=new Map(i.map((r,c)=>[r,c]));return[...t].sort((r,c)=>{const o=a.has(r.id)?a.get(r.id):Number.MAX_SAFE_INTEGER,l=a.has(c.id)?a.get(c.id):Number.MAX_SAFE_INTEGER;return o-l})}function ht(t,e,i=$){if(!t||!e||t===e)return!1;if(i==="topic")return ea(t,e);const a=b.reports.filter(s=>!s.archived),r=ce(a).filter(s=>s.kind===i).map(s=>s.id),c=r.indexOf(t),o=r.indexOf(e);if(c<0||o<0)return!1;const[l]=r.splice(c,1);return r.splice(o,0,l),wt[i]=r,localStorage.setItem(te,JSON.stringify(wt)),!0}function aa(t,e,i=""){const a=b.reports.find(l=>l.id===t);if(!a||a.archived||!b.groups.find(l=>l.id===e))return!1;const c=b.reports.filter(l=>!l.archived&&l.groupId===e&&l.id!==t).sort((l,s)=>(l.position||0)-(s.position||0)),o=i?c.findIndex(l=>l.id===i):c.length;return a.groupId=e,c.splice(o<0?c.length:o,0,a),c.forEach((l,s)=>{l.position=s}),E(),!0}function et(t){var e;return((e=ot.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function jt(t){const e=new Date(t.createdAt||0).getTime();return Number.isFinite(e)?e:0}function kt(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?[e.getFullYear(),String(e.getMonth()+1).padStart(2,"0"),String(e.getDate()).padStart(2,"0")].join("-"):"unknown"}function ia(t){if(t==="unknown")return"时间待补";const[e,i,a]=t.split("-").map(Number),r=new Date(e,i-1,a),c=new Date,o=kt(c),l=new Date(c.getFullYear(),c.getMonth(),c.getDate()-1),s=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(r);return t===o?`今天 · ${s}`:t===kt(l)?`昨天 · ${s}`:e===c.getFullYear()?s:`${e}年 · ${s}`}function ra(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?`新增于 ${new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}`:"新增时间待补"}function ce(t,e=""){const i=a=>!e||nt(a).includes(e);if($==="time"){const a=new Map;return[...t].sort((r,c)=>jt(c)-jt(r)).forEach(r=>{const c=kt(r.createdAt);a.has(c)||a.set(c,[]),a.get(c).push(r)}),gt([...a.entries()].map(([r,c])=>({id:r,name:ia(r),kind:"time",accent:"slate",reports:c})),"time")}if($==="type")return gt(ot.map(a=>({id:a.id,name:a.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===a.id).sort((r,c)=>+!!c.pinned-+!!r.pinned||new Date(c.createdAt)-new Date(r.createdAt))})).filter(a=>!e||a.reports.length||i(a.name)),"type");if($==="tag"){const a=new Set(V);b.reports.forEach(c=>{(c.tags||[]).forEach(o=>a.add(o))});const r=[...a].sort((c,o)=>{const l=V.indexOf(c),s=V.indexOf(o);return l>=0||s>=0?(l<0?Number.MAX_SAFE_INTEGER:l)-(s<0?Number.MAX_SAFE_INTEGER:s):c.localeCompare(o,"zh-CN")});return gt(r.map(c=>({id:c,name:c,kind:"tag",accent:"violet",reports:t.filter(o=>(o.tags||[]).includes(c)).sort((o,l)=>+!!l.pinned-+!!o.pinned||new Date(l.createdAt)-new Date(o.createdAt))})).filter(c=>c.reports.length&&(!e||i(c.name)||c.reports.length)),"tag")}return b.groups.map(a=>({...a,kind:"topic",reports:t.filter(r=>r.groupId===a.id).sort((r,c)=>(r.position||0)-(c.position||0))})).filter(a=>!e||a.reports.length||i(`${a.name} ${a.description||""}`))}function W(t,e,i,a=""){const r=b.reports.find(c=>c.id===t);return!r||r.archived?!1:e==="topic"?aa(t,i,a):e==="type"?ot.some(c=>c.id===i)?(r.workType=i,E(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(i)||r.tags.push(i),E(),!0):!1}function Z(){return $==="type"?"工作类型":$==="tag"?"标签":$==="time"?"新增时间":"主题"}function $t(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function g(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}const na={back:`
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
    </svg>`};function B(t){return na[t]||""}function _(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function lt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function ft(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function S(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Bt),Bt=window.setTimeout(()=>e.remove(),2600)}function P(t="auto"){requestAnimationFrame(()=>{window.scrollTo({top:0,left:0,behavior:t})})}function at(t){return t.savedHtml||ct(t.savedContent,t.savedFiles)}function oa(t){return`${String(t.title||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,80)||"report"}.html`}function le(t){const e=at(t);return e?URL.createObjectURL(new Blob([e],{type:"text/html;charset=utf-8"})):""}function sa(t){const e=le(t);if(!e)return!1;const i=document.createElement("a");return i.href=e,i.download=oa(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(e),1e3),!0}function ca(t){const e=t.url||le(t);return e?(window.open(e,"_blank","noopener,noreferrer"),t.url||window.setTimeout(()=>URL.revokeObjectURL(e),6e4),!0):!1}function de(t,e=!1){const i=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),a=["org","account"].includes(t.access),r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",c=at(t),o=$==="time"?ra(t.createdAt):t.source||"手动添加",l=!a&&O.reports.some(u=>u.id===t.id),s=t.preview||`${t.id}.png`,d=c&&t.isHtml?`<iframe class="local-html-preview-frame" title="${g(t.title)}视觉预览"
        srcdoc="${g(c)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:l?`<img src="./previews/${g(s)}" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":g(t.title.slice(0,2))}</span>
        <strong>${a?r:i?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${M===t.id?"is-move-selected":""}" data-report-id="${g(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${g(t.id)}" aria-label="打开${g(t.title)}">
        <span class="report-preview">
          ${d}
        </span>
        <span class="report-copy">
          <span class="report-source">${g(o)}</span>
          <strong>${g(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(u=>`<span>${g(u)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${g(r)}</span>`:""}
        </span>
      </button>
      ${e||$==="time"?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${g(t.id)}"
          aria-label="拖动《${g(t.title)}》到其他${Z()}" title="拖动到其他${Z()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${g(t.id)}">Restore</button>
            <button type="button" data-action="delete" data-id="${g(t.id)}">Delete permanently</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${g(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${t.url?`<button type="button" data-action="edit" data-id="${g(t.id)}">Edit</button>`:""}
            <button type="button" data-action="archive" data-id="${g(t.id)}">Archive</button>`}
      </div>
    </article>`}function qt(){var i;if(!A)return"";if(A.type==="tags"){const a=b.reports.find(r=>r.id===A.reportId);return a?`
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
            ${V.map(r=>`<button type="button" class="${(a.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${g(r)}">${g(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">Save tags</button>
          </div>
        </form>
      </div>`:""}if(A.type==="group"){const a=A.mode==="edit"?b.groups.find(r=>r.id===A.groupId):null;return`
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
            <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
            <button type="submit" class="primary-button">${a?"Save changes":"Create topic"}</button>
          </div>
        </form>
      </div>`}const t=A.mode==="edit"?b.reports.find(a=>a.id===A.reportId):null,e=(t==null?void 0:t.groupId)||A.groupId||((i=b.groups[0])==null?void 0:i.id)||"";return`
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
            <button type="button" class="detect-button" data-action="detect-title">Detect title</button>
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
            ${ot.map(a=>`<option value="${g(a.id)}" ${a.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${g(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>关键标签
          <input name="tags" value="${g(((t==null?void 0:t.tags)||[]).join("、"))}" placeholder="本体、飞书、调研" />
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">Cancel</button>
          <button type="submit" class="primary-button">Save</button>
        </div>
      </form>
    </div>`}function la(){return`
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
    </main>`}function da(t){var l;if(Jt(t.id))return Fe(t,g);const e=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),i=["org","account"].includes(t.access),a=t.loginProvider||((l=ne(t.url))==null?void 0:l.provider)||(t.access==="org"?"组织帐号":"站点帐号"),r=t.savedHtml||ct(t.savedContent,t.savedFiles),c=r?"edit-local-document":t.url?i?"edit":"edit-document":"",o=r?`
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
            <button class="quiet-button" type="button" data-action="back">Back</button>
          </div>
          <p class="login-handoff-domain">${g(_(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${g(t.title)}" src="${g(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${B("back")}</button>
        <div class="reader-title">
          <strong>${g(t.title)}</strong>
          <span>${e?"本地保存":g(_(t.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${c?`
            <button class="reader-icon-button" type="button" data-action="${c}"
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
      ${o}
      ${qt()}
    </main>`}function ue(t){return`
    <header class="topbar">
      <button class="brand topbar-home" type="button" data-action="scroll-top"
        aria-label="Back to top" title="Back to top">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </button>
      ${z?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← Library</button></div>':""}
    </header>`}function ua(){const t=b.reports.filter(i=>i.archived).filter(i=>Qt(i,L,{group:b.groups.find(a=>a.id===i.groupId),workTypeName:et(i.workType)})).sort((i,a)=>new Date(a.archivedAt||0)-new Date(i.archivedAt||0)),e=b.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${ue()}
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
          <input id="search-input" value="${g(L)}"
            placeholder="搜索归档标题、来源或网址" aria-label="搜索归档" />
          ${L?'<button type="button" data-action="clear-search">Clear</button>':""}
        </label>
        ${t.length?`
          <section class="archive-results">
            <div class="archive-heading">
              <div><h2>${L?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(i=>de(i,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${L?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${L?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${L?"clear-search":"show-catalog"}">${L?"Clear search":"Back to library"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${qt()}
    </main>`}function pa(){if(z)return ua();const t=nt(L),e=b.reports.filter(s=>!s.archived),i=t?e.filter(s=>Qt(s,t,{group:b.groups.find(d=>d.id===s.groupId),workTypeName:et(s.workType)})):e,a=b.reports.filter(s=>s.archived).length,r=e.filter(s=>s.access==="production").length,c=e.filter(s=>s.access!=="production").length,o=ce(i,t).filter(s=>s.reports.length||M||$==="topic"&&!t),l=$==="type"?"工作类型":$==="tag"?"关键标签":$==="time"?"新增时间":"工作主题";return`
    <main class="app-shell">
      ${ue()}
      <section class="workspace">
        ${ye(g)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" type="search" value="${g(L)}"
                placeholder="Rediscover your work" aria-label="找到一个成果"
                autocomplete="off" spellcheck="false" enterkeyhint="search" />
              ${L?'<button type="button" data-action="clear-search">Clear</button>':""}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${t?i.length:e.length}</strong><span>${t?"匹配":"成果"}</span>
              <i></i>
              <strong>${b.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${r}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${M?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${Z()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">Cancel</button>
            </div>`:""}
          ${o.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${l}">
                <div class="library-nav-controls">
                  <div class="library-view-switcher" role="tablist" aria-label="成果分类方式">
                    <button type="button" role="tab" aria-selected="${$==="topic"}" class="${$==="topic"?"active":""}" data-action="set-view" data-id="topic">Topic</button>
                    <button type="button" role="tab" aria-selected="${$==="type"}" class="${$==="type"?"active":""}" data-action="set-view" data-id="type">Type</button>
                    <button type="button" role="tab" aria-selected="${$==="tag"}" class="${$==="tag"?"active":""}" data-action="set-view" data-id="tag">Tag</button>
                    <button type="button" role="tab" aria-selected="${$==="time"}" class="${$==="time"?"active":""}" data-action="set-view" data-id="time">Time</button>
                  </div>
                  <button class="add-topic-icon" type="button" data-action="add-group"
                    aria-label="Add topic" title="Add topic">＋</button>
                </div>
                ${o.map((s,d)=>`<a href="#bucket-${d}">${g(s.name)}<span>${s.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>Archive</strong>
                  ${a?`<em>${a}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${$}">
              ${o.map((s,d)=>`
                <section id="bucket-${d}" class="group-column topic-section bucket-${g(s.kind)} accent-${g(s.accent||"blue")}"
                  data-bucket-kind="${g(s.kind)}"
                  data-bucket-id="${g(s.id)}"
                  data-group-id="${g(s.id)}">
                  <header class="group-header">
                    <div class="group-heading-copy group-drag-handle" role="button" tabindex="0"
                      data-group-drag-id="${g(s.id)}"
                      data-group-drag-kind="${g(s.kind)}"
                      aria-label="Drag ${g(s.name)} to reorder"
                      title="Drag to reorder · use left or right arrow keys">
                      <div><h2>${g(s.name)}</h2></div>
                      <span class="count">${s.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${M?`<button class="move-here-button" type="button" data-action="move-here" data-id="${g(s.id)}" data-bucket-kind="${g(s.kind)}">Move here</button>`:""}
                      ${s.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${g(s.id)}">Add report</button>
                           <button type="button" data-action="rename-group" data-id="${g(s.id)}">Rename</button>
                           ${s.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${g(s.id)}">Delete</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${s.reports.length?s.reports.map(u=>de(u)).join(""):s.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${g(s.id)}">
                            <strong>Drop reports here</strong>
                            <span>or add the first report</span>
                          </button>`:'<div class="empty-topic-drop passive-drop"><strong>拖报告到这里</strong></div>'}
                  </div>
                </section>`).join("")}
              </div>
            </div>`:`
            <div class="no-results">
              <strong>没有找到“${g(L.trim())}”</strong>
              <span>可搜索标题、标签、来源、任务类型或主题</span>
              <button type="button" data-action="clear-search">Clear search</button>
            </div>`}
          <div class="catalog-note">
            <span>${c} 份报告需要组织或账号登录${a?` · ${a} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">Sign out</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${qt()}
    </main>`}function k(){const t=document.getElementById("app");if(sessionStorage.getItem(xt)!=="ok"){t.innerHTML=la(),ma();return}const e=D&&b.reports.find(i=>i.id===D);t.innerHTML=e?da(e):pa(),ha(),we({render:k,showToast:S,saveToLibrary:ta})}function ma(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(xt,"ok"),k()})}async function ga(t){const e=t.elements.url,i=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),c=e.value.trim();if(!lt(c))return r.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const{title:o}=await oe(c);if(!o)throw new Error("read failed");return i.value=o,r.textContent="已识别网页标题",i.value}catch{const o=_(c);return i.value||(i.value=o),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{a.disabled=!1,a.textContent="Detect title"}}function ha(){var c;const t=document.getElementById("search-input");t==null||t.addEventListener("input",o=>{if(o.isComposing)return;L=o.target.value;const l=o.target.selectionStart,s=o.target.selectionEnd;k();const d=document.getElementById("search-input");d==null||d.focus(),d==null||d.setSelectionRange(l,s)}),t==null||t.addEventListener("keydown",o=>{var l;o.key!=="Escape"||!L||(o.preventDefault(),L="",k(),(l=document.getElementById("search-input"))==null||l.focus())}),document.querySelectorAll("[data-action]").forEach(o=>{o.addEventListener("click",async l=>{var u,v,f;const s=l.currentTarget.dataset.action,d=l.currentTarget.dataset.id;if(s==="scroll-top")P("smooth");else if(s==="open")D=d,k(),P();else if(s==="edit-document"){const p=b.reports.find(h=>h.id===d);if(!p||p.access!=="production")return;Ot(p,{render:k,showToast:S})}else if(s==="edit-local-document"){const p=b.reports.find(h=>h.id===d);if(!p||!at(p))return;Ot(p,{render:k,showToast:S,saveLocal:async h=>{const I=p.savedHtml;p.savedHtml=h,p.isHtml=!0,p.tags=F(p,p.workType);try{E()}catch{throw p.savedHtml=I,new Error("修改后的 HTML 超过当前浏览器可保存容量，请先下载备份")}}})}else if(s==="download-report"){const p=b.reports.find(h=>h.id===d);if(!p)return;at(p)?sa(p)&&S("HTML 已下载"):await Xt(p,S)}else if(s==="share-report"||s==="copy-production-url"){const p=b.reports.find(h=>h.id===d);p!=null&&p.url&&await Ze(p,h=>{S(h==="报告链接已复制"?"生产 URL 已复制":h)})}else if(s==="open-browser"){const p=b.reports.find(h=>h.id===d);if(!p)return;ca(p)||S("浏览器未能打开该报告")}else if(s==="back")D="",A=null,k(),P();else if(s==="lock")sessionStorage.removeItem(xt),k();else if(s==="clear-search")L="",k(),(u=document.getElementById("search-input"))==null||u.focus();else if(s==="set-view"){if(!["topic","type","tag","time"].includes(d))return;$=d,M="",localStorage.setItem(j,$),k(),P()}else if(s==="cancel-move")M="",k();else if(s==="move-here"){const p=l.currentTarget.dataset.bucketKind||$;M&&W(M,p,d)&&(M="",k(),S(p==="tag"?"已添加目标标签":`报告已移入目标${Z()}`))}else if(s==="show-archive")z=!0,L="",D="",k(),P();else if(s==="show-catalog")z=!1,L="",D="",k(),P();else if(s==="add-report")A={type:"report",mode:"create",groupId:((v=b.groups[1])==null?void 0:v.id)||((f=b.groups[0])==null?void 0:f.id)},k();else if(s==="add-to-group")A={type:"report",mode:"create",groupId:d},k();else if(s==="edit")A={type:"report",mode:"edit",reportId:d},k();else if(s==="edit-tags")A={type:"tags",reportId:d},k();else if(s==="close-modal")A=null,k();else if(s==="detect-title")await ga(l.currentTarget.closest("form"));else if(s==="archive"){const p=b.reports.find(h=>h.id===d);if(!p)return;p.archived=!0,p.archivedAt=new Date().toISOString(),E(),k(),S("已归档，可随时恢复")}else if(s==="restore"){const p=b.reports.find(h=>h.id===d);if(!p)return;p.archived=!1,p.archivedAt="",E(),k(),S("报告已恢复到原主题")}else if(s==="delete"){const p=b.reports.find(h=>h.id===d);p!=null&&p.archived&&confirm(`二次确认：永久删除“${p.title}”？

删除后无法从归档区恢复。`)&&(b.reports=b.reports.filter(h=>h.id!==d),D===d&&(D=""),E(),k(),S("报告已永久删除"))}else if(s==="add-group")A={type:"group",mode:"create"},k();else if(s==="rename-group")b.groups.find(h=>h.id===d)&&(A={type:"group",mode:"edit",groupId:d},k());else if(s==="delete-group"){const p=b.groups.find(h=>h.id===d);p&&confirm(`删除“${p.name}”？其中的报告会移到“待整理”。`)&&(b.reports.forEach(h=>{h.groupId===d&&(h.groupId="inbox")}),b.groups=b.groups.filter(h=>h.id!==d),E(),k(),S("分组已删除，报告已移到待整理"))}})}),(c=document.querySelector(".topbar"))==null||c.addEventListener("click",o=>{o.target.closest("button, a")||P("smooth")}),document.querySelectorAll(".report-drag-handle").forEach(o=>{let l=null,s=!1;const d=()=>{var u;C="",l=null,s=!1,(u=o.closest(".report-card"))==null||u.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(v=>{v.classList.remove("is-card-drop-target","is-drop-ready")})};o.addEventListener("pointerdown",u=>{var v,f;u.preventDefault(),C=o.dataset.reportDragId,x="",l={x:u.clientX,y:u.clientY},s=!1,(v=o.setPointerCapture)==null||v.call(o,u.pointerId),(f=o.closest(".report-card"))==null||f.classList.add("is-dragging")}),o.addEventListener("pointermove",u=>{if(!C||l&&Math.hypot(u.clientX-l.x,u.clientY-l.y)<7)return;s=!0;const v=document.elementFromPoint(u.clientX,u.clientY),f=v==null?void 0:v.closest(".report-card"),p=v==null?void 0:v.closest(".group-column");document.querySelectorAll(".report-card").forEach(h=>{h.classList.toggle("is-card-drop-target",!!(f&&f!==o.closest(".report-card")&&h===f))}),document.querySelectorAll(".group-column").forEach(h=>{h.classList.toggle("is-drop-ready",!!(p&&h===p))})}),o.addEventListener("pointerup",u=>{if(!C)return;const v=C;if(!s){M=v,d(),k(),S(`请选择目标${Z()}`);return}const f=document.elementFromPoint(u.clientX,u.clientY),p=f==null?void 0:f.closest(".report-card"),h=f==null?void 0:f.closest(".group-column"),I=(p==null?void 0:p.dataset.reportId)||"",m=(h==null?void 0:h.dataset.bucketId)||"",y=(h==null?void 0:h.dataset.bucketKind)||$,w=I&&I!==v?W(v,y,m,I):m?W(v,y,m):!1;d(),w&&(k(),S(y==="tag"?"已添加目标标签":y==="type"?"工作类型已更新":I?"报告顺序已更新":"已移入新主题"))}),o.addEventListener("pointercancel",d)}),document.querySelectorAll(".group-drag-handle").forEach(o=>{const l=()=>{var s;x="",(s=o.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(d=>{d.classList.remove("is-group-drop-target","is-drop-ready")})};o.addEventListener("pointerdown",s=>{var d,u;s.preventDefault(),x=o.dataset.groupDragId,C="",(d=o.setPointerCapture)==null||d.call(o,s.pointerId),(u=o.closest(".group-column"))==null||u.classList.add("is-group-dragging")}),o.addEventListener("pointermove",s=>{x&&document.querySelectorAll(".group-column").forEach(d=>{var u;d.classList.toggle("is-group-drop-target",d===((u=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:u.closest(".group-column")))})}),o.addEventListener("pointerup",s=>{var v;if(!x)return;const d=x,u=(v=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:v.closest(".group-column");if(u&&ht(d,u.dataset.bucketId,u.dataset.bucketKind)){x="",k(),S("分组顺序已更新");return}l()}),o.addEventListener("pointercancel",l),o.addEventListener("keydown",s=>{var p;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const d=[...document.querySelectorAll(".group-column")],u=d.findIndex(h=>h.dataset.bucketId===o.dataset.groupDragId),v=s.key==="ArrowLeft"?u-1:u+1,f=d[v];!f||!ht(o.dataset.groupDragId,f.dataset.bucketId,o.dataset.groupDragKind)||(k(),S("分组顺序已更新"),(p=document.querySelector(`[data-group-drag-id="${CSS.escape(o.dataset.groupDragId)}"]`))==null||p.focus())})}),document.querySelectorAll(".group-column").forEach(o=>{o.addEventListener("dragover",l=>{l.preventDefault(),o.classList.add(x?"is-group-drop-target":"is-drop-ready")}),o.addEventListener("dragleave",()=>{o.classList.remove("is-drop-ready","is-group-drop-target")}),o.addEventListener("drop",l=>{if(l.preventDefault(),x){if(ht(x,o.dataset.bucketId,o.dataset.bucketKind)){x="",k(),S("分组顺序已更新");return}x="",o.classList.remove("is-group-drop-target");return}const s=b.reports.find(u=>u.id===C),d=o.dataset.bucketKind||$;s&&W(C,d,o.dataset.bucketId)&&(C="",k(),S(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":"已移入新主题")),C=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(o=>{o.addEventListener("click",()=>{const l=document.querySelector('#tag-form input[name="tags"]');if(!l)return;const s=ft(l.value),d=o.dataset.tagSuggestion;l.value=s.includes(d)?s.filter(u=>u!==d).join("、"):[...s,d].slice(0,8).join("、"),o.classList.toggle("selected",!s.includes(d)),l.focus()})});const e=document.getElementById("tag-form");e==null||e.addEventListener("submit",o=>{o.preventDefault();const l=b.reports.find(s=>s.id===A.reportId);l&&(l.tags=ft(new FormData(e).get("tags")),E(),A=null,k(),S("标签已更新"))});const i=document.getElementById("group-form");i==null||i.addEventListener("submit",o=>{var u,v;o.preventDefault();const l=(u=new FormData(i).get("name"))==null?void 0:u.trim(),s=(v=new FormData(i).get("description"))==null?void 0:v.trim();if(!l)return;if(A.mode==="edit"){const f=b.groups.find(p=>p.id===A.groupId);if(!f)return;f.name=l.slice(0,60),f.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else b.groups.push({id:$t("group"),name:l.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][b.groups.length%4],position:b.groups.length}),$="topic",localStorage.setItem(j,$);E();const d=A.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";A=null,k(),S(d)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async o=>{o.preventDefault();const l=a.elements.url.value.trim();if(!lt(l))return;const s=a.querySelector('button[type="submit"]'),d=a.querySelector(".field-hint");s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';const u=A.mode==="edit"?A.reportId:"",v=ie({material:l,files:[],url:l,excludeId:u});if(v){s.disabled=!1,s.textContent="Save",d.textContent=`成果库已有“${v.title}”，未重复保存`,S(`成果库已有“${v.title}”，未重复保存`);return}const f=await se({material:l,files:[],url:l},q=>{d.textContent=q});if(!f.allowed){s.disabled=!1,s.textContent="Save",d.textContent=f.reason,S(f.reason);return}let p=a.elements.title.value.trim()||f.metadata.title;const h=a.elements.groupId.value,I=a.elements.workType.value,m=ft(a.elements.tags.value),y={title:p||_(l),url:l,groupId:h,workType:I,source:"手动添加",access:f.access,detectedDescription:f.metadata.description,manualSaved:!0,isProduction:f.access==="production",isPersonal:re(l),isHtml:f.isHtml,loginProvider:f.loginProvider},w=[...new Set([...F(y,I),...m])].slice(0,8);if(A.mode==="edit"){const q=b.reports.find(dt=>dt.id===A.reportId);Object.assign(q,y,{tags:w})}else{const q={id:$t("report"),groupId:h,...y,pinned:!1,position:b.reports.filter(dt=>dt.groupId===h).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:"",tags:w};b.reports.push(q)}E(),A=null,k(),S("报告已保存")});const r=D&&b.reports.find(o=>o.id===D);r&&ze(r)}function fa(){k()}fa(document.getElementById("app"));
