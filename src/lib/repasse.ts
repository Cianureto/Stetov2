// Cálculo de um registro financeiro (regra do app antigo, agora num lugar só e testada).
//  - Tributos: percentuais por nota (padrão: os do cliente; cliente pessoa física = 0). Cada valor é
//    NF × % / 100, arredondado em centavos; o total é a soma dos valores. São informativos: não saem do repasse.
//  - Desconto padrão: NF × % do prestador / 100.
//  - Repasse = NF − desconto padrão − desconto adicional + acréscimo (não pode ficar negativo).

export const TRIBUTOS = ["pis", "cofins", "csll", "ir", "iss"] as const;
export type Tributo = (typeof TRIBUTOS)[number];
export type Aliquotas = Record<Tributo, number>;

export const ROTULO_TRIBUTO: Record<Tributo, string> = { pis: "PIS", cofins: "COFINS", csll: "CSLL", ir: "IR", iss: "ISS" };
export const SEM_TRIBUTOS: Aliquotas = { pis: 0, cofins: 0, csll: 0, ir: 0, iss: 0 };

/** Centavos, arredondando meio centavo para cima (sem o erro de ponto flutuante de 1.005 → 1.00). */
export const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export type EntradaRepasse = {
  valorNf: number;
  aliquotas: Aliquotas;
  descontoPadraoPercent: number;
  descontoAdicional: number;
  acrescimo: number;
};

export type CalculoRepasse = {
  tributos: Record<Tributo, number>;
  valorTotalTributos: number;
  /** NF menos os tributos (o que o cliente efetivamente paga, informativo). */
  valorLiquido: number;
  descontoPadraoAplicado: number;
  valorFinalRepasse: number;
};

export function calcularRepasse(e: EntradaRepasse): CalculoRepasse {
  const nf = centavos(e.valorNf || 0);
  const tributos = Object.fromEntries(TRIBUTOS.map((t) => [t, centavos((nf * (e.aliquotas[t] || 0)) / 100)])) as Record<Tributo, number>;
  const valorTotalTributos = centavos(TRIBUTOS.reduce((s, t) => s + tributos[t], 0));
  const descontoPadraoAplicado = centavos((nf * (e.descontoPadraoPercent || 0)) / 100);
  const valorFinalRepasse = centavos(nf - descontoPadraoAplicado - (e.descontoAdicional || 0) + (e.acrescimo || 0));
  return { tributos, valorTotalTributos, valorLiquido: centavos(nf - valorTotalTributos), descontoPadraoAplicado, valorFinalRepasse };
}

/** Alíquotas padrão da nota a partir do cliente (pessoa física não tem retenção). */
export function aliquotasDoCliente(c: { tipoPessoa: "PJ" | "PF"; aliquotaPis: number; aliquotaCofins: number; aliquotaCsll: number; aliquotaIr: number; aliquotaIss: number }): Aliquotas {
  if (c.tipoPessoa === "PF") return { ...SEM_TRIBUTOS };
  return { pis: c.aliquotaPis, cofins: c.aliquotaCofins, csll: c.aliquotaCsll, ir: c.aliquotaIr, iss: c.aliquotaIss };
}

/** "2026-11" ou "11/2026" → "2026-11-01" (competência gravada no 1º dia do mês). null se inválido. */
export function competenciaParaBanco(v: string): string | null {
  const texto = v.trim();
  const iso = /^(\d{4})-(\d{2})$/.exec(texto);
  const br = /^(\d{2})\/(\d{4})$/.exec(texto);
  const [ano, mes] = iso ? [iso[1], iso[2]] : br ? [br[2], br[1]] : [null, null];
  if (!ano || !mes) return null;
  if (Number(mes) < 1 || Number(mes) > 12 || Number(ano) < 2000 || Number(ano) > 2100) return null;
  return `${ano}-${mes}-01`;
}

/** "2026-11-01" → "11/2026". */
export const competenciaParaTela = (iso: string | null | undefined) => (iso ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** "2026-11-01" → "nov/2026". */
export const competenciaCurta = (iso: string | null | undefined) => (iso ? `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}` : "—");
