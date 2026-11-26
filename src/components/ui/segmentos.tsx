import { cn } from "@/lib/cn";

const segBase = "h-10 px-3.5 text-[13px] font-medium border-r border-borda last:border-r-0 transition-colors whitespace-nowrap";
const segAtivo = "bg-marca text-white";
const segInativo = "bg-areia-card text-foreground-secondary hover:bg-[var(--sidebar-hover-bg)]";

/**
 * Grupo de botões de escolha única (período, métrica, ordem...). `largo`: no celular ocupa a linha toda,
 * dividindo o espaço entre as opções.
 */
export function Segmentos<T extends string>({
  opcoes,
  valor,
  onChange,
  tamanho = "md",
  largo,
}: {
  opcoes: { id: T; label: string }[];
  valor: T | null;
  onChange: (v: T) => void;
  tamanho?: "sm" | "md";
  largo?: boolean;
}) {
  return (
    <div className={cn("inline-flex overflow-hidden rounded-lg border border-borda max-w-full overflow-x-auto", largo && "flex w-full sm:inline-flex sm:w-auto")}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(segBase, tamanho === "sm" && "h-8 px-3 text-xs pointer-coarse:h-11", largo && "flex-1 px-1 text-xs sm:flex-none sm:px-3.5 sm:text-[13px]", valor === o.id ? segAtivo : segInativo)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
