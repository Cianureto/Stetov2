import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CampoMascara } from "@/components/ui/campo-mascara";

function Teste({ inicial = "" }: { inicial?: string }) {
  const [valor, setValor] = useState(inicial);
  return <CampoMascara aria-label="Telefone" tipo="telefone" valor={valor} onChange={setValor} />;
}

describe("CampoMascara", () => {
  afterEach(cleanup);
  it("aplica a máscara ao digitar e abre o teclado de telefone", () => {
    render(<Teste />);
    const campo = screen.getByLabelText("Telefone") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "85999998888" } });
    expect(campo.value).toBe("(85) 99999-8888");
    expect(campo.getAttribute("inputmode")).toBe("tel");
  });

  it("mostra valores antigos já formatados", () => {
    render(<Teste inicial="(85)99259.0404" />);
    expect((screen.getByLabelText("Telefone") as HTMLInputElement).value).toBe("(85) 99259-0404");
  });

  it("mostra o erro só depois de sair do campo e o tira quando o valor fica certo", () => {
    render(<Teste />);
    const campo = screen.getByLabelText("Telefone");
    fireEvent.change(campo, { target: { value: "8599" } });
    expect(screen.queryByText(/Telefone inválido/)).toBeNull();
    fireEvent.blur(campo);
    expect(screen.getByText(/Telefone inválido/)).toBeTruthy();
    expect(campo.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(campo, { target: { value: "85999998888" } });
    expect(screen.queryByText(/Telefone inválido/)).toBeNull();
  });
});
