import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { EmpresaContabil, StatusAtivo } from "@/api/types";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { formatarCnpj, validarCampos } from "@/lib/mascaras";

const OPCOES_STATUS = [
  { valor: "ativo", rotulo: "Ativa" },
  { valor: "inativo", rotulo: "Inativa" },
];

/** Cadastro de empresa contábil (tela própria; modal dentro do lançamento de registro). */
export function FormularioEmpresaContabil({ modo, empresa, onFechar, onSalvo }: PropsFormulario<EmpresaContabil> & { empresa?: EmpresaContabil }) {
  const [cnpj, setCnpj] = useState(empresa ? formatarCnpj(empresa.cnpj) : "");
  const [razaoSocial, setRazaoSocial] = useState(empresa?.razaoSocial ?? "");
  const [nomeFantasia, setNomeFantasia] = useState(empresa?.nomeFantasia ?? "");
  const [status, setStatus] = useState<StatusAtivo>(empresa?.status ?? "ativo");
  const { pendente, erro, executar } = useAcao("Não foi possível salvar a empresa contábil.");

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const problema = validarCampos([{ tipo: "cnpj", valor: cnpj, rotulo: "CNPJ", obrigatorio: true }]);
    await executar(async () => {
      if (problema) throw new Error(problema);
      const corpo = { cnpj, razaoSocial, nomeFantasia, status };
      const salva = empresa ? await api.patch<EmpresaContabil>(`/empresas-contabeis/${empresa.id}`, corpo) : await api.post<EmpresaContabil>("/empresas-contabeis", corpo);
      toast.success(empresa ? "Empresa contábil atualizada." : `${salva.razaoSocial} cadastrada.`);
      onSalvo(salva);
    });
  }

  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Cadastros"
      titulo={empresa ? "Editar empresa contábil" : "Nova empresa contábil"}
      descricao="Empresa pela qual as notas são emitidas."
      largura="md"
      onFechar={onFechar}
      onSubmit={salvar}
      erro={erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>
            {pendente ? "Salvando..." : empresa ? "Salvar alterações" : "Cadastrar empresa"}
          </Button>
        </>
      }
    >
      <SecaoFormulario titulo="Identificação">
        <div className="grid gap-3 @2xl:grid-cols-[14rem_minmax(0,1fr)]">
          <div>
            <Label htmlFor="ec-cnpj">CNPJ</Label>
            <CampoMascara id="ec-cnpj" tipo="cnpj" obrigatorio rotulo="o CNPJ" valor={cnpj} onChange={setCnpj} />
          </div>
          <div>
            <Label htmlFor="ec-razao">Razão social</Label>
            <Input id="ec-razao" required minLength={2} maxLength={200} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_12rem]">
          <div>
            <Label htmlFor="ec-fantasia">Nome fantasia (opcional)</Label>
            <Input id="ec-fantasia" maxLength={200} value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ec-status">Situação</Label>
            <Seletor id="ec-status" rotulo="Situação" valor={status} onChange={(v) => setStatus(v as StatusAtivo)} opcoes={OPCOES_STATUS} />
          </div>
        </div>
      </SecaoFormulario>
    </MolduraFormulario>
  );
}
