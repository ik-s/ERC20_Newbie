import { COMPILER_TIMEOUT_MS, MAX_SOLIDITY_SOURCE_LENGTH } from "../config";

export interface CompilerDiagnostic {
  severity: "error" | "warning";
  message: string;
  formattedMessage: string;
  line?: number;
  column?: number;
  friendlyMessage: string;
}

export interface CompiledContract {
  name: string;
  abi: readonly unknown[];
  bytecode: `0x${string}`;
}

export interface CompilerResult {
  ok: boolean;
  compilerVersion: string;
  contracts: CompiledContract[];
  diagnostics: CompilerDiagnostic[];
}

export function friendlyCompilerMessage(message: string): string {
  if (message.includes("Undeclared identifier")) return "이름을 선언하기 전에 사용했습니다. 변수나 함수 이름의 철자를 확인하세요.";
  if (message.includes("Expected")) return "Solidity 문법 기호가 빠졌습니다. 표시된 줄 주변의 괄호와 세미콜론을 확인하세요.";
  if (message.includes("TypeError")) return "값의 타입이 맞지 않습니다. address, uint256, bool 중 필요한 타입을 확인하세요.";
  return "표시된 줄 주변의 Solidity 문법과 타입을 확인하세요.";
}

export function compileSolidity(source: string, signal?: AbortSignal): Promise<CompilerResult> {
  if (source.length > MAX_SOLIDITY_SOURCE_LENGTH) {
    return Promise.reject(new Error(`소스 코드는 ${MAX_SOLIDITY_SOURCE_LENGTH.toLocaleString()}자 이하여야 합니다.`));
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/solc.worker.ts", import.meta.url), { type: "module" });
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("컴파일 시간이 초과되었습니다. 코드를 줄이거나 다시 시도하세요."));
    }, COMPILER_TIMEOUT_MS);
    const cleanup = () => window.clearTimeout(timer);
    const abort = () => {
      worker.terminate();
      cleanup();
      reject(new DOMException("컴파일이 취소되었습니다.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    worker.addEventListener("message", (event: MessageEvent<CompilerResult>) => {
      cleanup();
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      resolve(event.data);
    });
    worker.addEventListener("error", (event) => {
      cleanup();
      worker.terminate();
      reject(new Error(event.message || "컴파일러를 시작하지 못했습니다."));
    });
    worker.postMessage({ source });
  });
}
