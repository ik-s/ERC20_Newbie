import { isAddress, type Address } from "viem";
import { sepolia } from "viem/chains";
import { ALLOWANCE_PLAYGROUND_ADDRESS } from "../config";
import { readTokenAllowance, readTokenSummary, useAllowancePlayground, writeToken } from "../erc20/deployment";
import type { AppStore } from "../state/store";
import { button, el, field, routeLink } from "../utils/dom";
import { formatTokenAmount, parseTokenAmount, shortenAddress } from "../utils/format";

export function renderMyTokenPage(store: AppStore): HTMLElement {
  const deployment = store.getState().persisted.deployments.at(-1);
  if (!deployment) return el("main", {}, el("section", { className: "page-hero empty-state" }, el("p", { className: "eyebrow", text: "MY TOKEN" }), el("h1", { text: "아직 배포한 토큰이 없습니다." }), el("p", { className: "hero-lead", text: "토큰 생성기에서 OpenZeppelin 코드를 컴파일하고 Sepolia에 배포해보세요." }), routeLink("토큰 만들기", "/token-builder", "button button-primary button-large")));

  const state = store.getState();
  const summaryRows: Array<readonly [string, string]> = [["토큰", `${deployment.name} (${deployment.symbol})`], ["네트워크", "Ethereum Sepolia"], ["컨트랙트", shortenAddress(deployment.contractAddress)], ["배포자", shortenAddress(deployment.deployer)]];
  const summary = el("div", { className: "token-summary-grid" },
    ...summaryRows.map(([label, value]) => el("div", { className: "summary-cell" }, el("span", { text: label }), el("strong", { text: value }))),
  );
  const live = el("div", { className: "builder-status", attrs: { role: "status", "aria-live": "polite" } }, el("p", { text: state.wallet.status === "connected" ? "온체인 정보를 불러올 수 있습니다." : "상단에서 Sepolia 지갑을 연결하세요." }));
  const recipient = el("input", { attrs: { id: "my-token-recipient", placeholder: "0x…", spellcheck: "false" } });
  const amount = el("input", { attrs: { id: "my-token-amount", placeholder: "10", inputmode: "decimal" } });
  const refresh = button("온체인 정보 새로고침", { className: "button button-secondary", onClick: async () => {
    live.replaceChildren(el("p", { text: "Sepolia에서 토큰 정보를 읽는 중…" }));
    try {
      const data = await readTokenSummary(deployment.contractAddress, state.wallet.address as Address | undefined);
      live.replaceChildren(el("strong", { text: `${data.name} · ${data.symbol}` }), el("p", { text: `총발행량 ${formatTokenAmount(data.totalSupply, data.decimals)} · 내 잔액 ${formatTokenAmount(data.balance, data.decimals)}` }));
    } catch (error) { live.replaceChildren(el("p", { text: error instanceof Error ? error.message : "RPC 연결 실패" })); }
  } });
  const transfer = button("transfer 실행", { className: "button button-primary", onClick: async () => {
    if (!isAddress(recipient.value)) { live.textContent = "올바른 받는 주소를 입력해 주세요."; return; }
    try {
      const value = parseTokenAmount(amount.value, deployment.decimals);
      live.textContent = "simulateContract로 실행 가능 여부를 확인하고 있습니다…";
      const hash = await writeToken(deployment.contractAddress, "transfer", [recipient.value, value]);
      live.replaceChildren(el("strong", { text: "트랜잭션 전송 완료" }), el("a", { text: shortenAddress(hash), attrs: { href: `${sepolia.blockExplorers.default.url}/tx/${hash}`, target: "_blank", rel: "noreferrer" } }));
    } catch (error) { live.replaceChildren(el("strong", { text: "트랜잭션 실패" }), el("p", { text: error instanceof Error ? error.message : "지갑 요청 실패" })); }
  } });
  const approve = button("approve 실행", { className: "button button-secondary", onClick: async () => {
    if (!isAddress(recipient.value)) { live.textContent = "올바른 spender 주소를 입력해 주세요."; return; }
    try {
      const value = parseTokenAmount(amount.value, deployment.decimals);
      live.textContent = "approve를 시뮬레이션하고 지갑 승인을 기다립니다…";
      const hash = await writeToken(deployment.contractAddress, "approve", [recipient.value, value]);
      live.replaceChildren(el("strong", { text: "Approval 트랜잭션 전송 완료" }), el("p", { text: shortenAddress(hash) }));
    } catch (error) { live.textContent = error instanceof Error ? error.message : "approve 실패"; }
  } });
  const allowance = button("allowance 조회", { className: "button button-secondary", onClick: async () => {
    const owner = store.getState().wallet.address;
    if (!owner || !isAddress(owner) || !isAddress(recipient.value)) { live.textContent = "지갑을 연결하고 spender 주소를 입력해 주세요."; return; }
    try {
      const value = await readTokenAllowance(deployment.contractAddress, owner, recipient.value);
      live.replaceChildren(el("strong", { text: "현재 allowance" }), el("p", { text: `${formatTokenAmount(value, deployment.decimals)} ${deployment.symbol}` }));
    } catch (error) { live.textContent = error instanceof Error ? error.message : "allowance 조회 실패"; }
  } });
  const playgroundReady = Boolean(ALLOWANCE_PLAYGROUND_ADDRESS && isAddress(ALLOWANCE_PLAYGROUND_ADDRESS));
  const playground = button("AllowancePlayground에서 pull", { className: "button button-secondary", onClick: async () => {
    if (!playgroundReady) return;
    try {
      const value = parseTokenAmount(amount.value, deployment.decimals);
      live.textContent = "보조 컨트랙트의 transferFrom을 시뮬레이션하고 있습니다…";
      const hash = await useAllowancePlayground(ALLOWANCE_PLAYGROUND_ADDRESS as Address, deployment.contractAddress, "pullToken", value);
      live.replaceChildren(el("strong", { text: "transferFrom 실행 완료" }), el("p", { text: shortenAddress(hash) }));
    } catch (error) { live.textContent = error instanceof Error ? error.message : "transferFrom 실패"; }
  } });
  playground.disabled = !playgroundReady;

  return el("main", {},
    el("section", { className: "page-hero" }, el("p", { className: "eyebrow", text: "MY TOKEN · SEPOLIA" }), el("h1", { text: deployment.name }), el("p", { className: "hero-lead", text: "배포한 ERC-20을 실제 테스트넷에서 조회하고 전송해보세요." })),
    el("section", { className: "section" }, summary,
      el("div", { className: "my-token-layout" },
        el("div", { className: "card token-action-card" }, el("h2", { text: "조회" }), el("p", { text: "totalSupply와 연결 주소의 balanceOf를 가스비 없이 읽습니다." }), refresh),
        el("div", { className: "card token-action-card" }, el("h2", { text: "전송 · 승인" }), field("받는 주소 또는 spender", recipient), field(`${deployment.symbol} 수량`, amount), el("div", { className: "button-row" }, transfer, approve, allowance)),
        el("div", { className: "card token-action-card" }, el("h2", { text: "transferFrom 보조 실습" }), el("p", { text: playgroundReady ? "먼저 위 주소로 AllowancePlayground를 approve한 뒤 pull을 실행하세요." : "VITE_ALLOWANCE_PLAYGROUND_ADDRESS가 없어 비활성화되었습니다. README의 설정 방법을 확인하세요." }), playground),
      ),
      live,
      el("div", { className: "explorer-links" }, el("a", { className: "text-link", text: "컨트랙트 보기 ↗", attrs: { href: `${sepolia.blockExplorers.default.url}/address/${deployment.contractAddress}`, target: "_blank", rel: "noreferrer" } }), el("a", { className: "text-link", text: "배포 트랜잭션 보기 ↗", attrs: { href: `${sepolia.blockExplorers.default.url}/tx/${deployment.transactionHash}`, target: "_blank", rel: "noreferrer" } })),
    ),
  );
}
