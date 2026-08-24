import test from "node:test";
import assert from "node:assert/strict";

import { applyVerifiedBaselines } from "../automation/pain-off/lib/snapshot.mjs";
import { summarize } from "../automation/pain-off/lib/compute.mjs";

test("已核验历史基线不会被自动取数降级或漏计", () => {
  const roster = {
    people: [
      { id: "P01", display_name: "嘉鸿", avatar: "🦝", gitlab_username: "jia" },
      { id: "P02", display_name: "家亮", avatar: "🦦", gitlab_username: "liang" },
    ],
  };
  const r2 = {
    key: "feature/copy-fix",
    person_id: "P01",
    status: "merged",
    released_at: null,
    mrs: [],
    mr_count: 0,
  };
  const demandsByPerson = new Map([["P01", [r2]], ["P02", []]]);
  const allDemands = [r2];
  const curatedRecords = [
    {
      id: "R2",
      person_id: "P01",
      public_title: "术语修正",
      submitted_at: "2026-08-11",
      released_at: "2026-08-14",
      status: "released",
      demand_key: "feature/copy-fix",
      verified_baseline: true,
    },
    {
      id: "R4",
      person_id: "P02",
      public_title: "移动端表格阅读体验",
      submitted_at: "2026-07-31",
      status: "released",
      demand_key: null,
      verified_baseline: true,
    },
  ];

  applyVerifiedBaselines({ allDemands, demandsByPerson, curatedRecords });
  const summary = summarize(demandsByPerson, roster);

  assert.equal(r2.status, "released");
  assert.equal(r2.released_at, "2026-08-14");
  assert.equal(allDemands.length, 2);
  assert.equal(summary.submitted, 2);
  assert.equal(summary.released, 2);
  assert.equal(summary.in_flight, 0);
  assert.equal(summary.end_to_end_people, 2);
});
