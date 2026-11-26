import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { Tabela } from "@/hooks/useTabela";

/**
 * Lista vazia. Buscando: mostra que está carregando (não "nada encontrado" de uma busca antiga). Com pesquisa
 * ou filtro: "nada encontrado" e um atalho para limpar tudo. Sem nada: a mensagem de lista vazia da tela.
 */
export function ListaVazia<T>({ tabela, vazio, vazioFiltrado }: { tabela: Tabela<T>; vazio: ReactNode; vazioFiltrado: ReactNode }) {
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-3 px-4 py-10 text-center text-sm text-foreground-muted">
      {tabela.atualizando || tabela.pesquisando ? (
        <span className="inline-flex items-center gap-2"><Spinner tamanho="md" /> Buscando…</span>
      ) : tabela.filtrando ? (
        <>
          <span>{vazioFiltrado}</span>
          <button type="button" onClick={tabela.limpar} className="inline-flex h-9 items-center rounded-lg border border-[var(--borda-forte)] bg-areia-card px-3.5 text-[13px] font-medium text-foreground hover:bg-[var(--sidebar-hover-bg)] pointer-coarse:h-11">
            Limpar pesquisa e filtros
          </button>
        </>
      ) : (
        <span>{vazio}</span>
      )}
    </div>
  );
}
