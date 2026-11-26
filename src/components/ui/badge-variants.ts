import { cva } from "class-variance-authority";

// Variantes do badge em arquivo próprio: o Fast Refresh só recarrega no lugar arquivos que exportam apenas componentes.
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--sidebar-hover-bg)] text-foreground-secondary",
        marca: "bg-marca-claro text-marca-escuro",
        sucesso: "bg-[var(--sucesso-soft)] text-[var(--sucesso)]",
        aviso: "bg-[var(--aviso-soft)] text-[var(--aviso)]",
        perigo: "bg-[var(--danger-soft)] text-[var(--danger)]",
        info: "bg-[var(--info-soft)] text-[var(--info)]",
        outline: "border border-[var(--borda-forte)] text-foreground-secondary",
      },
      dot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: { variant: "neutral", dot: false },
  }
);
