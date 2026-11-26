import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserCheck, UserX } from "lucide-react";
import { AuthContext, type AuthContextValue } from "@/context/useAuth";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useTabela } from "@/hooks/useTabela";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import type { AcaoTabela } from "@/lib/acoesTabela";
import type { Coluna } from "@/lib/tabela";

const toastSucesso = vi.fn();
const toastErro = vi.fn();
vi.mock("sonner", () => ({ toast: { success: (...a: unknown[]) => toastSucesso(...a), error: (...a: unknown[]) => toastErro(...a) } }));

afterEach(() => {
  cleanup();
  toastSucesso.mockReset();
  toastErro.mockReset();
});

type Linha = { id: string; nome: string; ativo: boolean };
const LINHAS: Linha[] = [
  { id: "1", nome: "Ana", ativo: true },
  { id: "2", nome: "Bia", ativo: true },
  { id: "3", nome: "Caio", ativo: false },
];
const chave = (l: Linha) => l.id;
const nome = (l: Linha) => l.nome;

function Exemplo({ acoes, aoConcluir, porPagina }: { acoes: AcaoTabela<Linha>[]; aoConcluir?: () => void; porPagina?: number }) {
  const controle = useAcoesTabela({ acoes, chave, nome, aoConcluir });
  const colunas: Coluna<Linha>[] = [
    { chave: "nome", titulo: "Nome", filtro: { tipo: "texto" } },
    { chave: "acoes", titulo: "Ações", ordenavel: false, render: (l) => <AcoesEmLinha controle={controle} linha={l} /> },
  ];
  const tabela = useTabela(LINHAS, colunas, { ordemPadrao: "nome", porPagina });
  return <TabelaDados tabela={tabela} colunas={colunas} chaveLinha={chave} acoes={controle} />;
}

const comPermissoes = (permissoes: string[], filho: ReactNode) => {
  const usuario = { id: "g", nome: "G", email: "g@x.com", papel: "gestor" as const, permissoes };
  return <AuthContext.Provider value={{ usuario, carregando: false } as unknown as AuthContextValue}>{filho}</AuthContext.Provider>;
};

const acoes = (executar = vi.fn().mockResolvedValue({ feitos: 2, falhas: [] })): AcaoTabela<Linha>[] => [
  { chave: "ativar", rotulo: "Ativar", Icone: UserCheck, permissao: "acessos.gerenciar", aplicavel: (l) => !l.ativo, executar, sucesso: (n) => `${n} ativados` },
  { chave: "inativar", rotulo: "Inativar", Icone: UserX, perigo: true, permissao: "acessos.gerenciar", aplicavel: (l) => l.ativo, executar, sucesso: (n) => `${n} inativados` },
];

describe("ações de tabela (em linha e em massa)", () => {
  it("sem a permissão, não há caixas de seleção nem botões na linha", () => {
    render(comPermissoes(["painel.ver"], <Exemplo acoes={acoes()} />));
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Inativar Ana" })).toBeNull();
  });

  it("com a permissão: ação em linha só onde se aplica", async () => {
    const executar = vi.fn().mockResolvedValue({ feitos: 1, falhas: [] });
    render(comPermissoes(["acessos.gerenciar"], <Exemplo acoes={acoes(executar)} />));
    expect(screen.getByRole("button", { name: "Inativar Ana" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ativar Ana" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ativar Caio" }));
    await waitFor(() => expect(executar).toHaveBeenCalledWith(["3"]));
    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith("1 ativados"));
  });

  it("em massa: seleciona a página, aplica só às linhas em que a ação cabe, avisa falhas e limpa a seleção", async () => {
    const executar = vi.fn().mockResolvedValue({ feitos: 1, falhas: [{ id: "2", erro: "Último administrador." }] });
    const aoConcluir = vi.fn();
    render(comPermissoes(["acessos.gerenciar"], <Exemplo acoes={acoes(executar)} aoConcluir={aoConcluir} />));
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar todos desta página" }));
    expect(screen.getByText("3 selecionados")).toBeTruthy();
    // "Inativar" cabe em 2 das 3 selecionadas.
    const inativar = screen.getByRole("toolbar").querySelector("button")!.parentElement!.querySelectorAll("button")[1];
    expect(inativar.textContent).toContain("Inativar");
    expect(inativar.textContent).toContain("(2)");
    fireEvent.click(inativar);
    await waitFor(() => expect(executar).toHaveBeenCalledWith(["1", "2"]));
    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith("1 inativados"));
    expect(toastErro.mock.calls[0][0]).toBe("1 item não pôde ser alterado");
    expect(toastErro.mock.calls[0][1].description).toContain("Bia: Último administrador.");
    await waitFor(() => expect(screen.queryByText(/selecionad/)).toBeNull());
    expect(aoConcluir).toHaveBeenCalled();
  });

  it("selecionar uma linha mostra a barra; limpar seleção a esconde", () => {
    render(comPermissoes(["acessos.gerenciar"], <Exemplo acoes={acoes()} />));
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Ana" }));
    expect(screen.getByText("1 selecionado")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Limpar seleção/ }));
    expect(screen.queryByText("1 selecionado")).toBeNull();
  });

  it("todos desta página x todos os resultados: oferece os dois e a ação vale para todos", async () => {
    const executar = vi.fn().mockResolvedValue({ feitos: 2, falhas: [] });
    render(comPermissoes(["acessos.gerenciar"], <Exemplo acoes={acoes(executar)} porPagina={2} />));
    // Página com 2 de 3 resultados: marcar a página oferece selecionar todos.
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar todos desta página" }));
    expect(screen.getByText("Os 2 desta página estão selecionados.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos os 3 resultados" }));
    await waitFor(() => expect(screen.getByText("3 selecionados")).toBeTruthy());
    expect(screen.getByText(/Todos os 3 resultados da pesquisa e dos filtros estão selecionados/)).toBeTruthy();
    // Voltar só para a página.
    fireEvent.click(screen.getByRole("button", { name: "Selecionar só os 2 desta página" }));
    expect(screen.getByText("2 selecionados")).toBeTruthy();
    // De novo todos, e a ação "Inativar" vai para os ativos de todas as páginas (Ana e Bia).
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos os 3 resultados" }));
    await waitFor(() => expect(screen.getByText("3 selecionados")).toBeTruthy());
    const inativar = [...screen.getByRole("toolbar").querySelectorAll("button")].find((b) => b.textContent?.includes("Inativar"))!;
    fireEvent.click(inativar);
    await waitFor(() => expect(executar).toHaveBeenCalledWith(["1", "2"]));
  });
});
