import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { confirmar } from "@/components/ui/confirmar";
import { useAuth } from "@/context/useAuth";
import type { AcaoTabela } from "@/lib/acoesTabela";
import { mensagemErro } from "@/lib/erros";
import { pode } from "@/lib/permissoes";

/**
 * Seleção de linhas e execução das ações de uma tabela (em linha e em massa). Só entram as ações que o
 * perfil do usuário permite (RBAC); sem nenhuma, a tabela não mostra caixas de seleção. A seleção guarda a
 * linha inteira (vale entre páginas) e é limpa depois de uma ação. `executar` filtra as linhas em que a ação
 * se aplica, confirma quando a ação pede, chama a API e avisa o resultado (inclusive o que falhou e por quê).
 */
/** Itens por chamada da rota em massa (o máximo da API, `MAX_EM_MASSA`). */
const TAMANHO_LOTE = 100;

export function useAcoesTabela<T>({ acoes, chave, nome, aoConcluir }: {
  acoes: AcaoTabela<T>[];
  chave: (linha: T) => string;
  /** Nome da linha nos avisos de falha (ex.: o nome do usuário). */
  nome: (linha: T) => string;
  aoConcluir?: () => void;
}) {
  const { usuario } = useAuth();
  const permitidas = useMemo(() => acoes.filter((a) => pode(usuario, a.permissao)), [acoes, usuario]);
  const [selecionadas, setSelecionadas] = useState<Map<string, T>>(new Map());
  const [emAndamento, setEmAndamento] = useState<string | null>(null);
  // "Selecionar todos os resultados" (todas as páginas) x "todos desta página": lembra de onde veio a seleção.
  const [todosOsResultados, setTodosOsResultados] = useState(false);
  const [selecionandoTodos, setSelecionandoTodos] = useState(false);

  const alternar = useCallback((linha: T) => {
    setTodosOsResultados(false);
    setSelecionadas((atual) => {
      const nova = new Map(atual);
      const id = chave(linha);
      if (nova.has(id)) nova.delete(id);
      else nova.set(id, linha);
      return nova;
    });
  }, [chave]);

  /** Marca todas as linhas da página; se já estão todas marcadas, desmarca-as. */
  const alternarPagina = useCallback((linhas: T[]) => {
    setTodosOsResultados(false);
    setSelecionadas((atual) => {
      const nova = new Map(atual);
      const todas = linhas.length > 0 && linhas.every((l) => nova.has(chave(l)));
      for (const l of linhas) {
        if (todas) nova.delete(chave(l));
        else nova.set(chave(l), l);
      }
      return nova;
    });
  }, [chave]);

  // "Selecionar todos os resultados" (todas as páginas, com a pesquisa e os filtros atuais) x "todos desta
  // página" (a caixa do cabeçalho). `todosOsResultados` lembra que a seleção veio do primeiro.
  const selecionarTodos = useCallback(async (buscar: () => Promise<T[]>) => {
    setSelecionandoTodos(true);
    try {
      const todas = await buscar();
      setSelecionadas(new Map(todas.map((l) => [chave(l), l])));
      setTodosOsResultados(true);
    } catch (e) {
      // ApiError traz a mensagem da API; o limite de resultados é um Error com a mensagem pronta.
      toast.error(e instanceof Error && e.message ? e.message : mensagemErro(e, "Não foi possível selecionar todos os resultados."));
    } finally {
      setSelecionandoTodos(false);
    }
  }, [chave]);
  const selecionarSoPagina = useCallback((linhas: T[]) => {
    setSelecionadas(new Map(linhas.map((l) => [chave(l), l])));
    setTodosOsResultados(false);
  }, [chave]);
  const limpar = useCallback(() => {
    setSelecionadas(new Map());
    setTodosOsResultados(false);
  }, []);

  const executar = useCallback(async (acao: AcaoTabela<T>, linhas: T[]) => {
    const alvos = linhas.filter((l) => !acao.aplicavel || acao.aplicavel(l));
    if (!alvos.length || emAndamento) return;
    if (acao.confirmar && !(await confirmar(acao.confirmar(alvos)))) return;
    setEmAndamento(acao.chave);
    try {
      // A API aceita até 100 itens por chamada: seleções maiores ("todos os resultados") vão em lotes.
      const ids = alvos.map(chave);
      let feitos = 0;
      const falhas: { id: string; erro: string }[] = [];
      for (let i = 0; i < ids.length; i += TAMANHO_LOTE) {
        const parcial = await acao.executar(ids.slice(i, i + TAMANHO_LOTE));
        feitos += parcial.feitos;
        falhas.push(...parcial.falhas);
      }
      if (feitos > 0) toast.success(acao.sucesso(feitos));
      if (falhas.length > 0) {
        const porId = new Map(alvos.map((l) => [chave(l), l]));
        const motivos = falhas.slice(0, 3).map((f) => `${porId.has(f.id) ? nome(porId.get(f.id)!) : "Item"}: ${f.erro}`);
        const resto = falhas.length > 3 ? ` (e mais ${falhas.length - 3})` : "";
        toast.error(falhas.length === 1 ? "1 item não pôde ser alterado" : `${falhas.length} itens não puderam ser alterados`, { description: motivos.join("\n") + resto, duration: 9000 });
      }
      setSelecionadas(new Map());
      setTodosOsResultados(false);
      aoConcluir?.();
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível concluir a ação."));
    } finally {
      setEmAndamento(null);
    }
  }, [chave, nome, aoConcluir, emAndamento]);

  return {
    acoes: permitidas, selecionadas, alternar, alternarPagina, limpar, executar, emAndamento, chave, nome,
    todosOsResultados, selecionandoTodos, selecionarTodos, selecionarSoPagina,
  };
}

export type ControleAcoes<T> = ReturnType<typeof useAcoesTabela<T>>;
