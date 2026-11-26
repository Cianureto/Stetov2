import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { mensagemErro } from "@/lib/erros";

type Resultado<T> = { chave: string; dados: T | null; erro: string | null };

/**
 * Carrega `caminho` da API (GET) e acompanha o estado da carga. Base de toda tela que só exibe dados:
 * - `caminho` null não carrega nada (ex.: aba fechada, filtro incompleto);
 * - mudar o caminho busca de novo, e uma resposta atrasada de um caminho antigo é descartada;
 * - `recarregar()` busca o mesmo caminho de novo (depois de salvar, por exemplo);
 * - enquanto recarrega, os dados anteriores continuam na tela (sem piscar);
 * - erro de rede ou da API vira `erro` (mensagem pronta), em vez de deixar a tela parada.
 */
export function useDadosApi<T>(caminho: string | null, mensagemFalha = "Não foi possível carregar os dados.") {
  const [versao, setVersao] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const chave = caminho === null ? null : `${caminho}#${versao}`;

  useEffect(() => {
    if (caminho === null) return;
    let ativo = true;
    const chaveDaBusca = `${caminho}#${versao}`;
    api.get<T>(caminho).then(
      (dados) => ativo && setResultado({ chave: chaveDaBusca, dados, erro: null }),
      (e) => ativo && setResultado((anterior) => ({ chave: chaveDaBusca, dados: anterior?.dados ?? null, erro: mensagemErro(e, mensagemFalha) })),
    );
    return () => {
      ativo = false;
    };
  }, [caminho, versao, mensagemFalha]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return {
    dados: resultado?.dados ?? null,
    erro: resultado?.chave === chave ? resultado.erro : null,
    carregando: chave !== null && resultado?.chave !== chave,
    recarregar,
  };
}
