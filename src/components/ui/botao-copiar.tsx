import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

const TROCA = {
  initial: { opacity: 0, scale: 0.6, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.6, filter: "blur(4px)" },
  transition: { type: "spring", bounce: 0.2, visualDuration: 0.25 },
} as const;

/**
 * Botão de copiar: ao copiar, o ícone troca com desfoque pelo "certo", que é desenhado traço a traço, e o texto
 * vira "Copiado"; volta sozinho em 2 s. `tamanho="sm"` para dentro de cartões e listas.
 */
export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
  rotuloCopiado = "Copiado",
  tamanho = "md",
  className,
}: {
  /** O que vai para a área de transferência. */
  texto: string;
  rotulo?: string;
  rotuloCopiado?: string;
  tamanho?: "sm" | "md";
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie à mão.");
    }
  }

  const sm = tamanho === "sm";
  return (
    <button
      type="button"
      onClick={() => void copiar()}
      aria-live="polite"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border bg-areia-card font-semibold shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,color] duration-[var(--dur-hover)] focus-visible:shadow-[var(--anel-foco)] active:scale-[0.97]",
        sm ? "h-7 px-2 text-xs" : "h-10 px-4 text-sm",
        copiado ? "border-[var(--sucesso)]/30 bg-[var(--sucesso-soft)] text-[var(--sucesso)]" : "border-borda text-foreground hover:bg-tinta-25",
        className,
      )}
    >
      <span className={cn("relative grid place-items-center", sm ? "size-3.5" : "size-4")}>
        <AnimatePresence mode="popLayout" initial={false}>
          {copiado ? (
            <motion.svg key="certo" {...TROCA} viewBox="0 0 16 16" className="size-full" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <motion.path d="M3 8.5 L6.5 12 L13 4.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1], delay: 0.08 }} />
            </motion.svg>
          ) : (
            <motion.span key="copiar" {...TROCA} className="grid size-full place-items-center" aria-hidden>
              <Copy className="size-full" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={copiado ? "s" : "n"} {...TROCA}>
          {copiado ? rotuloCopiado : rotulo}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
