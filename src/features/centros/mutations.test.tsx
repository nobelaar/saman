import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { useCentrosCercanos } from './queries'
import { CrearCentroInput, EditarCentroInput, useCrearCentro, useEditarCentro } from './mutations'

const crearPayload: CrearCentroInput = {
  coordinador_id: '00000000-0000-0000-0000-0000000000aa',
  nombre: 'Centro Prueba',
  descripcion: 'un centro de prueba',
  direccion: 'Calle 1',
  ciudad: 'Maracay',
  contacto: '0414-1111111',
  lat: 10.247,
  lng: -67.6,
  foto_portada: null,
}

describe('useCrearCentro', () => {
  it('creates a centro and returns it with an id', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useCrearCentro(), { wrapper })
    await result.current.mutateAsync(crearPayload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const created = result.current.data
    expect(created?.id).toBeTruthy()
    expect(created?.nombre).toBe(crearPayload.nombre)
  })

  it('invalidates the centros query cache on success (refetches)', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    function UseCase() {
      const centros = useCentrosCercanos({ lat: 10.5, lng: -66.9 })
      const crear = useCrearCentro()
      return { centros, crear }
    }
    const { result } = renderHook(() => UseCase(), { wrapper })
    await waitFor(() => expect(result.current.centros.data?.length).toBe(1))
    const key = ['centros', 'cercanos', '10.5,-66.9']
    const first = qc.getQueryState(key)?.dataUpdatedAt ?? 0
    await result.current.crear.mutateAsync(crearPayload)
    await waitFor(() => expect(result.current.crear.isSuccess).toBe(true))
    await waitFor(() => {
      const state = qc.getQueryState(key)
      return state != null && state.dataUpdatedAt > first
    })
  })
})

describe('useEditarCentro', () => {
  it('updates an existing centro and returns the updated record', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const payload: EditarCentroInput = { id: fixtureCentro.id, nombre: 'Actualizado' }
    const { result } = renderHook(() => useEditarCentro(), { wrapper })
    await result.current.mutateAsync(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe('Actualizado')
    expect(result.current.data?.id).toBe(fixtureCentro.id)
  })
})