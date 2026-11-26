import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";

afterEach(cleanup);
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const base = { rotulo: "Novembro de 2026", titulo: "Relatórios", descricao: "Desempenho da equipe." };

describe("CabecalhoHero", () => {
  it("mostra título, números formatados e a nota de comparação", () => {
    render(<CabecalhoHero {...base} numeros={[{ valor: 1234, rotulo: "Visitas no mês", nota: "+12% vs. mês anterior" }, { valor: "86%", rotulo: "Comparecimento", nota: "abaixo da meta", notaRuim: true }]} />);
    expect(screen.getByRole("heading", { name: "Relatórios" })).toBeTruthy();
    expect(screen.getByText("1.234")).toBeTruthy();
    expect(screen.getByText("+12% vs. mês anterior").className).toContain("text-realce");
    expect(screen.getByText("abaixo da meta").className).toContain("acafrao");
  });

  it("carregando mostra reticências; com falha, travessão", () => {
    const { rerender } = render(<CabecalhoHero {...base} numeros={[{ valor: undefined, rotulo: "Visitas" }]} />);
    expect(screen.getByText("…")).toBeTruthy();
    rerender(<CabecalhoHero {...base} falhou numeros={[{ valor: undefined, rotulo: "Visitas" }]} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("mostra o \"?\" só nos números com ajuda e abre o texto no toque", () => {
    render(
      <CabecalhoHero
        {...base}
        numeros={[
          { valor: "80%", rotulo: "Relatórios enviados", ajuda: "Visitas com relatório ÷ visitas que já passaram." },
          { valor: 12, rotulo: "Visitas" },
        ]}
      />,
    );
    const botoes = screen.getAllByRole("button", { name: /Como é calculado/ });
    expect(botoes).toHaveLength(1);
    expect(botoes[0].getAttribute("aria-label")).toBe("Como é calculado: Relatórios enviados");
    fireEvent.click(botoes[0]);
    expect(screen.getByRole("dialog", { name: "Relatórios enviados" }).textContent).toContain("Visitas com relatório ÷ visitas que já passaram.");
  });
});
