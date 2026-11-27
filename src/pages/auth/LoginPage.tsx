import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/context/useAuth";
import { useAcao } from "@/hooks/useAcao";
import { consumirDestino } from "@/lib/sessao";
import { MarcaLogo } from "@/components/Marca";
import { PhotoCarousel, type FotoCarrossel } from "@/components/ui/photo-carousel";
import fotoDiretoria from "@/assets/login/equipe-diretoria.jpg";
import fotoAtendimento from "@/assets/login/equipe-atendimento.jpg";
import fotoMarca from "@/assets/login/marca-steto.jpg";
import { Button } from "@/components/ui/button";
import { CampoMascara } from "@/components/ui/campo-mascara";
import { Input, Textarea } from "@/components/ui/input";
import { InputSenha } from "@/components/ui/input-senha";
import { Label } from "@/components/ui/label";
import { SpinnerBarras } from "@/components/ui/spinner";

// Login em tela dividida (formulário de um lado, foto com a frase do outro). Ao ir para "Pedir acesso", a
// foto troca de lado com o formulário numa transição de layout, e o formulário muda deslizando.

const FOTOS_LOGIN: FotoCarrossel[] = [
  { src: fotoDiretoria, posicao: "50% 30%" },
  { src: fotoAtendimento, posicao: "50% 35%" },
  { src: fotoMarca, inteira: true, fundo: "#253e67", posicao: "50% 22%" },
];

const FRASES = {
  login: {
    texto: "Notas, repasses e retenções da sua operação médica, conferidos num lugar só.",
    apoio: "Contabilidade para médicos, clínicas e hospitais",
  },
  pedido: {
    texto: "Ainda não tem acesso? Peça aqui: um administrador da Steto libera a sua conta.",
    apoio: "Você recebe uma senha temporária e cria a sua no primeiro acesso",
  },
};

type Modo = "login" | "pedido";
const MOLA = { type: "spring", stiffness: 170, damping: 26, mass: 1 } as const;
const troca = (para: Modo) => ({
  initial: { opacity: 0, x: para === "pedido" ? 28 : -28, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const, delay: 0.08 } },
  exit: { opacity: 0, x: para === "pedido" ? -28 : 28, filter: "blur(4px)", transition: { duration: 0.18 } },
});

function FormLogin({ onPedir }: { onPedir: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { pendente, erro, executar } = useAcao("E-mail ou senha incorretos.");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    await executar(async () => {
      await login(email, senha);
      navigate(consumirDestino() ?? "/", { replace: true });
    });
  }

  return (
    <motion.div key="login" {...troca("login")}>
      <h1 className="texto-titulo-1 text-[30px]">Entrar</h1>
      <p className="texto-apoio mt-2">Bem-vindo de volta! Use o e-mail e a senha da sua empresa.</p>

      <form onSubmit={enviar} className="mt-8 space-y-5">
        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
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
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => toast.info("Peça ao administrador da sua empresa: ele gera uma senha temporária nova em Usuários e acessos.")}
              className="text-[13px] font-semibold text-marca hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
        </div>
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pendente}>
          {pendente ? "Entrando..." : "Entrar"}
          {!pendente && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-foreground-secondary">
        Ainda não tem acesso?{" "}
        <button type="button" onClick={onPedir} className="font-semibold text-marca hover:underline">
          Pedir acesso
        </button>
      </p>
    </motion.div>
  );
}

const MOLA_CADASTRO = { type: "spring", bounce: 0.3, visualDuration: 0.4 } as const;
const TEXTO_TROCA = {
  initial: { opacity: 0, filter: "blur(10px)", y: -10 },
  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
  exit: { opacity: 0, filter: "blur(10px)", y: 10 },
};
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/** Campo que aparece abrindo espaço: a altura anima até a medida do conteúdo (e fecha até 0). */
function CampoCondicional({ aberto, children }: { aberto: boolean; children: ReactNode }) {
  const conteudo = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState(0);
  useLayoutEffect(() => {
    const el = conteudo.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setAltura(e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, [aberto]);
  return (
    <motion.div initial={false} animate={{ height: aberto ? altura : 0 }} className="overflow-hidden" style={{ willChange: "height" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {aberto && (
          <motion.div ref={conteudo} key="campo" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} className="space-y-4 pt-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Pedido de acesso no estilo do cadastro do Clerk: primeiro só nome e e-mail; "Continuar" troca o título
 * (desfoque) e abre os campos opcionais (altura animada); ao enviar, o formulário recua e o cartão de
 * confirmação sobe por cima. Esc volta à primeira etapa sem perder o que foi digitado.
 */
function FormPedido({ onEntrar }: { onEntrar: () => void }) {
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "", mensagem: "" });
  const [etapa, setEtapa] = useState<"dados" | "detalhes">("dados");
  const [enviado, setEnviado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { pendente, erro, executar } = useAcao("Não foi possível enviar o pedido. Tente de novo.");
  const campo = (k: keyof typeof dados) => (v: string) => setDados((d) => ({ ...d, [k]: v }));
  const detalhes = etapa === "detalhes";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!detalhes) {
      if (dados.nome.trim().length < 2) return setAviso("Informe o seu nome.");
      if (!emailOk(dados.email)) return setAviso("Informe um e-mail válido.");
      setAviso(null);
      return setEtapa("detalhes");
    }
    const ok = await executar(() => api.post("/pedidos-acesso", { ...dados, telefone: dados.telefone || undefined, mensagem: dados.mensagem || undefined }));
    if (ok) setEnviado(true);
  }

  const mensagemErro = aviso ?? erro;
  return (
    <motion.div key="pedido" {...troca("pedido")} className="relative">
      <MotionConfig transition={MOLA_CADASTRO}>
        <motion.div
          animate={enviado ? { opacity: 0.55, scale: 0.95, y: -10 } : { opacity: 1, scale: 1, y: 0 }}
          style={{ transformOrigin: "top center" }}
          inert={enviado}
          onKeyDown={(e) => {
            if (e.key === "Escape" && detalhes && !pendente) {
              e.stopPropagation();
              setEtapa("dados");
            }
          }}
        >
          <div className="relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h1 key={etapa} {...TEXTO_TROCA} className="texto-titulo-1 text-[30px]">
                {detalhes ? "Quase lá" : "Pedir acesso"}
              </motion.h1>
            </AnimatePresence>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p key={etapa} {...TEXTO_TROCA} className="texto-apoio mt-2">
                {detalhes ? "Se quiser, conte quem você é. Isso ajuda o administrador a aprovar mais rápido." : "Informe seu nome e e-mail. Um administrador vai analisar o pedido."}
              </motion.p>
            </AnimatePresence>
          </div>

          <form onSubmit={enviar} noValidate className="mt-8">
            <AnimatePresence initial={false}>
              {mensagemErro && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2 overflow-hidden rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {mensagemErro}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pedido-nome">Nome completo</Label>
                <Input id="pedido-nome" autoFocus autoComplete="name" maxLength={120} value={dados.nome} onChange={(e) => { campo("nome")(e.target.value); setAviso(null); }} placeholder="Seu nome" />
              </div>
              <div>
                <Label htmlFor="pedido-email">E-mail</Label>
                <CampoMascara id="pedido-email" tipo="email" rotulo="O e-mail" valor={dados.email} onChange={(v) => { campo("email")(v); setAviso(null); }} placeholder="voce@empresa.com.br" />
              </div>
            </div>

            <CampoCondicional aberto={detalhes}>
              <div>
                <Label htmlFor="pedido-telefone">
                  Telefone <span className="font-normal text-foreground-muted">(opcional)</span>
                </Label>
                <CampoMascara id="pedido-telefone" tipo="telefone" rotulo="O telefone" autoFocus valor={dados.telefone} onChange={campo("telefone")} />
              </div>
              <div>
                <Label htmlFor="pedido-mensagem">
                  Quem é você? <span className="font-normal text-foreground-muted">(opcional)</span>
                </Label>
                <Textarea id="pedido-mensagem" rows={3} maxLength={500} value={dados.mensagem} onChange={(e) => campo("mensagem")(e.target.value)} placeholder="Ex.: sou da equipe financeira do Hospital X" />
              </div>
            </CampoCondicional>

            <Button type="submit" variant="accent" size="lg" className="mt-6 w-full overflow-hidden" disabled={pendente}>
              <AnimatePresence mode="popLayout" initial={false}>
                {pendente ? (
                  <motion.span key="enviando" {...TEXTO_TROCA} className="flex items-center gap-2">
                    <SpinnerBarras /> Enviando
                  </motion.span>
                ) : (
                  <motion.span key={etapa} {...TEXTO_TROCA} className="flex items-center gap-2">
                    {detalhes ? "Enviar pedido" : "Continuar"} <ArrowRight className="size-4" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            {detalhes && (
              <button type="button" onClick={() => setEtapa("dados")} className="mt-3 w-full text-center text-[13px] font-medium text-foreground-muted hover:text-foreground">
                Voltar (Esc)
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-foreground-secondary">
            Já tem conta?{" "}
            <button type="button" onClick={onEntrar} className="font-semibold text-marca hover:underline">
              Entrar
            </button>
          </p>
        </motion.div>

        <AnimatePresence>
          {enviado && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute inset-x-0 top-6 z-10 rounded-[28px] border border-borda bg-areia-card px-7 py-9 text-center shadow-[0_24px_60px_-20px_rgba(11,27,54,0.35),inset_0_0_0_1px_#fff]"
            >
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--sucesso-soft)] text-[var(--sucesso)] ring-1 ring-inset ring-[var(--sucesso)]/20">
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <motion.path d="M5 12.5 L10 17.5 L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1], delay: 0.25 }} />
                </svg>
              </span>
              <h2 className="texto-titulo-2 mt-5">Pedido enviado</h2>
              <p className="texto-apoio mx-auto mt-2 max-w-xs">
                Um administrador da Steto vai analisar. Quando aprovar, ele te passa uma senha temporária para o primeiro acesso.
              </p>
              <Button type="button" variant="secondary" size="lg" className="mt-7 w-full" onClick={onEntrar}>
                <ArrowLeft className="size-4" aria-hidden /> Voltar para entrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </motion.div>
  );
}

/** /login — entrar, ou pedir acesso (a foto troca de lado). */
export default function LoginPage() {
  const { usuario } = useAuth();
  const [modo, setModo] = useState<Modo>("login");
  // Ano do rodapé calculado uma vez (`new Date()` no render deixaria o resultado instável entre renders).
  const [ano] = useState(() => new Date().getFullYear());
  if (usuario) return <Navigate to="/" replace />;
  const frase = FRASES[modo];

  return (
    <div className="min-h-dvh bg-areia-card lg:p-3 lg:pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <LayoutGroup>
        <div className={`flex min-h-dvh gap-3 lg:min-h-[calc(100dvh-1.5rem)] ${modo === "pedido" ? "flex-row-reverse" : "flex-row"}`}>
          <motion.section layout transition={MOLA} className="flex min-w-0 flex-1 flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-8">
            <motion.div layout="position" transition={MOLA}>
              <MarcaLogo tamanho="lg" />
            </motion.div>

            <div className="flex flex-1 items-center justify-center py-10">
              <div className="w-full max-w-[360px]">
                <AnimatePresence mode="wait" initial={false}>
                  {modo === "login" ? <FormLogin key="login" onPedir={() => setModo("pedido")} /> : <FormPedido key="pedido" onEntrar={() => setModo("login")} />}
                </AnimatePresence>
              </div>
            </div>

            <motion.div layout="position" transition={MOLA} className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-foreground-muted">
              <span>© Steto {ano}</span>
              <span>Contabilidade para a saúde</span>
            </motion.div>
          </motion.section>

          <motion.aside
            layout
            transition={MOLA}
            aria-hidden
            className="relative hidden min-w-0 flex-1 overflow-hidden bg-[var(--marca-escuro)] lg:block"
            style={{ borderRadius: 28 }}
          >
            <PhotoCarousel imagens={FOTOS_LOGIN} intervalo={6000} posicaoControles="right-6 top-6" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[rgba(11,27,54,0.85)] via-[rgba(11,27,54,0.35)] to-transparent" />

            <div className="absolute inset-x-6 bottom-6 overflow-hidden rounded-[20px] border border-white/25 bg-white/10 p-7 text-white backdrop-blur-xl xl:inset-x-8 xl:bottom-8 xl:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={modo}
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, y: -6, filter: "blur(6px)", transition: { duration: 0.18 } }}
                >
                  <p className="font-titulo text-[26px] font-semibold leading-[1.25] tracking-tight xl:text-[30px]">“{frase.texto}”</p>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold">Steto Contabilidade</p>
                      <p className="mt-0.5 text-sm text-white/80">{frase.apoio}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </div>
      </LayoutGroup>
    </div>
  );
}
