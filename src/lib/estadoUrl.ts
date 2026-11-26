import { FILTROS_VAZIOS, POR_PAGINA_MAX, type Filtros } from "@/lib/tabela";

/**
 * Estado de uma tabela guardado na URL: assim, abrir um registro (tela de formulário) e voltar devolve a
 * lista na mesma página, com a mesma pesquisa, filtros e ordem — e o link da lista filtrada pode ser
 * compartilhado. Valores iguais ao padrão não vão para a URL. `prefixo` separa duas tabelas na mesma tela.
 */
export type EstadoListaUrl = { busca: string; ordem: string; filtros: Filtros; pagina: number; porPagina: number };

const CHAVES = ["busca", "ordem", "filtros", "pagina", "porPagina"] as const;

function filtrosDaUrl(texto: string | null): Filtros {
  if (!texto) return FILTROS_VAZIOS;
  try {
    const f = JSON.parse(texto) as Partial<Filtros>;
    if ((f.logica === "e" || f.logica === "ou") && Array.isArray(f.regras)) {
      const regras = f.regras.filter((r) => r && typeof r.campo === "string" && typeof r.op === "string");
      return { logica: f.logica, regras };
    }
  } catch {
    // URL editada à mão: ignora os filtros.
  }
  return FILTROS_VAZIOS;
}

const inteiro = (texto: string | null, padrao: number, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(texto);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : padrao;
};

export function lerEstadoDaUrl(params: URLSearchParams, prefixo: string, padrao: EstadoListaUrl): EstadoListaUrl {
  const ler = (k: string) => params.get(prefixo + k);
  return {
    busca: ler("busca") ?? padrao.busca,
    ordem: ler("ordem") || padrao.ordem,
    filtros: ler("filtros") ? filtrosDaUrl(ler("filtros")) : padrao.filtros,
    pagina: inteiro(ler("pagina"), padrao.pagina),
    porPagina: inteiro(ler("porPagina"), padrao.porPagina, POR_PAGINA_MAX),
  };
}

/** Os parâmetros com o estado aplicado (os demais parâmetros da URL ficam como estão). */
export function escreverEstadoNaUrl(params: URLSearchParams, prefixo: string, estado: EstadoListaUrl, padrao: EstadoListaUrl): URLSearchParams {
  const novos = new URLSearchParams(params);
  const valores: Record<(typeof CHAVES)[number], string | null> = {
    busca: estado.busca.trim() || null,
    ordem: estado.ordem !== padrao.ordem ? estado.ordem : null,
    filtros: estado.filtros.regras.length ? JSON.stringify({ logica: estado.filtros.logica, regras: estado.filtros.regras }) : null,
    pagina: estado.pagina !== 1 ? String(estado.pagina) : null,
    porPagina: estado.porPagina !== padrao.porPagina ? String(estado.porPagina) : null,
  };
  for (const k of CHAVES) {
    const v = valores[k];
    if (v === null) novos.delete(prefixo + k);
    else novos.set(prefixo + k, v);
  }
  return novos;
}
