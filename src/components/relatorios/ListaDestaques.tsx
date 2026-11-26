import type { LinhaRanking } from "@/api/types";
import { Barra } from "@/components/ui/animado";
import { formatarMoeda, formatarMoedaCurta, formatarPercentualCurto, iniciais } from "@/lib/format";

/**
 * Os maiores do período (prestadores ou clientes) em lista: iniciais, nome, notas e pendente, a fatia do
 * faturamento do período numa barra e o valor das notas. A tabela completa fica mais abaixo na tela.
 */
export function ListaDestaques({ linhas, totalNf, limite = 6, vazio }: { linhas: LinhaRanking[]; totalNf: number; limite?: number; vazio: string }) {
  if (!linhas.length) return <p className="text-sm text-foreground-muted">{vazio}</p>;
  return (
    <ul className="space-y-2">
      {linhas.slice(0, limite).map((l, i) => {
        const fatia = totalNf ? (l.valorNf / totalNf) * 100 : 0;
        return (
          <li key={l.id} className="flex items-center gap-3 rounded-xl border border-borda bg-[#f8fafd] px-3 py-2.5">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full border border-borda bg-areia-card text-xs font-semibold text-[var(--marca)]">
              {iniciais(l.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{l.nome}</div>
              <div className="truncate text-xs text-foreground-muted">
                {l.quantidade} {l.quantidade === 1 ? "nota" : "notas"}
                {l.repassePendente > 0 && <> · {formatarMoedaCurta(l.repassePendente)} pendente</>}
              </div>
            </div>
            <div className="hidden w-28 shrink-0 sm:block">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#e4eaf3]">
                <Barra pct={fatia} atraso={i * 0.05} className="h-full rounded-full bg-[var(--marca)]" />
              </div>
              <div className="mt-1 text-right text-[11px] tabular-nums text-foreground-muted">{formatarPercentualCurto(fatia)} do total</div>
            </div>
            <div className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground" title={formatarMoeda(l.valorNf)}>
              {formatarMoedaCurta(l.valorNf)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
