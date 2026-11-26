import { useMemo } from "react";
import type { LinhaRanking } from "@/api/types";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { useTabela } from "@/hooks/useTabela";
import { formatarMoeda } from "@/lib/format";
import type { Coluna } from "@/lib/tabela";

const chave = (l: LinhaRanking) => l.id;

/**
 * Ranking de clientes ou prestadores por repasse (lista curta e limitada que a tela já tem inteira: tabela local,
 * como os rankings de Relatórios do ConectaPRO).
 */
export function TabelaRanking({ titulo, rotuloNome, linhas, vazio, onLinha }: { titulo: string; rotuloNome: string; linhas: LinhaRanking[]; vazio: string; onLinha?: (l: LinhaRanking) => void }) {
  const colunas = useMemo<Coluna<LinhaRanking>[]>(
    () => [
      { chave: "nome", titulo: rotuloNome, filtro: { tipo: "texto" }, className: "font-medium" },
      { chave: "quantidade", titulo: "Notas", filtro: { tipo: "numero" }, alinhar: "direita", ordemInicial: "desc", className: "tabular-nums hidden sm:table-cell" },
      { chave: "repasse", titulo: "Repasse", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.repasse), className: "tabular-nums" },
      { chave: "repassePago", titulo: "Pago", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.repassePago), className: "tabular-nums hidden md:table-cell" },
      { chave: "repassePendente", titulo: "Pendente", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.repassePendente), className: "tabular-nums hidden md:table-cell text-[var(--aviso)]" },
    ],
    [rotuloNome],
  );
  const tabela = useTabela(linhas, colunas, { ordemPadrao: "-repasse", porPagina: 10 });
  return (
    <div className="card overflow-hidden">
      <h2 className="px-4 pt-4 font-titulo text-[15px] font-semibold md:px-5">{titulo}</h2>
      <BarraTabela tabela={tabela} colunas={colunas} placeholder={`Pesquisar ${rotuloNome.toLowerCase()}…`} className="border-b border-borda p-4 md:px-5" />
      <TabelaDados
        tabela={tabela}
        colunas={colunas}
        chaveLinha={chave}
        onLinha={onLinha}
        vazio={vazio}
        renderCelular={(l) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">{l.nome}</div>
              <div className="text-xs text-foreground-muted">{l.quantidade} {l.quantidade === 1 ? "nota" : "notas"} · pendente {formatarMoeda(l.repassePendente)}</div>
            </div>
            <div className="shrink-0 text-right font-medium tabular-nums">{formatarMoeda(l.repasse)}</div>
          </div>
        )}
      />
    </div>
  );
}
