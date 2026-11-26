import { useQuery } from '@tanstack/react-query'
import { useAuth } from './auth'
import { supabase } from './supabase'

/** Perfil do usuário logado + empresa. null = logado mas sem perfil (ainda não vinculado a uma empresa). */
export function usePerfil() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['perfil', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome, email, papel, empresa:empresas(id, nome, is_steto)')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        ...data,
        isAdmin: data.papel === 'admin',
        isStetoAdmin: data.papel === 'admin' && !!data.empresa?.is_steto,
      }
    },
  })
}
