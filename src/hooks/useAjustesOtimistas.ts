import { useCallback, useMemo, useState } from "react";

type Ajustes<T> = { resposta: unknown; porId: Record<string, Partial<T>> };

/**
 * Mudanças locais sobre as linhas da página (publicar, trocar consultor…), mostradas na hora enquanto a API
 * grava. Valem até a próxima resposta da lista (`resposta` muda de identidade quando a recarga chega): aí os
 * dados do servidor assumem. `desfazer` volta ao valor original quando a gravação falha; `emAndamento` diz
 * se a linha tem um ajuste pendente (para desabilitar o controle).
 */
export function useAjustesOtimistas<T>(linhas: T[], resposta: unknown, chave: (linha: T) => string) {
  const [ajustes, setAjustes] = useState<Ajustes<T>>({ resposta: null, porId: {} });
  const validos = useMemo(() => (ajustes.resposta === resposta ? ajustes.porId : {}), [ajustes, resposta]);

  const exibidas = useMemo(
    () => linhas.map((l) => (validos[chave(l)] ? { ...l, ...validos[chave(l)] } : l)),
    [linhas, validos, chave],
  );

  const ajustar = useCallback(
    (id: string, mudanca: Partial<T>) => setAjustes((a) => ({ resposta, porId: { ...(a.resposta === resposta ? a.porId : {}), [id]: mudanca } })),
    [resposta],
  );
  const desfazer = useCallback(
    (id: string) =>
      setAjustes((a) => {
        const porId = { ...a.porId };
        delete porId[id];
        return { ...a, porId };
      }),
    [],
  );
  const emAndamento = useCallback((id: string) => id in validos, [validos]);

  return { exibidas, ajustar, desfazer, emAndamento };
}
