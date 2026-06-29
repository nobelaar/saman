import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, beforeEach } from 'vitest'
import { ThemeProvider } from '@/lib/theme'
import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders moon icon when in light mode', () => {
    renderToggle()
    expect(screen.getByLabelText('Cambiar a modo oscuro')).toBeInTheDocument()
  })

  it('renders sun icon when in dark mode', () => {
    localStorage.setItem('saman-theme', 'dark')
    renderToggle()
    expect(screen.getByLabelText('Cambiar a modo claro')).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    const user = userEvent.setup()
    renderToggle()
    const button = screen.getByLabelText('Cambiar a modo oscuro')
    await user.click(button)
    expect(localStorage.getItem('saman-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByLabelText('Cambiar a modo claro')).toBeInTheDocument()
  })
})
