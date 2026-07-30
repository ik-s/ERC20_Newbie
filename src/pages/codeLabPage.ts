import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { compileSolidity } from "../erc20/compiler";
import { CODE_LAB_TASKS, findTaskAnchorLines, getTaskComparison, getTaskStarterSource, type CodeLabComparisonItem, type CodeLabTask } from "../erc20/codeLabTasks";
import type { AppStore } from "../state/store";
import { button, el } from "../utils/dom";

const setTaskFocus = StateEffect.define<readonly number[]>();
const taskFocusField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (decorations, transaction) => {
    const effect = transaction.effects.find((item) => item.is(setTaskFocus));
    if (!effect) return decorations.map(transaction.changes);
    const builder = new RangeSetBuilder<Decoration>();
    effect.value.forEach((lineNumber) => {
      if (lineNumber > transaction.state.doc.lines) return;
      builder.add(transaction.state.doc.line(lineNumber).from, transaction.state.doc.line(lineNumber).from, Decoration.line({ attributes: { class: "task-focus-line" } }));
    });
    return builder.finish();
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function renderCodeLabPage(store: AppStore): HTMLElement {
  let activeTask = CODE_LAB_TASKS[0]!;
  let hintIndex = 0;
  let editorView: EditorView | undefined;
  const getDraft = (task: CodeLabTask) => store.getState().persisted.codeLabDrafts[task.id] ?? getTaskStarterSource(task);
  const saveDraft = (task: CodeLabTask, source: string) => store.update((state) => ({
    ...state,
    persisted: {
      ...state.persisted,
      codeLabDrafts: { ...state.persisted.codeLabDrafts, [task.id]: source },
    },
  }));

  const editorHost = el("div", { className: "editor-host", attrs: { "aria-label": "Solidity 코드 편집기" } });
  const output = el("div", { className: "compiler-output", attrs: { role: "status", "aria-live": "polite" } }, el("p", { text: "코드를 수정한 뒤 컴파일해보세요." }));
  const taskObjective = el("p", { className: "task-objective", text: activeTask.objective });
  const hint = el("div", { className: "hint-box", text: "힌트 버튼을 눌러 첫 번째 단서를 확인하세요." });
  const hintButton = button("힌트 1/3 보기", { className: "button button-secondary hint-button" });
  const comparisonPanel = el("div", { className: "guided-comparison", attrs: { "aria-live": "polite" } });
  const tasks = el("div", { className: "task-list" });
  const taskButtons = new Map<CodeLabTask, HTMLButtonElement>();
  const clearComparison = () => comparisonPanel.replaceChildren();
  const renderComparisonCard = (item: CodeLabComparisonItem) => {
    const status = item.state === "match"
      ? "정답과 같습니다."
      : item.state === "customizable"
        ? "자유롭게 바꿀 수 있는 값입니다."
        : "기준 답안에 필요한 코드가 보이지 않습니다.";
    return el("article", { className: "comparison-card", attrs: { "data-state": item.state } },
      el("strong", { text: item.label }),
      el("p", { className: "comparison-value", text: `내 코드: ${item.learnerValue}` }),
      el("p", { className: "comparison-value", text: `기준 답안: ${item.referenceValue}` }),
      el("p", { className: "comparison-status", text: status }),
      el("p", { className: "comparison-guidance", text: item.guidance }),
    );
  };
  const renderComparison = (source: string) => {
    comparisonPanel.replaceChildren(
      el("h3", { text: `${activeTask.title} 기준 답안` }),
      ...getTaskComparison(activeTask, source).map(renderComparisonCard),
    );
  };
  const focusTaskInEditor = (task: CodeLabTask) => {
    if (!editorView) return;
    const lines = findTaskAnchorLines(task, editorView.state.doc.toString());
    if (lines.length === 0) return;
    editorView.dispatch({
      effects: setTaskFocus.of(lines),
      selection: { anchor: editorView.state.doc.line(lines[0]!).from },
      scrollIntoView: true,
    });
  };
  const resetHints = () => {
    hintIndex = 0;
    hint.textContent = "힌트 버튼을 눌러 첫 번째 단서를 확인하세요.";
    hintButton.textContent = "힌트 1/3 보기";
    hintButton.disabled = false;
  };
  const updateTaskSelection = () => taskButtons.forEach((node, task) => {
    node.classList.toggle("is-active", task === activeTask);
    node.setAttribute("aria-pressed", String(task === activeTask));
  });
  const changeEditorSource = (source: string) => {
    if (!editorView) return;
    editorView.dispatch({ changes: { from: 0, to: editorView.state.doc.length, insert: source } });
  };
  const selectTask = (task: CodeLabTask) => {
    if (editorView) saveDraft(activeTask, editorView.state.doc.toString());
    activeTask = task;
    taskObjective.textContent = task.objective;
    resetHints();
    clearComparison();
    updateTaskSelection();
    changeEditorSource(getDraft(task));
    focusTaskInEditor(task);
  };

  CODE_LAB_TASKS.forEach((task, index) => {
    const taskButton = button(`${index + 1}. ${task.title}`, {
      className: "task-button",
      onClick: () => selectTask(task),
    });
    taskButton.setAttribute("aria-pressed", String(task === activeTask));
    taskButtons.set(task, taskButton);
    tasks.append(taskButton);
  });
  updateTaskSelection();

  hintButton.addEventListener("click", () => {
    if (hintIndex >= activeTask.hints.length) return;
    hint.textContent = activeTask.hints[hintIndex]!;
    hintIndex += 1;
    if (hintIndex === activeTask.hints.length) {
      hintButton.textContent = "힌트를 모두 확인했습니다";
      hintButton.disabled = true;
    } else {
      hintButton.textContent = `힌트 ${hintIndex + 1}/3 보기`;
    }
  });

  const compileButton = button("컴파일", { className: "button button-primary" });
  const resetButton = button("코드 초기화", { className: "button button-secondary" });
  const compareButton = button("정답과 비교", { className: "button button-secondary" });

  queueMicrotask(() => {
    const view = new EditorView({
      doc: getDraft(activeTask),
      extensions: [basicSetup, javascript(), taskFocusField, EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        saveDraft(activeTask, update.state.doc.toString());
      })],
      parent: editorHost,
    });
    editorView = view;
    focusTaskInEditor(activeTask);
    resetButton.addEventListener("click", () => {
      const starter = getTaskStarterSource(activeTask);
      changeEditorSource(starter);
      saveDraft(activeTask, starter);
      clearComparison();
      focusTaskInEditor(activeTask);
    });
    compareButton.addEventListener("click", () => renderComparison(view.state.doc.toString()));
    compileButton.addEventListener("click", async () => {
      compileButton.disabled = true;
      output.replaceChildren(el("p", { text: "Web Worker에서 Solidity를 컴파일하고 있습니다…" }));
      try {
        const result = await compileSolidity(view.state.doc.toString());
        if (result.ok) {
          output.replaceChildren(el("strong", { text: "컴파일 성공" }), el("p", { text: `${result.compilerVersion} · ${result.contracts.map((contract) => contract.name).join(", ")}` }));
        } else {
          output.replaceChildren(el("strong", { text: "컴파일 오류" }), ...result.diagnostics.filter((item) => item.severity === "error").map((item) => el("article", { className: "diagnostic" }, el("p", { text: `${item.line ?? "?"}:${item.column ?? "?"} · ${item.friendlyMessage}` }), el("pre", { text: item.formattedMessage }))));
        }
      } catch (error) {
        output.replaceChildren(el("strong", { text: "컴파일 실패" }), el("p", { text: error instanceof Error ? error.message : "알 수 없는 오류" }));
      } finally { compileButton.disabled = false; }
    });
  });

  return el("main", {},
    el("section", { className: "page-hero" }, el("p", { className: "eyebrow", text: "STEP 3 · 코드 확인 및 수정" }), el("h1", { text: "Solidity 코드를 직접 바꾸고 컴파일하세요." }), el("p", { className: "hero-lead", text: "과제마다 한 줄을 고치며 ERC-20의 핵심 동작을 익혀보세요. 작성 중인 코드는 이 브라우저에 자동 저장됩니다." })),
    el("section", { className: "section code-lab-layout" },
      el("aside", { className: "code-tasks card" }, el("h2", { text: "다섯 개 과제" }), el("p", { className: "warning-box", text: "교육용 구현입니다. 실제 서비스에는 OpenZeppelin을 사용하세요." }), tasks, taskObjective, hintButton, hint, comparisonPanel),
      el("div", { className: "editor-column" }, editorHost, el("div", { className: "button-row" }, compileButton, compareButton, resetButton), output),
    ),
  );
}
