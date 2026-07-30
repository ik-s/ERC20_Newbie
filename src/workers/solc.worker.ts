/// <reference lib="webworker" />

interface SolcModule {
  cwrap(name: string, returnType: string | null, argumentTypes: string[]): (...args: unknown[]) => unknown;
  addFunction(callback: (...args: number[]) => void, signature: string): number;
  removeFunction(pointer: number): void;
  UTF8ToString(pointer: number): string;
  lengthBytesUTF8(value: string): number;
  stringToUTF8(value: string, pointer: number, length: number): void;
  setValue(pointer: number, value: number, type: string): void;
  _malloc(length: number): number;
}

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

interface WorkerRequest {
  source: string;
  imports: Record<string, string>;
  soljsonUrl: string;
}

let solc: SolcModule | undefined;

const friendly = (message: string) => {
  if (message.includes("Undeclared identifier")) return "변수나 함수 이름의 철자를 확인하세요.";
  if (message.includes("Expected")) return "괄호, 쉼표 또는 세미콜론이 빠졌는지 확인하세요.";
  return "오류가 표시된 줄 주변의 문법과 타입을 확인하세요.";
};

function loadSolc(soljsonUrl: string): SolcModule {
  if (solc) return solc;
  importScripts(soljsonUrl);
  const module = (self as typeof self & { Module?: SolcModule }).Module;
  if (!module) throw new Error("Solidity 컴파일러를 불러오지 못했습니다.");
  solc = module;
  return module;
}

function compile(module: SolcModule, input: string, imports: Record<string, string>): string {
  const compileStandard = module.cwrap("solidity_compile", "string", ["string", "number", "number"]);
  const allocate = module.cwrap("solidity_alloc", "number", ["number"]);
  const callback = (context: number, kind: number, path: number, contents: number, error: number) => {
    if (context !== 0 || module.UTF8ToString(kind) !== "source") return;
    const result = imports[module.UTF8ToString(path)]
      ? { contents: imports[module.UTF8ToString(path)]! }
      : { error: `허용되지 않거나 찾을 수 없는 import: ${module.UTF8ToString(path)}` };
    const write = (value: string, pointer: number) => {
      const length = module.lengthBytesUTF8(value) + 1;
      const address = Number(allocate(length) || module._malloc(length));
      module.stringToUTF8(value, address, length);
      module.setValue(pointer, address, "*");
    };
    if ("contents" in result) write(result.contents, contents);
    else write(result.error, error);
  };
  const callbackPointer = module.addFunction(callback, "viiii");
  try {
    return String(compileStandard(input, callbackPointer, 0));
  } finally {
    module.removeFunction(callbackPointer);
  }
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { source, imports, soljsonUrl } = event.data;
  const module = loadSolc(soljsonUrl);
  const input = {
    language: "Solidity",
    sources: { "Contract.sol": { content: source } },
    settings: { optimizer: { enabled: false }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  };
  const output = JSON.parse(compile(module, JSON.stringify(input), imports)) as SolcOutput;
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
  self.postMessage({ ok: !diagnostics.some((item) => item.severity === "error"), compilerVersion: "solc", contracts, diagnostics });
});
