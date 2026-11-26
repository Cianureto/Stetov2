import type { FormEvent, ReactNode } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoCarga } from "@/components/EstadoCarga";
import { useDadosApi } from "@/hooks/useDadosApi";
import { cn } from "@/lib/cn";
import { ContextoFormulario } from "@/components/ui/contexto-formulario";

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
  /** Coluna lateral fixa na tela larga (ex.: resumo do cálculo ao vivo). No modal e no celular vem depois dos campos. */
  lateral?: ReactNode;
};


/**
 * Formulário como tela: voltar, título e descrição no topo; cada `SecaoFormulario` vira um cartão numerado; a coluna
 * `lateral` (opcional) fica fixa à direita na tela larga; e as ações ficam numa barra que acompanha a rolagem a partir
 * de `lg` (no celular, no fim). Nas telas do consultor (`telaCheia` no layout) passe `comMargem`.
 */
export function FormTela({ titulo, descricao, rotulo, onFechar, onSubmit, children, footer, erro, lateral, comMargem = false }: PropsMoldura & { comMargem?: boolean }) {
  return (
    <ContextoFormulario.Provider value="tela">
      <form onSubmit={onSubmit} className={cn("secoes-numeradas @container w-full pb-4", comMargem && "px-3 pt-3 md:px-10 md:pt-8")}>
        <header className="mb-6 flex items-start gap-3 md:gap-4">
          <button
            type="button"
            onClick={onFechar}
            aria-label="Voltar"
            className="alvo-toque mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-borda bg-areia-card text-foreground-secondary shadow-[0_1px_2px_rgba(11,27,54,0.06)] transition hover:border-[var(--borda-forte)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
          >
            <ArrowLeft className="size-[18px]" aria-hidden />
          </button>
          <div className="min-w-0">
            {rotulo && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--marca)]">{rotulo}</p>}
            <h1 className="mt-0.5 font-titulo text-2xl font-semibold tracking-tight md:text-[28px]">{titulo}</h1>
            {descricao && <p className="mt-1 text-sm text-foreground-secondary">{descricao}</p>}
          </div>
        </header>

        {erro && (
          <p role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {erro}
          </p>
        )}

        <div className={cn(lateral && "grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start")}>
          <div className="min-w-0 space-y-5">{children}</div>
          {lateral && <aside className="min-w-0 xl:sticky xl:top-24">{lateral}</aside>}
        </div>

        {/* No celular os botões dividem a largura; a partir de `sm` ficam à direita, com largura própria. */}
        <div className="z-20 mt-5 lg:sticky lg:bottom-4">
          <div className="flex gap-2 rounded-2xl border border-borda bg-areia-card/95 p-3 shadow-[0_10px_30px_-12px_rgba(11,27,54,0.25)] backdrop-blur sm:justify-end sm:[&>*]:min-w-36 sm:[&>*]:flex-none">
            {footer}
          </div>
        </div>
      </form>
    </ContextoFormulario.Provider>
  );
}

/** A moldura do formulário conforme o modo: a tela (padrão) ou o modal. Os campos são os mesmos. */
export function MolduraFormulario({ modo = "tela", comMargem, ...props }: PropsMoldura & { modo?: ModoFormulario; comMargem?: boolean }) {
  if (modo === "modal") {
    const { lateral, children, ...resto } = props;
    return (
      <FormModal {...resto}>
        {children}
        {lateral}
      </FormModal>
    );
  }
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
