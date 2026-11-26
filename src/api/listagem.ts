// Listagem paginada no banco (padrão das tabelas, espelho do `listarNoBanco` do ConectaPRO): a query da
// tabela (`pagina`, `porPagina`, `ordem`, `busca`, `filtros`, ver lib/tabela.ts) vira uma consulta ao
// Supabase e só a página volta, com `meta`. Cada rota declara os CAMPOS que aceita (lista branca): campo ou
// operador desconhecido e valor malformado viram 400.
import { erroHttp } from "@/api/client";
import { OPERADORES, POR_PAGINA_MAX, POR_PAGINA_PADRAO, SEM_VALOR, type Filtros, type MetaLista, type Regra, type TipoFiltro } from "@/lib/tabela";

export type CampoLista = {
  /** Coluna no banco. */
  coluna: string;
  tipo: TipoFiltro;
  /** Entra na pesquisa rápida (texto: ilike; documento: só dígitos). */
  busca?: "texto" | "digitos";
  /** Data gravada como timestamptz (o dia é no fuso de Brasília); padrão: coluna `date`. */
  instante?: boolean;
};

export type Campos = Record<string, CampoLista>;

const FUSO = "-03:00";

/** Valor entre aspas para a sintaxe do PostgREST (aceita vírgula, ponto e parênteses dentro). */
export const aspas = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const proximoDia = (dia: string) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

function exigirDia(v: unknown): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw erroHttp(400, "Data inválida no filtro.");
  return v;
}
function exigirNumero(v: unknown): string {
  const n = Number(v);
  if (typeof v !== "string" || v.trim() === "" || Number.isNaN(n)) throw erroHttp(400, "Número inválido no filtro.");
  return String(n);
}

/** Uma regra do filtro avançado → condição PostgREST ("coluna.op.valor", ou um and()/or() aninhado). */
export function condicao(regra: Regra, campo: CampoLista): string {
  const c = campo.coluna;
  if (!OPERADORES[campo.tipo].some(([op]) => op === regra.op)) throw erroHttp(400, `Operador inválido: ${regra.op}.`);
  if (regra.op === "vazio") return campo.tipo === "texto" ? `or(${c}.is.null,${c}.eq."")` : `${c}.is.null`;
  if (regra.op === "preenchido") return campo.tipo === "texto" ? `and(${c}.not.is.null,${c}.neq."")` : `${c}.not.is.null`;
  if (SEM_VALOR.has(regra.op)) return regra.op === "sim" ? `${c}.is.true` : `${c}.not.is.true`;

  const v = regra.valor;
  switch (campo.tipo) {
    case "texto": {
      if (typeof v !== "string") throw erroHttp(400, "Valor inválido no filtro.");
      const t = v.trim().replace(/[%*]/g, "");
      if (regra.op === "contem") return `${c}.ilike.${aspas(`%${t}%`)}`;
      if (regra.op === "naoContem") return `or(${c}.is.null,${c}.not.ilike.${aspas(`%${t}%`)})`;
      if (regra.op === "comecaCom") return `${c}.ilike.${aspas(`${t}%`)}`;
      return `${c}.ilike.${aspas(t)}`;
    }
    case "opcoes": {
      if (!Array.isArray(v) || v.length === 0) throw erroHttp(400, "Escolha ao menos uma opção no filtro.");
      const lista = `(${v.map((x) => aspas(String(x))).join(",")})`;
      return regra.op === "naoE" ? `or(${c}.is.null,${c}.not.in.${lista})` : `${c}.in.${lista}`;
    }
    case "numero":
    case "moeda": {
      if (regra.op === "entre") {
        if (!Array.isArray(v) || v.length !== 2) throw erroHttp(400, "Informe os dois valores do intervalo.");
        const [a, b] = v.map(exigirNumero).map(Number).sort((x, y) => x - y);
        return `and(${c}.gte.${a},${c}.lte.${b})`;
      }
      const n = exigirNumero(v);
      const op = { eq: "eq", ne: "neq", gt: "gt", gte: "gte", lt: "lt", lte: "lte" }[regra.op];
      return `${c}.${op}.${n}`;
    }
    case "data": {
      const inicio = (dia: string) => (campo.instante ? `${dia}T00:00:00${FUSO}` : dia);
      if (regra.op === "entre") {
        if (!Array.isArray(v) || v.length !== 2) throw erroHttp(400, "Informe as duas datas do intervalo.");
        const [a, b] = v.map(exigirDia).sort();
        return `and(${c}.gte.${aspas(inicio(a))},${c}.lt.${aspas(inicio(proximoDia(b)))})`;
      }
      const dia = exigirDia(v);
      if (regra.op === "antes") return `${c}.lt.${aspas(inicio(dia))}`;
      if (regra.op === "depois") return `${c}.gte.${aspas(inicio(proximoDia(dia)))}`;
      return `and(${c}.gte.${aspas(inicio(dia))},${c}.lt.${aspas(inicio(proximoDia(dia)))})`;
    }
    default:
      throw erroHttp(400, "Filtro inválido.");
  }
}

/** Pesquisa rápida: OR entre as colunas pesquisáveis. null = nada a pesquisar. */
export function condicaoBusca(busca: string, campos: Campos): string | null {
  const termo = busca.trim().replace(/[%*]/g, "");
  if (!termo) return null;
  const digitos = termo.replace(/\D/g, "");
  const partes = Object.values(campos).flatMap((campo) => {
    if (campo.busca === "texto") return [`${campo.coluna}.ilike.${aspas(`%${termo}%`)}`];
    if (campo.busca === "digitos" && digitos.length >= 3) return [`${campo.coluna}.like.${aspas(`%${digitos}%`)}`];
    return [];
  });
  return partes.length ? partes.join(",") : null;
}

export type ConsultaLista = { pagina: number; porPagina: number; ordem: { coluna: string; asc: boolean }; busca: string | null; filtros: string | null };

/** Lê e confere a query da tabela. */
export function lerConsulta(query: URLSearchParams, campos: Campos, ordemPadrao: string): ConsultaLista {
  const inteiro = (k: string, padrao: number, max = Number.MAX_SAFE_INTEGER) => {
    const bruto = query.get(k);
    if (bruto === null) return padrao;
    const n = Number(bruto);
    if (!Number.isInteger(n) || n < 1) throw erroHttp(400, `Parâmetro inválido: ${k}.`);
    return Math.min(n, max);
  };
  const ordemTexto = query.get("ordem") || ordemPadrao;
  const chaveOrdem = ordemTexto.replace(/^-/, "");
  const campoOrdem = campos[chaveOrdem];
  if (!campoOrdem) throw erroHttp(400, `Ordenação inválida: ${chaveOrdem}.`);

  let filtros: string | null = null;
  const filtrosTexto = query.get("filtros");
  if (filtrosTexto) {
    let f: Filtros;
    try {
      f = JSON.parse(filtrosTexto) as Filtros;
    } catch {
      throw erroHttp(400, "Filtros malformados.");
    }
    if ((f.logica !== "e" && f.logica !== "ou") || !Array.isArray(f.regras)) throw erroHttp(400, "Filtros malformados.");
    const conds = f.regras.map((r) => {
      const campo = campos[r.campo];
      if (!campo) throw erroHttp(400, `Campo inválido no filtro: ${r.campo}.`);
      return condicao(r, campo);
    });
    if (conds.length) filtros = f.logica === "ou" ? conds.join(",") : `and(${conds.join(",")})`;
  }

  return {
    pagina: inteiro("pagina", 1),
    porPagina: inteiro("porPagina", POR_PAGINA_PADRAO, POR_PAGINA_MAX),
    ordem: { coluna: campoOrdem.coluna, asc: !ordemTexto.startsWith("-") },
    busca: condicaoBusca(query.get("busca") ?? "", campos),
    filtros,
  };
}

// O mínimo do construtor de consultas do supabase-js que a listagem usa.
type Construtor<L> = PromiseLike<{ data: L[] | null; error: unknown; count: number | null }> & {
  or(f: string): Construtor<L>;
  order(coluna: string, o: { ascending: boolean; nullsFirst?: boolean }): Construtor<L>;
  range(de: number, ate: number): Construtor<L>;
};

/**
 * Executa a listagem. `consulta` é o select já montado (com o recorte fixo da rota e `count: "exact"`).
 * Página além do fim cai na última, como no ConectaPRO.
 */
export async function listarNoBanco<L>(
  consulta: () => Construtor<L>,
  c: ConsultaLista,
): Promise<{ itens: L[]; meta: MetaLista }> {
  const montar = (pagina: number) => {
    let q = consulta();
    if (c.busca) q = q.or(c.busca);
    if (c.filtros) q = q.or(c.filtros);
    const de = (pagina - 1) * c.porPagina;
    return q
      .order(c.ordem.coluna, { ascending: c.ordem.asc, nullsFirst: false })
      .order("id", { ascending: true })
      .range(de, de + c.porPagina - 1);
  };
  let { data, error, count } = await montar(c.pagina);
  if (error) throw error;
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / c.porPagina));
  let pagina = c.pagina;
  if (pagina > totalPaginas) {
    pagina = totalPaginas;
    ({ data, error } = await montar(pagina));
    if (error) throw error;
  }
  return { itens: data ?? [], meta: { pagina, porPagina: c.porPagina, total, totalPaginas } };
}
