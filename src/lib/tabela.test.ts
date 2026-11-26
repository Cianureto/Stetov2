import { describe, expect, it } from "vitest";
import { alternarOrdem, aplicarTabela, consultaDaLista, descreverRegra, FILTROS_VAZIOS, novaRegra, paginar, regraCompleta, colunasFiltraveis, type Coluna, type Filtros } from "@/lib/tabela";

type Linha = { id: string; nome: string; status: "ativo" | "inativo"; valor: number | null; data: string; tags: string[]; vip: boolean };

const linhas: Linha[] = [
  { id: "1", nome: "Érica Souza", status: "ativo", valor: 150, data: "2026-11-14", tags: ["hoje"], vip: true },
  { id: "2", nome: "bruno lima", status: "inativo", valor: 20, data: "2026-11-10", tags: [], vip: false },
  { id: "3", nome: "Ana Prado", status: "ativo", valor: null, data: "2026-10-31", tags: ["amanha", "hoje"], vip: false },
];

const colunas: Coluna<Linha>[] = [
  { chave: "nome", titulo: "Nome", filtro: { tipo: "texto" } },
  { chave: "status", titulo: "Status", filtro: { tipo: "opcoes", opcoes: { ativo: "Ativo", inativo: "Inativo" } } },
  { chave: "valor", titulo: "Valor", filtro: { tipo: "moeda" } },
  { chave: "data", titulo: "Data", filtro: { tipo: "data" } },
  { chave: "tags", titulo: "Agenda", filtro: { tipo: "opcoes", opcoes: { hoje: "Hoje", amanha: "Amanhã" } } },
  { chave: "vip", titulo: "VIP", filtro: { tipo: "booleano" } },
  { chave: "acoes", titulo: "Ações", ordenavel: false },
];

const ids = (busca: string, ordem: string, filtros: Filtros = FILTROS_VAZIOS) => aplicarTabela(linhas, colunas, { busca, ordem, filtros }).map((l) => l.id);
const so = (...regras: Filtros["regras"]): Filtros => ({ logica: "e", regras });

describe("pesquisa rápida", () => {
  it("procura em texto, rótulo das opções e data, sem diferenciar acento e maiúscula", () => {
    expect(ids("erica", "")).toEqual(["1"]);
    expect(ids("INATIVO", "")).toEqual(["2"]);
    expect(ids("31/10/2026", "")).toEqual(["3"]);
    expect(ids("amanhã", "")).toEqual(["3"]);
  });
});

describe("ordenação", () => {
  it("texto em ordem alfabética do português (acento e minúscula não vão para o fim)", () => {
    expect(ids("", "nome")).toEqual(["3", "2", "1"]);
    expect(ids("", "-nome")).toEqual(["1", "2", "3"]);
  });

  it("números e datas; vazios sempre no fim", () => {
    expect(ids("", "valor")).toEqual(["2", "1", "3"]);
    expect(ids("", "-valor")).toEqual(["1", "2", "3"]);
    expect(ids("", "-data")).toEqual(["1", "2", "3"]);
  });

  it("coluna sem ordenação é ignorada", () => {
    expect(ids("", "acoes")).toEqual(["1", "2", "3"]);
  });

  it("alternarOrdem: primeiro clique no sentido inicial, depois alterna", () => {
    expect(alternarOrdem("nome", "valor")).toBe("valor");
    expect(alternarOrdem("nome", "valor", "desc")).toBe("-valor");
    expect(alternarOrdem("valor", "valor")).toBe("-valor");
    expect(alternarOrdem("-valor", "valor")).toBe("valor");
  });
});

describe("filtro avançado", () => {
  it("texto", () => {
    expect(ids("", "", so({ campo: "nome", op: "comecaCom", valor: "ana" }))).toEqual(["3"]);
    expect(ids("", "", so({ campo: "nome", op: "naoContem", valor: "a" }))).toEqual([]);
  });

  it("opções (inclusive campo com várias), vazio e preenchido", () => {
    expect(ids("", "", so({ campo: "status", op: "e", valor: ["inativo"] }))).toEqual(["2"]);
    expect(ids("", "", so({ campo: "tags", op: "e", valor: ["amanha"] }))).toEqual(["3"]);
    expect(ids("", "", so({ campo: "tags", op: "vazio" }))).toEqual(["2"]);
    expect(ids("", "", so({ campo: "valor", op: "preenchido" }))).toEqual(["1", "2"]);
  });

  it("números e datas, com 'entre' em qualquer ordem", () => {
    expect(ids("", "", so({ campo: "valor", op: "gte", valor: "100" }))).toEqual(["1"]);
    expect(ids("", "", so({ campo: "valor", op: "entre", valor: ["200", "10"] }))).toEqual(["1", "2"]);
    expect(ids("", "", so({ campo: "data", op: "em", valor: "2026-11-14" }))).toEqual(["1"]);
    expect(ids("", "", so({ campo: "data", op: "antes", valor: "2026-11-01" }))).toEqual(["3"]);
    expect(ids("", "", so({ campo: "data", op: "entre", valor: ["2026-11-14", "2026-11-10"] }))).toEqual(["1", "2"]);
  });

  it("booleano", () => {
    expect(ids("", "", so({ campo: "vip", op: "sim" }))).toEqual(["1"]);
  });

  it("'todas' x 'qualquer'", () => {
    const regras = [{ campo: "status", op: "e", valor: ["ativo"] }, { campo: "valor", op: "lt", valor: "50" }];
    expect(ids("", "", { logica: "e", regras })).toEqual([]);
    expect(ids("", "", { logica: "ou", regras })).toEqual(["1", "2", "3"]);
  });

  it("regra incompleta ou de campo desconhecido não filtra", () => {
    expect(regraCompleta({ campo: "nome", op: "contem", valor: " " }, colunas)).toBe(false);
    expect(regraCompleta({ campo: "status", op: "e", valor: [] }, colunas)).toBe(false);
    expect(regraCompleta({ campo: "valor", op: "entre", valor: ["1", ""] }, colunas)).toBe(false);
    expect(regraCompleta({ campo: "xyz", op: "contem", valor: "a" }, colunas)).toBe(false);
    expect(ids("", "", so({ campo: "nome", op: "contem", valor: "" }))).toEqual(["1", "2", "3"]);
  });

  it("nova regra começa no primeiro operador do tipo", () => {
    const [nome, status] = colunasFiltraveis(colunas);
    expect(novaRegra(nome)).toEqual({ campo: "nome", op: "contem", valor: "" });
    expect(novaRegra(status)).toEqual({ campo: "status", op: "e", valor: [] });
  });

  it("descreve a regra para a etiqueta", () => {
    expect(descreverRegra({ campo: "status", op: "e", valor: ["ativo", "inativo"] }, colunas)).toBe("Status é Ativo, Inativo");
    expect(descreverRegra({ campo: "data", op: "entre", valor: ["2026-11-01", "2026-11-14"] }, colunas)).toBe("Data entre 01/11/2026 e 14/11/2026");
    expect(descreverRegra({ campo: "valor", op: "vazio" }, colunas)).toBe("Valor está vazio");
  });
});

describe("paginar", () => {
  it("corta a página e cai na última quando a lista encolhe", () => {
    const lista = Array.from({ length: 23 }, (_, i) => i);
    expect(paginar(lista, 2, 10)).toMatchObject({ itens: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], pagina: 2, totalPaginas: 3, total: 23 });
    expect(paginar(lista, 9, 10).pagina).toBe(3);
    expect(paginar([], 1, 10)).toMatchObject({ itens: [], pagina: 1, totalPaginas: 1 });
  });
});

describe("consultaDaLista", () => {
  it("monta os parâmetros da API; pesquisa vazia e sem filtros ficam de fora", () => {
    expect(consultaDaLista({ pagina: 2, porPagina: 50, ordem: "-valor", busca: "  ana ", filtros: FILTROS_VAZIOS })).toBe("pagina=2&porPagina=50&ordem=-valor&busca=ana");
    const q = new URLSearchParams(consultaDaLista({ pagina: 1, porPagina: 20, ordem: "", busca: "", filtros: { logica: "ou", regras: [{ campo: "status", op: "e", valor: ["ativo"] }] } }));
    expect(q.get("busca")).toBeNull();
    expect(JSON.parse(q.get("filtros")!)).toEqual({ logica: "ou", regras: [{ campo: "status", op: "e", valor: ["ativo"] }] });
  });
});
