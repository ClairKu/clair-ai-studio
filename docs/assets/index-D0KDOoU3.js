(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function a(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=a(r);fetch(r.href,o)}})();const Tt="clair-ai-studio-tasks-v1",rt=[{id:"auto",name:"智能识别",summon:"自动派单",icon:"✦",hint:"让 AI 判断最适合的任务"},{id:"requirement",name:"需求评审",summon:"需求专家",icon:"需",hint:"价值、范围、规则、验收"},{id:"solution",name:"方案评审",summon:"方案专家",icon:"案",hint:"体验、逻辑、可行性、风险"},{id:"decision",name:"决策推演",summon:"决策顾问",icon:"决",hint:"选项、证据、取舍、止损"},{id:"agreement",name:"协议审查",summon:"协议专家",icon:"协",hint:"权责、数据、责任、退出"},{id:"career",name:"履历评估",summon:"履历顾问",icon:"历",hint:"事实、能力、匹配、核验"}];let T=zt(),w={skillId:"auto",goal:"",material:"",files:[]},D="",P="compose";function zt(){try{const t=JSON.parse(localStorage.getItem(Tt));return Array.isArray(t)?t:[]}catch{return[]}}function Z(){localStorage.setItem(Tt,JSON.stringify(T))}function xt(){var t;return((t=crypto.randomUUID)==null?void 0:t.call(crypto))||`${Date.now()}-${Math.random()}`}function dt(t){return rt.find(e=>e.id===t)||rt[0]}function Kt(t){var i;const e=t.toLowerCase();return((i=[["agreement",["协议","合同","条款","保密","签署"]],["career",["简历","履历","候选人","晋升","岗位","面试"]],["decision",["决策","选型","取舍","是否推进","选择"]],["requirement",["需求","prd","用户故事","验收","原型"]],["solution",["方案","流程","架构","设计","上线"]]].find(([,r])=>r.some(o=>e.includes(o))))==null?void 0:i[0])||"solution"}function Lt(t){return new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(t))}function Wt(t,e){const a=t.files.length?t.files.map(r=>`${r.name}（${r.sizeLabel}）`).join("、"):"无附件",i=t.material.trim().length;return`
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${e(t.skillName)}</strong>，目标是：${e(t.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${e(a)}</li>
      <li>粘贴内容：${i} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`}function Vt(t,e){return`${t.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/,"").slice(0,42)||"未命名任务"}｜${e}`}function Yt(t){return t<1024?`${t} B`:t<1024*1024?`${Math.ceil(t/1024)} KB`:`${(t/1024/1024).toFixed(1)} MB`}async function X(t){const e=[...t].slice(0,20);return Promise.all(e.map(async a=>{const i=a.type.startsWith("text/")||/\.(md|txt|csv|json|html|xml)$/i.test(a.name);let r="";if(i&&a.size<=1024*1024)try{r=(await a.text()).slice(0,12e3)}catch{r=""}return{id:xt(),name:a.name,type:a.type||"文件",size:a.size,sizeLabel:Yt(a.size),excerpt:r}}))}function Jt(t){return rt.map(e=>`
    <button class="expert-choice ${w.skillId===e.id?"selected":""}" type="button"
      data-task-action="choose-skill" data-skill-id="${e.id}"
      title="${t(e.hint)}" aria-pressed="${w.skillId===e.id}">
      <span>${t(e.icon)}</span>
      <strong>@${t(e.summon)}</strong>
    </button>`).join("")}function Xt(t){return w.files.length?`<div class="attachment-list">${w.files.map(e=>`
    <span class="attachment-chip">
      <b>${t(e.name)}</b><small>${t(e.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${t(e.name)}" data-task-action="remove-file" data-file-id="${e.id}">×</button>
    </span>`).join("")}</div>`:""}function Qt(t){const e=T.filter(a=>a.status!=="confirmed").sort((a,i)=>new Date(i.updatedAt)-new Date(a.updatedAt));return e.length?`
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${e.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${e.slice(0,3).map(a=>`
          <button type="button" data-task-action="open-task" data-task-id="${a.id}">
            <span>${t(dt(a.skillId).icon)}</span>
            <div><strong>${t(a.title)}</strong><small>${a.status==="review"?"待确认":"处理中"} · ${Lt(a.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`:""}function te(t){if(D){const e=T.find(a=>a.id===D);if(e)return ee(e,t);D=""}return`
    <section class="inline-task-launcher prompt-launcher" aria-label="发起任务">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3" placeholder="描述你想完成的事，或把文档、图片直接拖进来……" aria-label="任务描述">${t(w.goal)}</textarea>
        </div>
        ${Xt(t)}
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
            <div class="expert-strip">${Jt(t)}</div>
          </div>
          <button class="prompt-submit" type="submit" aria-label="开始任务">
            <span>开始</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
      ${Qt(t)}
    </section>`}function ee(t,e){var i;const a=t.status==="confirmed";return`
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
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${a?"最终成果":"工作草稿"}</h2></div><small>最后更新 ${Lt(t.updatedAt)}</small></div>
          ${P==="edit"&&!a?`<textarea id="task-result-input" rows="20">${e(t.resultText||"")}</textarea>`:`<article class="task-result-content">${t.resultHtml||`<p>${e(t.resultText||"暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${a?'<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>':P==="edit"?`<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${t.id}">保存人工修改</button>`:`<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${t.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`}function ae(t){const e=T.filter(a=>a.status==="confirmed").sort((a,i)=>new Date(i.confirmedAt)-new Date(a.confirmedAt));return e.length?`
    <section class="generated-results">
      <div class="section-heading">
        <div><h2>任务成果</h2></div>
        <span>${e.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${e.map(a=>`
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${a.id}">
          <span>${t(dt(a.skillId).icon)}</span>
          <div><small>${t(a.skillName)}</small><strong>${t(a.title)}</strong></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`:""}function ie({render:t,escapeHtml:e,showToast:a,showResults:i}){document.querySelectorAll("[data-task-action]").forEach(d=>{d.addEventListener("click",async l=>{var p;const m=l.currentTarget.dataset.taskAction;if(m==="expand-launcher")R(),t(),requestAnimationFrame(()=>{var u;return(u=document.getElementById("task-goal"))==null?void 0:u.focus()});else if(m==="collapse-launcher")R(),t();else if(m==="choose-skill")w.skillId=l.currentTarget.dataset.skillId,R(),t();else if(m==="remove-file")R(),w.files=w.files.filter(u=>u.id!==l.currentTarget.dataset.fileId),t();else if(m==="open-task")D=l.currentTarget.dataset.taskId,P="compose",t();else if(m==="close-task"){const u=T.find(b=>b.id===D);D="",P="compose",(u==null?void 0:u.status)==="confirmed"&&(i==null||i()),t()}else if(m==="edit-result")P="edit",t();else if(m==="cancel-edit")P="compose",t();else if(m==="save-revision"){const u=T.find(k=>k.id===l.currentTarget.dataset.taskId),b=(p=document.getElementById("task-result-input"))==null?void 0:p.value.trim();if(!u||!b)return;u.revisions||(u.revisions=[]),u.revisions.push({at:new Date().toISOString(),before:u.resultText||"",after:b}),u.resultText=b,u.resultHtml=`<p>${e(b).replaceAll(`
`,"</p><p>")}</p>`,u.updatedAt=new Date().toISOString(),Z(),P="compose",t(),a("已保存人工修改，并记录为进化样本")}else if(m==="supplement-task"){const u=T.find(b=>b.id===D);if(!u)return;w={skillId:u.requestedSkillId,goal:u.goal,material:u.material,files:u.files},T=T.filter(b=>b.id!==u.id),Z(),D="",P="compose",t()}else if(m==="confirm-task"){const u=T.find(b=>b.id===l.currentTarget.dataset.taskId);if(!u)return;u.status="confirmed",u.confirmedAt=new Date().toISOString(),u.updatedAt=u.confirmedAt,Z(),D="",P="compose",i==null||i(),t(),a("已确认并放入成果区")}})});const r=document.getElementById("task-composer");r==null||r.addEventListener("submit",d=>{var b;if(d.preventDefault(),R(),!w.goal.trim())if(w.files.length)w.goal="分析已提供的材料";else{a("写下任务，或先加入一份材料"),(b=document.getElementById("task-goal"))==null||b.focus();return}const l=w.skillId==="auto"?Kt(`${w.goal}
${w.material}
${w.files.map(k=>k.name).join(" ")}`):w.skillId,m=dt(l),p=new Date().toISOString(),u={id:xt(),title:Vt(w.goal,m.name),requestedSkillId:w.skillId,skillId:l,skillName:m.name,skillVersion:"1.0.0",goal:w.goal.trim(),material:w.material.trim()||w.goal.trim(),files:w.files,status:"review",createdAt:p,updatedAt:p,revisions:[]};u.resultHtml=Wt(u,e),u.resultText=`材料已收齐并匹配 ${u.skillName}。目标：${u.goal}

当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`,T.push(u),Z(),D=u.id,w={skillId:"auto",goal:"",material:"",files:[]},t(),a(`已创建任务，并匹配“${m.name}”`)});const o=document.getElementById("task-files");o==null||o.addEventListener("change",async d=>{R(),w.files.push(...await X(d.target.files)),t(),a(`已加入 ${d.target.files.length} 个文件`)});const c=document.getElementById("material-drop")||document.querySelector(".prompt-composer");c==null||c.addEventListener("dragover",d=>{d.preventDefault(),c.classList.add("drag-over")}),c==null||c.addEventListener("dragleave",()=>c.classList.remove("drag-over")),c==null||c.addEventListener("drop",async d=>{d.preventDefault(),c.classList.remove("drag-over"),R();const l=d.dataTransfer.files;w.files.push(...await X(l)),t(),a(`已加入 ${l.length} 个文件`)});const s=document.getElementById("task-goal");s==null||s.addEventListener("input",()=>{w.goal=s.value}),s==null||s.addEventListener("paste",async d=>{var b;const l=[...((b=d.clipboardData)==null?void 0:b.items)||[]].filter(k=>k.kind==="file"&&k.type.startsWith("image/")).map(k=>k.getAsFile()).filter(Boolean);if(!l.length)return;d.preventDefault();const m=d.clipboardData.getData("text/plain"),p=s.selectionStart??s.value.length,u=s.selectionEnd??p;w.goal=`${s.value.slice(0,p)}${m}${s.value.slice(u)}`,w.files.push(...await X(l)),t(),a(`已从剪贴板加入 ${l.length} 张图片`)})}function R(){const t=document.getElementById("task-material"),e=document.getElementById("task-goal"),a=document.getElementById("task-quick-goal");t&&(w.material=t.value),e&&(w.goal=e.value),a&&(w.goal=a.value)}const Y="clair-report-editor-v1",ne="https://api.github.com",Ct="2026",re="clair-report-editor-draft-v1:",n={reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,token:"",settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:null,showToast:null},K=new Map;let kt=!1;function ut(t){return[...new Set(t.filter(Boolean))]}function ot(t=n.target){return t?{...t.path&&t.sha?{[t.path]:t.sha}:{},...Object.fromEntries((t.mirrors||[]).map(e=>[e.path,e.sha])),...t.baseFiles||{}}:{}}function pt(t){return`${re}${t}`}function oe(t){try{const e=sessionStorage.getItem(pt(t));if(!e)return null;const a=JSON.parse(e);return!(a!=null&&a.html)||typeof a.html!="string"?null:a}catch{return null}}function Dt(t=n.reportId){try{sessionStorage.removeItem(pt(t))}catch{}}function Ot(){return n.dirty&&n.hasDraft?{tone:"changed",label:"有新修订 · 上次暂存待推送"}:n.dirty?{tone:"changed",label:"已修订 · 未暂存"}:n.hasDraft?{tone:"staged",label:"已暂存 · 待推送生产"}:n.lastCommit?{tone:"published",label:"生产档案已更新"}:{tone:"clean",label:"未修改"}}function W(){const t=Ot(),e=document.querySelector(".editor-revision-status");e&&(e.className=`editor-revision-status is-${t.tone}`,e.textContent=t.label);const a=document.querySelector('[data-editor-action="stash"]');a&&(a.disabled=n.status!=="ready"||n.saving||!n.dirty,a.textContent=!n.dirty&&n.hasDraft?"已暂存":"暂存");const i=document.querySelector('[data-editor-action="publish"]');i&&(i.disabled=n.status!=="ready"||n.saving||!n.dirty&&!n.hasDraft,i.textContent=n.saving?"推送中…":"推送生产");const r=document.querySelector('[data-editor-action="preview"]');r&&(r.disabled=n.status!=="ready"||n.saving||!n.hasDraft)}function se(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function ce(t){const e=atob(String(t||"").replace(/\s/g,"")),a=Uint8Array.from(e,i=>i.charCodeAt(0));return new TextDecoder().decode(a)}function le(t){const e=new TextEncoder().encode(t);let a="";const i=32768;for(let r=0;r<e.length;r+=i)a+=String.fromCharCode(...e.subarray(r,r+i));return btoa(a)}function Q(t){let e="";for(let i=0;i<t.length;i+=32768)e+=String.fromCharCode(...t.subarray(i,i+32768));return btoa(e)}function tt(t){return Uint8Array.from(atob(t),e=>e.charCodeAt(0))}async function Pt(t,e){const a=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:21e4,hash:"SHA-256"},a,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function $t(t){const e=t.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"\})\s*;/);if(!e)return{html:t,protection:null};try{const a=JSON.parse(e[1]),i=tt(a.salt),r=tt(a.iv),o=await Pt(Ct,i),c=await crypto.subtle.decrypt({name:"AES-GCM",iv:r},o,tt(a.data)),s=new TextDecoder().decode(c);if(!/<html[\s>]/i.test(s))throw new Error("解密结果不是 HTML");return{html:s,protection:{type:"aes-gcm-wrapper",wrapperHtml:t,payloadSource:e[1]}}}catch{throw new Error("检测到加密报告，但无法用工作台口令解锁")}}async function mt(t){var c;if(((c=n.protection)==null?void 0:c.type)!=="aes-gcm-wrapper")return t;const e=crypto.getRandomValues(new Uint8Array(16)),a=crypto.getRandomValues(new Uint8Array(12)),i=await Pt(Ct,e),r=await crypto.subtle.encrypt({name:"AES-GCM",iv:a},i,new TextEncoder().encode(t)),o=JSON.stringify({salt:Q(e),iv:Q(a),data:Q(new Uint8Array(r))});return n.protection.wrapperHtml.replace(n.protection.payloadSource,o)}function de(t){try{const e=new URL(t);if(e.hostname.toLowerCase()!=="clairku.github.io")return null;const a=e.pathname.split("/").filter(Boolean).map(decodeURIComponent),i=a.shift()||"ClairKu.github.io";let r=a.join("/");(!r||e.pathname.endsWith("/"))&&(r=`${r?`${r}/`:""}index.html`);const o=ut([`docs/${r}`,r,`public/${r}`]);return{owner:"ClairKu",repository:i,branch:"main",path:o[0],candidates:o,source:"auto"}}catch{return null}}async function V(t,{token:e="",method:a="GET",body:i}={}){var c;const r={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};e&&(r.Authorization=`Bearer ${e}`),i!==void 0&&(r["Content-Type"]="application/json");const o=await fetch(`${ne}${t}`,{method:a,headers:r,body:i===void 0?void 0:JSON.stringify(i)});if(!o.ok){let s="";try{s=((c=await o.json())==null?void 0:c.message)||""}catch{s=await o.text()}const d=new Error(s||`GitHub API ${o.status}`);throw d.status=o.status,d}return o.status===204?null:o.json()}async function ue(t){var c;const e=await V(`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}`);t.branch=e.default_branch||t.branch||"main";const a=ut((c=t.candidates)!=null&&c.length?t.candidates:[t.path]);let i=null,r=null;const o=[];for(const s of a)try{const d=s.split("/").map(encodeURIComponent).join("/"),l=`/repos/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.repository)}/contents/${d}?ref=${encodeURIComponent(t.branch)}`,m=await V(l);let p="";if(m.encoding==="base64"&&m.content)p=ce(m.content);else if(m.download_url){const u=await fetch(m.download_url,{cache:"no-store"});if(!u.ok)throw new Error("无法读取 GitHub 原始文件");p=await u.text()}if(!p)throw new Error("GitHub 文件内容为空");r?p===r.html&&o.push({path:s,sha:m.sha}):r={html:p,target:{...t,path:s,sha:m.sha,candidates:a}}}catch(d){if(i=d,d.status&&![403,404].includes(d.status))break}if(r)return r.target.mirrors=o,r;throw i||new Error("没有找到对应的 GitHub HTML 文件")}function pe(t){t.querySelectorAll("script").forEach(e=>{e.dataset.clairOriginalType=e.getAttribute("type")??"__empty__",e.setAttribute("type","application/x-clair-disabled")}),t.querySelectorAll("*").forEach(e=>{[...e.attributes].forEach(i=>{/^on/i.test(i.name)&&(e.setAttribute(`data-clair-event-${i.name.toLowerCase()}`,i.value),e.removeAttribute(i.name))});const a=e.getAttribute("href");a&&/^\s*javascript:/i.test(a)&&(e.dataset.clairJavascriptHref=a,e.removeAttribute("href"))})}function me(){return`
(() => {
  const channel = ${JSON.stringify(Y)};
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
`}function ge(t,e){const i=new DOMParser().parseFromString(t,"text/html");i.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach(s=>{s.dataset.clairEditorHttpEquiv=s.getAttribute("http-equiv")||"Content-Security-Policy",s.setAttribute("http-equiv","x-clair-csp-disabled")}),pe(i);const r=i.createElement("base");r.href=e,r.dataset.clairEditorBase="true",i.head.prepend(r);const o=i.createElement("style");o.id="clair-editor-style",o.textContent=`
    html { scroll-behavior: smooth; }
    body[data-clair-editable="true"] { min-height: 100vh; cursor: text; }
    body[data-clair-editable="true"]:focus { outline: none; }
    body[data-clair-editable="true"] *:hover {
      outline: 1px dashed rgba(27, 136, 238, .35);
      outline-offset: 2px;
    }
    body[data-clair-editable="true"] a { cursor: text !important; }
    ::selection { background: rgba(27, 136, 238, .22); }
  `,i.head.append(o);const c=i.createElement("script");return c.id="clair-editor-bridge",c.textContent=me(),i.body.append(c),`<!DOCTYPE html>
${i.documentElement.outerHTML}`}async function Rt(t){var e;try{const a=de(t.url);let i=null;if(a)try{i=await ue(a)}catch{}if(!i){const s=await fetch(t.url,{cache:"no-store"});if(!s.ok)throw new Error(`报告读取失败（HTTP ${s.status}）`);i={html:await s.text(),target:a}}const r=await $t(i.html);n.protection=r.protection,n.target=i.target||a;let o=r.html;const c=oe(t.id);if(c!=null&&c.html)try{const s=await $t(c.html);o=s.html,n.hasDraft=!0,n.draftHtml=s.html,n.draftAt=c.savedAt||"",c.baseFiles&&n.target&&(n.target.baseFiles=c.baseFiles)}catch{Dt(t.id)}n.html=o,n.editorDocument=ge(o,t.url),n.status="ready",n.error=""}catch(a){n.status="error",n.error=(a==null?void 0:a.message)||"无法读取这份 HTML"}finally{n.loadPromise=null,(e=n.render)==null||e.call(n)}}function Mt(){const t=n.render,e=n.showToast;Object.assign(n,{reportId:"",reportTitle:"",reportUrl:"",status:"idle",error:"",html:"",editorDocument:"",dirty:!1,hasDraft:!1,draftHtml:"",draftAt:"",target:null,settingsOpen:!1,publishConfirmOpen:!1,pendingSave:!1,saving:!1,lastCommit:"",protection:null,loadPromise:null,render:t,showToast:e})}function gt(){return document.querySelector(".report-editor-frame")}function et(t,e=null){var i;const a=gt();(i=a==null?void 0:a.contentWindow)==null||i.postMessage({channel:Y,type:"command",command:t,value:e},"*")}function ft(){var a;const t=gt();if(!(t!=null&&t.contentWindow))return Promise.reject(new Error("编辑画布尚未就绪"));const e=((a=crypto.randomUUID)==null?void 0:a.call(crypto))||`${Date.now()}-${Math.random()}`;return new Promise((i,r)=>{const o=window.setTimeout(()=>{K.delete(e),r(new Error("读取编辑内容超时"))},1e4);K.set(e,{resolve:c=>{clearTimeout(o),i(c)}}),t.contentWindow.postMessage({channel:Y,type:"serialize",requestId:e},"*")})}function fe(t){return`${String(t||"report").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"report"}.html`}function Bt(t,e){const a=new Blob([t],{type:"text/html;charset=utf-8"}),i=URL.createObjectURL(a),r=document.createElement("a");r.href=i,r.download=fe(e),document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),1e3)}async function Ut(t){await navigator.clipboard.writeText(t)}function he(t,e){var r;const a=new DOMParser().parseFromString(t,"text/html");(r=a.querySelector("base[data-clair-preview-base]"))==null||r.remove();const i=a.createElement("base");return i.href=e,i.dataset.clairPreviewBase="true",a.head.prepend(i),`<!DOCTYPE html>
${a.documentElement.outerHTML}`}function be(t){if(!n.hasDraft||!n.draftHtml)throw new Error("请先暂存当前修订，再另开预览");const e=new Blob([he(n.draftHtml,t.url)],{type:"text/html;charset=utf-8"}),a=URL.createObjectURL(e),i=window.open(a,"_blank");if(!i)throw URL.revokeObjectURL(a),new Error("浏览器拦截了新窗口，请允许弹窗后重试");i.opener=null,window.setTimeout(()=>URL.revokeObjectURL(a),6e4)}async function st(t,{silent:e=!1}={}){var o;const a=await ft(),i=await mt(a),r=new Date().toISOString();try{sessionStorage.setItem(pt(t.id),JSON.stringify({reportId:t.id,reportUrl:t.url,savedAt:r,baseFiles:ot(),html:i}))}catch{throw new Error("浏览器暂存空间不足，请先下载 HTML 备份")}return n.html=a,n.draftHtml=a,n.draftAt=r,n.hasDraft=!0,n.dirty=!1,n.lastCommit="",W(),e||(o=n.showToast)==null||o.call(n,"已暂存在当前浏览器会话，尚未更新 GitHub"),a}async function ve(t){var s,d;const e=n.target;if(!(e!=null&&e.owner)||!e.repository||!e.path||!e.branch)throw new Error("请先填写 GitHub 仓库、分支和 HTML 路径");if(!n.token)throw new Error("请先提供 GitHub Fine-grained Token");const a=await mt(t),i=(e.mirrors||[]).map(l=>l.path),r=ut([...i.filter(l=>l.startsWith("public/")),...i.filter(l=>!l.startsWith("public/")&&l!==e.path),e.path]);let o="";const c=[];for(const l of r)try{const m=l.split("/").map(encodeURIComponent).join("/"),p=`/repos/${encodeURIComponent(e.owner)}/${encodeURIComponent(e.repository)}/contents/${m}`,u=await V(`${p}?ref=${encodeURIComponent(e.branch)}`,{token:n.token}),b=ot(e)[l];if(b&&u.sha!==b)throw new Error(`生产文件 ${l} 已在本次编辑后更新，请重新打开报告合并修改`);const k=await V(p,{token:n.token,method:"PUT",body:{message:`Update ${n.reportTitle} from Clair's Studio`,content:le(a),sha:u.sha,branch:e.branch}});o=((s=k==null?void 0:k.commit)==null?void 0:s.sha)||o,e.baseFiles={...ot(e),[l]:((d=k==null?void 0:k.content)==null?void 0:d.sha)||u.sha},c.push(l)}catch(m){throw c.length?new Error(`已更新 ${c.join("、")}，但 ${l} 同步失败：${m.message}`):m}return{commit:o,files:c.length}}async function It(t){var e,a;if(!n.saving){n.saving=!0,W();try{const i=n.dirty?await st(t,{silent:!0}):n.draftHtml||await ft(),r=await ve(i);n.html=i,n.dirty=!1,n.hasDraft=!1,n.draftHtml="",n.draftAt="",n.lastCommit=r.commit,Dt(t.id),(e=n.showToast)==null||e.call(n,r.files>1?`已同步 ${r.files} 个 GitHub 文件，Pages 正在更新`:"已提交 GitHub，Pages 正在更新")}catch(i){(a=n.showToast)==null||a.call(n,(i==null?void 0:i.message)||"保存失败，请下载 HTML 备份")}finally{n.saving=!1,W()}}}function ye(t){const e=n.target||{owner:"ClairKu",repository:"",branch:"main",path:""};return`
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
          <button type="button" class="quiet-button" data-editor-action="close-settings">取消</button>
          <button type="submit" class="primary-button">${n.pendingSave?"连接并保存":"保存设置"}</button>
        </div>
      </form>
    </div>`}function we(t){const e=n.target?`${n.target.owner}/${n.target.repository} · ${n.target.path}`:"尚未识别 GitHub 文件路径";return`
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
          <button type="button" class="quiet-button" data-editor-action="close-publish">继续编辑</button>
          <button type="button" class="primary-button" data-editor-action="confirm-publish">确认推送生产</button>
        </div>
      </section>
    </div>`}function At({pendingSave:t=!1}={}){n.settingsOpen=!0,n.pendingSave=t;const e=document.querySelector(".editor-settings-backdrop");if(!e)return;e.hidden=!1;const a=e.querySelector("#editor-settings-form"),i=n.target||{};if(a){a.elements.owner.value=i.owner||"ClairKu",a.elements.repository.value=i.repository||"",a.elements.branch.value=i.branch||"main",a.elements.path.value=i.path||"";const r=a.querySelector('button[type="submit"]');r&&(r.textContent=t?"连接并保存":"保存设置")}}function H(){n.settingsOpen=!1,n.pendingSave=!1;const t=document.querySelector(".editor-settings-backdrop");t&&(t.hidden=!0)}function ke(){n.publishConfirmOpen=!0;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!1)}function _(){n.publishConfirmOpen=!1;const t=document.querySelector(".editor-publish-backdrop");t&&(t.hidden=!0)}function Nt(t=""){return!!(n.reportId&&(!t||n.reportId===t))}function $e(t,{render:e,showToast:a}){Mt(),Object.assign(n,{reportId:t.id,reportTitle:t.title,reportUrl:t.url,status:"loading",render:e,showToast:a}),e(),n.loadPromise=Rt(t)}function Ie(t,e){var c;const a=n.target?`${n.target.owner}/${n.target.repository} · ${n.target.path}${(c=n.target.mirrors)!=null&&c.length?` · 同步 ${n.target.mirrors.length+1} 处`:""}`:"尚未识别 GitHub 源文件",i=Ot(),r=n.status==="ready"?`
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
      </div>`:"",o=n.status==="loading"?'<div class="editor-state"><span class="editor-loader"></span><strong>正在载入可编辑 HTML…</strong><p>会自动识别对应 GitHub 仓库与源文件。</p></div>':n.status==="error"?`<div class="editor-state editor-error"><strong>这份报告暂时无法进入编辑模式</strong><p>${e(n.error)}</p><div><button class="quiet-button" type="button" data-editor-action="retry">重试</button><button class="primary-button" type="button" data-editor-action="download-published">下载原 HTML</button></div></div>`:`<div class="report-editor-frame-wrap"><iframe class="report-editor-frame" title="${e(t.title)}编辑画布"
          sandbox="allow-scripts allow-modals" srcdoc="${se(n.editorDocument)}"></iframe></div>`;return`
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
            ${n.status!=="ready"||n.saving||!n.dirty?"disabled":""}>${!n.dirty&&n.hasDraft?"已暂存":"暂存"}</button>
          <button class="quiet-button" type="button" data-editor-action="preview"
            title="在新窗口打开已暂存修订" ${n.status!=="ready"||!n.hasDraft?"disabled":""}>另开启</button>
          <button class="quiet-button" type="button" data-editor-action="download">下载 HTML</button>
          <button class="quiet-button" type="button" data-editor-action="share">分享</button>
          <button class="primary-button" type="button" data-editor-action="publish"
            ${n.status!=="ready"||n.saving||!n.dirty&&!n.hasDraft?"disabled":""}>${n.saving?"推送中…":"推送生产"}</button>
        </div>
      </header>
      ${r}
      ${o}
      ${ye(e)}
      ${we(e)}
    </main>`}function Ae(t){if(!Nt(t.id))return;kt||(kt=!0,window.addEventListener("message",i=>{var o;const r=gt();if(!(!(r!=null&&r.contentWindow)||i.source!==r.contentWindow)&&((o=i.data)==null?void 0:o.channel)===Y){if(i.data.type==="dirty"&&(n.dirty=!0,n.lastCommit="",W()),i.data.type==="serialized"){const c=K.get(i.data.requestId);if(!c)return;K.delete(i.data.requestId),c.resolve(i.data.html)}i.data.type==="selection"&&document.querySelectorAll("[data-editor-command]").forEach(c=>{const s=c.dataset.editorCommand;["bold","italic","underline"].includes(s)&&c.classList.toggle("active",!!i.data[s])})}}),window.addEventListener("beforeunload",i=>{!n.reportId||!n.dirty||(i.preventDefault(),i.returnValue="")}),window.addEventListener("keydown",i=>{i.key!=="Escape"||!n.reportId||(n.publishConfirmOpen?_():n.settingsOpen&&H())})),document.querySelectorAll("[data-editor-command]").forEach(i=>{i.addEventListener("mousedown",r=>r.preventDefault()),i.addEventListener("click",()=>et(i.dataset.editorCommand))});const e=document.querySelector("[data-editor-format]");e==null||e.addEventListener("change",()=>{et("formatBlock",e.value),e.value="p"}),document.querySelectorAll("[data-editor-action]").forEach(i=>{i.addEventListener("click",async()=>{var o,c,s,d,l,m,p,u,b,k,g,I;const r=i.dataset.editorAction;if(r==="exit"){if(n.dirty&&!confirm("还有未暂存的修改。确定退出编辑模式吗？"))return;const v=n.render;Mt(),v==null||v()}else if(r==="settings")At();else if(r==="close-settings")H();else if(r==="stash")try{await st(t)}catch(v){(o=n.showToast)==null||o.call(n,(v==null?void 0:v.message)||"暂存失败，请下载 HTML 备份")}else if(r==="preview")try{be(t),(c=n.showToast)==null||c.call(n,"已在新窗口打开暂存修订")}catch(v){(s=n.showToast)==null||s.call(n,(v==null?void 0:v.message)||"无法打开预览")}else if(r==="publish")try{if(n.dirty&&await st(t,{silent:!0}),!n.hasDraft){(d=n.showToast)==null||d.call(n,"当前没有待推送的修订");return}ke()}catch(v){(l=n.showToast)==null||l.call(n,(v==null?void 0:v.message)||"暂存失败，请下载 HTML 备份")}else if(r==="close-publish")_();else if(r==="confirm-publish")_(),!n.token||!((m=n.target)!=null&&m.path)?At({pendingSave:!0}):await It(t);else if(r==="download")try{const v=await ft();Bt(await mt(v),t.title),(p=n.showToast)==null||p.call(n,"HTML 已下载")}catch(v){(u=n.showToast)==null||u.call(n,(v==null?void 0:v.message)||"下载失败")}else if(r==="download-published")await jt(t,n.showToast);else if(r==="share")try{await Ut(t.url),(b=n.showToast)==null||b.call(n,"报告链接已复制")}catch{(k=n.showToast)==null||k.call(n,"复制失败，请从地址栏复制")}else if(r==="link"){const v=prompt("输入链接地址（https://…）");if(!v)return;try{const B=new URL(v);if(!["http:","https:","mailto:"].includes(B.protocol))throw new Error;et("createLink",B.href)}catch{(g=n.showToast)==null||g.call(n,"请输入有效的 http、https 或 mailto 链接")}}else r==="retry"&&(n.status="loading",n.error="",(I=n.render)==null||I.call(n),n.loadPromise||(n.loadPromise=Rt(t)))})}),document.querySelectorAll(".editor-settings-backdrop, .editor-publish-backdrop").forEach(i=>{i.addEventListener("click",r=>{r.target===i&&(i.classList.contains("editor-settings-backdrop")?H():_())})});const a=document.getElementById("editor-settings-form");a==null||a.addEventListener("submit",async i=>{var l,m,p;i.preventDefault();const r=new FormData(a),o=String(r.get("github-token-not-password")||"").trim();o&&(n.token=o);const c=String(r.get("path")||"").trim().replace(/^\/+/,"");n.target={...n.target||{},owner:String(r.get("owner")||"").trim(),repository:String(r.get("repository")||"").trim(),branch:String(r.get("branch")||"main").trim(),path:c,mirrors:c===((l=n.target)==null?void 0:l.path)?((m=n.target)==null?void 0:m.mirrors)||[]:[],source:"manual"};const s=n.pendingSave;H();const d=document.querySelector(".editor-target-label");if(d){const u=`${n.target.owner}/${n.target.repository} · ${n.target.path}`;d.textContent=u,d.title=u}(p=n.showToast)==null||p.call(n,"保存权限已连接"),s&&await It(t)})}async function jt(t,e){try{const a=await fetch(t.url,{cache:"no-store"});if(!a.ok)throw new Error;Bt(await a.text(),t.title),e==null||e("HTML 已下载")}catch{window.open(t.url,"_blank","noopener,noreferrer"),e==null||e("浏览器限制了直接下载，已打开原页面")}}async function Se(t,e){try{await Ut(t.url),e==null||e("报告链接已复制")}catch{e==null||e("复制失败，请从地址栏复制")}}const ht="clair-service-report-workbench-v1",bt="clair-service-report-workbench-access",ct="clair-service-report-workbench-view",M=6,J=[{id:"requirement-review",name:"需求评审"},{id:"reporting",name:"汇报材料"},{id:"competitive-research",name:"竞品调研"},{id:"product-planning",name:"产品规划"},{id:"data-analysis",name:"数据分析"},{id:"investment-research",name:"投研分析"},{id:"governance-review",name:"治理审查"},{id:"product-demo",name:"原型 Demo"}],z=["本体","飞书","调研","AI 小顾","AI 工作台","AI 开放平台","且慢","OAP","MCP","Skills","投顾服务","投研","数据分析","需求评审","经营汇报","知识治理"],U={version:M,groups:[{id:"inbox",name:"待整理",description:"临时入口，等待归档",accent:"slate",position:0},{id:"xiaogu",name:"AI 小顾与投顾服务",description:"AI 小顾、顾问服务与客户体验",accent:"green",position:1},{id:"ai-workbench",name:"AI 工作台与生产力",description:"个人工作台、评审工具与 AI 生产力",accent:"blue",position:2},{id:"ai-platform",name:"AI 开放平台",description:"OAP、MCP、Skills、Agents 与治理",accent:"violet",position:3},{id:"product-planning",name:"且慢产品与体验",description:"产品规划、体验分析与交互方案",accent:"blue",position:4},{id:"research",name:"投研与策略研究",description:"基金、策略与资产配置研究",accent:"amber",position:5},{id:"reporting",name:"经营分析与汇报",description:"业务分析、周报与管理汇报",accent:"blue",position:6},{id:"knowledge",name:"知识治理与组织协同",description:"本体、飞书、SOUL 与知识资产",accent:"slate",position:7}],reports:[{id:"seed-mcp-benchmark",groupId:"ai-platform",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z",source:"近月新增",access:"production"},{id:"seed-fund-report",groupId:"research",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z",source:"近月新增",access:"production"},{id:"storage-big-three-fund-screening",groupId:"research",title:"存储三巨头基金筛选｜境内 QDII 与港股通",url:"https://clairku.github.io/skills/reports/storage-big-three-fund-screening-2026-07-29/",pinned:!0,position:0,createdAt:"2026-07-29T04:49:24.000Z",source:"盈米 Skills / MCP",access:"production"},{id:"seed-agreement",groupId:"ai-platform",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z",source:"近月新增",access:"production"},{id:"seed-xiaogu",groupId:"xiaogu",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z",source:"近月新增",access:"production"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z",source:"近月新增",access:"production"},{id:"seed-ecosystem",groupId:"ai-platform",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z",source:"近月新增",access:"production"},{id:"qieman-library-index",groupId:"knowledge",title:"且慢产品研究页面库｜原始总入口",url:"https://clairku.github.io/qieman-product-research-library/",pinned:!0,position:0,createdAt:"2026-07-26T09:23:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-inventory",groupId:"product-planning",title:"且慢投顾模块现况盘点报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/01-投顾模块现况盘点报告.html",pinned:!1,position:0,createdAt:"2026-07-24T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-direction-research",groupId:"product-planning",title:"且慢 APP 投顾模块｜现况盘点与改版方向",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",pinned:!1,position:1,createdAt:"2026-07-23T09:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-v09",groupId:"product-planning",title:"且慢投顾页改版｜方向与方案设计 V0.9",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/02-改版方向与方案设计.html",pinned:!0,position:2,createdAt:"2026-07-24T09:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-network-research",groupId:"product-planning",title:"且慢产品现况网络调研报告",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",pinned:!1,position:3,createdAt:"2026-07-24T09:20:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-final",groupId:"product-planning",title:"且慢投顾页改版｜推荐方案定稿与备选",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-推荐方案定稿与备选.html",pinned:!1,position:4,createdAt:"2026-07-24T09:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-demo",groupId:"product-planning",title:"且慢投顾页改版交互 Demo｜方案 B",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/03-投顾页交互DEMO.html",pinned:!1,position:5,createdAt:"2026-07-24T09:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-advisor-plan",groupId:"product-planning",title:"且慢投顾页改版｜产品规划与计划书",url:"https://clairku.github.io/qieman-product-research-library/pages/advisor-revamp/04-产品规划与计划书.html",pinned:!1,position:6,createdAt:"2026-07-24T09:50:00.000Z",source:"研究库",access:"production"},{id:"qieman-home-entry-analysis",groupId:"xiaogu",title:"且慢 App 首页金刚位分析报告｜修正版",url:"https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",pinned:!1,position:2,createdAt:"2026-07-23T10:00:00.000Z",source:"研究库",access:"org"},{id:"qieman-advisor-click-analysis",groupId:"product-planning",title:"且慢投顾页点击与转化分析",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",pinned:!1,position:7,createdAt:"2026-07-24T10:00:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-map",groupId:"xiaogu",title:"且慢 APP 完整功能全景",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/map.html",pinned:!1,position:3,createdAt:"2026-07-24T10:10:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-deep-analysis",groupId:"xiaogu",title:"且慢 App 深度产品分析报告",url:"https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",pinned:!1,position:4,createdAt:"2026-07-24T10:20:00.000Z",source:"研究库",access:"org"},{id:"qieman-app-usage",groupId:"xiaogu",title:"且慢 APP 使用情况与证据",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/usage.html",pinned:!1,position:5,createdAt:"2026-07-24T10:30:00.000Z",source:"研究库",access:"production"},{id:"qieman-app-roadmap",groupId:"xiaogu",title:"且慢 APP 深度产品判断与路线图",url:"https://clairku.github.io/qieman-product-research-library/pages/qieman-app-panorama/roadmap.html",pinned:!1,position:6,createdAt:"2026-07-24T10:40:00.000Z",source:"研究库",access:"production"},{id:"qieman-ai-native",groupId:"xiaogu",title:"且慢 APP AI 原生转型三案",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",pinned:!0,position:7,createdAt:"2026-07-24T10:50:00.000Z",source:"研究库",access:"production"},{id:"oap-progress-roadmap",groupId:"ai-platform",title:"OAP 进展与规划汇报",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-progress-and-roadmap-2026-07-24.html",pinned:!1,position:3,createdAt:"2026-07-24T11:00:00.000Z",source:"研究库",access:"production"},{id:"oap-metrics-trend",groupId:"ai-platform",title:"盈米 AI 开放平台｜上线以来运营趋势",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html",pinned:!0,position:4,createdAt:"2026-07-28T10:11:00.000Z",source:"近月新增",access:"production"},{id:"oap-reporting-framework",groupId:"ai-platform",title:"OAP 汇报框架｜动因、成果、复盘与规划",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-reporting-framework-2026-07-28.html",pinned:!1,position:5,createdAt:"2026-07-28T08:30:00.000Z",source:"近月新增",access:"production"},{id:"oap-traffic-analysis",groupId:"ai-platform",title:"盈米 AI 开放平台｜全站访问与点击分析",url:"https://clairku.github.io/qieman-product-research-library/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",pinned:!0,position:6,createdAt:"2026-07-28T12:10:00.000Z",source:"近月新增",access:"production"},{id:"eastmoney-platform",groupId:"ai-platform",title:"东方财富 AI Skills 平台深度竞品分析",url:"https://clairku.github.io/skills/reports/eastmoney-ai-skills-platform-analysis-2026-07-28/",pinned:!1,position:7,createdAt:"2026-07-28T08:57:00.000Z",source:"近月新增",access:"production"},{id:"qieman-strategy-explorer",groupId:"research",title:"四笔钱策略检视台｜筛选、对比与全指标分析",url:"https://clairku.github.io/qieman-strategy-explorer/",pinned:!1,position:2,createdAt:"2026-07-27T16:43:00.000Z",source:"近月新增",access:"production"},{id:"financial-planning-review",groupId:"research",title:"财务规划报告｜现金流与目标可达性改稿建议",url:"https://clairku.github.io/qieman-product-research-library/pages/financial-planning-report-review/",pinned:!1,position:3,createdAt:"2026-07-27T11:27:00.000Z",source:"近月新增",access:"production"},{id:"investment-behavior-report",groupId:"research",title:"投资行为画像｜行为金融洞察报告（脱敏版）",url:"https://clairku.github.io/my-investment-behavior-report/",pinned:!1,position:4,createdAt:"2026-07-16T14:56:00.000Z",source:"近月新增",access:"production"},{id:"product-review-workbench",groupId:"product-planning",title:"产品需求评审工作台",url:"https://clairku.github.io/product-review-workbench/",pinned:!0,position:8,createdAt:"2026-07-08T06:43:00.000Z",source:"近月新增",access:"production"},{id:"community-ai-review",groupId:"product-planning",title:"社区 AI 运营方案｜需求评审报告",url:"https://clairku.github.io/product-review-workbench/reviews/community-ai-operations-2026-07-28/",pinned:!1,position:9,createdAt:"2026-07-28T08:20:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-review",groupId:"reporting",title:"金榛子奖申报材料审查报告",url:"https://clairku.github.io/jinzhenzi-submission-review/",pinned:!1,position:0,createdAt:"2026-07-28T11:01:00.000Z",source:"近月新增",access:"production"},{id:"jinzhenzi-history",groupId:"reporting",title:"金榛子奖历届获奖项目档案",url:"https://clairku.github.io/jinzhenzi-submission-review/history.html",pinned:!1,position:1,createdAt:"2026-07-28T11:20:00.000Z",source:"近月新增",access:"production"},{id:"xiaogu-user-needs",groupId:"xiaogu",title:"小顾用户需求分析与关键钩子工具方案",url:"https://clairku.github.io/xiaogu-user-needs-report/",pinned:!1,position:8,createdAt:"2026-07-16T09:58:00.000Z",source:"近月新增",access:"production"},{id:"qieman-ai-advisor-ecosystem",groupId:"xiaogu",title:"且慢小顾 × AI 实验室 × 开放平台｜生态闭环 Demo",url:"https://qieman-ai-advisor-ecosystem.clairku.chatgpt.site",pinned:!0,position:9,createdAt:"2026-07-26T15:05:00.000Z",source:"近月新增",access:"account"},{id:"oap-h2-plan",groupId:"reporting",title:"2026 下半年 AI 开放平台目标计划与里程碑",url:"https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",pinned:!1,position:2,createdAt:"2026-07-26T09:00:00.000Z",source:"研究库",access:"org"},{id:"ai-weekly-2026-07-13",groupId:"reporting",title:"AI 项目周报｜2026-07-13",url:"https://clairku.github.io/clair-ai-studio/reports/ai-weekly-2026-07-13/",pinned:!1,position:3,createdAt:"2026-07-13T02:20:23.000Z",source:"近月补录",access:"production"},{id:"pension-business-analysis",groupId:"reporting",title:"盈米及且慢养老金业务分析",url:"https://clairku.github.io/clair-ai-studio/reports/pension-business-analysis-2026-07/",pinned:!1,position:4,createdAt:"2026-07-13T08:47:33.000Z",source:"近月补录",access:"production"},{id:"advisor-2-business-onboarding",groupId:"reporting",title:"盈米投顾 2.0｜新负责人业务入职报告",url:"https://clairku.github.io/clair-ai-studio/reports/advisor-2-business-onboarding-2026-07/",pinned:!1,position:5,createdAt:"2026-07-13T09:12:10.000Z",source:"近月补录",access:"production"},{id:"schwab-ria-benchmark",groupId:"reporting",title:"嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",url:"https://clairku.github.io/clair-ai-studio/reports/schwab-ria-benchmark-2026/",pinned:!1,position:6,createdAt:"2026-07-22T02:40:53.000Z",source:"近月补录",access:"production"},{id:"skill-audit-2026-07-16",groupId:"ai-workbench",title:"25 项 Skills 可用性与一致性审查",url:"https://clairku.github.io/clair-ai-studio/reports/skill-audit-2026-07-16/",pinned:!1,position:0,createdAt:"2026-07-16T03:30:04.000Z",source:"近月补录",access:"production"},{id:"html-editor-guide",groupId:"ai-workbench",title:"Clair's Studio｜HTML 编辑器使用与安全说明",url:"https://clairku.github.io/clair-ai-studio/reports/html-editor-guide-2026-07-29/",pinned:!0,position:1,createdAt:"2026-07-29T16:00:00.000Z",source:"产品能力",access:"production"},{id:"yingmi-ai-capability-system",groupId:"ai-platform",title:"盈米 AI 能力体系专业报告｜2026.07",url:"https://clairku.github.io/clair-ai-studio/reports/yingmi-ai-capability-system-2026-07/",pinned:!1,position:8,createdAt:"2026-07-13T09:43:42.000Z",source:"近月补录",access:"production"}]},lt={"seed-mcp-benchmark":"competitive-research","seed-fund-report":"investment-research","storage-big-three-fund-screening":"investment-research","seed-agreement":"governance-review","seed-xiaogu":"product-planning","seed-strategy":"investment-research","seed-ecosystem":"product-demo","qieman-library-index":"governance-review","qieman-advisor-inventory":"product-planning","qieman-advisor-direction-research":"product-planning","qieman-advisor-v09":"product-planning","qieman-network-research":"competitive-research","qieman-advisor-final":"product-planning","qieman-advisor-demo":"product-demo","qieman-advisor-plan":"product-planning","qieman-home-entry-analysis":"data-analysis","qieman-advisor-click-analysis":"data-analysis","qieman-app-map":"product-planning","qieman-app-deep-analysis":"data-analysis","qieman-app-usage":"data-analysis","qieman-app-roadmap":"product-planning","qieman-ai-native":"product-planning","oap-progress-roadmap":"reporting","oap-metrics-trend":"data-analysis","oap-reporting-framework":"reporting","oap-traffic-analysis":"data-analysis","eastmoney-platform":"competitive-research","qieman-strategy-explorer":"investment-research","financial-planning-review":"requirement-review","investment-behavior-report":"data-analysis","product-review-workbench":"product-demo","community-ai-review":"requirement-review","jinzhenzi-review":"governance-review","jinzhenzi-history":"competitive-research","xiaogu-user-needs":"product-planning","qieman-ai-advisor-ecosystem":"product-demo","oap-h2-plan":"reporting","ai-weekly-2026-07-13":"reporting","pension-business-analysis":"reporting","advisor-2-business-onboarding":"reporting","schwab-ria-benchmark":"competitive-research","skill-audit-2026-07-16":"governance-review","html-editor-guide":"product-demo","yingmi-ai-capability-system":"reporting"},Gt={"qieman-home-entry-analysis":"product-planning","qieman-app-map":"product-planning","qieman-app-deep-analysis":"product-planning","qieman-app-usage":"product-planning","qieman-app-roadmap":"product-planning","financial-planning-review":"xiaogu","investment-behavior-report":"xiaogu","product-review-workbench":"ai-workbench","community-ai-review":"ai-workbench","qieman-ai-advisor-ecosystem":"ai-platform","oap-h2-plan":"ai-platform"};function vt(t){const e=`${t.title||""} ${t.source||""}`;return/需求评审|评审工作台/.test(e)?"requirement-review":/竞品|对比|调研|研究/.test(e)?"competitive-research":/周报|汇报|进展|规划|里程碑|业务分析/.test(e)?"reporting":/数据|趋势|点击|转化|画像|使用/.test(e)?"data-analysis":/基金|策略|投研|资产配置/.test(e)?"investment-research":/审查|治理|知识/.test(e)?"governance-review":/Demo|工作台|原型/.test(e)?"product-demo":"product-planning"}function yt(t,e=vt(t)){const a=`${t.id||""} ${t.groupId||""} ${t.title||""} ${t.url||""}`,i=[],r=o=>{i.includes(o)||i.push(o)};return/ontology\.yingmi-inc\.com|本体/.test(a)&&r("本体"),/feishu\.cn|飞书|community-ai-review|oap-h2-plan/.test(a)&&r("飞书"),(e==="competitive-research"||/调研|研究|盘点/.test(a))&&r("调研"),(/xiaogu|小顾|财务规划|投资行为/.test(a)||t.groupId==="xiaogu")&&r("AI 小顾"),(/workbench|工作台|skill-audit/.test(a)||t.groupId==="ai-workbench")&&r("AI 工作台"),(/ai-platform|开放平台|OAP|MCP|Skills|能力体系/.test(a)||t.groupId==="ai-platform")&&r("AI 开放平台"),/且慢|qieman/.test(a)&&r("且慢"),/投顾|advisor|财务规划/.test(a)&&r("投顾服务"),/OAP|oap-/.test(a)&&r("OAP"),/MCP|mcp-/.test(a)&&r("MCP"),/Skills|skill-/.test(a)&&r("Skills"),(e==="investment-research"||t.groupId==="research")&&r("投研"),e==="data-analysis"&&r("数据分析"),e==="requirement-review"&&r("需求评审"),e==="reporting"&&r("经营汇报"),(e==="governance-review"||t.groupId==="knowledge")&&r("知识治理"),i.slice(0,5)}U.reports=U.reports.map(t=>{const e=Gt[t.id]||t.groupId,a=lt[t.id]||vt(t),i={...t,groupId:e,workType:a};return{...i,tags:yt(i,a)}});let h=Ee(),E="",C="",N=!1,S=["topic","type","tag"].includes(localStorage.getItem(ct))?localStorage.getItem(ct):"topic",L="",q="",O="",$=null,St=0;function Zt(t){return JSON.parse(JSON.stringify(t))}function at(t=""){try{const e=new URL(t);e.hash="",e.search="";const a=decodeURI(e.pathname).replace(/\/index\.html$/,"/").replace(/\/+$/,"/");return`${e.origin}${a}`}catch{return String(t).trim().replace(/\/+$/,"/")}}function Ee(){try{const t=JSON.parse(localStorage.getItem(ht));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return qe(t)}catch{}return Zt(U)}function qe(t){const e=Zt(U),a=new Set(e.groups.map(g=>g.id)),i=new Set(["inbox","today","product","research"]),r=new Map(t.groups.map(g=>[g.id,g])),o=e.groups.map(g=>{const I=r.get(g.id);return!I||t.version<M?g:{...g,name:I.name||g.name,description:I.description||g.description,position:Number.isFinite(I.position)?I.position:g.position}});t.groups.filter(g=>!a.has(g.id)&&!i.has(g.id)).forEach((g,I)=>{o.push({...g,description:g.description||"自定义工作分组",position:Number.isFinite(g.position)?g.position:U.groups.length+I})});const c=o.filter((g,I,v)=>v.findIndex(B=>B.id===g.id)===I);c.sort((g,I)=>(g.position||0)-(I.position||0));const s={"seed-mcp-benchmark":"ai-platform","seed-fund-report":"research","seed-agreement":"ai-platform","seed-xiaogu":"xiaogu","seed-strategy":"research","seed-ecosystem":"ai-platform","storage-big-three-fund-screening":"research"},d={inbox:"inbox",today:"product-planning",product:"xiaogu",research:"research"},l=t.reports.map(g=>({...g,groupId:Gt[g.id]||s[g.id]||d[g.groupId]||g.groupId||"inbox",workType:g.workType||lt[g.id]||vt(g),tags:Array.isArray(g.tags)&&g.tags.length?g.tags:yt(g,g.workType||lt[g.id])})),m=new Map(l.map(g=>[g.id,g])),p=new Map(l.map(g=>[at(g.url),g])),u=new Set,b=e.reports.map(g=>{const I=at(g.url);u.add(I);const v=m.get(g.id)||p.get(I);return v?{...g,title:v.title||g.title,groupId:t.version>=M&&c.some(B=>B.id===v.groupId)?v.groupId:g.groupId,workType:t.version>=M&&v.workType?v.workType:g.workType,tags:t.version>=M&&Array.isArray(v.tags)&&v.tags.length?v.tags:g.tags,pinned:!!v.pinned,position:Number.isFinite(v.position)?v.position:g.position,archived:!!v.archived,archivedAt:v.archivedAt||""}:g});l.forEach(g=>{const I=at(g.url);u.has(I)||(u.add(I),b.push(g))});const k={version:M,groups:c,reports:b};return localStorage.setItem(ht,JSON.stringify(k)),k}function x(){h.version=M,h.groups.forEach((t,e)=>{t.position=e}),localStorage.setItem(ht,JSON.stringify(h))}function it(t,e){const a=h.groups.findIndex(o=>o.id===t),i=h.groups.findIndex(o=>o.id===e);if(a<0||i<0||a===i)return!1;const[r]=h.groups.splice(a,1);return h.groups.splice(i,0,r),x(),!0}function Te(t,e,a=""){const i=h.reports.find(s=>s.id===t);if(!i||i.archived||!h.groups.find(s=>s.id===e))return!1;const o=h.reports.filter(s=>!s.archived&&s.groupId===e&&s.id!==t).sort((s,d)=>(s.position||0)-(d.position||0)),c=a?o.findIndex(s=>s.id===a):o.length;return i.groupId=e,o.splice(c<0?o.length:c,0,i),o.forEach((s,d)=>{s.position=d}),x(),!0}function xe(t){var e;return((e=J.find(a=>a.id===t))==null?void 0:e.name)||"产品规划"}function Le(t,e=""){const a=i=>!e||i.toLowerCase().includes(e);if(S==="type")return J.map(i=>({id:i.id,name:i.name,kind:"type",accent:"blue",reports:t.filter(r=>r.workType===i.id).sort((r,o)=>+!!o.pinned-+!!r.pinned||new Date(o.createdAt)-new Date(r.createdAt))})).filter(i=>!e||i.reports.length||a(i.name));if(S==="tag"){const i=new Set(z);return h.reports.forEach(o=>{(o.tags||[]).forEach(c=>i.add(c))}),[...i].sort((o,c)=>{const s=z.indexOf(o),d=z.indexOf(c);return s>=0||d>=0?(s<0?Number.MAX_SAFE_INTEGER:s)-(d<0?Number.MAX_SAFE_INTEGER:d):o.localeCompare(c,"zh-CN")}).map(o=>({id:o,name:o,kind:"tag",accent:"violet",reports:t.filter(c=>(c.tags||[]).includes(o)).sort((c,s)=>+!!s.pinned-+!!c.pinned||new Date(s.createdAt)-new Date(c.createdAt))})).filter(o=>o.reports.length&&(!e||a(o.name)||o.reports.length))}return h.groups.map(i=>({...i,kind:"topic",reports:t.filter(r=>r.groupId===i.id).sort((r,o)=>(r.position||0)-(o.position||0))})).filter(i=>!e||i.reports.length||a(`${i.name} ${i.description||""}`))}function F(t,e,a,i=""){const r=h.reports.find(o=>o.id===t);return!r||r.archived?!1:e==="topic"?Te(t,a,i):e==="type"?J.some(o=>o.id===a)?(r.workType=a,x(),!0):!1:e==="tag"?(r.tags=Array.isArray(r.tags)?r.tags:[],r.tags.includes(a)||r.tags.push(a),x(),!0):!1}function j(){return S==="type"?"工作类型":S==="tag"?"标签":"主题"}function Et(t){var e;return`${t}-${((e=crypto.randomUUID)==null?void 0:e.call(crypto))||`${Date.now()}-${Math.random()}`}`}function f(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function G(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function Ht(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function nt(t=""){return[...new Set(String(t).split(/[、,，;；\n]+/).map(e=>e.trim()).filter(Boolean).map(e=>e.slice(0,20)))].slice(0,8)}function A(t){var a;(a=document.querySelector(".toast"))==null||a.remove();const e=document.createElement("div");e.className="toast",e.setAttribute("role","status"),e.textContent=t,document.body.append(e),clearTimeout(St),St=window.setTimeout(()=>e.remove(),2600)}function _t(t,e=!1){const a=t.access!=="production",i=t.access==="org"?"需组织登录":t.access==="account"?"需账号登录":"生产可访问",o=!a&&U.reports.some(c=>c.id===t.id)?`<img src="./previews/${f(t.id)}.png" alt="" loading="lazy" decoding="async" />`:`
      <div class="preview-placeholder ${a?"preview-restricted":""}">
        <span>${a?"ACCESS":f(t.title.slice(0,2))}</span>
        <strong>${a?i:"预览待补充"}</strong>
      </div>`;return`
    <article class="report-card ${a?"restricted-card":""} ${e?"archived-card":""} ${O===t.id?"is-move-selected":""}" data-report-id="${f(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${f(t.id)}" aria-label="打开${f(t.title)}">
        <span class="report-preview">
          ${o}
        </span>
        <span class="report-copy">
          <span class="report-source">${f(t.source||"手动添加")}</span>
          <strong>${f(t.title)}</strong>
          ${(t.tags||[]).length?`<span class="report-tags">${t.tags.slice(0,3).map(c=>`<span>${f(c)}</span>`).join("")}</span>`:""}
          ${a?`<span class="report-access-note">${f(i)}</span>`:""}
        </span>
      </button>
      ${e?"":`
        <span class="report-drag-handle" role="button" tabindex="0" data-report-drag-id="${f(t.id)}"
          aria-label="拖动《${f(t.title)}》到其他${j()}" title="拖动到其他${j()}">
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
    </article>`}function wt(){var a;if(!$)return"";if($.type==="tags"){const i=h.reports.find(r=>r.id===$.reportId);return i?`
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
            ${z.map(r=>`<button type="button" class="${(i.tags||[]).includes(r)?"selected":""}" data-tag-suggestion="${f(r)}">${f(r)}</button>`).join("")}
          </div>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">保存标签</button>
          </div>
        </form>
      </div>`:""}if($.type==="group"){const i=$.mode==="edit"?h.groups.find(r=>r.id===$.groupId):null;return`
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
      </div>`}const t=$.mode==="edit"?h.reports.find(i=>i.id===$.reportId):null,e=(t==null?void 0:t.groupId)||$.groupId||((a=h.groups[0])==null?void 0:a.id)||"";return`
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
            ${J.map(i=>`<option value="${f(i.id)}" ${i.id===((t==null?void 0:t.workType)||"product-planning")?"selected":""}>${f(i.name)}</option>`).join("")}
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
    </main>`}function De(t){if(Nt(t.id))return Ie(t,f);const e=t.access!=="production",a=t.access==="org"?"组织账号":"站点账号",i=e?`
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
          <p class="login-handoff-domain">${f(G(t.url))}</p>
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
          <span>${f(G(t.url))}</span>
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
      ${wt()}
    </main>`}function Ft(t){return`
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark small">C</div>
        <div><strong>Clair's Studio</strong></div>
      </div>
      <div class="top-actions">
        ${N?'<button class="quiet-button" type="button" data-action="show-catalog">← 返回成果库</button>':'<button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span> 新增</button>'}
      </div>
    </header>`}function Oe(){const t=h.reports.filter(a=>a.archived).filter(a=>{if(!E.trim())return!0;const i=E.trim().toLowerCase();return`${a.title} ${a.url} ${a.source||""}`.toLowerCase().includes(i)}).sort((a,i)=>new Date(i.archivedAt||0)-new Date(a.archivedAt||0)),e=h.reports.filter(a=>a.archived).length;return`
    <main class="app-shell archive-shell">
      ${Ft()}
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
              <div><h2>${E?"搜索结果":"归档内容"}</h2><p>按最近归档时间排列</p></div>
              <span>${t.length} 份</span>
            </div>
            <div class="archive-grid">${t.map(a=>_t(a,!0)).join("")}</div>
          </section>`:`
          <section class="archive-empty">
            <span>ARCHIVE</span>
            <h2>${E?"没有找到相关归档":"归档区还是空的"}</h2>
            <p>${E?"换个关键词，或返回查看全部归档内容。":"在主目录的报告卡片上选择“归档”，内容就会安全收纳在这里。"}</p>
            <button class="quiet-button" type="button" data-action="${E?"clear-search":"show-catalog"}">${E?"清除搜索":"返回主目录"}</button>
          </section>`}
        <div class="archive-safety-note">
          <strong>不会自动删除</strong>
          <span>只有在归档区主动选择“永久删除”，报告才会从当前浏览器清单移除。</span>
        </div>
      </section>
      <footer><span>CLAIR'S STUDIO</span><span>Safe archive</span></footer>
      ${wt()}
    </main>`}function Pe(){if(N)return Oe();const t=E.trim().toLowerCase(),e=t.split(/\s+/).filter(Boolean),a=h.reports.filter(l=>!l.archived),i=e.length?a.filter(l=>{const m=`${l.title} ${l.source||""} ${l.access||""} ${xe(l.workType)} ${(l.tags||[]).join(" ")}`.toLowerCase();return e.every(p=>m.includes(p))}):a,r=h.reports.filter(l=>l.archived).length,o=a.filter(l=>l.access==="production").length,c=a.filter(l=>l.access!=="production").length,s=Le(i,t).filter(l=>l.reports.length||O),d=S==="type"?"工作类型":S==="tag"?"关键标签":"工作主题";return`
    <main class="app-shell">
      ${Ft()}
      <section class="workspace">
        ${te(f)}
        <div class="results-toolbar unified-results-toolbar">
          <h1 class="sr-only">Clair's Studio 成果库</h1>
          <div class="results-toolbar-side">
            <div class="studio-summary compact-summary" aria-label="成果统计">
              <strong>${a.length}</strong><span>成果</span>
              <i></i>
              <strong>${h.groups.length}</strong><span>主题</span>
              <i></i>
              <strong>${o}</strong><span>直达</span>
            </div>
            <label class="search results-search">
              <span aria-hidden="true">⌕</span>
              <input id="search-input" value="${f(E)}" placeholder="搜索标题、标签或来源" aria-label="搜索成果" />
              ${E?'<button type="button" data-action="clear-search">清除</button>':""}
            </label>
          </div>
        </div>
        ${ae(f)}
        <section class="groups-section">
          ${O?`
            <div class="move-mode-banner" role="status">
              <div><strong>正在整理报告</strong><span>选择目标${j()}的“移到这里”，或直接拖动卡片。</span></div>
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
                ${s.map((l,m)=>`<a href="#bucket-${m}"><span class="nav-index">${String(m+1).padStart(2,"0")}</span>${f(l.name)}<span>${l.reports.length}</span></a>`).join("")}
                <span class="library-nav-spacer" aria-hidden="true"></span>
                <button class="library-nav-utility" type="button" data-action="show-archive">
                  <span aria-hidden="true">⌑</span>
                  <strong>归档</strong>
                  ${r?`<em>${r}</em>`:""}
                </button>
              </nav>
              <div class="board catalog-view-${S}">
              ${s.map((l,m)=>`
                <section id="bucket-${m}" class="group-column topic-section bucket-${f(l.kind)} accent-${f(l.accent||"blue")}"
                  data-bucket-kind="${f(l.kind)}"
                  data-bucket-id="${f(l.id)}"
                  ${l.kind==="topic"?`data-group-id="${f(l.id)}"`:""}>
                  <header class="group-header">
                    ${l.kind==="topic"?`<span class="group-drag-handle" role="button" tabindex="0" data-group-drag-id="${f(l.id)}"
                          aria-label="拖动“${f(l.name)}”调整主题顺序" title="拖动调整主题顺序；也可用左右方向键">
                          <span aria-hidden="true">⠿</span>
                          <small>${String(m+1).padStart(2,"0")}</small>
                        </span>`:`<span class="bucket-marker" aria-hidden="true">${l.kind==="tag"?"#":"类"}</span>`}
                    <div class="group-heading-copy">
                      <div><h2>${f(l.name)}</h2></div>
                      <span class="count">${l.reports.length} 份</span>
                    </div>
                    <div class="group-menu">
                      ${O?`<button class="move-here-button" type="button" data-action="move-here" data-id="${f(l.id)}" data-bucket-kind="${f(l.kind)}">移到这里</button>`:""}
                      ${l.kind==="topic"?`<button type="button" data-action="add-to-group" data-id="${f(l.id)}">添加报告</button>
                           <button type="button" data-action="rename-group" data-id="${f(l.id)}">编辑主题</button>
                           ${l.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${f(l.id)}">删除</button>`:""}`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${l.reports.length?l.reports.map(p=>_t(p)).join(""):l.kind==="topic"?`<button class="empty-topic-drop" type="button" data-action="add-to-group" data-id="${f(l.id)}">
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
      ${wt()}
    </main>`}function y(){const t=document.getElementById("app");if(sessionStorage.getItem(bt)!=="ok"){t.innerHTML=Ce(),Re();return}const e=C&&h.reports.find(a=>a.id===C);t.innerHTML=e?De(e):Pe(),Me(),ie({render:y,escapeHtml:f,showToast:A,showResults:()=>{N=!1}})}function Re(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",e=>{if(e.preventDefault(),new FormData(t).get("password")!=="2026"){const i=t.querySelector(".form-error");i.hidden=!1,i.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(bt,"ok"),y()})}async function qt(t){var c,s;const e=t.elements.url,a=t.elements.title,i=t.querySelector('[data-action="detect-title"]'),r=t.querySelector(".field-hint"),o=e.value.trim();if(!Ht(o))return r.textContent="请输入完整的 http 或 https 网址","";i.disabled=!0,i.innerHTML='<span class="mini-spinner"></span>',r.textContent="正在读取网页标题…";try{const d=`https://api.microlink.io/?url=${encodeURIComponent(o)}`,l=await fetch(d,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!l.ok)throw new Error("read failed");const m=await l.json(),p=((s=(c=m==null?void 0:m.data)==null?void 0:c.title)==null?void 0:s.trim())||G(o);return a.value=p.slice(0,180),r.textContent="已识别网页标题",a.value}catch{const d=G(o);return a.value||(a.value=d),r.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",a.value}finally{i.disabled=!1,i.textContent="识别标题"}}function Me(){var r;(r=document.getElementById("search-input"))==null||r.addEventListener("input",o=>{E=o.target.value,y();const c=document.getElementById("search-input");c==null||c.focus(),c==null||c.setSelectionRange(E.length,E.length)}),document.querySelectorAll("[data-action]").forEach(o=>{o.addEventListener("click",async c=>{var l,m;const s=c.currentTarget.dataset.action,d=c.currentTarget.dataset.id;if(s==="open")C=d,y();else if(s==="edit-document"){const p=h.reports.find(u=>u.id===d);if(!p||p.access!=="production")return;$e(p,{render:y,showToast:A})}else if(s==="download-report"){const p=h.reports.find(u=>u.id===d);p&&await jt(p,A)}else if(s==="share-report"){const p=h.reports.find(u=>u.id===d);p&&await Se(p,A)}else if(s==="back")C="",$=null,y();else if(s==="lock")sessionStorage.removeItem(bt),y();else if(s==="clear-search")E="",y();else if(s==="set-view"){if(!["topic","type","tag"].includes(d))return;S=d,O="",localStorage.setItem(ct,S),y()}else if(s==="cancel-move")O="",y();else if(s==="move-here"){const p=c.currentTarget.dataset.bucketKind||S;O&&F(O,p,d)&&(O="",y(),A(p==="tag"?"已添加目标标签":`报告已移入目标${j()}`))}else if(s==="show-archive")N=!0,E="",C="",y();else if(s==="show-catalog")N=!1,E="",C="",y();else if(s==="add-report")$={type:"report",mode:"create",groupId:((l=h.groups[1])==null?void 0:l.id)||((m=h.groups[0])==null?void 0:m.id)},y();else if(s==="add-to-group")$={type:"report",mode:"create",groupId:d},y();else if(s==="edit")$={type:"report",mode:"edit",reportId:d},y();else if(s==="edit-tags")$={type:"tags",reportId:d},y();else if(s==="close-modal")$=null,y();else if(s==="detect-title")await qt(c.currentTarget.closest("form"));else if(s==="archive"){const p=h.reports.find(u=>u.id===d);if(!p)return;p.archived=!0,p.archivedAt=new Date().toISOString(),x(),y(),A("已归档，可随时恢复")}else if(s==="restore"){const p=h.reports.find(u=>u.id===d);if(!p)return;p.archived=!1,p.archivedAt="",x(),y(),A("报告已恢复到原主题")}else if(s==="delete"){const p=h.reports.find(u=>u.id===d);p!=null&&p.archived&&confirm(`二次确认：永久删除“${p.title}”？

删除后无法从归档区恢复。`)&&(h.reports=h.reports.filter(u=>u.id!==d),C===d&&(C=""),x(),y(),A("报告已永久删除"))}else if(s==="add-group")$={type:"group",mode:"create"},y();else if(s==="rename-group")h.groups.find(u=>u.id===d)&&($={type:"group",mode:"edit",groupId:d},y());else if(s==="delete-group"){const p=h.groups.find(u=>u.id===d);p&&confirm(`删除“${p.name}”？其中的报告会移到“待整理”。`)&&(h.reports.forEach(u=>{u.groupId===d&&(u.groupId="inbox")}),h.groups=h.groups.filter(u=>u.id!==d),x(),y(),A("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-drag-handle").forEach(o=>{let c=null,s=!1;const d=()=>{var l;L="",c=null,s=!1,(l=o.closest(".report-card"))==null||l.classList.remove("is-dragging"),document.querySelectorAll(".report-card, .group-column").forEach(m=>{m.classList.remove("is-card-drop-target","is-drop-ready")})};o.addEventListener("pointerdown",l=>{var m,p;l.preventDefault(),L=o.dataset.reportDragId,q="",c={x:l.clientX,y:l.clientY},s=!1,(m=o.setPointerCapture)==null||m.call(o,l.pointerId),(p=o.closest(".report-card"))==null||p.classList.add("is-dragging")}),o.addEventListener("pointermove",l=>{if(!L||c&&Math.hypot(l.clientX-c.x,l.clientY-c.y)<7)return;s=!0;const m=document.elementFromPoint(l.clientX,l.clientY),p=m==null?void 0:m.closest(".report-card"),u=m==null?void 0:m.closest(".group-column");document.querySelectorAll(".report-card").forEach(b=>{b.classList.toggle("is-card-drop-target",!!(p&&p!==o.closest(".report-card")&&b===p))}),document.querySelectorAll(".group-column").forEach(b=>{b.classList.toggle("is-drop-ready",!!(u&&b===u))})}),o.addEventListener("pointerup",l=>{if(!L)return;const m=L;if(!s){O=m,d(),y(),A(`请选择目标${j()}`);return}const p=document.elementFromPoint(l.clientX,l.clientY),u=p==null?void 0:p.closest(".report-card"),b=p==null?void 0:p.closest(".group-column"),k=(u==null?void 0:u.dataset.reportId)||"",g=(b==null?void 0:b.dataset.bucketId)||"",I=(b==null?void 0:b.dataset.bucketKind)||S,v=k&&k!==m?F(m,I,g,k):g?F(m,I,g):!1;d(),v&&(y(),A(I==="tag"?"已添加目标标签":I==="type"?"工作类型已更新":k?"报告顺序已更新":"已移入新主题"))}),o.addEventListener("pointercancel",d)}),document.querySelectorAll(".group-drag-handle").forEach(o=>{const c=()=>{var s;q="",(s=o.closest(".group-column"))==null||s.classList.remove("is-group-dragging"),document.querySelectorAll(".group-column").forEach(d=>{d.classList.remove("is-group-drop-target","is-drop-ready")})};o.addEventListener("pointerdown",s=>{var d,l;s.preventDefault(),q=o.dataset.groupDragId,L="",(d=o.setPointerCapture)==null||d.call(o,s.pointerId),(l=o.closest(".group-column"))==null||l.classList.add("is-group-dragging")}),o.addEventListener("pointermove",s=>{q&&document.querySelectorAll(".group-column").forEach(d=>{var l;d.classList.toggle("is-group-drop-target",d===((l=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:l.closest(".group-column")))})}),o.addEventListener("pointerup",s=>{var m;if(!q)return;const d=q,l=(m=document.elementFromPoint(s.clientX,s.clientY))==null?void 0:m.closest(".group-column");if(l&&it(d,l.dataset.groupId)){q="",y(),A("分组顺序已更新");return}c()}),o.addEventListener("pointercancel",c),o.addEventListener("keydown",s=>{var p;if(!["ArrowLeft","ArrowRight"].includes(s.key))return;s.preventDefault();const d=h.groups.findIndex(u=>u.id===o.dataset.groupDragId),l=s.key==="ArrowLeft"?d-1:d+1,m=h.groups[l];!m||!it(o.dataset.groupDragId,m.id)||(y(),A("分组顺序已更新"),(p=document.querySelector(`[data-group-drag-id="${CSS.escape(o.dataset.groupDragId)}"]`))==null||p.focus())})}),document.querySelectorAll(".group-column").forEach(o=>{o.addEventListener("dragover",c=>{c.preventDefault(),o.classList.add(q?"is-group-drop-target":"is-drop-ready")}),o.addEventListener("dragleave",()=>{o.classList.remove("is-drop-ready","is-group-drop-target")}),o.addEventListener("drop",c=>{if(c.preventDefault(),q){if(o.dataset.bucketKind==="topic"&&it(q,o.dataset.groupId)){q="",y(),A("分组顺序已更新");return}q="",o.classList.remove("is-group-drop-target");return}const s=h.reports.find(l=>l.id===L),d=o.dataset.bucketKind||S;s&&F(L,d,o.dataset.bucketId)&&(L="",y(),A(d==="tag"?"已添加目标标签":d==="type"?"工作类型已更新":"已移入新主题")),L=""})}),document.querySelectorAll("[data-tag-suggestion]").forEach(o=>{o.addEventListener("click",()=>{const c=document.querySelector('#tag-form input[name="tags"]');if(!c)return;const s=nt(c.value),d=o.dataset.tagSuggestion;c.value=s.includes(d)?s.filter(l=>l!==d).join("、"):[...s,d].slice(0,8).join("、"),o.classList.toggle("selected",!s.includes(d)),c.focus()})});const t=document.getElementById("tag-form");t==null||t.addEventListener("submit",o=>{o.preventDefault();const c=h.reports.find(s=>s.id===$.reportId);c&&(c.tags=nt(new FormData(t).get("tags")),x(),$=null,y(),A("标签已更新"))});const e=document.getElementById("group-form");e==null||e.addEventListener("submit",o=>{var l,m;o.preventDefault();const c=(l=new FormData(e).get("name"))==null?void 0:l.trim(),s=(m=new FormData(e).get("description"))==null?void 0:m.trim();if(!c)return;if($.mode==="edit"){const p=h.groups.find(u=>u.id===$.groupId);if(!p)return;p.name=c.slice(0,60),p.description=(s==null?void 0:s.slice(0,80))||"自定义工作主题"}else h.groups.push({id:Et("group"),name:c.slice(0,60),description:(s==null?void 0:s.slice(0,80))||"自定义工作主题",accent:["blue","violet","amber","green"][h.groups.length%4],position:h.groups.length});x();const d=$.mode==="edit"?"工作主题已更新":"工作主题已创建，可直接拖入报告";$=null,y(),A(d)});const a=document.getElementById("report-form");a==null||a.addEventListener("submit",async o=>{o.preventDefault();const c=a.elements.url.value.trim();if(!Ht(c))return;const s=a.querySelector('button[type="submit"]');s.disabled=!0,s.innerHTML='<span class="mini-spinner"></span>';let d=a.elements.title.value.trim();d||(d=await qt(a));const l=a.elements.groupId.value,m=a.elements.workType.value,p=nt(a.elements.tags.value);if($.mode==="edit"){const u=h.reports.find(b=>b.id===$.reportId);Object.assign(u,{title:d,url:c,groupId:l,workType:m,tags:p})}else{const u={id:Et("report"),groupId:l,title:d||G(c),url:c,pinned:!1,position:h.reports.filter(b=>b.groupId===l).length,createdAt:new Date().toISOString(),source:"手动添加",access:"production",archived:!1,archivedAt:"",workType:m,tags:p};u.tags.length||(u.tags=yt(u,u.workType)),h.reports.push(u)}x(),$=null,y(),A("报告已保存")});const i=C&&h.reports.find(o=>o.id===C);i&&Ae(i)}function Be(){y()}Be(document.getElementById("app"));
