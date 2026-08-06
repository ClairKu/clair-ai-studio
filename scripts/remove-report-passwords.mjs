import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { webcrypto } from "node:crypto";

const reportsRoot = new URL("../public/reports/", import.meta.url);
const passwords = String(process.env.REPORT_PASSWORDS || process.env.REPORT_PASSWORD || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!passwords.length) throw new Error("REPORT_PASSWORDS is required to decrypt legacy reports");

const decoder = new TextDecoder();
const fromBase64 = (value) => new Uint8Array(Buffer.from(value, "base64"));

async function deriveKey(payload, password) {
  const material = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webcrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(payload.salt),
      iterations: payload.iterations || 210000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

const directories = await readdir(reportsRoot, { withFileTypes: true });
let converted = 0;
const failures = [];

for (const directory of directories) {
  if (!directory.isDirectory()) continue;
  const reportPath = join(reportsRoot.pathname, directory.name, "index.html");
  let wrapper;
  try {
    wrapper = await readFile(reportPath, "utf8");
  } catch {
    continue;
  }
  const objectMatch = wrapper.match(/const\s+(?:protectedPayload|payload)\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"(?:,"iterations":\d+)?\})\s*;/);
  const scalarMatch = wrapper.match(/const\s+salt="([^"]+)",iv="([^"]+)",payload="([^"]+)"/);
  if (!objectMatch && !scalarMatch) continue;
  const payload = objectMatch
    ? JSON.parse(objectMatch[1])
    : { salt: scalarMatch[1], iv: scalarMatch[2], data: scalarMatch[3] };
  payload.iterations ||= Number(wrapper.match(/iterations:\s*(\d+)/)?.[1]) || 210000;
  const embeddedPassword = wrapper.match(/const\s+unlockMaterial\s*=\s*"([^"]+)"/)?.[1];
  const candidates = [...new Set([embeddedPassword, ...passwords].filter(Boolean))];
  let plain = "";
  for (const candidate of candidates) {
    try {
      plain = decoder.decode(await webcrypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(payload.iv) },
        await deriveKey(payload, candidate),
        fromBase64(payload.data),
      ));
      break;
    } catch {
      // Try the next legacy password without persisting it.
    }
  }
  if (!plain) {
    failures.push(directory.name);
    console.error(`${directory.name}\tlegacy password not supplied`);
    continue;
  }
  if (!/<html[\s>]/i.test(plain)) {
    if (!objectMatch || !/const\s+protectedPayload/.test(wrapper)) {
      throw new Error(`${directory.name}: decrypted content is not HTML`);
    }
    const head = wrapper.match(/<!doctype html>[\s\S]*?<\/head>/i)?.[0];
    if (!head) throw new Error(`${directory.name}: could not preserve the document head`);
    plain = `${head}\n<body>${plain}\n<script>
const progress=document.getElementById("progress");
const updateProgress=()=>{const h=document.documentElement;const total=h.scrollHeight-h.clientHeight;progress.style.width=(total?Math.min(100,h.scrollTop/total*100):0)+"%"};
addEventListener("scroll",updateProgress,{passive:true});updateProgress();
const viewer=document.getElementById("viewer"),viewerImage=document.getElementById("viewer-image"),viewerTitle=document.getElementById("viewer-title");
document.querySelectorAll(".slide-card").forEach(card=>card.addEventListener("click",()=>{viewerImage.src=card.dataset.src;viewerImage.alt=card.dataset.title;viewerTitle.textContent=card.dataset.title;viewer.showModal()}));
document.querySelector(".close")?.addEventListener("click",()=>viewer.close());
viewer?.addEventListener("click",event=>{if(event.target===viewer)viewer.close()});
</script></body></html>`;
  }
  await writeFile(reportPath, plain, "utf8");
  converted += 1;
  console.log(`${directory.name}\tpublic`);
}

console.log(`Converted ${converted} password-protected reports to public HTML.`);
if (failures.length) {
  throw new Error(`Could not decrypt: ${failures.join(", ")}`);
}
