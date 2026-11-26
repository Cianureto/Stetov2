import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";

const ALTURAS = {
  sm: { caixa: "h-8 w-8 rounded-[9px]", icone: "size-[18px]", texto: "text-[17px]" },
  md: { caixa: "h-9 w-9 rounded-[10px]", icone: "size-5", texto: "text-[19px]" },
  lg: { caixa: "h-11 w-11 rounded-xl", icone: "size-6", texto: "text-2xl" },
  xl: { caixa: "h-12 w-12 rounded-xl", icone: "size-7", texto: "text-[28px]" },
} as const;

/**
 * Logo compacto do Steto (símbolo + nome). "escuro" é para a barra lateral, o cabeçalho hero e o painel do
 * login (texto branco); "claro", para fundos brancos.
 */
export function MarcaLogo({
  fundo = "claro",
  tamanho = "sm",
  className,
}: {
  fundo?: "claro" | "escuro";
  tamanho?: keyof typeof ALTURAS;
  className?: string;
}) {
  const t = ALTURAS[tamanho];
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)} aria-label="Steto">
      <span className={cn("grid shrink-0 place-items-center", t.caixa, fundo === "escuro" ? "bg-white text-marca" : "bg-marca text-white")} aria-hidden>
        <Stethoscope className={t.icone} strokeWidth={2.2} />
      </span>
      <span aria-hidden className={cn("font-titulo font-bold tracking-[-0.02em]", t.texto, fundo === "escuro" ? "text-white" : "text-foreground")}>
        Steto
      </span>
    </span>
  );
}
