import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { ContaDetalhe } from "@/api/types";
import { BadgeSituacaoConta } from "@/components/contas/BadgeSituacaoConta";
import { Button } from "@/components/ui/button";
import { confirmar } from "@/components/ui/confirmar";
import { useAcao } from "@/hooks/useAcao";
import { formatarData, formatarMoeda } from "@/lib/format";

/** As parcelas da série (conta recorrente), com a opção de excluir as futuras ainda não pagas. */
export function SerieRecorrente({ conta, onMudou }: { conta: ContaDetalhe; onMudou: () => void }) {
  const { pendente, executar } = useAcao("Não foi possível excluir as parcelas.");
  if (!conta.serie.length) return null;

  async function excluirFuturas() {
    const ok = await confirmar({ titulo: "Excluir as parcelas futuras desta série?", descricao: "Saem as parcelas com vencimento a partir de amanhã que ainda não foram pagas. As pagas e as já vencidas ficam.", acao: "Excluir parcelas" });
    if (!ok) return;
    await executar(async () => {
      const { excluidas } = await api.delete<{ excluidas: number }>(`/contas/${conta.id}/serie-futura`);
      toast.success(`${excluidas} ${excluidas === 1 ? "parcela excluída" : "parcelas excluídas"}.`);
      onMudou();
    });
  }

  return (
    <section className="card w-full p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-titulo text-[15px] font-semibold">Parcelas desta série</h2>
          <p className="text-xs text-foreground-muted">{conta.serie.length} parcelas mensais. Editar esta tela muda só esta parcela.</p>
        </div>
        <Button variant="danger-ghost" size="sm" disabled={pendente} onClick={() => void excluirFuturas()}>{pendente ? "Aguarde..." : "Excluir parcelas futuras"}</Button>
      </div>
      <ul className="mt-3 divide-y divide-borda">
        {conta.serie.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <Link to={`/contas/${p.id}`} replace className={p.id === conta.id ? "font-semibold" : "text-marca hover:underline"} aria-current={p.id === conta.id ? "page" : undefined}>
              {formatarData(p.dataVencimento)}
            </Link>
            <span className="ml-auto tabular-nums">{formatarMoeda(p.valor)}</span>
            <BadgeSituacaoConta status={p.status} dataVencimento={p.dataVencimento} />
          </li>
        ))}
      </ul>
    </section>
  );
}
