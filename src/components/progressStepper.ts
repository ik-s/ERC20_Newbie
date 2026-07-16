import type { LearningProgress } from "../types";
import { el } from "../utils/dom";

const STEPS = ["이해하기", "함수 실행", "코드 확인", "코드 수정", "테스트넷 배포"];

export function renderProgressStepper(progress: LearningProgress): HTMLElement {
  const completed = new Set(progress.completedLessons);
  const list = el("ol", { className: "progress-stepper", attrs: { "aria-label": "학습 단계" } });
  STEPS.forEach((label, index) => {
    const done = completed.has(`step-${index + 1}`);
    list.append(el("li", { className: done ? "is-complete" : "", attrs: { "data-roadmap-step": "" } },
      el("span", { className: "step-index", text: done ? "✓" : String(index + 1) }),
      el("span", { text: label }),
    ));
  });
  return list;
}
