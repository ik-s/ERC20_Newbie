import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { compileSolidity } from "../erc20/compiler";
import { CODE_TASKS, EDUCATIONAL_SOURCE } from "../erc20/educationalSource";
import type { AppStore } from "../state/store";
import { button, el } from "../utils/dom";

export function renderCodeLabPage(store: AppStore): HTMLElement {
  const saved = store.getState().persisted.editedSource || EDUCATIONAL_SOURCE;
  const editorHost = el("div", { className: "editor-host", attrs: { "aria-label": "Solidity 코드 편집기" } });
  const output = el("div", { className: "compiler-output", attrs: { role: "status", "aria-live": "polite" } }, el("p", { text: "코드를 수정한 뒤 컴파일해보세요." }));
  const hint = el("div", { className: "hint-box", text: "과제를 선택하면 단계별 힌트가 여기에 표시됩니다." });
  const tasks = el("div", { className: "task-list" });
  CODE_TASKS.forEach((task, index) => tasks.append(button(`${index + 1}. ${task.title}`, { className: "task-button", onClick: () => { hint.textContent = task.hint; } })));

  queueMicrotask(() => {
    const view = new EditorView({
      doc: saved,
      extensions: [basicSetup, javascript(), EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        const source = update.state.doc.toString();
        store.update((state) => ({ ...state, persisted: { ...state.persisted, editedSource: source } }));
      })],
      parent: editorHost,
    });
    resetButton.addEventListener("click", () => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: EDUCATIONAL_SOURCE } }));
    compareButton.addEventListener("click", () => {
      const current = view.state.doc.toString();
      hint.textContent = current === EDUCATIONAL_SOURCE ? "기본 정답 코드와 같습니다. 이제 일부를 바꿔 실험해보세요." : "기본 코드와 다른 부분이 있습니다. 컴파일 결과를 확인하며 수정하세요.";
    });
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

  const compileButton = button("컴파일", { className: "button button-primary" });
  const resetButton = button("코드 초기화", { className: "button button-secondary" });
  const compareButton = button("정답과 비교", { className: "button button-secondary" });
  return el("main", {},
    el("section", { className: "page-hero" }, el("p", { className: "eyebrow", text: "STEP 4 · 코드 수정" }), el("h1", { text: "Solidity 코드를 직접 바꾸고 컴파일하세요." }), el("p", { className: "hero-lead", text: "교육용 구현을 한 줄씩 고쳐보세요. 마지막 코드는 이 브라우저에 자동 저장됩니다." })),
    el("section", { className: "section code-lab-layout" },
      el("aside", { className: "code-tasks card" }, el("h2", { text: "다섯 개 과제" }), el("p", { className: "warning-box", text: "교육용 구현입니다. 실제 서비스에는 OpenZeppelin을 사용하세요." }), tasks, hint),
      el("div", { className: "editor-column" }, editorHost, el("div", { className: "button-row" }, compileButton, compareButton, resetButton), output),
    ),
  );
}
