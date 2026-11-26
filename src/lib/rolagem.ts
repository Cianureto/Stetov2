/** Rola até o topo da lista, respeitando quem pediu menos movimento. */
export function rolarAte(elemento: HTMLElement | null) {
  if (!elemento || typeof elemento.scrollIntoView !== "function") return;
  const reduzir = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elemento.scrollIntoView({ block: "start", behavior: reduzir ? "auto" : "smooth" });
}
