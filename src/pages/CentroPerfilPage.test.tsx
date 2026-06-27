import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro, fixtureUser, fixturePost2 } from '@/test/mocks'
import { supabase } from '@/lib/supabase'
import { CentroPerfilPage } from './CentroPerfilPage'

vi.mock('@/features/posts/realtime', () => ({
  useRealtimePosts: vi.fn(() => {}),
}))
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: vi.fn(() => ({ coords: null, loading: false, error: null })),
}))

function renderPage(id = fixtureCentro.id) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/centro/${id}`]}>
        <Routes>
          <Route path="/centro/:id" element={<CentroPerfilPage user={null} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('CentroPerfilPage', () => {
  it('renders the centro name, ciudad, direccion and a Cómo llegar link to Google Maps', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    const comoLlegar = screen.getByRole('link', { name: /cómo llegar/i })
    expect(comoLlegar).toHaveAttribute('href', expect.stringContaining('google.com/maps/dir'))
    expect(comoLlegar).toHaveAttribute('target', '_blank')
    expect(comoLlegar).toHaveAttribute(
      'href',
      `https://www.google.com/maps/dir/?api=1&destination=${fixtureCentro.lat},${fixtureCentro.lng}`
    )
  })

  it('shows the feed with posts newest first', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(fixturePost2.contenido)).toBeInTheDocument())
  })

  it('hides the PostForm when the viewer is not the coordinador', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument())
    expect(screen.queryByLabelText(/contenido/i)).not.toBeInTheDocument()
  })

  it('shows a not-found message when the centro does not exist', async () => {
    renderPage('ffffffff-ffff-ffff-ffff-ffffffffffff')
    await waitFor(() =>
      expect(screen.getByText(/no se encontró|no existe|centro no encontrado/i)).toBeInTheDocument()
    )
  })

  it('shows the Editar link (only for the coordinador) pointing to the edit page', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[`/centro/${fixtureCentro.id}`]}>
          <Routes>
            <Route
              path="/centro/:id"
              element={<CentroPerfilPage user={{ id: fixtureCentro.coordinador_id, email: 'ana@x.com' }} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /editar/i })).toHaveAttribute(
        'href',
        `/centro/${fixtureCentro.id}/editar`
      )
    )
  })
})

void fixtureUser