import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Post } from '@/types/db'
import { PostCard } from './PostCard'

const post: Post = {
  id: '11111111-0000-0000-0000-000000000001',
  centro_id: 'c1',
  contenido: 'Necesitamos agua y pañales urgentemente.',
  foto_url: null,
  necesidades: ['Agua', 'Pañales'],
  created_at: '2025-01-12T10:00:00.000Z',
}

describe('PostCard', () => {
  it('renders the post content and the formatted date', () => {
    render(<PostCard post={post} />)
    expect(screen.getByText(post.contenido)).toBeInTheDocument()
    expect(screen.getByText(/12.*ene/i)).toBeInTheDocument()
  })

  it('renders chips for each necesidad', () => {
    render(<PostCard post={post} />)
    expect(screen.getByText('Agua')).toBeInTheDocument()
    expect(screen.getByText('Pañales')).toBeInTheDocument()
  })

  it('renders no chips when there are no necesidades', () => {
    render(<PostCard post={{ ...post, necesidades: [] }} />)
    expect(screen.queryByText('Agua')).not.toBeInTheDocument()
  })

  it('renders the photo when foto_url is provided', () => {
    render(<PostCard post={{ ...post, foto_url: 'https://cdn.example.com/p.jpg' }} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example.com/p.jpg')
  })

  it('renders no image when foto_url is null', () => {
    render(<PostCard post={post} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})