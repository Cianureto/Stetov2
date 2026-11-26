import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** id do <main> de cada layout (destino do "Pular para o conteúdo"). */
export const ID_CONTEUDO = "conteudo";

/**
 * Ao trocar de tela, leva o foco para o conteúdo principal: leitores de tela anunciam a página nova e o
 * Tab recomeça no conteúdo, não no menu. Não rola a página nem age no primeiro carregamento.
 */
export function useFocoNoConteudoAoNavegar() {
  const { pathname } = useLocation();
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    document.getElementById(ID_CONTEUDO)?.focus({ preventScroll: true });
  }, [pathname]);
}
