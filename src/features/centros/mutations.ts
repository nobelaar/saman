import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CentroAcopio } from '@/types/db'

export interface CrearCentroInput {
  coordinador_id: string
  nombre: string
  descripcion?: string | null
  direccion: string
  ciudad: string
  contacto?: string | null
  lat: number
  lng: number
  foto_portada?: string | null
}

export interface EditarCentroInput {
  id: string
  nombre?: string
  descripcion?: string | null
  direccion?: string
  ciudad?: string
  contacto?: string | null
  lat?: number
  lng?: number
  foto_portada?: string | null
}

export function useCrearCentro() {
  const qc = useQueryClient()
  return useMutation<CentroAcopio, Error, CrearCentroInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .insert({
          coordinador_id: input.coordinador_id,
          nombre: input.nombre,
          descripcion: input.descripcion ?? null,
          direccion: input.direccion,
          ciudad: input.ciudad,
          contacto: input.contacto ?? null,
          lat: input.lat,
          lng: input.lng,
          foto_portada: input.foto_portada ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centros'] })
    },
  })
}

export function useEditarCentro() {
  const qc = useQueryClient()
  return useMutation<CentroAcopio, Error, EditarCentroInput>({
    mutationFn: async (input) => {
      const { id, ...patch } = input
      const { data, error } = await supabase
        .from('centros_acopio')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['centros'] })
      qc.invalidateQueries({ queryKey: ['centro', variables.id] })
    },
  })
}