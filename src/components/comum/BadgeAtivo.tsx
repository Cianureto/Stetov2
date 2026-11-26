import type { StatusAtivo } from "@/api/types";
import { Badge } from "@/components/ui/badge";

/** Ativo/Inativo (cor + texto). */
export function BadgeAtivo({ status, feminino = false }: { status: StatusAtivo; feminino?: boolean }) {
  return status === "ativo" ? <Badge variant="sucesso">{feminino ? "Ativa" : "Ativo"}</Badge> : <Badge variant="neutral">{feminino ? "Inativa" : "Inativo"}</Badge>;
}
