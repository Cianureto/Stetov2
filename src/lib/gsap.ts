import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Uma curva só para o app inteiro: entra e sai devagar (ease in-out).
export const EASE = "power2.inOut";
gsap.defaults({ ease: EASE, duration: 0.7 });

/** Sem animação quando a pessoa pediu menos movimento ou fora do navegador (testes, sem matchMedia). */
export function reduzMovimento() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP };
