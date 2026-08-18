import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { foldDemands, summarize, diffSnapshots, extractJiraKeys } from "../automation/pain-off/lib/compute.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(readFileSync(resolve(here, "../automation/pain-off/config/rules.json"), "utf8"));

const mr = (overrides) => ({
  project_id: 7,
  source_branch: "feature/qmrd-1",
  target_branch: "master",
  state: "merged",
  draft: false,
  created_at: "2026-08-01T10:00:00Z",
  merged_at: "2026-08-03T10:00:00Z",
  title: "内部标题",
  web_url: "https://git.frontnode.net/x/-/merge_requests/1",
  author: { username: "alice" },
  ...overrides,
});

test("同一分支合 test 再合 master 只算一个需求", () => {
  const demands = foldDemands(
    [
      mr({ target_branch: "test", merged_at: "2026-08-02T10:00:00Z" }),
      mr({ target_branch: "master", merged_at: "2026-08-03T10:00:00Z" }),
    ],
    rules,
  );
  assert.equal(demands.length, 1);
  assert.equal(demands[0].status, "released");
  assert.equal(demands[0].mr_count, 2);
});

test("只合到 test 不算上线", () => {
  const demands = foldDemands([mr({ target_branch: "test" })], rules);
  assert.equal(demands[0].status, "merged");
  assert.equal(demands[0].released_at, null);
});

test("closed 的 MR 不计入提交", () => {
  const demands = foldDemands([mr({ state: "closed", merged_at: null })], rules);
  assert.equal(demands.length, 0);
});

test("从未合并的纯草稿不计入提交", () => {
  const demands = foldDemands([mr({ state: "opened", draft: true, merged_at: null })], rules);
  assert.equal(demands.length, 0);
});

test("开着的非草稿 MR 计入提交但不算上线", () => {
  const demands = foldDemands([mr({ state: "opened", merged_at: null })], rules);
  assert.equal(demands.length, 1);
  assert.equal(demands[0].status, "building");
});

test("上线时间取最早的一次生产合并", () => {
  const demands = foldDemands(
    [
      mr({ merged_at: "2026-08-09T10:00:00Z" }),
      mr({ target_branch: "main", merged_at: "2026-08-05T10:00:00Z" }),
    ],
    rules,
  );
  assert.equal(demands[0].released_at, "2026-08-05T10:00:00Z");
});

test("不同项目的同名分支是两个需求", () => {
  const demands = foldDemands([mr({ project_id: 7 }), mr({ project_id: 8 })], rules);
  assert.equal(demands.length, 2);
});

test("按人汇总，端到端只认已上线", () => {
  const roster = {
    people: [
      { id: "P01", display_name: "甲", avatar: "🦝", gitlab_username: "alice" },
      { id: "P02", display_name: "乙", avatar: "🦦", gitlab_username: "bob" },
    ],
  };
  const byPerson = new Map([
    ["P01", [{ status: "released", released_at: "2026-08-03" }, { status: "building", released_at: null }]],
    ["P02", [{ status: "building", released_at: null }]],
  ]);
  const summary = summarize(byPerson, roster);
  assert.equal(summary.submitted, 3);
  assert.equal(summary.released, 1);
  assert.equal(summary.in_flight, 2);
  assert.equal(summary.end_to_end_people, 1);
});

test("增量比对认出新提交与新上线", () => {
  const previous = { demands: [{ key: "a", status: "building" }] };
  const next = { demands: [{ key: "a", status: "released" }, { key: "b", status: "building" }] };
  const delta = diffSnapshots(previous, next);
  assert.deepEqual(
    { ...delta },
    { new_submitted: 1, pending_release: 1, new_released: 1, changed: true },
  );
});

test("没有变化时 changed 为 false", () => {
  const same = { demands: [{ key: "a", status: "released" }] };
  assert.equal(diffSnapshots(same, same).changed, false);
});

test("从分支名里抽 Jira key", () => {
  assert.deepEqual(extractJiraKeys("feature/qmrd-47066 修文案"), ["QMRD-47066"]);
});
