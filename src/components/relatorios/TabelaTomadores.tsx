import { useMemo } from "react";
import type { LinhaTomador } from "@/api/types";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { useTabela } from "@/hooks/useTabela";
import { formatarDocumento, formatarMoeda } from "@/lib/format";
import type { Coluna } from "@/lib/tabela";

const chave = (l: LinhaTomador) => l.id;

/**
 * Retenções por tomador (cliente/hospital) no período: o que cada um reteve de ISS, IRRF e CSRF sobre as notas,
 * para conferir com os informes de retenção. Lista local (já vem inteira no relatório).
 */
export function TabelaTomadores({ linhas }: { linhas: LinhaTomador[] }) {
  const colunas = useMemo<Coluna<LinhaTomador>[]>(
    () => [
      {
        chave: "nome",
        titulo: "Tomador",
        filtro: { tipo: "texto" },
        render: (l) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{l.nome}</div>
            <div className="text-xs text-foreground-muted tabular-nums">{formatarDocumento(l.documento)}</div>
          </div>
        ),
      },
      { chave: "quantidade", titulo: "Notas", filtro: { tipo: "numero" }, alinhar: "direita", ordemInicial: "desc", className: "tabular-nums hidden xl:table-cell" },
      { chave: "valorNf", titulo: "Valor das notas", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.valorNf), className: "tabular-nums" },
      { chave: "iss", titulo: "ISS", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.iss), className: "tabular-nums hidden md:table-cell" },
      { chave: "ir", titulo: "IRRF", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.ir), className: "tabular-nums hidden md:table-cell" },
      { chave: "csrf", titulo: "CSRF", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.csrf), className: "tabular-nums hidden md:table-cell" },
      { chave: "tributos", titulo: "Total retido", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (l) => formatarMoeda(l.tributos), className: "tabular-nums font-semibold" },
    ],
    [],
  );
  const tabela = useTabela(linhas, colunas, { ordemPadrao: "-valorNf", porPagina: 10 });
  return (
    <>
      <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar tomador…" className="border-b border-borda pb-4" />
      <TabelaDados
        tabela={tabela}
        colunas={colunas}
        chaveLinha={chave}
        vazio="Nenhuma nota no período."
        renderCelular={(l) => (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 font-medium">{l.nome}</div>
              <div className="shrink-0 font-semibold tabular-nums">{formatarMoeda(l.tributos)}</div>
            </div>
            <div className="text-xs text-foreground-muted tabular-nums">
              NF {formatarMoeda(l.valorNf)} · ISS {formatarMoeda(l.iss)} · IRRF {formatarMoeda(l.ir)} · CSRF {formatarMoeda(l.csrf)}
            </div>
          </div>
        )}
      />
    </>
  );
}
