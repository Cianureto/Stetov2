import { useState, type FormEvent } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MolduraFormulario, type PropsFormulario } from "@/components/ui/moldura-formulario";
import { SecaoFormulario } from "@/components/ui/secao-formulario";
import { Seletor } from "@/components/ui/seletor";
import { useAcao } from "@/hooks/useAcao";
import { validarCampos } from "@/lib/mascaras";

const OPCOES_PAPEL = [
  { valor: "usuario", rotulo: "Usuário", descricao: "Cadastros, registros, contas e relatórios" },
  { valor: "admin", rotulo: "Administrador", descricao: "Tudo, inclusive usuários, importação e auditoria" },
];

export type UsuarioCriado = { email: string; senhaTemporaria: string };

/** Novo usuário (tela /acessos/novo). A conta nasce com senha temporária, que aparece uma vez. */
export function FormularioUsuario({ modo, empresaId, onFechar, onSalvo }: PropsFormulario<UsuarioCriado> & { empresaId?: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("usuario");
  const { pendente, erro, executar } = useAcao("Não foi possível criar o usuário.");

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const problema = validarCampos([{ tipo: "email", valor: email, rotulo: "E-mail", obrigatorio: true }]);
    await executar(async () => {
      if (problema) throw new Error(problema);
      const r = await api.post<{ senhaTemporaria: string }>("/usuarios", { nome, email, papel, ...(empresaId ? { empresaId } : {}) });
      onSalvo({ email: email.trim().toLowerCase(), senhaTemporaria: r.senhaTemporaria });
    });
  }

  return (
    <MolduraFormulario
      modo={modo}
      rotulo="Administração"
      titulo="Novo usuário"
      descricao="A pessoa entra com uma senha temporária e cria a própria senha no primeiro acesso."
      largura="md"
      onFechar={onFechar}
      onSubmit={salvar}
      erro={erro}
      footer={
        <>
          <Button type="button" variant="secondary" className="flex-1" onClick={onFechar}>Cancelar</Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={pendente}>{pendente ? "Criando..." : "Criar usuário"}</Button>
        </>
      }
    >
      <SecaoFormulario titulo="Pessoa">
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div>
            <Label htmlFor="usuario-nome">Nome</Label>
            <Input id="usuario-nome" required minLength={2} maxLength={200} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="usuario-email">E-mail (login)</Label>
            <CampoMascara id="usuario-email" tipo="email" obrigatorio rotulo="o e-mail" valor={email} onChange={setEmail} />
          </div>
        </div>
      </SecaoFormulario>
      <SecaoFormulario titulo="Acesso">
        <div className="max-w-sm">
          <Label htmlFor="usuario-papel">Papel</Label>
          <Seletor id="usuario-papel" rotulo="Papel" valor={papel} onChange={setPapel} opcoes={OPCOES_PAPEL} />
        </div>
      </SecaoFormulario>
    </MolduraFormulario>
  );
}
