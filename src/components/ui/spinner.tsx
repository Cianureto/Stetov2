import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const TAMANHOS = { sm: "size-3.5", md: "size-4", lg: "size-6" };

/**
 * Indicador de "em andamento" padrão do app (substitui spans girando e ícones avulsos).
 * Decorativo por padrão; passe `rotulo` quando ele for o único sinal de carga na área (leitor de tela).
 */
export function Spinner({ tamanho = "md", rotulo, className }: { tamanho?: keyof typeof TAMANHOS; rotulo?: string; className?: string }) {
  return (
    <Loader2
      className={cn("shrink-0 animate-spin text-marca", TAMANHOS[tamanho], className)}
      role={rotulo ? "status" : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
    />
  );
}

/**
 * Mensagem de carregamento com spinner. `telaCheia`: ocupa a tela toda (abertura do app, telas cheias
 * como o relatório de visita). `escuro`: sobre fundo escuro (player de apresentação). `children` vai
 * junto (ex.: um <Aviso> de erro aberto por cima).
 */
export function Carregando({ mensagem = "Carregando...", telaCheia = false, escuro = false, className, children }: {
  mensagem?: string;
  telaCheia?: boolean;
  escuro?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 text-sm",
        telaCheia ? "min-h-dvh" : "py-10",
        escuro ? "text-white/60" : "text-foreground-muted",
        className,
      )}
    >
      <Spinner className={escuro ? "text-white/70" : undefined} />
      {mensagem}
      {children}
    </div>
  );
}

/** Indicador de 12 barrinhas (estilo iOS/Clerk), para dentro de botões: herda a cor do texto. */
export function SpinnerBarras({ tamanho = 14, className }: { tamanho?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block shrink-0", className)} style={{ width: tamanho, height: tamanho }}>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="spinner-barra absolute left-[46%] top-[4%] h-[24%] w-[8%] rounded-[6px] bg-current"
          style={{ transform: `rotate(${i * 30}deg)`, transformOrigin: "50% 190%", animationDelay: `${-(1.2 - i * 0.1)}s` }}
        />
      ))}
    </span>
  );
}
