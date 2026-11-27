import { useId } from "react";
import { cn } from "@/lib/cn";
import { PilulaDeslizante } from "@/components/ui/pilula-deslizante";

export type AbaContagem<T extends string> = { id: T; label: string; total?: number; destaque?: boolean };

/** Abas em pílula com a contagem de cada uma (ex.: Todos · Publicados · Privados). `destaque`: contagem em açafrão. */
export function AbasContagem<T extends string>({ abas, valor, onChange, rotulo, className }: { abas: AbaContagem<T>[]; valor: T; onChange: (v: T) => void; rotulo: string; className?: string }) {
  const grupo = useId();
  return (
    <div role="tablist" aria-label={rotulo} className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none]", className)}>
      {abas.map((a) => {
        const ativa = valor === a.id;
        return (
          <button
            key={a.id || "todos"}
            type="button"
            role="tab"
            aria-selected={ativa}
            onClick={() => onChange(a.id)}
            className={cn(
              "relative isolate inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--dur-hover)] pointer-coarse:h-11",
              ativa ? "text-white" : "bg-areia-card text-foreground-secondary shadow-[var(--shadow-xs)] ring-1 ring-borda hover:text-foreground hover:ring-tinta-300",
            )}
          >
            {ativa && <PilulaDeslizante grupo={grupo} className="rounded-full bg-marca shadow-[0_6px_14px_-6px_rgba(29,78,216,0.6)]" />}
            {a.label}
            {a.total !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-[18px]",
                  a.destaque && a.total > 0 ? "bg-[var(--acafrao)] text-[var(--foreground)]" : ativa ? "bg-white/20 text-white" : "bg-tinta-100 text-foreground-muted",
                )}
              >
                {a.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
