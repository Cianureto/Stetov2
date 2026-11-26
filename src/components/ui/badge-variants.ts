import { cva } from "class-variance-authority";

// Variantes do badge em arquivo próprio: o Fast Refresh só recarrega no lugar arquivos que exportam apenas componentes.
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none whitespace-nowrap ring-1 ring-inset",
  {
    variants: {
      variant: {
        neutral: "bg-tinta-100 text-foreground-secondary ring-tinta-200",
        marca: "bg-azul-50 text-azul-700 ring-azul-200",
        sucesso: "bg-[var(--sucesso-soft)] text-[var(--sucesso)] ring-[var(--sucesso)]/20",
        aviso: "bg-[var(--aviso-soft)] text-[var(--aviso)] ring-[var(--aviso)]/20",
        perigo: "bg-[var(--danger-soft)] text-[var(--danger)] ring-[var(--danger)]/20",
        info: "bg-[var(--info-soft)] text-[var(--info)] ring-[var(--info)]/20",
        outline: "bg-transparent text-foreground-secondary ring-tinta-300",
      },
      // O ponto em si é desenhado pelo <Badge dot>.
      dot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: { variant: "neutral", dot: false },
  }
);
