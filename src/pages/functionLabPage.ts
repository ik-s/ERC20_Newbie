import { renderCodeViewer } from "../components/codeViewer";
import { renderEventLog } from "../components/eventLog";
import { ACCOUNTS, type AccountName, TokenSimulator } from "../erc20/simulator";
import { getLesson } from "../erc20/functionLessons";
import type { AppStore } from "../state/store";
import { button, el, field, routeLink } from "../utils/dom";
import { formatLab } from "../utils/format";

const ACCOUNT_LABELS: Record<AccountName, string> = { alice: "Alice", bob: "Bob", dex: "DEX" };

const accountSelect = (id: string, selected: AccountName): HTMLSelectElement => {
  const select = el("select", { attrs: { id } });
  (Object.keys(ACCOUNTS) as AccountName[]).forEach((name) => {
    const option = el("option", { text: ACCOUNT_LABELS[name], attrs: { value: name } });
    option.selected = name === selected;
    select.append(option);
  });
  return select;
};

const snapshotCards = (token: TokenSimulator, title: string): HTMLElement =>
  el("div", { className: "state-column" },
    el("h3", { text: title }),
    ...((Object.keys(ACCOUNTS) as AccountName[]).map((name) =>
      el("div", { className: "balance-row" }, el("span", { text: ACCOUNT_LABELS[name] }), el("strong", { text: formatLab(token.balanceOf(ACCOUNTS[name])) })),
    )),
    el("div", { className: "allowance-row" }, el("span", { text: "Alice → DEX allowance" }), el("strong", { text: formatLab(token.allowance(ACCOUNTS.alice, ACCOUNTS.dex)) })),
  );

export function renderFunctionLabPage(key: string, store: AppStore): HTMLElement {
  const lesson = getLesson(key);
  const token = store.getState().simulator;
  const execution = el("div", { className: "lab-execution" });
  const result = el("div", { className: "result-box", attrs: { role: "status", "aria-live": "polite" } }, el("p", { text: "입력값을 정한 뒤 실행해보세요." }));
  const beforeArea = el("div", { className: "state-grid" }, snapshotCards(token, "실행 전"), snapshotCards(token, "실행 후"));

  const from = accountSelect("from", "alice");
  const to = accountSelect("to", "bob");
  const owner = accountSelect("owner", "alice");
  const spender = accountSelect("spender", "dex");
  const account = accountSelect("account", "alice");
  const amount = el("input", { attrs: { id: "amount", type: "number", min: "0", step: "1", value: lesson.name === "approve" ? "100" : "30", inputmode: "numeric" } });
  const controls = el("div", { className: "form-grid" });

  if (lesson.name === "balanceOf") controls.append(field("조회할 계정", account));
  if (lesson.name === "transfer") controls.append(field("보내는 사람 (msg.sender)", from), field("받는 사람", to), field("수량", amount));
  if (lesson.name === "approve") controls.append(field("토큰 소유자", owner), field("승인받을 spender", spender), field("승인 수량", amount, "승인만으로 토큰이 이동하지 않습니다."));
  if (lesson.name === "allowance") controls.append(field("토큰 소유자", owner), field("승인받은 spender", spender));
  if (lesson.name === "transferFrom") controls.append(field("호출자 (spender)", spender), field("토큰 소유자", owner), field("받는 사람", to), field("수량", amount));

  const rerenderState = (before: TokenSimulator) => {
    beforeArea.replaceChildren(snapshotCards(before, "실행 전"), snapshotCards(token, "실행 후"));
  };
  const execute = () => {
    const before = new TokenSimulator();
    const current = token.snapshot();
    Object.assign(before, { state: current });
    let value: bigint | boolean = true;
    let message = "조회에 성공했습니다.";
    let ok = true;
    const units = BigInt(amount.value || "0");
    if (lesson.name === "totalSupply") value = token.totalSupply();
    else if (lesson.name === "balanceOf") value = token.balanceOf(ACCOUNTS[account.value as AccountName]);
    else if (lesson.name === "transfer") {
      const operation = token.transfer(ACCOUNTS[from.value as AccountName], ACCOUNTS[to.value as AccountName], units);
      ok = operation.ok; message = operation.message; value = operation.ok ? operation.value : false;
    }
    else if (lesson.name === "approve") {
      const operation = token.approve(ACCOUNTS[owner.value as AccountName], ACCOUNTS[spender.value as AccountName], units);
      ok = operation.ok; message = operation.message; value = operation.ok ? operation.value : false;
    }
    else if (lesson.name === "allowance") value = token.allowance(ACCOUNTS[owner.value as AccountName], ACCOUNTS[spender.value as AccountName]);
    else {
      const operation = token.transferFrom(ACCOUNTS[spender.value as AccountName], ACCOUNTS[owner.value as AccountName], ACCOUNTS[to.value as AccountName], units);
      ok = operation.ok; message = operation.message; value = operation.ok ? operation.value : false;
    }

    result.replaceChildren(
      el("strong", { text: ok ? "실행 성공" : "실행 실패" }),
      el("p", { text: message }),
      el("dl", { className: "result-facts" },
        el("div", {}, el("dt", { text: "반환값" }), el("dd", { text: typeof value === "bigint" ? `${value} LAB` : String(value) })),
        el("div", {}, el("dt", { text: "msg.sender" }), el("dd", { text: lesson.kind === "READ" ? "조회자" : lesson.name === "transferFrom" ? ACCOUNT_LABELS[spender.value as AccountName] : ACCOUNT_LABELS[(from.value || owner.value) as AccountName] })),
      ),
    );
    result.className = `result-box ${ok ? "is-success" : "is-error"}`;
    rerenderState(before);
    eventContainer.replaceChildren(renderEventLog(token.events));
    if (ok) {
      const persisted = store.getState().persisted;
      const completed = new Set(persisted.progress.completedExercises);
      completed.add(lesson.key);
      store.update((state) => ({ ...state, persisted: { ...state.persisted, progress: { ...state.persisted.progress, completedExercises: [...completed], lastVisitedPath: `/functions/${lesson.key}` } } }));
    }
  };

  const reset = () => {
    token.reset();
    result.replaceChildren(el("p", { text: "Alice 1,000 LAB, Bob 100 LAB, DEX 0 LAB 상태로 돌아왔습니다." }));
    result.className = "result-box";
    beforeArea.replaceChildren(snapshotCards(token, "실행 전"), snapshotCards(token, "실행 후"));
    eventContainer.replaceChildren(renderEventLog(token.events));
  };

  execution.append(controls, el("div", { className: "button-row" }, button(`${lesson.name} 실행`, { className: "button button-primary", action: "execute", onClick: execute }), button("초기 상태로 되돌리기", { className: "button button-secondary", onClick: reset })), result, beforeArea);
  const eventContainer = el("div", {}, renderEventLog(token.events));
  const backLink = routeLink("<", "/functions", "function-back-link");
  backLink.setAttribute("aria-label", "이전 화면으로 돌아가기");
  backLink.addEventListener("click", (event) => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    window.history.back();
  });

  const factRows: Array<readonly [string, string]> = [["호출하는 사람", lesson.caller], ["입력값", lesson.inputs], ["반환값", lesson.returns], ["상태 변경", lesson.stateChange], ["이벤트", lesson.event]];
  return el("main", {},
    el("section", { className: "page-hero function-hero" },
      backLink,
      el("p", { className: "eyebrow function-step-label", text: "STEP 2 · 함수 실습" }),
      el("div", { className: `function-badge ${lesson.kind.toLowerCase()}`, text: lesson.kind }),
      el("h1", { text: lesson.name }),
      el("code", { className: "signature", text: lesson.signature }),
      el("p", { className: "hero-lead", text: lesson.analogy }),
      el("div", { className: "simulation-banner" }, el("strong", { text: "SIMULATION" }), el("span", { text: "실제 블록체인에는 기록되지 않습니다." })),
    ),
    el("section", { className: "section lab-layout" },
      el("aside", { className: "lesson-facts card" },
        el("h2", { text: "함수 한눈에 보기" }),
        ...factRows.map(([term, description]) => el("div", { className: "fact-row" }, el("span", { text: term }), el("strong", { text: description }))),
        el("p", { className: lesson.kind === "READ" ? "read-note" : "write-note", text: lesson.kind === "READ" ? "READ · 가스비 없음 · 상태 변경 없음" : "WRITE · 실제 네트워크에서는 지갑 서명과 테스트넷 가스 필요" }),
      ),
      el("section", { className: "lab-panel card" }, el("p", { className: "eyebrow", text: "TRY IT" }), el("h2", { text: "함수 실행" }), execution),
    ),
    el("section", { className: "section code-section" }, renderCodeViewer(lesson), eventContainer),
  );
}
