import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EstadoCarga } from "@/components/EstadoCarga";
import { combinarCargas, type Carga } from "@/lib/carga";

afterEach(cleanup);

const carga = <T,>(parcial: Partial<Carga<T>>): Carga<T> => ({ dados: null, erro: null, carregando: false, recarregar: vi.fn(), ...parcial });
const lista = (d: string[]) => <ul>{d.map((x) => <li key={x}>{x}</li>)}</ul>;

describe("EstadoCarga", () => {
  it("primeira carga mostra o esqueleto, não a mensagem de vazio", () => {
    render(
      <EstadoCarga carga={carga<string[]>({ carregando: true })} esqueleto={<p>esqueleto</p>} vazio={(d) => d.length === 0} mensagemVazio="Nada ainda.">
        {lista}
      </EstadoCarga>,
    );
    expect(screen.getByText("esqueleto")).toBeTruthy();
    expect(screen.queryByText("Nada ainda.")).toBeNull();
  });

  it("falha sem dados mostra o erro e 'Tentar de novo' chama recarregar", () => {
    const recarregar = vi.fn();
    render(<EstadoCarga carga={carga<string[]>({ erro: "Fora do ar.", recarregar })}>{lista}</EstadoCarga>);
    expect(screen.getByRole("alert").textContent).toContain("Fora do ar.");
    fireEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    expect(recarregar).toHaveBeenCalledOnce();
  });

  it("vazio só depois de carregar", () => {
    render(
      <EstadoCarga carga={carga<string[]>({ dados: [] })} vazio={(d) => d.length === 0} mensagemVazio="Nada ainda.">
        {lista}
      </EstadoCarga>,
    );
    expect(screen.getByText("Nada ainda.")).toBeTruthy();
  });

  it("com dados renderiza o conteúdo; recarregando, esmaece e marca aria-busy", () => {
    const { container } = render(<EstadoCarga carga={carga({ dados: ["a", "b"], carregando: true })}>{lista}</EstadoCarga>);
    expect(screen.getByText("b")).toBeTruthy();
    const envoltorio = container.querySelector("[aria-busy]");
    expect(envoltorio?.className).toContain("opacity-60");
  });

  it("falha numa recarga mantém os dados e mostra a faixa de erro", () => {
    render(<EstadoCarga carga={carga({ dados: ["a"], erro: "Não atualizou." })}>{lista}</EstadoCarga>);
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Não atualizou.");
  });
});

describe("combinarCargas", () => {
  it("só tem dados quando todas têm; carrega se qualquer uma carrega; recarrega todas", () => {
    const a = carga({ dados: 1 });
    const b = carga({ dados: null, carregando: true });
    const junta = combinarCargas(a, b);
    expect(junta.dados).toBeNull();
    expect(junta.carregando).toBe(true);
    junta.recarregar();
    expect(a.recarregar).toHaveBeenCalledOnce();
    expect(b.recarregar).toHaveBeenCalledOnce();
    expect(combinarCargas(a, carga({ dados: 2, erro: "x" })).erro).toBe("x");
  });
});
