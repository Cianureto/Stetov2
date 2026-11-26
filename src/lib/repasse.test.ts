import { describe, expect, it } from "vitest";
import { aliquotasDoCliente, calcularRepasse, centavos, competenciaCurta, competenciaParaBanco, competenciaParaTela, SEM_TRIBUTOS } from "@/lib/repasse";

describe("calcularRepasse", () => {
  it("tributos por nota, desconto padrão do prestador, desconto adicional e acréscimo", () => {
    const r = calcularRepasse({
      valorNf: 10_000,
      aliquotas: { pis: 0.65, cofins: 3, csll: 1, ir: 1.5, iss: 2 },
      descontoPadraoPercent: 5,
      descontoAdicional: 120.5,
      acrescimo: 50,
    });
    expect(r.tributos).toEqual({ pis: 65, cofins: 300, csll: 100, ir: 150, iss: 200 });
    expect(r.valorTotalTributos).toBe(815);
    expect(r.valorLiquido).toBe(9185);
    expect(r.descontoPadraoAplicado).toBe(500);
    // Os tributos não saem do repasse (regra do app antigo).
    expect(r.valorFinalRepasse).toBe(10_000 - 500 - 120.5 + 50);
  });
  it("arredonda cada tributo em centavos", () => {
    const r = calcularRepasse({ valorNf: 1234.56, aliquotas: { ...SEM_TRIBUTOS, pis: 0.65, iss: 2.5 }, descontoPadraoPercent: 3.3, descontoAdicional: 0, acrescimo: 0 });
    expect(r.tributos.pis).toBe(8.02);
    expect(r.tributos.iss).toBe(30.86);
    expect(r.valorTotalTributos).toBe(38.88);
    expect(r.descontoPadraoAplicado).toBe(40.74);
    expect(r.valorFinalRepasse).toBe(1193.82);
  });
  it("repasse pode ficar negativo no cálculo (a validação recusa)", () => {
    expect(calcularRepasse({ valorNf: 100, aliquotas: SEM_TRIBUTOS, descontoPadraoPercent: 0, descontoAdicional: 150, acrescimo: 0 }).valorFinalRepasse).toBe(-50);
  });
  it("centavos sem erro de ponto flutuante", () => {
    expect(centavos(1.005)).toBe(1.01);
    expect(centavos(0.1 + 0.2)).toBe(0.3);
  });
});

describe("alíquotas do cliente", () => {
  const cliente = { aliquotaPis: 0.65, aliquotaCofins: 3, aliquotaCsll: 1, aliquotaIr: 1.5, aliquotaIss: 2 };
  it("pessoa jurídica traz as do cadastro; pessoa física não tem retenção", () => {
    expect(aliquotasDoCliente({ ...cliente, tipoPessoa: "PJ" })).toEqual({ pis: 0.65, cofins: 3, csll: 1, ir: 1.5, iss: 2 });
    expect(aliquotasDoCliente({ ...cliente, tipoPessoa: "PF" })).toEqual(SEM_TRIBUTOS);
  });
});

describe("competência", () => {
  it("aceita MM/AAAA e AAAA-MM; grava no 1º dia", () => {
    expect(competenciaParaBanco("11/2026")).toBe("2026-11-01");
    expect(competenciaParaBanco("2026-03")).toBe("2026-03-01");
    expect(competenciaParaBanco("13/2026")).toBeNull();
    expect(competenciaParaBanco("1/2026")).toBeNull();
    expect(competenciaParaBanco("")).toBeNull();
  });
  it("formata para a tela", () => {
    expect(competenciaParaTela("2026-11-01")).toBe("11/2026");
    expect(competenciaCurta("2026-03-01")).toBe("mar/2026");
    expect(competenciaCurta(null)).toBe("—");
  });
});
