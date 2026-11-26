import type { Prestador } from "@/api/types";
import { Badge } from "@/components/ui/badge";

/** Cadastro completo/incompleto e, se for o caso, "Inativo" (cor + texto). */
export function BadgesPrestador({ prestador }: { prestador: Prestador }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {prestador.cadastroCompleto ? <Badge variant="sucesso">Completo</Badge> : <Badge variant="aviso">Incompleto</Badge>}
      {prestador.status === "inativo" && <Badge variant="neutral">Inativo</Badge>}
    </span>
  );
}
