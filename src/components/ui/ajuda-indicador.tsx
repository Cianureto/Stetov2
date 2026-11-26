import type { MouseEvent } from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

// Dentro de cartões/linhas clicáveis, abrir a ajuda não pode disparar o clique do cartão (o portal do
// Radix ainda propaga o evento pela árvore do React).
const naoPropagar = (e: MouseEvent) => e.stopPropagation();

/**
 * Ícone "?" ao lado de um indicador: ao tocar/clicar, abre um balão com o texto que explica como o número
 * é calculado. Abre por toque (Popover, não Tooltip de hover) e fecha com outro toque, fora do balão ou Esc.
 * Os textos ficam em `lib/ajudaIndicadores.ts`. `escuro`: ícone claro, para fundos escuros (cabeçalho hero).
 */
export function AjudaIndicador({ indicador, texto, escuro = false, className }: {
  /** Nome do indicador (título do balão e parte do nome acessível do botão). */
  indicador: string;
  texto: string;
  escuro?: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`Como é calculado: ${indicador}`}
        onClick={naoPropagar}
        className={cn(
          "alvo-toque inline-grid size-5 shrink-0 place-items-center rounded-full align-middle transition-colors pointer-coarse:size-6",
          "focus-visible:outline-none focus-visible:ring-2",
          escuro
            ? "text-white/60 hover:text-white focus-visible:ring-white/70 data-[state=open]:text-white"
            : "text-foreground-muted hover:text-marca focus-visible:ring-marca data-[state=open]:text-marca",
          className,
        )}
      >
        <CircleHelp className="size-3.5 pointer-coarse:size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        collisionPadding={16}
        aria-label={indicador}
        onClick={naoPropagar}
        className="w-[min(20rem,calc(100vw-2rem))] text-left font-sans normal-case tracking-normal"
      >
        <p className="text-[13px] font-semibold leading-snug text-foreground">{indicador}</p>
        <p className="mt-1 text-[13px] font-normal leading-relaxed text-foreground-secondary">{texto}</p>
      </PopoverContent>
    </Popover>
  );
}
