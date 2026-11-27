import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { reduzMovimento } from "@/lib/gsap";

/**
 * Rolagem suave da página no computador (Lenis): a roda do mouse e o trackpad deslizam com inércia em vez de
 * pular. No toque (celular/tablet) fica a rolagem nativa, que já é suave. Listas e painéis com rolagem própria
 * (seletor, busca, menus, tabela larga) continuam rolando por conta própria; com uma janela aberta (o Radix trava
 * a página com `data-scroll-locked`), a rolagem suave para. Desliga com "reduzir movimento".
 */
export function useRolagemSuave() {
  useEffect(() => {
    if (reduzMovimento() || window.matchMedia?.("(pointer: coarse)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: -96 },
      allowNestedScroll: true,
      prevent: (no) => !!no.closest?.('[data-lenis-prevent], [role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]'),
    });
    const travas = new MutationObserver(() => (document.body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start()));
    travas.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => {
      travas.disconnect();
      lenis.destroy();
    };
  }, []);
}
