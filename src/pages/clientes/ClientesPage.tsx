import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { Cliente, ListaClientes, ResumoClientes } from "@/api/types";
import { CartaoCliente } from "@/components/clientes/CartaoCliente";
import { colunasClientes } from "@/components/clientes/colunasClientes";
import { AbasContagem } from "@/components/tabela/AbasContagem";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { CabecalhoHero, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useParametroUrl } from "@/hooks/useParametroUrl";
import { usePermissao } from "@/hooks/usePermissao";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { emMassa, plural, type AcaoTabela } from "@/lib/acoesTabela";

const chaveCliente = (c: Cliente) => c.id;
const nomeCliente = (c: Cliente) => c.razaoSocial;

const ACOES: AcaoTabela<Cliente>[] = [
  {
    chave: "inativar",
    rotulo: "Inativar",
    Icone: Ban,
    permissao: "clientes.gerenciar",
    aplicavel: (c) => c.status !== "inativo",
    confirmar: (cs) => ({
      titulo: cs.length === 1 ? `Inativar ${cs[0].razaoSocial}?` : `Inativar ${cs.length} clientes?`,
      descricao: "Some dos seletores ao lançar notas. Os registros já lançados continuam nos relatórios.",
      acao: "Inativar",
    }),
    executar: emMassa("/clientes/em-massa", "inativar"),
    sucesso: (n) => `${plural(n, "cliente inativado", "clientes inativados")}.`,
  },
  {
    chave: "ativar",
    rotulo: "Reativar",
    Icone: RotateCcw,
    permissao: "clientes.gerenciar",
    aplicavel: (c) => c.status === "inativo",
    executar: emMassa("/clientes/em-massa", "ativar"),
    sucesso: (n) => `${plural(n, "cliente reativado", "clientes reativados")}.`,
  },
  {
    chave: "excluir",
    rotulo: "Excluir",
    Icone: Trash2,
    perigo: true,
    permissao: "clientes.gerenciar",
    confirmar: (cs) => ({
      titulo: cs.length === 1 ? `Excluir ${cs[0].razaoSocial}?` : `Excluir ${cs.length} clientes?`,
      descricao: "O cadastro e os vínculos com prestadores são apagados. Clientes com registros financeiros não são excluídos: inative-os.",
      acao: "Excluir",
    }),
    executar: emMassa("/clientes/em-massa", "excluir"),
    sucesso: (n) => `${plural(n, "cliente excluído", "clientes excluídos")}.`,
  },
];

const ABAS = ["todos", "ativo", "provisorio", "inativo"] as const;
type Aba = (typeof ABAS)[number];
const CAMINHO_DA_ABA: Record<Aba, string> = {
  todos: "/clientes",
  ativo: `/clientes?recorte=ativo`,
  provisorio: `/clientes?recorte=provisorio`,
  inativo: `/clientes?recorte=inativo`,
};

export default function ClientesPage() {
  const [aba, setAba] = useParametroUrl<Aba>("aba", "todos", ABAS);
  const tabela = useTabelaServidor<Cliente, ListaClientes>(CAMINHO_DA_ABA[aba], "clientes", { ordemPadrao: "razaoSocial", naUrl: "", mensagemFalha: "Não foi possível carregar os clientes." });
  const resumo = useDadosApi<ResumoClientes>("/clientes/resumo");
  const { recarregar } = tabela;
  const navigate = useNavigate();
  const podeGerenciar = usePermissao("clientes.gerenciar");
  const editar = useCallback((c: Cliente) => navigate(`/clientes/${c.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave: chaveCliente, nome: nomeCliente, aoConcluir });
  const colunas = useMemo(() => colunasClientes(podeGerenciar ? controle : undefined), [podeGerenciar, controle]);
  const r = resumo.dados;

  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!resumo.erro && !r}
        atualizando={resumo.carregando && !!r}
        rotulo="Cadastros"
        titulo="Clientes"
        descricao="Hospitais e clínicas atendidos, com as alíquotas usadas no cálculo de cada nota."
        acao={
          podeGerenciar ? (
            <button type="button" onClick={() => navigate("/clientes/novo")} className={classeAcaoHero}>
              <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Novo cliente
            </button>
          ) : undefined
        }
        numeros={[
          { valor: r?.total, rotulo: "Clientes na base" },
          { valor: r?.ativo, rotulo: "Ativos", destaque: "text-realce" },
          { valor: r?.provisorio, rotulo: "Provisórios a revisar", destaque: "text-[var(--acafrao)]" },
          { valor: r?.semRegime, rotulo: "Sem regime tributário" },
        ]}
      />

      <AbasContagem
        rotulo="Situação"
        valor={aba}
        onChange={setAba}
        abas={[
          { id: "todos", label: "Todos", total: r?.total },
          { id: "ativo", label: "Ativos", total: r?.ativo },
          { id: "provisorio", label: "Provisórios", total: r?.provisorio },
          { id: "inativo", label: "Inativos", total: r?.inativo },
        ]}
      />

      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar nome, CNPJ, CPF ou e-mail…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chaveCliente}
          acoes={podeGerenciar ? controle : undefined}
          onLinha={podeGerenciar ? editar : undefined}
          vazio="Nenhum cliente cadastrado."
          renderCelular={(c) => <CartaoCliente cliente={c} />}
        />
      </div>
    </div>
  );
}
