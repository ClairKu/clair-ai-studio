import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildRefreshPrompt,
  isAllowedOrigin,
  sanitizeAgentResult,
} from "../scripts/product-demand-pulse-refresh-server.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

test("刷新入口不再下载更新包", async () => {
  const app = await readFile(new URL("../public/reports/product-demand-pulse/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/reports/product-demand-pulse/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(app, /link\.download|exportUpdatePacket|data-export-update/);
  assert.match(app, /refreshBattleReport/);
  assert.match(html, /data-refresh-update/);
});

test("刷新服务只接受生产战报来源", () => {
  const origins = new Set(["https://clairku.github.io"]);
  assert.equal(isAllowedOrigin("https://clairku.github.io", origins), true);
  assert.equal(isAllowedOrigin("https://example.com", origins), false);
  assert.equal(isAllowedOrigin(undefined, origins), false);
});

test("安装器使用持久仓库锚点而不是临时 worktree", async () => {
  const installer = await readFile(new URL("../scripts/install-product-demand-pulse-refresh.mjs", import.meta.url), "utf8");
  assert.match(installer, /--git-common-dir/);
  assert.match(installer, /findPersistentRepoAnchor/);
});

test("增量指令跳过已经上线的历史记录", () => {
  const prompt = buildRefreshPrompt({
    packet: { schema: "pain-off-update-packet/v1", changes: [] },
    checkpoint: { checked_through_at: "2026-08-14T00:46:00+08:00" },
    repo: root,
  });
  assert.match(prompt, /已经确认上线的历史记录不要重新检查/);
  assert.match(prompt, /status 不是 released \/ impact_confirmed/);
  assert.match(prompt, /有效 MR 链路已合并且生产环境实际生效/);
  assert.match(prompt, /只发一次精准问题，effort 使用 medium/);
  assert.match(prompt, /普通 Jira\/Wiki 新增或编辑不入榜/);
});

test("对外刷新结果会被脱敏和收敛", () => {
  const result = sanitizeAgentResult({
    status: "updated",
    summary: "发现 1 个新上线需求 https://internal.example/task/1",
    delta: { new_submitted: 1, pending_release: 2, new_released: 1 },
    snapshot: { submitted: 5, pending_release: 2, released: 5 },
    accepted_client_ids: ["LOCAL-1", "LOCAL-1"],
    checked_through_at: "2026-08-17T12:00:00+08:00",
    source_cursor: "cursor-1",
    production_url: "https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/",
    internal_url: "https://internal.example",
  });
  assert.deepEqual(result.accepted_client_ids, ["LOCAL-1"]);
  assert.equal(result.summary, "发现 1 个新上线需求");
  assert.equal(result.production_url, "https://clairku.github.io/clair-ai-studio/reports/product-demand-pulse/");
  assert.equal("internal_url" in result, false);
});
