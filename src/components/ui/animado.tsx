import { useRef, type CSSProperties } from "react";
import { gsap, useGSAP, reduzMovimento } from "@/lib/gsap";
import { cn } from "@/lib/cn";

// Números no formato pt-BR dentro de um texto: "43%", "4 / 6", "R$ 12.345,67", "1,2 mil".
const NUMERO = /\d[\d.]*(?:,\d+)?/g;

function lerNumero(trecho: string) {
  const [inteiro, decimal = ""] = trecho.split(",");
  return { valor: Number(inteiro.replace(/\./g, "") + (decimal ? `.${decimal}` : "")), casas: decimal.length, milhar: inteiro.includes(".") };
}

function escrever(n: number, casas: number, milhar: boolean) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: milhar || n >= 1000 });
}

/** Conta de 0 (ou do valor anterior) até o valor, com ease in-out. Aceita número ou texto com números. */
export function Contador({ valor, duracao = 1.1, className }: { valor: number | string; duracao?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const anterior = useRef<number[] | null>(null);
  const texto = typeof valor === "number" ? escrever(valor, 0, valor >= 1000) : valor;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const partes = texto.split(NUMERO);
      const numeros = (texto.match(NUMERO) ?? []).map(lerNumero);
      if (numeros.length === 0 || reduzMovimento()) {
        el.textContent = texto;
        anterior.current = numeros.map((n) => n.valor);
        return;
      }
      // parte do que está na tela agora: 0 na primeira vez, ou o valor anterior quando o dado muda
      const de = numeros.map((_, i) => anterior.current?.[i] ?? 0);
      const atual = [...de];
      const estado = { p: 0 };
      const pintar = () => {
        el.textContent = partes.reduce((acc, parte, i) => {
          if (i === 0) return parte;
          const n = numeros[i - 1];
          atual[i - 1] = de[i - 1] + (n.valor - de[i - 1]) * estado.p;
          return acc + escrever(atual[i - 1], n.casas, n.milhar) + parte;
        }, "");
      };
      pintar();
      gsap.to(estado, { p: 1, duration: duracao, onUpdate: pintar, onComplete: () => (el.textContent = texto) });
      return () => {
        anterior.current = atual;
      };
    },
    { dependencies: [texto], revertOnUpdate: true }
  );

  return (
    <span ref={ref} className={cn("tabular-nums", className)} aria-label={texto}>
      {texto}
    </span>
  );
}

/** Barra de progresso/proporção que cresce da esquerda até `pct` (0–100). */
export function Barra({ pct, className, style, atraso = 0 }: { pct: number; className?: string; style?: CSSProperties; atraso?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const largura = `${Math.max(0, Math.min(100, pct))}%`;

  useGSAP(
    () => {
      if (!ref.current || reduzMovimento()) return;
      gsap.fromTo(ref.current, { width: "0%" }, { width: largura, duration: 0.9, delay: atraso });
    },
    { dependencies: [largura], revertOnUpdate: true }
  );

  return <div ref={ref} className={className} style={{ ...style, width: largura }} />;
}
