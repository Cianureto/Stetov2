import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Carregando } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { guardarDestino } from "@/lib/sessao";
import { FormTrocarSenha } from "@/components/conta/FormTrocarSenha";
import { MarcaLogo } from "@/components/Marca";

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
          <h1 className="mt-3 font-titulo text-lg font-semibold">Seu acesso não está liberado</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            A sua conta não está vinculada a uma empresa ou foi inativada. Fale com o administrador da sua empresa.
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

  // Senha temporária (criada ou redefinida pelo administrador): troca obrigatória antes de usar o app.
  if (usuario.trocarSenha) {
    return (
      <div className="grid min-h-dvh place-items-center bg-areia p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center"><MarcaLogo tamanho="lg" /></div>
          <div className="card p-6 shadow-[var(--shadow-md)]">
            <h1 className="font-titulo text-xl font-bold">Crie a sua senha</h1>
            <p className="mb-4 mt-1 text-sm text-foreground-muted">Você entrou com uma senha temporária. Escolha uma senha só sua para continuar.</p>
            <FormTrocarSenha />
          </div>
          <button type="button" onClick={() => void logout()} className="alvo-toque mx-auto block text-sm font-medium text-foreground-secondary hover:text-foreground">Sair</button>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
