# Actionable Code Lab Missions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Code Lab item a concrete one-line Solidity editing mission with isolated drafts, progressive hints, and clear answer feedback.

**Architecture:** Extend the Code Lab task model so each task owns its objective, three non-answer-revealing hints, required statement, and starter source. Store source drafts by task ID in persisted application state, migrating the prior single source value safely. The page will switch editor documents per task, persist the active document, reveal hints sequentially, reset only the selected mission, and continue to use task-specific comparison cards for reference answers.

**Tech Stack:** TypeScript, Vite, CodeMirror 6, Vitest, browser localStorage.

## Global Constraints

- Work on the existing `main` branch; do not create a feature branch or worktree.
- Keep all five missions based on the existing `EDUCATIONAL_SOURCE` educational Solidity contract.
- Tasks 2–5 must replace exactly one required Solidity statement with a Korean `TODO` comment in their starter source.
- Hints are shown in the order `힌트 1/3 보기` through `힌트 3/3 보기` and must never print the exact answer verbatim.
- `정답과 비교` remains the only UI that displays the exact reference statement.
- Selecting a task preserves its existing draft; `코드 초기화` only restores the selected task's starter source.
- Preserve existing compiler-worker behavior and the current metadata comparison rule that accepts any valid name/symbol string.

---

### Task 1: Define mission data and generated starter sources

**Files:**
- Modify: `src/erc20/codeLabTasks.ts`
- Modify: `tests/codeLab.test.ts`

**Interfaces:**
- Consumes: `EDUCATIONAL_SOURCE` from `src/erc20/educationalSource.ts`.
- Produces: `CodeLabTaskId`, `CodeLabTask`, `CODE_LAB_TASKS`, `getTaskStarterSource(task)`, `getTaskComparison(task, source)`, and `findTaskAnchorLines(task, source)`.
- `CodeLabTask` exposes `id: CodeLabTaskId`, `title: string`, `objective: string`, `hints: readonly [string, string, string]`, `requiredStatement?: string`, `starterReplacement?: string`, `anchors`, and `comparison`.

- [ ] **Step 1: Write failing mission-data tests**

  In `tests/codeLab.test.ts`, add expectations for all five concrete titles and objectives, the four exact required statements, generated TODO starters, and three hints per task:

  ```ts
  expect(CODE_LAB_TASKS.map((task) => task.title)).toEqual([
    "토큰 정보 수정",
    "balanceOf 완성",
    "transfer 완성",
    "approve 완성",
    "transferFrom 완성",
  ]);
  expect(getTaskStarterSource(CODE_LAB_TASKS[1]!)).toContain(
    "// TODO: account 주소의 잔액을 반환하세요.",
  );
  expect(getTaskStarterSource(CODE_LAB_TASKS[1]!)).not.toContain(
    "return balances[account];",
  );
  expect(CODE_LAB_TASKS[1]!.hints).toHaveLength(3);
  expect(CODE_LAB_TASKS[1]!.hints[2]).toBe(
    "return balances[ ... ]; 형태로 작성해보세요.",
  );
  ```

- [ ] **Step 2: Run the focused tests to verify they fail**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/codeLab.test.ts`

  Expected: FAIL because the new task titles, `objective`, `hints`, and `getTaskStarterSource` do not exist yet.

- [ ] **Step 3: Extend the task model and build starter-source generation**

  In `src/erc20/codeLabTasks.ts`, add the closed task ID union and source builder:

  ```ts
  export type CodeLabTaskId = "metadata" | "balance" | "transfer" | "allowance" | "transfer-from";

  export function getTaskStarterSource(task: CodeLabTask): string {
    if (!task.requiredStatement || !task.starterReplacement) return EDUCATIONAL_SOURCE;
    return EDUCATIONAL_SOURCE.replace(task.requiredStatement, task.starterReplacement);
  }
  ```

  Give mission 2–5 these exact source replacements:

  ```ts
  "// TODO: account 주소의 잔액을 반환하세요."
  "// TODO: 받는 사람의 잔액을 늘리세요."
  "// TODO: spender의 승인 수량을 저장하세요."
  "// TODO: 사용한 대리 전송 한도를 차감하세요."
  ```

  Keep the metadata starter equal to `EDUCATIONAL_SOURCE`; its objective is changing the two quoted metadata values. Keep comparison rules task-scoped, but compare task 2–5 primarily against their single required statement so the feedback stays focused.

- [ ] **Step 4: Run the focused tests to verify they pass**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/codeLab.test.ts`

  Expected: PASS with every mission owning a concrete objective, three safe hints, and a task-specific starter source.

- [ ] **Step 5: Commit the mission data slice**

  ```bash
  git add src/erc20/codeLabTasks.ts tests/codeLab.test.ts
  git commit -m "feat: define actionable code lab missions"
  ```

### Task 2: Persist independent Code Lab drafts with legacy migration

**Files:**
- Modify: `src/types.ts`
- Modify: `src/storage/localStorage.ts`
- Modify: `tests/storage.test.ts`

**Interfaces:**
- Consumes: `CodeLabTaskId` from `src/erc20/codeLabTasks.ts` as the draft record key.
- Produces: `PersistedState.codeLabDrafts: Partial<Record<CodeLabTaskId, string>>`.
- Legacy input: persisted JSON with `editedSource: string` and no `codeLabDrafts`.
- Migration result: place a non-empty legacy `editedSource` at `codeLabDrafts.metadata`; reject invalid draft values and return defaults for malformed state.

- [ ] **Step 1: Write failing persistence tests**

  In `tests/storage.test.ts`, add a round-trip test for two independent drafts and a migration test:

  ```ts
  state.codeLabDrafts.balance = "balance draft";
  state.codeLabDrafts.transfer = "transfer draft";
  savePersistedState(storage, state);
  expect(loadPersistedState(storage).codeLabDrafts).toEqual(state.codeLabDrafts);

  storage.setItem("erc20-lab:v1", JSON.stringify({
    ...createDefaultPersistedState(),
    editedSource: "legacy source",
  }));
  expect(loadPersistedState(storage).codeLabDrafts.metadata).toBe("legacy source");
  ```

- [ ] **Step 2: Run persistence tests to verify they fail**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/storage.test.ts`

  Expected: FAIL because persisted state only has the shared `editedSource` field.

- [ ] **Step 3: Add the task-keyed persisted draft record and safe migration**

  Replace `editedSource` in `PersistedState` with:

  ```ts
  codeLabDrafts: Partial<Record<CodeLabTaskId, string>>;
  ```

  In `createDefaultPersistedState`, initialize `codeLabDrafts: {}`. In `loadPersistedState`, normalize valid `codeLabDrafts` values, accept a valid legacy shape, and migrate only a non-empty legacy source:

  ```ts
  codeLabDrafts: legacy.editedSource ? { metadata: legacy.editedSource } : {},
  ```

  Do not retain `editedSource` in newly saved payloads. Ensure every record value is a string and every accepted key is one of the five task IDs.

- [ ] **Step 4: Run persistence tests to verify they pass**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/storage.test.ts`

  Expected: PASS; new drafts round-trip and old valid saved source appears in the metadata mission only.

- [ ] **Step 5: Commit the persistence slice**

  ```bash
  git add src/types.ts src/storage/localStorage.ts tests/storage.test.ts
  git commit -m "feat: persist code lab drafts by mission"
  ```

### Task 3: Render mission objectives, progressive hints, and isolated editor documents

**Files:**
- Modify: `src/pages/codeLabPage.ts`
- Modify: `src/styles/pages.css`
- Modify: `tests/app.test.ts`

**Interfaces:**
- Consumes: `CODE_LAB_TASKS`, `getTaskStarterSource(task)`, `CodeLabTask`, and `AppStore.persisted.codeLabDrafts`.
- Produces: `.task-objective`, `.hint-button`, `.hint-box`, `.task-button`, and the existing `.guided-comparison` UI.
- Store update shape: `persisted: { ...state.persisted, codeLabDrafts: { ...state.persisted.codeLabDrafts, [activeTask.id]: source } }`.

- [ ] **Step 1: Write failing Code Lab page behavior tests**

  In `tests/app.test.ts`, add a test that renders `/code-lab`, clicks task 2, and asserts the TODO starter and objective. Click the hint button three times and assert its label and rendered text progress. Then edit task 2, switch to task 3, edit task 3, switch back, and assert both documents persist independently. Finally click `코드 초기화` while task 3 is active and assert only task 3 returns to its TODO source.

  Use CodeMirror's DOM content for assertions:

  ```ts
  expect(document.querySelector(".task-objective")?.textContent)
    .toBe("account 주소의 잔액을 반환하는 한 줄을 작성하세요.");
  expect(document.querySelector(".editor-host")?.textContent)
    .toContain("// TODO: account 주소의 잔액을 반환하세요.");
  expect(hintButton.textContent).toBe("힌트 1/3 보기");
  ```

- [ ] **Step 2: Run the focused app test to verify it fails**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/app.test.ts`

  Expected: FAIL because the page currently has one shared editor source and static hint text.

- [ ] **Step 3: Implement task switching, hint progression, and active reset**

  In `src/pages/codeLabPage.ts`:

  ```ts
  const getDraft = (task: CodeLabTask) =>
    store.getState().persisted.codeLabDrafts[task.id] ?? getTaskStarterSource(task);

  const saveDraft = (task: CodeLabTask, source: string) => store.update((state) => ({
    ...state,
    persisted: {
      ...state.persisted,
      codeLabDrafts: { ...state.persisted.codeLabDrafts, [task.id]: source },
    },
  }));
  ```

  On task selection, save the outgoing editor document, replace the CodeMirror document with the selected task's saved-or-starter source, reset the visible hint index to zero, clear comparison feedback, and focus the task anchor. Render the selected task's `objective` directly below the task list. Add a `힌트 1/3 보기` button that reveals one hint each click; after the third click, disable it and label it `힌트를 모두 확인했습니다`.

  Reset must replace the current CodeMirror document with `getTaskStarterSource(activeTask)` and update only `codeLabDrafts[activeTask.id]`. Keep compile behavior unchanged. Keep `정답과 비교`, but make its heading include the active task title and provide the exact expected statement only through the reference card.

  In `src/styles/pages.css`, add compact styles for `.task-objective`, `.hint-button`, and the disabled hint button; preserve the existing desktop and mobile Code Lab grid layout.

- [ ] **Step 4: Run focused app tests to verify they pass**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test -- tests/app.test.ts`

  Expected: PASS; objectives are actionable, hints reveal sequentially, drafts do not overwrite each other, and reset is task-local.

- [ ] **Step 5: Commit the page interaction slice**

  ```bash
  git add src/pages/codeLabPage.ts src/styles/pages.css tests/app.test.ts
  git commit -m "feat: add progressive hints to code lab missions"
  ```

### Task 4: Verify the complete learning flow and build output

**Files:**
- Modify only if verification exposes a defect in: `src/erc20/codeLabTasks.ts`, `src/pages/codeLabPage.ts`, `src/storage/localStorage.ts`, `src/types.ts`, `tests/codeLab.test.ts`, `tests/storage.test.ts`, or `tests/app.test.ts`.

**Interfaces:**
- Consumes: completed mission model, task-keyed storage, and Code Lab page behavior from Tasks 1–3.
- Produces: a type-safe, production-buildable Code Lab with all existing compiler and learning-flow coverage retained.

- [ ] **Step 1: Run all automated tests**

  Run: `NODE_OPTIONS='--localstorage-file=/tmp/erc20-lab-vitest-localstorage' pnpm run test`

  Expected: PASS for Code Lab, storage, compiler, simulator, token generation, units, and existing page behavior.

- [ ] **Step 2: Run static type checking**

  Run: `pnpm run typecheck`

  Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Build the production bundle**

  Run: `pnpm run build`

  Expected: PASS and produce the Vite distribution without worker or CodeMirror bundling errors.

- [ ] **Step 4: Inspect the final diff for whitespace errors**

  Run: `git diff --check`

  Expected: no output.

- [ ] **Step 5: Commit verification fixes only if any were needed**

  ```bash
  git add src/erc20/codeLabTasks.ts src/pages/codeLabPage.ts src/storage/localStorage.ts src/types.ts src/styles/pages.css tests/codeLab.test.ts tests/storage.test.ts tests/app.test.ts
  git commit -m "fix: verify code lab mission flow"
  ```
