import { useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AcaoRapida } from "@/lib/navegacao";
import { idFundoPasta, idIconePasta, MOLA_PASTA, type OrigemPasta } from "@/lib/pasta";

/**
 * Miniatura da pasta dentro do botão "Novo" da barra lateral: os ícones das ações num quadradinho. Enquanto o
 * painel está aberto, fica só o espaço reservado (os elementos "voaram" para o painel pelo layoutId).
 */
export function MiniPasta({ acoes, aberta }: { acoes: AcaoRapida[]; aberta: boolean }) {
  if (acoes.length <= 1) return <Plus className="size-4" strokeWidth={2.5} aria-hidden />;
  if (aberta) return <span aria-hidden className="block size-7" />;
  return (
    <motion.span
      aria-hidden
      layoutId={idFundoPasta("lateral")}
      transition={MOLA_PASTA}
      className="grid size-7 grid-cols-2 gap-[2px] bg-white/55 p-[3px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5)]"
      style={{ borderRadius: 8 }}
    >
      {acoes.slice(0, 4).map((a, i) => (
        <motion.span
          key={a.href}
          layoutId={idIconePasta("lateral", i)}
          transition={MOLA_PASTA}
          className="grid place-items-center bg-white text-azul-600"
          style={{ borderRadius: 3 }}
        >
          <a.Icone className="size-[7px]" strokeWidth={3} />
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Fundo do botão "+" da barra de abas (celular): é ele que cresce até virar o painel. */
export function FundoBotaoAbas({ aberta }: { aberta: boolean }) {
  if (aberta) return null;
  return (
    <motion.span
      aria-hidden
      layoutId={idFundoPasta("abas")}
      transition={MOLA_PASTA}
      className="absolute inset-0 bg-marca shadow-[inset_0_1px_0_rgb(255_255_255/0.25),var(--shadow-glow)]"
      style={{ borderRadius: 999 }}
    />
  );
}

const aparecer = (i: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.045, duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
});

/**
 * Menu "Novo" no estilo pasta do iOS: abre a partir do botão que foi tocado (barra lateral ou "+" do
 * celular), com o fundo desfocado; cada ícone sai da miniatura e vai para o seu cartão. Fecha fazendo o
 * caminho de volta. Atalhos 1–4 no teclado. Quem pede menos movimento vê o painel abrir sem a viagem.
 */
export function PastaAcoes({ aberta, origem, acoes, onFechar, onEscolher }: {
  aberta: boolean;
  origem: OrigemPasta;
  acoes: AcaoRapida[];
  onFechar: () => void;
  onEscolher: (a: AcaoRapida) => void;
}) {
  const doCelular = origem === "abas";
  const painel = useRef<HTMLDivElement>(null);
  return (
    <MotionConfig transition={MOLA_PASTA} reducedMotion="user">
      <DialogPrimitive.Root open={aberta} onOpenChange={(abrir) => !abrir && onFechar()}>
        <AnimatePresence>
          {aberta && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-tinta-900/30 backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.22 } }}
                />
              </DialogPrimitive.Overlay>
              <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  aria-describedby={undefined}
                  // Foco no próprio painel (sem anel no "x"): Tab entra nos cartões e 1–4 já funcionam.
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    painel.current?.focus();
                  }}
                  onKeyDown={(e) => {
                    const n = Number(e.key);
                    if (Number.isInteger(n) && n >= 1 && n <= acoes.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
                      e.preventDefault();
                      onEscolher(acoes[n - 1]);
                    }
                  }}
                >
                  <motion.div
                    ref={painel}
                    tabIndex={-1}
                    layoutId={idFundoPasta(origem)}
                    className="pointer-events-auto relative w-full max-w-[44rem] overflow-hidden p-5 shadow-[0_30px_80px_-20px_rgba(11,27,54,0.45)] outline-none md:p-7"
                    style={{ borderRadius: 28 }}
                    initial={{ backgroundColor: doCelular ? "rgba(29,78,216,1)" : "rgba(255,255,255,0.7)" }}
                    animate={{ backgroundColor: "rgba(243,246,251,0.96)" }}
                    exit={{ backgroundColor: doCelular ? "rgba(29,78,216,1)" : "rgba(255,255,255,0.7)" }}
                  >
                    <motion.div {...aparecer(0)} className="mb-4 pr-10 md:mb-5">
                      <p className="texto-sobretitulo">Ações rápidas</p>
                      <DialogPrimitive.Title className="mt-1 font-titulo text-xl font-semibold tracking-tight md:text-2xl">O que você quer lançar?</DialogPrimitive.Title>
                      <p className="texto-apoio mt-0.5">
                        Escolha abaixo<span className="hidden md:inline"> ou aperte o número no teclado</span>.
                      </p>
                    </motion.div>
                    <motion.div {...aparecer(0)} className="absolute right-4 top-4">
                      <DialogPrimitive.Close className="grid size-9 place-items-center rounded-full text-foreground-muted transition-colors hover:bg-tinta-100 hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--anel-foco)]">
                        <X className="size-4" aria-hidden />
                        <span className="sr-only">Fechar</span>
                      </DialogPrimitive.Close>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-2.5 md:gap-3.5">
                      {acoes.map((a, i) => (
                        <button
                          key={a.href}
                          type="button"
                          onClick={() => onEscolher(a)}
                          className="group relative flex min-h-32 w-full flex-col items-start gap-3 p-3.5 text-left outline-none md:min-h-40 md:gap-4 md:p-5 [&:focus-visible>.fundo-cartao]:border-azul-500 [&:focus-visible>.fundo-cartao]:shadow-[var(--anel-foco)]"
                        >
                          {/* Fundo do cartão: aparece depois; o ícone não some porque viaja por fora dele. */}
                          <motion.span
                            {...aparecer(i + 1)}
                            aria-hidden
                            className="fundo-cartao absolute inset-0 rounded-[var(--radius)] border border-borda bg-areia-card shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,translate] duration-[var(--dur-media)] group-hover:-translate-y-0.5 group-hover:border-azul-200 group-hover:shadow-[var(--shadow-md)]"
                          />
                          <motion.span
                            layoutId={doCelular ? undefined : idIconePasta("lateral", i)}
                            initial={doCelular ? { opacity: 0, scale: 0.4 } : undefined}
                            animate={doCelular ? { opacity: 1, scale: 1, transition: { ...MOLA_PASTA, delay: 0.08 + i * 0.05 } } : undefined}
                            exit={doCelular ? { opacity: 0, scale: 0.4, transition: { duration: 0.12 } } : undefined}
                            className="relative grid size-11 shrink-0 place-items-center bg-azul-50 text-azul-600 ring-1 ring-inset ring-azul-100 transition-colors duration-[var(--dur-media)] group-hover:bg-azul-600 group-hover:text-white md:size-12"
                            style={{ borderRadius: 12 }}
                          >
                            <a.Icone className="size-5 md:size-6" aria-hidden />
                          </motion.span>
                          <motion.span {...aparecer(i + 1)} className="relative min-w-0">
                            <span className="block text-[15px] font-semibold text-foreground md:text-base">{a.label}</span>
                            <span className="mt-0.5 block text-xs text-foreground-muted md:text-[13px]">{a.descricao}</span>
                          </motion.span>
                          <motion.kbd
                            {...aparecer(i + 1)}
                            className={cn("absolute right-3.5 top-3.5 hidden h-6 min-w-6 place-items-center rounded-md border border-borda bg-tinta-25 px-1.5 font-sans text-[11px] font-semibold text-foreground-muted md:right-4 md:top-4 md:grid")}
                          >
                            {i + 1}
                          </motion.kbd>
                        </button>
                      ))}
                    </div>
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
