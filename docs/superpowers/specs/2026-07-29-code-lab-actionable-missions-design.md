# Code Lab Actionable Missions Design

## Goal

Convert Code Lab tasks 2–5 from passive code-reading topics into small, concrete editing missions with progressive hints and an unambiguous success condition.

## Learning flow

Each task owns an independent starter draft derived from the complete ERC-20 educational source. Switching tasks saves the current draft and loads the selected task's own draft, so one task never erases another task's work.

Every mission presents:

1. A one-sentence action objective.
2. A source with exactly one target statement replaced by a `TODO` comment.
3. A `힌트 보기` button that reveals three hints in sequence.
4. `컴파일` as the syntax check.
5. `정답과 비교` as the final explanation and reference answer.

## Mission definitions

| Task | Title | Learner action | Required answer |
| --- | --- | --- | --- |
| 1 | 토큰 정보 수정 | name과 symbol을 원하는 값으로 변경한다. | Any valid string literals are accepted. |
| 2 | balanceOf 완성 | account 주소의 잔액을 반환하는 한 줄을 작성한다. | `return balances[account];` |
| 3 | transfer 완성 | 받는 사람 잔액을 늘리는 한 줄을 작성한다. | `balances[to] += amount;` |
| 4 | approve 완성 | spender의 승인 수량을 저장하는 한 줄을 작성한다. | `allowances[msg.sender][spender] = amount;` |
| 5 | transferFrom 완성 | 사용한 대리 전송 한도를 차감하는 한 줄을 작성한다. | `allowances[from][msg.sender] -= amount;` |

The starter source replaces only the required answer with a comment. For example, task 2 uses:

```solidity
function balanceOf(address account) external view returns (uint256) {
    // TODO: account 주소의 잔액을 반환하세요.
}
```

## Progressive hints

The hint button labels progress explicitly: `힌트 1/3 보기`, `힌트 2/3 보기`, `힌트 3/3 보기`.

- Hint 1 explains the function's role in ordinary language.
- Hint 2 identifies the variables or mapping to use.
- Hint 3 gives the required code shape but replaces the final expression with a blank or ellipsis.

For task 2:

1. “balanceOf는 특정 주소가 가진 토큰 수량을 조회하는 함수입니다.”
2. “주소별 잔액은 balances 매핑에 저장되어 있고, 함수 매개변수는 account입니다.”
3. “return balances[ ... ]; 형태로 작성해보세요.”

Hints never reveal the exact answer verbatim. Exact code remains available only through the comparison action.

## State and reset rules

- Store drafts by task id in persisted app state, rather than using one shared `editedSource` value.
- Selecting a task saves the previous task's current editor content and restores the target task's draft.
- `코드 초기화` resets only the active task to its starter source with the `TODO` comment.
- A completed task remains editable; the app does not lock the learner out after a correct answer.
- If a learner deletes surrounding code, comparison cards report the missing required statement and show the reference answer.

## Testing

- Unit-test starter-source generation for all tasks.
- Unit-test every task's expected answer and each three-step hint sequence.
- Add page tests verifying task switching preserves independent drafts, the hint button advances from 1 to 3, and reset restores the active task's TODO starter source.
- Retain compiler, application, and guided-comparison tests.
