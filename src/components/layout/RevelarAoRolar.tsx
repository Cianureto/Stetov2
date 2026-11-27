import { useEffect, type RefObject } from "react";

/** O que entra animado ao rolar: cartões (menos os KPIs, que têm entrada própria) e o que tiver `data-revelar`. */
const SELETOR = ".card:not(.kpi), [data-revelar]";

/**
 * Animação de rolagem do app (computador e celular): cartões e linhas que estão abaixo da dobra entram subindo e
 * aparecendo quando chegam na tela (uma vez só), em sequência curta quando vários chegam juntos. O que já está
 * visível quando aparece não se mexe. Observa a área de conteúdo inteira (inclusive o que chega depois, como
 * linhas carregadas da API). Sem IntersectionObserver ou com "reduzir movimento", não faz nada.
 */
export function RevelarAoRolar({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const area = raiz.current;
    if (!area || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entradas) => {
        let ordem = 0;
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const alvo = e.target as HTMLElement;
          alvo.style.animationDelay = `${Math.min(ordem++, 8) * 45}ms`;
          alvo.classList.add("revelado");
          io.unobserve(alvo);
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.06 },
    );

    const preparar = (el: Element) => {
      if (!(el instanceof HTMLElement) || el.dataset.revelarVisto) return;
      el.dataset.revelarVisto = "1";
      // Já está na tela (ou acima dela): fica como está.
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add("revelar");
      io.observe(el);
    };

    area.querySelectorAll(SELETOR).forEach(preparar);
    const mo = new MutationObserver((mudancas) => {
      for (const m of mudancas)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches(SELETOR)) preparar(n);
          n.querySelectorAll(SELETOR).forEach(preparar);
        });
    });
    mo.observe(area, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [raiz]);
  return null;
}
