import { cn } from "@/lib/cn";
import stetoClaro from "@/assets/marca/steto-claro.png";
import stetoEscuro from "@/assets/marca/steto-escuro.png";
import completoClaro from "@/assets/marca/steto-contabilidade-claro.png";
import completoEscuro from "@/assets/marca/steto-contabilidade-escuro.png";

// Logo da Steto, extraído da arte oficial (fundo transparente, reduzido para 2x de tela). "escuro" tem as letras
// brancas e o símbolo azul-claro (barra lateral, painel do login); "claro", letras azul-marinho e símbolo azul.
// `completo` acrescenta "CONTABILIDADE" embaixo (login no celular).
const ALTURAS = { sm: "h-7", md: "h-8", lg: "h-10", xl: "h-14" } as const;

// Proporção das imagens (largura x altura), para o navegador reservar o espaço antes de carregar.
const PROPORCAO = { compacto: [478, 144], completo: [478, 182] } as const;

export function MarcaLogo({
  fundo = "claro",
  tamanho = "sm",
  completo = false,
  className,
}: {
  fundo?: "claro" | "escuro";
  tamanho?: keyof typeof ALTURAS;
  completo?: boolean;
  className?: string;
}) {
  const src = completo ? (fundo === "escuro" ? completoEscuro : completoClaro) : fundo === "escuro" ? stetoEscuro : stetoClaro;
  const [w, h] = PROPORCAO[completo ? "completo" : "compacto"];
  return <img src={src} alt={completo ? "Steto Contabilidade" : "Steto"} width={w} height={h} draggable={false} className={cn("w-auto max-w-full shrink-0 select-none", ALTURAS[tamanho], className)} />;
}
