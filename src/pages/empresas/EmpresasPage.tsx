import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, Plus, RotateCcw } from "lucide-react";
import type { Empresa, ListaEmpresas } from "@/api/types";
import { BadgeAtivo } from "@/components/comum/BadgeAtivo";
import { AcoesEmLinha } from "@/components/tabela/AcoesTabela";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Badge } from "@/components/ui/badge";
import { CabecalhoHero, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { useAcoesTabela } from "@/hooks/useAcoesTabela";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { api } from "@/api/client";
import { plural, type AcaoTabela } from "@/lib/acoesTabela";
import { formatarData, formatarDocumento } from "@/lib/format";
import type { Coluna } from "@/lib/tabela";

const chave = (e: Empresa) => e.id;
const nome = (e: Empresa) => e.nome;
const mudar = (status: "ativo" | "inativo") => async (ids: string[]) => {
  const falhas: { id: string; erro: string }[] = [];
  for (const id of ids) await api.patch(`/empresas/${id}`, { status }).catch((e: Error) => falhas.push({ id, erro: e.message }));
  return { feitos: ids.length - falhas.length, falhas };
};

const ACOES: AcaoTabela<Empresa>[] = [
  {
    chave: "inativar", rotulo: "Inativar", Icone: Ban, permissao: "empresas.gerenciar", aplicavel: (e) => e.status === "ativo" && !e.isSteto,
    confirmar: (es) => ({ titulo: es.length === 1 ? `Inativar ${es[0].nome}?` : `Inativar ${es.length} empresas?`, descricao: "Marca a empresa como inativa. Para tirar o acesso das pessoas, inative os usuários dela.", acao: "Inativar" }),
    executar: mudar("inativo"), sucesso: (n) => `${plural(n, "empresa inativada", "empresas inativadas")}.`,
  },
  {
    chave: "ativar", rotulo: "Reativar", Icone: RotateCcw, permissao: "empresas.gerenciar", aplicavel: (e) => e.status === "inativo",
    executar: mudar("ativo"), sucesso: (n) => `${plural(n, "empresa reativada", "empresas reativadas")}.`,
  },
];

/** /empresas — empresas que usam o Steto (só o administrador da Steto). */
export default function EmpresasPage() {
  const tabela = useTabelaServidor<Empresa, ListaEmpresas>("/empresas", "empresas", { ordemPadrao: "nome", naUrl: "", mensagemFalha: "Não foi possível carregar as empresas." });
  const navigate = useNavigate();
  const abrir = useCallback((e: Empresa) => navigate(`/empresas/${e.id}/usuarios`), [navigate]);
  const controle = useAcoesTabela({ acoes: ACOES, chave, nome, aoConcluir: tabela.recarregar });
  const colunas = useMemo<Coluna<Empresa>[]>(() => [
    { chave: "nome", titulo: "Empresa", filtro: { tipo: "texto" }, render: (e) => <span className="font-medium">{e.nome}{e.isSteto && <Badge variant="marca" className="ml-2">Steto</Badge>}</span> },
    { chave: "cnpj", titulo: "CNPJ", filtro: { tipo: "texto" }, render: (e) => formatarDocumento(e.cnpj) || "—", className: "hidden md:table-cell tabular-nums text-foreground-secondary" },
    { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: { ativo: "Ativa", inativo: "Inativa" } }, render: (e) => <BadgeAtivo status={e.status} feminino /> },
    { chave: "criadoEm", titulo: "Desde", filtro: { tipo: "data" }, ordemInicial: "desc", render: (e) => formatarData(e.criadoEm), className: "hidden sm:table-cell text-foreground-muted" },
    { chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita", render: (e) => <div className="flex justify-end"><AcoesEmLinha controle={controle} linha={e} /></div> },
  ], [controle]);

  return (
    <div className="space-y-6">
      <CabecalhoHero
        rotulo="Administração"
        titulo="Empresas"
        descricao="Empresas que usam o Steto. Os dados de cada uma ficam separados; abra uma para ver e criar os usuários dela."
        acao={<button type="button" onClick={() => navigate("/empresas/nova")} className={classeAcaoHero}><Plus className="size-4" strokeWidth={2.5} aria-hidden /> Nova empresa</button>}
        numeros={[{ valor: tabela.resposta?.meta.total, rotulo: "Empresas" }]}
      />
      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar nome ou CNPJ…" className="border-b border-borda p-4" />
        <TabelaDados tabela={tabela} colunas={colunas} chaveLinha={chave} acoes={controle} onLinha={abrir} vazio="Nenhuma empresa."
          renderCelular={(e) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><div className="font-medium">{e.nome}</div><div className="text-xs tabular-nums text-foreground-muted">{formatarDocumento(e.cnpj) || "Sem CNPJ"}</div></div>
              <BadgeAtivo status={e.status} feminino />
            </div>
          )}
        />
      </div>
    </div>
  );
}
