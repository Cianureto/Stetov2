import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Aviso from "@/components/Aviso";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { ListaVazia } from "@/components/tabela/ListaVazia";
import type { Tabela } from "@/hooks/useTabela";
import { useAjustesOtimistas } from "@/hooks/useAjustesOtimistas";
import { ApiError } from "@/api/client";
import { FILTROS_VAZIOS, type Coluna } from "@/lib/tabela";

afterEach(cleanup);

type Linha = { id: string; nome: string };
const COLUNAS: Coluna<Linha>[] = [{ chave: "nome", titulo: "Nome", filtro: { tipo: "texto" } }];

const tabela = (parcial: Partial<Tabela<Linha>>): Tabela<Linha> => ({
  busca: "", setBusca: vi.fn(), ordem: "nome", setOrdem: vi.fn(), alternar: vi.fn(), filtros: FILTROS_VAZIOS, setFiltros: vi.fn(),
  visiveis: [], pagina: 1, totalPaginas: 1, porPagina: 20, setPagina: vi.fn(), totalFiltrado: 0, filtrando: false, carregando: false, limpar: vi.fn(), ...parcial,
});

describe("linha de situação da pesquisa (BarraTabela)", () => {
  it("enquanto pesquisa, avisa; com o resultado, mostra quantos e o termo, e limpa tudo", () => {
    const { rerender } = render(<BarraTabela tabela={tabela({ busca: "ana", filtrando: true, pesquisando: true })} colunas={COLUNAS} />);
    expect(screen.getByText('Pesquisando "ana"…')).toBeTruthy();
    const limpar = vi.fn();
    rerender(<BarraTabela tabela={tabela({ busca: "ana", filtrando: true, totalFiltrado: 12, limpar })} colunas={COLUNAS} />);
    expect(screen.getByText('12 resultados para "ana"')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Limpar tudo" }));
    expect(limpar).toHaveBeenCalled();
  });

  it("sem pesquisa, só fala quando está atualizando (página/ordem)", () => {
    const { rerender } = render(<BarraTabela tabela={tabela({ totalFiltrado: 40 })} colunas={COLUNAS} />);
    expect(screen.queryByText(/resultado/)).toBeNull();
    rerender(<BarraTabela tabela={tabela({ totalFiltrado: 40, atualizando: true })} colunas={COLUNAS} />);
    expect(screen.getByText("Atualizando…")).toBeTruthy();
  });
});

describe("ListaVazia", () => {
  it("buscando não diz 'nada encontrado'; com filtro, oferece limpar; sem nada, mostra a mensagem da tela", () => {
    const { rerender } = render(<ListaVazia tabela={tabela({ filtrando: true, atualizando: true })} vazio="Vazio." vazioFiltrado="Nada encontrado." />);
    expect(screen.getByText("Buscando…")).toBeTruthy();
    const limpar = vi.fn();
    rerender(<ListaVazia tabela={tabela({ filtrando: true, limpar })} vazio="Vazio." vazioFiltrado="Nada encontrado." />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa e filtros" }));
    expect(limpar).toHaveBeenCalled();
    rerender(<ListaVazia tabela={tabela({})} vazio="Vazio." vazioFiltrado="Nada encontrado." />);
    expect(screen.getByText("Vazio.")).toBeTruthy();
  });
});

describe("Aviso (confirmação)", () => {
  it("espera a ação: com erro mostra a mensagem e continua aberto; dando certo, fecha", async () => {
    const onFechar = vi.fn();
    const onConfirmar = vi.fn().mockRejectedValueOnce(new ApiError("Material em uso.")).mockResolvedValueOnce(undefined);
    render(<Aviso titulo="Excluir?" mensagem="x" onFechar={onFechar} confirmar={{ rotulo: "Excluir", perigo: true, onConfirmar }} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Material em uso.");
    expect(onFechar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(onFechar).toHaveBeenCalled());
  });
});

describe("useAjustesOtimistas", () => {
  it("mostra o ajuste na hora, desfaz na falha e some quando a resposta nova chega", () => {
    const linhas: Linha[] = [{ id: "1", nome: "Antes" }];
    const chave = (l: Linha) => l.id;
    const { result, rerender } = renderHook(({ resposta, ls }) => useAjustesOtimistas(ls, resposta, chave), { initialProps: { resposta: {} as object, ls: linhas } });
    act(() => result.current.ajustar("1", { nome: "Depois" }));
    expect(result.current.exibidas[0].nome).toBe("Depois");
    expect(result.current.emAndamento("1")).toBe(true);
    act(() => result.current.desfazer("1"));
    expect(result.current.exibidas[0].nome).toBe("Antes");
    act(() => result.current.ajustar("1", { nome: "Depois" }));
    rerender({ resposta: {}, ls: [{ id: "1", nome: "Do servidor" }] });
    expect(result.current.exibidas[0].nome).toBe("Do servidor");
    expect(result.current.emAndamento("1")).toBe(false);
  });
});
