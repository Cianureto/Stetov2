// Animação "pasta do iOS" do menu Novo: o "+" do botão cresce até virar o painel (layoutId do framer-motion).
export type OrigemPasta = "lateral" | "abas";

export const idFundoPasta = (origem: OrigemPasta) => `pasta-${origem}-fundo`;

/** Mola da pasta: abre firme, sem quicar. */
export const MOLA_PASTA = { type: "spring", stiffness: 210, damping: 26, mass: 1 } as const;
