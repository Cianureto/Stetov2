import { supabase } from "@/api/supabase";
import type { LinhaRanking, ResumoRegistros } from "@/api/types";

/** Filtros comuns dos totais de registros (todos opcionais; datas em AAAA-MM-DD). */
export type FiltrosResumo = {
  situacao?: "pendente" | "pago" | "cancelado";
  cliente?: string;
  prestador?: string;
  empresaContabil?: string;
  de?: string;
  ate?: string;
};

export async function resumoRegistros(f: FiltrosResumo = {}): Promise<ResumoRegistros> {
  const { data, error } = await supabase.rpc("resumo_registros", {
    p_situacao: f.situacao, p_cliente: f.cliente, p_prestador: f.prestador, p_empresa_contabil: f.empresaContabil, p_de: f.de, p_ate: f.ate,
  });
  if (error) throw error;
  const r = data as Record<string, number>;
  return {
    quantidade: Number(r.quantidade), valorNf: Number(r.valorNf), tributos: Number(r.tributos), repasse: Number(r.repasse),
    repassePago: Number(r.repassePago), repassePendente: Number(r.repassePendente), pendentes: Number(r.pendentes), pagos: Number(r.pagos), cancelados: Number(r.cancelados),
  };
}

export async function rankingRegistros(por: "cliente" | "prestador", f: Pick<FiltrosResumo, "de" | "ate" | "empresaContabil"> = {}, limite = 10): Promise<LinhaRanking[]> {
  const { data, error } = await supabase.rpc("ranking_registros", { p_por: por, p_de: f.de, p_ate: f.ate, p_empresa_contabil: f.empresaContabil, p_limite: limite });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id, nome: l.nome, quantidade: Number(l.quantidade), valorNf: Number(l.valor_nf), repasse: Number(l.repasse),
    repassePago: Number(l.repasse_pago), repassePendente: Number(l.repasse_pendente),
  }));
}
