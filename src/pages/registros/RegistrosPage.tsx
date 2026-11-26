import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { ListaRegistros, OpcaoApi, Registro, ResumoRegistros } from "@/api/types";
import { BadgeSituacao } from "@/components/registros/BadgeSituacao";
import { colunasRegistros } from "@/components/registros/colunasRegistros";
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
import { SITUACAO_REGISTRO_LABEL, TIPO_PAGAMENTO_LABEL } from "@/lib/labels";
import { competenciaParaTela } from "@/lib/repasse";

const chave = (r: Registro) => r.id;
const nome = (r: Registro) => `${r.cliente.razaoSocial} · ${r.prestador.nomeCompleto}`;

const ACOES: AcaoTabela<Registro>[] = [
  {
    chave: "pagar", rotulo: "Marcar pago", Icone: CheckCircle2, permissao: "registros.gerenciar", aplicavel: (r) => r.situacao !== "pago",
    confirmar: (rs) => ({ titulo: rs.length === 1 ? "Marcar este repasse como pago?" : `Marcar ${rs.length} repasses como pagos?`, descricao: "Quem ainda não tem data de pagamento recebe a data de hoje.", acao: "Marcar como pago" }),
    executar: emMassa("/registros/em-massa", "pagar"), sucesso: (n) => `${plural(n, "repasse marcado", "repasses marcados")} como pago.`,
  },
  {
    chave: "pendente", rotulo: "Voltar a pendente", Icone: RotateCcw, permissao: "registros.gerenciar", aplicavel: (r) => r.situacao !== "pendente",
    executar: emMassa("/registros/em-massa", "pendente"), sucesso: (n) => `${plural(n, "registro voltou", "registros voltaram")} a pendente.`,
  },
  {
    chave: "cancelar", rotulo: "Cancelar", Icone: XCircle, permissao: "registros.gerenciar", aplicavel: (r) => r.situacao !== "cancelado",
    confirmar: (rs) => ({ titulo: rs.length === 1 ? "Cancelar este registro?" : `Cancelar ${rs.length} registros?`, descricao: "Registros cancelados saem dos totais de repasse, mas continuam na lista.", acao: "Cancelar registros" }),
    executar: emMassa("/registros/em-massa", "cancelar"), sucesso: (n) => `${plural(n, "registro cancelado", "registros cancelados")}.`,
  },
  {
    chave: "excluir", rotulo: "Excluir", Icone: Trash2, perigo: true, permissao: "registros.gerenciar",
    confirmar: (rs) => ({ titulo: rs.length === 1 ? "Excluir este registro?" : `Excluir ${rs.length} registros?`, descricao: "Isso não pode ser desfeito. Para tirar dos totais sem apagar, use Cancelar.", acao: "Excluir" }),
    executar: emMassa("/registros/em-massa", "excluir"), sucesso: (n) => `${plural(n, "registro excluído", "registros excluídos")}.`,
  },
];

const ABAS = ["todos", "pendente", "pago", "cancelado"] as const;
type Aba = (typeof ABAS)[number];

const linhaPlanilha = (r: Registro) => ({
  "Competência": competenciaParaTela(r.competencia), Cliente: r.cliente.razaoSocial, Prestador: r.prestador.nomeCompleto, "Empresa contábil": r.empresaContabil.nome,
  NFS: r.numeroNfs, Setor: r.setor, "Valor NF": r.valorNf, Tributos: r.valorTotalTributos, "Desconto padrão": r.descontoPadraoAplicado,
  "Desconto adicional": r.descontoAdicional, "Acréscimo": r.acrescimo, Repasse: r.valorFinalRepasse, "Situação": SITUACAO_REGISTRO_LABEL[r.situacao],
  "Forma": r.tipoPagamento ? TIPO_PAGAMENTO_LABEL[r.tipoPagamento] : "", "Pago em": r.dataPagamento ? formatarData(r.dataPagamento) : "",
  Banco: r.banco, "Agência": r.agencia, Conta: r.conta, Pix: r.chavePix,
});

export default function RegistrosPage() {
  const [aba, setAba] = useParametroUrl<Aba>("aba", "todos", ABAS);
  const tabela = useTabelaServidor<Registro, ListaRegistros>(aba === "todos" ? "/registros" : `/registros?recorte=${aba}`, "registros", { ordemPadrao: "-competencia", naUrl: "", mensagemFalha: "Não foi possível carregar os registros." });
  const resumo = useDadosApi<ResumoRegistros>("/registros/resumo");
  const clientes = useDadosApi<OpcaoApi[]>("/clientes/opcoes");
  const prestadores = useDadosApi<OpcaoApi[]>("/prestadores/opcoes");
  const empresas = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const { recarregar, buscarTodas } = tabela;
  const navigate = useNavigate();
  const podeGerenciar = usePermissao("registros.gerenciar");
  const abrir = useCallback((r: Registro) => navigate(`/registros/${r.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave, nome, aoConcluir });
  const colunas = useMemo(
    () => colunasRegistros({ clientes: clientes.dados, prestadores: prestadores.dados, empresas: empresas.dados }, podeGerenciar ? controle : undefined),
    [clientes.dados, prestadores.dados, empresas.dados, podeGerenciar, controle],
  );

  const exportar = useCallback(async () => {
    try {
      const todas = (await buscarTodas?.()) ?? [];
      if (!todas.length) return toast.info("Nada para exportar com estes filtros.");
      baixarCsv("registros-financeiros", todas.map(linhaPlanilha));
      toast.success(`${plural(todas.length, "registro exportado", "registros exportados")}.`);
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
        titulo="Registros financeiros"
        descricao="Notas emitidas para os clientes e o repasse de cada uma ao prestador."
        acao={podeGerenciar ? (
          <button type="button" onClick={() => navigate("/registros/novo")} className={classeAcaoHero}>
            <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Novo registro
          </button>
        ) : undefined}
        numeros={[
          { valor: r ? formatarMoeda(r.valorNf) : undefined, rotulo: "Valor das notas" },
          { valor: r ? formatarMoeda(r.repassePendente) : undefined, rotulo: "Repasse pendente", destaque: "text-[var(--acafrao)]" },
          { valor: r ? formatarMoeda(r.repassePago) : undefined, rotulo: "Repasse pago", destaque: "text-realce" },
          { valor: r?.quantidade, rotulo: "Notas lançadas" },
        ]}
      />
      <AbasContagem rotulo="Situação" valor={aba} onChange={setAba} abas={[
        { id: "todos", label: "Todos", total: r?.quantidade },
        { id: "pendente", label: "Pendentes", total: r?.pendentes },
        { id: "pago", label: "Pagos", total: r?.pagos },
        { id: "cancelado", label: "Cancelados", total: r?.cancelados },
      ]} />
      <div className="card overflow-hidden">
        <BarraTabela
          tabela={tabela}
          colunas={colunas}
          placeholder="Pesquisar cliente, prestador, NFS ou setor…"
          className="border-b border-borda p-4"
          acoes={<Button variant="secondary" className="shrink-0" onClick={() => void exportar()}><Download className="size-4" aria-hidden /> <span className="max-sm:sr-only">Exportar</span></Button>}
        />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          acoes={podeGerenciar ? controle : undefined}
          onLinha={abrir}
          vazio="Nenhum registro lançado."
          renderCelular={(reg) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{reg.cliente.razaoSocial}</div>
                <div className="truncate text-xs text-foreground-muted">{reg.prestador.nomeCompleto}</div>
                <div className="text-xs tabular-nums text-foreground-muted">{competenciaParaTela(reg.competencia)}{reg.numeroNfs && ` · NFS ${reg.numeroNfs}`}</div>
              </div>
              <div className="shrink-0 space-y-1 text-right">
                <div className="font-medium tabular-nums">{formatarMoeda(reg.valorFinalRepasse)}</div>
                <BadgeSituacao situacao={reg.situacao} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
