import { ApiError } from "@/api/client";

export const MENSAGEM_SEM_CONEXAO = "Sem conexão com a internet. Verifique a rede e tente de novo.";

/** Falha de rede (sem resposta da API): o `fetch` rejeita com TypeError, ou o aparelho está offline. */
export const ehFalhaDeRede = (e: unknown) => e instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false);

/**
 * Mensagem para mostrar ao usuário: a que a API mandou (`erro`); sem resposta por falta de conexão, diz
 * isso (em vez de um erro genérico); senão, a padrão.
 */
export function mensagemErro(e: unknown, padrao = "Algo deu errado. Tente novamente.") {
  if (e instanceof ApiError) return e.message;
  return ehFalhaDeRede(e) ? MENSAGEM_SEM_CONEXAO : padrao;
}
