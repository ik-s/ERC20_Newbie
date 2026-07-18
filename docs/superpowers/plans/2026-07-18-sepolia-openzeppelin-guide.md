# Sepolia·OpenZeppelin Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared footer warning with a link to a beginner-friendly page that explains Sepolia, OpenZeppelin, how they work together, and links to their official documentation.

**Architecture:** Add one stateless page renderer and register it in the existing client-side route switch. Reuse the current SPA link helper and function-detail back-button behavior, keep all educational content local, and add only page-specific responsive styles.

**Tech Stack:** TypeScript 7, DOM helper functions, the existing regex router, CSS Grid, Vitest with happy-dom, Vite.

## Global Constraints

- Work directly on `main`; do not create a feature branch.
- Use the route `/guide/sepolia-openzeppelin`.
- Use the footer copy `Sepolia와 OpenZeppelin 알아보기 →`.
- Use the page eyebrow `DEPLOYMENT BASICS` and heading `배포 전에 알아둘 두 가지`.
- Use `https://ethereum.org/developers/docs/networks/` for the Ethereum network documentation.
- Use `https://docs.openzeppelin.com/contracts/5.x` for the OpenZeppelin Contracts documentation.
- Official documentation links must use `target="_blank"` and `rel="noreferrer noopener"`.
- The back link must have visible text `<`, `aria-label="이전 화면으로 돌아가기"`, and `/` as its fallback `href`.
- Use `window.history.back()` when browser history is available.
- Add no dependencies, wallet behavior, network fetching, or persisted state.
- Preserve the existing Coinbase-based visual language and responsive behavior.
- Do not change the pre-existing ESLint configuration problem; validate with typecheck, tests, and the production build.

---

### Task 1: Add the guide route, footer entry point, and back navigation

**Files:**
- Create: `src/pages/deploymentBasicsPage.ts`
- Modify: `src/app.ts:4-12`
- Modify: `src/app.ts:36-40`
- Modify: `src/app.ts:63-68`
- Test: `tests/app.test.ts`

**Interfaces:**
- Consumes: `el()` and `routeLink()` from `src/utils/dom.ts`.
- Produces: `renderDeploymentBasicsPage(): HTMLElement`, imported by `src/app.ts`.
- Produces: an SPA footer link with `href="/guide/sepolia-openzeppelin"` and `data-link`.

- [ ] **Step 1: Write failing route, footer, and back-link tests**

Add these tests inside the existing `describe("ERC-20 Lab app", ...)` block in `tests/app.test.ts`:

```ts
it("links the shared footer to the deployment basics guide", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/token-builder");

  const guideLink = document.querySelector<HTMLAnchorElement>(".footer-guide-link");
  expect(guideLink?.textContent).toBe("Sepolia와 OpenZeppelin 알아보기 →");
  expect(guideLink?.getAttribute("href")).toBe("/guide/sepolia-openzeppelin");
  expect(guideLink?.hasAttribute("data-link")).toBe(true);
  expect(document.body.textContent).not.toContain("개인키와 복구 문구를 절대 입력하지 마세요.");
});

it("renders the deployment basics guide with an accessible home fallback", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/guide/sepolia-openzeppelin");

  expect(document.querySelector(".deployment-guide-hero .eyebrow")?.textContent).toBe("DEPLOYMENT BASICS");
  expect(document.querySelector("h1")?.textContent).toBe("배포 전에 알아둘 두 가지");

  const backLink = document.querySelector<HTMLAnchorElement>(".deployment-guide-back-link");
  expect(backLink?.textContent).toBe("<");
  expect(backLink?.getAttribute("href")).toBe("/");
  expect(backLink?.getAttribute("aria-label")).toBe("이전 화면으로 돌아가기");
});

it("returns to browser history from the deployment basics guide", () => {
  window.history.pushState({}, "", "/token-builder");
  window.history.pushState({}, "", "/guide/sepolia-openzeppelin");
  const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
  const app = createApp(document.querySelector("#app")!);
  app.render("/guide/sepolia-openzeppelin");

  document.querySelector<HTMLAnchorElement>(".deployment-guide-back-link")!.click();

  expect(backSpy).toHaveBeenCalledOnce();
  backSpy.mockRestore();
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
PATH="/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm exec vitest run tests/app.test.ts
```

Expected: FAIL because `.footer-guide-link`, `.deployment-guide-hero`, and `.deployment-guide-back-link` do not exist.

- [ ] **Step 3: Create the minimal guide page**

Create `src/pages/deploymentBasicsPage.ts`:

```ts
import { el, routeLink } from "../utils/dom";

export function renderDeploymentBasicsPage(): HTMLElement {
  const backLink = routeLink("<", "/", "function-back-link deployment-guide-back-link");
  backLink.setAttribute("aria-label", "이전 화면으로 돌아가기");
  backLink.addEventListener("click", (event) => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    window.history.back();
  });

  return el("main", {},
    el("section", { className: "page-hero deployment-guide-hero" },
      backLink,
      el("p", { className: "eyebrow", text: "DEPLOYMENT BASICS" }),
      el("h1", { text: "배포 전에 알아둘 두 가지" }),
      el("p", {
        className: "hero-lead",
        text: "토큰을 만드는 코드와 그 코드를 연습하는 네트워크는 서로 다른 역할을 합니다.",
      }),
    ),
  );
}
```

- [ ] **Step 4: Register the page and replace the footer warning**

Update the imports in `src/app.ts`:

```ts
import { el, replaceChildren, routeLink } from "./utils/dom";
import { renderDeploymentBasicsPage } from "./pages/deploymentBasicsPage";
```

Replace the footer paragraph in `shell()` with:

```ts
routeLink(
  "Sepolia와 OpenZeppelin 알아보기 →",
  "/guide/sepolia-openzeppelin",
  "text-link footer-guide-link",
),
```

Add the guide route immediately before the final home fallback:

```ts
else if (path === "/guide/sepolia-openzeppelin") page = renderDeploymentBasicsPage();
else page = renderHomePage(state);
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run:

```bash
PATH="/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm exec vitest run tests/app.test.ts
```

Expected: PASS for all app tests.

- [ ] **Step 6: Commit the functional route**

```bash
git add src/pages/deploymentBasicsPage.ts src/app.ts tests/app.test.ts
git commit -m "feat: add deployment basics guide route"
```

---

### Task 2: Add beginner content, official resources, and responsive presentation

**Files:**
- Modify: `src/pages/deploymentBasicsPage.ts`
- Modify: `src/styles/pages.css:24-42`
- Test: `tests/app.test.ts`

**Interfaces:**
- Consumes: `renderDeploymentBasicsPage(): HTMLElement` from Task 1.
- Produces: two elements with `data-guide-topic`, four `.deployment-flow-step` elements, and two `.official-resource-link` anchors.
- Produces: responsive `.deployment-guide-grid` and `.deployment-flow` layouts.

- [ ] **Step 1: Write the failing content and resource-link test**

Add this test inside the existing app test suite:

```ts
it("explains Sepolia and OpenZeppelin with verified official resources", () => {
  const app = createApp(document.querySelector("#app")!);
  app.render("/guide/sepolia-openzeppelin");

  expect([...document.querySelectorAll("[data-guide-topic] h2")].map((heading) => heading.textContent)).toEqual([
    "Sepolia",
    "OpenZeppelin",
  ]);
  expect([...document.querySelectorAll(".deployment-flow-step")].map((step) => step.textContent)).toEqual([
    "1ERC-20 코드 구성",
    "2Solidity 컴파일",
    "3Sepolia 배포",
    "4지갑과 탐색기에서 확인",
  ]);

  const resourceLinks = [...document.querySelectorAll<HTMLAnchorElement>(".official-resource-link")];
  expect(resourceLinks.map((link) => link.href)).toEqual([
    "https://ethereum.org/developers/docs/networks/",
    "https://docs.openzeppelin.com/contracts/5.x",
  ]);
  resourceLinks.forEach((link) => {
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noreferrer noopener");
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
PATH="/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm exec vitest run tests/app.test.ts
```

Expected: FAIL because guide topic cards, flow steps, and official resource links are absent.

- [ ] **Step 3: Replace the guide renderer with the complete educational page**

Replace `src/pages/deploymentBasicsPage.ts` with:

```ts
import { el, routeLink } from "../utils/dom";

const officialLink = (label: string, href: string): HTMLAnchorElement =>
  el("a", {
    className: "text-link official-resource-link",
    text: `${label} ↗`,
    attrs: { href, target: "_blank", rel: "noreferrer noopener" },
  });

export function renderDeploymentBasicsPage(): HTMLElement {
  const backLink = routeLink("<", "/", "function-back-link deployment-guide-back-link");
  backLink.setAttribute("aria-label", "이전 화면으로 돌아가기");
  backLink.addEventListener("click", (event) => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    window.history.back();
  });

  return el("main", {},
    el("section", { className: "page-hero deployment-guide-hero" },
      backLink,
      el("p", { className: "eyebrow", text: "DEPLOYMENT BASICS" }),
      el("h1", { text: "배포 전에 알아둘 두 가지" }),
      el("p", {
        className: "hero-lead",
        text: "토큰을 만드는 코드와 그 코드를 연습하는 네트워크는 서로 다른 역할을 합니다.",
      }),
    ),
    el("section", { className: "section deployment-guide-section" },
      el("div", { className: "deployment-guide-grid" },
        el("article", { className: "card deployment-guide-card", attrs: { "data-guide-topic": "sepolia" } },
          el("p", { className: "eyebrow", text: "TEST NETWORK" }),
          el("h2", { text: "Sepolia" }),
          el("p", { text: "Ethereum 애플리케이션과 스마트 컨트랙트를 실제 자산 없이 시험하는 공개 테스트넷입니다." }),
          el("p", { text: "메인넷과 계정 형식 및 실행 방식은 비슷하지만 잔액과 거래 기록은 서로 분리됩니다." }),
          el("p", { className: "deployment-guide-note", text: "Sepolia ETH는 실습용이며 실제 금전적 가치를 전제로 하지 않습니다." }),
          officialLink("Ethereum 네트워크 공식 문서", "https://ethereum.org/developers/docs/networks/"),
        ),
        el("article", { className: "card deployment-guide-card", attrs: { "data-guide-topic": "openzeppelin" } },
          el("p", { className: "eyebrow", text: "CONTRACT LIBRARY" }),
          el("h2", { text: "OpenZeppelin" }),
          el("p", { text: "ERC-20 같은 표준 구현을 제공하는 재사용 가능한 Solidity 스마트 컨트랙트 라이브러리입니다." }),
          el("p", { text: "검증된 기반 코드를 활용해 직접 구현에서 생길 수 있는 실수를 줄여줍니다." }),
          el("p", { className: "deployment-guide-note", text: "라이브러리를 사용하더라도 프로젝트별 검토와 테스트는 필요합니다." }),
          officialLink("OpenZeppelin Contracts 공식 문서", "https://docs.openzeppelin.com/contracts/5.x"),
        ),
      ),
    ),
    el("section", { className: "section soft-section deployment-flow-section" },
      el("p", { className: "eyebrow", text: "HOW THEY WORK TOGETHER" }),
      el("h2", { text: "코드는 OpenZeppelin으로, 연습은 Sepolia에서." }),
      el("ol", { className: "deployment-flow", attrs: { "aria-label": "토큰 테스트 배포 흐름" } },
        ...["ERC-20 코드 구성", "Solidity 컴파일", "Sepolia 배포", "지갑과 탐색기에서 확인"].map((label, index) =>
          el("li", { className: "deployment-flow-step" },
            el("span", { text: String(index + 1) }),
            el("strong", { text: label }),
          ),
        ),
      ),
    ),
  );
}
```

- [ ] **Step 4: Add responsive guide styles**

Add these rules near the other page-level grids in `src/styles/pages.css`:

```css
.deployment-guide-section { display: grid; gap: 24px; }
.deployment-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.deployment-guide-card { display: flex; align-items: flex-start; flex-direction: column; padding: 32px; }
.deployment-guide-card h2 { margin: 18px 0 14px; font-size: 2rem; }
.deployment-guide-card p { color: var(--body); }
.deployment-guide-card .eyebrow { color: var(--blue); }
.deployment-guide-card .official-resource-link { margin-top: auto; padding-top: 20px; }
.deployment-guide-note { padding: 14px; border-radius: 10px; background: var(--soft); font-size: .86rem; }
.deployment-flow-section h2 { max-width: 780px; }
.deployment-flow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 36px 0 0; padding: 0; list-style: none; }
.deployment-flow-step { min-height: 150px; display: flex; flex-direction: column; justify-content: space-between; padding: 22px; border-radius: var(--radius-lg); background: white; }
.deployment-flow-step span { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: #edf3ff; color: var(--blue); font-weight: 700; }
```

Extend the existing responsive rules:

```css
@media (max-width: 980px) {
  .deployment-flow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 680px) {
  .deployment-guide-grid, .deployment-flow { grid-template-columns: 1fr; }
  .deployment-flow-step { min-height: 112px; }
}
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run:

```bash
PATH="/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH" pnpm exec vitest run tests/app.test.ts
```

Expected: PASS for all app tests.

- [ ] **Step 6: Run full verification**

Run:

```bash
export PATH="/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/tnsdlr/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

Expected:

- TypeScript exits with code 0.
- All Vitest files and tests pass.
- Vite production build exits with code 0 and generates the Sites worker.
- `git diff --check` prints no whitespace errors.

- [ ] **Step 7: Commit the educational content and presentation**

```bash
git add src/pages/deploymentBasicsPage.ts src/styles/pages.css tests/app.test.ts
git commit -m "feat: explain Sepolia and OpenZeppelin"
```

- [ ] **Step 8: Leave publication for explicit approval**

Do not push `main` or deploy a Sites version unless the user explicitly requests publication after reviewing the local page.
