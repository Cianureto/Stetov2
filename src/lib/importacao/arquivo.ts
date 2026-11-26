// Leitura de CSV (papaparse, separador detectado) e Excel (read-excel-file): linhas como objetos pelo cabeçalho.
import Papa from "papaparse";

export type Planilha = { colunas: string[]; linhas: Record<string, unknown>[] };

/** Cabeçalho na primeira linha não vazia; colunas sem nome viram "Coluna N"; linhas vazias saem. */
export function deMatriz(matriz: unknown[][]): Planilha {
  const inicio = matriz.findIndex((l) => l.some((c) => String(c ?? "").trim() !== ""));
  if (inicio < 0) return { colunas: [], linhas: [] };
  const colunas = matriz[inicio].map((c, i) => String(c ?? "").trim() || `Coluna ${i + 1}`);
  const linhas = matriz
    .slice(inicio + 1)
    .filter((l) => l.some((c) => String(c ?? "").trim() !== ""))
    .map((l) => Object.fromEntries(colunas.map((c, i) => [c, l[i] ?? ""])));
  return { colunas, linhas };
}

export async function lerPlanilha(arquivo: File): Promise<Planilha> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".xlsx")) {
    const { default: lerXlsx } = await import("read-excel-file/browser");
    const abas = await lerXlsx(arquivo);
    const aba = abas.find((a) => a.data.some((l) => l.some((c) => String(c ?? "").trim() !== "")));
    return deMatriz((aba?.data ?? []) as unknown[][]);
  }
  if (nome.endsWith(".csv") || nome.endsWith(".txt")) {
    const textoArquivo = await arquivo.text();
    const primeira = textoArquivo.split("\n")[0] ?? "";
    const delimiter = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
    const r = Papa.parse<string[]>(textoArquivo, { delimiter, skipEmptyLines: true });
    return deMatriz(r.data);
  }
  throw new Error("Formato não suportado. Use .xlsx ou .csv.");
}
