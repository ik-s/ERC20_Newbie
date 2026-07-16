import type { FunctionLesson } from "../erc20/functionLessons";
import { codeForLesson } from "../erc20/codeExamples";
import { button, el } from "../utils/dom";

export function renderCodeViewer(lesson: FunctionLesson): HTMLElement {
  const code = codeForLesson(lesson);
  const output = el("code", { text: code.solidity });
  const pre = el("pre", { className: "code-block", attrs: { tabindex: "0", "aria-label": "실행 코드" } }, output);
  const solidity = button("Solidity", { className: "code-tab is-active" });
  const typescript = button("TypeScript", { className: "code-tab" });
  const setTab = (name: "solidity" | "typescript") => {
    output.textContent = code[name];
    solidity.classList.toggle("is-active", name === "solidity");
    typescript.classList.toggle("is-active", name === "typescript");
  };
  solidity.addEventListener("click", () => setTab("solidity"));
  typescript.addEventListener("click", () => setTab("typescript"));

  const advanced = el("details", { className: "advanced-details" },
    el("summary", { text: "고급 보기: ABI · selector · calldata" }),
    el("dl", {},
      el("div", {}, el("dt", { text: "ABI" }), el("dd", { text: lesson.signature })),
      el("div", {}, el("dt", { text: "호출 흐름" }), el("dd", { text: "버튼 클릭 → viem 호출 → (실제 네트워크에서는 지갑 서명) → 컨트랙트 실행 → 이벤트" })),
    ),
  );
  return el("section", { className: "code-viewer card", attrs: { "aria-labelledby": "code-title" } },
    el("div", { className: "section-heading" },
      el("div", {}, el("p", { className: "eyebrow", text: "STEP 3" }), el("h2", { text: "실행된 코드 확인", attrs: { id: "code-title" } })),
      el("div", { className: "code-tabs", attrs: { role: "tablist" } }, solidity, typescript),
    ),
    pre,
    advanced,
  );
}
