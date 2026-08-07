import test from "node:test";
import assert from "node:assert/strict";

import {
  filePresentation,
  isSupportedFile,
  SUPPORTED_FILE_ACCEPT,
} from "../src/file-types.js";

test("recognizes every supported workbench file family", () => {
  const cases = {
    "report.pdf": "PDF",
    "page.HTML": "HTML",
    "chart.png": "PNG",
    "brief.docx": "WORD",
    "model.xlsx": "EXCEL",
    "deck.pptx": "PPT",
    "notes.md": "MD",
  };
  for (const [name, label] of Object.entries(cases)) {
    assert.equal(filePresentation({ name }).label, label, name);
    assert.equal(isSupportedFile({ name }), true, name);
  }
});

test("uses MIME type when a supported file has no extension", () => {
  assert.equal(filePresentation({ name: "scan", type: "application/pdf" }).label, "PDF");
  assert.equal(filePresentation({ name: "image", type: "image/png" }).preview, "image");
});

test("routes supported Office files to inline renderers", () => {
  assert.equal(filePresentation({ name: "brief.docx" }).preview, "word");
  assert.equal(filePresentation({ name: "model.xlsx" }).preview, "excel");
  assert.equal(filePresentation({ name: "deck.pptx" }).preview, "ppt");
});

test("rejects unsupported executable formats and exposes picker coverage", () => {
  assert.equal(isSupportedFile({ name: "installer.exe" }), false);
  for (const extension of [".pdf", ".html", ".png", ".docx", ".xlsx", ".pptx", ".md"]) {
    assert.ok(SUPPORTED_FILE_ACCEPT.includes(extension), extension);
  }
});
