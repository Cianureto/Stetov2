import { z } from "zod";
import { rota } from "@/api/client";
import { supabase } from "@/api/supabase";
import type { Relatorio } from "@/api/types";
import { validar } from "@/api/validacao";

const competencia = z.string().regex(/^\d{4}-\d{2}-01$/, "Período inválido.");
const filtrosSchema = z.object({ de: competencia, ate: competencia, empresaContabil: z.uuid().optional() });

/**
 * Relatório completo das competências de `de` a `ate` (função relatorio_periodo): totais com o período anterior
 * para comparar, evolução mensal, tributos, descontos, pendências por idade, empresas, rankings (até 100) e contas.
 */
rota("GET", "/relatorios", async ({ query }): Promise<Relatorio> => {
  const f = validar(filtrosSchema, Object.fromEntries([...query.entries()].filter(([, v]) => v)), "Filtros inválidos.");
  const { data, error } = await supabase.rpc("relatorio_periodo", { p_de: f.de, p_ate: f.ate, p_empresa_contabil: f.empresaContabil });
  if (error) throw error;
  return data as unknown as Relatorio;
});
