import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, RotateCcw, Trash2 } from "lucide-react";
import type { ListaPrestadores, Prestador, ResumoPrestadores } from "@/api/types";
import { CartaoPrestador } from "@/components/prestadores/CartaoPrestador";
import { colunasPrestadores } from "@/components/prestadores/colunasPrestadores";
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

const chavePrestador = (p: Prestador) => p.id;
const nomePrestador = (p: Prestador) => p.nomeCompleto;

const ACOES: AcaoTabela<Prestador>[] = [
  {
    chave: "inativar",
    rotulo: "Inativar",
    Icone: Ban,
    permissao: "prestadores.gerenciar",
    aplicavel: (p) => p.status === "ativo",
    confirmar: (ps) => ({
      titulo: ps.length === 1 ? `Inativar ${ps[0].nomeCompleto}?` : `Inativar ${ps.length} prestadores?`,
      descricao: "Some dos seletores ao lançar notas. Os repasses já lançados continuam nos relatórios.",
      acao: "Inativar",
    }),
    executar: emMassa("/prestadores/em-massa", "inativar"),
    sucesso: (n) => `${plural(n, "prestador inativado", "prestadores inativados")}.`,
  },
  {
    chave: "ativar",
    rotulo: "Reativar",
    Icone: RotateCcw,
    permissao: "prestadores.gerenciar",
    aplicavel: (p) => p.status === "inativo",
    executar: emMassa("/prestadores/em-massa", "ativar"),
    sucesso: (n) => `${plural(n, "prestador reativado", "prestadores reativados")}.`,
  },
  {
    chave: "excluir",
    rotulo: "Excluir",
    Icone: Trash2,
    perigo: true,
    permissao: "prestadores.gerenciar",
    confirmar: (ps) => ({
      titulo: ps.length === 1 ? `Excluir ${ps[0].nomeCompleto}?` : `Excluir ${ps.length} prestadores?`,
      descricao: "O cadastro e os vínculos são apagados. Prestadores com registros financeiros não são excluídos: inative-os.",
      acao: "Excluir",
    }),
    executar: emMassa("/prestadores/em-massa", "excluir"),
    sucesso: (n) => `${plural(n, "prestador excluído", "prestadores excluídos")}.`,
  },
];

const ABAS = ["todos", "incompleto", "completo", "inativo"] as const;
type Aba = (typeof ABAS)[number];
const CAMINHO_DA_ABA: Record<Aba, string> = {
  todos: "/prestadores",
  incompleto: "/prestadores?recorte=incompleto",
  completo: "/prestadores?recorte=completo",
  inativo: "/prestadores?recorte=inativo",
};

export default function PrestadoresPage() {
  const [aba, setAba] = useParametroUrl<Aba>("aba", "todos", ABAS);
  const tabela = useTabelaServidor<Prestador, ListaPrestadores>(CAMINHO_DA_ABA[aba], "prestadores", { ordemPadrao: "nomeCompleto", naUrl: "", mensagemFalha: "Não foi possível carregar os prestadores." });
  const resumo = useDadosApi<ResumoPrestadores>("/prestadores/resumo");
  const { recarregar } = tabela;
  const navigate = useNavigate();
  const podeGerenciar = usePermissao("prestadores.gerenciar");
  const editar = useCallback((p: Prestador) => navigate(`/prestadores/${p.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave: chavePrestador, nome: nomePrestador, aoConcluir });
  const colunas = useMemo(() => colunasPrestadores(podeGerenciar ? controle : undefined), [podeGerenciar, controle]);
  const r = resumo.dados;

  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!resumo.erro && !r}
        atualizando={resumo.carregando && !!r}
        rotulo="Cadastros"
        titulo="Prestadores"
        descricao="Médicos que recebem os repasses, com os dados bancários e os clientes onde atendem."
        acao={
          podeGerenciar ? (
            <button type="button" onClick={() => navigate("/prestadores/novo")} className={classeAcaoHero}>
              <ChipIconeAcao /> Novo prestador
            </button>
          ) : undefined
        }
        numeros={[
          { valor: r?.total, rotulo: "Prestadores na base" },
          { valor: r?.completos, rotulo: "Cadastro completo", tom: "marca" },
          { valor: r?.incompletos, rotulo: "Cadastro incompleto", tom: "aviso" },
          { valor: r?.inativos, rotulo: "Inativos" },
        ]}
      />

      <AbasContagem
        rotulo="Cadastro"
        valor={aba}
        onChange={setAba}
        abas={[
          { id: "todos", label: "Todos", total: r?.total },
          { id: "incompleto", label: "Incompletos", total: r?.incompletos },
          { id: "completo", label: "Completos", total: r?.completos },
          { id: "inativo", label: "Inativos", total: r?.inativos },
        ]}
      />

      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar nome, CPF, CRM ou e-mail…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chavePrestador}
          acoes={podeGerenciar ? controle : undefined}
          onLinha={podeGerenciar ? editar : undefined}
          vazio="Nenhum prestador cadastrado."
          renderCelular={(p) => <CartaoPrestador prestador={p} />}
        />
      </div>
    </div>
  );
}
