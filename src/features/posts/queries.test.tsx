import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro, fixturePost, fixturePost2 } from '@/test/mocks'
import { usePostsCentro } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('usePostsCentro', () => {
  it('returns posts newest first for the given centro', async () => {
    const { result } = renderHook(() => usePostsCentro(fixtureCentro.id), { wrapper })
    await waitFor(() => expect(result.current.data?.length).toBe(2))
    expect(result.current.data?.[0].contenido).toBe(fixturePost2.contenido)
    expect(result.current.data?.[1].contenido).toBe(fixturePost.contenido)
  })

  it('returns an empty array for an unknown centro', async () => {
    const { result } = renderHook(
      () => usePostsCentro('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper }
    )
    await waitFor(() => expect(result.current.data).toEqual([]))
  })
})