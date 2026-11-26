import { NavLink } from "react-router-dom";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ItemMenu } from "@/lib/navegacao";

const CLASSE_ABA = "relative mx-auto flex h-13 w-full max-w-20 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-semibold tracking-[-0.01em] outline-none transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-marca";

function Aba({ item }: { item: ItemMenu }) {
  return (
    <NavLink to={item.href} className={({ isActive }) => cn(CLASSE_ABA, isActive ? "bg-marca-claro text-marca" : "text-foreground-muted")}>
      {({ isActive }) => (
        <>
          <item.Icone width={22} height={22} strokeWidth={isActive ? 2.1 : 1.8} aria-hidden />
          <span className="max-w-full truncate">{item.rotuloAba ?? item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Barra de abas flutuante do celular e do tablet em pé (padrão revenda): duas abas, o botão central
 * de ação rápida, a terceira aba e "Mais" (abre o menu completo). Some a partir de `lg`.
 */
export function BarraAbas({ itens, maisAtivo, avisoMais, onAcaoRapida, rotuloAcao, onMais }: {
  itens: ItemMenu[];
  /** A tela atual está no menu "Mais" (não é uma aba). */
  maisAtivo: boolean;
  /** Ponto de aviso em "Mais" (ex.: pedidos pendentes). */
  avisoMais: boolean;
  onAcaoRapida?: () => void;
  rotuloAcao?: string;
  onMais: () => void;
}) {
  return (
    <nav aria-label="Navegação" className="fixed inset-x-3 bottom-0 z-30 mb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <div className="vidro mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-full px-1">
        {itens[0] ? <Aba item={itens[0]} /> : <span />}
        {itens[1] ? <Aba item={itens[1]} /> : <span />}
        <div className="flex justify-center">
          {onAcaoRapida && (
            <button
              type="button"
              onClick={onAcaoRapida}
              aria-label={rotuloAcao}
              className="grid h-12 w-12 place-items-center rounded-full bg-marca text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),var(--shadow-glow)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
            >
              <Plus className="size-6" strokeWidth={2.5} aria-hidden />
            </button>
          )}
        </div>
        {itens[2] ? <Aba item={itens[2]} /> : <span />}
        <button type="button" onClick={onMais} aria-haspopup="dialog" className={cn(CLASSE_ABA, maisAtivo ? "bg-marca-claro text-marca" : "text-foreground-muted")}>
          <span className="relative">
            <MoreHorizontal className="size-[22px]" aria-hidden />
            {avisoMais && <span aria-hidden className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--acafrao)] ring-2 ring-[var(--areia-card)]" />}
          </span>
          Mais
        </button>
      </div>
    </nav>
  );
}
