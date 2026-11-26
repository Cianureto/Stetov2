import { describe, expect, it } from "vitest";
import { condicao, condicaoBusca, lerConsulta, type Campos } from "@/api/listagem";

const CAMPOS: Campos = {
  razaoSocial: { coluna: "razao_social", tipo: "texto", busca: "texto" },
  documento: { coluna: "documento", tipo: "texto", busca: "digitos" },
  status: { coluna: "status", tipo: "opcoes" },
  aliquotaIss: { coluna: "aliquota_iss", tipo: "numero" },
  criadoEm: { coluna: "created_at", tipo: "data", instante: true },
  vencimento: { coluna: "data_vencimento", tipo: "data" },
  recorrente: { coluna: "recorrente", tipo: "booleano" },
};

describe("condicao", () => {
  it("texto", () => {
    expect(condicao({ campo: "razaoSocial", op: "contem", valor: "São, Lucas" }, CAMPOS.razaoSocial)).toBe('razao_social.ilike."%São, Lucas%"');
    expect(condicao({ campo: "razaoSocial", op: "comecaCom", valor: "Hosp" }, CAMPOS.razaoSocial)).toBe('razao_social.ilike."Hosp%"');
    expect(condicao({ campo: "razaoSocial", op: "vazio" }, CAMPOS.razaoSocial)).toBe('or(razao_social.is.null,razao_social.eq."")');
    expect(condicao({ campo: "razaoSocial", op: "contem", valor: 'a"b' }, CAMPOS.razaoSocial)).toBe('razao_social.ilike."%a\\"b%"');
  });
  it("opções", () => {
    expect(condicao({ campo: "status", op: "e", valor: ["ativo", "provisorio"] }, CAMPOS.status)).toBe('status.in.("ativo","provisorio")');
    expect(condicao({ campo: "status", op: "naoE", valor: ["inativo"] }, CAMPOS.status)).toBe('or(status.is.null,status.not.in.("inativo"))');
  });
  it("número", () => {
    expect(condicao({ campo: "aliquotaIss", op: "gte", valor: "2.5" }, CAMPOS.aliquotaIss)).toBe("aliquota_iss.gte.2.5");
    expect(condicao({ campo: "aliquotaIss", op: "entre", valor: ["5", "2"] }, CAMPOS.aliquotaIss)).toBe("and(aliquota_iss.gte.2,aliquota_iss.lte.5)");
    expect(() => condicao({ campo: "aliquotaIss", op: "eq", valor: "abc" }, CAMPOS.aliquotaIss)).toThrow("Número inválido");
  });
  it("data no fuso de Brasília e data pura", () => {
    expect(condicao({ campo: "criadoEm", op: "em", valor: "2026-11-30" }, CAMPOS.criadoEm)).toBe(
      'and(created_at.gte."2026-11-30T00:00:00-03:00",created_at.lt."2026-12-01T00:00:00-03:00")',
    );
    expect(condicao({ campo: "vencimento", op: "antes", valor: "2026-12-31" }, CAMPOS.vencimento)).toBe('data_vencimento.lt."2026-12-31"');
    expect(condicao({ campo: "vencimento", op: "depois", valor: "2026-12-31" }, CAMPOS.vencimento)).toBe('data_vencimento.gte."2027-01-01"');
  });
  it("booleano e operador desconhecido", () => {
    expect(condicao({ campo: "recorrente", op: "sim" }, CAMPOS.recorrente)).toBe("recorrente.is.true");
    expect(condicao({ campo: "recorrente", op: "nao" }, CAMPOS.recorrente)).toBe("recorrente.not.is.true");
    expect(() => condicao({ campo: "recorrente", op: "contem", valor: "x" }, CAMPOS.recorrente)).toThrow("Operador inválido");
  });
});

describe("condicaoBusca", () => {
  it("texto em todas as colunas pesquisáveis; dígitos só no documento", () => {
    expect(condicaoBusca("11.222", CAMPOS)).toBe('razao_social.ilike."%11.222%",documento.like."%11222%"');
    expect(condicaoBusca("Lucas", CAMPOS)).toBe('razao_social.ilike."%Lucas%"');
    expect(condicaoBusca("  ", CAMPOS)).toBeNull();
  });
});

describe("lerConsulta", () => {
  it("padrões, ordem e filtros com lógica E/OU", () => {
    const filtros = JSON.stringify({ logica: "ou", regras: [{ campo: "status", op: "e", valor: ["ativo"] }, { campo: "recorrente", op: "sim" }] });
    const c = lerConsulta(new URLSearchParams({ ordem: "-aliquotaIss", filtros }), CAMPOS, "razaoSocial");
    expect(c).toMatchObject({ pagina: 1, porPagina: 20, ordem: { coluna: "aliquota_iss", asc: false }, busca: null });
    expect(c.filtros).toBe('status.in.("ativo"),recorrente.is.true');
    const e = lerConsulta(new URLSearchParams({ filtros: filtros.replace('"ou"', '"e"') }), CAMPOS, "razaoSocial");
    expect(e.filtros).toBe('and(status.in.("ativo"),recorrente.is.true)');
  });
  it("recusa campo, ordem e página inválidos; limita porPagina", () => {
    expect(() => lerConsulta(new URLSearchParams({ ordem: "senha" }), CAMPOS, "razaoSocial")).toThrow("Ordenação inválida");
    expect(() => lerConsulta(new URLSearchParams({ pagina: "0" }), CAMPOS, "razaoSocial")).toThrow("Parâmetro inválido");
    const filtros = JSON.stringify({ logica: "e", regras: [{ campo: "senha", op: "igual", valor: "x" }] });
    expect(() => lerConsulta(new URLSearchParams({ filtros }), CAMPOS, "razaoSocial")).toThrow("Campo inválido");
    expect(lerConsulta(new URLSearchParams({ porPagina: "500" }), CAMPOS, "razaoSocial").porPagina).toBe(100);
  });
});
