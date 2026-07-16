import { beforeEach, describe, expect, it } from "vitest";
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

    expect(document.querySelector("h1")?.textContent).toContain("ERC-20을 읽지만 말고");
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
