import { NavLink, useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, MotionConfig, motion, useDragControls } from "framer-motion";
import { ChevronRight, LogOut, Search, X } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/cn";
import { papelDoUsuario, type SecaoMenu } from "@/lib/navegacao";
import { GRADIENTES_APP } from "@/lib/pasta";
import { Contador } from "@/components/layout/BarraLateral";

// Menu "Mais" do celular, no mesmo idioma da pasta do Novo: uma folha que sobe de baixo com mola (arraste a alça
// para baixo para fechar), o cartão da pessoa no topo, atalho para a busca e as telas em grade de ícones "de app"
// (uma cor por seção, 4 por linha para caber quase sem rolar). O ícone da tela atual fica marcado; cada ícone afunda ao toque.

const MOLA_FOLHA = { type: "spring", bounce: 0.18, visualDuration: 0.38 } as const;
const MOLA_TOQUE = { type: "spring", bounce: 0.4, visualDuration: 0.2 } as const;
const entra = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.05, duration: 0.32, ease: [0.16, 1, 0.3, 1] as const } },
});

export function MenuMais({ aberto, onFechar, onBuscar, secoes, pendentes }: {
  aberto: boolean;
  onFechar: () => void;
  /** Abre a busca de telas e ações (o menu fecha antes). */
  onBuscar?: () => void;
  secoes: SecaoMenu[];
  pendentes: number;
}) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const arrastar = useDragControls();
  if (!usuario) return null;
  // "Minha conta" já está no cartão do topo; a grade mostra só as áreas do sistema.
  const areas = secoes.filter((s) => s.chave !== "conta");

  return (
    <MotionConfig transition={MOLA_FOLHA} reducedMotion="user">
      <DialogPrimitive.Root open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
        <AnimatePresence>
          {aberto && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-tinta-900/30 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.22 } }}
                  exit={{ opacity: 0, pointerEvents: "none", transition: { duration: 0.2 } }}
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[28px] bg-areia shadow-[0_-20px_50px_-20px_rgba(11,27,54,0.35)] outline-none md:inset-x-auto md:left-1/2 md:w-[28rem] md:-translate-x-1/2"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%", pointerEvents: "none" }}
                  drag="y"
                  dragControls={arrastar}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.04, bottom: 0.7 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 110 || info.velocity.y > 600) onFechar();
                  }}
                >
                  {/* Alça + cabeçalho: é por aqui que se arrasta a folha para baixo. */}
                  <div onPointerDown={(e) => arrastar.start(e)} className="shrink-0 cursor-grab touch-none px-5 pb-2 pt-2.5 active:cursor-grabbing">
                    <div aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-tinta-300" />
                    <div className="mt-3 flex items-center justify-between">
                      <DialogPrimitive.Title className="font-titulo text-xl font-semibold tracking-tight">Menu</DialogPrimitive.Title>
                      <DialogPrimitive.Close className="grid size-9 place-items-center rounded-full bg-tinta-100 text-foreground-secondary outline-none active:scale-95 focus-visible:shadow-[var(--anel-foco)]">
                        <X className="size-4" aria-hidden />
                        <span className="sr-only">Fechar</span>
                      </DialogPrimitive.Close>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                    {/* Cartão da pessoa (abre Meu perfil) */}
                    <motion.button
                      {...entra(0)}
                      type="button"
                      whileTap={{ scale: 0.98, transition: MOLA_TOQUE }}
                      onClick={() => {
                        onFechar();
                        navigate("/perfil");
                      }}
                      className="flex w-full items-center gap-3 rounded-[20px] bg-areia-card p-3 text-left shadow-[var(--shadow-xs)] ring-1 ring-borda outline-none focus-visible:shadow-[var(--anel-foco)]"
                    >
                      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,var(--azul-600),var(--azul-400))] text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(29,78,216,0.7)]">
                        {iniciais(usuario.nome)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-foreground">{usuario.nome}</span>
                        <span className="block truncate text-xs text-foreground-muted">{usuario.email}</span>
                        <span className="mt-1 inline-flex rounded-full bg-azul-50 px-2 py-0.5 text-[11px] font-semibold text-azul-700 ring-1 ring-inset ring-azul-200">{papelDoUsuario(usuario)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-foreground-muted">
                        Perfil <ChevronRight className="size-4" aria-hidden />
                      </span>
                    </motion.button>

                    {onBuscar && (
                      <motion.button
                        {...entra(1)}
                        type="button"
                        whileTap={{ scale: 0.98, transition: MOLA_TOQUE }}
                        onClick={onBuscar}
                        className="mt-3 flex h-12 w-full items-center gap-3 rounded-2xl bg-tinta-100 px-4 text-left text-[15px] text-foreground-muted outline-none focus-visible:shadow-[var(--anel-foco)]"
                      >
                        <Search className="size-[18px] text-azul-600" aria-hidden />
                        Buscar tela ou ação
                      </motion.button>
                    )}

                    {areas.map((s, indiceSecao) => (
                      <motion.section key={s.chave} {...entra(indiceSecao + 2)} className="mt-5" aria-label={s.titulo}>
                        <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">{s.titulo}</h3>
                        <div className="grid grid-cols-4 gap-1.5">
                          {s.itens.map((item) => (
                            <motion.div key={item.href} whileTap={{ scale: 0.92, transition: MOLA_TOQUE }}>
                              <NavLink
                                to={item.href}
                                onClick={onFechar}
                                className={({ isActive }) =>
                                  cn(
                                    "relative flex h-full flex-col items-center gap-1.5 rounded-[16px] px-0.5 pb-2.5 pt-2.5 text-center outline-none transition-colors focus-visible:shadow-[var(--anel-foco)]",
                                    isActive ? "bg-areia-card shadow-[var(--shadow-sm)] ring-1 ring-azul-200" : "active:bg-tinta-100",
                                  )
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <span
                                      aria-hidden
                                      className="relative grid size-11 place-items-center rounded-[14px] text-white shadow-[0_8px_16px_-8px_rgba(11,27,54,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
                                      style={{ background: GRADIENTES_APP[indiceSecao % GRADIENTES_APP.length] }}
                                    >
                                      <item.Icone width={20} height={20} strokeWidth={1.9} />
                                      {item.contador === "pedidos" && <Contador valor={pendentes} className="absolute -right-1.5 -top-1.5 ring-2 ring-[var(--areia)]" />}
                                    </span>
                                    <span className={cn("line-clamp-2 text-[11px] leading-[1.2]", isActive ? "font-semibold text-azul-700" : "font-medium text-foreground")}>
                                      {item.label}
                                    </span>
                                    {isActive && <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-azul-600" />}
                                  </>
                                )}
                              </NavLink>
                            </motion.div>
                          ))}
                        </div>
                      </motion.section>
                    ))}

                    <motion.button
                      {...entra(areas.length + 2)}
                      type="button"
                      whileTap={{ scale: 0.98, transition: MOLA_TOQUE }}
                      onClick={() => {
                        onFechar();
                        void logout();
                      }}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-areia-card text-[15px] font-semibold text-[var(--danger)] shadow-[var(--shadow-xs)] ring-1 ring-borda outline-none focus-visible:shadow-[var(--anel-foco)]"
                    >
                      <LogOut className="size-4" aria-hidden /> Sair
                    </motion.button>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </MotionConfig>
  );
}
