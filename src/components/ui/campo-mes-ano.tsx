import { Input } from "@/components/ui/input";

/** Mês/ano com máscara MM/AAAA (o `type="month"` não existe no Safari do computador). */
export function CampoMesAno({ id, valor, onChange, invalido }: { id?: string; valor: string; onChange: (v: string) => void; invalido?: boolean }) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      placeholder="MM/AAAA"
      maxLength={7}
      aria-invalid={invalido || undefined}
      className="tabular-nums"
      value={valor}
      onChange={(e) => {
        const d = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
      }}
    />
  );
}
