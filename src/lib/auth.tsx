import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

export interface AuthState {
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const MENSAGENS_ERRO: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
}

export function AuthProvider({ children }: { children: (auth: AuthState) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      // Sessão ilegível (storage bloqueado ou corrompido): segue deslogado em vez de travar em tela branca
      .catch(() => setSession(null))
      .finally(() => setReady(true))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const value: AuthState = {
    session,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(MENSAGENS_ERRO[error.code ?? ''] ?? 'Não foi possível entrar. Tente novamente.')
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }

  if (!ready) return null
  return <AuthContext.Provider value={value}>{children(value)}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
