import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Uma escolha da tela (aba, status) guardada num parâmetro da URL, para sobreviver à ida a um formulário e
 * à volta. O valor padrão não aparece na URL. Com `validos`, valores fora da lista contam como o padrão; sem
 * ela, vale qualquer texto (ex.: uma pesquisa).
 */
export function useParametroUrl<V extends string>(nome: string, padrao: V, validos?: readonly V[]): [V, (v: V) => void] {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const lido = params.get(nome) as V | null;
  const valor = lido !== null && (!validos || validos.includes(lido)) ? lido : padrao;
  const definir = useCallback(
    (v: V) => {
      const novos = new URLSearchParams(params);
      if (v === padrao) novos.delete(nome);
      else novos.set(nome, v);
      navigate({ search: novos.toString() }, { replace: true, preventScrollReset: true });
    },
    [navigate, nome, padrao, params],
  );
  return [valor, definir];
}
