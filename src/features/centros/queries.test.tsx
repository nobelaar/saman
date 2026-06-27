import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { useCentro, useCentrosCercanos } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('useCentrosCercanos', () => {
  it('returns centros ordered by ciudad when no coords (fallback)', async () => {
    const { result } = renderHook(() => useCentrosCercanos(null), { wrapper })
    await waitFor(() => expect(result.current.data?.length).toBe(2))
    const ordered = result.current.data!.map((c) => c.ciudad)
    expect(ordered).toEqual([...ordered].sort())
    const first = result.current.data![0]
    expect(first.ultimo_post_contenido).not.toBeNull()
    expect(first.distancia_km).toBe(0)
  })

  it('returns centros from the RPC when coords are provided', async () => {
    const { result } = renderHook(() => useCentrosCercanos({ lat: 10.5, lng: -66.9 }), { wrapper })
    await waitFor(() => expect(result.current.data?.length).toBe(1))
    const item = result.current.data![0]
    expect(typeof item.distancia_km).toBe('number')
    expect(item.ultimo_post_contenido).not.toBeNull()
  })
})

describe('useCentro', () => {
  it('returns a centro matching the id', async () => {
    const { result } = renderHook(() => useCentro(fixtureCentro.id), { wrapper })
    await waitFor(() => expect(result.current.data?.nombre).toBe(fixtureCentro.nombre))
  })

  it('exposes an error when the centro does not exist', async () => {
    const { result } = renderHook(
      () => useCentro('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeFalsy()
  })
})