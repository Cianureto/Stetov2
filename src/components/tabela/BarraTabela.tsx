import type { ReactNode } from "react";
import { ArrowDownUp, Search, X } from "lucide-react";
import { Seletor } from "@/components/ui/seletor";
import { Spinner } from "@/components/ui/spinner";
import { EtiquetasFiltro, FiltroAvancado } from "@/components/tabela/FiltroAvancado";
import { ordenavel, type Coluna, type TipoFiltro } from "@/lib/tabela";
import type { Tabela } from "@/hooks/useTabela";
import { cn } from "@/lib/cn";

// Sentido da ordenação em palavras, conforme o tipo da coluna.
const SENTIDO: Partial<Record<TipoFiltro, [string, string]>> = {
  data: ["mais antigos", "mais recentes"],
  numero: ["menor", "maior"],
  moeda: ["menor", "maior"],
};

/** No celular o cabeçalho da tabela some (vira cartões): a ordenação fica num seletor. */
function OrdemCelular<T>({ colunas, ordem, onChange }: { colunas: Coluna<T>[]; ordem: string; onChange: (o: string) => void }) {
  const opcoes = colunas.filter(ordenavel).flatMap((c) => {
    const [asc, desc] = SENTIDO[c.filtro?.tipo ?? "texto"] ?? ["A–Z", "Z–A"];
    return [{ valor: c.chave, rotulo: `${c.titulo} (${asc})` }, { valor: `-${c.chave}`, rotulo: `${c.titulo} (${desc})` }];
  });
  if (!opcoes.length) return null;
  return (
    <div className="flex items-center gap-2 md:hidden">
      <ArrowDownUp className="size-4 shrink-0 text-foreground-muted" aria-hidden />
      <Seletor className="min-w-0 flex-1" rotulo="Ordenar por" placeholder="Ordem padrão" valor={ordem} onChange={onChange} opcoes={opcoes} />
    </div>
  );
}

/**
 * O que a lista está fazendo e o resultado (também anunciado ao leitor de tela): "Pesquisando…",
 * "12 resultados para "ana"" com "Limpar tudo", ou "Atualizando…" ao trocar página/ordem. A região viva
 * existe sempre (para o anúncio funcionar); o conteúdo só aparece quando há o que dizer.
 */
function LinhaSituacao<T>({ tabela }: { tabela: Tabela<T> }) {
  const termo = tabela.busca.trim();
  const qtd = tabela.totalFiltrado;
  let texto: string | null = null;
  if (tabela.pesquisando) texto = termo ? `Pesquisando "${termo}"…` : "Pesquisando…";
  else if (tabela.filtrando && !tabela.carregando) {
    const resultados = `${qtd.toLocaleString("pt-BR")} ${qtd === 1 ? "resultado" : "resultados"}`;
    const comFiltros = tabela.filtros.regras.length ? (termo ? " e os filtros" : " com os filtros aplicados") : "";
    texto = `${resultados}${termo ? ` para "${termo}"` : ""}${comFiltros}`;
  } else if (tabela.atualizando) texto = "Atualizando…";

  return (
    <div aria-live="polite" className={texto ? undefined : "!mt-0"}>
      {texto && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-foreground-secondary">
          <span className="inline-flex items-center gap-1.5">
            {(tabela.pesquisando || (tabela.atualizando && !tabela.filtrando)) && <Spinner tamanho="sm" />}
            {texto}
          </span>
          {tabela.filtrando && !tabela.pesquisando && (
            <button type="button" onClick={tabela.limpar} className="alvo-toque font-medium text-marca underline-offset-2 hover:underline">
              Limpar tudo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Barra padrão das tabelas (modelo do projeto revenda), sempre na mesma ordem: pesquisa rápida + filtro
 * avançado (+ ações da tela à direita, `acoes`), filtros próprios da tela (`children`), ordenação no celular
 * e etiquetas dos filtros ativos.
 */
export function BarraTabela<T>({ tabela, colunas, placeholder = "Pesquisar…", acoes, children, className }: {
  tabela: Tabela<T>;
  colunas: Coluna<T>[];
  placeholder?: string;
  acoes?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{placeholder}</span>
          {tabela.pesquisando ? (
            <Spinner tamanho="md" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" aria-hidden />
          )}
          <input
            type="search"
            className="input h-10 pl-9 pr-9 pointer-coarse:h-11 [&::-webkit-search-cancel-button]:hidden"
            placeholder={placeholder}
            value={tabela.busca}
            onChange={(e) => tabela.setBusca(e.target.value)}
          />
          {tabela.busca && (
            <button type="button" onClick={() => tabela.setBusca("")} aria-label="Limpar pesquisa" className="alvo-toque absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-foreground-muted hover:bg-foreground/5">
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </label>
        <FiltroAvancado colunas={colunas} valor={tabela.filtros} onChange={tabela.setFiltros} />
        {acoes}
      </div>
      {children && <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">{children}</div>}
      <OrdemCelular colunas={colunas} ordem={tabela.ordem} onChange={tabela.setOrdem} />
      <EtiquetasFiltro colunas={colunas} valor={tabela.filtros} onChange={tabela.setFiltros} />
      <LinhaSituacao tabela={tabela} />
    </div>
  );
}
