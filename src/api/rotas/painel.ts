import { api, rota } from "@/api/client";
import { contar } from "@/api/contagem";
import { rankingRegistros, resumoRegistros } from "@/api/rotas/rankings";
import { supabase } from "@/api/supabase";
import type { ListaContas, PainelGeral, Relatorio, ResumoContas } from "@/api/types";
import { hojeBrasilia } from "@/lib/contas";

const somarDias = (iso: string, dias: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

/** Tudo da Visão geral numa ida: mês atual, retenções do mês, pendências, contas, cadastros, evolução e tomadores de 12 meses. */
rota("GET", "/painel", async (): Promise<PainelGeral> => {
  const hoje = hojeBrasilia();
  const inicioMes = `${hoje.slice(0, 7)}-01`;
  const inicio12 = (() => {
    const d = new Date(`${inicioMes}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 11);
    return d.toISOString().slice(0, 10);
  })();
  const filtrosProximas = encodeURIComponent(JSON.stringify({ logica: "e", regras: [{ campo: "dataVencimento", op: "entre", valor: [hoje, somarDias(hoje, 7)] }] }));

  const [mes, pendenteTotal, contas, clientes, prestadores, empresasContabeis, provisorios, serie, retencoes, topClientes, proximas] = await Promise.all([
    resumoRegistros({ de: inicioMes, ate: inicioMes }),
    resumoRegistros({ situacao: "pendente" }),
    api.get<ResumoContas>("/contas/resumo"),
    contar("clientes", (q) => q.neq("status", "inativo")),
    contar("prestadores", (q) => q.eq("status", "ativo")),
    contar("empresas_contabeis", (q) => q.eq("status", "ativo")),
    contar("clientes", (q) => q.eq("status", "provisorio")),
    supabase.rpc("serie_mensal_registros", { p_meses: 12 }),
    supabase.rpc("relatorio_periodo", { p_de: inicioMes, p_ate: inicioMes }),
    rankingRegistros("cliente", { de: inicio12 }, 8),
    api.get<ListaContas>(`/contas?recorte=pagar&porPagina=6&filtros=${filtrosProximas}`),
  ]);
  if (serie.error) throw serie.error;
  if (retencoes.error) throw retencoes.error;
  const t = (retencoes.data as unknown as Relatorio).tributos;
  return {
    mes, pendenteTotal, contas,
    cadastros: { clientes, prestadores, empresasContabeis, provisorios },
    serie: (serie.data ?? []).map((p) => ({ competencia: p.competencia, quantidade: Number(p.quantidade), valorNf: Number(p.valor_nf), repasse: Number(p.repasse) })),
    retencoesMes: { iss: t.iss, ir: t.ir, csrf: t.pis + t.cofins + t.csll },
    topClientes,
    proximasContas: proximas.contas,
  };
});
