const TASK_STORAGE_KEY = "clair-ai-studio-tasks-v1";

const intakeActions = [
  { id: "save", name: "仅保存", icon: "◇", hint: "收进成果区，不执行分析" },
  { id: "review", name: "执行评审", icon: "审", hint: "智能判断最合适的评审路径" },
  { id: "skill", name: "触发 Skill", icon: "✦", hint: "明确指定一个工具执行" },
];

export const taskSkills = [
  { id: "auto", name: "智能识别", summon: "自动派单", icon: "✦", hint: "让 AI 判断最适合的任务" },
  { id: "requirement", name: "需求评审", summon: "需求专家", icon: "需", hint: "价值、范围、规则、验收" },
  { id: "solution", name: "方案评审", summon: "方案专家", icon: "案", hint: "体验、逻辑、可行性、风险" },
  { id: "decision", name: "决策推演", summon: "决策顾问", icon: "决", hint: "选项、证据、取舍、止损" },
  { id: "agreement", name: "协议审查", summon: "协议专家", icon: "协", hint: "权责、数据、责任、退出" },
  { id: "career", name: "履历评估", summon: "履历顾问", icon: "历", hint: "事实、能力、匹配、核验" },
];

let tasks = loadTasks();
let draft = emptyDraft();
let activeTaskId = "";
let taskMode = "compose";
let launcherExpanded = false;

function emptyDraft() {
  return {
    action: "review",
    skillId: "auto",
    goal: "",
    material: "",
    files: [],
    collabEnabled: false,
    collabUrl: "",
  };
}

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

function actionById(actionId) {
  return intakeActions.find((action) => action.id === actionId) || intakeActions[1];
}

function validHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function collaborativeUrlFrom(text) {
  const urls = text.match(/https?:\/\/[^\s<>"'）)]+/gi) || [];
  return urls.find((url) => /feishu\.cn|docs\.qq\.com|notion\.(so|site)|docs\.google\.com|yuque\.com|shimo\.im|office\.com|sharepoint\.com/i.test(url)) || "";
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
  const collaboration = task.collabUrl
    ? `<li>协作文档：<a href="${escapeHtml(task.collabUrl)}" target="_blank" rel="noreferrer">打开协作文档 ↗</a></li>`
    : "";
  return `
    <h2>材料已收齐</h2>
    <p>已匹配 <strong>${escapeHtml(task.skillName)}</strong>，目标是：${escapeHtml(task.goal)}</p>
    <h3>输入概览</h3>
    <ul>
      <li>附件：${escapeHtml(fileSummary)}</li>
      <li>粘贴内容：${materialSize} 字</li>
      ${collaboration}
      <li>Skill 版本：1.0.0</li>
    </ul>
    <h3>下一步</h3>
    <p>任务已保存。安全 AI 服务接通后会在这里生成完整初稿；在此之前可继续补充材料，或直接粘贴已完成的分析结果。</p>`;
}

function buildSavedRecord(task, escapeHtml) {
  const fileSummary = task.files.length
    ? task.files.map((file) => `${file.name}（${file.sizeLabel}）`).join("、")
    : "无附件";
  const collaboration = task.collabUrl
    ? `<p><strong>协作文档</strong><br /><a href="${escapeHtml(task.collabUrl)}" target="_blank" rel="noreferrer">${escapeHtml(task.collabUrl)} ↗</a></p>`
    : "";
  return `
    <h2>资料已保存</h2>
    <p>${escapeHtml(task.goal).replaceAll("\n", "<br />")}</p>
    <h3>保存内容</h3>
    <ul>
      <li>附件记录：${escapeHtml(fileSummary)}</li>
      <li>文本内容：${task.material.trim().length} 字</li>
      <li>保存位置：当前浏览器成果区</li>
    </ul>
    ${collaboration}
    <p><small>静态版本不会上传原文件；这里只保存文字、链接、文件名及可读取文本摘要。</small></p>`;
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

function expertSummonerMarkup(escapeHtml) {
  return taskSkills.map((skill) => `
    <button class="expert-choice ${draft.skillId === skill.id ? "selected" : ""}" type="button"
      data-task-action="choose-skill" data-skill-id="${skill.id}"
      title="${escapeHtml(skill.hint)}" aria-pressed="${draft.skillId === skill.id}">
      <span>${escapeHtml(skill.icon)}</span>
      <strong>@${escapeHtml(skill.summon)}</strong>
    </button>`).join("");
}

function intakeActionsMarkup(escapeHtml) {
  return intakeActions.map((action) => `
    <button class="intake-action ${draft.action === action.id ? "selected" : ""}" type="button"
      data-task-action="choose-action" data-action-id="${action.id}"
      aria-pressed="${draft.action === action.id}" title="${escapeHtml(action.hint)}">
      <span>${escapeHtml(action.icon)}</span>
      <strong>${escapeHtml(action.name)}</strong>
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
  return `
    <section class="inline-task-launcher prompt-launcher" aria-label="发起任务">
      <form class="prompt-composer" id="task-composer">
        <div class="prompt-main">
          <span class="prompt-orb" aria-hidden="true">✦</span>
          <textarea id="task-goal" rows="3" placeholder="描述你想完成的事，或把文档、图片直接拖进来……" aria-label="任务描述">${escapeHtml(draft.goal)}</textarea>
        </div>
        ${attachmentsMarkup(escapeHtml)}
        <div class="intake-route-row">
          <div class="intake-actions" aria-label="处理方式">${intakeActionsMarkup(escapeHtml)}</div>
          <button class="collab-toggle ${draft.collabEnabled ? "selected" : ""}" type="button"
            data-task-action="toggle-collab" aria-expanded="${draft.collabEnabled}">
            <span aria-hidden="true">↗</span><strong>协作文档</strong><small>可选</small>
          </button>
        </div>
        ${draft.collabEnabled ? `
          <label class="collab-url-row" for="task-collab-url">
            <span>协作文档链接</span>
            <input id="task-collab-url" type="url" value="${escapeHtml(draft.collabUrl)}"
              placeholder="粘贴飞书、腾讯文档、Notion 等协作链接" />
          </label>` : ""}
        <div class="prompt-footer">
          <div class="prompt-material-actions">
            <label class="prompt-file-button" for="task-files">
              <input id="task-files" type="file" multiple />
              <span aria-hidden="true">＋</span>
              <strong>材料</strong>
            </label>
            <span class="paste-hint">拖入文件 · ⌘V 粘贴图片</span>
          </div>
          ${draft.action === "save"
            ? `<div class="save-mode-note"><span>◇</span><small>只保存记录，不执行分析</small></div>`
            : `<div class="expert-summoner" aria-label="召唤专家">
                <span class="summon-label">${draft.action === "skill" ? "选择 Skill" : "评审路径"}</span>
                <div class="expert-strip">${expertSummonerMarkup(escapeHtml)}</div>
              </div>`}
          <button class="prompt-submit" type="submit" aria-label="${draft.action === "save" ? "保存资料" : draft.action === "skill" ? "运行 Skill" : "执行评审"}">
            <span>${draft.action === "save" ? "保存" : draft.action === "skill" ? "运行" : "评审"}</span><i aria-hidden="true">↑</i>
          </button>
        </div>
      </form>
      ${taskProgressMarkup(escapeHtml)}
    </section>
    <div class="global-drop-overlay" aria-hidden="true">
      <div><span>＋</span><strong>松手，创建任务</strong><small>文件会加入统一任务入口</small></div>
    </div>`;
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
  const collaboration = task.collabUrl
    ? `<section><span>协作文档</span><p><a href="${escapeHtml(task.collabUrl)}" target="_blank" rel="noreferrer">打开协作文档 ↗</a></p></section>`
    : "";
  return `
    <section class="task-center task-detail inline-task-detail">
      <button class="back-to-tasks" type="button" data-task-action="close-task">← 返回成果区</button>
      <div class="task-detail-header">
        <div><span class="eyebrow">${task.workflow === "save" ? "SAVED MATERIAL" : `${escapeHtml(task.skillName)} · SKILL V${escapeHtml(task.skillVersion)}`}</span><h1>${escapeHtml(task.title)}</h1></div>
        <span class="status-pill ${isConfirmed ? "done" : ""}">${isConfirmed ? "已进入成果区" : "等待人工确认"}</span>
      </div>
      <div class="task-review-layout">
        <aside class="task-context">
          <section><span>目标</span><p>${escapeHtml(task.goal)}</p></section>
          <section><span>材料</span><p>${task.files.length} 个附件 · ${task.material.length} 字粘贴内容</p></section>
          ${collaboration}
          <section><span>${task.workflow === "save" ? "保存方式" : "人工路径"}</span><p>${task.workflow === "save"
            ? "仅保存记录与可读取摘要，不执行分析"
            : "补充材料 → 修改初稿 → 再分析 → 确认入库"}</p></section>
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
        <div><h2>任务成果</h2></div>
        <span>${results.length} 份已确认</span>
      </div>
      <div class="generated-result-grid">${results.map((task) => `
        <button class="generated-result-card" type="button" data-task-action="open-task" data-task-id="${task.id}">
          <span>${task.workflow === "save" ? "◇" : escapeHtml(skillById(task.skillId).icon)}</span>
          <div><small>${escapeHtml(task.skillName)}</small><strong>${escapeHtml(task.title)}</strong></div>
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
      } else if (action === "focus-composer") {
        if (!document.querySelector(".prompt-composer")) {
          activeTaskId = "";
          taskMode = "compose";
          launcherExpanded = false;
          render();
          requestAnimationFrame(focusComposer);
        } else {
          focusComposer();
        }
      } else if (action === "choose-action") {
        captureDraft();
        draft.action = event.currentTarget.dataset.actionId;
        if (draft.action === "skill" && draft.skillId === "auto") draft.skillId = "requirement";
        if (draft.action === "review") draft.skillId = "auto";
        render();
        requestAnimationFrame(focusComposer);
      } else if (action === "toggle-collab") {
        captureDraft();
        draft.collabEnabled = !draft.collabEnabled;
        render();
        if (draft.collabEnabled) {
          requestAnimationFrame(() => document.getElementById("task-collab-url")?.focus());
        }
      } else if (action === "choose-skill") {
        captureDraft();
        draft.skillId = event.currentTarget.dataset.skillId;
        draft.action = draft.skillId === "auto" ? "review" : "skill";
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
        draft = {
          action: task.workflow || "review",
          skillId: task.requestedSkillId,
          goal: task.goal,
          material: task.material,
          files: task.files,
          collabEnabled: Boolean(task.collabUrl),
          collabUrl: task.collabUrl || "",
        };
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
      if (draft.files.length) {
        draft.goal = "分析已提供的材料";
      } else {
        showToast("写下任务，或先加入一份材料");
        document.getElementById("task-goal")?.focus();
        return;
      }
    }
    if (draft.collabEnabled && draft.collabUrl.trim() && !validHttpUrl(draft.collabUrl.trim())) {
      showToast("协作文档需要完整的 http 或 https 链接");
      document.getElementById("task-collab-url")?.focus();
      return;
    }
    if (draft.action === "skill" && draft.skillId === "auto") {
      showToast("请先选择要触发的 Skill");
      return;
    }
    const resolvedSkillId = draft.skillId === "auto"
      ? inferSkill(`${draft.goal}\n${draft.material}\n${draft.files.map((file) => file.name).join(" ")}`)
      : draft.skillId;
    const skill = skillById(resolvedSkillId);
    const action = actionById(draft.action);
    const now = new Date().toISOString();
    const saveOnly = draft.action === "save";
    const task = {
      id: uid(),
      title: titleFromGoal(draft.goal, saveOnly ? "已保存" : skill.name),
      workflow: draft.action,
      workflowName: action.name,
      requestedSkillId: draft.skillId,
      skillId: resolvedSkillId,
      skillName: saveOnly ? "资料收纳" : skill.name,
      skillVersion: saveOnly ? "local" : "1.0.0",
      goal: draft.goal.trim(),
      material: draft.material.trim() || draft.goal.trim(),
      files: draft.files,
      collabUrl: draft.collabEnabled ? draft.collabUrl.trim() : "",
      status: saveOnly ? "confirmed" : "review",
      createdAt: now,
      updatedAt: now,
      confirmedAt: saveOnly ? now : "",
      revisions: [],
    };
    task.resultHtml = saveOnly
      ? buildSavedRecord(task, escapeHtml)
      : buildIntakeDraft(task, escapeHtml);
    task.resultText = saveOnly
      ? `资料已保存。${task.goal}`
      : `材料已收齐并匹配 ${task.skillName}。目标：${task.goal}\n\n当前安全 AI 服务尚未接通，任务已保存，可继续补充或粘贴分析结果。`;
    tasks.push(task);
    saveTasks();
    activeTaskId = task.id;
    launcherExpanded = false;
    draft = emptyDraft();
    render();
    showToast(saveOnly ? "已保存到成果区" : `已创建任务，并匹配“${skill.name}”`);
  });

  const fileInput = document.getElementById("task-files");
  fileInput?.addEventListener("change", async (event) => {
    captureDraft();
    draft.files.push(...await filesToRecords(event.target.files));
    render();
    showToast(`已加入 ${event.target.files.length} 个文件`);
  });

  const drop = document.getElementById("material-drop")
    || document.querySelector(".prompt-composer");
  drop?.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("drag-over");
  });
  drop?.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop?.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    drop.classList.remove("drag-over");
    captureDraft();
    const files = event.dataTransfer.files;
    draft.files.push(...await filesToRecords(files));
    render();
    showToast(`已加入 ${files.length} 个文件`);
  });

  const prompt = document.getElementById("task-goal");
  prompt?.addEventListener("input", () => {
    draft.goal = prompt.value;
  });
  prompt?.addEventListener("paste", async (event) => {
    const imageFiles = [...(event.clipboardData?.items || [])]
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!imageFiles.length) return;
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text/plain");
    const start = prompt.selectionStart ?? prompt.value.length;
    const end = prompt.selectionEnd ?? start;
    draft.goal = `${prompt.value.slice(0, start)}${pastedText}${prompt.value.slice(end)}`;
    draft.files.push(...await filesToRecords(imageFiles));
    render();
    showToast(`已从剪贴板加入 ${imageFiles.length} 张图片`);
  });

  const collabInput = document.getElementById("task-collab-url");
  collabInput?.addEventListener("input", () => {
    draft.collabUrl = collabInput.value;
  });

  bindGlobalIntake({ render, showToast });
}

function captureDraft() {
  const material = document.getElementById("task-material");
  const goal = document.getElementById("task-goal");
  const quickGoal = document.getElementById("task-quick-goal");
  const collabUrl = document.getElementById("task-collab-url");
  if (material) draft.material = material.value;
  if (goal) draft.goal = goal.value;
  if (quickGoal) draft.goal = quickGoal.value;
  if (collabUrl) draft.collabUrl = collabUrl.value;
}

function focusComposer() {
  const composer = document.querySelector(".prompt-composer");
  composer?.scrollIntoView({ behavior: "smooth", block: "center" });
  requestAnimationFrame(() => document.getElementById("task-goal")?.focus());
}

function editableTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function addTextToDraft(text) {
  const clean = text.trim();
  if (!clean) return;
  draft.goal = [draft.goal.trim(), clean].filter(Boolean).join("\n\n");
  const collabUrl = collaborativeUrlFrom(clean);
  if (collabUrl && !draft.collabUrl) {
    draft.collabEnabled = true;
    draft.collabUrl = collabUrl;
  }
}

function bindGlobalIntake({ render, showToast }) {
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
    addTextToDraft(text);
    if (files.length) draft.files.push(...await filesToRecords(files));
    render();
    requestAnimationFrame(focusComposer);
    showToast(files.length ? `已从剪贴板加入 ${files.length} 个材料` : "已把粘贴内容放入新任务");
  };

  document.ondragover = (event) => {
    if (![...(event.dataTransfer?.types || [])].some((type) => type === "Files" || type === "text/uri-list")) return;
    event.preventDefault();
    document.body.classList.add("global-drag-ready");
  };
  document.ondragleave = (event) => {
    if (!event.relatedTarget) document.body.classList.remove("global-drag-ready");
  };
  document.ondrop = async (event) => {
    document.body.classList.remove("global-drag-ready");
    if (event.target?.closest?.(".prompt-composer")) return;
    const files = event.dataTransfer?.files || [];
    const uri = event.dataTransfer?.getData("text/uri-list") || "";
    if (!files.length && !uri.trim()) return;
    event.preventDefault();
    if (files.length) draft.files.push(...await filesToRecords(files));
    addTextToDraft(uri);
    render();
    requestAnimationFrame(focusComposer);
    showToast(files.length ? `已拖入 ${files.length} 个文件` : "已把链接放入新任务");
  };
}
