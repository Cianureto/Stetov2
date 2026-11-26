import { useCallback, useState } from "react";
import { mensagemErro } from "@/lib/erros";

/**
 * Estado de uma ação assíncrona disparada pelo usuário (salvar, aprovar, excluir...): `pendente` para
 * desabilitar o botão e `erro` com a mensagem pronta para a tela. Substitui o trio
 * setPendente/try/catch/finally repetido em cada formulário.
 *
 *   const { pendente, erro, executar } = useAcao("Não foi possível salvar.");
 *   executar(async () => { await api.patch(...); onSalvo(); });
 *
 * `executar` devolve true se a ação terminou sem erro.
 */
export function useAcao(mensagemPadrao = "Não foi possível concluir a ação.") {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = useCallback(
    async (acao: () => Promise<unknown>, mensagem = mensagemPadrao) => {
      setErro(null);
      setPendente(true);
      try {
        await acao();
        return true;
      } catch (e) {
        setErro(mensagemErro(e, mensagem));
        return false;
      } finally {
        setPendente(false);
      }
    },
    [mensagemPadrao],
  );

  return { pendente, erro, setErro, executar };
}
