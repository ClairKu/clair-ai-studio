import { createHash, randomBytes, webcrypto } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((entries, value, index, values) => {
    if (!value.startsWith("--")) return entries;
    entries.push([value.slice(2), values[index + 1] || ""]);
    return entries;
  }, []),
);

const password = process.env.REPORT_PASSWORD;
const input = args.input;
const output = args.output;
const title = args.title || "加密报告";
const subtitle = args.subtitle || "输入访问口令后查看完整内容";
const eyebrow = args.eyebrow || "INTERNAL REPORT";
const mark = args.mark || "YM";
const note = args.note || "报告正文已加密，将在当前浏览器内完成解锁。";

if (!password || !input || !output) {
  throw new Error(
    "Usage: REPORT_PASSWORD=... node scripts/encrypt-report.mjs --input source.html --output target.html --title title",
  );
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBase64 = (value) => Buffer.from(value).toString("base64");
const fromBase64 = (value) => new Uint8Array(Buffer.from(value, "base64"));
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

async function deriveKey(salt) {
  const material = await webcrypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

const plaintext = await readFile(input, "utf8");
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = await deriveKey(salt);
const encrypted = new Uint8Array(
  await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  ),
);

const payload = {
  salt: toBase64(salt),
  iv: toBase64(iv),
  data: toBase64(encrypted),
  iterations: 250000,
};

const verified = decoder.decode(
  await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    await deriveKey(fromBase64(payload.salt)),
    fromBase64(payload.data),
  ),
);

if (
  createHash("sha256").update(verified).digest("hex") !==
  createHash("sha256").update(plaintext).digest("hex")
) {
  throw new Error("Encrypted report round-trip verification failed");
}

const shell = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#f5f3ff">
  <title>${escapeHtml(title)}｜访问验证</title>
  <style>
    *{box-sizing:border-box;font-family:"Songti SC",STSong,Georgia,serif}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:#171525;background:radial-gradient(circle at 78% 18%,#e5ddff 0,transparent 32%),linear-gradient(145deg,#faf9ff,#f1edff)}
    .gate{width:min(520px,100%);padding:44px;border:1px solid #ded7ff;border-radius:28px;background:rgba(255,255,255,.92);box-shadow:0 30px 90px rgba(69,47,143,.16);backdrop-filter:blur(18px)}
    .mark{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;color:#fff;background:linear-gradient(145deg,#7158e8,#9a6cf0);font-size:16px;font-weight:900}
    .eyebrow{margin-top:22px;color:#7158e8;font-size:11px;font-weight:900;letter-spacing:.15em}
    h1{margin:10px 0 8px;font-size:36px;line-height:1.18;letter-spacing:-.035em}
    p{margin:0;color:#657086;font-size:15px;line-height:1.75}
    form{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:28px}
    input,button{min-height:50px;border-radius:13px;font:inherit;font-size:16px}
    input{min-width:0;width:100%;padding:0 15px;border:1px solid #d9d2f8;background:#faf9ff;color:#171525;outline:none}
    input:focus{border-color:#8067e8;box-shadow:0 0 0 4px rgba(113,88,232,.10)}
    button{border:0;padding:0 23px;color:#fff;background:linear-gradient(135deg,#7158e8,#8067e8);font-weight:900;cursor:pointer}
    button:disabled{opacity:.65;cursor:wait}
    .error{min-height:22px;margin-top:12px;color:#c04458;font-size:13px}
    .note{margin-top:22px;padding-top:18px;border-top:1px solid #ece8fb;color:#8a8499;font-size:12px}
    @media(max-width:560px){.gate{padding:32px 22px;border-radius:22px}h1{font-size:29px}form{grid-template-columns:1fr}button{width:100%}}
  </style>
  <script src="/clair-ai-studio/report-template-v2.js"></script>
</head>
<body>
  <main class="gate">
    <div class="mark">${escapeHtml(mark)}</div>
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(subtitle)}</p>
    <form id="unlock">
      <input id="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入访问密码" autofocus>
      <button id="submit" type="submit">打开报告</button>
    </form>
    <div class="error" id="error" role="status" aria-live="polite"></div>
    <div class="note">${escapeHtml(note)}</div>
  </main>
  <script>
    const payload=${JSON.stringify(payload)};
    const decode=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
    document.getElementById("unlock").addEventListener("submit",async event=>{
      event.preventDefault();
      const error=document.getElementById("error");
      const submit=document.getElementById("submit");
      error.textContent="正在安全解锁…";
      submit.disabled=true;
      try{
        if(!globalThis.crypto?.subtle)throw new Error("unsupported");
        const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(document.getElementById("password").value.trim()),"PBKDF2",false,["deriveKey"]);
        const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:decode(payload.salt),iterations:payload.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
        const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(payload.iv)},key,decode(payload.data));
        const source=new TextDecoder().decode(plain);
        const enhanced=globalThis.enhanceReportTemplate?.(source)??source;
        document.open();
        document.write(enhanced);
        document.close();
      }catch(errorValue){
        submit.disabled=false;
        submit.textContent="重新打开";
        error.textContent=errorValue?.message==="unsupported"?"当前浏览器不支持安全解锁，请升级浏览器。":"密码不正确，请重新输入。";
      }
    });
  </script>
</body>
</html>`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, shell, "utf8");
console.log(`${output}\tencrypted\t${shell.length}`);
