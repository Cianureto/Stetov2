import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { gsap, reduzMovimento, useGSAP } from "@/lib/gsap";
import { Barra } from "@/components/ui/animado";
import { cn } from "@/lib/cn";
import { caminhoSuave, marcasEixo } from "@/lib/graficos";

// Gráficos da tela Relatórios, desenhados em SVG com coordenadas em pixels (mede a largura do contêiner),
// para os traços e cantos arredondados não deformarem. Regras: um eixo só, linhas de 2px, grade fina e sólida,
// textos nas cores de texto (nunca na cor da série), legenda com 2+ séries, dica ao passar o mouse ou com as
// setas do teclado, e uma tabela escondida com os mesmos números para leitores de tela.

const GRADE = "#e3e9f2";
const SUPERFICIE = "#ffffff";

export type SerieGrafico = { chave: string; rotulo: string; cor: string; dados: number[] };

function useLargura(ref: RefObject<HTMLElement | null>) {
  const [largura, setLargura] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLargura(el.clientWidth);
    const obs = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return largura;
}

/** Coluna com o topo arredondado (4px) e a base reta, apoiada na linha de base. */
const coluna = (x: number, y: number, w: number, h: number, r = 4) => {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
};

export function Legenda({ series, forma = "bloco" }: { series: { rotulo: string; cor: string }[]; forma?: "bloco" | "linha" }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-secondary">
      {series.map((s) => (
        <li key={s.rotulo} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("inline-block", forma === "linha" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[3px]")} style={{ background: s.cor }} />
          {s.rotulo}
        </li>
      ))}
    </ul>
  );
}

function TabelaOculta({ titulo, categorias, series, formatarValor }: { titulo: string; categorias: string[]; series: SerieGrafico[]; formatarValor: (v: number) => string }) {
  // sr-only num div: uma tabela não encolhe abaixo do conteúdo e alargaria a página no celular.
  return (
    <div className="sr-only">
    <table>
      <caption>{titulo}</caption>
      <thead>
        <tr>
          <th scope="col">Mês</th>
          {series.map((s) => <th key={s.chave} scope="col">{s.rotulo}</th>)}
        </tr>
      </thead>
      <tbody>
        {categorias.map((c, i) => (
          <tr key={c + i}>
            <th scope="row">{c}</th>
            {series.map((s) => <td key={s.chave}>{formatarValor(s.dados[i] ?? 0)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/** Balão da dica: valor em destaque, nome da série depois, traço da cor da série como chave. */
function Dica({ titulo, linhas, x, largura, total }: { titulo: string; linhas: { rotulo: string; cor: string; valor: string }[]; x: number; largura: number; total?: string }) {
  const aDireita = x < largura * 0.62;
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 min-w-40 rounded-lg border border-borda bg-areia-card px-3 py-2 text-xs shadow-[0_8px_24px_-8px_rgba(11,27,54,0.25)]"
      style={{ left: x, transform: aDireita ? "translateX(12px)" : "translateX(calc(-100% - 12px))" }}
    >
      <div className="mb-1 font-medium text-foreground">{titulo}</div>
      {linhas.map((l) => (
        <div key={l.rotulo} className="flex items-center gap-2 whitespace-nowrap py-0.5">
          <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: l.cor }} />
          <span className="font-semibold tabular-nums text-foreground">{l.valor}</span>
          <span className="text-foreground-muted">{l.rotulo}</span>
        </div>
      ))}
      {total && <div className="mt-1 border-t border-borda pt-1 text-foreground-secondary">Total <span className="font-semibold tabular-nums text-foreground">{total}</span></div>}
    </div>
  );
}

/** Teclado: setas andam pelos meses, Home/End vão às pontas, Esc fecha a dica. */
function teclasNavegacao(n: number, setAtivo: (f: (i: number | null) => number | null) => void) {
  return (e: KeyboardEvent) => {
    const mover: Record<string, (i: number) => number> = {
      ArrowLeft: (i) => Math.max(0, i - 1),
      ArrowRight: (i) => Math.min(n - 1, i + 1),
      Home: () => 0,
      End: () => n - 1,
    };
    if (e.key === "Escape") return setAtivo(() => null);
    const f = mover[e.key];
    if (!f) return;
    e.preventDefault();
    setAtivo((i) => f(i ?? n - 1));
  };
}

const MARGEM = { topo: 14, dir: 8, base: 26, esq: 62 };

function Eixos({ marcas, y, largura, formatarEixo }: { marcas: number[]; y: (v: number) => number; largura: number; formatarEixo: (v: number) => string }) {
  return (
    <g>
      {marcas.map((m) => (
        <g key={m}>
          <line x1={MARGEM.esq} x2={largura - MARGEM.dir} y1={y(m)} y2={y(m)} stroke={GRADE} strokeWidth={1} shapeRendering="crispEdges" />
          <text x={MARGEM.esq - 10} y={y(m)} dy="0.32em" textAnchor="end" className="fill-foreground-muted text-[11px] tabular-nums">
            {m === 0 ? "0" : formatarEixo(m)}
          </text>
        </g>
      ))}
    </g>
  );
}

function RotulosX({ categorias, x, altura, largura }: { categorias: string[]; x: (i: number) => number; altura: number; largura: number }) {
  const util = largura - MARGEM.esq - MARGEM.dir;
  const passo = Math.max(1, Math.ceil(categorias.length / Math.max(1, Math.floor(util / 54))));
  return (
    <g>
      {categorias.map((c, i) =>
        i % passo === 0 ? (
          <text key={c + i} x={x(i)} y={altura - 6} textAnchor="middle" className="fill-foreground-muted text-[11px]">
            {c}
          </text>
        ) : null,
      )}
    </g>
  );
}

const MOLA_CURSOR = { type: "spring", bounce: 0, visualDuration: 0.3 } as const;

/** Valor de uma série numa posição fracionária (entre dois meses, interpola em linha reta). */
function valorEm(dados: number[], p: number) {
  if (!dados.length) return 0;
  const i = Math.max(0, Math.min(dados.length - 1, p));
  const a = Math.floor(i);
  const b = Math.min(dados.length - 1, a + 1);
  return (dados[a] ?? 0) + ((dados[b] ?? 0) - (dados[a] ?? 0)) * (i - a);
}

/** Ponto do cursor sobre a linha de uma série: desliza junto com o cursor. */
function PontoCursor({ serie, posicao, x, y }: { serie: SerieGrafico; posicao: MotionValue<number>; x: (i: number) => number; y: (v: number) => number }) {
  const cx = useTransform(posicao, (p) => x(p));
  const cy = useTransform(posicao, (p) => y(valorEm(serie.dados, p)));
  return <motion.circle cx={cx} cy={cy} r={5} fill={serie.cor} stroke={SUPERFICIE} strokeWidth={2.5} />;
}

/** Valor de uma série no balão do cursor: os números rolam enquanto o cursor anda de um mês ao outro. */
function ValorCursor({ serie, posicao, formatarValor }: { serie: SerieGrafico; posicao: MotionValue<number>; formatarValor: (v: number) => string }) {
  const texto = useTransform(posicao, (p) => formatarValor(valorEm(serie.dados, p)));
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: serie.cor }} />
      <motion.span className="font-semibold tabular-nums text-foreground">{texto}</motion.span>
      <span className="text-foreground-muted">{serie.rotulo}</span>
    </div>
  );
}

/**
 * Áreas sobrepostas com degradê (a primeira série fica atrás). As linhas se desenham ao entrar. Com o mouse
 * (ou as setas), um cursor desliza até o mês mais próximo — a linha vertical, os pontos e o balão andam juntos
 * e os valores rolam até os do mês (como o gráfico de linha do Motion).
 */
export function GraficoArea({
  titulo,
  categorias,
  series,
  altura = 280,
  formatarValor,
  formatarEixo,
}: {
  titulo: string;
  categorias: string[];
  series: SerieGrafico[];
  altura?: number;
  formatarValor: (v: number) => string;
  formatarEixo: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const largura = useLargura(ref);
  const [ativo, setAtivo] = useState<number | null>(null);
  const id = useId().replace(/:/g, "");
  const n = categorias.length;
  const marcas = marcasEixo(Math.max(0, ...series.flatMap((s) => s.dados)));
  const topo = marcas.at(-1) || 1;
  const w = Math.max(0, largura - MARGEM.esq - MARGEM.dir);
  const h = altura - MARGEM.topo - MARGEM.base;
  const x = (i: number) => MARGEM.esq + (n > 1 ? (i * w) / (n - 1) : w / 2);
  const y = (v: number) => MARGEM.topo + h - (v / topo) * h;
  const base = y(0);
  const chaveDados = JSON.stringify(series.map((s) => s.dados));
  const caminhos = series.map((s) => {
    const linha = caminhoSuave(s.dados.map((v, i) => ({ x: x(i), y: y(v) })));
    return { s, linha, area: n ? `${linha} L${x(n - 1)},${base} L${x(0)},${base} Z` : "" };
  });

  // Posição do cursor (índice fracionário): pula na primeira vez e desliza com mola entre os meses.
  const posicao = useSpring(0, MOLA_CURSOR);
  const anterior = useRef<number | null>(null);
  useEffect(() => {
    if (ativo === null) {
      anterior.current = null;
      return;
    }
    if (anterior.current === null) posicao.jump(ativo);
    else posicao.set(ativo);
    anterior.current = ativo;
  }, [ativo, posicao]);
  const cursorX = useTransform(posicao, (p) => x(p));
  const balaoX = useTransform(posicao, (p) => Math.max(90, Math.min(largura - 90, x(p))));
  const balaoY = useTransform(posicao, (p) => Math.min(...series.map((s) => y(valorEm(s.dados, p)))) - 14);

  function aoMover(e: PointerEvent<SVGSVGElement>) {
    if (!n) return;
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = n > 1 ? Math.round(((px - MARGEM.esq) / w) * (n - 1)) : 0;
    setAtivo(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div>
      {series.length > 1 && <div className="mb-3"><Legenda series={series.map((s) => ({ rotulo: s.rotulo, cor: s.cor }))} /></div>}
      <TabelaOculta titulo={titulo} categorias={categorias} series={series} formatarValor={formatarValor} />
      <div ref={ref} className="relative min-w-0" style={{ height: altura }}>
        {largura > 0 && (
          <svg
            width={largura}
            height={altura}
            role="img"
            aria-label={`${titulo}. Use as setas para ver mês a mês.`}
            tabIndex={0}
            className="block touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca)]"
            onPointerMove={aoMover}
            onPointerDown={aoMover}
            onPointerLeave={() => setAtivo(null)}
            onFocus={() => setAtivo((i) => i ?? n - 1)}
            onBlur={() => setAtivo(null)}
            onKeyDown={teclasNavegacao(n, setAtivo)}
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.chave} id={`${id}-${s.chave}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={s.cor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.cor} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <Eixos marcas={marcas} y={y} largura={largura} formatarEixo={formatarEixo} />
            <g key={chaveDados}>
              {caminhos.map(({ s, area }) => (
                <motion.path key={`a-${s.chave}`} d={area} fill={`url(#${id}-${s.chave})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} />
              ))}
              {caminhos.map(({ s, linha }, i) => (
                <motion.path
                  key={`l-${s.chave}`}
                  d={linha}
                  fill="none"
                  stroke={s.cor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: i * 0.12 }}
                />
              ))}
            </g>
            <AnimatePresence>
              {ativo !== null && (
                <motion.g key="cursor" pointerEvents="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <motion.line x1={cursorX} x2={cursorX} y1={MARGEM.topo} y2={base} stroke="#9fb0c9" strokeWidth={1} strokeDasharray="0" />
                  {series.map((s) => (
                    <PontoCursor key={`${s.chave}-${largura}`} serie={s} posicao={posicao} x={x} y={y} />
                  ))}
                </motion.g>
              )}
            </AnimatePresence>
            <RotulosX categorias={categorias} x={x} altura={altura} largura={largura} />
          </svg>
        )}
        <AnimatePresence>
          {ativo !== null && largura > 0 && (
            <motion.div
              key="balao"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute left-0 top-0 z-10"
              style={{ x: balaoX, y: balaoY }}
            >
              <div className="-translate-x-1/2 -translate-y-full rounded-xl border border-borda bg-areia-card/95 px-3 py-2 text-xs shadow-[0_10px_24px_-10px_rgba(11,27,54,0.3)] backdrop-blur">
                <div className="mb-1 font-semibold text-foreground">{categorias[ativo]}</div>
                <div className="space-y-0.5">
                  {series.map((s) => (
                    <ValorCursor key={`${s.chave}-${largura}`} serie={s} posicao={posicao} formatarValor={formatarValor} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Colunas por mês: uma série, várias lado a lado (`agrupado`) ou empilhadas (`empilhado`, com 2px de folga
 * entre os pedaços e só o topo arredondado). `rotularMaior`: escreve o valor no topo da maior coluna.
 */
export function GraficoColunas({
  titulo,
  categorias,
  series,
  modo = "agrupado",
  altura = 260,
  formatarValor,
  formatarEixo,
  rotularMaior = false,
}: {
  titulo: string;
  categorias: string[];
  series: SerieGrafico[];
  modo?: "agrupado" | "empilhado";
  altura?: number;
  formatarValor: (v: number) => string;
  formatarEixo: (v: number) => string;
  rotularMaior?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const largura = useLargura(ref);
  const [ativo, setAtivo] = useState<number | null>(null);
  const n = categorias.length;
  const empilhado = modo === "empilhado" || series.length === 1;
  const totais = categorias.map((_, i) => series.reduce((t, s) => t + (s.dados[i] ?? 0), 0));
  const marcas = marcasEixo(empilhado ? Math.max(0, ...totais) : Math.max(0, ...series.flatMap((s) => s.dados)));
  const topo = marcas.at(-1) || 1;
  const w = Math.max(0, largura - MARGEM.esq - MARGEM.dir);
  const h = altura - MARGEM.topo - MARGEM.base - (rotularMaior ? 14 : 0);
  const faixa = n ? w / n : 0;
  const x = (i: number) => MARGEM.esq + faixa * i + faixa / 2;
  const y = (v: number) => altura - MARGEM.base - (v / topo) * h;
  const larguraBarra = empilhado ? Math.min(24, faixa * 0.56) : Math.min(16, (faixa * 0.7 - 2 * (series.length - 1)) / series.length);
  const maior = rotularMaior ? totais.indexOf(Math.max(...totais)) : -1;

  useGSAP(
    () => {
      if (!svgRef.current || reduzMovimento() || !largura) return;
      gsap.from(svgRef.current.querySelectorAll("[data-coluna]"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.8, stagger: 0.02, ease: "power2.out" });
    },
    { dependencies: [JSON.stringify(series.map((s) => s.dados)), largura > 0], revertOnUpdate: true },
  );

  return (
    <div>
      {series.length > 1 && <div className="mb-3"><Legenda series={series.map((s) => ({ rotulo: s.rotulo, cor: s.cor }))} /></div>}
      <TabelaOculta titulo={titulo} categorias={categorias} series={series} formatarValor={formatarValor} />
      <div ref={ref} className="relative min-w-0" style={{ height: altura }}>
        {largura > 0 && (
          <svg
            ref={svgRef}
            width={largura}
            height={altura}
            role="img"
            aria-label={`${titulo}. Use as setas para ver mês a mês.`}
            tabIndex={0}
            className="block touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca)]"
            onPointerLeave={() => setAtivo(null)}
            onFocus={() => setAtivo((i) => i ?? n - 1)}
            onBlur={() => setAtivo(null)}
            onKeyDown={teclasNavegacao(n, setAtivo)}
          >
            <Eixos marcas={marcas} y={(v) => y(v)} largura={largura} formatarEixo={formatarEixo} />
            {categorias.map((c, i) => {
              const apagada = ativo !== null && ativo !== i;
              let acumulado = 0;
              const visiveis = series.filter((s) => (s.dados[i] ?? 0) > 0);
              return (
                <g key={c + i} onPointerEnter={() => setAtivo(i)} onPointerDown={() => setAtivo(i)} style={{ opacity: apagada ? 0.4 : 1, transition: "opacity 180ms ease" }}>
                  <rect x={MARGEM.esq + faixa * i} y={MARGEM.topo} width={faixa} height={altura - MARGEM.topo - MARGEM.base} fill="transparent" />
                  {empilhado
                    ? visiveis.map((s, k) => {
                        const v = s.dados[i] ?? 0;
                        const y0 = y(acumulado);
                        acumulado += v;
                        const y1 = y(acumulado);
                        const ultimo = k === visiveis.length - 1;
                        const alturaPedaco = Math.max(1, y0 - y1 - (k > 0 ? 2 : 0));
                        const topoPedaco = y0 - (k > 0 ? 2 : 0) - alturaPedaco;
                        return (
                          <path
                            data-coluna
                            key={s.chave}
                            d={ultimo ? coluna(x(i) - larguraBarra / 2, topoPedaco, larguraBarra, alturaPedaco) : `M${x(i) - larguraBarra / 2},${topoPedaco} h${larguraBarra} v${alturaPedaco} h${-larguraBarra} Z`}
                            fill={s.cor}
                          />
                        );
                      })
                    : series.map((s, k) => {
                        const v = s.dados[i] ?? 0;
                        const inicio = x(i) - (series.length * larguraBarra + 2 * (series.length - 1)) / 2;
                        const alturaBarra = Math.max(v > 0 ? 1 : 0, y(0) - y(v));
                        return alturaBarra ? (
                          <path data-coluna key={s.chave} d={coluna(inicio + k * (larguraBarra + 2), y(0) - alturaBarra, larguraBarra, alturaBarra)} fill={s.cor} />
                        ) : null;
                      })}
                  {i === maior && totais[i] > 0 && (
                    <text x={x(i)} y={y(totais[i]) - 6} textAnchor="middle" className="fill-foreground text-[11px] font-semibold tabular-nums">
                      {formatarEixo(totais[i])}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={MARGEM.esq} x2={largura - MARGEM.dir} y1={y(0)} y2={y(0)} stroke="#c9d4e4" strokeWidth={1} shapeRendering="crispEdges" />
            <RotulosX categorias={categorias} x={x} altura={altura} largura={largura} />
          </svg>
        )}
        {ativo !== null && largura > 0 && (
          <Dica
            titulo={categorias[ativo]}
            x={x(ativo)}
            largura={largura}
            linhas={series.map((s) => ({ rotulo: s.rotulo, cor: s.cor, valor: formatarValor(s.dados[ativo] ?? 0) }))}
            total={modo === "empilhado" && series.length > 1 ? formatarValor(totais[ativo]) : undefined}
          />
        )}
      </div>
    </div>
  );
}

/** Mini tendência para os cartões de indicador: meses anteriores em tom apagado, o último em destaque. */
export function Sparkline({ dados, cor = "#1d4ed8", corLinha = "#b7c6dd", corAnel = SUPERFICIE, altura = 36 }: { dados: number[]; cor?: string; corLinha?: string; corAnel?: string; altura?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const largura = useLargura(ref);
  const max = Math.max(...dados, 0);
  const min = Math.min(...dados, 0);
  const faixa = max - min || 1;
  const pontos = dados.map((v, i) => ({ x: 3 + (dados.length > 1 ? (i * (largura - 6)) / (dados.length - 1) : (largura - 6) / 2), y: 4 + (altura - 8) * (1 - (v - min) / faixa) }));
  const ultimo = pontos.at(-1);
  return (
    <div ref={ref} aria-hidden style={{ height: altura }}>
      {largura > 0 && dados.length > 1 && (
        <svg width={largura} height={altura} className="block overflow-visible">
          <path d={caminhoSuave(pontos)} fill="none" stroke={corLinha} strokeWidth={1.5} strokeLinecap="round" />
          {ultimo && <circle cx={ultimo.x} cy={ultimo.y} r={3.5} fill={cor} stroke={corAnel} strokeWidth={2} />}
        </svg>
      )}
    </div>
  );
}

/**
 * Lista de barras numa base comum (uma cor só): nome e valor em cima, barra embaixo. Para partes de um todo,
 * rankings e faixas ordenadas. `max` fixa a escala (padrão: o maior item).
 */
export function BarrasRotuladas({
  itens,
  cor = "#1d4ed8",
  formatarValor,
  max,
  vazio = "Sem dados no período.",
  className,
}: {
  itens: { rotulo: ReactNode; valor: number; detalhe?: ReactNode; chave?: string }[];
  cor?: string;
  formatarValor: (v: number) => string;
  max?: number;
  vazio?: string;
  className?: string;
}) {
  const escala = max ?? Math.max(0, ...itens.map((i) => i.valor));
  if (!itens.length) return <p className="text-sm text-foreground-muted">{vazio}</p>;
  return (
    <ul className={cn("-mx-2 space-y-1", className)}>
      {itens.map((item, i) => (
        <li key={item.chave ?? i} className="linha-hover rounded-lg px-2 py-2">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-foreground">{item.rotulo}</span>
            <span className="shrink-0 tabular-nums font-semibold text-foreground">{formatarValor(item.valor)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eef2f8]">
            <Barra pct={escala ? (item.valor / escala) * 100 : 0} atraso={i * 0.04} className="h-full rounded-full" style={{ background: cor }} />
          </div>
          {item.detalhe && <div className="mt-1 text-xs text-foreground-muted">{item.detalhe}</div>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Barra segmentada alta (um todo dividido em até 6 partes): cada parte um bloco com a fatia escrita dentro
 * quando cabe, e a legenda com os nomes. A soma das partes é o todo.
 */
export function BarraSegmentada({ partes, rotulo }: { partes: { rotulo: string; valor: number; cor: string; textoClaro?: boolean }[]; rotulo: string }) {
  const total = partes.reduce((t, p) => t + Math.max(0, p.valor), 0);
  const visiveis = partes.filter((p) => p.valor > 0);
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  return (
    <div>
      <div role="img" aria-label={`${rotulo}: ${visiveis.map((p) => `${p.rotulo} ${pct(p.valor).toFixed(1).replace(".", ",")}%`).join(", ")}`} className="flex h-7 gap-0.5">
        {visiveis.map((p) => {
          const fatia = pct(p.valor);
          return (
            <div
              key={p.rotulo}
              title={`${p.rotulo}: ${fatia.toFixed(1).replace(".", ",")}%`}
              className={cn("flex h-full items-center rounded-[4px] px-2 text-[11px] font-semibold tabular-nums", p.textoClaro === false ? "text-foreground" : "text-white")}
              style={{ width: `${fatia}%`, background: p.cor, minWidth: 3 }}
            >
              {fatia >= 9 ? `${fatia.toFixed(fatia >= 99.5 ? 0 : 1).replace(".", ",")}%` : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-2.5"><Legenda series={visiveis.map((p) => ({ rotulo: p.rotulo, cor: p.cor }))} /></div>
    </div>
  );
}

/** Número que rola até o valor novo (mola), formatado a cada quadro — para o centro da pizza. */
function NumeroRolando({ valor, formatar, className }: { valor: number; formatar: (v: number) => string; className?: string }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, formatar);
  useEffect(() => {
    if (reduzMovimento()) {
      mv.set(valor);
      return;
    }
    const c = animate(mv, valor, { type: "spring", bounce: 0, visualDuration: 0.45 });
    return () => c.stop();
  }, [valor, mv]);
  return <motion.span className={className}>{texto}</motion.span>;
}

const MOLA_FATIA = { type: "spring", bounce: 0.25, visualDuration: 0.35 } as const;

/**
 * Pizza em rosca no estilo "Revenue Mix" (evilcharts): fatias com folga entre si e pontas arredondadas, cada
 * uma em degradê da própria cor; no meio, um círculo tracejado com o total; legenda ao lado. As fatias se
 * desenham ao entrar. Passar o mouse (ou focar) numa fatia ou na legenda engrossa a fatia, apaga as outras e o
 * centro rola até o valor dela; clicar fixa a escolha (clicar de novo solta).
 */
export function GraficoPizza({
  titulo,
  fatias,
  formatarValor,
  rotuloTotal,
  tamanho = 200,
}: {
  titulo: string;
  fatias: { chave: string; rotulo: string; valor: number; cor: string; corClara?: string; detalhe?: string }[];
  formatarValor: (v: number) => string;
  /** Texto sob o total, no centro (ex.: "retido no mês"). */
  rotuloTotal: string;
  tamanho?: number;
}) {
  const id = useId().replace(/:/g, "");
  const [sobre, setSobre] = useState<number | null>(null);
  const [fixa, setFixa] = useState<number | null>(null);
  const ativa = sobre ?? fixa;
  const total = fatias.reduce((t, f) => t + Math.max(0, f.valor), 0);
  const chaveDados = fatias.map((f) => f.valor).join("|");

  // Geometria: as fatias são arcos traçados no raio do meio, com a espessura do anel e pontas redondas.
  const c = tamanho / 2;
  const rExt = c * 0.92;
  const rInt = c * 0.62;
  const espessura = rExt - rInt;
  const rMeio = (rExt + rInt) / 2;
  const folgaPx = 5;
  const corte = (espessura / 2 + folgaPx / 2) / rMeio; // ângulo que cada ponta "come" (tampa redonda + folga)
  const ponto = (a: number) => [c + rMeio * Math.sin(a), c - rMeio * Math.cos(a)] as const;
  const angulos = fatias.map((f) => (total ? (Math.max(0, f.valor) / total) * Math.PI * 2 : 0));
  const arcos = fatias.map((f, i) => {
    const angulo = angulos[i];
    const a0 = angulos.slice(0, i).reduce((t, v) => t + v, 0);
    const inicio = a0 + corte;
    const fim = a0 + angulo - corte;
    const curta = fim - inicio < 0.02;
    const meio = a0 + angulo / 2;
    const [x0, y0] = ponto(curta ? meio : inicio);
    const [x1, y1] = ponto(curta ? meio + 0.001 : fim);
    const grande = fim - inicio > Math.PI ? 1 : 0;
    return { f, i, angulo, d: `M${x0},${y0} A${rMeio},${rMeio} 0 ${grande} 1 ${x1},${y1}`, x0, y0, x1, y1 };
  });
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  const fmtPct = (v: number) => `${pct(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const foco = ativa !== null ? fatias[ativa] : null;
  const alternar = (i: number) => setFixa((f) => (f === i ? null : i));

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
      <div className="sr-only">
        <table>
          <caption>{titulo}</caption>
          <tbody>
            {fatias.map((f) => (
              <tr key={f.chave}>
                <th scope="row">{f.rotulo}</th>
                <td>{formatarValor(f.valor)}</td>
                <td>{fmtPct(f.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} aria-hidden>
        <svg width={tamanho} height={tamanho} className="block overflow-visible">
          <defs>
            {arcos.map(({ f, x0, y0, x1, y1 }) => (
              <linearGradient key={f.chave} id={`${id}-${f.chave}`} gradientUnits="userSpaceOnUse" x1={x0} y1={y0} x2={x1} y2={y1}>
                <stop offset="0%" stopColor={f.cor} />
                <stop offset="100%" stopColor={f.corClara ?? f.cor} />
              </linearGradient>
            ))}
          </defs>
          {total === 0 && <circle cx={c} cy={c} r={rMeio} fill="none" stroke="var(--tinta-100)" strokeWidth={espessura} />}
          <g key={chaveDados}>
            {total > 0 &&
              arcos.map(({ f, i, angulo, d }) =>
                angulo > 0 ? (
                  <motion.path
                    key={f.chave}
                    d={d}
                    fill="none"
                    stroke={`url(#${id}-${f.chave})`}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0, strokeWidth: espessura }}
                    animate={{
                      pathLength: 1,
                      opacity: ativa !== null && ativa !== i ? 0.32 : 1,
                      strokeWidth: ativa === i ? espessura + 7 : espessura,
                    }}
                    transition={{
                      pathLength: { duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.1 + i * 0.12 },
                      opacity: { duration: 0.2 },
                      strokeWidth: MOLA_FATIA,
                    }}
                    onPointerEnter={() => setSobre(i)}
                    onPointerLeave={() => setSobre(null)}
                    onClick={() => alternar(i)}
                    style={{ cursor: "pointer" }}
                  />
                ) : null,
              )}
          </g>
        </svg>
        {/* Centro: círculo tracejado com o total (ou o valor da fatia escolhida), rolando até o número. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="grid aspect-square w-[54%] place-items-center rounded-full border border-dashed border-tinta-300 text-center">
            <div className="max-w-[88%]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">{foco ? foco.rotulo : "Total"}</div>
              <NumeroRolando valor={foco ? foco.valor : total} formatar={formatarValor} className="mt-0.5 block text-[15px] font-semibold leading-tight tracking-tight text-foreground tabular-nums sm:text-base" />
              <div className="mt-0.5 text-[10px] text-foreground-muted">{foco ? `${fmtPct(foco.valor)} do total` : rotuloTotal}</div>
            </div>
          </div>
        </div>
      </div>

      <ul className="w-full min-w-0 sm:max-w-[21rem] sm:flex-1">
        {fatias.map((f, i) => (
          <li key={f.chave}>
            <button
              type="button"
              onPointerEnter={() => setSobre(i)}
              onPointerLeave={() => setSobre(null)}
              onFocus={() => setSobre(i)}
              onBlur={() => setSobre(null)}
              onClick={() => alternar(i)}
              aria-pressed={fixa === i}
              aria-label={`${f.rotulo}: ${formatarValor(f.valor)}, ${fmtPct(f.valor)} do total`}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-[opacity,background-color] duration-200 hover:bg-tinta-50 focus-visible:shadow-[var(--anel-foco)] sm:py-2.5",
                ativa !== null && ativa !== i && "opacity-40",
              )}
            >
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: `linear-gradient(135deg, ${f.cor}, ${f.corClara ?? f.cor})` }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-foreground-secondary">{f.rotulo}</span>
                {f.detalhe && <span className="block text-xs leading-snug text-foreground-muted">{f.detalhe}</span>}
              </span>
              <span className="ml-auto shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums text-foreground">{formatarValor(f.valor)}</span>
                <span className="block text-xs tabular-nums text-foreground-muted">{fmtPct(f.valor)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
