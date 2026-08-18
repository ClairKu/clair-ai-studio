/**
 * 口径计算：把一堆 MR 变成「谁提交了多少需求、上线了多少」。
 * 所有阈值和分支名都来自 config/rules.json，这里不写死任何业务常量。
 */

/** 一个需求 = 一条特性分支。同一分支合 test 又合 master 会有多个 MR，必须归并。 */
export function demandKey(mr) {
  return `${mr.project_id}::${mr.source_branch}`;
}

function isReleaseMerge(mr, rules) {
  return mr.state === "merged" && rules.released.requires.target_branch_in.includes(mr.target_branch);
}

function earliest(values) {
  const usable = values.filter(Boolean).sort();
  return usable[0] || null;
}

/**
 * 把某个人的 MR 列表折叠成需求列表。
 * 返回的每一项是一个需求（不是 MR），带上它的状态与时间点。
 */
export function foldDemands(mergeRequests, rules) {
  const groups = new Map();
  for (const mr of mergeRequests) {
    if (rules.submitted.exclude_states.includes(mr.state)) continue;
    const key = demandKey(mr);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mr);
  }

  const demands = [];
  for (const [key, mrs] of groups) {
    const releaseMerges = mrs.filter((mr) => isReleaseMerge(mr, rules));
    const released = releaseMerges.length > 0;

    // 从未合并过的草稿不算「提交了一个需求」——那还只是个草稿分支。
    const everMerged = mrs.some((mr) => mr.state === "merged");
    if (rules.submitted.exclude_draft_never_merged && !everMerged && mrs.every((mr) => mr.draft)) continue;

    const mergedToTest = mrs.some(
      (mr) => mr.state === "merged" && rules.in_flight.test_branches.includes(mr.target_branch),
    );

    demands.push({
      key,
      project_id: mrs[0].project_id,
      source_branch: mrs[0].source_branch,
      author_username: mrs[0].author?.username || null,
      submitted_at: earliest(mrs.map((mr) => mr.created_at)),
      released_at: released ? earliest(releaseMerges.map((mr) => mr.merged_at)) : null,
      status: released ? "released" : mergedToTest ? "merged" : "building",
      mr_count: mrs.length,
      // 仅本机保留，不发布到公网（见 rules.publish_policy）
      _private: {
        titles: mrs.map((mr) => mr.title),
        urls: mrs.map((mr) => mr.web_url),
        target_branches: mrs.map((mr) => mr.target_branch),
        jira_keys: [...new Set(mrs.flatMap((mr) => extractJiraKeys(`${mr.source_branch} ${mr.title}`)))],
      },
    });
  }

  return demands.sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)));
}

/** 分支名或标题里常带 QMRD-12345，抽出来方便回溯到 Jira 需求单。 */
export function extractJiraKeys(text = "") {
  return [...String(text).matchAll(/\b([A-Z][A-Z0-9]+)-(\d+)\b/gi)].map((m) => `${m[1].toUpperCase()}-${m[2]}`);
}

/** 按人汇总 + 全局汇总。这就是看板上那三个大数字的来源。 */
export function summarize(demandsByPerson, roster) {
  const people = roster.people.map((person) => {
    const demands = demandsByPerson.get(person.id) || [];
    const released = demands.filter((d) => d.status === "released");
    return {
      id: person.id,
      display_name: person.display_name,
      avatar: person.avatar,
      gitlab_username: person.gitlab_username,
      submitted: demands.length,
      released: released.length,
      in_flight: demands.length - released.length,
      first_released_at: earliest(released.map((d) => d.released_at)),
      end_to_end: released.length >= 1,
    };
  });

  return {
    submitted: people.reduce((sum, p) => sum + p.submitted, 0),
    released: people.reduce((sum, p) => sum + p.released, 0),
    in_flight: people.reduce((sum, p) => sum + p.in_flight, 0),
    end_to_end_people: people.filter((p) => p.end_to_end).length,
    people,
  };
}

/** 和上一版快照比，算出本次「新提交 / 待发布 / 新上线」——页面上那三个格子。 */
export function diffSnapshots(previous, next) {
  const previousKeys = new Set((previous?.demands || []).map((d) => d.key));
  const previousReleased = new Set(
    (previous?.demands || []).filter((d) => d.status === "released").map((d) => d.key),
  );
  const nextDemands = next.demands || [];

  const newSubmitted = nextDemands.filter((d) => !previousKeys.has(d.key));
  const newReleased = nextDemands.filter((d) => d.status === "released" && !previousReleased.has(d.key));
  const pendingRelease = nextDemands.filter((d) => d.status !== "released");

  return {
    new_submitted: newSubmitted.length,
    pending_release: pendingRelease.length,
    new_released: newReleased.length,
    changed: newSubmitted.length > 0 || newReleased.length > 0,
  };
}
