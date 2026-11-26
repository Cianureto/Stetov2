import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { Cliente, ListaClientes, ResumoClientes } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";
import type { Tables, TablesInsert } from "@/lib/database.types";
import { cnpjValido, cpfValido, emailValido, somenteDigitos, telefoneValido } from "@/lib/mascaras";

type Linha = Tables<"clientes">;

const paraResposta = (c: Linha): Cliente => ({
  id: c.id,
  razaoSocial: c.razao_social,
  tipoPessoa: c.tipo_pessoa,
  documento: c.documento,
  email: c.email,
  telefone: c.telefone,
  endereco: c.endereco,
  regimeTributario: c.regime_tributario,
  aliquotaPis: Number(c.aliquota_pis),
  aliquotaCofins: Number(c.aliquota_cofins),
  aliquotaCsll: Number(c.aliquota_csll),
  aliquotaIr: Number(c.aliquota_ir),
  aliquotaIss: Number(c.aliquota_iss),
  descontoPadraoPercent: Number(c.desconto_padrao_percent),
  status: c.status,
  origemImportacao: c.origem_importacao,
  criadoEm: c.created_at,
  atualizadoEm: c.updated_at,
});

/** Lista branca da tabela: a chave é o campo da resposta (o mesmo das colunas do app). */
export const CAMPOS_CLIENTES: Campos = {
  razaoSocial: { coluna: "razao_social", tipo: "texto", busca: "texto" },
  documento: { coluna: "documento", tipo: "texto", busca: "digitos" },
  email: { coluna: "email", tipo: "texto", busca: "texto" },
  tipoPessoa: { coluna: "tipo_pessoa", tipo: "opcoes" },
  regimeTributario: { coluna: "regime_tributario", tipo: "opcoes" },
  status: { coluna: "status", tipo: "opcoes" },
  aliquotaIss: { coluna: "aliquota_iss", tipo: "numero" },
  descontoPadraoPercent: { coluna: "desconto_padrao_percent", tipo: "numero" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

const percentual = (rotulo: string) =>
  z.number({ error: `${rotulo}: informe um número.` }).min(0, `${rotulo}: não pode ser negativo.`).max(100, `${rotulo}: no máximo 100%.`);

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const clienteSchema = z
  .object({
    razaoSocial: z.string().trim().min(2, "Informe a razão social ou o nome.").max(200),
    tipoPessoa: z.enum(["PJ", "PF"]),
    documento: z.string().max(18).transform(somenteDigitos),
    email: textoOpcional(200).refine((v) => !v || emailValido(v), "E-mail inválido."),
    telefone: textoOpcional(20)
      .refine((v) => !v || telefoneValido(v), "Telefone inválido.")
      .transform((v) => (v ? somenteDigitos(v) : null)),
    endereco: textoOpcional(300),
    regimeTributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real"], { error: "Escolha o regime tributário." }),
    aliquotaPis: percentual("PIS"),
    aliquotaCofins: percentual("COFINS"),
    aliquotaCsll: percentual("CSLL"),
    aliquotaIr: percentual("IR"),
    aliquotaIss: percentual("ISS"),
    descontoPadraoPercent: percentual("Desconto padrão"),
    status: z.enum(["ativo", "inativo", "provisorio"]),
  })
  .refine((c) => (c.tipoPessoa === "PJ" ? cnpjValido(c.documento) : cpfValido(c.documento)), {
    path: ["documento"],
    message: "CNPJ ou CPF inválido. Confira os números.",
  });

export type DadosCliente = z.input<typeof clienteSchema>;

const paraBanco = (c: z.infer<typeof clienteSchema>): Omit<TablesInsert<"clientes">, "empresa_id"> => ({
  razao_social: c.razaoSocial,
  tipo_pessoa: c.tipoPessoa,
  documento: c.documento,
  email: c.email,
  telefone: c.telefone,
  endereco: c.endereco,
  regime_tributario: c.regimeTributario,
  aliquota_pis: c.aliquotaPis,
  aliquota_cofins: c.aliquotaCofins,
  aliquota_csll: c.aliquotaCsll,
  aliquota_ir: c.aliquotaIr,
  aliquota_iss: c.aliquotaIss,
  desconto_padrao_percent: c.descontoPadraoPercent,
  status: c.status,
});

/** Mesmo documento já cadastrado na empresa: 409 com o nome de quem tem. */
async function exigirDocumentoLivre(documento: string, ignorarId?: string) {
  let q = supabase.from("clientes").select("id, razao_social").eq("documento", documento).limit(1);
  if (ignorarId) q = q.neq("id", ignorarId);
  const { data, error } = await q;
  if (error) throw error;
  if (data.length) throw erroHttp(409, `Este documento já está cadastrado para ${data[0].razao_social}.`);
}

async function excluirCliente(id: string) {
  const { error, count } = await supabase.from("clientes").delete({ count: "exact" }).eq("id", id);
  if (error?.code === "23503") throw erroHttp(409, "Este cliente tem registros financeiros. Inative-o em vez de excluir.");
  if (error) throw error;
  if (!count) throw erroHttp(404, "Cliente não encontrado.");
}

async function mudarStatus(id: string, status: "ativo" | "inativo") {
  const { error, count } = await supabase.from("clientes").update({ status }, { count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Cliente não encontrado.");
}

rota("GET", "/clientes", async ({ query }): Promise<ListaClientes> => {
  const consulta = lerConsulta(query, CAMPOS_CLIENTES, "razaoSocial");
  // Recorte fixo da aba (situação); o filtro avançado vem por cima.
  const recorte = validar(z.enum(["ativo", "inativo", "provisorio"]).optional(), query.get("recorte") ?? undefined, "Recorte inválido.");
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("clientes").select("*", { count: "exact" });
    return recorte ? q.eq("status", recorte) : q;
  }, consulta);
  return { clientes: itens.map(paraResposta), meta };
});

/** Totais do cabeçalho: uma consulta leve (só o status e o regime), nunca as linhas inteiras. */
rota("GET", "/clientes/resumo", async (): Promise<ResumoClientes> => {
  const { data, error } = await supabase.from("clientes").select("status, regime_tributario");
  if (error) throw error;
  const r: ResumoClientes = { total: data.length, ativo: 0, inativo: 0, provisorio: 0, semRegime: 0 };
  for (const c of data) {
    r[c.status]++;
    if (!c.regime_tributario) r.semRegime++;
  }
  return r;
});

rota("GET", "/clientes/:id", async ({ params }) => {
  const { data, error } = await supabase.from("clientes").select("*").eq("id", params.id).maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Cliente não encontrado.");
  return paraResposta(data);
});

rota("POST", "/clientes", async ({ corpo }) => {
  const dados = validar(clienteSchema, corpo);
  await exigirDocumentoLivre(dados.documento);
  const { data, error } = await supabase.from("clientes").insert(paraBanco(dados)).select("*").single();
  if (error) throw error;
  return paraResposta(data);
});

rota("PATCH", "/clientes/:id", async ({ params, corpo }) => {
  const dados = validar(clienteSchema, corpo);
  await exigirDocumentoLivre(dados.documento, params.id);
  const { data, error } = await supabase.from("clientes").update(paraBanco(dados)).eq("id", params.id).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw erroHttp(404, "Cliente não encontrado.");
  return paraResposta(data);
});

rota("DELETE", "/clientes/:id", async ({ params }) => {
  await excluirCliente(params.id);
  return { ok: true };
});

const emMassaSchema = z.object({
  acao: z.enum(["ativar", "inativar", "excluir"]),
  ids: z.array(z.uuid()).min(1, "Selecione ao menos um cliente.").max(100, "No máximo 100 por vez."),
});

rota("POST", "/clientes/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(emMassaSchema, corpo);
  return executarEmMassa(ids, (id) => (acao === "excluir" ? excluirCliente(id) : mudarStatus(id, acao === "ativar" ? "ativo" : "inativo")));
});
