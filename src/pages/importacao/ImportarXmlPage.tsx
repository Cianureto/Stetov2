import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Importacao } from "@/api/types";
import { CampoArquivo } from "@/components/importacao/CampoArquivo";
import { ResultadoImportacao } from "@/components/importacao/ResultadoImportacao";
import { Button } from "@/components/ui/button";
import { FormTela } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { useAcao } from "@/hooks/useAcao";
import { useVoltar } from "@/hooks/useVoltar";
import { formatarDocumento, formatarMoeda } from "@/lib/format";
import { lerNfse, type NotaXml } from "@/lib/importacao/nfse";
import { competenciaCurta } from "@/lib/repasse";
import { CaixaMarcar } from "@/components/ui/caixa-marcar";

type Lida = { arquivo: string; nota?: NotaXml; erro?: string };

const problemas = (n: NotaXml) => [!n.competencia && "sem competência", !n.valorNf && "sem valor", !n.clienteNome && !n.clienteDocumento && "sem tomador", !n.prestadorNome && !n.prestadorCpf && "sem médico identificado"].filter(Boolean) as string[];

/** /importacao/xml — lê as NFSe no navegador, mostra o que entendeu e importa como registros financeiros. */
export default function ImportarXmlPage() {
  const voltar = useVoltar("/importacao");
  const [lidas, setLidas] = useState<Lida[]>([]);
  const [criarFaltantes, setCriarFaltantes] = useState(true);
  const [resultado, setResultado] = useState<Importacao | null>(null);
  const envio = useAcao("Não foi possível importar.");
  const validas = lidas.filter((l) => l.nota);

  async function ler(arquivos: File[]) {
    const novas = await Promise.all(
      arquivos.filter((f) => f.name.toLowerCase().endsWith(".xml")).map(async (f): Promise<Lida> => {
        try {
          return { arquivo: f.name, nota: lerNfse(await f.text(), f.name) };
        } catch (e) {
          return { arquivo: f.name, erro: e instanceof Error ? e.message : "XML ilegível." };
        }
      }),
    );
    if (!novas.length) return toast.error("Nenhum arquivo .xml escolhido.");
    setLidas((atual) => [...atual, ...novas]);
  }

  const importar = () =>
    envio.executar(async () => {
      const linhas = validas.map((l, i) => {
        const n = l.nota!;
        return {
          __linha: i + 1, clienteNome: n.clienteNome, clienteDocumento: n.clienteDocumento, prestadorNome: n.prestadorNome, prestadorCpf: n.prestadorCpf,
          empresaContabilNome: n.empresaContabilNome, empresaContabilCnpj: n.empresaContabilCnpj, numeroNfs: n.numeroNfs, competencia: n.competencia,
          valorNf: n.valorNf, situacao: n.situacao, aliquotas: n.aliquotas, banco: n.banco, agencia: n.agencia, conta: n.conta, chavePix: n.chavePix,
        };
      });
      const r = await api.post<Importacao>("/importacoes", { tipo: "registros_financeiros", nomeArquivo: validas.length === 1 ? validas[0].arquivo : `${validas.length} arquivos XML`, linhas, criarFaltantes });
      setResultado(r);
      toast[r.falhadas ? "warning" : "success"](`${r.importadas} de ${r.totalLinhas} notas importadas.`);
    });

  if (resultado) return <div className="pb-10"><ResultadoImportacao importacao={resultado} onOutra={() => { setResultado(null); setLidas([]); }} /></div>;

  return (
    <FormTela
      rotulo="Importação"
      titulo="Importar XML de NFSe"
      descricao="Escolha uma ou várias notas. Os percentuais de tributos vêm dos valores retidos em cada nota; o desconto padrão, do cadastro do prestador."
      onFechar={voltar}
      onSubmit={(e) => { e.preventDefault(); void importar(); }}
      erro={envio.erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={voltar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={!validas.length || envio.pendente}>{envio.pendente ? "Importando..." : `Importar ${validas.length} ${validas.length === 1 ? "nota" : "notas"}`}</Button>
        </>
      }
    >
      <SecaoFormulario titulo="Arquivos">
        <CampoArquivo aceita=".xml" multiplo onArquivos={(f) => void ler(f)} texto="Escolher arquivos XML" ajuda="Dá para escolher vários de uma vez" />
        <label className="flex items-start gap-2.5 text-sm">
          <CaixaMarcar className="mt-0.5" marcada={criarFaltantes} onChange={setCriarFaltantes} />
          <span><span className="font-medium">Criar cadastros que faltam</span><span className="block text-xs text-foreground-muted">Tomadores, médicos e empresas não encontrados entram como provisórios para revisar em Pendências.</span></span>
        </label>
      </SecaoFormulario>
      {lidas.length > 0 && (
        <SecaoFormulario titulo={`Notas lidas (${validas.length} de ${lidas.length})`} acao={<Button type="button" size="sm" variant="ghost" onClick={() => setLidas([])}>Limpar</Button>}>
          <ul className="divide-y divide-borda rounded-lg border border-borda text-[13px]">
            {lidas.map((l, i) => (
              <li key={`${l.arquivo}-${i}`} className="linha-hover grid gap-1 px-3 py-2 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_7rem] @2xl:items-center">
                {l.nota ? (
                  <>
                    <div className="min-w-0"><div className="truncate font-medium">{l.nota.clienteNome || formatarDocumento(l.nota.clienteDocumento) || "Tomador não identificado"}</div><div className="truncate text-foreground-muted">NFS {l.nota.numeroNfs || "—"} · {l.arquivo}</div></div>
                    <div className="min-w-0"><div className="truncate">{l.nota.prestadorNome || "Médico não identificado"}</div><div className="truncate text-foreground-muted">{l.nota.empresaContabilNome || "—"}</div></div>
                    <div className="tabular-nums">{competenciaCurta(l.nota.competencia || null)} · {formatarMoeda(l.nota.valorNf)}</div>
                    <div className={problemas(l.nota).length ? "text-[var(--aviso)]" : "text-[var(--sucesso)]"}>{problemas(l.nota).join(", ") || "ok"}</div>
                  </>
                ) : (
                  <div className="text-[var(--danger)] @2xl:col-span-4">{l.arquivo}: {l.erro}</div>
                )}
              </li>
            ))}
          </ul>
        </SecaoFormulario>
      )}
    </FormTela>
  );
}
