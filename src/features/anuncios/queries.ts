import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Anuncio, AnuncioWithUtil, AnuncioTipo } from '@/types/db'

const PAGE_SIZE = 20

function toAnuncioWithUtil(anuncio: Anuncio): AnuncioWithUtil {
  return { ...anuncio, util_count: 0, user_has_util: false }
}

export function useInfiniteAnuncios(tipo?: AnuncioTipo) {
  return useInfiniteQuery<AnuncioWithUtil[]>({
    queryKey: ['anuncios', 'feed', tipo ?? 'all'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('anuncio')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (tipo) {
        query = query.eq('tipo', tipo)
      }
      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toAnuncioWithUtil) as AnuncioWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useAnunciosPorCentro(centroId: string) {
  return useQuery<AnuncioWithUtil[]>({
    queryKey: ['anuncios', 'centro', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anuncio')
        .select('*')
        .eq('centro_id', centroId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toAnuncioWithUtil) as AnuncioWithUtil[]
    },
    enabled: !!centroId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
