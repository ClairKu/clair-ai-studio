const TASK_STORAGE_KEY = "clair-ai-studio-tasks-v1";

const intakeActions = [
  { id: "save", name: "保存", hint: "自动识别并进入成果库" },
  { id: "decision", name: "决策", hint: "发起决策推演" },
  { id: "review", name: "评审", hint: "自动匹配合适的评审 Skill" },
];

const intakeIcons = {
  save: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h11l3 3v12H5z"></path>
      <path d="M8 4.5v5h7v-5M8 19.5v-6h8v6"></path>
    </svg>`,
  decision: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="6" r="2"></circle>
      <circle cx="18" cy="6" r="2"></circle>
      <circle cx="12" cy="18" r="2"></circle>
      <path d="M7.8 7.2 10.8 16M16.2 7.2 13.2 16M8 6h8"></path>
    </svg>`,
  review: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4.5h8M9 3h6v3H9zM6 5.5H4.5v15h15v-15H18"></path>
      <path d="m8 13 2.2 2.2L16 9.5"></path>
    </svg>`,
  upload: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14"></path>
    </svg>`,
};

const taskSkills = [
  { id: "requirement", name: "需求评审" },
  { id: "solution", name: "方案评审" },
  { id: "decision", name: "决策推演" },
  { id: "agreement", name: "协议审查" },
  { id: "career", name: "履历评估" },
];

let draft = emptyDraft();
let activeTaskId = "";

function emptyDraft() {
  return {
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

function formatDate(value) {
  const date = new Date(value || 0);
  if (!Number.isFinite(date.getTime())) return "时间待补";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function activeTasks() {
  return loadTasks()
    .filter((task) => !["completed", "confirmed", "dismissed"].includes(task.status))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0));
}

function taskModeLabel(task) {
  return task.mode === "decision" ? "决策推演" : "专业评审";
}

function taskStatusLabel(task) {
  if (task.status === "review") return "待人工确认";
  if (task.status === "processing") return "处理中";
  return "待执行";
}

function taskPrompt(task) {
  const files = (task.files || []).map((file) =>
    `- ${file.name}${file.sizeLabel ? `（${file.sizeLabel}）` : ""}`).join("\n");
  return [
    `任务类型：${taskModeLabel(task)}`,
    `匹配 Skill：${task.skillName || "方案评审"}`,
    "",
    "任务材料：",
    task.material || "（无粘贴文字）",
    files ? `\n附件：\n${files}` : "",
  ].filter(Boolean).join("\n");
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
    const isHtml = /\.html?$/i.test(file.name);
    let excerpt = "";
    let content = "";
    if (textLike && file.size <= 1024 * 1024) {
      try {
        const text = await file.text();
        excerpt = text.slice(0, 12000);
        if (isHtml) content = text;
      } catch {
        excerpt = "";
        content = "";
      }
    }
    return {
      id: uid(),
      name: file.name,
      type: file.type || "文件",
      size: file.size,
      sizeLabel: fileSize(file.size),
      excerpt,
      content,
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
    <button class="intake-action intake-icon-action" type="submit"
      data-submit-action="${action.id}" aria-label="${escapeHtml(action.name)}"
      title="${escapeHtml(action.name)} · ${escapeHtml(action.hint)}">
      ${intakeIcons[action.id]}
      <span class="intake-action-label">${escapeHtml(action.name)}</span>
    </button>`).join("");
}

function taskProgressMarkup(escapeHtml) {
  const tasks = activeTasks();
  if (!tasks.length) return "";
  return `
    <div class="inline-task-progress" aria-label="待处理任务">
      <div class="progress-summary">
        <span class="task-status-dot" aria-hidden="true"></span>
        <div>
          <strong>${tasks.length} 项任务等待处理</strong>
          <small>任务保存在当前浏览器，不会在后台自动执行</small>
        </div>
      </div>
      <div class="progress-task-list">
        ${tasks.slice(0, 3).map((task) => `
          <button type="button" data-task-action="open-task" data-task-id="${task.id}">
            <span>${escapeHtml(task.skillName?.slice(0, 1) || "任")}</span>
            <div>
              <strong>${escapeHtml(task.title || "未命名任务")}</strong>
              <small>${escapeHtml(taskStatusLabel(task))} · ${escapeHtml(formatDate(task.updatedAt || task.createdAt))}</small>
            </div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`;
}

function taskDetailMarkup(task, escapeHtml) {
  const files = task.files || [];
  return `
    <section class="task-center task-detail inline-task-detail" aria-labelledby="task-detail-title">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果库</button>
      <div class="task-detail-header">
        <div>
          <span class="eyebrow">${escapeHtml(task.skillName || "方案评审")} · ${escapeHtml(taskModeLabel(task))}</span>
          <h1 id="task-detail-title">${escapeHtml(task.title || "未命名任务")}</h1>
        </div>
        <span class="status-pill">${escapeHtml(taskStatusLabel(task))}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>处理方式</span><p>${escapeHtml(taskModeLabel(task))}</p></section>
          <section><span>匹配能力</span><p>${escapeHtml(task.skillName || "方案评审")}</p></section>
          <section><span>创建时间</span><p>${escapeHtml(formatDate(task.createdAt))}</p></section>
          <section><span>附件</span><p>${files.length
            ? files.map((file) => escapeHtml(file.name)).join("、")
            : "无附件"}</p></section>
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading">
            <div><span class="section-kicker">LOCAL TASK BRIEF</span><h2>待执行任务单</h2></div>
            <small>仅保存在当前浏览器</small>
          </div>
          <article class="task-result-content">
            <div class="task-local-warning">
              <strong>这是一张本地待处理单，不代表任务已在后台运行。</strong>
              <p>复制任务单后可交给 Codex 执行；完成后再把确认结果保存进成果库。</p>
            </div>
            <h3>输入材料</h3>
            <p>${escapeHtml(task.material || "未粘贴文字材料").replaceAll("\n", "<br />")}</p>
            ${files.length ? `
              <h3>附件记录</h3>
              <ul>${files.map((file) => `<li>${escapeHtml(file.name)}${file.sizeLabel ? ` · ${escapeHtml(file.sizeLabel)}` : ""}</li>`).join("")}</ul>`
              : ""}
          </article>
          <div class="task-review-actions">
            <button class="quiet-button" type="button" data-task-action="dismiss-task"
              data-task-id="${task.id}">移出队列</button>
            <button class="primary-button" type="button" data-task-action="copy-task"
              data-task-id="${task.id}">复制任务单</button>
          </div>
        </main>
      </div>
    </section>`;
}

export function taskWorkspaceMarkup(escapeHtml) {
  if (activeTaskId) {
    const task = loadTasks().find((item) => item.id === activeTaskId);
    if (task) return taskDetailMarkup(task, escapeHtml);
    activeTaskId = "";
  }
  return `
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="输入或粘贴内容"
            placeholder="粘贴链接、文字，或拖入一份材料…">${escapeHtml(draft.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="处理方式">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="上传档案" title="上传档案">
              <input id="task-files" type="file" multiple />
              ${intakeIcons.upload}
              <span class="intake-action-label">材料</span>
            </label>
            ${intakeActionsMarkup(escapeHtml)}
          </div>
        </div>
        ${attachmentsMarkup(escapeHtml)}
        <div class="intake-save-status" id="intake-save-status" role="status"
          aria-live="polite" hidden>
          <span class="intake-loading-ring" aria-hidden="true"></span>
          <strong>正在识别内容…</strong>
        </div>
      </form>
      ${taskProgressMarkup(escapeHtml)}
    </section>`;
}

export function bindTaskCenter({
  render,
  showToast,
  saveToLibrary,
}) {
  document.querySelectorAll("[data-task-action]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.taskAction;
      if (action === "remove-file") {
        captureDraft();
        draft.files = draft.files.filter((file) =>
          file.id !== event.currentTarget.dataset.fileId);
        render();
      } else if (action === "open-task") {
        activeTaskId = event.currentTarget.dataset.taskId;
        render();
      } else if (action === "close-task") {
        activeTaskId = "";
        render();
      } else if (action === "copy-task") {
        const task = loadTasks().find((item) =>
          item.id === event.currentTarget.dataset.taskId);
        if (!task) return;
        try {
          await navigator.clipboard.writeText(taskPrompt(task));
          showToast("任务单已复制，可交给 Codex 执行");
        } catch {
          showToast("复制失败，请手动选择任务内容");
        }
      } else if (action === "dismiss-task") {
        const tasks = loadTasks();
        const task = tasks.find((item) =>
          item.id === event.currentTarget.dataset.taskId);
        if (!task) return;
        task.status = "dismissed";
        task.updatedAt = new Date().toISOString();
        localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
        activeTaskId = "";
        render();
        showToast("已移出待处理队列");
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

    const action = event.submitter?.dataset.submitAction || "save";
    const submit = event.submitter;
    const payload = {
      material: draft.material.trim(),
      files: draft.files,
    };

    if (action === "save") {
      const status = form.querySelector("#intake-save-status");
      const controls = [...form.querySelectorAll("button, textarea, input")];
      const updateSaving = (message) => {
        controls.forEach((control) => {
          control.disabled = true;
        });
        form.setAttribute("aria-busy", "true");
        form.classList.add("is-saving");
        status.hidden = false;
        status.querySelector("strong").textContent = message;
        submit.setAttribute("aria-label", "保存中");
        submit.innerHTML = '<span class="mini-spinner"></span>';
      };
      updateSaving(
        "正在检查成果库与页面访问状态…",
      );

      try {
        const saved = await saveToLibrary(payload, updateSaving);
        if (saved.rejected) {
          render();
          showToast(saved.reason);
          return;
        }
        if (saved.duplicate) {
          render();
          showToast(
            `成果库已有“${saved.title}” · 位于“${saved.groupName}”，未重复保存`,
          );
          return;
        }
        draft = emptyDraft();
        render();
        showToast(
          `已保存到“${saved.groupName}” · ${saved.workTypeName} · 标签：${
            saved.tags.join(" / ") || "待补标签"
          }`,
        );
      } catch {
        controls.forEach((control) => {
          control.disabled = false;
        });
        render();
        showToast("保存失败，请稍后重试");
      }
      return;
    }

    submit.disabled = true;
    const inferredSkill = inferSkill([
      payload.material,
      ...payload.files.map((file) => `${file.name}\n${file.excerpt}`),
    ].join("\n"));
    const skill = action === "decision"
      ? taskSkills.find((item) => item.id === "decision")
      : inferredSkill.id === "decision"
        ? taskSkills.find((item) => item.id === "solution")
        : inferredSkill;
    const now = new Date().toISOString();
    const tasks = loadTasks();
    tasks.push({
      id: uid(),
      title: titleFromPayload(payload),
      mode: action,
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
    showToast(
      `已加入待处理队列 · ${skill.name} · 当前不会自动执行`,
    );
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
  requestAnimationFrame(() => resizePrompt(prompt));
  prompt?.addEventListener("input", () => {
    draft.material = prompt.value;
    resizePrompt(prompt);
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

function resizePrompt(prompt) {
  if (!prompt) return;
  prompt.style.height = "auto";
  const height = Math.min(Math.max(prompt.scrollHeight, 40), 180);
  prompt.style.height = `${height}px`;
  prompt.style.overflowY = prompt.scrollHeight > 180 ? "auto" : "hidden";
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
