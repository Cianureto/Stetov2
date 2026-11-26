import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Cliente, StatusCliente } from "@/api/types";
import { CamposAliquotas } from "@/components/clientes/CamposAliquotas";
import { ALIQUOTAS, type ValoresAliquotas } from "@/lib/aliquotas";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { formatarDocumento, lerNumeroBR, percentualParaCampo } from "@/lib/format";
import { REGIME_LABEL, STATUS_CLIENTE_LABEL, TIPO_PESSOA_LABEL } from "@/lib/labels";
import { validarCampos } from "@/lib/mascaras";

const OPCOES_REGIME = Object.entries(REGIME_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
const OPCOES_STATUS = Object.entries(STATUS_CLIENTE_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));

const aliquotasDe = (c?: Cliente): ValoresAliquotas => ({
  aliquotaPis: percentualParaCampo(c?.aliquotaPis ?? 0),
  aliquotaCofins: percentualParaCampo(c?.aliquotaCofins ?? 0),
  aliquotaCsll: percentualParaCampo(c?.aliquotaCsll ?? 0),
  aliquotaIr: percentualParaCampo(c?.aliquotaIr ?? 0),
  aliquotaIss: percentualParaCampo(c?.aliquotaIss ?? 0),
  descontoPadraoPercent: percentualParaCampo(c?.descontoPadraoPercent ?? 0),
});

/** Cadastro de cliente (tela /clientes/novo e /clientes/:id; modal só dentro de outro formulário). */
export function FormularioCliente({ modo, cliente, onFechar, onSalvo }: PropsFormulario<Cliente> & { cliente?: Cliente }) {
  const [tipoPessoa, setTipoPessoa] = useState<"PJ" | "PF">(cliente?.tipoPessoa ?? "PJ");
  const [documento, setDocumento] = useState(formatarDocumento(cliente?.documento));
  const [razaoSocial, setRazaoSocial] = useState(cliente?.razaoSocial ?? "");
  const [regime, setRegime] = useState<string>(cliente?.regimeTributario ?? "");
  const [status, setStatus] = useState<StatusCliente>(cliente?.status ?? "ativo");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [endereco, setEndereco] = useState(cliente?.endereco ?? "");
  const [aliquotas, setAliquotas] = useState<ValoresAliquotas>(() => aliquotasDe(cliente));
  const { pendente, erro, executar } = useAcao("Não foi possível salvar o cliente.");

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const problema =
      validarCampos([
        { tipo: tipoPessoa === "PJ" ? "cnpj" : "cpf", valor: documento, rotulo: tipoPessoa === "PJ" ? "CNPJ" : "CPF", obrigatorio: true },
        { tipo: "email", valor: email, rotulo: "E-mail" },
        { tipo: "telefone", valor: telefone, rotulo: "Telefone" },
      ]) ?? (ALIQUOTAS.some(([k]) => Number.isNaN(lerNumeroBR(aliquotas[k]))) ? "Confira as alíquotas: use números como 2,5." : null);
    await executar(async () => {
      if (problema) throw new Error(problema);
      const corpo = {
        tipoPessoa, documento, razaoSocial, regimeTributario: regime || undefined, status, email, telefone, endereco,
        ...Object.fromEntries(ALIQUOTAS.map(([k]) => [k, lerNumeroBR(aliquotas[k])])),
      };
      const salvo = cliente ? await api.patch<Cliente>(`/clientes/${cliente.id}`, corpo) : await api.post<Cliente>("/clientes", corpo);
      toast.success(cliente ? "Cliente atualizado." : `${salvo.razaoSocial} cadastrado.`);
      onSalvo(salvo);
    });
  }

  const ehPJ = tipoPessoa === "PJ";
  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Cadastros"
      titulo={cliente ? "Editar cliente" : "Novo cliente"}
      descricao="As alíquotas e o desconto padrão são usados no cálculo de cada nota deste cliente."
      largura="lg"
      onFechar={onFechar}
      onSubmit={salvar}
      erro={erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>
            {pendente ? "Salvando..." : cliente ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </>
      }
    >
      <SecaoFormulario titulo="Identificação" descricao="Hospital, clínica ou pessoa física atendida.">
        <div className="segmented" role="radiogroup" aria-label="Tipo de pessoa">
          {(["PJ", "PF"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipoPessoa === t}
              className={`segmented-item ${tipoPessoa === t ? "active" : ""}`}
              onClick={() => {
                setTipoPessoa(t);
                setDocumento("");
              }}
            >
              {TIPO_PESSOA_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 @2xl:grid-cols-[14rem_minmax(0,1fr)]">
          <div>
            <Label htmlFor="cliente-documento">{ehPJ ? "CNPJ" : "CPF"}</Label>
            <CampoMascara id="cliente-documento" tipo={ehPJ ? "cnpj" : "cpf"} obrigatorio rotulo={ehPJ ? "o CNPJ" : "o CPF"} valor={documento} onChange={setDocumento} />
          </div>
          <div>
            <Label htmlFor="cliente-nome">{ehPJ ? "Razão social" : "Nome completo"}</Label>
            <Input id="cliente-nome" required minLength={2} maxLength={200} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div>
            <Label htmlFor="cliente-regime">Regime tributário</Label>
            <Seletor id="cliente-regime" rotulo="Regime tributário" obrigatorio valor={regime} onChange={setRegime} opcoes={OPCOES_REGIME} placeholder="Selecione o regime" />
          </div>
          <div>
            <Label htmlFor="cliente-status">Situação</Label>
            <Seletor id="cliente-status" rotulo="Situação" valor={status} onChange={(v) => setStatus(v as StatusCliente)} opcoes={OPCOES_STATUS} />
          </div>
        </div>
      </SecaoFormulario>

      <SecaoFormulario titulo="Tributos e desconto" descricao="Percentuais retidos sobre o valor de cada nota.">
        <CamposAliquotas valores={aliquotas} onChange={setAliquotas} />
      </SecaoFormulario>

      <SecaoFormulario titulo="Contato">
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div>
            <Label htmlFor="cliente-email">E-mail</Label>
            <CampoMascara id="cliente-email" tipo="email" valor={email} onChange={setEmail} />
          </div>
          <div>
            <Label htmlFor="cliente-telefone">Telefone</Label>
            <CampoMascara id="cliente-telefone" tipo="telefone" valor={telefone} onChange={setTelefone} />
          </div>
        </div>
        <div>
          <Label htmlFor="cliente-endereco">Endereço</Label>
          <Input id="cliente-endereco" maxLength={300} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>
      </SecaoFormulario>
    </MolduraFormulario>
  );
}

