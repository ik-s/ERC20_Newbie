# Code Lab Guided Comparison Design

## Goal

Make the five Code Lab exercises understandable to Web3 beginners by keeping the complete ERC-20 example visible while focusing attention and answer comparison on the selected exercise.

## Problem

The current comparison performs a line-by-line diff against the complete educational source. When a learner adds or removes a line, every later line is reported as different. The resulting message is noisy and does not explain the expected ERC-20 implementation.

The task buttons currently change only a short hint. Beginners therefore have to search the complete contract themselves, even when a task is about one field or function.

## Chosen approach

Use a task-centric model rather than a whole-file diff.

- Preserve one complete, compilable ERC-20 educational source for all five tasks.
- Associate every task with a small set of source anchors and expected snippets.
- On task selection, scroll the editor to the first source anchor and visually mark the task's relevant lines.
- The comparison result displays one compact card per expected snippet: its learning label, the learner's current snippet or value, the reference snippet or value, and a concise match state.
- Do not show global difference counts or raw line-by-line diff lists.

## Task mapping

| Task | Source focus | Reference concepts |
| --- | --- | --- |
| 1. 토큰 정보 수정 | `name`, `symbol`, constructor `initialSupply` | name, symbol, initial supply |
| 2. balanceOf 이해 | `balances`, `balanceOf` | address-to-balance mapping, value lookup |
| 3. transfer 이해 | `transfer` | balance validation, sender decrease, recipient increase, `Transfer` event |
| 4. approve와 allowance | `approve`, `allowance`, `allowances` | owner/spender allowance storage and lookup |
| 5. transferFrom 이해 | `transferFrom` | allowance check, balance check, allowance decrease, transfer event |

## Comparison presentation

The hint area becomes a persistent guided-comparison panel when the learner presses `정답과 비교`.

Each relevant item uses this format:

```text
토큰 이름
내 코드: training token
기준 답안: Learning Token
→ 이름은 자유롭게 바꿔도 됩니다. 문자열 문법만 유지하세요.
```

For function behavior, the panel shows the expected line instead of a broad source diff:

```text
잔액 확인
내 코드: 없음
기준 답안: require(balances[msg.sender] >= amount, "Insufficient balance");
→ 전송 전에는 보내는 사람의 잔액을 먼저 확인해야 합니다.
```

An exact match reads `정답과 같습니다.` Modified but valid learner choices such as name and symbol do not read as an error; they read `자유롭게 바꿀 수 있는 값입니다.`

## Error handling and reset

- The `코드 초기화` action restores the full `EDUCATIONAL_SOURCE`.
- A source missing a task anchor shows `이 과제의 기본 코드가 보이지 않습니다. 코드 초기화로 전체 예제를 불러오세요.`
- Syntax validation remains the responsibility of the existing compile action.

## Testing

- Unit-test task definitions and source anchor extraction.
- Unit-test comparison cards for matching source, customized token metadata, missing required transfer validation, and absent task anchors.
- Retain the existing Solidity compilation and app rendering tests.
