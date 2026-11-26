import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/relatorios/graficos";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";
import type { CSSProperties } from "react";
import { BordaTrilha, NumeroAnimado } from "@/components/ui/numero-animado";
import { cn } from "@/lib/cn";
import { formatarPercentualCurto } from "@/lib/format";

/**
 * Selo de variação contra o período anterior: seta + número (nunca só a cor). `subirEBom` diz se alta é boa
 * (faturamento), ruim (pendências) ou nem um nem outro (`null`, selo neutro). Sem base de comparação (anterior zero), não mostra nada.
 */
export function SeloVariacao({ variacao, subirEBom = true, sobreAzul = false, className }: { variacao: number | null; subirEBom?: boolean | null; sobreAzul?: boolean; className?: string }) {
  if (variacao === null || !Number.isFinite(variacao)) return null;
  const estavel = Math.abs(variacao) < 0.05;
  const bom = estavel || subirEBom === null ? null : variacao > 0 === subirEBom;
  const Icone = estavel ? Minus : variacao > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        sobreAzul && "bg-white/15 text-white",
        !sobreAzul && bom === null && "bg-[var(--sidebar-hover-bg)] text-foreground-secondary",
        !sobreAzul && bom === true && "bg-[var(--sucesso-soft)] text-[var(--sucesso)]",
        !sobreAzul && bom === false && "bg-[var(--danger-soft)] text-[var(--danger)]",
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
  principal = false,
  ordem = 0,
  className,
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
  /** Cartão maior em azul da marca (o indicador principal da tela). */
  principal?: boolean;
  /** Posição na cascata de entrada (0, 1, 2…). */
  ordem?: number;
  className?: string;
}) {
  const estilo = { "--i": ordem } as CSSProperties;
  if (principal) {
    return (
      <section aria-label={titulo} style={estilo} className={cn("kpi kpi-principal kpi-entrada flex min-w-0 flex-col p-5 md:p-6", className)}>
        <BordaTrilha clara />
        <svg aria-hidden viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.25} className="kpi-aneis pointer-events-none absolute -right-14 -top-16 size-56 text-white/[0.13]">
          <circle cx="100" cy="100" r="38" />
          <circle cx="100" cy="100" r="62" />
          <circle cx="100" cy="100" r="86" />
        </svg>
        <div className="relative flex items-start justify-between gap-4">
          <span className="kpi-icone grid size-10 place-items-center rounded-xl bg-white/15 text-white">
            <Icone aria-hidden className="size-5" />
          </span>
          {tendencia && tendencia.length > 1 && (
            <div className="w-40 max-w-[45%]">
              <Sparkline dados={tendencia} cor="#ffffff" corLinha="rgba(255,255,255,0.55)" corAnel="#1d4ed8" altura={44} />
            </div>
          )}
        </div>
        <div className="relative mt-4 flex items-center gap-1 text-[13px] font-medium text-white/80">
          {titulo}
          {ajuda && <AjudaIndicador escuro indicador={titulo} texto={ajuda} />}
        </div>
        <div className="numero-destaque relative mt-1"><NumeroAnimado valor={valor} /></div>
        <div className="relative mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs text-white/75">
          <SeloVariacao variacao={variacao} subirEBom={subirEBom} sobreAzul />
          <span>{variacao === null ? "sem dados no período anterior" : comparacao}</span>
          {nota && <span className="text-white/75">· {nota}</span>}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("card kpi kpi-entrada flex min-w-0 flex-col p-4 md:p-5", className)} style={estilo} aria-label={titulo}>
      <BordaTrilha />
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-icone grid size-9 place-items-center rounded-xl bg-azul-50 text-azul-600 ring-1 ring-inset ring-azul-100">
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
      <div className="numero-kpi mt-0.5 text-foreground"><NumeroAnimado valor={valor} /></div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
        <SeloVariacao variacao={variacao} subirEBom={subirEBom} />
        <span>{variacao === null ? "sem dados no período anterior" : comparacao}</span>
      </div>
      {nota && <p className="mt-1 text-xs text-foreground-muted">{nota}</p>}
    </section>
  );
}
