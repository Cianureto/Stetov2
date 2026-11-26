import { useCallback, useState } from "react";
import type { Visao } from "@/components/tabela/AlternarVisao";

/** Galeria ou lista, lembrada neste aparelho por tela (`chave`). Sem armazenamento (navegação privada), vale só na sessão. */
export function useVisaoLembrada(chave: string, padrao: Visao = "galeria") {
  const [visao, setVisaoBruta] = useState<Visao>(() => {
    try {
      const salva = localStorage.getItem(chave);
      return salva === "galeria" || salva === "lista" ? salva : padrao;
    } catch {
      return padrao;
    }
  });
  const setVisao = useCallback((v: Visao) => {
    setVisaoBruta(v);
    try {
      localStorage.setItem(chave, v);
    } catch {
      // Sem armazenamento: só nesta sessão.
    }
  }, [chave]);
  return [visao, setVisao] as const;
}
