export const RELATIONS = { similar: "相近观点", opposed: "相反观点", tension: "观点张力", complement: "互补视角" };
const BOOKMARK_KEY = "clair-ai-public-quotes-bookmarks-v1";
const esc = (value = "") => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const star = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.4l-5.6 2.9 1.1-6.3L3 9.6l6.2-.9Z"/></svg>';
const defaults = { search:"", speaker:"", organization:"", topic:"", relation:"", era:"", sort:"newest", saved:false };
export function safeSourceUrl(value) { try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; } }
export function filterQuotes(quotes, filters = {}, bookmarks = new Set()) {
  const terms = String(filters.search || "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const rows = quotes.filter((q) => terms.every((term) => JSON.stringify(q).toLocaleLowerCase().includes(term))
    && (!filters.speaker || q.speaker === filters.speaker || q.speakerId === filters.speaker)
    && (!filters.organization || q.organization === filters.organization || q.organizationId === filters.organization)
    && (!filters.topic || q.topics?.includes(filters.topic)) && (!filters.era || q.era === filters.era)
    && (!filters.relation || q.relations?.some((r) => r.type === filters.relation)) && (!filters.saved || bookmarks.has(q.id)));
  if (filters.sort === "newest" || filters.sort === "oldest") rows.sort((a,b) => (String(a.date || "").localeCompare(String(b.date || "")) || a.id.localeCompare(b.id)) * (filters.sort === "newest" ? -1 : 1));
  return rows;
}
export function filterComparisons(comparisons, quotes, filters = {}, bookmarks = new Set()) {
  const terms = String(filters.search || "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const byId = new Map(quotes.map((q) => [q.id,q]));
  return comparisons.filter((c) => {
    const pair = [byId.get(c.leftId),byId.get(c.rightId)];
    if (pair.some((q) => !q)) return false;
    return (!filters.relation || c.type === filters.relation)
      && (!filters.topic || c.topic === filters.topic || pair.some((q) => q.topics?.includes(filters.topic)))
      && terms.every((t) => JSON.stringify([c,...pair]).toLocaleLowerCase().includes(t))
      && (!filters.speaker || pair.some((q) => q.speaker === filters.speaker || q.speakerId === filters.speaker))
      && (!filters.organization || pair.some((q) => q.organization === filters.organization || q.organizationId === filters.organization))
      && (!filters.era || pair.some((q) => q.era === filters.era)) && (!filters.saved || pair.some((q) => bookmarks.has(q.id)));
  });
}

// Mounted by the hub, with scoped DOM listeners and explicit cleanup.
export function mountQuoteModule(root, options = {}) {
  const data = options.data || { quotes:[], comparisons:[] }, quotes = data.quotes || [], comparisons = data.comparisons || [];
  const view = options.view === "comparisons" ? "comparisons" : "quotes";
  const uiState = options.state || {};
  const filters = uiState.filters = { ...defaults, ...uiState.filters, search:options.search ?? uiState.filters?.search ?? "" };
  const byId = new Map(quotes.map((q) => [q.id,q])), controller = new AbortController();
  let bookmarks = new Set(), priorFocus = null, timer, disposed = false, activeQuote = null, previousOverflow = "";
  try { const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); if (Array.isArray(saved)) bookmarks = new Set(saved.filter((x) => typeof x === "string")); } catch { /* Optional local persistence. */ }
  root.classList.add("ai-quote-module");
  const select = (value) => root.querySelector(value);
  const sourceLink = (source, label = source?.title || "查看原始出处") => { const url=safeSourceUrl(source?.url);return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:esc(label); };
  const tags = (q) => (q.topics || []).map((t) => `<span class="q-tag">${esc(t)}</span>`).join("");
  const bookmarkButton = (q) => `<button class="q-icon-btn" data-q-bookmark="${esc(q.id)}" aria-label="${bookmarks.has(q.id) ? "取消收藏" : "收藏"}：${esc(q.speaker)}" aria-pressed="${bookmarks.has(q.id)}">${star}</button>`;
  const languageNote = (q) => q.originalLanguage === "zh" ? "中文为原文节选 · 英文为本站译文" : "英文为原文节选 · 中文为本站译文";
  const quoteText = (q, compact = false) => `<blockquote class="q-quote ${compact ? "q-compact" : ""}"><p class="q-zh">“${esc(q.quoteZh)}”</p><p class="q-en" lang="en">“${esc(q.quoteEn)}”</p><span class="q-language">${languageNote(q)}</span></blockquote>`;
  const date = (q) => `<time class="q-date" datetime="${esc(q.date)}">${esc(q.dateLabel || q.date || "日期未确认")}</time>`;
  function toast(text) { const el=select(".q-toast");if(!el)return;(activeQuote?select(".q-dialog"):root).append(el);clearTimeout(timer);el.textContent=text;el.hidden=false;timer=setTimeout(()=>{if(!disposed)el.hidden=true;},3200); }
  function quoteCard(q) {
    const links=(q.relations||[]).filter((r)=>byId.has(r.targetId)).length;
    return `<article class="q-card" data-quote-card="${esc(q.id)}"><div class="q-card-top"><div><h3>${esc(q.speaker)}</h3><p class="q-role">${esc(q.organization||q.speakerRole)}</p></div>${date(q)}</div>${quoteText(q)}<div class="q-tags">${tags(q)}</div><p class="q-thesis"><span>核心论点 · 编辑提炼</span>${esc(q.thesis)}</p><dl class="q-metadata"><dt>评价对象</dt><dd>${esc(q.target)}</dd><dt>场合</dt><dd>${esc(q.occasion)}</dd><dt>出处</dt><dd>${sourceLink(q.source)}</dd></dl><div class="q-card-footer"><span>${links?`${links} 个关联观点`:"完整语境与边界"}</span><div>${bookmarkButton(q)}<button class="q-btn" data-q-open="${esc(q.id)}">解读与关联</button></div></div></article>`;
  }
  function comparisonSide(q) { return `<div class="q-comparison-side"><div class="q-card-top"><div><h3>${esc(q.speaker)}</h3><p class="q-role">${esc(q.organization||q.speakerRole)}</p></div>${date(q)}</div>${quoteText(q,true)}<p class="q-target"><b>评价对象</b> ${esc(q.target)}</p><div class="q-comparison-source">${sourceLink(q.source)}<button class="q-btn" data-q-open="${esc(q.id)}">完整解读</button></div></div>`; }
  function comparisonCard(c) {
    const left=byId.get(c.leftId),right=byId.get(c.rightId);if(!left||!right)return "";
    return `<article class="q-comparison-card" data-comparison-card="${esc(c.id)}"><header><span class="q-relation-type ${esc(c.type)}">${esc(RELATIONS[c.type]||"观点关联")}</span><span class="q-comparison-topic">${esc(c.topic)}</span><h3>${esc(c.title)}</h3></header><div class="q-comparison-pair">${comparisonSide(left)}${comparisonSide(right)}</div><div class="q-comparison-analysis"><section><h4>共同议题与前提</h4><p>${esc(c.commonGround)}</p></section><section><h4>${c.type==="similar"?"相近之处与细微差异":c.type==="complement"?"各自补充了什么":"关键分歧"}</h4><p>${esc(c.divide)}</p></section><section><h4>放在一起怎么读</h4><p>${esc(c.readingGuide)}</p></section></div><p class="q-comparison-caveat"><b>边界</b> ${esc(c.caveat)}</p><p class="q-editorial-label">编辑建立的观点对照，不表示双方曾直接对话或辩论。</p></article>`;
  }
  function timelineMarkup(rows) {
    const timeline=[...rows].sort((a,b)=>(String(a.date||"").localeCompare(String(b.date||""))||a.id.localeCompare(b.id))*(filters.sort==="newest"?-1:1));
    return `<section class="q-timeline" aria-label="人物观点时间线"><div class="q-timeline-intro"><h3>${esc(timeline[0]?.personName||timeline[0]?.speaker||filters.speaker)}的观点时间线</h3><p>按所标事件／发表时间排列，保留原始日期精度。跨时期观点不自动构成立场转变，请结合当时的评价对象与适用范围；合著条目保留完整署名。</p></div>${timeline.map((q)=>`<div class="q-timeline-item"><div class="q-timeline-date">${date(q)}</div>${quoteCard(q)}</div>`).join("")}</section>`;
  }
  function renderResults() {
    const rows=view==="comparisons"?filterComparisons(comparisons,quotes,filters,bookmarks):filterQuotes(quotes,filters,bookmarks),total=view==="comparisons"?comparisons.length:quotes.length;
    select(".q-result-count").textContent=`显示 ${rows.length} / ${total} ${view==="comparisons"?"组对照":"条语录"}${filters.saved?" · 仅看收藏":""}`;
    const grid=select(".q-results");grid.className=`q-results ${view==="comparisons"?"q-comparison-grid":filters.speaker?"":"q-grid"}`;
    grid.innerHTML=rows.length?(view==="comparisons"?rows.map(comparisonCard).join(""):filters.speaker?timelineMarkup(rows):rows.map(quoteCard).join("")):'<div class="q-empty"><h3>没有找到匹配的观点</h3><p>试试另一位人物、机构或关键词，或清除筛选查看全部。</p><button class="q-btn" data-q-reset>清除筛选</button></div>';
    const saved=select("[data-q-saved]");saved.setAttribute("aria-pressed",String(filters.saved));saved.classList.toggle("is-active",filters.saved);
  }
  function render() {
    const people=[...new Map(quotes.map((q)=>[q.speakerId||q.speaker,q.personName||q.speaker])).entries()];
    const orgs=[...new Map(quotes.filter((q)=>q.organization).map((q)=>[q.organizationId||q.organization,q.organization])).entries()];
    const topics=[...new Set([...quotes.flatMap((q)=>q.topics||[]),...comparisons.map((c)=>c.topic).filter(Boolean)])];
    const optionList=(values,current)=>values.map((v)=>`<option value="${esc(v)}" ${v===current?"selected":""}>${esc(v)}</option>`).join("");
    const keyedOptions=(values,current)=>values.map(([id,label])=>`<option value="${esc(id)}" ${id===current?"selected":""}>${esc(label)}</option>`).join("");
    const checkedAt=data.dailyUpdate?.lastVerifiedAt||data.coverage?.checkedAt||data.updatedAt||"";
    const updateState=data.dailyUpdate?.note||"以最后核验时间为准，非实时监测";
    const schedule=data.dailyUpdate?.scheduleLabel||"按核验批次更新";
    root.innerHTML=`<header class="q-module-intro"><p class="q-eyebrow">AI INTELLIGENCE · IDEAS & PERSPECTIVES</p><h1>${view==="comparisons"?"观点对照":"人物语录"}</h1><p class="q-lead">${view==="comparisons"?"相近在哪里，分歧在哪里。把原话并排，把判断留在语境里。":"不止记住一句话。沿着人物、机构与时间，理解 AI 思想如何形成。"}</p><div class="q-status-strip"><span>${quotes.length} 条语录</span><span>${people.length} 位人物（合著保留双署名）</span><span>${comparisons.length} 组观点对照</span><span>核验截至 ${esc(String(checkedAt).slice(0,10)||"未标注")}</span></div></header><nav class="q-section-tabs" aria-label="观点栏目"><button class="${view==="quotes"?"is-active":""}" data-q-view="quotes">人物语录</button><button class="${view==="comparisons"?"is-active":""}" data-q-view="comparisons">观点对照</button><p>原话有出处，解读有边界</p></nav><section class="q-filter-panel" aria-label="观点筛选"><label class="q-search-label"><span class="q-sr-only">搜索语录、人物、机构、场合与论点</span><input type="search" data-q-filter="search" value="${esc(filters.search)}" placeholder="搜索语录、人物、机构、场合、评价对象或论点…" /></label><div class="q-filter-row"><label>人物<select data-q-filter="speaker"><option value="">全部人物</option>${keyedOptions(people,filters.speaker)}</select></label><label>机构<select data-q-filter="organization"><option value="">全部机构</option>${keyedOptions(orgs,filters.organization)}</select></label><label>主题<select data-q-filter="topic"><option value="">全部主题</option>${optionList(topics,filters.topic)}</select></label><label>时期<select data-q-filter="era"><option value="">全部时期</option><option value="classic" ${filters.era==="classic"?"selected":""}>经典观点</option><option value="contemporary" ${filters.era==="contemporary"?"selected":""}>近年观点</option></select></label><label>关联<select data-q-filter="relation"><option value="">全部关联</option>${Object.entries(RELATIONS).map(([k,v])=>`<option value="${k}" ${filters.relation===k?"selected":""}>${v}</option>`).join("")}</select></label>${view==="quotes"?`<label>排序<select data-q-filter="sort"><option value="curated" ${filters.sort==="curated"?"selected":""}>编辑精选</option><option value="newest" ${filters.sort==="newest"?"selected":""}>时间由近到远</option><option value="oldest" ${filters.sort==="oldest"?"selected":""}>时间由远到近</option></select></label>`:""}<button class="q-btn" data-q-saved aria-pressed="false">${star} 我的收藏</button><button class="q-btn" data-q-reset>重置</button></div></section><div class="q-results-line"><span class="q-result-count" role="status" aria-live="polite"></span><span>选择人物查看时间线 · 收藏只存在本机</span></div><div class="q-results"></div><footer class="q-editorial-footer"><p>${esc(data.editorialNote||"仅收录可追溯的公开一手原话。译文、论点、解读与关联为编辑整理，不代表原作者认可。")}</p><p><strong>每日核验状态</strong> ${esc(schedule)} · ${esc(updateState)}。近年观点按原始发表时间显示，不将今日核验误作今日发言。</p></footer><dialog class="q-dialog" aria-labelledby="q-dialog-title"><div class="q-dialog-content"></div></dialog><div class="q-toast" role="status" aria-live="polite" hidden></div>`;
    renderResults();
  }
  function renderCoverage() {
    const organizations = data.coverage?.organizations || [];
    if (!organizations.length) return;
    const labels = { covered: "已收录", partial: "部分收录", gap: "待补一手来源" };
    const markup = `<details class="q-coverage"><summary>人物与机构覆盖状态 · 查看收录范围及缺口</summary><p>覆盖仅指本语录库已核验的材料，不代表穷尽机构或人物的公开观点。</p><div class="q-coverage-grid">${organizations.map((org) => `<article><h3>${esc(org.name)} <span class="${esc(org.status)}">${esc(labels[org.status] || "待核验")}</span></h3><p>${esc(org.note)}</p>${(org.sourceUrls || []).filter(safeSourceUrl).map((url,index) => sourceLink({url},`来源 ${index+1}`)).join(" · ")}</article>`).join("")}</div></details>`;
    select(".q-module-intro").insertAdjacentHTML("afterend", markup);
  }
  function closeQuote(updateHash=true) {
    const dialog=select(".q-dialog");if(dialog?.open)dialog.close();if(activeQuote)document.body.style.overflow=previousOverflow;activeQuote=null;
    if(updateHash)history.replaceState(null,"",`${location.pathname}${location.search}#${view}`);
    if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});
  }
  function openQuote(id,updateHash=true) {
    const q=byId.get(id);if(!q){toast("未找到这条语录，请重新选择。");return;}
    const dialog=select(".q-dialog"),content=select(".q-dialog-content");if(!dialog.open){priorFocus=document.activeElement;previousOverflow=document.body.style.overflow;}activeQuote=q;
    const related=(q.relations||[]).map((r)=>({...r,quote:byId.get(r.targetId)})).filter((r)=>r.quote&&RELATIONS[r.type]);
    const sourceExtra=[["dateSourceUrl","日期核验依据"],["eventSourceUrl","活动原始记录"],["transcriptUrl","官方文字稿"]].filter(([key])=>safeSourceUrl(q.source?.[key])).map(([key,label])=>sourceLink({url:q.source[key]},label)).join(" · ");
    content.innerHTML=`<div class="q-dialog-toolbar"><span>原话 · 语境 · 编辑解读</span><button class="q-icon-btn" data-q-close aria-label="关闭语录详情">×</button></div><div class="q-dialog-body"><div class="q-card-top"><div><h2 id="q-dialog-title">${esc(q.speaker)}</h2><p class="q-role">${esc(q.speakerRole)}${q.organization?` · ${esc(q.organization)}`:""}</p></div>${date(q)}</div>${quoteText(q)}<div class="q-tags">${tags(q)}</div><div class="q-context"><div><h3>时间与精度</h3><p>${esc(q.dateLabel||q.date)}</p></div><div><h3>发表场合</h3><p>${esc(q.occasion)}</p></div><div><h3>评价对象</h3><p>${esc(q.target)}</p></div><div><h3>当时的背景</h3><p>${esc(q.context)}</p></div></div><section class="q-analysis"><h3>核心论点 · 编辑提炼</h3><p>${esc(q.thesis)}</p></section><section class="q-analysis"><h3>金句解读 · 编辑分析</h3><p>${esc(q.interpretation)}</p></section><section class="q-analysis q-caveat"><h3>补充说明与边界</h3><p>${esc(q.caveat)}</p></section><section class="q-source-box"><h3>回到原始出处</h3>${sourceLink(q.source)}<p>${esc(q.source?.type||"一手来源")} · ${esc(q.source?.locator)}</p>${sourceExtra?`<p>${sourceExtra}</p>`:""}${q.source?.eventSourceNote?`<p>${esc(q.source.eventSourceNote)}</p>`:""}${q.verifiedAt?`<p>本条核验：${esc(String(q.verifiedAt).slice(0,10))}</p>`:""}</section><section class="q-related-section"><h3>把不同观点放在一起读</h3><p class="q-editorial-label">以下为编辑关联，不表示作者曾直接回应对方。</p><div class="q-related-list">${related.map((r)=>`<button class="q-related-card" data-q-open="${esc(r.quote.id)}"><span class="q-relation-type ${esc(r.type)}">${RELATIONS[r.type]}</span><strong>${esc(r.quote.speaker)} · ${esc(r.quote.thesis)}</strong><span>${esc(r.reason)}</span></button>`).join("")||'<p>尚无充分依据建立关联。</p>'}</div></section><div class="q-detail-actions"><button class="q-btn q-primary" data-q-copy>复制双语与出处</button>${bookmarkButton(q)}<button class="q-btn" data-q-permalink>复制卡片链接</button><button class="q-btn" data-q-print>打印语录卡</button><button class="q-btn" data-q-person="${esc(q.speakerId||q.speaker)}">人物时间线</button></div></div>`;
    const evidenceNotes = [["publishedAt","原页发布日期"],["accessNote","来源访问与核验说明"],["dateEvidence","日期证据"]].filter(([key])=>q.source?.[key]);
    if(evidenceNotes.length)select(".q-source-box").insertAdjacentHTML("beforeend",evidenceNotes.map(([key,label])=>`<p><b>${label}</b> ${esc(q.source[key])}</p>`).join(""));
    if(!dialog.open){dialog.showModal();document.body.style.overflow="hidden";}dialog.scrollTop=0;select("[data-q-close]").focus();
    if(updateHash)history.replaceState(null,"",`#${view}?quote=${encodeURIComponent(id)}`);
  }
  async function copy(text) {
    try{await navigator.clipboard.writeText(text);toast("已复制，请保留原始出处。");}catch{const textarea=document.createElement("textarea");textarea.value=text;textarea.style.cssText="position:fixed;top:0;left:0;opacity:0";(activeQuote?select(".q-dialog-content"):root).append(textarea);textarea.select();let ok=false;try{ok=document.execCommand("copy");}catch{}textarea.remove();toast(ok?"已复制。":"浏览器未允许复制，请选择文字手动复制。");}
  }
  function setSearch(value){filters.search=value;const input=select('[data-q-filter="search"]');if(input)input.value=value;renderResults();}
  function changeFilter(event){const el=event.target.closest("[data-q-filter]");if(!el)return;if(event.type==="input"&&el.dataset.qFilter!=="search")return;if(event.type==="change"&&el.dataset.qFilter==="search")return;filters[el.dataset.qFilter]=el.value;if(el.dataset.qFilter==="search")options.onSearch?.(el.value);renderResults();}
  root.addEventListener("input",changeFilter,{signal:controller.signal});root.addEventListener("change",changeFilter,{signal:controller.signal});
  root.addEventListener("click",async(event)=>{
    const button=event.target.closest("button");if(!button)return;
    if(button.hasAttribute("data-q-open"))openQuote(button.dataset.qOpen);
    if(button.hasAttribute("data-q-close"))closeQuote();
    if(button.hasAttribute("data-q-view")){closeQuote(false);options.onNavigate?.(button.dataset.qView);}
    if(button.hasAttribute("data-q-person")){filters.speaker=button.dataset.qPerson;closeQuote();if(view==="comparisons")options.onNavigate?.("quotes");else{select('[data-q-filter="speaker"]').value=filters.speaker;renderResults();root.scrollIntoView({block:"start"});}}
    if(button.hasAttribute("data-q-reset")){Object.assign(filters,defaults);options.onSearch?.("");render();renderCoverage();bindDialog();}
    if(button.hasAttribute("data-q-saved")){filters.saved=!filters.saved;renderResults();}
    if(button.hasAttribute("data-q-bookmark")){const id=button.dataset.qBookmark;if(bookmarks.has(id))bookmarks.delete(id);else bookmarks.add(id);let saved=true;try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify([...bookmarks]));}catch{saved=false;}renderResults();if(activeQuote){button.setAttribute("aria-pressed",String(bookmarks.has(id)));button.setAttribute("aria-label",`${bookmarks.has(id)?"取消收藏":"收藏"}：${activeQuote.speaker}`);}toast(saved?(bookmarks.has(id)?"已加入本机收藏。":"已取消收藏。") :"无法持久保存，本次打开期间仍可使用收藏。");}
    if(button.hasAttribute("data-q-copy")&&activeQuote){const q=activeQuote;await copy(`“${q.quoteZh}”\n“${q.quoteEn}”\n— ${q.speaker} · ${q.dateLabel||q.date}\n${q.occasion}\n出处：${q.source?.title}\n${safeSourceUrl(q.source?.url)}\n定位：${q.source?.locator}\n${languageNote(q)}。`);}
    if(button.hasAttribute("data-q-permalink")&&activeQuote)await copy(`${location.origin}${location.pathname}#quotes?quote=${encodeURIComponent(activeQuote.id)}`);
    if(button.hasAttribute("data-q-print")){document.body.classList.add("q-printing");try{window.print();}finally{document.body.classList.remove("q-printing");}}
  },{signal:controller.signal});
  function bindDialog(){const d=select(".q-dialog");d.addEventListener("cancel",(e)=>{e.preventDefault();closeQuote();},{signal:controller.signal});d.addEventListener("click",(e)=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeQuote();}},{signal:controller.signal});}
  render();renderCoverage();bindDialog();
  const raw=location.hash.slice(1);let initialId="";try{initialId=raw.startsWith("quote=")?decodeURIComponent(raw.slice(6)):new URLSearchParams(raw.split("?")[1]||"").get("quote")||"";}catch{}
  if(initialId)openQuote(initialId,false);
  return {setSearch,openQuote,cleanup(){disposed=true;clearTimeout(timer);controller.abort();closeQuote(false);root.classList.remove("ai-quote-module");}};
}
