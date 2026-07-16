# Function Lab Back Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible `<` control to every ERC-20 function detail page that returns to the actual previous screen and falls back to the function list.

**Architecture:** Build the control from the existing `routeLink` helper so `/functions` remains a real fallback destination handled by the SPA router. Add a target-level click listener that uses `window.history.back()` only when a previous history entry exists, and style the shared function page control with a dedicated class.

**Tech Stack:** TypeScript, DOM APIs, Vite, Vitest, happy-dom, CSS

## Global Constraints

- Apply the control to every `/functions/:key` page through `renderFunctionLabPage`.
- Render `<` visually with `aria-label="이전 화면으로 돌아가기"`.
- Keep a real `href="/functions"` fallback.
- Maintain a minimum 44px mouse, touch, and keyboard target.
- Do not change the router architecture or unrelated pages.

---

### Task 1: Accessible function detail back navigation

**Files:**
- Modify: `tests/app.test.ts`
- Modify: `src/pages/functionLabPage.ts`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `routeLink(label: string, href: string, className?: string): HTMLAnchorElement` from `src/utils/dom.ts`.
- Produces: `.function-back-link` with fallback `href="/functions"`, accessible name `이전 화면으로 돌아가기`, and history-aware click behavior.

- [ ] **Step 1: Write the failing render and history tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

it("renders an accessible function lab back link with a list fallback", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/functions/total-supply");

  const backLink = document.querySelector<HTMLAnchorElement>(".function-back-link");
  expect(backLink?.textContent).toBe("<");
  expect(backLink?.getAttribute("href")).toBe("/functions");
  expect(backLink?.getAttribute("aria-label")).toBe("이전 화면으로 돌아가기");
});

it("uses browser history when a previous screen exists", () => {
  window.history.pushState({}, "", "/functions");
  window.history.pushState({}, "", "/functions/total-supply");
  const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
  const app = createApp(document.querySelector("#app")!);
  app.render("/functions/total-supply");

  document.querySelector<HTMLAnchorElement>(".function-back-link")!.click();

  expect(backSpy).toHaveBeenCalledOnce();
  backSpy.mockRestore();
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `pnpm exec vitest run tests/app.test.ts`

Expected: FAIL because `.function-back-link` does not exist.

- [ ] **Step 3: Implement the minimal shared back link**

Update the import and create the link before returning the page:

```ts
import { button, el, field, routeLink } from "../utils/dom";

const backLink = routeLink("<", "/functions", "function-back-link");
backLink.setAttribute("aria-label", "이전 화면으로 돌아가기");
backLink.addEventListener("click", (event) => {
  if (window.history.length <= 1) return;
  event.preventDefault();
  event.stopPropagation();
  window.history.back();
});
```

Insert `backLink` as the first child of `.page-hero.function-hero`.

- [ ] **Step 4: Add Coinbase-aligned interaction styling**

```css
.function-back-link {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 32px;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--canvas);
  color: var(--ink);
  font-size: 1.35rem;
  font-weight: 650;
  line-height: 1;
  transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease;
}
.function-back-link:hover {
  border-color: var(--blue);
  background: #edf3ff;
  color: var(--blue);
  transform: translateX(-2px);
}
.function-back-link:focus-visible {
  outline: 3px solid #c9d8ff;
  outline-offset: 3px;
}
```

- [ ] **Step 5: Run focused and full verification**

Run: `pnpm exec vitest run tests/app.test.ts`

Expected: 5 tests pass.

Run: `npm run typecheck && npm run test && npm run build`

Expected: typecheck exits 0, all tests pass, and the production build exits 0.

- [ ] **Step 6: Commit, deploy, and push main**

```bash
git add tests/app.test.ts src/pages/functionLabPage.ts src/styles/pages.css
git commit -m "feat: add function lab back navigation"
git push origin main
```

Save and deploy the validated commit as the next public Sites version, then verify the control on `/functions/total-supply`.
