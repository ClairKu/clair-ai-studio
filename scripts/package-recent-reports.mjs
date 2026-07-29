import { createHash, randomBytes, webcrypto } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.env.REPORT_SOURCE_ROOT || "/Users/clair/Documents/Soul/outputs";
const password = process.env.REPORT_PASSWORD;

if (!password) {
  throw new Error("REPORT_PASSWORD is required");
}

const reports = [
  {
    slug: "ai-weekly-2026-07-13",
    title: "AI 项目周报｜2026-07-13",
    source: "ai-weekly-report/ai-project-weekly-2026-07-13.html",
    encrypted: true,
  },
  {
    slug: "pension-business-analysis-2026-07",
    title: "盈米及且慢养老金业务分析",
    source: "business-analysis/盈米及且慢养老金业务分析报告.html",
    encrypted: true,
  },
  {
    slug: "advisor-2-business-onboarding-2026-07",
    title: "盈米投顾 2.0｜新负责人业务入职报告",
    source: "business-analysis/盈米投顾2.0业务新老板入职报告.html",
    encrypted: true,
  },
  {
    slug: "schwab-ria-benchmark-2026",
    title: "嘉信 2026 RIA 基准调研｜对盈米与且慢的启示",
    source: "research/ria-2026/嘉信2026-RIA基准调研-对盈米且慢的启示.html",
    encrypted: true,
    assets: [
      {
        source: "research/ria-2026/2026-Charles-Schwab-RIA-Benchmarking-Study.pdf",
        name: "2026-Charles-Schwab-RIA-Benchmarking-Study.pdf",
      },
    ],
  },
  {
    slug: "skill-audit-2026-07-16",
    title: "25 项 Skills 可用性与一致性审查",
    source: "skill-audit-2026-07-16/王嘉烨-25项Skills审查报告-图文版-2026-07-16.html",
    encrypted: true,
  },
  {
    slug: "yingmi-ai-capability-system-2026-07",
    title: "盈米 AI 能力体系专业报告｜2026.07",
    source: "盈米AI能力体系专业报告_2026.07.html",
    encrypted: true,
  },
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64(value) {
  return Buffer.from(value).toString("base64");
}

function fromB64(value) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function protectRelativeLinks(html, allowedAssets = []) {
  const allowed = new Set(allowedAssets.map((asset) => asset.name));
  return html
    .replace(
      /<meta\s+name=["']robots["'][^>]*>/i,
      '<meta name="robots" content="noindex,nofollow">',
    )
    .replace(
      "</head>",
      '<meta name="robots" content="noindex,nofollow"></head>',
    )
    .replace(/href=(["'])([^"'#]+)\1/gi, (match, quote, href) => {
      if (/^(https?:|mailto:|tel:)/i.test(href)) return match;
      if (allowed.has(href.split("/").pop())) {
        return `href=${quote}${href.split("/").pop()}${quote}`;
      }
      return `href="#" data-unavailable-link="${encodeURIComponent(href)}" aria-disabled="true"`;
    });
}

async function deriveKey(salt) {
  const material = await webcrypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptHtml(html) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(salt);
  const ciphertext = new Uint8Array(
    await webcrypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(html),
    ),
  );
  const payload = {
    salt: b64(salt),
    iv: b64(iv),
    data: b64(ciphertext),
  };
  const decrypted = decoder.decode(
    await webcrypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(payload.iv) },
      await deriveKey(fromB64(payload.salt)),
      fromB64(payload.data),
    ),
  );
  if (createHash("sha256").update(decrypted).digest("hex") !==
      createHash("sha256").update(html).digest("hex")) {
    throw new Error("Encrypted report verification failed");
  }
  return payload;
}

function encryptedShell(report, payload) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#F9FAFB">
  <title>${report.title}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F9FAFB;color:#333;font-family:"Songti SC","Noto Serif SC",Georgia,serif;padding:24px}
    main{width:min(560px,100%);border:1px solid #D8D8D8;border-radius:16px;background:#fff;padding:42px;box-shadow:0 18px 54px rgba(27,60,90,.08)}
    .mark{width:42px;height:42px;display:grid;place-items:center;border-radius:10px;background:#F0F6FF;color:#1B88EE;font-size:20px}
    h1{margin:22px 0 10px;font-size:30px;line-height:1.25}
    p{margin:0 0 26px;color:#606060;line-height:1.7}
    form{display:grid;grid-template-columns:1fr auto;gap:10px}
    input,button{min-height:46px;border-radius:9px;font:inherit}
    input{width:100%;border:1px solid #D8D8D8;padding:0 14px}
    button{border:0;background:#1B88EE;color:#fff;padding:0 20px;cursor:pointer}
    .error{min-height:20px;margin:10px 0 0;color:#FA440C;font-size:13px}
    @media(max-width:560px){main{padding:28px 22px}form{grid-template-columns:1fr}h1{font-size:25px}}
  </style>
</head>
<body>
  <main>
    <div class="mark">C</div>
    <h1>${report.title}</h1>
    <p>报告正文已加密。输入工作台口令后在当前页面解锁。</p>
    <form id="unlock">
      <input id="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="访问口令" autofocus>
      <button type="submit">查看报告</button>
    </form>
    <div class="error" id="error" role="alert"></div>
  </main>
  <script>
    const payload=${JSON.stringify(payload)};
    const fromB64=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
    document.getElementById("unlock").addEventListener("submit",async event=>{
      event.preventDefault();
      const error=document.getElementById("error");
      error.textContent="";
      try{
        const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(document.getElementById("password").value),"PBKDF2",false,["deriveKey"]);
        const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:fromB64(payload.salt),iterations:210000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
        const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:fromB64(payload.iv)},key,fromB64(payload.data));
        const html=new TextDecoder().decode(plain);
        document.open();
        document.write(html);
        document.close();
      }catch{
        error.textContent="口令不正确，请再试一次";
      }
    });
  </script>
</body>
</html>`;
}

for (const report of reports) {
  const targetDir = join(projectRoot, "public", "reports", report.slug);
  await mkdir(targetDir, { recursive: true });
  const sourceHtml = await readFile(join(sourceRoot, report.source), "utf8");
  const safeHtml = protectRelativeLinks(sourceHtml, report.assets || []);
  const outputHtml = report.encrypted
    ? encryptedShell(report, await encryptHtml(safeHtml))
    : safeHtml;
  await writeFile(join(targetDir, "index.html"), outputHtml, "utf8");
  for (const asset of report.assets || []) {
    await copyFile(join(sourceRoot, asset.source), join(targetDir, asset.name));
  }
  console.log(`${report.slug}\t${report.encrypted ? "encrypted" : "public"}\t${outputHtml.length}`);
}
