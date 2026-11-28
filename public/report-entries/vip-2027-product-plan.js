(() => {
  'use strict';
  const entry = {
  "id": "vip-2027-product-plan",
  "groupId": "advisor-workbench",
  "title": "2027 高客业务产品规划",
  "url": "https://clairku.github.io/clair-ai-studio/reports/vip-2027-product-plan/plan.html",
  "preview": "vip-2027-product-plan.svg",
  "pinned": false,
  "position": -9,
  "createdAt": "2026-11-28T07:00:00Z",
  "source": "高客年度产品规划，覆盖线上经营、成熟顾问展业、工具建设、容量测算与季度验收。",
  "access": "production",
  "workType": "product-planning",
  "tags": [
    "且慢",
    "高客业务",
    "投顾工作台",
    "产品规划",
    "年度经营",
    "HTML"
  ],
  "modifiedAt": "2026-11-28T07:00:00Z"
};
  const storageKey = 'clair-service-report-workbench-v1';
  const seenKey = 'clair-catalog-entry-' + entry.id;
  try {
    if (localStorage.getItem(seenKey) === '1') return;
    const raw = localStorage.getItem(storageKey);
    const saved = raw ? JSON.parse(raw) : {groups: [], reports: []};
    if (!Array.isArray(saved.groups) || !Array.isArray(saved.reports)) return;
    if (!saved.reports.some(item => item.id === entry.id || item.url === entry.url)) {
      saved.reports.push(entry);
      localStorage.setItem(storageKey, JSON.stringify(saved));
    }
    localStorage.setItem(seenKey, '1');
  } catch {
    // The link in the home navigation also works without local storage.
  }
})();
