import { useState, type ReactNode } from "react";
import { Download, Plus, Receipt, RotateCcw, Search, Trash2 } from "lucide-react";
import { CartaoIndicador } from "@/components/relatorios/CartaoIndicador";
import { BarrasRotuladas, GraficoColunas } from "@/components/relatorios/graficos";
import { AbasContagem } from "@/components/tabela/AbasContagem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmentos } from "@/components/ui/segmentos";
import { Seletor } from "@/components/ui/seletor";
import { Switch } from "@/components/ui/switch";
import { formatarMoeda, formatarMoedaCurta } from "@/lib/format";

// Página viva do design system: tudo aqui usa os mesmos tokens (index.css) e componentes do app, então o que
// aparece é exatamente o que as telas mostram. Os valores das cores são lidos das variáveis CSS na hora.

const AZUL = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const TINTA = ["0", "25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
const ESTADOS = [
  { nome: "Sucesso", forte: "--sucesso", suave: "--sucesso-soft", uso: "pago, ativo, concluído" },
  { nome: "Aviso", forte: "--aviso", suave: "--aviso-soft", uso: "pendente, a revisar" },
  { nome: "Perigo", forte: "--danger", suave: "--danger-soft", uso: "vencido, erro, excluir" },
  { nome: "Info", forte: "--info", suave: "--info-soft", uso: "informação neutra" },
];
const SERIES = ["--serie-1", "--serie-2", "--serie-3", "--serie-4", "--serie-5"];

const TIPOS = [
  { classe: "texto-display", nome: "Display", spec: "Bricolage 600 · 36/42", exemplo: "R$ 2,3 milhões em notas" },
  { classe: "texto-titulo-1", nome: "Título 1", spec: "Bricolage 600 · 28/34 · título da tela", exemplo: "Relatório do período" },
  { classe: "texto-titulo-2", nome: "Título 2", spec: "Bricolage 600 · 20/28 · seções", exemplo: "Contas a pagar e a receber" },
  { classe: "texto-titulo-3", nome: "Título 3", spec: "Bricolage 600 · 15/22 · título de cartão", exemplo: "Retenções por tomador" },
  { classe: "texto-corpo", nome: "Corpo", spec: "Figtree 400 · 14/22", exemplo: "Notas emitidas para os clientes e o repasse de cada uma ao prestador." },
  { classe: "texto-apoio", nome: "Apoio", spec: "Figtree 400 · 13/20 · descrições", exemplo: "Valor das notas e repasse aos prestadores, por competência" },
  { classe: "texto-legenda", nome: "Legenda", spec: "Figtree 400 · 12/16 · notas e eixos", exemplo: "16 notas · vs. out/2026" },
  { classe: "texto-sobretitulo", nome: "Sobretítulo", spec: "Figtree 600 · 11/16 · caixa alta, azul", exemplo: "Financeiro" },
  { classe: "numero-destaque", nome: "Número destaque", spec: "Figtree 600 · 28–36 · o número principal", exemplo: "R$ 267.788,03" },
  { classe: "numero-kpi", nome: "Número KPI", spec: "Figtree 600 · 20–24 · números de cartão", exemplo: "R$ 333.903,98" },
];

const RAIOS = [
  { nome: "xs", v: "--radius-xs", uso: "chips" },
  { nome: "sm", v: "--radius-sm", uso: "botões e campos" },
  { nome: "padrão", v: "--radius", uso: "cartões" },
  { nome: "lg", v: "--radius-lg", uso: "modais" },
];
const SOMBRAS = [
  { nome: "xs", v: "--shadow-xs", uso: "cartões e campos em repouso" },
  { nome: "sm", v: "--shadow-sm", uso: "chip ativo, menus pequenos" },
  { nome: "md", v: "--shadow-md", uso: "cartão clicável no hover" },
  { nome: "lg", v: "--shadow-lg", uso: "KPI no hover, popovers" },
  { nome: "marca", v: "--shadow-marca", uso: "cartão principal (azul)" },
];
const MOVIMENTO = [
  { nome: "--dur-rapida", uso: "cor, opacidade" },
  { nome: "--dur-hover", uso: "hover de botões e campos" },
  { nome: "--dur-media", uso: "KPI subindo no hover" },
  { nome: "--dur-lenta", uso: "entrada, enfeites" },
  { nome: "--ease-saida", uso: "entradas e hover (rápido e assenta)" },
  { nome: "--ease-suave", uso: "transições de estado (= GSAP)" },
];

/** Valor atual de uma variável CSS (para mostrar o hex real do token). */
function useToken(nome: string) {
  const [valor] = useState(() => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(nome).trim()));
  return valor;
}

function Amostra({ variavel, rotulo, alto = false }: { variavel: string; rotulo: string; alto?: boolean }) {
  const hex = useToken(variavel);
  return (
    <div className="min-w-0">
      <div className={`${alto ? "h-16" : "h-12"} rounded-[var(--radius-sm)] ring-1 ring-inset ring-black/5`} style={{ background: `var(${variavel})` }} />
      <div className="mt-1.5 text-xs font-medium text-foreground">{rotulo}</div>
      <div className="font-mono text-[11px] text-foreground-muted">{hex}</div>
    </div>
  );
}

function Secao({ id, titulo, descricao, children }: { id: string; titulo: string; descricao: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4" aria-labelledby={`${id}-titulo`}>
      <div>
        <h2 id={`${id}-titulo`} className="texto-titulo-2">{titulo}</h2>
        <p className="texto-apoio mt-0.5">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

function Quadro({ titulo, children, className }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card p-4 md:p-6 ${className ?? ""}`}>
      {titulo && <h3 className="texto-titulo-3 mb-4">{titulo}</h3>}
      {children}
    </div>
  );
}

const INDICE = [
  ["cores", "Cores"],
  ["tipografia", "Tipografia"],
  ["kpis", "KPIs e movimento"],
  ["botoes", "Botões"],
  ["campos", "Campos"],
  ["badges", "Badges e abas"],
  ["graficos", "Gráficos"],
  ["tokens", "Raios, sombras e tempos"],
];

/** /design-system — referência viva de tokens e componentes do app. */
export default function DesignSystemPage() {
  const [rodada, setRodada] = useState(0);
  const [seg, setSeg] = useState<"mes" | "ano" | "12m">("ano");
  const [aba, setAba] = useState<"" | "pendente" | "pago">("");
  const [sel, setSel] = useState("lp");
  const [moeda, setMoeda] = useState(1500);
  const [ligado, setLigado] = useState(true);

  return (
    <div className="space-y-10">
      <CabecalhoHero
        rotulo="Referência"
        titulo="Design system Steto"
        descricao="Cores, tipografia, componentes e movimento usados em todas as telas. Tudo aqui é o componente real: mudou um token, muda aqui e no app."
      />

      <nav aria-label="Seções do design system" className="flex flex-wrap gap-2">
        {INDICE.map(([id, nome]) => (
          <a key={id} href={`#${id}`} className="rounded-full bg-areia-card px-3.5 py-1.5 text-[13px] font-medium text-foreground-secondary shadow-[var(--shadow-xs)] ring-1 ring-borda transition hover:text-foreground hover:ring-tinta-300">
            {nome}
          </a>
        ))}
      </nav>

      <Secao id="cores" titulo="Cores" descricao="Azul e branco, como o padrão da empresa. Use os papéis (marca, borda, texto) ou as escalas; nunca hex soltos no código.">
        <Quadro titulo="Azul Steto (marca) — 600 é a cor da marca">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
            {AZUL.map((t) => <Amostra key={t} variavel={`--azul-${t}`} rotulo={`azul-${t}`} />)}
          </div>
        </Quadro>
        <Quadro titulo="Tinta (neutros) — texto nunca mais claro que 600">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            {TINTA.map((t) => <Amostra key={t} variavel={`--tinta-${t}`} rotulo={`tinta-${t}`} />)}
          </div>
        </Quadro>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Quadro titulo="Estados — sempre com texto ou ícone, nunca só a cor">
            <div className="grid grid-cols-2 gap-4">
              {ESTADOS.map((e) => (
                <div key={e.nome} className="flex items-center gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] text-xs font-semibold" style={{ background: `var(${e.suave})`, color: `var(${e.forte})` }}>Aa</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{e.nome}</div>
                    <div className="texto-legenda">{e.uso}</div>
                  </div>
                </div>
              ))}
            </div>
          </Quadro>
          <Quadro titulo="Séries de gráfico — nesta ordem, validadas para daltonismo">
            <div className="grid grid-cols-5 gap-3">
              {SERIES.map((v, i) => <Amostra key={v} variavel={v} rotulo={`série ${i + 1}`} alto />)}
            </div>
          </Quadro>
        </div>
      </Secao>

      <Secao id="tipografia" titulo="Tipografia" descricao="Títulos em Bricolage Grotesque; texto e números em Figtree. Uma classe por papel: não monte tamanho, peso e espaçamento à mão.">
        <Quadro>
          <ul className="divide-y divide-borda">
            {TIPOS.map((t) => (
              <li key={t.classe} className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[14rem_minmax(0,1fr)] md:items-baseline md:gap-6">
                <div>
                  <div className="text-sm font-semibold">{t.nome}</div>
                  <code className="text-xs text-azul-700">.{t.classe}</code>
                  <div className="texto-legenda mt-0.5">{t.spec}</div>
                </div>
                <div className={`${t.classe} min-w-0 truncate`}>{t.exemplo}</div>
              </li>
            ))}
          </ul>
        </Quadro>
      </Secao>

      <Secao id="kpis" titulo="KPIs e movimento" descricao="Os cartões entram subindo em cascata e cada algarismo corre de lado até o valor, borrado pela própria velocidade (os da direita correm mais). Com o mouse por cima, o cartão sobe e o ícone gira de leve. Quem pede menos movimento no sistema não vê animação.">
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setRodada((r) => r + 1)}>
            <RotateCcw aria-hidden /> Rever a entrada
          </Button>
        </div>
        <div key={rodada} className="space-y-4">
          <CabecalhoHero
            rotulo="Exemplo"
            titulo="Cabeçalho com números"
            descricao="O primeiro número é o principal da tela (cartão azul); os outros ficam em cartões brancos."
            numeros={[
              { valor: formatarMoeda(267788.03), rotulo: "Faturado no mês", nota: "16 notas" },
              { valor: formatarMoeda(333903.98), rotulo: "Repasses pendentes", tom: "aviso", nota: "23 registros" },
              { valor: formatarMoeda(126890.43), rotulo: "Contas a pagar" },
              { valor: 2, rotulo: "Contas vencidas", tom: "perigo", nota: formatarMoeda(9498.42), notaRuim: true },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <CartaoIndicador principal className="sm:col-span-3 xl:col-span-2" icone={Receipt} titulo="Faturamento (valor das notas)" valor={formatarMoeda(2326553.08)} variacao={12.4} comparacao="vs. fev–dez/2025" nota="162 notas" tendencia={[188, 194, 159, 233, 224, 193, 244, 211, 189, 225, 268]} />
            <CartaoIndicador ordem={1} icone={Receipt} titulo="Repasse aos prestadores" valor={formatarMoeda(2191825.77)} variacao={9.8} comparacao="vs. fev–dez/2025" tendencia={[178, 181, 148, 219, 212, 183, 229, 200, 177, 212, 252]} />
            <CartaoIndicador ordem={2} icone={Receipt} titulo="Descontos retidos" valor={formatarMoeda(134727.31)} variacao={-3.1} comparacao="vs. fev–dez/2025" tendencia={[10, 13, 10, 13, 12, 10, 15, 12, 11, 13, 16]} />
            <CartaoIndicador ordem={3} icone={Receipt} titulo="Tributos retidos" valor={formatarMoeda(169241.08)} variacao={4.2} subirEBom={null} comparacao="vs. fev–dez/2025" tendencia={[13, 17, 14, 16, 14, 9, 19, 15, 14, 18, 21]} />
          </div>
        </div>
      </Secao>

      <Secao id="botoes" titulo="Botões" descricao="Azul (accent) é a ação principal da tela — um por tela. Secundário para o resto; fantasma em barras e tabelas; perigo só para excluir.">
        <Quadro>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent"><Plus aria-hidden /> Novo registro</Button>
              <Button variant="primary">Primário escuro</Button>
              <Button variant="secondary"><Download aria-hidden /> Exportar</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="danger"><Trash2 aria-hidden /> Excluir</Button>
              <Button variant="danger-ghost">Desfazer</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent" size="lg">Grande</Button>
              <Button variant="accent">Médio (padrão)</Button>
              <Button variant="accent" size="sm">Pequeno</Button>
              <Button variant="secondary" size="icon" aria-label="Pesquisar"><Search aria-hidden /></Button>
              <Button variant="accent" disabled>Desabilitado</Button>
            </div>
          </div>
        </Quadro>
      </Secao>

      <Secao id="campos" titulo="Campos" descricao="40px de altura, borda fina, anel azul no foco; erro em vermelho com mensagem embaixo. No celular a fonte vai a 16px (sem zoom do iPhone).">
        <Quadro>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <Label htmlFor="ds-texto">Razão social</Label>
              <Input id="ds-texto" placeholder="Hospital Regional do Vale" />
            </div>
            <div>
              <Label htmlFor="ds-moeda">Valor da NF</Label>
              <CampoMoeda id="ds-moeda" valor={moeda} onChange={setMoeda} />
            </div>
            <div>
              <Label htmlFor="ds-sel">Regime tributário</Label>
              <Seletor id="ds-sel" rotulo="Regime tributário" valor={sel} onChange={setSel} opcoes={[{ valor: "sn", rotulo: "Simples Nacional" }, { valor: "lp", rotulo: "Lucro Presumido" }, { valor: "lr", rotulo: "Lucro Real" }]} />
            </div>
            <div>
              <Label htmlFor="ds-erro">CNPJ</Label>
              <Input id="ds-erro" defaultValue="12.345.678/0001-0" aria-invalid="true" aria-describedby="ds-erro-msg" />
              <p id="ds-erro-msg" className="mt-1.5 text-xs text-[var(--danger)]">CNPJ incompleto.</p>
            </div>
            <div>
              <Label htmlFor="ds-off">Desconto padrão</Label>
              <Input id="ds-off" defaultValue="R$ 0,00" disabled />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch id="ds-switch" checked={ligado} onCheckedChange={setLigado} />
              <Label htmlFor="ds-switch" className="mb-0">Conta recorrente</Label>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-borda pt-5">
            <Segmentos opcoes={[{ id: "mes", label: "Este mês" }, { id: "ano", label: "Este ano" }, { id: "12m", label: "12 meses" }]} valor={seg} onChange={setSeg} />
            <span className="texto-legenda">Controle segmentado: escolha única entre poucas opções (período, visão).</span>
          </div>
        </Quadro>
      </Secao>

      <Secao id="badges" titulo="Badges e abas" descricao="Badge diz o estado de uma linha; a cor acompanha o texto. Abas com contagem filtram listas.">
        <Quadro>
          <div className="flex flex-wrap gap-2">
            <Badge variant="sucesso">Pago</Badge>
            <Badge variant="aviso">Pendente</Badge>
            <Badge variant="perigo">Vencida</Badge>
            <Badge variant="info">A vencer</Badge>
            <Badge variant="marca">Administrador</Badge>
            <Badge variant="neutral">Inativo</Badge>
            <Badge variant="outline">Rascunho</Badge>
            <Badge variant="sucesso" dot>Com ponto</Badge>
          </div>
          <div className="mt-6 border-t border-borda pt-5">
            <AbasContagem
              rotulo="Situação"
              valor={aba}
              onChange={setAba}
              abas={[{ id: "", label: "Todos", total: 177 }, { id: "pendente", label: "Pendentes", total: 23, destaque: true }, { id: "pago", label: "Pagos", total: 153 }]}
            />
          </div>
        </Quadro>
      </Secao>

      <Secao id="graficos" titulo="Gráficos" descricao="Um eixo só, grade fina, cantos arredondados no topo, legenda com 2+ séries e dica ao passar o mouse (ou com as setas do teclado).">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Quadro titulo="Colunas empilhadas" className="lg:col-span-2">
            <GraficoColunas
              titulo="Retenções por mês (exemplo)"
              categorias={["jun", "jul", "ago", "set", "out", "nov"]}
              modo="empilhado"
              series={[
                { chave: "iss", rotulo: "ISS", cor: "#1d4ed8", dados: [3624, 8112, 5766, 5634, 8059, 8458] },
                { chave: "ir", rotulo: "IRRF", cor: "#22b8cf", dados: [1205, 2557, 2115, 1954, 2448, 2980] },
                { chave: "csrf", rotulo: "CSRF", cor: "#7c5ce0", dados: [3734, 7924, 6556, 6055, 7588, 9237] },
              ]}
              altura={220}
              formatarValor={formatarMoeda}
              formatarEixo={formatarMoedaCurta}
            />
          </Quadro>
          <Quadro titulo="Barras com rótulo">
            <BarrasRotuladas
              formatarValor={formatarMoeda}
              itens={[
                { chave: "a", rotulo: "Aluguel", valor: 59500, detalhe: "60,6% das despesas" },
                { chave: "b", rotulo: "Serviços", valor: 17840, detalhe: "18,2% das despesas" },
                { chave: "c", rotulo: "Utilidades", valor: 11411.89, detalhe: "11,6% das despesas" },
              ]}
            />
          </Quadro>
        </div>
      </Secao>

      <Secao id="tokens" titulo="Raios, sombras e tempos" descricao="Poucos valores, sempre os mesmos.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Quadro titulo="Raios">
            <div className="grid grid-cols-2 gap-4">
              {RAIOS.map((r) => (
                <div key={r.v}>
                  <div className="h-14 border-2 border-azul-300 bg-azul-50" style={{ borderRadius: `var(${r.v})` }} />
                  <div className="mt-1.5 text-xs font-medium">{r.nome}</div>
                  <div className="texto-legenda">{r.uso}</div>
                </div>
              ))}
            </div>
          </Quadro>
          <Quadro titulo="Sombras">
            <div className="grid grid-cols-2 gap-4">
              {SOMBRAS.map((s) => (
                <div key={s.v}>
                  <div className="h-14 rounded-[var(--radius)] bg-areia-card" style={{ boxShadow: `var(${s.v})` }} />
                  <div className="mt-2 text-xs font-medium">{s.nome}</div>
                  <div className="texto-legenda">{s.uso}</div>
                </div>
              ))}
            </div>
          </Quadro>
          <Quadro titulo="Tempos e curvas">
            <ul className="space-y-2.5">
              {MOVIMENTO.map((m) => <TokenMovimento key={m.nome} nome={m.nome} uso={m.uso} />)}
            </ul>
          </Quadro>
        </div>
      </Secao>
    </div>
  );
}

function TokenMovimento({ nome, uso }: { nome: string; uso: string }) {
  const valor = useToken(nome);
  return (
    <li className="min-w-0 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <code className="text-xs text-azul-700">{nome}</code>
        <span className="font-mono text-[11px] text-foreground-muted">{valor}</span>
      </div>
      <div className="texto-legenda">{uso}</div>
    </li>
  );
}
