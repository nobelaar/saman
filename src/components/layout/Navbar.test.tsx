import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

function renderAt(path = '/') {
  const LocationProbe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  it('has a link to the home page labelled Acopio', () => {
    renderAt('/login')
    expect(screen.getByRole('link', { name: /acopio/i })).toHaveAttribute('href', '/')
  })

  it('shows a login link when not authenticated', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /iniciar sesión|entrar|login/i })).toBeInTheDocument()
  })

  it('shows logout and the user email when authenticated', () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <Navbar user={{ id: 'u1', email: 'ana@example.com' }} onLogout={onLogout} />
      </MemoryRouter>
    )
    expect(screen.getByText(/ana@example.com/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /cerrar sesión|salir/i })
    ).toBeInTheDocument()
  })

  it('calls onLogout when the logout button is clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <Navbar user={{ id: 'u1', email: 'ana@example.com' }} onLogout={onLogout} />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /cerrar sesión|salir/i }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})