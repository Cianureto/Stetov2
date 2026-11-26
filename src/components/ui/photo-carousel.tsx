import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function PhotoCarousel({
  imagens,
  intervalo = 5000,
  className,
}: {
  imagens: string[];
  intervalo?: number;
  className?: string;
}) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagens.length <= 1) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % imagens.length), intervalo);
    return () => clearInterval(t);
  }, [imagens.length, intervalo]);

  return (
    <div className={cn("absolute inset-0", className)} aria-hidden>
      <AnimatePresence initial={false}>
        <motion.img
          key={indice}
          src={imagens[indice]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9, ease: "easeInOut" }, scale: { duration: intervalo / 1000 + 0.9, ease: "linear" } }}
        />
      </AnimatePresence>

      {imagens.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {imagens.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              aria-label={`Foto ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === indice ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
