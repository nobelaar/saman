import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { useCrearPost } from './mutations'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('useCrearPost', () => {
  it('creates a post and returns it with an id and the requested tags', async () => {
    const { result } = renderHook(() => useCrearPost(), { wrapper })
    await result.current.mutateAsync({
      centro_id: fixtureCentro.id,
      contenido: 'Necesitamos alimentos',
      necesidades: ['Alimentos no perecederos'],
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const created = result.current.data
    expect(created?.id).toBeTruthy()
    expect(created?.centro_id).toBe(fixtureCentro.id)
    expect(created?.contenido).toBe('Necesitamos alimentos')
    expect(created?.necesidades).toContain('Alimentos no perecederos')
  })
})