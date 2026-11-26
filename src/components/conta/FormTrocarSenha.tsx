import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { InputSenha } from "@/components/ui/input-senha";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/useAuth";
import { useAcao } from "@/hooks/useAcao";

/** Nova senha + confirmação (Meu perfil e a troca obrigatória da senha temporária). */
export function FormTrocarSenha({ onTrocou }: { onTrocou?: () => void }) {
  const { recarregarUsuario } = useAuth();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const { pendente, erro, executar } = useAcao("Não foi possível trocar a senha.");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      if (senha !== confirmacao) throw new Error("As duas senhas não são iguais.");
      await api.post("/perfil/senha", { senha });
      toast.success("Senha trocada.");
      setSenha("");
      setConfirmacao("");
      await recarregarUsuario();
      onTrocou?.();
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      {erro && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">{erro}</p>}
      <div>
        <Label htmlFor="senha-nova">Nova senha</Label>
        <InputSenha id="senha-nova" autoComplete="new-password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
        <p className="mt-1 text-xs text-foreground-muted">Pelo menos 8 caracteres.</p>
      </div>
      <div>
        <Label htmlFor="senha-confirmacao">Repita a nova senha</Label>
        <InputSenha id="senha-confirmacao" autoComplete="new-password" required minLength={8} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
      </div>
      <Button type="submit" variant="accent" disabled={pendente || senha.length < 8}>{pendente ? "Salvando..." : "Trocar senha"}</Button>
    </form>
  );
}
