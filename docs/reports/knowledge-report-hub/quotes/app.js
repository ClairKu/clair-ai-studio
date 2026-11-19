const RELATIONS = { similar: "相近观点", tension: "观点张力", complement: "互补视角" };
const BOOKMARK_KEY = "clair-ai-public-quotes-bookmarks-v1";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const esc = escapeHtml;
const star = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.4l-5.6 2.9 1.1-6.3L3 9.6l6.2-.9Z"/></svg>';
const closeIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';

export function safeSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; } catch { return ""; }
}
export function filterQuotes(quotes, filters = {}, bookmarks = new Set()) {
  const terms = String(filters.search || "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const rows = quotes.filter((q) => {
    const haystack = JSON.stringify(q).toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term)) && (!filters.speaker || q.speaker === filters.speaker) && (!filters.topic || q.topics?.includes(filters.topic)) && (!filters.relation || q.relations?.some((r) => r.type === filters.relation)) && (!filters.saved || bookmarks.has(q.id));
  });
  if (filters.sort === "newest" || filters.sort === "oldest") rows.sort((a, b) => (String(a.date || "").localeCompare(String(b.date || "")) || a.id.localeCompare(b.id)) * (filters.sort === "newest" ? -1 : 1));
  return rows;
}

if (typeof document !== "undefined") initialize();

async function initialize() {
  const app = document.querySelector("#app");
  const dialog = document.querySelector("#quote-dialog");
  const content = document.querySelector("#dialog-content");
  let data = { quotes: [] };
  let bookmarks = new Set();
  let filters = { search: "", speaker: "", topic: "", relation: "", sort: "curated", saved: false };
  let previousFocus = null;
  let toastTimer;
  try { const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); if (Array.isArray(saved)) bookmarks = new Set(saved.filter((x) => typeof x === "string")); } catch { /* Browser-local storage is optional. */ }

  function toast(text) {
    const element = document.querySelector("#toast");
    clearTimeout(toastTimer); element.textContent = text; element.hidden = false;
    toastTimer = setTimeout(() => { element.hidden = true; }, 3200);
  }
  const tags = (q) => (q.topics || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  const bookmarkButton = (q) => `<button class="icon-btn" data-bookmark="${esc(q.id)}" aria-label="${bookmarks.has(q.id) ? "取消收藏" : "收藏"}：${esc(q.speaker)}" aria-pressed="${bookmarks.has(q.id)}">${star}</button>`;
  const sourceLink = (q, label = q.source?.title || "查看原始出处") => {
    const url = safeSourceUrl(q.source?.url);
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label);
  };
  function quoteCard(q) {
    const relationCount = (q.relations || []).filter((r) => data.quotes.some((x) => x.id === r.targetId)).length;
    return `<article class="quote-card" data-quote-card="${esc(q.id)}"><div class="card-top"><div><div class="person-line">${esc(q.speaker)}</div><p class="person-role">${esc(q.speakerRole)}</p></div><time class="card-date" datetime="${esc(q.date)}">${esc(q.dateLabel || q.date)}</time></div><blockquote><p class="zh">“${esc(q.quoteZh)}”</p><p class="en" lang="en">“${esc(q.quoteEn)}”</p></blockquote><div class="tag-row">${tags(q)}</div><p class="thesis"><span class="mini-label">核心论点 · 编辑提炼</span>${esc(q.thesis)}</p><dl class="card-meta"><dt>评价对象</dt><dd>${esc(q.target)}</dd><dt>场合</dt><dd>${esc(q.occasion)}</dd><dt>出处</dt><dd>${sourceLink(q)}</dd></dl><div class="card-footer"><span class="relation-count">${relationCount ? `${relationCount} 个关联观点` : "保留完整语境"}</span><div class="card-actions">${bookmarkButton(q)}<button class="btn" data-open="${esc(q.id)}">解读与关联</button></div></div></article>`;
  }
  function renderResults() {
    const list = filterQuotes(data.quotes, filters, bookmarks);
    document.querySelector("#result-count").innerHTML = `显示 <strong>${list.length}</strong> / ${data.quotes.length} 条语录${filters.saved ? " · 仅看收藏" : ""}`;
    document.querySelector("#quote-grid").innerHTML = list.length ? list.map(quoteCard).join("") : '<div class="empty-state"><h3>没有找到匹配的语录</h3><p>试试另一位人物、主题或关键词，或清除筛选查看全部。</p><button class="btn" data-reset>清除筛选</button></div>';
    const savedButton = document.querySelector("#saved-toggle");
    savedButton.classList.toggle("is-active", filters.saved); savedButton.setAttribute("aria-pressed", String(filters.saved));
  }
  function render() {
    const first = data.quotes[0];
    const speakers = [...new Set(data.quotes.map((q) => q.speaker))];
    const topics = [...new Set(data.quotes.flatMap((q) => q.topics || []))];
    const options = (values) => values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    app.innerHTML = `<section class="page-intro"><p class="eyebrow">THE IDEAS BEHIND AI</p><h1>AI 经典语录</h1><p class="intro-copy">不止记住一句话。看见它的时代、语境，以及另一种答案。</p></section>
      ${first ? `<section class="hero" aria-label="语录精选"><article class="spotlight"><p class="eyebrow">一句话，一种理解 AI 的方式</p><blockquote><p class="zh">“${esc(first.quoteZh)}”</p><p class="en" lang="en">“${esc(first.quoteEn)}”</p></blockquote><p class="byline">${esc(first.speaker)} · ${esc(first.dateLabel || first.date)}</p><button class="btn" data-open="${esc(first.id)}">阅读完整语境</button></article><aside class="reading-guide"><h2>把金句放回语境</h2><p>原话与中文译文并列；观点、解读和关联单独标注。相近不等于认同，存在张力也不意味着双方曾直接辩论。</p><div class="stat-strip"><div><span class="stat-number">${data.quotes.length}</span><span class="stat-label">可溯源语录</span></div><div><span class="stat-number">${speakers.length}</span><span class="stat-label">人物 / 合著组</span></div></div></aside></section>` : ""}
      <section id="quote-library" aria-labelledby="library-title"><div class="library-heading"><h2 id="library-title">观点典藏</h2><p>原话有出处，解读有边界</p></div><div class="filter-panel"><div class="search-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="search" type="search" autocomplete="off" aria-label="搜索语录、人物、论点、背景与评价对象" placeholder="搜索语录、人物、论点、背景或评价对象…" /></div><div class="filter-row"><div class="filter-field"><label for="speaker">人物</label><select id="speaker"><option value="">全部人物</option>${options(speakers)}</select></div><div class="filter-field"><label for="topic">主题</label><select id="topic"><option value="">全部主题</option>${options(topics)}</select></div><div class="filter-field"><label for="relation">关联视角</label><select id="relation"><option value="">全部关联</option>${Object.entries(RELATIONS).map(([k,v]) => `<option value="${k}">${v}</option>`).join("")}</select></div><div class="filter-field"><label for="sort">排序</label><select id="sort"><option value="curated">编辑精选</option><option value="newest">时间：由近到远</option><option value="oldest">时间：由远到近</option></select></div><button class="btn" id="saved-toggle" aria-pressed="false">${star} 我的收藏</button><button class="btn" data-reset>重置</button></div></div><div class="results-line"><span id="result-count" role="status" aria-live="polite"></span><span>中文为本站译文 · 收藏仅保存在本机</span></div><div class="quote-grid" id="quote-grid"></div></section><footer class="editorial-footer"><p>${esc(data.editorialNote || "仅收录可追溯的一手原话。中文译文、论点提炼、解读及观点关联由编辑整理，不代表原作者认可。日期仅保留来源可证实的精度。")}</p><span class="update-note">整理更新 ${esc(String(data.updatedAt || "").slice(0,10))}</span></footer>`;
    document.querySelector("#search").addEventListener("input", (event) => { filters.search = event.target.value; renderResults(); });
    for (const key of ["speaker", "topic", "relation", "sort"]) document.getElementById(key).addEventListener("change", (event) => { filters[key] = event.target.value; renderResults(); });
    document.querySelector("#saved-toggle").addEventListener("click", () => { filters.saved = !filters.saved; renderResults(); });
    renderResults();
  }
  function renderDialog(q) {
    const related = (q.relations || []).map((r) => ({...r, quote:data.quotes.find((item) => item.id === r.targetId)})).filter((r) => r.quote && RELATIONS[r.type]);
    content.innerHTML = `<div class="dialog-toolbar"><span class="dialog-kicker">原话 · 语境 · 编辑解读</span><button class="icon-btn" data-close aria-label="关闭语录详情">${closeIcon}</button></div><div class="dialog-body"><div class="dialog-person"><div><h2 id="dialog-title">${esc(q.speaker)}</h2><p class="person-role">${esc(q.speakerRole)}</p></div><time class="card-date" datetime="${esc(q.date)}">${esc(q.dateLabel || q.date)}</time></div><blockquote class="dialog-quote"><p class="zh">“${esc(q.quoteZh)}”</p><p class="en" lang="en">“${esc(q.quoteEn)}”</p><span class="translation-label">英文为原文节选 · 中文为本站译文</span></blockquote><div class="tag-row">${tags(q)}</div><div class="context-grid"><div class="context-item"><h3>时间与精度</h3><p>${esc(q.dateLabel || q.date)}</p></div><div class="context-item"><h3>发表场合</h3><p>${esc(q.occasion)}</p></div><div class="context-item full"><h3>评价对象</h3><p>${esc(q.target)}</p></div><div class="context-item full"><h3>当时的背景</h3><p>${esc(q.context)}</p></div></div><section class="analysis-section"><h3>核心论点 <span class="person-role">· 编辑提炼</span></h3><p>${esc(q.thesis)}</p></section><section class="analysis-section"><h3>金句解读 <span class="person-role">· 编辑分析</span></h3><p>${esc(q.interpretation)}</p></section><section class="analysis-section caveat"><h3>补充说明与边界</h3><p>${esc(q.caveat)}</p></section><section class="source-box"><h3>回到原始出处</h3><div>${sourceLink(q)}</div><p>${esc(q.source?.type || "一手来源")} · ${esc(q.source?.locator || "请在原文中检索上述英文短句")}</p><p>出处记录的是这一版本的原话与语境，不将广泛流传的转述当作直接引文。</p></section><section><h3 class="relations-heading">把不同观点放在一起读</h3><p class="relation-explainer">以下为编辑建立的思想关联，并不表示作者曾直接回应对方。</p><div class="related-list">${related.map((r) => `<button class="related-card" data-open="${esc(r.quote.id)}"><span class="relation-type ${r.type}">${RELATIONS[r.type]}</span><span class="related-title">${esc(r.quote.speaker)} · ${esc(r.quote.thesis)}</span><span class="related-reason">${esc(r.reason)}</span></button>`).join("") || '<p class="relation-explainer">暂未建立可充分解释的关联；不为了凑对立而强行连接。</p>'}</div></section><div class="detail-actions"><button class="btn primary" data-copy="${esc(q.id)}">复制双语语录与出处</button>${bookmarkButton(q)}<a class="btn" href="#quote=${encodeURIComponent(q.id)}" data-permalink="${esc(q.id)}">复制此卡链接</a></div></div>`;
  }
  function openQuote(id, changeHash = true) {
    const q = data.quotes.find((item) => item.id === id);
    if (!q) { toast("未找到这条语录，请从语录库重新选择。"); return; }
    if (!dialog.open) previousFocus = document.activeElement;
    renderDialog(q);
    const ancillarySources = [["dateSourceUrl", "日期核验依据"], ["eventSourceUrl", "活动原始记录"], ["transcriptUrl", "官方文字稿"]]
      .map(([key, label]) => ({ url: safeSourceUrl(q.source?.[key]), label }))
      .filter(({ url }) => url)
      .map(({ url, label }) => `<p class="ancillary-source"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`).join("");
    const eventNote = q.source?.eventSourceNote ? `<p class="ancillary-source-note">${esc(q.source.eventSourceNote)}</p>` : "";
    content.querySelector(".source-box").insertAdjacentHTML("beforeend", ancillarySources + eventNote);
    content.querySelector(".detail-actions").insertAdjacentHTML("beforeend", '<button class="btn" data-print>打印语录卡</button>');
    if (!dialog.open) { dialog.showModal(); document.body.style.overflow = "hidden"; }
    dialog.scrollTop = 0; content.querySelector("[data-close]").focus();
    if (changeHash) history.replaceState(null, "", `#quote=${encodeURIComponent(id)}`);
  }
  function closeQuote(clearHash = true) {
    if (dialog.open) dialog.close();
    document.body.style.overflow = "";
    if (clearHash && location.hash.startsWith("#quote=")) history.replaceState(null, "", location.pathname + location.search);
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function syncHash() {
    if (location.hash.startsWith("#quote=")) { try { openQuote(decodeURIComponent(location.hash.slice(7)), false); } catch { toast("语录链接格式有误。"); } }
    else closeQuote(false);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("已复制，可直接引用并保留出处。"); }
    catch { const textarea = document.createElement("textarea"); textarea.value = text; textarea.setAttribute("aria-label", "待复制的语录"); textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0"; (dialog.open ? content : document.body).append(textarea); textarea.select(); let copied = false; try { copied = document.execCommand("copy"); } catch { /* No clipboard permission. */ } textarea.remove(); toast(copied ? "已复制。" : "浏览器未允许复制，请选择卡片文字手动复制。"); }
  }
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-open],[data-close],[data-reset],[data-bookmark],[data-copy],[data-permalink],[data-retry],[data-print]");
    if (!button) return;
    if (button.hasAttribute("data-open")) openQuote(button.dataset.open);
    if (button.hasAttribute("data-close")) closeQuote();
    if (button.hasAttribute("data-retry")) load();
    if (button.hasAttribute("data-print")) window.print();
    if (button.hasAttribute("data-reset")) { filters = {search:"",speaker:"",topic:"",relation:"",sort:"curated",saved:false}; for (const key of ["search","speaker","topic","relation","sort"]) document.getElementById(key).value = filters[key]; renderResults(); }
    if (button.hasAttribute("data-bookmark")) {
      const id = button.dataset.bookmark;
      if (bookmarks.has(id)) bookmarks.delete(id); else bookmarks.add(id);
      let persisted = true;
      try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...bookmarks])); } catch { persisted = false; }
      renderResults();
      if (dialog.open) { const q = data.quotes.find((x) => x.id === id); if (q) { button.setAttribute("aria-pressed", String(bookmarks.has(id))); button.setAttribute("aria-label", `${bookmarks.has(id) ? "取消收藏" : "收藏"}：${q.speaker}`); } }
      toast(persisted ? bookmarks.has(id) ? "已加入本机收藏。" : "已取消收藏。" : "当前浏览器无法保存收藏，本次打开期间仍可使用。");
    }
    if (button.hasAttribute("data-copy")) { const q = data.quotes.find((x) => x.id === button.dataset.copy); if (q) await copy(`“${q.quoteZh}”\n“${q.quoteEn}”\n— ${q.speaker} · ${q.dateLabel || q.date}\n${q.occasion}\n出处：${q.source.title}\n${safeSourceUrl(q.source.url)}\n定位：${q.source.locator}\n中文为本站译文，英文为原文节选。`); }
    if (button.hasAttribute("data-permalink")) { event.preventDefault(); await copy(`${location.origin}${location.pathname}#quote=${encodeURIComponent(button.dataset.permalink)}`); }
  });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeQuote(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeQuote(); } });
  window.addEventListener("hashchange", syncHash);
  async function load() {
    try {
      const response = await fetch("../data/ai-classic-quotes.json", {cache:"no-cache"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      if (!Array.isArray(data.quotes)) throw new Error("Invalid quote data");
      render(); syncHash();
    } catch {
      app.innerHTML = '<section class="page-intro"><p class="eyebrow">THE IDEAS BEHIND AI</p><h1>AI 经典语录</h1></section><section class="empty-state"><h2>语录暂时未能载入</h2><p>请检查网络后重试。你的本机收藏不会因此被清除。</p><button class="btn primary" data-retry>重新加载</button> <a class="btn" href="../">返回行业情报站</a></section>';
    }
  }
  await load();
}
