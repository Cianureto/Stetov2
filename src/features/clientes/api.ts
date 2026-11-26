import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enums, Tables, TablesInsert } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type Cliente = Tables<'clientes'>
export type ClienteInput = Omit<TablesInsert<'clientes'>, 'id' | 'empresa_id' | 'created_at' | 'updated_at' | 'legacy_id'>

export interface FiltroClientes {
  busca: string
  status: Enums<'status_cliente'> | 'todos'
  pagina: number
}

export const POR_PAGINA = 25

const chave = ['clientes'] as const

export function useClientes(filtro: FiltroClientes) {
  return useQuery({
    queryKey: [...chave, filtro],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const de = (filtro.pagina - 1) * POR_PAGINA
      let q = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('razao_social')
        .range(de, de + POR_PAGINA - 1)
      if (filtro.status !== 'todos') q = q.eq('status', filtro.status)
      const termo = filtro.busca.trim()
      if (termo) {
        const digitos = termo.replace(/\D/g, '')
        // Escapa caracteres especiais do filtro PostgREST
        const seguro = termo.replace(/[%,()]/g, ' ')
        q = digitos.length >= 3
          ? q.or(`razao_social.ilike.%${seguro}%,documento.like.%${digitos}%`)
          : q.ilike('razao_social', `%${seguro}%`)
      }
      const { data, error, count } = await q
      if (error) throw error
      return { linhas: data, total: count ?? 0 }
    },
  })
}

export function useContagemClientes() {
  return useQuery({
    queryKey: [...chave, 'contagem'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('status')
      if (error) throw error
      const c = { todos: data.length, ativo: 0, inativo: 0, provisorio: 0 }
      for (const r of data) c[r.status]++
      return c
    },
  })
}

export function useSalvarCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: ClienteInput }) => {
      const { error } = id
        ? await supabase.from('clientes').update(dados).eq('id', id)
        : await supabase.from('clientes').insert(dados)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chave }),
  })
}

export function useExcluirCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) {
        // 23503 = ainda há registros financeiros apontando para o cliente
        if (error.code === '23503') throw new Error('Este cliente tem registros financeiros. Inative-o em vez de excluir.')
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chave }),
  })
}
