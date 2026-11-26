import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { contar } from "@/api/contagem";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { rankingRegistros, resumoRegistros } from "@/api/rotas/rankings";
import { supabase } from "@/api/supabase";
import type { EmpresaContabil, ListaEmpresasContabeis, OpcaoApi, PainelEmpresaContabil, ResumoEmpresasContabeis } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";
import type { Tables } from "@/lib/database.types";
import { formatarDocumento } from "@/lib/format";
import { cnpjValido, somenteDigitos } from "@/lib/mascaras";

const paraResposta = (e: Tables<"empresas_contabeis">): EmpresaContabil => ({
  id: e.id,
  cnpj: e.cnpj,
  razaoSocial: e.razao_social,
  nomeFantasia: e.nome_fantasia,
  status: e.status,
  criadoEm: e.created_at,
});

export const CAMPOS_EMPRESAS_CONTABEIS: Campos = {
  razaoSocial: { coluna: "razao_social", tipo: "texto", busca: "texto" },
  nomeFantasia: { coluna: "nome_fantasia", tipo: "texto", busca: "texto" },
  cnpj: { coluna: "cnpj", tipo: "texto", busca: "digitos" },
  status: { coluna: "status", tipo: "opcoes" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

const empresaSchema = z.object({
  cnpj: z.string().max(18).transform(somenteDigitos).refine(cnpjValido, "CNPJ inválido. Confira os números."),
  razaoSocial: z.string().trim().min(2, "Informe a razão social.").max(200),
  nomeFantasia: z.string().trim().max(200).nullish().transform((v) => v || null),
  status: z.enum(["ativo", "inativo"]),
});

const paraBanco = (d: z.infer<typeof empresaSchema>) => ({ cnpj: d.cnpj, razao_social: d.razaoSocial, nome_fantasia: d.nomeFantasia, status: d.status });

async function exigirCnpjLivre(cnpj: string, ignorarId?: string) {
  let q = supabase.from("empresas_contabeis").select("razao_social").eq("cnpj", cnpj).limit(1);
  if (ignorarId) q = q.neq("id", ignorarId);
  const { data, error } = await q;
  if (error) throw error;
  if (data.length) throw erroHttp(409, `Este CNPJ já está cadastrado para ${data[0].razao_social}.`);
}

async function carregar(id: string) {
  const { data, error } = await supabase.from("empresas_contabeis").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Empresa contábil não encontrada.");
  return paraResposta(data);
}

async function excluir(id: string) {
  const { error, count } = await supabase.from("empresas_contabeis").delete({ count: "exact" }).eq("id", id);
  if (error?.code === "23503") throw erroHttp(409, "Esta empresa tem registros financeiros. Inative-a em vez de excluir.");
  if (error) throw error;
  if (!count) throw erroHttp(404, "Empresa contábil não encontrada.");
}

async function mudarStatus(id: string, status: "ativo" | "inativo") {
  const { error, count } = await supabase.from("empresas_contabeis").update({ status }, { count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Empresa contábil não encontrada.");
}

rota("GET", "/empresas-contabeis", async ({ query }): Promise<ListaEmpresasContabeis> => {
  const consulta = lerConsulta(query, CAMPOS_EMPRESAS_CONTABEIS, "razaoSocial");
  const recorte = validar(z.enum(["ativo", "inativo"]).optional(), query.get("recorte") ?? undefined, "Recorte inválido.");
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("empresas_contabeis").select("*", { count: "exact" });
    return recorte ? q.eq("status", recorte) : q;
  }, consulta);
  return { empresasContabeis: itens.map(paraResposta), meta };
});

rota("GET", "/empresas-contabeis/resumo", async (): Promise<ResumoEmpresasContabeis> => {
  const [total, ativas] = await Promise.all([contar("empresas_contabeis"), contar("empresas_contabeis", (q) => q.eq("status", "ativo"))]);
  return { total, ativas, inativas: total - ativas };
});

/** Empresas contábeis ativas para seletores. */
rota("GET", "/empresas-contabeis/opcoes", async (): Promise<OpcaoApi[]> => {
  const { data, error } = await supabase.from("empresas_contabeis").select("id, razao_social, nome_fantasia, cnpj").eq("status", "ativo").order("razao_social");
  if (error) throw error;
  return data.map((e) => ({ valor: e.id, rotulo: e.nome_fantasia || e.razao_social, descricao: formatarDocumento(e.cnpj) }));
});

rota("GET", "/empresas-contabeis/:id", ({ params }) => carregar(params.id));

/** Painel da empresa: totais e ranking de clientes e prestadores dos registros emitidos por ela. */
rota("GET", "/empresas-contabeis/:id/painel", async ({ params }): Promise<PainelEmpresaContabil> => {
  const [empresa, resumo, clientes, prestadores] = await Promise.all([
    carregar(params.id),
    resumoRegistros({ empresaContabil: params.id }),
    rankingRegistros("cliente", { empresaContabil: params.id }, 100),
    rankingRegistros("prestador", { empresaContabil: params.id }, 100),
  ]);
  return { empresa, resumo, clientes, prestadores };
});

rota("POST", "/empresas-contabeis", async ({ corpo }) => {
  const d = validar(empresaSchema, corpo);
  await exigirCnpjLivre(d.cnpj);
  const { data, error } = await supabase.from("empresas_contabeis").insert(paraBanco(d)).select("*").single();
  if (error) throw error;
  return paraResposta(data);
});

rota("PATCH", "/empresas-contabeis/:id", async ({ params, corpo }) => {
  const d = validar(empresaSchema, corpo);
  await exigirCnpjLivre(d.cnpj, params.id);
  const { data, error } = await supabase.from("empresas_contabeis").update(paraBanco(d)).eq("id", params.id).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Empresa contábil não encontrada.");
  return paraResposta(data);
});

rota("DELETE", "/empresas-contabeis/:id", async ({ params }) => {
  await excluir(params.id);
  return { ok: true };
});

const emMassaSchema = z.object({
  acao: z.enum(["ativar", "inativar", "excluir"]),
  ids: z.array(z.uuid()).min(1, "Selecione ao menos uma empresa.").max(100, "No máximo 100 por vez."),
});

rota("POST", "/empresas-contabeis/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(emMassaSchema, corpo);
  return executarEmMassa(ids, (id) => (acao === "excluir" ? excluir(id) : mudarStatus(id, acao === "ativar" ? "ativo" : "inativo")));
});
