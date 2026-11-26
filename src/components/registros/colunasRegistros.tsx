import type { OpcaoApi, Registro } from "@/api/types";
import { BadgeSituacao } from "@/components/registros/BadgeSituacao";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { formatarData, formatarMoeda } from "@/lib/format";
import { SITUACAO_REGISTRO_LABEL, TIPO_PAGAMENTO_LABEL } from "@/lib/labels";
import { competenciaCurta } from "@/lib/repasse";
import type { Coluna } from "@/lib/tabela";

const paraMapa = (opcoes: OpcaoApi[] | null) => Object.fromEntries((opcoes ?? []).map((o) => [o.valor, o.rotulo]));

/** Colunas dos registros. Cliente/prestador/empresa: a coluna ordena pelo nome; o filtro é pelo id (soFiltro). */
export function colunasRegistros(
  opcoes: { clientes: OpcaoApi[] | null; prestadores: OpcaoApi[] | null; empresas: OpcaoApi[] | null },
  controle?: ControleAcoes<Registro>,
): Coluna<Registro>[] {
  return [
    { chave: "competencia", titulo: "Competência", filtro: { tipo: "data" }, ordemInicial: "desc", render: (r) => competenciaCurta(r.competencia), className: "whitespace-nowrap tabular-nums" },
    {
      chave: "cliente", titulo: "Cliente / prestador",
      render: (r) => (
        <div className="min-w-0 max-w-72">
          <div className="truncate font-medium">{r.cliente.razaoSocial}</div>
          <div className="truncate text-xs text-foreground-muted">{r.prestador.nomeCompleto}</div>
        </div>
      ),
    },
    { chave: "prestador", titulo: "Prestador", render: (r) => r.prestador.nomeCompleto, className: "hidden 2xl:table-cell max-w-48 truncate" },
    { chave: "empresaContabil", titulo: "Empresa contábil", render: (r) => r.empresaContabil.nome, className: "hidden xl:table-cell max-w-48 truncate text-foreground-secondary" },
    { chave: "clienteId", titulo: "Cliente", filtro: { tipo: "opcoes", opcoes: paraMapa(opcoes.clientes) }, soFiltro: true },
    { chave: "prestadorId", titulo: "Prestador", filtro: { tipo: "opcoes", opcoes: paraMapa(opcoes.prestadores) }, soFiltro: true },
    { chave: "empresaContabilId", titulo: "Empresa contábil", filtro: { tipo: "opcoes", opcoes: paraMapa(opcoes.empresas) }, soFiltro: true },
    { chave: "numeroNfs", titulo: "NFS", filtro: { tipo: "texto", rotulo: "Número da NFS" }, render: (r) => r.numeroNfs ?? "—", className: "hidden md:table-cell tabular-nums text-foreground-secondary" },
    { chave: "setor", titulo: "Setor", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "valorNf", titulo: "Valor NF", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (r) => formatarMoeda(r.valorNf), className: "hidden sm:table-cell tabular-nums whitespace-nowrap" },
    { chave: "valorFinalRepasse", titulo: "Repasse", filtro: { tipo: "moeda" }, alinhar: "direita", ordemInicial: "desc", render: (r) => formatarMoeda(r.valorFinalRepasse), className: "tabular-nums whitespace-nowrap font-medium" },
    { chave: "situacao", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: SITUACAO_REGISTRO_LABEL }, render: (r) => <BadgeSituacao situacao={r.situacao} /> },
    { chave: "dataPagamento", titulo: "Pago em", filtro: { tipo: "data" }, ordemInicial: "desc", render: (r) => formatarData(r.dataPagamento), className: "hidden lg:table-cell whitespace-nowrap tabular-nums text-foreground-secondary" },
    { chave: "tipoPagamento", titulo: "Forma de pagamento", filtro: { tipo: "opcoes", opcoes: TIPO_PAGAMENTO_LABEL }, soFiltro: true },
    { chave: "criadoEm", titulo: "Lançado em", filtro: { tipo: "data" }, ordemInicial: "desc", soFiltro: true },
    ...(controle ? [{ chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita" as const, render: (r: Registro) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={r} comRotulo={false} /></div> }] : []),
  ];
}
