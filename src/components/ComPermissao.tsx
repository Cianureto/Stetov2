import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { inicioDoUsuario, pode, type PermissaoQualquer } from "@/lib/permissoes";

/** Rota que exige uma permissão (alguma da lista). Sem ela, mostra o aviso em vez da tela. */
export function ComPermissao({ permissao, children }: { permissao: PermissaoQualquer | PermissaoQualquer[]; children: ReactNode }) {
  const { usuario } = useAuth();
  const lista = Array.isArray(permissao) ? permissao : [permissao];
  if (lista.some((p) => pode(usuario, p))) return <>{children}</>;
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center">
      <ShieldAlert className="mx-auto size-8 text-foreground-muted" aria-hidden />
      <h1 className="mt-3 font-titulo text-lg font-semibold">Sem acesso a esta tela</h1>
      <p className="mt-1 text-sm text-foreground-muted">O seu perfil de acesso não inclui esta área. Se precisar, fale com o administrador da sua empresa.</p>
      <Link to={inicioDoUsuario(usuario)} className="btn btn-secondary mt-4 inline-flex">
        Voltar ao início
      </Link>
    </div>
  );
}
