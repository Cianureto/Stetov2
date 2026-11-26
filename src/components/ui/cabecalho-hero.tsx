import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";

export type NumeroHero = {
  valor: number | string | undefined;
  rotulo: string;
  destaque?: string;
  /** Linha curta de comparação sob o rótulo (ex.: "+3 vs. ontem", "na meta"); `notaRuim` pinta de açafrão. */
  nota?: string;
  notaRuim?: boolean;
  /** Valor em texto longo (ex.: nome de produto): fonte menor, quebra em até duas linhas. */
  textual?: boolean;
  /** Texto curto de "como é calculado" (ícone "?" ao lado do rótulo); os textos ficam em `lib/ajudaIndicadores.ts`. */
  ajuda?: string;
};

const formatar = (v: number | string | undefined, falhou: boolean) =>
  v === undefined ? (falhou ? "—" : "…") : typeof v === "number" ? v.toLocaleString("pt-BR") : v;

/**
 * Cabeçalho em destaque das telas de catálogo do gestor (Apresentações, Consultores): faixa escura em
 * azul da marca com brilhos da marca, título, ação principal e números do conjunto inteiro (`undefined` = carregando).
 * `aviso` aparece abaixo dos números (ex.: cadastros aguardando aprovação). `falhou`: a carga deu erro e
 * não há números ("—" em vez de "…"); `atualizando`: os números são da carga anterior (ficam esmaecidos).
 */
export function CabecalhoHero({ rotulo, titulo, descricao, acao, numeros = [], aviso, falhou = false, atualizando = false, compacto = false }: {
  rotulo: string;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
  /** Indicadores (2–4). Vazio: o cabeçalho fica só com o título (ex.: perfil de quem não tem números). */
  numeros?: NumeroHero[];
  aviso?: ReactNode;
  falhou?: boolean;
  atualizando?: boolean;
  /** Versão mais baixa, para telas que precisam do espaço vertical (agenda, relatório de visita). */
  compacto?: boolean;
}) {
  return (
    <header className={cn("relative overflow-hidden rounded-2xl bg-[var(--consultor-dark)] text-white shadow-[var(--shadow-lg)]", compacto ? "px-4 py-4 md:px-6 md:py-5" : "px-5 py-6 md:px-8 md:py-8")}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--consultor-glow-mint)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[var(--consultor-glow-amber)] opacity-60 blur-3xl" />

      <div className={cn("relative flex flex-col", compacto ? "gap-3" : "gap-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-realce">{rotulo}</p>
            <h1 className={cn("mt-1 font-titulo font-bold leading-tight", compacto ? "text-xl md:text-2xl" : "text-2xl md:text-[32px]")}>{titulo}</h1>
            <p className={cn("text-sm leading-relaxed text-white/75", compacto ? "mt-1 max-sm:line-clamp-2" : "mt-2")}>{descricao}</p>
          </div>
          {acao}
        </div>

        {numeros.length > 0 && (
        <div
          aria-busy={atualizando || undefined}
          className={cn("grid grid-cols-2 gap-2.5 transition-opacity md:gap-3", numeros.length >= 4 && "md:grid-cols-4", numeros.length === 3 && "md:grid-cols-3", atualizando && "opacity-60")}
        >
          {numeros.map((n) => (
            <div key={n.rotulo} className="min-w-0 rounded-xl bg-white/[0.06] px-3.5 py-3 ring-1 ring-white/10 backdrop-blur-sm">
              <div
                className={cn(
                  "font-titulo font-semibold text-white",
                  n.textual ? "line-clamp-2 text-base leading-snug md:text-lg" : "text-2xl tabular-nums leading-none md:text-[28px]",
                  n.destaque,
                )}
                title={n.textual && typeof n.valor === "string" ? n.valor : undefined}
              >
                {formatar(n.valor, falhou)}
              </div>
              <div className="mt-1.5 flex min-w-0 items-center gap-1 text-xs text-white/70">
                <span className="truncate">{n.rotulo}</span>
                {n.ajuda && <AjudaIndicador escuro indicador={n.rotulo} texto={n.ajuda} />}
              </div>
              {n.nota && <div className={cn("mt-1 truncate text-[11px] font-semibold", n.notaRuim ? "text-[var(--acafrao)]" : "text-realce")}>{n.nota}</div>}
            </div>
          ))}
        </div>
        )}
        {aviso}
      </div>
    </header>
  );
}

/** Botão principal do cabeçalho em destaque (menta sobre o azul da marca). */
export const classeAcaoHero =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--realce)] px-4 text-sm font-semibold text-[var(--consultor-dark)] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_var(--consultor-glow-mint)] transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
