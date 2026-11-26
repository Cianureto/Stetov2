import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";

afterEach(cleanup);
beforeAll(() => {
  // O jsdom não tem ResizeObserver (posicionamento do Radix).
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const TEXTO = "Divide as visitas com relatório enviado pelas visitas que já passaram.";
const botao = () => screen.getByRole("button", { name: "Como é calculado: Relatórios enviados" });

describe("AjudaIndicador", () => {
  it("tem nome acessível e começa fechado", () => {
    render(<AjudaIndicador indicador="Relatórios enviados" texto={TEXTO} />);
    expect(botao().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(TEXTO)).toBeNull();
  });

  it("abre no clique/toque (sem depender de hover) com o título e o texto", () => {
    render(<AjudaIndicador indicador="Relatórios enviados" texto={TEXTO} />);
    fireEvent.click(botao());
    const balao = screen.getByRole("dialog", { name: "Relatórios enviados" });
    expect(balao.textContent).toContain(TEXTO);
    expect(botao().getAttribute("aria-expanded")).toBe("true");
  });

  it("fecha com Esc e com um novo toque no ícone", () => {
    render(<AjudaIndicador indicador="Relatórios enviados" texto={TEXTO} />);
    fireEvent.click(botao());
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByText(TEXTO)).toBeNull();

    fireEvent.click(botao());
    expect(screen.getByText(TEXTO)).toBeTruthy();
    fireEvent.click(botao());
    expect(screen.queryByText(TEXTO)).toBeNull();
  });

  it("não dispara o clique do cartão em volta", () => {
    const aoClicarCartao = vi.fn();
    render(
      <div onClick={aoClicarCartao}>
        <AjudaIndicador indicador="Relatórios enviados" texto={TEXTO} />
      </div>,
    );
    fireEvent.click(botao());
    fireEvent.click(screen.getByText(TEXTO));
    expect(aoClicarCartao).not.toHaveBeenCalled();
  });
});
