import type { StatusCliente } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { STATUS_CLIENTE_LABEL } from "@/lib/labels";

const VARIANTE = { ativo: "sucesso", inativo: "neutral", provisorio: "aviso" } as const;

/** Situação do cliente: cor + texto (a cor nunca é o único sinal). */
export function BadgeStatusCliente({ status }: { status: StatusCliente }) {
  return <Badge variant={VARIANTE[status]}>{STATUS_CLIENTE_LABEL[status]}</Badge>;
}
