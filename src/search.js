const ACCESS_SEARCH_LABELS = {
  production: "生产 直达 public",
  org: "组织 登录 restricted",
  account: "账号 登录 restricted",
};

export function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(query = "") {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

export function reportMatchesQuery(
  report,
  query,
  { group = {}, workTypeName = "" } = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return true;

  const haystack = normalizeSearchText([
    report.title,
    report.source,
    report.url,
    report.access,
    ACCESS_SEARCH_LABELS[report.access],
    workTypeName,
    ...(report.tags || []),
    group.name,
    group.description,
  ].filter(Boolean).join(" "));

  return tokens.every((token) => haystack.includes(token));
}
