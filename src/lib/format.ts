// Formatadores compartilhados (pt-BR). Máscaras e validação de campos ficam em lib/mascaras.ts.
import { formatarCnpj, formatarCpf, somenteDigitos } from "@/lib/mascaras";

/** CPF (11 dígitos) ou CNPJ (14) com a máscara; qualquer outra coisa volta como veio. */
export function formatarDocumento(v: string | null | undefined) {
  const d = somenteDigitos(v ?? "");
  if (d.length === 11) return formatarCpf(d);
  if (d.length === 14) return formatarCnpj(d);
  return (v ?? "").trim();
}

/** "2,5" / "2.5" / "2,50%" / "R$ 1.234,56" → número. Vazio → 0. Texto inválido → NaN. */
export function lerNumeroBR(v: string | number | null | undefined): number {
  if (typeof v === "number") return v;
  const s = (v ?? "").replace(/[%\sR$]/g, "").trim();
  if (s === "") return 0;
  const normalizado = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return /^-?\d*\.?\d+$/.test(normalizado) ? Number(normalizado) : Number.NaN;
}

const fmtPercent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
export const formatarPercentual = (v: number) => `${fmtPercent.format(v)}%`;
/** Valor para exibir dentro de um campo ("2,5"), sem o símbolo; zero vira vazio. */
export const percentualParaCampo = (v: number) => (v ? fmtPercent.format(v) : "");

const fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatarMoeda = (v: number) => fmtMoeda.format(v);

/** Moeda abreviada para eixos e cartões: R$ 1,2 mi · R$ 950 mil · R$ 820,00. */
export const formatarMoedaCurta = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (a >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return formatarMoeda(v);
};

/** Variação de `anterior` para `atual`, em %. null quando não há base de comparação (anterior zero). */
export const variacaoPercentual = (atual: number, anterior: number): number | null => (anterior ? ((atual - anterior) / Math.abs(anterior)) * 100 : null);

const fmtUmaCasa = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
/** 12,345 → "12,3%". */
export const formatarPercentualCurto = (v: number) => `${fmtUmaCasa.format(v)}%`;

/** Iniciais do nome para o avatar ("Ana Souza" → "AS"). */
export function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Data (ISO) como o usuário lê: 26/11/2026. */
export const formatarData = (iso: string | null | undefined) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR") : "—");
