export interface RouteContext {
  path: string;
  params: Record<string, string>;
}

export type RouteHandler = (context: RouteContext) => void;

export interface RouteDefinition {
  pattern: RegExp;
  keys?: string[];
  handler: RouteHandler;
}

export function createRouter(routes: RouteDefinition[]) {
  const render = (path = window.location.pathname) => {
    for (const route of routes) {
      const match = path.match(route.pattern);
      if (!match) continue;
      const params = Object.fromEntries((route.keys ?? []).map((key, index) => [key, match[index + 1] ?? ""]));
      route.handler({ path, params });
      return;
    }
    routes[0]?.handler({ path: "/", params: {} });
  };

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    render(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clickHandler = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-link]") : null;
    if (!target || target.target === "_blank" || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    navigate(target.pathname);
  };

  window.addEventListener("popstate", () => render());
  document.addEventListener("click", clickHandler);
  return { render, navigate, destroy: () => document.removeEventListener("click", clickHandler) };
}
