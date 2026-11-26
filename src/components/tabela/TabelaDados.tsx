import { useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { EsqueletoLista } from "@/components/ui/skeleton";
import { ErroCarga } from "@/components/EstadoCarga";
import { cn } from "@/lib/cn";
import { ordenavel, type Coluna } from "@/lib/tabela";
import { Paginacao } from "@/components/tabela/Paginacao";
import { ListaVazia } from "@/components/tabela/ListaVazia";
import { BarraSelecao, CaixaSelecao } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { rolarAte } from "@/lib/rolagem";
import type { Tabela } from "@/hooks/useTabela";

function CabecalhoOrdenavel<T>({ coluna, ordem, onOrdenar }: { coluna: Coluna<T>; ordem: string; onOrdenar: () => void }) {
  const ativa = ordem.replace(/^-/, "") === coluna.chave;
  const Icone = !ativa ? ChevronsUpDown : ordem.startsWith("-") ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={onOrdenar}
      className={cn(
        "-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-marca",
        ativa && "text-foreground",
        coluna.alinhar === "direita" && "flex-row-reverse",
      )}
    >
      {coluna.titulo}
      <Icone className={cn("size-3.5 shrink-0", !ativa && "opacity-40")} aria-hidden />
    </button>
  );
}

/**
 * Agrupamento opcional (ex.: um cabeçalho por dia na agenda). Só vale com a tabela ordenada pela coluna
 * `coluna`: ordenada por outra, os grupos se espalhariam e a linha de cabeçalho não faria sentido.
 */
export type Agrupamento<T> = { coluna: string; chave: (linha: T) => string; cabecalho: (linhasDoGrupo: T[]) => ReactNode };

/** Linhas visíveis intercaladas com o cabeçalho de cada grupo (contado sobre todas as linhas filtradas). */
function comGrupos<T>(visiveis: T[], filtradas: T[], agrupar?: Agrupamento<T>) {
  type Item = { tipo: "linha"; linha: T } | { tipo: "grupo"; chave: string; cabecalho: ReactNode };
  if (!agrupar) return visiveis.map((linha): Item => ({ tipo: "linha", linha }));
  const porGrupo = new Map<string, T[]>();
  for (const l of filtradas) {
    const k = agrupar.chave(l);
    porGrupo.set(k, [...(porGrupo.get(k) ?? []), l]);
  }
  const itens: Item[] = [];
  let anterior: string | null = null;
  for (const linha of visiveis) {
    const k = agrupar.chave(linha);
    if (k !== anterior) itens.push({ tipo: "grupo", chave: k, cabecalho: agrupar.cabecalho(porGrupo.get(k) ?? [linha]) });
    itens.push({ tipo: "linha", linha });
    anterior = k;
  }
  return itens;
}

/** Elementos interativos dentro da linha: o clique neles é a ação deles, não "abrir o registro". */
const INTERATIVOS = "a,button,input,select,textarea,label,summary,[role=button],[role=checkbox],[role=combobox],[role=menuitem],[role=switch],[contenteditable=true]";

/**
 * O clique/tecla veio da própria linha (não de um controle dentro dela nem de um modal/menu aberto por ela:
 * eventos de portais do React sobem pela árvore de componentes, mas o alvo fica fora da linha no DOM).
 * Seleção de texto (arrastar sobre a célula) também não abre.
 */
function eventoDaLinha(e: React.SyntheticEvent): boolean {
  const linha = e.currentTarget as HTMLElement;
  const alvo = e.target as Element | null;
  if (!alvo || !linha.contains(alvo)) return false;
  const controle = alvo.closest(INTERATIVOS);
  if (controle && controle !== linha && linha.contains(controle)) return false;
  if (e.type === "click" && (window.getSelection?.()?.toString() ?? "") !== "") return false;
  return true;
}

/**
 * Tabela padrão: cabeçalhos clicáveis para ordenar (todas as colunas com valor), linhas da página atual e
 * rodapé de paginação. Com `renderCelular`, abaixo de `md` vira lista de cartões (a ordenação fica na
 * `BarraTabela`). Sem linhas: `vazio` (texto ou nó), diferenciando "nada cadastrado" de "nada encontrado".
 */
export function TabelaDados<T>({ tabela, colunas, chaveLinha, onLinha, abrivel, renderCelular, vazio = "Nada por aqui.", vazioFiltrado = "Nada encontrado com a pesquisa e os filtros atuais.", className, classeLinha, rodape, agrupar, acoes }: {
  tabela: Tabela<T>;
  colunas: Coluna<T>[];
  chaveLinha: (linha: T) => string;
  /**
   * Abrir os detalhes do registro: com ela, a linha inteira (e o cartão no celular) é clicável e executa
   * essa ação. Use sempre que a tabela tiver uma ação de abrir/ver o registro.
   */
  onLinha?: (linha: T) => void;
  /** Linhas que não têm detalhes para abrir (ex.: perfil do sistema): não ficam clicáveis. */
  abrivel?: (linha: T) => boolean;
  renderCelular?: (linha: T) => ReactNode;
  vazio?: ReactNode;
  vazioFiltrado?: ReactNode;
  className?: string;
  classeLinha?: (linha: T) => string | undefined;
  /** Linha extra no fim da tabela (ex.: totais). */
  rodape?: ReactNode;
  agrupar?: Agrupamento<T>;
  /** Ações da tabela (`useAcoesTabela`): caixas de seleção e a barra de ações em massa, conforme as permissões. */
  acoes?: ControleAcoes<T>;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const { visiveis } = tabela;
  const exibidas = colunas.filter((c) => !c.soFiltro);
  // Com ações permitidas ao perfil, a tabela ganha seleção; a barra aparece mesmo com a lista vazia
  // (a seleção vale entre páginas e filtros).
  const selecao = acoes && acoes.acoes.length > 0 ? acoes : undefined;
  const barra = selecao ? <BarraSelecao controle={selecao} tabela={tabela} className="border-b border-borda p-3" /> : null;
  if (tabela.erro && !visiveis.length) return <>{barra}<ErroCarga mensagem={tabela.erro} onTentarNovamente={tabela.recarregar} className="m-4" /></>;
  if (tabela.carregando) return <EsqueletoLista className="p-4" />;
  const grupoAtivo = agrupar && tabela.ordem.replace(/^-/, "") === agrupar.coluna ? agrupar : undefined;
  const itens = comGrupos(visiveis, tabela.todasFiltradas ?? visiveis, grupoAtivo);
  if (!visiveis.length) return <>{barra}<ListaVazia tabela={tabela} vazio={vazio} vazioFiltrado={vazioFiltrado} /></>;
  const marcadasNaPagina = selecao ? visiveis.filter((l) => selecao.selecionadas.has(chaveLinha(l))).length : 0;
  // Nova página: volta ao topo da lista (o usuário não fica olhando o rodapé de outra página).
  const irParaPagina = (p: number) => {
    tabela.setPagina(p);
    rolarAte(raiz.current);
  };
  const abre = (linha: T) => !!onLinha && (abrivel?.(linha) ?? true);
  const clicavel = (linha: T) =>
    onLinha && abre(linha)
      ? {
          tabIndex: 0,
          onClick: (e: React.MouseEvent) => eventoDaLinha(e) && onLinha(linha),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onLinha(linha);
            }
          },
        }
      : {};

  return (
    <div ref={raiz} className={cn("scroll-mt-24", className, tabela.atualizando && "pointer-events-none opacity-60 transition-opacity")} aria-busy={tabela.atualizando || undefined}>
      {barra}
      {tabela.erro && <ErroCarga compacto mensagem={tabela.erro} onTentarNovamente={tabela.recarregar} className="m-4" />}
      {renderCelular && (
        <ul className="divide-y divide-borda md:hidden">
          {itens.map((item) =>
            item.tipo === "grupo" ? (
              <li key={`g-${item.chave}`} className="bg-areia/60 px-4 pb-1.5 pt-3">{item.cabecalho}</li>
            ) : (
              <li key={chaveLinha(item.linha)}>
                <div className={cn("flex items-start gap-3 px-4 py-3.5", selecao?.selecionadas.has(chaveLinha(item.linha)) && "bg-marca-claro/40")}>
                  {selecao && (
                    <CaixaSelecao className="mt-0.5 shrink-0" marcada={selecao.selecionadas.has(chaveLinha(item.linha))} onChange={() => selecao.alternar(item.linha)} rotulo={`Selecionar ${selecao.nome(item.linha)}`} />
                  )}
                  <div {...clicavel(item.linha)} {...(abre(item.linha) ? { role: "button" as const } : {})} className={cn("min-w-0 flex-1", abre(item.linha) && "cursor-pointer outline-none active:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04]")}>
                    {renderCelular(item.linha)}
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      <div className={cn("overflow-x-auto", renderCelular && "max-md:hidden")}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-borda bg-tinta-25 text-[11px] uppercase tracking-[0.06em] text-foreground-muted">
              {selecao && (
                <th scope="col" className="w-10 py-3 pl-4 pr-0">
                  <CaixaSelecao
                    marcada={marcadasNaPagina === visiveis.length}
                    parcial={marcadasNaPagina > 0}
                    onChange={() => selecao.alternarPagina(visiveis)}
                    rotulo={marcadasNaPagina === visiveis.length ? "Desmarcar todos desta página" : "Selecionar todos desta página"}
                  />
                </th>
              )}
              {exibidas.map((c) => {
                const ativa = tabela.ordem.replace(/^-/, "") === c.chave;
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={ativa ? (tabela.ordem.startsWith("-") ? "descending" : "ascending") : undefined}
                    className={cn("whitespace-nowrap px-4 py-3 font-semibold", c.alinhar === "direita" && "text-right", c.className)}
                  >
                    {/* Steto: coluna de dado que não ordena (ex.: lista de vínculos) mostra o título; só "acoes" o esconde. */}
                    {ordenavel(c) ? <CabecalhoOrdenavel coluna={c} ordem={tabela.ordem} onOrdenar={() => tabela.alternar(c.chave, c.ordemInicial)} /> : <span className={c.chave === "acoes" ? "sr-only" : undefined}>{c.titulo}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {itens.map((item) => {
              if (item.tipo === "grupo") {
                return (
                  <tr key={`g-${item.chave}`}>
                    <td colSpan={exibidas.length + (selecao ? 1 : 0)} className="px-4 pb-1.5 pt-4">{item.cabecalho}</td>
                  </tr>
                );
              }
              const linha = item.linha;
              return (
              <tr
                key={chaveLinha(linha)}
                {...clicavel(linha)}
                aria-selected={selecao ? selecao.selecionadas.has(chaveLinha(linha)) : undefined}
                className={cn("transition-colors hover:bg-azul-50/60", abre(linha) && "cursor-pointer outline-none focus-visible:bg-azul-50", selecao?.selecionadas.has(chaveLinha(linha)) && "bg-azul-50", classeLinha?.(linha))}
              >
                {selecao && (
                  <td className="w-10 py-3 pl-4 pr-0 align-middle">
                    <CaixaSelecao marcada={selecao.selecionadas.has(chaveLinha(linha))} onChange={() => selecao.alternar(linha)} rotulo={`Selecionar ${selecao.nome(linha)}`} />
                  </td>
                )}
                {exibidas.map((c) => (
                  <td key={c.chave} className={cn("px-4 py-3 align-middle", c.alinhar === "direita" && "text-right tabular-nums", c.className)}>
                    {c.render ? c.render(linha) : String((linha as Record<string, unknown>)[c.chave] ?? "—")}
                  </td>
                ))}
              </tr>
              );
            })}
          </tbody>
          {rodape}
        </table>
      </div>
      {tabela.porPagina && (
        <Paginacao pagina={tabela.pagina} totalPaginas={tabela.totalPaginas} total={tabela.totalFiltrado} porPagina={tabela.porPagina} onPagina={irParaPagina} onPorPagina={tabela.setPorPagina} atualizando={tabela.atualizando} />
      )}
    </div>
  );
}
