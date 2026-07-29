(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function i(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(r){if(r.ep)return;r.ep=!0;const n=i(r);fetch(r.href,n)}})();const Bt="clair-ai-studio-tasks-v1",ce=[{id:"save",name:"保存",hint:"自动识别并进入成果库"},{id:"decision",name:"决策",hint:"发起决策推演"},{id:"review",name:"评审",hint:"自动匹配合适的评审 Skill"}],Ut={save:`
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
    </svg>`},W=[{id:"requirement",name:"需求评审"},{id:"solution",name:"方案评审"},{id:"decision",name:"决策推演"},{id:"agreement",name:"协议审查"},{id:"career",name:"履历评估"}];let S=mt();function mt(){return{material:"",files:[]}}function Nt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function le(t){var r;const e=t.toLowerCase(),a=((r=[["agreement",["协议","合同","条款","保密","签署","数据处理"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(c=>e.includes(c))))==null?void 0:r[0])||"solution";return W.find(n=>n.id===a)||W[1]}function de(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function U(t){const e=[...t].slice(0,20);return Promise.all(e.map(async i=>{const a=i.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(i.name),r=/\.html?$/i.test(i.name);let n="",c="";if(a&&i.size<=1024*1024)try{const s=await i.text();n=s.slice(0,12e3),r&&(c=s)}catch{n="",c=""}return{id:Nt(),name:i.name,type:i.type||"文件",size:i.size,sizeLabel:de(i.size),excerpt:n,content:c}}))}function ue(t){return S.files.length?`<div class="attachment-list">${S.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}"
        data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function pe(t){return ce.map(e=>`
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${e.id}" aria-label="${t(e.name)}"
      title="${t(e.name)} · ${t(e.hint)}">
      ${Ut[e.id]}
    </button>`).join("")}function me(t){return`
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="输入或粘贴内容">${t(S.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${Ut.upload}
            </label>
            ${pe(t)}
          </div>
        </div>
        ${ue(t)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
    </section>`}function ge({render:t,showToast:e,saveToLibrary:i}){document.querySelectorAll("[data-task-action]").forEach(s=>{s.addEventListener("click",l=>{l.currentTarget.dataset.taskAction==="remove-file"&&(G(),S.files=S.files.filter(p=>p.id!==l.currentTarget.dataset.fileId),t())})});const a=document.getElementById("task-composer");a==null||a.addEventListener("submit",async s=>{var L,m;if(s.preventDefault(),G(),!S.material.trim()&&!S.files.length){e("先粘贴内容，或加入一份材料"),(L=document.getElementById("task-goal"))==null||L.focus();return}const l=((m=s.submitter)==null?void 0:m.dataset.submitAction)||"save",d=s.submitter,p={material:S.material.trim(),files:S.files};if(l==="save"){const f=a.querySelector("#intake-save-status"),w=[...a.querySelectorAll("button, textarea, input")],C=q=>{w.forEach(se=>{se.disabled=!0}),a.setAttribute("aria-busy","true"),a.classList.add("is-saving"),f.hidden=!1,f.querySelector("strong").textContent=q,d.setAttribute("aria-label","保存中"),d.innerHTML='<span class="mini-spinner"></span>'};C("正在检查成果库与页面访问状态…");try{const q=await i(p,C);if(q.rejected){t(),e(q.reason);return}if(q.duplicate){t(),e(`成果库已有“${q.title}” · 位于“${q.groupName}”，未重复保存`);return}S=mt(),t(),e(`已保存到“${q.groupName}” · ${q.workTypeName} · 标签：${q.tags.join(" / ")||"待补标签"}`)}catch{w.forEach(q=>{q.disabled=!1}),t(),e("保存失败，请稍后重试")}return}d.disabled=!0;const u=le([p.material,...p.files.map(f=>`${f.name}
${f.excerpt}`)].join(`
`)),g=l==="decision"?W.find(f=>f.id==="decision"):u.id==="decision"?W.find(f=>f.id==="solution"):u,v=new Date().toISOString(),A=he();A.push({id:Nt(),title:fe(p),mode:l,skillId:g.id,skillName:g.name,material:p.material,files:p.files,status:"queued",createdAt:v,updatedAt:v}),localStorage.setItem(Bt,JSON.stringify(A)),S=mt(),t(),e(`${l==="decision"?"已发起决策":"已发起评审"} · ${g.name}`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async s=>{G(),S.files.push(...await U(s.target.files)),t(),e(`已加入 ${s.target.files.length} 个文件`)});const n=document.querySelector(".prompt-composer");n==null||n.addEventListener("dragover",s=>{s.preventDefault(),n.classList.add("drag-over")}),n==null||n.addEventListener("dragleave",()=>n.classList.remove("drag-over")),n==null||n.addEventListener("drop",async s=>{s.preventDefault(),s.stopPropagation(),n.classList.remove("drag-over"),G();const l=s.dataTransfer.files;S.files.push(...await U(l)),t(),e(`已加入 ${l.length} 个文件`)});const c=document.getElementById("task-goal");requestAnimationFrame(()=>Lt(c)),c==null||c.addEventListener("input",()=>{S.material=c.value,Lt(c)}),c==null||c.addEventListener("paste",async s=>{var g;const l=[...((g=s.clipboardData)==null?void 0:g.items)||[]].filter(v=>v.kind==="file").map(v=>v.getAsFile()).filter(Boolean);if(!l.length)return;s.preventDefault();const d=s.clipboardData.getData("text/plain"),p=c.selectionStart??c.value.length,u=c.selectionEnd??p;S.material=`${c.value.slice(0,p)}${d}${c.value.slice(u)}`,S.files.push(...await U(l)),t(),e(`已从剪贴板加入 ${l.length} 个材料`)}),ve({render:t,showToast:e})}function he(){try{const t=JSON.parse(localStorage.getItem(Bt));return Array.isArray(t)?t:[]}catch{return[]}}function fe(t){var i;return(t.material.split(/\n/).map(a=>a.trim()).find(Boolean)||((i=t.files[0])==null?void 0:i.name)||"未命名任务").replace(/[。；;！!？?]+$/,"").slice(0,64)}function G(){const t=document.getElementById("task-goal");t&&(S.material=t.value)}function Lt(t){if(!t)return;t.style.height="auto";const e=Math.min(Math.max(t.scrollHeight,40),180);t.style.height=`${e}px`,t.style.overflowY=t.scrollHeight>180?"auto":"hidden"}function Et(){const t=document.querySelector(".prompt-composer");t==null||t.scrollIntoView({behavior:"smooth",block:"center"}),requestAnimationFrame(()=>{var e;return(e=document.getElementById("task-goal"))==null?void 0:e.focus()})}function be(t){var e;return!!((e=t==null?void 0:t.closest)!=null&&e.call(t,"input, textarea, select, [contenteditable='true']"))}function ve({render:t,showToast:e}){document.onpaste=async i=>{var c,s;if(be(i.target)||!document.querySelector(".prompt-composer"))return;const r=[...((c=i.clipboardData)==null?void 0:c.items)||[]].filter(l=>l.kind==="file").map(l=>l.getAsFile()).filter(Boolean),n=((s=i.clipboardData)==null?void 0:s.getData("text/plain"))||"";!r.length&&!n.trim()||(i.preventDefault(),S.material=[S.material.trim(),n.trim()].filter(Boolean).join(`

`),r.length&&S.files.push(...await U(r)),t(),requestAnimationFrame(Et),e(r.length?`已从剪贴板加入 ${r.length} 个材料`:"已把粘贴内容放入输入框"))},document.ondragover=i=>{var a;[...((a=i.dataTransfer)==null?void 0:a.types)||[]].includes("Files")&&i.preventDefault()},document.ondrop=async i=>{var r,n,c;if((n=(r=i.target)==null?void 0:r.closest)!=null&&n.call(r,".prompt-composer"))return;const a=((c=i.dataTransfer)==null?void 0:c.files)||[];a.length&&(i.preventDefault(),S.files.push(...await U(a)),t(),requestAnimationFrame(Et),e(`已拖入 ${a.length} 个文件`))}}const at="clair-report-editor-v1",ye="https://api.github.com",jt="2026",we="clair-report-editor-draft-v1:",o={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:null,showToast:null},J=new Map;let qt=!1;function yt(t){return[...new Set(t.filter(Boolean))]}function gt(t=o.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function wt(t){return`${we}${t}`}function $e(t){try{const e=sessionStorage.getItem(wt(t));if(!e)return null;const i=JSON.parse(e);return!(i!=null&&i.html)||typeof i.html!="string"?null:i}catch{return null}}function $t(t=o.reportId){try{sessionStorage.removeItem(wt(t))}catch{}}function Ft(){return o.dirty&&o.hasDraft?{tone:"changed",label:o.isLocal?"有新修订 · 上次暂存待保存":"有新修订 · 上次暂存待推送"}:o.dirty?{tone:"changed",label:"已修订 · 未暂存"}:o.hasDraft?{tone:"staged",label:o.isLocal?"已暂存 · 待保存成果库":"已暂存 · 待推送生产"}:o.lastCommit?{tone:"published",label:o.isLocal?"成果库 HTML 已更新":"生产档案已更新"}:{tone:"clean",label:"未修改"}}function P(){const t=Ft(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const i=document.querySelector('[data-editor-action="stash"]');if(i){i.disabled=o.status!=="ready"||o.saving||!o.dirty;const n=!o.dirty&&o.hasDraft?"已暂存":"暂存修改";i.setAttribute("aria-label",n),i.title=n}const a=document.querySelector('[data-editor-action="publish"]');if(a){a.disabled=o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft;const n=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";a.setAttribute("aria-label",n),a.title=n,a.classList.toggle("is-saving",o.saving)}const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=o.status!=="ready"||o.saving||!o.hasDraft)}function ke(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Ae(t){const e=atob(String(t||"").replace(/\s/g,"")),i=Uint8Array.from(e,a=>a.charCodeAt(0));return new TextDecoder().decode(i)}function Ie(t){const e=new TextEncoder().encode(t);let i="";const a=32768;for(let r=0;r<e.length;r+=a)i+=String.fromCharCode(...e.subarray(r,r+a));return btoa(i)}function ct(t){let e="";for(let a=0;a<t.length;a+=32768)e+=String.fromCharCode(...t.subarray(a,a+32768));return btoa(e)}function lt(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function zt(t,e){const i=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},i,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function xt(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const i=JSON.parse(e[1]),a=lt(i.salt),r=lt(i.iv),n=await zt(jt,a),c=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},n,lt(i.data)),s=new TextDecoder().decode(c);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function kt(t){var c;if(((c=o.protection)==null?void 0:c.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await zt(jt,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:i},a,new TextEncoder().encode(t)),n=JSON.stringify({salt:ct(e),iv:ct(i),data:ct(new Uint8Array(r))});return o.protection.wrapperHtml.replace(o.protection.payloadSource,n)}function Se(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const i=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),a=i.shift()||"ClairKu.github.io";let r=i.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const n=yt([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:a,branch:"main",path:n[0],candidates:n,source:"auto"}}catch{return null}}async function X(t,{token:e="",method:i="GET",body:a}={}){var c;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),a!==void 0&&(r["Content-Type"]="application/json");const n=await fetch(`${ye}${t}`,{method:i,headers:r,body:a===void 0?void 0:JSON.stringify(a)});if(!n.ok){let s="";try{s=((c=await n.json())==null?void 0:c.message)||""}catch{s=await n.text()}const l=new Error(s||`GitHub API ${n.status}`);throw l.status=n.status,l}return n.status===204?null:n.json()}async function Te(t){var c;const e=await X(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const i=yt((c=t.candidates)!=null&&c.length?t.candidates:[t.path]);let a=null,r=null;const n=[];for(const s of i)try{const l=s.split("/").map(encodeURIComponent).join("/"),d=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${l}?ref=${encodeURIComponent(t.branch)}`,p=await X(d);let u="";if(p.encoding==="base64"&&p.content)u=Ae(p.content);else if(p.download_url){const g=await fetch(p.download_url,{cache:"no-store"});if(!g.ok)throw new Error("无法读取 GitHub 原始文件");u=await g.text()}if(!u)throw new Error("GitHub 文件内容为空");r?u===r.html&&n.push({path:s,sha:p.sha}):r={html:u,target:{...t,path:s,sha:p.sha,candidates:i}}}catch(l){if(a=l,l.status&&![403,404].includes(l.status))break}if(r)return r.target.mirrors=n,r;throw a||new Error("没有找到对应的 GitHub HTML 文件")}function Le(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(a=>{/^on/i.test(a.name)&&(e.setAttribute(`data-clair-event-${a.name.toLowerCase()}`,a.value),e.removeAttribute(a.name))});const i=e.getAttribute("href");i&&/^\s*javascript:/i.test(i)&&(e.dataset.clairJavascriptHref=i,e.removeAttribute("href"))})}function Ee(){return`
(() => {
  const channel = ${JSON.stringify(at)};
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
`}function qe(t,e){const a=new DOMParser().parseFromString(t,"text/html");a.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),Le(a);const r=a.createElement("base");r.href=e,r.dataset.clairEditorBase="true",a.head.prepend(r);const n=a.createElement("style");n.id="clair-editor-style",n.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,a.head.append(n);const c=a.createElement("script");return c.id="clair-editor-bridge",c.textContent=Ee(),a.body.append(c),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function Zt(t){if(t.url)return"";if(t.savedHtml)return t.savedHtml;const e=(t.savedFiles||[]).find(i=>/\.html?$/i.test(i.name||""));return e!=null&&e.content||e!=null&&e.excerpt?e.content||e.excerpt:/<!doctype\s+html|<html[\s>]/i.test(t.savedContent||"")?t.savedContent.trim():""}async function Gt(t){var e;try{const i=Zt(t),a=i?null:Se(t.url);let r=null;if(i)r={html:i,target:null};else if(a)try{r=await Te(a)}catch{}if(!r&&t.url){const l=await fetch(t.url,{cache:"no-store"});if(!l.ok)throw new Error(`报告读取失败（HTTP ${l.status}）`);r={html:await l.text(),target:a}}const n=await xt(r.html);o.protection=n.protection,o.target=r.target||a;let c=n.html;const s=$e(t.id);if(s!=null&&s.html)try{const l=await xt(s.html);c=l.html,o.hasDraft=!0,o.draftHtml=l.html,o.draftAt=s.savedAt||"",s.baseFiles&&o.target&&(o.target.baseFiles=s.baseFiles)}catch{$t(t.id)}o.html=c,o.editorDocument=qe(c,t.url||window.location.href),o.status="ready",o.error=""}catch(i){o.status="error",o.error=(i==null?void 0:i.message)||"无法读取这份 HTML"}finally{o.loadPromise=null,(e=o.render)==null||e.call(o)}}function _t(){const t=o.render,e=o.showToast;Object.assign(o,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",isLocal:!1,saveLocal:null,protection:null,loadPromise:null,render:t,showToast:e})}function At(){return document.querySelector(".report-editor-frame")}function dt(t,e=null){var a;const i=At();(a=i==null?void 0:i.contentWindow)==null||a.postMessage({channel:at,type:"command",command:t,value:e},"*")}function it(){var i;const t=At();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((i=crypto.randomUUID)==null?void 0:i.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((a,r)=>{const n=window.setTimeout(()=>{J.delete(e),r(new Error("读取编辑内容超时"))},1e4);J.set(e,{resolve:c=>{clearTimeout(n),a(c)}}),t.contentWindow.postMessage({channel:at,type:"serialize",requestId:e},"*")})}function xe(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Kt(t,e){const i=new Blob([t],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(i),r=document.createElement("a");r.href=a,r.download=xe(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Vt(t){await navigator.clipboard.writeText(t)}function Ce(t,e){var r;const i=new DOMParser().parseFromString(t,"text/html");(r=i.querySelector("base[data-clair-preview-base]"))==null||r.remove();const a=i.createElement("base");return a.href=e,a.dataset.clairPreviewBase="true",i.head.prepend(a),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}function De(t){if(!o.hasDraft||!o.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([Ce(o.draftHtml,t.url||window.location.href)],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(e),a=window.open(i,"_blank");if(!a)throw URL.revokeObjectURL(i),new Error("浏览器拦截了新窗口，请允许弹窗后重试");a.opener=null,window.setTimeout(()=>URL.revokeObjectURL(i),6e4)}async function Q(t,{silent:e=!1}={}){var n;const i=await it(),a=await kt(i),r=new Date().toISOString();try{sessionStorage.setItem(wt(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:gt(),html:a}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return o.html=i,o.draftHtml=i,o.draftAt=r,o.hasDraft=!0,o.dirty=!1,o.lastCommit="",P(),e||(n=o.showToast)==null||n.call(o,o.isLocal?"已暂存在当前浏览器会话，尚未写回成果库":"已暂存在当前浏览器会话，尚未更新 GitHub"),i}async function Me(t){var e,i;if(!(o.saving||!o.saveLocal)){o.saving=!0,P();try{const a=o.dirty?await Q(t,{silent:!0}):o.draftHtml||await it();await o.saveLocal(a),o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit="local",$t(t.id),(e=o.showToast)==null||e.call(o,"已更新成果库中的 HTML")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,P()}}}async function He(t){var s,l;const e=o.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!o.token)throw new Error("请先提供 GitHub Fine-grained Token");const i=await kt(t),a=(e.mirrors||[]).map(d=>d.path),r=yt([...a.filter(d=>d.startsWith("public/")),...a.filter(d=>!d.startsWith("public/")&&d!==e.path),e.path]);let n="";const c=[];for(const d of r)try{const p=d.split("/").map(encodeURIComponent).join("/"),u=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${p}`,g=await X(`${u}?ref=${encodeURIComponent(e.branch)}`,{token:o.token}),v=gt(e)[d];if(v&&g.sha!==v)throw new Error(`生产文件 ${d} 已在本次编辑后更新，请重新打开报告合并修改`);const A=await X(u,{token:o.token,method:"PUT",body:{message:`Update ${o.reportTitle} from Clair's Studio`,content:Ie(i),sha:g.sha,branch:e.branch}});n=((s=A==null?void 0:A.commit)==null?void 0:s.sha)||n,e.baseFiles={...gt(e),[d]:((l=A==null?void 0:A.content)==null?void 0:l.sha)||g.sha},c.push(d)}catch(p){throw c.length?new Error(`已更新 ${c.join("、")}，但 ${d} 同步失败：${p.message}`):p}return{commit:n,files:c.length}}async function Ct(t){var e,i;if(!o.saving){o.saving=!0,P();try{const a=o.dirty?await Q(t,{silent:!0}):o.draftHtml||await it(),r=await He(a);o.html=a,o.dirty=!1,o.hasDraft=!1,o.draftHtml="",o.draftAt="",o.lastCommit=r.commit,$t(t.id),(e=o.showToast)==null||e.call(o,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(a){(i=o.showToast)==null||i.call(o,(a==null?void 0:a.message)||"保存失败，请下载 HTML 备份")}finally{o.saving=!1,P()}}}function Re(t){const e=o.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
    </div>`}function Pe(t){const e=o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}`:"尚未识别 GitHub 文件路径";return`
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
    </div>`}function Dt({pendingSave:t=!1}={}){o.settingsOpen=!0,o.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const i=e.querySelector("#editor-settings-form"),a=o.target||{};if(i){i.elements.owner.value=a.owner||"ClairKu",i.elements.repository.value=a.repository||"",i.elements.branch.value=a.branch||"main",i.elements.path.value=a.path||"";const r=i.querySelector('button[type="submit"]');r&&(r.textContent=t?"连接并保存":"保存设置")}}function _(){o.settingsOpen=!1,o.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function Oe(){o.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function K(){o.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Yt(t=""){return!!(o.reportId&&(!t||o.reportId===t))}function Mt(t,{render:e,showToast:i,saveLocal:a=null}){_t(),Object.assign(o,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:i,isLocal:!!(Zt(t)&&a),saveLocal:a}),e(),o.loadPromise=Gt(t)}function Be(t,e){var d;const i=o.isLocal?"本地成果 · 保存在当前浏览器":o.target?`${o.target.owner}/${o.target.repository} · ${o.target.path}${(d=o.target.mirrors)!=null&&d.length?` · 同步 ${o.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",a=Ft(),r=o.status==="ready"?`
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
          sandbox="allow-scripts allow-modals" srcdoc="${ke(o.editorDocument)}"></iframe></div>`,c=p=>({back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>',stash:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h12l2 2v14H5z"></path><path d="M8 4v6h8V4"></path><path d="M8 20v-6h8v6"></path></svg>',preview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>',download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',copy:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>',publish:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"></path><path d="m8 8 4-4 4 4"></path><path d="M5 14v6h14v-6"></path></svg>'})[p],s=!o.dirty&&o.hasDraft?"已暂存":"暂存修改",l=o.saving?o.isLocal?"正在保存到成果库":"正在推送生产":o.isLocal?"保存到成果库":"推送生产";return`
    <main class="reader-shell report-editor-shell compact-editor-shell">
      <header class="reader-header editor-header compact-reader-header compact-editor-header">
        <button class="reader-icon-button back-button" type="button" data-editor-action="exit"
          aria-label="退出编辑" title="退出编辑">${c("back")}</button>
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
              aria-label="保存权限" title="保存权限">${c("settings")}</button>`}
          <button class="reader-icon-button" type="button" data-editor-action="stash"
            aria-label="${s}" title="${s}"
            ${o.status!=="ready"||o.saving||!o.dirty?"disabled":""}>${c("stash")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="preview"
            aria-label="预览暂存版本" title="预览暂存版本"
            ${o.status!=="ready"||!o.hasDraft?"disabled":""}>${c("preview")}</button>
          <button class="reader-icon-button" type="button" data-editor-action="download"
            aria-label="下载 HTML" title="下载 HTML">${c("download")}</button>
          ${t.url?`
            <button class="reader-icon-button" type="button" data-editor-action="share"
              aria-label="复制生产 URL" title="复制生产 URL">${c("copy")}</button>`:""}
          <button class="reader-icon-button publish-icon-action${o.saving?" is-saving":""}" type="button"
            data-editor-action="publish" aria-label="${l}" title="${l}"
            ${o.status!=="ready"||o.saving||!o.dirty&&!o.hasDraft?"disabled":""}>${c("publish")}</button>
        </div>
      </header>
      ${r}
      ${n}
      ${Re(e)}
      ${Pe(e)}
    </main>`}function Ue(t){if(!Yt(t.id))return;qt||(qt=!0,window.addEventListener("message",a=>{var n;const r=At();if(!(!(r!=null&&r.contentWindow)||a.source!==r.contentWindow)&&((n=a.data)==null?void 0:n.channel)===at){if(a.data.type==="dirty"&&(o.dirty=!0,o.lastCommit="",P()),a.data.type==="serialized"){const c=J.get(a.data.requestId);if(!c)return;J.delete(a.data.requestId),c.resolve(a.data.html)}a.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(c=>{const s=c.dataset.editorCommand;["bold","italic","underline"].includes(s)&&c.classList.toggle("active",!!a.data[s])})}}),window.addEventListener("beforeunload",a=>{!o.reportId||!o.dirty||(a.preventDefault(),a.returnValue="")}),window.addEventListener("keydown",a=>{a.key!=="Escape"||!o.reportId||(o.publishConfirmOpen?K():o.settingsOpen&&_())})),document.querySelectorAll("[data-editor-command]").forEach(a=>{a.addEventListener("mousedown",r=>r.preventDefault()),a.addEventListener("click",()=>dt(a.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{dt("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(a=>{a.addEventListener("click",async()=>{var n,c,s,l,d,p,u,g,v,A,L,m;const r=a.dataset.editorAction;if(r==="exit"){if(o.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const f=o.render;_t(),f==null||f()}else if(r==="settings")Dt();else if(r==="close-settings")_();else if(r==="stash")try{await Q(t)}catch(f){(n=o.showToast)==null||n.call(o,(f==null?void 0:f.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{De(t),(c=o.showToast)==null||c.call(o,"已在新窗口打开暂存修订")}catch(f){(s=o.showToast)==null||s.call(o,(f==null?void 0:f.message)||"无法打开预览")}else if(r==="publish")try{if(o.isLocal){await Me(t);return}if(o.dirty&&await Q(t,{silent:!0}),!o.hasDraft){(l=o.showToast)==null||l.call(o,"当前没有待推送的修订");return}Oe()}catch(f){(d=o.showToast)==null||d.call(o,(f==null?void 0:f.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")K();else if(r==="confirm-publish")K(),!o.token||!((p=o.target)!=null&&p.path)?Dt({pendingSave:!0}):await Ct(t);else if(r==="download")try{const f=await it();Kt(await kt(f),t.title),(u=o.showToast)==null||u.call(o,"HTML 已下载")}catch(f){(g=o.showToast)==null||g.call(o,(f==null?void 0:f.message)||"下载失败")}else if(r==="download-published")await Wt(t,o.showToast);else if(r==="share")try{await Vt(t.url),(v=o.showToast)==null||v.call(o,"报告链接已复制")}catch{(A=o.showToast)==null||A.call(o,"复制失败，请从地址栏复制")}else if(r==="link"){const f=prompt("输入链接地址（https://…）");if(!f)return;try{const w=new URL(f);if(!["http:","https:","mailto:"].includes(w.protocol))throw new Error;dt("createLink",w.href)}catch{(L=o.showToast)==null||L.call(o,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(o.status="loading",o.error="",(m=o.render)==null||m.call(o),o.loadPromise||(o.loadPromise=Gt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(a=>{a.addEventListener("click",r=>{r.target===a&&(a.classList.contains("editor-settings-backdrop")?_():K())})});const i=document.getElementById("editor-settings-form");i==null||i.addEventListener("submit",async a=>{var d,p,u;a.preventDefault();const r=new FormData(i),n=String(r.get("github-token-not-password")||"").trim();n&&(o.token=n);const c=String(r.get("path")||"").trim().replace(/^\/+/,"");o.target={...o.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:c,mirrors:c===((d=o.target)==null?void 0:d.path)?((p=o.target)==null?void 0:p.mirrors)||[]:[],source:"manual"};const s=o.pendingSave;_();const l=document.querySelector(".editor-target-label");if(l){const g=`${o.target.owner}/${o.target.repository} · ${o.target.path}`;l.textContent=g,l.title=g}(u=o.showToast)==null||u.call(o,"保存权限已连接"),s&&await Ct(t)})}async function Wt(t,e){try{const i=await fetch(t.url,{cache:"no-store"});if(!i.ok)throw new Error;Kt(await i.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function Ne(t,e){try{await Vt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const It="clair-service-report-workbench-v1",St="clair-service-report-workbench-access",tt="clair-service-report-workbench-view",R=8,rt=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],Y=["手动保存","生产","个人","HTML","本体","飞书","调研","产品规划","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],O={version:R,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!0,position:5,createdAt:"2026-07-30T08:00:00.000Z",source:"OAP 管理层汇报成稿",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-productization-roadshow-2026-07-30",groupId:"reporting",title:"AI 产品化实践路演｜CEO / CTO",url:"https://clairku.github.io/clair-ai-studio/reports/ai-productization-roadshow-2026-07-30/",pinned:!0,position:0,createdAt:"2026-07-30T00:00:00.000Z",source:"CEO / CTO 路演材料",access:"production"},{id:"advisor-report-skill-ai-practice",groupId:"reporting",title:"AI 工具实践案例｜顾问报告 Skill",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-report-skill-ai-practice-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T15:30:00.000Z",source:"顾问报告 Skill 材料",access:"production"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},ht={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-productization-roadshow-2026-07-30":"reporting","advisor-report-skill-ai-practice":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},Jt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function nt(t){const e=`${t.title||""} ${t.source||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|Studio|工作台|原型/i.test(e)?"product-demo":"product-planning"}function j(t,e=nt(t)){const i=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`,a=[],r=n=>{a.includes(n)||a.push(n)};return t.manualSaved&&r("手动保存"),t.isProduction&&r("生产"),t.isPersonal&&r("个人"),t.isHtml&&r("HTML"),/ontology\.yingmi-inc\.com|本体/.test(i)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(i)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(i))&&r("调研"),e==="product-planning"&&r("产品规划"),(/xiaogu|小顾|财务规划|投资行为/.test(i)||t.groupId==="xiaogu")&&r("AI 小顾"),(/studio|workbench|工作台|skill-audit/i.test(i)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(i)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(i)&&r("且慢"),/投顾|advisor|财务规划/.test(i)&&r("投顾服务"),/OAP|oap-/.test(i)&&r("OAP"),/MCP|mcp-/.test(i)&&r("MCP"),/Skills|skill-/.test(i)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),a.slice(0,5)}function je(t){const e=`${t.title||""} ${t.url||""} ${t.savedContent||""} ${t.detectedDescription||""}`;return/小顾|财务规划|投顾服务|客户陪伴/.test(e)?"xiaogu":/OAP|MCP|Skills?|开放平台|API|Agent|智能体/.test(e)?"ai-platform":/Studio|工作台|生产力|Copilot|编辑器/i.test(e)?"ai-workbench":/基金|投研|策略|资产配置|股票|债券/.test(e)?"research":/汇报|周报|月报|经营|进展|里程碑/.test(e)?"reporting":/知识|SOUL|飞书|治理|本体|文档库/.test(e)?"knowledge":/且慢|产品|需求|方案|原型|体验|PRD/i.test(e)?"product-planning":{"requirement-review":"product-planning","competitive-research":"product-planning",reporting:"reporting","data-analysis":"reporting","investment-research":"research","governance-review":"knowledge","product-demo":"ai-workbench","product-planning":"product-planning"}[t.workType]||"inbox"}O.reports=O.reports.map(t=>{const e=Jt[t.id]||t.groupId,i=ht[t.id]||nt(t),a={...t,groupId:e,workType:i};return{...a,tags:j(a,i)}});let b=Fe(),T="",M="",F=!1,k=["topic","type","tag","time"].includes(localStorage.getItem(tt))?localStorage.getItem(tt):"topic",D="",x="",H="",$=null,Ht=0;function Xt(t){return JSON.parse(JSON.stringify(t))}function N(t=""){try{const e=new URL(t);e.hash="",e.search="";const i=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${i}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function Fe(){try{const t=JSON.parse(localStorage.getItem(It));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return ze(t)}catch{}return Xt(O)}function ze(t){const e=Xt(O),i=new Set(e.groups.map(m=>m.id)),a=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(m=>[m.id,m])),n=e.groups.map(m=>{const f=r.get(m.id);return!f||t.version<R?m:{...m,name:f.name||m.name,description:f.description||m.description,position:Number.isFinite(f.position)?f.position:m.position}});t.groups.filter(m=>!i.has(m.id)&&!a.has(m.id)).forEach((m,f)=>{n.push({...m,description:m.description||"自定义工作分组",position:Number.isFinite(m.position)?m.position:O.groups.length+f})});const c=n.filter((m,f,w)=>w.findIndex(C=>C.id===m.id)===f);c.sort((m,f)=>(m.position||0)-(f.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},l={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},d=t.reports.map(m=>({...m,groupId:Jt[m.id]||s[m.id]||l[m.groupId]||m.groupId||"inbox",workType:m.workType||ht[m.id]||nt(m),tags:Array.isArray(m.tags)&&m.tags.length?m.tags:j(m,m.workType||ht[m.id])})),p=new Map(d.map(m=>[m.id,m])),u=new Map(d.map(m=>[N(m.url),m])),g=new Set,v=new Set,A=e.reports.map(m=>{const f=N(m.url);g.add(f),v.add(m.id);const w=p.get(m.id)||u.get(f);return w?{...m,title:t.version>=R&&w.title||m.title,groupId:t.version>=R&&c.some(C=>C.id===w.groupId)?w.groupId:m.groupId,workType:t.version>=R&&w.workType?w.workType:m.workType,tags:t.version>=R&&Array.isArray(w.tags)&&w.tags.length?w.tags:m.tags,pinned:!!w.pinned,position:Number.isFinite(w.position)?w.position:m.position,archived:!!w.archived,archivedAt:w.archivedAt||""}:m});d.forEach(m=>{const f=N(m.url);v.has(m.id)||f&&g.has(f)||(v.add(m.id),f&&g.add(f),A.push(m))});const L={version:R,groups:c,reports:A};return localStorage.setItem(It,JSON.stringify(L)),L}function E(){b.version=R,b.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(It,JSON.stringify(b))}function Ze(t=""){return(String(t).match(/https?:\/\/[^\s<>"'）)]+/gi)||[]).find(st)||""}function Ge(t,e,i){var c,s,l;const r=(s=(c=ot(t,e).match(/<title[^>]*>([\s\S]*?)<\/title>/i))==null?void 0:c[1])==null?void 0:s.replace(/\s+/g," ").trim();if(r)return r.slice(0,100);const n=String(t).split(/\n/).map(d=>d.trim().replace(/^#+\s*/,"")).find(d=>d&&!/^https?:\/\//i.test(d));return n?n.replace(/[。；;！!？?]+$/,"").slice(0,100):(l=e[0])!=null&&l.name?e[0].name.replace(/\.[^.]+$/,"").slice(0,100):i?Z(i):"未命名成果"}function Rt(t=""){return String(t).trim().replace(/\s+/g," ").toLocaleLowerCase()}function Pt(t=[]){return t.map(e=>`${String(e.name||"").trim().toLocaleLowerCase()}:${e.size||0}:${e.type||""}`).sort().join("|")}function Qt({material:t,files:e,url:i,excludeId:a=""}){const r=i?N(i):"",n=Rt(t),c=Pt(e);return b.reports.find(s=>s.id===a?!1:r&&N(s.url)===r||n&&Rt(s.savedContent)===n?!0:!n&&!!c&&Pt(s.savedFiles)===c)||null}function te(t=""){var e;try{const i=new URL(t),a=i.hostname.toLowerCase(),r=(e=i.pathname.split("/").filter(Boolean)[0])==null?void 0:e.toLowerCase();return a==="clairku.github.io"||(a==="github.com"||a==="raw.githubusercontent.com")&&r==="clairku"}catch{return!1}}function _e(t=""){try{return/\.html?$/i.test(new URL(t).pathname)}catch{return!1}}function ot(t="",e=[]){if(/<!doctype\s+html|<html[\s>]/i.test(t))return t.trim();const i=e.find(a=>/\.html?$/i.test(a.name));return(i==null?void 0:i.content)||(i==null?void 0:i.excerpt)||""}function ee(t=""){try{const e=new URL(t).hostname.toLowerCase();if(/(^|\.)feishu\.cn$|(^|\.)larksuite\.com$/.test(e))return{access:"org",provider:"飞书组织帐号"};if(/(^|\.)docs\.qq\.com$|(^|\.)doc\.weixin\.qq\.com$/.test(e))return{access:"account",provider:"腾讯文档帐号"};if(/(^|\.)yingmi-inc\.com$/.test(e))return{access:"org",provider:"盈米组织帐号"};if(e==="github.com"&&/^\/login(?:\/|$)/.test(new URL(t).pathname))return{access:"account",provider:"GitHub 帐号"}}catch{return null}return null}async function ae(t){var e,i,a,r,n;if(!st(t))return{title:"",description:"",reachable:!1};try{const c=`https://api.microlink.io/?url=${encodeURIComponent(t)}`,s=await fetch(c,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!s.ok)throw new Error("read failed");const l=await s.json();return{title:((i=(e=l==null?void 0:l.data)==null?void 0:e.title)==null?void 0:i.trim().slice(0,180))||"",description:((r=(a=l==null?void 0:l.data)==null?void 0:a.description)==null?void 0:r.trim().slice(0,500))||"",reachable:(l==null?void 0:l.status)==="success"&&!!((n=l==null?void 0:l.data)!=null&&n.url)}}catch{return{title:"",description:"",reachable:!1}}}async function ie({material:t="",files:e=[],url:i=""},a=()=>{}){const r=ot(t,e),n=e.some(l=>/\.html?$/i.test(l.name));if(!i)return r?{allowed:!0,access:"local",metadata:{title:"",description:"",reachable:!0},isHtml:!0,savedHtml:r,loginProvider:""}:{allowed:!1,reason:n?"HTML 文件过大或无法读取，未保存；请上传 1MB 以内的 HTML":"只能保存可正常访问的网址或 HTML 内容"};const c=ee(i);a(c?"正在识别权限页面与登录入口…":"正在检查页面是否可正常访问…");const s=c?{title:"",description:"",reachable:!0}:await ae(i);return!c&&!s.reachable?{allowed:!1,reason:"页面无法正常访问，且不是可读取的 HTML，未保存"}:{allowed:!0,access:(c==null?void 0:c.access)||"production",metadata:s,isHtml:_e(i),savedHtml:"",loginProvider:(c==null?void 0:c.provider)||""}}async function Ke({material:t,files:e},i=()=>{}){var p,u;const a=Ze(t);i("正在检查成果库是否已有相同内容…");const r=Qt({material:t,files:e,url:a});if(r)return{...r,duplicate:!0,groupName:((p=b.groups.find(g=>g.id===r.groupId))==null?void 0:p.name)||"待整理",workTypeName:ft(r.workType)};const n=await ie({material:t,files:e,url:a},i);if(!n.allowed)return{rejected:!0,duplicate:!1,reason:n.reason};const c=Ge(t,e,a),s=n.metadata;i("正在识别标题、分组、类型与标签…");const l=new Date().toISOString(),d={id:vt("report"),groupId:"inbox",title:s.title||c,url:a,pinned:!1,position:0,createdAt:l,source:a?"快捷保存":"本地保存",access:n.access,archived:!1,archivedAt:"",savedContent:t,savedFiles:e,detectedDescription:s.description,manualSaved:!0,isProduction:n.access==="production",isPersonal:te(a),isHtml:n.isHtml,savedHtml:n.savedHtml,loginProvider:n.loginProvider};d.workType=nt(d),d.groupId=je(d),d.tags=j(d,d.workType),i("正在保存到成果库…"),d.position=b.reports.filter(g=>!g.archived&&g.groupId===d.groupId).length,b.reports.push(d);try{E()}catch{return b.reports.pop(),{rejected:!0,duplicate:!1,reason:"HTML 内容超过当前浏览器可保存容量，请先下载或精简后重试"}}return F=!1,k!=="time"&&(k="topic"),T="",localStorage.setItem(tt,k),{...d,duplicate:!1,groupName:((u=b.groups.find(g=>g.id===d.groupId))==null?void 0:u.name)||"待整理",workTypeName:ft(d.workType)}}function ut(t,e){const i=b.groups.findIndex(n=>n.id===t),a=b.groups.findIndex(n=>n.id===e);if(i<0||a<0||i===a)return!1;const[r]=b.groups.splice(i,1);return b.groups.splice(a,0,r),E(),!0}function Ve(t,e,i=""){const a=b.reports.find(s=>s.id===t);if(!a||a.archived||!b.groups.find(s=>s.id===e))return!1;const n=b.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,l)=>(s.position||0)-(l.position||0)),c=i?n.findIndex(s=>s.id===i):n.length;return a.groupId=e,n.splice(c<0?n.length:c,0,a),n.forEach((s,l)=>{s.position=l}),E(),!0}function ft(t){var e;return((e=rt.find(i=>i.id===t))==null?void 0:e.name)||"产品规划"}function Ot(t){const e=new Date(t.createdAt||0).getTime();return Number.isFinite(e)?e:0}function bt(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?[e.getFullYear(),String(e.getMonth()+1).padStart(2,"0"),String(e.getDate()).padStart(2,"0")].join("-"):"unknown"}function Ye(t){if(t==="unknown")return"时间待补";const[e,i,a]=t.split("-").map(Number),r=new Date(e,i-1,a),n=new Date,c=bt(n),s=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1),l=new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",weekday:"short"}).format(r);return t===c?`今天 · ${l}`:t===bt(s)?`昨天 · ${l}`:e===n.getFullYear()?l:`${e}年 · ${l}`}function We(t){const e=new Date(t||0);return Number.isFinite(e.getTime())?`新增于 ${new Intl.DateTimeFormat("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).format(e)}`:"新增时间待补"}function Je(t,e=""){const i=a=>!e||a.toLowerCase().includes(e);if(k==="time"){const a=new Map;return[...t].sort((r,n)=>Ot(n)-Ot(r)).forEach(r=>{const n=bt(r.createdAt);a.has(n)||a.set(n,[]),a.get(n).push(r)}),[...a.entries()].map(([r,n])=>({id:r,name:Ye(r),kind:"time",accent:"slate",reports:n}))}if(k==="type")return rt.map(a=>({id:a.id,name:a.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===a.id).sort((r,n)=>+!!n.pinned-+!!r.pinned||new Date(n.createdAt)-new Date(r.createdAt))})).filter(a=>!e||a.reports.length||i(a.name));if(k==="tag"){const a=new Set(Y);return b.reports.forEach(n=>{(n.tags||[]).forEach(c=>a.add(c))}),[...a].sort((n,c)=>{const s=Y.indexOf(n),l=Y.indexOf(c);return s>=0||l>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(l<0?Number.MAX_SAFE_INTEGER:l):n.localeCompare(c,"zh-CN")}).map(n=>({id:n,name:n,kind:"tag",accent:"violet",reports:t.filter(c=>(c.tags||[]).includes(n)).sort((c,s)=>+!!s.pinned-+!!c.pinned||new Date(s.createdAt)-new Date(c.createdAt))})).filter(n=>n.reports.length&&(!e||i(n.name)||n.reports.length))}return b.groups.map(a=>({...a,kind:"topic",reports:t.filter(r=>r.groupId===a.id).sort((r,n)=>(r.position||0)-(n.position||0))})).filter(a=>!e||a.reports.length||i(`${a.name} ${a.description||""}`))}function V(t,e,i,a=""){const r=b.reports.find(n=>n.id===t);return!r||r.archived?!1:e==="topic"?Ve(t,i,a):e==="type"?rt.some(n=>n.id===i)?(r.workType=i,E(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(i)||r.tags.push(i),E(),!0):!1}function z(){return k==="type"?"工作类型":k==="tag"?"标签":k==="time"?"新增时间":"主题"}function vt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function h(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}const Xe={back:`
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
    </svg>`};function B(t){return Xe[t]||""}function Z(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function st(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function pt(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function I(t){var i;(i=document.querySelector(".toast"))==null||i.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(Ht),Ht=window.setTimeout(()=>e.remove(),2600)}function et(t){return t.savedHtml||ot(t.savedContent,t.savedFiles)}function Qe(t){return`${String(t.title||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,80)||"report"}.html`}function re(t){const e=et(t);return e?URL.createObjectURL(new Blob([e],{type:"text/html;charset=utf-8"})):""}function ta(t){const e=re(t);if(!e)return!1;const i=document.createElement("a");return i.href=e,i.download=Qe(t),document.body.append(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(e),1e3),!0}function ea(t){const e=t.url||re(t);return e?(window.open(e,"_blank","noopener,noreferrer"),t.url||window.setTimeout(()=>URL.revokeObjectURL(e),6e4),!0):!1}function ne(t,e=!1){const i=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),a=["org","account"].includes(t.access),r=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",n=et(t),c=k==="time"?We(t.createdAt):t.source||"手动添加",s=!a&&O.reports.some(d=>d.id===t.id),l=n&&t.isHtml?`<iframe class="local-html-preview-frame" title="${h(t.title)}视觉预览"
        srcdoc="${h(n)}" sandbox="allow-scripts" loading="lazy"
        tabindex="-1" aria-hidden="true"></iframe>`:s?`<img src="./previews/${h(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":h(t.title.slice(0,2))}</span>
        <strong>${a?r:i?"本地内容":"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${H===t.id?"is-move-selected":""}" data-report-id="${h(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${h(t.id)}" aria-label="打开${h(t.title)}">
        <span class="report-preview">
          ${l}
        </span>
        <span class="report-copy">
          <span class="report-source">${h(c)}</span>
          <strong>${h(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(d=>`<span>${h(d)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${h(r)}</span>`:""}
        </span>
      </button>
      ${e||k==="time"?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${h(t.id)}"
          aria-label="拖动《${h(t.title)}》到其他${z()}" title="拖动到其他${z()}">
          <span aria-hidden="true">⠿</span>
        </span>`}
      <div class="card-actions">
        ${e?`
            <button type="button" data-action="restore" data-id="${h(t.id)}">恢复</button>
            <button type="button" data-action="delete" data-id="${h(t.id)}">永久删除</button>`:`
            <button type="button" class="tag-edit-action" data-action="edit-tags" data-id="${h(t.id)}" title="编辑标签" aria-label="编辑标签">#</button>
            ${t.url?`<button type="button" data-action="edit" data-id="${h(t.id)}">编辑</button>`:""}
            <button type="button" data-action="archive" data-id="${h(t.id)}">归档</button>`}
      </div>
    </article>`}function Tt(){var i;if(!$)return"";if($.type==="tags"){const a=b.reports.find(r=>r.id===$.reportId);return a?`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog tag-dialog" id="tag-form">
          <div class="dialog-title-row">
            <div>
              <span class="section-kicker">REPORT TAGS</span>
              <h2>编辑关键标签</h2>
            </div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <p class="tag-dialog-title">${h(a.title)}</p>
          <label>标签
            <input name="tags" value="${h((a.tags||[]).join("、"))}" placeholder="例如：本体、飞书、调研" autofocus />
          </label>
          <div class="tag-suggestions">
            ${Y.map(r=>`<button type="button" class="${(a.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${h(r)}">${h(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if($.type==="group"){const a=$.mode==="edit"?b.groups.find(r=>r.id===$.groupId):null;return`
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
            <input name="name" value="${h((a==null?void 0:a.name)||"")}" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <label>主题说明
            <input name="description" value="${h((a==null?void 0:a.description)||"")}" placeholder="这个主题主要收纳什么" maxlength="80" />
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
            ${b.groups.map(a=>`<option value="${h(a.id)}" ${a.id===e?"selected":""}>${h(a.name)}</option>`).join("")}
          </select>
        </label>
        <label>工作类型
          <select name="workType">
            ${rt.map(a=>`<option value="${h(a.id)}" ${a.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${h(a.name)}</option>`).join("")}
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
    </div>`}function aa(){return`
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
    </main>`}function ia(t){var s;if(Yt(t.id))return Be(t,h);const e=!t.url&&(!!t.savedContent||!!(t.savedFiles||[]).length),i=["org","account"].includes(t.access),a=t.loginProvider||((s=ee(t.url))==null?void 0:s.provider)||(t.access==="org"?"组织帐号":"站点帐号"),r=t.savedHtml||ot(t.savedContent,t.savedFiles),n=r?"edit-local-document":t.url?i?"edit":"edit-document":"",c=r?`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${h(t.title)}"
          srcdoc="${h(r)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"></iframe>
      </div>`:e?`
      <div class="saved-material-wrap">
        <article class="saved-material-card">
          <span class="section-kicker">SAVED MATERIAL</span>
          <h1>${h(t.title)}</h1>
          ${t.savedContent?`<div class="saved-material-content">${h(t.savedContent).replaceAll(`
`,"<br />")}</div>`:""}
          ${(t.savedFiles||[]).length?`<section class="saved-file-list">
                <strong>附件记录</strong>
                ${t.savedFiles.map(l=>`<span><b>${h(l.name)}</b><small>${h(l.sizeLabel||"")}</small></span>`).join("")}
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
            <a class="primary-button" href="${h(t.url)}" target="_blank" rel="noreferrer">打开${h(a)}登录页 ↗</a>
            <button class="quiet-button" type="button" data-action="back">返回清单</button>
          </div>
          <p class="login-handoff-domain">${h(Z(t.url))}</p>
        </section>
      </div>`:`
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${h(t.title)}" src="${h(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>`;return`
    <main class="reader-shell compact-reader-shell">
      <header class="reader-header compact-reader-header">
        <button class="reader-icon-button back-button" type="button" data-action="back"
          aria-label="返回成果库" title="返回成果库">${B("back")}</button>
        <div class="reader-title">
          <strong>${h(t.title)}</strong>
          <span>${e?"本地保存":h(Z(t.url))}</span>
        </div>
        <div class="reader-actions compact-reader-actions" aria-label="报告操作">
          ${n?`
            <button class="reader-icon-button" type="button" data-action="${n}"
              data-id="${h(t.id)}" aria-label="编辑" title="编辑">
              ${B("edit")}
            </button>`:""}
          ${t.url&&t.access==="production"?`
            <button class="reader-icon-button" type="button" data-action="copy-production-url"
              data-id="${h(t.id)}" aria-label="复制生产 URL" title="复制生产 URL">
              ${B("copy")}
            </button>`:""}
          ${!i&&(t.url||r)?`
            <button class="reader-icon-button" type="button" data-action="download-report"
              data-id="${h(t.id)}" aria-label="下载 HTML" title="下载 HTML">
              ${B("download")}
            </button>`:""}
          ${t.url||r?`
            <button class="reader-icon-button" type="button" data-action="open-browser"
              data-id="${h(t.id)}"
              aria-label="${i?`打开${h(a)}登录页`:"在浏览器打开"}"
              title="${i?`打开${h(a)}登录页`:"在浏览器打开"}">
              ${B("external")}
            </button>`:""}
        </div>
      </header>
      ${c}
      ${Tt()}
    </main>`}function oe(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      ${F?'<div class="top-actions"><button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button></div>':""}
    </header>`}function ra(){const t=b.reports.filter(i=>i.archived).filter(i=>{if(!T.trim())return!0;const a=T.trim().toLowerCase();return`${i.title} ${i.url} ${i.source||""}`.toLowerCase().includes(a)}).sort((i,a)=>new Date(a.archivedAt||0)-new Date(i.archivedAt||0)),e=b.reports.filter(i=>i.archived).length;return`
    <main class="app-shell archive-shell">
      ${oe()}
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
            <div class="archive-grid">${t.map(i=>ne(i,!0)).join("")}</div>
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
      ${Tt()}
    </main>`}function na(){if(F)return ra();const t=T.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),i=b.reports.filter(d=>!d.archived),a=e.length?i.filter(d=>{const p=`${d.title} ${d.source||""} ${d.access||""} ${ft(d.workType)} ${(d.tags||[]).join(" ")}`.toLowerCase();return e.every(u=>p.includes(u))}):i,r=b.reports.filter(d=>d.archived).length,n=i.filter(d=>d.access==="production").length,c=i.filter(d=>d.access!=="production").length,s=Je(a,t).filter(d=>d.reports.length||H),l=k==="type"?"工作类型":k==="tag"?"关键标签":k==="time"?"新增时间":"工作主题";return`
    <main class="app-shell">
      ${oe()}
      <section class="workspace">
        ${me(h)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${h(T)}" aria-label="搜索成果" />
              ${T?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${i.length}</strong><span>成果</span>
              <i></i>
              <strong>${b.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${n}</strong><span>直达</span>
            </div>
          </div>
        </div>
        <section class="groups-section">
          ${H?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${z()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          ${s.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${l}">
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
                ${s.map((d,p)=>`<a href="#bucket-${p}"><span class="nav-index">${String(p+1).padStart(2,"0")}</span>${h(d.name)}<span>${d.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${r?`<em>${r}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${k}">
              ${s.map((d,p)=>`
                <section id="bucket-${p}" class="group-column topic-section bucket-${h(d.kind)} accent-${h(d.accent||"blue")}"
                  data-bucket-kind="${h(d.kind)}"
                  data-bucket-id="${h(d.id)}"
                  ${d.kind==="topic"?`data-group-id="${h(d.id)}"`:""}>
                  <header class="group-header">
                    ${d.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${h(d.id)}"
                          aria-label="拖动“${h(d.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(p+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${d.kind==="tag"?"#":d.kind==="time"?"时":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${h(d.name)}</h2></div>
                      <span class="count">${d.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${H?`<button class="move-here-button" type="button" data-action="move-here" data-id="${h(d.id)}" data-bucket-kind="${h(d.kind)}">移到这里</button>`:""}
                      ${d.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${h(d.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${h(d.id)}">编辑主题</button>
                           ${d.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${h(d.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${d.reports.length?d.reports.map(u=>ne(u)).join(""):d.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${h(d.id)}">
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
      ${Tt()}
    </main>`}function y(){const t=document.getElementById("app");if(sessionStorage.getItem(St)!=="ok"){t.innerHTML=aa(),oa();return}const e=M&&b.reports.find(i=>i.id===M);t.innerHTML=e?ia(e):na(),ca(),ge({render:y,showToast:I,saveToLibrary:Ke})}function oa(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const a=t.querySelector(".form-error");a.hidden=!1,a.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(St,"ok"),y()})}async function sa(t){const e=t.elements.url,i=t.elements.title,a=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),n=e.value.trim();if(!st(n))return r.textContent="请输入完整的 http 或 https 网址","";a.disabled=!0,a.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const{title:c}=await ae(n);if(!c)throw new Error("read failed");return i.value=c,r.textContent="已识别网页标题",i.value}catch{const c=Z(n);return i.value||(i.value=c),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",i.value}finally{a.disabled=!1,a.textContent="识别标题"}}function ca(){var r;(r=document.getElementById("search-input"))==null||r.addEventListener("input",n=>{if(n.isComposing)return;T=n.target.value,y();const c=document.getElementById("search-input");c==null||c.focus(),c==null||c.setSelectionRange(T.length,T.length)}),document.querySelectorAll("[data-action]").forEach(n=>{n.addEventListener("click",async c=>{var d,p;const s=c.currentTarget.dataset.action,l=c.currentTarget.dataset.id;if(s==="open")M=l,y();else if(s==="edit-document"){const u=b.reports.find(g=>g.id===l);if(!u||u.access!=="production")return;Mt(u,{render:y,showToast:I})}else if(s==="edit-local-document"){const u=b.reports.find(g=>g.id===l);if(!u||!et(u))return;Mt(u,{render:y,showToast:I,saveLocal:async g=>{const v=u.savedHtml;u.savedHtml=g,u.isHtml=!0,u.tags=j(u,u.workType);try{E()}catch{throw u.savedHtml=v,new Error("修改后的 HTML 超过当前浏览器可保存容量，请先下载备份")}}})}else if(s==="download-report"){const u=b.reports.find(g=>g.id===l);if(!u)return;et(u)?ta(u)&&I("HTML 已下载"):await Wt(u,I)}else if(s==="share-report"||s==="copy-production-url"){const u=b.reports.find(g=>g.id===l);u!=null&&u.url&&await Ne(u,g=>{I(g==="报告链接已复制"?"生产 URL 已复制":g)})}else if(s==="open-browser"){const u=b.reports.find(g=>g.id===l);if(!u)return;ea(u)||I("浏览器未能打开该报告")}else if(s==="back")M="",$=null,y();else if(s==="lock")sessionStorage.removeItem(St),y();else if(s==="clear-search")T="",y();else if(s==="set-view"){if(!["topic","type","tag","time"].includes(l))return;k=l,H="",localStorage.setItem(tt,k),y()}else if(s==="cancel-move")H="",y();else if(s==="move-here"){const u=c.currentTarget.dataset.bucketKind||k;H&&V(H,u,l)&&(H="",y(),I(u==="tag"?"已添加目标标签":`报告已移入目标${z()}`))}else if(s==="show-archive")F=!0,T="",M="",y();else if(s==="show-catalog")F=!1,T="",M="",y();else if(s==="add-report")$={type:"report",mode:"create",groupId:((d=b.groups[1])==null?void 0:d.id)||((p=b.groups[0])==null?void 0:p.id)},y();else if(s==="add-to-group")$={type:"report",mode:"create",groupId:l},y();else if(s==="edit")$={type:"report",mode:"edit",reportId:l},y();else if(s==="edit-tags")$={type:"tags",reportId:l},y();else if(s==="close-modal")$=null,y();else if(s==="detect-title")await sa(c.currentTarget.closest("form"));else if(s==="archive"){const u=b.reports.find(g=>g.id===l);if(!u)return;u.archived=!0,u.archivedAt=new Date().toISOString(),E(),y(),I("已归档，可随时恢复")}else if(s==="restore"){const u=b.reports.find(g=>g.id===l);if(!u)return;u.archived=!1,u.archivedAt="",E(),y(),I("报告已恢复到原主题")}else if(s==="delete"){const u=b.reports.find(g=>g.id===l);u!=null&&u.archived&&confirm(`二次确认：永久删除“${u.title}”？

删除后无法从归档区恢复。`)&&(b.reports=b.reports.filter(g=>g.id!==l),M===l&&(M=""),E(),y(),I("报告已永久删除"))}else if(s==="add-group")$={type:"group",mode:"create"},y();else if(s==="rename-group")b.groups.find(g=>g.id===l)&&($={type:"group",mode:"edit",groupId:l},y());else if(s==="delete-group"){const u=b.groups.find(g=>g.id===l);u&&confirm(`删除“${u.name}”？其中的报告会移到“待整理”。`)&&(b.reports.forEach(g=>{g.groupId===l&&(g.groupId="inbox")}),b.groups=b.groups.filter(g=>g.id!==l),E(),y(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(n=>{let c=null,s=!1;const l=()=>{var d;D="",c=null,s=!1,(d=n.closest(".report-card"))==null||d.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(p=>{p.classList.remove("is-card-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",d=>{var p,u;d.preventDefault(),D=n.dataset.reportDragId,x="",c={x:d.clientX,y:d.clientY},s=!1,(p=n.setPointerCapture)==null||p.call(n,d.pointerId),(u=n.closest(".report-card"))==null||u.classList.add("is-dragging")}),n.addEventListener("pointermove",d=>{if(!D||c&&Math.hypot(d.clientX-c.x,d.clientY-c.y)<7)return;s=!0;const p=document.elementFromPoint(d.clientX,d.clientY),u=p==null?void 0:p.closest(".report-card"),g=p==null?void 0:p.closest(".group-column");document.querySelectorAll(".report-card").forEach(v=>{v.classList.toggle("is-card-drop-target",!!(u&&u!==n.closest(".report-card")&&v===u))}),document.querySelectorAll(".group-column").forEach(v=>{v.classList.toggle("is-drop-ready",!!(g&&v===g))})}),n.addEventListener("pointerup",d=>{if(!D)return;const p=D;if(!s){H=p,l(),y(),I(`请选择目标${z()}`);return}const u=document.elementFromPoint(d.clientX,d.clientY),g=u==null?void 0:u.closest(".report-card"),v=u==null?void 0:u.closest(".group-column"),A=(g==null?void 0:g.dataset.reportId)||"",L=(v==null?void 0:v.dataset.bucketId)||"",m=(v==null?void 0:v.dataset.bucketKind)||k,f=A&&A!==p?V(p,m,L,A):L?V(p,m,L):!1;l(),f&&(y(),I(m==="tag"?"已添加目标标签":m==="type"?"工作类型已更新":A?"报告顺序已更新":"已移入新主题"))}),n.addEventListener("pointercancel",l)}),document.querySelectorAll(".group-drag-handle").forEach(n=>{const c=()=>{var s;x="",(s=n.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(l=>{l.classList.remove("is-group-drop-target","is-drop-ready")})};n.addEventListener("pointerdown",s=>{var l,d;s.preventDefault(),x=n.dataset.groupDragId,D="",(l=n.setPointerCapture)==null||l.call(n,s.pointerId),(d=n.closest(".group-column"))==null||d.classList.add("is-group-dragging")}),n.addEventListener("pointermove",s=>{x&&document.querySelectorAll(".group-column").forEach(l=>{var d;l.classList.toggle("is-group-drop-target",l===((d=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:d.closest(".group-column")))})}),n.addEventListener("pointerup",s=>{var p;if(!x)return;const l=x,d=(p=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:p.closest(".group-column");if(d&&ut(l,d.dataset.groupId)){x="",y(),I("分组顺序已更新");return}c()}),n.addEventListener("pointercancel",c),n.addEventListener("keydown",s=>{var u;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const l=b.groups.findIndex(g=>g.id===n.dataset.groupDragId),d=s.key==="ArrowLeft"?l-1:l+1,p=b.groups[d];!p||!ut(n.dataset.groupDragId,p.id)||(y(),I("分组顺序已更新"),(u=document.querySelector(`[data-group-drag-id="${CSS.escape(n.dataset.groupDragId)}"]`))==null||u.focus())})}),document.querySelectorAll(".group-column").forEach(n=>{n.addEventListener("dragover",c=>{c.preventDefault(),n.classList.add(x?"is-group-drop-target":"is-drop-ready")}),n.addEventListener("dragleave",()=>{n.classList.remove("is-drop-ready","is-group-drop-target")}),n.addEventListener("drop",c=>{if(c.preventDefault(),x){if(n.dataset.bucketKind==="topic"&&ut(x,n.dataset.groupId)){x="",y(),I("分组顺序已更新");return}x="",n.classList.remove("is-group-drop-target");return}const s=b.reports.find(d=>d.id===D),l=n.dataset.bucketKind||k;s&&V(D,l,n.dataset.bucketId)&&(D="",y(),I(l==="tag"?"已添加目标标签":l==="type"?"工作类型已更新":"已移入新主题")),D=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(n=>{n.addEventListener("click",()=>{const c=document.querySelector('#tag-form input[name="tags"]');if(!c)return;const s=pt(c.value),l=n.dataset.tagSuggestion;c.value=s.includes(l)?s.filter(d=>d!==l).join("、"):[...s,l].slice(0,8).join("、"),n.classList.toggle("selected",!s.includes(l)),c.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",n=>{n.preventDefault();const c=b.reports.find(s=>s.id===$.reportId);c&&(c.tags=pt(new FormData(t).get("tags")),E(),$=null,y(),I("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",n=>{var d,p;n.preventDefault();const c=(d=new FormData(e).get("name"))==null?void 0:d.trim(),s=(p=new FormData(e).get("description"))==null?void 0:p.trim();if(!c)return;if($.mode==="edit"){const u=b.groups.find(g=>g.id===$.groupId);if(!u)return;u.name=c.slice(0,60),u.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else b.groups.push({id:vt("group"),name:c.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][b.groups.length%4],position:b.groups.length});E();const l=$.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";$=null,y(),I(l)});const i=document.getElementById("report-form");i==null||i.addEventListener("submit",async n=>{n.preventDefault();const c=i.elements.url.value.trim();if(!st(c))return;const s=i.querySelector('button[type="submit"]'),l=i.querySelector(".field-hint");s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';const d=$.mode==="edit"?$.reportId:"",p=Qt({material:c,files:[],url:c,excludeId:d});if(p){s.disabled=!1,s.textContent="保存",l.textContent=`成果库已有“${p.title}”，未重复保存`,I(`成果库已有“${p.title}”，未重复保存`);return}const u=await ie({material:c,files:[],url:c},w=>{l.textContent=w});if(!u.allowed){s.disabled=!1,s.textContent="保存",l.textContent=u.reason,I(u.reason);return}let g=i.elements.title.value.trim()||u.metadata.title;const v=i.elements.groupId.value,A=i.elements.workType.value,L=pt(i.elements.tags.value),m={title:g||Z(c),url:c,groupId:v,workType:A,source:"手动添加",access:u.access,detectedDescription:u.metadata.description,manualSaved:!0,isProduction:u.access==="production",isPersonal:te(c),isHtml:u.isHtml,loginProvider:u.loginProvider},f=[...new Set([...j(m,A),...L])].slice(0,8);if($.mode==="edit"){const w=b.reports.find(C=>C.id===$.reportId);Object.assign(w,m,{tags:f})}else{const w={id:vt("report"),groupId:v,...m,pinned:!1,position:b.reports.filter(C=>C.groupId===v).length,createdAt:new Date().toISOString(),archived:!1,archivedAt:"",tags:f};b.reports.push(w)}E(),$=null,y(),I("报告已保存")});const a=M&&b.reports.find(n=>n.id===M);a&&Ue(a)}function la(){y()}la(document.getElementById("app"));
