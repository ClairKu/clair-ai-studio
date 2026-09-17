// 作者端加密：把单文件报告页加密成自解锁单页（统一 Clair's Report 门外观）。
// 用法: node encrypt-page.mjs <明文.html> <输出.html> [标题]
// 满足仓库自保护页守卫：const payload= / AES-GCM / PBKDF2 / id="password" type="password" / noindex,nofollow
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [src, out, title = "千问新用户首投个例分析"] = process.argv.slice(2);
const password = process.env.REPORT_PASSWORD || "2026";
const ITER = 310000;
const encoder = new TextEncoder();
const toB64 = (v) => Buffer.from(v).toString("base64");
const fromB64 = (v) => new Uint8Array(Buffer.from(v, "base64"));

async function deriveKey(salt) {
  const material = await webcrypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return webcrypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

const plain = await readFile(src, "utf8");
const salt = randomBytes(16), iv = randomBytes(12);
const key = await deriveKey(salt);
const data = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain)));
const payload = { salt: toB64(salt), iv: toB64(iv), data: toB64(data), iterations: ITER };

const back = new TextDecoder().decode(await webcrypto.subtle.decrypt(
  { name: "AES-GCM", iv: fromB64(payload.iv) }, await deriveKey(fromB64(payload.salt)), fromB64(payload.data)));
if (createHash("sha256").update(back).digest("hex") !== createHash("sha256").update(plain).digest("hex")) {
  throw new Error("往返校验不一致");
}

const shell = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#f2f1ed">
  <title>${title}</title>
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

await writeFile(out, shell, "utf8");
console.log(`加密完成: ${out} (${(shell.length / 1024).toFixed(0)} KB)`);
