import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EventoAuditoria, ListaAuditoria } from "@/api/types";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Badge } from "@/components/ui/badge";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { ROTULO_ACAO, ROTULO_TABELA, rotuloCampo } from "@/lib/auditoria";
import { cn } from "@/lib/cn";
import type { Coluna } from "@/lib/tabela";

const chave = (e: EventoAuditoria) => String(e.id);
const VARIANTE = { criou: "sucesso", alterou: "info", excluiu: "perigo" } as const;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const valor = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? (v ? "sim" : "não") : typeof v === "object" ? JSON.stringify(v) : String(v));

function Detalhes({ e }: { e: EventoAuditoria }) {
  const [aberto, setAberto] = useState(false);
  if (!e.alteracoes.length) return <span className="text-foreground-muted">—</span>;
  return (
    <div className="min-w-0">
      <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="alvo-toque inline-flex items-center gap-1 text-sm font-medium text-marca hover:underline">
        {e.alteracoes.length} {e.alteracoes.length === 1 ? "campo" : "campos"}
        <ChevronDown className={cn("size-3.5 transition-transform", aberto && "rotate-180")} aria-hidden />
      </button>
      {aberto && (
        <dl className="mt-2 space-y-1 text-[13px]">
          {e.alteracoes.map((a) => (
            <div key={a.campo} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
              <dt className="truncate text-foreground-muted">{rotuloCampo(a.campo)}</dt>
              <dd className="min-w-0 break-words">
                {e.acao === "alterou" && <><span className="text-foreground-muted line-through">{valor(a.antes)}</span> → </>}
                {valor(e.acao === "excluiu" ? a.antes : a.depois)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** /auditoria — quem fez o quê e quando (gravado pelo banco; ninguém edita). */
export default function AuditoriaPage() {
  const tabela = useTabelaServidor<EventoAuditoria, ListaAuditoria>("/auditoria", "eventos", { ordemPadrao: "-quando", naUrl: "", mensagemFalha: "Não foi possível carregar a auditoria." });
  const colunas = useMemo<Coluna<EventoAuditoria>[]>(() => [
    { chave: "quando", titulo: "Quando", filtro: { tipo: "data" }, ordemInicial: "desc", render: (e) => quando(e.quando), className: "whitespace-nowrap tabular-nums text-foreground-secondary" },
    { chave: "usuarioEmail", titulo: "Quem", filtro: { tipo: "texto" }, render: (e) => e.usuarioEmail ?? <span className="text-foreground-muted">Sistema</span>, className: "max-w-56 truncate" },
    { chave: "acao", titulo: "Ação", filtro: { tipo: "opcoes", opcoes: ROTULO_ACAO }, render: (e) => <Badge variant={VARIANTE[e.acao]}>{ROTULO_ACAO[e.acao]}</Badge> },
    {
      chave: "tabela", titulo: "O quê", filtro: { tipo: "opcoes", opcoes: ROTULO_TABELA },
      render: (e) => (
        <div className="min-w-0 max-w-72">
          <div className="text-xs text-foreground-muted">{ROTULO_TABELA[e.tabela] ?? e.tabela}</div>
          <div className="truncate font-medium">{e.alvo}</div>
        </div>
      ),
    },
    { chave: "registroId", titulo: "Id do registro", filtro: { tipo: "texto" }, soFiltro: true },
    { chave: "detalhes", titulo: "Detalhes", ordenavel: false, render: (e) => <Detalhes e={e} /> },
  ], []);

  return (
    <div className="space-y-6">
      <CabecalhoHero
        rotulo="Administração"
        titulo="Auditoria"
        descricao="Tudo o que foi criado, alterado ou excluído, por quem e quando. Os registros são gravados pelo banco e não podem ser editados."
        numeros={[{ valor: tabela.resposta?.meta.total, rotulo: "Eventos registrados" }]}
      />
      <div className="card overflow-hidden">
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar por e-mail ou id…" className="border-b border-borda p-4" />
        <TabelaDados
          tabela={tabela}
          colunas={colunas}
          chaveLinha={chave}
          vazio="Nenhum evento ainda. Os próximos cadastros e alterações aparecem aqui."
          renderCelular={(e) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
                <span>{quando(e.quando)}</span>
                <Badge variant={VARIANTE[e.acao]}>{ROTULO_ACAO[e.acao]}</Badge>
              </div>
              <div className="font-medium">{ROTULO_TABELA[e.tabela] ?? e.tabela}: {e.alvo}</div>
              <div className="truncate text-xs text-foreground-muted">{e.usuarioEmail ?? "Sistema"}</div>
              <Detalhes e={e} />
            </div>
          )}
        />
      </div>
    </div>
  );
}
