import { Badge } from "@/components/ui/badge";
import { hojeBrasilia, situacaoConta } from "@/lib/contas";

const ROTULO = { paga: "Paga", vencida: "Vencida", vence_hoje: "Vence hoje", a_vencer: "A vencer" } as const;
const VARIANTE = { paga: "sucesso", vencida: "perigo", vence_hoje: "aviso", a_vencer: "info" } as const;

export function BadgeSituacaoConta({ status, dataVencimento }: { status: string; dataVencimento: string }) {
  const s = situacaoConta({ status, dataVencimento }, hojeBrasilia());
  return <Badge variant={VARIANTE[s]}>{ROTULO[s]}</Badge>;
}
