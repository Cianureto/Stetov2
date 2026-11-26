import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDadosApi } from "@/hooks/useDadosApi";
import { api } from "@/api/client";
import { filtrandoAgora, LIMITE_SELECAO_TODOS, type Tabela } from "@/hooks/useTabela";
import { escreverEstadoNaUrl, lerEstadoDaUrl, type EstadoListaUrl } from "@/lib/estadoUrl";
import { consultaDaLista, FILTROS_VAZIOS, alternarOrdem, POR_PAGINA_MAX, POR_PAGINA_PADRAO, type Filtros, type MetaLista } from "@/lib/tabela";

/** Espera o usuário parar de digitar antes de pesquisar (uma requisição por pausa, não por tecla). */
const ESPERA_BUSCA_MS = 350;

/**
 * Tabela paginada no servidor (padrão do app): pesquisa, filtro avançado, ordem e página viram parâmetros
 * de `caminho` (`pagina`, `porPagina`, `ordem`, `busca`, `filtros`) e a API devolve só a página, com `meta`.
 * `chave` é a propriedade da resposta com as linhas (ex.: "medicos"). Mudar pesquisa, filtro, ordem ou
 * tamanho volta para a página 1; trocar de página mantém a anterior na tela até a nova chegar.
 * `resposta` traz o resto do corpo (ex.: totais da base). `caminho` null não carrega.
 *
 * `naUrl` (prefixo dos parâmetros; "" sem prefixo) guarda pesquisa, filtros, ordem e página na URL da tela:
 * voltar de um formulário (tela própria) devolve a lista como estava. Use em toda tabela cujos registros
 * abrem numa tela; duas tabelas na mesma tela precisam de prefixos diferentes.
 */
export function useTabelaServidor<T, R extends { meta: MetaLista }>(
  caminho: string | null,
  chave: keyof R,
  { ordemPadrao, porPagina: porPaginaInicial = POR_PAGINA_PADRAO, mensagemFalha, naUrl }: { ordemPadrao: string; porPagina?: number; mensagemFalha?: string; naUrl?: string },
): Tabela<T> & { resposta: R | null } {
  const padrao = useMemo<EstadoListaUrl>(
    () => ({ busca: "", ordem: ordemPadrao, filtros: FILTROS_VAZIOS, pagina: 1, porPagina: porPaginaInicial }),
    [ordemPadrao, porPaginaInicial],
  );
  // Estado inicial: o da URL (voltando de um formulário) ou o padrão. Lido uma vez, na montagem.
  const { search } = useLocation();
  const [inicial] = useState(() => (naUrl === undefined ? padrao : lerEstadoDaUrl(new URLSearchParams(search), naUrl, padrao)));
  const [busca, setBuscaBruta] = useState(inicial.busca);
  const [buscaEfetiva, setBuscaEfetiva] = useState(inicial.busca);
  const [ordem, setOrdemBruta] = useState(inicial.ordem);
  const [filtros, setFiltrosBrutos] = useState<Filtros>(inicial.filtros);
  const [pagina, setPagina] = useState(inicial.pagina);
  const [porPagina, setPorPaginaBruto] = useState(inicial.porPagina);

  // Espelha o estado na URL (substituindo a entrada do histórico: mudar de página não cria um "voltar").
  // Só mexe nos parâmetros desta tabela; os demais (aba, status) ficam como estão.
  const navigate = useNavigate();
  useEffect(() => {
    if (naUrl === undefined) return;
    const atual = new URLSearchParams(search);
    const novos = escreverEstadoNaUrl(atual, naUrl, { busca: buscaEfetiva, ordem, filtros, pagina, porPagina }, padrao);
    if (novos.toString() === atual.toString()) return;
    navigate({ search: novos.toString() }, { replace: true, preventScrollReset: true });
  }, [naUrl, search, buscaEfetiva, ordem, filtros, pagina, porPagina, padrao, navigate]);

  // Outro caminho (ex.: aba de status) é outra lista: volta para a página 1.
  const [caminhoAnterior, setCaminhoAnterior] = useState(caminho);
  if (caminho !== caminhoAnterior) {
    setCaminhoAnterior(caminho);
    setPagina(1);
  }

  // A pesquisa só vai à API quando o usuário para de digitar; a página volta para 1 nesse momento (e não a
  // cada tecla, o que dispararia uma busca extra com o termo antigo).
  useEffect(() => {
    if (busca === buscaEfetiva) return;
    const t = setTimeout(() => {
      setBuscaEfetiva(busca);
      setPagina(1);
    }, ESPERA_BUSCA_MS);
    return () => clearTimeout(t);
  }, [busca, buscaEfetiva]);

  const setBusca = useCallback((v: string) => setBuscaBruta(v), []);
  const limpar = useCallback(() => {
    setBuscaBruta("");
    setBuscaEfetiva("");
    setFiltrosBrutos(FILTROS_VAZIOS);
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
  const alternar = useCallback((c: string, inicial?: "asc" | "desc") => {
    setOrdemBruta((atual) => alternarOrdem(atual, c, inicial));
    setPagina(1);
  }, []);
  const setPorPagina = useCallback((n: number) => {
    setPorPaginaBruto(n);
    setPagina(1);
  }, []);

  const url = useMemo(() => {
    if (caminho === null) return null;
    const consulta = consultaDaLista({ pagina, porPagina, ordem, busca: buscaEfetiva, filtros });
    return `${caminho}${caminho.includes("?") ? "&" : "?"}${consulta}`;
  }, [caminho, pagina, porPagina, ordem, buscaEfetiva, filtros]);

  const carga = useDadosApi<R>(url, mensagemFalha);

  // "Selecionar todos os resultados": as mesmas pesquisa, filtros e ordem, página a página (100 por vez).
  const buscarTodas = useCallback(async (): Promise<T[]> => {
    if (caminho === null) return [];
    const separador = caminho.includes("?") ? "&" : "?";
    const todas: T[] = [];
    for (let p = 1; ; p++) {
      const consulta = consultaDaLista({ pagina: p, porPagina: POR_PAGINA_MAX, ordem, busca: buscaEfetiva, filtros });
      const r = await api.get<R>(`${caminho}${separador}${consulta}`);
      if (r.meta.total > LIMITE_SELECAO_TODOS) {
        throw new Error(`São ${r.meta.total.toLocaleString("pt-BR")} resultados: refine a pesquisa ou os filtros para ficar com até ${LIMITE_SELECAO_TODOS.toLocaleString("pt-BR")}.`);
      }
      todas.push(...((r[chave] as T[] | undefined) ?? []));
      if (p >= r.meta.totalPaginas) return todas;
    }
  }, [caminho, chave, ordem, buscaEfetiva, filtros]);
  const resposta = carga.dados;
  const meta = resposta?.meta;

  return {
    busca, setBusca, ordem, setOrdem, alternar, filtros, setFiltros,
    visiveis: (resposta?.[chave] as T[] | undefined) ?? [],
    // Enquanto busca, marca a página pedida; depois vale a da API (ela corrige página além do fim).
    pagina: carga.carregando ? pagina : (meta?.pagina ?? pagina),
    totalPaginas: meta?.totalPaginas ?? 1,
    porPagina,
    setPagina,
    setPorPagina,
    totalFiltrado: meta?.total ?? 0,
    filtrando: filtrandoAgora(busca, filtros),
    carregando: !resposta && !carga.erro,
    atualizando: !!resposta && carga.carregando,
    pesquisando: busca.trim() !== buscaEfetiva.trim() || (carga.carregando && !!buscaEfetiva.trim()),
    limpar,
    erro: carga.erro,
    recarregar: carga.recarregar,
    buscarTodas,
    resposta,
  };
}
