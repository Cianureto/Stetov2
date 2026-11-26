import { describe, expect, it } from "vitest";
import { acoesVisiveis, itemAtivo, itensDaBarraDeAbas, papelDoUsuario, resultadosDaBusca, secoesVisiveis, trilhaPara } from "@/lib/navegacao";
import { PERMISSOES_USUARIO } from "@/lib/permissoes";

const adminSteto = { papel: "admin" as const, empresa: { nome: "Steto", isSteto: true } };
const adminCliente = { papel: "admin" as const, empresa: { nome: "Clínica X", isSteto: false } };
const usuario = { papel: "usuario" as const, empresa: { nome: "Clínica X", isSteto: false }, permissoes: PERMISSOES_USUARIO };

const hrefs = (secoes: ReturnType<typeof secoesVisiveis>) => secoes.flatMap((s) => s.itens.map((i) => i.href));

describe("secoesVisiveis", () => {
  it("administrador da Steto vê tudo, inclusive Empresas", () => {
    const secoes = secoesVisiveis(adminSteto);
    expect(secoes.map((s) => s.chave)).toEqual(["acompanhamento", "financeiro", "cadastros", "administracao", "conta"]);
    expect(hrefs(secoes)).toContain("/empresas");
  });
  it("administrador de outra empresa não vê Empresas", () => {
    const h = hrefs(secoesVisiveis(adminCliente));
    expect(h).not.toContain("/empresas");
    expect(h).toContain("/acessos");
  });
  it("usuário comum não vê a administração", () => {
    const secoes = secoesVisiveis(usuario);
    expect(secoes.map((s) => s.chave)).not.toContain("administracao");
    expect(hrefs(secoes)).toEqual(expect.arrayContaining(["/painel", "/registros", "/clientes", "/perfil"]));
  });
  it("sem usuário, nada", () => {
    expect(secoesVisiveis(null)).toEqual([]);
  });
});

describe("abas, rota ativa e trilha", () => {
  it("as 3 abas de maior prioridade", () => {
    expect(itensDaBarraDeAbas(secoesVisiveis(adminSteto)).map((i) => i.href)).toEqual(["/painel", "/registros", "/contas"]);
  });
  it("o prefixo mais longo vence e vira a trilha", () => {
    const secoes = secoesVisiveis(adminSteto);
    expect(itemAtivo("/clientes/abc", secoes)?.item.href).toBe("/clientes");
    expect(trilhaPara("/clientes/novo", secoes).map((t) => t.label)).toEqual(["Cadastros", "Clientes"]);
    expect(itemAtivo("/outra", secoes)).toBeNull();
  });
});

describe("ações, busca e papel", () => {
  it("ações rápidas pelas permissões", () => {
    expect(acoesVisiveis(usuario).map((a) => a.href)).toContain("/registros/novo");
    expect(acoesVisiveis(null)).toEqual([]);
  });
  it("busca sem acento, ações antes das telas", () => {
    const r = resultadosDaBusca("contabeis", secoesVisiveis(adminSteto), acoesVisiveis(adminSteto));
    expect(r.map((x) => x.href)).toEqual(["/empresas-contabeis"]);
    expect(resultadosDaBusca("cliente", secoesVisiveis(adminSteto), acoesVisiveis(adminSteto))[0].tipo).toBe("Ação");
  });
  it("rótulo do papel", () => {
    expect(papelDoUsuario(adminSteto)).toBe("Administrador · Steto");
  });
});
