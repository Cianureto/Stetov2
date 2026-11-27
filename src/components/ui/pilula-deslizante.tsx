import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const MOLA = { type: "spring", bounce: 0.2, visualDuration: 0.32 } as const;

/**
 * Fundo da opção escolhida em controles de "uma entre várias" (segmentos, abas): um só elemento que desliza
 * de uma opção para a outra (layoutId do grupo). Vai dentro do botão ativo, que precisa ser `relative isolate`.
 */
export function PilulaDeslizante({ grupo, className }: { grupo: string; className?: string }) {
  return <motion.span aria-hidden layoutId={`pilula-${grupo}`} transition={MOLA} className={cn("absolute inset-0 -z-10", className)} />;
}
