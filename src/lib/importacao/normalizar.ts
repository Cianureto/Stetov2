// Normalização dos valores lidos de planilhas e XML (datas brasileiras, dinheiro com vírgula, situação…).
import { lerNumeroBR } from "@/lib/format";
import { normalizarBusca } from "@/lib/busca";
import { somenteDigitos } from "@/lib/mascaras";

export const texto = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());

/** Dinheiro ou percentual: número, "1.234,56", "R$ 10", "2,5%". Vazio/ inválido = 0. */
export const numero = (v: unknown) => {
  if (typeof v === "number") return v;
  const n = lerNumeroBR(texto(v));
  return Number.isNaN(n) ? 0 : n;
};

/** Data → AAAA-MM-DD. Aceita AAAA-MM-DD, DD/MM/AAAA, data do Excel. null se inválida. */
export function data(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = texto(v);
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/** Competência → AAAA-MM-01. Aceita MM/AAAA, AAAA-MM, DD/MM/AAAA, AAAA-MM-DD e datas do Excel. */
export function competencia(v: unknown): string | null {
  const d = data(v);
  if (d) return `${d.slice(0, 7)}-01`;
  const s = texto(v);
  let m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}-01`;
  m = /^(\d{4})-(\d{2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]}-01`;
  return null;
}

export const documento = (v: unknown) => somenteDigitos(texto(v));

export function situacaoRegistro(v: unknown): "pendente" | "pago" | "cancelado" {
  const s = normalizarBusca(texto(v));
  if (["pago", "paga", "4", "p", "quitado"].includes(s)) return "pago";
  if (["cancelado", "cancelada", "2", "c"].includes(s)) return "cancelado";
  return "pendente";
}

export function regime(v: unknown): "simples_nacional" | "lucro_presumido" | "lucro_real" | null {
  const s = normalizarBusca(texto(v));
  if (s.includes("simples")) return "simples_nacional";
  if (s.includes("presumido")) return "lucro_presumido";
  if (s.includes("real")) return "lucro_real";
  return null;
}

/** Nome para comparar cadastros: sem acento, minúsculo, espaços simples. */
export const nomeChave = (v: unknown) => normalizarBusca(texto(v)).replace(/\s+/g, " ");
