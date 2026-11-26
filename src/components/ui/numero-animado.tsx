import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Número dos KPIs: os caracteres aparecem um de cada vez, da esquerda para a direita, subindo e saindo do
 * desfoque (CSS `.numero-char` no index.css; acompanha a cascata do cartão pelo `--i`). Quando o valor muda,
 * só os caracteres que mudaram reaparecem: a chave de cada um é a posição contada da direita + o próprio
 * caractere, então o React reaproveita os iguais. Leitor de tela recebe o valor inteiro.
 */
export function NumeroAnimado({ valor, className }: { valor: string | number; className?: string }) {
  const texto = typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor;
  const caracteres = [...texto];
  return (
    <span className={cn("relative inline-flex whitespace-nowrap", className)}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden className="inline-flex">
        {caracteres.map((c, i) => (
          <span key={`${caracteres.length - i}-${c}`} className="numero-char" style={{ "--c": i } as CSSProperties}>
            {c === " " ? " " : c}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Luz discreta que percorre a borda do cartão (como o Border Trail do motion-primitives, em CSS puro).
 * O cartão precisa ser `relative`; a volta começa em pontos diferentes em cada cartão (pelo `--i`).
 */
export function BordaTrilha({ clara = false }: { clara?: boolean }) {
  return (
    <span aria-hidden className={cn("borda-trilha", clara && "borda-trilha-clara")}>
      <span className="borda-trilha-ponto" />
    </span>
  );
}
