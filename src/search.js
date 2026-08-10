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

function reportContentText(report) {
  const savedFiles = Array.isArray(report.savedFiles)
    ? report.savedFiles.flatMap((file) => [file?.name, file?.content, file?.excerpt])
    : [];
  return [
    report.description,
    report.savedContent,
    report.savedHtml,
    report.searchContent,
    ...savedFiles,
  ].filter(Boolean).join(" ");
}

function reportSearchFields(report, { group = {}, workTypeName = "" } = {}) {
  return {
    title: normalizeSearchText(report.title),
    category: normalizeSearchText([
      workTypeName,
      group.name,
      group.description,
    ].filter(Boolean).join(" ")),
    tags: normalizeSearchText((report.tags || []).join(" ")),
    content: normalizeSearchText(reportContentText(report)),
  };
}

export function reportSearchMatchFields(
  report,
  query,
  context = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const fields = reportSearchFields(report, context);
  return Object.entries(fields)
    .filter(([, value]) => value && tokens.some((token) => value.includes(token)))
    .map(([field]) => field);
}

export function reportSearchScore(
  report,
  query,
  { group = {}, workTypeName = "" } = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return 1;

  const fields = reportSearchFields(report, { group, workTypeName });
  const haystack = Object.values(fields).join(" ");

  let score = 0;
  if (fields.title === normalizeSearchText(query)) score += 900;
  else if (fields.title.startsWith(normalizeSearchText(query))) score += 520;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    if (fields.title === token) score += 420;
    else if (fields.title.startsWith(token)) score += 340;
    else if (fields.title.includes(token)) score += 280;
    if (fields.category === token) score += 220;
    else if (fields.category.includes(token)) score += 180;
    if ((report.tags || []).some((tag) => normalizeSearchText(tag) === token)) score += 140;
    else if (fields.tags.includes(token)) score += 110;
    if (fields.content.includes(token)) score += 36;
  }
  return score;
}

export function reportArchiveMatchesQuery(
  report,
  query,
  context = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return true;
  const fields = reportSearchFields(report, context);
  const archiveHaystack = normalizeSearchText([
    ...Object.values(fields),
    report.source,
    report.url,
    report.access,
    ACCESS_SEARCH_LABELS[report.access],
  ].filter(Boolean).join(" "));
  return tokens.every((token) => archiveHaystack.includes(token));
}
