import { useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AcaoRapida } from "@/lib/navegacao";
import { GRADIENTES_APP, idFundoPasta, MOLA_PASTA, type OrigemPasta } from "@/lib/pasta";

/**
 * O "+" do botão "Novo" da barra lateral. É dele que o painel cresce ao abrir (layoutId); enquanto o painel
 * está aberto, fica só o espaço reservado.
 */
export function IconeNovo({ aberta }: { aberta: boolean }) {
  if (aberta) return <span aria-hidden className="block size-8 shrink-0" />;
  return (
    <motion.span
      aria-hidden
      layoutId={idFundoPasta("lateral")}
      transition={MOLA_PASTA}
      className="grid size-8 shrink-0 place-items-center bg-white/20 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-transform duration-[var(--dur-media)] ease-[var(--ease-saida)] group-hover:rotate-90"
      style={{ borderRadius: 9 }}
    >
      <Plus className="size-[18px]" strokeWidth={2.5} />
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

/** Toque no ícone (celular): afunda e volta com mola, como no iPhone. */
const MOLA_TOQUE = { type: "spring", bounce: 0.4, visualDuration: 0.2 } as const;

const aparecer = (i: number) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.045, duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
});

/**
 * Menu "Novo" no estilo pasta do iOS: o painel cresce a partir do "+" que foi tocado (barra lateral ou
 * barra de abas do celular), com o fundo desfocado, e os ícones dos cartões aparecem crescendo em sequência.
 * Fecha fazendo o caminho de volta. Atalhos 1–4 no teclado. Quem pede menos movimento vê o painel abrir sem a viagem.
 */
export function PastaAcoes({ aberta, origem, acoes, onFechar, onEscolher }: {
  aberta: boolean;
  origem: OrigemPasta;
  acoes: AcaoRapida[];
  onFechar: () => void;
  onEscolher: (a: AcaoRapida) => void;
}) {
  const doCelular = origem === "abas";
  // Cor de partida do painel: a do botão de onde ele sai (azul-céu na barra lateral, azul no "+" do celular).
  const corOrigem = doCelular ? "rgba(29,78,216,1)" : "rgba(58,110,242,1)";
  const painel = useRef<HTMLDivElement>(null);
  return (
    <MotionConfig transition={MOLA_PASTA} reducedMotion="user">
      <DialogPrimitive.Root open={aberta} onOpenChange={(abrir) => !abrir && onFechar()}>
        <AnimatePresence>
          {aberta && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className={cn("fixed inset-0 z-40", doCelular ? "bg-tinta-100/40 backdrop-blur-2xl" : "bg-tinta-900/30 backdrop-blur-md")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.25 } }}
                  exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.22 } }}
                />
              </DialogPrimitive.Overlay>
              <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-4">
                {doCelular ? (
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  aria-describedby={undefined}
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    painel.current?.focus();
                  }}
                >
                  {/* Celular: pasta do iPhone — título grande, painel de vidro e as ações como ícones de app. */}
                  <div className="pointer-events-none flex w-full flex-col items-center outline-none">
                    <motion.div {...aparecer(0)}>
                      <DialogPrimitive.Title className="mb-5 text-center font-titulo text-[30px] font-semibold tracking-tight text-foreground">Novo</DialogPrimitive.Title>
                    </motion.div>
                    <motion.div
                      ref={painel}
                      tabIndex={-1}
                      layoutId={idFundoPasta(origem)}
                      className="pointer-events-auto w-[min(19.5rem,calc(100vw-3rem))] px-5 pb-6 pt-6 shadow-[0_30px_70px_-24px_rgba(11,27,54,0.55),inset_0_0_0_1px_rgba(255,255,255,0.6)] outline-none backdrop-blur-2xl"
                      style={{ borderRadius: 38 }}
                      initial={{ backgroundColor: corOrigem }}
                      animate={{ backgroundColor: "rgba(255,255,255,0.74)" }}
                      exit={{ backgroundColor: corOrigem, pointerEvents: "none" }}
                    >
                      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                        {acoes.map((a, i) => (
                          <motion.button
                            key={a.href}
                            type="button"
                            onClick={() => onEscolher(a)}
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1, transition: { ...MOLA_PASTA, delay: 0.1 + i * 0.05 } }}
                            exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.12 } }}
                            whileTap={{ scale: 0.86, transition: MOLA_TOQUE }}
                            className="flex flex-col items-center gap-2 rounded-2xl outline-none focus-visible:shadow-[var(--anel-foco)]"
                          >
                            <span
                              aria-hidden
                              className="grid size-[68px] place-items-center rounded-[20px] text-white shadow-[0_10px_20px_-10px_rgba(11,27,54,0.55),inset_0_1px_0_rgba(255,255,255,0.35)]"
                              style={{ background: GRADIENTES_APP[i % GRADIENTES_APP.length] }}
                            >
                              <a.Icone className="size-8" strokeWidth={1.9} />
                            </span>
                            <span className="max-w-[8rem] text-center text-[13px] font-medium leading-tight text-foreground">{a.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                    <motion.p {...aparecer(5)} className="mt-6 text-[13px] font-medium text-foreground-secondary">
                      Toque fora para fechar
                    </motion.p>
                  </div>
                </DialogPrimitive.Content>
                ) : (
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
                    initial={{ backgroundColor: corOrigem }}
                    animate={{ backgroundColor: "rgba(243,246,251,0.96)" }}
                    exit={{ backgroundColor: corOrigem, pointerEvents: "none" }}
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
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: 1, scale: 1, transition: { ...MOLA_PASTA, delay: 0.1 + i * 0.05 } }}
                            exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.12 } }}
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
                )}
              </div>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </MotionConfig>
  );
}
