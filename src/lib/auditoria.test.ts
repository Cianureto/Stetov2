import { describe, expect, it } from "vitest";
import { alteracoes, nomeDoAlvo, rotuloCampo } from "@/lib/auditoria";

describe("auditoria", () => {
  it("só os campos que mudaram, sem os técnicos", () => {
    const antes = { id: "1", razao_social: "A", status: "ativo", updated_at: "x", aliquota_iss: 2 };
    const depois = { id: "1", razao_social: "A", status: "inativo", updated_at: "y", aliquota_iss: 2 };
    expect(alteracoes(antes, depois)).toEqual([{ campo: "status", antes: "ativo", depois: "inativo" }]);
  });
  it("criação mostra os campos preenchidos", () => {
    expect(alteracoes(null, { id: "1", nome: "Aluguel", ativo: true, descricao: null })).toEqual([
      { campo: "nome", antes: null, depois: "Aluguel" },
      { campo: "ativo", antes: null, depois: true },
    ]);
  });
  it("nome do alvo e rótulo do campo", () => {
    expect(nomeDoAlvo(null, { razao_social: "Hospital" })).toBe("Hospital");
    expect(nomeDoAlvo({ descricao: "Luz" }, null)).toBe("Luz");
    expect(nomeDoAlvo(null, { valor: 1 })).toBe("—");
    expect(rotuloCampo("razao_social")).toBe("Razao social");
  });
});
