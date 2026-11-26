import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Uma curva só para o app inteiro: entra e sai devagar (ease in-out).
export const EASE = "power2.inOut";
gsap.defaults({ ease: EASE, duration: 0.7 });

export function reduzMovimento() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP };
