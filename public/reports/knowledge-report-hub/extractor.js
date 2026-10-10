const NUMBER_PATTERN = /(?:[$¥￥€£]\s*)?-?\d[\d,.]*(?:\.\d+)?\s*(?:%|％|亿|万|兆|B|M|K|美元|元|人|家|项|个|次|倍|天|月|年|小时|分钟|GB|TB)?/gi;
const TYPE_RULES = [
  ["risk", ["风险", "下降", "落后", "不足", "限制", "挑战", "缺口", "失败", "隐患", "警惕", "不可", "未能"]],
  ["opportunity", ["机会", "增长", "提升", "潜力", "空间", "领先", "突破", "加速", "红利"]],
  ["action", ["建议", "应该", "需要", "优先", "行动", "下一步", "应当", "可以", "必须", "计划"]],
  ["metric", ["达到", "占比", "同比", "环比", "增长率", "规模", "用户", "收入", "渗透率", "准确率"]],
];

const CATEGORY_RULES = [
  ["AI 与 Agent", ["ai", "agent", "模型", "智能体", "大语言", "llm", "机器学习", "生成式"]],
  ["用户与增长", ["用户", "增长", "转化", "留存", "活跃", "获客", "渗透", "客群"]],
  ["产品与体验", ["产品", "功能", "体验", "界面", "流程", "需求", "app", "服务"]],
  ["投研与市场", ["基金", "策略", "市场", "收益", "回撤", "资产", "投资", "组合"]],
  ["经营与组织", ["企业", "组织", "管理", "商业", "收入", "成本", "规模化", "治理"]],
];

const STOP_WORDS = new Set([
  "以及", "一个", "一种", "这个", "那个", "我们", "他们", "已经", "可以", "需要", "进行", "通过", "对于", "其中", "因此", "但是", "如果", "没有", "不是", "报告", "数据", "研究", "内容", "the", "and", "for", "with", "that", "this", "from", "into", "are", "was", "were",
]);

function uid(prefix = "id") {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function normalizeText(value = "") {
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html = "") {
  if (typeof DOMParser === "undefined") {
    return normalizeText(String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  }
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script,style,noscript,svg,canvas,form,nav,footer").forEach((node) => node.remove());
  return normalizeText(document.body?.innerText || document.documentElement?.textContent || "");
}

function xmlText(xml = "") {
  const decoded = String(xml)
    .replace(/<a:br\s*\/?\s*>/gi, "\n")
    .replace(/<w:tab\s*\/?\s*>/gi, "\t")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
  return normalizeText(decoded);
}

function extensionOf(name = "") {
  return String(name).toLowerCase().split(".").pop() || "";
}

function fileKind(file) {
  const extension = extensionOf(file.name);
  if (file.type === "application/pdf" || extension === "pdf") return "pdf";
  if (["docx", "doc"].includes(extension)) return "word";
  if (["xlsx", "xls", "csv"].includes(extension)) return "sheet";
  if (["pptx", "ppt"].includes(extension)) return "slides";
  if (["html", "htm"].includes(extension) || file.type === "text/html") return "html";
  if (["mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(extension) || file.type.startsWith("video/")) return "video";
  if (["mp3", "m4a", "wav", "aac", "ogg"].includes(extension) || file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(extension)) return "image";
  return "text";
}

async function extractPdf(file, onProgress) {
  const pdfjs = await import("./vendor/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.mjs", import.meta.url).href;
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await task.promise;
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    onProgress?.(`正在读取 PDF · ${index}/${pdf.numPages}`);
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = normalizeText(content.items.map((item) => item.str || "").join(" "));
    if (text) pages.push(`[第 ${index} 页]\n${text}`);
  }
  return { text: pages.join("\n\n"), pageCount: pdf.numPages };
}

async function extractWord(file) {
  if (extensionOf(file.name) !== "docx") throw new Error("旧版 .doc 请先另存为 .docx；文件仍会保留在资料库");
  const mammoth = globalThis.mammoth;
  if (!mammoth?.extractRawText) throw new Error("Word 解析器尚未加载，请稍后重试");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: normalizeText(result.value), warnings: result.messages?.map((item) => item.message) || [] };
}

async function extractWorkbook(file) {
  const XLSX = globalThis.XLSX;
  if (!XLSX?.read) throw new Error("表格解析器尚未加载，请稍后重试");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const text = workbook.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false });
    return `[工作表：${name}]\n${csv}`;
  }).join("\n\n");
  return { text: normalizeText(text), sheets: workbook.SheetNames };
}

async function extractSlides(file) {
  if (extensionOf(file.name) !== "pptx") throw new Error("旧版 .ppt 请先另存为 .pptx；文件仍会保留在资料库");
  const JSZip = globalThis.JSZip;
  if (!JSZip?.loadAsync) throw new Error("演示文稿解析器尚未加载，请稍后重试");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/i)?.[1]) - Number(b.match(/slide(\d+)/i)?.[1]));
  const texts = [];
  for (const [index, name] of slides.entries()) {
    const xml = await zip.file(name)?.async("string");
    const text = xmlText(xml || "");
    if (text) texts.push(`[第 ${index + 1} 页]\n${text}`);
  }
  return { text: normalizeText(texts.join("\n\n")), pageCount: slides.length };
}

async function extractPlain(file) {
  const bytes = await file.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return { text: normalizeText(text) };
}

export async function extractFile(file, onProgress) {
  const kind = fileKind(file);
  let result = { text: "" };
  try {
    if (kind === "pdf") result = await extractPdf(file, onProgress);
    else if (kind === "word") result = await extractWord(file);
    else if (kind === "sheet") result = await extractWorkbook(file);
    else if (kind === "slides") result = await extractSlides(file);
    else if (kind === "html") result = { text: stripHtml(await file.text()) };
    else if (["image", "video", "audio"].includes(kind)) result = { text: "", needsTranscript: true };
    else result = await extractPlain(file);
  } catch (error) {
    return {
      title: file.name,
      kind,
      text: "",
      error: error.message || "无法解析文件内容",
      needsTranscript: true,
    };
  }
  return {
    title: inferTitle(result.text, file.name.replace(/\.[^.]+$/, "")),
    kind,
    ...result,
  };
}

export function inferTitle(text = "", fallback = "未命名材料") {
  const lines = normalizeText(text).split("\n").map((line) => line.trim()).filter(Boolean);
  const heading = lines.find((line) => line.length >= 4 && line.length <= 80 && !/^\[第\s*\d+\s*页\]$/.test(line));
  return (heading || fallback || "未命名材料").replace(/^#+\s*/, "").slice(0, 90);
}

export function inferCategory(text = "") {
  const source = String(text).toLowerCase();
  let best = ["其他", 0];
  for (const [category, words] of CATEGORY_RULES) {
    const score = words.reduce((total, word) => total + (source.split(word).length - 1), 0);
    if (score > best[1]) best = [category, score];
  }
  return best[0];
}

function sentenceType(sentence) {
  const source = sentence.toLowerCase();
  for (const [type, words] of TYPE_RULES) {
    if (words.some((word) => source.includes(word))) return type;
  }
  return /(?:[$¥￥€£]\s*)?-?\d[\d,.]*(?:\.\d+)?\s*(?:%|％|亿|万|兆|B|M|K|美元|元|人|家|项|个|次|倍|天|月|年|小时|分钟|GB|TB)?/i.test(sentence) ? "metric" : "insight";
}

function typeLabel(type) {
  return ({ metric: "关键数据", risk: "风险信号", opportunity: "机会判断", action: "行动建议", insight: "核心结论" })[type] || "核心结论";
}

function titleFromSentence(sentence, type) {
  const clean = sentence.replace(/^[-•·\d.)、\s]+/, "").replace(/[。；;!?！？].*$/, "").trim();
  if (clean.length <= 34) return clean;
  const pivot = clean.slice(0, 42).search(/[，,:：]/);
  const title = pivot >= 12 ? clean.slice(0, pivot) : clean.slice(0, 32);
  return `${title.replace(/[，,:：\s]+$/, "")}…`;
}

function preferredMetric(metrics = []) {
  return [...metrics].sort((left, right) => {
    const score = (value) => {
      if (/%|％/.test(value)) return 5;
      if (/[$¥￥€£]|美元|元|亿|万|兆|B|M|K/i.test(value)) return 4;
      if (/倍|人|家|项|个|次|天|月|小时|分钟|GB|TB/i.test(value)) return 3;
      if (/年/.test(value)) return 1;
      return 2;
    };
    return score(right) - score(left);
  })[0] || "";
}

function sentenceScore(sentence, index) {
  let score = 0;
  const numbers = sentence.match(NUMBER_PATTERN) || [];
  score += Math.min(numbers.length * 3, 9);
  if (TYPE_RULES.some(([, words]) => words.some((word) => sentence.toLowerCase().includes(word)))) score += 3;
  if (sentence.length >= 24 && sentence.length <= 130) score += 4;
  else if (sentence.length <= 180) score += 2;
  if (index < 4) score += 2;
  if (/^(来源|注|图|表|参考|copyright)/i.test(sentence.trim())) score -= 6;
  return score;
}

function paragraphsWithOffsets(text) {
  const source = normalizeText(text);
  const blocks = source.split(/\n{2,}|(?=\[第\s*\d+\s*页\])/).map((item) => item.trim()).filter(Boolean);
  let cursor = 0;
  return blocks.map((paragraph, index) => {
    const start = source.indexOf(paragraph, cursor);
    cursor = Math.max(start + paragraph.length, cursor);
    const page = paragraph.match(/^\[第\s*(\d+)\s*页\]/)?.[1];
    return { paragraph, index, start: Math.max(start, 0), page: page ? Number(page) : null };
  });
}

export function keywordTokens(text = "") {
  const source = String(text).toLowerCase();
  const latin = source.match(/[a-z][a-z0-9-]{2,}/g) || [];
  const chineseRuns = source.match(/[\u3400-\u9fff]{2,}/g) || [];
  const chinese = chineseRuns.flatMap((run) => {
    const parts = [];
    for (let index = 0; index < Math.min(run.length - 1, 80); index += 1) parts.push(run.slice(index, index + 2));
    return parts;
  });
  const counts = new Map();
  [...latin, ...chinese].filter((token) => !STOP_WORDS.has(token)).forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([token]) => token);
}

export function extractKnowledgeCards(report, limit = 7) {
  const text = normalizeText(report.body || report.text || "");
  if (!text) {
    return [{
      id: uid("card"),
      reportId: report.id,
      type: "action",
      label: "待补充",
      title: report.kind === "video" ? "等待加入影片字幕或文字稿" : "文件已保存，等待补充可读取正文",
      summary: report.extractionError || "此格式暂未取得可抽取文字。你仍可编辑报告、补贴全文或保留原始文件。",
      metric: "",
      quote: "",
      anchor: "待补充正文",
      offset: 0,
      tags: report.tags || [],
      createdAt: report.createdAt,
      relatedCardIds: [],
    }];
  }
  const candidates = [];
  for (const block of paragraphsWithOffsets(text)) {
    const withoutMarker = block.paragraph.replace(/^\[第\s*\d+\s*页\]\s*/, "");
    const sentences = withoutMarker.split(/(?<=[。！？!?；;])\s*|\n+/).map((item) => item.trim()).filter((item) => item.length >= 16);
    sentences.forEach((sentence, sentenceIndex) => {
      const metrics = sentence.match(NUMBER_PATTERN) || [];
      const type = sentenceType(sentence);
      candidates.push({
        sentence,
        type,
        metrics,
        score: sentenceScore(sentence, sentenceIndex),
        paragraph: block.index,
        page: block.page,
        offset: block.start + Math.max(0, block.paragraph.indexOf(sentence)),
      });
    });
  }
  const ranked = candidates.sort((a, b) => b.score - a.score || a.offset - b.offset);
  const selected = [];
  for (const candidate of ranked) {
    const fingerprint = keywordTokens(candidate.sentence).slice(0, 6).join("|");
    if (selected.some((item) => item.fingerprint === fingerprint || item.sentence.includes(candidate.sentence.slice(0, 28)))) continue;
    selected.push({ ...candidate, fingerprint });
    if (selected.length >= limit) break;
  }
  return selected.map((candidate, index) => ({
    id: uid("card"),
    reportId: report.id,
    type: candidate.type,
    label: typeLabel(candidate.type),
    title: titleFromSentence(candidate.sentence, candidate.type),
    summary: candidate.sentence,
    metric: preferredMetric(candidate.metrics).trim(),
    quote: candidate.sentence,
    anchor: candidate.page ? `第 ${candidate.page} 页` : `第 ${candidate.paragraph + 1} 段`,
    offset: candidate.offset,
    tags: [...new Set([...(report.tags || []), ...keywordTokens(candidate.sentence).slice(0, 3)])].slice(0, 6),
    createdAt: report.createdAt,
    order: index,
    relatedCardIds: [],
  }));
}

function similarity(a, b) {
  const left = new Set(keywordTokens(a));
  const right = new Set(keywordTokens(b));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.max(4, Math.min(left.size, right.size));
}

export function linkKnowledgeGraph(reports, cards) {
  const linkedCards = cards.map((card) => {
    const related = cards
      .filter((candidate) => candidate.id !== card.id)
      .map((candidate) => ({ id: candidate.id, score: similarity(`${card.title} ${card.summary} ${(card.tags || []).join(" ")}`, `${candidate.title} ${candidate.summary} ${(candidate.tags || []).join(" ")}`) + (candidate.reportId !== card.reportId ? .08 : 0) }))
      .filter((item) => item.score >= .16)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.id);
    return { ...card, relatedCardIds: related };
  });
  const linkedReports = reports.map((report) => {
    const related = reports
      .filter((candidate) => candidate.id !== report.id)
      .map((candidate) => ({ id: candidate.id, score: similarity(`${report.title} ${report.category} ${(report.tags || []).join(" ")}`, `${candidate.title} ${candidate.category} ${(candidate.tags || []).join(" ")}`) }))
      .filter((item) => item.score >= .13)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.id);
    return { ...report, relatedReportIds: related };
  });
  return { reports: linkedReports, cards: linkedCards };
}

export function createReportRecord({ title, body = "", url = "", kind = "text", file = null, extractionError = "", source = "手动导入" }) {
  const normalized = normalizeText(body);
  const createdAt = new Date().toISOString();
  const category = inferCategory(`${title} ${normalized}`);
  const tags = keywordTokens(`${title} ${normalized}`).slice(0, 6);
  return {
    id: uid("report"),
    title: title || inferTitle(normalized),
    body: normalized,
    url,
    kind,
    category,
    tags,
    source,
    fileName: file?.name || "",
    fileType: file?.type || "",
    fileSize: file?.size || 0,
    extractionError,
    createdAt,
    updatedAt: createdAt,
    archived: false,
    relatedReportIds: [],
  };
}

export function reportSearchText(report, cards = []) {
  return [
    report.title,
    report.body,
    report.source,
    report.category,
    ...(report.tags || []),
    ...cards.filter((card) => card.reportId === report.id).flatMap((card) => [card.title, card.summary, ...(card.tags || [])]),
  ].filter(Boolean).join(" ").toLowerCase();
}

export function cardSearchText(card, report) {
  return [card.label, card.title, card.summary, card.quote, ...(card.tags || []), report?.title, report?.category].filter(Boolean).join(" ").toLowerCase();
}
