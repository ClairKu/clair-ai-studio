/**
 * GitLab REST 客户端（只读）。
 * 只做三件事：带 token 发请求、跟着 x-next-page 翻页、失败时报得清楚。
 */

const DEFAULT_TIMEOUT_MS = 20000;

export class GitLabError extends Error {
  constructor(message, { status, url, hint } = {}) {
    super(message);
    this.name = "GitLabError";
    this.status = status;
    this.url = url;
    this.hint = hint;
  }
}

export function createClient({ baseUrl, token, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!token) {
    throw new GitLabError("缺少 GitLab token", {
      hint: "在 GitLab → 个人设置 → Access Tokens 建一个 scope=read_api 的 token，然后 export GIT_ACCESS_TOKEN=xxx",
    });
  }

  async function request(path, params = {}) {
    const url = new URL(baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, {
      headers: { "PRIVATE-TOKEN": token, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 401) {
      throw new GitLabError("GitLab 拒绝了 token（401）", {
        status: 401,
        url: url.toString(),
        hint: "token 过期或 scope 不含 read_api",
      });
    }
    if (!response.ok) {
      throw new GitLabError(`GitLab 返回 HTTP ${response.status}`, { status: response.status, url: url.toString() });
    }
    return { body: await response.json(), headers: response.headers };
  }

  /** 翻完所有页；GitLab 用 x-next-page 头传下一页页码，空字符串表示没有了。 */
  async function paginate(path, params = {}, { maxPages = 50 } = {}) {
    const items = [];
    let page = 1;
    for (let i = 0; i < maxPages; i += 1) {
      const { body, headers } = await request(path, { ...params, per_page: 100, page });
      if (!Array.isArray(body)) {
        throw new GitLabError("期望数组响应，实际不是", { url: path });
      }
      items.push(...body);
      const next = headers.get("x-next-page");
      if (!next) return items;
      page = Number(next);
    }
    throw new GitLabError(`翻页超过 ${maxPages} 页仍未结束，疑似过滤条件太宽`, { url: path });
  }

  return {
    request,
    paginate,

    /** 当前 token 对应的人，用来自检 token 是否可用。 */
    async me() {
      const { body } = await request("/user");
      return body;
    },

    /** 按关键词搜用户，用于把中文名解析成 GitLab username。 */
    async searchUsers(keyword) {
      const { body } = await request("/users", { search: keyword, per_page: 20 });
      return body;
    },

    /**
     * 取某个人作为 author 的全部 MR。
     * scope=all 是必须的——不带的话全局 MR 接口只会返回 token 持有者自己的 MR。
     */
    async listAuthoredMergeRequests({ authorUsername, createdAfter }) {
      return paginate("/merge_requests", {
        scope: "all",
        state: "all",
        author_username: authorUsername,
        created_after: createdAfter,
        order_by: "created_at",
        sort: "asc",
        with_labels_details: false,
      });
    },

    /**
     * 某项目里、以某分支为源的全部已合并 MR——不限作者。
     * 生产合并常由工程师代合（PM 只把特性分支合到 test），按作者取数会漏掉这些，
     * 上线判定必须用这条接口按需求分支补捞。
     */
    async listMergedMergeRequestsBySourceBranch({ projectId, sourceBranch }) {
      return paginate(`/projects/${projectId}/merge_requests`, {
        state: "merged",
        source_branch: sourceBranch,
      });
    },
  };
}
