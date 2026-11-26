import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/relatorios/graficos";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";
import { cn } from "@/lib/cn";
import { formatarPercentualCurto } from "@/lib/format";

/**
 * Selo de variação contra o período anterior: seta + número (nunca só a cor). `subirEBom` diz se alta é boa
 * (faturamento), ruim (pendências) ou nem um nem outro (`null`, selo neutro). Sem base de comparação (anterior zero), não mostra nada.
 */
export function SeloVariacao({ variacao, subirEBom = true, className }: { variacao: number | null; subirEBom?: boolean | null; className?: string }) {
  if (variacao === null || !Number.isFinite(variacao)) return null;
  const estavel = Math.abs(variacao) < 0.05;
  const bom = estavel || subirEBom === null ? null : variacao > 0 === subirEBom;
  const Icone = estavel ? Minus : variacao > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        bom === null && "bg-[var(--sidebar-hover-bg)] text-foreground-secondary",
        bom === true && "bg-[var(--sucesso-soft)] text-[var(--sucesso)]",
        bom === false && "bg-[var(--danger-soft)] text-[var(--danger)]",
        className,
      )}
    >
      <Icone aria-hidden className="size-3.5" />
      <span className="sr-only">{estavel ? "Estável" : variacao > 0 ? "Alta de" : "Queda de"}</span>
      {formatarPercentualCurto(Math.abs(variacao))}
    </span>
  );
}

/** Cartão de indicador: ícone, nome, valor, variação contra o período anterior e mini tendência mês a mês. */
export function CartaoIndicador({
  icone: Icone,
  titulo,
  valor,
  variacao,
  subirEBom = true,
  comparacao,
  nota,
  tendencia,
  ajuda,
}: {
  icone: LucideIcon;
  titulo: string;
  valor: string;
  variacao: number | null;
  subirEBom?: boolean | null;
  /** "vs. jan–nov/2025" */
  comparacao: string;
  nota?: string;
  tendencia?: number[];
  ajuda?: string;
}) {
  return (
    <section className="card flex min-w-0 flex-col p-4 md:p-5" aria-label={titulo}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--marca-claro)] text-[var(--marca)]">
          <Icone aria-hidden className="size-[18px]" />
        </span>
        {tendencia && tendencia.length > 1 && (
          <div className="w-24">
            <Sparkline dados={tendencia} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[13px] text-foreground-secondary">
        {titulo}
        {ajuda && <AjudaIndicador indicador={titulo} texto={ajuda} />}
      </div>
      <div className="mt-0.5 text-[26px] font-semibold leading-tight tracking-tight text-foreground">{valor}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
        <SeloVariacao variacao={variacao} subirEBom={subirEBom} />
        <span>{variacao === null ? "sem dados no período anterior" : comparacao}</span>
      </div>
      {nota && <p className="mt-1 text-xs text-foreground-muted">{nota}</p>}
    </section>
  );
}
