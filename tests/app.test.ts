import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { CODE_LAB_TASKS, getTaskStarterSource } from "../src/erc20/codeLabTasks";

describe("ERC-20 Lab app", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders the learning roadmap and wallet-free start action", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/");

    expect([...document.querySelectorAll(".hero-title-line")].map((line) => line.textContent)).toEqual([
      "ERC-20을 읽지만 말고",
      "직접 체험해보세요.",
    ]);
    expect([...document.querySelectorAll(".hero-lead-line")].map((line) => line.textContent)).toEqual([
      "토큰의 잔액을 확인하고, 전송하고,",
      "사용 권한을 승인한 뒤",
      "나만의 토큰을 Sepolia에 배포해보세요.",
    ]);
    expect(document.querySelector(".roadmap-section h2")?.textContent).toBe("네 단계면 ERC-20을 정복할 수 있습니다.");
    expect(document.querySelector(".concept-teaser-title")?.textContent).toBe("하나의 규칙이 모든 토큰을 연결합니다.");
    expect(document.body.textContent).toContain("지갑 연결 없이 시작하기");
    expect([...document.querySelectorAll("[data-roadmap-step]")].map((step) => step.textContent)).toEqual([
      "1이해하기",
      "2함수 실습",
      "3코드 확인 및 수정",
      "4테스트넷 배포",
    ]);
  });

  it("uses the merged four-step learning flow across later pages", () => {
    const app = createApp(document.querySelector("#app")!);

    app.render("/code-lab");
    expect(document.querySelector(".page-hero .eyebrow")?.textContent).toBe("STEP 3 · 코드 확인 및 수정");

    app.render("/token-builder");
    expect(document.querySelector(".page-hero .eyebrow")?.textContent).toBe("STEP 4 · 테스트넷 배포");
  });

  it("shows task-specific reference answers instead of a global source difference count", async () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/code-lab");
    await Promise.resolve();

    [...document.querySelectorAll<HTMLButtonElement>(".task-button")]
      .find((button) => button.textContent === "1. 토큰 정보 수정")?.click();
    [...document.querySelectorAll<HTMLButtonElement>(".button-secondary")]
      .find((button) => button.textContent === "정답과 비교")?.click();

    expect(document.body.textContent).toContain("기준 답안");
    expect(document.body.textContent).toContain("토큰 이름");
    expect(document.body.textContent).not.toContain("곳이 다릅니다");
  });

  it("makes every code lab task an actionable mission with progressive hints", async () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/code-lab");
    await Promise.resolve();

    [...document.querySelectorAll<HTMLButtonElement>(".task-button")]
      .find((node) => node.textContent === "2. balanceOf 완성")?.click();

    expect(document.querySelector(".task-objective")?.textContent)
      .toBe("account 주소의 잔액을 반환하는 한 줄을 작성하세요.");
    expect(document.querySelector(".editor-host")?.textContent)
      .toContain("// TODO: account 주소의 잔액을 반환하세요.");

    const hintButton = document.querySelector<HTMLButtonElement>(".hint-button")!;
    expect(hintButton.textContent).toBe("힌트 1/3 보기");
    hintButton.click();
    expect(document.querySelector(".hint-box")?.textContent)
      .toContain("특정 주소가 가진 토큰 수량");
    expect(hintButton.textContent).toBe("힌트 2/3 보기");
    hintButton.click();
    hintButton.click();
    expect(document.querySelector(".hint-box")?.textContent)
      .toContain("return balances[ ... ];");
    expect(hintButton.textContent).toBe("힌트를 모두 확인했습니다");
    expect(hintButton.disabled).toBe(true);
  });

  it("keeps code lab drafts separate and resets only the active mission", async () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/code-lab");
    await Promise.resolve();

    const balanceDraft = getTaskStarterSource(CODE_LAB_TASKS[1]!).replace(
      "// TODO: account 주소의 잔액을 반환하세요.",
      "return balances[account]; // learner balance draft",
    );
    const transferDraft = getTaskStarterSource(CODE_LAB_TASKS[2]!).replace(
      "// TODO: 받는 사람의 잔액을 늘리세요.",
      "balances[to] += amount; // learner transfer draft",
    );
    app.store.update((state) => ({
      ...state,
      persisted: {
        ...state.persisted,
        codeLabDrafts: { balance: balanceDraft, transfer: transferDraft },
      },
    }));

    const clickTask = (text: string) => [...document.querySelectorAll<HTMLButtonElement>(".task-button")]
      .find((node) => node.textContent === text)?.click();
    clickTask("2. balanceOf 완성");
    expect(document.querySelector(".editor-host")?.textContent).toContain("learner balance draft");
    clickTask("3. transfer 완성");
    expect(document.querySelector(".editor-host")?.textContent).toContain("learner transfer draft");

    [...document.querySelectorAll<HTMLButtonElement>(".button-secondary")]
      .find((node) => node.textContent === "코드 초기화")?.click();
    expect(app.store.getState().persisted.codeLabDrafts.transfer)
      .toContain("// TODO: 받는 사람의 잔액을 늘리세요.");
    expect(app.store.getState().persisted.codeLabDrafts.balance).toBe(balanceDraft);
  });

  it("links the shared footer to the deployment basics guide", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/token-builder");

    const guideLink = document.querySelector<HTMLAnchorElement>(".footer-guide-link");
    expect(guideLink?.textContent).toBe("Sepolia와 OpenZeppelin 알아보기 →");
    expect(guideLink?.getAttribute("href")).toBe("/guide/sepolia-openzeppelin");
    expect(guideLink?.hasAttribute("data-link")).toBe(true);
    expect(document.body.textContent).not.toContain("개인키와 복구 문구를 절대 입력하지 마세요.");
  });

  it("renders the deployment basics guide with an accessible home fallback", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/guide/sepolia-openzeppelin");

    expect(document.querySelector(".deployment-guide-hero .eyebrow")?.textContent).toBe("DEPLOYMENT BASICS");
    expect(document.querySelector("h1")?.textContent).toBe("배포 전에 알아둘 두 가지");

    const backLink = document.querySelector<HTMLAnchorElement>(".deployment-guide-back-link");
    expect(backLink?.textContent).toBe("<");
    expect(backLink?.getAttribute("href")).toBe("/");
    expect(backLink?.getAttribute("aria-label")).toBe("이전 화면으로 돌아가기");
  });

  it("returns to browser history from the deployment basics guide", () => {
    window.history.pushState({}, "", "/token-builder");
    window.history.pushState({}, "", "/guide/sepolia-openzeppelin");
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const app = createApp(document.querySelector("#app")!);
    app.render("/guide/sepolia-openzeppelin");

    document.querySelector<HTMLAnchorElement>(".deployment-guide-back-link")!.click();

    expect(backSpy).toHaveBeenCalledOnce();
    backSpy.mockRestore();
  });

  it("explains Sepolia and OpenZeppelin with verified official resources", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/guide/sepolia-openzeppelin");

    expect([...document.querySelectorAll("[data-guide-topic] h2")].map((heading) => heading.textContent)).toEqual([
      "Sepolia",
      "OpenZeppelin",
    ]);
    expect([...document.querySelectorAll(".deployment-flow-step")].map((step) => step.textContent)).toEqual([
      "1ERC-20 코드 구성",
      "2Solidity 컴파일",
      "3Sepolia 배포",
      "4지갑과 탐색기에서 확인",
    ]);

    const resourceLinks = [...document.querySelectorAll<HTMLAnchorElement>(".official-resource-link")];
    expect(resourceLinks.map((link) => link.href)).toEqual([
      "https://ethereum.org/developers/docs/networks/",
      "https://docs.openzeppelin.com/contracts/5.x",
    ]);
    resourceLinks.forEach((link) => {
      expect(link.target).toBe("_blank");
      expect(link.rel).toBe("noreferrer noopener");
    });
  });

  it("renders each function lab with execution, state, and code controls", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/functions/transfer");

    expect(document.querySelector("h1")?.textContent).toContain("transfer");
    expect(document.querySelector("[data-action='execute']")).not.toBeNull();
    expect(document.body.textContent).toContain("실행 전");
    expect(document.body.textContent).toContain("Solidity");
    expect(document.body.textContent).toContain("TypeScript");
  });

  it("moves the six rules from the concept page to function practice", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/learn");

    expect(document.body.textContent).not.toContain("THE SIX RULES");
    expect(document.querySelectorAll(".function-link")).toHaveLength(0);
    const start = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((node) => node.textContent === "함수 실습 시작")!;

    start.click();

    expect(window.location.pathname).toBe("/functions");
    expect(document.body.textContent).toContain("STEP 2 · 함수 실습");
    expect(document.body.textContent).toContain("THE SIX RULES");
    expect(document.querySelectorAll(".function-link")).toHaveLength(6);
    expect([...document.querySelectorAll(".function-link-summary")].map((node) => node.textContent)).toEqual([
      "토큰 전체 발행량을 조회합니다.",
      "한 주소가 가진 토큰 수량을 조회합니다.",
      "내 토큰을 내가 직접 보냅니다.",
      "토큰을 보내지 않고 사용 권한만 기록합니다.",
      "소유자와 spender 사이의 승인 수량을 조회합니다.",
      "승인받은 토큰을 대신 보냅니다.",
    ]);
    expect(document.body.textContent).toContain("1,000,000,000,000,000,000");
    expect(app.store.getState().persisted.progress.completedLessons).toContain("step-1");
  });

  it("shows step 2 context on function detail pages", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/functions/transfer");

    expect(document.querySelector(".function-step-label")?.textContent).toBe("STEP 2 · 함수 실습");
  });

  it("renders an accessible function lab back link with a list fallback", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/functions/total-supply");

    const backLink = document.querySelector<HTMLAnchorElement>(".function-back-link");
    expect(backLink?.textContent).toBe("<");
    expect(backLink?.getAttribute("href")).toBe("/functions");
    expect(backLink?.getAttribute("aria-label")).toBe("이전 화면으로 돌아가기");
  });

  it("uses browser history when a previous screen exists", () => {
    window.history.pushState({}, "", "/functions");
    window.history.pushState({}, "", "/functions/total-supply");
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
    const app = createApp(document.querySelector("#app")!);
    app.render("/functions/total-supply");

    document.querySelector<HTMLAnchorElement>(".function-back-link")!.click();

    expect(backSpy).toHaveBeenCalledOnce();
    backSpy.mockRestore();
  });

  it("executes transfer and shows changed balances and event", () => {
    const app = createApp(document.querySelector("#app")!);
    app.render("/functions/transfer");
    const amount = document.querySelector<HTMLInputElement>("#amount")!;
    amount.value = "30";
    document.querySelector<HTMLButtonElement>("[data-action='execute']")!.click();

    expect(document.body.textContent).toContain("970 LAB");
    expect(document.body.textContent).toContain("130 LAB");
    expect(document.body.textContent).toContain("Transfer 이벤트");
  });
});
