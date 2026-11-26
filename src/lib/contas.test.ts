import { describe, expect, it } from "vitest";
import { hojeBrasilia, situacaoConta, valorFinalConta, vencimentosMensais } from "@/lib/contas";

describe("valorFinalConta", () => {
  it("ajustes em sequência; percentual sobre o total corrente", () => {
    expect(valorFinalConta(1000, [{ tipo: "multa", modo: "percentual", valor: 2 }, { tipo: "juros", modo: "valor", valor: 10 }])).toBe(1030);
    expect(valorFinalConta(1000, [{ tipo: "desconto", modo: "percentual", valor: 10 }, { tipo: "multa", modo: "percentual", valor: 10 }])).toBe(990);
  });
  it("desconto não deixa negativo; sem ajustes é o valor base", () => {
    expect(valorFinalConta(100, [{ tipo: "desconto", modo: "valor", valor: 150 }])).toBe(0);
    expect(valorFinalConta(99.9)).toBe(99.9);
  });
});

describe("vencimentosMensais", () => {
  it("12 parcelas mensais; dia 31 cai no último dia dos meses curtos", () => {
    const v = vencimentosMensais("2026-01-31");
    expect(v).toHaveLength(12);
    expect(v.slice(0, 4)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    expect(v[11]).toBe("2026-12-31");
  });
  it("atravessa o ano", () => {
    expect(vencimentosMensais("2026-11-10", 3)).toEqual(["2026-11-10", "2026-12-10", "2027-01-10"]);
  });
});

describe("situacaoConta", () => {
  it("paga, vencida, vence hoje ou a vencer", () => {
    expect(situacaoConta({ status: "pago", dataVencimento: "2020-01-01" }, "2026-11-26")).toBe("paga");
    expect(situacaoConta({ status: "pendente", dataVencimento: "2026-11-25" }, "2026-11-26")).toBe("vencida");
    expect(situacaoConta({ status: "vencido", dataVencimento: "2026-11-26" }, "2026-11-26")).toBe("vence_hoje");
    expect(situacaoConta({ status: "pendente", dataVencimento: "2026-12-01" }, "2026-11-26")).toBe("a_vencer");
  });
  it("hoje em Brasília (UTC−3)", () => {
    expect(hojeBrasilia(Date.UTC(2026, 10, 27, 2, 0))).toBe("2026-11-26");
    expect(hojeBrasilia(Date.UTC(2026, 10, 27, 4, 0))).toBe("2026-11-27");
  });
});
