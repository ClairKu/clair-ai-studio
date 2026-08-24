import { createHash } from "node:crypto";
import { createClient } from "./gitlab.mjs";
import { foldDemands, summarize, diffSnapshots, supplementReleaseMerges } from "./compute.mjs";
import { attachTickets } from "./jira.mjs";

/** 需求在公网上的稳定 id：项目+分支的哈希，既能跨次比对，又不泄露仓库和分支名。 */
export function publicDemandId(key) {
  return createHash("sha1").update(key).digest("hex").slice(0, 10);
}

function headline(summary) {
  if (!summary.submitted) return "还没有可统计的需求，等待第一条特性分支。";
  return `${summary.submitted} 个已提交，${summary.released} 个已上线，${summary.end_to_end_people} 位 PM 完成端到端交付。`;
}

const LANDED = new Set(["released", "impact_confirmed"]);

/**
 * 自动取数只处理游标之后的增量，已经按 MR 链路与生产结果核验过的历史记录不能被降级。
 * 有 demand_key 的基线覆盖自动状态；没有 demand_key 的基线作为一个冻结需求补进汇总。
 */
export function applyVerifiedBaselines({ allDemands, demandsByPerson, curatedRecords }) {
  for (const record of curatedRecords.filter((item) => item.verified_baseline === true)) {
    let demand = record.demand_key ? allDemands.find((item) => item.key === record.demand_key) : null;

    if (!demand) {
      demand = {
        key: `verified-baseline:${record.id}`,
        person_id: record.person_id,
        brief: record.public_title,
        scopes: ["历史核验"],
        submitted_at: record.submitted_at,
        released_at: record.released_at || null,
        status: record.status,
        mr_count: 0,
        mrs: [],
        release_mr_url: null,
        jira_keys: [],
        branch_pairs: [],
        verified_baseline: true,
        baseline_record_id: record.id,
      };
      allDemands.push(demand);
      if (!demandsByPerson.has(record.person_id)) demandsByPerson.set(record.person_id, []);
      demandsByPerson.get(record.person_id).push(demand);
    } else {
      demand.verified_baseline = true;
      demand.baseline_record_id = record.id;
      if (LANDED.has(record.status) && !LANDED.has(demand.status)) {
        demand.status = "released";
        demand.released_at = record.released_at || demand.released_at || null;
      }
    }

    const releaseMr = record.verified_release_mr;
    if (releaseMr && !(demand.mrs || []).some((mr) => mr.iid === releaseMr.iid)) {
      demand.mrs.push({ ...releaseMr, merged_at: demand.released_at, is_release: true });
      demand.release_mr_url = releaseMr.url;
      demand.mr_count = demand.mrs.length;
    }
  }
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
  // 兼容两种形态：旧的纯 records 数组，或 { records, briefs } 整个 curated 配置。
  const curatedRecords = Array.isArray(curated) ? curated : curated.records || [];
  // briefs：demand_key → 人工核定的需求简述。这是公开页面上唯一的需求描述来源——
  // MR 原始标题永远不出内网，想让某条需求在看板上"有名字"，就在 curated-records.json 里补一句。
  const briefs = Array.isArray(curated) ? {} : curated.briefs || {};
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

  // 上线补捞：生产合并常由工程师代合，按作者取数看不见。对每个还没判上线的需求，
  // 按「项目 + 需求分支」查任意作者的已合并 MR，命中生产主干就升级为已上线。
  for (const demand of allDemands) {
    if (demand.status === "released") continue;
    // 需求可能横跨多个仓库与多条分支（特性 + 验证修复），每一对都要查。
    for (const pair of demand.branch_pairs || [{ project_id: demand.project_id, source_branch: demand.source_branch }]) {
      const merges = await gitlab.listMergedMergeRequestsBySourceBranch({
        projectId: pair.project_id,
        sourceBranch: pair.source_branch,
      });
      supplementReleaseMerges(demand, merges, rules);
      if (demand.status === "released") break;
    }
  }

  applyVerifiedBaselines({ allDemands, demandsByPerson, curatedRecords });

  const summary = summarize(demandsByPerson, roster);
  const delta = diffSnapshots(previousSnapshot?._detail || previousSnapshot, { demands: allDemands });

  const ticketLookup = await attachTickets(allDemands, { rules, token: process.env[rules.jira.token_env] });
  const policy = rules.publish_policy;
  // internal_only 时一条链接都不发；公开页面上的追溯模块会只剩计数与日期。
  const linksPublic = policy.link_exposure === "public";

  const publicDemands = allDemands.map((demand) => ({
    id: publicDemandId(demand.key),
    person_id: demand.person_id,
    brief: demand.brief || (briefs[demand.key] && String(briefs[demand.key]).trim() ? String(briefs[demand.key]).trim() : null),
    scopes: demand.scopes || [],
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
      source_of_truth: "GitLab merge requests + 已核验历史基线",
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
    records: curatedRecords.map(({ demand_key: demandKey, verified_release_mr: _verifiedReleaseMr, ...record }) => {
      const matched = demandKey ? allDemands.find((d) => d.key === demandKey) : null;
      const baseline = record.verified_baseline
        ? allDemands.find((d) => d.baseline_record_id === record.id)
        : null;
      const counted = matched || baseline;
      if (!counted) return { ...record, in_scope: false };
      // 状态以 GitLab 实况为准：没上线的记录不许留 released_at（校验器会拦，而且那本来就是错的）。
      // 已核验历史基线由 applyVerifiedBaselines 保留，不因下一次自动取数降级。
      const released = LANDED.has(counted.status);
      return {
        ...record,
        in_scope: true,
        demand_id: publicDemandId(counted.key),
        status: counted.status,
        released_at: released ? (counted.released_at || record.released_at || null)?.slice(0, 10) ?? null : null,
      };
    }),
    criteria: {
      submitted: "新增需求按特性分支计数；已核验的历史基线继续保留，不因后续自动取数无法重新关联而漏计。",
      released: rules.released.approximation_note,
      dedupe: "同一分支合测试再合生产只算 1 个；前后端仓库的同名分支并为 1 个需求（范畴标签区分）；验证过程的修复分支归并进原需求。",
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
