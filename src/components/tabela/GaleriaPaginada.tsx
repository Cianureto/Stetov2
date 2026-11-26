import { useRef, type ReactNode } from "react";
import { ErroCarga } from "@/components/EstadoCarga";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginacao } from "@/components/tabela/Paginacao";
import { BarraSelecao, CaixaSelecao } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { ListaVazia } from "@/components/tabela/ListaVazia";
import { rolarAte } from "@/lib/rolagem";
import type { Tabela } from "@/hooks/useTabela";
import { cn } from "@/lib/cn";
import { OPCOES_POR_PAGINA } from "@/lib/tabela";

export const GRADE_GALERIA = "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

/** Mensagens da galeria vazia: sem nada cadastrado (com ação opcional) ou nada encontrado com os filtros. */
export type VazioGaleria = { Icone: ReactNode; titulo: string; texto: string; acao?: { rotulo: string; onClick: () => void } };

/**
 * Visão em galeria de uma tabela paginada no servidor (mesmo estado da lista: pesquisa, filtros, ordem e
 * página). Cuida de erro, esqueleto, vazio e paginação; cada tela só desenha o cartão.
 */
export function GaleriaPaginada<T>({ tabela, chave, cartao, vazio, acoes }: {
  tabela: Tabela<T>;
  chave: (item: T) => string;
  cartao: (item: T) => ReactNode;
  vazio: VazioGaleria;
  /** Ações da tabela (`useAcoesTabela`): caixa de seleção em cada cartão e a barra de ações em massa. */
  acoes?: ControleAcoes<T>;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const selecao = acoes && acoes.acoes.length > 0 ? acoes : undefined;
  const barra = selecao ? <BarraSelecao controle={selecao} tabela={tabela} className="mb-4" /> : null;
  if (tabela.erro && !tabela.visiveis.length) return <>{barra}<ErroCarga mensagem={tabela.erro} onTentarNovamente={tabela.recarregar} /></>;
  if (tabela.carregando) {
    return (
      <div className={GRADE_GALERIA}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-borda bg-[var(--areia-card)]">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="mt-4 h-7 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!tabela.visiveis.length) {
    if (tabela.atualizando || tabela.pesquisando) return <>{barra}<ListaVazia tabela={tabela} vazio={null} vazioFiltrado={null} /></>;
    return (
      <>
      {barra}
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--borda-forte)] bg-[var(--areia-card)] px-6 py-14 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-marca-claro text-marca">{vazio.Icone}</div>
        <h3 className="mt-4 font-titulo text-base font-semibold">{tabela.filtrando ? "Nada encontrado" : vazio.titulo}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">{tabela.filtrando ? "Nenhum resultado com a pesquisa e os filtros atuais." : vazio.texto}</p>
        {tabela.filtrando ? (
          <button type="button" onClick={tabela.limpar} className="mt-5 inline-flex h-10 items-center rounded-lg border border-[var(--borda-forte)] bg-areia-card px-4 text-sm font-medium transition hover:bg-[var(--sidebar-hover-bg)] pointer-coarse:h-11">
            Limpar pesquisa e filtros
          </button>
        ) : (
          vazio.acao && (
            <button type="button" onClick={vazio.acao.onClick} className="mt-5 inline-flex h-10 items-center rounded-lg bg-marca px-4 text-sm font-semibold text-white transition hover:bg-marca-escuro pointer-coarse:h-11">
              {vazio.acao.rotulo}
            </button>
          )
        )}
      </div>
      </>
    );
  }
  const irParaPagina = (p: number) => {
    tabela.setPagina(p);
    rolarAte(raiz.current);
  };
  return (
    <div ref={raiz} className={cn("scroll-mt-24 space-y-4", tabela.atualizando && "pointer-events-none opacity-60 transition-opacity")} aria-busy={tabela.atualizando || undefined}>
      {barra}
      <div className={GRADE_GALERIA}>
        {tabela.visiveis.map((item) => {
          const marcada = !!selecao?.selecionadas.has(chave(item));
          return (
            <div key={chave(item)} className={cn("relative min-w-0 rounded-2xl", marcada && "ring-2 ring-marca ring-offset-2 ring-offset-[var(--areia)]")}>
              {selecao && (
                <span className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-[var(--areia-card)] shadow-[var(--shadow-md)] ring-1 ring-borda">
                  <CaixaSelecao marcada={marcada} onChange={() => selecao.alternar(item)} rotulo={`Selecionar ${selecao.nome(item)}`} />
                </span>
              )}
              {cartao(item)}
            </div>
          );
        })}
      </div>
      {tabela.porPagina && tabela.totalFiltrado > OPCOES_POR_PAGINA[0] && (
        <div className="card overflow-hidden">
          <Paginacao pagina={tabela.pagina} totalPaginas={tabela.totalPaginas} total={tabela.totalFiltrado} porPagina={tabela.porPagina} onPagina={irParaPagina} onPorPagina={tabela.setPorPagina} atualizando={tabela.atualizando} />
        </div>
      )}
    </div>
  );
}
