import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";
import { gsap, reduzMovimento, useGSAP } from "@/lib/gsap";
import { Barra } from "@/components/ui/animado";
import { cn } from "@/lib/cn";
import { caminhoFatia, caminhoSuave, marcasEixo } from "@/lib/graficos";

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

/**
 * Áreas sobrepostas com degradê (a primeira série fica atrás). Para valores de mesma unidade ao longo dos meses:
 * a cruz vertical acha o mês mais próximo do ponteiro e a dica mostra todas as séries daquele mês.
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
  const svgRef = useRef<SVGSVGElement>(null);
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
  const caminhos = series.map((s) => {
    const linha = caminhoSuave(s.dados.map((v, i) => ({ x: x(i), y: y(v) })));
    return { s, linha, area: n ? `${linha} L${x(n - 1)},${base} L${x(0)},${base} Z` : "" };
  });

  useGSAP(
    () => {
      if (!svgRef.current || reduzMovimento() || !largura) return;
      gsap.fromTo(svgRef.current.querySelector("[data-desenho]"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power2.out", clearProps: "clipPath" });
    },
    { dependencies: [JSON.stringify(series.map((s) => s.dados)), largura > 0], revertOnUpdate: true },
  );

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
            ref={svgRef}
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
            <g data-desenho>
              {caminhos.map(({ s, area }) => <path key={`a-${s.chave}`} d={area} fill={`url(#${id}-${s.chave})`} />)}
              {caminhos.map(({ s, linha }) => (
                <path key={`l-${s.chave}`} d={linha} fill="none" stroke={s.cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ))}
            </g>
            {ativo !== null && (
              <g pointerEvents="none">
                <line x1={x(ativo)} x2={x(ativo)} y1={MARGEM.topo} y2={base} stroke="#9fb0c9" strokeWidth={1} shapeRendering="crispEdges" />
                {series.map((s) => (
                  <circle key={s.chave} cx={x(ativo)} cy={y(s.dados[ativo] ?? 0)} r={4.5} fill={s.cor} stroke={SUPERFICIE} strokeWidth={2} />
                ))}
              </g>
            )}
            <RotulosX categorias={categorias} x={x} altura={altura} largura={largura} />
          </svg>
        )}
        {ativo !== null && largura > 0 && (
          <Dica
            titulo={categorias[ativo]}
            x={x(ativo)}
            largura={largura}
            linhas={series.map((s) => ({ rotulo: s.rotulo, cor: s.cor, valor: formatarValor(s.dados[ativo] ?? 0) }))}
          />
        )}
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

/**
 * Pizza em rosca (parte de um todo, até ~5 fatias): total no centro, legenda ao lado com valor e fatia.
 * Passar o mouse (ou focar com o teclado) numa fatia ou na legenda destaca a fatia — ela sai um pouco do
 * círculo e o centro mostra o valor dela. Entra girando até fechar a volta. 2px de folga branca entre fatias.
 */
export function GraficoPizza({
  titulo,
  fatias,
  formatarValor,
  rotuloTotal,
  tamanho = 200,
}: {
  titulo: string;
  fatias: { chave: string; rotulo: string; valor: number; cor: string; detalhe?: string }[];
  formatarValor: (v: number) => string;
  /** Texto sob o total, no centro (ex.: "retido no mês"). */
  rotuloTotal: string;
  tamanho?: number;
}) {
  const [ativa, setAtiva] = useState<number | null>(null);
  const [progresso, setProgresso] = useState(() => (reduzMovimento() ? 1 : 0));
  const total = fatias.reduce((t, f) => t + Math.max(0, f.valor), 0);
  const chaveDados = fatias.map((f) => f.valor).join("|");

  useGSAP(
    () => {
      if (reduzMovimento()) return setProgresso(1);
      const estado = { p: 0 };
      gsap.to(estado, { p: 1, duration: 1.1, ease: "power3.out", onUpdate: () => setProgresso(estado.p) });
    },
    { dependencies: [chaveDados] },
  );

  const c = tamanho / 2;
  const rExt = c - 8;
  const rInt = rExt * 0.62;
  const angulos = fatias.map((f) => (total ? (Math.max(0, f.valor) / total) * Math.PI * 2 * progresso : 0));
  const arcos = fatias.map((f, i) => {
    const angulo = angulos[i];
    const a0 = angulos.slice(0, i).reduce((t, x) => t + x, 0);
    const meio = a0 + angulo / 2;
    const destaque = ativa === i ? 6 : 0;
    return { f, i, a0, a1: a0 + angulo, dx: Math.sin(meio) * destaque, dy: -Math.cos(meio) * destaque };
  });
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  const fmtPct = (v: number) => `${pct(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const foco = ativa !== null ? fatias[ativa] : null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
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
          <circle cx={c} cy={c} r={(rExt + rInt) / 2} fill="none" stroke="var(--tinta-100)" strokeWidth={rExt - rInt} />
          {total > 0 &&
            arcos.map(({ f, i, a0, a1, dx, dy }) =>
              a1 - a0 > 0.0005 ? (
                <path
                  key={f.chave}
                  d={caminhoFatia(c, c, rExt, rInt, a0, a1)}
                  fill={f.cor}
                  stroke={SUPERFICIE}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  onPointerEnter={() => setAtiva(i)}
                  onPointerLeave={() => setAtiva(null)}
                  style={{
                    transform: `translate(${dx}px, ${dy}px)`,
                    opacity: ativa !== null && ativa !== i ? 0.4 : 1,
                    transition: "transform 280ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
                    cursor: "pointer",
                  }}
                />
              ) : null,
            )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div className="max-w-[60%]">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted">{foco ? foco.rotulo : "Total"}</div>
            <div className="mt-0.5 text-lg font-semibold leading-tight tracking-tight text-foreground">{formatarValor(foco ? foco.valor : total)}</div>
            <div className="mt-0.5 text-[11px] text-foreground-muted">{foco ? `${fmtPct(foco.valor)} do total` : rotuloTotal}</div>
          </div>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {fatias.map((f, i) => (
          <li key={f.chave}>
            <button
              type="button"
              onPointerEnter={() => setAtiva(i)}
              onPointerLeave={() => setAtiva(null)}
              onFocus={() => setAtiva(i)}
              onBlur={() => setAtiva(null)}
              aria-label={`${f.rotulo}: ${formatarValor(f.valor)}, ${fmtPct(f.valor)} do total`}
              className={cn(
                "linha-hover flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none focus-visible:shadow-[var(--anel-foco)]",
                ativa === i && "bg-azul-50/80",
              )}
            >
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: f.cor }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{f.rotulo}</span>
                {f.detalhe && <span className="block truncate text-xs text-foreground-muted">{f.detalhe}</span>}
              </span>
              <span className="shrink-0 text-right">
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
