import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { ListaPrestadores, Prestador, ResumoPrestadores } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";
import type { Tables } from "@/lib/database.types";
import { cpfValido, emailValido, somenteDigitos, telefoneValido } from "@/lib/mascaras";

type Linha = Tables<"prestadores"> & {
  prestador_clientes: { cliente: { id: string; razao_social: string } | null }[];
  prestador_empresas_contabeis: { empresa_contabil: { id: string; razao_social: string; nome_fantasia: string | null } | null }[];
};

const SELECT =
  "*, prestador_clientes(cliente:clientes(id, razao_social)), prestador_empresas_contabeis(empresa_contabil:empresas_contabeis(id, razao_social, nome_fantasia))";

const paraResposta = (p: Linha): Prestador => ({
  id: p.id,
  nomeCompleto: p.nome_completo,
  cpf: p.cpf,
  crm: p.crm,
  telefone: p.telefone,
  email: p.email,
  regimeTributario: p.regime_tributario,
  descontoPadraoPercent: Number(p.desconto_padrao_percent),
  banco: p.banco,
  agencia: p.agencia,
  conta: p.conta,
  tipoConta: p.tipo_conta,
  chavePix: p.chave_pix,
  status: p.status,
  cadastroCompleto: !!p.cadastro_completo,
  clientes: p.prestador_clientes.flatMap((v) => (v.cliente ? [{ id: v.cliente.id, razaoSocial: v.cliente.razao_social }] : [])),
  empresasContabeis: p.prestador_empresas_contabeis.flatMap((v) =>
    v.empresa_contabil ? [{ id: v.empresa_contabil.id, nome: v.empresa_contabil.nome_fantasia || v.empresa_contabil.razao_social }] : [],
  ),
  criadoEm: p.created_at,
});

export const CAMPOS_PRESTADORES: Campos = {
  nomeCompleto: { coluna: "nome_completo", tipo: "texto", busca: "texto" },
  cpf: { coluna: "cpf", tipo: "texto", busca: "digitos" },
  crm: { coluna: "crm", tipo: "texto", busca: "texto" },
  email: { coluna: "email", tipo: "texto", busca: "texto" },
  banco: { coluna: "banco", tipo: "texto" },
  regimeTributario: { coluna: "regime_tributario", tipo: "opcoes" },
  descontoPadraoPercent: { coluna: "desconto_padrao_percent", tipo: "numero" },
  cadastroCompleto: { coluna: "cadastro_completo", tipo: "booleano" },
  status: { coluna: "status", tipo: "opcoes" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const prestadorSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe o nome completo.").max(200),
  cpf: z.string().max(14).transform(somenteDigitos).refine(cpfValido, "CPF inválido. Confira os números."),
  crm: textoOpcional(30),
  telefone: textoOpcional(20)
    .refine((v) => !v || telefoneValido(v), "Telefone inválido.")
    .transform((v) => (v ? somenteDigitos(v) : null)),
  email: textoOpcional(200).refine((v) => !v || emailValido(v), "E-mail inválido."),
  regimeTributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real"]).nullish().transform((v) => v ?? null),
  descontoPadraoPercent: z.number({ error: "Desconto padrão: informe um número." }).min(0, "O desconto não pode ser negativo.").max(100, "O desconto vai até 100%."),
  banco: textoOpcional(80),
  agencia: textoOpcional(10),
  conta: textoOpcional(20),
  tipoConta: z.enum(["corrente", "poupanca"]).nullish().transform((v) => v ?? null),
  chavePix: textoOpcional(140),
  status: z.enum(["ativo", "inativo"]),
  clientes: z.array(z.uuid()).max(500),
  empresasContabeis: z.array(z.uuid()).max(100),
});

/** Grava prestador + vínculos numa transação (função salvar_prestador no banco; o RLS continua valendo). */
async function salvar(id: string | null, corpo: unknown) {
  const d = validar(prestadorSchema, corpo);
  let duplicado = supabase.from("prestadores").select("id, nome_completo").eq("cpf", d.cpf).limit(1);
  if (id) duplicado = duplicado.neq("id", id);
  const { data: existentes, error: erroBusca } = await duplicado;
  if (erroBusca) throw erroBusca;
  if (existentes.length) throw erroHttp(409, `Este CPF já está cadastrado para ${existentes[0].nome_completo}.`);

  const { data: novoId, error } = await supabase.rpc("salvar_prestador", {
    // Na criação vai null (o tipo gerado não sabe que o parâmetro aceita null).
    p_id: id as string,
    p_dados: {
      nome_completo: d.nomeCompleto, cpf: d.cpf, crm: d.crm, telefone: d.telefone, email: d.email,
      regime_tributario: d.regimeTributario, desconto_padrao_percent: d.descontoPadraoPercent,
      banco: d.banco, agencia: d.agencia, conta: d.conta, tipo_conta: d.tipoConta, chave_pix: d.chavePix, status: d.status,
    },
    p_clientes: d.clientes,
    p_empresas_contabeis: d.empresasContabeis,
  });
  if (error?.code === "P0002") throw erroHttp(404, "Prestador não encontrado.");
  if (error) throw error;
  return carregar(novoId);
}

async function carregar(id: string) {
  const { data, error } = await supabase.from("prestadores").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Prestador não encontrado.");
  return paraResposta(data as unknown as Linha);
}

async function excluirPrestador(id: string) {
  const { error, count } = await supabase.from("prestadores").delete({ count: "exact" }).eq("id", id);
  if (error?.code === "23503") throw erroHttp(409, "Este prestador tem registros financeiros. Inative-o em vez de excluir.");
  if (error) throw error;
  if (!count) throw erroHttp(404, "Prestador não encontrado.");
}

async function mudarStatus(id: string, status: "ativo" | "inativo") {
  const { error, count } = await supabase.from("prestadores").update({ status }, { count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Prestador não encontrado.");
}

const recorteSchema = z.enum(["completo", "incompleto", "inativo"]).optional();

rota("GET", "/prestadores", async ({ query }): Promise<ListaPrestadores> => {
  const consulta = lerConsulta(query, CAMPOS_PRESTADORES, "nomeCompleto");
  const recorte = validar(recorteSchema, query.get("recorte") ?? undefined, "Recorte inválido.");
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("prestadores").select(SELECT, { count: "exact" });
    if (recorte === "inativo") return q.eq("status", "inativo");
    if (recorte) return q.eq("cadastro_completo", recorte === "completo");
    return q;
  }, consulta);
  return { prestadores: (itens as unknown as Linha[]).map(paraResposta), meta };
});

rota("GET", "/prestadores/resumo", async (): Promise<ResumoPrestadores> => {
  const { data, error } = await supabase.from("prestadores").select("cadastro_completo, status");
  if (error) throw error;
  const completos = data.filter((p) => p.cadastro_completo).length;
  return { total: data.length, completos, incompletos: data.length - completos, inativos: data.filter((p) => p.status === "inativo").length };
});

rota("GET", "/prestadores/:id", ({ params }) => carregar(params.id));
rota("POST", "/prestadores", ({ corpo }) => salvar(null, corpo));
rota("PATCH", "/prestadores/:id", ({ params, corpo }) => salvar(params.id, corpo));

rota("DELETE", "/prestadores/:id", async ({ params }) => {
  await excluirPrestador(params.id);
  return { ok: true };
});

const emMassaSchema = z.object({
  acao: z.enum(["ativar", "inativar", "excluir"]),
  ids: z.array(z.uuid()).min(1, "Selecione ao menos um prestador.").max(100, "No máximo 100 por vez."),
});

rota("POST", "/prestadores/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(emMassaSchema, corpo);
  return executarEmMassa(ids, (id) => (acao === "excluir" ? excluirPrestador(id) : mudarStatus(id, acao === "ativar" ? "ativo" : "inativo")));
});
