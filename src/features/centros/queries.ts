import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CentroAcopio, CentroResumen } from '@/types/db'

export function useCentros() {
  return useQuery<CentroResumen[]>({
    queryKey: ['centros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .select(
          'id, coordinador_id, nombre, descripcion, direccion, ciudad, contacto, foto_portada, created_at, posts ( contenido, created_at )'
        )
        .order('ciudad', { ascending: true })
      if (error) throw error
      return ((data ?? []) as CentroWithPostsRow[]).map(toCentroResumen)
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

interface CentroWithPostsRow {
  id: string
  coordinador_id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
  posts: { contenido: string; created_at: string }[]
}

function toCentroResumen(row: CentroWithPostsRow): CentroResumen {
  const ultimo = row.posts?.[0]
  return {
    id: row.id,
    coordinador_id: row.coordinador_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    ciudad: row.ciudad,
    direccion: row.direccion,
    foto_portada: row.foto_portada,
    contacto: row.contacto,
    ultimo_post_contenido: ultimo?.contenido ?? null,
    ultimo_post_created_at: ultimo?.created_at ?? null,
  }
}

export function useCentro(id: string) {
  return useQuery<CentroAcopio>({
    queryKey: ['centro', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    enabled: !!id,
  })
}
