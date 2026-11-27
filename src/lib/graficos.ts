// Contas dos gráficos e dos períodos do relatório (sem React, testadas à parte).

/** Marcas "redondas" do eixo Y de 0 até cobrir `max` (passos de 1, 2, 2,5 ou 5 × 10ⁿ). */
export function marcasEixo(max: number, quantas = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const bruto = max / quantas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? bruto;
  const topo = Math.ceil(max / passo - 1e-9) * passo;
  return Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo);
}

/** Curva suave que não passa do valor dos pontos (interpolação monótona, como a curveMonotoneX do d3). */
export function caminhoSuave(p: { x: number; y: number }[]): string {
  const n = p.length;
  if (n === 0) return "";
  if (n === 1) return `M${p[0].x},${p[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1].x - p[i].x || 1e-6;
    m[i] = (p[i + 1].y - p[i].y) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${p[i].x + h},${p[i].y + t[i] * h} ${p[i + 1].x - h},${p[i + 1].y - t[i + 1] * h} ${p[i + 1].x},${p[i + 1].y}`;
  }
  return d;
}

/** "2026-11-01" + 3 → "2027-02-01" (competências, sempre no dia 1º). */
export function somarMeses(iso: string, meses: number): string {
  const [ano, mes] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1 + meses, 1)).toISOString().slice(0, 10);
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesDe = (iso: string) => MESES[Number(iso.slice(5, 7)) - 1];

/** Período de competências por extenso curto: "nov/2026", "jan–nov/2026", "dez/2025–nov/2026". */
export function rotuloPeriodo(de: string, ate: string): string {
  if (de.slice(0, 7) === ate.slice(0, 7)) return `${mesDe(de)}/${de.slice(0, 4)}`;
  if (de.slice(0, 4) === ate.slice(0, 4)) return `${mesDe(de)}–${mesDe(ate)}/${ate.slice(0, 4)}`;
  return `${mesDe(de)}/${de.slice(0, 4)}–${mesDe(ate)}/${ate.slice(0, 4)}`;
}

/** Rótulo do mês no eixo: "nov" quando o período é de um ano só; "nov/26" quando atravessa anos. */
export const rotuloMesEixo = (iso: string, variosAnos: boolean) => (variosAnos ? `${mesDe(iso)}/${iso.slice(2, 4)}` : mesDe(iso));

/**
 * Fatia de pizza/rosca em SVG: ângulos em radianos, 0 no topo, sentido horário. `rInt` 0 = pizza cheia.
 * Uma fatia de volta inteira é desenhada como duas metades (um arco só de 360° não aparece no SVG).
 */
export function caminhoFatia(cx: number, cy: number, rExt: number, rInt: number, a0: number, a1: number): string {
  const volta = Math.PI * 2;
  if (a1 - a0 >= volta - 1e-6) {
    const meio = a0 + Math.PI;
    return `${caminhoFatia(cx, cy, rExt, rInt, a0, meio)} ${caminhoFatia(cx, cy, rExt, rInt, meio, a0 + volta)}`;
  }
  const ponto = (r: number, a: number) => `${(cx + r * Math.sin(a)).toFixed(3)},${(cy - r * Math.cos(a)).toFixed(3)}`;
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  const externo = `M${ponto(rExt, a0)} A${rExt},${rExt} 0 ${grande} 1 ${ponto(rExt, a1)}`;
  if (rInt <= 0) return `${externo} L${cx},${cy} Z`;
  return `${externo} L${ponto(rInt, a1)} A${rInt},${rInt} 0 ${grande} 0 ${ponto(rInt, a0)} Z`;
}
