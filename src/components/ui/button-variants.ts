import { cva } from "class-variance-authority";

// Variantes do botão em arquivo próprio: o Fast Refresh só recarrega no lugar arquivos que exportam apenas componentes.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-semibold transition-[background-color,border-color,color,box-shadow,filter,translate,scale] duration-[var(--dur-hover)] ease-[var(--ease-suave)] disabled:opacity-55 disabled:pointer-events-none active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--anel-foco)] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-white shadow-[var(--shadow-sm)] hover:bg-tinta-800",
        accent:
          "text-white bg-marca shadow-[0_1px_2px_rgba(29,78,216,0.3),inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-marca-escuro",
        secondary: "bg-areia-card text-foreground border border-borda shadow-[var(--shadow-xs)] hover:bg-tinta-25 hover:border-tinta-300",
        ghost: "bg-transparent text-foreground-secondary hover:bg-tinta-100 hover:text-foreground",
        danger: "bg-[var(--danger)] text-white shadow-[var(--shadow-sm)] hover:brightness-95 hover:-translate-y-px",
        "danger-ghost": "bg-transparent text-foreground-secondary border border-borda hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30",
        link: "text-marca underline-offset-4 hover:underline",
      },
      // Em telas de toque (celular/tablet) os botões crescem para ~40–44 px, o alvo mínimo confortável para o dedo.
      size: {
        sm: "h-8 px-3 text-[13px] pointer-coarse:h-11",
        md: "h-10 px-4 pointer-coarse:h-11",
        lg: "h-11 px-5 text-sm",
        icon: "h-10 w-10 p-0 pointer-coarse:h-11 pointer-coarse:w-11",
        "icon-sm": "h-7 w-7 p-0 pointer-coarse:h-11 pointer-coarse:w-11",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);
