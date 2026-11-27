/* The 2026-11-27 advisory-share research collection. */
(() => {
  "use strict";
  const entries = [
  {
    "id": "yingmi-t-share-progress-2026-11-27",
    "groupId": "reporting",
    "title": "T 份额｜盈米改造进度",
    "url": "https://clairku.github.io/clair-ai-studio/reports/t-share-2026-11-27/progress.html",
    "preview": "yingmi-t-share-progress-2026-11-27.svg",
    "pinned": false,
    "position": -8,
    "createdAt": "2026-11-27T06:15:00Z",
    "modifiedAt": "2026-11-27T06:15:00Z",
    "source": "专项排期、系统改造与上线验收证据。",
    "access": "production",
    "workType": "reporting",
    "tags": [
      "投顾服务",
      "T份额",
      "盈米改造进度",
      "HTML"
    ]
  },
  {
    "id": "cn-t-share-market-2026-11-27",
    "groupId": "research",
    "title": "T 份额｜市场发行核验",
    "url": "https://clairku.github.io/clair-ai-studio/reports/t-share-2026-11-27/market.html",
    "preview": "cn-t-share-market-2026-11-27.svg",
    "pinned": false,
    "position": -7,
    "createdAt": "2026-11-27T06:15:00Z",
    "modifiedAt": "2026-11-27T06:15:00Z",
    "source": "逐项区分管理人公告、机构筹备和历史同名份额。",
    "access": "production",
    "workType": "competitive-research",
    "tags": [
      "投顾服务",
      "T份额",
      "市场发行核验",
      "HTML"
    ]
  },
  {
    "id": "cn-t-share-rules-2026-11-27",
    "groupId": "research",
    "title": "T 份额｜规则与配置义务",
    "url": "https://clairku.github.io/clair-ai-studio/reports/t-share-2026-11-27/rules.html",
    "preview": "cn-t-share-rules-2026-11-27.svg",
    "pinned": false,
    "position": -6,
    "createdAt": "2026-11-27T06:15:00Z",
    "modifiedAt": "2026-11-27T06:15:00Z",
    "source": "个人投顾、销售关系、新增和存量业务的适用矩阵。",
    "access": "production",
    "workType": "governance-review",
    "tags": [
      "投顾服务",
      "T份额",
      "规则与配置义务",
      "HTML"
    ]
  },
  {
    "id": "cn-t-share-cost-2026-11-27",
    "groupId": "research",
    "title": "T 份额｜费用与切换测算",
    "url": "https://clairku.github.io/clair-ai-studio/reports/t-share-2026-11-27/cost.html",
    "preview": "cn-t-share-cost-2026-11-27.svg",
    "pinned": false,
    "position": -5,
    "createdAt": "2026-11-27T06:15:00Z",
    "modifiedAt": "2026-11-27T06:15:00Z",
    "source": "拆分底层费、销售费和投顾费，计算一次性切换成本的回收期。",
    "access": "production",
    "workType": "investment-research",
    "tags": [
      "投顾服务",
      "T份额",
      "费用与切换测算",
      "HTML"
    ]
  },
  {
    "id": "qieman-t-share-service-2026-11-27",
    "groupId": "advisor-workbench",
    "title": "T 份额｜且慢顾问实务",
    "url": "https://clairku.github.io/clair-ai-studio/reports/t-share-2026-11-27/service.html",
    "preview": "qieman-t-share-service-2026-11-27.svg",
    "pinned": false,
    "position": -4,
    "createdAt": "2026-11-27T06:15:00Z",
    "modifiedAt": "2026-11-27T06:15:00Z",
    "source": "覆盖新增、存量、缺份额、跨年和解约的顾问操作及客户解释。",
    "access": "production",
    "workType": "product-planning",
    "tags": [
      "投顾服务",
      "T份额",
      "且慢顾问实务",
      "HTML"
    ]
  }
];
  const storageKey = "clair-service-report-workbench-v1";
  const seenKey = "clair-catalog-t-share-research-20261127";
  try {
    if (localStorage.getItem(seenKey) === "1") return;
    const current = localStorage.getItem(storageKey);
    const saved = current ? JSON.parse(current) : {groups: [], reports: []};
    if (!Array.isArray(saved.groups) || !Array.isArray(saved.reports)) return;
    const incoming = entries.filter(entry => !saved.reports.some(
      existing => existing.id === entry.id || existing.url === entry.url
    ));
    if (incoming.length) {
      saved.reports.push(...incoming);
      localStorage.setItem(storageKey, JSON.stringify(saved));
    }
    localStorage.setItem(seenKey, "1");
  } catch {
    // The collection links in the home page also work when browser storage is unavailable.
  }
})();
