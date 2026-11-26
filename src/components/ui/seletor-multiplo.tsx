import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { filtrarOpcoes, type OpcaoSeletor } from "@/lib/busca";
import { cn } from "@/lib/cn";

type Props = {
  id?: string;
  opcoes: OpcaoSeletor[];
  selecionados: string[];
  onAplicar: (valores: string[]) => void;
  /** Texto quando nada está marcado: "Nenhum", "Todos". */
  vazio: string;
  /** Para o resumo com muitas opções marcadas: "3 clientes". */
  plural: string;
  carregando?: boolean;
};

const CLASSE_ATALHO = "rounded-full bg-[var(--areia)] px-2.5 py-1 text-[12px] font-medium hover:bg-marca-claro hover:text-marca";

/** Texto do botão: o vazio, até dois rótulos ou "N <plural>". */
function resumoSelecao(opcoes: OpcaoSeletor[], selecionados: string[], vazio: string, plural: string) {
  const rotulo = (valor: string) => opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
  if (!selecionados.length) return vazio;
  return selecionados.length <= 2 ? selecionados.map(rotulo).join(", ") : `${selecionados.length} ${plural}`;
}

/**
 * Escolha de várias opções (padrão do ConectaPRO): caixas de marcar com busca sem acento, "Marcar todos"/"Limpar",
 * e as mudanças só valem ao aplicar.
 */
export function SeletorMultiplo({ id, opcoes, selecionados, onAplicar, vazio, plural, carregando }: Props) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<string[]>(selecionados);
  const [busca, setBusca] = useState("");

  function abrir(abrindo: boolean) {
    if (abrindo) {
      setRascunho(selecionados);
      setBusca("");
    }
    setAberto(abrindo);
  }
  function alternar(valor: string) {
    setRascunho((marcados) => (marcados.includes(valor) ? marcados.filter((item) => item !== valor) : [...marcados, valor]));
  }
  function aplicar() {
    onAplicar(opcoes.map((opcao) => opcao.valor).filter((valor) => rascunho.includes(valor)));
    setAberto(false);
  }

  const visiveis = filtrarOpcoes(opcoes, busca);

  return (
    <Popover open={aberto} onOpenChange={abrir}>
      <PopoverTrigger asChild>
        <button id={id} type="button" disabled={carregando} className={cn("input flex items-center justify-between gap-2 text-left", selecionados.length > 0 && "!border-marca font-medium")}>
          <span className="truncate">{carregando ? "Carregando..." : resumoSelecao(opcoes, selecionados, vazio, plural)}</span>
          <ChevronDown className="size-4 shrink-0 text-foreground-muted" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center gap-1.5 border-b border-borda p-3">
          <button type="button" onClick={() => setRascunho(opcoes.map((opcao) => opcao.valor))} className={CLASSE_ATALHO}>
            Marcar todos
          </button>
          <button type="button" onClick={() => setRascunho([])} className={CLASSE_ATALHO}>
            Limpar
          </button>
        </div>
        {opcoes.length > 8 && (
          <div className="border-b border-borda p-2">
            <input type="search" value={busca} onChange={(ev) => setBusca(ev.target.value)} placeholder="Procurar" aria-label="Procurar" className="input !py-1.5 text-[13px]" />
          </div>
        )}
        <div className="max-h-64 overflow-y-auto py-1">
          {visiveis.map((opcao) => (
            <label key={opcao.valor} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-[var(--areia)]">
              <input type="checkbox" checked={rascunho.includes(opcao.valor)} onChange={() => alternar(opcao.valor)} className="accent-[var(--marca)]" />
              <span className="min-w-0">
                <span className="block truncate">{opcao.rotulo}</span>
                {opcao.descricao && <span className="block truncate text-[12px] text-foreground-muted">{opcao.descricao}</span>}
              </span>
            </label>
          ))}
          {visiveis.length === 0 && <p className="px-3 py-3 text-[13px] text-foreground-muted">{opcoes.length ? "Nada encontrado." : "Nenhuma opção cadastrada."}</p>}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-borda p-3">
          <span className="text-[12px] text-foreground-muted">{rascunho.length === 0 ? vazio : `${rascunho.length} de ${opcoes.length}`}</span>
          <button type="button" onClick={aplicar} className="btn btn-primary !px-3 !py-1.5 text-[13px]">
            Aplicar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
