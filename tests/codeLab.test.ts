import { describe, expect, it } from "vitest";
import { CODE_LAB_TASKS, findTaskAnchorLines, getTaskComparison, getTaskStarterSource } from "../src/erc20/codeLabTasks";
import { EDUCATIONAL_SOURCE } from "../src/erc20/educationalSource";

describe("guided code lab answers", () => {
  it("defines concrete editing missions with safe progressive hints", () => {
    expect(CODE_LAB_TASKS.map((task) => task.title)).toEqual([
      "토큰 정보 수정",
      "balanceOf 완성",
      "transfer 완성",
      "approve 완성",
      "transferFrom 완성",
    ]);
    expect(CODE_LAB_TASKS.map((task) => task.objective)).toEqual([
      "name과 symbol을 원하는 값으로 변경하세요.",
      "account 주소의 잔액을 반환하는 한 줄을 작성하세요.",
      "받는 사람의 잔액을 늘리는 한 줄을 작성하세요.",
      "spender의 승인 수량을 저장하는 한 줄을 작성하세요.",
      "사용한 대리 전송 한도를 차감하는 한 줄을 작성하세요.",
    ]);

    const requiredAnswers = [
      "return balances[account];",
      "balances[to] += amount;",
      "allowances[msg.sender][spender] = amount;",
      "allowances[from][msg.sender] -= amount;",
    ];
    CODE_LAB_TASKS.forEach((task) => {
      expect(task.hints).toHaveLength(3);
      task.hints.forEach((hint) => requiredAnswers.forEach((answer) => expect(hint).not.toContain(answer)));
    });

    const balanceStarter = getTaskStarterSource(CODE_LAB_TASKS[1]!);
    expect(balanceStarter).toContain("// TODO: account 주소의 잔액을 반환하세요.");
    expect(balanceStarter).not.toContain("return balances[account];");
    expect(CODE_LAB_TASKS[1]!.hints[2]).toBe("return balances[ ... ]; 형태로 작성해보세요.");
    expect(getTaskStarterSource(CODE_LAB_TASKS[2]!)).toContain("// TODO: 받는 사람의 잔액을 늘리세요.");
    expect(getTaskStarterSource(CODE_LAB_TASKS[3]!)).toContain("// TODO: spender의 승인 수량을 저장하세요.");
    expect(getTaskStarterSource(CODE_LAB_TASKS[4]!)).toContain("// TODO: 사용한 대리 전송 한도를 차감하세요.");
  });

  it("accepts custom metadata while requiring the transfer recipient update", () => {
    const customized = EDUCATIONAL_SOURCE
      .replace('"Learning Token"', '"training token"')
      .replace('"LAB"', '"TRN"');
    expect(getTaskComparison(CODE_LAB_TASKS[0]!, customized).map((item) => item.state))
      .toEqual(["customizable", "customizable"]);

    const missingUpdate = EDUCATIONAL_SOURCE.replace("        balances[to] += amount;\n", "");
    expect(getTaskComparison(CODE_LAB_TASKS[2]!, missingUpdate)
      .find((item) => item.label === "받는 사람 잔액 증가")?.state).toBe("missing");
  });

  it("finds the transfer function", () => {
    expect(findTaskAnchorLines(CODE_LAB_TASKS[2]!, EDUCATIONAL_SOURCE)).toEqual([30]);
  });

  it("guides learners to complete the TODO when task code is absent", () => {
    const source = 'contract Token { string public name = "T"; }';
    const result = getTaskComparison(CODE_LAB_TASKS[2]!, source);
    expect(result.some((item) => item.state === "missing")).toBe(true);
    expect(result.some((item) => item.guidance.includes("TODO 위치"))).toBe(true);
  });
});
