import { describe, expect, it } from "vitest";
import { formatTokenAmount, parseTokenAmount, shortenAddress } from "../src/utils/format";

describe("format utilities", () => {
  it("converts display units with viem-compatible decimal precision", () => {
    expect(parseTokenAmount("1.25", 18)).toBe(1_250_000_000_000_000_000n);
    expect(formatTokenAmount(1_250_000_000_000_000_000n, 18)).toBe("1.25");
  });

  it("rejects invalid or negative token amounts", () => {
    expect(() => parseTokenAmount("-1", 18)).toThrow("0 이상");
    expect(() => parseTokenAmount("hello", 18)).toThrow("숫자");
  });

  it("shortens addresses while keeping both ends", () => {
    expect(shortenAddress("0x1111111111111111111111111111111111111111")).toBe("0x1111…1111");
  });
});
