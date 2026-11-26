import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InputSenha } from "@/components/ui/input-senha";

afterEach(cleanup);

describe("InputSenha", () => {
  it("começa oculta e alterna entre mostrar e ocultar", () => {
    render(<InputSenha id="senha" aria-label="Senha" defaultValue="segredo" />);
    const campo = screen.getByLabelText("Senha") as HTMLInputElement;
    expect(campo.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(campo.type).toBe("text");
    expect(campo.value).toBe("segredo");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(campo.type).toBe("password");
  });

  it("o botão não envia o formulário", () => {
    let enviado = false;
    render(
      <form onSubmit={(e) => { e.preventDefault(); enviado = true; }}>
        <InputSenha aria-label="Senha" />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(enviado).toBe(false);
  });
});
