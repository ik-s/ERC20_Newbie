# Guided Code Lab Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each Code Lab task focus on relevant ERC-20 code and explain the reference answer without noisy whole-file diffs.

**Architecture:** Replace generic source diffing with five task definitions containing source anchors, expected code snippets, and learning copy. The page retains one complete Solidity source, derives compact answer cards from the active task, and uses CodeMirror decorations to focus the relevant lines.

**Tech Stack:** TypeScript, CodeMirror 6, Vitest, Vite, existing DOM utilities.

## Global Constraints

- Keep `EDUCATIONAL_SOURCE` as one complete, compilable ERC-20 example.
- Treat custom `name`, `symbol`, and initial supply as valid choices, not errors.
- Never show a global difference count or raw line-by-line diff.
- If task anchors are missing, explain that `코드 초기화` restores the example.

---

### Task 1: Create the task-centric comparison model

**Files:**
- Create: `src/erc20/codeLabTasks.ts`
- Modify: `src/erc20/educationalSource.ts`
- Modify: `tests/codeLab.test.ts`

**Interfaces:**
- Produces `CODE_LAB_TASKS`, `getTaskComparison(task, source)`, and `findTaskAnchorLines(task, source)`.
- `getTaskComparison` returns `CodeLabComparisonItem[]`, where every item has `label`, `learnerValue`, `referenceValue`, `guidance`, and `state: "match" | "customizable" | "missing"`.

- [ ] **Step 1: Write a failing task-model test**

```ts
import { CODE_LAB_TASKS, getTaskComparison } from "../src/erc20/codeLabTasks";
import { EDUCATIONAL_SOURCE } from "../src/erc20/educationalSource";

it("accepts custom metadata while requiring the transfer balance check", () => {
  const customized = EDUCATIONAL_SOURCE
    .replace('"Learning Token"', '"training token"')
    .replace('"LAB"', '"TRN"');
  expect(getTaskComparison(CODE_LAB_TASKS[0]!, customized).map((item) => item.state))
    .toEqual(["customizable", "customizable", "match"]);

  const missingCheck = EDUCATIONAL_SOURCE.replace('        require(balances[msg.sender] >= amount, "Insufficient balance");\n', "");
  expect(getTaskComparison(CODE_LAB_TASKS[2]!, missingCheck)
    .find((item) => item.label === "잔액 확인")?.state).toBe("missing");
});
```

- [ ] **Step 2: Verify the test fails**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/codeLab.test.ts`

Expected: FAIL because `src/erc20/codeLabTasks.ts` does not exist.

- [ ] **Step 3: Implement exact source anchors and comparison rules**

```ts
export interface CodeLabTask {
  id: "metadata" | "balance" | "transfer" | "allowance" | "transfer-from";
  title: string;
  hint: string;
  anchors: readonly string[];
  comparison: readonly ComparisonRule[];
}
```

Define rules for: metadata (`name`, `symbol`, constructor supply), `balances`/`balanceOf`, the four `transfer` operations, `approve`/`allowance`, and `transferFrom` checks and updates. Extract only the intended matching source line or declared literal.

- [ ] **Step 4: Verify the focused test passes**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/codeLab.test.ts`

Expected: PASS with metadata marked customizable and a removed transfer validation marked missing.

- [ ] **Step 5: Commit the task model**

```bash
git add src/erc20/codeLabTasks.ts src/erc20/educationalSource.ts tests/codeLab.test.ts
git commit -m "feat: add guided code lab task model"
```

### Task 2: Replace the global diff with answer cards

**Files:**
- Modify: `src/pages/codeLabPage.ts`
- Modify: `src/styles/pages.css`
- Modify: `tests/app.test.ts`

**Interfaces:**
- Consumes `CODE_LAB_TASKS` and `getTaskComparison` from Task 1.
- Produces `renderComparisonCards(task, source): HTMLElement` and `data-state` values for visual styling.

- [ ] **Step 1: Write a failing page test**

```ts
it("shows task-specific reference answers instead of a global difference count", () => {
  const task = CODE_LAB_TASKS[0]!;
  const cards = getTaskComparison(task, EDUCATIONAL_SOURCE);
  expect(cards[0]?.referenceValue).toContain("Learning Token");
  expect(cards.some((item) => item.guidance.includes("이 과제의 기본 코드"))).toBe(false);
});
```

- [ ] **Step 2: Verify the test fails before page integration**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/app.test.ts tests/codeLab.test.ts`

Expected: FAIL until comparison data and page rendering exist.

- [ ] **Step 3: Implement active-task comparison rendering**

```ts
const comparisonPanel = el("div", { className: "guided-comparison", attrs: { "aria-live": "polite" } });
let activeTask = CODE_LAB_TASKS[0]!;

function renderComparisonCards(source: string) {
  comparisonPanel.replaceChildren(
    el("h3", { text: `${activeTask.title} 기준 답안` }),
    ...getTaskComparison(activeTask, source).map(renderComparisonCard),
  );
}
```

Task buttons update `activeTask` and the hint. `정답과 비교` replaces the old generic message with only the active task's cards. Each card shows `내 코드`, `기준 답안`, and one sentence of learning guidance. Missing anchors use the exact reset instruction from the design spec.

- [ ] **Step 4: Style compact comparison cards**

```css
.guided-comparison { display: grid; gap: 12px; }
.comparison-card { padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: white; }
.comparison-card[data-state="match"] { border-color: #a6e5c7; }
.comparison-card[data-state="missing"] { border-color: #f0c5c9; background: #fff7f7; }
.comparison-value { margin: 6px 0; font: .76rem/1.5 var(--font-mono); overflow-wrap: anywhere; }
```

- [ ] **Step 5: Verify tests pass and commit**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/app.test.ts tests/codeLab.test.ts`

Expected: PASS, and page text no longer contains `곳이 다릅니다`.

```bash
git add src/pages/codeLabPage.ts src/styles/pages.css tests/app.test.ts tests/codeLab.test.ts
git commit -m "feat: show guided code lab answers"
```

### Task 3: Focus the editor on the active exercise

**Files:**
- Modify: `src/pages/codeLabPage.ts`
- Modify: `src/styles/pages.css`
- Modify: `tests/codeLab.test.ts`

**Interfaces:**
- Consumes `findTaskAnchorLines(task, source)` from Task 1.
- Produces `focusTaskInEditor(view, task)` and a CodeMirror `StateField` for `task-focus-line` decorations.

- [ ] **Step 1: Write a failing anchor test**

```ts
it("finds the transfer function and its balance check", () => {
  expect(findTaskAnchorLines(CODE_LAB_TASKS[2]!, EDUCATIONAL_SOURCE)).toEqual([25, 26]);
});
```

- [ ] **Step 2: Verify the test fails before implementation**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/codeLab.test.ts`

Expected: FAIL until the task anchor lookup is implemented.

- [ ] **Step 3: Implement CodeMirror focus behavior**

```ts
function focusTaskInEditor(view: EditorView, task: CodeLabTask) {
  const lines = findTaskAnchorLines(task, view.state.doc.toString());
  if (lines.length === 0) return;
  view.dispatch({
    effects: setTaskFocus.of(lines),
    selection: { anchor: view.state.doc.line(lines[0]!).from },
    scrollIntoView: true,
  });
}
```

Call it whenever a task button is pressed. Convert selected lines into a `task-focus-line` decoration with a StateField. If the anchor is absent, do not move the cursor; show reset guidance instead.

- [ ] **Step 4: Style focus and verify behavior**

```css
.editor-host .task-focus-line { background: rgba(0, 82, 255, .22); }
```

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/codeLab.test.ts`

Expected: PASS with transfer anchors resolving to stable lines in the complete source.

- [ ] **Step 5: Commit editor guidance**

```bash
git add src/erc20/codeLabTasks.ts src/pages/codeLabPage.ts src/styles/pages.css tests/codeLab.test.ts
git commit -m "feat: focus code lab tasks in editor"
```

### Task 4: Verify the complete learner path

**Files:**
- Modify: `tests/app.test.ts` only if stable comparison-card selectors are needed.

**Interfaces:**
- Consumes all prior task-model, comparison-card, and editor-focus interfaces.
- Produces no runtime interface.

- [ ] **Step 1: Add a missing-source regression test**

```ts
it("guides learners to reset when task code is absent", () => {
  const source = 'contract Token { string public name = "T"; }';
  const result = getTaskComparison(CODE_LAB_TASKS[2]!, source);
  expect(result.some((item) => item.state === "missing")).toBe(true);
  expect(result.some((item) => item.guidance.includes("코드 초기화"))).toBe(true);
});
```

- [ ] **Step 2: Verify the test fails, then add reset guidance**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm vitest run tests/codeLab.test.ts`

Expected: FAIL until missing comparison items include the exact reset guidance.

- [ ] **Step 3: Run full automated and browser verification**

Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test && pnpm run typecheck && pnpm run build && git diff --check`

Expected: all tests pass, TypeScript exits 0, build succeeds, and no whitespace errors are reported.

Manually verify the local preview:

1. `코드 초기화` restores all five ERC-20 functions.
2. Task 1 focuses metadata declarations; task 3 focuses `transfer` and balance validation.
3. `정답과 비교` shows compact cards without global difference counts.
4. Custom token name and symbol are stated as valid custom choices.

- [ ] **Step 4: Commit verification changes**

```bash
git add tests/app.test.ts tests/codeLab.test.ts src/erc20/codeLabTasks.ts src/pages/codeLabPage.ts src/styles/pages.css
git commit -m "test: cover guided code lab workflow"
```
