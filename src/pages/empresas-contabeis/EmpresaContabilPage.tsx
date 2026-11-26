import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import type { PainelEmpresaContabil } from "@/api/types";
import { EstadoCarga } from "@/components/EstadoCarga";
import { TabelaRanking } from "@/components/relatorios/TabelaRanking";
import { CabecalhoHero, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { useDadosApi } from "@/hooks/useDadosApi";
import { usePermissao } from "@/hooks/usePermissao";
import { useVoltar } from "@/hooks/useVoltar";
import { formatarMoeda } from "@/lib/format";
import { formatarCnpj } from "@/lib/mascaras";

/** Lista de registros já filtrada (o filtro avançado lê `filtros` da URL). */
const registrosFiltrados = (campo: "clienteId" | "prestadorId", id: string, empresaId: string) =>
  `/registros?filtros=${encodeURIComponent(JSON.stringify({ logica: "e", regras: [{ campo, op: "e", valor: [id] }, { campo: "empresaContabilId", op: "e", valor: [empresaId] }] }))}`;

/** /empresas-contabeis/:id — totais e repasses por cliente e por prestador das notas emitidas pela empresa. */
export default function EmpresaContabilPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const voltar = useVoltar("/empresas-contabeis");
  const podeGerenciar = usePermissao("empresas_contabeis.gerenciar");
  const carga = useDadosApi<PainelEmpresaContabil>(`/empresas-contabeis/${id}/painel`, "Não foi possível carregar a empresa contábil.");

  return (
    <div className="space-y-6">
      <button type="button" onClick={voltar} className="alvo-toque -ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <EstadoCarga carga={carga} esqueleto={<Skeleton className="h-64 w-full rounded-2xl" />}>
        {({ empresa, resumo, clientes, prestadores }) => (
          <div className="space-y-6">
            <CabecalhoHero
              atualizando={carga.carregando}
              rotulo={`Empresa contábil · ${formatarCnpj(empresa.cnpj)}${empresa.status === "inativo" ? " · inativa" : ""}`}
              titulo={empresa.nomeFantasia || empresa.razaoSocial}
              descricao={empresa.nomeFantasia ? empresa.razaoSocial : "Totais de todas as notas emitidas por esta empresa."}
              acao={podeGerenciar ? (
                <button type="button" onClick={() => navigate(`/empresas-contabeis/${empresa.id}/editar`)} className={classeAcaoHero}>
                  <Pencil className="size-4" aria-hidden /> Editar
                </button>
              ) : undefined}
              numeros={[
                { valor: formatarMoeda(resumo.repasse), rotulo: "Repasse total" },
                { valor: formatarMoeda(resumo.repassePago), rotulo: "Pago", destaque: "text-realce" },
                { valor: formatarMoeda(resumo.repassePendente), rotulo: "Pendente", destaque: "text-[var(--acafrao)]" },
                { valor: resumo.quantidade, rotulo: "Notas lançadas" },
              ]}
            />
            <div className="grid gap-6 min-[1800px]:grid-cols-2">
              <TabelaRanking titulo="Por cliente" rotuloNome="Cliente" linhas={clientes} vazio="Nenhuma nota lançada por esta empresa." onLinha={(l) => navigate(registrosFiltrados("clienteId", l.id, empresa.id))} />
              <TabelaRanking titulo="Por prestador" rotuloNome="Prestador" linhas={prestadores} vazio="Nenhuma nota lançada por esta empresa." onLinha={(l) => navigate(registrosFiltrados("prestadorId", l.id, empresa.id))} />
            </div>
          </div>
        )}
      </EstadoCarga>
    </div>
  );
}
