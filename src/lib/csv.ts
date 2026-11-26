/** Planilha CSV no padrão brasileiro (separador ";", vírgula decimal, BOM para o Excel abrir com acentos). */
export function gerarCsv(linhas: Record<string, string | number | null | undefined>[]): string {
  if (!linhas.length) return "";
  const colunas = Object.keys(linhas[0]);
  const celula = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const texto = typeof v === "number" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false }) : v;
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return [colunas.join(";"), ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(";"))].join("\r\n");
}

export function baixarCsv(nomeArquivo: string, linhas: Record<string, string | number | null | undefined>[]) {
  const blob = new Blob(["﻿" + gerarCsv(linhas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
