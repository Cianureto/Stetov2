import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { MarcaLogo } from "@/components/Marca";
import { cn } from "@/lib/cn";
import type { AcaoRapida, ItemMenu, SecaoMenu } from "@/lib/navegacao";
import { MiniPasta } from "@/components/layout/PastaAcoes";

/** Contagem ao lado do item (pedidos de carteira pendentes). */
export function Contador({ valor, className }: { valor: number; className?: string }) {
  if (valor <= 0) return null;
  return (
    <span className={cn("rounded-full bg-[var(--acafrao)] px-1.5 text-[11px] font-bold leading-[18px] text-[var(--foreground)]", className)} aria-label={`${valor} aguardando aprovação`}>
      {valor}
    </span>
  );
}

function ItemLateral({ item, pendentes }: { item: ItemMenu; pendentes: number }) {
  return (
    <NavLink
      to={item.href}
      className="group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium outline-none transition-colors hover:bg-[var(--sidebar-dark-hover)] focus-visible:ring-2 focus-visible:ring-[var(--realce)]/50"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="menu-lateral-ativo"
              className="absolute inset-0 rounded-[10px] bg-[var(--sidebar-active-bg)] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] before:absolute before:inset-y-2.5 before:-left-1 before:w-1 before:rounded-full before:bg-[var(--realce)]"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <item.Icone
            className={cn("relative shrink-0", isActive ? "text-realce" : "text-[var(--sidebar-fg)] group-hover:text-white")}
            width={18}
            height={18}
            strokeWidth={isActive ? 2.1 : 1.8}
            aria-hidden
          />
          <span className={cn("relative truncate", isActive ? "font-semibold text-white" : "text-white/85 group-hover:text-white")}>{item.label}</span>
          {item.contador === "pedidos" && <Contador valor={pendentes} className="relative ml-auto" />}
        </>
      )}
    </NavLink>
  );
}

/** Barra lateral escura flutuante (a partir de `lg`): marca, ação rápida e seções do menu. */
export function BarraLateral({ secoes, pendentes, inicio, onAcaoRapida, rotuloAcao, acoes = [], pastaAberta = false }: {
  secoes: SecaoMenu[];
  pendentes: number;
  inicio: string;
  onAcaoRapida?: () => void;
  rotuloAcao?: string;
  /** Ações do menu Novo: a miniatura da "pasta" no botão mostra os ícones delas. */
  acoes?: AcaoRapida[];
  pastaAberta?: boolean;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh p-3 pr-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:block">
      <div className="flex h-full flex-col rounded-2xl bg-[var(--sidebar-bg)] px-3 py-4 shadow-[var(--shadow-lg)]">
        <Link to={inicio} className="mb-4 block w-fit rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-realce/50">
          <MarcaLogo fundo="escuro" tamanho="md" />
        </Link>
        {onAcaoRapida && (
          <button
            type="button"
            onClick={onAcaoRapida}
            aria-haspopup={acoes.length > 1 ? "dialog" : undefined}
            className="mb-4 flex h-11 items-center justify-center gap-2.5 rounded-[12px] bg-[var(--realce)] px-3 text-sm font-semibold text-[var(--sidebar-bg)] shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <MiniPasta acoes={acoes} aberta={pastaAberta} />
            {rotuloAcao}
          </button>
        )}
        <nav aria-label="Navegação principal" className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 [scrollbar-width:none]">
          {secoes.map((s) => (
            <div key={s.chave}>
              <p className="px-3 pb-1 text-xs font-semibold text-white/60">{s.titulo}</p>
              <div className="space-y-0.5">
                {s.itens.map((i) => <ItemLateral key={i.href} item={i} pendentes={pendentes} />)}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
