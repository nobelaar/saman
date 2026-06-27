import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ComentarioWithUtil } from '@/types/db'

export function useComentarios(postId: string, enabled = true) {
  return useQuery<ComentarioWithUtil[]>({
    queryKey: ['comentarios', postId],
    queryFn: async () => {
      const { data: comentarios, error } = await supabase
        .from('post_comentario')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!comentarios?.length) return []

      const { data: utils, error: utilError } = await supabase
        .from('comentario_util')
        .select('comentario_id')

      if (utilError) throw utilError

      const utilCounts = new Map<string, number>()
      for (const u of utils ?? []) {
        utilCounts.set(u.comentario_id, (utilCounts.get(u.comentario_id) ?? 0) + 1)
      }

      const { data: _authData } = await supabase.auth.getUser()

      return comentarios.map((c) => ({
        ...c,
        util_count: utilCounts.get(c.id) ?? 0,
        user_has_util: false,
      })) as ComentarioWithUtil[]
    },
    enabled: !!postId && enabled,
    staleTime: 30_000,
  })
}
