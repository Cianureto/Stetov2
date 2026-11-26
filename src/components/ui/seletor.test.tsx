import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Seletor } from "@/components/ui/seletor";
import type { OpcaoSeletor } from "@/lib/busca";

afterEach(cleanup);
beforeAll(() => {
  // O jsdom não tem ResizeObserver (posicionamento do Radix) nem matchMedia; aqui o aparelho é "com mouse".
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  window.matchMedia = ((consulta: string) => ({ matches: false, media: consulta, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
});

const CONSULTORES: OpcaoSeletor[] = ["Ana Souza", "Bruna Lima", "Carlos Melo", "Débora Reis", "Eduardo Paz", "Fábio Nunes", "Gabriela Cruz", "Hélio Dias"].map((nome, i) => ({ valor: `c${i}`, rotulo: nome }));

function Controlado(props: Partial<Parameters<typeof Seletor>[0]> & { aoMudar?: (v: string) => void }) {
  const [valor, setValor] = useState(props.valor ?? "");
  return (
    <Seletor
      rotulo="Consultor"
      opcoes={CONSULTORES}
      {...props}
      valor={valor}
      onChange={(v) => {
        setValor(v);
        props.aoMudar?.(v);
      }}
    />
  );
}

const abrir = () => fireEvent.click(screen.getByRole("button", { name: /Consultor/ }));

describe("Seletor", () => {
  it("mostra o placeholder e, escolhida uma opção, o rótulo dela", () => {
    const aoMudar = vi.fn();
    render(<Controlado aoMudar={aoMudar} />);
    expect(screen.getByRole("button", { name: "Consultor: Selecione..." })).toBeTruthy();
    abrir();
    fireEvent.click(screen.getByRole("option", { name: "Carlos Melo" }));
    expect(aoMudar).toHaveBeenCalledWith("c2");
    expect(screen.getByRole("button", { name: "Consultor: Carlos Melo" })).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("filtra pela busca sem diferenciar acento e escolhe com Enter", () => {
    const aoMudar = vi.fn();
    render(<Controlado aoMudar={aoMudar} />);
    abrir();
    const busca = screen.getByRole("combobox", { name: "Procurar consultor" });
    expect(document.activeElement).toBe(busca);
    fireEvent.change(busca, { target: { value: "debora" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Débora Reis"]);
    fireEvent.keyDown(busca, { key: "Enter" });
    expect(aoMudar).toHaveBeenCalledWith("c3");
  });

  it("avisa quando a busca não encontra nada", () => {
    render(<Controlado />);
    abrir();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });
    expect(screen.getByText("Nada encontrado.")).toBeTruthy();
  });

  it("navega pelas setas, pulando opções desabilitadas", () => {
    const aoMudar = vi.fn();
    const opcoes = [{ valor: "a", rotulo: "Ativo" }, { valor: "x", rotulo: "Arquivado", desabilitada: true }, { valor: "i", rotulo: "Inativo" }];
    render(<Controlado opcoes={opcoes} valor="a" aoMudar={aoMudar} />);
    abrir();
    const lista = screen.getByRole("listbox");
    fireEvent.keyDown(lista, { key: "ArrowDown" });
    fireEvent.keyDown(lista, { key: "Enter" });
    expect(aoMudar).toHaveBeenCalledWith("i");
  });

  it("sem campo de busca (poucas opções), a letra pula para a opção", () => {
    const aoMudar = vi.fn();
    const opcoes = [{ valor: "p", rotulo: "Pendente" }, { valor: "c", rotulo: "Confirmado" }, { valor: "r", rotulo: "Realizado" }];
    render(<Controlado opcoes={opcoes} valor="p" aoMudar={aoMudar} />);
    abrir();
    expect(screen.queryByRole("combobox")).toBeNull();
    const lista = screen.getByRole("listbox");
    fireEvent.keyDown(lista, { key: "r" });
    fireEvent.keyDown(lista, { key: "Enter" });
    expect(aoMudar).toHaveBeenCalledWith("r");
  });

  it("opcaoVazia aparece no topo com valor vazio", () => {
    render(<Controlado valor="c1" opcaoVazia="Todos os consultores" />);
    abrir();
    const [primeira] = screen.getAllByRole("option");
    expect(primeira.textContent).toBe("Todos os consultores");
    fireEvent.click(primeira);
    expect(screen.getByRole("button", { name: "Consultor: Todos os consultores" })).toBeTruthy();
  });

  it("obrigatório bloqueia o envio do formulário enquanto vazio", () => {
    const enviar = vi.fn((ev: React.FormEvent) => ev.preventDefault());
    render(
      <form onSubmit={enviar}>
        <Controlado obrigatorio />
        <button type="submit">Salvar</button>
      </form>,
    );
    const form = screen.getByRole("button", { name: "Salvar" }).closest("form")!;
    expect(form.checkValidity()).toBe(false);
    abrir();
    fireEvent.click(screen.getByRole("option", { name: "Ana Souza" }));
    expect(form.checkValidity()).toBe(true);
  });

  it("desabilitado não abre", () => {
    render(<Controlado desabilitado />);
    abrir();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
