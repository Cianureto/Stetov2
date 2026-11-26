import { useEffect, useId, useRef } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

// Número que "corre de lado" até o valor novo: cada algarismo é uma roda de 0 a 9 deitada, que anda para a
// direita até o dígito certo, borrada na horizontal conforme a própria velocidade (os da direita giram mais
// e borram mais). Símbolos, pontos e vírgulas (R$, 1.234,56, %) ficam parados. Inspirado no "Speed Counter".

const NIVEIS_BORRAO = [1.2, 2.4, 3.6, 5];
/** Algarismos por roda: 0–9 repetido três vezes, para a volta ser contínua. */
const FAIXA = Array.from({ length: 30 }, (_, i) => i % 10);

/** Quantas voltas a mais cada algarismo dá, contando da direita: as unidades correm mais que as centenas. */
const voltasExtras = (posicaoDaDireita: number) => Math.max(0, 3 - Math.floor(posicaoDaDireita / 2));

function Roda({ digito, posicaoDaDireita, filtro }: { digito: number; posicaoDaDireita: number; filtro: string }) {
  // Posição acumulada (sempre cresce): a roda só anda para a frente, como um contador de verdade.
  const alvo = useRef(digito + 10 * voltasExtras(posicaoDaDireita));
  const ultimo = useRef(digito);
  const pos = useSpring(0, { stiffness: 46 + posicaoDaDireita * 6, damping: 17, mass: 1 });

  useEffect(() => {
    if (digito !== ultimo.current) {
      const passo = (digito - ultimo.current + 10) % 10;
      alvo.current += passo + 10 * Math.max(0, voltasExtras(posicaoDaDireita) - 1);
      ultimo.current = digito;
    }
    pos.set(alvo.current);
  }, [digito, posicaoDaDireita, pos]);

  const x = useTransform(pos, (p) => `${-(((p % 10) + 10) % 10 + 10) * (100 / 30)}%`);
  const velocidade = useVelocity(pos);
  const borrao = useTransform(velocidade, (v) => {
    const nivel = Math.min(NIVEIS_BORRAO.length, Math.floor(Math.abs(v) / 6));
    return nivel ? `url(#${filtro}-${nivel})` : "none";
  });

  // Em movimento, as bordas da roda esmaecem (o algarismo vizinho entra e sai suave); parado, nada muda.
  const mascara = useTransform(velocidade, (v) => (Math.abs(v) > 0.8 ? "linear-gradient(90deg, transparent, #000 24%, #000 76%, transparent)" : "none"));

  return (
    <motion.span className="relative inline-block w-[1ch] overflow-hidden align-bottom" style={{ maskImage: mascara, WebkitMaskImage: mascara }}>
      {/* Reserva a largura e a altura de um algarismo; a faixa corre por cima. */}
      <span className="invisible">0</span>
      <motion.span className="absolute left-0 top-0 flex w-[30ch]" style={{ x, filter: borrao as MotionValue<string> }}>
        {FAIXA.map((d, i) => (
          <span key={i} className="inline-block w-[1ch] text-center">{d}</span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/** Mostra `valor` (texto já formatado: "R$ 267.788,03", "1.057", "15,2 dias") com os algarismos correndo. */
export function NumeroVeloz({ valor, className }: { valor: string | number; className?: string }) {
  const texto = typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor;
  const reduzir = useReducedMotion();
  const filtro = `veloz-${useId().replace(/:/g, "")}`;

  if (reduzir || !/\d/.test(texto)) return <span className={cn("tabular-nums", className)}>{texto}</span>;

  // Posição de cada algarismo contada da direita: as unidades continuam sendo a mesma roda quando o número cresce.
  const caracteres = [...texto];
  let digitosAte = caracteres.filter((c) => /\d/.test(c)).length;

  return (
    <span className={cn("relative inline-flex whitespace-nowrap tabular-nums", className)}>
      <span className="sr-only">{texto}</span>
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          {NIVEIS_BORRAO.map((d, i) => (
            <filter key={d} id={`${filtro}-${i + 1}`} x="-50%" y="0" width="200%" height="100%">
              <feGaussianBlur stdDeviation={`${d} 0`} />
            </filter>
          ))}
        </defs>
      </svg>
      <span aria-hidden className="inline-flex">
        {caracteres.map((c, i) => {
          if (!/\d/.test(c)) return <span key={`s${caracteres.length - i}`} className="whitespace-pre">{c}</span>;
          digitosAte -= 1;
          return <Roda key={`d${digitosAte}`} digito={Number(c)} posicaoDaDireita={digitosAte} filtro={filtro} />;
        })}
      </span>
    </span>
  );
}
