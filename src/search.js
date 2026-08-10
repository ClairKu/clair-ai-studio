const ACCESS_SEARCH_LABELS = {
  production: "生产 直达 public",
  org: "组织 登录 restricted",
  account: "账号 登录 restricted",
};

const SEARCH_FIELD_ORDER = ["title", "category", "tags", "content"];
const SEARCH_FIELD_WEIGHTS = {
  title: 280,
  category: 180,
  tags: 110,
  content: 36,
  archive: 24,
};

const HAN_RUN_PATTERN = /\p{Script=Han}+/gu;
const LATIN_WORD_PATTERN = /[a-z0-9]+/g;

export function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenScript(token) {
  return /^\p{Script=Han}$/u.test(token) ? "han" : "latin";
}

export function searchTokens(query = "") {
  const parts = normalizeSearchText(query).match(/\p{Script=Han}+|[a-z0-9]+/gu) || [];
  const tokens = [];
  let singleCharacterRun = "";
  let singleCharacterScript = "";
  const flushSingleCharacterRun = () => {
    if (singleCharacterRun) tokens.push(singleCharacterRun);
    singleCharacterRun = "";
    singleCharacterScript = "";
  };

  parts.forEach((part) => {
    const characters = Array.from(part);
    const script = tokenScript(part);
    if (characters.length === 1) {
      if (singleCharacterRun && singleCharacterScript !== script) flushSingleCharacterRun();
      singleCharacterRun += part;
      singleCharacterScript = script;
      return;
    }
    flushSingleCharacterRun();
    tokens.push(part);
  });
  flushSingleCharacterRun();
  return tokens;
}

function compactSearchText(value = "") {
  return normalizeSearchText(value).replace(/\s+/g, "");
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

function prepareSearchFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, {
    value,
    compact: value.replace(/\s+/g, ""),
    hanRuns: value.match(HAN_RUN_PATTERN) || [],
    latinWords: value.match(LATIN_WORD_PATTERN) || [],
  }]));
}

function singleEditDistance(left, right) {
  const a = Array.from(left);
  const b = Array.from(right);
  if (Math.abs(a.length - b.length) > 1) return 2;
  if (a.length === b.length) {
    const mismatches = [];
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) mismatches.push(index);
      if (mismatches.length > 2) return 2;
    }
    if (mismatches.length <= 1) return mismatches.length;
    const [first, second] = mismatches;
    return second === first + 1 && a[first] === b[second] && a[second] === b[first]
      ? 1
      : 2;
  }

  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let shortIndex = 0;
  let longIndex = 0;
  let edits = 0;
  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    edits += 1;
    longIndex += 1;
    if (edits > 1) return 2;
  }
  return 1;
}

function damerauLevenshteinWithin(left, right, maximumDistance) {
  if (maximumDistance <= 1) return singleEditDistance(left, right);
  const a = Array.from(left);
  const b = Array.from(right);
  if (Math.abs(a.length - b.length) > maximumDistance) return maximumDistance + 1;
  const rows = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0));
  for (let row = 0; row <= a.length; row += 1) rows[row][0] = row;
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) {
    let rowMinimum = maximumDistance + 1;
    for (let column = 1; column <= b.length; column += 1) {
      const substitutionCost = a[row - 1] === b[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + substitutionCost,
      );
      if (
        row > 1 &&
        column > 1 &&
        a[row - 1] === b[column - 2] &&
        a[row - 2] === b[column - 1]
      ) {
        rows[row][column] = Math.min(rows[row][column], rows[row - 2][column - 2] + 1);
      }
      rowMinimum = Math.min(rowMinimum, rows[row][column]);
    }
    if (rowMinimum > maximumDistance) return maximumDistance + 1;
  }
  return rows[a.length][b.length];
}

function fuzzyDistanceLimit(token) {
  const length = Array.from(token).length;
  if (/^\p{Script=Han}+$/u.test(token)) {
    if (length < 2) return 0;
    return length >= 7 ? 2 : 1;
  }
  if (length < 4) return 0;
  return length >= 8 ? 2 : 1;
}

function fuzzyCandidateDistance(token, preparedField, fieldName) {
  const maximumDistance = fuzzyDistanceLimit(token);
  if (!maximumDistance) return Infinity;
  const isHan = /^\p{Script=Han}+$/u.test(token);
  const tokenLength = Array.from(token).length;
  if (isHan && tokenLength < 4 && fieldName === "content") return Infinity;

  let bestDistance = maximumDistance + 1;
  if (!isHan) {
    preparedField.latinWords.forEach((candidate) => {
      if (Math.abs(candidate.length - token.length) > maximumDistance) return;
      bestDistance = Math.min(
        bestDistance,
        damerauLevenshteinWithin(token, candidate, maximumDistance),
      );
    });
    return bestDistance <= maximumDistance ? bestDistance : Infinity;
  }

  const tokenCharacters = Array.from(token);
  preparedField.hanRuns.forEach((run) => {
    if (bestDistance === 1 && maximumDistance === 1) return;
    const characters = Array.from(run);
    const minimumLength = Math.max(2, tokenLength - maximumDistance);
    const maximumLength = Math.min(characters.length, tokenLength + maximumDistance);
    for (let length = minimumLength; length <= maximumLength; length += 1) {
      for (let start = 0; start <= characters.length - length; start += 1) {
        const candidate = characters.slice(start, start + length).join("");
        bestDistance = Math.min(
          bestDistance,
          damerauLevenshteinWithin(tokenCharacters.join(""), candidate, maximumDistance),
        );
        if (bestDistance === 1 && maximumDistance === 1) return;
      }
    }
  });
  return bestDistance <= maximumDistance ? bestDistance : Infinity;
}

function exactFieldMatch(token, field) {
  const isLatin = /^[a-z0-9]+$/.test(token);
  if (isLatin && token.length <= 2) {
    if (field.latinWords.includes(token)) return { quality: 1, fuzzy: false };
    return null;
  }
  if (field.value.includes(token)) return { quality: 1, fuzzy: false };
  if (Array.from(token).length > 1 && field.compact.includes(token)) {
    return { quality: 0.94, fuzzy: false };
  }
  return null;
}

function tokenMatchesFields(token, preparedFields, { allowFuzzy = true } = {}) {
  const exactMatches = Object.entries(preparedFields)
    .map(([field, prepared]) => {
      const match = exactFieldMatch(token, prepared);
      return match ? { field, ...match } : null;
    })
    .filter(Boolean);
  if (exactMatches.length || !allowFuzzy) return exactMatches;

  return Object.entries(preparedFields)
    .map(([field, prepared]) => {
      const distance = fuzzyCandidateDistance(token, prepared, field);
      if (!Number.isFinite(distance)) return null;
      return {
        field,
        fuzzy: true,
        quality: distance === 1 ? 0.46 : 0.3,
      };
    })
    .filter(Boolean);
}

function scoreTokenMatches(matches) {
  return matches.reduce((total, match) =>
    total + (SEARCH_FIELD_WEIGHTS[match.field] || 20) * match.quality, 0);
}

function segmentHanToken(token, preparedFields, { allowFuzzy }) {
  const characters = Array.from(token);
  if (characters.length < 4) return null;
  const memo = new Map();
  const solve = (start) => {
    if (start === characters.length) {
      return { matches: [], rawScore: 0, pieceCount: 0, score: 0, fuzzy: false };
    }
    if (memo.has(start)) return memo.get(start);
    let best = null;
    const remaining = characters.length - start;
    const maximumLength = Math.min(6, remaining);
    for (let length = maximumLength; length >= 2; length -= 1) {
      if (remaining - length === 1) continue;
      const piece = characters.slice(start, start + length).join("");
      const matches = tokenMatchesFields(piece, preparedFields, { allowFuzzy });
      if (!matches.length) continue;
      const rest = solve(start + length);
      if (!rest) continue;
      const candidate = {
        matches: [{ token: piece, matches }, ...rest.matches],
        rawScore: scoreTokenMatches(matches) + rest.rawScore,
        pieceCount: rest.pieceCount + 1,
        fuzzy: matches.some((match) => match.fuzzy) || rest.fuzzy,
      };
      candidate.score = (candidate.rawScore / candidate.pieceCount) *
        (candidate.fuzzy ? 0.62 : 0.82);
      if (!best || candidate.score > best.score) best = candidate;
    }
    memo.set(start, best);
    return best;
  };
  return solve(0);
}

function matchQueryToken(token, preparedFields) {
  const exactMatches = tokenMatchesFields(token, preparedFields, { allowFuzzy: false });
  if (exactMatches.length) {
    return {
      matches: [{ token, matches: exactMatches }],
      score: scoreTokenMatches(exactMatches),
      fuzzy: false,
    };
  }

  if (/^\p{Script=Han}+$/u.test(token)) {
    const exactSegments = segmentHanToken(token, preparedFields, { allowFuzzy: false });
    if (exactSegments) return exactSegments;
  }

  const fuzzyMatches = tokenMatchesFields(token, preparedFields);
  if (fuzzyMatches.length) {
    return {
      matches: [{ token, matches: fuzzyMatches }],
      score: scoreTokenMatches(fuzzyMatches),
      fuzzy: true,
    };
  }

  if (/^\p{Script=Han}+$/u.test(token)) {
    return segmentHanToken(token, preparedFields, { allowFuzzy: true });
  }
  return null;
}

function queryMatchDetails(fields, query) {
  const tokens = searchTokens(query);
  if (!tokens.length) return { matched: true, fields: [], score: 1, fuzzy: false };
  const preparedFields = prepareSearchFields(fields);
  const tokenDetails = tokens.map((token) => matchQueryToken(token, preparedFields));
  if (tokenDetails.some((detail) => !detail)) {
    return { matched: false, fields: [], score: 0, fuzzy: false };
  }
  const matchedFields = new Set();
  tokenDetails.forEach((detail) => detail.matches.forEach(({ matches }) =>
    matches.forEach(({ field }) => matchedFields.add(field))));
  return {
    matched: true,
    fields: Object.keys(fields).filter((field) => matchedFields.has(field)),
    score: tokenDetails.reduce((total, detail) => total + detail.score, 0),
    fuzzy: tokenDetails.some((detail) => detail.fuzzy),
  };
}

export function reportSearchDetails(
  report,
  query,
  { group = {}, workTypeName = "" } = {},
) {
  const fields = reportSearchFields(report, { group, workTypeName });
  const details = queryMatchDetails(fields, query);
  if (!details.matched || !searchTokens(query).length) return details;

  const compactQuery = compactSearchText(query);
  const compactTitle = fields.title.replace(/\s+/g, "");
  let titleBoost = 0;
  if (compactTitle === compactQuery) titleBoost = 900;
  else if (compactTitle.startsWith(compactQuery)) titleBoost = 520;
  return {
    ...details,
    fields: SEARCH_FIELD_ORDER.filter((field) => details.fields.includes(field)),
    score: details.score + titleBoost,
  };
}

export function reportMatchesQuery(report, query, context = {}) {
  return reportSearchDetails(report, query, context).matched;
}

export function reportSearchMatchFields(report, query, context = {}) {
  return reportSearchDetails(report, query, context).fields;
}

export function reportSearchScore(report, query, context = {}) {
  return reportSearchDetails(report, query, context).score;
}

export function reportArchiveMatchesQuery(report, query, context = {}) {
  if (!searchTokens(query).length) return true;
  const fields = reportSearchFields(report, context);
  const archive = normalizeSearchText([
    report.source,
    report.url,
    report.access,
    ACCESS_SEARCH_LABELS[report.access],
  ].filter(Boolean).join(" "));
  return queryMatchDetails({ ...fields, archive }, query).matched;
}
