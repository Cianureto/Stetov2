import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, FileCode2, FileSpreadsheet, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Importacao, ListaImportacoes } from "@/api/types";
import { baixarErros } from "@/lib/importacao/erros";
import { BarraTabela } from "@/components/tabela/BarraTabela";
import { TabelaDados } from "@/components/tabela/TabelaDados";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CabecalhoHero } from "@/components/ui/cabecalho-hero";
import { confirmar } from "@/components/ui/confirmar";
import { useTabelaServidor } from "@/hooks/useTabelaServidor";
import { mensagemErro } from "@/lib/erros";
import { ROTULO_TIPO } from "@/lib/importacao/campos";
import type { Coluna } from "@/lib/tabela";

const chave = (i: Importacao) => i.id;
const STATUS = { sucesso: ["sucesso", "Concluída"], parcial: ["aviso", "Com falhas"], falha: ["perigo", "Falhou"] } as const;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Opcao({ para, Icone, titulo, texto }: { para: string; Icone: typeof FileSpreadsheet; titulo: string; texto: string }) {
  return (
    <Link to={para} className="card card-hover flex items-start gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-claro text-marca"><Icone className="size-5" aria-hidden /></span>
      <span>
        <span className="block font-titulo text-[15px] font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-sm text-foreground-muted">{texto}</span>
      </span>
    </Link>
  );
}

/** /importacao — planilha, XML de NFSe e o histórico (com desfazer). */
export default function ImportacaoPage() {
  const tabela = useTabelaServidor<Importacao, ListaImportacoes>("/importacoes", "importacoes", { ordemPadrao: "-criadoEm", naUrl: "", mensagemFalha: "Não foi possível carregar o histórico." });
  const { recarregar } = tabela;

  const desfazer = useCallback(async (i: Importacao) => {
    const ok = await confirmar({ titulo: `Desfazer a importação de "${i.nomeArquivo}"?`, descricao: `Apaga as ${i.importadas} linhas importadas${i.novosCadastros ? ` e os ${i.novosCadastros} cadastros provisórios criados por ela` : ""}. Não pode ser desfeito.`, acao: "Desfazer importação" });
    if (!ok) return;
    try {
      await api.delete(`/importacoes/${i.id}`);
      toast.success("Importação desfeita.");
      recarregar?.();
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível desfazer."));
    }
  }, [recarregar]);

  const colunas = useMemo<Coluna<Importacao>[]>(() => [
    { chave: "criadoEm", titulo: "Quando", filtro: { tipo: "data" }, ordemInicial: "desc", render: (i) => quando(i.criadoEm), className: "whitespace-nowrap tabular-nums text-foreground-secondary" },
    { chave: "nomeArquivo", titulo: "Arquivo", filtro: { tipo: "texto" }, render: (i) => <div className="min-w-0 max-w-72"><div className="truncate font-medium">{i.nomeArquivo}</div><div className="text-xs text-foreground-muted">{ROTULO_TIPO[i.tipo]}</div></div> },
    { chave: "tipo", titulo: "Tipo", filtro: { tipo: "opcoes", opcoes: ROTULO_TIPO }, soFiltro: true },
    { chave: "importadas", titulo: "Importadas", filtro: { tipo: "numero" }, alinhar: "direita", render: (i) => `${i.importadas} de ${i.totalLinhas}`, className: "tabular-nums whitespace-nowrap" },
    { chave: "falhadas", titulo: "Com erro", filtro: { tipo: "numero" }, alinhar: "direita", className: "hidden md:table-cell tabular-nums" },
    { chave: "status", titulo: "Situação", filtro: { tipo: "opcoes", opcoes: { sucesso: "Concluída", parcial: "Com falhas", falha: "Falhou" } }, render: (i) => <Badge variant={STATUS[i.status][0]}>{STATUS[i.status][1]}</Badge> },
    {
      chave: "acoes", titulo: "Ações", ordenavel: false, alinhar: "direita",
      render: (i) => (
        <div className="flex justify-end gap-1">
          {i.erros.length > 0 && <Button size="icon-sm" variant="secondary" aria-label={`Baixar erros de ${i.nomeArquivo}`} title="Baixar erros" onClick={() => baixarErros(i)}><Download aria-hidden /></Button>}
          <Button size="sm" variant="danger-ghost" onClick={() => void desfazer(i)}><Undo2 aria-hidden /> Desfazer</Button>
        </div>
      ),
    },
  ], [desfazer]);

  return (
    <div className="space-y-6">
      <CabecalhoHero
        rotulo="Administração"
        titulo="Importação"
        descricao="Traga cadastros e notas de planilhas ou de arquivos XML de NFSe. Cada importação pode ser desfeita pelo histórico."
        numeros={[{ valor: tabela.resposta?.meta.total, rotulo: "Importações feitas" }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Opcao para="/importacao/planilha" Icone={FileSpreadsheet} titulo="Planilha (Excel ou CSV)" texto="Registros, clientes, prestadores ou empresas contábeis, com o mapeamento das colunas." />
        <Opcao para="/importacao/xml" Icone={FileCode2} titulo="XML de NFSe" texto="Uma ou várias notas de uma vez; cliente, prestador e valores são lidos da nota." />
      </div>
      <div className="card overflow-hidden">
        <h2 className="px-4 pt-4 font-titulo text-[15px] font-semibold">Histórico</h2>
        <BarraTabela tabela={tabela} colunas={colunas} placeholder="Pesquisar arquivo…" className="border-b border-borda p-4" />
        <TabelaDados tabela={tabela} colunas={colunas} chaveLinha={chave} vazio="Nenhuma importação ainda."
          renderCelular={(i) => (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2"><span className="font-medium">{i.nomeArquivo}</span><Badge variant={STATUS[i.status][0]}>{STATUS[i.status][1]}</Badge></div>
              <div className="text-xs text-foreground-muted">{quando(i.criadoEm)} · {ROTULO_TIPO[i.tipo]} · {i.importadas} de {i.totalLinhas}</div>
              <Button size="sm" variant="danger-ghost" onClick={() => void desfazer(i)}><Undo2 aria-hidden /> Desfazer</Button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
