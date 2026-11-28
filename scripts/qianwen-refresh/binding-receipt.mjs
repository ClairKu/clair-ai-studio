import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const receiptKeys = ["as_of", "bound_accounts", "existing_accounts", "new_accounts"];

// The receipt updates only the three binding counters. It is not a replacement
// for the complete, separately dated conversion/question/asset snapshot.
export function parseBindingReceipt(raw, snapshotCutoff) {
  const value = JSON.parse(raw);
  if (!value || Array.isArray(value)
    || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(receiptKeys)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/.test(value.as_of)) {
    throw new Error("绑定收据字段异常");
  }
  const counts = [value.bound_accounts, value.new_accounts, value.existing_accounts];
  if (!counts.every((count) => Number.isSafeInteger(count) && count >= 0)
    || value.bound_accounts !== value.new_accounts + value.existing_accounts
    || !Number.isFinite(Date.parse(value.as_of))
    || !Number.isFinite(Date.parse(snapshotCutoff))) {
    throw new Error("绑定收据人数或截止时间异常");
  }
  const roundTrip = new Date(Date.parse(value.as_of) + 8 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+08:00";
  if (roundTrip !== value.as_of) throw new Error("绑定收据日期不存在");
  if (Date.parse(value.as_of) <= Date.parse(snapshotCutoff)) return null;
  return value;
}

export async function readOptionalBindingReceipt(file, snapshotCutoff) {
  let bytes;
  try {
    bytes = await readFile(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (parseBindingReceipt(bytes.toString("utf8"), snapshotCutoff) === null) return null;
  return bytes;
}

export async function restoreBindingReceipt(directory, bytes) {
  if (!bytes) return;
  await mkdir(directory, { recursive: true });
  const target = join(directory, "binding-receipt.json");
  await writeFile(target, bytes);
  if (!bytes.equals(await readFile(target))) throw new Error("绑定收据发布恢复失败");
}
