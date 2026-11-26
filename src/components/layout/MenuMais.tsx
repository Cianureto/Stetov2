import { NavLink } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/cn";
import { papelDoUsuario, type AcaoRapida, type SecaoMenu } from "@/lib/navegacao";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Contador } from "@/components/layout/BarraLateral";

// Cor do ícone por área (estilo Ajustes do iOS), dentro da paleta do Steto.
const CORES_SECAO = ["bg-marca text-white", "bg-[var(--realce)] text-[var(--sidebar-bg)]", "bg-[var(--acafrao)] text-[var(--foreground)]", "bg-[var(--sidebar-bg)] text-white"];

const CLASSE_GRUPO = "overflow-hidden rounded-xl bg-[var(--areia-card)] shadow-[var(--shadow-xs)] ring-1 ring-foreground/[0.05]";

/** Menu "Mais" do celular (folha inferior): perfil, todas as seções do menu e "Sair". */
export function MenuMais({ aberto, onFechar, secoes, pendentes }: { aberto: boolean; onFechar: () => void; secoes: SecaoMenu[]; pendentes: number }) {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="bg-areia md:max-w-md">
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
          <DialogDescription className="sr-only">Todas as telas do Steto</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className={cn(CLASSE_GRUPO, "flex items-center gap-3 p-3")}>
            <Avatar className="h-11 w-11 ring-2 ring-realce/30">
              <AvatarFallback>{iniciais(usuario.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-titulo text-base font-semibold">{usuario.nome}</p>
              <p className="truncate text-sm text-foreground-muted">{papelDoUsuario(usuario)}</p>
            </div>
          </div>
          {secoes.map((s, indiceSecao) => (
            <div key={s.chave}>
              <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{s.titulo}</p>
              <div className={CLASSE_GRUPO}>
                {s.itens.map((i, idx) => (
                  <NavLink
                    key={i.href}
                    to={i.href}
                    onClick={onFechar}
                    className={({ isActive }) => cn("flex min-h-12 items-center gap-3 pl-3 text-[15px] font-medium outline-none transition-colors active:bg-foreground/5 focus-visible:bg-foreground/5", isActive ? "text-marca" : "text-foreground")}
                  >
                    <span className={cn("grid h-7.5 w-7.5 shrink-0 place-items-center rounded-lg", CORES_SECAO[indiceSecao % CORES_SECAO.length])}>
                      <i.Icone width={16} height={16} strokeWidth={2} aria-hidden />
                    </span>
                    <span className={cn("flex min-h-12 flex-1 items-center gap-2 pr-3", idx > 0 && "border-t border-foreground/[0.06]")}>
                      <span className="flex-1 leading-tight">{i.label}</span>
                      {i.contador === "pedidos" && <Contador valor={pendentes} />}
                      <ChevronRight className="size-4 text-foreground/30" aria-hidden />
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={logout} className={cn(CLASSE_GRUPO, "flex min-h-12 w-full items-center justify-center gap-2 text-[15px] font-medium text-danger active:bg-foreground/5")}>
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Escolha da ação rápida quando o perfil tem mais de uma. */
export function MenuAcoes({ aberto, onFechar, acoes, onEscolher }: { aberto: boolean; onFechar: () => void; acoes: AcaoRapida[]; onEscolher: (a: AcaoRapida) => void }) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="bg-areia md:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo</DialogTitle>
          <DialogDescription className="sr-only">Ações rápidas</DialogDescription>
        </DialogHeader>
        <div className={CLASSE_GRUPO}>
          {acoes.map((a, idx) => (
            <button key={a.href} type="button" onClick={() => onEscolher(a)} className={cn("flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-foreground/5", idx > 0 && "border-t border-foreground/[0.06]")}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca-claro text-marca"><a.Icone width={18} height={18} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{a.label}</span>
                <span className="block text-xs text-foreground-muted">{a.descricao}</span>
              </span>
              <ChevronRight className="size-4 text-foreground/30" aria-hidden />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
