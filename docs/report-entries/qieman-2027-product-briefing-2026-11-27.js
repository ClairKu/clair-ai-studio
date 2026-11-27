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
  "modifiedAt": "2026-11-27T02:22:57Z",
  "source": "飞书规划整理为十屏汇报，覆盖产品关系、四季交付、团队分工和经营验收。专属阅读链接可直接演示。",
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
    if (localStorage.getItem(registered) === '1') return;
    const raw = localStorage.getItem(catalogKey);
    const saved = raw ? JSON.parse(raw) : {groups: [], reports: []};
    if (!Array.isArray(saved.groups) || !Array.isArray(saved.reports)) return;
    if (!saved.reports.some(item => item.id === entry.id || item.url === entry.url)) {
      saved.reports.push(entry);
      localStorage.setItem(catalogKey, JSON.stringify(saved));
    }
    localStorage.setItem(registered,'1');
  } catch {
    // The direct link in the home catalog is also available with storage disabled.
  }
})();
