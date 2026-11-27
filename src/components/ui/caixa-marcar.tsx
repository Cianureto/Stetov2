import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const MOLA = { type: "spring", bounce: 0.25, visualDuration: 0.3 } as const;

/**
 * Caixa de marcar animada: a caixa enche de azul com um pulo leve e o "certo" é desenhado traço a traço
 * (pathLength); "parcial" (parte das linhas marcadas) desenha um traço reto. Por baixo é um checkbox nativo
 * (invisível, por cima do desenho): teclado, rótulo (<label>) e leitor de tela funcionam como sempre.
 */
export function CaixaMarcar({
  marcada,
  parcial = false,
  onChange,
  rotulo,
  id,
  desabilitada,
  className,
}: {
  marcada: boolean;
  parcial?: boolean;
  onChange: (marcada: boolean) => void;
  /** Nome acessível quando não há <label> em volta (ex.: caixa de linha de tabela). */
  rotulo?: string;
  id?: string;
  desabilitada?: boolean;
  className?: string;
}) {
  const cheia = marcada || parcial;
  return (
    <span className={cn("relative inline-grid size-[18px] shrink-0 place-items-center", className)}>
      <input
        id={id}
        type="checkbox"
        checked={marcada}
        disabled={desabilitada}
        aria-label={rotulo}
        ref={(el) => {
          if (el) el.indeterminate = parcial && !marcada;
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <motion.span
        aria-hidden
        initial={false}
        animate={{
          backgroundColor: cheia ? "var(--azul-600)" : "var(--tinta-0)",
          borderColor: cheia ? "var(--azul-600)" : "var(--tinta-300)",
          scale: cheia ? [0.82, 1.08, 1] : 1,
        }}
        transition={{ ...MOLA, scale: { duration: 0.32, times: [0, 0.6, 1] } }}
        className="grid size-[18px] place-items-center rounded-[5px] border-[1.5px] shadow-[var(--shadow-xs)] transition-shadow peer-hover:border-azul-400 peer-focus-visible:shadow-[var(--anel-foco)] peer-disabled:opacity-50"
      >
        <svg viewBox="0 0 18 18" className="size-[14px]" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M3.8 9.4 L7.3 12.8 L14.2 5.4"
            initial={false}
            animate={{ pathLength: marcada ? 1 : 0, opacity: marcada ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.28, ease: [0.65, 0, 0.35, 1], delay: marcada ? 0.06 : 0 }, opacity: { duration: 0.1 } }}
          />
          <motion.path
            d="M4.5 9 H13.5"
            initial={false}
            animate={{ pathLength: parcial && !marcada ? 1 : 0, opacity: parcial && !marcada ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.22, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.1 } }}
          />
        </svg>
      </motion.span>
    </span>
  );
}
