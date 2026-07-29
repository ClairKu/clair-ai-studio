const TASK_STORAGE_KEY = "clair-ai-studio-tasks-v1";

export const taskSkills = [
  { id: "auto", name: "智能识别", icon: "✦", hint: "让 AI 判断最适合的任务" },
  { id: "requirement", name: "需求评审", icon: "需", hint: "价值、范围、规则、验收" },
  { id: "solution", name: "方案评审", icon: "案", hint: "体验、逻辑、可行性、风险" },
  { id: "decision", name: "决策推演", icon: "决", hint: "选项、证据、取舍、止损" },
  { id: "agreement", name: "协议审查", icon: "协", hint: "权责、数据、责任、退出" },
  { id: "career", name: "履历评估", icon: "历", hint: "事实、能力、匹配、核验" },
];

let tasks = loadTasks();
let draft = { skillId: "auto", goal: "", material: "", files: [] };
let activeTaskId = "";
let taskMode = "compose";
let launcherExpanded = false;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function skillById(skillId) {
  return taskSkills.find((skill) => skill.id === skillId) || taskSkills[0];
}

function inferSkill(text) {
  const source = text.toLowerCase();
  const rules = [
    ["agreement", ["协议", "合同", "条款", "保密", "签署"]],
    ["career", ["简历", "履历", "候选人", "晋升", "岗位", "面试"]],
    ["decision", ["决策", "选型", "取舍", "是否推进", "选择"]],
    ["requirement", ["需求", "prd", "用户故事", "验收", "原型"]],
    ["solution", ["方案", "流程", "架构", "设计", "上线"]],
  ];
  return rules.find(([, words]) => words.some((word) => source.includes(word)))?.[0] || "solution";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildIntakeDraft(task, escapeHtml) {
  const fileSummary = task.files.length
    ? task.files.map((file) => `${file.name}（${file.sizeLabel}）`).join("、")
    : "无附件";
  const materialSize = task.material.trim().length;
  return `
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${escapeHtml(task.skillName)}</strong>，目标是：${escapeHtml(task.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${escapeHtml(fileSummary)}</li>
      <li>粘贴内容：${materialSize} 字</li>
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`;
}

function titleFromGoal(goal, skillName) {
  const firstLine = goal.trim().split(/\n/)[0].replace(/[。；;！!？?]+$/, "");
  return `${firstLine.slice(0, 42) || "未命名任务"}｜${skillName}`;
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

function skillCardsMarkup(escapeHtml) {
  return taskSkills.map((skill) => `
    <button class="skill-choice ${draft.skillId === skill.id ? "selected" : ""}" type="button"
      data-task-action="choose-skill" data-skill-id="${skill.id}">
      <span>${escapeHtml(skill.icon)}</span>
      <strong>${escapeHtml(skill.name)}</strong>
      <small>${escapeHtml(skill.hint)}</small>
    </button>`).join("");
}

function attachmentsMarkup(escapeHtml) {
  if (!draft.files.length) return "";
  return `<div class="attachment-list">${draft.files.map((file) => `
    <span class="attachment-chip">
      <b>${escapeHtml(file.name)}</b><small>${escapeHtml(file.sizeLabel)}</small>
      <button type="button" aria-label="移除 ${escapeHtml(file.name)}" data-task-action="remove-file" data-file-id="${file.id}">×</button>
    </span>`).join("")}</div>`;
}

function taskListMarkup(escapeHtml) {
  const activeTasks = tasks.filter((task) => task.status !== "confirmed").slice().reverse();
  if (!activeTasks.length) {
    return `<div class="task-empty"><span>○</span><strong>还没有进行中的任务</strong><small>投入材料，第一项任务会出现在这里。</small></div>`;
  }
  return activeTasks.map((task) => `
    <button class="task-row" type="button" data-task-action="open-task" data-task-id="${task.id}">
      <span class="task-status-dot"></span>
      <span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.skillName)} · ${formatDate(task.updatedAt)}</small></span>
      <em>${task.status === "review" ? "待确认" : "处理中"}</em>
    </button>`).join("");
}

function taskProgressMarkup(escapeHtml) {
  const activeTasks = tasks
    .filter((task) => task.status !== "confirmed")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (!activeTasks.length) return "";
  return `
    <div class="inline-task-progress">
      <div class="progress-summary">
        <span class="task-status-dot"></span>
        <div><strong>${activeTasks.length} 项任务等待处理</strong><small>查看草稿，人工确认后才会进入成果区</small></div>
      </div>
      <div class="progress-task-list">
        ${activeTasks.slice(0, 3).map((task) => `
          <button type="button" data-task-action="open-task" data-task-id="${task.id}">
            <span>${escapeHtml(skillById(task.skillId).icon)}</span>
            <div><strong>${escapeHtml(task.title)}</strong><small>${task.status === "review" ? "待确认" : "处理中"} · ${formatDate(task.updatedAt)}</small></div>
            <i>→</i>
          </button>`).join("")}
      </div>
    </div>`;
}

export function taskWorkspaceMarkup(escapeHtml) {
  if (activeTaskId) {
    const task = tasks.find((item) => item.id === activeTaskId);
    if (task) return taskDetailMarkup(task, escapeHtml);
    activeTaskId = "";
  }
  if (!launcherExpanded) {
    return `
      <section class="inline-task-launcher" aria-label="发起任务">
        <div class="quick-task-entry">
          <span class="quick-task-icon" aria-hidden="true">✦</span>
          <input id="task-quick-goal" value="${escapeHtml(draft.goal)}" placeholder="今天想完成什么？" aria-label="今天想完成什么" />
          <div class="quick-task-actions">
            <button class="attachment-shortcut" type="button" data-task-action="expand-launcher">＋ 素材</button>
            <button class="primary-button" type="button" data-task-action="expand-launcher">发起任务</button>
          </div>
        </div>
        <div class="quick-task-hint">
          <span>支持需求评审、方案推演、协议审查、履历评估</span>
          <span>AI 初稿 → 人工确认 → 成果沉淀</span>
        </div>
        ${taskProgressMarkup(escapeHtml)}
      </section>`;
  }
  return `
    <section class="inline-task-launcher expanded" aria-label="任务工作区">
      <form class="task-composer inline-task-composer" id="task-composer">
        <header class="inline-composer-header">
          <div><span class="section-kicker">NEW TASK</span><h2>发起任务</h2><p>先说清目标，再补材料与输出偏好。</p></div>
          <button class="quiet-button" type="button" data-task-action="collapse-launcher">收起</button>
        </header>
        <section class="inline-goal-panel">
          <label for="task-goal">希望最后帮你解决什么？</label>
          <textarea id="task-goal" rows="3" placeholder="例如：判断这个需求能否进入研发，并给出必须补齐的 P0 问题">${escapeHtml(draft.goal)}</textarea>
        </section>
        <div class="inline-composer-grid">
          <section class="inline-material-panel">
            <div class="inline-panel-heading"><span>01</span><div><strong>投入材料</strong><small>拖文件，或粘贴文字、链接和会议纪要</small></div></div>
            <label class="material-drop" id="material-drop">
              <input id="task-files" type="file" multiple />
              <span class="drop-icon">＋</span>
              <strong>添加文件</strong>
              <small>PDF、Word、PPT、表格、图片</small>
            </label>
            ${attachmentsMarkup(escapeHtml)}
            <textarea id="task-material" rows="6" placeholder="粘贴文字、聊天记录、链接、会议纪要……">${escapeHtml(draft.material)}</textarea>
          </section>
          <section class="inline-skill-panel">
            <div class="inline-panel-heading"><span>02</span><div><strong>选择能力</strong><small>不确定就保持智能识别</small></div></div>
            <div class="skill-grid">${skillCardsMarkup(escapeHtml)}</div>
          </section>
        </div>
        <div class="composer-submit">
          <span>任务完成后先进入待确认，不会自动发布到成果区</span>
          <button class="primary-button task-start-button" type="submit">开始工作 <i>↗</i></button>
        </div>
      </form>
      ${taskProgressMarkup(escapeHtml)}
    </section>`;
}

export function taskCenterMarkup(escapeHtml) {
  if (activeTaskId) {
    const task = tasks.find((item) => item.id === activeTaskId);
    if (task) return taskDetailMarkup(task, escapeHtml);
    activeTaskId = "";
  }
  return `
    <section class="task-center workspace">
      <div class="task-intro">
        <span class="eyebrow">TASK CENTER</span>
        <h1>把材料放进来，<br />把结果带走。</h1>
        <p>选择任务，也可以交给 AI 判断。</p>
      </div>
      <div class="task-layout">
        <form class="task-composer" id="task-composer">
          <section class="composer-section">
            <div class="composer-heading"><span>01</span><div><strong>选择任务</strong><small>不确定就保持智能识别</small></div></div>
            <div class="skill-grid">${skillCardsMarkup(escapeHtml)}</div>
          </section>
          <section class="composer-section">
            <div class="composer-heading"><span>02</span><div><strong>投入材料</strong><small>拖文件，或直接粘贴一堆信息</small></div></div>
            <label class="material-drop" id="material-drop">
              <input id="task-files" type="file" multiple />
              <span class="drop-icon">＋</span>
              <strong>拖入文件</strong>
              <small>PDF、Word、PPT、表格、图片都可以</small>
            </label>
            ${attachmentsMarkup(escapeHtml)}
            <textarea id="task-material" rows="7" placeholder="粘贴文字、聊天记录、链接、会议纪要……">${escapeHtml(draft.material)}</textarea>
          </section>
          <section class="composer-section goal-section">
            <div class="composer-heading"><span>03</span><div><strong>补充目标</strong><small>希望最后帮你解决什么</small></div></div>
            <textarea id="task-goal" rows="3" placeholder="例如：帮我判断这个需求能否进研发，并给出必须补齐的 P0 问题">${escapeHtml(draft.goal)}</textarea>
          </section>
          <div class="composer-submit">
            <span>AI 初稿 → 人工修改 → 确认入库</span>
            <button class="primary-button task-start-button" type="submit">开始工作 <i>↗</i></button>
          </div>
        </form>
        <aside class="task-sidebar">
          <div class="sidebar-title"><div><span class="section-kicker">IN PROGRESS</span><h2>进行中</h2></div><span>${tasks.filter((task) => task.status !== "confirmed").length}</span></div>
          <div class="task-list">${taskListMarkup(escapeHtml)}</div>
          <div class="evolution-note">
            <span>↻</span><div><strong>Skill 会学习，但不会擅自改</strong><small>人工修改只形成候选版本，经你确认后发布。</small></div>
          </div>
        </aside>
      </div>
    </section>`;
}

function taskDetailMarkup(task, escapeHtml) {
  const isConfirmed = task.status === "confirmed";
  return `
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${escapeHtml(task.skillName)} · SKILL V${escapeHtml(task.skillVersion)}</span><h1>${escapeHtml(task.title)}</h1></div>
        <span class="status-pill ${isConfirmed ? "done" : ""}">${isConfirmed ? "已进入成果区" : "等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${escapeHtml(task.goal)}</p></section>
          <section><span>材料</span><p>${task.files.length} 个附件 · ${task.material.length} 字粘贴内容</p></section>
          <section><span>人工路径</span><p>补充材料 → 修改初稿 → 再分析 → 确认入库</p></section>
          ${task.revisions?.length ? `<section><span>进化记录</span><p>${task.revisions.length} 次人工修订已记录，仅作为 Skill 优化候选。</p></section>` : ""}
        </aside>
        <main class="task-result-editor">
          <div class="result-editor-heading"><div><span class="section-kicker">WORKING RESULT</span><h2>${isConfirmed ? "最终成果" : "工作草稿"}</h2></div><small>最后更新 ${formatDate(task.updatedAt)}</small></div>
          ${taskMode === "edit" && !isConfirmed
            ? `<textarea id="task-result-input" rows="20">${escapeHtml(task.resultText || "")}</textarea>`
            : `<article class="task-result-content">${task.resultHtml || `<p>${escapeHtml(task.resultText || "暂无结果")}</p>`}</article>`}
          <div class="task-review-actions">
            ${isConfirmed
              ? `<button class="quiet-button" type="button" data-task-action="close-task">返回成果区</button>`
              : taskMode === "edit"
                ? `<button class="quiet-button" type="button" data-task-action="cancel-edit">取消</button>
                   <button class="primary-button" type="button" data-task-action="save-revision" data-task-id="${task.id}">保存人工修改</button>`
                : `<button class="quiet-button" type="button" data-task-action="edit-result">人工修改</button>
                   <button class="quiet-button" type="button" data-task-action="supplement-task">补充材料</button>
                   <button class="primary-button" type="button" data-task-action="confirm-task" data-task-id="${task.id}">确认并放入成果区</button>`}
          </div>
        </main>
      </div>
    </section>`;
}

export function confirmedResultsMarkup(escapeHtml) {
  const results = tasks.filter((task) => task.status === "confirmed")
    .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt));
  if (!results.length) return "";
  return `
    <section class="generated-results">
      <div class="section-heading">
        <div><span class="section-kicker">AI RESULTS</span><h2>任务成果</h2></div>
        <span>${results.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${results.map((task) => `
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${task.id}">
          <span>${escapeHtml(skillById(task.skillId).icon)}</span>
          <div><small>${escapeHtml(task.skillName)} · V${escapeHtml(task.skillVersion)}</small><strong>${escapeHtml(task.title)}</strong><em>${formatDate(task.confirmedAt)}</em></div>
          <i>→</i>
        </button>`).join("")}</div>
    </section>`;
}

export function getTaskCounts() {
  return {
    active: tasks.filter((task) => task.status !== "confirmed").length,
    confirmed: tasks.filter((task) => task.status === "confirmed").length,
  };
}

export function hasActiveTask() {
  return Boolean(activeTaskId);
}

export function clearActiveTask() {
  activeTaskId = "";
  taskMode = "compose";
  launcherExpanded = false;
}

export function bindTaskCenter({ render, escapeHtml, showToast, showResults }) {
  document.querySelectorAll("[data-task-action]").forEach((element) => {
    element.addEventListener("click", async (event) => {
      const action = event.currentTarget.dataset.taskAction;
      if (action === "expand-launcher") {
        captureDraft();
        launcherExpanded = true;
        render();
        requestAnimationFrame(() => document.getElementById("task-goal")?.focus());
      } else if (action === "collapse-launcher") {
        captureDraft();
        launcherExpanded = false;
        render();
      } else if (action === "choose-skill") {
        draft.skillId = event.currentTarget.dataset.skillId;
        captureDraft();
        render();
      } else if (action === "remove-file") {
        captureDraft();
        draft.files = draft.files.filter((file) => file.id !== event.currentTarget.dataset.fileId);
        render();
      } else if (action === "open-task") {
        activeTaskId = event.currentTarget.dataset.taskId;
        taskMode = "compose";
        render();
      } else if (action === "close-task") {
        const closingTask = tasks.find((item) => item.id === activeTaskId);
        activeTaskId = "";
        taskMode = "compose";
        launcherExpanded = false;
        if (closingTask?.status === "confirmed") showResults?.();
        render();
      } else if (action === "edit-result") {
        taskMode = "edit";
        render();
      } else if (action === "cancel-edit") {
        taskMode = "compose";
        render();
      } else if (action === "save-revision") {
        const task = tasks.find((item) => item.id === event.currentTarget.dataset.taskId);
        const value = document.getElementById("task-result-input")?.value.trim();
        if (!task || !value) return;
        task.revisions ||= [];
        task.revisions.push({ at: new Date().toISOString(), before: task.resultText || "", after: value });
        task.resultText = value;
        task.resultHtml = `<p>${escapeHtml(value).replaceAll("\n", "</p><p>")}</p>`;
        task.updatedAt = new Date().toISOString();
        saveTasks();
        taskMode = "compose";
        render();
        showToast("已保存人工修改，并记录为进化样本");
      } else if (action === "supplement-task") {
        const task = tasks.find((item) => item.id === activeTaskId);
        if (!task) return;
        draft = { skillId: task.requestedSkillId, goal: task.goal, material: task.material, files: task.files };
        tasks = tasks.filter((item) => item.id !== task.id);
        saveTasks();
        activeTaskId = "";
        taskMode = "compose";
        launcherExpanded = true;
        render();
      } else if (action === "confirm-task") {
        const task = tasks.find((item) => item.id === event.currentTarget.dataset.taskId);
        if (!task) return;
        task.status = "confirmed";
        task.confirmedAt = new Date().toISOString();
        task.updatedAt = task.confirmedAt;
        saveTasks();
        activeTaskId = "";
        taskMode = "compose";
        launcherExpanded = false;
        showResults?.();
        render();
        showToast("已确认并放入成果区");
      }
    });
  });

  const form = document.getElementById("task-composer");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    captureDraft();
    if (!draft.goal.trim()) {
      showToast("请先写下希望解决的目标");
      document.getElementById("task-goal")?.focus();
      return;
    }
    if (!draft.material.trim() && !draft.files.length) {
      showToast("请拖入文件或粘贴一些材料");
      return;
    }
    const resolvedSkillId = draft.skillId === "auto"
      ? inferSkill(`${draft.goal}\n${draft.material}\n${draft.files.map((file) => file.name).join(" ")}`)
      : draft.skillId;
    const skill = skillById(resolvedSkillId);
    const now = new Date().toISOString();
    const task = {
      id: uid(),
      title: titleFromGoal(draft.goal, skill.name),
      requestedSkillId: draft.skillId,
      skillId: resolvedSkillId,
      skillName: skill.name,
      skillVersion: "1.0.0",
      goal: draft.goal.trim(),
      material: draft.material.trim(),
      files: draft.files,
      status: "review",
      createdAt: now,
      updatedAt: now,
      revisions: [],
    };
    task.resultHtml = buildIntakeDraft(task, escapeHtml);
    task.resultText = `材料已收齐并匹配 ${task.skillName}。目标：${task.goal}\n\n当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`;
    tasks.push(task);
    saveTasks();
    activeTaskId = task.id;
    launcherExpanded = false;
    draft = { skillId: "auto", goal: "", material: "", files: [] };
    render();
    showToast(`已创建任务，并匹配“${skill.name}”`);
  });

  const fileInput = document.getElementById("task-files");
  fileInput?.addEventListener("change", async (event) => {
    captureDraft();
    draft.files.push(...await filesToRecords(event.target.files));
    render();
    showToast(`已加入 ${event.target.files.length} 个文件`);
  });

  const drop = document.getElementById("material-drop");
  drop?.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("drag-over");
  });
  drop?.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop?.addEventListener("drop", async (event) => {
    event.preventDefault();
    drop.classList.remove("drag-over");
    captureDraft();
    const files = event.dataTransfer.files;
    draft.files.push(...await filesToRecords(files));
    render();
    showToast(`已加入 ${files.length} 个文件`);
  });

  const quickGoal = document.getElementById("task-quick-goal");
  quickGoal?.addEventListener("input", () => {
    draft.goal = quickGoal.value;
  });
  quickGoal?.addEventListener("focus", () => {
    draft.goal = quickGoal.value;
    launcherExpanded = true;
    render();
    requestAnimationFrame(() => {
      const goal = document.getElementById("task-goal");
      goal?.focus();
      goal?.setSelectionRange(goal.value.length, goal.value.length);
    });
  }, { once: true });
}

function captureDraft() {
  const material = document.getElementById("task-material");
  const goal = document.getElementById("task-goal");
  const quickGoal = document.getElementById("task-quick-goal");
  if (material) draft.material = material.value;
  if (goal) draft.goal = goal.value;
  if (quickGoal) draft.goal = quickGoal.value;
}
