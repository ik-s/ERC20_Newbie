import { el, routeLink } from "../utils/dom";

const officialLink = (label: string, href: string): HTMLAnchorElement =>
  el("a", {
    className: "text-link official-resource-link",
    text: `${label} ↗`,
    attrs: { href, target: "_blank", rel: "noreferrer noopener" },
  });

export function renderDeploymentBasicsPage(): HTMLElement {
  const backLink = routeLink("<", "/", "function-back-link deployment-guide-back-link");
  backLink.setAttribute("aria-label", "이전 화면으로 돌아가기");
  backLink.addEventListener("click", (event) => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    window.history.back();
  });

  return el("main", {},
    el("section", { className: "page-hero deployment-guide-hero" },
      backLink,
      el("p", { className: "eyebrow", text: "DEPLOYMENT BASICS" }),
      el("h1", { text: "배포 전에 알아둘 두 가지" }),
      el("p", {
        className: "hero-lead",
        text: "토큰을 만드는 코드와 그 코드를 연습하는 네트워크는 서로 다른 역할을 합니다.",
      }),
    ),
    el("section", { className: "section deployment-guide-section" },
      el("div", { className: "deployment-guide-grid" },
        el("article", { className: "card deployment-guide-card", attrs: { "data-guide-topic": "sepolia" } },
          el("p", { className: "eyebrow", text: "TEST NETWORK" }),
          el("h2", { text: "Sepolia" }),
          el("p", { text: "Ethereum 애플리케이션과 스마트 컨트랙트를 실제 자산 없이 시험하는 공개 테스트넷입니다." }),
          el("p", { text: "메인넷과 계정 형식 및 실행 방식은 비슷하지만 잔액과 거래 기록은 서로 분리됩니다." }),
          el("p", { className: "deployment-guide-note", text: "Sepolia ETH는 실습용이며 실제 금전적 가치를 전제로 하지 않습니다." }),
          officialLink("Ethereum 네트워크 공식 문서", "https://ethereum.org/developers/docs/networks/"),
        ),
        el("article", { className: "card deployment-guide-card", attrs: { "data-guide-topic": "openzeppelin" } },
          el("p", { className: "eyebrow", text: "CONTRACT LIBRARY" }),
          el("h2", { text: "OpenZeppelin" }),
          el("p", { text: "ERC-20 같은 표준 구현을 제공하는 재사용 가능한 Solidity 스마트 컨트랙트 라이브러리입니다." }),
          el("p", { text: "검증된 기반 코드를 활용해 직접 구현에서 생길 수 있는 실수를 줄여줍니다." }),
          el("p", { className: "deployment-guide-note", text: "라이브러리를 사용하더라도 프로젝트별 검토와 테스트는 필요합니다." }),
          officialLink("OpenZeppelin Contracts 공식 문서", "https://docs.openzeppelin.com/contracts/5.x"),
        ),
      ),
    ),
    el("section", { className: "section soft-section deployment-flow-section" },
      el("p", { className: "eyebrow", text: "HOW THEY WORK TOGETHER" }),
      el("h2", { text: "코드는 OpenZeppelin으로, 연습은 Sepolia에서." }),
      el("ol", { className: "deployment-flow", attrs: { "aria-label": "토큰 테스트 배포 흐름" } },
        ...["ERC-20 코드 구성", "Solidity 컴파일", "Sepolia 배포", "지갑과 탐색기에서 확인"].map((label, index) =>
          el("li", { className: "deployment-flow-step" },
            el("span", { text: String(index + 1) }),
            el("strong", { text: label }),
          ),
        ),
      ),
    ),
  );
}
