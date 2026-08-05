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
  return reportSearchScore(report, query, { group, workTypeName }) > 0;
}

export function reportSearchScore(
  report,
  query,
  { group = {}, workTypeName = "" } = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return 1;

  const normalizedTitle = normalizeSearchText(report.title);
  const normalizedSource = normalizeSearchText(report.source);
  const normalizedGroup = normalizeSearchText(group.name);
  const normalizedGroupDesc = normalizeSearchText(group.description);
  const normalizedTags = normalizeSearchText((report.tags || []).join(" "));
  const normalizedWorkType = normalizeSearchText(workTypeName);
  const normalizedUrl = normalizeSearchText(report.url);
  const normalizedAccess = normalizeSearchText(ACCESS_SEARCH_LABELS[report.access]);
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

  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    if (normalizedTitle.includes(token)) score += 140;
    if ((report.tags || []).some((tag) => normalizeSearchText(tag) === token)) score += 60;
    if (normalizedTags.includes(token)) score += 40;
    if (normalizedSource.includes(token)) score += 35;
    if (normalizedUrl.includes(token)) score += 25;
    if (normalizedWorkType.includes(token)) score += 30;
    if (normalizedGroup.includes(token) || normalizedGroupDesc.includes(token)) score += 20;
    if (normalizedAccess.includes(token)) score += 8;
  }
  return score + normalizedTitle.length * 0.01;
}
