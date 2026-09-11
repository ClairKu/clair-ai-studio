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

// 解锁外壳与全站 access-gate.js 的 report 门保持同一套视觉（米色底、衬线标题、
// 箭头提交键），只是这里的口令真正参与 AES-GCM 解密，而不是站点门的哈希比对。
const shell = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#f2f1ed">
  <title>千问 X 且慢AI小顾｜用户数据看板</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center; overflow: auto; padding: 24px;
      background:
        radial-gradient(circle at 18% 12%, rgb(103 134 220 / 22%), transparent 30%),
        radial-gradient(circle at 82% 86%, rgb(211 157 88 / 20%), transparent 27%),
        #f2f1ed;
      color: #18202a;
      font-family: Inter, "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
    }
    .card {
      width: min(590px, 100%);
      padding: clamp(38px, 7vw, 64px);
      border: 1px solid rgb(255 255 255 / 82%);
      border-radius: 30px;
      background: rgb(255 255 255 / 82%);
      box-shadow: 0 36px 110px rgb(32 39 54 / 14%), inset 0 1px 0 #fff;
      backdrop-filter: blur(24px) saturate(1.15);
    }
    .brand { display: flex; align-items: center; gap: 12px; color: #858b95; font-size: 10px; font-weight: 750; letter-spacing: .18em; }
    .mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 13px; background: linear-gradient(145deg, #1d1e22, #383a42); color: #fff; font: italic 20px Georgia, serif; box-shadow: 0 12px 30px rgb(23 24 28 / 16%); }
    h1 { margin: 54px 0 12px; font: 500 clamp(42px, 8vw, 66px)/1 Georgia, "Times New Roman", serif; letter-spacing: -.055em; }
    .intro { margin: 0 0 40px; color: #707681; font-size: 15px; line-height: 1.7; }
    label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    .password-row { display: flex; gap: 8px; padding: 5px; border: 1px solid #dfe2e8; border-radius: 14px; background: rgb(255 255 255 / 90%); box-shadow: 0 8px 24px rgb(30 32 42 / 5%); }
    .password-row:focus-within { border-color: #aeb2ff; box-shadow: 0 0 0 4px rgb(91 98 244 / 9%); }
    input { width: 100%; min-width: 0; height: 46px; border: 0; outline: 0; padding: 0 14px; background: transparent; color: #18202a; font: inherit; letter-spacing: .08em; }
    input::placeholder { color: #9ba1a9; letter-spacing: 0; }
    button { width: 46px; height: 46px; flex: 0 0 46px; border: 0; border-radius: 10px; background: #18202a; color: #fff; font: 22px/1 inherit; cursor: pointer; box-shadow: 0 8px 20px rgb(24 32 42 / 16%); }
    button:hover { background: #2b3644; transform: translateY(-1px); }
    button:disabled { cursor: wait; opacity: .58; transform: none; }
    .error { min-height: 20px; margin: 10px 4px 0; color: #b4232d; font-size: 13px; }
    .foot { margin-top: 24px; color: #9297a0; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
    .foot::before { content: "●"; margin-right: 7px; color: #6c72f6; }
    @media (max-width: 520px) {
      body { padding: 14px; }
      .card { padding: 34px 26px; border-radius: 24px; }
      h1 { margin-top: 42px; }
    }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
  </style>
</head>
<body>
  <main class="card" role="dialog" aria-modal="true" aria-label="Clair's Studio 报告访问验证">
    <div class="brand"><span class="mark">C</span><span>PRIVATE REPORT</span></div>
    <h1>Clair's Report</h1>
    <p class="intro">这是 Clair's Studio 私密报告，请输入报告密码。</p>
    <form id="unlock" novalidate>
      <label for="password">报告密码</label>
      <div class="password-row">
        <input id="password" type="password" name="password" inputmode="numeric" autocomplete="current-password" placeholder="报告密码" autofocus />
        <button id="submit" type="submit" aria-label="验证并进入">→</button>
      </div>
      <p class="error" id="error" role="alert" aria-live="polite"></p>
    </form>
    <div class="foot">Protected report · This tab only</div>
  </main>
  <script>
    const payload=${JSON.stringify(payload)};
    const decode=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
    const input=document.getElementById("password");
    document.getElementById("unlock").addEventListener("submit",async event=>{
      event.preventDefault();
      const error=document.getElementById("error");
      const submit=document.getElementById("submit");
      error.textContent="";
      submit.disabled=true;
      input.disabled=true;
      try{
        if(!globalThis.crypto?.subtle)throw new Error("unsupported");
        const supplied=input.value.trim();
        const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(supplied),"PBKDF2",false,["deriveKey"]);
        const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:decode(payload.salt),iterations:payload.iterations,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
        const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(payload.iv)},key,decode(payload.data));
        document.open();document.write(new TextDecoder().decode(plain));document.close();
        return;
      }catch(errorValue){
        error.textContent=errorValue?.message==="unsupported"?"当前浏览器无法完成验证，请升级后重试":"密码不正确，请再试一次";
      }
      submit.disabled=false;
      input.disabled=false;
      input.select();
      input.focus();
    });
    requestAnimationFrame(()=>input.focus());
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
