import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Post } from '@/types/db'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro, fixturePost } from '@/test/mocks'

type InsertListener = (payload: { new: Post; eventType: string }) => void

interface FakeChannel {
  state: string
  unsubscribe: () => void
}

function buildFakeSupabase() {
  const listeners: InsertListener[] = []
  const removed: FakeChannel[] = []
  const channels: FakeChannel[] = []
  const supabase = {
    channel(_name: string) {
      const builder = {
        on(event: string, _filter: unknown, cb: InsertListener) {
          if (event === 'postgres_changes') listeners.push(cb)
          return builder
        },
        subscribe() {
          const ch: FakeChannel = { state: 'joined', unsubscribe: vi.fn() }
          channels.push(ch)
          return ch
        },
      }
      return builder
    },
    removeChannel(ch: FakeChannel) {
      removed.push(ch)
    },
  }
  return { supabase, listeners, channels, removed }
}

describe('useRealtimePosts', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('prepends a realtime INSERT into the posts cache and cleans up on unmount', async () => {
    const fake = buildFakeSupabase()
    vi.doMock('@/lib/supabase', () => ({ supabase: fake.supabase }))
    const { useRealtimePosts } = await import('./realtime')

    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const key = ['posts', fixtureCentro.id]
    const existing: Post[] = [fixturePost]
    qc.setQueryData(key, existing)

    const renderResult = renderHook(
      () => {
        useRealtimePosts(fixtureCentro.id)
        const qc2 = useQueryClient()
        return { qc2 }
      },
      { wrapper }
    )

    const newPost: Post = {
      id: 'post-realtime-1',
      centro_id: fixtureCentro.id,
      contenido: 'Nuevo realtime',
      foto_url: null,
      necesidades: ['Agua'],
      created_at: new Date().toISOString(),
    }
    fake.listeners[0]!({ new: newPost, eventType: 'INSERT' })

    await waitFor(() => {
      const data = qc.getQueryData<Post[]>(key)
      return data && data.length === 2 && data[0].id === newPost.id
    })
    expect(fake.channels.length).toBe(1)

    renderResult.unmount()
    await waitFor(() => expect(fake.removed.length).toBe(1))
  })
})