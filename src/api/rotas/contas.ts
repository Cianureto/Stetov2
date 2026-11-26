import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { Conta, ContaDetalhe, ListaContas, ResumoContas } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";
import { hojeBrasilia, valorFinalConta, vencimentosMensais, type Ajuste } from "@/lib/contas";
import type { Tables } from "@/lib/database.types";

type Linha = Tables<"contas"> & {
  categoria: { id: string; nome: string } | null;
  subcategoria: { id: string; nome: string } | null;
  empresa_contabil: { id: string; razao_social: string; nome_fantasia: string | null } | null;
};
const SELECT = "*, categoria:categorias_contas(id, nome), subcategoria:subcategorias_contas(id, nome), empresa_contabil:empresas_contabeis(id, razao_social, nome_fantasia)";

const paraResposta = (c: Linha): Conta => ({
  id: c.id,
  descricao: c.descricao,
  tipo: c.tipo,
  categoria: c.categoria,
  subcategoria: c.subcategoria,
  empresaContabil: c.empresa_contabil ? { id: c.empresa_contabil.id, nome: c.empresa_contabil.nome_fantasia || c.empresa_contabil.razao_social } : null,
  valorBase: Number(c.valor_base),
  ajustes: Array.isArray(c.ajustes) ? (c.ajustes as Ajuste[]) : [],
  valor: Number(c.valor),
  dataVencimento: c.data_vencimento,
  dataPagamento: c.data_pagamento,
  status: c.status === "pago" ? "pago" : "pendente",
  bancoPagamento: c.banco_pagamento_nome,
  observacao: c.observacao,
  recorrente: c.recorrente,
  grupoRecorrencia: c.grupo_recorrencia,
  criadoEm: c.created_at,
});

export const CAMPOS_CONTAS: Campos = {
  dataVencimento: { coluna: "data_vencimento", tipo: "data" },
  descricao: { coluna: "descricao", tipo: "texto", busca: "texto" },
  observacao: { coluna: "observacao", tipo: "texto", busca: "texto" },
  tipo: { coluna: "tipo", tipo: "opcoes" },
  categoria: { coluna: "categoria(nome)", tipo: "texto" },
  categoriaId: { coluna: "categoria_id", tipo: "opcoes" },
  empresaContabilId: { coluna: "empresa_contabil_id", tipo: "opcoes" },
  valor: { coluna: "valor", tipo: "moeda" },
  status: { coluna: "status", tipo: "opcoes" },
  dataPagamento: { coluna: "data_pagamento", tipo: "data" },
  recorrente: { coluna: "recorrente", tipo: "booleano" },
  bancoPagamento: { coluna: "banco_pagamento_nome", tipo: "texto" },
};

const ajusteSchema = z.object({ tipo: z.enum(["juros", "multa", "desconto"]), modo: z.enum(["valor", "percentual"]), valor: z.number().min(0).max(99_999_999) });
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const contaSchema = z
  .object({
    descricao: z.string().trim().min(2, "Informe a descrição.").max(200),
    tipo: z.enum(["pagar", "receber"]),
    categoriaId: z.uuid("Escolha a categoria."),
    subcategoriaId: z.uuid().nullish().transform((v) => v ?? null),
    empresaContabilId: z.uuid().nullish().transform((v) => v ?? null),
    valorBase: z.number({ error: "Informe o valor." }).positive("Informe o valor.").max(99_999_999),
    ajustes: z.array(ajusteSchema).max(10),
    dataVencimento: data,
    dataPagamento: data.nullish().transform((v) => v || null),
    status: z.enum(["pendente", "pago"]),
    bancoPagamento: z.string().trim().max(80).nullish().transform((v) => v || null),
    observacao: z.string().trim().max(1000).nullish().transform((v) => v || null),
    recorrente: z.boolean(),
  })
  .refine((c) => !(c.status === "pago" || c.dataPagamento) || !!c.bancoPagamento, { path: ["bancoPagamento"], message: "Informe o banco do pagamento." });

const paraBanco = (d: z.infer<typeof contaSchema>) => ({
  descricao: d.descricao,
  tipo: d.tipo,
  categoria_id: d.categoriaId,
  subcategoria_id: d.subcategoriaId,
  empresa_contabil_id: d.empresaContabilId,
  valor_base: d.valorBase,
  ajustes: d.ajustes,
  valor: valorFinalConta(d.valorBase, d.ajustes),
  data_vencimento: d.dataVencimento,
  data_pagamento: d.dataPagamento,
  status: d.status,
  banco_pagamento_nome: d.bancoPagamento,
  observacao: d.observacao,
  recorrente: d.recorrente,
});

async function carregar(id: string): Promise<ContaDetalhe> {
  const { data: linha, error } = await supabase.from("contas").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!linha) throw erroHttp(404, "Conta não encontrada.");
  const conta = paraResposta(linha as unknown as Linha);
  if (!conta.grupoRecorrencia) return { ...conta, serie: [] };
  const { data: serie, error: e2 } = await supabase.from("contas").select("id, data_vencimento, valor, status").eq("grupo_recorrencia", conta.grupoRecorrencia).order("data_vencimento");
  if (e2) throw e2;
  return { ...conta, serie: serie.map((p) => ({ id: p.id, dataVencimento: p.data_vencimento, valor: Number(p.valor), status: p.status === "pago" ? "pago" : "pendente" })) };
}

rota("GET", "/contas", async ({ query }): Promise<ListaContas> => {
  const consulta = lerConsulta(query, CAMPOS_CONTAS, "dataVencimento");
  const recorte = validar(z.enum(["abertas", "pagar", "receber", "vencidas", "pagas"]).optional(), query.get("recorte") ?? undefined, "Recorte inválido.");
  const hoje = hojeBrasilia();
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("contas").select(SELECT, { count: "exact" });
    if (recorte === "abertas") return q.neq("status", "pago");
    if (recorte === "pagar" || recorte === "receber") return q.eq("tipo", recorte).neq("status", "pago");
    if (recorte === "vencidas") return q.neq("status", "pago").lt("data_vencimento", hoje);
    if (recorte === "pagas") return q.eq("status", "pago");
    return q;
  }, consulta);
  return { contas: (itens as unknown as Linha[]).map(paraResposta), meta };
});

rota("GET", "/contas/resumo", async ({ query }): Promise<ResumoContas> => {
  const { data: r, error } = await supabase.rpc("resumo_contas", { p_de: query.get("de") ?? undefined, p_ate: query.get("ate") ?? undefined });
  if (error) throw error;
  const v = r as Record<string, number>;
  return { aPagar: Number(v.aPagar), aReceber: Number(v.aReceber), pagoNoPeriodo: Number(v.pagoNoPeriodo), vencidas: Number(v.vencidas), valorVencido: Number(v.valorVencido), vencemEm7Dias: Number(v.vencemEm7Dias), total: Number(v.total) };
});

rota("GET", "/contas/:id", ({ params }) => carregar(params.id));

/** Recorrente: cria 12 parcelas mensais da mesma série (só a primeira mantém o pagamento informado). */
rota("POST", "/contas", async ({ corpo }) => {
  const d = validar(contaSchema, corpo);
  const base = paraBanco(d);
  if (!d.recorrente) {
    const { data: nova, error } = await supabase.from("contas").insert(base).select("id").single();
    if (error) throw error;
    return carregar(nova.id);
  }
  const grupo = crypto.randomUUID();
  const parcelas = vencimentosMensais(d.dataVencimento).map((venc, i) => ({
    ...base,
    data_vencimento: venc,
    grupo_recorrencia: grupo,
    ...(i > 0 ? { status: "pendente" as const, data_pagamento: null, banco_pagamento_nome: null } : {}),
  }));
  const { data: criadas, error } = await supabase.from("contas").insert(parcelas).select("id, data_vencimento").order("data_vencimento");
  if (error) throw error;
  return carregar(criadas[0].id);
});

rota("PATCH", "/contas/:id", async ({ params, corpo }) => {
  const d = validar(contaSchema, corpo);
  const { error, count } = await supabase.from("contas").update(paraBanco(d), { count: "exact" }).eq("id", params.id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Conta não encontrada.");
  return carregar(params.id);
});

async function excluir(id: string) {
  const { error, count } = await supabase.from("contas").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Conta não encontrada.");
}

rota("DELETE", "/contas/:id", async ({ params }) => {
  await excluir(params.id);
  return { ok: true };
});

/** Parcelas futuras ainda não pagas da série (a partir de amanhã). */
rota("DELETE", "/contas/:id/serie-futura", async ({ params }) => {
  const conta = await carregar(params.id);
  if (!conta.grupoRecorrencia) throw erroHttp(400, "Esta conta não faz parte de uma série recorrente.");
  const { error, count } = await supabase.from("contas").delete({ count: "exact" }).eq("grupo_recorrencia", conta.grupoRecorrencia).neq("status", "pago").gt("data_vencimento", hojeBrasilia());
  if (error) throw error;
  return { excluidas: count ?? 0 };
});

async function mudarStatus(id: string, status: "pendente" | "pago") {
  const { data: c, error } = await supabase.from("contas").select("data_pagamento, banco_pagamento_nome").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!c) throw erroHttp(404, "Conta não encontrada.");
  if (status === "pago" && !c.banco_pagamento_nome) throw erroHttp(400, "Informe o banco do pagamento na conta antes de marcar como paga.");
  const dados = status === "pago" ? { status, data_pagamento: c.data_pagamento ?? hojeBrasilia() } : { status, data_pagamento: null };
  const { error: e2 } = await supabase.from("contas").update(dados).eq("id", id);
  if (e2) throw e2;
}

const emMassaSchema = z.object({ acao: z.enum(["pagar", "pendente", "excluir"]), ids: z.array(z.uuid()).min(1, "Selecione ao menos uma conta.").max(100, "No máximo 100 por vez.") });

rota("POST", "/contas/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(emMassaSchema, corpo);
  return executarEmMassa(ids, (id) => (acao === "excluir" ? excluir(id) : mudarStatus(id, acao === "pagar" ? "pago" : "pendente")));
});
