import test from "node:test";
import assert from "node:assert/strict";

import { applyManualDemands } from "../automation/pain-off/lib/snapshot.mjs";
import { summarize } from "../automation/pain-off/lib/compute.mjs";

// 历史背景：verified_baseline 机制已在 0108dd0 被人工补录通道（rules.demand_key.manual_demands）取代；
// R2 的「已上线」基线经 refs 核验为误判并在 e527b48 撤销。本用例守护现行通道：
// 仓库对取数账号不可见的已核验需求（家亮的文章表格横向滑动）不因自动刷新而漏计。
test("人工补录需求不会被自动取数漏计或降级", () => {
  const roster = {
    people: [
      { id: "P01", display_name: "嘉鸿", avatar: "🦝", gitlab_username: "jia" },
      { id: "P02", display_name: "家亮", avatar: "🦦", gitlab_username: "liang" },
    ],
  };
  const auto = {
    key: "feat/article-image-preview",
    person_id: "P02",
    status: "released",
    submitted_at: "2026-07-31T00:00:00+08:00",
    released_at: "2026-08-13T00:00:00+08:00",
    mrs: [],
    mr_count: 3,
  };
  const demandsByPerson = new Map([["P01", []], ["P02", [auto]]]);
  const allDemands = [auto];
  const rules = {
    demand_key: {
      manual_demands: [
        {
          key: "manual/article-table-scroll",
          person_id: "P02",
          status: "released",
          submitted_at: "2026-07-31T00:00:00+08:00",
          released_at: "2026-08-12T00:00:00+08:00",
          scopes: ["人工补录"],
          evidence: "2026-08-12 全团队核验（research/product-demand-pulse-2026-08-12.md）",
        },
        // 缺 key/person_id 的残缺条目直接跳过，不许污染统计。
        { person_id: "P01", status: "released" },
      ],
    },
  };

  applyManualDemands({ rules, demandsByPerson, allDemands });
  const summary = summarize(demandsByPerson, roster);

  assert.equal(allDemands.length, 2);
  const manual = allDemands.find((d) => d.key === "manual/article-table-scroll");
  assert.equal(manual.status, "released");
  assert.equal(manual.released_at, "2026-08-12T00:00:00+08:00");
  assert.deepEqual(manual.scopes, ["人工补录"]);

  const jialiang = summary.people.find((p) => p.id === "P02");
  assert.deepEqual([jialiang.submitted, jialiang.released], [2, 2]);
  assert.equal(jialiang.end_to_end, true);
  assert.equal(summary.submitted, 2);
  assert.equal(summary.released, 2);
  assert.equal(summary.in_flight, 0);
});

test("人工补录的人此前没有任何自动需求时也能建档", () => {
  const demandsByPerson = new Map();
  const allDemands = [];
  const rules = {
    demand_key: {
      manual_demands: [{ key: "manual/only-one", person_id: "P09", status: "submitted" }],
    },
  };

  applyManualDemands({ rules, demandsByPerson, allDemands });

  assert.equal(demandsByPerson.get("P09").length, 1);
  assert.equal(allDemands[0].status, "submitted");
  assert.equal(allDemands[0].released_at, null);
});
