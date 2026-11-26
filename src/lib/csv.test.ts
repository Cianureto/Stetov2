import { describe, expect, it } from "vitest";
import { gerarCsv } from "@/lib/csv";

describe("gerarCsv", () => {
  it("separador ponto e vírgula, decimal com vírgula e aspas quando precisa", () => {
    expect(gerarCsv([{ Cliente: 'Hospital "A"; Centro', Valor: 1234.5, Vazio: null }])).toBe('Cliente;Valor;Vazio\r\n"Hospital ""A""; Centro";1234,5;');
  });
  it("lista vazia vira texto vazio", () => {
    expect(gerarCsv([])).toBe("");
  });
});
