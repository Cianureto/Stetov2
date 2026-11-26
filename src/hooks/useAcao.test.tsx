import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { useAcao } from "@/hooks/useAcao";

describe("useAcao", () => {
  it("marca pendente durante a ação e devolve true no sucesso", async () => {
    const { result } = renderHook(() => useAcao("Falhou."));
    let liberar!: () => void;
    let ok: boolean | undefined;
    act(() => {
      result.current.executar(() => new Promise<void>((r) => (liberar = r))).then((v) => (ok = v));
    });
    expect(result.current.pendente).toBe(true);
    await act(async () => liberar());
    expect(result.current.pendente).toBe(false);
    expect(ok).toBe(true);
    expect(result.current.erro).toBeNull();
  });

  it("guarda a mensagem do erro da API e devolve false", async () => {
    const { result } = renderHook(() => useAcao("Falhou."));
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.executar(() => Promise.reject(new ApiError("E-mail já cadastrado.")));
    });
    expect(ok).toBe(false);
    expect(result.current.erro).toBe("E-mail já cadastrado.");
    expect(result.current.pendente).toBe(false);
  });

  it("usa a mensagem padrão (ou a da chamada) para erros que não vêm da API", async () => {
    const { result } = renderHook(() => useAcao("Falhou."));
    await act(async () => {
      await result.current.executar(() => Promise.reject(new Error("rede")));
    });
    expect(result.current.erro).toBe("Falhou.");
    await act(async () => {
      await result.current.executar(() => Promise.reject(new Error("rede")), "Não foi possível excluir.");
    });
    expect(result.current.erro).toBe("Não foi possível excluir.");
  });

  it("limpa o erro anterior ao tentar de novo", async () => {
    const { result } = renderHook(() => useAcao());
    await act(async () => {
      await result.current.executar(() => Promise.reject(new ApiError("x")));
    });
    await act(async () => {
      await result.current.executar(() => Promise.resolve());
    });
    expect(result.current.erro).toBeNull();
  });
});
