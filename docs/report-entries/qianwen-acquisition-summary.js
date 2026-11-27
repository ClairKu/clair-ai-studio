(() => {
  const cardSelector = '.report-card[data-report-id="qianwen-user-acquisition-dashboard"]';
  function addLink() {
    document.querySelectorAll(cardSelector).forEach(card => {
      if (card.querySelector('[data-qianwen-summary]')) return;
      const actions = card.querySelector('.card-actions');
      if (!actions) return;
      const link = document.createElement('a');
      link.href = './reports/qianwen-user-acquisition-dashboard/latest/';
      link.textContent = '11 月 26 日 · 最新绑定汇总 ↗';
      link.className = 'report-related-link';
      link.dataset.qianwenSummary = '';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.before(link);
    });
  }
  const root = document.querySelector('#app');
  if (root) {
    new MutationObserver(addLink).observe(root, {childList:true,subtree:true});
    addLink();
  }
})();
