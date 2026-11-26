import { useCallback, useMemo, useState } from "react";
import { aplicarTabela, alternarOrdem, FILTROS_VAZIOS, paginar, type Coluna, type Filtros } from "@/lib/tabela";

/**
 * O que `BarraTabela` e `TabelaDados` precisam de uma tabela. Duas implementações:
 * - `useTabelaServidor` (padrão): a API pagina, pesquisa, filtra e ordena; o app recebe só a página;
 * - `useTabela` (local): só para listas pequenas e limitadas que a tela já precisa inteiras por outro
 *   motivo (ex.: agenda do Painel, que alimenta os indicadores; rankings curtos de um relatório).
 */
export type Tabela<T> = {
  busca: string;
  setBusca: (v: string) => void;
  ordem: string;
  setOrdem: (v: string) => void;
  alternar: (chave: string, inicial?: "asc" | "desc") => void;
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  /** Linhas da página atual. */
  visiveis: T[];
  pagina: number;
  totalPaginas: number;
  /** Tamanho da página; sem ele, a tabela mostra tudo (só no modo local). */
  porPagina?: number;
  setPagina: (p: number) => void;
  /** Troca o tamanho da página (servidor: 20 por padrão, até 100). */
  setPorPagina?: (n: number) => void;
  /** Total de linhas que passam na pesquisa e nos filtros. */
  totalFiltrado: number;
  /** Há pesquisa ou filtro ativo (lista vazia = "nada encontrado", não "nada cadastrado"). */
  filtrando: boolean;
  /** Primeira carga, ainda sem linhas. */
  carregando: boolean;
  /** Buscando outra página/ordem com a anterior ainda na tela. */
  atualizando?: boolean;
  /** Pesquisa digitada ainda não aplicada (espera da digitação) ou sendo buscada. */
  pesquisando?: boolean;
  /** Tira a pesquisa e todos os filtros (botão "Limpar tudo"). */
  limpar: () => void;
  erro?: string | null;
  recarregar?: () => void;
  /** Modo local: todas as linhas filtradas (cabeçalho de grupo conta o grupo inteiro). */
  todasFiltradas?: T[];
  /**
   * Todas as linhas que passam na pesquisa e nos filtros atuais, em todas as páginas ("selecionar todos os
   * resultados" das ações em massa). No servidor, busca em lotes; acima de `LIMITE_SELECAO_TODOS`, recusa.
   */
  buscarTodas?: () => Promise<T[]>;
};

/** Máximo de linhas em "selecionar todos os resultados" (acima disso, a pessoa refina a pesquisa/filtros). */
export const LIMITE_SELECAO_TODOS = 1000;

export const filtrandoAgora = (busca: string, filtros: Filtros) => busca.trim() !== "" || filtros.regras.length > 0;

/**
 * Tabela local: pesquisa, filtro, ordem e página no navegador. Só para listas pequenas que a tela já tem
 * inteiras (ver `Tabela`). `colunas` deve ser estável (fora do componente ou em `useMemo`).
 */
export function useTabela<T>(linhas: T[] | null | undefined, colunas: Coluna<T>[], { ordemPadrao = "", porPagina }: { ordemPadrao?: string; porPagina?: number } = {}): Tabela<T> {
  const [busca, setBuscaBruta] = useState("");
  const [ordem, setOrdemBruta] = useState(ordemPadrao);
  const [filtros, setFiltrosBrutos] = useState<Filtros>(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(1);

  const setBusca = useCallback((v: string) => {
    setBuscaBruta(v);
    setPagina(1);
  }, []);
  const setOrdem = useCallback((v: string) => {
    setOrdemBruta(v || ordemPadrao);
    setPagina(1);
  }, [ordemPadrao]);
  const setFiltros = useCallback((v: Filtros) => {
    setFiltrosBrutos(v);
    setPagina(1);
  }, []);
  const alternar = useCallback((chave: string, inicial?: "asc" | "desc") => {
    setOrdemBruta((atual) => alternarOrdem(atual, chave, inicial));
    setPagina(1);
  }, []);

  const limpar = useCallback(() => {
    setBuscaBruta("");
    setFiltrosBrutos(FILTROS_VAZIOS);
    setPagina(1);
  }, []);

  const filtradas = useMemo(() => aplicarTabela(linhas ?? [], colunas, { busca, ordem, filtros }), [linhas, colunas, busca, ordem, filtros]);
  const pag = useMemo(() => paginar(filtradas, pagina, porPagina ?? Math.max(1, filtradas.length)), [filtradas, pagina, porPagina]);

  return {
    busca, setBusca, ordem, setOrdem, alternar, filtros, setFiltros,
    visiveis: pag.itens,
    pagina: pag.pagina,
    totalPaginas: pag.totalPaginas,
    porPagina,
    setPagina,
    totalFiltrado: filtradas.length,
    filtrando: filtrandoAgora(busca, filtros),
    carregando: linhas == null,
    limpar,
    todasFiltradas: filtradas,
    buscarTodas: async () => filtradas,
  };
}
