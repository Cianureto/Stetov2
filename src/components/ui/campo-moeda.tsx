import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { lerNumeroBR } from "@/lib/format";

const formatar = (v: number) => (v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

/**
 * Valor em reais: digita livre ("1234,5", "1.234,50"), formata ao sair do campo, teclado decimal no celular.
 * `valor` e `onChange` trabalham com número; texto inválido vira 0 ao sair.
 */
export function CampoMoeda({ id, valor, onChange, className, invalido, ...props }: {
  id?: string;
  valor: number;
  onChange: (v: number) => void;
  className?: string;
  invalido?: boolean;
  disabled?: boolean;
  "aria-describedby"?: string;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">R$</span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        maxLength={16}
        aria-invalid={invalido || undefined}
        className={cn("pl-9 text-right tabular-nums", invalido && "border-[var(--danger)]", className)}
        value={texto ?? formatar(valor)}
        onFocus={(e) => {
          setTexto(formatar(valor));
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const limpo = e.target.value.replace(/[^\d.,]/g, "");
          setTexto(limpo);
          const n = lerNumeroBR(limpo);
          if (!Number.isNaN(n)) onChange(Math.max(0, Math.round(n * 100) / 100));
        }}
        onBlur={() => setTexto(null)}
        {...props}
      />
    </div>
  );
}
