import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { LinhaRanking, OpcaoApi, Relatorio } from "@/api/types";
import { BarChart } from "@/components/charts";
import { EstadoCarga } from "@/components/EstadoCarga";
import { TabelaRanking } from "@/components/relatorios/TabelaRanking";
import { Button } from "@/components/ui/button";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";
import { CampoMesAno } from "@/components/ui/campo-mes-ano";
import { Label } from "@/components/ui/label";
import { Seletor } from "@/components/ui/seletor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useParametroUrl } from "@/hooks/useParametroUrl";
import { hojeBrasilia } from "@/lib/contas";
import { baixarCsv } from "@/lib/csv";
import { formatarMoeda } from "@/lib/format";
import { competenciaCurta, competenciaParaBanco, competenciaParaTela } from "@/lib/repasse";

const inicioDoAno = () => `${hojeBrasilia().slice(0, 4)}-01-01`;
const mesAtual = () => `${hojeBrasilia().slice(0, 7)}-01`;

const planilhaRanking = (linhas: LinhaRanking[], rotulo: string) =>
  linhas.map((l) => ({ [rotulo]: l.nome, Notas: l.quantidade, "Valor das notas": l.valorNf, Repasse: l.repasse, Pago: l.repassePago, Pendente: l.repassePendente }));

/** /relatorios — totais e rankings de um período de competências, por empresa contábil. */
export default function RelatoriosPage() {
  // O período fica na URL (link compartilhável); os campos só valem ao aplicar.
  const [de, setDe] = useParametroUrl<string>("de", inicioDoAno());
  const [ate, setAte] = useParametroUrl<string>("ate", mesAtual());
  const [empresa, setEmpresa] = useParametroUrl<string>("empresa", "");
  const [rascunho, setRascunho] = useState({ de: competenciaParaTela(de), ate: competenciaParaTela(ate), empresa });
  const [erroPeriodo, setErroPeriodo] = useState<string | null>(null);
  const empresas = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const caminho = useMemo(() => `/relatorios?${new URLSearchParams(empresa ? { de, ate, empresaContabil: empresa } : { de, ate })}`, [de, ate, empresa]);
  const carga = useDadosApi<Relatorio>(caminho, "Não foi possível carregar o relatório.");
  const r = carga.dados?.resumo;
  const nomeEmpresa = empresas.dados?.find((e) => e.valor === empresa)?.rotulo;

  function aplicar() {
    const novoDe = competenciaParaBanco(rascunho.de);
    const novoAte = competenciaParaBanco(rascunho.ate);
    if (!novoDe || !novoAte) return setErroPeriodo("Use MM/AAAA nos dois campos do período.");
    if (novoDe > novoAte) return setErroPeriodo("O início do período vem depois do fim.");
    setErroPeriodo(null);
    setDe(novoDe);
    setAte(novoAte);
    setEmpresa(rascunho.empresa);
  }

  return (
    <div className="space-y-6">
      <CabecalhoHero
        falhou={!!carga.erro && !r}
        atualizando={carga.carregando && !!r}
        rotulo={`Relatórios · ${competenciaCurta(de)} a ${competenciaCurta(ate)}${nomeEmpresa ? ` · ${nomeEmpresa}` : ""}`}
        titulo="Relatório do período"
        descricao="Totais e rankings das notas com competência no período escolhido. Registros cancelados não entram no repasse."
        numeros={[
          { valor: r ? formatarMoeda(r.valorNf) : undefined, rotulo: "Valor das notas", nota: r ? `${r.quantidade} notas` : undefined },
          { valor: r ? formatarMoeda(r.repasse) : undefined, rotulo: "Repasse total" },
          { valor: r ? formatarMoeda(r.repassePago) : undefined, rotulo: "Pago", destaque: "text-realce" },
          { valor: r ? formatarMoeda(r.repassePendente) : undefined, rotulo: "Pendente", destaque: "text-[var(--acafrao)]" },
        ]}
      />

      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); aplicar(); }}>
        <div className="w-32">
          <Label htmlFor="rel-de">De</Label>
          <CampoMesAno id="rel-de" valor={rascunho.de} onChange={(v) => setRascunho((x) => ({ ...x, de: v }))} invalido={!!erroPeriodo} />
        </div>
        <div className="w-32">
          <Label htmlFor="rel-ate">Até</Label>
          <CampoMesAno id="rel-ate" valor={rascunho.ate} onChange={(v) => setRascunho((x) => ({ ...x, ate: v }))} invalido={!!erroPeriodo} />
        </div>
        <div className="min-w-56 flex-1">
          <Label htmlFor="rel-empresa">Empresa contábil</Label>
          <Seletor id="rel-empresa" rotulo="Empresa contábil" opcaoVazia="Todas as empresas" pesquisavel valor={rascunho.empresa} onChange={(v) => setRascunho((x) => ({ ...x, empresa: v }))} opcoes={empresas.dados ?? []} />
        </div>
        <Button type="submit" variant="accent">Aplicar</Button>
        {erroPeriodo && <p role="alert" className="w-full text-sm text-[var(--danger)]">{erroPeriodo}</p>}
      </form>

      <EstadoCarga carga={carga} esqueleto={<Skeleton className="h-80 w-full rounded-2xl" />}>
        {(d) => (
          <div className="space-y-6">
            {d.serie.length > 1 && (
              <section className="card p-4 md:p-5">
                <h2 className="mb-3 font-titulo text-[15px] font-semibold">Mês a mês</h2>
                <BarChart
                  categorias={d.serie.map((s) => competenciaCurta(s.competencia))}
                  series={[{ key: "nf", label: "Valor das notas", color: "#1d4ed8", data: d.serie.map((s) => s.valorNf) }, { key: "repasse", label: "Repasse", color: "#7cc4ff", data: d.serie.map((s) => s.repasse) }]}
                  altura={200}
                  formatarValor={formatarMoeda}
                />
              </section>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={!d.prestadores.length} onClick={() => baixarCsv(`repasses-por-prestador-${de.slice(0, 7)}-a-${ate.slice(0, 7)}`, planilhaRanking(d.prestadores, "Prestador"))}><Download aria-hidden /> Prestadores (CSV)</Button>
              <Button variant="secondary" disabled={!d.clientes.length} onClick={() => baixarCsv(`faturamento-por-cliente-${de.slice(0, 7)}-a-${ate.slice(0, 7)}`, planilhaRanking(d.clientes, "Cliente"))}><Download aria-hidden /> Clientes (CSV)</Button>
            </div>
            <div className="grid gap-6 min-[1800px]:grid-cols-2">
              <TabelaRanking titulo="Por prestador" rotuloNome="Prestador" linhas={d.prestadores} vazio="Nenhuma nota no período." />
              <TabelaRanking titulo="Por cliente" rotuloNome="Cliente" linhas={d.clientes} vazio="Nenhuma nota no período." />
            </div>
          </div>
        )}
      </EstadoCarga>
    </div>
  );
}
