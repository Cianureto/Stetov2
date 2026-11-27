import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { iniciais } from "@/lib/format";
import { papelDoUsuario } from "@/lib/navegacao";

// Botão do usuário no estilo do "user button" do Clerk: o avatar redondo cresce até virar o cartão (o avatar
// pequeno vira o grande do cabeçalho pelo layoutId) e o conteúdo entra saindo do desfoque.

const MOLA = { type: "spring", bounce: 0.15, visualDuration: 0.25 } as const;
const ENTRA = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { delay: 0.15 } },
  exit: { opacity: 0, filter: "blur(8px)", transition: { duration: 0.12 } },
};
const AVATAR = "grid place-items-center bg-[linear-gradient(140deg,var(--azul-600),var(--azul-400))] font-semibold text-white";

/** Avatar do cabeçalho: abre o cartão com nome, e-mail e papel, "Meu perfil" e "Sair". */
export function MenuUsuario() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const primeiroItem = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    const fora = (e: MouseEvent) => raiz.current && !raiz.current.contains(e.target as Node) && setAberto(false);
    window.addEventListener("keydown", tecla);
    window.addEventListener("mousedown", fora);
    const foco = window.setTimeout(() => primeiroItem.current?.focus({ preventScroll: true }), 200);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("mousedown", fora);
      window.clearTimeout(foco);
    };
  }, [aberto]);

  if (!usuario) return null;
  const sigla = iniciais(usuario.nome);

  return (
    <div ref={raiz} className="relative size-11 shrink-0 lg:size-10">
      <AnimatePresence initial={false}>
        {!aberto ? (
          <motion.button
            key="botao"
            type="button"
            layoutId="menu-usuario"
            transition={MOLA}
            onClick={() => setAberto(true)}
            aria-label={`Menu do usuário ${usuario.nome}`}
            aria-haspopup="dialog"
            aria-expanded={false}
            title={usuario.nome}
            className="absolute right-0 top-0 grid size-11 place-items-center bg-[linear-gradient(to_bottom,#fff,var(--tinta-50))] shadow-[0_6px_10px_-4px_rgba(11,27,54,0.12),0_0_0_0.5px_rgba(11,27,54,0.12),inset_0_0_0_1px_#fff] outline-none focus-visible:shadow-[var(--anel-foco)] lg:size-10"
            style={{ borderRadius: 99 }}
          >
            <motion.span layoutId="menu-usuario-avatar" transition={MOLA} className={`${AVATAR} size-8 text-[11px]`} style={{ borderRadius: 99 }}>
              {sigla}
            </motion.span>
          </motion.button>
        ) : (
          <motion.div
            key="cartao"
            role="dialog"
            aria-label="Sua conta"
            layoutId="menu-usuario"
            transition={MOLA}
            className="absolute right-0 top-0 z-50 w-64 overflow-hidden bg-tinta-50 p-0.5 shadow-[0_0_32px_-8px_rgba(11,27,54,0.12),0_16px_20px_-6px_rgba(11,27,54,0.1),0_6px_7px_-6px_rgba(11,27,54,0.2),0_0_0_0.5px_rgba(11,27,54,0.12),inset_0_0_0_1px_#fff]"
            style={{ borderRadius: 18 }}
          >
            <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-5 text-center">
              <motion.span layoutId="menu-usuario-avatar" transition={MOLA} className={`${AVATAR} size-12 text-sm shadow-[0_8px_18px_-8px_rgba(29,78,216,0.7)]`} style={{ borderRadius: 99 }}>
                {sigla}
              </motion.span>
              <motion.div {...ENTRA} className="min-w-0 max-w-full">
                <div className="truncate text-sm font-semibold text-foreground">{usuario.nome}</div>
                <div className="truncate text-xs text-foreground-muted">{usuario.email}</div>
                <div className="mt-2 inline-flex rounded-full bg-azul-50 px-2 py-0.5 text-[11px] font-semibold text-azul-700 ring-1 ring-inset ring-azul-200">
                  {papelDoUsuario(usuario)}
                </div>
              </motion.div>
            </div>

            <motion.div {...ENTRA} className="flex flex-col gap-0.5 rounded-[16px] bg-areia-card p-1 shadow-[inset_0_-1px_2px_rgba(11,27,54,0.03),0_0_0_0.5px_rgba(11,27,54,0.08)]">
              <button
                ref={primeiroItem}
                type="button"
                onClick={() => {
                  setAberto(false);
                  navigate("/perfil");
                }}
                className="flex h-9 items-center gap-2.5 rounded-[12px] px-3 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-tinta-100 focus-visible:bg-tinta-100"
              >
                <UserRound className="size-4 text-foreground-muted" aria-hidden /> Meu perfil
              </button>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  void logout();
                }}
                className="flex h-9 items-center gap-2.5 rounded-[12px] px-3 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] focus-visible:bg-[var(--danger-soft)] focus-visible:text-[var(--danger)]"
              >
                <LogOut className="size-4 text-current opacity-70" aria-hidden /> Sair
              </button>
            </motion.div>

            <motion.div {...ENTRA} className="flex h-8 items-center justify-center text-[11px] text-foreground-muted">
              Steto Contabilidade
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
