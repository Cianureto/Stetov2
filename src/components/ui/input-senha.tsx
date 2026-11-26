import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * Campo de senha com botão para mostrar/ocultar o que foi digitado. O botão não entra na ordem do envio
 * (type="button") e mantém o foco no campo, para não fechar o teclado do celular.
 */
export const InputSenha = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => {
    const [visivel, setVisivel] = React.useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visivel ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={cn("pr-11", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
          aria-controls={props.id}
          className="alvo-toque absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
        >
          {visivel ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  },
);
InputSenha.displayName = "InputSenha";
