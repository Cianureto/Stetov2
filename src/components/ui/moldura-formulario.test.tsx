import { useState, type FormEvent } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MolduraFormulario, type ModoFormulario } from "@/components/ui/moldura-formulario";

afterEach(cleanup);

function Formulario({ modo, onSubmit, onFechar = () => {}, children }: { modo?: ModoFormulario; onSubmit: (e: FormEvent) => void; onFechar?: () => void; children?: React.ReactNode }) {
  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Área"
      titulo={modo === "modal" ? "Interno" : "Externo"}
      onFechar={onFechar}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      footer={<button type="submit">Salvar {modo === "modal" ? "interno" : "externo"}</button>}
    >
      {children}
    </MolduraFormulario>
  );
}

describe("moldura do formulário", () => {
  it("como tela: título, sobretítulo, Voltar e sem diálogo", () => {
    const onFechar = vi.fn();
    render(<Formulario onSubmit={() => {}} onFechar={onFechar} />);
    expect(screen.getByRole("heading", { level: 1, name: "Externo" })).toBeTruthy();
    expect(screen.getByText("Área")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it("como modal: abre num diálogo", () => {
    render(<Formulario modo="modal" onSubmit={() => {}} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("salvar o formulário aberto em modal de dentro de outro não envia o de fora", () => {
    const externo = vi.fn();
    const interno = vi.fn();
    function Aninhado() {
      const [aberto, setAberto] = useState(true);
      return (
        <Formulario onSubmit={externo}>
          {aberto && <Formulario modo="modal" onSubmit={() => { interno(); setAberto(false); }} />}
        </Formulario>
      );
    }
    render(<Aninhado />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar interno" }));
    expect(interno).toHaveBeenCalledOnce();
    expect(externo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar externo" }));
    expect(externo).toHaveBeenCalledOnce();
  });
});
