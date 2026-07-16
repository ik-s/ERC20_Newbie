/// <reference lib="webworker" />
import solc from "solc";
import { openzeppelinSources } from "../generated/openzeppelinSources";

interface SolcError {
  severity: "error" | "warning";
  message: string;
  formattedMessage: string;
  sourceLocation?: { start: number; end: number; file: string };
}

interface SolcOutput {
  errors?: SolcError[];
  contracts?: Record<string, Record<string, { abi: readonly unknown[]; evm: { bytecode: { object: string } } }>>;
}

const friendly = (message: string) => {
  if (message.includes("Undeclared identifier")) return "변수나 함수 이름의 철자를 확인하세요.";
  if (message.includes("Expected")) return "괄호, 쉼표 또는 세미콜론이 빠졌는지 확인하세요.";
  return "오류가 표시된 줄 주변의 문법과 타입을 확인하세요.";
};

self.addEventListener("message", (event: MessageEvent<{ source: string }>) => {
  const source = event.data.source;
  const input = {
    language: "Solidity",
    sources: { "Contract.sol": { content: source } },
    settings: { optimizer: { enabled: false }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  };
  const findImports = (path: string) => openzeppelinSources[path]
    ? { contents: openzeppelinSources[path] }
    : { error: `허용되지 않거나 찾을 수 없는 import: ${path}` };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports })) as SolcOutput;
  const lineStarts = [0];
  for (let i = 0; i < source.length; i += 1) if (source[i] === "\n") lineStarts.push(i + 1);
  const position = (offset?: number) => {
    if (offset === undefined) return {};
    let lineIndex = 0;
    for (let index = 0; index < lineStarts.length; index += 1) {
      if ((lineStarts[index] ?? 0) <= offset) lineIndex = index;
      else break;
    }
    return { line: lineIndex + 1, column: offset - (lineStarts[lineIndex] ?? 0) + 1 };
  };
  const diagnostics = (output.errors ?? []).map((error) => ({
    severity: error.severity,
    message: error.message,
    formattedMessage: error.formattedMessage,
    ...position(error.sourceLocation?.start),
    friendlyMessage: friendly(error.message),
  }));
  const contracts = Object.values(output.contracts ?? {}).flatMap((file) =>
    Object.entries(file).map(([name, contract]) => ({ name, abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` as `0x${string}` })),
  );
  self.postMessage({ ok: !diagnostics.some((item) => item.severity === "error"), compilerVersion: solc.version(), contracts, diagnostics });
});
