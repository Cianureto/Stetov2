import type { z } from "zod";
import { erroHttp } from "@/api/client";

/**
 * Confere `dados` com o schema (padrão do ConectaPRO): inválido vira 400 com a mensagem do primeiro campo
 * errado ("Razão social: informe o nome."). Nunca escreva safeParse + erro à mão nas rotas.
 */
export function validar<S extends z.ZodType>(schema: S, dados: unknown, mensagem = "Dados inválidos."): z.infer<S> {
  const r = schema.safeParse(dados);
  if (r.success) return r.data;
  const primeiro = r.error.issues[0];
  throw erroHttp(400, primeiro?.message || mensagem, { detalhes: r.error.issues });
}

/** Ações em massa: `{ acao, ids }` com até 100 ids; um item que falha não interrompe os outros. */
export async function executarEmMassa(ids: string[], fn: (id: string) => Promise<unknown>) {
  const falhas: { id: string; erro: string }[] = [];
  let feitos = 0;
  for (const id of ids) {
    try {
      await fn(id);
      feitos++;
    } catch (e) {
      falhas.push({ id, erro: e instanceof Error ? e.message : "Falhou." });
    }
  }
  return { feitos, falhas };
}
