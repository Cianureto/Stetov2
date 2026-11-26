import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { processarImportacao } from "@/api/importar";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { Importacao, ListaImportacoes } from "@/api/types";
import { validar } from "@/api/validacao";
import type { Tables } from "@/lib/database.types";

const paraResposta = (h: Tables<"historico_importacoes">): Importacao => {
  let erros: Importacao["erros"] = [];
  try {
    erros = h.relatorio_erros ? JSON.parse(h.relatorio_erros) : [];
  } catch {
    erros = [];
  }
  return {
    id: h.id, tipo: h.tipo, nomeArquivo: h.nome_arquivo, totalLinhas: h.total_linhas, importadas: h.importadas, falhadas: h.falhadas,
    novosCadastros: h.novos_cadastros, status: h.status, erros, criadoEm: h.created_at,
  };
};

const CAMPOS: Campos = {
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
  nomeArquivo: { coluna: "nome_arquivo", tipo: "texto", busca: "texto" },
  tipo: { coluna: "tipo", tipo: "opcoes" },
  status: { coluna: "status", tipo: "opcoes" },
  importadas: { coluna: "importadas", tipo: "numero" },
  falhadas: { coluna: "falhadas", tipo: "numero" },
};

rota("GET", "/importacoes", async ({ query }): Promise<ListaImportacoes> => {
  const { itens, meta } = await listarNoBanco(() => supabase.from("historico_importacoes").select("*", { count: "exact" }), lerConsulta(query, CAMPOS, "-criadoEm"));
  return { importacoes: itens.map(paraResposta), meta };
});

const importacaoSchema = z.object({
  tipo: z.enum(["registros_financeiros", "clientes", "prestadores", "empresas_contabeis"]),
  nomeArquivo: z.string().trim().min(1).max(200),
  linhas: z.array(z.record(z.string(), z.unknown())).min(1, "O arquivo não tem linhas.").max(10_000, "No máximo 10.000 linhas por importação: divida o arquivo."),
  criarFaltantes: z.boolean().default(false),
});

/** Grava o histórico, processa as linhas e fecha o histórico com as contagens e os erros por linha. */
rota("POST", "/importacoes", async ({ corpo }): Promise<Importacao> => {
  const d = validar(importacaoSchema, corpo);
  const { data: h, error } = await supabase
    .from("historico_importacoes")
    .insert({ tipo: d.tipo, nome_arquivo: d.nomeArquivo, total_linhas: d.linhas.length, status: "falha" })
    .select("id")
    .single();
  if (error) throw error;
  const r = await processarImportacao(d.tipo, d.linhas, h.id, d.criarFaltantes);
  const status = r.falhadas === 0 ? "sucesso" : r.importadas === 0 ? "falha" : "parcial";
  const { data: fechado, error: e2 } = await supabase
    .from("historico_importacoes")
    .update({ importadas: r.importadas, falhadas: r.falhadas, novos_cadastros: r.novosCadastros, status, relatorio_erros: r.erros.length ? JSON.stringify(r.erros.slice(0, 5000)) : null })
    .eq("id", h.id)
    .select("*")
    .single();
  if (e2) throw e2;
  return paraResposta(fechado);
});

/** Desfaz: apaga o que a importação criou (registros primeiro, depois os cadastros) e o histórico. */
rota("DELETE", "/importacoes/:id", async ({ params }) => {
  const { data: h, error } = await supabase.from("historico_importacoes").select("id").eq("id", params.id).maybeSingle();
  if (error) throw error;
  if (!h) throw erroHttp(404, "Importação não encontrada.");
  const apagados: Record<string, number> = {};
  for (const tabela of ["registros_financeiros", "clientes", "prestadores", "empresas_contabeis"] as const) {
    const { error: e, count } = await supabase.from(tabela).delete({ count: "exact" }).eq("importacao_id", params.id);
    if (e?.code === "23503") throw erroHttp(409, "Há registros lançados depois usando cadastros desta importação. Exclua esses registros antes de desfazer.");
    if (e) throw e;
    apagados[tabela] = count ?? 0;
  }
  const { error: e3 } = await supabase.from("historico_importacoes").delete().eq("id", params.id);
  if (e3) throw e3;
  return { apagados };
});
