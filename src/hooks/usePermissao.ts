import { useAuth } from "@/context/useAuth";
import { pode, type PermissaoQualquer } from "@/lib/permissoes";

/** `const podeAprovar = usePermissao("carteira.decidir")` — para esconder ações que o perfil não permite. */
export function usePermissao(permissao: PermissaoQualquer) {
  const { usuario } = useAuth();
  return pode(usuario, permissao);
}
