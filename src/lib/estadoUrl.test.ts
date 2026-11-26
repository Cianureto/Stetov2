import { describe, expect, it } from "vitest";
import { escreverEstadoNaUrl, lerEstadoDaUrl, type EstadoListaUrl } from "@/lib/estadoUrl";
import { FILTROS_VAZIOS } from "@/lib/tabela";

const PADRAO: EstadoListaUrl = { busca: "", ordem: "nome", filtros: FILTROS_VAZIOS, pagina: 1, porPagina: 20 };

describe("estado da tabela na URL", () => {
  it("só grava o que difere do padrão e preserva os outros parâmetros", () => {
    const estado = { ...PADRAO, busca: "  ana ", pagina: 3, filtros: { logica: "e" as const, regras: [{ campo: "bairro", op: "contem", valor: "Centro" }] } };
    const p = escreverEstadoNaUrl(new URLSearchParams("aba=hoje"), "", estado, PADRAO);
    expect(p.get("aba")).toBe("hoje");
    expect(p.get("busca")).toBe("ana");
    expect(p.get("pagina")).toBe("3");
    expect(p.has("ordem")).toBe(false);
    expect(p.has("porPagina")).toBe(false);
    expect(lerEstadoDaUrl(p, "", PADRAO)).toEqual({ ...estado, busca: "ana" });
  });

  it("volta ao padrão apagando os parâmetros", () => {
    const p = escreverEstadoNaUrl(new URLSearchParams("busca=x&pagina=2&ordem=-nome"), "", PADRAO, PADRAO);
    expect(p.toString()).toBe("");
  });

  it("separa tabelas pelo prefixo", () => {
    const p = escreverEstadoNaUrl(new URLSearchParams(), "u_", { ...PADRAO, pagina: 2 }, PADRAO);
    expect(p.get("u_pagina")).toBe("2");
    expect(lerEstadoDaUrl(p, "p_", PADRAO).pagina).toBe(1);
  });

  it("ignora valores inválidos vindos de uma URL editada à mão", () => {
    const p = new URLSearchParams({ pagina: "-4", porPagina: "5000", filtros: "{quebrado" });
    const lido = lerEstadoDaUrl(p, "", PADRAO);
    expect(lido.pagina).toBe(1);
    expect(lido.porPagina).toBe(100);
    expect(lido.filtros).toEqual(FILTROS_VAZIOS);
  });
});
