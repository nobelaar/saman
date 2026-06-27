import { render, screen, within } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import type { PostWithUtil } from '@/types/db'
import { createTestQueryClient } from '@/test/test-utils'
import { PostFeed } from './PostFeed'

const posts: PostWithUtil[] = [
  {
    id: 'p1',
    centro_id: 'c1',
    contenido: 'Primero (mas reciente)',
    foto_url: null,
    necesidades: ['Agua'],
    created_at: '2025-01-12T12:00:00.000Z',
    util_count: 0,
    user_has_util: false,
  },
  {
    id: 'p2',
    centro_id: 'c1',
    contenido: 'Segundo',
    foto_url: null,
    necesidades: [],
    created_at: '2025-01-12T10:00:00.000Z',
    util_count: 0,
    user_has_util: false,
  },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('PostFeed', () => {
  it('renders the list of posts given via props newest first', () => {
    render(<PostFeed posts={posts} isLoading />, { wrapper })
    const feed = screen.getByTestId('post-feed')
    const articles = within(feed).getAllByRole('article')
    expect(articles).toHaveLength(2)
  })

  it('shows skeleton loading when isLoading and no posts', () => {
    render(<PostFeed posts={[]} isLoading />, { wrapper })
    const feed = screen.getByTestId('post-feed')
    expect(feed.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows an empty state when there are no posts and not loading', () => {
    render(<PostFeed posts={[]} isLoading={false} />, { wrapper })
    expect(screen.getByText(/aun no hay publicaciones/i)).toBeInTheDocument()
  })

  it('renders a realtime banner when isLive is true', () => {
    render(<PostFeed posts={posts} isLoading={false} isLive />, { wrapper })
    expect(screen.getByText(/en vivo/i)).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is pressed after an error', async () => {
    const onRetry = vi.fn()
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<PostFeed posts={[]} isLoading={false} error={new Error('boom')} onRetry={onRetry} />, { wrapper })
    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
