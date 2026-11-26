import type { Prestador } from "@/api/types";
import { BadgesPrestador } from "@/components/prestadores/BadgesPrestador";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import type { ControleAcoes } from "@/hooks/useAcoesTabela";
import { formatarPercentual } from "@/lib/format";
import { REGIME_LABEL, STATUS_ATIVO_LABEL } from "@/lib/labels";
import { formatarCpf } from "@/lib/mascaras";
import type { Coluna } from "@/lib/tabela";

/** "Hospital A +2" com a lista inteira no title. */
export function resumoClientes(p: Prestador) {
  if (!p.clientes.length) return <span className="text-foreground-muted">Nenhum</span>;
  const nomes = p.clientes.map((c) => c.razaoSocial);
  return (
    <span className="block truncate" title={nomes.join(", ")}>
      {nomes[0]}
      {nomes.length > 1 && <span className="text-foreground-muted"> +{nomes.length - 1}</span>}
    </span>
  );
}

/** Colunas da tabela de prestadores. A `chave` é o campo da rota (CAMPOS_PRESTADORES). */
export function colunasPrestadores(controle?: ControleAcoes<Prestador>): Coluna<Prestador>[] {
  return [
    {
      chave: "nomeCompleto",
      titulo: "Prestador",
      filtro: { tipo: "texto" },
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{p.nomeCompleto}</div>
          <div className="truncate text-xs text-foreground-muted">{p.crm ? `CRM ${p.crm}` : "CRM não informado"}</div>
        </div>
      ),
    },
    { chave: "crm", titulo: "CRM", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "email", titulo: "E-mail", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "cpf", titulo: "CPF", filtro: { tipo: "texto" }, render: (p) => formatarCpf(p.cpf), className: "hidden md:table-cell whitespace-nowrap tabular-nums text-foreground-secondary" },
    { chave: "clientes", titulo: "Atende em", ordenavel: false, render: resumoClientes, className: "hidden lg:table-cell max-w-64" },
    { chave: "banco", titulo: "Banco", filtro: { tipo: "texto" }, render: (p) => p.banco ?? <span className="text-[var(--aviso)]">Não informado</span>, className: "hidden xl:table-cell max-w-48 truncate" },
    { chave: "regimeTributario", titulo: "Regime", filtro: { tipo: "opcoes", opcoes: REGIME_LABEL }, soFiltro: true },
    { chave: "descontoPadraoPercent", titulo: "Desconto", filtro: { tipo: "numero", rotulo: "Desconto padrão (%)" }, alinhar: "direita", render: (p) => formatarPercentual(p.descontoPadraoPercent), className: "hidden xl:table-cell tabular-nums" },
    { chave: "cadastroCompleto", titulo: "Cadastro", filtro: { tipo: "booleano", rotulo: "Cadastro completo" }, render: (p) => <BadgesPrestador prestador={p} /> },
    { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: STATUS_ATIVO_LABEL }, soFiltro: true },
    { chave: "criadoEm", titulo: "Cadastrado em", filtro: { tipo: "data" }, ordemInicial: "desc", soFiltro: true },
    ...(controle
      ? [{ chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita" as const, render: (p: Prestador) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={p} /></div> }]
      : []),
  ];
}
