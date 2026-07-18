import { FUNCTION_LESSONS } from "../erc20/functionLessons";
import { el, routeLink } from "../utils/dom";

export function renderFunctionsPage(): HTMLElement {
  return el("main", {},
    el("section", { className: "page-hero" },
      el("p", { className: "eyebrow", text: "STEP 2 · 함수 실습" }),
      el("h1", { text: "여섯 개 함수를 직접 실행하세요." }),
      el("p", { className: "hero-lead", text: "모든 실습은 로컬 시뮬레이션입니다. 지갑도 가스비도 필요 없고 실제 블록체인에는 기록되지 않습니다." }),
    ),
    el("section", { className: "section" },
      el("p", { className: "eyebrow", text: "THE SIX RULES" }),
      el("h2", { text: "ERC-20의 여섯 가지 핵심 함수를 눌러보세요." }),
      el("div", { className: "function-link-grid" },
        ...FUNCTION_LESSONS.map((lesson) => {
          const link = routeLink("", `/functions/${lesson.key}`, "function-link");
          link.append(
            el("strong", { className: "function-link-name", text: lesson.name }),
            el("span", { className: "function-link-summary", text: lesson.summary }),
          );
          return link;
        }),
      ),
      el("div", { className: "decimals-card" },
        el("div", {}, el("span", { text: "표시 수량" }), el("strong", { text: "1 LAB" })),
        el("div", {}, el("span", { text: "decimals" }), el("strong", { text: "18" })),
        el("div", {}, el("span", { text: "컨트랙트 내부 정수" }), el("strong", { text: "1,000,000,000,000,000,000" })),
      ),
    ),
  );
}
