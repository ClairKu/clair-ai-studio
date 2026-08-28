/**
 * 把千问看板打包成自包含单页并加密，产物只写进 docs/（Pages 实际服务的目录）。
 *
 * 为什么要打包：看板不是单文件报告，正文之外还会在运行时 fetch data/latest.json。
 * 只加密 index.html 保护不到数据，必须把 css / js / 数据一起内联进同一份密文，
 * 再把 docs/ 下的明文副本删掉。
 *
 * 注意：仓库是公开的，public/ 与 git 历史里仍有明文，这道门只是劝退级。
 */
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

const SLUG = "qianwen-user-acquisition-dashboard";
const SRC = join("public", "reports", SLUG);
const OUT = join("docs", "reports", SLUG);
const password = process.env.REPORT_PASSWORD || "2026";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBase64 = (v) => Buffer.from(v).toString("base64");
const fromBase64 = (v) => new Uint8Array(Buffer.from(v, "base64"));
// 内联进 <script> 的内容里若出现 </script> 会提前闭合标签
const safeInline = (v) => v.replaceAll("</script", "<\\/script");

async function deriveKey(salt) {
  const material = await webcrypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

const [html, css, js, dataRaw] = await Promise.all([
  readFile(join(SRC, "index.html"), "utf8"),
  readFile(join(SRC, "styles.css"), "utf8"),
  readFile(join(SRC, "app.js"), "utf8"),
  readFile(join(SRC, "data", "latest.json"), "utf8"),
]);
JSON.parse(dataRaw);   // 数据损坏时早失败，别加密出一份打不开的页面

// 数据内联 + fetch 垫片：app.js 仍会请求 data/latest.json，让它命中内联快照，
// 这样「更新数据」按钮不会因为 docs 下没有该文件而报错。
const inlineData = `<script>
(function(){
  var raw = ${JSON.stringify(dataRaw)};
  window.QIANWEN_ACQUISITION_DATA = JSON.parse(raw);
  var original = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function(input, init){
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.indexOf("data/latest.json") !== -1) {
      return Promise.resolve(new Response(raw, { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return original ? original(input, init) : Promise.reject(new Error("fetch unavailable"));
  };
})();
</script>`;

const replaceOnce = (source, needle, replacement) => {
  if (!source.includes(needle)) throw new Error(`页面结构变了，找不到：${needle}`);
  return source.replace(needle, replacement);
};

let bundled = html;
bundled = replaceOnce(bundled, '<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n</style>`);
bundled = replaceOnce(bundled, '<script src="./data/fallback-data.js"></script>', inlineData);
bundled = replaceOnce(bundled, '<script src="./app.js" type="module"></script>',
                      `<script type="module">\n${safeInline(js)}\n</script>`);

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = await deriveKey(salt);
const encrypted = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(bundled)));
const payload = { salt: toBase64(salt), iv: toBase64(iv), data: toBase64(encrypted), iterations: 250000 };

const verified = decoder.decode(await webcrypto.subtle.decrypt(
  { name: "AES-GCM", iv: fromBase64(payload.iv) }, await deriveKey(fromBase64(payload.salt)), fromBase64(payload.data)));
if (createHash("sha256").update(verified).digest("hex") !== createHash("sha256").update(bundled).digest("hex")) {
  throw new Error("加密后往返校验不一致，已中止");
}

const shell = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#f5f3ff">
  <title>千问 X 且慢AI小顾｜访问验证</title>
  <style>
    *{box-sizing:border-box;font-family:"Songti SC",STSong,Georgia,serif}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:#171525;background:radial-gradient(circle at 78% 18%,#dceeff 0,transparent 32%),linear-gradient(145deg,#f8fbff,#e5f2ff)}
    .gate{width:min(520px,100%);padding:44px;border:1px solid #cfe4fa;border-radius:28px;background:rgba(255,255,255,.92);box-shadow:0 30px 90px rgba(11,81,146,.16);backdrop-filter:blur(18px)}
    .mark{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;color:#fff;background:linear-gradient(145deg,#1B88EE,#0F72CD);font-size:18px;font-weight:900}
    .eyebrow{margin-top:22px;color:#0F72CD;font-size:11px;font-weight:900;letter-spacing:.15em}
    h1{margin:10px 0 8px;font-size:34px;line-height:1.18;letter-spacing:-.035em}
    p{margin:0;color:#657086;font-size:15px;line-height:1.75}
    form{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:28px}
    input,button{min-height:50px;border-radius:13px;font:inherit;font-size:16px}
    input{min-width:0;width:100%;padding:0 15px;border:1px solid #cfe4fa;background:#f8fbff;color:#171525;outline:none}
    input:focus{border-color:#1B88EE;box-shadow:0 0 0 4px rgba(27,136,238,.12)}
    button{border:0;padding:0 23px;color:#fff;background:linear-gradient(135deg,#1B88EE,#0F72CD);font-weight:900;cursor:pointer}
    button:disabled{opacity:.65;cursor:wait}
    .error{min-height:22px;margin-top:12px;color:#c04458;font-size:13px}
    .note{margin-top:22px;padding-top:18px;border-top:1px solid #e8f1fb;color:#8a8499;font-size:12px}
    @media(max-width:560px){.gate{padding:32px 22px;border-radius:22px}h1{font-size:28px}form{grid-template-columns:1fr}button{width:100%}}
  </style>
</head>
<body>
  <main class="gate">
    <div class="mark">且</div>
    <div class="eyebrow">INTERNAL DASHBOARD</div>
    <h1>千问 X 且慢AI小顾<br>用户数据看板</h1>
    <p>输入访问口令后查看完整看板。</p>
    <form id="unlock">
      <input id="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="请输入访问口令" autofocus>
      <button id="submit" type="submit">打开看板</button>
    </form>
    <div class="error" id="error" role="status" aria-live="polite"></div>
    <div class="note">看板正文与数据已加密，将在当前浏览器内完成解锁。</div>
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
        const supplied=document.getElementById("password").value.trim();
        const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(supplied),"PBKDF2",false,["deriveKey"]);
        const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:decode(payload.salt),iterations:payload.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
        const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(payload.iv)},key,decode(payload.data));
        document.open();document.write(new TextDecoder().decode(plain));document.close();
      }catch(errorValue){
        submit.disabled=false;
        submit.textContent="重新打开";
        error.textContent=errorValue?.message==="unsupported"?"当前浏览器不支持打开看板，请升级浏览器。":"口令不正确，请重新输入。";
      }
    });
  </script>
</body>
</html>`;

await writeFile(join(OUT, "index.html"), shell, "utf8");
// docs/ 下的明文副本必须清掉，否则加密等于没做
await Promise.all([
  rm(join(OUT, "app.js"), { force: true }),
  rm(join(OUT, "styles.css"), { force: true }),
  rm(join(OUT, "data"), { recursive: true, force: true }),
]);
console.log(`千问看板已加密：${OUT}/index.html（${(shell.length/1024).toFixed(0)} KB），docs 下明文已清除。`);
