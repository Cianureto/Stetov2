import { Link } from "react-router-dom";
import { CheckCircle2, Download, TriangleAlert } from "lucide-react";
import type { Importacao } from "@/api/types";
import { Button } from "@/components/ui/button";
import { baixarErros } from "@/lib/importacao/erros";

/** Resumo depois de importar: o que entrou, o que falhou (com as primeiras linhas) e o que foi criado. */
export function ResultadoImportacao({ importacao, onOutra }: { importacao: Importacao; onOutra: () => void }) {
  const ok = importacao.falhadas === 0;
  return (
    <section className="card space-y-4 p-4 sm:p-6" role="status">
      <div className="flex items-start gap-3">
        {ok ? <CheckCircle2 className="size-6 shrink-0 text-[var(--sucesso)]" aria-hidden /> : <TriangleAlert className="size-6 shrink-0 text-[var(--aviso)]" aria-hidden />}
        <div>
          <h2 className="font-titulo text-lg font-semibold">{ok ? "Importação concluída" : importacao.importadas ? "Importação concluída com falhas" : "Nada foi importado"}</h2>
          <p className="text-sm text-foreground-muted">
            {importacao.importadas} de {importacao.totalLinhas} linhas importadas
            {importacao.novosCadastros > 0 && ` · ${importacao.novosCadastros} cadastros provisórios criados (revise em Pendências)`}
            {importacao.falhadas > 0 && ` · ${importacao.falhadas} com erro`}.
          </p>
        </div>
      </div>
      {importacao.erros.length > 0 && (
        <div className="space-y-2">
          <ul className="max-h-64 divide-y divide-borda overflow-y-auto rounded-lg border border-borda text-sm">
            {importacao.erros.slice(0, 100).map((e, i) => (
              <li key={i} className="flex gap-3 px-3 py-1.5"><span className="w-16 shrink-0 tabular-nums text-foreground-muted">Linha {e.linha}</span><span>{e.erro}</span></li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" onClick={() => baixarErros(importacao)}><Download aria-hidden /> Baixar todos os erros (CSV)</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-t border-borda pt-4">
        <Button variant="secondary" onClick={onOutra}>Importar outro arquivo</Button>
        <Button variant="accent" asChild><Link to="/importacao">Ver histórico</Link></Button>
      </div>
    </section>
  );
}
