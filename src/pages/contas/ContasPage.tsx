import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, FolderTree, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Categoria, Conta, ListaContas, ResumoContas } from "@/api/types";
import { BadgeSituacaoConta } from "@/components/contas/BadgeSituacaoConta";
import { colunasContas } from "@/components/contas/colunasContas";
import { AbasContagem } from "@/components/tabela/AbasContagem";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Button } from "@/components/ui/button";
import { CabecalhoHero, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useParametroUrl } from "@/hooks/useParametroUrl";
import { usePermissao } from "@/hooks/usePermissao";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { emMassa, plural, type AcaoTabela } from "@/lib/acoesTabela";
import { baixarCsv } from "@/lib/csv";
import { mensagemErro } from "@/lib/erros";
import { formatarData, formatarMoeda } from "@/lib/format";

const chave = (c: Conta) => c.id;
const nome = (c: Conta) => c.descricao;

const ACOES: AcaoTabela<Conta>[] = [
  {
    chave: "pagar", rotulo: "Marcar paga", Icone: CheckCircle2, permissao: "contas.gerenciar", aplicavel: (c) => c.status !== "pago",
    confirmar: (cs) => ({ titulo: cs.length === 1 ? `Marcar "${cs[0].descricao}" como paga?` : `Marcar ${cs.length} contas como pagas?`, descricao: "Sem data de pagamento, vale a de hoje. Contas sem banco do pagamento não são marcadas.", acao: "Marcar como paga" }),
    executar: emMassa("/contas/em-massa", "pagar"), sucesso: (n) => `${plural(n, "conta marcada", "contas marcadas")} como paga.`,
  },
  {
    chave: "pendente", rotulo: "Voltar a pendente", Icone: RotateCcw, permissao: "contas.gerenciar", aplicavel: (c) => c.status === "pago",
    executar: emMassa("/contas/em-massa", "pendente"), sucesso: (n) => `${plural(n, "conta voltou", "contas voltaram")} a pendente.`,
  },
  {
    chave: "excluir", rotulo: "Excluir", Icone: Trash2, perigo: true, permissao: "contas.gerenciar",
    confirmar: (cs) => ({ titulo: cs.length === 1 ? `Excluir "${cs[0].descricao}"?` : `Excluir ${cs.length} contas?`, descricao: "Isso não pode ser desfeito.", acao: "Excluir" }),
    executar: emMassa("/contas/em-massa", "excluir"), sucesso: (n) => `${plural(n, "conta excluída", "contas excluídas")}.`,
  },
];

const ABAS = ["abertas", "pagar", "receber", "vencidas", "pagas", "todas"] as const;
type Aba = (typeof ABAS)[number];

export default function ContasPage() {
  const [aba, setAba] = useParametroUrl<Aba>("aba", "abertas", ABAS);
  const tabela = useTabelaServidor<Conta, ListaContas>(aba === "todas" ? "/contas" : `/contas?recorte=${aba}`, "contas", { ordemPadrao: "dataVencimento", naUrl: "", mensagemFalha: "Não foi possível carregar as contas." });
  const resumo = useDadosApi<ResumoContas>("/contas/resumo");
  const categorias = useDadosApi<Categoria[]>("/categorias-contas");
  const { recarregar, buscarTodas } = tabela;
  const navigate = useNavigate();
  const podeGerenciar = usePermissao("contas.gerenciar");
  const abrir = useCallback((c: Conta) => navigate(`/contas/${c.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave, nome, aoConcluir });
  const colunas = useMemo(() => colunasContas(categorias.dados, podeGerenciar ? controle : undefined), [categorias.dados, podeGerenciar, controle]);

  const exportar = useCallback(async () => {
    try {
      const todas = (await buscarTodas?.()) ?? [];
      if (!todas.length) return toast.info("Nada para exportar com estes filtros.");
      baixarCsv("contas", todas.map((c) => ({
        Vencimento: formatarData(c.dataVencimento), "Descrição": c.descricao, Tipo: c.tipo === "pagar" ? "A pagar" : "A receber", Categoria: c.categoria?.nome, Subcategoria: c.subcategoria?.nome,
        "Valor base": c.valorBase, Valor: c.valor, "Situação": c.status === "pago" ? "Paga" : "Pendente", "Paga em": c.dataPagamento ? formatarData(c.dataPagamento) : "", Banco: c.bancoPagamento, "Observação": c.observacao,
      })));
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível exportar."));
    }
  }, [buscarTodas]);

  const r = resumo.dados;
  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!resumo.erro && !r}
        atualizando={resumo.carregando && !!r}
        rotulo="Financeiro"
        titulo="Contas a pagar e receber"
        descricao="Despesas e recebimentos da empresa, com vencimento, ajustes e recorrência."
        acao={podeGerenciar ? (
          <button type="button" onClick={() => navigate("/contas/nova")} className={classeAcaoHero}>
            <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Nova conta
          </button>
        ) : undefined}
        numeros={[
          { valor: r ? formatarMoeda(r.aPagar) : undefined, rotulo: "A pagar (em aberto)" },
          { valor: r ? formatarMoeda(r.aReceber) : undefined, rotulo: "A receber (em aberto)", destaque: "text-realce" },
          { valor: r?.vencidas, rotulo: "Vencidas", destaque: r?.vencidas ? "text-[var(--coral)]" : undefined, nota: r?.vencidas ? formatarMoeda(r.valorVencido) : undefined, notaRuim: !!r?.vencidas },
          { valor: r?.vencemEm7Dias, rotulo: "Vencem em 7 dias", destaque: "text-[var(--acafrao)]" },
        ]}
      />
      <AbasContagem rotulo="Recorte" valor={aba} onChange={setAba} abas={[
        { id: "abertas", label: "Em aberto" },
        { id: "pagar", label: "A pagar" },
        { id: "receber", label: "A receber" },
        { id: "vencidas", label: "Vencidas", total: r?.vencidas },
        { id: "pagas", label: "Pagas" },
        { id: "todas", label: "Todas" },
      ]} />
      <div className="card overflow-hidden">
        <BarraTabela
          tabela={tabela}
          colunas={colunas}
          placeholder="Pesquisar descrição ou observação…"
          className="border-b border-borda p-4"
          acoes={
            <>
              {podeGerenciar && <Button variant="secondary" className="shrink-0" onClick={() => navigate("/contas/categorias")}><FolderTree className="size-4" aria-hidden /> <span className="max-sm:sr-only">Categorias</span></Button>}
              <Button variant="secondary" className="shrink-0" onClick={() => void exportar()}><Download className="size-4" aria-hidden /> <span className="max-sm:sr-only">Exportar</span></Button>
            </>
          }
        />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          acoes={podeGerenciar ? controle : undefined}
          onLinha={abrir}
          vazio="Nenhuma conta cadastrada."
          renderCelular={(c) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.descricao}</div>
                <div className="text-xs text-foreground-muted">{formatarData(c.dataVencimento)} · {c.categoria?.nome ?? "Sem categoria"}</div>
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <div className="font-medium tabular-nums">{c.tipo === "receber" ? "+ " : "− "}{formatarMoeda(c.valor)}</div>
                <BadgeSituacaoConta status={c.status} dataVencimento={c.dataVencimento} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
