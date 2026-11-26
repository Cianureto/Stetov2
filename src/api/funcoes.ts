import { FunctionsHttpError } from "@supabase/supabase-js";
import { erroHttp } from "@/api/client";
import { supabase } from "@/api/supabase";

/** Chama a Edge Function gerenciar-usuarios (ações com a chave de serviço). Erros vêm como `{ erro }`. */
export async function gerenciarUsuarios<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("gerenciar-usuarios", { body: corpo });
  if (error instanceof FunctionsHttpError) {
    const detalhe = (await error.context.json().catch(() => null)) as { erro?: string } | null;
    throw erroHttp(error.context.status, detalhe?.erro ?? "Não foi possível concluir a ação.");
  }
  if (error) throw erroHttp(503, "O serviço de usuários não respondeu. Tente de novo em instantes.");
  return data as T;
}
