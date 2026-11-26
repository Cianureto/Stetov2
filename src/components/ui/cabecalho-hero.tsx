import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CSSProperties } from "react";
import { AjudaIndicador } from "@/components/ui/ajuda-indicador";
import { BordaTrilha, NumeroAnimado } from "@/components/ui/numero-animado";

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

/** Valor do cartão: os caracteres aparecem um de cada vez quando o número chega (e os que mudam, quando muda). */
function Valor({ n, falhou }: { n: NumeroHero; falhou: boolean }) {
  if (n.valor === undefined || n.textual) return <>{formatar(n.valor, falhou)}</>;
  return <NumeroAnimado valor={typeof n.valor === "number" ? n.valor : n.valor} />;
}

/** Posição na cascata de entrada dos cartões (cada um entra 70 ms depois do anterior). */
const ordem = (i: number) => ({ "--i": i }) as CSSProperties;

const PONTO = { marca: "bg-[var(--marca)]", aviso: "bg-[var(--acafrao)]", perigo: "bg-[var(--danger)]" } as const;
const VALOR = { marca: "", aviso: "text-[var(--aviso)]", perigo: "text-[var(--danger)]" } as const;

/** Anéis finos de enfeite no canto do cartão em destaque (sem brilho nem desfoque). */
function Aneis({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.25} className={cn("kpi-aneis pointer-events-none absolute", className)}>
      <circle cx="100" cy="100" r="38" />
      <circle cx="100" cy="100" r="62" />
      <circle cx="100" cy="100" r="86" />
    </svg>
  );
}

/** O primeiro número do cabeçalho: cartão maior, em azul da marca, com o valor em destaque. */
export function NumeroPrincipal({ n, falhou, sozinho = false }: { n: NumeroHero; falhou: boolean; sozinho?: boolean }) {
  return (
    <div
      style={ordem(0)}
      className={cn("kpi kpi-principal kpi-entrada min-w-0 px-5 py-4 md:px-6 md:py-5", sozinho ? "col-span-2 sm:col-span-1" : "col-span-2")}
    >
      <BordaTrilha clara />
      <Aneis className="-right-14 -top-16 size-52 text-white/[0.13]" />
      <Aneis className="-bottom-24 right-24 size-40 text-white/[0.07]" />
      <div className="relative">
        <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-white/80">
          <span className="truncate">{n.rotulo}</span>
          {n.ajuda && <AjudaIndicador escuro indicador={n.rotulo} texto={n.ajuda} />}
        </div>
        <div
          className={cn("mt-2", n.textual ? "line-clamp-2 text-lg font-semibold leading-snug md:text-xl" : "numero-destaque")}
          title={n.textual && typeof n.valor === "string" ? n.valor : undefined}
        >
          <Valor n={n} falhou={falhou} />
        </div>
        {n.nota && (
          <div className={cn("mt-3 inline-flex max-w-full truncate rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium", n.notaRuim ? "text-amber-100" : "text-white")}>
            {n.nota}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Cabeçalho das telas de lista e painel: sobretítulo, título, descrição e a ação principal, sobre o fundo da
 * página, e os números do conjunto inteiro (`undefined` = carregando) logo abaixo: o primeiro num cartão maior,
 * em azul (o número principal da tela), os outros em cartões brancos.
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
          <p className="texto-sobretitulo">{rotulo}</p>
          <h1 className={cn("mt-1 text-foreground", compacto ? "texto-titulo-2" : "texto-titulo-1")}>{titulo}</h1>
          <p className={cn("mt-1 text-sm leading-relaxed text-foreground-secondary", compacto && "max-sm:line-clamp-2")}>{descricao}</p>
        </div>
        {acao}
      </div>

      {numeros.length > 0 && (
        <div
          aria-busy={atualizando || undefined}
          className={cn(
            "grid grid-cols-2 gap-3 transition-opacity md:gap-4",
            numeros.length === 1 && "sm:grid-cols-2 lg:grid-cols-3",
            numeros.length === 2 && "md:grid-cols-3",
            numeros.length === 3 && "md:grid-cols-4",
            numeros.length >= 4 && "lg:grid-cols-5",
            atualizando && "opacity-60",
          )}
        >
          {numeros.map((n, i) => (i === 0 ? <NumeroPrincipal key={n.rotulo} n={n} falhou={falhou} sozinho={numeros.length === 1} /> : (
            <div key={n.rotulo} style={ordem(i)} className="card kpi kpi-entrada min-w-0 px-4 py-3.5 md:px-5 md:py-4">
              <BordaTrilha />
              <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-foreground-secondary">
                {n.tom && <span aria-hidden className={cn("size-2 shrink-0 rounded-full", PONTO[n.tom])} />}
                <span className="truncate">{n.rotulo}</span>
                {n.ajuda && <AjudaIndicador indicador={n.rotulo} texto={n.ajuda} />}
              </div>
              <div
                className={cn("mt-1.5 text-foreground", n.textual ? "line-clamp-2 text-base font-semibold leading-snug md:text-lg" : "numero-kpi", n.tom && VALOR[n.tom])}
                title={n.textual && typeof n.valor === "string" ? n.valor : undefined}
              >
                <Valor n={n} falhou={falhou} />
              </div>
              {n.nota && <div className={cn("mt-1 truncate text-xs", n.notaRuim ? "font-medium text-[var(--aviso)]" : "text-foreground-muted")}>{n.nota}</div>}
            </div>
          )))}
        </div>
      )}
      {aviso}
    </header>
  );
}

/** Botão principal do cabeçalho (azul da marca). */
export const classeAcaoHero =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[var(--marca)] px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(11,27,54,0.12)] transition hover:bg-[var(--marca-escuro)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca)] focus-visible:ring-offset-2";
