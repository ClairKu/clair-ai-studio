import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = resolve(projectRoot, process.argv[2] || "docs");
const gateAsset = join(outputRoot, "access-gate.js");
const accessConfigAsset = join(outputRoot, "report-access.json");
const marker = "data-clair-access-gate";
const gateRevision = "2026-10-10-live-state-v9";
const encryptedGateRevision = "2026-10-14-fast-open-v10";

if (!existsSync(gateAsset)) throw new Error(`Missing access gate asset: ${gateAsset}`);
if (!existsSync(accessConfigAsset)) throw new Error(`Missing report access config: ${accessConfigAsset}`);
const accessConfig = JSON.parse(readFileSync(accessConfigAsset, "utf8"));
const encryptedReportEntries = new Set((accessConfig.immutableLockedEntries || [])
  .filter((entry) => entry.startsWith("reports/") && entry.endsWith("/"))
  .map((entry) => `${entry}index.html`));

const walkHtml = (directory, results = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkHtml(path, results);
    else if (entry.isFile() && entry.name.endsWith(".html")) results.push(path);
  }
  return results;
};

const robotsMeta = '<meta name="robots" content="noindex,nofollow,noarchive" data-clair-access-robots />';
let injected = 0;
let encryptedReports = 0;

const encryptedReportShell = ({ html, gateScript, outputPath }) => {
  const payload = html.match(/const\s+payload\s*=\s*(\{[^;]+\});/s)?.[1];
  if (!payload) throw new Error(`Missing encrypted payload: ${outputPath}`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "Clair's Report";
  const legacySessionKey = outputPath.includes("doubao")
    ? "clair-doubao-report-unlock-v1"
    : "clair-qianwen-report-unlock-v1";

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  ${robotsMeta}
  ${gateScript}
  <meta name="theme-color" content="#f2f1ed">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f2f1ed; color: #59616c; font: 14px/1.7 Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif; }
    .opening { display: grid; justify-items: center; gap: 14px; text-align: center; }
    .spinner { width: 28px; height: 28px; border: 2px solid #d5d8de; border-top-color: #545cf4; border-radius: 50%; animation: spin .8s linear infinite; }
    .retry { min-width: 112px; min-height: 40px; padding: 0 18px; border: 0; border-radius: 12px; background: #18202a; color: #fff; font: 600 14px/1 Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif; cursor: pointer; box-shadow: 0 8px 20px rgb(24 32 42 / 16%); }
    .retry[hidden] { display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation: none; border-top-color: #d5d8de; } }
  </style>
</head>
<body>
  <main class="opening" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span id="opening-status">正在打开已验证的报告…</span>
    <button class="retry" id="opening-retry" type="button" hidden>重新验证</button>
  </main>
  <script>
    const payload=${payload};
    const decode=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
    const decompress=async bytes=>{
      if(payload.compression!=="gzip")return bytes;
      if(typeof DecompressionStream!=="function")throw new Error("unsupported");
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    };
    const credentialKey="clair-ai-studio-report-credential-v1";
    const reportSessionKey="clair-ai-studio-report-access-v4";
    const reportSessionValue="verified-report-2026-10-10";
    const workspaceSessionKey="clair-ai-studio-access-v4";
    const workspaceSessionValue="verified-2026-10-10-live-state";
    const legacySessionKey=${JSON.stringify(legacySessionKey)};
    const bridgedCredentialKey="__clairStudioReportCredential";
    const openTimeoutMs=12000;
    const openingStatus=document.getElementById("opening-status");
    const openingSpinner=document.querySelector(".spinner");
    const retryButton=document.getElementById("opening-retry");
    const readSession=key=>{try{return sessionStorage.getItem(key)||""}catch{return ""}};
    const clearStaleSession=()=>{try{
      sessionStorage.removeItem(credentialKey);
      sessionStorage.removeItem(reportSessionKey);
      sessionStorage.removeItem("clair-qianwen-report-unlock-v1");
      sessionStorage.removeItem("clair-doubao-report-unlock-v1");
    }catch{}};
    const revealRecovery=message=>{
      opening=false;
      openingStatus.textContent=message;
      openingSpinner.hidden=true;
      retryButton.hidden=false;
      // If the gate asset failed before mounting, reveal only this encrypted
      // shell's recovery controls. No report plaintext is exposed.
      if(!document.getElementById("clair-site-access-gate")){
        document.documentElement.classList.remove("clair-site-access-locked");
        document.getElementById("clair-site-access-concealment")?.remove();
      }
    };
    const withTimeout=(promise,timeoutMs=openTimeoutMs)=>{
      let timeout=0;
      const expired=new Promise((_,reject)=>{
        timeout=window.setTimeout(()=>reject(new Error("open_timeout")),timeoutMs);
      });
      return Promise.race([promise,expired]).finally(()=>window.clearTimeout(timeout));
    };
    const renderDecryptedReport=plain=>{
      if(window.top===window){
        document.open();document.write(plain);document.close();
        return;
      }
      const frame=document.createElement("iframe");
      frame.title=document.title;
      frame.setAttribute("sandbox","allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts allow-downloads");
      frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#fff";
      frame.srcdoc=plain;
      document.documentElement.style.height="100%";
      document.body.style.cssText="margin:0;height:100%;overflow:hidden;background:#fff";
      document.body.replaceChildren(frame);
    };
    let opening=false;
    let recoveryWatchdog=0;
    const openEncryptedReport=async credentialOverride=>{
      if(opening)return;
      const granted=Boolean(credentialOverride)||readSession(reportSessionKey)===reportSessionValue||readSession(workspaceSessionKey)===workspaceSessionValue;
      const credential=credentialOverride||readSession(credentialKey)||readSession(legacySessionKey);
      if(!granted)return;
      if(!credential){
        clearStaleSession();
        revealRecovery("验证状态已失效，请重新验证");
        return;
      }
      opening=true;
      openingStatus.textContent="正在解密报告…";
      openingSpinner.hidden=false;
      retryButton.hidden=true;
      try{
        const plain=await withTimeout((async()=>{
          if(!globalThis.crypto?.subtle)throw new Error("unsupported");
          const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(credential),"PBKDF2",false,["deriveKey"]);
          const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:decode(payload.salt),iterations:payload.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
          const decrypted=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(payload.iv)},key,decode(payload.data));
          return decompress(decrypted);
        })());
        window.clearTimeout(recoveryWatchdog);
        try{sessionStorage.setItem(legacySessionKey,credential)}catch{}
        renderDecryptedReport(new TextDecoder().decode(plain));
      }catch{
        clearStaleSession();
        revealRecovery("报告打开失败或超时，请重新验证");
      }
    };
    retryButton.addEventListener("click",()=>{
      retryButton.disabled=true;
      openingStatus.textContent="正在重新验证…";
      clearStaleSession();
      location.reload();
    });
    window.addEventListener("clair-report-access-bridged",event=>{
      void openEncryptedReport(event.detail?.credential||"");
    });
    requestAnimationFrame(()=>openEncryptedReport(window[bridgedCredentialKey]||""));
    recoveryWatchdog=window.setTimeout(()=>{
      if(document.getElementById("clair-site-access-gate"))return;
      revealRecovery("打开等待超时，请重新验证");
    },openTimeoutMs);
  </script>
</body>
</html>`;
};

for (const htmlPath of walkHtml(outputRoot)) {
  let html = readFileSync(htmlPath, "utf8");
  const outputPath = relative(outputRoot, htmlPath).replaceAll("\\", "/");

  // Public company AI introduction uses verified public sources only.
  // Keep this explicitly authorized external brochure publicly accessible.
  if (outputPath === "reports/yingmi-ai-capabilities-2026-10-27/index.html") continue;
  // Public navigation directory contains no credentials or private source files.
  if (outputPath === "reports/ai-tools-yingmi-links-2026-10-28/index.html") continue;

  const relativeAsset = relative(dirname(htmlPath), gateAsset).replaceAll("\\", "/");
  const assetPath = relativeAsset.startsWith(".") ? relativeAsset : `./${relativeAsset}`;
  // reports/ 与 apps/ 都是独立成果页，走报告密码；仅工作台首页与其余站点页走工作台密码。
  const reportEntry = outputPath.startsWith("reports/") || outputPath.startsWith("apps/");
  const accessScope = reportEntry ? "report" : "workspace";
  const accessEntry = reportEntry
    ? outputPath.replace(/index\.html$/i, "")
    : "";
  const accessEntryAttribute = accessEntry
    ? ` data-clair-access-entry="${accessEntry}"`
    : "";

  // These pages keep their encrypted payload, but the shared report gate is
  // now their only visible prompt. A successful submission passes the AES
  // credential directly to the shell, without a reload or a second prompt.
  const encryptedReport = encryptedReportEntries.has(outputPath);
  if (encryptedReport) {
    if (!/const\s+payload\s*=/.test(html) || !/AES-GCM/.test(html)) {
      throw new Error(`Expected an encrypted self-protected entry: ${outputPath}`);
    }
    const gateScript = `<script ${marker} data-clair-access-scope="report"${accessEntryAttribute} data-clair-encrypted-report="true" src="${assetPath}?rev=${encryptedGateRevision}"></script>`;
    html = encryptedReportShell({ html, gateScript, outputPath });
    writeFileSync(htmlPath, html);
    encryptedReports += 1;
    injected += 1;
    continue;
  }

  const gateScript = `<script ${marker} data-clair-access-scope="${accessScope}"${accessEntryAttribute} src="${assetPath}?rev=${gateRevision}"></script>`;

  html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>\s*/gi, "");
  const headInsert = `${robotsMeta}\n    ${gateScript}`;
  if (html.includes(marker)) {
    html = html.replace(/<script\b[^>]*data-clair-access-gate[^>]*><\/script>/i, gateScript);
    if (!html.includes("data-clair-access-robots")) {
      html = html.replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${robotsMeta}`);
    }
  } else if (/<head\b[^>]*>/i.test(html)) {
    html = html.replace(/<head\b[^>]*>/i, (head) => `${head}\n    ${headInsert}`);
  } else {
    html = `${gateScript}\n${html}`;
  }

  writeFileSync(htmlPath, html);
  injected += 1;
}

console.log(`Injected the selective site access gate into ${injected} HTML files, including ${encryptedReports} encrypted reports.`);
