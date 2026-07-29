(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function a(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=a(n);fetch(n.href,r)}})();const wt="clair-ai-studio-tasks-v1",at=[{id:"auto",name:"智能识别",summon:"自动派单",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",summon:"需求专家",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",summon:"方案专家",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",summon:"决策顾问",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",summon:"协议专家",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",summon:"履历顾问",icon:"历",hint:"事实、能力、匹配、核验"}];let T=Ut(),y={skillId:"auto",goal:"",material:"",files:[]},D="",O="compose";function Ut(){try{const t=JSON.parse(localStorage.getItem(wt));return Array.isArray(t)?t:[]}catch{return[]}}function Z(){localStorage.setItem(wt,JSON.stringify(T))}function kt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function rt(t){return at.find(e=>e.id===t)||at[0]}function Nt(t){var i;const e=t.toLowerCase();return((i=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,n])=>n.some(r=>e.includes(r))))==null?void 0:i[0])||"solution"}function $t(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function jt(t,e){const a=t.files.length?t.files.map(n=>`${n.name}（${n.sizeLabel}）`).join("、"):"无附件",i=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(a)}</li>
      <li>粘贴内容：${i} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function Zt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function Gt(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function V(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let n="";if(i&&a.size<=1024*1024)try{n=(await a.text()).slice(0,12e3)}catch{n=""}return{id:kt(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:Gt(a.size),excerpt:n}}))}function _t(t){return at.map(e=>`
    <button class="expert-choice ${y.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}"
      title="${t(e.hint)}" aria-pressed="${y.skillId===e.id}">
      <span>${t(e.icon)}</span>
      <strong>@${t(e.summon)}</strong>
    </button>`).join("")}function zt(t){return y.files.length?`<div class="attachment-list">${y.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function Kt(t){const e=T.filter(a=>a.status!=="confirmed").sort((a,i)=>new Date(i.updatedAt)-new Date(a.updatedAt));return e.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${e.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(a=>`
          <button type="button" data-task-action="open-task" data-task-id="${a.id}">
            <span>${t(rt(a.skillId).icon)}</span>
            <div><strong>${t(a.title)}</strong><small>${a.status==="review"?"待确认":"处理中"} · ${$t(a.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function Ft(t){if(D){const e=T.find(a=>a.id===D);if(e)return Ht(e,t);D=""}return`
    <section class="inline-task-launcher prompt-launcher" aria-label="发起任务">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3" placeholder="描述你想完成的事，或把文档、图片直接拖进来……" aria-label="任务描述">${t(y.goal)}</textarea>
        </div>
        ${zt(t)}
        <div class="prompt-footer">
          <div class="prompt-material-actions">
            <label class="prompt-file-button" for="task-files">
              <input id="task-files" type="file" multiple />
              <span aria-hidden="true">＋</span>
              <strong>材料</strong>
            </label>
            <span class="paste-hint">拖入文件 · ⌘V 粘贴图片</span>
          </div>
          <div class="expert-summoner" aria-label="召唤专家">
            <span class="summon-label">召唤</span>
            <div class="expert-strip">${_t(t)}</div>
          </div>
          <button class="prompt-submit" type="submit" aria-label="开始任务">
            <span>开始</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
      ${Kt(t)}
    </section>`}function Ht(t,e){var i;const a=t.status==="confirmed";return`
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${e(t.skillName)} · SKILL V${e(t.skillVersion)}</span><h1>${e(t.title)}</h1></div>
        <span class="status-pill ${a?"done":""}">${a?"已进入成果区":"等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${e(t.goal)}</p></section>
          <section><span>材料</span><p>${t.files.length} 个附件 · ${t.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${(i=t.revisions)!=null&&i.length?`<section><span>进化记录</span><p>${t.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>`:""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${a?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${$t(t.updatedAt)}</small></div>
          ${O==="edit"&&!a?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${a?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':O==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function Wt(t){const e=T.filter(a=>a.status==="confirmed").sort((a,i)=>new Date(i.confirmedAt)-new Date(a.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(a=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${a.id}">
          <span>${t(rt(a.skillId).icon)}</span>
          <div><small>${t(a.skillName)}</small><strong>${t(a.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function Vt({render:t,escapeHtml:e,showToast:a,showResults:i}){document.querySelectorAll("[data-task-action]").forEach(l=>{l.addEventListener("click",async c=>{var p;const m=c.currentTarget.dataset.taskAction;if(m==="expand-launcher")R(),t(),requestAnimationFrame(()=>{var d;return(d=document.getElementById("task-goal"))==null?void 0:d.focus()});else if(m==="collapse-launcher")R(),t();else if(m==="choose-skill")y.skillId=c.currentTarget.dataset.skillId,R(),t();else if(m==="remove-file")R(),y.files=y.files.filter(d=>d.id!==c.currentTarget.dataset.fileId),t();else if(m==="open-task")D=c.currentTarget.dataset.taskId,O="compose",t();else if(m==="close-task"){const d=T.find(b=>b.id===D);D="",O="compose",(d==null?void 0:d.status)==="confirmed"&&(i==null||i()),t()}else if(m==="edit-result")O="edit",t();else if(m==="cancel-edit")O="compose",t();else if(m==="save-revision"){const d=T.find(S=>S.id===c.currentTarget.dataset.taskId),b=(p=document.getElementById("task-result-input"))==null?void 0:p.value.trim();if(!d||!b)return;d.revisions||(d.revisions=[]),d.revisions.push({at:new Date().toISOString(),before:d.resultText||"",after:b}),d.resultText=b,d.resultHtml=`<p>${e(b).replaceAll(`
`,"</p><p>")}</p>`,d.updatedAt=new Date().toISOString(),Z(),O="compose",t(),a("已保存人工修改，并记录为进化样本")}else if(m==="supplement-task"){const d=T.find(b=>b.id===D);if(!d)return;y={skillId:d.requestedSkillId,goal:d.goal,material:d.material,files:d.files},T=T.filter(b=>b.id!==d.id),Z(),D="",O="compose",t()}else if(m==="confirm-task"){const d=T.find(b=>b.id===c.currentTarget.dataset.taskId);if(!d)return;d.status="confirmed",d.confirmedAt=new Date().toISOString(),d.updatedAt=d.confirmedAt,Z(),D="",O="compose",i==null||i(),t(),a("已确认并放入成果区")}})});const n=document.getElementById("task-composer");n==null||n.addEventListener("submit",l=>{var b;if(l.preventDefault(),R(),!y.goal.trim())if(y.files.length)y.goal="分析已提供的材料";else{a("写下任务，或先加入一份材料"),(b=document.getElementById("task-goal"))==null||b.focus();return}const c=y.skillId==="auto"?Nt(`${y.goal}
${y.material}
${y.files.map(S=>S.name).join(" ")}`):y.skillId,m=rt(c),p=new Date().toISOString(),d={id:kt(),title:Zt(y.goal,m.name),requestedSkillId:y.skillId,skillId:c,skillName:m.name,skillVersion:"1.0.0",goal:y.goal.trim(),material:y.material.trim()||y.goal.trim(),files:y.files,status:"review",createdAt:p,updatedAt:p,revisions:[]};d.resultHtml=jt(d,e),d.resultText=`材料已收齐并匹配 ${d.skillName}。目标：${d.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,T.push(d),Z(),D=d.id,y={skillId:"auto",goal:"",material:"",files:[]},t(),a(`已创建任务，并匹配“${m.name}”`)});const r=document.getElementById("task-files");r==null||r.addEventListener("change",async l=>{R(),y.files.push(...await V(l.target.files)),t(),a(`已加入 ${l.target.files.length} 个文件`)});const s=document.getElementById("material-drop")||document.querySelector(".prompt-composer");s==null||s.addEventListener("dragover",l=>{l.preventDefault(),s.classList.add("drag-over")}),s==null||s.addEventListener("dragleave",()=>s.classList.remove("drag-over")),s==null||s.addEventListener("drop",async l=>{l.preventDefault(),s.classList.remove("drag-over"),R();const c=l.dataTransfer.files;y.files.push(...await V(c)),t(),a(`已加入 ${c.length} 个文件`)});const o=document.getElementById("task-goal");o==null||o.addEventListener("input",()=>{y.goal=o.value}),o==null||o.addEventListener("paste",async l=>{var b;const c=[...((b=l.clipboardData)==null?void 0:b.items)||[]].filter(S=>S.kind==="file"&&S.type.startsWith("image/")).map(S=>S.getAsFile()).filter(Boolean);if(!c.length)return;l.preventDefault();const m=l.clipboardData.getData("text/plain"),p=o.selectionStart??o.value.length,d=o.selectionEnd??p;y.goal=`${o.value.slice(0,p)}${m}${o.value.slice(d)}`,y.files.push(...await V(c)),t(),a(`已从剪贴板加入 ${c.length} 张图片`)})}function R(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal"),a=document.getElementById("task-quick-goal");t&&(y.material=t.value),e&&(y.goal=e.value),a&&(y.goal=a.value)}const F="clair-report-editor-v1",Yt="https://api.github.com",It="2026",u={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,target:null,token:"",settingsOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:null,showToast:null},z=new Map;let mt=!1;function ot(t){return[...new Set(t.filter(Boolean))]}function Jt(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Xt(t){const e=atob(String(t||"").replace(/\s/g,"")),a=Uint8Array.from(e,i=>i.charCodeAt(0));return new TextDecoder().decode(a)}function Qt(t){const e=new TextEncoder().encode(t);let a="";const i=32768;for(let n=0;n<e.length;n+=i)a+=String.fromCharCode(...e.subarray(n,n+i));return btoa(a)}function Y(t){let e="";for(let i=0;i<t.length;i+=32768)e+=String.fromCharCode(...t.subarray(i,i+32768));return btoa(e)}function J(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function At(t,e){const a=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},a,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function te(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const a=JSON.parse(e[1]),i=J(a.salt),n=J(a.iv),r=await At(It,i),s=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},r,J(a.data)),o=new TextDecoder().decode(s);if(!/<html[\s>]/i.test(o))throw new Error("解密结果不是 HTML");return{html:o,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function St(t){var s;if(((s=u.protection)==null?void 0:s.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),a=crypto.getRandomValues(new Uint8Array(12)),i=await At(It,e),n=await crypto.subtle.encrypt({name:"AES-GCM",iv:a},i,new TextEncoder().encode(t)),r=JSON.stringify({salt:Y(e),iv:Y(a),data:Y(new Uint8Array(n))});return u.protection.wrapperHtml.replace(u.protection.payloadSource,r)}function ee(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const a=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),i=a.shift()||"ClairKu.github.io";let n=a.join("/");(!n||e.pathname.endsWith("/"))&&(n=`${n?`${n}/`:""}index.html`);const r=ot([`docs/${n}`,n,`public/${n}`]);return{owner:"ClairKu",repository:i,branch:"main",path:r[0],candidates:r,source:"auto"}}catch{return null}}async function K(t,{token:e="",method:a="GET",body:i}={}){var s;const n={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(n.Authorization=`Bearer ${e}`),i!==void 0&&(n["Content-Type"]="application/json");const r=await fetch(`${Yt}${t}`,{method:a,headers:n,body:i===void 0?void 0:JSON.stringify(i)});if(!r.ok){let o="";try{o=((s=await r.json())==null?void 0:s.message)||""}catch{o=await r.text()}const l=new Error(o||`GitHub API ${r.status}`);throw l.status=r.status,l}return r.status===204?null:r.json()}async function ae(t){var s;const e=await K(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const a=ot((s=t.candidates)!=null&&s.length?t.candidates:[t.path]);let i=null,n=null;const r=[];for(const o of a)try{const l=o.split("/").map(encodeURIComponent).join("/"),c=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${l}?ref=${encodeURIComponent(t.branch)}`,m=await K(c);let p="";if(m.encoding==="base64"&&m.content)p=Xt(m.content);else if(m.download_url){const d=await fetch(m.download_url,{cache:"no-store"});if(!d.ok)throw new Error("无法读取 GitHub 原始文件");p=await d.text()}if(!p)throw new Error("GitHub 文件内容为空");n?p===n.html&&r.push({path:o,sha:m.sha}):n={html:p,target:{...t,path:o,sha:m.sha,candidates:a}}}catch(l){if(i=l,l.status&&![403,404].includes(l.status))break}if(n)return n.target.mirrors=r,n;throw i||new Error("没有找到对应的 GitHub HTML 文件")}function ie(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(i=>{/^on/i.test(i.name)&&(e.setAttribute(`data-clair-event-${i.name.toLowerCase()}`,i.value),e.removeAttribute(i.name))});const a=e.getAttribute("href");a&&/^\s*javascript:/i.test(a)&&(e.dataset.clairJavascriptHref=a,e.removeAttribute("href"))})}function ne(){return`
(() => {
  const channel = ${JSON.stringify(F)};
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
`}function re(t,e){const i=new DOMParser().parseFromString(t,"text/html");i.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(o=>{o.dataset.clairEditorHttpEquiv=o.getAttribute("http-equiv")||"Content-Security-Policy",o.setAttribute("http-equiv","x-clair-csp-disabled")}),ie(i);const n=i.createElement("base");n.href=e,n.dataset.clairEditorBase="true",i.head.prepend(n);const r=i.createElement("style");r.id="clair-editor-style",r.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,i.head.append(r);const s=i.createElement("script");return s.id="clair-editor-bridge",s.textContent=ne(),i.body.append(s),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}async function qt(t){var e;try{const a=ee(t.url);let i=null;if(a)try{i=await ae(a)}catch{}if(!i){const r=await fetch(t.url,{cache:"no-store"});if(!r.ok)throw new Error(`报告读取失败（HTTP ${r.status}）`);i={html:await r.text(),target:a}}const n=await te(i.html);u.html=n.html,u.protection=n.protection,u.target=i.target||a,u.editorDocument=re(n.html,t.url),u.status="ready",u.error=""}catch(a){u.status="error",u.error=(a==null?void 0:a.message)||"无法读取这份 HTML"}finally{u.loadPromise=null,(e=u.render)==null||e.call(u)}}function Et(){const t=u.render,e=u.showToast;Object.assign(u,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,target:null,settingsOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:t,showToast:e})}function st(){return document.querySelector(".report-editor-frame")}function X(t,e=null){var i;const a=st();(i=a==null?void 0:a.contentWindow)==null||i.postMessage({channel:F,type:"command",command:t,value:e},"*")}function Tt(){var a;const t=st();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((i,n)=>{const r=window.setTimeout(()=>{z.delete(e),n(new Error("读取编辑内容超时"))},1e4);z.set(e,{resolve:s=>{clearTimeout(r),i(s)}}),t.contentWindow.postMessage({channel:F,type:"serialize",requestId:e},"*")})}function oe(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function xt(t,e){const a=new Blob([t],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(a),n=document.createElement("a");n.href=i,n.download=oe(e),document.body.append(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),1e3)}async function Lt(t){await navigator.clipboard.writeText(t)}async function se(t){var o;const e=u.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!u.token)throw new Error("请先提供 GitHub Fine-grained Token");const a=await St(t),i=(e.mirrors||[]).map(l=>l.path),n=ot([...i.filter(l=>l.startsWith("public/")),...i.filter(l=>!l.startsWith("public/")&&l!==e.path),e.path]);let r="";const s=[];for(const l of n)try{const c=l.split("/").map(encodeURIComponent).join("/"),m=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${c}`,p=await K(`${m}?ref=${encodeURIComponent(e.branch)}`,{token:u.token}),d=await K(m,{token:u.token,method:"PUT",body:{message:`Update ${u.reportTitle} from Clair's Studio`,content:Qt(a),sha:p.sha,branch:e.branch}});r=((o=d==null?void 0:d.commit)==null?void 0:o.sha)||r,s.push(l)}catch(c){throw s.length?new Error(`已更新 ${s.join("、")}，但 ${l} 同步失败：${c.message}`):c}return{commit:r,files:s.length}}async function gt(){var e,a;if(u.saving)return;u.saving=!0;const t=document.querySelector('[data-editor-action="save"]');t&&(t.disabled=!0,t.textContent="保存中…");try{const i=await Tt(),n=await se(i);u.html=i,u.dirty=!1,u.lastCommit=n.commit,t&&(t.textContent="已保存"),(e=u.showToast)==null||e.call(u,n.files>1?`已同步 ${n.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(i){t&&(t.textContent="保存"),(a=u.showToast)==null||a.call(u,(i==null?void 0:i.message)||"保存失败，请下载 HTML 备份")}finally{u.saving=!1,t&&(t.disabled=!1)}}function ce(t){const e=u.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
    <div class="dialog-backdrop editor-settings-backdrop" ${u.settingsOpen?"":"hidden"}>
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
            placeholder="${u.token?"已连接；留空可继续使用当前 Token":"github_pat_…"}" ${u.token?"":"required"} />
        </label>
        <p class="field-hint">只授权目标仓库，并仅开启 Contents：Read and write。请设置过期时间；不要使用经典全仓库 Token。</p>
        <div class="editor-permission-links">
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建最小权限 Token ↗</a>
          <a href="https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents" target="_blank" rel="noreferrer">权限说明 ↗</a>
        </div>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-editor-action="close-settings">取消</button>
          <button type="submit" class="primary-button">${u.pendingSave?"连接并保存":"保存设置"}</button>
        </div>
      </form>
    </div>`}function ft({pendingSave:t=!1}={}){u.settingsOpen=!0,u.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const a=e.querySelector("#editor-settings-form"),i=u.target||{};if(a){a.elements.owner.value=i.owner||"ClairKu",a.elements.repository.value=i.repository||"",a.elements.branch.value=i.branch||"main",a.elements.path.value=i.path||"";const n=a.querySelector('button[type="submit"]');n&&(n.textContent=t?"连接并保存":"保存设置")}}function ht(){u.settingsOpen=!1,u.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function Ct(t=""){return!!(u.reportId&&(!t||u.reportId===t))}function le(t,{render:e,showToast:a}){Et(),Object.assign(u,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:a}),e(),u.loadPromise=qt(t)}function de(t,e){var s;const a=u.target?`${u.target.owner}/${u.target.repository} · ${u.target.path}${(s=u.target.mirrors)!=null&&s.length?` · 同步 ${u.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",i=u.saving?"保存中…":u.lastCommit?"已保存":"保存",n=u.status==="ready"?`
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
      </div>`:"",r=u.status==="loading"?'<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>会自动识别对应 GitHub 仓库与源文件。</p></div>':u.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(u.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${Jt(u.editorDocument)}"></iframe></div>`;return`
    <main class="reader-shell report-editor-shell">
      <header class="reader-header editor-header">
        <button class="back-button" type="button" data-editor-action="exit"><span aria-hidden="true">←</span>退出编辑</button>
        <div class="reader-title">
          <strong>${e(t.title)}</strong>
          <span class="editor-target-label" title="${e(a)}">${e(a)}</span>
        </div>
        <div class="reader-actions editor-actions">
          <button class="quiet-button" type="button" data-editor-action="settings">保存权限</button>
          <button class="quiet-button" type="button" data-editor-action="download">下载 HTML</button>
          <button class="quiet-button" type="button" data-editor-action="share">分享</button>
          <button class="primary-button" type="button" data-editor-action="save" ${u.status!=="ready"||u.saving?"disabled":""}>${i}</button>
        </div>
      </header>
      ${n}
      ${r}
      ${ce(e)}
    </main>`}function ue(t){if(!Ct(t.id))return;mt||(mt=!0,window.addEventListener("message",i=>{var r;const n=st();if(!(!(n!=null&&n.contentWindow)||i.source!==n.contentWindow)&&((r=i.data)==null?void 0:r.channel)===F){if(i.data.type==="dirty"&&(u.dirty=!0),i.data.type==="serialized"){const s=z.get(i.data.requestId);if(!s)return;z.delete(i.data.requestId),s.resolve(i.data.html)}i.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(s=>{const o=s.dataset.editorCommand;["bold","italic","underline"].includes(o)&&s.classList.toggle("active",!!i.data[o])})}}),window.addEventListener("beforeunload",i=>{!u.reportId||!u.dirty||(i.preventDefault(),i.returnValue="")})),document.querySelectorAll("[data-editor-command]").forEach(i=>{i.addEventListener("mousedown",n=>n.preventDefault()),i.addEventListener("click",()=>X(i.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{X("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(i=>{i.addEventListener("click",async()=>{var r,s,o,l,c,m,p;const n=i.dataset.editorAction;if(n==="exit"){if(u.dirty&&!confirm("还有未保存的修改。确定退出编辑模式吗？"))return;const d=u.render;Et(),d==null||d()}else if(n==="settings")ft();else if(n==="close-settings")ht();else if(n==="save")!u.token||!((r=u.target)!=null&&r.path)?ft({pendingSave:!0}):await gt();else if(n==="download")try{const d=await Tt();xt(await St(d),t.title),(s=u.showToast)==null||s.call(u,"HTML 已下载")}catch(d){(o=u.showToast)==null||o.call(u,(d==null?void 0:d.message)||"下载失败")}else if(n==="download-published")await Dt(t,u.showToast);else if(n==="share")try{await Lt(t.url),(l=u.showToast)==null||l.call(u,"报告链接已复制")}catch{(c=u.showToast)==null||c.call(u,"复制失败，请从地址栏复制")}else if(n==="link"){const d=prompt("输入链接地址（https://…）");if(!d)return;try{const b=new URL(d);if(!["http:","https:","mailto:"].includes(b.protocol))throw new Error;X("createLink",b.href)}catch{(m=u.showToast)==null||m.call(u,"请输入有效的 http、https 或 mailto 链接")}}else n==="retry"&&(u.status="loading",u.error="",(p=u.render)==null||p.call(u),u.loadPromise||(u.loadPromise=qt(t)))})});const a=document.getElementById("editor-settings-form");a==null||a.addEventListener("submit",async i=>{var c,m,p;i.preventDefault();const n=new FormData(a),r=String(n.get("github-token-not-password")||"").trim();r&&(u.token=r);const s=String(n.get("path")||"").trim().replace(/^\/+/,"");u.target={...u.target||{},owner:String(n.get("owner")||"").trim(),repository:String(n.get("repository")||"").trim(),branch:String(n.get("branch")||"main").trim(),path:s,mirrors:s===((c=u.target)==null?void 0:c.path)?((m=u.target)==null?void 0:m.mirrors)||[]:[],source:"manual"};const o=u.pendingSave;ht();const l=document.querySelector(".editor-target-label");if(l){const d=`${u.target.owner}/${u.target.repository} · ${u.target.path}`;l.textContent=d,l.title=d}(p=u.showToast)==null||p.call(u,"保存权限已连接"),o&&await gt()})}async function Dt(t,e){try{const a=await fetch(t.url,{cache:"no-store"});if(!a.ok)throw new Error;xt(await a.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function pe(t,e){try{await Lt(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const ct="clair-service-report-workbench-v1",lt="clair-service-report-workbench-access",it="clair-service-report-workbench-view",B=6,H=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],_=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],M={version:B,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},nt={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},Pt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function dt(t){const e=`${t.title||""} ${t.source||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|工作台|原型/.test(e)?"product-demo":"product-planning"}function ut(t,e=dt(t)){const a=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""}`,i=[],n=r=>{i.includes(r)||i.push(r)};return/ontology\.yingmi-inc\.com|本体/.test(a)&&n("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(a)&&n("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(a))&&n("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(a)||t.groupId==="xiaogu")&&n("AI 小顾"),(/workbench|工作台|skill-audit/.test(a)||t.groupId==="ai-workbench")&&n("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(a)||t.groupId==="ai-platform")&&n("AI 开放平台"),/且慢|qieman/.test(a)&&n("且慢"),/投顾|advisor|财务规划/.test(a)&&n("投顾服务"),/OAP|oap-/.test(a)&&n("OAP"),/MCP|mcp-/.test(a)&&n("MCP"),/Skills|skill-/.test(a)&&n("Skills"),(e==="investment-research"||t.groupId==="research")&&n("投研"),e==="data-analysis"&&n("数据分析"),e==="requirement-review"&&n("需求评审"),e==="reporting"&&n("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&n("知识治理"),i.slice(0,5)}M.reports=M.reports.map(t=>{const e=Pt[t.id]||t.groupId,a=nt[t.id]||dt(t),i={...t,groupId:e,workType:a};return{...i,tags:ut(i,a)}});let h=me(),q="",C="",U=!1,A=["topic","type","tag"].includes(localStorage.getItem(it))?localStorage.getItem(it):"topic",L="",E="",P="",w=null,bt=0;function Ot(t){return JSON.parse(JSON.stringify(t))}function Q(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function me(){try{const t=JSON.parse(localStorage.getItem(ct));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return ge(t)}catch{}return Ot(M)}function ge(t){const e=Ot(M),a=new Set(e.groups.map(g=>g.id)),i=new Set(["inbox","today","product","research"]),n=new Map(t.groups.map(g=>[g.id,g])),r=e.groups.map(g=>{const k=n.get(g.id);return!k||t.version<B?g:{...g,name:k.name||g.name,description:k.description||g.description,position:Number.isFinite(k.position)?k.position:g.position}});t.groups.filter(g=>!a.has(g.id)&&!i.has(g.id)).forEach((g,k)=>{r.push({...g,description:g.description||"自定义工作分组",position:Number.isFinite(g.position)?g.position:M.groups.length+k})});const s=r.filter((g,k,$)=>$.findIndex(W=>W.id===g.id)===k);s.sort((g,k)=>(g.position||0)-(k.position||0));const o={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},l={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},c=t.reports.map(g=>({...g,groupId:Pt[g.id]||o[g.id]||l[g.groupId]||g.groupId||"inbox",workType:g.workType||nt[g.id]||dt(g),tags:Array.isArray(g.tags)&&g.tags.length?g.tags:ut(g,g.workType||nt[g.id])})),m=new Map(c.map(g=>[g.id,g])),p=new Map(c.map(g=>[Q(g.url),g])),d=new Set,b=e.reports.map(g=>{const k=Q(g.url);d.add(k);const $=m.get(g.id)||p.get(k);return $?{...g,title:$.title||g.title,groupId:t.version>=B&&s.some(W=>W.id===$.groupId)?$.groupId:g.groupId,workType:t.version>=B&&$.workType?$.workType:g.workType,tags:t.version>=B&&Array.isArray($.tags)&&$.tags.length?$.tags:g.tags,pinned:!!$.pinned,position:Number.isFinite($.position)?$.position:g.position,archived:!!$.archived,archivedAt:$.archivedAt||""}:g});c.forEach(g=>{const k=Q(g.url);d.has(k)||(d.add(k),b.push(g))});const S={version:B,groups:s,reports:b};return localStorage.setItem(ct,JSON.stringify(S)),S}function x(){h.version=B,h.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(ct,JSON.stringify(h))}function tt(t,e){const a=h.groups.findIndex(r=>r.id===t),i=h.groups.findIndex(r=>r.id===e);if(a<0||i<0||a===i)return!1;const[n]=h.groups.splice(a,1);return h.groups.splice(i,0,n),x(),!0}function fe(t,e,a=""){const i=h.reports.find(o=>o.id===t);if(!i||i.archived||!h.groups.find(o=>o.id===e))return!1;const r=h.reports.filter(o=>!o.archived&&o.groupId===e&&o.id!==t).sort((o,l)=>(o.position||0)-(l.position||0)),s=a?r.findIndex(o=>o.id===a):r.length;return i.groupId=e,r.splice(s<0?r.length:s,0,i),r.forEach((o,l)=>{o.position=l}),x(),!0}function he(t){var e;return((e=H.find(a=>a.id===t))==null?void 0:e.name)||"产品规划"}function be(t,e=""){const a=i=>!e||i.toLowerCase().includes(e);if(A==="type")return H.map(i=>({id:i.id,name:i.name,kind:"type",accent:"blue",reports:t.filter(n=>n.workType===i.id).sort((n,r)=>+!!r.pinned-+!!n.pinned||new Date(r.createdAt)-new Date(n.createdAt))})).filter(i=>!e||i.reports.length||a(i.name));if(A==="tag"){const i=new Set(_);return h.reports.forEach(r=>{(r.tags||[]).forEach(s=>i.add(s))}),[...i].sort((r,s)=>{const o=_.indexOf(r),l=_.indexOf(s);return o>=0||l>=0?(o<0?Number.MAX_SAFE_INTEGER:o)-(l<0?Number.MAX_SAFE_INTEGER:l):r.localeCompare(s,"zh-CN")}).map(r=>({id:r,name:r,kind:"tag",accent:"violet",reports:t.filter(s=>(s.tags||[]).includes(r)).sort((s,o)=>+!!o.pinned-+!!s.pinned||new Date(o.createdAt)-new Date(s.createdAt))})).filter(r=>r.reports.length&&(!e||a(r.name)||r.reports.length))}return h.groups.map(i=>({...i,kind:"topic",reports:t.filter(n=>n.groupId===i.id).sort((n,r)=>(n.position||0)-(r.position||0))})).filter(i=>!e||i.reports.length||a(`${i.name} ${i.description||""}`))}function G(t,e,a,i=""){const n=h.reports.find(r=>r.id===t);return!n||n.archived?!1:e==="topic"?fe(t,a,i):e==="type"?H.some(r=>r.id===a)?(n.workType=a,x(),!0):!1:e==="tag"?(n.tags=Array.isArray(n.tags)?n.tags:[],n.tags.includes(a)||n.tags.push(a),x(),!0):!1}function N(){return A==="type"?"工作类型":A==="tag"?"标签":"主题"}function vt(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function f(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function j(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function Rt(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function et(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function I(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(bt),bt=window.setTimeout(()=>e.remove(),2600)}function Bt(t,e=!1){const a=t.access!=="production",i=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",r=!a&&M.reports.some(s=>s.id===t.id)?`<img src="./previews/${f(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":f(t.title.slice(0,2))}</span>
        <strong>${a?i:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${P===t.id?"is-move-selected":""}" data-report-id="${f(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${f(t.id)}" aria-label="打开${f(t.title)}">
        <span class="report-preview">
          ${r}
        </span>
        <span class="report-copy">
          <span class="report-source">${f(t.source||"手动添加")}</span>
          <strong>${f(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(s=>`<span>${f(s)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${f(i)}</span>`:""}
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
            <button type="button" data-action="edit" data-id="${f(t.id)}">编辑</button>
            <button type="button" data-action="archive" data-id="${f(t.id)}">归档</button>`}
      </div>
    </article>`}function pt(){var a;if(!w)return"";if(w.type==="tags"){const i=h.reports.find(n=>n.id===w.reportId);return i?`
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
            ${_.map(n=>`<button type="button" class="${(i.tags||[]).includes(n)?"selected":""}" data-tag-suggestion="${f(n)}">${f(n)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if(w.type==="group"){const i=w.mode==="edit"?h.groups.find(n=>n.id===w.groupId):null;return`
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
      </div>`}const t=w.mode==="edit"?h.reports.find(i=>i.id===w.reportId):null,e=(t==null?void 0:t.groupId)||w.groupId||((a=h.groups[0])==null?void 0:a.id)||"";return`
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
            ${H.map(i=>`<option value="${f(i.id)}" ${i.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${f(i.name)}</option>`).join("")}
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
    </div>`}function ve(){return`
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
    </main>`}function ye(t){if(Ct(t.id))return de(t,f);const e=t.access!=="production",a=t.access==="org"?"组织账号":"站点账号",i=e?`
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
            <a class="primary-button" href="${f(t.url)}" target="_blank" rel="noreferrer">打开登录页 ↗</a>
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
          <span>${f(j(t.url))}</span>
        </div>
        <div class="reader-actions">
          <a class="${e?"primary-button":"quiet-button"}" href="${f(t.url)}" target="_blank" rel="noreferrer">${e?"登录打开 ↗":"新窗口 ↗"}</a>
          ${e?"":`<button class="primary-button" type="button" data-action="edit-document" data-id="${f(t.id)}">编辑文档</button>`}
          <button class="quiet-button" type="button" data-action="download-report" data-id="${f(t.id)}">下载 HTML</button>
          <button class="quiet-button" type="button" data-action="share-report" data-id="${f(t.id)}">分享</button>
          <button class="quiet-button" type="button" data-action="edit" data-id="${f(t.id)}">编辑信息</button>
        </div>
      </header>
      ${i}
      ${pt()}
    </main>`}function Mt(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      <div class="top-actions">
        ${U?'<button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button>':'<button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span> 新增</button>'}
      </div>
    </header>`}function we(){const t=h.reports.filter(a=>a.archived).filter(a=>{if(!q.trim())return!0;const i=q.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=h.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${Mt()}
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
            <div class="archive-grid">${t.map(a=>Bt(a,!0)).join("")}</div>
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
      ${pt()}
    </main>`}function ke(){if(U)return we();const t=q.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),a=h.reports.filter(c=>!c.archived),i=e.length?a.filter(c=>{const m=`${c.title} ${c.source||""} ${c.access||""} ${he(c.workType)} ${(c.tags||[]).join(" ")}`.toLowerCase();return e.every(p=>m.includes(p))}):a,n=h.reports.filter(c=>c.archived).length,r=a.filter(c=>c.access==="production").length,s=a.filter(c=>c.access!=="production").length,o=be(i,t).filter(c=>c.reports.length||P),l=A==="type"?"工作类型":A==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${Mt()}
      <section class="workspace">
        ${Ft(f)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${a.length}</strong><span>成果</span>
              <i></i>
              <strong>${h.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${r}</strong><span>直达</span>
            </div>
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${f(q)}" placeholder="搜索标题、标签或来源" aria-label="搜索成果" />
              ${q?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${Wt(f)}
        <section class="groups-section">
          ${P?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${N()}的“移到这里”，或直接拖动卡片。</span></div>
              <button type="button" data-action="cancel-move">取消</button>
            </div>`:""}
          <div class="collection-toolbar">
            <div class="classification-actions">
              <div class="view-switcher" role="tablist" aria-label="成果分类方式">
                <button type="button" role="tab" aria-selected="${A==="topic"}" class="${A==="topic"?"active":""}" data-action="set-view" data-id="topic">主题</button>
                <button type="button" role="tab" aria-selected="${A==="type"}" class="${A==="type"?"active":""}" data-action="set-view" data-id="type">类型</button>
                <button type="button" role="tab" aria-selected="${A==="tag"}" class="${A==="tag"?"active":""}" data-action="set-view" data-id="tag">标签</button>
              </div>
              <button class="quiet-button add-topic-button" type="button" data-action="add-group">＋ 主题</button>
            </div>
          </div>
          ${o.length?`
            <div class="library-layout">
              <nav class="topic-nav" aria-label="报告${l}">
                ${o.map((c,m)=>`<a href="#bucket-${m}"><span class="nav-index">${String(m+1).padStart(2,"0")}</span>${f(c.name)}<span>${c.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${n?`<em>${n}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${A}">
              ${o.map((c,m)=>`
                <section id="bucket-${m}" class="group-column topic-section bucket-${f(c.kind)} accent-${f(c.accent||"blue")}"
                  data-bucket-kind="${f(c.kind)}"
                  data-bucket-id="${f(c.id)}"
                  ${c.kind==="topic"?`data-group-id="${f(c.id)}"`:""}>
                  <header class="group-header">
                    ${c.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${f(c.id)}"
                          aria-label="拖动“${f(c.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(m+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${c.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${f(c.name)}</h2></div>
                      <span class="count">${c.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${P?`<button class="move-here-button" type="button" data-action="move-here" data-id="${f(c.id)}" data-bucket-kind="${f(c.kind)}">移到这里</button>`:""}
                      ${c.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${f(c.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${f(c.id)}">编辑主题</button>
                           ${c.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${f(c.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${c.reports.length?c.reports.map(p=>Bt(p)).join(""):c.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${f(c.id)}">
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
            <span>${s} 份报告需要组织或账号登录${n?` · ${n} 份已安全归档`:""}</span>
            <div><span>分类调整仅保存在当前浏览器</span><button type="button" data-action="lock">退出工作台</button></div>
          </div>
        </section>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Private workspace</span></footer>
      ${pt()}
    </main>`}function v(){const t=document.getElementById("app");if(sessionStorage.getItem(lt)!=="ok"){t.innerHTML=ve(),$e();return}const e=C&&h.reports.find(a=>a.id===C);t.innerHTML=e?ye(e):ke(),Ie(),Vt({render:v,escapeHtml:f,showToast:I,showResults:()=>{U=!1}})}function $e(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(lt,"ok"),v()})}async function yt(t){var s,o;const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),n=t.querySelector(".field-hint"),r=e.value.trim();if(!Rt(r))return n.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',n.textContent="正在读取网页标题…";try{const l=`https://api.microlink.io/?url=${encodeURIComponent(r)}`,c=await fetch(l,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!c.ok)throw new Error("read failed");const m=await c.json(),p=((o=(s=m==null?void 0:m.data)==null?void 0:s.title)==null?void 0:o.trim())||j(r);return a.value=p.slice(0,180),n.textContent="已识别网页标题",a.value}catch{const l=j(r);return a.value||(a.value=l),n.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function Ie(){var n;(n=document.getElementById("search-input"))==null||n.addEventListener("input",r=>{q=r.target.value,v();const s=document.getElementById("search-input");s==null||s.focus(),s==null||s.setSelectionRange(q.length,q.length)}),document.querySelectorAll("[data-action]").forEach(r=>{r.addEventListener("click",async s=>{var c,m;const o=s.currentTarget.dataset.action,l=s.currentTarget.dataset.id;if(o==="open")C=l,v();else if(o==="edit-document"){const p=h.reports.find(d=>d.id===l);if(!p||p.access!=="production")return;le(p,{render:v,showToast:I})}else if(o==="download-report"){const p=h.reports.find(d=>d.id===l);p&&await Dt(p,I)}else if(o==="share-report"){const p=h.reports.find(d=>d.id===l);p&&await pe(p,I)}else if(o==="back")C="",w=null,v();else if(o==="lock")sessionStorage.removeItem(lt),v();else if(o==="clear-search")q="",v();else if(o==="set-view"){if(!["topic","type","tag"].includes(l))return;A=l,P="",localStorage.setItem(it,A),v()}else if(o==="cancel-move")P="",v();else if(o==="move-here"){const p=s.currentTarget.dataset.bucketKind||A;P&&G(P,p,l)&&(P="",v(),I(p==="tag"?"已添加目标标签":`报告已移入目标${N()}`))}else if(o==="show-archive")U=!0,q="",C="",v();else if(o==="show-catalog")U=!1,q="",C="",v();else if(o==="add-report")w={type:"report",mode:"create",groupId:((c=h.groups[1])==null?void 0:c.id)||((m=h.groups[0])==null?void 0:m.id)},v();else if(o==="add-to-group")w={type:"report",mode:"create",groupId:l},v();else if(o==="edit")w={type:"report",mode:"edit",reportId:l},v();else if(o==="edit-tags")w={type:"tags",reportId:l},v();else if(o==="close-modal")w=null,v();else if(o==="detect-title")await yt(s.currentTarget.closest("form"));else if(o==="archive"){const p=h.reports.find(d=>d.id===l);if(!p)return;p.archived=!0,p.archivedAt=new Date().toISOString(),x(),v(),I("已归档，可随时恢复")}else if(o==="restore"){const p=h.reports.find(d=>d.id===l);if(!p)return;p.archived=!1,p.archivedAt="",x(),v(),I("报告已恢复到原主题")}else if(o==="delete"){const p=h.reports.find(d=>d.id===l);p!=null&&p.archived&&confirm(`二次确认：永久删除“${p.title}”？

删除后无法从归档区恢复。`)&&(h.reports=h.reports.filter(d=>d.id!==l),C===l&&(C=""),x(),v(),I("报告已永久删除"))}else if(o==="add-group")w={type:"group",mode:"create"},v();else if(o==="rename-group")h.groups.find(d=>d.id===l)&&(w={type:"group",mode:"edit",groupId:l},v());else if(o==="delete-group"){const p=h.groups.find(d=>d.id===l);p&&confirm(`删除“${p.name}”？其中的报告会移到“待整理”。`)&&(h.reports.forEach(d=>{d.groupId===l&&(d.groupId="inbox")}),h.groups=h.groups.filter(d=>d.id!==l),x(),v(),I("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(r=>{let s=null,o=!1;const l=()=>{var c;L="",s=null,o=!1,(c=r.closest(".report-card"))==null||c.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(m=>{m.classList.remove("is-card-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",c=>{var m,p;c.preventDefault(),L=r.dataset.reportDragId,E="",s={x:c.clientX,y:c.clientY},o=!1,(m=r.setPointerCapture)==null||m.call(r,c.pointerId),(p=r.closest(".report-card"))==null||p.classList.add("is-dragging")}),r.addEventListener("pointermove",c=>{if(!L||s&&Math.hypot(c.clientX-s.x,c.clientY-s.y)<7)return;o=!0;const m=document.elementFromPoint(c.clientX,c.clientY),p=m==null?void 0:m.closest(".report-card"),d=m==null?void 0:m.closest(".group-column");document.querySelectorAll(".report-card").forEach(b=>{b.classList.toggle("is-card-drop-target",!!(p&&p!==r.closest(".report-card")&&b===p))}),document.querySelectorAll(".group-column").forEach(b=>{b.classList.toggle("is-drop-ready",!!(d&&b===d))})}),r.addEventListener("pointerup",c=>{if(!L)return;const m=L;if(!o){P=m,l(),v(),I(`请选择目标${N()}`);return}const p=document.elementFromPoint(c.clientX,c.clientY),d=p==null?void 0:p.closest(".report-card"),b=p==null?void 0:p.closest(".group-column"),S=(d==null?void 0:d.dataset.reportId)||"",g=(b==null?void 0:b.dataset.bucketId)||"",k=(b==null?void 0:b.dataset.bucketKind)||A,$=S&&S!==m?G(m,k,g,S):g?G(m,k,g):!1;l(),$&&(v(),I(k==="tag"?"已添加目标标签":k==="type"?"工作类型已更新":S?"报告顺序已更新":"已移入新主题"))}),r.addEventListener("pointercancel",l)}),document.querySelectorAll(".group-drag-handle").forEach(r=>{const s=()=>{var o;E="",(o=r.closest(".group-column"))==null||o.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(l=>{l.classList.remove("is-group-drop-target","is-drop-ready")})};r.addEventListener("pointerdown",o=>{var l,c;o.preventDefault(),E=r.dataset.groupDragId,L="",(l=r.setPointerCapture)==null||l.call(r,o.pointerId),(c=r.closest(".group-column"))==null||c.classList.add("is-group-dragging")}),r.addEventListener("pointermove",o=>{E&&document.querySelectorAll(".group-column").forEach(l=>{var c;l.classList.toggle("is-group-drop-target",l===((c=document.elementFromPoint(o.clientX,o.clientY))==null?void 0:c.closest(".group-column")))})}),r.addEventListener("pointerup",o=>{var m;if(!E)return;const l=E,c=(m=document.elementFromPoint(o.clientX,o.clientY))==null?void 0:m.closest(".group-column");if(c&&tt(l,c.dataset.groupId)){E="",v(),I("分组顺序已更新");return}s()}),r.addEventListener("pointercancel",s),r.addEventListener("keydown",o=>{var p;if(!["ArrowLeft","ArrowRight"].includes(o.key))return;o.preventDefault();const l=h.groups.findIndex(d=>d.id===r.dataset.groupDragId),c=o.key==="ArrowLeft"?l-1:l+1,m=h.groups[c];!m||!tt(r.dataset.groupDragId,m.id)||(v(),I("分组顺序已更新"),(p=document.querySelector(`[data-group-drag-id="${CSS.escape(r.dataset.groupDragId)}"]`))==null||p.focus())})}),document.querySelectorAll(".group-column").forEach(r=>{r.addEventListener("dragover",s=>{s.preventDefault(),r.classList.add(E?"is-group-drop-target":"is-drop-ready")}),r.addEventListener("dragleave",()=>{r.classList.remove("is-drop-ready","is-group-drop-target")}),r.addEventListener("drop",s=>{if(s.preventDefault(),E){if(r.dataset.bucketKind==="topic"&&tt(E,r.dataset.groupId)){E="",v(),I("分组顺序已更新");return}E="",r.classList.remove("is-group-drop-target");return}const o=h.reports.find(c=>c.id===L),l=r.dataset.bucketKind||A;o&&G(L,l,r.dataset.bucketId)&&(L="",v(),I(l==="tag"?"已添加目标标签":l==="type"?"工作类型已更新":"已移入新主题")),L=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(r=>{r.addEventListener("click",()=>{const s=document.querySelector('#tag-form input[name="tags"]');if(!s)return;const o=et(s.value),l=r.dataset.tagSuggestion;s.value=o.includes(l)?o.filter(c=>c!==l).join("、"):[...o,l].slice(0,8).join("、"),r.classList.toggle("selected",!o.includes(l)),s.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",r=>{r.preventDefault();const s=h.reports.find(o=>o.id===w.reportId);s&&(s.tags=et(new FormData(t).get("tags")),x(),w=null,v(),I("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",r=>{var c,m;r.preventDefault();const s=(c=new FormData(e).get("name"))==null?void 0:c.trim(),o=(m=new FormData(e).get("description"))==null?void 0:m.trim();if(!s)return;if(w.mode==="edit"){const p=h.groups.find(d=>d.id===w.groupId);if(!p)return;p.name=s.slice(0,60),p.description=(o==null?void 0:o.slice(0,80))||"自定义工作主题"}else h.groups.push({id:vt("group"),name:s.slice(0,60),description:(o==null?void 0:o.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][h.groups.length%4],position:h.groups.length});x();const l=w.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";w=null,v(),I(l)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async r=>{r.preventDefault();const s=a.elements.url.value.trim();if(!Rt(s))return;const o=a.querySelector('button[type="submit"]');o.disabled=!0,o.innerHTML='<span class="mini-spinner"></span>';let l=a.elements.title.value.trim();l||(l=await yt(a));const c=a.elements.groupId.value,m=a.elements.workType.value,p=et(a.elements.tags.value);if(w.mode==="edit"){const d=h.reports.find(b=>b.id===w.reportId);Object.assign(d,{title:l,url:s,groupId:c,workType:m,tags:p})}else{const d={id:vt("report"),groupId:c,title:l||j(s),url:s,pinned:!1,position:h.reports.filter(b=>b.groupId===c).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:m,tags:p};d.tags.length||(d.tags=ut(d,d.workType)),h.reports.push(d)}x(),w=null,v(),I("报告已保存")});const i=C&&h.reports.find(r=>r.id===C);i&&ue(i)}function Ae(){v()}Ae(document.getElementById("app"));
