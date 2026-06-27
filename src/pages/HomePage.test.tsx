import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { HomePage } from './HomePage'

beforeEach(async () => {
  await supabase.auth.signOut()
})

function renderHome() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HomePage', () => {
  it('renders the grid of centros ordered by ciudad', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
  })

  it('shows the search bar', () => {
    renderHome()
    expect(screen.getByPlaceholderText(/buscar por nombre o ciudad/i)).toBeInTheDocument()
  })

  it('filters centros when user types in the search bar', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o ciudad/i)
    await user.type(searchInput, 'xyz_nonexistent_xyz')
    await waitFor(() => {
      expect(screen.queryByText(fixtureCentro.nombre)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/aún no hay centros/i)).toBeInTheDocument()
  })

  it('has a link to register a new centro', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /registrar un centro/i })
    expect(link).toHaveAttribute('href', '/centros/nuevo')
  })
})
