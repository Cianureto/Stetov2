import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, CalendarClock, Clock, Download, FileText, FileX, HandCoins, Landmark, Percent, Receipt, UserRound } from "lucide-react";
import type { OpcaoApi, Relatorio } from "@/api/types";
import { EstadoCarga } from "@/components/EstadoCarga";
import { CartaoIndicador, SeloVariacao } from "@/components/relatorios/CartaoIndicador";
import { BarraSegmentada, BarrasRotuladas, GraficoArea, GraficoColunas } from "@/components/relatorios/graficos";
import { TabelaTomadores } from "@/components/relatorios/TabelaTomadores";
import { Button } from "@/components/ui/button";
import { CampoMesAno } from "@/components/ui/campo-mes-ano";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Segmentos } from "@/components/ui/segmentos";
import { Seletor } from "@/components/ui/seletor";
import { Skeleton } from "@/components/ui/skeleton";
import { useDadosApi } from "@/hooks/useDadosApi";
import { hojeBrasilia } from "@/lib/contas";
import { baixarCsv } from "@/lib/csv";
import { formatarDocumento, formatarMoeda, formatarMoedaCurta, formatarPercentualCurto, variacaoPercentual } from "@/lib/format";
import { rotuloMesEixo, rotuloPeriodo, somarMeses } from "@/lib/graficos";
import { competenciaParaBanco, competenciaParaTela } from "@/lib/repasse";

// Cores dos gráficos (validadas para daltonismo e contraste com o script da skill de visualização):
// dois azuis da marca para faturamento × repasse; âmbar para o que está pendente; ciano para contas a pagar.
// Retenções: azul, ciano e violeta (validados como conjunto, nessa ordem de empilhamento).
const COR = { nf: "#1d4ed8", repasse: "#5fa8f5", pago: "#1d4ed8", pendente: "#e9a000", receber: "#1d4ed8", pagar: "#22b8cf", descontoAdicional: "#9db4d6", iss: "#1d4ed8", ir: "#22b8cf", csrf: "#7c5ce0" };

const FAIXAS = ["Do mês atual", "1 mês", "2 meses", "3 a 5 meses", "6 meses ou mais"];

type Preset = { id: string; label: string; de: string; ate: string };
function presets(): Preset[] {
  const mes = `${hojeBrasilia().slice(0, 7)}-01`;
  const ano = Number(mes.slice(0, 4));
  return [
    { id: "mes", label: "Este mês", de: mes, ate: mes },
    { id: "3m", label: "3 meses", de: somarMeses(mes, -2), ate: mes },
    { id: "ano", label: "Este ano", de: `${ano}-01-01`, ate: mes },
    { id: "12m", label: "12 meses", de: somarMeses(mes, -11), ate: mes },
    { id: "anoPassado", label: String(ano - 1), de: `${ano - 1}-01-01`, ate: `${ano - 1}-12-01` },
  ];
}

const pct = (parte: number, todo: number) => (todo ? (parte / todo) * 100 : 0);
const notas = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "nota" : "notas"}`;

function Cartao({ titulo, descricao, acao, children, className, id }: { titulo: string; descricao?: string; acao?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`card min-w-0 scroll-mt-24 p-4 md:p-5 ${className ?? ""}`} aria-label={titulo}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="texto-titulo-3">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-xs text-foreground-muted">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Número de destaque no topo de um cartão de gráfico (como o "Total" do modelo), com variação opcional. */
function Destaque({ valor, rotulo, variacao, subirEBom }: { valor: string; rotulo: string; variacao?: number | null; subirEBom?: boolean | null }) {
  return (
    <div className="mb-4">
      <div className="numero-kpi">{valor}</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
        {variacao !== undefined && <SeloVariacao variacao={variacao} subirEBom={subirEBom} />}
        {rotulo}
      </div>
    </div>
  );
}

/** /relatorios — relatório completo de um período de competências, por empresa contábil ou de todas. */
export default function RelatoriosPage() {
  const opcoesPeriodo = useMemo(() => presets(), []);
  const [params, setParams] = useSearchParams();
  const padrao = opcoesPeriodo.find((p) => p.id === "ano")!;
  const de = competenciaParaBanco(competenciaParaTela(params.get("de"))) ?? padrao.de;
  const ate = competenciaParaBanco(competenciaParaTela(params.get("ate"))) ?? padrao.ate;
  const empresa = params.get("empresa") ?? "";
  const presetAtual = opcoesPeriodo.find((p) => p.de === de && p.ate === ate)?.id ?? null;

  const [rascunho, setRascunho] = useState({ de: competenciaParaTela(de), ate: competenciaParaTela(ate), empresa });
  const [erroPeriodo, setErroPeriodo] = useState<string | null>(null);
  // O formulário acompanha a URL (voltar do navegador, link compartilhado, atalho de período): ajuste
  // durante a renderização, sem efeito.
  const chaveFiltros = `${de}|${ate}|${empresa}`;
  const [filtrosDoRascunho, setFiltrosDoRascunho] = useState(chaveFiltros);
  if (filtrosDoRascunho !== chaveFiltros) {
    setFiltrosDoRascunho(chaveFiltros);
    setRascunho({ de: competenciaParaTela(de), ate: competenciaParaTela(ate), empresa });
  }

  const empresas = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const caminho = `/relatorios?${new URLSearchParams(empresa ? { de, ate, empresaContabil: empresa } : { de, ate })}`;
  const carga = useDadosApi<Relatorio>(caminho, "Não foi possível carregar o relatório.");
  const nomeEmpresa = empresas.dados?.find((e) => e.valor === empresa)?.rotulo;

  /** Grava o período e a empresa na URL de uma vez (link compartilhável). */
  function aplicarFiltros(novo: { de: string; ate: string; empresa: string }) {
    const p = new URLSearchParams(params);
    p.set("de", novo.de);
    p.set("ate", novo.ate);
    if (novo.empresa) p.set("empresa", novo.empresa);
    else p.delete("empresa");
    setParams(p, { replace: true, preventScrollReset: true });
  }

  function aplicar() {
    const novoDe = competenciaParaBanco(rascunho.de);
    const novoAte = competenciaParaBanco(rascunho.ate);
    if (!novoDe || !novoAte) return setErroPeriodo("Use MM/AAAA nos dois campos do período.");
    if (novoDe > novoAte) return setErroPeriodo("O início do período vem depois do fim.");
    if (novoDe < somarMeses(novoAte, -59)) return setErroPeriodo("Escolha um período de até 60 meses.");
    setErroPeriodo(null);
    aplicarFiltros({ de: novoDe, ate: novoAte, empresa: rascunho.empresa });
  }

  const d = carga.dados;
  const sufixo = `${de.slice(0, 7)}-a-${ate.slice(0, 7)}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="texto-sobretitulo">Relatórios</p>
          <h1 className="texto-titulo-1 mt-1">Relatório do período</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Competências de {rotuloPeriodo(de, ate)} · {nomeEmpresa ?? "todas as empresas contábeis"}
            {d && <> · comparado a {rotuloPeriodo(d.periodo.anteriorDe, d.periodo.anteriorAte)}</>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={!d}>
              <Download aria-hidden /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Planilhas (CSV)</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => d && baixarCsv(`resumo-mensal-${sufixo}`, planilhaMensal(d))}>
              <FileText aria-hidden className="size-4" /> Resumo mês a mês
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!d?.clientes.length} onSelect={() => d && baixarCsv(`retencoes-por-tomador-${sufixo}`, planilhaTomadores(d))}>
              <Building2 aria-hidden className="size-4" /> Retenções por tomador
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!d?.prestadores.length} onSelect={() => d && baixarCsv(`repasses-por-prestador-${sufixo}`, planilhaPrestadores(d))}>
              <UserRound aria-hidden className="size-4" /> Repasses por prestador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); aplicar(); }} aria-label="Filtros do relatório">
        <div className="w-full xl:w-auto">
          <span className="mb-1.5 block text-[13px] font-medium text-foreground-secondary">Período</span>
          <Segmentos
            opcoes={opcoesPeriodo.map((p) => ({ id: p.id, label: p.label }))}
            valor={presetAtual}
            onChange={(id) => {
              const p = opcoesPeriodo.find((x) => x.id === id)!;
              setErroPeriodo(null);
              aplicarFiltros({ de: p.de, ate: p.ate, empresa: rascunho.empresa });
            }}
          />
        </div>
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

      <EstadoCarga
        carga={carga}
        esqueleto={
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        }
      >
        {(r) => <Conteudo r={r} filtrandoEmpresa={!!empresa} />}
      </EstadoCarga>
    </div>
  );
}

function Conteudo({ r, filtrandoEmpresa }: { r: Relatorio; filtrandoEmpresa: boolean }) {
  const { atual: a, anterior: ant, serie } = r;
  const variosAnos = r.periodo.de.slice(0, 4) !== r.periodo.ate.slice(0, 4);
  const meses = serie.map((p) => rotuloMesEixo(p.competencia, variosAnos));
  const comparacao = `vs. ${rotuloPeriodo(r.periodo.anteriorDe, r.periodo.anteriorAte)}`;
  const retido = a.valorNf - a.repasse;
  const retidoAnt = ant.valorNf - ant.repasse;
  const csrf = r.tributos.pis + r.tributos.cofins + r.tributos.csll;
  const retencoes = [
    { chave: "iss", rotulo: "ISS", valor: r.tributos.iss, detalhe: "recolhido ao município" },
    { chave: "ir", rotulo: "IRRF", valor: r.tributos.ir, detalhe: "imposto de renda retido na fonte" },
    { chave: "csrf", rotulo: "CSRF", valor: csrf, detalhe: `PIS ${formatarMoedaCurta(r.tributos.pis)} · COFINS ${formatarMoedaCurta(r.tributos.cofins)} · CSLL ${formatarMoedaCurta(r.tributos.csll)}` },
  ];
  const pendenteTotal = r.envelhecimento.reduce((t, f) => t + f.valor, 0);
  const pendentesAntigos = r.envelhecimento.filter((f) => f.faixa >= 3).reduce((t, f) => t + f.valor, 0);
  const contas = r.contas.resumo;
  const mostrarEmpresas = !filtrandoEmpresa && r.empresas.length > 1;

  if (a.quantidade === 0 && contas.quantidade === 0) {
    return (
      <div className="card px-6 py-14 text-center">
        <p className="font-titulo text-lg font-semibold">Nenhuma nota nem conta no período</p>
        <p className="mt-1 text-sm text-foreground-muted">Escolha outro período ou outra empresa contábil nos filtros acima.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicadores principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <CartaoIndicador
          principal
          className="sm:col-span-3 xl:col-span-2"
          icone={Receipt}
          titulo="Faturamento (valor das notas)"
          valor={formatarMoeda(a.valorNf)}
          variacao={variacaoPercentual(a.valorNf, ant.valorNf)}
          comparacao={comparacao}
          nota={`${notas(a.quantidade)} emitidas`}
          tendencia={serie.map((p) => p.valorNf)}
        />
        <CartaoIndicador
          ordem={1}
          icone={HandCoins}
          titulo="Repasse aos prestadores"
          valor={formatarMoeda(a.repasse)}
          variacao={variacaoPercentual(a.repasse, ant.repasse)}
          comparacao={comparacao}
          nota={`${formatarPercentualCurto(pct(a.repasse, a.valorNf))} do faturamento`}
          tendencia={serie.map((p) => p.repasse)}
        />
        <CartaoIndicador
          ordem={2}
          icone={Percent}
          titulo="Descontos retidos"
          valor={formatarMoeda(retido)}
          variacao={variacaoPercentual(retido, retidoAnt)}
          comparacao={comparacao}
          nota={`${formatarPercentualCurto(pct(retido, a.valorNf))} do faturamento`}
          tendencia={serie.map((p) => p.valorNf - p.repasse)}
          ajuda="Valor das notas menos o repasse: desconto padrão do prestador e descontos adicionais, já abatidos os acréscimos."
        />
        <CartaoIndicador
          ordem={3}
          icone={Landmark}
          titulo="Tributos retidos"
          valor={formatarMoeda(a.tributos)}
          variacao={variacaoPercentual(a.tributos, ant.tributos)}
          subirEBom={null}
          comparacao={comparacao}
          nota={`carga efetiva de ${formatarPercentualCurto(pct(a.tributos, a.valorNf))}`}
          tendencia={serie.map((p) => p.tributos)}
          ajuda="ISS, IRRF, PIS, COFINS e CSLL retidos pelos tomadores nas notas. São informativos: não saem do repasse."
        />
      </div>

      {/* Números de apoio */}
      <div className="card grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-borda">
        {[
          { icone: FileText, rotulo: "Notas emitidas", valor: a.quantidade.toLocaleString("pt-BR"), variacao: variacaoPercentual(a.quantidade, ant.quantidade), subirEBom: true as boolean | null },
          { icone: FileX, rotulo: "Notas canceladas", valor: r.canceladas.quantidade ? `${r.canceladas.quantidade} · ${formatarMoedaCurta(r.canceladas.valorNf)}` : "Nenhuma", variacao: null, subirEBom: false },
          { icone: Clock, rotulo: "Repasses pendentes", valor: `${a.pendentes} · ${formatarMoedaCurta(a.repassePendente)}`, variacao: variacaoPercentual(a.repassePendente, ant.repassePendente), subirEBom: false },
          {
            icone: CalendarClock,
            rotulo: "Prazo médio de repasse",
            valor: a.prazoMedioDias === null ? "—" : `${a.prazoMedioDias.toLocaleString("pt-BR")} dias`,
            variacao: a.prazoMedioDias !== null && ant.prazoMedioDias ? variacaoPercentual(a.prazoMedioDias, ant.prazoMedioDias) : null,
            subirEBom: false,
          },
        ].map((m) => (
          <div key={m.rotulo} className="flex items-center gap-3 p-4 md:px-5">
            <m.icone aria-hidden className="size-5 shrink-0 text-foreground-muted" />
            <div className="min-w-0">
              <div className="truncate text-xs text-foreground-muted">{m.rotulo}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold">{m.valor}</span>
                <SeloVariacao variacao={m.variacao} subirEBom={m.subirEBom} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faturamento e pendências */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Cartao titulo="Faturamento e repasse" descricao="Valor das notas e repasse aos prestadores, por competência" className="lg:col-span-2">
          <GraficoArea
            titulo="Faturamento e repasse por mês"
            categorias={meses}
            series={[
              { chave: "nf", rotulo: "Valor das notas", cor: COR.nf, dados: serie.map((p) => p.valorNf) },
              { chave: "repasse", rotulo: "Repasse", cor: COR.repasse, dados: serie.map((p) => p.repasse) },
            ]}
            formatarValor={formatarMoeda}
            formatarEixo={formatarMoedaCurta}
          />
        </Cartao>
        <Cartao titulo="Pendências por idade" descricao="Repasses ainda não pagos, pelo tempo desde a competência">
          <Destaque
            valor={formatarMoeda(pendenteTotal)}
            rotulo={`${notas(a.pendentes)} pendentes${pendentesAntigos ? ` · ${formatarMoedaCurta(pendentesAntigos)} há 3 meses ou mais` : ""}`}
          />
          <BarrasRotuladas
            cor={COR.pendente}
            formatarValor={formatarMoeda}
            itens={r.envelhecimento.map((f) => ({ chave: String(f.faixa), rotulo: FAIXAS[f.faixa], valor: f.valor, detalhe: f.quantidade ? notas(f.quantidade) : "nenhuma" }))}
          />
        </Cartao>
      </div>

      {/* Retenções */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Cartao titulo="Retenções por mês" descricao="Tributos retidos pelos tomadores, por competência" className="lg:col-span-2">
          <GraficoColunas
            titulo="Retenções por mês"
            categorias={meses}
            modo="empilhado"
            series={[
              { chave: "iss", rotulo: "ISS", cor: COR.iss, dados: serie.map((p) => p.iss) },
              { chave: "ir", rotulo: "IRRF", cor: COR.ir, dados: serie.map((p) => p.ir) },
              { chave: "csrf", rotulo: "CSRF (PIS, COFINS, CSLL)", cor: COR.csrf, dados: serie.map((p) => p.csrf) },
            ]}
            formatarValor={formatarMoeda}
            formatarEixo={formatarMoedaCurta}
          />
        </Cartao>
        <Cartao titulo="Retenções por tipo" descricao="Total do período e peso sobre o faturamento">
          <Destaque valor={formatarMoeda(a.tributos)} rotulo={`carga efetiva de ${formatarPercentualCurto(pct(a.tributos, a.valorNf))} sobre o faturamento`} />
          <BarrasRotuladas
            formatarValor={formatarMoeda}
            itens={retencoes.map((t) => ({
              chave: t.chave,
              rotulo: t.rotulo,
              valor: t.valor,
              detalhe: `${formatarPercentualCurto(pct(t.valor, a.valorNf))} do faturamento · ${t.detalhe}`,
            }))}
          />
        </Cartao>
      </div>

      {/* Repasses e composição */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Cartao
          titulo="Repasse pago e pendente"
          descricao="Situação do repasse de cada competência"
          className="lg:col-span-2"
          acao={
            <dl className="flex gap-5 text-right">
              <div>
                <dt className="text-xs text-foreground-muted">Pago</dt>
                <dd className="text-sm font-semibold tabular-nums">{formatarMoedaCurta(a.repassePago)} <span className="font-normal text-foreground-muted">· {formatarPercentualCurto(pct(a.repassePago, a.repasse))}</span></dd>
              </div>
              <div>
                <dt className="text-xs text-foreground-muted">Pendente</dt>
                <dd className="text-sm font-semibold tabular-nums">{formatarMoedaCurta(a.repassePendente)}</dd>
              </div>
            </dl>
          }
        >
          <GraficoColunas
            titulo="Repasse pago e pendente por mês"
            categorias={meses}
            modo="empilhado"
            series={[
              { chave: "pago", rotulo: "Pago", cor: COR.pago, dados: serie.map((p) => p.repassePago) },
              { chave: "pendente", rotulo: "Pendente", cor: COR.pendente, dados: serie.map((p) => p.repassePendente) },
            ]}
            formatarValor={formatarMoeda}
            formatarEixo={formatarMoedaCurta}
          />
        </Cartao>

        <Cartao titulo="Para onde vai o faturamento" descricao="Como o valor das notas se divide">
          <BarraSegmentada
            rotulo="Divisão do faturamento"
            partes={[
              { rotulo: "Repasse", valor: a.repasse, cor: COR.nf },
              { rotulo: "Desconto padrão", valor: r.descontos.padrao, cor: COR.repasse, textoClaro: false },
              { rotulo: "Descontos adicionais", valor: r.descontos.adicional, cor: COR.descontoAdicional, textoClaro: false },
            ]}
          />
          <dl className="mt-5 divide-y divide-borda text-sm">
            {[
              { rotulo: "Valor das notas", valor: a.valorNf, forte: true },
              { rotulo: "Desconto padrão", valor: -r.descontos.padrao },
              { rotulo: "Descontos adicionais", valor: -r.descontos.adicional },
              { rotulo: "Acréscimos", valor: r.descontos.acrescimo },
              { rotulo: "Repasse aos prestadores", valor: a.repasse, forte: true },
            ].map((l) => (
              <div key={l.rotulo} className="flex items-center justify-between gap-3 py-2">
                <dt className={l.forte ? "font-medium text-foreground" : "text-foreground-secondary"}>{l.rotulo}</dt>
                <dd className={`tabular-nums ${l.forte ? "font-semibold" : ""}`}>
                  {l.valor < 0 ? "− " : !l.forte && l.valor > 0 ? "+ " : ""}
                  {formatarMoeda(Math.abs(l.valor))}
                </dd>
              </div>
            ))}
          </dl>
        </Cartao>
      </div>

      {/* Contas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Cartao titulo="Contas a pagar e a receber" descricao="Pelo mês de vencimento" className="lg:col-span-2">
          <dl className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { rotulo: "A pagar", valor: formatarMoeda(contas.pagar), nota: `${formatarMoedaCurta(contas.pagas)} já pago` },
              { rotulo: "A receber", valor: formatarMoeda(contas.receber), nota: `${formatarMoedaCurta(contas.recebidas)} recebido` },
              { rotulo: "Saldo previsto", valor: formatarMoeda(contas.receber - contas.pagar), nota: "receber − pagar" },
              { rotulo: "Vencidas", valor: formatarMoeda(contas.valorVencido), nota: `${contas.vencidas} ${contas.vencidas === 1 ? "conta" : "contas"}`, alerta: contas.vencidas > 0 },
            ].map((m) => (
              <div key={m.rotulo}>
                <dt className="text-xs text-foreground-muted">{m.rotulo}</dt>
                <dd className={`mt-0.5 text-base font-semibold ${m.alerta ? "text-[var(--danger)]" : ""}`}>{m.valor}</dd>
                <dd className="text-xs text-foreground-muted">{m.nota}</dd>
              </div>
            ))}
          </dl>
          {contas.quantidade ? (
            <GraficoColunas
              titulo="Contas a pagar e a receber por mês de vencimento"
              categorias={meses}
              series={[
                { chave: "receber", rotulo: "A receber", cor: COR.receber, dados: r.contas.serie.map((p) => p.receber) },
                { chave: "pagar", rotulo: "A pagar", cor: COR.pagar, dados: r.contas.serie.map((p) => p.pagar) },
              ]}
              altura={230}
              formatarValor={formatarMoeda}
              formatarEixo={formatarMoedaCurta}
            />
          ) : (
            <p className="text-sm text-foreground-muted">Nenhuma conta vence no período.</p>
          )}
        </Cartao>
        <Cartao titulo="Despesas por categoria" descricao="Contas a pagar que vencem no período">
          <BarrasRotuladas
            cor={COR.pagar}
            formatarValor={formatarMoeda}
            vazio="Nenhuma conta a pagar no período."
            itens={r.contas.categorias.map((c) => ({ chave: c.nome, rotulo: c.nome, valor: c.valor, detalhe: `${formatarPercentualCurto(pct(c.valor, contas.pagar))} das despesas · ${c.quantidade} ${c.quantidade === 1 ? "conta" : "contas"}` }))}
          />
        </Cartao>
      </div>

      {/* Retenções por tomador */}
      <Cartao
        titulo="Retenções por tomador"
        descricao="O que cada hospital/cliente reteve nas notas do período, para conferir com os informes de retenção"
        acao={<Button variant="secondary" size="sm" disabled={!r.clientes.length} onClick={() => baixarCsv(`retencoes-por-tomador-${r.periodo.de.slice(0, 7)}-a-${r.periodo.ate.slice(0, 7)}`, planilhaTomadores(r))}><Download aria-hidden /> CSV</Button>}
      >
        <TabelaTomadores linhas={r.clientes} />
      </Cartao>

      {mostrarEmpresas && (
        <Cartao titulo="Por empresa contábil" descricao="Valor das notas e fatia do faturamento">
          <BarrasRotuladas
            className="grid gap-5 space-y-0 md:grid-cols-2 xl:grid-cols-3"
            formatarValor={formatarMoeda}
            max={a.valorNf}
            itens={r.empresas.map((e) => ({ chave: e.id, rotulo: e.nome, valor: e.valorNf, detalhe: `${formatarPercentualCurto(pct(e.valorNf, a.valorNf))} do total · ${notas(e.quantidade)} · repasse ${formatarMoedaCurta(e.repasse)}` }))}
          />
        </Cartao>
      )}

      {/* Mês a mês */}
      <Cartao
        titulo="Resumo mês a mês"
        descricao="Os mesmos números dos gráficos, por competência"
        acao={<Button variant="secondary" size="sm" onClick={() => baixarCsv(`resumo-mensal-${r.periodo.de.slice(0, 7)}-a-${r.periodo.ate.slice(0, 7)}`, planilhaMensal(r))}><Download aria-hidden /> CSV</Button>}
      >
        <div className="-mx-4 overflow-x-auto md:-mx-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-y border-borda bg-[var(--areia)] text-left text-xs text-foreground-muted">
                <th scope="col" className="px-4 py-2.5 font-medium md:px-5">Competência</th>
                {["Notas", "Valor das notas", "ISS", "IRRF", "CSRF", "Repasse", "Pendente"].map((t) => (
                  <th key={t} scope="col" className="px-3 py-2.5 text-right font-medium last:pr-4 md:last:pr-5">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {serie.map((p) => (
                <tr key={p.competencia} className="border-b border-borda last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-medium md:px-5">{competenciaParaTela(p.competencia)}</th>
                  <td className="px-3 py-2 text-right">{p.quantidade}</td>
                  <td className="px-3 py-2 text-right">{formatarMoeda(p.valorNf)}</td>
                  <td className="px-3 py-2 text-right">{formatarMoeda(p.iss)}</td>
                  <td className="px-3 py-2 text-right">{formatarMoeda(p.ir)}</td>
                  <td className="px-3 py-2 text-right">{formatarMoeda(p.csrf)}</td>
                  <td className="px-3 py-2 text-right">{formatarMoeda(p.repasse)}</td>
                  <td className={`px-3 py-2 pr-4 text-right md:pr-5 ${p.repassePendente ? "text-[var(--aviso)]" : ""}`}>{formatarMoeda(p.repassePendente)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="tabular-nums">
              <tr className="border-t-2 border-borda font-semibold">
                <th scope="row" className="px-4 py-2.5 text-left md:px-5">Total</th>
                <td className="px-3 py-2.5 text-right">{a.quantidade}</td>
                <td className="px-3 py-2.5 text-right">{formatarMoeda(a.valorNf)}</td>
                <td className="px-3 py-2.5 text-right">{formatarMoeda(r.tributos.iss)}</td>
                <td className="px-3 py-2.5 text-right">{formatarMoeda(r.tributos.ir)}</td>
                <td className="px-3 py-2.5 text-right">{formatarMoeda(csrf)}</td>
                <td className="px-3 py-2.5 text-right">{formatarMoeda(a.repasse)}</td>
                <td className="px-3 py-2.5 pr-4 text-right md:pr-5">{formatarMoeda(a.repassePendente)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Cartao>
    </div>
  );
}

const planilhaPrestadores = (r: Relatorio) =>
  r.prestadores.map((l) => ({ Prestador: l.nome, Notas: l.quantidade, "Valor das notas": l.valorNf, Repasse: l.repasse, Pago: l.repassePago, Pendente: l.repassePendente }));

const planilhaTomadores = (r: Relatorio) =>
  r.clientes.map((l) => ({
    Tomador: l.nome,
    "CNPJ/CPF": formatarDocumento(l.documento),
    Notas: l.quantidade,
    "Valor das notas": l.valorNf,
    ISS: l.iss,
    IRRF: l.ir,
    CSRF: l.csrf,
    "Total retido": l.tributos,
  }));

const planilhaMensal = (r: Relatorio) =>
  r.serie.map((p, i) => ({
    "Competência": competenciaParaTela(p.competencia),
    Notas: p.quantidade,
    "Valor das notas": p.valorNf,
    ISS: p.iss,
    IRRF: p.ir,
    "CSRF (PIS+COFINS+CSLL)": p.csrf,
    "Total retido": p.tributos,
    Repasse: p.repasse,
    "Descontos retidos": Math.round((p.valorNf - p.repasse) * 100) / 100,
    Pago: p.repassePago,
    Pendente: p.repassePendente,
    "Contas a pagar": r.contas.serie[i]?.pagar ?? 0,
    "Contas a receber": r.contas.serie[i]?.receber ?? 0,
  }));
