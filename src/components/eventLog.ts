import type { SimulationEvent } from "../erc20/simulator";
import { el } from "../utils/dom";
import { shortenAddress } from "../utils/format";

export function renderEventLog(events: readonly SimulationEvent[]): HTMLElement {
  const list = el("div", { className: "event-list" });
  if (!events.length) list.append(el("p", { className: "muted", text: "아직 발생한 이벤트가 없습니다." }));
  events.slice().reverse().forEach((event) => {
    const transfer = event.name === "Transfer";
    list.append(el("article", { className: "event-item" },
      el("div", { className: "event-icon", text: transfer ? "↗" : "✓" }),
      el("div", {},
        el("strong", { text: `${event.name} 이벤트` }),
        el("p", { text: transfer
          ? `${shortenAddress(event.from)} → ${shortenAddress(event.to)} · ${event.value} LAB`
          : `${shortenAddress(event.owner)} → ${shortenAddress(event.spender)} · ${event.value} LAB 승인` }),
      ),
    ));
  });
  return el("section", { className: "card event-panel" }, el("h3", { text: "이벤트 로그" }), list);
}
