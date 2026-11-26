import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { gerenciarUsuarios } from "@/api/funcoes";
import { lerConsulta, listarNoBanco, type Campos } from "@/api/listagem";
import { supabase } from "@/api/supabase";
import type { Empresa, ListaEmpresas, ListaUsuarios, Usuario } from "@/api/types";
import { executarEmMassa, validar } from "@/api/validacao";

type LinhaPerfil = { id: string; nome: string | null; email: string; papel: "admin" | "usuario"; ativo?: boolean; trocar_senha?: boolean; created_at: string; empresa?: { id: string; nome: string } | null };
const paraUsuario = (p: LinhaPerfil): Usuario => ({
  id: p.id, nome: p.nome || p.email, email: p.email, papel: p.papel, ativo: p.ativo ?? true, trocarSenha: !!p.trocar_senha, criadoEm: p.created_at,
  empresa: p.empresa ?? undefined,
});

const CAMPOS_USUARIOS: Campos = {
  nome: { coluna: "nome", tipo: "texto", busca: "texto" },
  email: { coluna: "email", tipo: "texto", busca: "texto" },
  papel: { coluna: "papel", tipo: "opcoes" },
  ativo: { coluna: "ativo", tipo: "booleano" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

rota("GET", "/usuarios", async ({ query }): Promise<ListaUsuarios> => {
  const consulta = lerConsulta(query, CAMPOS_USUARIOS, "nome");
  const empresa = query.get("empresa");
  const { itens, meta } = await listarNoBanco(() => {
    const q = supabase.from("perfis").select("*, empresa:empresas(id, nome)", { count: "exact" });
    return empresa ? q.eq("empresa_id", empresa) : q;
  }, consulta);
  return { usuarios: (itens as unknown as LinhaPerfil[]).map(paraUsuario), meta };
});

const novoUsuario = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(200),
  email: z.email("E-mail inválido.").max(200),
  papel: z.enum(["admin", "usuario"]),
  empresaId: z.uuid().optional(),
});

/** Cria a conta com senha temporária (devolvida uma vez só, para o administrador repassar). */
rota("POST", "/usuarios", async ({ corpo }) => {
  const d = validar(novoUsuario, corpo);
  return gerenciarUsuarios<{ id: string; senhaTemporaria: string }>({ acao: "criar_usuario", ...d });
});

rota("POST", "/usuarios/:id/redefinir-senha", ({ params }) => gerenciarUsuarios<{ senhaTemporaria: string }>({ acao: "redefinir_senha", usuarioId: params.id }));

async function alterar(id: string, dados: { papel?: "admin" | "usuario"; ativo?: boolean }) {
  const { error, count } = await supabase.from("perfis").update(dados, { count: "exact" }).eq("id", id);
  if (error?.code === "42501") throw erroHttp(403, error.message);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Usuário não encontrado.");
}

rota("PATCH", "/usuarios/:id", async ({ params, corpo }) => {
  const d = validar(z.object({ papel: z.enum(["admin", "usuario"]).optional(), ativo: z.boolean().optional() }), corpo);
  await alterar(params.id, d);
  return { ok: true };
});

rota("POST", "/usuarios/em-massa", async ({ corpo }) => {
  const { acao, ids } = validar(z.object({ acao: z.enum(["ativar", "inativar"]), ids: z.array(z.uuid()).min(1).max(100) }), corpo);
  return executarEmMassa(ids, (id) => alterar(id, { ativo: acao === "ativar" }));
});

// ── Empresas (só o administrador da Steto; o RLS garante) ──
const paraEmpresa = (e: { id: string; nome: string; cnpj: string | null; status: "ativo" | "inativo"; is_steto: boolean; created_at: string }): Empresa => ({
  id: e.id, nome: e.nome, cnpj: e.cnpj, status: e.status, isSteto: e.is_steto, criadoEm: e.created_at,
});

const CAMPOS_EMPRESAS: Campos = {
  nome: { coluna: "nome", tipo: "texto", busca: "texto" },
  cnpj: { coluna: "cnpj", tipo: "texto", busca: "digitos" },
  status: { coluna: "status", tipo: "opcoes" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
};

rota("GET", "/empresas", async ({ query }): Promise<ListaEmpresas> => {
  const { itens, meta } = await listarNoBanco(() => supabase.from("empresas").select("*", { count: "exact" }), lerConsulta(query, CAMPOS_EMPRESAS, "nome"));
  return { empresas: itens.map(paraEmpresa), meta };
});

rota("POST", "/empresas", async ({ corpo }) => {
  const d = validar(z.object({
    nome: z.string().trim().min(2, "Informe o nome da empresa.").max(200),
    cnpj: z.string().max(18).optional(),
    adminNome: z.string().trim().min(2, "Informe o nome do administrador.").max(200),
    adminEmail: z.email("E-mail do administrador inválido.").max(200),
  }), corpo);
  return gerenciarUsuarios<{ empresaId: string; senhaTemporaria: string }>({ acao: "criar_empresa", ...d });
});

rota("PATCH", "/empresas/:id", async ({ params, corpo }) => {
  const d = validar(z.object({ nome: z.string().trim().min(2).max(200).optional(), status: z.enum(["ativo", "inativo"]).optional() }), corpo);
  const { error, count } = await supabase.from("empresas").update(d, { count: "exact" }).eq("id", params.id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Empresa não encontrada.");
  return { ok: true };
});

// ── Meu perfil ──
rota("PATCH", "/perfil", async ({ corpo }) => {
  const { nome } = validar(z.object({ nome: z.string().trim().min(2, "Informe o seu nome.").max(200) }), corpo);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw erroHttp(401, "Sua sessão terminou. Entre de novo para continuar.");
  const { error, count } = await supabase.from("perfis").update({ nome }, { count: "exact" }).eq("id", u.user.id);
  if (error) throw error;
  if (!count) throw erroHttp(403, "Não foi possível salvar: o banco ainda não permite editar o próprio perfil (aplique a migration de usuários).");
  return { ok: true };
});

/** Troca a própria senha (Supabase Auth) e tira a marca de senha temporária. */
rota("POST", "/perfil/senha", async ({ corpo }) => {
  const { senha } = validar(z.object({ senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(72) }), corpo);
  const { data: u, error } = await supabase.auth.updateUser({ password: senha });
  if (error?.code === "same_password") throw erroHttp(400, "A senha nova precisa ser diferente da atual.");
  if (error?.code === "weak_password") throw erroHttp(400, "Senha fraca: misture letras, números e símbolos.");
  if (error) throw erroHttp(400, "Não foi possível trocar a senha.");
  await supabase.from("perfis").update({ trocar_senha: false }).eq("id", u.user.id);
  return { ok: true };
});
