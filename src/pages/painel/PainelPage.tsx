import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import type { PainelGeral } from "@/api/types";
import { BarChart, RankedBars } from "@/components/charts";
import { BadgeSituacaoConta } from "@/components/contas/BadgeSituacaoConta";
import { EstadoCarga } from "@/components/EstadoCarga";
import { CabecalhoHero, classeAcaoHero } from "@/components/ui/cabecalho-hero";
import { Metrica, Metricas } from "@/components/ui/metricas";
import { Skeleton } from "@/components/ui/skeleton";
import { useDadosApi } from "@/hooks/useDadosApi";
import { usePermissao } from "@/hooks/usePermissao";
import { formatarData, formatarMoeda } from "@/lib/format";
import { competenciaCurta } from "@/lib/repasse";

const moedaCurta = (v: number) => (v >= 1_000_000 ? `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi` : v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : formatarMoeda(v));

function Cartao({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-titulo text-[15px] font-semibold">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** /painel — Visão geral: o mês, as pendências, a evolução e quem mais fatura. */
export default function PainelPage() {
  const carga = useDadosApi<PainelGeral>("/painel", "Não foi possível carregar a visão geral.");
  const navigate = useNavigate();
  const podeLancar = usePermissao("registros.gerenciar");
  const p = carga.dados;
  const mesAtual = p?.serie.at(-1)?.competencia;

  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!carga.erro && !p}
        atualizando={carga.carregando && !!p}
        rotulo={mesAtual ? `Visão geral · ${competenciaCurta(mesAtual)}` : "Visão geral"}
        titulo="Como está o mês"
        descricao="Notas da competência atual, repasses em aberto e contas que pedem atenção."
        acao={podeLancar ? (
          <button type="button" onClick={() => navigate("/registros/novo")} className={classeAcaoHero}>
            <Plus className="size-4" strokeWidth={2.5} aria-hidden /> Novo registro
          </button>
        ) : undefined}
        numeros={[
          { valor: p ? formatarMoeda(p.mes.valorNf) : undefined, rotulo: "Faturado no mês", nota: p ? `${p.mes.quantidade} ${p.mes.quantidade === 1 ? "nota" : "notas"}` : undefined },
          { valor: p ? formatarMoeda(p.pendenteTotal.repassePendente) : undefined, rotulo: "Repasses pendentes", destaque: "text-[var(--acafrao)]", nota: p ? `${p.pendenteTotal.pendentes} registros` : undefined },
          { valor: p ? formatarMoeda(p.contas.aPagar) : undefined, rotulo: "Contas a pagar em aberto" },
          { valor: p?.contas.vencidas, rotulo: "Contas vencidas", destaque: p?.contas.vencidas ? "text-[var(--coral)]" : "text-realce", nota: p?.contas.vencidas ? formatarMoeda(p.contas.valorVencido) : "nenhuma", notaRuim: !!p?.contas.vencidas },
        ]}
      />

      <EstadoCarga carga={carga} esqueleto={<Skeleton className="h-80 w-full rounded-2xl" />}>
        {(d) => (
          <>
            <Metricas separados>
              <Metrica titulo="Clientes" valor={d.cadastros.clientes} legenda={<Link to="/clientes" className="hover:underline">ver cadastros</Link>} />
              <Metrica titulo="Prestadores ativos" valor={d.cadastros.prestadores} legenda={<Link to="/prestadores" className="hover:underline">ver cadastros</Link>} />
              <Metrica titulo="Empresas contábeis" valor={d.cadastros.empresasContabeis} legenda={<Link to="/empresas-contabeis" className="hover:underline">ver cadastros</Link>} />
              <Metrica titulo="Clientes provisórios" valor={d.cadastros.provisorios} tom={d.cadastros.provisorios ? "atencao" : "ok"} legenda={<Link to="/pendencias" className="hover:underline">revisar pendências</Link>} />
            </Metricas>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Cartao titulo="Faturamento e repasse, últimos 12 meses">
                <BarChart
                  categorias={d.serie.map((s) => competenciaCurta(s.competencia).slice(0, 3))}
                  series={[
                    { key: "nf", label: "Valor das notas", color: "#1d4ed8", data: d.serie.map((s) => s.valorNf) },
                    { key: "repasse", label: "Repasse", color: "#7cc4ff", data: d.serie.map((s) => s.repasse) },
                  ]}
                  altura={200}
                  formatarValor={moedaCurta}
                />
              </Cartao>
              <Cartao titulo="Contas que vencem em 7 dias" acao={<Link to="/contas?aba=pagar" className="text-sm font-medium text-marca hover:underline">Ver contas</Link>}>
                {d.proximasContas.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Nenhuma conta a pagar vence nos próximos 7 dias.</p>
                ) : (
                  <ul className="divide-y divide-borda">
                    {d.proximasContas.map((c) => (
                      <li key={c.id}>
                        <Link to={`/contas/${c.id}`} className="flex items-center gap-3 py-2 text-sm hover:bg-[var(--areia)]">
                          <span className="w-20 shrink-0 tabular-nums text-foreground-secondary">{formatarData(c.dataVencimento)}</span>
                          <span className="min-w-0 flex-1 truncate">{c.descricao}</span>
                          <span className="shrink-0 tabular-nums font-medium">{formatarMoeda(c.valor)}</span>
                          <BadgeSituacaoConta status={c.status} dataVencimento={c.dataVencimento} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Cartao>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Cartao titulo="Prestadores com mais repasse (12 meses)">
                {d.topPrestadores.length ? <RankedBars itens={d.topPrestadores.map((l) => ({ label: l.nome, sublabel: `${l.quantidade} notas`, valor: l.repasse }))} corBarra="#1d4ed8" formatarValor={formatarMoeda} /> : <p className="text-sm text-foreground-muted">Nenhuma nota nos últimos 12 meses.</p>}
              </Cartao>
              <Cartao titulo="Clientes com mais faturamento (12 meses)">
                {d.topClientes.length ? <RankedBars itens={d.topClientes.map((l) => ({ label: l.nome, sublabel: `${l.quantidade} notas`, valor: l.valorNf }))} corBarra="#2563eb" formatarValor={formatarMoeda} /> : <p className="text-sm text-foreground-muted">Nenhuma nota nos últimos 12 meses.</p>}
              </Cartao>
            </div>
          </>
        )}
      </EstadoCarga>
    </div>
  );
}
