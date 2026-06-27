import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/db'

export function usePostsCentro(centroId: string) {
  return useQuery<Post[]>({
    queryKey: ['posts', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('centro_id', centroId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Post[]
    },
    enabled: !!centroId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}