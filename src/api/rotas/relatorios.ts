import { z } from "zod";
import { rota } from "@/api/client";
import { rankingRegistros, resumoRegistros } from "@/api/rotas/rankings";
import { supabase } from "@/api/supabase";
import type { Relatorio } from "@/api/types";
import { validar } from "@/api/validacao";

const filtrosSchema = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-01$/, "Período inválido.").optional(),
  ate: z.string().regex(/^\d{4}-\d{2}-01$/, "Período inválido.").optional(),
  empresaContabil: z.uuid().optional(),
});

/** Totais, rankings completos (até 100) e a evolução mensal de um período (competências de `de` a `ate`). */
rota("GET", "/relatorios", async ({ query }): Promise<Relatorio> => {
  const f = validar(filtrosSchema, Object.fromEntries([...query.entries()].filter(([, v]) => v)), "Filtros inválidos.");
  const [resumo, clientes, prestadores, serie] = await Promise.all([
    resumoRegistros(f),
    rankingRegistros("cliente", f, 100),
    rankingRegistros("prestador", f, 100),
    supabase.rpc("serie_mensal_registros", { p_meses: 24, p_empresa_contabil: f.empresaContabil }),
  ]);
  if (serie.error) throw serie.error;
  const pontos = (serie.data ?? [])
    .map((p) => ({ competencia: p.competencia, quantidade: Number(p.quantidade), valorNf: Number(p.valor_nf), repasse: Number(p.repasse) }))
    .filter((p) => (!f.de || p.competencia >= f.de) && (!f.ate || p.competencia <= f.ate));
  return { resumo, clientes, prestadores, serie: pontos };
});
