import { useState, type FormEvent } from "react";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/client";
import { supabase } from "@/api/supabase";
import { FormTrocarSenha } from "@/components/conta/FormTrocarSenha";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { confirmar } from "@/components/ui/confirmar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/useAuth";
import { useAcao } from "@/hooks/useAcao";
import { iniciais } from "@/lib/format";
import { papelDoUsuario } from "@/lib/navegacao";

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-4 p-4 sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="font-titulo text-[15px] font-semibold">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-[13px] text-foreground-muted">{descricao}</p>}
      </div>
      <div className="min-w-0 max-w-lg">{children}</div>
    </section>
  );
}

/** /perfil — dados pessoais, senha e sessões. */
export default function PerfilPage() {
  const { usuario, logout, recarregarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const salvarNome = useAcao("Não foi possível salvar o nome.");
  const sairTodos = useAcao("Não foi possível encerrar as sessões.");
  if (!usuario) return null;

  async function enviarNome(e: FormEvent) {
    e.preventDefault();
    await salvarNome.executar(async () => {
      await api.patch("/perfil", { nome });
      await recarregarUsuario();
      toast.success("Nome atualizado.");
    });
  }

  async function sairDeTodos() {
    if (!(await confirmar({ titulo: "Sair de todos os dispositivos?", descricao: "Você também sai deste aparelho e precisa entrar de novo.", acao: "Sair de todos" }))) return;
    await sairTodos.executar(async () => {
      await supabase.auth.signOut({ scope: "global" });
      await logout();
    });
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center gap-4">
        <Avatar className="h-14 w-14 ring-2 ring-realce/40"><AvatarFallback className="text-lg">{iniciais(usuario.nome)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Minha conta</p>
          <h1 className="truncate font-titulo text-2xl font-bold">{usuario.nome}</h1>
          <p className="truncate text-sm text-foreground-muted">{papelDoUsuario(usuario)}</p>
        </div>
      </header>

      <Secao titulo="Dados pessoais" descricao="O e-mail é o seu login; para trocá-lo, fale com o administrador.">
        <form onSubmit={enviarNome} className="space-y-3">
          {salvarNome.erro && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">{salvarNome.erro}</p>}
          <div>
            <Label htmlFor="perfil-nome">Nome</Label>
            <Input id="perfil-nome" required minLength={2} maxLength={200} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="perfil-email">E-mail</Label>
            <Input id="perfil-email" value={usuario.email} readOnly className="bg-[var(--areia)]" />
          </div>
          <Button type="submit" variant="accent" disabled={salvarNome.pendente || nome.trim() === usuario.nome}>{salvarNome.pendente ? "Salvando..." : "Salvar nome"}</Button>
        </form>
      </Secao>

      <Secao titulo="Senha">
        <FormTrocarSenha />
      </Secao>

      <Secao titulo="Sessões" descricao="Use se perdeu um aparelho ou entrou num computador que não é seu.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={sairTodos.pendente} onClick={() => void sairDeTodos()}><MonitorSmartphone aria-hidden /> Sair de todos os dispositivos</Button>
          <Button variant="danger-ghost" onClick={() => void logout()}><LogOut aria-hidden /> Sair</Button>
        </div>
      </Secao>
    </div>
  );
}
