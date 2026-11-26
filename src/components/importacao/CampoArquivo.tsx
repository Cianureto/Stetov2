import { useId } from "react";
import { Upload } from "lucide-react";

/** Escolha de arquivo com área grande de toque (botão nativo escondido, rótulo como alvo). */
export function CampoArquivo({ aceita, multiplo, onArquivos, texto, ajuda }: { aceita: string; multiplo?: boolean; onArquivos: (f: File[]) => void; texto: string; ajuda: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--borda-forte)] bg-[var(--areia)] px-4 py-8 text-center transition-colors hover:border-marca hover:bg-marca-claro/40 focus-within:ring-2 focus-within:ring-marca">
      <Upload className="size-6 text-marca" aria-hidden />
      <span className="font-medium">{texto}</span>
      <span className="text-xs text-foreground-muted">{ajuda}</span>
      <input
        id={id}
        type="file"
        accept={aceita}
        multiple={multiplo}
        className="sr-only"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (arquivos.length) onArquivos(arquivos);
        }}
      />
    </label>
  );
}
