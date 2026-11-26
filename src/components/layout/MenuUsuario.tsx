import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { iniciais } from "@/lib/format";
import { papelDoUsuario } from "@/lib/navegacao";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Avatar do cabeçalho: nome e papel no topo do menu, "Meu perfil" (comum a todos) e "Sair". */
export function MenuUsuario() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu do usuário ${usuario.nome}`}
          title={usuario.nome}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-marca lg:h-10 lg:w-10"
        >
          <Avatar className="h-8 w-8 ring-2 ring-realce/30">
            <AvatarFallback>{iniciais(usuario.nome)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate text-sm font-semibold text-foreground">{usuario.nome}</span>
          <span className="block truncate text-xs font-normal text-foreground-muted">{papelDoUsuario(usuario)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={() => navigate("/perfil")}>
          <UserRound className="size-4" aria-hidden />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onClick={logout} className="gap-2">
          <LogOut className="size-4" aria-hidden /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
