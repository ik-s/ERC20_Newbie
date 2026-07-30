import { EDUCATIONAL_SOURCE } from "./educationalSource";

export type CodeLabTaskId = "metadata" | "balance" | "transfer" | "allowance" | "transfer-from";
export type CodeLabComparisonState = "match" | "customizable" | "missing";

export interface CodeLabComparisonItem {
  label: string;
  learnerValue: string;
  referenceValue: string;
  guidance: string;
  state: CodeLabComparisonState;
}

interface ComparisonRule {
  label: string;
  needle: string;
  referenceValue: string;
  guidance: string;
  customizable?: boolean;
  readValue?: (line: string) => string;
}

export interface CodeLabTask {
  id: CodeLabTaskId;
  title: string;
  objective: string;
  hints: readonly [string, string, string];
  anchors: readonly string[];
  comparison: readonly ComparisonRule[];
  requiredStatement?: string;
  starterReplacement?: string;
}

const quotedValue = (line: string) => line.match(/"([^"]+)"/)?.[1] ?? line.trim();

export const CODE_LAB_TASKS: readonly CodeLabTask[] = [
  {
    id: "metadata",
    title: "토큰 정보 수정",
    objective: "name과 symbol을 원하는 값으로 변경하세요.",
    hints: [
      "토큰 이름과 심볼은 지갑이나 거래소에 표시되는 기본 정보입니다.",
      "name과 symbol 선언문에 있는 큰따옴표 안의 문자열을 찾아보세요.",
      "string public name = \"...\"; 와 string public symbol = \"...\"; 형태를 유지하세요.",
    ],
    anchors: ["string public name", "string public symbol"],
    comparison: [
      { label: "토큰 이름", needle: "string public name", referenceValue: "Learning Token", guidance: "이름은 자유롭게 바꿀 수 있습니다. 문자열 문법만 유지하세요.", customizable: true, readValue: quotedValue },
      { label: "토큰 심볼", needle: "string public symbol", referenceValue: "LAB", guidance: "심볼도 자유롭게 바꿀 수 있습니다. 보통 짧은 대문자 기호를 사용합니다.", customizable: true, readValue: quotedValue },
    ],
  },
  {
    id: "balance",
    title: "balanceOf 완성",
    objective: "account 주소의 잔액을 반환하는 한 줄을 작성하세요.",
    hints: [
      "balanceOf는 특정 주소가 가진 토큰 수량을 조회하는 함수입니다.",
      "주소별 잔액은 balances 매핑에 저장되어 있고, 함수 매개변수는 account입니다.",
      "return balances[ ... ]; 형태로 작성해보세요.",
    ],
    anchors: ["function balanceOf(address account)"],
    requiredStatement: "return balances[account];",
    starterReplacement: "// TODO: account 주소의 잔액을 반환하세요.",
    comparison: [
      { label: "잔액 반환", needle: "return balances[account]", referenceValue: "return balances[account];", guidance: "account 주소를 key로 사용해 balances에서 잔액을 반환하세요." },
    ],
  },
  {
    id: "transfer",
    title: "transfer 완성",
    objective: "받는 사람의 잔액을 늘리는 한 줄을 작성하세요.",
    hints: [
      "transfer는 보내는 사람의 토큰을 받는 사람에게 옮기는 함수입니다.",
      "받는 사람 주소는 to이고, 옮길 수량은 amount입니다.",
      "balances[ ... ] += amount; 형태로 작성해보세요.",
    ],
    anchors: ["function transfer(address to, uint256 amount)"],
    requiredStatement: "balances[to] += amount;",
    starterReplacement: "// TODO: 받는 사람의 잔액을 늘리세요.",
    comparison: [
      { label: "받는 사람 잔액 증가", needle: "balances[to] += amount", referenceValue: "balances[to] += amount;", guidance: "to 주소의 balances 값에 amount를 더하세요." },
    ],
  },
  {
    id: "allowance",
    title: "approve 완성",
    objective: "spender의 승인 수량을 저장하는 한 줄을 작성하세요.",
    hints: [
      "approve는 토큰을 보내지 않고 다른 주소가 사용할 수 있는 한도를 기록합니다.",
      "승인 정보는 allowances 매핑에 소유자 주소와 spender 주소를 차례로 사용해 저장합니다.",
      "allowances[ ... ][spender] = amount; 형태로 작성해보세요.",
    ],
    anchors: ["function approve(address spender, uint256 amount)"],
    requiredStatement: "allowances[msg.sender][spender] = amount;",
    starterReplacement: "// TODO: spender의 승인 수량을 저장하세요.",
    comparison: [
      { label: "승인 수량 저장", needle: "allowances[msg.sender][spender] = amount", referenceValue: "allowances[msg.sender][spender] = amount;", guidance: "현재 호출자와 spender를 key로 사용해 amount를 저장하세요." },
    ],
  },
  {
    id: "transfer-from",
    title: "transferFrom 완성",
    objective: "사용한 대리 전송 한도를 차감하는 한 줄을 작성하세요.",
    hints: [
      "transferFrom은 승인받은 사람이 소유자를 대신해 토큰을 보내는 함수입니다.",
      "대리 전송에 사용한 한도는 allowances에 from 주소와 현재 호출자 주소를 사용해 찾습니다.",
      "allowances[from][ ... ] -= amount; 형태로 작성해보세요.",
    ],
    anchors: ["function transferFrom(address from, address to, uint256 amount)"],
    requiredStatement: "allowances[from][msg.sender] -= amount;",
    starterReplacement: "// TODO: 사용한 대리 전송 한도를 차감하세요.",
    comparison: [
      { label: "사용한 승인 한도 차감", needle: "allowances[from][msg.sender] -= amount", referenceValue: "allowances[from][msg.sender] -= amount;", guidance: "from의 allowance에서 현재 호출자가 쓴 amount를 빼세요." },
    ],
  },
];

function findLine(source: string, needle: string): string | undefined {
  return source.split("\n").find((line) => line.includes(needle))?.trim();
}

function getComparisonScope(task: CodeLabTask, source: string): string {
  const functionAnchor = task.anchors.find((anchor) => anchor.startsWith("function "));
  if (!functionAnchor) return source;
  const start = source.indexOf(functionAnchor);
  if (start === -1) return "";
  const end = source.indexOf("\n    }", start);
  return source.slice(start, end === -1 ? source.length : end + "\n    }".length);
}

export function getTaskStarterSource(task: CodeLabTask): string {
  if (!task.requiredStatement || !task.starterReplacement) return EDUCATIONAL_SOURCE;
  return EDUCATIONAL_SOURCE.replace(task.requiredStatement, task.starterReplacement);
}

export function getTaskComparison(task: CodeLabTask, source: string): CodeLabComparisonItem[] {
  const comparisonScope = getComparisonScope(task, source);
  return task.comparison.map((rule) => {
    const line = findLine(comparisonScope, rule.needle);
    if (!line) {
      return {
        label: rule.label,
        learnerValue: "없음",
        referenceValue: rule.referenceValue,
        guidance: "이 과제에 필요한 코드가 아직 없습니다. 힌트를 확인하고 TODO 위치를 채워보세요.",
        state: "missing",
      };
    }
    return {
      label: rule.label,
      learnerValue: rule.readValue?.(line) ?? line,
      referenceValue: rule.referenceValue,
      guidance: rule.guidance,
      state: rule.customizable ? "customizable" : line === rule.referenceValue ? "match" : "missing",
    };
  });
}

export function findTaskAnchorLines(task: CodeLabTask, source: string): number[] {
  const lines = source.split("\n");
  return task.anchors.flatMap((anchor) => {
    const index = lines.findIndex((line) => line.includes(anchor));
    return index === -1 ? [] : [index + 1];
  });
}

export function getReferenceSource(): string {
  return EDUCATIONAL_SOURCE;
}
