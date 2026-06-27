import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/db'

export interface CrearPostInput {
  centro_id: string
  contenido: string
  foto_url?: string | null
  necesidades?: string[]
}

export function useCrearPost() {
  const qc = useQueryClient()
  return useMutation<Post, Error, CrearPostInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          centro_id: input.centro_id,
          contenido: input.contenido,
          foto_url: input.foto_url ?? null,
          necesidades: input.necesidades ?? [],
        })
        .select()
        .single()
      if (error) throw error
      return data as Post
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['posts', variables.centro_id] })
    },
  })
}