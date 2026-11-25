/* Only the owner's explicitly released recent-report batch is handled here. */
(() => {
  'use strict';
  const released = new Set(["pm-ecology-2026-11-24","pm-ai-transformation-2026-11-24","strategy-dossier-2026-11-24","private-wealth-memory-2026-11-24","qieman-companionship-wealth-memory-2026-11-23","qieman-2027-product-strategy-2026-11-23","qieman-2027-advisory-ai-plan-2026-11-23","qieman-wealth-dossier-proposal-2026-11-23","qieman-2026-code-investment-review-2026-11-23","qieman-2026-product-review-2026-11-23","qieman-2026-review-2027-development-2026-11-23","qieman-2027-product-execution-plan-2026-11-23","clair-2027-product-team-plan-2026-11-20","qieman-team-capability-memo-2026-11-20","qieman-2027-team-work-plan-2026-11-20","yingmi-ai-capability-standalone-2026-11-20","dong-dezhi-investment-notes-2026-11-19","r9aihub-product-review-2026-11-19","recent-task-closeout-snapshot-2026-11-19","yingmi-qieman-casebook-2026-11-19","yingmi-ai-build-report-2026-11-19","yingmi-token-usage-2026-11-19","qieman-strategy-risk-2026-11-19","advisor-qualifications-exams-2026-11-19","strategy-api-history-audit-2026-11-18","qieman-strategy-conformance-2026-11-19","qieman-strategy-catalog-2026-11-19","qwen-first-investor-personas-2026-11-18","qieman-xiaogu-qwen-a2a-deck-2026-11-18","oap-strategy-groups-audit-2026-11-18","qwen-app-deep-research-2026-11-18","qwen-cooperation-six-questions-2026-11-18","private-fund-single-page-series-2026-11-17","private-fund-product-pages-2026-11-17","huatai-ai-research-2026-11-17","recent-report-attachment-01-2026-11-25","recent-report-attachment-02-2026-11-25","recent-report-attachment-03-2026-11-25","recent-report-attachment-04-2026-11-25","recent-report-attachment-05-2026-11-25","recent-report-attachment-06-2026-11-25","recent-report-attachment-07-2026-11-25","recent-report-attachment-08-2026-11-25","recent-report-attachment-09-2026-11-25","recent-report-attachment-10-2026-11-25","recent-reports-2026-11-24","r9-full-results-2026-11-19"]);
  const root = new URL('./', document.currentScript.src);
  const direct = id => new URL('reports/' + id + '/?access=direct-20261125', root);
  const style = document.createElement('style');
  style.textContent = [...released].map(id => '[data-report-id="' + id + '"] [data-action="toggle-report-access"],[data-report-id="' + id + '"] .report-access-note').join(',') + '{display:none!important}';
  document.head.append(style);
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-action][data-id]');
    if (!button || !released.has(button.dataset.id)) return;
    const action = button.dataset.action;
    if (!['open','open-browser','download-report','toggle-report-access','copy-production-url'].includes(action)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (action === 'toggle-report-access') return;
    const url = direct(button.dataset.id);
    if (action === 'copy-production-url') { void navigator.clipboard.writeText(url.href); return; }
    if (action === 'download-report') {
      if (button.dataset.id === 'private-wealth-memory-2026-11-24' || button.dataset.id === 'recent-reports-2026-11-24' || button.dataset.id === 'r9-full-results-2026-11-19') {
        const anchor = document.createElement('a'); anchor.href = url.href; anchor.download = button.dataset.id + '.html'; anchor.click(); return;
      }
      url.searchParams.set('download','1');
    }
    window.open(url.href, '_blank', 'noopener,noreferrer');
  }, true);
  let scheduled = false;
  function refresh() {
    scheduled = false;
    for (const card of document.querySelectorAll('[data-report-id]')) {
      if (!released.has(card.dataset.reportId)) continue;
      const title = card.querySelector('.report-copy strong');
      if (title?.textContent.includes('私密版')) title.textContent = title.textContent.replaceAll('私密版','直接阅读版');
    }
    for (const anchor of document.querySelectorAll('a[href]')) {
      let url; try { url = new URL(anchor.href); } catch { continue; }
      if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname + 'reports/')) continue;
      const id = url.pathname.slice((root.pathname + 'reports/').length).split('/')[0];
      if (!released.has(id) || url.searchParams.get('access') === 'direct-20261125') continue;
      url.searchParams.set('access','direct-20261125'); anchor.href = url.href;
    }
  }
  new MutationObserver(() => { if (!scheduled) { scheduled = true; queueMicrotask(refresh); } }).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();
