import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Seção de um formulário de cadastro. Os formulários são `@container` (FormTela/FormModal), então o arranjo segue a
 * largura do próprio formulário, não a da tela: no celular e no modal estreito, título em cima e campos embaixo
 * (como sempre); com o formulário largo (tela cheia no desktop, a partir de `@4xl` = 56rem), título e descrição
 * numa coluna à esquerda e os campos à direita. Seções seguidas ganham um divisor.
 *
 * Os campos dentro usam grids com variantes de container (`@2xl:grid-cols-2`, `@2xl:col-span-4`...), e um grupo
 * do celular pode se desfazer no grid largo com `@2xl:contents`.
 */
export function SecaoFormulario({ titulo, descricao, acao, children, className }: { titulo: string; descricao?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section
      role="group"
      aria-labelledby={id}
      className={cn("grid min-w-0 gap-3 border-borda [&+&]:border-t [&+&]:pt-5 @4xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] @4xl:gap-x-10", className)}
    >
      <div className="flex items-start justify-between gap-2 @4xl:block">
        <div className="min-w-0">
          <h2 id={id} className="text-[13px] font-semibold @4xl:text-[14px]">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-[12px] text-foreground-muted">{descricao}</p>}
        </div>
        {acao && <div className="shrink-0 @4xl:mt-2">{acao}</div>}
      </div>
      <div className="min-w-0 space-y-3">{children}</div>
    </section>
  );
}
