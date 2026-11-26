import { useRef, useState } from "react";
import { gsap, useGSAP, reduzMovimento } from "@/lib/gsap";
import { Barra } from "@/components/ui/animado";
import { CHART_COLORS } from "@/components/charts-cores";

const INK_PRIMARY = "#0b1b36";
const INK_SECONDARY = "#364560";
const INK_MUTED = "#56647d";
const GRID = "#e3e9f2";
const SURFACE = "#ffffff";

type Serie = { key: string; label: string; color: string; data: number[] };

/**
 * Os gráficos são SVG desenhados à mão: para leitores de tela, o desenho fica oculto e os mesmos números
 * vão numa tabela visualmente escondida (WCAG: alternativa em texto para gráficos).
 */
function TabelaDoGrafico({ categorias, series, formatarValor }: { categorias: string[]; series: { label: string; data: number[] }[]; formatarValor: (v: number) => string }) {
  // sr-only num div: uma tabela não encolhe abaixo do conteúdo e alargaria a página no celular.
  return (
    <div className="sr-only">
    <table>
      <thead>
        <tr>
          <th scope="col">Período</th>
          {series.map((s) => (
            <th key={s.label} scope="col">{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categorias.map((categoria, i) => (
          <tr key={categoria + i}>
            <th scope="row">{categoria}</th>
            {series.map((s) => (
              <td key={s.label}>{formatarValor(s.data[i] ?? 0)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function BarChart({
  categorias,
  series,
  altura = 160,
  formatarValor = (v: number) => String(v),
  empilhado = false,
}: {
  categorias: string[];
  series: Serie[];
  altura?: number;
  formatarValor?: (v: number) => string;
  /** uma barra por categoria com as séries empilhadas, em vez de lado a lado */
  empilhado?: boolean;
}) {
  const [hover, setHover] = useState<{ cat: number } | null>(null);
  const max = Math.max(1, ...(empilhado ? categorias.map((_, i) => series.reduce((t, s) => t + (s.data[i] ?? 0), 0)) : series.flatMap((s) => s.data)));
  const larguraCat = 100 / categorias.length;
  const barW = series.length === 1 || empilhado ? Math.min(28, larguraCat * 0.55) : Math.min(14, larguraCat * 0.22);
  const gap = series.length === 1 ? 0 : 3;
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!svgRef.current || reduzMovimento()) return;
      gsap.from(svgRef.current.querySelectorAll("[data-barra]"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, stagger: 0.025 });
    },
    { dependencies: [JSON.stringify(series.map((s) => s.data))], revertOnUpdate: true }
  );

  return (
    <div>
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-foreground-secondary">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <TabelaDoGrafico categorias={categorias} series={series} formatarValor={formatarValor} />
      <div className="relative" style={{ height: altura }} aria-hidden>
        <svg ref={svgRef} viewBox={`0 0 100 ${altura}`} preserveAspectRatio="none" width="100%" height={altura} className="overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={0} x2={100} y1={altura - 20 - f * (altura - 32)} y2={altura - 20 - f * (altura - 32)} stroke={GRID} strokeWidth={0.5} />
          ))}
          {categorias.map((_, ci) => {
            const centroX = ci * larguraCat + larguraCat / 2;
            const totalW = empilhado ? barW : series.length * barW + (series.length - 1) * gap;
            const startX = centroX - totalW / 2;
            let base = altura - 20;
            return (
              <g key={ci} onMouseEnter={() => setHover({ cat: ci })} onMouseLeave={() => setHover(null)}>
                <rect x={ci * larguraCat} y={0} width={larguraCat} height={altura} fill="transparent" />
                {series.map((s, si) => {
                  const v = s.data[ci] ?? 0;
                  const h = (v / max) * (altura - 32);
                  const x = empilhado ? startX : startX + si * (barW + gap);
                  if (empilhado && v === 0) return null;
                  const y = empilhado ? base - h : altura - 20 - h;
                  if (empilhado) base = y;
                  const ativo = hover?.cat === ci;
                  return (
                    <rect
                      data-barra
                      key={s.key}
                      x={x}
                      y={h === 0 ? y - 1.5 : y}
                      width={barW}
                      height={h === 0 ? 1.5 : h}
                      rx={2.5}
                      fill={s.color}
                      opacity={hover && !ativo ? 0.45 : 1}
                      style={{ transition: "opacity 200ms var(--ease-suave)" }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="absolute left-0 right-0 bottom-0 flex text-[10px] text-foreground-muted" style={{ height: 18 }}>
          {categorias.map((c, i) => (
            <div key={i} className="text-center" style={{ width: `${larguraCat}%` }}>
              {c}
            </div>
          ))}
        </div>
        {hover && (
          <div
            className="absolute -top-2 -translate-y-full rounded-md border border-borda bg-[var(--areia-card)] shadow-md px-2.5 py-1.5 text-xs pointer-events-none z-10"
            style={{ left: `${hover.cat * larguraCat + larguraCat / 2}%`, transform: "translate(-50%, -100%)" }}
          >
            <div className="font-medium text-foreground mb-0.5">{categorias[hover.cat]}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="inline-block w-2 h-0.5 rounded-full" style={{ background: s.color }} />
                <span className="font-semibold text-foreground">{formatarValor(s.data[hover.cat] ?? 0)}</span> {s.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LineChart({
  categorias,
  data,
  color = CHART_COLORS.blue,
  altura = 140,
  formatarValor = (v: number) => `${v}%`,
  maxFixo,
}: {
  categorias: string[];
  data: number[];
  color?: string;
  altura?: number;
  formatarValor?: (v: number) => string;
  maxFixo?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = maxFixo ?? Math.max(1, ...data);
  const plotH = altura - 32;
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;

  const pontos = data.map((v, i) => ({
    x: data.length > 1 ? i * stepX : 50,
    y: plotH - (v / max) * plotH,
  }));
  const path = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!svgRef.current || reduzMovimento()) return;
      gsap.fromTo(svgRef.current, { clipPath: "inset(-10% 100% -10% -10%)" }, { clipPath: "inset(-10% -10% -10% -10%)", duration: 1.2, clearProps: "clipPath" });
    },
    { dependencies: [path], revertOnUpdate: true }
  );

  return (
    <>
    <TabelaDoGrafico categorias={categorias} series={[{ label: "Valor", data }]} formatarValor={formatarValor} />
    <div className="relative" style={{ height: altura }} aria-hidden>
      <svg ref={svgRef} viewBox={`0 0 100 ${altura}`} preserveAspectRatio="none" width="100%" height={altura} className="overflow-visible">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={0} x2={100} y1={plotH - f * plotH} y2={plotH - f * plotH} stroke={GRID} strokeWidth={0.5} />
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={8} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={hover === i ? 3.2 : 2.2} fill={color} stroke={SURFACE} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
      <div className="absolute left-0 right-0 bottom-0 flex text-[10px] text-foreground-muted" style={{ height: 18, top: altura - 16 }}>
        {categorias.map((c, i) => (
          <div key={i} className="text-center flex-1">
            {c}
          </div>
        ))}
      </div>
      {hover !== null && (
        <div
          className="absolute rounded-md border border-borda bg-[var(--areia-card)] shadow-md px-2.5 py-1.5 text-xs pointer-events-none z-10"
          style={{ left: `${pontos[hover].x}%`, top: pontos[hover].y - 8, transform: "translate(-50%, -100%)" }}
        >
          <span className="font-semibold text-foreground">{formatarValor(data[hover])}</span>{" "}
          <span className="text-foreground-muted">{categorias[hover]}</span>
        </div>
      )}
    </div>
    </>
  );
}

export function RankedBars({
  itens,
  corBarra = CHART_COLORS.blue,
  formatarValor = (v: number) => String(v),
}: {
  itens: { label: string; sublabel?: string; valor: number }[];
  corBarra?: string;
  formatarValor?: (v: number) => string;
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="space-y-2.5">
      {itens.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
            <span className="font-medium truncate">{item.label}</span>
            <span className="text-foreground-muted text-xs shrink-0">{formatarValor(item.valor)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--sidebar-hover-bg)] overflow-hidden">
            <Barra pct={(item.valor / max) * 100} atraso={i * 0.04} className="h-full rounded-full" style={{ background: corBarra }} />
          </div>
        </div>
      ))}
      {itens.length === 0 && <p className="text-sm text-foreground-muted">Sem dados no período.</p>}
    </div>
  );
}

export { INK_PRIMARY, INK_SECONDARY, INK_MUTED };
