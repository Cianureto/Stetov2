import type { ReactNode, FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

export function FormModal({
  titulo,
  descricao,
  onFechar,
  onSubmit,
  children,
  footer,
  erro,
  largura = "md",
}: {
  titulo: string;
  descricao?: string;
  onFechar: () => void;
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
  erro?: string | null;
  largura?: "sm" | "md" | "lg";
}) {
  const larguraClasse = largura === "sm" ? "md:max-w-sm" : largura === "lg" ? "md:max-w-2xl" : "md:max-w-md";

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className={cn(larguraClasse)}>
        {/* O modal fica num portal, mas o React propaga o submit pela árvore de componentes: sem o
            stopPropagation, salvar um formulário aberto de dentro de outro enviaria também o de fora. */}
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            if (onSubmit) onSubmit(e);
            else e.preventDefault();
          }}
          className="@container space-y-4"
        >
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descricao && <DialogDescription>{descricao}</DialogDescription>}
          </DialogHeader>

          {erro && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-sm px-3 py-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              {erro}
            </p>
          )}

          {children}

          <div className="flex gap-2 pt-1">{footer}</div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
