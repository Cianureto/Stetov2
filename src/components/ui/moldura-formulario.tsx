import type { FormEvent, ReactNode } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoCarga } from "@/components/EstadoCarga";
import { useDadosApi } from "@/hooks/useDadosApi";
import { cn } from "@/lib/cn";

/**
 * Onde o formulário aparece. "tela" é o padrão (rota própria); "modal" só quando ele é aberto de dentro de
 * outro formulário (ex.: cadastrar um médico no meio de um agendamento) e devolve o registro para quem chamou.
 */
export type ModoFormulario = "tela" | "modal";

/** Props comuns a todo formulário de cadastro: o mesmo componente serve à tela e ao modal. */
export type PropsFormulario<R = void> = {
  modo?: ModoFormulario;
  onFechar: () => void;
  /** Gravou: recebe o registro criado/salvo (quem abriu em modal pode selecioná-lo). */
  onSalvo: (registro: R) => void;
};

type PropsMoldura = {
  titulo: string;
  descricao?: string;
  /** Sobretítulo da tela (ex.: a área). Não aparece no modal. */
  rotulo?: string;
  onFechar: () => void;
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
  erro?: string | null;
  largura?: "sm" | "md" | "lg";
};


/**
 * Formulário como tela: botão de voltar, título, o formulário num cartão e as ações no fim. Ocupa toda a largura do
 * container (mobile first: no celular é a tela toda; nas maiores, os campos se reorganizam pelos grids de cada
 * formulário). `largura` vale só para o modal. Nas telas do consultor (`telaCheia` no layout) passe `comMargem`,
 * porque o layout não dá o espaçamento lateral.
 */
export function FormTela({ titulo, descricao, rotulo, onFechar, onSubmit, children, footer, erro, comMargem = false }: PropsMoldura & { comMargem?: boolean }) {
  return (
    <div className={cn("w-full pb-10", comMargem && "px-3 pt-3 md:px-10 md:pt-8")}>
      <button
        type="button"
        onClick={onFechar}
        className="alvo-toque -ml-1.5 mb-3 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-foreground-secondary transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
      >
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <header className="mb-5 space-y-1">
        {rotulo && <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{rotulo}</p>}
        <h1 className="font-titulo text-2xl font-bold">{titulo}</h1>
        {descricao && <p className="text-sm text-foreground-muted">{descricao}</p>}
      </header>
      <form onSubmit={onSubmit} className="card @container space-y-4 p-4 sm:p-6">
        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {erro}
          </p>
        )}
        {children}
        {/* No celular os botões dividem a largura; a partir de `sm` ficam à direita, com largura própria. */}
        <div className="flex gap-2 border-t border-borda pt-4 sm:justify-end sm:[&>*]:min-w-36 sm:[&>*]:flex-none">{footer}</div>
      </form>
    </div>
  );
}

/** A moldura do formulário conforme o modo: a tela (padrão) ou o modal. Os campos são os mesmos. */
export function MolduraFormulario({ modo = "tela", comMargem, ...props }: PropsMoldura & { modo?: ModoFormulario; comMargem?: boolean }) {
  if (modo === "modal") return <FormModal {...props} />;
  return <FormTela {...props} comMargem={comMargem} />;
}

/** Esqueleto da tela de formulário enquanto o registro carrega. */
function EsqueletoFormTela({ comMargem = false }: { comMargem?: boolean }) {
  return (
    <div className={cn("w-full space-y-4", comMargem && "px-3 pt-3 md:px-10 md:pt-8")} aria-hidden>
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}

/**
 * Tela de edição: carrega o registro (`caminho` da API) e só então monta o formulário com ele — o estado
 * inicial dos campos vem dos dados. Esqueleto na carga e "Tentar de novo" na falha (`EstadoCarga`).
 */
export function TelaDoRegistro<T>({ caminho, mensagemFalha, comMargem, children }: {
  caminho: string;
  mensagemFalha?: string;
  comMargem?: boolean;
  children: (dados: T) => ReactNode;
}) {
  const carga = useDadosApi<T>(caminho, mensagemFalha);
  return (
    <div className={cn(comMargem && carga.erro && "px-3 pt-3 md:px-10 md:pt-8")}>
      <EstadoCarga carga={carga} esqueleto={<EsqueletoFormTela comMargem={comMargem} />}>
        {children}
      </EstadoCarga>
    </div>
  );
}
