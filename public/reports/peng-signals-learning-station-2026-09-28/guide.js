const readerState = { topic: "全部", selected: null };
const readerItems = resources.filter(item => item.id !== "internal-inventory").sort((a, b) => b.date.localeCompare(a.date));
const readerTopics = ["全部", ...new Set(readerItems.map(item => item.topic))];
const localSources = window.PENG_LOCAL_SOURCES || {};
const localTranslations = window.PENG_LOCAL_TRANSLATIONS || {};
const timelineList = document.querySelector("#timeline-list");
const readerTags = document.querySelector("#reader-tags");
const readerNotes = document.querySelector("#reader-notes");
const readerSource = document.querySelector("#reader-source");
const timelineCount = document.querySelector("#timeline-count");

function readerSourceUrl(item) {
  return localSources[item.id] || item.sourceUrl || item.secondaryUrl || "";
}

function sourceKind(item) {
  if (localSources[item.id]) return "本机原件";
  if (item.sourceUrl || item.secondaryUrl) return "官方出处";
  return "本机索引";
}

function renderReaderTags() {
  readerTags.innerHTML = readerTopics.map(topic => `<button type="button" class="${topic === readerState.topic ? "active" : ""}" data-reader-topic="${escapeHtml(topic)}">${escapeHtml(topic)}</button>`).join("");
  readerTags.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    readerState.topic = button.dataset.readerTopic;
    renderReaderTags();
    renderTimeline();
  }));
}

function renderTimeline() {
  const visible = readerItems.filter(item => readerState.topic === "全部" || item.topic === readerState.topic);
  timelineCount.textContent = visible.length;
  timelineList.innerHTML = visible.map(item => `<button type="button" class="timeline-item ${item.id === readerState.selected ? "active" : ""}" data-reader-id="${item.id}">
    <time>${item.date}</time>
    <span>${escapeHtml(item.topic)}</span>
    <b>${escapeHtml(item.title)}</b>
    <small>${sourceKind(item)} · ${escapeHtml(item.source)}</small>
  </button>`).join("");
  timelineList.querySelectorAll("button").forEach(button => button.addEventListener("click", () => selectReaderItem(button.dataset.readerId)));
}

function selectReaderItem(id) {
  const item = readerItems.find(entry => entry.id === id);
  if (!item) return;
  readerState.selected = id;
  renderTimeline();
  const facts = item.metrics.map(([value, label]) => `<div><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`).join("");
  readerNotes.innerHTML = `<header class="note-head" style="--accent:${item.accent}">
    <div><span>${escapeHtml(item.topic)}</span><time>${item.date}</time></div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.original)}</p>
  </header>
  <div class="reader-tabbar" role="tablist">
    <button class="active" type="button" data-reader-tab="guide">导读</button>
    <button type="button" data-reader-tab="translation">翻译与重点</button>
    <button type="button" data-reader-tab="action">盈米启示</button>
  </div>
  <section class="reader-panel" data-reader-panel="guide">
    <p class="lead-note">${escapeHtml(item.summary)}</p>
    <div class="reader-facts">${facts}</div>
    <p class="evidence-caption">证据关系：${escapeHtml(item.relation)}</p>
  </section>
  <section class="reader-panel" data-reader-panel="translation" hidden>
    <div class="translation-state">${escapeHtml(item.translation)}</div>
    <ol>${item.takeaways.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ol>
  </section>
  <section class="reader-panel" data-reader-panel="action" hidden>
    <ol>${item.yingmi.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ol>
    <p class="evidence-caption">以上为基于材料的产品与经营启示，不代表已决策或已上线。</p>
  </section>`;
  readerNotes.querySelectorAll("[data-reader-tab]").forEach(button => button.addEventListener("click", () => {
    readerNotes.querySelectorAll("[data-reader-tab]").forEach(tab => tab.classList.toggle("active", tab === button));
    readerNotes.querySelectorAll("[data-reader-panel]").forEach(panel => { panel.hidden = panel.dataset.readerPanel !== button.dataset.readerTab; });
  }));
  renderSource(item);
}

function renderSource(item) {
  const url = readerSourceUrl(item);
  const type = sourceKind(item);
  const translationUrl = localTranslations[item.id] || "";
  if (!url) {
    readerSource.innerHTML = `<div class="source-placeholder"><span>${type}</span><b>${escapeHtml(item.source)}</b><p>${escapeHtml(item.originalState)}</p><small>该原件未公开托管，请在本机私有清单中打开。</small></div>`;
    return;
  }
  const isPdf = /\.pdf(?:$|[?#])/i.test(url);
  readerSource.innerHTML = `<header class="source-head"><div><span>${type}</span><b>${escapeHtml(item.source)}</b></div><div class="source-links">${translationUrl ? `<a href="${escapeHtml(translationUrl)}" target="_blank" rel="noopener">打开译本 ↗</a>` : ""}<a href="${escapeHtml(url)}" target="_blank" rel="noopener">打开原件 ↗</a></div></header>
    ${isPdf ? `<iframe title="${escapeHtml(item.original)}" src="${escapeHtml(url)}#view=FitH"></iframe>` : `<div class="web-source-card"><span>ORIGINAL SOURCE</span><b>${escapeHtml(item.original)}</b><p>发布机构网页可能禁止站内嵌入，请使用“打开原件”。</p><a href="${escapeHtml(url)}" target="_blank" rel="noopener">前往官方页面 ↗</a></div>`}`;
}

renderReaderTags();
renderTimeline();
if (readerItems.length) selectReaderItem(readerItems[0].id);
