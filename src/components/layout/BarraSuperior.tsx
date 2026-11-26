import { Link, useLocation } from "react-router-dom";
import { Command, Search } from "lucide-react";
import { MarcaLogo } from "@/components/Marca";
import { MenuUsuario } from "@/components/layout/MenuUsuario";
import { cn } from "@/lib/cn";
import { trilhaPara, type SecaoMenu } from "@/lib/navegacao";

/**
 * Cabeçalho (padrão revenda). Celular: barra de vidro de largura total com a marca, busca e usuário.
 * A partir de `lg`: barra de vidro flutuante com a trilha (seção / tela), campo de busca (⌘K) e usuário.
 */
export function BarraSuperior({ secoes, inicio, onBuscar }: { secoes: SecaoMenu[]; inicio: string; onBuscar: () => void }) {
  const { pathname } = useLocation();
  const trilha = trilhaPara(pathname, secoes);
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/[0.06] bg-[var(--areia)]/75 pt-[env(safe-area-inset-top)] backdrop-blur-2xl backdrop-saturate-200 lg:border-transparent lg:bg-transparent lg:px-3 lg:backdrop-blur-none">
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
          aria-label="Buscar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-foreground-secondary outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-marca lg:hidden"
        >
          <Search className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onBuscar}
          className="group hidden h-9 w-80 max-w-[36vw] shrink-0 items-center gap-2 rounded-xl bg-foreground/[0.05] pl-3 pr-1.5 text-sm text-foreground-muted outline-none transition-colors hover:bg-foreground/[0.08] focus-visible:ring-2 focus-visible:ring-marca lg:flex"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 truncate text-left group-hover:text-foreground-secondary">Buscar tela ou ação</span>
          <kbd className="flex h-6 shrink-0 items-center gap-0.5 rounded-md border border-borda bg-[var(--areia-card)] px-1.5 font-sans text-[11px]">
            <Command className="size-2.5" aria-hidden />K
          </kbd>
        </button>
        <MenuUsuario />
      </div>
    </header>
  );
}
