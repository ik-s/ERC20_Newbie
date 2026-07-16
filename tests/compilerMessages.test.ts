import { describe, expect, it } from "vitest";
import { friendlyCompilerMessage } from "../src/erc20/compiler";

describe("compiler error explanations", () => {
  it("explains missing identifiers in beginner-friendly Korean", () => {
    expect(friendlyCompilerMessage("Undeclared identifier x")).toContain("철자");
  });

  it("explains syntax expectations without hiding the original diagnostic", () => {
    expect(friendlyCompilerMessage("Expected ';'")).toContain("세미콜론");
  });
});
