import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, reduzMovimento } from "@/lib/gsap";

// Blocos que entram em sequência: cards e qualquer coisa marcada com data-entra.
const BLOCOS = ".card, [data-entra]";
// Os dados chegam depois do primeiro render; blocos que surgem nesse intervalo também entram animados.
const JANELA_MS = 2500;

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const raiz = ref.current;
      if (!raiz || reduzMovimento()) return;
      const vistos = new WeakSet<Element>();

      const entrar = contextSafe!(() => {
        const novos = gsap.utils.toArray<HTMLElement>(BLOCOS, raiz).filter((el) => {
          if (vistos.has(el)) return false;
          vistos.add(el);
          // só o bloco de fora; o que está dentro entra junto com ele
          return !el.parentElement?.closest(BLOCOS);
        });
        if (!novos.length) return;
        gsap.fromTo(
          novos,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.65, stagger: { each: 0.06, from: "start" }, clearProps: "opacity,visibility,transform" }
        );
      });

      gsap.fromTo(raiz, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, clearProps: "opacity,visibility" });
      entrar();
      const observador = new MutationObserver(entrar);
      observador.observe(raiz, { childList: true, subtree: true });
      const fim = window.setTimeout(() => observador.disconnect(), JANELA_MS);
      return () => {
        observador.disconnect();
        window.clearTimeout(fim);
      };
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.455, 0.03, 0.515, 0.955] }}
    >
      {children}
    </motion.div>
  );
}
