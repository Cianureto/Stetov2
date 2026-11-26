import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { resumoRegistros } from "@/api/rotas/rankings";
import { supabase } from "@/api/supabase";
import type { ListaRegistros, Registro } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";
import type { Tables } from "@/lib/database.types";
import { calcularRepasse, competenciaParaBanco } from "@/lib/repasse";

type Linha = Tables<"registros_financeiros"> & {
  cliente: { id: string; razao_social: string; tipo_pessoa: "PJ" | "PF" } | null;
  prestador: { id: string; nome_completo: string } | null;
  empresa_contabil: { id: string; razao_social: string; nome_fantasia: string | null } | null;
};

const SELECT =
  "*, cliente:clientes(id, razao_social, tipo_pessoa), prestador:prestadores(id, nome_completo), empresa_contabil:empresas_contabeis(id, razao_social, nome_fantasia)";

const n = Number;
const paraResposta = (r: Linha): Registro => ({
  id: r.id,
  cliente: { id: r.cliente_id, razaoSocial: r.cliente?.razao_social ?? "—", tipoPessoa: r.cliente?.tipo_pessoa ?? "PJ" },
  prestador: { id: r.prestador_id, nomeCompleto: r.prestador?.nome_completo ?? "—" },
  empresaContabil: { id: r.empresa_contabil_id, nome: r.empresa_contabil?.nome_fantasia || r.empresa_contabil?.razao_social || "—" },
  numeroNfs: r.numero_nfs,
  competencia: r.competencia,
  dataPagamento: r.data_pagamento,
  situacao: r.situacao,
  tipoPagamento: r.tipo_pagamento,
  setor: r.setor,
  valorNf: n(r.valor_nf),
  aliquotas: { pis: n(r.aliquota_pis), cofins: n(r.aliquota_cofins), csll: n(r.aliquota_csll), ir: n(r.aliquota_ir), iss: n(r.aliquota_iss) },
  valorTotalTributos: n(r.valor_total_tributos),
  descontoPadraoPercent: n(r.desconto_padrao_percent),
  descontoPadraoAplicado: n(r.desconto_padrao_aplicado),
  descontoAdicional: n(r.desconto_adicional),
  acrescimo: n(r.acrescimo),
  valorFinalRepasse: n(r.valor_final_repasse),
  banco: r.banco,
  agencia: r.agencia,
  conta: r.conta,
  tipoConta: r.tipo_conta,
  chavePix: r.chave_pix,
  criadoEm: r.created_at,
});

/** Lista branca. Cliente/prestador/empresa ordenam pelo nome (to-one embutido) e filtram pelo id (opções). */
export const CAMPOS_REGISTROS: Campos = {
  competencia: { coluna: "competencia", tipo: "data" },
  cliente: { coluna: "cliente(razao_social)", tipo: "texto" },
  prestador: { coluna: "prestador(nome_completo)", tipo: "texto" },
  empresaContabil: { coluna: "empresa_contabil(razao_social)", tipo: "texto" },
  clienteId: { coluna: "cliente_id", tipo: "opcoes" },
  prestadorId: { coluna: "prestador_id", tipo: "opcoes" },
  empresaContabilId: { coluna: "empresa_contabil_id", tipo: "opcoes" },
  numeroNfs: { coluna: "numero_nfs", tipo: "texto", busca: "texto" },
  setor: { coluna: "setor", tipo: "texto", busca: "texto" },
  situacao: { coluna: "situacao", tipo: "opcoes" },
  tipoPagamento: { coluna: "tipo_pagamento", tipo: "opcoes" },
  dataPagamento: { coluna: "data_pagamento", tipo: "data" },
  valorNf: { coluna: "valor_nf", tipo: "moeda" },
  valorFinalRepasse: { coluna: "valor_final_repasse", tipo: "moeda" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

const dinheiro = (rotulo: string) => z.number({ error: `${rotulo}: informe um valor.` }).min(0, `${rotulo}: não pode ser negativo.`).max(99_999_999);
const percentual = (rotulo: string) => z.number().min(0, `${rotulo}: não pode ser negativo.`).max(100, `${rotulo}: no máximo 100%.`);
const dataOpcional = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.").nullish().transform((v) => v || null);

export const registroSchema = z.object({
  clienteId: z.uuid("Escolha o cliente."),
  prestadorId: z.uuid("Escolha o prestador."),
  empresaContabilId: z.uuid("Escolha a empresa contábil."),
  competencia: z.string().transform((v, ctx) => {
    const iso = competenciaParaBanco(v);
    if (!iso) ctx.addIssue({ code: "custom", message: "Competência inválida. Use MM/AAAA." });
    return iso ?? "";
  }),
  numeroNfs: z.string().trim().max(40).nullish().transform((v) => v || null),
  setor: z.string().trim().max(80).nullish().transform((v) => v || null),
  situacao: z.enum(["pendente", "pago", "cancelado"]),
  tipoPagamento: z.enum(["banco", "caixa"]).nullish().transform((v) => v ?? null),
  dataPagamento: dataOpcional,
  valorNf: dinheiro("Valor da NF").refine((v) => v > 0, "Informe o valor da NF."),
  aliquotas: z.object({ pis: percentual("PIS"), cofins: percentual("COFINS"), csll: percentual("CSLL"), ir: percentual("IR"), iss: percentual("ISS") }),
  descontoAdicional: dinheiro("Desconto adicional"),
  acrescimo: dinheiro("Acréscimo"),
});

/** Monta a linha do banco: o servidor recalcula tributos e repasse e copia o desconto e a conta do prestador. */
async function montar(d: z.infer<typeof registroSchema>, anterior?: Linha) {
  const { data: p, error } = await supabase
    .from("prestadores")
    .select("desconto_padrao_percent, banco, agencia, conta, tipo_conta, chave_pix")
    .eq("id", d.prestadorId)
    .maybeSingle();
  if (error) throw error;
  if (!p) throw erroHttp(400, "Prestador não encontrado.");
  // Mesmo prestador numa edição: mantém o % e a conta gravados no lançamento.
  const mesmo = anterior && anterior.prestador_id === d.prestadorId;
  const descontoPercent = mesmo ? n(anterior.desconto_padrao_percent) : n(p.desconto_padrao_percent);
  const c = calcularRepasse({ valorNf: d.valorNf, aliquotas: d.aliquotas, descontoPadraoPercent: descontoPercent, descontoAdicional: d.descontoAdicional, acrescimo: d.acrescimo });
  if (c.valorFinalRepasse < 0) throw erroHttp(400, "O repasse ficou negativo: confira o desconto adicional.");
  return {
    cliente_id: d.clienteId,
    prestador_id: d.prestadorId,
    empresa_contabil_id: d.empresaContabilId,
    competencia: d.competencia,
    numero_nfs: d.numeroNfs,
    setor: d.setor,
    situacao: d.situacao,
    tipo_pagamento: d.tipoPagamento,
    data_pagamento: d.dataPagamento,
    valor_nf: d.valorNf,
    aliquota_pis: d.aliquotas.pis, aliquota_cofins: d.aliquotas.cofins, aliquota_csll: d.aliquotas.csll, aliquota_ir: d.aliquotas.ir, aliquota_iss: d.aliquotas.iss,
    valor_pis: c.tributos.pis, valor_cofins: c.tributos.cofins, valor_csll: c.tributos.csll, valor_ir: c.tributos.ir, valor_iss: c.tributos.iss,
    valor_total_tributos: c.valorTotalTributos,
    desconto_padrao_percent: descontoPercent,
    desconto_padrao_aplicado: c.descontoPadraoAplicado,
    desconto_adicional: d.descontoAdicional,
    acrescimo: d.acrescimo,
    valor_final_repasse: c.valorFinalRepasse,
    ...(mesmo ? {} : { banco: p.banco, agencia: p.agencia, conta: p.conta, tipo_conta: p.tipo_conta, chave_pix: p.chave_pix }),
  };
}

async function carregarLinha(id: string) {
  const { data, error } = await supabase.from("registros_financeiros").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Registro não encontrado.");
  return data as unknown as Linha;
}

/** Ids de clientes e prestadores cujo nome contém o termo (para a pesquisa rápida achar pelo nome). */
async function idsPorNome(termo: string) {
  const t = `%${termo.replace(/[%*,()]/g, " ").trim()}%`;
  const [c, p] = await Promise.all([
    supabase.from("clientes").select("id").ilike("razao_social", t).limit(200),
    supabase.from("prestadores").select("id").ilike("nome_completo", t).limit(200),
  ]);
  if (c.error) throw c.error;
  if (p.error) throw p.error;
  return { clientes: c.data.map((x) => x.id), prestadores: p.data.map((x) => x.id) };
}

const recorteSchema = z.enum(["pendente", "pago", "cancelado"]).optional();

rota("GET", "/registros", async ({ query }): Promise<ListaRegistros> => {
  const consulta = lerConsulta(query, CAMPOS_REGISTROS, "-competencia");
  const recorte = validar(recorteSchema, query.get("recorte") ?? undefined, "Recorte inválido.");
  const termo = (query.get("busca") ?? "").trim();
  if (termo.length >= 2) {
    const ids = await idsPorNome(termo);
    const extra = [
      ids.clientes.length ? `cliente_id.in.(${ids.clientes.join(",")})` : null,
      ids.prestadores.length ? `prestador_id.in.(${ids.prestadores.join(",")})` : null,
    ].filter(Boolean);
    if (extra.length) consulta.busca = [consulta.busca, ...extra].filter(Boolean).join(",");
  }
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("registros_financeiros").select(SELECT, { count: "exact" });
    return recorte ? q.eq("situacao", recorte) : q;
  }, consulta);
  return { registros: (itens as unknown as Linha[]).map(paraResposta), meta };
});

rota("GET", "/registros/resumo", () => resumoRegistros());

rota("GET", "/registros/:id", async ({ params }) => paraResposta(await carregarLinha(params.id)));

rota("POST", "/registros", async ({ corpo }) => {
  const d = validar(registroSchema, corpo);
  const { data, error } = await supabase.from("registros_financeiros").insert(await montar(d)).select(SELECT).single();
  if (error) throw error;
  return paraResposta(data as unknown as Linha);
});

rota("PATCH", "/registros/:id", async ({ params, corpo }) => {
  const d = validar(registroSchema, corpo);
  const anterior = await carregarLinha(params.id);
  const { data, error } = await supabase.from("registros_financeiros").update(await montar(d, anterior)).eq("id", params.id).select(SELECT).maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Registro não encontrado.");
  return paraResposta(data as unknown as Linha);
});

async function excluir(id: string) {
  const { error, count } = await supabase.from("registros_financeiros").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Registro não encontrado.");
}

const hojeEmBrasilia = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);

/** Situação em massa. "Pago" sem data de pagamento ganha a data de hoje. */
async function mudarSituacao(id: string, situacao: "pendente" | "pago" | "cancelado") {
  const linha = await carregarLinha(id);
  const dados = situacao === "pago" ? { situacao, data_pagamento: linha.data_pagamento ?? hojeEmBrasilia() } : { situacao };
  const { error } = await supabase.from("registros_financeiros").update(dados).eq("id", id);
  if (error) throw error;
}

rota("DELETE", "/registros/:id", async ({ params }) => {
  await excluir(params.id);
  return { ok: true };
});

const emMassaSchema = z.object({
  acao: z.enum(["pagar", "pendente", "cancelar", "excluir"]),
  ids: z.array(z.uuid()).min(1, "Selecione ao menos um registro.").max(100, "No máximo 100 por vez."),
});

rota("POST", "/registros/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(emMassaSchema, corpo);
  const fn = { pagar: (id: string) => mudarSituacao(id, "pago"), pendente: (id: string) => mudarSituacao(id, "pendente"), cancelar: (id: string) => mudarSituacao(id, "cancelado"), excluir }[acao];
  return executarEmMassa(ids, fn);
});
