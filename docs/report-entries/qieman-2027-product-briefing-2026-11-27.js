(() => {
  'use strict';
  const entry = {
  "id": "qieman-2027-product-briefing-2026-11-27",
  "groupId": "product-planning",
  "title": "2027 年且慢产品规划｜管理层汇报",
  "url": "https://clairku.github.io/clair-ai-studio/reports/qieman-2027-product-briefing-2026-11-27/",
  "preview": "qieman-2027-product-briefing-2026-11-27.svg",
  "pinned": false,
  "position": -10,
  "createdAt": "2026-11-27T02:22:57Z",
  "modifiedAt": "2026-11-27T03:12:00Z",
  "source": "产品团队年底管理汇报，涵盖年度复盘、经营目标、产品组合、季度路线图与首季决策。",
  "access": "production",
  "workType": "product-planning",
  "tags": [
    "且慢",
    "年度规划",
    "管理层汇报",
    "产品团队",
    "顾问工作台"
  ]
};
  const catalogKey = 'clair-service-report-workbench-v1';
  const registered = 'clair-studio-entry-' + entry.id;
  try {
    if (localStorage.getItem(registered) === '2') return;
    const raw = localStorage.getItem(catalogKey);
    const saved = raw ? JSON.parse(raw) : {groups: [], reports: []};
    if (!Array.isArray(saved.groups) || !Array.isArray(saved.reports)) return;
    const existing = saved.reports.find(item => item.id === entry.id || item.url === entry.url);
    if (existing) {
      if (existing.source === '飞书规划整理为十屏汇报，覆盖产品关系、四季交付、团队分工和经营验收。专属阅读链接可直接演示。') {
        existing.source = entry.source;
        existing.modifiedAt = entry.modifiedAt;
        localStorage.setItem(catalogKey, JSON.stringify(saved));
      }
    } else if (!localStorage.getItem(registered)) {
      saved.reports.push(entry);
      localStorage.setItem(catalogKey, JSON.stringify(saved));
    }
    localStorage.setItem(registered,'2');
  } catch {
    // The direct link in the home catalog is also available with storage disabled.
  }
})();
