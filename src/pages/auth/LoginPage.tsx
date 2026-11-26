import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { useAcao } from "@/hooks/useAcao";
import { consumirDestino } from "@/lib/sessao";
import { MarcaLogo } from "@/components/Marca";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { InputSenha } from "@/components/ui/input-senha";
import { Label } from "@/components/ui/label";

const DESTAQUES = ["Repasses calculados com os tributos de cada cliente", "Contas a pagar e receber com vencimentos", "Relatórios por período, cliente e prestador"];

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { pendente, erro, executar } = useAcao("E-mail ou senha incorretos.");
  // Ano do rodapé calculado uma vez (`new Date()` no render deixaria o resultado instável entre renders).
  const [ano] = useState(() => new Date().getFullYear());

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      await login(email, senha);
      navigate(consumirDestino() ?? "/", { replace: true });
    });
  }

  return (
    <div className="flex min-h-screen bg-areia lg:pt-[env(safe-area-inset-top)]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--marca-escuro)] p-12 text-white lg:flex lg:w-[46%]">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(11,27,54,0.98),rgba(30,58,138,0.92)_58%,rgba(37,99,235,0.85))]" />
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "36px 36px, 52px 52px",
          }}
        />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative flex items-center">
          <MarcaLogo fundo="escuro" tamanho="lg" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative max-w-md space-y-5">
          <h2 className="font-titulo text-[40px] font-bold leading-[1.05]">A contabilidade da sua operação médica em um só lugar.</h2>
          <p className="text-sm leading-relaxed text-white/75">Cadastre clientes e prestadores, lance as notas e acompanhe o que está pendente.</p>
          <ul className="space-y-2.5 pt-2">
            {DESTAQUES.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-white/85">
                <CheckCircle2 className="size-4 shrink-0 text-realce" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative text-xs text-white/70">© {ano} Steto</div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="mb-2 flex items-center justify-center">
              <MarcaLogo tamanho="xl" />
            </h1>
            <p className="mt-0.5 text-sm text-foreground-muted">Contabilidade</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <h1 className="font-titulo text-3xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-foreground-muted">Use o e-mail e a senha cadastrados pela sua empresa.</p>
          </div>

          <div className="card p-6 shadow-[var(--shadow-md)]">
            <form onSubmit={enviar} className="space-y-4">
              {erro && (
                <p role="alert" className="flex items-start gap-2 rounded-lg bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {erro}
                </p>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <CampoMascara
                  id="email"
                  tipo="email"
                  obrigatorio
                  rotulo="O e-mail"
                  autoComplete="username"
                  valor={email}
                  onChange={setEmail}
                  className="pl-9"
                  placeholder="voce@empresa.com.br"
                  icone={<Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" aria-hidden />}
                />
              </div>
              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-foreground-muted" aria-hidden />
                  <InputSenha id="senha" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="pl-9" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pendente}>
                {pendente ? "Entrando..." : "Entrar"}
                {!pendente && <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
