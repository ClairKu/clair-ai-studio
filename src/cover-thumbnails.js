// 卡片缩图生成器：根据报告元信息（标题 / 工作类型 / 主题 / 标签 / 日期）
// 在浏览器端生成设计感封面 SVG，供“刷新缩图”按钮循环切换。
// 只在 localStorage 里记录所选风格编号，SVG 本身在渲染时即时生成。

export const COVER_VARIANT_COUNT = 7;

const CANVAS_W = 1200;
const CANVAS_H = 675;
const SANS = "PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif";
const SERIF = "Songti SC, STSong, Noto Serif SC, serif";

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashCode(text = "") {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function charUnits(char) {
  return /[⺀-﫿＀-￯]/.test(char) ? 1 : 0.55;
}

function wrapText(text = "", unitsPerLine = 11, maxLines = 3) {
  const chars = [...String(text).trim()];
  const lines = [];
  let line = "";
  let units = 0;
  for (const char of chars) {
    const width = charUnits(char);
    if (units + width > unitsPerLine && line) {
      lines.push(line);
      line = "";
      units = 0;
      if (lines.length === maxLines) break;
    }
    line += char;
    units += width;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines && line) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
  }
  return lines.length ? lines : [String(text).slice(0, 12)];
}

function titleLinesMarkup(lines, options) {
  const { x, startY, lineHeight, fill, fontSize, fontFamily, fontWeight = 800, anchor = "start", letterSpacing = 0 } = options;
  return lines
    .map((line, index) => `<text x="${x}" y="${startY + index * lineHeight}" fill="${fill}" font-size="${fontSize}"
      font-weight="${fontWeight}" font-family="${fontFamily}" text-anchor="${anchor}"
      ${letterSpacing ? `letter-spacing="${letterSpacing}"` : ""}>${xmlEscape(line)}</text>`)
    .join("");
}

function coverContext(report, extras = {}) {
  const title = report?.title || "未命名成果";
  const kicker = extras.workTypeLabel || "服务成果";
  const group = extras.groupLabel || "";
  const date = String(report?.createdAt || report?.modifiedAt || "").slice(0, 10);
  const hiddenTags = new Set(["HTML", "手动保存", "生产", kicker, group]);
  const tags = (report?.tags || []).filter((tag) => !hiddenTags.has(tag)).slice(0, 3);
  return {
    title,
    kicker,
    group,
    date,
    tags,
    seed: hashCode(report?.id || title),
    profile: coverContentProfile(report),
  };
}

// ---- 内容速览：从报告自身内容提取指标与要点 ----

const CONTENT_CACHE_KEY = "clair-report-cover-content-v1";
const CONTENT_FETCH_TIMEOUT_MS = 6000;
const contentFetchAttempts = new Set();

function loadContentProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONTENT_CACHE_KEY));
    if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  } catch {
    // Fall through to an empty cache (invalid data, or non-browser runtime).
  }
  return {};
}

const contentProfiles = loadContentProfiles();

function saveContentProfiles() {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(contentProfiles));
  } catch {
    // Cache is an optimization only; rendering falls back to derived profiles.
  }
}

const SEGMENT_SPLIT = /[｜|→×•\n;；]/;

function extractStats(text, limit = 3) {
  const stats = [];
  const seen = new Set();
  const pattern = /(?:约|超|近)?\d[\d,，.]*(?:\s*(?:万亿|亿|万))?(?:\s*(?:元|人|户|次|个|条|天|日|年|月|份|款|家|项|倍|篇|页|场|支|只|位|名|分钟|小时|%|％))?\+?/g;
  let match;
  while ((match = pattern.exec(text)) !== null && stats.length < limit) {
    const raw = match[0].replace(/\s+/g, "");
    const digits = raw.replace(/\D/g, "");
    const hasUnit = /万亿|亿|万|分钟|小时|[%％元人户次条天日年月份款家项倍篇页场支只位名]/.test(raw);
    if (!hasUnit && !(digits.length >= 3 && digits.length <= 6 && /[,，.]/.test(raw))) continue;
    if (digits.length >= 7 && !/[,，.]/.test(raw)) continue;
    if (/^(?:19|20)\d{2}(?:[-.．年]\d{0,2})*$/.test(raw)) continue;
    if (/^\d{1,2}[.．]\d{1,2}(?:[.．]\d{1,2})?$/.test(raw)) continue;
    const before = text.slice(Math.max(0, match.index - 14), match.index);
    const leading = (before.split(/[｜|→×•\n;；，。：:、()（）\s/=＝]+/).filter(Boolean).pop() || "")
      .replace(/[\d,，.%％+＋]+$/, "");
    const after = text.slice(match.index + raw.length, match.index + raw.length + 12);
    const trailing = (after.match(/^([⺀-﫿A-Za-z]{2,10})/) || [])[1] || "";
    const label = (leading.length >= 2 ? leading : trailing)
      .replace(/^[\s\-_./·:：'"“”]+/, "")
      .replace(/^[的了中与和及等共计约超近有并且或者最也仍]+/, "")
      .slice(0, 10);
    if (label.length < 2 || /^(?:19|20)\d{2}/.test(label) || /[的了中与和及或在从含]$/.test(label)) continue;
    const key = `${label}|${raw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stats.push({ value: raw, label });
  }
  return stats;
}

function extractPoints(text, title = "", limit = 3) {
  return [...new Set(
    String(text)
      .split(SEGMENT_SPLIT)
      .map((segment) => segment.trim().replace(/^[·•\-—\s]+/, "")),
  )]
    .filter((segment) => segment.length >= 6 && segment.length <= 34 &&
      segment !== title && !title.includes(segment))
    .slice(0, limit);
}

function deriveProfileFromText(text, title = "") {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return { subtitle: "", stats: [], points: [] };
  const firstSegment = compact.split(SEGMENT_SPLIT).map((s) => s.trim()).find(Boolean) || "";
  return {
    subtitle: firstSegment.slice(0, 44),
    stats: extractStats(compact),
    points: extractPoints(compact, title),
  };
}

function parseHtmlProfile(html, title = "") {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,style,noscript,svg").forEach((node) => node.remove());
    const headings = [...doc.querySelectorAll("h2,h3")]
      .map((node) => node.textContent.replace(/\s+/g, " ").trim())
      .filter((text) => text.length >= 4 && text.length <= 30 && text !== title);
    const bodyText = (doc.body?.textContent || "").replace(/\s+/g, " ").slice(0, 8000);
    const derived = deriveProfileFromText(bodyText, title);
    const points = [...new Set([...headings, ...derived.points])].slice(0, 3);
    const h1 = doc.querySelector("h1")?.textContent.replace(/\s+/g, " ").trim() || "";
    return {
      subtitle: (h1 && h1 !== title ? h1 : derived.subtitle).slice(0, 44),
      stats: derived.stats,
      points,
    };
  } catch {
    return { subtitle: "", stats: [], points: [] };
  }
}

export function coverContentProfile(report) {
  const cached = report?.id ? contentProfiles[report.id] : null;
  if (cached && (cached.stats?.length || cached.points?.length)) return cached;
  return deriveProfileFromText(
    [report?.source, report?.summary, report?.description].filter(Boolean).join("｜"),
    report?.title || "",
  );
}

// 抓取报告正文升级内容画像；成功时返回新画像，无升级返回 null。
export async function ensureCoverContentProfile(report, { localHtml = "" } = {}) {
  const id = report?.id;
  if (!id || contentProfiles[id]?.fetched || contentFetchAttempts.has(id)) return null;
  contentFetchAttempts.add(id);
  let html = localHtml || "";
  if (!html && /^https?:/i.test(report?.url || "")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONTENT_FETCH_TIMEOUT_MS);
      const response = await fetch(report.url, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) html = await response.text();
    } catch {
      // Keep the derived profile when the report page is unreachable.
    }
  }
  if (!html) return null;
  const profile = parseHtmlProfile(html, report.title || "");
  if (!profile.stats.length && !profile.points.length) return null;
  contentProfiles[id] = { ...profile, fetched: true };
  saveContentProfiles();
  return profile;
}

const ACCENT_WHEEL = [
  { main: "#1B88EE", deep: "#0B5192", soft: "#E5F2FF" },
  { main: "#0F9D77", deep: "#0A5C46", soft: "#E3F6EF" },
  { main: "#C4831B", deep: "#6E4A0E", soft: "#FAF0DC" },
  { main: "#7C5CD6", deep: "#443075", soft: "#EFEAFB" },
  { main: "#D65C7A", deep: "#7A3347", soft: "#FBEAEF" },
];

function pickAccent(seed, offset = 0) {
  return ACCENT_WHEEL[(seed + offset) % ACCENT_WHEEL.length];
}

// 风格 0：内容速览 · 报告自身的指标与要点
function contentDigest(ctx) {
  const accent = pickAccent(ctx.seed, 1);
  const profile = ctx.profile || { stats: [], points: [], subtitle: "" };
  const stats = (profile.stats || []).slice(0, 3);
  const points = (profile.points || []).slice(0, stats.length ? 2 : 4);
  const lines = wrapText(ctx.title, 15, 2);
  const parts = [];
  parts.push(`<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#FAF9F6"/>`);
  parts.push(`<rect x="0" y="0" width="14" height="${CANVAS_H}" fill="${accent.main}"/>`);
  parts.push(`<text x="96" y="96" fill="${accent.main}" font-size="20" font-weight="800" letter-spacing="6" font-family="${SANS}">内容速览 / ${xmlEscape(ctx.kicker)}</text>`);
  parts.push(titleLinesMarkup(lines, {
    x: 96, startY: 168, lineHeight: 62, fill: "#232A38", fontSize: 46, fontFamily: SANS,
  }));
  const afterTitleY = 168 + (lines.length - 1) * 62;
  if (stats.length) {
    const gap = 24;
    const tileWidth = Math.floor((1008 - gap * (stats.length - 1)) / stats.length);
    const tileY = afterTitleY + 62;
    stats.forEach((stat, index) => {
      const x = 96 + index * (tileWidth + gap);
      const value = String(stat.value);
      const valueSize = value.length > 8 ? 30 : value.length > 5 ? 38 : 46;
      parts.push(`<rect x="${x}" y="${tileY}" width="${tileWidth}" height="148" rx="16" fill="#FFFFFF" stroke="#E7E4DC"/>
        <text x="${x + 28}" y="${tileY + 70}" fill="${accent.deep}" font-size="${valueSize}" font-weight="800" font-family="${SANS}">${xmlEscape(value)}</text>
        <text x="${x + 28}" y="${tileY + 114}" fill="#8A90A0" font-size="21" font-family="${SANS}">${xmlEscape(stat.label)}</text>`);
    });
    points.forEach((point, index) => {
      const y = tileY + 148 + 56 + index * 48;
      parts.push(`<circle cx="104" cy="${y - 8}" r="6" fill="${accent.main}"/>
        <text x="128" y="${y}" fill="#4A5164" font-size="24" font-family="${SANS}">${xmlEscape(point.slice(0, 30))}</text>`);
    });
  } else if (points.length) {
    points.forEach((point, index) => {
      const y = afterTitleY + 96 + index * 62;
      parts.push(`<circle cx="104" cy="${y - 9}" r="7" fill="${accent.main}"/>
        <text x="132" y="${y}" fill="#3A4154" font-size="28" font-family="${SANS}">${xmlEscape(point.slice(0, 30))}</text>`);
    });
  } else {
    const subtitleLines = wrapText(profile.subtitle || ctx.tags.join(" · ") || ctx.group, 20, 3);
    parts.push(`<rect x="96" y="${afterTitleY + 56}" width="6" height="${subtitleLines.length * 52}" fill="${accent.soft}"/>`);
    parts.push(titleLinesMarkup(subtitleLines, {
      x: 128, startY: afterTitleY + 96, lineHeight: 52, fill: "#4A5164", fontSize: 27,
      fontFamily: SANS, fontWeight: 500,
    }));
  }
  parts.push(`<text x="96" y="620" fill="#9AA0AC" font-size="19" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}${ctx.group ? ` · ${xmlEscape(ctx.group)}` : ""}</text>`);
  return `\n  ${parts.join("\n  ")}`;
}

// 风格 1：藏青编辑部 · 金色书脊
function editorialNavy(ctx) {
  const lines = wrapText(ctx.title, 9, 3);
  const fontSize = lines.length > 2 ? 62 : 72;
  const lineHeight = fontSize * 1.32;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;
  return `
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#132441"/>
  <rect x="${CANVAS_W - 132}" y="0" width="132" height="${CANVAS_H}" fill="#B99055"/>
  <rect x="${CANVAS_W - 132}" y="0" width="10" height="${CANVAS_H}" fill="#0C1830"/>
  <text x="${CANVAS_W - 66}" y="92" fill="#132441" font-size="20" font-weight="700" font-family="${SANS}"
    text-anchor="middle" letter-spacing="6" transform="rotate(90 ${CANVAS_W - 66} 92)">PRIVATE CLIENT ARCHIVE</text>
  <text x="96" y="118" fill="#B99055" font-size="22" font-weight="700" letter-spacing="8" font-family="${SANS}">${xmlEscape(ctx.kicker)}</text>
  <rect x="96" y="140" width="64" height="3" fill="#B99055"/>
  ${titleLinesMarkup(lines, { x: 96, startY, lineHeight, fill: "#F4EFE6", fontSize, fontFamily: SERIF })}
  <text x="96" y="586" fill="#8FA1BF" font-size="20" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}${ctx.group ? ` · ${xmlEscape(ctx.group)}` : ""}</text>`;
}

// 风格 2：且慢蓝渐变 · 光晕
function qiemanBlue(ctx) {
  const lines = wrapText(ctx.title, 10, 3);
  const fontSize = lines.length > 2 ? 60 : 70;
  const lineHeight = fontSize * 1.3;
  const startY = 286 - ((lines.length - 1) * lineHeight) / 2;
  const chips = ctx.tags
    .map((tag, index) => {
      const width = Math.round([...tag].reduce((sum, char) => sum + charUnits(char), 0) * 24 + 44);
      const x = 96 + ctx.tags.slice(0, index).reduce((sum, prior) => sum +
        Math.round([...prior].reduce((s, char) => s + charUnits(char), 0) * 24 + 44) + 16, 0);
      return `<rect x="${x}" y="500" width="${width}" height="52" rx="26" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)"/>
        <text x="${x + width / 2}" y="534" fill="#FFFFFF" font-size="24" font-family="${SANS}" text-anchor="middle">${xmlEscape(tag)}</text>`;
    })
    .join("");
  return `
  <defs>
    <linearGradient id="qm-blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1B88EE"/><stop offset="1" stop-color="#0B5192"/>
    </linearGradient>
  </defs>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#qm-blue)"/>
  <circle cx="1050" cy="120" r="230" fill="rgba(255,255,255,0.08)"/>
  <circle cx="1180" cy="560" r="170" fill="rgba(255,255,255,0.06)"/>
  <text x="96" y="118" fill="#CBE6FF" font-size="22" font-weight="700" letter-spacing="7" font-family="${SANS}">${xmlEscape(ctx.kicker)}</text>
  ${titleLinesMarkup(lines, { x: 96, startY, lineHeight, fill: "#FFFFFF", fontSize, fontFamily: SANS })}
  ${chips}
  <text x="96" y="612" fill="rgba(255,255,255,0.62)" font-size="19" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}</text>`;
}

// 风格 3：素纸浅色 · 色带标点
function paperLight(ctx) {
  const accent = pickAccent(ctx.seed);
  const lines = wrapText(ctx.title, 10, 3);
  const fontSize = lines.length > 2 ? 60 : 70;
  const lineHeight = fontSize * 1.32;
  const startY = 306 - ((lines.length - 1) * lineHeight) / 2;
  const chips = ctx.tags
    .map((tag, index) => {
      const width = Math.round([...tag].reduce((sum, char) => sum + charUnits(char), 0) * 22 + 40);
      const x = 96 + ctx.tags.slice(0, index).reduce((sum, prior) => sum +
        Math.round([...prior].reduce((s, char) => s + charUnits(char), 0) * 22 + 40) + 14, 0);
      return `<rect x="${x}" y="506" width="${width}" height="48" rx="10" fill="${accent.soft}"/>
        <text x="${x + width / 2}" y="538" fill="${accent.deep}" font-size="22" font-family="${SANS}" text-anchor="middle">${xmlEscape(tag)}</text>`;
    })
    .join("");
  return `
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#F7F5F0"/>
  <rect x="0" y="0" width="${CANVAS_W}" height="14" fill="${accent.main}"/>
  <text x="96" y="120" fill="${accent.main}" font-size="22" font-weight="800" letter-spacing="7" font-family="${SANS}">${xmlEscape(ctx.kicker)}${ctx.group ? `　/　${xmlEscape(ctx.group)}` : ""}</text>
  ${titleLinesMarkup(lines, { x: 96, startY, lineHeight, fill: "#232A38", fontSize, fontFamily: SERIF })}
  ${chips}
  <text x="96" y="616" fill="#9AA0AC" font-size="19" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}</text>
  <circle cx="1096" cy="120" r="34" fill="none" stroke="${accent.main}" stroke-width="3"/>
  <circle cx="1096" cy="120" r="10" fill="${accent.main}"/>`;
}

// 风格 4：深空网格 · 荧光强调
function gridDark(ctx) {
  const lines = wrapText(ctx.title, 10, 3);
  const fontSize = lines.length > 2 ? 58 : 68;
  const lineHeight = fontSize * 1.3;
  const startY = 296 - ((lines.length - 1) * lineHeight) / 2;
  const gridLines = [];
  for (let x = 0; x <= CANVAS_W; x += 100) {
    gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${CANVAS_H}" stroke="#1B2A44" stroke-width="1"/>`);
  }
  for (let y = 0; y <= CANVAS_H; y += 100) {
    gridLines.push(`<line x1="0" y1="${y}" x2="${CANVAS_W}" y2="${y}" stroke="#1B2A44" stroke-width="1"/>`);
  }
  return `
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#0B1424"/>
  ${gridLines.join("")}
  <circle cx="1010" cy="150" r="120" fill="none" stroke="#47A6FF" stroke-width="2" opacity="0.75"/>
  <circle cx="1010" cy="150" r="66" fill="none" stroke="#47A6FF" stroke-width="1.4" opacity="0.45"/>
  <circle cx="1010" cy="150" r="8" fill="#47A6FF"/>
  <text x="96" y="116" fill="#47A6FF" font-size="21" font-weight="700" letter-spacing="9" font-family="${SANS}">${xmlEscape(ctx.kicker)}</text>
  ${titleLinesMarkup(lines, { x: 96, startY, lineHeight, fill: "#EAF3FF", fontSize, fontFamily: SANS })}
  <rect x="96" y="530" width="120" height="4" fill="#47A6FF"/>
  <text x="96" y="600" fill="#5F7395" font-size="19" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}${ctx.group ? ` · ${xmlEscape(ctx.group)}` : ""}</text>`;
}

// 风格 5：双色分栏 · 竖排书签
function splitDuotone(ctx) {
  const accent = pickAccent(ctx.seed, 2);
  const lines = wrapText(ctx.title, 8, 3);
  const fontSize = lines.length > 2 ? 56 : 64;
  const lineHeight = fontSize * 1.34;
  const startY = 296 - ((lines.length - 1) * lineHeight) / 2;
  const kickerChars = [...ctx.kicker].slice(0, 8);
  const vertical = kickerChars
    .map((char, index) => `<text x="200" y="${140 + index * 58}" fill="rgba(255,255,255,0.92)" font-size="40"
      font-weight="800" font-family="${SERIF}" text-anchor="middle">${xmlEscape(char)}</text>`)
    .join("");
  return `
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#F4F2ED"/>
  <rect x="0" y="0" width="400" height="${CANVAS_H}" fill="${accent.deep}"/>
  <rect x="400" y="0" width="18" height="${CANVAS_H}" fill="${accent.main}"/>
  <circle cx="200" cy="580" r="26" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>
  <text x="200" y="588" fill="#FFFFFF" font-size="20" font-weight="700" font-family="${SANS}" text-anchor="middle">C</text>
  ${vertical}
  ${titleLinesMarkup(lines, { x: 486, startY, lineHeight, fill: "#242B39", fontSize, fontFamily: SERIF })}
  <rect x="486" y="512" width="72" height="4" fill="${accent.main}"/>
  <text x="486" y="574" fill="#6E7686" font-size="20" font-family="${SANS}">${xmlEscape(ctx.tags.join(" · ") || ctx.group)}</text>
  <text x="486" y="618" fill="#9AA0AC" font-size="18" letter-spacing="3" font-family="${SANS}">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}</text>`;
}

// 风格 6：晨昏渐变 · 玻璃卡片
function gradientCard(ctx) {
  const accent = pickAccent(ctx.seed, 3);
  const lines = wrapText(ctx.title, 9, 3);
  const fontSize = lines.length > 2 ? 54 : 62;
  const lineHeight = fontSize * 1.3;
  const cardTop = 140;
  const cardHeight = 400;
  const startY = cardTop + 128 - ((lines.length - 1) * lineHeight) / 2 + (lines.length - 1) * 0;
  return `
  <defs>
    <linearGradient id="dawn" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent.deep}"/><stop offset="0.55" stop-color="${accent.main}"/><stop offset="1" stop-color="#F0C27B"/>
    </linearGradient>
  </defs>
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#dawn)"/>
  <circle cx="150" cy="600" r="200" fill="rgba(255,255,255,0.10)"/>
  <rect x="120" y="${cardTop}" width="960" height="${cardHeight}" rx="26" fill="rgba(255,255,255,0.92)"/>
  <text x="176" y="${cardTop + 70}" fill="${accent.main}" font-size="20" font-weight="800" letter-spacing="6" font-family="${SANS}">${xmlEscape(ctx.kicker)}${ctx.group ? `　/　${xmlEscape(ctx.group)}` : ""}</text>
  ${titleLinesMarkup(lines, { x: 176, startY: startY + 60, lineHeight, fill: "#222A38", fontSize, fontFamily: SANS })}
  <text x="176" y="${cardTop + cardHeight - 44}" fill="#8A90A0" font-size="19" font-family="${SANS}">${xmlEscape(ctx.tags.join(" · "))}</text>
  <text x="600" y="622" fill="rgba(255,255,255,0.85)" font-size="19" letter-spacing="4" font-family="${SANS}" text-anchor="middle">CLAIR AI STUDIO${ctx.date ? ` · ${xmlEscape(ctx.date)}` : ""}</text>`;
}

const VARIANT_RENDERERS = [contentDigest, editorialNavy, qiemanBlue, paperLight, gridDark, splitDuotone, gradientCard];

export const COVER_VARIANT_NAMES = ["内容速览", "藏青编辑部", "且慢蓝", "素纸浅色", "深空网格", "双色分栏", "晨昏渐变"];

export const CONTENT_COVER_VARIANT = 1;

export function coverThumbnailSvg(report, variant, extras = {}) {
  const renderer = VARIANT_RENDERERS[(variant - 1 + VARIANT_RENDERERS.length) % VARIANT_RENDERERS.length];
  const ctx = coverContext(report, extras);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" role="img">
  <title>${xmlEscape(ctx.title)}</title>${renderer(ctx)}
</svg>`;
}

export function coverThumbnailDataUri(report, variant, extras = {}) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(coverThumbnailSvg(report, variant, extras))}`;
}
