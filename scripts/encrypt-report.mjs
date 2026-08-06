import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((entries, value, index, values) => {
    if (!value.startsWith("--")) return entries;
    entries.push([value.slice(2), values[index + 1] || ""]);
    return entries;
  }, []),
);

const input = args.input;
const output = args.output;

if (!input || !output) {
  throw new Error("Usage: node scripts/encrypt-report.mjs --input source.html --output target.html");
}

await mkdir(dirname(output), { recursive: true });
await copyFile(input, output);
console.log(`${output}\tpublic`);
