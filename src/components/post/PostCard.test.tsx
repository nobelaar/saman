import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { PostWithUtil } from '@/types/db'
import { PostCard } from './PostCard'

const post: PostWithUtil = {
  id: '11111111-0000-0000-0000-000000000001',
  centro_id: 'c1',
  contenido: 'Necesitamos agua y panales urgentemente.',
  foto_url: null,
  necesidades: ['Agua', 'Pañales'],
  created_at: '2025-01-12T10:00:00.000Z',
  util_count: 3,
  user_has_util: false,
}

function renderCard(props = {}) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <PostCard post={post} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('PostCard', () => {
  it('renders the post content and the formatted date', () => {
    renderCard()
    expect(screen.getByText(post.contenido)).toBeInTheDocument()
    expect(screen.getByText(/12.*ene/i)).toBeInTheDocument()
  })

  it('renders chips for each necesidad', () => {
    const { container } = renderCard()
    const article = container.querySelector('article')!
    const chipContainer = article.querySelector('.flex.flex-wrap.gap-1\\.5')
    expect(chipContainer).toBeTruthy()
    expect(chipContainer!.children.length).toBe(2)
  })

  it('renders no chips when there are no necesidades', () => {
    const { container } = renderCard({ post: { ...post, necesidades: [] } })
    const article = container.querySelector('article')!
    const chipContainer = article.querySelector('.flex.flex-wrap.gap-1\\.5')
    expect(chipContainer).toBeFalsy()
  })

  it('renders the photo when foto_url is provided', () => {
    renderCard({ post: { ...post, foto_url: 'https://cdn.example.com/p.jpg' } })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example.com/p.jpg')
  })

  it('shows centro name and link when showCentro is true', () => {
    renderCard({
      post,
      showCentro: true,
      centroNombre: 'Centro Test',
      centroCiudad: 'Caracas',
    })
    expect(screen.getByText('Centro Test')).toBeInTheDocument()
    expect(screen.getByText('@Caracas')).toBeInTheDocument()
  })
})
