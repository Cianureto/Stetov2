import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { idBusca, MOLA_PASTA, type OrigemBusca } from "@/lib/pasta";
import { resultadosDaBusca, type AcaoRapida, type ResultadoBusca, type SecaoMenu } from "@/lib/navegacao";

const ENTRA = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { delay: 0.12 } },
  exit: { opacity: 0, filter: "blur(8px)", transition: { duration: 0.1 } },
};

/**
 * Busca do cabeçalho: telas do menu e ações rápidas. Teclado: ↑ ↓ escolhem, Enter abre. Mesmo padrão do botão
 * Novo: o campo do cabeçalho (ou a lupa, no celular) cresce até virar o painel e o conteúdo entra desfocado.
 */
export function PaletaBusca({ aberta, origem, onFechar, secoes, acoes }: { aberta: boolean; origem: OrigemBusca; onFechar: () => void; secoes: SecaoMenu[]; acoes: AcaoRapida[] }) {
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
    <MotionConfig transition={MOLA_PASTA} reducedMotion="user">
      <DialogPrimitive.Root open={aberta} onOpenChange={(abrirDialogo) => !abrirDialogo && fechar()}>
        <AnimatePresence>
          {aberta && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-tinta-900/25 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.2 } }}
                />
              </DialogPrimitive.Overlay>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:pt-[12vh]">
                <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
                  <motion.div
                    layoutId={idBusca(origem)}
                    exit={{ pointerEvents: "none" }}
                    className="pointer-events-auto w-full max-w-xl overflow-hidden bg-areia-card shadow-[0_30px_80px_-20px_rgba(11,27,54,0.45),0_0_0_0.5px_rgba(11,27,54,0.12)] outline-none"
                    style={{ borderRadius: 20 }}
                  >
                    <DialogPrimitive.Title className="sr-only">Buscar tela ou ação</DialogPrimitive.Title>
                    <motion.div {...ENTRA} className="flex items-center gap-2.5 border-b border-borda px-4">
                      <Search className="size-[18px] shrink-0 text-azul-600" aria-hidden />
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
                        className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-foreground-muted"
                      />
                      <kbd className="hidden h-6 items-center rounded-md bg-tinta-50 px-1.5 font-sans text-[11px] font-semibold text-foreground-muted ring-1 ring-inset ring-borda md:inline-flex">Esc</kbd>
                      <button type="button" onClick={fechar} className="rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-foreground/5 md:hidden pointer-coarse:py-2">
                        Fechar
                      </button>
                    </motion.div>
                    <motion.ul {...ENTRA} id="paleta-resultados" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
                      {resultados.length === 0 && <li className="px-3 py-8 text-center text-sm text-foreground-muted">Nada encontrado para “{termo}”.</li>}
                      {resultados.map((r, i) => (
                        <li key={r.chave} id={`paleta-${i}`} role="option" aria-selected={i === ativo}>
                          <button
                            type="button"
                            onClick={() => abrir(r)}
                            onMouseMove={() => setAtivo(i)}
                            className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors", i === ativo && "bg-azul-50 shadow-[inset_3px_0_0_var(--azul-500)]")}
                          >
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", i === ativo ? "bg-azul-600 text-white" : "bg-tinta-50 text-azul-600")}>
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
                    </motion.ul>
                  </motion.div>
                </DialogPrimitive.Content>
              </div>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </MotionConfig>
  );
}
