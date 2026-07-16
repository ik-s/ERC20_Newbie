export type FunctionKey = "total-supply" | "balance-of" | "transfer" | "approve" | "allowance" | "transfer-from";

export interface FunctionLesson {
  key: FunctionKey;
  name: string;
  signature: string;
  kind: "READ" | "WRITE";
  analogy: string;
  caller: string;
  inputs: string;
  returns: string;
  stateChange: string;
  event: string;
  summary: string;
}

export const FUNCTION_LESSONS: FunctionLesson[] = [
  { key: "total-supply", name: "totalSupply", signature: "totalSupply() → uint256", kind: "READ", analogy: "이 상품권은 전체적으로 몇 장이 발행되었나요?", caller: "누구나", inputs: "없음", returns: "전체 발행량", stateChange: "없음", event: "없음", summary: "토큰 전체 발행량을 조회합니다." },
  { key: "balance-of", name: "balanceOf", signature: "balanceOf(address account) → uint256", kind: "READ", analogy: "Alice의 계좌에는 LAB 토큰이 몇 개 있나요?", caller: "누구나", inputs: "조회할 주소", returns: "해당 주소의 잔액", stateChange: "없음", event: "없음", summary: "한 주소가 가진 토큰 수량을 조회합니다." },
  { key: "transfer", name: "transfer", signature: "transfer(address to, uint256 amount) → bool", kind: "WRITE", analogy: "Alice가 자신의 토큰을 Bob에게 직접 송금합니다.", caller: "토큰을 보내는 사람", inputs: "받는 주소, 수량", returns: "성공 여부", stateChange: "두 주소의 잔액", event: "Transfer", summary: "내 토큰을 내가 직접 보냅니다." },
  { key: "approve", name: "approve", signature: "approve(address spender, uint256 amount) → bool", kind: "WRITE", analogy: "Alice가 DEX에게 자신의 토큰을 최대 100개까지 사용할 권한을 줍니다.", caller: "토큰 소유자", inputs: "spender, 수량", returns: "성공 여부", stateChange: "allowance", event: "Approval", summary: "토큰을 보내지 않고 사용 권한만 기록합니다." },
  { key: "allowance", name: "allowance", signature: "allowance(address owner, address spender) → uint256", kind: "READ", analogy: "Alice가 DEX에게 사용하도록 허용한 토큰이 현재 몇 개인가요?", caller: "누구나", inputs: "owner, spender", returns: "승인 수량", stateChange: "없음", event: "없음", summary: "소유자와 spender 사이의 승인 수량을 조회합니다." },
  { key: "transfer-from", name: "transferFrom", signature: "transferFrom(address from, address to, uint256 amount) → bool", kind: "WRITE", analogy: "DEX가 Alice에게 허용받은 범위 안에서 Alice의 토큰을 Bob에게 보냅니다.", caller: "승인받은 spender", inputs: "소유자, 받는 주소, 수량", returns: "성공 여부", stateChange: "잔액과 allowance", event: "Transfer", summary: "승인받은 토큰을 대신 보냅니다." },
];

export const getLesson = (key: string): FunctionLesson =>
  FUNCTION_LESSONS.find((lesson) => lesson.key === key) ?? FUNCTION_LESSONS[0]!;
