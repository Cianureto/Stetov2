import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Copy, KeyRound, UserPlus, X } from "lucide-react";
import { api } from "@/api/client";
import type { PedidoAcesso } from "@/api/types";
import { useDadosApi } from "@/hooks/useDadosApi";
import { cn } from "@/lib/cn";
import { mensagemErro } from "@/lib/erros";
import { iniciais } from "@/lib/format";

// Botão de pedidos de acesso no cabeçalho, no estilo do "user button" do Clerk: um botão redondo que, ao
// clicar, cresce até virar um cartão ancorado no mesmo canto (layoutId), com o conteúdo entrando desfocado.

const MOLA = { type: "spring", bounce: 0.15, visualDuration: 0.25 } as const;
const ENTRA = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { delay: 0.15 } },
  exit: { opacity: 0, filter: "blur(8px)", transition: { duration: 0.12 } },
};

function haQuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

type Decidido = { tipo: "aceito"; senha: string } | { tipo: "recusado" };

function Pedido({ p, decidido, onDecidir }: { p: PedidoAcesso; decidido?: Decidido; onDecidir: (p: PedidoAcesso, acao: "aceitar" | "recusar") => Promise<void> }) {
  const [enviando, setEnviando] = useState<"aceitar" | "recusar" | null>(null);
  const [copiada, setCopiada] = useState(false);
  const decidir = async (acao: "aceitar" | "recusar") => {
    setEnviando(acao);
    try {
      await onDecidir(p, acao);
    } finally {
      setEnviando(null);
    }
  };

  return (
    <li className="linha-hover rounded-[10px] p-2.5">
      <div className="flex items-start gap-2.5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#3a6ef2,#7cc4ff)] text-[11px] font-semibold text-white">
          {iniciais(p.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-foreground">{p.nome}</span>
            <span className="shrink-0 text-[11px] text-foreground-muted">{haQuanto(p.criadoEm)}</span>
          </div>
          <div className="truncate text-xs text-foreground-muted">{p.email}{p.telefone ? ` · ${p.telefone}` : ""}</div>
          {p.mensagem && <p className="mt-1 line-clamp-2 text-xs text-foreground-secondary">“{p.mensagem}”</p>}
        </div>
      </div>

      {!decidido && (
        <div className="mt-2 flex justify-end gap-1.5">
          <button
            type="button"
            disabled={!!enviando}
            onClick={() => decidir("recusar")}
            className="h-7 rounded-md px-2.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
          >
            {enviando === "recusar" ? "Recusando…" : "Recusar"}
          </button>
          <button
            type="button"
            disabled={!!enviando}
            onClick={() => decidir("aceitar")}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-marca px-2.5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(29,78,216,0.3)] transition-colors hover:bg-marca-escuro disabled:opacity-50"
          >
            <Check className="size-3.5" aria-hidden /> {enviando === "aceitar" ? "Criando conta…" : "Aceitar"}
          </button>
        </div>
      )}

      {decidido?.tipo === "aceito" && (
        <div role="status" className="mt-2 rounded-lg border border-[var(--sucesso)]/20 bg-[var(--sucesso-soft)] p-2.5 text-xs text-foreground-secondary">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--sucesso)]">
            <KeyRound className="size-3.5" aria-hidden /> Conta criada
          </div>
          <p className="mt-1">Passe a senha temporária para {p.nome.split(" ")[0]}; ela troca no primeiro acesso.</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded-md bg-areia-card px-2 py-1 font-mono text-[12px] text-foreground ring-1 ring-borda">{decidido.senha}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(decidido.senha).catch(() => {});
                setCopiada(true);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-areia-card px-2 text-xs font-medium ring-1 ring-borda hover:bg-tinta-25"
            >
              {copiada ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />} {copiada ? "Copiada" : "Copiar"}
            </button>
          </div>
        </div>
      )}
      {decidido?.tipo === "recusado" && <p className="mt-1.5 text-right text-xs text-foreground-muted">Pedido recusado.</p>}
    </li>
  );
}

/** Pedidos de acesso (só para quem gerencia acessos): botão redondo com contagem que vira o cartão da lista. */
export function PedidosAcesso() {
  const [aberto, setAberto] = useState(false);
  const [decididos, setDecididos] = useState<Record<string, Decidido>>({});
  const raiz = useRef<HTMLDivElement>(null);
  const carga = useDadosApi<PedidoAcesso[]>("/pedidos-acesso", "Não foi possível carregar os pedidos de acesso.");
  const { recarregar } = carga;
  const pedidos = carga.dados ?? [];
  const aguardando = pedidos.filter((p) => !decididos[p.id]).length;

  // Confere de novo a cada 2 minutos (pedidos chegam pela tela de login).
  useEffect(() => {
    const t = window.setInterval(recarregar, 120_000);
    return () => window.clearInterval(t);
  }, [recarregar]);

  // Fecha com Esc ou clicando fora (só enquanto aberto).
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    const fora = (e: MouseEvent) => raiz.current && !raiz.current.contains(e.target as Node) && fechar();
    window.addEventListener("keydown", tecla);
    window.addEventListener("mousedown", fora);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("mousedown", fora);
    };
  });

  function abrir() {
    recarregar();
    setAberto(true);
  }
  function fechar() {
    setAberto(false);
    // Os decididos saem da lista quando o cartão fecha (a senha fica visível até lá).
    if (Object.keys(decididos).length) {
      setDecididos({});
      recarregar();
    }
  }

  async function decidir(p: PedidoAcesso, acao: "aceitar" | "recusar") {
    try {
      if (acao === "aceitar") {
        const r = await api.post<{ senhaTemporaria: string }>(`/pedidos-acesso/${p.id}/aceitar`);
        // O próprio cartão mostra "Conta criada" com a senha (um aviso flutuante cobriria o cabeçalho dele).
        setDecididos((d) => ({ ...d, [p.id]: { tipo: "aceito", senha: r.senhaTemporaria } }));
      } else {
        await api.post(`/pedidos-acesso/${p.id}/recusar`);
        setDecididos((d) => ({ ...d, [p.id]: { tipo: "recusado" } }));
      }
    } catch (e) {
      toast.error(mensagemErro(e, "Não foi possível concluir. Tente de novo."));
    }
  }

  const rotulo = aguardando ? `Pedidos de acesso: ${aguardando} aguardando` : "Pedidos de acesso";

  return (
    <div ref={raiz} className="relative size-11 shrink-0 lg:size-10">
      <AnimatePresence initial={false}>
        {!aberto ? (
          <motion.button
            key="botao"
            type="button"
            layoutId="pedidos-acesso"
            transition={MOLA}
            onClick={abrir}
            aria-label={rotulo}
            aria-haspopup="dialog"
            aria-expanded={false}
            title="Pedidos de acesso"
            className="absolute right-0 top-0 grid size-11 place-items-center bg-[linear-gradient(to_bottom,#fff,var(--tinta-50))] text-foreground-secondary shadow-[0_6px_10px_-4px_rgba(11,27,54,0.12),0_0_0_0.5px_rgba(11,27,54,0.12),inset_0_0_0_1px_#fff] outline-none transition-colors hover:text-foreground focus-visible:shadow-[var(--anel-foco)] lg:size-10"
            style={{ borderRadius: 99 }}
          >
            <motion.span layoutId="pedidos-acesso-icone" transition={MOLA} className="grid size-6 place-items-center" style={{ borderRadius: 8 }}>
              <UserPlus className="size-[18px]" aria-hidden />
            </motion.span>
            {aguardando > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--acafrao)] px-1 text-[10px] font-bold text-[var(--foreground)] ring-2 ring-[var(--areia)]"
              >
                {aguardando}
              </motion.span>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="cartao"
            role="dialog"
            aria-label="Pedidos de acesso"
            layoutId="pedidos-acesso"
            transition={MOLA}
            className="absolute right-0 top-0 z-50 w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden bg-tinta-50 p-0.5 shadow-[0_0_32px_-8px_rgba(11,27,54,0.12),0_16px_20px_-6px_rgba(11,27,54,0.1),0_6px_7px_-6px_rgba(11,27,54,0.2),0_0_0_0.5px_rgba(11,27,54,0.12),inset_0_0_0_1px_#fff]"
            style={{ borderRadius: 18 }}
          >
            <div className="flex items-center gap-3 p-3.5">
              <motion.span layoutId="pedidos-acesso-icone" transition={MOLA} className="grid size-10 shrink-0 place-items-center bg-marca text-white shadow-[0_6px_14px_-6px_rgba(29,78,216,0.6)]" style={{ borderRadius: 12 }}>
                <UserPlus className="size-5" aria-hidden />
              </motion.span>
              <motion.div {...ENTRA} className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">Pedidos de acesso</div>
                <div className="text-xs text-foreground-muted">
                  {carga.carregando && !carga.dados ? "Carregando…" : aguardando ? `${aguardando} ${aguardando === 1 ? "pessoa aguarda" : "pessoas aguardam"} sua resposta` : "Nenhum pedido aguardando"}
                </div>
              </motion.div>
              <motion.button {...ENTRA} type="button" onClick={fechar} aria-label="Fechar" className="grid size-8 shrink-0 place-items-center rounded-full text-foreground-muted hover:bg-tinta-100 hover:text-foreground">
                <X className="size-4" aria-hidden />
              </motion.button>
            </div>

            <motion.div {...ENTRA} className="rounded-[16px] bg-areia-card p-1 shadow-[inset_0_-1px_2px_rgba(11,27,54,0.03),0_0_0_0.5px_rgba(11,27,54,0.08)]">
              {pedidos.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-foreground-muted">
                  {carga.erro ? carga.erro : "Quando alguém pedir acesso pela tela de login, o pedido aparece aqui."}
                </p>
              ) : (
                <ul className="max-h-[min(60vh,26rem)] space-y-0.5 overflow-y-auto">
                  {pedidos.map((p) => <Pedido key={p.id} p={p} decidido={decididos[p.id]} onDecidir={decidir} />)}
                </ul>
              )}
            </motion.div>

            <motion.div {...ENTRA}>
              <Link to="/acessos" onClick={fechar} className={cn("flex h-9 items-center justify-center text-[13px] font-medium text-foreground-muted transition-colors hover:text-foreground")}>
                Gerenciar usuários e acessos
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
