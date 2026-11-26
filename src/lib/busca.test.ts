import { describe, expect, it } from "vitest";
import { filtrarOpcoes, normalizarBusca, opcoesDeTextos } from "@/lib/busca";

describe("busca dos seletores", () => {
  it("ignora acento, maiúscula e espaços nas pontas", () => {
    expect(normalizarBusca("  JOSÉ Conceição ")).toBe("jose conceicao");
  });

  it("procura no rótulo e na descrição", () => {
    const opcoes = [
      { valor: "1", rotulo: "Dra. Ana Ribeiro", descricao: "Clínica Boa Vista" },
      { valor: "2", rotulo: "Dr. João Lima", descricao: "Hospital São Lucas" },
    ];
    expect(filtrarOpcoes(opcoes, "joao").map((o) => o.valor)).toEqual(["2"]);
    expect(filtrarOpcoes(opcoes, "boa vista").map((o) => o.valor)).toEqual(["1"]);
    expect(filtrarOpcoes(opcoes, "sao lucas").map((o) => o.valor)).toEqual(["2"]);
    expect(filtrarOpcoes(opcoes, "  ")).toHaveLength(2);
    expect(filtrarOpcoes(opcoes, "xyz")).toEqual([]);
  });

  it("monta opções de uma lista de textos", () => {
    expect(opcoesDeTextos(["CE", "SP"])).toEqual([{ valor: "CE", rotulo: "CE" }, { valor: "SP", rotulo: "SP" }]);
  });
});
