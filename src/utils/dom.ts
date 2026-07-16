export type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    className?: string;
    text?: string;
    attrs?: Record<string, string>;
    on?: Partial<Record<keyof HTMLElementEventMap, EventListener>>;
  } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  Object.entries(options.attrs ?? {}).forEach(([name, value]) => node.setAttribute(name, value));
  Object.entries(options.on ?? {}).forEach(([name, handler]) => {
    if (handler) node.addEventListener(name, handler);
  });
  children.filter(Boolean).forEach((child) => node.append(child instanceof Node ? child : document.createTextNode(String(child))));
  return node;
}

export function replaceChildren(parent: Element, ...children: Node[]): void {
  parent.replaceChildren(...children);
}

export function field(
  label: string,
  control: HTMLInputElement | HTMLSelectElement,
  hint?: string,
): HTMLElement {
  if (!control.id) control.id = `field-${crypto.randomUUID()}`;
  const labelNode = el("label", { text: label, attrs: { for: control.id } });
  const wrapper = el("div", { className: "field" }, labelNode, control);
  if (hint) wrapper.append(el("small", { text: hint }));
  return wrapper;
}

export function button(label: string, options: { className?: string; action?: string; onClick?: () => void } = {}): HTMLButtonElement {
  const node = el("button", {
    className: options.className ?? "button",
    text: label,
    attrs: { type: "button", ...(options.action ? { "data-action": options.action } : {}) },
  });
  if (options.onClick) node.addEventListener("click", options.onClick);
  return node;
}

export function routeLink(label: string, href: string, className?: string): HTMLAnchorElement {
  return el("a", { ...(className ? { className } : {}), text: label, attrs: { href, "data-link": "" } });
}
