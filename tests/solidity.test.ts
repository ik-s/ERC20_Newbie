import { describe, expect, it } from "vitest";
import solc from "solc";
import { openzeppelinSources } from "../src/generated/openzeppelinSources";
import { createDefaultTokenDraft, generateTokenSource } from "../src/erc20/tokenGenerator";
import { EDUCATIONAL_SOURCE } from "../src/erc20/educationalSource";

function compile(source: string) {
  const input = {
    language: "Solidity",
    sources: { "Contract.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  };
  return JSON.parse(solc.compile(JSON.stringify(input), {
    import: (path: string) => openzeppelinSources[path]
      ? { contents: openzeppelinSources[path] }
      : { error: `blocked import: ${path}` },
  })) as { errors?: Array<{ severity: string; formattedMessage: string }>; contracts?: Record<string, unknown> };
}

describe("Solidity compilation", () => {
  it("compiles the educational ERC-20 source", () => {
    const output = compile(EDUCATIONAL_SOURCE);
    expect(output.errors?.filter((error) => error.severity === "error") ?? []).toEqual([]);
    expect(output.contracts?.["Contract.sol"]).toBeDefined();
  });

  it("compiles a generated token with every supported extension", () => {
    const draft = createDefaultTokenDraft();
    draft.burnable = true;
    draft.mintable = true;
    draft.capped = true;
    draft.maxSupply = "5000000";
    const output = compile(generateTokenSource(draft));
    expect(output.errors?.filter((error) => error.severity === "error") ?? []).toEqual([]);
    expect(output.contracts?.["Contract.sol"]).toBeDefined();
  });

  it("blocks arbitrary remote imports", () => {
    const output = compile('pragma solidity ^0.8.20; import "https://evil.example/Token.sol";');
    expect(output.errors?.some((error) => error.formattedMessage.includes("blocked import"))).toBe(true);
  });
});
