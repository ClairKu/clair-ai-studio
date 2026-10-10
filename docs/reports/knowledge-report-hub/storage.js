const DB_NAME = "clair-knowledge-report-hub";
const DB_VERSION = 1;
const STATE_STORE = "state";
const FILE_STORE = "files";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      if (!database.objectStoreNames.contains(FILE_STORE)) database.createObjectStore(FILE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(storeName, mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let request;
    try {
      request = action(store);
    } catch (error) {
      database.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => {
      database.close();
      resolve(request?.result);
    };
    tx.onerror = () => {
      database.close();
      reject(tx.error || request?.error);
    };
  });
}

export async function loadState() {
  try {
    return await transaction(STATE_STORE, "readonly", (store) => store.get("root"));
  } catch {
    try {
      const fallback = localStorage.getItem("clair-knowledge-hub-fallback-v1");
      return fallback ? JSON.parse(fallback) : null;
    } catch {
      return null;
    }
  }
}

export async function saveState(state) {
  const next = { ...state, savedAt: new Date().toISOString() };
  try {
    await transaction(STATE_STORE, "readwrite", (store) => store.put(next, "root"));
  } catch {
    const shallow = {
      ...next,
      reports: next.reports.map((report) => ({ ...report, body: String(report.body || "").slice(0, 16000) })),
    };
    localStorage.setItem("clair-knowledge-hub-fallback-v1", JSON.stringify(shallow));
  }
  return next;
}

export async function saveOriginalFile(reportId, file) {
  if (!file || !reportId) return;
  const blob = file instanceof Blob ? file : new Blob([file]);
  await transaction(FILE_STORE, "readwrite", (store) => store.put({
    blob,
    name: file.name || "original-file",
    type: file.type || "application/octet-stream",
    size: file.size || blob.size,
    savedAt: new Date().toISOString(),
  }, reportId));
}

export async function loadOriginalFile(reportId) {
  try {
    return await transaction(FILE_STORE, "readonly", (store) => store.get(reportId));
  } catch {
    return null;
  }
}

export async function deleteOriginalFile(reportId) {
  try {
    await transaction(FILE_STORE, "readwrite", (store) => store.delete(reportId));
  } catch {
    // A missing local file should not block deleting its report metadata.
  }
}

export async function exportState(state) {
  const payload = {
    schema: "clair-knowledge-hub/v1",
    exportedAt: new Date().toISOString(),
    note: "包含已抽取正文、卡片和设置；原始二进制文件不会写入 JSON。",
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clair-knowledge-hub-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importStateFile(file) {
  const payload = JSON.parse(await file.text());
  if (payload?.schema !== "clair-knowledge-hub/v1" || !payload.state) throw new Error("这不是知识卡片台导出的备份文件");
  return payload.state;
}
