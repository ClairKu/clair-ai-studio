import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.env.REPORT_SOURCE_ROOT || "/Users/clair/Documents/Soul/outputs";

const reports = [
  {
    slug: "ai-weekly-2026-07-13",
    source: "ai-weekly-report/ai-project-weekly-2026-07-13.html",
  },
  {
    slug: "pension-business-analysis-2026-07",
    source: "business-analysis/盈米及且慢养老金业务分析报告.html",
  },
  {
    slug: "advisor-2-business-onboarding-2026-07",
    source: "business-analysis/盈米投顾2.0业务新老板入职报告.html",
  },
  {
    slug: "schwab-ria-benchmark-2026",
    source: "research/ria-2026/嘉信2026-RIA基准调研-对盈米且慢的启示.html",
    assets: [{
      source: "research/ria-2026/2026-Charles-Schwab-RIA-Benchmarking-Study.pdf",
      name: "2026-Charles-Schwab-RIA-Benchmarking-Study.pdf",
    }],
  },
  {
    slug: "skill-audit-2026-07-16",
    source: "skill-audit-2026-07-16/王嘉烨-25项Skills审查报告-图文版-2026-07-16.html",
  },
  {
    slug: "yingmi-ai-capability-system-2026-07",
    source: "盈米AI能力体系专业报告_2026.07.html",
  },
];

function publicRelativeLinks(html, allowedAssets = []) {
  const allowed = new Set(allowedAssets.map((asset) => asset.name));
  return html
    .replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="index,follow">')
    .replace(/href=(["'])([^"'#]+)\1/gi, (match, quote, href) => {
      if (/^(https?:|mailto:|tel:)/i.test(href)) return match;
      if (allowed.has(href.split("/").pop())) {
        return `href=${quote}${href.split("/").pop()}${quote}`;
      }
      return match;
    });
}

for (const report of reports) {
  const targetDir = join(projectRoot, "public", "reports", report.slug);
  await mkdir(targetDir, { recursive: true });
  const sourceHtml = await readFile(join(sourceRoot, report.source), "utf8");
  const outputHtml = publicRelativeLinks(sourceHtml, report.assets || []);
  await writeFile(join(targetDir, "index.html"), outputHtml, "utf8");
  for (const asset of report.assets || []) {
    await copyFile(join(sourceRoot, asset.source), join(targetDir, asset.name));
  }
  console.log(`${report.slug}\tpublic\t${outputHtml.length}`);
}
