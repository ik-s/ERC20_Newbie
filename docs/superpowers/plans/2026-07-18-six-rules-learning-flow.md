# THE SIX RULES Learning Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move THE SIX RULES selection UI from the concept page to the function practice page while preserving the STEP 1 completion flow and existing function details.

**Architecture:** `renderLearnPage` becomes independent of function lesson data and ends with one CTA. `renderFunctionsPage` owns the six function links and decimals explanation, while `renderFunctionLabPage` adds a small STEP 2 context label without changing simulation behavior.

**Tech Stack:** TypeScript, DOM APIs, Vite, Vitest, happy-dom, CSS

## Global Constraints

- Keep the top navigation item `함수 실습` linked to `/functions`.
- Remove THE SIX RULES, six function links, and decimals content from `/learn`.
- Keep a `함수 실습 시작` CTA on `/learn` that completes STEP 1 and navigates to `/functions`.
- Render STEP 2, THE SIX RULES, six function links, and decimals content on `/functions`.
- Add `STEP 2 · 함수 실습` to every `/functions/:key` detail page.
- Preserve the detail back-link fallback to `/functions`.

---

### Task 1: Reassign STEP 1 and STEP 2 page content

**Files:**
- Modify: `tests/app.test.ts`
- Modify: `src/pages/learnPage.ts`
- Modify: `src/pages/functionsPage.ts`
- Modify: `src/pages/functionLabPage.ts`

**Interfaces:**
- Consumes: `FUNCTION_LESSONS`, `routeLink`, and the existing `renderLearnPage(onComplete)` callback.
- Produces: a CTA-only ending on `/learn`, a THE SIX RULES selection page on `/functions`, and `.function-step-label` on function details.

- [ ] **Step 1: Write failing page-flow tests**

```ts
it("moves the six rules from the concept page to function practice", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/learn");

  expect(document.body.textContent).not.toContain("THE SIX RULES");
  expect(document.querySelectorAll(".function-link")).toHaveLength(0);
  const start = [...document.querySelectorAll<HTMLButtonElement>("button")]
    .find((node) => node.textContent === "함수 실습 시작")!;

  start.click();

  expect(window.location.pathname).toBe("/functions");
  expect(document.body.textContent).toContain("STEP 2 · 함수 실습");
  expect(document.body.textContent).toContain("THE SIX RULES");
  expect(document.querySelectorAll(".function-link")).toHaveLength(6);
  expect(document.body.textContent).toContain("1,000,000,000,000,000,000");
  expect(app.store.getState().persisted.progress.completedLessons).toContain("step-1");
});

it("shows step 2 context on function detail pages", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/functions/transfer");

  expect(document.querySelector(".function-step-label")?.textContent).toBe("STEP 2 · 함수 실습");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `pnpm exec vitest run tests/app.test.ts`

Expected: FAIL because the concept page still contains THE SIX RULES and function details have no `.function-step-label`.

- [ ] **Step 3: Simplify the concept page**

Remove the `FUNCTION_LESSONS` and `routeLink` imports, delete `functionLinks`, and replace the final section with:

```ts
el("section", { className: "section learn-next-step" },
  button("함수 실습 시작", {
    className: "button button-primary button-large",
    onClick: onComplete,
  }),
),
```

- [ ] **Step 4: Build THE SIX RULES function practice page**

Replace the existing lesson list in `renderFunctionsPage` with:

```ts
el("section", { className: "page-hero" },
  el("p", { className: "eyebrow", text: "STEP 2 · 함수 실습" }),
  el("h1", { text: "여섯 개 함수를 직접 실행하세요." }),
  el("p", { className: "hero-lead", text: "모든 실습은 로컬 시뮬레이션입니다. 지갑도 가스비도 필요 없고 실제 블록체인에는 기록되지 않습니다." }),
),
el("section", { className: "section" },
  el("p", { className: "eyebrow", text: "THE SIX RULES" }),
  el("h2", { text: "ERC-20의 여섯 가지 핵심 함수를 눌러보세요." }),
  el("div", { className: "function-link-grid" },
    ...FUNCTION_LESSONS.map((lesson) =>
      routeLink(lesson.name, `/functions/${lesson.key}`, "function-link"),
    ),
  ),
  el("div", { className: "decimals-card" },
    el("div", {}, el("span", { text: "표시 수량" }), el("strong", { text: "1 LAB" })),
    el("div", {}, el("span", { text: "decimals" }), el("strong", { text: "18" })),
    el("div", {}, el("span", { text: "컨트랙트 내부 정수" }), el("strong", { text: "1,000,000,000,000,000,000" })),
  ),
),
```

- [ ] **Step 5: Add STEP 2 context to function details**

Insert this element after `backLink` and before the READ/WRITE badge:

```ts
el("p", {
  className: "eyebrow function-step-label",
  text: "STEP 2 · 함수 실습",
}),
```

- [ ] **Step 6: Verify focused and full checks**

Run: `pnpm exec vitest run tests/app.test.ts`

Expected: 7 tests pass.

Run: `npm run typecheck && npm run test && npm run build`

Expected: typecheck exits 0, all tests pass, and the production build exits 0.

- [ ] **Step 7: Commit, deploy, and push main**

```bash
git add tests/app.test.ts src/pages/learnPage.ts src/pages/functionsPage.ts src/pages/functionLabPage.ts
git commit -m "feat: refine six rules learning flow"
git push origin main
```

Save and deploy the validated commit as the next public Sites version, then verify `/learn`, `/functions`, and one `/functions/:key` page.
