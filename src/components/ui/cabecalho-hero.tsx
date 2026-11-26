import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";

export type NumeroHero = {
  valor: number | string | undefined;
  rotulo: string;
  /** Tom do número: `marca` (ponto azul), `aviso` (âmbar: pendente, a revisar), `perigo` (vermelho: vencido). */
  tom?: "marca" | "aviso" | "perigo";
  /** Linha curta de comparação sob o rótulo (ex.: "16 notas", "R$ 9.498,42"); `notaRuim` pinta de âmbar. */
  nota?: string;
  notaRuim?: boolean;
  /** Valor em texto longo (ex.: nome de produto): fonte menor, quebra em até duas linhas. */
  textual?: boolean;
  /** Texto curto de "como é calculado" (ícone "?" ao lado do rótulo); os textos ficam em `lib/ajudaIndicadores.ts`. */
  ajuda?: string;
};

const formatar = (v: number | string | undefined, falhou: boolean) =>
  v === undefined ? (falhou ? "—" : "…") : typeof v === "number" ? v.toLocaleString("pt-BR") : v;

const PONTO = { marca: "bg-[var(--marca)]", aviso: "bg-[var(--acafrao)]", perigo: "bg-[var(--danger)]" } as const;
const VALOR = { marca: "", aviso: "text-[var(--aviso)]", perigo: "text-[var(--danger)]" } as const;

/**
 * Cabeçalho das telas de lista e painel: sobretítulo, título, descrição e a ação principal, sobre o fundo da
 * página, e os números do conjunto inteiro (`undefined` = carregando) em cartões brancos logo abaixo.
 * `aviso` aparece abaixo dos números. `falhou`: a carga deu erro e não há números ("—" em vez de "…");
 * `atualizando`: os números são da carga anterior (ficam esmaecidos).
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
  /** Versão mais baixa, para telas que precisam do espaço vertical. */
  compacto?: boolean;
}) {
  return (
    <header className={cn("flex flex-col", compacto ? "gap-4" : "gap-5")}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--marca)]">{rotulo}</p>
          <h1 className={cn("mt-1 font-titulo font-semibold leading-tight tracking-tight text-foreground", compacto ? "text-xl md:text-2xl" : "text-2xl md:text-[28px]")}>{titulo}</h1>
          <p className={cn("mt-1 text-sm leading-relaxed text-foreground-secondary", compacto && "max-sm:line-clamp-2")}>{descricao}</p>
        </div>
        {acao}
      </div>

      {numeros.length > 0 && (
        <div
          aria-busy={atualizando || undefined}
          className={cn("grid grid-cols-2 gap-3 transition-opacity md:gap-4", numeros.length >= 4 && "lg:grid-cols-4", numeros.length === 3 && "md:grid-cols-3", atualizando && "opacity-60")}
        >
          {numeros.map((n) => (
            <div key={n.rotulo} className="card min-w-0 px-4 py-3.5 md:px-5 md:py-4">
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-foreground-secondary">
                {n.tom && <span aria-hidden className={cn("size-2 shrink-0 rounded-full", PONTO[n.tom])} />}
                <span className="truncate">{n.rotulo}</span>
                {n.ajuda && <AjudaIndicador indicador={n.rotulo} texto={n.ajuda} />}
              </div>
              <div
                className={cn(
                  "mt-1.5 font-semibold tracking-tight text-foreground",
                  n.textual ? "line-clamp-2 text-base leading-snug md:text-lg" : "text-xl leading-tight md:text-2xl",
                  n.tom && VALOR[n.tom],
                )}
                title={n.textual && typeof n.valor === "string" ? n.valor : undefined}
              >
                {formatar(n.valor, falhou)}
              </div>
              {n.nota && <div className={cn("mt-1 truncate text-xs", n.notaRuim ? "font-medium text-[var(--aviso)]" : "text-foreground-muted")}>{n.nota}</div>}
            </div>
          ))}
        </div>
      )}
      {aviso}
    </header>
  );
}

/** Botão principal do cabeçalho (azul da marca). */
export const classeAcaoHero =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--marca)] px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(11,27,54,0.12)] transition hover:bg-[var(--marca-escuro)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca)] focus-visible:ring-offset-2";
