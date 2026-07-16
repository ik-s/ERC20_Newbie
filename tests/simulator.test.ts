import { describe, expect, it } from "vitest";
import { ACCOUNTS, TokenSimulator } from "../src/erc20/simulator";

describe("TokenSimulator", () => {
  it("transfers tokens and records a Transfer event", () => {
    const token = new TokenSimulator();
    const result = token.transfer(ACCOUNTS.alice, ACCOUNTS.bob, 30n);

    expect(result.ok).toBe(true);
    expect(token.balanceOf(ACCOUNTS.alice)).toBe(970n);
    expect(token.balanceOf(ACCOUNTS.bob)).toBe(130n);
    expect(token.events.at(-1)).toMatchObject({
      name: "Transfer",
      from: ACCOUNTS.alice,
      to: ACCOUNTS.bob,
      value: 30n,
    });
  });

  it("keeps state unchanged when a transfer exceeds the balance", () => {
    const token = new TokenSimulator();
    const before = token.snapshot();
    const result = token.transfer(ACCOUNTS.bob, ACCOUNTS.alice, 101n);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("잔액");
    expect(token.snapshot()).toEqual(before);
  });

  it("approves without moving tokens and exposes allowance", () => {
    const token = new TokenSimulator();
    const beforeBalance = token.balanceOf(ACCOUNTS.alice);

    expect(token.approve(ACCOUNTS.alice, ACCOUNTS.dex, 100n).ok).toBe(true);
    expect(token.allowance(ACCOUNTS.alice, ACCOUNTS.dex)).toBe(100n);
    expect(token.balanceOf(ACCOUNTS.alice)).toBe(beforeBalance);
    expect(token.events.at(-1)?.name).toBe("Approval");
  });

  it("transferFrom spends allowance and records a Transfer event", () => {
    const token = new TokenSimulator();
    token.approve(ACCOUNTS.alice, ACCOUNTS.dex, 100n);

    const result = token.transferFrom(
      ACCOUNTS.dex,
      ACCOUNTS.alice,
      ACCOUNTS.bob,
      40n,
    );

    expect(result.ok).toBe(true);
    expect(token.allowance(ACCOUNTS.alice, ACCOUNTS.dex)).toBe(60n);
    expect(token.balanceOf(ACCOUNTS.alice)).toBe(960n);
    expect(token.balanceOf(ACCOUNTS.bob)).toBe(140n);
    expect(token.events.at(-1)?.name).toBe("Transfer");
  });

  it("keeps balances and allowance unchanged when transferFrom fails", () => {
    const token = new TokenSimulator();
    token.approve(ACCOUNTS.alice, ACCOUNTS.dex, 10n);
    const before = token.snapshot();

    const result = token.transferFrom(
      ACCOUNTS.dex,
      ACCOUNTS.alice,
      ACCOUNTS.bob,
      11n,
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain("허용");
    expect(token.snapshot()).toEqual(before);
  });

  it("resets supply, balances, allowances, and events", () => {
    const token = new TokenSimulator();
    token.approve(ACCOUNTS.alice, ACCOUNTS.dex, 10n);
    token.transfer(ACCOUNTS.alice, ACCOUNTS.bob, 50n);

    token.reset();

    expect(token.totalSupply()).toBe(1100n);
    expect(token.balanceOf(ACCOUNTS.alice)).toBe(1000n);
    expect(token.balanceOf(ACCOUNTS.bob)).toBe(100n);
    expect(token.allowance(ACCOUNTS.alice, ACCOUNTS.dex)).toBe(0n);
    expect(token.events).toEqual([]);
  });
});
