import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

/** Uma foto do carrossel. `inteira`: mostra a imagem toda sobre `fundo` (ex.: logo em paisagem num painel em pé). */
export type FotoCarrossel = string | { src: string; inteira?: boolean; fundo?: string; posicao?: string };

const normalizar = (f: FotoCarrossel) => (typeof f === "string" ? { src: f } : f);

/** Fotos que se alternam (fundo do painel do login). Decorativas: os botões só trocam a foto. */
export function PhotoCarousel({
  imagens,
  intervalo = 5000,
  className,
  posicaoControles = "bottom-5 left-1/2 -translate-x-1/2",
}: {
  imagens: FotoCarrossel[];
  intervalo?: number;
  className?: string;
  /** Onde ficam os pontinhos de navegação (classes de posição). */
  posicaoControles?: string;
}) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagens.length <= 1) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % imagens.length), intervalo);
    return () => clearInterval(t);
  }, [imagens.length, intervalo]);

  const atual = normalizar(imagens[indice]);

  return (
    <div className={cn("absolute inset-0", className)}>
      <AnimatePresence initial={false}>
        <motion.div
          key={indice}
          className="absolute inset-0"
          style={{ backgroundColor: atual.fundo }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9, ease: "easeInOut" }, scale: { duration: intervalo / 1000 + 0.9, ease: "linear" } }}
        >
          <img
            src={atual.src}
            alt=""
            className={cn("absolute inset-0 h-full w-full", atual.inteira ? "object-contain px-12 pb-[45%] pt-10" : "object-cover")}
            style={{ objectPosition: atual.posicao }}
          />
        </motion.div>
      </AnimatePresence>

      {imagens.length > 1 && (
        <div className={cn("absolute z-20 flex gap-1.5", posicaoControles)} role="group" aria-label="Fotos">
          {imagens.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Mostrar foto ${i + 1} de ${imagens.length}`}
              aria-pressed={i === indice}
              className={cn(
                "alvo-toque h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                i === indice ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
