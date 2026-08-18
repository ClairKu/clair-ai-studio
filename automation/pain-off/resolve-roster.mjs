#!/usr/bin/env node
/**
 * 把 roster.json 里的中文名解析成 GitLab username 候选，供人工确认。
 * 故意不自动写回——按人聚合的一切都建立在这个映射上，认错人比没数字更糟。
 *
 *   GIT_ACCESS_TOKEN=xxx node automation/pain-off/resolve-roster.mjs
 */
import { createClient } from "./lib/gitlab.mjs";
import { loadConfig } from "./lib/paths.mjs";

const { rules, roster } = loadConfig();
const gitlab = createClient({ baseUrl: rules.source.base_url, token: process.env[rules.source.token_env] });

const me = await gitlab.me();
console.log(`token 可用，当前身份：${me.username}（${me.name}）\n`);

for (const person of roster.people) {
  const seen = new Map();
  for (const hint of person.search_hints || [person.display_name]) {
    for (const user of await gitlab.searchUsers(hint)) seen.set(user.username, user);
  }
  const candidates = [...seen.values()];
  const current = person.gitlab_username ? ` [已填 ${person.gitlab_username}]` : "";
  console.log(`${person.id} ${person.display_name}${current}`);
  if (!candidates.length) {
    console.log("    没搜到；换个 search_hints（如全名/拼音/工号）再试\n");
    continue;
  }
  for (const user of candidates) {
    console.log(`    ${user.username.padEnd(20)} ${user.name || ""} ${user.state === "active" ? "" : `(${user.state})`}`);
  }
  console.log("");
}

console.log("确认后把 username 填进 automation/pain-off/config/roster.json 的 gitlab_username。");
