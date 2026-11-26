import type { Cliente } from "@/api/types";
import { BadgeStatusCliente } from "@/components/clientes/BadgeStatusCliente";
import { formatarDocumento } from "@/lib/format";
import { REGIME_LABEL } from "@/lib/labels";

/** Cliente no celular (abaixo de `md`): a tabela vira cartões. */
export function CartaoCliente({ cliente }: { cliente: Cliente }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium leading-snug">{cliente.razaoSocial}</div>
        <div className="mt-0.5 text-xs tabular-nums text-foreground-muted">{formatarDocumento(cliente.documento)}</div>
        <div className="text-xs text-foreground-muted">{cliente.regimeTributario ? REGIME_LABEL[cliente.regimeTributario] : "Regime não informado"}</div>
      </div>
      <BadgeStatusCliente status={cliente.status} />
    </div>
  );
}
