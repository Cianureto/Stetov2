import { createContext, useContext } from "react";

// Fica fora de AuthContext.tsx porque o Fast Refresh só recarrega no lugar arquivos que exportam apenas componentes.

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "usuario";
  empresa: { id: string; nome: string; isSteto: boolean };
  /** Permissões do perfil (lib/permissoes.ts). Sem lista = acesso total (administrador). */
  permissoes?: string[];
};

export type AuthContextValue = {
  usuario: Usuario | null;
  carregando: boolean;
  /** Logado no Supabase, mas sem perfil (conta ainda não vinculada a uma empresa). */
  semVinculo: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
