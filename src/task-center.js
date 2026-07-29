const TASK_STORAGE_KEY = "clair-ai-studio-tasks-v1";

const intakeActions = [
  { id: "save", name: "保存", hint: "自动识别并进入成果库" },
  { id: "execute", name: "执行任务", hint: "自动匹配合适的评审 Skill" },
];

const taskSkills = [
  { id: "requirement", name: "需求评审" },
  { id: "solution", name: "方案评审" },
  { id: "decision", name: "决策推演" },
  { id: "agreement", name: "协议审查" },
  { id: "career", name: "履历评估" },
];

let draft = emptyDraft();

function emptyDraft() {
  return {
    action: "save",
    material: "",
    files: [],
  };
}

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function inferSkill(text) {
  const source = text.toLowerCase();
  const rules = [
    ["agreement", ["协议", "合同", "条款", "保密", "签署", "数据处理"]],
    ["career", ["简历", "履历", "候选人", "晋升", "岗位", "面试"]],
    ["decision", ["决策", "选型", "取舍", "是否推进", "选择"]],
    ["requirement", ["需求", "prd", "用户故事", "验收", "原型"]],
    ["solution", ["方案", "流程", "架构", "设计", "上线"]],
  ];
  const skillId = rules.find(([, words]) =>
    words.some((word) => source.includes(word)))?.[0] || "solution";
  return taskSkills.find((skill) => skill.id === skillId) || taskSkills[1];
}

function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function filesToRecords(fileList) {
  const files = [...fileList].slice(0, 20);
  return Promise.all(files.map(async (file) => {
    const textLike = file.type.startsWith("text/")
      || /\.(md|txt|csv|json|html|xml)$/i.test(file.name);
    let excerpt = "";
    if (textLike && file.size <= 1024 * 1024) {
      try {
        excerpt = (await file.text()).slice(0, 12000);
      } catch {
        excerpt = "";
      }
    }
    return {
      id: uid(),
      name: file.name,
      type: file.type || "文件",
      size: file.size,
      sizeLabel: fileSize(file.size),
      excerpt,
    };
  }));
}

function attachmentsMarkup(escapeHtml) {
  if (!draft.files.length) return "";
  return `<div class="attachment-list">${draft.files.map((file) => `
    <span class="attachment-chip">
      <b>${escapeHtml(file.name)}</b><small>${escapeHtml(file.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${escapeHtml(file.name)}"
        data-task-action="remove-file" data-file-id="${file.id}">×</button>
    </span>`).join("")}</div>`;
}

function intakeActionsMarkup(escapeHtml) {
  return intakeActions.map((action) => `
    <button class="intake-action ${draft.action === action.id ? "selected" : ""}" type="button"
      data-task-action="choose-action" data-action-id="${action.id}"
      aria-pressed="${draft.action === action.id}" title="${escapeHtml(action.hint)}">
      <strong>${escapeHtml(action.name)}</strong>
    </button>`).join("");
}

export function taskWorkspaceMarkup(escapeHtml) {
  return `
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3"
            placeholder="直接粘贴文字、链接，或拖入文档、图片……"
            aria-label="新增内容">${escapeHtml(draft.material)}</textarea>
        </div>
        ${attachmentsMarkup(escapeHtml)}
        <div class="prompt-footer">
          <div class="prompt-material-actions">
            <label class="prompt-file-button" for="task-files">
              <input id="task-files" type="file" multiple />
              <span aria-hidden="true">＋</span>
              <strong>材料</strong>
            </label>
            <span class="paste-hint">输入框粘贴 · 页面直接 ⌘V · 可拖入文件</span>
          </div>
          <div class="intake-actions simple-intake-actions" aria-label="处理方式">
            ${intakeActionsMarkup(escapeHtml)}
          </div>
          <button class="prompt-submit" type="submit"
            aria-label="${draft.action === "save" ? "保存到成果库" : "执行任务"}">
            <span>${draft.action === "save" ? "保存" : "执行"}</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
    </section>`;
}

export function bindTaskCenter({
  render,
  showToast,
  saveToLibrary,
}) {
  document.querySelectorAll("[data-task-action]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.taskAction;
      if (action === "choose-action") {
        captureDraft();
        draft.action = event.currentTarget.dataset.actionId;
        render();
        requestAnimationFrame(focusComposer);
      } else if (action === "remove-file") {
        captureDraft();
        draft.files = draft.files.filter((file) =>
          file.id !== event.currentTarget.dataset.fileId);
        render();
      }
    });
  });

  const form = document.getElementById("task-composer");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    captureDraft();
    if (!draft.material.trim() && !draft.files.length) {
      showToast("先粘贴内容，或加入一份材料");
      document.getElementById("task-goal")?.focus();
      return;
    }

    const submit = form.querySelector(".prompt-submit");
    submit.disabled = true;
    const payload = {
      material: draft.material.trim(),
      files: draft.files,
    };

    if (draft.action === "save") {
      try {
        const saved = await saveToLibrary(payload);
        draft = emptyDraft();
        render();
        showToast(`已保存：${saved.title} · ${saved.groupName} · ${saved.workTypeName}`);
      } catch {
        submit.disabled = false;
        showToast("保存失败，请稍后重试");
      }
      return;
    }

    const skill = inferSkill([
      payload.material,
      ...payload.files.map((file) => `${file.name}\n${file.excerpt}`),
    ].join("\n"));
    const now = new Date().toISOString();
    const tasks = loadTasks();
    tasks.push({
      id: uid(),
      title: titleFromPayload(payload),
      skillId: skill.id,
      skillName: skill.name,
      material: payload.material,
      files: payload.files,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    draft = emptyDraft();
    render();
    showToast(`已执行任务，并匹配“${skill.name}”`);
  });

  const fileInput = document.getElementById("task-files");
  fileInput?.addEventListener("change", async (event) => {
    captureDraft();
    draft.files.push(...await filesToRecords(event.target.files));
    render();
    showToast(`已加入 ${event.target.files.length} 个文件`);
  });

  const composer = document.querySelector(".prompt-composer");
  composer?.addEventListener("dragover", (event) => {
    event.preventDefault();
    composer.classList.add("drag-over");
  });
  composer?.addEventListener("dragleave", () =>
    composer.classList.remove("drag-over"));
  composer?.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    composer.classList.remove("drag-over");
    captureDraft();
    const files = event.dataTransfer.files;
    draft.files.push(...await filesToRecords(files));
    render();
    showToast(`已加入 ${files.length} 个文件`);
  });

  const prompt = document.getElementById("task-goal");
  prompt?.addEventListener("input", () => {
    draft.material = prompt.value;
  });
  prompt?.addEventListener("paste", async (event) => {
    const pastedFiles = [...(event.clipboardData?.items || [])]
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!pastedFiles.length) return;
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text/plain");
    const start = prompt.selectionStart ?? prompt.value.length;
    const end = prompt.selectionEnd ?? start;
    draft.material = `${prompt.value.slice(0, start)}${pastedText}${prompt.value.slice(end)}`;
    draft.files.push(...await filesToRecords(pastedFiles));
    render();
    showToast(`已从剪贴板加入 ${pastedFiles.length} 个材料`);
  });

  bindGlobalPaste({ render, showToast });
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function titleFromPayload(payload) {
  const firstLine = payload.material
    .split(/\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return (firstLine || payload.files[0]?.name || "未命名任务")
    .replace(/[。；;！!？?]+$/, "")
    .slice(0, 64);
}

function captureDraft() {
  const prompt = document.getElementById("task-goal");
  if (prompt) draft.material = prompt.value;
}

function focusComposer() {
  const composer = document.querySelector(".prompt-composer");
  composer?.scrollIntoView({ behavior: "smooth", block: "center" });
  requestAnimationFrame(() => document.getElementById("task-goal")?.focus());
}

function editableTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function bindGlobalPaste({ render, showToast }) {
  document.onpaste = async (event) => {
    if (editableTarget(event.target) || !document.querySelector(".prompt-composer")) return;
    const items = [...(event.clipboardData?.items || [])];
    const files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const text = event.clipboardData?.getData("text/plain") || "";
    if (!files.length && !text.trim()) return;
    event.preventDefault();
    draft.material = [draft.material.trim(), text.trim()].filter(Boolean).join("\n\n");
    if (files.length) draft.files.push(...await filesToRecords(files));
    render();
    requestAnimationFrame(focusComposer);
    showToast(files.length ? `已从剪贴板加入 ${files.length} 个材料` : "已把粘贴内容放入输入框");
  };

  document.ondragover = (event) => {
    if (![...(event.dataTransfer?.types || [])].includes("Files")) return;
    event.preventDefault();
  };
  document.ondrop = async (event) => {
    if (event.target?.closest?.(".prompt-composer")) return;
    const files = event.dataTransfer?.files || [];
    if (!files.length) return;
    event.preventDefault();
    draft.files.push(...await filesToRecords(files));
    render();
    requestAnimationFrame(focusComposer);
    showToast(`已拖入 ${files.length} 个文件`);
  };
}
