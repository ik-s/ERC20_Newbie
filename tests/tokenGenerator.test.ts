import { describe, expect, it } from "vitest";
import {
  createDefaultTokenDraft,
  generateTokenSource,
  validateTokenDraft,
} from "../src/erc20/tokenGenerator";

describe("token generator", () => {
  it("generates a fixed supply OpenZeppelin token", () => {
    const source = generateTokenSource(createDefaultTokenDraft());
    expect(source).toContain('import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";');
    expect(source).toContain('ERC20("My Learning Token", "MLT")');
    expect(source).toContain("_mint(recipient, initialSupply * 10 ** decimals());");
    expect(source).not.toContain("ERC20Burnable");
    expect(source).not.toContain("Ownable");
  });

  it("adds only selected extensions", () => {
    const draft = createDefaultTokenDraft();
    draft.burnable = true;
    draft.mintable = true;
    draft.capped = true;
    draft.maxSupply = "5000000";
    const source = generateTokenSource(draft);

    expect(source).toContain("ERC20Burnable");
    expect(source).toContain("ERC20Capped");
    expect(source).toContain("Ownable");
    expect(source).toContain("function mint(address to, uint256 amount)");
    expect(source).toContain("override(ERC20, ERC20Capped)");
  });

  it("rejects invalid symbols and a cap below initial supply", () => {
    const draft = createDefaultTokenDraft();
    draft.symbol = "too-long-symbol";
    draft.capped = true;
    draft.initialSupply = "1000";
    draft.maxSupply = "999";

    const errors = validateTokenDraft(draft);
    expect(errors.some((error) => error.field === "symbol")).toBe(true);
    expect(errors.some((error) => error.field === "maxSupply")).toBe(true);
  });
});
