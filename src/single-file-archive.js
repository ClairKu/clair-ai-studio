/**
 * 单文件 HTML 档案打包器
 *
 * 工作台里点「下载 HTML」拿到的不再是一份光秃秃的 index.html——那种文件离开
 * 站点后样式、图片、视频、数据全丢。这里把一份已发布报告抓成**一个**可离线
 * 归档的 HTML：
 *
 *   - 外链 CSS / JS 直接内联（CSS 里的 @import 递归展开）
 *   - 图片、字体、SVG 等小体积资源转成 data: URI，写在引用它的地方
 *   - 视频、音频、超过阈值的大图，以及运行时才 fetch 的 JSON/JS/HTML，
 *     统一进档案清单，由文件头部的 runtime shim 还原成 blob: URL
 *   - 报告模板常把资源路径写在内联 JS / JSON 数据里（`"image":"assets/p1.png"`），
 *     所以文本资源也要扫描并改写，否则「有样式没图片」
 *   - 抓不到 / 超预算的资源退化成绝对 URL：离线看不到，联网仍可用
 *
 * 打包全部发生在浏览器里，站点本身不额外产出归档文件。
 */

const INLINE_BYTE_LIMIT = 512 * 1024;
const MAX_ASSET_BYTES = 32 * 1024 * 1024;
const MAX_TOTAL_BYTES = 160 * 1024 * 1024;
const MAX_RESOURCES = 800;
const MAX_DOCUMENT_DEPTH = 1;
const MAX_TEXT_CHAIN = 3;
const FETCH_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 180_000;

export const ASSET_TOKEN_PREFIX = "clair-asset:";

const ASSET_EXTENSIONS =
  "png|jpe?g|gif|webp|avif|svg|ico|bmp|mp4|webm|mov|m4v|ogv|mp3|wav|m4a|ogg|" +
  "woff2?|ttf|otf|css|js|mjs|json|pdf|csv|txt|xlsx?|docx?|pptx?|html?";

const SKIP_SCHEME = /^(?:data|blob|mailto|tel|javascript|about|clair-asset):/i;

const MIME_BY_EXTENSION = new Map(Object.entries({
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  bmp: "image/bmp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  ogv: "video/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  html: "text/html",
  htm: "text/html",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
}));

/* ── 纯文本工具：不依赖 DOM，便于单测 ─────────────────────────────── */

export function quotedReferencePattern() {
  return new RegExp(
    `(["'\`])((?:[^"'\`\\s<>]+?)\\.(?:${ASSET_EXTENSIONS}))((?:[?#][^"'\`\\s<>]*)?)\\1`,
    "gi",
  );
}

export function cssUrlPattern() {
  return /url\(\s*(['"]?)([^'")]+?)\1\s*\)/gi;
}

export function cssImportPattern() {
  return /@import\s+(?:url\(\s*(['"]?)([^'")]+?)\1\s*\)|(['"])([^'"]+?)\3)\s*([^;]*);?/gi;
}

export function extensionOf(path) {
  const clean = String(path).split(/[?#]/)[0];
  const match = /\.([a-z0-9]+)$/i.exec(clean);
  return match ? match[1].toLowerCase() : "";
}

export function mimeForExtension(extension) {
  return MIME_BY_EXTENSION.get(extension) || "";
}

/*
 * 代码里长得像路径的字符串多得是（`"Node.js"`、`"XxxModel.js"`、模板占位
 * `"cover-${id}.png"`），全都去抓一遍既慢又会把无关文件塞进档案。所以：
 * 带目录分隔或协议的一律当路径；光秃秃一个文件名只认图片/字体/音视频这类
 * 不会和标识符撞车的扩展名；含模板占位的直接放弃。
 */
const AMBIGUOUS_BARE_EXTENSIONS = new Set([
  "js", "mjs", "json", "html", "htm", "css", "txt", "csv", "md",
  /* 正文里常直接写文件名（「导出版本-202608121553.xlsx」），带目录的才当引用 */
  "xls", "xlsx", "doc", "docx", "ppt", "pptx", "pdf", "zip",
]);

const KNOWN_EXTENSION = new RegExp(`^(?:${ASSET_EXTENSIONS})$`, "i");

export function looksLikeResourcePath(raw) {
  const value = String(raw || "").trim();
  if (!value || value.includes("${") || value.includes("`") || value.includes(" ")) return false;
  /* `url(#gradient)`、`url(%23n)` 这类是文档内锚点/滤镜引用，不是资源。 */
  if (value.startsWith("#") || value.startsWith("%23")) return false;
  /* 正文里常有「交互版：clairku.github.io/...html」这种说明文字，
     全角标点是它和真路径的分水岭（中文文件名只含汉字，不含全角标点）。 */
  if (/[\u3000-\u303f\uff00-\uffef]/.test(value)) return false;
  if (!KNOWN_EXTENSION.test(extensionOf(value))) return false;
  if (/^https?:\/\//i.test(value) || value.startsWith("//")) return true;
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return true;
  if (value.includes("/")) return true;
  return !AMBIGUOUS_BARE_EXTENSIONS.has(extensionOf(value));
}

/** 从一段文本里找出所有可能的资源引用（去重、保持出现顺序）。 */
export function scanTextReferences(text, kind = "js") {
  const found = new Set();
  const source = String(text || "");
  const accept = (value) => {
    const candidate = String(value || "").trim();
    if (!candidate || SKIP_SCHEME.test(candidate) || !looksLikeResourcePath(candidate)) return;
    found.add(candidate);
  };
  if (kind === "css") {
    for (const match of source.matchAll(cssUrlPattern())) accept(match[2]);
  }
  for (const match of source.matchAll(quotedReferencePattern())) accept(match[2]);
  return [...found];
}

/**
 * 用 resolve(rawPath) 的返回值改写文本里的资源引用。
 * resolve 返回 null 表示「保持原样」。
 */
export function transformTextReferences(text, kind, resolve) {
  let output = String(text || "");
  if (kind === "css") {
    output = output.replace(cssUrlPattern(), (match, quote, raw) => {
      const target = String(raw).trim();
      if (SKIP_SCHEME.test(target) || !looksLikeResourcePath(target)) return match;
      const replacement = resolve(target);
      return replacement == null ? match : `url("${replacement}")`;
    });
  }
  output = output.replace(quotedReferencePattern(), (match, quote, path, suffix) => {
    if (SKIP_SCHEME.test(path) || !looksLikeResourcePath(path)) return match;
    const replacement = resolve(path);
    if (replacement == null) return match;
    const hash = suffix && suffix.startsWith("#") ? suffix : "";
    return `${quote}${replacement}${hash}${quote}`;
  });
  return output;
}

export function parseSrcset(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, ...descriptor] = part.split(/\s+/);
      return { url, descriptor: descriptor.join(" ") };
    });
}

export function serializeSrcset(entries) {
  return entries
    .map(({ url, descriptor }) => (descriptor ? `${url} ${descriptor}` : url))
    .join(", ");
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function archiveFilename(title) {
  const cleaned = String(title || "report")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${cleaned || "report"}.html`;
}

/* ── 运行时 shim：写进档案头部，负责把 token 还原成 blob: URL ────────── */

const RUNTIME_SHIM = String.raw`
(function () {
  var archive = window.__CLAIR_ARCHIVE__ || {};
  var assets = archive.assets || {};
  var TOKEN = "clair-asset:";
  var TOKEN_PATTERN = /clair-asset:([A-Za-z0-9_-]+)(\?[^"'\s)]*)?/g;
  var objectUrls = Object.create(null);
  var suffixIndex = Object.create(null);
  var reloadQueued = false;
  var pendingMedia = [];

  Object.keys(assets).forEach(function (id) {
    var source = assets[id].url || "";
    var parts = source.split(/[?#]/)[0].split("/").filter(Boolean);
    for (var take = 1; take <= Math.min(4, parts.length); take += 1) {
      var key = parts.slice(parts.length - take).join("/");
      if (!suffixIndex[key]) suffixIndex[key] = id;
    }
  });

  function toBlob(entry) {
    if (entry.text != null) {
      return new Blob([entry.text], { type: entry.mime || "text/plain;charset=utf-8" });
    }
    var binary = atob(entry.b64 || "");
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: entry.mime || "application/octet-stream" });
  }

  function urlFor(id) {
    if (!objectUrls[id]) objectUrls[id] = URL.createObjectURL(toBlob(assets[id]));
    return objectUrls[id];
  }

  function translate(value) {
    if (typeof value !== "string" || value.indexOf(TOKEN) < 0) return value;
    return value.replace(TOKEN_PATTERN, function (match, id) {
      return assets[id] ? urlFor(id) : match;
    });
  }

  /* 归档里若还有相对路径的请求（离线时会落到 file:// 或别的目录），
     用「路径尾巴」回查一次清单，尽量不让数据加载失败。 */
  function suffixIdFor(value) {
    if (typeof value !== "string" || !value) return "";
    var path;
    try {
      path = new URL(value, document.baseURI).pathname;
    } catch (error) {
      path = value;
    }
    var parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
    for (var take = Math.min(4, parts.length); take >= 1; take -= 1) {
      var key = parts.slice(parts.length - take).join("/");
      if (suffixIndex[key]) return suffixIndex[key];
    }
    return "";
  }

  function matchBySuffix(value) {
    var id = suffixIdFor(value);
    return id ? urlFor(id) : "";
  }

  function resolveRequest(value) {
    if (typeof value !== "string") return "";
    if (value.indexOf(TOKEN) >= 0) {
      var translated = translate(value.split("?")[0]);
      if (translated.indexOf("blob:") === 0) return translated;
    }
    return matchBySuffix(value);
  }

  /* 直接照着清单造一个 Response：档案常常是 file:// 打开的，越少依赖
     网络栈越稳，也省掉一次 blob 往返。 */
  function entryFor(value) {
    if (typeof value !== "string" || !value) return null;
    var id = "";
    if (value.indexOf(TOKEN) >= 0) {
      var match = /clair-asset:([A-Za-z0-9_-]+)/.exec(value);
      if (match && assets[match[1]]) id = match[1];
    }
    if (!id) id = suffixIdFor(value);
    return id ? assets[id] : null;
  }

  var nativeFetch = window.fetch;
  if (typeof nativeFetch === "function") {
    window.fetch = function (input, init) {
      try {
        var target = typeof input === "string" ? input : (input && input.url);
        var entry = entryFor(target);
        if (entry) {
          var body = entry.text != null ? entry.text : toBlob(entry);
          return Promise.resolve(new Response(body, {
            status: 200,
            headers: { "Content-Type": entry.mime || "application/octet-stream" },
          }));
        }
      } catch (error) { /* 回退到原生 fetch */ }
      return nativeFetch.apply(this, arguments);
    };
  }

  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var resolved = typeof url === "string" ? resolveRequest(url) : "";
    var args = [].slice.call(arguments);
    if (resolved) args[1] = resolved;
    return nativeOpen.apply(this, args);
  };

  var nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (typeof value === "string" && value.indexOf(TOKEN) >= 0) {
      return nativeSetAttribute.call(this, name, translate(value));
    }
    return nativeSetAttribute.apply(this, arguments);
  };

  var nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
    if (typeof value === "string" && value.indexOf(TOKEN) >= 0) {
      return nativeSetProperty.call(this, name, translate(value), priority);
    }
    return nativeSetProperty.apply(this, arguments);
  };

  [
    ["HTMLImageElement", "src"], ["HTMLImageElement", "srcset"],
    ["HTMLSourceElement", "src"], ["HTMLSourceElement", "srcset"],
    ["HTMLMediaElement", "src"], ["HTMLVideoElement", "poster"],
    ["HTMLIFrameElement", "src"], ["HTMLScriptElement", "src"],
    ["HTMLLinkElement", "href"], ["HTMLAnchorElement", "href"],
    ["HTMLEmbedElement", "src"], ["HTMLObjectElement", "data"],
    ["HTMLTrackElement", "src"],
  ].forEach(function (pair) {
    var host = window[pair[0]];
    if (!host) return;
    var descriptor = Object.getOwnPropertyDescriptor(host.prototype, pair[1]);
    if (!descriptor || !descriptor.set) return;
    Object.defineProperty(host.prototype, pair[1], {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function (value) {
        descriptor.set.call(this, typeof value === "string" ? translate(value) : value);
      },
    });
  });

  var ATTRIBUTES = ["src", "srcset", "href", "poster", "data-src", "data-poster", "style", "xlink:href"];

  function fixElement(element) {
    if (!element || element.nodeType !== 1) return;
    for (var i = 0; i < ATTRIBUTES.length; i += 1) {
      var name = ATTRIBUTES[i];
      var value = element.getAttribute && element.getAttribute(name);
      if (typeof value === "string" && value.indexOf(TOKEN) >= 0) {
        nativeSetAttribute.call(element, name, translate(value));
        if (element.tagName === "SOURCE" && element.parentNode && element.parentNode.load) {
          queueReload(element.parentNode);
        }
      }
    }
  }

  function queueReload(media) {
    if (pendingMedia.indexOf(media) < 0) pendingMedia.push(media);
    if (reloadQueued) return;
    reloadQueued = true;
    Promise.resolve().then(function () {
      reloadQueued = false;
      var queue = pendingMedia;
      pendingMedia = [];
      queue.forEach(function (item) {
        try { item.load(); } catch (error) { /* 忽略 */ }
      });
    });
  }

  function scan(root) {
    if (!root) return;
    fixElement(root);
    if (root.querySelectorAll) {
      var nodes = root.querySelectorAll("[src],[srcset],[href],[poster],[style],[data-src]");
      for (var i = 0; i < nodes.length; i += 1) fixElement(nodes[i]);
    }
  }

  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i += 1) {
      var record = records[i];
      if (record.type === "attributes") fixElement(record.target);
      for (var j = 0; j < record.addedNodes.length; j += 1) scan(record.addedNodes[j]);
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ATTRIBUTES,
  });

  document.addEventListener("DOMContentLoaded", function () { scan(document.documentElement); });
  window.__clairArchiveResolve = translate;
})();
`;

/* ── 打包实现 ─────────────────────────────────────────────────────── */

async function mapWithConcurrency(items, worker, limit = FETCH_CONCURRENCY) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function classifyKind(mime, extension) {
  if (extension === "css" || mime.includes("text/css")) return "css";
  if (["js", "mjs"].includes(extension) || mime.includes("javascript")) return "js";
  if (extension === "json" || mime.includes("json")) return "json";
  if (["html", "htm"].includes(extension) || mime.includes("text/html")) return "html";
  return "binary";
}

function decodeText(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

/**
 * 一次解析的处境：在第几层文档里、跟着引用链走了多远、路上经过哪些 URL
 * （用来断开 a.css → b.css → a.css 这类环）。
 */
function rootContext() {
  return { depth: 0, chain: 0, ancestors: new Set(), documentBase: "" };
}

class ArchiveSession {
  constructor(entryUrl, { onProgress, signal, stats, budget } = {}) {
    this.entryUrl = entryUrl;
    this.onProgress = onProgress;
    this.signal = signal;
    /* 同一份档案里所有子文档共用预算与统计，各自维护自己的清单。 */
    this.budget = budget || { bytes: 0 };
    this.stats = stats || { resources: 0, bytes: 0, inlined: 0, skipped: [], failed: [] };
    this.replacements = new Map();
    this.assets = new Map();
    this.failed = new Set();
    this.nextId = 1;
  }

  createChild(entryUrl) {
    return new ArchiveSession(entryUrl, {
      onProgress: this.onProgress,
      signal: this.signal,
      stats: this.stats,
      budget: this.budget,
    });
  }

  report(label) {
    this.onProgress?.({
      resources: this.stats.resources,
      bytes: this.stats.bytes,
      label,
    });
  }

  registerAsset({ url, mime, b64, text }) {
    const id = String(this.nextId);
    this.nextId += 1;
    this.assets.set(id, { url, mime, ...(text == null ? { b64 } : { text }) });
    return `${ASSET_TOKEN_PREFIX}${id}`;
  }

  /**
   * 抓一份资源，返回 { buffer, mime, extension }；失败抛错。
   * 单项超时是必需的：只要有一个连接吊住，整份档案就永远打不完。
   */
  async fetchResource(url, attempt = 0) {
    if (this.signal?.aborted) throw new DOMException("已取消打包", "AbortError");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("抓取超时")), FETCH_TIMEOUT_MS);
    const cancel = () => controller.abort(new DOMException("已取消打包", "AbortError"));
    this.signal?.addEventListener("abort", cancel, { once: true });
    try {
      const response = await fetch(url, {
        cache: "force-cache",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const headerMime = (response.headers.get("content-type") || "").split(";")[0].trim();
      const extension = extensionOf(url);
      return {
        buffer,
        mime: headerMime || mimeForExtension(extension) || "application/octet-stream",
        extension,
      };
    } catch (error) {
      if (this.signal?.aborted) throw new DOMException("已取消打包", "AbortError");
      const timedOut = controller.signal.aborted;
      if (timedOut) throw new Error("抓取超时");
      /* 一次性抓几十兆时偶发连接中断，重试一次比让档案缺一段视频划算。 */
      if (attempt >= 1 || /^HTTP \d/.test(error?.message || "")) throw error;
      return this.fetchResource(url, attempt + 1);
    } finally {
      clearTimeout(timer);
      this.signal?.removeEventListener("abort", cancel);
    }
  }

  chargeBudget(bytes, label) {
    this.budget.bytes += bytes;
    this.stats.resources += 1;
    this.stats.bytes += bytes;
    this.report(label);
  }

  overBudget(bytes) {
    return bytes > MAX_ASSET_BYTES || this.budget.bytes + bytes > MAX_TOTAL_BYTES;
  }

  noteFailure(url, reason) {
    if (this.failed.has(url)) return;
    this.failed.add(url);
    this.stats.failed.push({ url, reason });
  }

  /** 单次尝试：{ skip } / { ok, value } / { ok:false, key, reason, fallback }。 */
  async resolveOnce(raw, baseUrl, context) {
    const value = String(raw || "").trim();
    if (!value || value.startsWith("#") || SKIP_SCHEME.test(value)) return { skip: true };
    let url;
    try {
      url = new URL(value, baseUrl);
    } catch {
      return { skip: true };
    }
    if (!/^https?:$/.test(url.protocol)) return { skip: true };
    const key = url.href.split("#")[0];
    /* 引用成环时退回原地址，避免两个 promise 互等。 */
    if (context.ancestors.has(key)) return { ok: true, value: url.href };
    if (!this.replacements.has(key)) {
      this.replacements.set(key, this.materialize(key, url, context).then(
        (value) => ({ ok: true, value }),
        (error) => {
          if (error?.name === "AbortError") throw error;
          return { ok: false, reason: error?.message || "抓取失败" };
        },
      ));
    }
    const outcome = await this.replacements.get(key);
    return outcome.ok
      ? outcome
      : { ok: false, key, reason: outcome.reason, fallback: url.href };
  }

  /**
   * 把一个引用解析成档案里的替身：data: URI、clair-asset: token，
   * 或（抓不到 / 超预算时）绝对 URL。返回 null 表示不改写。
   *
   * bases 可以给多个基准：数据文件里的路径按惯例是相对**页面**写的
   * （`fetch("./data/x.json")` 拿到的 JSON 里写 `"assets/p1.png"`，指的是
   * 页面同级的 assets），但 CSS 的 url() 又确实相对样式表自身。所以对
   * JS/JSON 两个基准都试一遍，都失败才算失败。
   */
  async resolveReference(raw, bases, context) {
    const candidates = [...new Set(bases.filter(Boolean))];
    let last = null;
    for (const base of candidates) {
      const outcome = await this.resolveOnce(raw, base, context);
      if (outcome.skip) return null;
      if (outcome.ok) return outcome.value;
      last = outcome;
    }
    if (!last) return null;
    this.noteFailure(last.key, last.reason);
    return last.fallback;
  }

  resolve(raw, baseUrl, context) {
    return this.resolveReference(raw, [baseUrl], context);
  }

  async materialize(key, url, context) {
    if (this.stats.resources >= MAX_RESOURCES) {
      this.stats.skipped.push({ url: key, reason: "资源数量超出上限" });
      return url.href;
    }
    const { buffer, mime, extension } = await this.fetchResource(url.href);
    const bytes = buffer.byteLength;
    const kind = classifyKind(mime, extension);
    /*
     * 不少服务器（vite dev、SPA、GitHub Pages 的 404 页）对不存在的路径回一份
     * HTML 而不是 404。要是照单全收，档案里会混进 404 页，甚至顺着它把整个站点
     * 扒一遍——所以只有本来就指向文档的引用才允许当 HTML 处理。
     */
    const documentLike = ["html", "htm"].includes(extension) || url.pathname.endsWith("/");
    if (kind === "html" && !documentLike) throw new Error("返回的是 HTML，判定为软 404");
    if (this.overBudget(bytes)) {
      this.stats.skipped.push({ url: key, bytes, reason: "超出单文件预算" });
      return url.href;
    }
    /* 文本资源会继续往下扒引用，链条太长多半是跟进了整张模块图，及时收手。 */
    if (kind !== "binary" && context.chain >= MAX_TEXT_CHAIN) {
      this.stats.skipped.push({ url: key, bytes, reason: "引用层级过深" });
      return url.href;
    }
    this.chargeBudget(bytes, url.pathname.split("/").pop() || url.href);
    const next = {
      ...context,
      chain: context.chain + 1,
      ancestors: new Set([...context.ancestors, key]),
    };

    if (kind === "html") {
      if (context.depth >= MAX_DOCUMENT_DEPTH) return url.href;
      /* 内嵌页面自成一份档案：它有自己的资源清单和 runtime，
         这样 iframe 用 blob: 打开时不依赖父文档。 */
      const child = this.createChild(url.href);
      const packed = await child.packHtml(decodeText(buffer), url.href, {
        ...next,
        depth: context.depth + 1,
        chain: 0,
      });
      return this.registerAsset({ url: key, mime: "text/html;charset=utf-8", text: packed });
    }
    if (kind === "css" || kind === "js" || kind === "json") {
      const transformed = await this.transformText(decodeText(buffer), kind, url.href, next);
      const textMime = kind === "css"
        ? "text/css;charset=utf-8"
        : kind === "json"
          ? "application/json;charset=utf-8"
          : "text/javascript;charset=utf-8";
      return this.registerAsset({ url: key, mime: textMime, text: transformed });
    }
    /* 音视频一律走 blob：data: URI 体积更大，而且拖动进度条会很难受。 */
    const streamable = mime.startsWith("video/") || mime.startsWith("audio/");
    const b64 = bufferToBase64(buffer);
    if (!streamable && bytes <= INLINE_BYTE_LIMIT) {
      this.stats.inlined += 1;
      return `data:${mime};base64,${b64}`;
    }
    return this.registerAsset({ url: key, mime, b64 });
  }

  /** 文本资源：先扫出引用，并发解析，再一次性改写。 */
  async transformText(text, kind, baseUrl, context) {
    let source = String(text || "");
    if (kind === "css") source = await this.inlineCssImports(source, baseUrl, context);
    const candidates = scanTextReferences(source, kind);
    const bases = kind === "css" ? [baseUrl] : [baseUrl, context.documentBase];
    const resolved = new Map();
    await mapWithConcurrency(candidates, async (candidate) => {
      const replacement = await this.resolveReference(candidate, bases, context);
      if (replacement) resolved.set(candidate, replacement);
    });
    return transformTextReferences(source, kind, (raw) => resolved.get(raw) ?? null);
  }

  /** @import 直接展开进父样式表，省掉一次运行时请求。 */
  async inlineCssImports(cssText, baseUrl, context, level = 0) {
    if (level > 4) return cssText;
    const imports = [...cssText.matchAll(cssImportPattern())];
    if (!imports.length) return cssText;
    const bodies = new Map();
    await mapWithConcurrency(imports, async (match) => {
      const target = (match[2] || match[4] || "").trim();
      if (!target || SKIP_SCHEME.test(target)) return;
      let url;
      try {
        url = new URL(target, baseUrl);
      } catch {
        return;
      }
      if (context.ancestors.has(url.href)) return;
      try {
        const { buffer } = await this.fetchResource(url.href);
        if (this.overBudget(buffer.byteLength)) {
          this.stats.skipped.push({ url: url.href, bytes: buffer.byteLength, reason: "超出单文件预算" });
          return;
        }
        this.chargeBudget(buffer.byteLength, url.pathname.split("/").pop() || "stylesheet");
        const nested = await this.inlineCssImports(decodeText(buffer), url.href, context, level + 1);
        bodies.set(match[0], { css: nested, base: url.href, media: (match[5] || "").trim() });
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        this.stats.failed.push({ url: url.href, reason: "样式表抓取失败" });
      }
    });
    let output = cssText;
    for (const [statement, body] of bodies) {
      const inlined = await this.transformText(body.css, "css", body.base, {
        ...context,
        chain: context.chain + 1,
        ancestors: new Set([...context.ancestors, body.base]),
      });
      const wrapped = body.media ? `@media ${body.media} {\n${inlined}\n}` : inlined;
      output = output.replace(statement, () => wrapped);
    }
    return output;
  }

  /** 把一整份 HTML 文档打包成自足的 HTML 字符串。 */
  async packHtml(html, docUrl, context = rootContext()) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const declaredBase = doc.querySelector("base[href]")?.getAttribute("href");
    let baseUrl = docUrl;
    if (declaredBase) {
      try {
        baseUrl = new URL(declaredBase, docUrl).href;
      } catch { /* 保持文档 URL */ }
    }
    /* <base> 会连带影响 #锚点，内联之后没用了；预加载指向的资源也已经进档案。 */
    doc.querySelectorAll("base").forEach((node) => node.remove());
    doc.querySelectorAll(
      'link[rel~="preload"],link[rel~="prefetch"],link[rel~="modulepreload"],' +
      'link[rel~="dns-prefetch"],link[rel~="preconnect"]',
    ).forEach((node) => node.remove());

    const documentContext = { ...context, documentBase: baseUrl };
    await this.packStylesheets(doc, baseUrl, documentContext);
    await this.packScripts(doc, baseUrl, documentContext);
    await this.packAttributes(doc, baseUrl, documentContext);
    await this.packInlineStyles(doc, baseUrl, documentContext);
    this.injectRuntime(doc, docUrl);
    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  }

  async packStylesheets(doc, baseUrl, context) {
    const links = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')];
    await mapWithConcurrency(links, async (link) => {
      const href = link.getAttribute("href");
      let url;
      try {
        url = new URL(href, baseUrl);
      } catch {
        return;
      }
      try {
        const { buffer } = await this.fetchResource(url.href);
        if (this.overBudget(buffer.byteLength)) throw new Error("超出单文件预算");
        this.chargeBudget(buffer.byteLength, url.pathname.split("/").pop() || "stylesheet");
        const css = await this.transformText(decodeText(buffer), "css", url.href, {
          ...context,
          chain: context.chain + 1,
          ancestors: new Set([...context.ancestors, url.href]),
        });
        const style = doc.createElement("style");
        if (link.getAttribute("media")) style.setAttribute("media", link.getAttribute("media"));
        style.setAttribute("data-clair-archived-href", url.href);
        style.textContent = css;
        link.replaceWith(style);
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        this.stats.failed.push({ url: url.href, reason: error?.message || "样式表抓取失败" });
        link.setAttribute("href", url.href);
      }
    });

    for (const style of [...doc.querySelectorAll("style")]) {
      if (style.hasAttribute("data-clair-archived-href")) continue;
      style.textContent = await this.transformText(style.textContent || "", "css", baseUrl, context);
    }
  }

  async packScripts(doc, baseUrl, context) {
    const scripts = [...doc.querySelectorAll("script")];
    await mapWithConcurrency(scripts, async (script) => {
      const type = (script.getAttribute("type") || "").toLowerCase();
      const kind = type.includes("json") ? "json" : "js";
      const src = script.getAttribute("src");
      if (!src) {
        script.textContent = await this.transformText(script.textContent || "", kind, baseUrl, context);
        return;
      }
      let url;
      try {
        url = new URL(src, baseUrl);
      } catch {
        return;
      }
      try {
        const { buffer } = await this.fetchResource(url.href);
        if (this.overBudget(buffer.byteLength)) throw new Error("超出单文件预算");
        this.chargeBudget(buffer.byteLength, url.pathname.split("/").pop() || "script");
        const code = await this.transformText(decodeText(buffer), kind, url.href, {
          ...context,
          chain: context.chain + 1,
          ancestors: new Set([...context.ancestors, url.href]),
        });
        /* 内联后 integrity/crossorigin 不再适用；module 保持原样——
           内联 module 依旧延迟到解析完成后执行，语义和外链一致。 */
        script.removeAttribute("src");
        script.removeAttribute("integrity");
        script.removeAttribute("crossorigin");
        script.setAttribute("data-clair-archived-src", url.href);
        script.textContent = code;
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        this.stats.failed.push({ url: url.href, reason: error?.message || "脚本抓取失败" });
        script.setAttribute("src", url.href);
      }
    });
  }

  async packAttributes(doc, baseUrl, context) {
    const targets = [];
    const push = (element, attribute) => {
      const value = element.getAttribute(attribute);
      if (value && !SKIP_SCHEME.test(value) && !value.startsWith("#")) {
        targets.push({ element, attribute, value });
      }
    };
    /* script 已经在上一步处理完了：晚绑定的 src 不会再执行，别再动它。 */
    doc.querySelectorAll("[src]:not(script)").forEach((element) => push(element, "src"));
    doc.querySelectorAll("[data-src]").forEach((element) => push(element, "data-src"));
    doc.querySelectorAll("[poster]").forEach((element) => push(element, "poster"));
    doc.querySelectorAll("[data-poster]").forEach((element) => push(element, "data-poster"));
    doc.querySelectorAll("object[data]").forEach((element) => push(element, "data"));
    doc.querySelectorAll('link[rel~="icon"],link[rel~="apple-touch-icon"],link[rel~="manifest"]')
      .forEach((element) => push(element, "href"));
    doc.querySelectorAll("use[href],image[href]").forEach((element) => push(element, "href"));

    await mapWithConcurrency(targets, async ({ element, attribute, value }) => {
      const replacement = await this.resolve(value, baseUrl, context);
      if (replacement) element.setAttribute(attribute, replacement);
    });

    const srcsets = [...doc.querySelectorAll("[srcset]")];
    await mapWithConcurrency(srcsets, async (element) => {
      const entries = parseSrcset(element.getAttribute("srcset"));
      await mapWithConcurrency(entries, async (entry) => {
        const replacement = await this.resolve(entry.url, baseUrl, context);
        if (replacement) entry.url = replacement;
      });
      element.setAttribute("srcset", serializeSrcset(entries));
    });

    /* 站内链接改成绝对地址：离线点不动，但联网时仍然指向原页面。 */
    const anchors = [...doc.querySelectorAll("a[href]")];
    await mapWithConcurrency(anchors, async (anchor) => {
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || SKIP_SCHEME.test(href)) return;
      let url;
      try {
        url = new URL(href, baseUrl);
      } catch {
        return;
      }
      const extension = extensionOf(url.pathname);
      const downloadable = anchor.hasAttribute("download")
        || ["pdf", "csv", "xlsx", "docx", "pptx", "zip"].includes(extension);
      if (downloadable) {
        const replacement = await this.resolve(href, baseUrl, context);
        anchor.setAttribute("href", replacement || url.href);
        return;
      }
      anchor.setAttribute("href", url.href);
    });
  }

  async packInlineStyles(doc, baseUrl, context) {
    const styled = [...doc.querySelectorAll("[style]")].filter((element) =>
      (element.getAttribute("style") || "").includes("url("));
    await mapWithConcurrency(styled, async (element) => {
      const declaration = element.getAttribute("style") || "";
      const resolved = new Map();
      for (const candidate of scanTextReferences(declaration, "css")) {
        const replacement = await this.resolve(candidate, baseUrl, context);
        if (replacement) resolved.set(candidate, replacement);
      }
      element.setAttribute(
        "style",
        transformTextReferences(declaration, "css", (raw) => resolved.get(raw) ?? null),
      );
    });
  }

  injectRuntime(doc, docUrl) {
    const manifest = { source: docUrl, assets: Object.fromEntries(this.assets) };
    /* JSON 里可能带 </script>（内嵌页面就有），转义掉才不会截断脚本。 */
    const payload = JSON.stringify(manifest).replace(/</g, "\\u003c");
    const runtime = doc.createElement("script");
    runtime.setAttribute("data-clair-archive-runtime", "");
    runtime.textContent = `window.__CLAIR_ARCHIVE__=${payload};\n${RUNTIME_SHIM}`;

    const head = doc.head || doc.documentElement;
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "clair-archive-source");
    meta.setAttribute("content", docUrl);
    head.prepend(runtime);
    head.prepend(meta);
    if (!doc.querySelector("meta[charset]")) {
      const charset = doc.createElement("meta");
      charset.setAttribute("charset", "utf-8");
      head.prepend(charset);
    }
  }
}

/**
 * 打包一份已发布报告，返回完整的单文件 HTML 与统计信息。
 * onProgress 会在每抓到一项资源时回调，signal 可随时取消。
 */
export async function packReportArchive(entryUrl, { onProgress, signal } = {}) {
  const session = new ArchiveSession(entryUrl, { onProgress, signal });
  session.report("正在读取报告");
  const response = await fetch(entryUrl, { cache: "no-store", credentials: "omit", signal });
  if (!response.ok) throw new Error(`报告读取失败（HTTP ${response.status}）`);
  const html = await response.text();
  const packed = await session.packHtml(html, response.url || entryUrl, rootContext());
  return { html: packed, stats: { ...session.stats, characters: packed.length } };
}
