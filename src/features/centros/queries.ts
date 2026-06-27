import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CentroAcopio, CentroCercano } from '@/types/db'

type Coords = { lat: number; lng: number } | null

export function useCentrosCercanos(coords: Coords) {
  return useQuery<CentroCercano[]>({
    queryKey: ['centros', 'cercanos', coords ? `${coords.lat},${coords.lng}` : 'by-ciudad'],
    queryFn: async () => {
      if (coords) {
        const { data, error } = await supabase.rpc('centros_cercanos', {
          user_lat: coords.lat,
          user_lng: coords.lng,
          p_limit: 100,
        })
        if (error) throw error
        return (data ?? []) as CentroCercano[]
      }
      const { data, error } = await supabase
        .from('centros_acopio')
        .select(
          'id, nombre, descripcion, direccion, ciudad, contacto, foto_portada, lat, lng, created_at, posts ( contenido, created_at )'
        )
        .order('ciudad', { ascending: true })
      if (error) throw error
      return ((data ?? []) as unknown as CentroWithFallbackRow[]).map(toCentroCercano)
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

interface CentroWithFallbackRow {
  id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
  posts: { contenido: string; created_at: string }[]
}

function toCentroCercano(row: CentroWithFallbackRow): CentroCercano {
  const ultimo = row.posts?.[0]
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    ciudad: row.ciudad,
    direccion: row.direccion,
    foto_portada: row.foto_portada,
    contacto: row.contacto,
    distancia_km: 0,
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