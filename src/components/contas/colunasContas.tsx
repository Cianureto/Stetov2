import { Repeat } from "lucide-react";
import type { Categoria, Conta } from "@/api/types";
import { BadgeSituacaoConta } from "@/components/contas/BadgeSituacaoConta";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { formatarData, formatarMoeda } from "@/lib/format";
import type { Coluna } from "@/lib/tabela";
import { cn } from "@/lib/cn";

export function colunasContas(categorias: Categoria[] | null, controle?: ControleAcoes<Conta>): Coluna<Conta>[] {
  const opcoesCategoria = Object.fromEntries((categorias ?? []).map((c) => [c.id, c.nome]));
  return [
    { chave: "dataVencimento", titulo: "Vencimento", filtro: { tipo: "data" }, render: (c) => formatarData(c.dataVencimento), className: "whitespace-nowrap tabular-nums" },
    {
      chave: "descricao", titulo: "Descrição", filtro: { tipo: "texto" },
      render: (c) => (
        <div className="min-w-0 max-w-80">
          <div className="flex items-center gap-1.5 truncate font-medium">
            {c.recorrente && <Repeat className="size-3.5 shrink-0 text-foreground-muted" aria-label="Recorrente" />}
            <span className="truncate">{c.descricao}</span>
          </div>
          <div className="truncate text-xs text-foreground-muted">{[c.categoria?.nome, c.subcategoria?.nome].filter(Boolean).join(" · ") || "Sem categoria"}</div>
        </div>
      ),
    },
    { chave: "tipo", titulo: "Tipo", filtro: { tipo: "opcoes", opcoes: { pagar: "A pagar", receber: "A receber" } }, render: (c) => (c.tipo === "pagar" ? "A pagar" : "A receber"), className: "hidden md:table-cell" },
    { chave: "categoria", titulo: "Categoria", render: (c) => c.categoria?.nome ?? "—", className: "hidden 2xl:table-cell" },
    { chave: "categoriaId", titulo: "Categoria", filtro: { tipo: "opcoes", opcoes: opcoesCategoria }, soFiltro: true },
    { chave: "observacao", titulo: "Observação", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "recorrente", titulo: "Recorrente", filtro: { tipo: "booleano" }, soFiltro: true },
    { chave: "bancoPagamento", titulo: "Banco do pagamento", filtro: { tipo: "texto" }, soFiltro: true },
    {
      chave: "valor", titulo: "Valor", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc",
      render: (c) => <span className={cn("font-medium tabular-nums", c.tipo === "receber" ? "text-[var(--sucesso)]" : "text-foreground")}>{c.tipo === "receber" ? "+ " : "− "}{formatarMoeda(c.valor)}</span>,
      className: "whitespace-nowrap",
    },
    { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: { pendente: "Pendente", pago: "Paga" } }, render: (c) => <BadgeSituacaoConta status={c.status} dataVencimento={c.dataVencimento} /> },
    { chave: "dataPagamento", titulo: "Paga em", filtro: { tipo: "data" }, ordemInicial: "desc", render: (c) => formatarData(c.dataPagamento), className: "hidden lg:table-cell whitespace-nowrap tabular-nums text-foreground-secondary" },
    ...(controle ? [{ chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita" as const, render: (c: Conta) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={c} comRotulo={false} /></div> }] : []),
  ];
}
