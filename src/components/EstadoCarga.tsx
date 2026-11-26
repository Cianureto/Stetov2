import type { ReactNode } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { EsqueletoLista } from "@/components/ui/skeleton";
import type { Carga } from "@/lib/carga";

/** Aviso de falha ao carregar, com "Tentar de novo". `compacto`: faixa fina acima de dados já exibidos. */
export function ErroCarga({ mensagem, onTentarNovamente, compacto = false, className }: {
  mensagem: string;
  onTentarNovamente?: () => void;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]",
        compacto ? "px-3 py-2 text-xs" : "flex-col px-4 py-8 text-center text-sm sm:flex-row sm:text-left",
        className,
      )}
    >
      <AlertCircle className={cn("shrink-0", compacto ? "size-4" : "size-5")} />
      <span className="flex-1">{mensagem}</span>
      {onTentarNovamente && (
        <Button type="button" variant="danger-ghost" size="sm" onClick={onTentarNovamente}>
          <RotateCw className="size-3.5" /> Tentar de novo
        </Button>
      )}
    </div>
  );
}

/**
 * Renderiza os quatro estados de uma carga do `useDadosApi` de forma padronizada:
 * - carregando pela primeira vez → `esqueleto` (padrão: lista genérica);
 * - falhou sem dados → ErroCarga com "Tentar de novo";
 * - sem itens (`vazio`) → `mensagemVazio`;
 * - com dados → `children(dados)`. Durante uma recarga (filtro trocado, depois de salvar) o conteúdo fica
 *   esmaecido até os dados novos chegarem; se a recarga falhar, os dados ficam e uma faixa de erro aparece acima.
 *
 *   const lista = useDadosApi<{ itens: Item[] }>("/itens");
 *   <EstadoCarga carga={lista} vazio={(d) => d.itens.length === 0} mensagemVazio="Nenhum item ainda.">
 *     {(d) => <Tabela itens={d.itens} />}
 *   </EstadoCarga>
 */
export function EstadoCarga<T>({ carga, esqueleto, vazio, mensagemVazio, children }: {
  carga: Carga<T>;
  esqueleto?: ReactNode;
  vazio?: (dados: T) => boolean;
  mensagemVazio?: ReactNode;
  children: (dados: T) => ReactNode;
}) {
  const { dados, erro, carregando, recarregar } = carga;

  if (dados === null) {
    if (erro) return <ErroCarga mensagem={erro} onTentarNovamente={recarregar} />;
    if (carregando) return <div aria-busy>{esqueleto ?? <EsqueletoLista />}</div>;
    return null;
  }

  const conteudo =
    vazio?.(dados) && mensagemVazio !== undefined ? (
      typeof mensagemVazio === "string" ? <p className="py-8 text-center text-sm text-foreground-muted">{mensagemVazio}</p> : mensagemVazio
    ) : (
      children(dados)
    );

  return (
    <>
      {erro && <ErroCarga compacto mensagem={erro} onTentarNovamente={recarregar} className="mb-3" />}
      <div aria-busy={carregando || undefined} className={cn("transition-opacity duration-200", carregando && "pointer-events-none opacity-60")}>
        {conteudo}
      </div>
    </>
  );
}
