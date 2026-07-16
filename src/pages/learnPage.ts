import { FUNCTION_LESSONS } from "../erc20/functionLessons";
import { button, el, routeLink } from "../utils/dom";

const concepts: Array<readonly [string, string]> = [
  ["ERC", "Ethereum Request for Comments. 이더리움 생태계가 함께 쓰는 제안과 규칙입니다."],
  ["ERC-20", "토큰 이름이 아니라 대체 가능한 토큰의 공통 인터페이스입니다."],
  ["스마트 컨트랙트", "잔액과 전송 규칙을 블록체인에서 실행하는 프로그램입니다."],
  ["Read / Write", "Read는 무료 조회, Write는 상태를 바꾸며 서명과 테스트넷 가스가 필요합니다."],
  ["decimals", "사람에게 1 LAB로 보이는 값은 내부에서 10¹⁸ 정수로 저장될 수 있습니다."],
  ["allowance", "owner가 spender에게 대신 쓸 수 있도록 허용한 최대 수량입니다."],
  ["event", "Transfer와 Approval이 발생했다는 공개 영수증입니다."],
  ["testnet", "가치 없는 테스트 ETH로 안전하게 연습하는 네트워크입니다."],
];

export function renderLearnPage(onComplete: () => void): HTMLElement {
  const tokenRow = el("div", { className: "swap-row" });
  const labels = ["Alice의 1 LAB", "Bob의 1 LAB", "Charlie의 1 LAB"];
  labels.forEach((label) => tokenRow.append(button(label, { className: "swap-token" })));
  const message = el("p", { className: "success-message", text: "위치를 바꿔도 세 토큰의 전체 가치는 3 LAB로 같습니다." });
  tokenRow.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    tokenRow.prepend(target);
    message.textContent = `${target.textContent}의 위치가 바뀌었습니다. 전체 가치는 여전히 3 LAB입니다.`;
  });

  const functionLinks = el("div", { className: "function-link-grid" });
  FUNCTION_LESSONS.forEach((lesson) => functionLinks.append(routeLink(lesson.name, `/functions/${lesson.key}`, "function-link")));

  return el("main", {},
    el("section", { className: "page-hero" },
      el("p", { className: "eyebrow", text: "STEP 1 · 이해하기" }),
      el("h1", { text: "ERC-20은 토큰이 아니라, 토큰이 지키는 공통 규칙입니다." }),
      el("p", { className: "hero-lead", text: "은행마다 송금 방식이 모두 다르면 앱은 은행 수만큼 연동해야 합니다. ERC-20은 모든 토큰이 같은 버튼을 제공하도록 약속합니다." }),
    ),
    el("section", { className: "section" },
      el("div", { className: "concept-grid" }, ...concepts.map(([title, copy]) => el("article", { className: "concept-card card" }, el("span", { className: "concept-number", text: String(concepts.findIndex((item) => item[0] === title) + 1).padStart(2, "0") }), el("h2", { text: title }), el("p", { text: copy })))),
    ),
    el("section", { className: "section soft-section" },
      el("div", { className: "section-heading" }, el("div", {}, el("p", { className: "eyebrow", text: "FUNGIBILITY" }), el("h2", { text: "누구의 1 LAB든 같은 1 LAB입니다." }))),
      el("div", { className: "compare-grid" },
        el("article", { className: "card" }, el("h3", { text: "ERC-20 · 대체 가능" }), el("p", { text: "아래 토큰을 눌러 위치를 바꿔보세요." }), tokenRow, message),
        el("article", { className: "card ticket-card" }, el("h3", { text: "NFT · 고유한 자리" }), el("p", { text: "A열 1번과 B열 7번은 같은 티켓으로 바꿀 수 없습니다." }), el("div", { className: "ticket-row" }, el("span", { text: "A열 1번" }), el("span", { text: "A열 2번" }), el("span", { text: "B열 7번" }))),
      ),
    ),
    el("section", { className: "section" },
      el("p", { className: "eyebrow", text: "THE SIX RULES" }),
      el("h2", { text: "ERC-20의 여섯 가지 핵심 함수를 눌러보세요." }),
      functionLinks,
      el("div", { className: "decimals-card" }, el("div", {}, el("span", { text: "표시 수량" }), el("strong", { text: "1 LAB" })), el("div", {}, el("span", { text: "decimals" }), el("strong", { text: "18" })), el("div", {}, el("span", { text: "컨트랙트 내부 정수" }), el("strong", { text: "1,000,000,000,000,000,000" }))),
      button("이해 완료하고 함수 실습 시작", { className: "button button-primary button-large", onClick: onComplete }),
    ),
  );
}
