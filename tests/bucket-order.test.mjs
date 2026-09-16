import test from "node:test";
import assert from "node:assert/strict";

import { reorderItemIds } from "../src/bucket-order.js";

test("moves a classification before another classification", () => {
  assert.deepEqual(
    reorderItemIds(["growth", "product", "research"], "research", "product"),
    ["growth", "research", "product"],
  );
});

test("moves a classification after another classification", () => {
  assert.deepEqual(
    reorderItemIds(["growth", "product", "research"], "growth", "product", true),
    ["product", "growth", "research"],
  );
});

test("keeps the order stable for invalid or no-op drops", () => {
  const ids = ["growth", "product", "research"];
  assert.deepEqual(reorderItemIds(ids, "growth", "growth"), ids);
  assert.deepEqual(reorderItemIds(ids, "missing", "product"), ids);
  assert.deepEqual(ids, ["growth", "product", "research"]);
});
