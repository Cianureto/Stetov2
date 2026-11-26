import type { SituacaoRegistro } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { SITUACAO_REGISTRO_LABEL } from "@/lib/labels";

const VARIANTE = { pendente: "aviso", pago: "sucesso", cancelado: "neutral" } as const;

export function BadgeSituacao({ situacao }: { situacao: SituacaoRegistro }) {
  return <Badge variant={VARIANTE[situacao]}>{SITUACAO_REGISTRO_LABEL[situacao]}</Badge>;
}
