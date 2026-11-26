import { createContext } from "react";

/**
 * Onde a seção do formulário está: na tela própria (seções viram cartões numerados) ou num modal (seções
 * seguidas, com divisor). Fica fora de moldura-formulario.tsx para o Fast Refresh (arquivo só com componentes).
 */
export const ContextoFormulario = createContext<"tela" | "modal">("modal");
