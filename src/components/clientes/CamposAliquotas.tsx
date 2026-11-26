import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALIQUOTAS, type ValoresAliquotas } from "@/lib/aliquotas";

/** Os 5 tributos e o desconto padrão, em %: 3 por linha no celular, 6 lado a lado no formulário largo. */
export function CamposAliquotas({ valores, onChange }: { valores: ValoresAliquotas; onChange: (v: ValoresAliquotas) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 @2xl:grid-cols-6">
      {ALIQUOTAS.map(([chave, rotulo]) => (
        <div key={chave} className="min-w-0">
          <Label htmlFor={`aliquota-${chave}`} className="truncate">{rotulo}</Label>
          <div className="relative">
            <Input
              id={`aliquota-${chave}`}
              inputMode="decimal"
              placeholder="0"
              maxLength={7}
              className="pr-7 text-right tabular-nums"
              value={valores[chave]}
              onChange={(e) => onChange({ ...valores, [chave]: e.target.value.replace(/[^\d.,]/g, "") })}
            />
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
