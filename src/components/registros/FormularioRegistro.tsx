import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { OpcaoApi, Registro } from "@/api/types";
import { FormularioCliente } from "@/components/clientes/FormularioCliente";
import { FormularioEmpresaContabil } from "@/components/empresas-contabeis/FormularioEmpresaContabil";
import { FormularioPrestador } from "@/components/prestadores/FormularioPrestador";
import { CamposTributos } from "@/components/registros/CamposTributos";
import { ResumoRepasse } from "@/components/registros/ResumoRepasse";
import { useLancamento } from "@/components/registros/useLancamento";
import { Button } from "@/components/ui/button";
import { CampoMesAno } from "@/components/ui/campo-mes-ano";
import { CampoMoeda } from "@/components/ui/campo-moeda";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { useDadosApi } from "@/hooks/useDadosApi";
import { formatarMoeda, formatarPercentual, lerNumeroBR } from "@/lib/format";
import { SITUACAO_REGISTRO_LABEL, TIPO_PAGAMENTO_LABEL } from "@/lib/labels";
import { calcularRepasse, competenciaParaBanco, TRIBUTOS, type Tributo } from "@/lib/repasse";

const OPCOES_SITUACAO = Object.entries(SITUACAO_REGISTRO_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_TIPO_PAGAMENTO = Object.entries(TIPO_PAGAMENTO_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
type Novo = "cliente" | "prestador" | "empresa" | null;

function RotuloComNovo({ htmlFor, children, onNovo, rotuloNovo }: { htmlFor: string; children: ReactNode; onNovo: () => void; rotuloNovo: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <button type="button" onClick={onNovo} className="alvo-toque inline-flex items-center gap-1 text-xs font-medium text-marca hover:underline">
        <Plus className="size-3" aria-hidden /> {rotuloNovo}
      </button>
    </div>
  );
}

/** Lançamento de nota e repasse (tela /registros/novo e /registros/:id). O servidor refaz o cálculo ao salvar. */
export function FormularioRegistro({ modo, registro, onFechar, onSalvo }: PropsFormulario<Registro> & { registro?: Registro }) {
  const l = useLancamento(registro);
  const clientes = useDadosApi<OpcaoApi[]>("/clientes/opcoes");
  const prestadores = useDadosApi<OpcaoApi[]>("/prestadores/opcoes");
  const empresas = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const [novo, setNovo] = useState<Novo>(null);
  const { pendente, erro, executar } = useAcao("Não foi possível salvar o registro.");

  const aliquotasNumero = useMemo(() => Object.fromEntries(TRIBUTOS.map((t) => [t, lerNumeroBR(l.aliquotas[t]) || 0])) as Record<Tributo, number>, [l.aliquotas]);
  const calculo = calcularRepasse({ valorNf: l.valorNf, aliquotas: aliquotasNumero, descontoPadraoPercent: l.descontoPercent, descontoAdicional: l.descontoAdicional, acrescimo: l.acrescimo });

  // Clientes que o prestador atende aparecem primeiro.
  const opcoesClientes = useMemo(() => {
    const atende = new Set(l.prestador?.clientes.map((c) => c.id));
    const todas = clientes.dados ?? [];
    return [...todas.filter((o) => atende.has(o.valor)).map((o) => ({ ...o, descricao: `Atendido por este prestador · ${o.descricao ?? ""}` })), ...todas.filter((o) => !atende.has(o.valor))];
  }, [clientes.dados, l.prestador]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      if (!competenciaParaBanco(l.competencia)) throw new Error("Competência inválida. Use MM/AAAA, por exemplo 11/2026.");
      if (TRIBUTOS.some((t) => Number.isNaN(lerNumeroBR(l.aliquotas[t])))) throw new Error("Confira os tributos: use números como 2,5.");
      if (calculo.valorFinalRepasse < 0) throw new Error("O repasse ficou negativo: diminua o desconto adicional.");
      const corpo = {
        prestadorId: l.prestadorId, clienteId: l.clienteId, empresaContabilId: l.empresaContabilId, competencia: l.competencia,
        numeroNfs: l.numeroNfs, setor: l.setor, situacao: l.situacao, tipoPagamento: l.tipoPagamento || null, dataPagamento: l.dataPagamento || null,
        valorNf: l.valorNf, aliquotas: aliquotasNumero, descontoAdicional: l.descontoAdicional, acrescimo: l.acrescimo,
      };
      const salvo = registro ? await api.patch<Registro>(`/registros/${registro.id}`, corpo) : await api.post<Registro>("/registros", corpo);
      toast.success(registro ? "Registro atualizado." : `Registro lançado: repasse de ${formatarMoeda(salvo.valorFinalRepasse)}.`);
      onSalvo(salvo);
    });
  }

  const banco = l.prestador ?? (registro ? { banco: registro.banco, agencia: registro.agencia, conta: registro.conta, chavePix: registro.chavePix } : null);

  return (
    <>
      <MolduraFormulario
        modo={modo}
        rotulo="Financeiro"
        titulo={registro ? "Editar registro" : "Novo registro"}
        descricao="Nota emitida para o cliente e o repasse ao prestador."
        largura="lg"
        onFechar={onFechar}
        onSubmit={salvar}
        erro={erro}
        footer={
          <>
            <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={pendente || l.carregandoAuto}>
              {pendente ? "Salvando..." : registro ? "Salvar alterações" : "Lançar registro"}
            </Button>
          </>
        }
      >
        <SecaoFormulario titulo="Quem e quando" descricao="Ao escolher o prestador, a empresa contábil e o cliente são sugeridos pelos vínculos dele.">
          <div className="grid gap-3 @2xl:grid-cols-2">
            <div>
              <RotuloComNovo htmlFor="reg-prestador" onNovo={() => setNovo("prestador")} rotuloNovo="Novo prestador">Prestador</RotuloComNovo>
              <Seletor id="reg-prestador" rotulo="Prestador" obrigatorio pesquisavel valor={l.prestadorId} onChange={(v) => void l.escolherPrestador(v)} opcoes={prestadores.dados ?? []} placeholder={prestadores.carregando ? "Carregando..." : "Escolha o prestador"} />
            </div>
            <div>
              <RotuloComNovo htmlFor="reg-cliente" onNovo={() => setNovo("cliente")} rotuloNovo="Novo cliente">Cliente</RotuloComNovo>
              <Seletor id="reg-cliente" rotulo="Cliente" obrigatorio pesquisavel valor={l.clienteId} onChange={(v) => void l.escolherCliente(v)} opcoes={opcoesClientes} placeholder={clientes.carregando ? "Carregando..." : "Escolha o cliente"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-[minmax(0,1fr)_9rem_10rem_minmax(0,0.8fr)]">
            <div className="col-span-2 @2xl:col-span-1">
              <RotuloComNovo htmlFor="reg-empresa" onNovo={() => setNovo("empresa")} rotuloNovo="Nova empresa">Empresa contábil</RotuloComNovo>
              <Seletor id="reg-empresa" rotulo="Empresa contábil" obrigatorio pesquisavel valor={l.empresaContabilId} onChange={l.setEmpresaContabilId} opcoes={empresas.dados ?? []} placeholder={empresas.carregando ? "Carregando..." : "Escolha a empresa"} />
            </div>
            <div>
              <Label htmlFor="reg-competencia">Competência</Label>
              <CampoMesAno id="reg-competencia" valor={l.competencia} onChange={l.setCompetencia} />
            </div>
            <div>
              <Label htmlFor="reg-nfs">Nº da NFS</Label>
              <Input id="reg-nfs" maxLength={40} className="tabular-nums" value={l.numeroNfs} onChange={(e) => l.setNumeroNfs(e.target.value)} />
            </div>
            <div className="col-span-2 @2xl:col-span-1">
              <Label htmlFor="reg-setor">Setor (opcional)</Label>
              <Input id="reg-setor" maxLength={80} value={l.setor} onChange={(e) => l.setSetor(e.target.value)} />
            </div>
          </div>
        </SecaoFormulario>

        <SecaoFormulario titulo="Nota e tributos" descricao="Os percentuais vêm do cliente e podem ser ajustados nesta nota.">
          <div className="max-w-60">
            <Label htmlFor="reg-valor-nf">Valor da NF</Label>
            <CampoMoeda id="reg-valor-nf" valor={l.valorNf} onChange={l.setValorNf} />
          </div>
          <CamposTributos valores={l.aliquotas} valoresCalculados={calculo.tributos} onChange={l.setAliquotas} />
        </SecaoFormulario>

        <SecaoFormulario titulo="Descontos e acréscimos" descricao={`Desconto padrão do prestador: ${formatarPercentual(l.descontoPercent)} da NF (definido no cadastro dele).`}>
          <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
            <div>
              <Label htmlFor="reg-desconto-padrao">Desconto padrão</Label>
              <Input id="reg-desconto-padrao" readOnly tabIndex={-1} className="bg-[var(--areia)] text-right tabular-nums" value={formatarMoeda(calculo.descontoPadraoAplicado)} />
            </div>
            <div>
              <Label htmlFor="reg-desconto-adicional">Desconto adicional</Label>
              <CampoMoeda id="reg-desconto-adicional" valor={l.descontoAdicional} onChange={l.setDescontoAdicional} />
            </div>
            <div>
              <Label htmlFor="reg-acrescimo">Acréscimo</Label>
              <CampoMoeda id="reg-acrescimo" valor={l.acrescimo} onChange={l.setAcrescimo} />
            </div>
          </div>
        </SecaoFormulario>

        <SecaoFormulario titulo="Pagamento" descricao={banco?.banco ? `Repasse para ${[banco.banco, banco.agencia && `ag. ${banco.agencia}`, banco.conta && `conta ${banco.conta}`].filter(Boolean).join(", ")}${banco.chavePix ? ` · Pix ${banco.chavePix}` : ""}.` : "O prestador ainda não tem dados bancários no cadastro."}>
          <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
            <div>
              <Label htmlFor="reg-situacao">Situação</Label>
              <Seletor id="reg-situacao" rotulo="Situação" valor={l.situacao} onChange={(v) => l.setSituacao(v as Registro["situacao"])} opcoes={OPCOES_SITUACAO} />
            </div>
            <div>
              <Label htmlFor="reg-tipo-pagamento">Forma</Label>
              <Seletor id="reg-tipo-pagamento" rotulo="Forma de pagamento" valor={l.tipoPagamento} onChange={l.setTipoPagamento} opcoes={OPCOES_TIPO_PAGAMENTO} />
            </div>
            <div className="col-span-2 @2xl:col-span-1">
              <Label htmlFor="reg-data-pagamento">Data do pagamento</Label>
              <Input id="reg-data-pagamento" type="date" value={l.dataPagamento} onChange={(e) => l.setDataPagamento(e.target.value)} />
            </div>
          </div>
        </SecaoFormulario>

        <ResumoRepasse valorNf={l.valorNf} calculo={calculo} descontoPercent={l.descontoPercent} descontoAdicional={l.descontoAdicional} acrescimo={l.acrescimo} />
      </MolduraFormulario>

      {novo === "cliente" && <FormularioCliente modo="modal" onFechar={() => setNovo(null)} onSalvo={(c) => { setNovo(null); clientes.recarregar(); void l.escolherCliente(c.id); }} />}
      {novo === "prestador" && <FormularioPrestador modo="modal" onFechar={() => setNovo(null)} onSalvo={(p) => { setNovo(null); prestadores.recarregar(); void l.escolherPrestador(p.id); }} />}
      {novo === "empresa" && <FormularioEmpresaContabil modo="modal" onFechar={() => setNovo(null)} onSalvo={(e) => { setNovo(null); empresas.recarregar(); l.setEmpresaContabilId(e.id); }} />}
    </>
  );
}
