import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/db'

export function useRealtimePosts(centroId: string): void {
  const qc = useQueryClient()

  useEffect(() => {
    if (!centroId) return
    const channel = supabase
      .channel(`posts:centro=${centroId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `centro_id=eq.${centroId}`,
        },
        (payload) => {
          qc.setQueryData<Post[]>(['posts', centroId], (old) => [
            payload.new as Post,
            ...(old ?? []),
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [centroId, qc])
}