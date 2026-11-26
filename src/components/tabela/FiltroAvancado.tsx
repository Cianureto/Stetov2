import { useState, type FormEvent } from "react";
import { Filter, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Seletor } from "@/components/ui/seletor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Segmentos } from "@/components/ui/segmentos";
import { cn } from "@/lib/cn";
import {
  colunasFiltraveis, descreverRegra, FILTROS_VAZIOS, MAX_REGRAS, novaRegra, opcoesDa, OPERADORES, regraCompleta, rotuloDa,
  SEM_VALOR, valorInicial, type Coluna, type Filtros, type Regra,
} from "@/lib/tabela";

type Filtravel<T> = ReturnType<typeof colunasFiltraveis<T>>[number];

function CampoValor<T>({ coluna, regra, onChange }: { coluna: Filtravel<T>; regra: Regra; onChange: (v: Regra["valor"]) => void }) {
  const tipo = coluna.filtro.tipo;
  const rotulo = rotuloDa(coluna);
  if (SEM_VALOR.has(regra.op)) return null;
  const tipoInput = tipo === "data" ? "date" : tipo === "numero" || tipo === "moeda" ? "number" : "text";
  const campo = (v: string, set: (x: string) => void, aria: string) => (
    <Input
      className="h-9 py-1.5"
      type={tipoInput}
      inputMode={tipoInput === "number" ? "decimal" : undefined}
      step={tipo === "moeda" ? "0.01" : undefined}
      value={v}
      onChange={(e) => set(e.target.value)}
      aria-label={aria}
      placeholder={tipo === "texto" ? "Texto" : undefined}
    />
  );

  if (regra.op === "entre") {
    const [a = "", b = ""] = Array.isArray(regra.valor) ? regra.valor : [];
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
        {campo(a, (x) => onChange([x, b]), `${rotulo}: de`)}
        <span className="text-xs text-foreground-muted">e</span>
        {campo(b, (x) => onChange([a, x]), `${rotulo}: até`)}
      </div>
    );
  }
  if (tipo === "opcoes") {
    const marcadas = new Set(Array.isArray(regra.valor) ? regra.valor : []);
    return (
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${rotulo}: opções`}>
        {opcoesDa(coluna).map((o) => {
          const ativa = marcadas.has(o.valor);
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={ativa}
              onClick={() => {
                const prox = new Set(marcadas);
                if (ativa) prox.delete(o.valor);
                else prox.add(o.valor);
                onChange([...prox]);
              }}
              className={cn("min-h-8 rounded-full px-3 text-xs font-medium transition-colors pointer-coarse:min-h-11", ativa ? "bg-marca text-white" : "bg-foreground/[0.06] text-foreground-secondary hover:bg-foreground/[0.1]")}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    );
  }
  return campo(typeof regra.valor === "string" ? regra.valor : "", onChange, `${rotulo}: valor`);
}

function LinhaRegra<T>({ indice, regra, campos, onChange, onRemover }: { indice: number; regra: Regra; campos: Filtravel<T>[]; onChange: (r: Regra) => void; onRemover: () => void }) {
  const coluna = campos.find((c) => c.chave === regra.campo) ?? campos[0];
  const formato = (op: string) => (SEM_VALOR.has(op) ? "nenhum" : op === "entre" ? "par" : "um");
  return (
    <li className="grid gap-2 rounded-xl p-3 ring-1 ring-borda md:grid-cols-[minmax(0,11rem)_minmax(0,10rem)_minmax(0,1fr)_auto] md:items-start md:rounded-none md:p-0 md:ring-0">
      <div className="grid grid-cols-2 gap-2 md:contents">
        <Seletor
          className="h-9 py-1.5"
          rotulo={`Condição ${indice + 1}: campo`}
          valor={coluna.chave}
          opcoes={campos.map((c) => ({ valor: c.chave, rotulo: rotuloDa(c) }))}
          onChange={(chave) => onChange(novaRegra(campos.find((c) => c.chave === chave) ?? coluna))}
        />
        <Seletor
          className="h-9 py-1.5"
          rotulo={`Condição ${indice + 1}: operador`}
          valor={regra.op}
          opcoes={OPERADORES[coluna.filtro.tipo].map(([valor, rotulo]) => ({ valor, rotulo }))}
          // Mantém o valor quando o formato não muda (ex.: "contém" → "começa com").
          onChange={(op) => onChange({ ...regra, op, valor: formato(op) === formato(regra.op) ? regra.valor : valorInicial(coluna, op) })}
        />
      </div>
      <div className="flex items-start gap-2 md:contents">
        <div className="min-w-0 flex-1">
          <CampoValor coluna={coluna} regra={regra} onChange={(valor) => onChange({ ...regra, valor })} />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Remover condição ${indice + 1}`} onClick={onRemover}>
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
}

/**
 * Filtro avançado genérico (modelo do projeto revenda): os campos vêm das colunas com `filtro`. Cada condição
 * é campo + operador + valor, combinadas por "todas" ou "qualquer". O rascunho só vale ao "Aplicar"; condição
 * incompleta é descartada. No celular abre como folha inferior.
 */
export function FiltroAvancado<T>({ colunas, valor, onChange }: { colunas: Coluna<T>[]; valor: Filtros; onChange: (f: Filtros) => void }) {
  const campos = colunasFiltraveis(colunas);
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Filtros>(valor);
  const ativos = valor.regras.filter((r) => regraCompleta(r, colunas)).length;
  if (!campos.length) return null;

  const abrir = () => {
    setRascunho(valor.regras.length ? valor : { logica: "e", regras: [novaRegra(campos[0])] });
    setAberto(true);
  };
  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    onChange({ logica: rascunho.logica, regras: rascunho.regras.filter((r) => regraCompleta(r, colunas)) });
    setAberto(false);
  };
  const mudarRegra = (i: number, r: Regra) => setRascunho((d) => ({ ...d, regras: d.regras.map((x, j) => (j === i ? r : x)) }));

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={ativos ? `Filtro avançado (${ativos} ativos)` : "Filtro avançado"}
        className={cn(
          "flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors pointer-coarse:h-11",
          ativos ? "border-marca/30 bg-marca-claro text-marca-escuro" : "border-[var(--borda-forte)] bg-areia-card text-foreground hover:bg-[var(--sidebar-hover-bg)]",
        )}
      >
        <Filter className="size-4" aria-hidden />
        <span className="hidden sm:inline">Filtro avançado</span>
        {ativos > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-marca px-1 text-[11px] font-semibold text-white">{ativos}</span>}
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Filtro avançado</DialogTitle>
            <DialogDescription className="sr-only">Monte condições com os campos da tabela</DialogDescription>
          </DialogHeader>
          <form onSubmit={aplicar} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
              <span>Mostrar registros que atendem a</span>
              <Segmentos
                tamanho="sm"
                valor={rascunho.logica}
                onChange={(logica) => setRascunho((d) => ({ ...d, logica }))}
                opcoes={[{ id: "e", label: "todas as condições" }, { id: "ou", label: "qualquer condição" }]}
              />
            </div>
            <ul className="space-y-2">
              {rascunho.regras.map((r, i) => (
                <LinhaRegra key={i} indice={i} regra={r} campos={campos} onChange={(x) => mudarRegra(i, x)} onRemover={() => setRascunho((d) => ({ ...d, regras: d.regras.filter((_, j) => j !== i) }))} />
              ))}
              {!rascunho.regras.length && <li className="rounded-xl bg-foreground/[0.03] p-4 text-center text-sm text-foreground-muted">Nenhuma condição. Adicione uma para filtrar.</li>}
            </ul>
            <div className="flex flex-col gap-2 border-t border-borda pt-3 md:flex-row md:items-center md:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-marca"
                disabled={rascunho.regras.length >= MAX_REGRAS}
                onClick={() => setRascunho((d) => ({ ...d, regras: [...d.regras, novaRegra(campos[0])] }))}
              >
                <Plus aria-hidden /> Adicionar condição
              </Button>
              <div className="grid grid-cols-2 gap-2 md:flex">
                <Button type="button" variant="secondary" size="sm" onClick={() => setRascunho(FILTROS_VAZIOS)}>
                  <X aria-hidden /> Limpar
                </Button>
                <Button type="submit" variant="accent" size="sm">Aplicar</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Filtros ativos como etiquetas removíveis ("Status é Ativo"). */
export function EtiquetasFiltro<T>({ colunas, valor, onChange }: { colunas: Coluna<T>[]; valor: Filtros; onChange: (f: Filtros) => void }) {
  const ativos = valor.regras.filter((r) => regraCompleta(r, colunas));
  if (!ativos.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ativos.length > 1 && <span className="text-xs text-foreground-muted">{valor.logica === "ou" ? "qualquer uma:" : "todas:"}</span>}
      {ativos.map((r, i) => {
        const texto = descreverRegra(r, colunas);
        return (
          <span key={i} className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-marca-claro pl-3 pr-1 text-xs font-medium text-marca-escuro">
            <span className="truncate">{texto}</span>
            <button type="button" onClick={() => onChange({ ...valor, regras: ativos.filter((_, j) => j !== i) })} className="alvo-toque grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-marca/15" aria-label={`Remover filtro: ${texto}`}>
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        );
      })}
      {ativos.length > 1 && (
        <button type="button" onClick={() => onChange(FILTROS_VAZIOS)} className="h-8 px-2 text-xs font-medium text-foreground-secondary underline-offset-2 hover:text-foreground hover:underline">
          Limpar filtros
        </button>
      )}
    </div>
  );
}
