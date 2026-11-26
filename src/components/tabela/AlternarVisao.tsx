import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

export type Visao = "galeria" | "lista";

const OPCOES: { id: Visao; label: string; Icone: typeof List }[] = [
  { id: "galeria", label: "Galeria", Icone: LayoutGrid },
  { id: "lista", label: "Lista", Icone: List },
];

/** Botões galeria/lista ao lado da pesquisa (use com `useVisaoLembrada`). */
export function AlternarVisao({ visao, onChange }: { visao: Visao; onChange: (v: Visao) => void }) {
  return (
    <div role="group" aria-label="Forma de exibição" className="flex shrink-0 rounded-lg border border-[var(--borda-forte)] bg-areia-card p-0.5">
      {OPCOES.map(({ id, label, Icone }) => (
        <button
          key={id}
          type="button"
          aria-pressed={visao === id}
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn("grid h-8 w-9 place-items-center rounded-md transition-colors pointer-coarse:h-10 pointer-coarse:w-10", visao === id ? "bg-marca text-white" : "text-foreground-muted hover:text-foreground")}
        >
          <Icone className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
