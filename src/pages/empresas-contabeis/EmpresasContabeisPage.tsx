import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, RotateCcw, Trash2 } from "lucide-react";
import type { EmpresaContabil, ListaEmpresasContabeis, ResumoEmpresasContabeis } from "@/api/types";
import { BadgeAtivo } from "@/components/comum/BadgeAtivo";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import { AbasContagem } from "@/components/tabela/AbasContagem";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { CabecalhoHero, ChipIconeAcao, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useParametroUrl } from "@/hooks/useParametroUrl";
import { usePermissao } from "@/hooks/usePermissao";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { emMassa, plural, type AcaoTabela } from "@/lib/acoesTabela";
import { formatarData } from "@/lib/format";
import { formatarCnpj } from "@/lib/mascaras";
import type { Coluna } from "@/lib/tabela";

const chave = (e: EmpresaContabil) => e.id;
const nome = (e: EmpresaContabil) => e.nomeFantasia || e.razaoSocial;

const ACOES: AcaoTabela<EmpresaContabil>[] = [
  {
    chave: "inativar", rotulo: "Inativar", Icone: Ban, permissao: "empresas_contabeis.gerenciar", aplicavel: (e) => e.status === "ativo",
    confirmar: (es) => ({ titulo: es.length === 1 ? `Inativar ${nome(es[0])}?` : `Inativar ${es.length} empresas?`, descricao: "Some dos seletores ao lançar notas. Os registros já lançados continuam nos relatórios.", acao: "Inativar" }),
    executar: emMassa("/empresas-contabeis/em-massa", "inativar"), sucesso: (n) => `${plural(n, "empresa inativada", "empresas inativadas")}.`,
  },
  {
    chave: "ativar", rotulo: "Reativar", Icone: RotateCcw, permissao: "empresas_contabeis.gerenciar", aplicavel: (e) => e.status === "inativo",
    executar: emMassa("/empresas-contabeis/em-massa", "ativar"), sucesso: (n) => `${plural(n, "empresa reativada", "empresas reativadas")}.`,
  },
  {
    chave: "excluir", rotulo: "Excluir", Icone: Trash2, perigo: true, permissao: "empresas_contabeis.gerenciar",
    confirmar: (es) => ({ titulo: es.length === 1 ? `Excluir ${nome(es[0])}?` : `Excluir ${es.length} empresas?`, descricao: "Empresas com registros financeiros não são excluídas: inative-as.", acao: "Excluir" }),
    executar: emMassa("/empresas-contabeis/em-massa", "excluir"), sucesso: (n) => `${plural(n, "empresa excluída", "empresas excluídas")}.`,
  },
];

const ABAS = ["todas", "ativo", "inativo"] as const;
type Aba = (typeof ABAS)[number];

export default function EmpresasContabeisPage() {
  const [aba, setAba] = useParametroUrl<Aba>("aba", "todas", ABAS);
  const caminho = aba === "todas" ? "/empresas-contabeis" : `/empresas-contabeis?recorte=${aba}`;
  const tabela = useTabelaServidor<EmpresaContabil, ListaEmpresasContabeis>(caminho, "empresasContabeis", { ordemPadrao: "razaoSocial", naUrl: "", mensagemFalha: "Não foi possível carregar as empresas contábeis." });
  const resumo = useDadosApi<ResumoEmpresasContabeis>("/empresas-contabeis/resumo");
  const { recarregar } = tabela;
  const navigate = useNavigate();
  const podeGerenciar = usePermissao("empresas_contabeis.gerenciar");
  const abrir = useCallback((e: EmpresaContabil) => navigate(`/empresas-contabeis/${e.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave, nome, aoConcluir });

  const colunas = useMemo<Coluna<EmpresaContabil>[]>(
    () => [
      {
        chave: "razaoSocial", titulo: "Empresa", filtro: { tipo: "texto" },
        render: (e) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{e.razaoSocial}</div>
            {e.nomeFantasia && <div className="truncate text-xs text-foreground-muted">{e.nomeFantasia}</div>}
          </div>
        ),
      },
      { chave: "nomeFantasia", titulo: "Nome fantasia", filtro: { tipo: "texto" }, soFiltro: true },
      { chave: "cnpj", titulo: "CNPJ", filtro: { tipo: "texto" }, render: (e) => formatarCnpj(e.cnpj), className: "hidden md:table-cell whitespace-nowrap tabular-nums text-foreground-secondary" },
      { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: { ativo: "Ativa", inativo: "Inativa" } }, render: (e) => <BadgeAtivo status={e.status} feminino /> },
      { chave: "criadoEm", titulo: "Cadastrada em", filtro: { tipo: "data" }, ordemInicial: "desc", render: (e) => formatarData(e.criadoEm), className: "hidden lg:table-cell whitespace-nowrap text-foreground-muted" },
      ...(podeGerenciar ? [{ chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita" as const, render: (e: EmpresaContabil) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={e} /></div> }] : []),
    ],
    [podeGerenciar, controle],
  );
  const r = resumo.dados;

  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!resumo.erro && !r}
        atualizando={resumo.carregando && !!r}
        rotulo="Cadastros"
        titulo="Empresas contábeis"
        descricao="Empresas pelas quais as notas são emitidas. Abra uma para ver os repasses por cliente e por prestador."
        acao={podeGerenciar ? (
          <button type="button" onClick={() => navigate("/empresas-contabeis/nova")} className={classeAcaoHero}>
            <ChipIconeAcao /> Nova empresa
          </button>
        ) : undefined}
        numeros={[
          { valor: r?.total, rotulo: "Empresas cadastradas" },
          { valor: r?.ativas, rotulo: "Ativas", tom: "marca" },
          { valor: r?.inativas, rotulo: "Inativas" },
        ]}
      />
      <AbasContagem rotulo="Situação" valor={aba} onChange={setAba} abas={[
        { id: "todas", label: "Todas", total: r?.total },
        { id: "ativo", label: "Ativas", total: r?.ativas },
        { id: "inativo", label: "Inativas", total: r?.inativas },
      ]} />
      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar razão social, nome fantasia ou CNPJ…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          acoes={podeGerenciar ? controle : undefined}
          onLinha={abrir}
          vazio="Nenhuma empresa contábil cadastrada."
          renderCelular={(e) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{e.razaoSocial}</div>
                <div className="text-xs tabular-nums text-foreground-muted">{formatarCnpj(e.cnpj)}</div>
              </div>
              <BadgeAtivo status={e.status} feminino />
            </div>
          )}
        />
      </div>
    </div>
  );
}
