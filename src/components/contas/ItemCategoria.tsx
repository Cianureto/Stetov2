import { useState } from "react";
import { Check, EyeOff, Eye, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { confirmar } from "@/components/ui/confirmar";
import { Input } from "@/components/ui/input";
import { useAcao } from "@/hooks/useAcao";
import { cn } from "@/lib/cn";

/** Uma categoria ou subcategoria: renomear no lugar, inativar/reativar e excluir (só se nenhuma conta usar). */
export function ItemCategoria({ caminho, nome, ativo, onMudou, sub = false }: { caminho: string; nome: string; ativo: boolean; onMudou: () => void; sub?: boolean }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nome);
  const { pendente, executar } = useAcao("Não foi possível salvar.");
  const tipo = sub ? "subcategoria" : "categoria";

  const salvar = (dados: { nome: string; ativo?: boolean }, aviso: string) =>
    executar(async () => {
      await api.patch(caminho, dados);
      toast.success(aviso);
      setEditando(false);
      onMudou();
    });

  async function excluir() {
    if (!(await confirmar({ titulo: `Excluir a ${tipo} "${nome}"?`, descricao: sub ? undefined : "As subcategorias dela também são excluídas.", acao: "Excluir" }))) return;
    await executar(async () => {
      await api.delete(caminho);
      toast.success(`${sub ? "Subcategoria" : "Categoria"} excluída.`);
      onMudou();
    });
  }

  if (editando) {
    return (
      <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); void salvar({ nome: texto, ativo }, "Nome atualizado."); }}>
        <Input autoFocus aria-label={`Novo nome da ${tipo}`} maxLength={80} value={texto} onChange={(e) => setTexto(e.target.value)} className="h-8" />
        <Button type="submit" size="icon-sm" variant="accent" aria-label="Salvar nome" disabled={pendente || texto.trim().length < 2}><Check aria-hidden /></Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Cancelar" onClick={() => { setTexto(nome); setEditando(false); }}><X aria-hidden /></Button>
      </form>
    );
  }
  return (
    <div className="flex min-h-9 items-center gap-1.5">
      <span className={cn("min-w-0 flex-1 truncate", !sub && "font-medium", !ativo && "text-foreground-muted line-through")}>{nome}</span>
      {!ativo && <span className="text-xs text-foreground-muted">inativa</span>}
      <Button size="icon-sm" variant="ghost" aria-label={`Renomear ${nome}`} onClick={() => setEditando(true)}><Pencil aria-hidden /></Button>
      <Button size="icon-sm" variant="ghost" aria-label={`${ativo ? "Inativar" : "Reativar"} ${nome}`} disabled={pendente} onClick={() => void salvar({ nome, ativo: !ativo }, ativo ? "Inativada: some das opções ao lançar contas." : "Reativada.")}>
        {ativo ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label={`Excluir ${nome}`} disabled={pendente} onClick={() => void excluir()}><Trash2 aria-hidden /></Button>
    </div>
  );
}
