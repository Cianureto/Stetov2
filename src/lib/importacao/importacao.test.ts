import { describe, expect, it } from "vitest";
import { deMatriz } from "@/lib/importacao/arquivo";
import { CAMPOS, mapearAutomatico } from "@/lib/importacao/campos";
import { competencia, data, nomeChave, numero, regime, situacaoRegistro } from "@/lib/importacao/normalizar";

describe("normalizar", () => {
  it("datas e competência em vários formatos", () => {
    expect(data("05/03/2026")).toBe("2026-03-05");
    expect(data("2026-03-05T10:00")).toBe("2026-03-05");
    expect(data(new Date("2026-03-05T12:00:00Z"))).toBe("2026-03-05");
    expect(data("ontem")).toBeNull();
    expect(competencia("3/2026")).toBe("2026-03-01");
    expect(competencia("15/03/2026")).toBe("2026-03-01");
    expect(competencia("2026-03")).toBe("2026-03-01");
    expect(competencia("")).toBeNull();
  });
  it("dinheiro, situação, regime e nome", () => {
    expect(numero("R$ 1.234,56")).toBe(1234.56);
    expect(numero(1234.5)).toBe(1234.5);
    expect(numero("abc")).toBe(0);
    expect(situacaoRegistro("PAGO")).toBe("pago");
    expect(situacaoRegistro("Cancelada")).toBe("cancelado");
    expect(situacaoRegistro("")).toBe("pendente");
    expect(regime("Lucro Presumido")).toBe("lucro_presumido");
    expect(regime("?")).toBeNull();
    expect(nomeChave("  Hospital  São Lucas ")).toBe("hospital sao lucas");
  });
});

describe("planilha", () => {
  it("cabeçalho na primeira linha com dados; linhas vazias saem", () => {
    expect(deMatriz([[], ["Nome", "", "CNPJ"], ["A", "x", "1"], ["", "", ""]])).toEqual({
      colunas: ["Nome", "Coluna 2", "CNPJ"],
      linhas: [{ Nome: "A", "Coluna 2": "x", CNPJ: "1" }],
    });
  });
  it("mapeia colunas por nome e apelido, sem repetir coluna", () => {
    const mapa = mapearAutomatico(["Razão Social", "CNPJ", "E-mail", "ISS"], CAMPOS.clientes);
    expect(mapa).toMatchObject({ razaoSocial: "Razão Social", documento: "CNPJ", email: "E-mail", aliquotaIss: "ISS" });
    const reg = mapearAutomatico(["Tomador", "Médico", "Empresa", "Mês/Ano", "Valor NF", "Status"], CAMPOS.registros_financeiros);
    expect(reg).toMatchObject({ clienteNome: "Tomador", prestadorNome: "Médico", empresaContabilNome: "Empresa", competencia: "Mês/Ano", valorNf: "Valor NF", situacao: "Status" });
  });
});
