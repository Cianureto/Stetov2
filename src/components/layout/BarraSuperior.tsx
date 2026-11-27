import { Link, useLocation } from "react-router-dom";
import { Command, Search } from "lucide-react";
import { MarcaLogo } from "@/components/Marca";
import { MenuUsuario } from "@/components/layout/MenuUsuario";
import { PedidosAcesso } from "@/components/layout/PedidosAcesso";
import { usePermissao } from "@/hooks/usePermissao";
import { cn } from "@/lib/cn";
import { trilhaPara, type SecaoMenu } from "@/lib/navegacao";
import { motion } from "framer-motion";
import { idBusca, MOLA_PASTA, type OrigemBusca } from "@/lib/pasta";

/**
 * Cabeçalho (padrão revenda). Celular: barra de vidro de largura total com a marca, busca e usuário.
 * A partir de `lg`: barra de vidro flutuante com a trilha (seção / tela), campo de busca (⌘K) e usuário.
 */
export function BarraSuperior({ secoes, inicio, onBuscar, buscaAberta = false, origemBusca = "pc" }: {
  secoes: SecaoMenu[];
  inicio: string;
  onBuscar: () => void;
  /** Com a busca aberta, o fundo do campo (ou da lupa) "virou" o painel: aqui fica só o espaço. */
  buscaAberta?: boolean;
  origemBusca?: OrigemBusca;
}) {
  const { pathname } = useLocation();
  const trilha = trilhaPara(pathname, secoes);
  const podeVerPedidos = usePermissao("acessos.gerenciar");
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/[0.06] bg-[var(--areia)]/75 pt-[env(safe-area-inset-top)] backdrop-blur-2xl backdrop-saturate-200 lg:mx-auto lg:w-full lg:max-w-[1600px] lg:border-transparent lg:bg-[linear-gradient(to_bottom,var(--areia)_70%,transparent)] lg:px-10 lg:pb-2 lg:backdrop-blur-none 2xl:px-14">
      <div className="flex h-14 items-center gap-1.5 px-3 lg:vidro lg:mt-3 lg:h-[52px] lg:rounded-2xl lg:pl-5 lg:pr-2">
        <Link to={inicio} className="min-w-0 flex-1 rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-marca lg:hidden">
          <MarcaLogo fundo="claro" />
        </Link>
        <nav aria-label="Trilha de navegação" className="hidden min-w-0 flex-1 lg:block">
          {trilha.length > 0 && (
            <ol className="flex items-center gap-1.5 truncate text-sm text-foreground-muted">
              {trilha.map((t, i) => {
                const ultimo = i === trilha.length - 1;
                return (
                  <li key={t.label} className="flex min-w-0 items-center gap-1.5">
                    {i > 0 && <span aria-hidden className="text-foreground/25">/</span>}
                    <span className={cn("truncate", ultimo && "font-medium text-foreground")} aria-current={ultimo ? "page" : undefined}>{t.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </nav>
        <button
          type="button"
          onClick={onBuscar}
          aria-label="Buscar tela ou ação"
          aria-haspopup="dialog"
          className="relative grid h-11 w-11 shrink-0 place-items-center text-foreground-secondary outline-none focus-visible:ring-2 focus-visible:ring-marca lg:hidden"
          style={{ borderRadius: 99 }}
        >
          {!(buscaAberta && origemBusca === "cel") && (
            <motion.span layoutId={idBusca("cel")} transition={MOLA_PASTA} aria-hidden className="absolute inset-1 bg-tinta-100" style={{ borderRadius: 99 }} />
          )}
          <Search className={cn("relative size-5 transition-opacity", buscaAberta && origemBusca === "cel" && "opacity-0")} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onBuscar}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          className="group relative hidden h-10 w-80 max-w-[36vw] shrink-0 items-center gap-2.5 pl-1.5 pr-1.5 text-sm text-foreground-muted outline-none focus-visible:shadow-[var(--anel-foco)] lg:flex"
          style={{ borderRadius: 14 }}
        >
          {!(buscaAberta && origemBusca === "pc") && (
            <motion.span
              layoutId={idBusca("pc")}
              transition={MOLA_PASTA}
              aria-hidden
              className="absolute inset-0 border border-borda bg-areia-card shadow-[var(--shadow-xs)] transition-colors group-hover:border-azul-200"
              style={{ borderRadius: 14 }}
            />
          )}
          <span className={cn("relative flex w-full items-center gap-2.5 transition-opacity", buscaAberta && origemBusca === "pc" && "opacity-0")}>
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-azul-50 text-azul-600 ring-1 ring-inset ring-azul-100 transition-transform duration-[var(--dur-media)] ease-[var(--ease-saida)] group-hover:scale-110 group-hover:-rotate-12">
              <Search className="size-[15px]" strokeWidth={2.4} />
            </span>
            <span className="flex-1 truncate text-left transition-colors group-hover:text-foreground-secondary">Buscar tela ou ação</span>
            <kbd className="flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-tinta-50 px-1.5 font-sans text-[11px] font-semibold text-foreground-muted ring-1 ring-inset ring-borda">
              <Command className="size-2.5" aria-hidden />K
            </kbd>
          </span>
        </button>
        {podeVerPedidos && <PedidosAcesso />}
        <MenuUsuario />
      </div>
    </header>
  );
}
