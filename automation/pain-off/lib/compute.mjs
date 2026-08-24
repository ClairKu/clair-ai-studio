/**
 * 口径计算：把一堆 MR 变成「谁提交了多少需求、上线了多少」。
 * 所有阈值和分支名都来自 config/rules.json，这里不写死任何业务常量。
 */

/**
 * 一个需求 = 一条特性分支（按分支名，跨仓库归并）。
 * 同名分支在前端/服务端两个仓库各有一条 MR 链，是同一个需求的两个改动范畴，不是两个需求。
 */
export function demandKey(mr) {
  return mr.source_branch;
}

/** 分支类型前缀（feat/bugfix/…），没有斜杠的分支返回空串。 */
function branchType(branch) {
  const i = String(branch).indexOf("/");
  return i > 0 ? branch.slice(0, i).toLowerCase() : "";
}

/** 分支主干名：去掉类型前缀后的部分，用来判断修复分支属于哪个特性需求。 */
function branchStem(branch) {
  const i = String(branch).indexOf("/");
  return (i > 0 ? branch.slice(i + 1) : String(branch)).toLowerCase();
}

export function isReleaseMerge(mr, rules) {
  return mr.state === "merged" && rules.released.requires.target_branch_in.includes(mr.target_branch);
}

/**
 * 把「任意作者」的生产合并 MR 补进需求并升级其状态。
 * foldDemands 只见得到本人作为作者的 MR，而生产合并常由工程师代合——
 * 没有这一步，PM 的需求明明上了线也会一直显示在途（2026-08-24 家亮的
 * feat/article-image-preview 就是这样漏掉的）。
 * 返回是否发生了升级。
 */
export function supplementReleaseMerges(demand, candidateMrs, rules) {
  const releaseMerges = candidateMrs.filter((mr) => isReleaseMerge(mr, rules));
  if (!releaseMerges.length) return false;

  const known = new Set(demand.mrs.map((m) => m.iid));
  for (const mr of releaseMerges) {
    if (known.has(mr.iid)) continue;
    demand.mrs.push({
      iid: mr.iid,
      url: mr.web_url,
      title: mr.title,
      state: mr.state,
      target_branch: mr.target_branch,
      created_at: mr.created_at,
      merged_at: mr.merged_at || null,
      is_release: true,
    });
  }
  demand.mrs.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  const ordered = releaseMerges.sort((a, b) => String(a.merged_at).localeCompare(String(b.merged_at)));
  demand.status = "released";
  demand.released_at = earliest(ordered.map((mr) => mr.merged_at));
  demand.release_mr_url = ordered[0].web_url;
  // 代合的生产 MR 标题里常带需求单号（本人分支名里可能没有），一并抽取。
  demand.jira_keys = [
    ...new Set([...demand.jira_keys, ...releaseMerges.flatMap((mr) => extractJiraKeys(mr.title))]),
  ];
  return true;
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

  // 修复分支折叠：验证过程发现的 BUG（bugfix/xxx-yyy，主干名以某特性分支主干名开头）
  // 是该需求交付过程的一部分，归并进特性需求，不单独算一个需求。
  const fixPrefixes = new Set(rules.demand_key?.fix_prefixes || ["bugfix", "fix", "hotfix"]);
  const featureStems = [...groups.keys()]
    .filter((branch) => !fixPrefixes.has(branchType(branch)))
    .map((branch) => ({ branch, stem: branchStem(branch) }));
  for (const branch of [...groups.keys()]) {
    if (!fixPrefixes.has(branchType(branch))) continue;
    const stem = branchStem(branch);
    const host = featureStems
      .filter((f) => f.branch !== branch && (stem === f.stem || stem.startsWith(`${f.stem}-`) || stem.startsWith(`${f.stem}_`)))
      .sort((a, b) => b.stem.length - a.stem.length)[0];
    if (!host) continue;
    groups.get(host.branch).push(...groups.get(branch));
    groups.delete(branch);
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

    // 一个需求可能横跨多个仓库（前后端）与多条分支（特性 + 验证修复）。
    const branchPairs = [...new Map(mrs.map((mr) => [`${mr.project_id}::${mr.source_branch}`, { project_id: mr.project_id, source_branch: mr.source_branch }])).values()];
    const scopeMap = rules.demand_key?.project_scopes || {};
    const projectIds = [...new Set(branchPairs.map((pair) => pair.project_id))];
    const scopes = [...new Set(projectIds.map((id) => scopeMap[String(id)] || (projectIds.length > 1 ? "多仓" : null)))].filter(Boolean);

    demands.push({
      key,
      branch_pairs: branchPairs,
      scopes,
      source_branch: key,
      author_username: mrs[0].author?.username || null,
      submitted_at: earliest(mrs.map((mr) => mr.created_at)),
      released_at: released ? earliest(releaseMerges.map((mr) => mr.merged_at)) : null,
      status: released ? "released" : mergedToTest ? "merged" : "building",
      mr_count: mrs.length,
      release_mr_url: released ? releaseMerges.sort((a, b) => String(a.merged_at).localeCompare(String(b.merged_at)))[0].web_url : null,
      jira_keys: [...new Set(mrs.flatMap((mr) => extractJiraKeys(`${mr.source_branch} ${mr.title}`)))],
      // 每条 MR 的可追溯信息。哪些字段能进公网快照由 rules.publish_policy 决定，不在这里裁剪。
      mrs: mrs
        .map((mr) => ({
          iid: mr.iid,
          url: mr.web_url,
          title: mr.title,
          state: mr.state,
          target_branch: mr.target_branch,
          created_at: mr.created_at,
          merged_at: mr.merged_at || null,
          is_release: isReleaseMerge(mr, rules),
        }))
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
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
