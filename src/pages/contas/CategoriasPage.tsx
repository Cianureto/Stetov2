import { useState, type FormEvent } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Categoria } from "@/api/types";
import { EstadoCarga } from "@/components/EstadoCarga";
import { ItemCategoria } from "@/components/contas/ItemCategoria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcao } from "@/hooks/useAcao";
import { useDadosApi } from "@/hooks/useDadosApi";
import { useVoltar } from "@/hooks/useVoltar";

function NovoNome({ placeholder, rotulo, onCriar }: { placeholder: string; rotulo: string; onCriar: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const { pendente, executar } = useAcao("Não foi possível criar.");
  async function enviar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      await onCriar(nome);
      setNome("");
    });
  }
  return (
    <form onSubmit={enviar} className="flex gap-2">
      <Input aria-label={rotulo} placeholder={placeholder} maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
      <Button type="submit" variant="secondary" className="shrink-0" disabled={pendente || nome.trim().length < 2}><Plus aria-hidden /> Adicionar</Button>
    </form>
  );
}

/** /contas/categorias — categorias e subcategorias das contas. */
export default function CategoriasPage() {
  const voltar = useVoltar("/contas");
  const carga = useDadosApi<Categoria[]>("/categorias-contas", "Não foi possível carregar as categorias.");

  const criarCategoria = async (nome: string) => {
    await api.post("/categorias-contas", { nome });
    toast.success(`Categoria "${nome.trim()}" criada.`);
    carga.recarregar();
  };
  const criarSub = (categoriaId: string) => async (nome: string) => {
    await api.post(`/categorias-contas/${categoriaId}/subcategorias`, { nome });
    toast.success(`Subcategoria "${nome.trim()}" criada.`);
    carga.recarregar();
  };

  return (
    <div className="w-full pb-10">
      <button type="button" onClick={voltar} className="alvo-toque -ml-1.5 mb-3 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </button>
      <header className="mb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Financeiro</p>
        <h1 className="font-titulo text-2xl font-bold">Categorias das contas</h1>
        <p className="text-sm text-foreground-muted">Organizam as contas a pagar e receber. Inative em vez de excluir quando já houver contas usando.</p>
      </header>
      <div className="card mb-4 p-4 sm:p-5">
        <NovoNome rotulo="Nome da nova categoria" placeholder="Nova categoria, ex.: Aluguel" onCriar={criarCategoria} />
      </div>
      <EstadoCarga carga={carga} esqueleto={<Skeleton className="h-64 w-full rounded-2xl" />} vazio={(d) => d.length === 0} mensagemVazio="Nenhuma categoria ainda.">
        {(categorias) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {categorias.map((c) => (
              <section key={c.id} className="card space-y-2 p-4 sm:p-5">
                <ItemCategoria caminho={`/categorias-contas/${c.id}`} nome={c.nome} ativo={c.ativo} onMudou={carga.recarregar} />
                <div className="space-y-0.5 border-l-2 border-borda pl-3">
                  {c.subcategorias.map((s) => (
                    <ItemCategoria key={s.id} sub caminho={`/subcategorias-contas/${s.id}`} nome={s.nome} ativo={s.ativo} onMudou={carga.recarregar} />
                  ))}
                  {c.subcategorias.length === 0 && <p className="py-1 text-xs text-foreground-muted">Sem subcategorias.</p>}
                </div>
                <NovoNome rotulo={`Nova subcategoria em ${c.nome}`} placeholder="Nova subcategoria" onCriar={criarSub(c.id)} />
              </section>
            ))}
          </div>
        )}
      </EstadoCarga>
    </div>
  );
}
