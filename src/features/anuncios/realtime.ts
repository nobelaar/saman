import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeAnuncios() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('anuncios-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'anuncio' },
        () => {
          qc.invalidateQueries({ queryKey: ['anuncios', 'feed'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
