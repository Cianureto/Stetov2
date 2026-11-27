// Animação "pasta do iOS" do menu Novo: o botão guarda uma miniatura com os ícones das ações; ao abrir, a
// miniatura cresce até virar o painel e cada ícone voa para o seu cartão (layoutId do framer-motion).
export type OrigemPasta = "lateral" | "abas";

export const idFundoPasta = (origem: OrigemPasta) => `pasta-${origem}-fundo`;
export const idIconePasta = (origem: OrigemPasta, i: number) => `pasta-${origem}-icone-${i}`;

/** Mola da pasta: abre firme, sem quicar. */
export const MOLA_PASTA = { type: "spring", stiffness: 210, damping: 26, mass: 1 } as const;
