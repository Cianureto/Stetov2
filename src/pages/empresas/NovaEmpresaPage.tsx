import { useState, type FormEvent } from "react";
import { api } from "@/api/client";
import { SenhaTemporaria } from "@/components/conta/SenhaTemporaria";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormTela } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { useAcao } from "@/hooks/useAcao";
import { useVoltar } from "@/hooks/useVoltar";
import { validarCampos } from "@/lib/mascaras";

/** /empresas/nova — empresa nova e o primeiro administrador dela (com senha temporária). */
export default function NovaEmpresaPage() {
  const voltar = useVoltar("/empresas");
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [adminNome, setAdminNome] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [senha, setSenha] = useState<string | null>(null);
  const { pendente, erro, executar } = useAcao("Não foi possível criar a empresa.");

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const problema = validarCampos([{ tipo: "cnpj", valor: cnpj, rotulo: "CNPJ" }, { tipo: "email", valor: adminEmail, rotulo: "E-mail do administrador", obrigatorio: true }]);
    await executar(async () => {
      if (problema) throw new Error(problema);
      const r = await api.post<{ senhaTemporaria: string }>("/empresas", { nome, cnpj, adminNome, adminEmail });
      setSenha(r.senhaTemporaria);
    });
  }

  return (
    <>
      <FormTela
        rotulo="Administração"
        titulo="Nova empresa"
        descricao="A empresa começa vazia, com os dados separados das outras. O administrador dela cria os demais usuários."
        onFechar={voltar}
        onSubmit={salvar}
        erro={erro}
        footer={
          <>
            <Button type="button" variant="secondary" className="flex-1" onClick={voltar}>Cancelar</Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>{pendente ? "Criando..." : "Criar empresa"}</Button>
          </>
        }
      >
        <SecaoFormulario titulo="Empresa">
          <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_14rem]">
            <div>
              <Label htmlFor="emp-nome">Nome</Label>
              <Input id="emp-nome" required minLength={2} maxLength={200} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="emp-cnpj">CNPJ (opcional)</Label>
              <CampoMascara id="emp-cnpj" tipo="cnpj" valor={cnpj} onChange={setCnpj} />
            </div>
          </div>
        </SecaoFormulario>
        <SecaoFormulario titulo="Primeiro administrador" descricao="Recebe uma senha temporária para entrar.">
          <div className="grid gap-3 @2xl:grid-cols-2">
            <div>
              <Label htmlFor="emp-admin-nome">Nome</Label>
              <Input id="emp-admin-nome" required minLength={2} maxLength={200} value={adminNome} onChange={(e) => setAdminNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="emp-admin-email">E-mail (login)</Label>
              <CampoMascara id="emp-admin-email" tipo="email" obrigatorio rotulo="o e-mail" valor={adminEmail} onChange={setAdminEmail} />
            </div>
          </div>
        </SecaoFormulario>
      </FormTela>
      {senha && <SenhaTemporaria email={adminEmail.trim().toLowerCase()} senha={senha} onFechar={voltar} />}
    </>
  );
}
