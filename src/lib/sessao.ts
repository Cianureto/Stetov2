// Tela para voltar depois do login (a sessão do Supabase fica no localStorage, gerida pelo supabase-js).
const CHAVE_DESTINO = "steto_voltar_para";

/** Guarda a tela atual para voltar a ela depois do novo login (sessão encerrada no meio do uso). */
export function guardarDestino(caminho: string) {
  if (caminho.startsWith("/login") || caminho === "/") return;
  try {
    sessionStorage.setItem(CHAVE_DESTINO, caminho);
  } catch {
    // sem sessionStorage: depois do login vai para o início
  }
}

/** Tela para onde voltar depois do login (e apaga o registro). Só caminhos internos. */
export function consumirDestino(): string | null {
  try {
    const destino = sessionStorage.getItem(CHAVE_DESTINO);
    sessionStorage.removeItem(CHAVE_DESTINO);
    return destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : null;
  } catch {
    return null;
  }
}
