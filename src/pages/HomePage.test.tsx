import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { HomePage } from './HomePage'

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({ coords: null, loading: false, error: null })),
}))

import { useGeolocation } from '@/hooks/useGeolocation'

function renderHome() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('HomePage', () => {
  it('renders a loading state while geolocation resolves, then the grid of centros', async () => {
    vi.mocked(useGeolocation).mockReturnValue({
      coords: { lat: 10.5, lng: -66.9 },
      loading: false,
      error: null,
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    expect(screen.queryByText(/cargando centros/i)).not.toBeInTheDocument()
  })

  it('renders the fallback grid (ordered by ciudad) when no geolocation is available', async () => {
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      error: 'denied',
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument()
  })

  it('shows a geolocation error notice without breaking the grid', async () => {
    vi.mocked(useGeolocation).mockReturnValue({
      coords: null,
      loading: false,
      error: 'permiso denegado',
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    expect(screen.getByText(/no se pudo obtener tu ubicación|ubicación no disponible/i)).toBeInTheDocument()
  })

  it('renders a CTA linking to the new-centro page', async () => {
    vi.mocked(useGeolocation).mockReturnValue({
      coords: { lat: 10.5, lng: -66.9 },
      loading: false,
      error: null,
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /registrar un centro|nuevo centro/i })).toHaveAttribute(
      'href',
      '/centros/nuevo'
    )
  })
})