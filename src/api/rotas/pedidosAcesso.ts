import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { gerenciarUsuarios } from "@/api/funcoes";
import { supabase } from "@/api/supabase";
import type { PedidoAcesso } from "@/api/types";
import { validar } from "@/api/validacao";

const paraTela = (p: { id: string; nome: string; email: string; telefone: string | null; mensagem: string | null; criado_em: string }): PedidoAcesso => ({
  id: p.id, nome: p.nome, email: p.email, telefone: p.telefone, mensagem: p.mensagem, criadoEm: p.criado_em,
});

/** Pedidos de acesso em aberto da empresa (só administradores enxergam, pela política do banco). */
rota("GET", "/pedidos-acesso", async (): Promise<PedidoAcesso[]> => {
  const { data, error } = await supabase
    .from("solicitacoes_acesso")
    .select("id, nome, email, telefone, mensagem, criado_em")
    .eq("status", "pendente")
    .order("criado_em", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(paraTela);
});

async function decidir(id: string, status: "aprovada" | "recusada") {
  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("solicitacoes_acesso")
    .update({ status, decidido_em: new Date().toISOString(), decidido_por: sessao.user?.id ?? null })
    .eq("id", id)
    .eq("status", "pendente");
  if (error) throw error;
}

/** Aceitar: cria a conta (papel usuário, senha temporária mostrada uma vez) e marca o pedido como aprovado. */
rota("POST", "/pedidos-acesso/:id/aceitar", async ({ params }) => {
  const { data: pedido, error } = await supabase.from("solicitacoes_acesso").select("nome, email").eq("id", params.id).eq("status", "pendente").maybeSingle();
  if (error) throw error;
  if (!pedido) throw erroHttp(404, "Este pedido já foi decidido por outra pessoa.");
  const conta = await gerenciarUsuarios<{ id: string; senhaTemporaria: string }>({ acao: "criar_usuario", nome: pedido.nome, email: pedido.email, papel: "usuario" });
  await decidir(params.id, "aprovada");
  return conta;
});

rota("POST", "/pedidos-acesso/:id/recusar", async ({ params }) => {
  await decidir(params.id, "recusada");
  return { ok: true };
});

const pedidoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o seu nome.").max(120),
  email: z.email("Informe um e-mail válido.").max(200),
  telefone: z.string().trim().max(30).optional(),
  mensagem: z.string().trim().max(500, "Mensagem longa demais (até 500 caracteres).").optional(),
});

/** Pedido feito na tela de login, sem sessão. A resposta é sempre a mesma (não revela se o e-mail já tem conta). */
rota("POST", "/pedidos-acesso", async ({ corpo }) => {
  const d = validar(pedidoSchema, corpo, "Confira os dados do pedido.");
  const { error } = await supabase.rpc("solicitar_acesso", { p_nome: d.nome, p_email: d.email, p_telefone: d.telefone || undefined, p_mensagem: d.mensagem || undefined });
  if (error) throw error;
  return { ok: true };
});
