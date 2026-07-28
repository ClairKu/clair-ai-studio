(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))e(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&e(s)}).observe(document,{childList:!0,subtree:!0});function d(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(a){if(a.ep)return;a.ep=!0;const n=d(a);fetch(a.href,n)}})();const L="clair-service-report-workbench-v1",w="clair-service-report-workbench-access",O={groups:[{id:"inbox",name:"待整理",accent:"slate",position:0},{id:"today",name:"今日产出 · 7月28日",accent:"blue",position:1},{id:"product",name:"产品与 AI 服务",accent:"violet",position:2},{id:"research",name:"投研与竞品",accent:"amber",position:3}],reports:[{id:"seed-mcp-benchmark",groupId:"today",title:"三家金融 MCP / Skills 服务最完整对比｜010350 同题实测",url:"https://clairku.github.io/skills/reports/eastmoney-mcp-skills-benchmark-2026-07-28/",pinned:!0,position:0,createdAt:"2026-07-28T10:00:00.000Z"},{id:"seed-fund-report",groupId:"today",title:"东方财富妙想版｜010350 基金深度诊断",url:"https://clairku.github.io/skills/reports/eastmoney-fund-report-010350-2026-07-28/",pinned:!1,position:1,createdAt:"2026-07-28T09:30:00.000Z"},{id:"seed-agreement",groupId:"product",title:"盈米 MCP 协议审查台",url:"https://clairku.github.io/yingmi-mcp-agreement-review/",pinned:!0,position:0,createdAt:"2026-07-28T08:50:00.000Z"},{id:"seed-xiaogu",groupId:"product",title:"且慢小顾介绍｜AI 投资助手",url:"https://clairku.github.io/qieman-mcp-subscription-prototype/xiaogu-intro/",pinned:!1,position:1,createdAt:"2026-07-27T07:40:00.000Z"},{id:"seed-strategy",groupId:"research",title:"公募策略多指标双轴探索器｜四笔钱",url:"https://clairku.github.io/qieman-product-research-library/pages/product-research/four-money-metric-axis-explorer-2026-07-27.html",pinned:!1,position:0,createdAt:"2026-07-27T07:20:00.000Z"},{id:"seed-ecosystem",groupId:"product",title:"盈米 AI 实验室｜服务组件编排 Demo",url:"https://clairku.github.io/qieman-product-research-library/pages/ai-lab-demo/",pinned:!1,position:2,createdAt:"2026-07-26T14:40:00.000Z"}]};let r=x(),h="",v="",I="",u=null,E=0;function q(t){return JSON.parse(JSON.stringify(t))}function x(){try{const t=JSON.parse(localStorage.getItem(L));if(Array.isArray(t==null?void 0:t.groups)&&Array.isArray(t==null?void 0:t.reports))return t}catch{}return q(O)}function b(){localStorage.setItem(L,JSON.stringify(r))}function k(t){var o;return`${t}-${((o=crypto.randomUUID)==null?void 0:o.call(crypto))||`${Date.now()}-${Math.random()}`}`}function i(t=""){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function y(t){try{return new URL(t).hostname.replace(/^www\./,"")}catch{return t}}function D(t){return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric"}).format(new Date(t))}function T(t){try{return["http:","https:"].includes(new URL(t).protocol)}catch{return!1}}function f(t){var d;(d=document.querySelector(".toast"))==null||d.remove();const o=document.createElement("div");o.className="toast",o.setAttribute("role","status"),o.textContent=t,document.body.append(o),clearTimeout(E),E=window.setTimeout(()=>o.remove(),2600)}function A(t,o=!1){return`
    <article class="report-card ${o?"pinned-card":""}" draggable="true" data-report-id="${i(t.id)}">
      <button class="card-main" type="button" data-action="open" data-id="${i(t.id)}">
        <span class="report-icon">${i(t.title.slice(0,1))}</span>
        <span class="report-copy">
          <strong>${i(t.title)}</strong>
          <span>${i(y(t.url))}</span>
        </span>
        <span class="open-arrow" aria-hidden="true">↗</span>
      </button>
      <div class="card-meta">
        <span>${i(D(t.createdAt))}</span>
        <span class="drag-hint" title="拖动到其他分组">⠿ 拖动</span>
        <div class="card-actions">
          <button type="button" data-action="pin" data-id="${i(t.id)}" title="${t.pinned?"取消置顶":"置顶"}">${t.pinned?"★":"☆"}</button>
          <button type="button" data-action="edit" data-id="${i(t.id)}">编辑</button>
          <button type="button" data-action="delete" data-id="${i(t.id)}">删除</button>
        </div>
      </div>
    </article>`}function C(){var d;if(!u)return"";if(u.type==="group")return`
      <div class="dialog-backdrop">
        <form class="dialog compact-dialog" id="group-form">
          <div class="dialog-title-row">
            <div><span class="section-kicker">NEW COLLECTION</span><h2>新增分组</h2></div>
            <button type="button" data-action="close-modal">×</button>
          </div>
          <label>分组名称
            <input name="name" placeholder="例如：AI 产品、投研报告" maxlength="60" required autofocus />
          </label>
          <div class="dialog-actions">
            <button type="button" class="quiet-button" data-action="close-modal">取消</button>
            <button type="submit" class="primary-button">创建分组</button>
          </div>
        </form>
      </div>`;const t=u.mode==="edit"?r.reports.find(e=>e.id===u.reportId):null,o=(t==null?void 0:t.groupId)||u.groupId||((d=r.groups[0])==null?void 0:d.id)||"";return`
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
            <input name="url" type="url" value="${i((t==null?void 0:t.url)||"")}" placeholder="https://..." required autofocus />
            <button type="button" class="detect-button" data-action="detect-title">识别标题</button>
          </div>
          <small class="field-hint">${t?"修改网址后可重新识别":"保存时会自动识别网页标题"}</small>
        </label>
        <label>报告标题
          <input name="title" value="${i((t==null?void 0:t.title)||"")}" placeholder="保存时自动识别，也可手动输入" maxlength="180" />
        </label>
        <label>放入分组
          <select name="groupId">
            ${r.groups.map(e=>`<option value="${i(e.id)}" ${e.id===o?"selected":""}>${i(e.name)}</option>`).join("")}
          </select>
        </label>
        <div class="dialog-actions">
          <button type="button" class="quiet-button" data-action="close-modal">取消</button>
          <button type="submit" class="primary-button">保存</button>
        </div>
      </form>
    </div>`}function N(){return`
    <main class="gate-shell">
      <section class="gate-card">
        <div class="brand-mark">C</div>
        <span class="eyebrow">CLAIR · SERVICE DESK</span>
        <h1>你的服务报告，都在这里</h1>
        <p>一个入口，管理每天生成的报告与服务页面。</p>
        <form class="login-form" id="login-form">
          <label for="password">访问口令</label>
          <div class="password-row">
            <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入口令" autofocus />
            <button type="submit" class="primary-button">进入工作台</button>
          </div>
          <p class="form-error" hidden></p>
        </form>
        <div class="gate-foot"><span>免平台登录</span><span>当前浏览器保存</span></div>
      </section>
    </main>`}function M(t){return`
    <main class="reader-shell">
      <header class="reader-header">
        <button class="back-button" type="button" data-action="back"><span aria-hidden="true">←</span>返回清单</button>
        <div class="reader-title">
          <strong>${i(t.title)}</strong>
          <span>${i(y(t.url))}</span>
        </div>
        <button class="quiet-button" type="button" data-action="edit" data-id="${i(t.id)}">编辑</button>
      </header>
      <div class="reader-frame-wrap">
        <iframe class="reader-frame" title="${i(t.title)}" src="${i(t.url)}"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
      </div>
      ${C()}
    </main>`}function R(){const t=h.trim().toLowerCase(),o=t?r.reports.filter(e=>`${e.title} ${e.url}`.toLowerCase().includes(t)):r.reports,d=o.filter(e=>e.pinned);return`
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark small">C</div>
          <div><strong>Clair 的服务工作台</strong><span>Service report desk</span></div>
        </div>
        <label class="search"><span aria-hidden="true">⌕</span>
          <input id="search-input" value="${i(h)}" placeholder="搜索报告名称或网址" aria-label="搜索报告" />
          ${h?'<button type="button" data-action="clear-search">清除</button>':""}
        </label>
        <div class="top-actions">
          <button class="quiet-button desktop-only" type="button" data-action="lock">锁定</button>
          <button class="primary-button" type="button" data-action="add-report"><span aria-hidden="true">＋</span>新增报告</button>
        </div>
      </header>
      <section class="workspace">
        <div class="hero-row">
          <div><span class="eyebrow">2026 · DAILY OUTPUTS</span><h1>每天生产的服务，<br />在这里持续生长。</h1><p>拖动卡片即可调整分组。所有标题与地址都可以随时修改。</p></div>
          <div class="metrics">
            <div><strong>${r.reports.length}</strong><span>服务报告</span></div>
            <div><strong>${r.groups.length}</strong><span>自定义分组</span></div>
            <div><strong>${r.reports.filter(e=>e.pinned).length}</strong><span>已置顶</span></div>
          </div>
        </div>
        ${d.length?`
          <section class="pinned-section">
            <div class="section-heading"><div><span class="section-kicker">PINNED</span><h2>置顶服务</h2></div><span>${d.length} 个常用入口</span></div>
            <div class="pinned-grid">${d.map(e=>A(e,!0)).join("")}</div>
          </section>`:""}
        <section class="groups-section">
          <div class="section-heading"><div><span class="section-kicker">COLLECTIONS</span><h2>报告分组</h2></div><button class="text-button" type="button" data-action="add-group">＋ 新增分组</button></div>
          <div class="board">
            ${r.groups.map(e=>{const a=o.filter(n=>n.groupId===e.id);return`
                <section class="group-column accent-${i(e.accent)}" data-group-id="${i(e.id)}">
                  <header class="group-header">
                    <div><span class="accent-dot"></span><h3>${i(e.name)}</h3><span class="count">${a.length}</span></div>
                    <div class="group-menu">
                      <button type="button" data-action="rename-group" data-id="${i(e.id)}">改名</button>
                      ${e.id!=="inbox"?`<button type="button" data-action="delete-group" data-id="${i(e.id)}">删除</button>`:""}
                    </div>
                  </header>
                  <div class="group-cards">
                    ${a.map(n=>A(n)).join("")}
                    ${a.length?`<button type="button" class="add-inline" data-action="add-to-group" data-id="${i(e.id)}">＋ 添加到此分组</button>`:`<button type="button" class="empty-drop" data-action="add-to-group" data-id="${i(e.id)}"><span>拖报告到这里</span><small>或点击新增</small></button>`}
                  </div>
                </section>`}).join("")}
            <button type="button" class="new-group-card" data-action="add-group"><span>＋</span><strong>新增分组</strong><small>让报告按你的方式归位</small></button>
          </div>
        </section>
      </section>
      <footer><span>CLAIR SERVICE DESK · GITHUB PAGES</span><span>自动保存到当前浏览器</span></footer>
      ${C()}
    </main>`}function p(){const t=document.getElementById("app");if(sessionStorage.getItem(w)!=="ok"){t.innerHTML=N(),P();return}const o=v&&r.reports.find(d=>d.id===v);t.innerHTML=o?M(o):R(),U()}function P(){const t=document.getElementById("login-form");t==null||t.addEventListener("submit",o=>{if(o.preventDefault(),new FormData(t).get("password")!=="2026"){const e=t.querySelector(".form-error");e.hidden=!1,e.textContent="口令不正确，请再试一次";return}sessionStorage.setItem(w,"ok"),p()})}async function S(t){var s,g;const o=t.elements.url,d=t.elements.title,e=t.querySelector('[data-action="detect-title"]'),a=t.querySelector(".field-hint"),n=o.value.trim();if(!T(n))return a.textContent="请输入完整的 http 或 https 网址","";e.disabled=!0,e.innerHTML='<span class="mini-spinner"></span>',a.textContent="正在读取网页标题…";try{const m=`https://api.microlink.io/?url=${encodeURIComponent(n)}`,l=await fetch(m,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(1e4)});if(!l.ok)throw new Error("read failed");const c=await l.json(),$=((g=(s=c==null?void 0:c.data)==null?void 0:s.title)==null?void 0:g.trim())||y(n);return d.value=$.slice(0,180),a.textContent="已识别网页标题",d.value}catch{const m=y(n);return d.value||(d.value=m),a.textContent="网页暂时无法读取，已用域名作为标题，你可以手动修改",d.value}finally{e.disabled=!1,e.textContent="识别标题"}}function U(){var d;(d=document.getElementById("search-input"))==null||d.addEventListener("input",e=>{h=e.target.value,p();const a=document.getElementById("search-input");a==null||a.focus(),a==null||a.setSelectionRange(h.length,h.length)}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",async a=>{var g,m;const n=a.currentTarget.dataset.action,s=a.currentTarget.dataset.id;if(n==="open")v=s,p();else if(n==="back")v="",u=null,p();else if(n==="lock")sessionStorage.removeItem(w),p();else if(n==="clear-search")h="",p();else if(n==="add-report")u={type:"report",mode:"create",groupId:((g=r.groups[1])==null?void 0:g.id)||((m=r.groups[0])==null?void 0:m.id)},p();else if(n==="add-to-group")u={type:"report",mode:"create",groupId:s},p();else if(n==="edit")u={type:"report",mode:"edit",reportId:s},p();else if(n==="close-modal")u=null,p();else if(n==="detect-title")await S(a.currentTarget.closest("form"));else if(n==="pin"){const l=r.reports.find(c=>c.id===s);l&&(l.pinned=!l.pinned),b(),p(),f(l!=null&&l.pinned?"报告已置顶":"已取消置顶")}else if(n==="delete"){const l=r.reports.find(c=>c.id===s);l&&confirm(`确定删除“${l.title}”吗？此操作不可撤销。`)&&(r.reports=r.reports.filter(c=>c.id!==s),v===s&&(v=""),b(),p(),f("报告已删除"))}else if(n==="add-group")u={type:"group"},p();else if(n==="rename-group"){const l=r.groups.find($=>$.id===s),c=l&&prompt("新的分组名称",l.name);c!=null&&c.trim()&&(l.name=c.trim().slice(0,60),b(),p(),f("分组名称已更新"))}else if(n==="delete-group"){const l=r.groups.find(c=>c.id===s);l&&confirm(`删除“${l.name}”？其中的报告会移到“待整理”。`)&&(r.reports.forEach(c=>{c.groupId===s&&(c.groupId="inbox")}),r.groups=r.groups.filter(c=>c.id!==s),b(),p(),f("分组已删除，报告已移到待整理"))}})}),document.querySelectorAll(".report-card").forEach(e=>{e.addEventListener("dragstart",()=>{I=e.dataset.reportId,e.classList.add("is-dragging")}),e.addEventListener("dragend",()=>{I="",e.classList.remove("is-dragging")})}),document.querySelectorAll(".group-column").forEach(e=>{e.addEventListener("dragover",a=>{a.preventDefault(),e.classList.add("is-drop-ready")}),e.addEventListener("dragleave",()=>e.classList.remove("is-drop-ready")),e.addEventListener("drop",a=>{a.preventDefault();const n=r.reports.find(s=>s.id===I);n&&(n.groupId=e.dataset.groupId,n.position=Math.max(-1,...r.reports.filter(s=>s.groupId===n.groupId).map(s=>s.position||0))+1,b(),p(),f("已移入新分组")),I=""})});const t=document.getElementById("group-form");t==null||t.addEventListener("submit",e=>{var n;e.preventDefault();const a=(n=new FormData(t).get("name"))==null?void 0:n.trim();a&&(r.groups.push({id:k("group"),name:a.slice(0,60),accent:["blue","violet","amber","green"][r.groups.length%4],position:r.groups.length}),b(),u=null,p(),f("分组已新增"))});const o=document.getElementById("report-form");o==null||o.addEventListener("submit",async e=>{e.preventDefault();const a=o.elements.url.value.trim();if(!T(a))return;const n=o.querySelector('button[type="submit"]');n.disabled=!0,n.innerHTML='<span class="mini-spinner"></span>';let s=o.elements.title.value.trim();s||(s=await S(o));const g=o.elements.groupId.value;if(u.mode==="edit"){const m=r.reports.find(l=>l.id===u.reportId);Object.assign(m,{title:s,url:a,groupId:g})}else r.reports.push({id:k("report"),groupId:g,title:s||y(a),url:a,pinned:!1,position:r.reports.filter(m=>m.groupId===g).length,createdAt:new Date().toISOString()});b(),u=null,p(),f("报告已保存")})}function B(){p()}B(document.getElementById("app"));
