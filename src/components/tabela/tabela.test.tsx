import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useTabela } from "@/hooks/useTabela";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import type { Coluna } from "@/lib/tabela";

afterEach(cleanup);

type Linha = { id: string; nome: string; visitas: number };
const COLUNAS: Coluna<Linha>[] = [
  { chave: "nome", titulo: "Nome", filtro: { tipo: "texto" } },
  { chave: "visitas", titulo: "Visitas", filtro: { tipo: "numero" }, ordemInicial: "desc" },
];
const LINHAS: Linha[] = [
  { id: "1", nome: "Carla", visitas: 2 },
  { id: "2", nome: "Ana", visitas: 9 },
  { id: "3", nome: "Bia", visitas: 5 },
];

function Exemplo({ linhas = LINHAS, porPagina }: { linhas?: Linha[] | null; porPagina?: number }) {
  const tabela = useTabela(linhas, COLUNAS, { ordemPadrao: "nome", porPagina });
  return (
    <>
      <BarraTabela tabela={tabela} colunas={COLUNAS} placeholder="Pesquisar nome" />
      <TabelaDados tabela={tabela} colunas={COLUNAS} chaveLinha={(l) => l.id} vazio="Nada cadastrado." />
    </>
  );
}

const nomesNaTabela = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((r) => r.querySelector("td")?.textContent);

describe("tabela padrão", () => {
  it("começa na ordem padrão e reordena ao clicar no cabeçalho", () => {
    render(<Exemplo />);
    expect(nomesNaTabela()).toEqual(["Ana", "Bia", "Carla"]);
    const visitas = screen.getByRole("button", { name: /^Visitas/ });
    fireEvent.click(visitas);
    // Visitas começa do maior (ordemInicial "desc"): Ana 9, Bia 5, Carla 2.
    expect(nomesNaTabela()).toEqual(["Ana", "Bia", "Carla"]);
    expect(visitas.closest("th")?.getAttribute("aria-sort")).toBe("descending");
    fireEvent.click(visitas);
    expect(nomesNaTabela()).toEqual(["Carla", "Bia", "Ana"]);
  });

  it("pesquisa rápida filtra e diferencia 'nada encontrado' de 'nada cadastrado'", () => {
    render(<Exemplo />);
    fireEvent.change(screen.getByPlaceholderText("Pesquisar nome"), { target: { value: "bi" } });
    expect(nomesNaTabela()).toEqual(["Bia"]);
    fireEvent.change(screen.getByPlaceholderText("Pesquisar nome"), { target: { value: "zzz" } });
    expect(screen.getByText(/Nada encontrado/)).toBeTruthy();
    cleanup();
    render(<Exemplo linhas={[]} />);
    expect(screen.getByText("Nada cadastrado.")).toBeTruthy();
  });

  it("pagina e volta para a página 1 ao pesquisar", () => {
    render(<Exemplo porPagina={2} />);
    expect(nomesNaTabela()).toEqual(["Ana", "Bia"]);
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(nomesNaTabela()).toEqual(["Carla"]);
    fireEvent.change(screen.getByPlaceholderText("Pesquisar nome"), { target: { value: "a" } });
    expect(nomesNaTabela()).toEqual(["Ana", "Bia"]);
  });

  it("mostra o esqueleto enquanto as linhas não chegaram", () => {
    render(<Exemplo linhas={null} />);
    expect(screen.queryByRole("table")).toBeNull();
  });
});

const COLUNAS_COM_ACAO: Coluna<Linha>[] = [
  ...COLUNAS,
  { chave: "acoes", titulo: "Ações", ordenavel: false, render: (l) => <button type="button" onClick={() => acoesClicadas.push(l.id)}>Remover {l.nome}</button> },
];
let acoesClicadas: string[] = [];

function ExemploClicavel({ onLinha, abrivel }: { onLinha: (l: Linha) => void; abrivel?: (l: Linha) => boolean }) {
  const tabela = useTabela(LINHAS, COLUNAS_COM_ACAO, { ordemPadrao: "nome" });
  return <TabelaDados tabela={tabela} colunas={COLUNAS_COM_ACAO} chaveLinha={(l) => l.id} onLinha={onLinha} abrivel={abrivel} />;
}

describe("linha clicável (abrir os detalhes)", () => {
  afterEach(() => {
    acoesClicadas = [];
  });

  it("clicar na linha ou apertar Enter abre o registro", () => {
    const abertas: string[] = [];
    render(<ExemploClicavel onLinha={(l) => abertas.push(l.nome)} />);
    fireEvent.click(screen.getByText("Bia"));
    const linhaAna = screen.getByText("Ana").closest("tr")!;
    fireEvent.keyDown(linhaAna, { key: "Enter" });
    expect(abertas).toEqual(["Bia", "Ana"]);
    expect(linhaAna).toHaveProperty("tabIndex", 0);
  });

  it("clicar num botão dentro da linha executa só o botão", () => {
    const abertas: string[] = [];
    render(<ExemploClicavel onLinha={(l) => abertas.push(l.nome)} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover Carla" }));
    expect(acoesClicadas).toEqual(["1"]);
    expect(abertas).toEqual([]);
  });

  it("linhas sem detalhes (abrivel = false) não ficam clicáveis", () => {
    const abertas: string[] = [];
    render(<ExemploClicavel onLinha={(l) => abertas.push(l.nome)} abrivel={(l) => l.nome !== "Ana"} />);
    fireEvent.click(screen.getByText("Ana"));
    expect(abertas).toEqual([]);
    expect(screen.getByText("Ana").closest("tr")!.hasAttribute("tabindex")).toBe(false);
    fireEvent.click(screen.getByText("Carla"));
    expect(abertas).toEqual(["Carla"]);
  });
});
