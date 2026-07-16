import { compileSolidity, type CompiledContract } from "../erc20/compiler";
import { deployGeneratedToken } from "../erc20/deployment";
import { generateTokenSource, validateTokenDraft } from "../erc20/tokenGenerator";
import type { AppStore } from "../state/store";
import type { TokenDraft } from "../types";
import { button, el, field, routeLink } from "../utils/dom";

export function renderTokenBuilderPage(store: AppStore, refresh: () => void): HTMLElement {
  const draft = store.getState().persisted.tokenDraft;
  draft.sourceCode = generateTokenSource(draft);
  let compiled: CompiledContract | undefined;
  let busy = false;
  const status = el("div", { className: "builder-status", attrs: { role: "status", "aria-live": "polite" } }, el("p", { text: "정보를 입력하면 OpenZeppelin 기반 코드가 실시간으로 생성됩니다." }));
  const code = el("code", { text: draft.sourceCode });
  const codeBlock = el("pre", { className: "code-block token-code", attrs: { tabindex: "0", "aria-label": "생성된 Solidity 코드" } }, code);

  const name = el("input", { attrs: { id: "token-name", value: draft.name, maxlength: "40" } });
  const symbol = el("input", { attrs: { id: "token-symbol", value: draft.symbol, maxlength: "8" } });
  const supply = el("input", { attrs: { id: "initial-supply", value: draft.initialSupply, inputmode: "numeric" } });
  const recipient = el("input", { attrs: { id: "recipient", value: draft.recipient, spellcheck: "false" } });
  const decimals = el("input", { attrs: { id: "decimals", type: "number", min: "0", max: "18", value: String(draft.decimals) } });
  const burnable = el("input", { attrs: { id: "burnable", type: "checkbox" } }); burnable.checked = draft.burnable;
  const mintable = el("input", { attrs: { id: "mintable", type: "checkbox" } }); mintable.checked = draft.mintable;
  const capped = el("input", { attrs: { id: "capped", type: "checkbox" } }); capped.checked = draft.capped;
  const cap = el("input", { attrs: { id: "max-supply", value: draft.maxSupply ?? "5000000", inputmode: "numeric" } });

  const update = () => {
    const next: TokenDraft = {
      name: name.value,
      symbol: symbol.value.toUpperCase(),
      initialSupply: supply.value,
      recipient: recipient.value,
      decimals: Number(decimals.value),
      burnable: burnable.checked,
      mintable: mintable.checked,
      capped: capped.checked,
      sourceCode: "",
      ...(capped.checked ? { maxSupply: cap.value } : {}),
    };
    next.sourceCode = generateTokenSource(next);
    code.textContent = next.sourceCode;
    cap.disabled = !next.capped;
    store.update((state) => ({ ...state, persisted: { ...state.persisted, tokenDraft: next } }));
    compiled = undefined;
    deployButton.disabled = true;
    status.replaceChildren(el("p", { text: "코드가 변경되었습니다. 배포 전에 다시 컴파일해 주세요." }));
  };
  [name, symbol, supply, recipient, decimals, burnable, mintable, capped, cap].forEach((control) => control.addEventListener("input", update));
  cap.disabled = !draft.capped;

  const compileButton = button("코드 컴파일", { className: "button button-secondary" });
  const deployButton = button("Sepolia에 배포", { className: "button button-primary" });
  deployButton.disabled = true;
  compileButton.addEventListener("click", async () => {
    if (busy) return;
    const current = store.getState().persisted.tokenDraft;
    const errors = validateTokenDraft(current);
    if (errors.length) {
      status.replaceChildren(el("strong", { text: "입력값을 확인하세요." }), ...errors.map((error) => el("p", { text: error.message })));
      return;
    }
    busy = true; compileButton.disabled = true;
    status.replaceChildren(el("p", { text: "Web Worker에서 OpenZeppelin 코드를 컴파일하고 있습니다…" }));
    try {
      const result = await compileSolidity(current.sourceCode);
      compiled = result.contracts.find((contract) => contract.name === "MyToken");
      if (!result.ok || !compiled) {
        status.replaceChildren(el("strong", { text: "컴파일 오류" }), ...result.diagnostics.filter((item) => item.severity === "error").map((item) => el("p", { text: `${item.line ?? "?"}줄 · ${item.friendlyMessage}` })));
      } else {
        deployButton.disabled = store.getState().wallet.status !== "connected";
        status.replaceChildren(el("strong", { text: "컴파일 성공" }), el("p", { text: `${result.compilerVersion} · ABI ${compiled.abi.length}개 항목 · Bytecode ${Math.round(compiled.bytecode.length / 2).toLocaleString()} bytes` }), el("p", { text: deployButton.disabled ? "상단에서 Sepolia 지갑을 연결하면 배포할 수 있습니다." : "지갑에서 배포 내용을 확인할 준비가 되었습니다." }));
      }
    } catch (error) { status.replaceChildren(el("p", { text: error instanceof Error ? error.message : "컴파일 실패" })); }
    finally { busy = false; compileButton.disabled = false; }
  });
  deployButton.addEventListener("click", async () => {
    if (busy || !compiled) return;
    busy = true; deployButton.disabled = true;
    status.replaceChildren(el("strong", { text: "지갑 승인 대기 중" }), el("p", { text: "Sepolia 네트워크와 가스 정보를 지갑에서 확인하세요. 메인넷에서는 실행되지 않습니다." }));
    try {
      const deployment = await deployGeneratedToken(compiled, store.getState().persisted.tokenDraft);
      store.update((state) => ({ ...state, persisted: { ...state.persisted, deployments: [...state.persisted.deployments, deployment], recentTransactionHashes: [...state.persisted.recentTransactionHashes, deployment.transactionHash] } }));
      status.replaceChildren(el("strong", { text: "배포 완료" }), el("p", { text: deployment.contractAddress }), routeLink("배포한 토큰 사용하기 →", "/my-token", "text-link"));
    } catch (error) { status.replaceChildren(el("strong", { text: "배포 실패" }), el("p", { text: error instanceof Error ? error.message : "지갑 또는 RPC 오류" })); deployButton.disabled = false; }
    finally { busy = false; }
  });

  const advanced = el("details", { className: "advanced-options" },
    el("summary", { text: "고급 설정" }),
    el("div", { className: "form-grid" }, field("decimals", decimals), field("최대 발행량", cap)),
    el("div", { className: "toggle-grid" }, field("Burnable", burnable), field("Owner Mintable", mintable), field("Capped Supply", capped)),
  );

  return el("main", {},
    el("section", { className: "page-hero" }, el("p", { className: "eyebrow", text: "STEP 5 · 테스트넷 배포" }), el("h1", { text: "나만의 ERC-20 토큰을 만드세요." }), el("p", { className: "hero-lead", text: "선택한 기능만 포함한 OpenZeppelin 코드를 생성하고 Sepolia에 배포합니다." })),
    el("section", { className: "section builder-layout" },
      el("div", { className: "builder-form card" }, el("h2", { text: "토큰 설정" }), field("Token Name", name), field("Token Symbol", symbol), field("Initial Supply", supply), field("Recipient Address", recipient), advanced, el("div", { className: "network-check" }, el("strong", { text: "Ethereum Sepolia" }), el("span", { text: "테스트넷 전용 · 개인키 입력 없음" })), el("div", { className: "button-row" }, compileButton, deployButton), status),
      el("div", { className: "generated-code" }, el("div", { className: "section-heading" }, el("div", {}, el("p", { className: "eyebrow", text: "GENERATED CONTRACT" }), el("h2", { text: "OpenZeppelin Solidity" }))), codeBlock),
    ),
  );
}
