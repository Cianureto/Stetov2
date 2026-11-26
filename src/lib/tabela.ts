import type { ReactNode } from "react";
import { normalizarBusca } from "@/lib/busca";

// Tabela padrão (modelo do projeto revenda, "modo local"): as listas do Steto chegam inteiras da API,
// então pesquisa rápida, filtro avançado, ordenação e paginação acontecem no navegador. As colunas
// descrevem tudo: nenhuma tela configura filtro ou ordenação à parte.
//
//   const colunas: Coluna<Medico>[] = [
//     { chave: "nome", titulo: "Médico", filtro: { tipo: "texto" } },
//     { chave: "status", titulo: "Status", valor: (m) => m.status, filtro: { tipo: "opcoes", opcoes: { ativo: "Ativo" } } },
//   ];
//   const tabela = useTabela(linhas, colunas, { ordemPadrao: "nome" });
//   <BarraTabela tabela={tabela} colunas={colunas} />
//   <TabelaDados tabela={tabela} colunas={colunas} chaveLinha={(m) => m.id} />

export type TipoFiltro = "texto" | "numero" | "moeda" | "data" | "opcoes" | "booleano";

export type Coluna<T> = {
  chave: string;
  titulo: string;
  /** Conteúdo da célula. Padrão: o valor. */
  render?: (linha: T) => ReactNode;
  /** Valor para ordenar, filtrar e pesquisar. Padrão: `linha[chave]`. Datas: `Date` ou texto ISO. */
  valor?: (linha: T) => unknown;
  /** Participa do filtro avançado e da pesquisa rápida (texto e opções). */
  filtro?: { tipo: TipoFiltro; opcoes?: Record<string, string>; rotulo?: string };
  /** Toda coluna com valor ordena; `false` para colunas de ações. */
  ordenavel?: boolean;
  /** Primeiro clique ordena do maior/mais recente. */
  ordemInicial?: "asc" | "desc";
  alinhar?: "esquerda" | "direita";
  /** Classe do <th> e do <td> (ex.: "hidden md:table-cell"). */
  className?: string;
  /** Só para pesquisa, filtro e ordenação: não vira coluna na tabela (ex.: e-mail já mostrado sob o nome). */
  soFiltro?: boolean;
};

export type Regra = { campo: string; op: string; valor?: string | string[] };
export type Filtros = { logica: "e" | "ou"; regras: Regra[] };
export type EstadoTabela = { busca: string; ordem: string; filtros: Filtros };

const TEXTO: [string, string][] = [
  ["contem", "contém"], ["naoContem", "não contém"], ["igual", "é igual a"], ["comecaCom", "começa com"],
  ["vazio", "está vazio"], ["preenchido", "está preenchido"],
];
const NUMERO: [string, string][] = [
  ["eq", "="], ["ne", "≠"], ["gt", ">"], ["gte", "≥"], ["lt", "<"], ["lte", "≤"], ["entre", "entre"],
  ["vazio", "está vazio"], ["preenchido", "está preenchido"],
];

export const OPERADORES: Record<TipoFiltro, [string, string][]> = {
  texto: TEXTO,
  numero: NUMERO,
  moeda: NUMERO,
  data: [["em", "é em"], ["antes", "antes de"], ["depois", "depois de"], ["entre", "entre"], ["vazio", "está vazio"], ["preenchido", "está preenchido"]],
  opcoes: [["e", "é"], ["naoE", "não é"], ["vazio", "está vazio"], ["preenchido", "está preenchido"]],
  booleano: [["sim", "é sim"], ["nao", "é não"]],
};

export const SEM_VALOR = new Set(["vazio", "preenchido", "sim", "nao"]);
export const MAX_REGRAS = 10;
export const FILTROS_VAZIOS: Filtros = Object.freeze({ logica: "e", regras: [] }) as Filtros;

type ColunaFiltravel<T> = Coluna<T> & { filtro: NonNullable<Coluna<T>["filtro"]> };

export const colunasFiltraveis = <T,>(colunas: Coluna<T>[]) => colunas.filter((c): c is ColunaFiltravel<T> => !!c.filtro);
export const rotuloDa = <T,>(c: Coluna<T>) => c.filtro?.rotulo ?? c.titulo;
export const opcoesDa = <T,>(c: Coluna<T>) => Object.entries(c.filtro?.opcoes ?? {}).map(([valor, rotulo]) => ({ valor, rotulo }));
export const ordenavel = <T,>(c: Coluna<T>) => c.ordenavel !== false;

export const valorDa = <T,>(c: Coluna<T>, linha: T): unknown => (c.valor ? c.valor(linha) : (linha as Record<string, unknown>)[c.chave]);

export function valorInicial<T>(c: ColunaFiltravel<T>, op: string): Regra["valor"] {
  if (SEM_VALOR.has(op)) return undefined;
  if (op === "entre") return ["", ""];
  if (c.filtro.tipo === "opcoes") return [];
  return "";
}

export function novaRegra<T>(c: ColunaFiltravel<T>): Regra {
  const op = OPERADORES[c.filtro.tipo][0][0];
  return { campo: c.chave, op, valor: valorInicial(c, op) };
}

/** Regra com campo, operador e valor válidos (incompletas não filtram). */
export function regraCompleta<T>(regra: Regra, colunas: Coluna<T>[]) {
  const c = colunasFiltraveis(colunas).find((x) => x.chave === regra.campo);
  if (!c || !OPERADORES[c.filtro.tipo].some(([op]) => op === regra.op)) return false;
  if (SEM_VALOR.has(regra.op)) return true;
  const v = regra.valor;
  if (regra.op === "entre") return Array.isArray(v) && v.length === 2 && v.every((x) => x !== "");
  if (c.filtro.tipo === "opcoes") return Array.isArray(v) && v.length > 0;
  return typeof v === "string" && v.trim() !== "";
}

const formatarDia = (v: string) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "");
const formatarValor = <T,>(c: ColunaFiltravel<T>, v: string) =>
  c.filtro.tipo === "data" ? formatarDia(v) : c.filtro.tipo === "moeda" ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : v;

/** Texto da etiqueta do filtro ativo: "Status é Ativo, Pendente". */
export function descreverRegra<T>(regra: Regra, colunas: Coluna<T>[]) {
  const c = colunasFiltraveis(colunas).find((x) => x.chave === regra.campo);
  if (!c) return "";
  const op = OPERADORES[c.filtro.tipo].find(([v]) => v === regra.op)?.[1] ?? regra.op;
  if (SEM_VALOR.has(regra.op)) return `${rotuloDa(c)} ${op}`;
  const lista = Array.isArray(regra.valor) ? regra.valor : [regra.valor ?? ""];
  const texto =
    c.filtro.tipo === "opcoes"
      ? lista.map((v) => c.filtro.opcoes?.[v] ?? v).join(", ")
      : lista.map((v) => formatarValor(c, v)).join(" e ");
  return `${rotuloDa(c)} ${op} ${texto}`;
}

const vazio = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Datas viram milissegundos; textos ISO ("2026-11-14…") também. */
function comparavel(v: unknown): unknown {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v.length === 10 ? `${v}T00:00:00` : v).getTime();
  return v;
}

const limitesDoDia = (dia: string): [number, number] => {
  const inicio = new Date(`${dia}T00:00:00`).getTime();
  return [inicio, inicio + 86_400_000];
};

function atende<T>(regra: Regra, c: ColunaFiltravel<T>, linha: T): boolean {
  const v = valorDa(c, linha);
  if (regra.op === "vazio") return vazio(v);
  if (regra.op === "preenchido") return !vazio(v);
  const tipo = c.filtro.tipo;
  if (tipo === "booleano") return regra.op === "sim" ? v === true : v !== true;
  if (tipo === "opcoes") {
    const escolhidas = new Set((regra.valor as string[]).map(String));
    const tem = Array.isArray(v) ? v.some((x) => escolhidas.has(String(x))) : escolhidas.has(String(v));
    return regra.op === "naoE" ? !tem : tem;
  }
  if (tipo === "data") {
    const t = comparavel(v);
    if (typeof t !== "number" || Number.isNaN(t)) return false;
    if (regra.op === "entre") {
      const [a, b] = (regra.valor as string[]).map(limitesDoDia).sort((x, y) => x[0] - y[0]);
      return t >= a[0] && t < b[1];
    }
    const [inicio, fim] = limitesDoDia(regra.valor as string);
    return regra.op === "em" ? t >= inicio && t < fim : regra.op === "antes" ? t < inicio : regra.op === "depois" ? t >= fim : false;
  }
  if (tipo === "numero" || tipo === "moeda") {
    if (v == null || v === "") return false;
    const n = Number(v);
    if (Number.isNaN(n)) return false;
    if (regra.op === "entre") {
      const [a, b] = (regra.valor as string[]).map(Number).sort((x, y) => x - y);
      return n >= a && n <= b;
    }
    const x = Number(regra.valor);
    return ({ eq: n === x, ne: n !== x, gt: n > x, gte: n >= x, lt: n < x, lte: n <= x } as Record<string, boolean>)[regra.op] ?? false;
  }
  const texto = normalizarBusca(String(v ?? ""));
  const termo = normalizarBusca(String(regra.valor ?? ""));
  return ({ contem: texto.includes(termo), naoContem: !texto.includes(termo), igual: texto === termo, comecaCom: texto.startsWith(termo) } as Record<string, boolean>)[regra.op] ?? false;
}

/** Texto pesquisável da célula: opções pelo rótulo, datas como o usuário as lê. */
function textoDaBusca<T>(c: Coluna<T>, linha: T) {
  const v = valorDa(c, linha);
  if (v == null) return "";
  if (c.filtro?.tipo === "opcoes") return (Array.isArray(v) ? v : [v]).map((x) => c.filtro?.opcoes?.[String(x)] ?? String(x)).join(" ");
  if (c.filtro?.tipo === "data") {
    const t = comparavel(v);
    return typeof t === "number" && !Number.isNaN(t) ? new Date(t).toLocaleDateString("pt-BR") : "";
  }
  return String(v);
}

/** Valor para ordenar: opções pelo rótulo (a ordem que o usuário vê). */
function valorDeOrdem<T>(c: Coluna<T>, linha: T) {
  const v = valorDa(c, linha);
  if (c.filtro?.tipo === "opcoes" && v != null) return c.filtro.opcoes?.[String(v)] ?? String(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  return comparavel(v);
}

/** Pesquisa rápida (todas as colunas com filtro de texto/opções/data), filtro avançado e ordenação. */
export function aplicarTabela<T>(linhas: T[], colunas: Coluna<T>[], { busca, ordem, filtros }: EstadoTabela): T[] {
  const filtraveis = colunasFiltraveis(colunas);
  const porChave = new Map(filtraveis.map((c) => [c.chave, c]));
  const regras = filtros.regras.filter((r) => regraCompleta(r, colunas));
  const pesquisaveis = filtraveis.filter((c) => c.filtro.tipo === "texto" || c.filtro.tipo === "opcoes" || c.filtro.tipo === "data");
  const termo = normalizarBusca(busca);

  let saida = linhas.filter((linha) => {
    if (termo && !pesquisaveis.some((c) => normalizarBusca(textoDaBusca(c, linha)).includes(termo))) return false;
    if (!regras.length) return true;
    const resultados = regras.map((r) => atende(r, porChave.get(r.campo)!, linha));
    return filtros.logica === "ou" ? resultados.some(Boolean) : resultados.every(Boolean);
  });

  const chave = ordem.replace(/^-/, "");
  const coluna = chave ? colunas.find((c) => c.chave === chave && ordenavel(c)) : undefined;
  if (coluna) {
    const direcao = ordem.startsWith("-") ? -1 : 1;
    saida = [...saida].sort((a, b) => {
      const x = valorDeOrdem(coluna, a);
      const y = valorDeOrdem(coluna, b);
      // Vazios sempre no fim, nos dois sentidos.
      if (vazio(x) && vazio(y)) return 0;
      if (vazio(x)) return 1;
      if (vazio(y)) return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * direcao;
      return String(x).localeCompare(String(y), "pt-BR", { sensitivity: "base", numeric: true }) * direcao;
    });
  }
  return saida;
}

/** Clique no cabeçalho: primeira vez no sentido inicial da coluna, depois alterna. */
export function alternarOrdem(atual: string, chave: string, inicial: "asc" | "desc" = "asc") {
  if (atual.replace(/^-/, "") !== chave) return inicial === "desc" ? `-${chave}` : chave;
  return atual.startsWith("-") ? chave : `-${chave}`;
}

/** Página de uma lista local; página além do fim cai na última. */
export function paginar<T>(linhas: T[], pagina: number, porPagina: number) {
  const total = linhas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  return { itens: linhas.slice((atual - 1) * porPagina, atual * porPagina), pagina: atual, totalPaginas, total };
}

// ---------------------------------------------------------------------------
// Paginação no servidor (padrão): o mesmo estado vira parâmetros da API (`api/src/lib/listagem.ts`).
// ---------------------------------------------------------------------------

export const POR_PAGINA_PADRAO = 20;
export const OPCOES_POR_PAGINA = [20, 50, 100];
/** Maior página aceita pela API (`porPagina`). */
export const POR_PAGINA_MAX = 100;

/** `meta` das listas paginadas da API. */
export type MetaLista = { pagina: number; porPagina: number; total: number; totalPaginas: number };

/** Parâmetros da listagem. Só regras completas vão para a API; padrões ficam de fora da URL. */
export function consultaDaLista({ pagina, porPagina, ordem, busca, filtros }: { pagina: number; porPagina: number; ordem: string; busca: string; filtros: Filtros }) {
  const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
  if (ordem) params.set("ordem", ordem);
  if (busca.trim()) params.set("busca", busca.trim());
  if (filtros.regras.length) params.set("filtros", JSON.stringify({ logica: filtros.logica, regras: filtros.regras }));
  return params.toString();
}
