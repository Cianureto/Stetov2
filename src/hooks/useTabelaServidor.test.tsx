import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import type { MetaLista } from "@/lib/tabela";

const get = vi.fn();
vi.mock("@/api/client", () => ({ api: { get: (caminho: string) => get(caminho) } }));

afterEach(() => {
  cleanup();
  get.mockReset();
});

type Resposta = { itens: { id: string }[]; meta: MetaLista };
const resposta = (pagina: number, total = 45): Resposta => ({ itens: [{ id: `p${pagina}` }], meta: { pagina, porPagina: 20, total, totalPaginas: Math.ceil(total / 20) } });
// O hook usa o roteador (estado na URL): todo teste roda dentro de um.
const naRota = (url = "/lista") => ({ wrapper: ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter> });
const ultimaUrl = () => new URL(`http://x${get.mock.calls.at(-1)![0]}`);

describe("useTabelaServidor", () => {
  it("pede a página 1 com 20 por padrão e a ordem padrão", async () => {
    get.mockResolvedValue(resposta(1));
    const { result } = renderHook(() => useTabelaServidor<{ id: string }, Resposta>("/medicos?agenda=hoje", "itens", { ordemPadrao: "nome" }), naRota());
    await waitFor(() => expect(result.current.visiveis).toEqual([{ id: "p1" }]));
    const url = ultimaUrl();
    expect(url.pathname).toBe("/medicos");
    expect(Object.fromEntries(url.searchParams)).toEqual({ agenda: "hoje", pagina: "1", porPagina: "20", ordem: "nome" });
    expect(result.current.totalFiltrado).toBe(45);
    expect(result.current.totalPaginas).toBe(3);
  });

  it("trocar página, ordem e tamanho refaz a busca; ordem e tamanho voltam à página 1", async () => {
    get.mockImplementation((c: string) => Promise.resolve(resposta(Number(new URL(`http://x${c}`).searchParams.get("pagina")))));
    const { result } = renderHook(() => useTabelaServidor<{ id: string }, Resposta>("/x", "itens", { ordemPadrao: "nome" }), naRota());
    await waitFor(() => expect(result.current.pagina).toBe(1));
    act(() => result.current.setPagina(2));
    await waitFor(() => expect(result.current.visiveis).toEqual([{ id: "p2" }]));
    act(() => result.current.alternar("valor", "desc"));
    await waitFor(() => expect(ultimaUrl().searchParams.get("ordem")).toBe("-valor"));
    expect(ultimaUrl().searchParams.get("pagina")).toBe("1");
    act(() => result.current.setPorPagina?.(50));
    await waitFor(() => expect(ultimaUrl().searchParams.get("porPagina")).toBe("50"));
  });

  it("trocar o caminho (aba) volta para a página 1", async () => {
    get.mockImplementation((c: string) => Promise.resolve(resposta(Number(new URL(`http://x${c}`).searchParams.get("pagina")))));
    const { result, rerender } = renderHook(({ caminho }) => useTabelaServidor<{ id: string }, Resposta>(caminho, "itens", { ordemPadrao: "nome" }), { initialProps: { caminho: "/x" }, ...naRota() });
    act(() => result.current.setPagina(3));
    await waitFor(() => expect(result.current.pagina).toBe(3));
    rerender({ caminho: "/x?status=ativo" });
    await waitFor(() => expect(ultimaUrl().searchParams.get("status")).toBe("ativo"));
    expect(ultimaUrl().searchParams.get("pagina")).toBe("1");
  });

  it("pesquisa só depois de o usuário parar de digitar", async () => {
    vi.useFakeTimers();
    get.mockResolvedValue(resposta(1));
    const { result } = renderHook(() => useTabelaServidor<{ id: string }, Resposta>("/x", "itens", { ordemPadrao: "nome" }), naRota());
    act(() => result.current.setBusca("a"));
    act(() => result.current.setBusca("an"));
    act(() => result.current.setBusca("ana"));
    await act(async () => vi.advanceTimersByTime(400));
    vi.useRealTimers();
    const buscas = get.mock.calls.map(([c]) => new URL(`http://x${c}`).searchParams.get("busca")).filter(Boolean);
    expect(buscas).toEqual(["ana"]);
    expect(result.current.filtrando).toBe(true);
  });

  it("enquanto o usuário digita, indica que está pesquisando sem buscar com o termo antigo", async () => {
    get.mockImplementation((c: string) => Promise.resolve(resposta(Number(new URL(`http://x${c}`).searchParams.get("pagina")))));
    const { result } = renderHook(() => useTabelaServidor<{ id: string }, Resposta>("/x", "itens", { ordemPadrao: "nome" }), naRota());
    act(() => result.current.setPagina(2));
    await waitFor(() => expect(result.current.visiveis).toEqual([{ id: "p2" }]));
    const chamadas = get.mock.calls.length;
    act(() => result.current.setBusca("bia"));
    expect(result.current.pesquisando).toBe(true);
    expect(get.mock.calls.length).toBe(chamadas); // nada sai antes de parar de digitar
    await waitFor(() => expect(ultimaUrl().searchParams.get("busca")).toBe("bia"));
    expect(ultimaUrl().searchParams.get("pagina")).toBe("1");
    await waitFor(() => expect(result.current.pesquisando).toBe(false));
  });

  it("com naUrl, começa pelo estado da URL e grava nela as mudanças (sem mexer nos outros parâmetros)", async () => {
    get.mockImplementation((c: string) => Promise.resolve(resposta(Number(new URL(`http://x${c}`).searchParams.get("pagina")))));
    const { result } = renderHook(
      () => ({ tabela: useTabelaServidor<{ id: string }, Resposta>("/x", "itens", { ordemPadrao: "nome", naUrl: "" }), local: useLocation() }),
      naRota("/lista?aba=hoje&pagina=2&ordem=-nome&busca=ana"),
    );
    expect(result.current.tabela.pagina).toBe(2);
    expect(result.current.tabela.ordem).toBe("-nome");
    expect(result.current.tabela.busca).toBe("ana");
    await waitFor(() => expect(ultimaUrl().searchParams.get("pagina")).toBe("2"));
    expect(ultimaUrl().searchParams.get("busca")).toBe("ana");

    act(() => result.current.tabela.setOrdem("nome"));
    await waitFor(() => expect(new URLSearchParams(result.current.local.search).has("ordem")).toBe(false));
    const params = new URLSearchParams(result.current.local.search);
    expect(params.get("aba")).toBe("hoje");
    expect(params.has("pagina")).toBe(false); // trocar a ordem volta à página 1 (o padrão sai da URL)
    expect(params.get("busca")).toBe("ana");
  });
});
