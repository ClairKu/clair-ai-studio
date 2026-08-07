export const SUPPORTED_FILE_ACCEPT = [
  ".pdf",
  ".html",
  ".htm",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".md",
  ".markdown",
].join(",");

const FILE_TYPES = [
  { kind: "pdf", label: "PDF", extensions: ["pdf"], mime: ["application/pdf"], preview: "pdf" },
  { kind: "html", label: "HTML", extensions: ["html", "htm"], mime: ["text/html"], preview: "html" },
  { kind: "image", label: "PNG", extensions: ["png"], mime: ["image/png"], preview: "image" },
  { kind: "image", label: "IMAGE", extensions: ["jpg", "jpeg", "webp"], mime: ["image/jpeg", "image/webp"], preview: "image" },
  {
    kind: "word",
    label: "WORD",
    extensions: ["doc", "docx"],
    mime: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    preview: "word",
  },
  {
    kind: "excel",
    label: "EXCEL",
    extensions: ["xls", "xlsx"],
    mime: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    preview: "excel",
  },
  {
    kind: "ppt",
    label: "PPT",
    extensions: ["ppt", "pptx"],
    mime: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    preview: "ppt",
  },
  { kind: "markdown", label: "MD", extensions: ["md", "markdown"], mime: ["text/markdown"], preview: "text" },
];

export function fileExtension(name = "") {
  return String(name).split(".").pop()?.toLowerCase() || "";
}

export function filePresentation(file = {}) {
  const extension = fileExtension(file.name);
  const mime = String(file.type || "").toLowerCase();
  const match = FILE_TYPES.find((type) =>
    type.extensions.includes(extension) || type.mime.includes(mime));
  if (!match) {
    return {
      kind: "file",
      label: extension ? extension.toUpperCase().slice(0, 8) : "FILE",
      extension,
      preview: "download",
      supported: false,
    };
  }
  return { ...match, extension, supported: true };
}

export function isSupportedFile(file = {}) {
  return filePresentation(file).supported;
}
