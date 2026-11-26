import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { resultadosDaBusca, type AcaoRapida, type ResultadoBusca, type SecaoMenu } from "@/lib/navegacao";

/**
 * Busca do cabeçalho (padrão revenda): telas do menu e ações rápidas. Teclado: ↑ ↓ escolhem, Enter abre.
 * No celular abre como folha inferior (o `DialogContent` já faz isso abaixo de `md`).
 */
export function PaletaBusca({ aberta, onFechar, secoes, acoes }: { aberta: boolean; onFechar: () => void; secoes: SecaoMenu[]; acoes: AcaoRapida[] }) {
  const navigate = useNavigate();
  const [termo, setTermo] = useState("");
  const [ativo, setAtivo] = useState(0);
  const resultados = useMemo(() => resultadosDaBusca(termo, secoes, acoes), [termo, secoes, acoes]);

  function fechar() {
    setTermo("");
    setAtivo(0);
    onFechar();
  }

  function abrir(r: ResultadoBusca) {
    fechar();
    navigate(r.href);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[ativo]) {
      e.preventDefault();
      abrir(resultados[ativo]);
    }
  }

  return (
    <Dialog open={aberta} onOpenChange={(abrirDialogo) => !abrirDialogo && fechar()}>
      <DialogContent hideClose className="gap-0 space-y-0 p-0 md:max-w-lg md:top-[15%] md:translate-y-0">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <DialogDescription className="sr-only">Procure uma tela ou ação do Steto</DialogDescription>
        <div className="flex items-center gap-2 border-b border-borda px-4">
          <Search className="size-4 shrink-0 text-foreground-muted" aria-hidden />
          <input
            autoFocus
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setAtivo(0);
            }}
            onKeyDown={aoTeclar}
            placeholder="Buscar tela ou ação"
            aria-label="Buscar tela ou ação"
            role="combobox"
            aria-expanded
            aria-controls="paleta-resultados"
            aria-activedescendant={resultados[ativo] ? `paleta-${ativo}` : undefined}
            className="h-13 min-w-0 flex-1 bg-transparent py-3.5 text-[15px] outline-none placeholder:text-foreground-muted"
          />
          <button type="button" onClick={fechar} className="rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-foreground/5 pointer-coarse:py-2">
            Fechar
          </button>
        </div>
        <ul id="paleta-resultados" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {resultados.length === 0 && <li className="px-3 py-8 text-center text-sm text-foreground-muted">Nada encontrado para “{termo}”.</li>}
          {resultados.map((r, i) => (
            <li key={r.chave} id={`paleta-${i}`} role="option" aria-selected={i === ativo}>
              <button
                type="button"
                onClick={() => abrir(r)}
                onMouseMove={() => setAtivo(i)}
                className={cn("flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left", i === ativo && "bg-marca-claro")}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-areia text-marca">
                  <r.Icone width={17} height={17} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.rotulo}</span>
                  <span className="block truncate text-xs text-foreground-muted">{r.descricao}</span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-foreground-muted">{r.tipo}</span>
                {i === ativo && <CornerDownLeft className="size-3.5 shrink-0 text-foreground-muted max-md:hidden" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
