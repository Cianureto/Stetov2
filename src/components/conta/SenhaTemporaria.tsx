import { KeyRound } from "lucide-react";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Mostra a senha temporária uma única vez, para o administrador repassar à pessoa. */
export function SenhaTemporaria({ email, senha, onFechar }: { email: string; senha: string; onFechar: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="size-5 text-marca" aria-hidden /> Senha temporária</DialogTitle>
          <DialogDescription>Repasse para a pessoa por um canal seguro. Ela vai criar a própria senha no primeiro acesso. Esta senha não aparece de novo.</DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 rounded-lg bg-[var(--areia)] p-3 text-sm">
          <div><dt className="text-xs text-foreground-muted">E-mail</dt><dd className="font-medium">{email}</dd></div>
          <div><dt className="text-xs text-foreground-muted">Senha temporária</dt><dd className="select-all font-mono text-base font-semibold">{senha}</dd></div>
        </dl>
        <div className="flex gap-2">
          <BotaoCopiar className="flex-1" texto={`E-mail: ${email}\nSenha temporária: ${senha}`} rotulo="Copiar e-mail e senha" />
          <Button variant="accent" className="flex-1" onClick={onFechar}>Pronto</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
