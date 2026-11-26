import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Contador } from "@/components/ui/animado";
import { Skeleton } from "@/components/ui/skeleton";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";

/**
 * Faixa de números: um bloco só, com divisões finas entre as métricas (classe .faixa).
 * Com `separados`, cada métrica vira um card próprio, com espaço entre eles.
 */
export function Metricas({ children, className, separados }: { children: ReactNode; className?: string; separados?: boolean }) {
  return (
    <div data-entra className={cn(separados ? "metricas-separadas" : "faixa", "grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function Metrica({
  titulo,
  valor,
  nota,
  notaRuim,
  legenda,
  destaque,
  pequeno,
  progresso,
  tom = "ok",
  ajuda,
}: {
  titulo: string;
  /** undefined/null = carregando */
  valor: number | string | undefined | null;
  /** comparação curta ao lado da legenda, ex.: "+4" ou "abaixo da meta" */
  nota?: string;
  notaRuim?: boolean;
  legenda?: ReactNode;
  destaque?: boolean;
  /** para textos longos no lugar de número (ex.: nome de produto) */
  pequeno?: boolean;
  /** barra fina de 0 a 100 abaixo do número, com a cor do tom */
  progresso?: number;
  tom?: "ok" | "atencao" | "ruim";
  /** Texto de "como é calculado" (ícone "?" ao lado do título). */
  ajuda?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col px-4 py-3.5 md:px-5 md:py-4">
      <div className="flex items-start gap-1 text-[12px] font-medium leading-tight text-foreground-secondary md:text-[13px]">
        <span className="min-w-0">{titulo}</span>
        {ajuda && <AjudaIndicador indicador={titulo} texto={ajuda} className="-my-0.5" />}
      </div>
      <div className={cn("mt-1.5 font-semibold leading-tight tracking-tight", pequeno ? "text-base md:text-lg leading-snug" : "text-xl md:text-2xl", destaque && "text-marca")}>
        {valor == null ? <Skeleton className="h-8 w-16" /> : pequeno ? valor : <Contador valor={valor} />}
      </div>
      {progresso != null && valor != null && (
        <div className="mt-2 h-1 overflow-hidden md:mt-3 md:h-1.5 rounded-full bg-[var(--areia)]">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(100, progresso))}%`, background: tom === "ruim" ? "var(--danger)" : tom === "atencao" ? "var(--acafrao)" : "var(--marca)" }}
          />
        </div>
      )}
      {(nota || legenda) && (
        <div className="mt-auto pt-1.5 text-xs leading-snug text-foreground-muted md:pt-2.5">
          {nota && <span className={cn("mr-1.5 font-semibold", notaRuim ? "text-[var(--danger)]" : "text-marca")}>{nota}</span>}
          {legenda}
        </div>
      )}
    </div>
  );
}
