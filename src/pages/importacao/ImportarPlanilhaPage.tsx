import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Importacao } from "@/api/types";
import { CampoArquivo } from "@/components/importacao/CampoArquivo";
import { ResultadoImportacao } from "@/components/importacao/ResultadoImportacao";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormTela } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { useVoltar } from "@/hooks/useVoltar";
import { lerPlanilha, type Planilha } from "@/lib/importacao/arquivo";
import { CAMPOS, mapearAutomatico, ROTULO_TIPO, type TipoImportacao } from "@/lib/importacao/campos";
import { texto } from "@/lib/importacao/normalizar";

const OPCOES_TIPO = Object.entries(ROTULO_TIPO).map(([valor, rotulo]) => ({ valor, rotulo }));

/** /importacao/planilha — escolhe o tipo e o arquivo, liga as colunas aos campos, confere e importa. */
export default function ImportarPlanilhaPage() {
  const voltar = useVoltar("/importacao");
  const [tipo, setTipo] = useState<TipoImportacao>("registros_financeiros");
  const [arquivo, setArquivo] = useState<{ nome: string; planilha: Planilha } | null>(null);
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [criarFaltantes, setCriarFaltantes] = useState(true);
  const [resultado, setResultado] = useState<Importacao | null>(null);
  const leitura = useAcao("Não foi possível ler o arquivo.");
  const envio = useAcao("Não foi possível importar.");
  const campos = CAMPOS[tipo];
  const opcoesColunas = useMemo(() => (arquivo?.planilha.colunas ?? []).map((c) => ({ valor: c, rotulo: c })), [arquivo]);
  const faltando = campos.filter((c) => c.obrigatorio && !mapa[c.chave]);
  const linhas = useMemo(
    () => (arquivo?.planilha.linhas ?? []).map((l) => Object.fromEntries(campos.filter((c) => mapa[c.chave]).map((c) => [c.chave, l[mapa[c.chave]]]))),
    [arquivo, campos, mapa],
  );

  const escolher = (arquivos: File[]) =>
    leitura.executar(async () => {
      const planilha = await lerPlanilha(arquivos[0]);
      if (!planilha.linhas.length) throw new Error("O arquivo não tem linhas com dados.");
      setArquivo({ nome: arquivos[0].name, planilha });
      setMapa(mapearAutomatico(planilha.colunas, CAMPOS[tipo]));
    });

  const mudarTipo = (t: TipoImportacao) => {
    setTipo(t);
    if (arquivo) setMapa(mapearAutomatico(arquivo.planilha.colunas, CAMPOS[t]));
  };

  const importar = () =>
    envio.executar(async () => {
      const r = await api.post<Importacao>("/importacoes", { tipo, nomeArquivo: arquivo!.nome, linhas, criarFaltantes });
      setResultado(r);
      toast[r.falhadas ? "warning" : "success"](`${r.importadas} de ${r.totalLinhas} linhas importadas.`);
    });

  if (resultado) return <div className="pb-10"><ResultadoImportacao importacao={resultado} onOutra={() => { setResultado(null); setArquivo(null); }} /></div>;

  return (
    <FormTela
      rotulo="Importação"
      titulo="Importar planilha"
      descricao="Excel (.xlsx) ou CSV. A primeira linha com dados é o cabeçalho."
      onFechar={voltar}
      onSubmit={(e) => { e.preventDefault(); void importar(); }}
      erro={leitura.erro ?? envio.erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={voltar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={!arquivo || faltando.length > 0 || envio.pendente}>
            {envio.pendente ? "Importando..." : arquivo ? `Importar ${arquivo.planilha.linhas.length} linhas` : "Importar"}
          </Button>
        </>
      }
    >
      <SecaoFormulario titulo="1. O que importar">
        <div className="max-w-sm">
          <Label htmlFor="imp-tipo">Tipo</Label>
          <Seletor id="imp-tipo" rotulo="Tipo" valor={tipo} onChange={(v) => mudarTipo(v as TipoImportacao)} opcoes={OPCOES_TIPO} />
        </div>
        {arquivo ? (
          <p className="text-sm">
            <strong>{arquivo.nome}</strong> · {arquivo.planilha.linhas.length} linhas, {arquivo.planilha.colunas.length} colunas.{" "}
            <button type="button" className="alvo-toque font-medium text-marca hover:underline" onClick={() => setArquivo(null)}>Trocar arquivo</button>
          </p>
        ) : (
          <CampoArquivo aceita=".xlsx,.csv" onArquivos={(f) => void escolher(f)} texto={leitura.pendente ? "Lendo o arquivo..." : "Escolher planilha"} ajuda="Excel (.xlsx) ou CSV separado por ; ou ," />
        )}
      </SecaoFormulario>

      {arquivo && (
        <SecaoFormulario titulo="2. Colunas" descricao={faltando.length ? `Falta ligar: ${faltando.map((c) => c.rotulo).join(", ")}.` : "Confira as sugestões; campos sem coluna ficam em branco."}>
          <div className="grid gap-3 @2xl:grid-cols-2">
            {campos.map((c) => (
              <div key={c.chave}>
                <Label htmlFor={`map-${c.chave}`}>{c.rotulo}{c.obrigatorio && <span className="text-[var(--danger)]"> *</span>}</Label>
                <Seletor id={`map-${c.chave}`} rotulo={c.rotulo} opcaoVazia="Não importar" valor={mapa[c.chave] ?? ""} onChange={(v) => setMapa((m) => ({ ...m, [c.chave]: v }))} opcoes={opcoesColunas} />
              </div>
            ))}
          </div>
        </SecaoFormulario>
      )}

      {arquivo && (
        <SecaoFormulario titulo="3. Conferir" descricao="As 5 primeiras linhas como vão entrar.">
          <div className="overflow-x-auto rounded-lg border border-borda">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[var(--areia)]"><tr>{campos.filter((c) => mapa[c.chave]).map((c) => <th key={c.chave} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{c.rotulo}</th>)}</tr></thead>
              <tbody>
                {linhas.slice(0, 5).map((l, i) => (
                  <tr key={i} className="border-t border-borda">{campos.filter((c) => mapa[c.chave]).map((c) => <td key={c.chave} className="max-w-48 truncate px-3 py-1.5">{texto(l[c.chave]) || "—"}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {tipo === "registros_financeiros" && (
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" className="mt-0.5 accent-[var(--marca)]" checked={criarFaltantes} onChange={(e) => setCriarFaltantes(e.target.checked)} />
              <span><span className="font-medium">Criar cadastros que faltam</span><span className="block text-xs text-foreground-muted">Clientes, prestadores e empresas não encontrados (por documento ou nome) entram como provisórios para revisar em Pendências.</span></span>
            </label>
          )}
        </SecaoFormulario>
      )}
    </FormTela>
  );
}
