import { cva } from "class-variance-authority";

// Variantes do botão em arquivo próprio: o Fast Refresh só recarrega no lugar arquivos que exportam apenas componentes.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] text-[0.8125rem] font-medium transition-[background-color,border-color,color,box-shadow,filter,translate,scale] duration-[var(--dur-hover)] ease-[var(--ease-suave)] disabled:opacity-55 disabled:pointer-events-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--marca-claro)] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-white hover:bg-foreground/90 hover:-translate-y-px",
        accent:
          "text-white bg-marca hover:bg-marca-escuro hover:-translate-y-px",
        secondary: "bg-areia-card text-foreground border border-[var(--borda-forte)] hover:bg-[var(--sidebar-hover-bg)] hover:border-foreground/25",
        ghost: "bg-transparent text-foreground-secondary hover:bg-[var(--sidebar-hover-bg)] hover:text-foreground",
        danger: "bg-[var(--danger)] text-white shadow-[var(--shadow-sm)] hover:brightness-95 hover:-translate-y-px",
        "danger-ghost": "bg-transparent text-foreground-secondary border border-[var(--borda-forte)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30",
        link: "text-marca underline-offset-4 hover:underline",
      },
      // Em telas de toque (celular/tablet) os botões crescem para ~40–44 px, o alvo mínimo confortável para o dedo.
      size: {
        sm: "h-8 px-3 text-xs pointer-coarse:h-11",
        md: "h-9 px-3.5 pointer-coarse:h-11",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9 p-0 pointer-coarse:h-11 pointer-coarse:w-11",
        "icon-sm": "h-7 w-7 p-0 pointer-coarse:h-11 pointer-coarse:w-11",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);
