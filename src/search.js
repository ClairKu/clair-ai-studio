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

export function reportSearchScore(
  report,
  query,
  { group = {}, workTypeName = "" } = {},
) {
  const tokens = searchTokens(query);
  if (!tokens.length) return 1;

  const fields = {
    title: normalizeSearchText(report.title),
    tags: normalizeSearchText((report.tags || []).join(" ")),
    source: normalizeSearchText(report.source),
    content: normalizeSearchText(reportContentText(report)),
    type: normalizeSearchText(workTypeName),
    topic: normalizeSearchText([group.name, group.description].filter(Boolean).join(" ")),
    url: normalizeSearchText(report.url),
    access: normalizeSearchText([report.access, ACCESS_SEARCH_LABELS[report.access]].filter(Boolean).join(" ")),
  };
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
    reportContentText(report),
  ].filter(Boolean).join(" "));

  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    if (fields.title === token) score += 600;
    else if (fields.title.startsWith(token)) score += 360;
    else if (fields.title.includes(token)) score += 280;
    if ((report.tags || []).some((tag) => normalizeSearchText(tag) === token)) score += 150;
    else if (fields.tags.includes(token)) score += 110;
    if (fields.source.includes(token)) score += 75;
    if (fields.type.includes(token)) score += 60;
    if (fields.topic.includes(token)) score += 45;
    if (fields.content.includes(token)) score += 32;
    if (fields.url.includes(token)) score += 18;
    if (fields.access.includes(token)) score += 8;
  }
  return score;
}
