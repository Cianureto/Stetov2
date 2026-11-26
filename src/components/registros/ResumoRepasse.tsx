import { Calculator } from "lucide-react";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { CalculoRepasse } from "@/lib/repasse";
import { cn } from "@/lib/cn";

/** Conta do repasse ao vivo: NF − desconto padrão − desconto adicional + acréscimo (tributos à parte, informativos). */
export function ResumoRepasse({ valorNf, calculo, descontoPercent, descontoAdicional, acrescimo }: { valorNf: number; calculo: CalculoRepasse; descontoPercent: number; descontoAdicional: number; acrescimo: number }) {
  const negativo = calculo.valorFinalRepasse < 0;
  const linhas: [string, number, string?][] = [
    ["Valor da NF", valorNf],
    [`Desconto padrão (${formatarPercentual(descontoPercent)})`, -calculo.descontoPadraoAplicado],
    ["Desconto adicional", -descontoAdicional],
    ["Acréscimo", acrescimo],
  ];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("card overflow-hidden", negativo && "border-[var(--danger)]/40")}
    >
      <div className={cn("border-b px-5 py-4", negativo ? "border-[var(--danger)]/20 bg-[var(--danger-soft)]" : "border-borda bg-[var(--marca-claro)]/50")}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground-secondary">
          <span className="grid size-7 place-items-center rounded-lg bg-areia-card text-[var(--marca)] shadow-[0_1px_2px_rgba(11,27,54,0.08)]">
            <Calculator className="size-4" aria-hidden />
          </span>
          Valor final do repasse
        </div>
        <p className={cn("mt-2 text-[28px] font-semibold leading-tight tracking-tight tabular-nums", negativo ? "text-[var(--danger)]" : "text-[var(--marca)]")}>
          {formatarMoeda(calculo.valorFinalRepasse)}
        </p>
      </div>
      <dl className="space-y-2 px-5 py-4 text-[13px]">
        {linhas.map(([rotulo, v]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt className="text-foreground-secondary">{rotulo}</dt>
            <dd className="tabular-nums font-medium text-foreground">{v < 0 ? `− ${formatarMoeda(-v)}` : formatarMoeda(v)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-borda pt-2.5">
          <dt className="text-foreground-secondary">Tributos retidos <span className="text-foreground-muted">(informativo)</span></dt>
          <dd className="tabular-nums font-medium text-foreground">{formatarMoeda(calculo.valorTotalTributos)}</dd>
        </div>
      </dl>
      {negativo && <p className="px-5 pb-4 text-[13px] font-medium text-[var(--danger)]">O repasse não pode ficar negativo: diminua o desconto adicional.</p>}
    </div>
  );
}
