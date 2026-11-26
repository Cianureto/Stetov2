export type Opcoes = { titulo: string; descricao?: string; acao?: string };
export type Pedido = Opcoes & { responder: (ok: boolean) => void };

let abrir: ((p: Pedido) => void) | null = null;

export function registrarConfirmador(fn: ((p: Pedido) => void) | null) {
  abrir = fn;
}

// Substitui o confirm() do navegador: `if (!(await confirmar({ titulo: "..." }))) return;`
export function confirmar(opcoes: Opcoes): Promise<boolean> {
  return new Promise((responder) => {
    if (!abrir) return responder(window.confirm(opcoes.titulo));
    abrir({ ...opcoes, responder });
  });
}
