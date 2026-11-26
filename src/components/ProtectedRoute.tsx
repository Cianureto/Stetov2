import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Carregando } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { guardarDestino } from "@/lib/sessao";

/** Área logada. Sem sessão vai para o login (e volta para esta tela depois); sem empresa vinculada, avisa. */
export default function ProtectedRoute() {
  const { usuario, carregando, semVinculo, logout } = useAuth();
  const { pathname, search } = useLocation();

  if (carregando && !usuario) return <Carregando telaCheia className="bg-areia" />;

  if (semVinculo) {
    return (
      <div className="grid min-h-dvh place-items-center bg-areia p-4">
        <div className="card max-w-md p-6 text-center">
          <ShieldAlert className="mx-auto size-8 text-[var(--aviso)]" aria-hidden />
          <h1 className="mt-3 font-titulo text-lg font-semibold">Seu acesso ainda não foi liberado</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Sua conta existe, mas ainda não está vinculada a uma empresa. Peça ao administrador para liberar o seu acesso.
          </p>
          <Button className="mt-4" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (!usuario) {
    guardarDestino(pathname + search);
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
