import type { Prestador } from "@/api/types";
import { BadgesPrestador } from "@/components/prestadores/BadgesPrestador";
import { formatarCpf } from "@/lib/mascaras";

/** Prestador no celular (abaixo de `md`). */
export function CartaoPrestador({ prestador }: { prestador: Prestador }) {
  const atende = prestador.clientes.map((c) => c.razaoSocial);
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium leading-snug">{prestador.nomeCompleto}</div>
        <div className="mt-0.5 text-xs tabular-nums text-foreground-muted">
          {formatarCpf(prestador.cpf)}
          {prestador.crm && ` · CRM ${prestador.crm}`}
        </div>
        <div className="truncate text-xs text-foreground-muted">{atende.length ? `Atende em ${atende.join(", ")}` : "Sem clientes vinculados"}</div>
      </div>
      <BadgesPrestador prestador={prestador} />
    </div>
  );
}
