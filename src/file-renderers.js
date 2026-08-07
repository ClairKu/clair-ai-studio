function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeInlineMarkdown(value = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function markdownToHtml(markdown = "") {
  const lines = String(markdown).replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let paragraph = [];
  let list = "";
  let quote = [];
  let code = [];
  let codeLanguage = "";

  const closeParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(safeInlineMarkdown).join("<br>")}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!list) return;
    output.push(`</${list}>`);
    list = "";
  };
  const closeQuote = () => {
    if (!quote.length) return;
    output.push(`<blockquote>${quote.map(safeInlineMarkdown).join("<br>")}</blockquote>`);
    quote = [];
  };
  const closeCode = () => {
    if (!code.length && !codeLanguage) return;
    output.push(`<pre><code${codeLanguage ? ` data-language="${escapeHtml(codeLanguage)}"` : ""}>${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
    codeLanguage = "";
  };
  const closeFlow = () => {
    closeParagraph();
    closeList();
    closeQuote();
  };

  let inCode = false;
  for (const line of lines) {
    const fence = line.match(/^```\s*([\w.+-]*)\s*$/);
    if (fence) {
      if (inCode) closeCode();
      else {
        closeFlow();
        codeLanguage = fence[1] || "";
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      closeFlow();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeFlow();
      const level = heading[1].length;
      output.push(`<h${level}>${safeInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || ordered) {
      closeParagraph();
      closeQuote();
      const nextList = ordered ? "ol" : "ul";
      if (list !== nextList) {
        closeList();
        list = nextList;
        output.push(`<${list}>`);
      }
      output.push(`<li>${safeInlineMarkdown((bullet || ordered)[1])}</li>`);
      continue;
    }
    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      closeParagraph();
      closeList();
      quote.push(quoted[1]);
      continue;
    }
    closeList();
    closeQuote();
    paragraph.push(line);
  }
  if (inCode) closeCode();
  closeFlow();
  return output.join("\n");
}

function sanitizeHtml(html = "") {
  const template = document.createElement("template");
  template.innerHTML = String(html);
  template.content.querySelectorAll("script, style, link, meta, base, iframe, frame, object, embed, form, input, button, textarea, select").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" ||
        ((name === "href" || name === "src" || name === "xlink:href") &&
          /^(javascript|vbscript):/.test(value))) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  return template.innerHTML;
}

function embeddedDocument(body, title, type = "document") {
  return `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:;">
        <title>${escapeHtml(title)}</title>
        <style>
          :root { color-scheme: light; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: clamp(20px, 4vw, 54px); color: #202329; background: #fff; font-size: 15px; line-height: 1.75; }
          main { width: min(100%, 980px); margin: 0 auto; }
          h1,h2,h3,h4,h5,h6 { margin: 1.5em 0 .55em; color: #17191e; font-family: Georgia, "Noto Serif SC", serif; line-height: 1.2; letter-spacing: -.025em; }
          h1 { margin-top: 0; font-size: clamp(30px, 5vw, 50px); }
          h2 { font-size: clamp(24px, 3.8vw, 34px); }
          h3 { font-size: clamp(19px, 3vw, 25px); }
          p, ul, ol, blockquote, pre, table { margin: 0 0 1.2em; }
          a { color: #6457d8; text-decoration-thickness: 1px; text-underline-offset: 3px; }
          img { display: block; max-width: 100%; height: auto; margin: 18px auto; }
          blockquote { border-left: 3px solid #7667e8; background: #f7f5ff; padding: 14px 18px; color: #555b66; }
          code { border-radius: 5px; background: #f0f1f4; padding: .12em .38em; font: .88em/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
          pre { overflow: auto; border: 1px solid #e4e6eb; border-radius: 12px; background: #f6f7f9; padding: 18px; }
          pre code { background: transparent; padding: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { min-width: 88px; border: 1px solid #dfe2e7; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { position: sticky; top: 0; background: #f2f3f6; font-weight: 700; }
          .sheet { margin-bottom: 40px; overflow: auto; border: 1px solid #e2e4e8; border-radius: 12px; }
          .sheet h2 { position: sticky; left: 0; margin: 0; border-bottom: 1px solid #e2e4e8; background: #f8f8fa; padding: 13px 16px; font: 700 14px/1.4 ui-sans-serif, sans-serif; letter-spacing: 0; }
          .sheet table { margin: 0; }
          body[data-type="spreadsheet"] main { width: 100%; }
          body[data-type="spreadsheet"] { padding: 18px; }
        </style>
      </head>
      <body data-type="${escapeHtml(type)}"><main>${body}</main></body>
    </html>`;
}

function renderFrame(container, srcdoc, title, type) {
  const frame = document.createElement("iframe");
  frame.className = `embedded-generated-frame embedded-${type}-frame`;
  frame.title = `${title}内容`;
  frame.setAttribute("sandbox", "");
  frame.srcdoc = srcdoc;
  container.replaceChildren(frame);
}

async function renderPdf(container, blob, file, singlePage = false) {
  const [{ default: workerUrl }, pdfjs] = await Promise.all([
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    import("pdfjs-dist/build/pdf.mjs"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const loadingTask = pdfjs.getDocument({ data: await blob.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const stack = document.createElement("div");
  stack.className = "embedded-pdf-pages";
  const pageCount = singlePage ? Math.min(1, pdf.numPages) : pdf.numPages;
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const figure = document.createElement("figure");
    figure.className = "embedded-pdf-page";
    figure.dataset.pageNumber = String(pageIndex + 1);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", `${file.name} 第 ${pageIndex + 1} 页`);
    const caption = document.createElement("figcaption");
    caption.textContent = `${pageIndex + 1} / ${pdf.numPages}`;
    figure.append(canvas, caption);
    stack.append(figure);
    return figure;
  });
  container.replaceChildren(stack);

  const renderPage = async (figure) => {
    if (figure.dataset.rendered === "true" || figure.dataset.rendering === "true") return;
    figure.dataset.rendering = "true";
    const pageNumber = Number(figure.dataset.pageNumber);
    const page = await pdf.getPage(pageNumber);
    const initialViewport = page.getViewport({ scale: 1 });
    const contentWidth = Math.max(280, Math.min(container.clientWidth || 980, 1200));
    const displayScale = contentWidth / initialViewport.width;
    const viewport = page.getViewport({ scale: displayScale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = figure.querySelector("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    const transform = outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0];
    await page.render({ canvasContext: context, transform, viewport }).promise;
    figure.dataset.rendered = "true";
    delete figure.dataset.rendering;
  };

  await renderPage(pages[0]);
  if (pages.length <= 1) return;
  if (!("IntersectionObserver" in window)) {
    for (const page of pages.slice(1)) await renderPage(page);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      observer.unobserve(entry.target);
      renderPage(entry.target).catch(() => {
        entry.target.classList.add("has-render-error");
      });
    });
  }, { rootMargin: "1400px 0px" });
  pages.slice(1).forEach((page) => observer.observe(page));
}

async function renderWord(container, blob, file) {
  if (!/\.docx$/i.test(file.name || "")) {
    throw new Error("旧版 .doc 暂不能在浏览器中可靠解析，请另存为 .docx 后重新上传");
  }
  const mammoth = await import("mammoth");
  const converter = mammoth.convertToHtml || mammoth.default?.convertToHtml;
  if (!converter) throw new Error("Word 解析器加载失败");
  const result = await converter({ arrayBuffer: await blob.arrayBuffer() });
  const content = sanitizeHtml(result.value || "");
  renderFrame(container, embeddedDocument(content, file.name, "word"), file.name, "word");
}

async function renderWorkbook(container, blob, file) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await blob.arrayBuffer(), { type: "array", cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const html = XLSX.utils.sheet_to_html(workbook.Sheets[name], { header: "", footer: "" });
    return `<section class="sheet"><h2>${escapeHtml(name)}</h2>${sanitizeHtml(html)}</section>`;
  }).join("");
  renderFrame(container, embeddedDocument(sheets, file.name, "spreadsheet"), file.name, "spreadsheet");
}

async function renderPresentation(container, blob, file) {
  if (!/\.pptx$/i.test(file.name || "")) {
    throw new Error("旧版 .ppt 暂不能在浏览器中可靠解析，请另存为 .pptx 后重新上传");
  }
  const pptxModule = await import("pptx-preview");
  const init = pptxModule.init || pptxModule.default?.init;
  if (!init) throw new Error("PPT 解析器加载失败");
  const viewport = document.createElement("div");
  viewport.className = "embedded-ppt-viewport";
  const stage = document.createElement("div");
  stage.className = "embedded-ppt-stage";
  viewport.append(stage);
  container.replaceChildren(viewport);
  const previewer = init(stage, { width: 960, height: 540, mode: "list" });
  await previewer.preview(await blob.arrayBuffer());
}

export async function renderRichFile(container, blob, file, mode) {
  if (mode === "pdf" || mode === "pdf-thumb") {
    await renderPdf(container, blob, file, mode === "pdf-thumb");
    return;
  }
  if (mode === "text") {
    const html = markdownToHtml(await blob.text());
    renderFrame(container, embeddedDocument(html, file.name, "markdown"), file.name, "markdown");
    return;
  }
  if (mode === "word") {
    await renderWord(container, blob, file);
    return;
  }
  if (mode === "excel") {
    await renderWorkbook(container, blob, file);
    return;
  }
  if (mode === "ppt") {
    await renderPresentation(container, blob, file);
    return;
  }
  throw new Error("该格式暂不支持页面内解析");
}
