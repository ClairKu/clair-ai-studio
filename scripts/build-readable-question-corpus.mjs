// The user authorized direct access to the de-identified question module.
// Keep the authoring snapshot encrypted; publish only its validated, redacted rows as gzip.
import { createHash, webcrypto } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

export async function buildReadableQuestionCorpus(source, destination) {
  const envelope = JSON.parse(await readFile(join(source, "questions.enc.json"), "utf8"));
  const decode = value => Buffer.from(value, "base64");
  const material = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(process.env.REPORT_PASSWORD || "2026"), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey({ name: "PBKDF2", salt: decode(envelope.salt), iterations: envelope.iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const compressed = Buffer.from(await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: decode(envelope.iv) }, key, decode(envelope.data)));
  const plain = gunzipSync(compressed);
  if (createHash("sha256").update(plain).digest("hex") !== envelope.meta.plaintext_sha256) throw new Error("Question corpus hash mismatch");
  const corpus = JSON.parse(plain);
  const snapshot = JSON.parse(await readFile(join(source, "latest.json"), "utf8"));
  if (corpus.meta.identity_fields !== "none" || corpus.meta.data_cutoff !== snapshot.meta.data_cutoff || corpus.rows.length !== snapshot.question_insights.summary.questions) throw new Error("Question corpus snapshot mismatch");
  const allowed = ["i", "d", "t", "o", "f", "c", "x", "s", "p", "v", "r", "w", "e", "u", "n", "q"].sort().join(",");
  const pii = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?<!\d)1[3-9]\d{9}(?!\d)|(?<!\d)\d{17}[0-9Xx](?!\d)|(?<!\d)(?:\d[ -]?){12,19}(?!\d)|\b(?:wxid_|openid[:：]?)[A-Za-z0-9_-]{6,}\b)/i;
  for (const row of corpus.rows) {
    if (Object.keys(row).sort().join(",") !== allowed || typeof row.q !== "string" || pii.test(row.q)) throw new Error("Question corpus contains unapproved fields or identifiers");
  }
  await mkdir(destination, { recursive: true });
  await writeFile(join(destination, "questions.json.gz"), compressed);
  return corpus.rows.length;
}
