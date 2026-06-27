import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { NECESIDADES_PREDEFINIDAS } from '@/lib/constants'
import { NecesidadesSelector } from './NecesidadesSelector'

describe('NecesidadesSelector', () => {
  it('renders all predefined options as toggleable chips', () => {
    render(<NecesidadesSelector value={[]} onChange={() => {}} />)
    for (const n of NECESIDADES_PREDEFINIDAS) {
      expect(screen.getByRole('button', { name: new RegExp(n) })).toBeInTheDocument()
    }
  })

  it('marks selected chips as active (aria-pressed)', () => {
    render(<NecesidadesSelector value={['Agua']} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /Agua/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles a predefined necesidad on, then off', async () => {
    const user = userEvent.setup()
    const TestCase = () => {
      const [value, setValue] = useState<string[]>([])
      return (
        <>
          <NecesidadesSelector value={value} onChange={setValue} />
          <ul data-testid="selected">
            {value.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </>
      )
    }
    render(<TestCase />)
    const agua = screen.getByRole('button', { name: /Agua/ })
    await user.click(agua)
    expect(screen.getByTestId('selected')).toHaveTextContent('Agua')
    expect(agua).toHaveAttribute('aria-pressed', 'true')
    await user.click(agua)
    expect(screen.getByTestId('selected')).toBeEmptyDOMElement()
    expect(agua).toHaveAttribute('aria-pressed', 'false')
  })

  it('adds a custom necesidad via the free-text input (Enter)', async () => {
    const user = userEvent.setup()
    const TestCase = () => {
      const [value, setValue] = useState<string[]>([])
      return (
        <>
          <NecesidadesSelector value={value} onChange={setValue} />
          <div data-testid="out">{value.join(',')}</div>
        </>
      )
    }
    render(<TestCase />)
    await user.type(screen.getByPlaceholderText(/Otra necesidad/i), 'Velas{Enter}')
    expect(screen.getByTestId('out')).toHaveTextContent('Velas')
  })

  it('does not add an empty custom tag', async () => {
    const user = userEvent.setup()
    const TestCase = () => {
      const [value, setValue] = useState<string[]>([])
      return (
        <>
          <NecesidadesSelector value={value} onChange={setValue} />
          <div data-testid="out">{value.join(',')}</div>
        </>
      )
    }
    render(<TestCase />)
    await user.type(screen.getByPlaceholderText(/Otra necesidad/i), '   {Enter}')
    expect(screen.getByTestId('out')).toBeEmptyDOMElement()
  })
})