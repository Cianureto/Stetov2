import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarMoeda } from "@/lib/format";
import { ROTULO_TRIBUTO, TRIBUTOS, type Tributo } from "@/lib/repasse";

/** Percentuais da nota (padrão: os do cliente) com o valor de cada tributo abaixo. */
export function CamposTributos({ valores, valoresCalculados, onChange }: { valores: Record<Tributo, string>; valoresCalculados: Record<Tributo, number>; onChange: (v: Record<Tributo, string>) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 @xl:grid-cols-5">
      {TRIBUTOS.map((t) => (
        <div key={t} className="min-w-0">
          <Label htmlFor={`tributo-${t}`}>{ROTULO_TRIBUTO[t]}</Label>
          <div className="relative">
            <Input
              id={`tributo-${t}`}
              inputMode="decimal"
              maxLength={7}
              placeholder="0"
              className="pr-7 text-right tabular-nums"
              value={valores[t]}
              onChange={(e) => onChange({ ...valores, [t]: e.target.value.replace(/[^\d.,]/g, "") })}
            />
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">%</span>
          </div>
          <p className="mt-0.5 text-right text-[12px] tabular-nums text-foreground-muted">{formatarMoeda(valoresCalculados[t])}</p>
        </div>
      ))}
    </div>
  );
}
