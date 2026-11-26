import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { Input } from "@/components/ui/input";
import { Seletor } from "@/components/ui/seletor";
import { ROTULO_AJUSTE, type Ajuste } from "@/lib/contas";
import { lerNumeroBR } from "@/lib/format";

const OPCOES_TIPO = Object.entries(ROTULO_AJUSTE).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_MODO = [{ valor: "valor", rotulo: "Em reais" }, { valor: "percentual", rotulo: "Em %" }];

/** Juros, multa e desconto, em reais ou %, aplicados em sequência sobre o valor base. */
export function CamposAjustes({ ajustes, onChange }: { ajustes: Ajuste[]; onChange: (a: Ajuste[]) => void }) {
  const mudar = (i: number, parcial: Partial<Ajuste>) => onChange(ajustes.map((a, j) => (j === i ? { ...a, ...parcial } : a)));
  return (
    <div className="space-y-2">
      {ajustes.map((a, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 @2xl:grid-cols-[10rem_9rem_minmax(0,12rem)_auto]">
          <Seletor rotulo={`Tipo do ajuste ${i + 1}`} valor={a.tipo} onChange={(v) => mudar(i, { tipo: v as Ajuste["tipo"] })} opcoes={OPCOES_TIPO} />
          <Seletor rotulo={`Forma do ajuste ${i + 1}`} valor={a.modo} onChange={(v) => mudar(i, { modo: v as Ajuste["modo"], valor: 0 })} opcoes={OPCOES_MODO} />
          <div className="col-span-2 row-start-2 @2xl:col-span-1 @2xl:row-start-auto">
            {a.modo === "valor" ? (
              <CampoMoeda valor={a.valor} onChange={(v) => mudar(i, { valor: v })} aria-describedby={undefined} />
            ) : (
              <div className="relative">
                <Input aria-label={`Percentual do ajuste ${i + 1}`} inputMode="decimal" className="pr-7 text-right tabular-nums" value={a.valor ? String(a.valor).replace(".", ",") : ""} onChange={(e) => mudar(i, { valor: Math.max(0, lerNumeroBR(e.target.value.replace(/[^\d.,]/g, "")) || 0) })} />
                <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">%</span>
              </div>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remover ajuste ${i + 1}`} onClick={() => onChange(ajustes.filter((_, j) => j !== i))}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...ajustes, { tipo: "juros", modo: "valor", valor: 0 }])}>
        <Plus aria-hidden /> Adicionar juros, multa ou desconto
      </Button>
    </div>
  );
}
