import { renderHeader } from "./components/header";
import { createRouter } from "./router";
import { createStore } from "./state/store";
import { el, replaceChildren } from "./utils/dom";
import { renderHomePage } from "./pages/homePage";
import { renderLearnPage } from "./pages/learnPage";
import { renderFunctionsPage } from "./pages/functionsPage";
import { renderFunctionLabPage } from "./pages/functionLabPage";
import { connectInjectedWallet } from "./wallet/client";
import { renderCodeLabPage } from "./pages/codeLabPage";
import { renderTokenBuilderPage } from "./pages/tokenBuilderPage";
import { renderMyTokenPage } from "./pages/myTokenPage";

export function createApp(root: Element) {
  const store = createStore();
  const content = el("div", { attrs: { id: "page-content" } });
  const live = el("div", { className: "sr-only", attrs: { "aria-live": "polite", id: "app-status" } });
  let currentPath = window.location.pathname;

  const walletAction = async () => {
    store.update((state) => ({ ...state, wallet: { status: "connecting", message: "지갑 연결 요청 중" } }));
    live.textContent = "지갑 연결을 요청했습니다.";
    try {
      const wallet = await connectInjectedWallet();
      store.update((state) => ({ ...state, wallet }));
      render(currentPath);
      live.textContent = wallet.message ?? "지갑이 연결되었습니다.";
    } catch (error) {
      const message = error instanceof Error ? error.message : "지갑 연결에 실패했습니다.";
      store.update((state) => ({ ...state, wallet: { status: "failed", message } }));
      render(currentPath);
      live.textContent = message;
    }
  };

  const shell = () => el("div", { className: "app-shell" }, renderHeader(store.getState(), walletAction), content, live,
    el("footer", { className: "site-footer" },
      el("strong", { text: "ERC-20 Lab" }),
      el("p", { text: "교육용 테스트넷 실습 서비스 · 개인키와 복구 문구를 절대 입력하지 마세요." }),
    ),
  );
  replaceChildren(root, shell());

  const markVisited = (path: string) => {
    const state = store.getState();
    if (state.persisted.progress.lastVisitedPath === path) return;
    store.update((current) => ({ ...current, persisted: { ...current.persisted, progress: { ...current.persisted.progress, lastVisitedPath: path } } }));
  };

  const render = (path: string) => {
    currentPath = path;
    markVisited(path);
    const state = store.getState();
    let page: HTMLElement;
    if (path === "/") page = renderHomePage(state);
    else if (path === "/learn") page = renderLearnPage(() => {
      const completed = new Set(store.getState().persisted.progress.completedLessons);
      completed.add("step-1");
      store.update((current) => ({ ...current, persisted: { ...current.persisted, progress: { ...current.persisted.progress, completedLessons: [...completed] } } }));
      window.history.pushState({}, "", "/functions");
      render("/functions");
    });
    else if (path === "/functions") page = renderFunctionsPage();
    else if (path.startsWith("/functions/")) page = renderFunctionLabPage(path.slice("/functions/".length), store);
    else if (path === "/code-lab") page = renderCodeLabPage(store);
    else if (path === "/token-builder") page = renderTokenBuilderPage(store, () => render("/token-builder"));
    else if (path === "/my-token") page = renderMyTokenPage(store);
    else page = renderHomePage(state);
    replaceChildren(content, page);
    document.title = `${page.querySelector("h1")?.textContent ?? "ERC-20 Lab"} · ERC-20 Lab`;
  };

  const router = createRouter([{ pattern: /.*/, handler: ({ path }) => render(path) }]);
  return { render, router, store };
}
