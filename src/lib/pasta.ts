// Animação "pasta do iOS" do menu Novo: o "+" do botão cresce até virar o painel (layoutId do framer-motion).
export type OrigemPasta = "lateral" | "abas";

export const idFundoPasta = (origem: OrigemPasta) => `pasta-${origem}-fundo`;

/** Mola da pasta: abre firme, sem quicar. */
export const MOLA_PASTA = { type: "spring", stiffness: 210, damping: 26, mass: 1 } as const;

/** Onde a busca foi aberta: o campo do cabeçalho (computador) ou a lupa (celular). O painel cresce de lá. */
export type OrigemBusca = "pc" | "cel";
export const idBusca = (origem: OrigemBusca) => `busca-${origem}`;

/** Degradês dos ícones "de app" do celular (pasta do Novo, menu Mais), nas cores das séries validadas do app. */
export const GRADIENTES_APP = [
  "linear-gradient(160deg, #3a6ef2, #1d4ed8)",
  "linear-gradient(160deg, #3fcbe0, #0e9fbf)",
  "linear-gradient(160deg, #9a80f0, #6d48dc)",
  "linear-gradient(160deg, #7cb8f8, #3a86e6)",
  "linear-gradient(160deg, #5b6b86, #2c3a55)",
];
