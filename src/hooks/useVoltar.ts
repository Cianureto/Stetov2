import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Volta para a tela anterior (com a URL dela, ou seja, a lista com a mesma página, pesquisa e filtros). Se a
 * tela foi aberta direto (link, recarga), não há para onde voltar no histórico: vai para `padrao`.
 */
export function useVoltar(padrao: string) {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (location.key !== "default") navigate(-1);
    else navigate(padrao, { replace: true });
  }, [navigate, location.key, padrao]);
}
