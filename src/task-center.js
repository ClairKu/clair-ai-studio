const intakeActions = [
  { id: "save", name: "Save", hint: "Recognize and add to the library" },
  { id: "decision", name: "Decide", hint: "Copy a decision brief" },
  { id: "review", name: "Review", hint: "Copy a review brief" },
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

function taskPrompt(payload, skill, mode) {
  const files = (payload.files || []).map((file) =>
    `- ${file.name}${file.sizeLabel ? `（${file.sizeLabel}）` : ""}`).join("\n");
  return [
    `Task: ${mode === "decision" ? "Decision" : "Review"}`,
    `Matched skill: ${skill.name}`,
    "",
    "Material:",
    payload.material || "(No pasted text)",
    files ? `\nAttachments:\n${files}` : "",
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

export function taskWorkspaceMarkup(escapeHtml) {
  return `
    <section class="inline-task-launcher prompt-launcher simple-intake" aria-label="新增内容">
      <form class="prompt-composer compact-intake-composer" id="task-composer">
        <div class="compact-intake-row">
          <span class="intake-entry-mark" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="1" aria-label="Set an idea in motion"
            placeholder="Set an idea in motion">${escapeHtml(draft.material)}</textarea>
          <div class="intake-actions compact-task-actions" aria-label="Actions">
            <label class="intake-action intake-icon-action compact-upload-button"
              for="task-files" aria-label="Attach files" title="Attach files">
              <input id="task-files" type="file" multiple />
              ${intakeIcons.upload}
              <span class="intake-action-label">Attach</span>
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

    const inferredSkill = inferSkill([
      payload.material,
      ...payload.files.map((file) => `${file.name}\n${file.excerpt}`),
    ].join("\n"));
    const skill = action === "decision"
      ? taskSkills.find((item) => item.id === "decision")
      : inferredSkill.id === "decision"
        ? taskSkills.find((item) => item.id === "solution")
        : inferredSkill;
    try {
      await navigator.clipboard.writeText(taskPrompt(payload, skill, action));
      showToast(`${action === "decision" ? "Decision" : "Review"} brief copied`);
    } catch {
      showToast("Copy failed — select the material and try again");
      return;
    }
    draft = emptyDraft();
    render();
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
  if (!composer) return;
  requestAnimationFrame(() => {
    document.getElementById("task-goal")?.focus({ preventScroll: true });
  });
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
