import { describe, expect, it } from "vitest";
import { cnpjValido, cpfValido, emailValido, erroDoCampo, formatarCep, formatarCnpj, formatarCpf, formatarTelefone, telefoneValido, validarCampos } from "@/lib/mascaras";

describe("máscaras", () => {
  it("telefone: fixo e celular, enquanto digita e com valores antigos", () => {
    expect(formatarTelefone("8")).toBe("(8");
    expect(formatarTelefone("85")).toBe("(85");
    expect(formatarTelefone("8532")).toBe("(85) 32");
    expect(formatarTelefone("8532241234")).toBe("(85) 3224-1234");
    expect(formatarTelefone("85999999999")).toBe("(85) 99999-9999");
    expect(formatarTelefone("(85)99259.0404")).toBe("(85) 99259-0404");
    expect(formatarTelefone("+55 85 99999-9999")).toBe("(85) 99999-9999");
    expect(formatarTelefone("859999999991234")).toBe("(85) 99999-9999");
  });

  it("CEP, CPF e CNPJ", () => {
    expect(formatarCep("60150160")).toBe("60150-160");
    expect(formatarCpf("52998224725")).toBe("529.982.247-25");
    expect(formatarCpf("5299")).toBe("529.9");
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("validação", () => {
  it("telefone com DDD válido", () => {
    expect(telefoneValido("(85) 99999-9999")).toBe(true);
    expect(telefoneValido("(85) 3224-1234")).toBe(true);
    expect(telefoneValido("(85) 89999-9999")).toBe(false);
    expect(telefoneValido("(20) 99999-9999")).toBe(false);
    expect(telefoneValido("9999-9999")).toBe(false);
  });

  it("e-mail, CPF e CNPJ", () => {
    expect(emailValido("nome@empresa.com.br")).toBe(true);
    expect(emailValido("nome@empresa")).toBe(false);
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11.222.333/0001-80")).toBe(false);
  });

  it("vazio só é erro quando obrigatório; validarCampos devolve a primeira mensagem com o nome do campo", () => {
    expect(erroDoCampo("telefone", "")).toBeNull();
    expect(erroDoCampo("email", "", { obrigatorio: true, rotulo: "O e-mail" })).toBe("Informe o e-mail.");
    expect(validarCampos([{ tipo: "email", valor: "ok@ok.com", rotulo: "E-mail" }, { tipo: "telefone", valor: "123", rotulo: "Telefone" }])).toMatch(/^Telefone: Telefone inválido/);
    expect(validarCampos([{ tipo: "telefone", valor: "", rotulo: "Telefone" }])).toBeNull();
  });
});
