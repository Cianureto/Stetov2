import type { Cliente } from "@/api/types";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { formatarDocumento, formatarPercentual } from "@/lib/format";
import { REGIME_LABEL, STATUS_CLIENTE_LABEL, TIPO_PESSOA_LABEL } from "@/lib/labels";
import type { Coluna } from "@/lib/tabela";
import { BadgeStatusCliente } from "@/components/clientes/BadgeStatusCliente";

/** Colunas da tabela de clientes. A `chave` é o campo da rota (CAMPOS_CLIENTES em api/rotas/clientes.ts). */
export function colunasClientes(controle?: ControleAcoes<Cliente>): Coluna<Cliente>[] {
  return [
    {
      chave: "razaoSocial",
      titulo: "Cliente",
      filtro: { tipo: "texto" },
      render: (c) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{c.razaoSocial}</div>
          {c.email && <div className="truncate text-xs text-foreground-muted">{c.email}</div>}
        </div>
      ),
    },
    { chave: "email", titulo: "E-mail", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "documento", titulo: "CNPJ / CPF", filtro: { tipo: "texto" }, render: (c) => formatarDocumento(c.documento), className: "hidden md:table-cell whitespace-nowrap tabular-nums text-foreground-secondary" },
    { chave: "tipoPessoa", titulo: "Tipo", filtro: { tipo: "opcoes", opcoes: TIPO_PESSOA_LABEL }, soFiltro: true },
    {
      chave: "regimeTributario",
      titulo: "Regime",
      filtro: { tipo: "opcoes", opcoes: REGIME_LABEL },
      render: (c) => (c.regimeTributario ? REGIME_LABEL[c.regimeTributario] : <span className="text-[var(--aviso)]">Não informado</span>),
      className: "hidden lg:table-cell whitespace-nowrap",
    },
    { chave: "aliquotaIss", titulo: "ISS", filtro: { tipo: "numero" }, alinhar: "direita", render: (c) => formatarPercentual(c.aliquotaIss), className: "hidden xl:table-cell tabular-nums" },
    { chave: "descontoPadraoPercent", titulo: "Desconto", filtro: { tipo: "numero", rotulo: "Desconto padrão (%)" }, alinhar: "direita", render: (c) => formatarPercentual(c.descontoPadraoPercent), className: "hidden xl:table-cell tabular-nums" },
    { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: STATUS_CLIENTE_LABEL }, render: (c) => <BadgeStatusCliente status={c.status} /> },
    { chave: "criadoEm", titulo: "Cadastrado em", filtro: { tipo: "data" }, ordemInicial: "desc", soFiltro: true },
    ...(controle
      ? [{ chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita" as const, render: (c: Cliente) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={c} /></div> }]
      : []),
  ];
}
