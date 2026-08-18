import { createHash } from "node:crypto";
import { createClient } from "./gitlab.mjs";
import { foldDemands, summarize, diffSnapshots } from "./compute.mjs";
import { attachTickets } from "./jira.mjs";

/** 需求在公网上的稳定 id：项目+分支的哈希，既能跨次比对，又不泄露仓库和分支名。 */
export function publicDemandId(key) {
  return createHash("sha1").update(key).digest("hex").slice(0, 10);
}

function headline(summary) {
  if (!summary.submitted) return "还没有可统计的需求，等待第一条特性分支。";
  return `${summary.submitted} 个已提交，${summary.released} 个已上线，${summary.end_to_end_people} 位 PM 完成端到端交付。`;
}

/**
 * 跑一次完整取数：GitLab → 需求折叠 → 按人汇总 → 生成公网快照 + 本机明细。
 * 返回 { snapshot, detail, delta }。snapshot 可以直接发公网，detail 不可以。
 */
export async function buildSnapshot({
  rules,
  roster,
  token,
  curated = [],
  previousSnapshot = null,
  now = new Date(),
}) {
  const missing = roster.people.filter((person) => !person.gitlab_username);
  if (missing.length) {
    throw new Error(
      `roster.json 里还有 ${missing.length} 个人没有 gitlab_username：${missing.map((p) => p.display_name).join("、")}。` +
        `先跑 node automation/pain-off/resolve-roster.mjs 解析，人工确认后写回 config/roster.json。`,
    );
  }

  const gitlab = createClient({ baseUrl: rules.source.base_url, token });
  const demandsByPerson = new Map();
  const allDemands = [];

  for (const person of roster.people) {
    const mrs = await gitlab.listAuthoredMergeRequests({
      authorUsername: person.gitlab_username,
      createdAfter: rules.window.program_start,
    });
    const demands = foldDemands(mrs, rules).map((demand) => ({ ...demand, person_id: person.id }));
    demandsByPerson.set(person.id, demands);
    allDemands.push(...demands);
  }

  const summary = summarize(demandsByPerson, roster);
  const delta = diffSnapshots(previousSnapshot?._detail || previousSnapshot, { demands: allDemands });

  const ticketLookup = await attachTickets(allDemands, { rules, token: process.env[rules.jira.token_env] });
  const policy = rules.publish_policy;
  // internal_only 时一条链接都不发；公开页面上的追溯模块会只剩计数与日期。
  const linksPublic = policy.link_exposure === "public";

  const publicDemands = allDemands.map((demand) => ({
    id: publicDemandId(demand.key),
    person_id: demand.person_id,
    submitted_at: demand.submitted_at,
    released_at: demand.released_at,
    status: demand.status,
    links: {
      // MR 标题永远不发——它才是最可能夹带内部信息的部分，只留在本机 detail.json。
      merge_requests: linksPublic && policy.publish_mr_links
        ? demand.mrs.map((mr) => ({
            iid: mr.iid,
            url: mr.url,
            target_branch: mr.target_branch,
            state: mr.state,
            merged_at: mr.merged_at,
            is_release: mr.is_release,
          }))
        : [],
      release_mr_url: linksPublic && policy.publish_mr_links ? demand.release_mr_url : null,
      demand_tickets: linksPublic && policy.publish_jira_links ? demand.demand_tickets : [],
      release_tickets: linksPublic && policy.publish_jira_links ? demand.release_tickets : [],
    },
  }));

  const generatedAt = now.toISOString();
  const lastChangeAt = delta.changed ? generatedAt : previousSnapshot?.meta?.last_change_at || generatedAt;

  const snapshot = {
    schema_version: "product-demand-pulse/v2",
    meta: {
      contract_version: rules.contract_version,
      source_of_truth: "GitLab merge requests",
      generated_at: generatedAt,
      cutoff: generatedAt,
      last_change_at: lastChangeAt,
      stale_after_minutes: rules.freshness.stale_after_minutes,
      headline: headline(summary),
      window_start: rules.window.program_start,
      release_ticket_lookup: ticketLookup,
      link_exposure: policy.link_exposure,
      links_note: linksPublic
        ? "链接只发单号与地址，不发 MR 标题；打开需要内网与相应系统权限。"
        : "按当前策略不对外发布链接，追溯模块只展示计数与日期。",
    },
    summary: {
      submitted: summary.submitted,
      released: summary.released,
      in_flight: summary.in_flight,
      end_to_end_people: summary.end_to_end_people,
    },
    delta,
    people: summary.people.map(({ gitlab_username, ...rest }) => rest),
    demands: publicDemands,
    // 墙上的展示文案始终人工撰写；脚本不把 MR 标题推到公网，只负责给它对上最新状态。
    // demand_key 含仓库与分支名，只在本机用来对状态，不进公开快照。
    records: curated.map(({ demand_key: demandKey, ...record }) => {
      const matched = demandKey ? allDemands.find((d) => d.key === demandKey) : null;
      return matched
        ? { ...record, status: matched.status, released_at: matched.released_at || record.released_at || null }
        : record;
    }),
    criteria: {
      submitted: "一条特性分支 = 一个需求；由该 PM 本人作为 MR 作者发起，未被废弃（closed 不计）。",
      released: rules.released.approximation_note,
      dedupe: "同一分支先合测试环境、再合生产主干只算 1 个需求。",
      end_to_end: "该 PM 名下至少有 1 个需求已合入生产主干。",
      window: `统计区间自 ${rules.window.program_start.slice(0, 10)} 起累计。`,
      trace: `每个需求列出它的需求单（${rules.jira.demand_projects.join("/")}）、全部 MR、以及上线单（Jira ${rules.jira.release_project} 发布管控）。`,
    },
  };

  const detail = {
    generated_at: generatedAt,
    demands: allDemands,
  };

  return { snapshot, detail, delta };
}
