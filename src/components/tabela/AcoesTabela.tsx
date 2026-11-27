import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import type { Tabela } from "@/hooks/useTabela";
import { cn } from "@/lib/cn";
import { CaixaMarcar } from "@/components/ui/caixa-marcar";

/** Caixa de seleção de uma linha (ou de "todas da página"), com alvo de toque confortável. */
export function CaixaSelecao({ marcada, parcial, onChange, rotulo, className }: { marcada: boolean; parcial?: boolean; onChange: () => void; rotulo: string; className?: string }) {
  return (
    <span className={cn("alvo-toque inline-grid place-items-center", className)} onClick={(e) => e.stopPropagation()}>
      <CaixaMarcar marcada={marcada} parcial={parcial} onChange={onChange} rotulo={rotulo} />
    </span>
  );
}

/**
 * Barra das ações em massa: aparece quando há linhas selecionadas, com quantas são e um botão por ação
 * permitida ao perfil (RBAC). Cada botão diz em quantas das selecionadas a ação se aplica e fica
 * desabilitado quando não se aplica a nenhuma. A região é anunciada ao leitor de tela.
 */
export function BarraSelecao<T>({ controle, tabela, className }: { controle: ControleAcoes<T>; tabela?: Tabela<T>; className?: string }) {
  const linhas = [...controle.selecionadas.values()];
  const total = linhas.length;
  return (
    <div aria-live="polite" className={cn(total > 0 && className)}>
      {total > 0 && (
        <div role="toolbar" aria-label="Ações para os itens selecionados" className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--sidebar-bg)] px-3 py-2 text-white shadow-[var(--shadow-md)]">
          <span className="px-1 text-[13px] font-semibold">
            {total.toLocaleString("pt-BR")} {total === 1 ? "selecionado" : "selecionados"}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {controle.acoes.map((acao) => {
              const aplicaveis = linhas.filter((l) => !acao.aplicavel || acao.aplicavel(l)).length;
              const rodando = controle.emAndamento === acao.chave;
              return (
                <button
                  key={acao.chave}
                  type="button"
                  disabled={aplicaveis === 0 || controle.emAndamento !== null}
                  aria-busy={rodando || undefined}
                  title={aplicaveis === 0 ? `Não se aplica a nenhum dos selecionados` : undefined}
                  onClick={() => controle.executar(acao, linhas)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors disabled:opacity-45 pointer-coarse:h-11",
                    acao.perigo ? "bg-[var(--danger)] text-white hover:brightness-110" : "bg-white/12 text-white hover:bg-white/20",
                  )}
                >
                  {rodando ? <Spinner tamanho="sm" className="text-current" /> : <acao.Icone className="size-3.5" aria-hidden />}
                  {acao.rotulo}
                  {aplicaveis > 0 && aplicaveis < total && <span className="text-white/70">({aplicaveis})</span>}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={controle.limpar} disabled={controle.emAndamento !== null} className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-white/80 hover:bg-white/10 hover:text-white pointer-coarse:h-11">
            <X className="size-3.5" aria-hidden /> Limpar seleção
          </button>
          {tabela && <EscopoSelecao controle={controle} tabela={tabela} />}
        </div>
      )}
    </div>
  );
}

/**
 * "Todos desta página" x "todos os resultados" (com a pesquisa e os filtros atuais, em todas as páginas):
 * - página inteira marcada e há mais resultados → oferece selecionar todos os resultados;
 * - todos os resultados selecionados → diz isso e oferece voltar só para esta página;
 * - seleção parcial da página → oferece completar a página.
 */
function EscopoSelecao<T>({ controle, tabela }: { controle: ControleAcoes<T>; tabela: Tabela<T> }) {
  const { visiveis, totalFiltrado, buscarTodas } = tabela;
  const marcadasNaPagina = visiveis.filter((l) => controle.selecionadas.has(controle.chave(l))).length;
  const paginaInteira = visiveis.length > 0 && marcadasNaPagina === visiveis.length;
  const ha = (n: number) => n.toLocaleString("pt-BR");
  const link = "font-semibold text-realce underline-offset-2 hover:underline disabled:opacity-60";
  let conteudo: React.ReactNode = null;

  if (controle.todosOsResultados) {
    conteudo = (
      <>
        <span>Todos os {ha(controle.selecionadas.size)} resultados da pesquisa e dos filtros estão selecionados.</span>
        <button type="button" className={link} onClick={() => controle.selecionarSoPagina(visiveis)}>Selecionar só os {ha(visiveis.length)} desta página</button>
      </>
    );
  } else if (paginaInteira && totalFiltrado > visiveis.length && buscarTodas) {
    conteudo = (
      <>
        <span>{controle.selecionadas.size > visiveis.length ? `${ha(controle.selecionadas.size)} selecionados, incluindo outras páginas.` : `Os ${ha(visiveis.length)} desta página estão selecionados.`}</span>
        <button type="button" className={link} disabled={controle.selecionandoTodos} onClick={() => controle.selecionarTodos(buscarTodas)}>
          {controle.selecionandoTodos ? (
            <span className="inline-flex items-center gap-1.5"><Spinner tamanho="sm" className="text-current" /> Selecionando…</span>
          ) : (
            `Selecionar todos os ${ha(totalFiltrado)} resultados`
          )}
        </button>
      </>
    );
  } else if (!paginaInteira && visiveis.length > 0) {
    conteudo = (
      <button type="button" className={link} onClick={() => controle.alternarPagina(visiveis.filter((l) => !controle.selecionadas.has(controle.chave(l))))}>
        Selecionar os {ha(visiveis.length)} desta página
      </button>
    );
  }
  if (!conteudo) return null;
  return <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-1 pt-2 text-[12.5px] text-white/80">{conteudo}</div>;
}

/**
 * As ações da tabela como botões na linha (as mesmas da barra em massa, com as mesmas permissões). Só
 * aparecem as que se aplicam à linha. `so`: restringe a algumas chaves (quando a tela já tem as outras).
 */
export function AcoesEmLinha<T>({ controle, linha, so, comRotulo = true }: { controle: ControleAcoes<T>; linha: T; so?: string[]; comRotulo?: boolean }) {
  const acoes = controle.acoes.filter((a) => (!so || so.includes(a.chave)) && (!a.aplicavel || a.aplicavel(linha)));
  if (!acoes.length) return null;
  return (
    <>
      {acoes.map((acao) => {
        const rodando = controle.emAndamento === acao.chave;
        return (
          <button
            key={acao.chave}
            type="button"
            disabled={controle.emAndamento !== null}
            aria-busy={rodando || undefined}
            aria-label={`${acao.rotulo} ${controle.nome(linha)}`}
            title={acao.rotulo}
            onClick={(e) => {
              e.stopPropagation();
              controle.executar(acao, [linha]);
            }}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--borda-forte)] px-2.5 text-xs font-medium text-foreground-secondary transition-colors disabled:opacity-50 pointer-coarse:h-11",
              acao.perigo ? "hover:border-[var(--danger)]/30 hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" : "hover:bg-[var(--sidebar-hover-bg)] hover:text-foreground",
              !comRotulo && "w-8 justify-center px-0 pointer-coarse:w-11",
            )}
          >
            <acao.Icone className="size-3.5" aria-hidden />
            {comRotulo && acao.rotulo}
          </button>
        );
      })}
    </>
  );
}
