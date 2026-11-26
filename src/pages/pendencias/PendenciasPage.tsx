import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, GitMerge, Pencil, Trash2 } from "lucide-react";
import type { Cliente, ListaClientes, ResumoClientes } from "@/api/types";
import { CartaoCliente } from "@/components/clientes/CartaoCliente";
import { MesclarCliente } from "@/components/clientes/MesclarCliente";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Button } from "@/components/ui/button";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { emMassa, plural, type AcaoTabela } from "@/lib/acoesTabela";
import { formatarData, formatarDocumento } from "@/lib/format";
import { REGIME_LABEL } from "@/lib/labels";
import type { Coluna } from "@/lib/tabela";

const chave = (c: Cliente) => c.id;
const nome = (c: Cliente) => c.razaoSocial;

const ACOES: AcaoTabela<Cliente>[] = [
  {
    chave: "ativar", rotulo: "Ativar", Icone: CheckCircle2, permissao: "clientes.gerenciar",
    confirmar: (cs) => ({ titulo: cs.length === 1 ? `Ativar ${cs[0].razaoSocial}?` : `Ativar ${cs.length} clientes?`, descricao: "Confira antes se o regime tributário e as alíquotas estão certos: eles valem para as próximas notas.", acao: "Ativar" }),
    executar: emMassa("/clientes/em-massa", "ativar"), sucesso: (n) => `${plural(n, "cliente ativado", "clientes ativados")}.`,
  },
  {
    chave: "excluir", rotulo: "Excluir", Icone: Trash2, perigo: true, permissao: "clientes.gerenciar",
    confirmar: (cs) => ({ titulo: cs.length === 1 ? `Excluir ${cs[0].razaoSocial}?` : `Excluir ${cs.length} clientes?`, descricao: "Clientes com registros financeiros não são excluídos: mescle-os com o cliente certo.", acao: "Excluir" }),
    executar: emMassa("/clientes/em-massa", "excluir"), sucesso: (n) => `${plural(n, "cliente excluído", "clientes excluídos")}.`,
  },
];

/** /pendencias — clientes provisórios (criados por importação) para completar, ativar ou mesclar. */
export default function PendenciasPage() {
  const tabela = useTabelaServidor<Cliente, ListaClientes>("/clientes?recorte=provisorio", "clientes", { ordemPadrao: "-criadoEm", naUrl: "", mensagemFalha: "Não foi possível carregar as pendências." });
  const resumo = useDadosApi<ResumoClientes>("/clientes/resumo");
  const { recarregar } = tabela;
  const navigate = useNavigate();
  const [mesclando, setMesclando] = useState<Cliente | null>(null);
  const editar = useCallback((c: Cliente) => navigate(`/clientes/${c.id}`), [navigate]);
  const aoConcluir = useCallback(() => {
    recarregar?.();
    resumo.recarregar();
  }, [recarregar, resumo]);
  const controle = useAcoesTabela({ acoes: ACOES, chave, nome, aoConcluir });

  const colunas = useMemo<Coluna<Cliente>[]>(() => [
    { chave: "razaoSocial", titulo: "Cliente", filtro: { tipo: "texto" }, className: "font-medium" },
    { chave: "documento", titulo: "CNPJ / CPF", filtro: { tipo: "texto" }, render: (c) => formatarDocumento(c.documento), className: "hidden md:table-cell tabular-nums text-foreground-secondary" },
    { chave: "regimeTributario", titulo: "Regime", filtro: { tipo: "opcoes", opcoes: REGIME_LABEL }, render: (c) => (c.regimeTributario ? REGIME_LABEL[c.regimeTributario] : <span className="text-[var(--aviso)]">Falta informar</span>), className: "hidden lg:table-cell" },
    { chave: "criadoEm", titulo: "Criado em", filtro: { tipo: "data" }, ordemInicial: "desc", render: (c) => formatarData(c.criadoEm), className: "hidden sm:table-cell whitespace-nowrap text-foreground-muted" },
    {
      chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => editar(c)}><Pencil aria-hidden /> Completar</Button>
          <Button size="sm" variant="secondary" onClick={() => setMesclando(c)}><GitMerge aria-hidden /> Mesclar</Button>
          <AcoesEmLinha controle={controle} linha={c} comRotulo={false} />
        </div>
      ),
    },
  ], [controle, editar]);

  const total = resumo.dados?.provisorio;
  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!resumo.erro && !resumo.dados}
        rotulo="Financeiro"
        titulo="Pendências de clientes"
        descricao="Clientes provisórios criados na importação de planilhas e XML. Complete o cadastro e ative, ou mescle com o cliente que já existe."
        numeros={[
          { valor: total, rotulo: "Provisórios a revisar", tom: total ? "aviso" : "marca" },
          { valor: resumo.dados?.semRegime, rotulo: "Clientes sem regime tributário" },
        ]}
      />
      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar nome ou documento…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          acoes={controle}
          vazio="Nenhuma pendência: todos os clientes estão revisados."
          renderCelular={(c) => (
            <div className="space-y-2">
              <CartaoCliente cliente={c} />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => editar(c)}><Pencil aria-hidden /> Completar</Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setMesclando(c)}><GitMerge aria-hidden /> Mesclar</Button>
              </div>
            </div>
          )}
        />
      </div>
      {mesclando && <MesclarCliente cliente={mesclando} onFechar={() => setMesclando(null)} onMesclado={() => { setMesclando(null); aoConcluir(); }} />}
    </div>
  );
}
