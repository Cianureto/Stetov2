import { useId } from "react";
import { cn } from "@/lib/cn";
import { PilulaDeslizante } from "@/components/ui/pilula-deslizante";

// Trilho cinza com a opção escolhida em "chip" branco elevado (mesmo desenho da classe .segmented).
const segBase = "relative isolate h-[34px] rounded-[7px] px-3.5 text-[13px] font-medium transition-[background-color,color] duration-[var(--dur-hover)] whitespace-nowrap";
// O fundo branco da opção escolhida é a pílula que desliza (PilulaDeslizante), não o botão.
const segAtivo = "font-semibold text-azul-700";
const segInativo = "text-foreground-secondary hover:bg-white/55 hover:text-foreground";

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
  const grupo = useId();
  return (
    <div className={cn("inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[var(--radius-sm)] bg-tinta-100 p-[3px]", largo && "flex w-full sm:inline-flex sm:w-auto")}>
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={valor === o.id}
          className={cn(segBase, tamanho === "sm" && "h-7 px-3 text-xs pointer-coarse:h-10", largo && "flex-1 px-1 text-xs sm:flex-none sm:px-3.5 sm:text-[13px]", valor === o.id ? segAtivo : segInativo)}
        >
          {valor === o.id && <PilulaDeslizante grupo={grupo} className="rounded-[7px] bg-areia-card shadow-[var(--shadow-sm)]" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
