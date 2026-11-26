import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api, ApiError, quandoSessaoEncerrar } from "@/api/client";
import { supabase } from "@/api/supabase";
import { AuthContext, type Usuario } from "@/context/useAuth";
import { guardarDestino } from "@/lib/sessao";

export type { Usuario } from "@/context/useAuth";

const CHAVE_USUARIO = "steto_usuario";
const MENSAGEM_SESSAO_ENCERRADA = "Sua sessão terminou. Entre de novo para continuar.";

const MENSAGENS_LOGIN: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  over_request_rate_limit: "Muitas tentativas. Aguarde um minuto e tente de novo.",
  user_banned: "Esta conta está bloqueada. Fale com o administrador.",
};

const usuarioSalvo = (): Usuario | null => {
  try {
    const bruto = localStorage.getItem(CHAVE_USUARIO);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
};

/**
 * Sessão do Supabase + perfil do Steto (empresa e permissões, de /auth/me). O usuário salvo entra no estado
 * inicial para o app abrir sem piscar; o efeito confirma com o banco. Erro de rede nunca desloga.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSalvo);
  const [carregando, setCarregando] = useState(true);
  const [semVinculo, setSemVinculo] = useState(false);
  const encerrando = useRef(false);

  const aplicar = useCallback((u: Usuario | null) => {
    setUsuario(u);
    if (u) localStorage.setItem(CHAVE_USUARIO, JSON.stringify(u));
    else localStorage.removeItem(CHAVE_USUARIO);
  }, []);

  const carregarPerfil = useCallback(async () => {
    try {
      aplicar(await api.get<Usuario>("/auth/me"));
      setSemVinculo(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        aplicar(null);
        setSemVinculo(true);
      } else if (e instanceof ApiError && e.status === 401) {
        aplicar(null);
      }
      // Rede caída: mantém o usuário salvo (uso offline).
    }
  }, [aplicar]);

  /** A sessão acabou sem o usuário pedir: guarda a tela, avisa e leva ao login. */
  const encerrarSessao = useCallback(() => {
    if (encerrando.current) return;
    encerrando.current = true;
    guardarDestino(window.location.pathname + window.location.search);
    aplicar(null);
    void supabase.auth.signOut({ scope: "local" });
    toast.info(MENSAGEM_SESSAO_ENCERRADA);
  }, [aplicar]);

  useEffect(() => quandoSessaoEncerrar(encerrarSessao), [encerrarSessao]);

  useEffect(() => {
    let ativo = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!data.session) aplicar(null);
        else await carregarPerfil();
      })
      .catch(() => aplicar(null))
      .finally(() => ativo && setCarregando(false));
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") aplicar(null);
    });
    return () => {
      ativo = false;
      data.subscription.unsubscribe();
    };
  }, [aplicar, carregarPerfil]);

  const login = useCallback(
    async (email: string, senha: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) {
        const erro = new ApiError(MENSAGENS_LOGIN[error.code ?? ""] ?? "Não foi possível entrar. Tente novamente.");
        erro.status = error.status;
        throw erro;
      }
      encerrando.current = false;
      await carregarPerfil();
    },
    [carregarPerfil],
  );

  const logout = useCallback(async () => {
    encerrando.current = true;
    await supabase.auth.signOut().catch(() => supabase.auth.signOut({ scope: "local" }));
    aplicar(null);
    setSemVinculo(false);
  }, [aplicar]);

  return <AuthContext.Provider value={{ usuario, carregando, semVinculo, login, logout }}>{children}</AuthContext.Provider>;
}
