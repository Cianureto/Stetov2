// Regras das contas a pagar e receber (as do app antigo, num lugar só e testadas).

export type TipoAjuste = "juros" | "multa" | "desconto";
export type ModoAjuste = "valor" | "percentual";
export type Ajuste = { tipo: TipoAjuste; modo: ModoAjuste; valor: number };

export const ROTULO_AJUSTE: Record<TipoAjuste, string> = { juros: "Juros", multa: "Multa", desconto: "Desconto" };

const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

/**
 * Valor final: os ajustes valem em sequência sobre o total corrente; percentual é sobre esse total.
 * Desconto nunca leva abaixo de zero.
 */
export function valorFinalConta(valorBase: number, ajustes: Ajuste[] = []): number {
  let total = valorBase || 0;
  for (const a of ajustes) {
    const delta = a.modo === "percentual" ? total * ((a.valor || 0) / 100) : a.valor || 0;
    total = a.tipo === "desconto" ? Math.max(0, total - delta) : total + delta;
  }
  return centavos(total);
}

/** Datas ISO de n parcelas mensais a partir da primeira; dia 31 vira o último dia dos meses mais curtos. */
export function vencimentosMensais(primeira: string, n = 12): string[] {
  const [ano, mes, dia] = primeira.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const alvo = new Date(Date.UTC(ano, mes - 1 + i, 1));
    const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
    alvo.setUTCDate(Math.min(dia, ultimoDia));
    return alvo.toISOString().slice(0, 10);
  });
}

export type SituacaoConta = "paga" | "vencida" | "vence_hoje" | "a_vencer";

/** Situação vista pelo usuário (o banco guarda só pendente/pago). `hoje` em AAAA-MM-DD. */
export function situacaoConta(c: { status: string; dataVencimento: string }, hoje: string): SituacaoConta {
  if (c.status === "pago") return "paga";
  if (c.dataVencimento < hoje) return "vencida";
  if (c.dataVencimento === hoje) return "vence_hoje";
  return "a_vencer";
}

/** Hoje no fuso de Brasília (AAAA-MM-DD). */
export const hojeBrasilia = (agora = Date.now()) => new Date(agora - 3 * 3600_000).toISOString().slice(0, 10);
