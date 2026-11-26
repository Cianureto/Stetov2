/** Os 5 tributos retidos sobre a nota e o desconto padrão, nos campos da API (camelCase). */
export const ALIQUOTAS = [
  ["aliquotaPis", "PIS"],
  ["aliquotaCofins", "COFINS"],
  ["aliquotaCsll", "CSLL"],
  ["aliquotaIr", "IR"],
  ["aliquotaIss", "ISS"],
  ["descontoPadraoPercent", "Desconto padrão"],
] as const;

export type ValoresAliquotas = Record<(typeof ALIQUOTAS)[number][0], string>;
