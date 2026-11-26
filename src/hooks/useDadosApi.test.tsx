import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/api/client";
import { useDadosApi } from "@/hooks/useDadosApi";
import { MENSAGEM_SEM_CONEXAO } from "@/lib/erros";

vi.mock("@/api/client", async (original) => {
  const real = await original<typeof import("@/api/client")>();
  return { ...real, api: { ...real.api, get: vi.fn() } };
});
const get = vi.mocked(api.get);

/** Promessa controlada pelo teste: resolve/rejeita quando o teste mandar. */
function adiada<T>() {
  let resolver!: (v: T) => void;
  let rejeitar!: (e: unknown) => void;
  const promessa = new Promise<T>((res, rej) => ((resolver = res), (rejeitar = rej)));
  return { promessa, resolver, rejeitar };
}

describe("useDadosApi", () => {
  beforeEach(() => get.mockReset());

  it("carrega e expõe os dados", async () => {
    get.mockResolvedValue({ itens: [1, 2] });
    const { result } = renderHook(() => useDadosApi<{ itens: number[] }>("/itens"));
    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.dados).toEqual({ itens: [1, 2] }));
    expect(result.current.carregando).toBe(false);
    expect(result.current.erro).toBeNull();
    expect(get).toHaveBeenCalledWith("/itens");
  });

  it("caminho null não busca nada", () => {
    const { result } = renderHook(() => useDadosApi(null));
    expect(get).not.toHaveBeenCalled();
    expect(result.current.carregando).toBe(false);
    expect(result.current.dados).toBeNull();
  });

  it("erro da API vira mensagem; erro de rede avisa a falta de conexão; outros usam a mensagem padrão", async () => {
    const erroApi = new ApiError("Sem permissão.");
    get.mockRejectedValueOnce(erroApi);
    const { result, rerender } = renderHook(({ caminho }) => useDadosApi(caminho, "Falhou."), { initialProps: { caminho: "/a" } });
    await waitFor(() => expect(result.current.erro).toBe("Sem permissão."));

    get.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    rerender({ caminho: "/b" });
    await waitFor(() => expect(result.current.erro).toBe(MENSAGEM_SEM_CONEXAO));

    get.mockRejectedValueOnce(new Error("inesperado"));
    rerender({ caminho: "/c" });
    await waitFor(() => expect(result.current.erro).toBe("Falhou."));
  });

  it("descarta a resposta atrasada de um caminho antigo", async () => {
    const lenta = adiada<string>();
    const rapida = adiada<string>();
    get.mockReturnValueOnce(lenta.promessa).mockReturnValueOnce(rapida.promessa);
    const { result, rerender } = renderHook(({ caminho }) => useDadosApi<string>(caminho), { initialProps: { caminho: "/semana-1" } });
    rerender({ caminho: "/semana-2" });
    await act(async () => rapida.resolver("dados da semana 2"));
    await act(async () => lenta.resolver("dados da semana 1"));
    expect(result.current.dados).toBe("dados da semana 2");
  });

  it("recarregar busca de novo e mantém os dados antigos enquanto isso", async () => {
    get.mockResolvedValueOnce("v1");
    const { result } = renderHook(() => useDadosApi<string>("/x"));
    await waitFor(() => expect(result.current.dados).toBe("v1"));

    const segunda = adiada<string>();
    get.mockReturnValueOnce(segunda.promessa);
    act(() => result.current.recarregar());
    expect(result.current.carregando).toBe(true);
    expect(result.current.dados).toBe("v1");
    await act(async () => segunda.resolver("v2"));
    expect(result.current.dados).toBe("v2");
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("falha numa recarga mantém os dados e mostra o erro", async () => {
    get.mockResolvedValueOnce("v1").mockRejectedValueOnce(new ApiError("Fora do ar."));
    const { result } = renderHook(() => useDadosApi<string>("/x"));
    await waitFor(() => expect(result.current.dados).toBe("v1"));
    act(() => result.current.recarregar());
    await waitFor(() => expect(result.current.erro).toBe("Fora do ar."));
    expect(result.current.dados).toBe("v1");
  });
});
