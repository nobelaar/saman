import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CentroResumen } from '@/types/db'
import { DEFAULT_FALLBACK_PHOTO } from '@/lib/constants'
import { CentroCard } from './CentroCard'

const centro: CentroResumen = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Centro La Candelaria',
  descripcion: 'Iglesia habilitada',
  ciudad: 'Caracas',
  direccion: 'Av. Urdaneta',
  foto_portada: null,
  contacto: null,
  ultimo_post_contenido: 'Necesitamos agua y pañales para esta noche',
  ultimo_post_created_at: '2025-01-12T12:00:00.000Z',
}

function renderCard(overrides: Partial<CentroResumen> = {}) {
  return render(
    <MemoryRouter>
      <CentroCard centro={{ ...centro, ...overrides }} />
    </MemoryRouter>
  )
}

describe('CentroCard', () => {
  it('renders the name, ciudad and a link to the centro detail', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Centro La Candelaria')
    expect(link).toHaveAttribute('href', '/centro/00000000-0000-0000-0000-000000000001')
  })

  it('renders the truncated preview of the last post', () => {
    renderCard({
      ultimo_post_contenido:
        'Necesitamos agua embotellada, pañales talla 3 y 4, medicamentos básicos y alimentos no perecederos para esta noche por favor',
    })
    const preview = screen.getByText(/Necesitamos agua embotellada/i)
    expect(preview.textContent).toMatch(/…$/)
  })

  it('renders no preview text when there is no last post', () => {
    renderCard({ ultimo_post_contenido: null })
    expect(screen.queryByText(/Necesitamos/)).not.toBeInTheDocument()
  })

  it('uses the cover photo when provided', () => {
    renderCard({ foto_portada: 'https://cdn.example.com/p.jpg' })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example.com/p.jpg')
  })

  it('renders a placeholder image when no cover photo', () => {
    renderCard()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', DEFAULT_FALLBACK_PHOTO)
  })
})
