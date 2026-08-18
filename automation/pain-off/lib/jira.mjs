/**
 * Jira 只读客户端，专门用来把需求单反查成上线单。
 *
 * 盈米的上线单在 YR 项目（Release Control），命名约定是把源需求 key 直接嵌进 summary
 * （例如 `QMRD-46848 - 某某功能 - 上线`），所以按 key 搜 summary 就能对上。
 *
 * 没有 JIRA_TOKEN 也能跑——那时只生成需求单链接，上线单一栏留空并在快照里标明原因。
 */

const TIMEOUT_MS = 20000;

export function browseUrl(rules, key) {
  return `${rules.jira.browse_base.replace(/\/$/, "")}/${key}`;
}

export function createJiraClient({ rules, token }) {
  if (!token) return null;

  async function search(jql, fields) {
    const url = new URL(`${rules.jira.api_base.replace(/\/$/, "")}/search`);
    url.searchParams.set("jql", jql);
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("fields", fields.join(","));
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Jira HTTP ${response.status}`);
    return response.json();
  }

  return {
    /** 给定一个需求 key（QMRD-xxxxx），找出引用了它的上线单。 */
    async findReleaseTickets(demandKey) {
      const jql = `project = ${rules.jira.release_project} AND summary ~ "${demandKey}" ORDER BY created DESC`;
      const result = await search(jql, ["summary", "status", "issuetype", "resolutiondate"]);
      return (result.issues || []).map((issue) => ({
        key: issue.key,
        url: browseUrl(rules, issue.key),
        status: issue.fields?.status?.name || null,
        type: issue.fields?.issuetype?.name || null,
        resolved_at: issue.fields?.resolutiondate || null,
      }));
    },
  };
}

/**
 * 给一批需求补上「需求单 / 上线单」两类链接。
 * Jira 查不通不算失败——链接是锦上添花，计数不依赖它。
 */
export async function attachTickets(demands, { rules, token }) {
  const client = createJiraClient({ rules, token });
  const cache = new Map();
  let lookupStatus = client ? "ok" : "skipped_no_token";

  for (const demand of demands) {
    demand.demand_tickets = (demand.jira_keys || [])
      .filter((key) => rules.jira.demand_projects.some((project) => key.startsWith(`${project}-`)))
      .map((key) => ({ key, url: browseUrl(rules, key) }));
    demand.release_tickets = [];

    if (!client) continue;
    for (const ticket of demand.demand_tickets) {
      try {
        if (!cache.has(ticket.key)) cache.set(ticket.key, await client.findReleaseTickets(ticket.key));
        demand.release_tickets.push(...cache.get(ticket.key));
      } catch (error) {
        lookupStatus = `partial: ${error.message}`;
      }
    }
  }

  return lookupStatus;
}
