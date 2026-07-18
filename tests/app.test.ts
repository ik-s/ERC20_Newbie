import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";

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
    expect(document.querySelector(".roadmap-section h2")?.textContent).toBe("다섯 단계면 ERC-20을 정복할 수 있습니다.");
    expect(document.querySelector(".concept-teaser-title")?.textContent).toBe("하나의 규칙이 모든 토큰을 연결합니다.");
    expect(document.body.textContent).toContain("지갑 연결 없이 시작하기");
    expect(document.querySelectorAll("[data-roadmap-step]")).toHaveLength(5);
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
