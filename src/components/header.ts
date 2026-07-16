import { APP_NAME } from "../config";
import type { AppState } from "../state/store";
import { button, el, routeLink } from "../utils/dom";

export function renderHeader(state: AppState, onWallet: () => void): HTMLElement {
  const nav = el("nav", { attrs: { "aria-label": "주요 메뉴" } },
    routeLink("개념", "/learn"),
    routeLink("함수 실습", "/functions"),
    routeLink("코드 랩", "/code-lab"),
    routeLink("토큰 만들기", "/token-builder"),
  );
  const walletLabel = state.wallet.address
    ? `${state.wallet.address.slice(0, 6)}…${state.wallet.address.slice(-4)}`
    : "지갑 연결";
  return el("header", { className: "site-header" },
    el("div", { className: "header-inner" },
      routeLink(APP_NAME, "/", "brand"),
      nav,
      button(walletLabel, { className: "button button-secondary wallet-button", onClick: onWallet }),
    ),
  );
}
