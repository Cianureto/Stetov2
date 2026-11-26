import { describe, expect, it } from "vitest";
import { formatarData, formatarDocumento, formatarMoeda, formatarPercentual, iniciais, lerNumeroBR, percentualParaCampo } from "@/lib/format";

describe("format", () => {
  it("documento escolhe pela quantidade de dígitos", () => {
    expect(formatarDocumento("52998224725")).toBe("529.982.247-25");
    expect(formatarDocumento("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatarDocumento("123")).toBe("123");
    expect(formatarDocumento(null)).toBe("");
  });
  it("lê números em pt-BR", () => {
    expect(lerNumeroBR("2,5")).toBe(2.5);
    expect(lerNumeroBR("2.5")).toBe(2.5);
    expect(lerNumeroBR("1.234,56")).toBe(1234.56);
    expect(lerNumeroBR("R$ 1.234,56")).toBe(1234.56);
    expect(lerNumeroBR("3%")).toBe(3);
    expect(lerNumeroBR("")).toBe(0);
    expect(lerNumeroBR("abc")).toBeNaN();
  });
  it("percentual, moeda, data e iniciais", () => {
    expect(formatarPercentual(0.65)).toBe("0,65%");
    expect(percentualParaCampo(0)).toBe("");
    expect(percentualParaCampo(3)).toBe("3");
    expect(formatarMoeda(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(formatarData("2026-11-26")).toBe("26/11/2026");
    expect(formatarData(null)).toBe("—");
    expect(iniciais("Ana Souza Lima")).toBe("AS");
  });
});
