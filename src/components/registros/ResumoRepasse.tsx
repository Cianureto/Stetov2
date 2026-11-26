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
    <div role="status" aria-live="polite" className={cn("rounded-xl p-4 sm:p-5", negativo ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--sidebar-bg)] text-white")}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="size-4" aria-hidden /> Valor final do repasse
      </div>
      <p className="mt-1 font-titulo text-3xl font-bold tabular-nums">{formatarMoeda(calculo.valorFinalRepasse)}</p>
      <dl className={cn("mt-3 space-y-1 text-[13px]", negativo ? "" : "text-white/80")}>
        {linhas.map(([rotulo, v]) => (
          <div key={rotulo} className="flex justify-between gap-3">
            <dt>{rotulo}</dt>
            <dd className="tabular-nums">{v < 0 ? `− ${formatarMoeda(-v)}` : formatarMoeda(v)}</dd>
          </div>
        ))}
        <div className={cn("flex justify-between gap-3 border-t pt-1", negativo ? "border-[var(--danger)]/20" : "border-white/15")}>
          <dt>Tributos retidos (informativo)</dt>
          <dd className="tabular-nums">{formatarMoeda(calculo.valorTotalTributos)}</dd>
        </div>
      </dl>
      {negativo && <p className="mt-2 text-[13px] font-medium">O repasse não pode ficar negativo: diminua o desconto adicional.</p>}
    </div>
  );
}
