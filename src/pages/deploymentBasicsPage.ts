import { el, routeLink } from "../utils/dom";

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
  );
}
