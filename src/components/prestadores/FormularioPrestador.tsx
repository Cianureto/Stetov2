import { useState, type FormEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { OpcaoApi, Prestador, StatusAtivo } from "@/api/types";
import { CamposBancarios, type DadosBancarios } from "@/components/prestadores/CamposBancarios";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { SeletorMultiplo } from "@/components/ui/seletor-multiplo";
import { useAcao } from "@/hooks/useAcao";
import { useDadosApi } from "@/hooks/useDadosApi";
import { lerNumeroBR, percentualParaCampo } from "@/lib/format";
import { REGIME_LABEL, STATUS_ATIVO_LABEL } from "@/lib/labels";
import { formatarCpf, formatarTelefone, validarCampos } from "@/lib/mascaras";

const OPCOES_REGIME = Object.entries(REGIME_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_STATUS = Object.entries(STATUS_ATIVO_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));

/** O que falta para o cadastro ficar completo (mesma regra da coluna cadastro_completo no banco). */
function faltandoNoCadastro(v: { telefone: string; email: string; banco: string; agencia: string }) {
  return [!v.telefone.trim() && "telefone", !v.email.trim() && "e-mail", !v.banco.trim() && "banco", !v.agencia.trim() && "agência"].filter(Boolean) as string[];
}

/** Cadastro de prestador (tela /prestadores/novo e /prestadores/:id). Prestador e vínculos são gravados juntos. */
export function FormularioPrestador({ modo, prestador, onFechar, onSalvo }: PropsFormulario<Prestador> & { prestador?: Prestador }) {
  const [nome, setNome] = useState(prestador?.nomeCompleto ?? "");
  const [cpf, setCpf] = useState(prestador ? formatarCpf(prestador.cpf) : "");
  const [crm, setCrm] = useState(prestador?.crm ?? "");
  const [status, setStatus] = useState<StatusAtivo>(prestador?.status ?? "ativo");
  const [email, setEmail] = useState(prestador?.email ?? "");
  const [telefone, setTelefone] = useState(prestador?.telefone ? formatarTelefone(prestador.telefone) : "");
  const [regime, setRegime] = useState<string>(prestador?.regimeTributario ?? "");
  const [desconto, setDesconto] = useState(percentualParaCampo(prestador?.descontoPadraoPercent ?? 0));
  const [banco, setBanco] = useState<DadosBancarios>({
    banco: prestador?.banco ?? "", agencia: prestador?.agencia ?? "", conta: prestador?.conta ?? "",
    tipoConta: prestador?.tipoConta ?? "corrente", chavePix: prestador?.chavePix ?? "",
  });
  const [clientes, setClientes] = useState<string[]>(prestador?.clientes.map((c) => c.id) ?? []);
  const [contabeis, setContabeis] = useState<string[]>(prestador?.empresasContabeis.map((e) => e.id) ?? []);
  const opcoesClientes = useDadosApi<OpcaoApi[]>("/clientes/opcoes");
  const opcoesContabeis = useDadosApi<OpcaoApi[]>("/empresas-contabeis/opcoes");
  const { pendente, erro, executar } = useAcao("Não foi possível salvar o prestador.");
  const faltando = faltandoNoCadastro({ telefone, email, banco: banco.banco, agencia: banco.agencia });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const problema =
      validarCampos([
        { tipo: "cpf", valor: cpf, rotulo: "CPF", obrigatorio: true },
        { tipo: "email", valor: email, rotulo: "E-mail" },
        { tipo: "telefone", valor: telefone, rotulo: "Telefone" },
      ]) ?? (Number.isNaN(lerNumeroBR(desconto)) ? "Desconto padrão: use um número como 5 ou 2,5." : null);
    await executar(async () => {
      if (problema) throw new Error(problema);
      const corpo = {
        nomeCompleto: nome, cpf, crm, status, email, telefone, regimeTributario: regime || null, descontoPadraoPercent: lerNumeroBR(desconto),
        ...banco, tipoConta: banco.tipoConta || null, clientes, empresasContabeis: contabeis,
      };
      const salvo = prestador ? await api.patch<Prestador>(`/prestadores/${prestador.id}`, corpo) : await api.post<Prestador>("/prestadores", corpo);
      toast.success(prestador ? "Prestador atualizado." : `${salvo.nomeCompleto} cadastrado.`);
      onSalvo(salvo);
    });
  }

  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Cadastros"
      titulo={prestador ? "Editar prestador" : "Novo prestador"}
      descricao="Os dados bancários são copiados para cada repasse lançado."
      largura="lg"
      onFechar={onFechar}
      onSubmit={salvar}
      erro={erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>
            {pendente ? "Salvando..." : prestador ? "Salvar alterações" : "Cadastrar prestador"}
          </Button>
        </>
      }
    >
      {faltando.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-[var(--aviso-soft)] px-3 py-2 text-sm text-[var(--aviso)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Cadastro incompleto.</strong> Falta: {faltando.join(", ")}. Dá para salvar assim, mas o prestador continua marcado como incompleto.
          </span>
        </p>
      )}

      <SecaoFormulario titulo="Identificação" descricao="Médico que recebe os repasses.">
        <div>
          <Label htmlFor="prestador-nome">Nome completo</Label>
          <Input id="prestador-nome" required minLength={3} maxLength={200} autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3">
          <div className="col-span-2 @2xl:col-span-1">
            <Label htmlFor="prestador-cpf">CPF</Label>
            <CampoMascara id="prestador-cpf" tipo="cpf" obrigatorio rotulo="o CPF" valor={cpf} onChange={setCpf} />
          </div>
          <div>
            <Label htmlFor="prestador-crm">CRM</Label>
            <Input id="prestador-crm" maxLength={30} placeholder="123456/SP" value={crm} onChange={(e) => setCrm(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="prestador-status">Situação</Label>
            <Seletor id="prestador-status" rotulo="Situação" valor={status} onChange={(v) => setStatus(v as StatusAtivo)} opcoes={OPCOES_STATUS} />
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Contato">
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div>
            <Label htmlFor="prestador-email">E-mail</Label>
            <CampoMascara id="prestador-email" tipo="email" valor={email} onChange={setEmail} />
          </div>
          <div>
            <Label htmlFor="prestador-telefone">Telefone</Label>
            <CampoMascara id="prestador-telefone" tipo="telefone" valor={telefone} onChange={setTelefone} />
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Tributação">
        <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
            <Label htmlFor="prestador-regime">Regime tributário</Label>
            <Seletor id="prestador-regime" rotulo="Regime tributário" opcaoVazia="Não informado" valor={regime} onChange={setRegime} opcoes={OPCOES_REGIME} />
          </div>
          <div>
            <Label htmlFor="prestador-desconto">Desconto padrão</Label>
            <div className="relative">
              <Input id="prestador-desconto" inputMode="decimal" maxLength={7} placeholder="0" className="pr-7 text-right tabular-nums" value={desconto} onChange={(e) => setDesconto(e.target.value.replace(/[^\d.,]/g, ""))} />
              <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">%</span>
            </div>
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Dados bancários" descricao="Ao mudar a conta, os repasses ainda pendentes passam a usar a nova; os já pagos guardam a conta usada.">
        <CamposBancarios valores={banco} onChange={setBanco} />
      </SecaoFormulario>

      <SecaoFormulario titulo="Vínculos" descricao="Onde o médico atende e por quais empresas as notas dele são emitidas.">
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div>
            <Label htmlFor="prestador-clientes">Clientes onde atende</Label>
            <SeletorMultiplo id="prestador-clientes" opcoes={opcoesClientes.dados ?? []} carregando={opcoesClientes.carregando && !opcoesClientes.dados} selecionados={clientes} onAplicar={setClientes} vazio="Nenhum cliente" plural="clientes" />
          </div>
          <div>
            <Label htmlFor="prestador-contabeis">Empresas contábeis</Label>
            <SeletorMultiplo id="prestador-contabeis" opcoes={opcoesContabeis.dados ?? []} carregando={opcoesContabeis.carregando && !opcoesContabeis.dados} selecionados={contabeis} onAplicar={setContabeis} vazio="Nenhuma empresa" plural="empresas" />
          </div>
        </div>
      </SecaoFormulario>
    </MolduraFormulario>
  );
}
