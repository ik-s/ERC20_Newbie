import { FUNCTION_LESSONS } from "../erc20/functionLessons";
import { el, routeLink } from "../utils/dom";

export function renderFunctionsPage(): HTMLElement {
  return el("main", {},
    el("section", { className: "page-hero" }, el("p", { className: "eyebrow", text: "STEP 2 · 함수 실행" }), el("h1", { text: "여섯 개 함수를 직접 실행하세요." }), el("p", { className: "hero-lead", text: "모든 실습은 로컬 시뮬레이션입니다. 지갑도 가스비도 필요 없고 실제 블록체인에는 기록되지 않습니다." })),
    el("section", { className: "section lesson-grid" }, ...FUNCTION_LESSONS.map((lesson, index) => routeLink(`${String(index + 1).padStart(2, "0")}  ${lesson.name} — ${lesson.summary}`, `/functions/${lesson.key}`, `lesson-card card ${lesson.kind.toLowerCase()}`))),
  );
}
