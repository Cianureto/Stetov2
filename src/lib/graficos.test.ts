import { describe, expect, it } from "vitest";
import { caminhoSuave, marcasEixo, rotuloMesEixo, rotuloPeriodo, somarMeses } from "@/lib/graficos";

describe("marcasEixo", () => {
  it("cobre o máximo com passos redondos", () => {
    expect(marcasEixo(267_788)).toEqual([0, 100_000, 200_000, 300_000]);
    expect(marcasEixo(16)).toEqual([0, 5, 10, 15, 20]);
    expect(marcasEixo(100)).toEqual([0, 25, 50, 75, 100]);
  });
  it("sem dados, eixo de 0 a 1", () => {
    expect(marcasEixo(0)).toEqual([0, 1]);
    expect(marcasEixo(Number.NaN)).toEqual([0, 1]);
  });
});

describe("caminhoSuave", () => {
  it("começa no primeiro ponto e termina no último", () => {
    const d = caminhoSuave([{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 5 }]);
    expect(d.startsWith("M0,10")).toBe(true);
    expect(d.endsWith("20,5")).toBe(true);
  });
  it("não ultrapassa pontos num platô (tangente zero no pico)", () => {
    const d = caminhoSuave([{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 10 }]);
    // os pontos de controle vizinhos ao pico ficam na mesma altura dele (y = 0)
    expect(d).toMatch(/,0 10,0 C[\d.]+,0 /);
  });
  it("um ponto só ou nenhum", () => {
    expect(caminhoSuave([{ x: 5, y: 5 }])).toBe("M5,5");
    expect(caminhoSuave([])).toBe("");
  });
});

describe("períodos", () => {
  it("soma meses atravessando o ano", () => {
    expect(somarMeses("2026-11-01", 3)).toBe("2027-02-01");
    expect(somarMeses("2026-01-01", -1)).toBe("2025-12-01");
    expect(somarMeses("2026-11-01", -11)).toBe("2025-12-01");
  });
  it("rótulo do período", () => {
    expect(rotuloPeriodo("2026-11-01", "2026-11-01")).toBe("nov/2026");
    expect(rotuloPeriodo("2026-01-01", "2026-11-01")).toBe("jan–nov/2026");
    expect(rotuloPeriodo("2025-12-01", "2026-11-01")).toBe("dez/2025–nov/2026");
  });
  it("rótulo do mês no eixo", () => {
    expect(rotuloMesEixo("2026-03-01", false)).toBe("mar");
    expect(rotuloMesEixo("2026-03-01", true)).toBe("mar/26");
  });
});
