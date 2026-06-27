import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/storage', async (orig) => {
  const actual = await (orig as () => Promise<typeof import('@/lib/storage')>)()
  return {
    ...actual,
    comprimirImagen: vi.fn(async (f: File) => new Blob([f.name], { type: 'image/jpeg' })),
  }
})

import { FotoUploader } from './FotoUploader'

function makeImageFile(name = 'foto.jpg') {
  return new File(['data'], name, { type: 'image/jpeg' })
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('FotoUploader', () => {
  it('renders an upload prompt and no preview initially', () => {
    render(<FotoUploader value={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /subir foto/i })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a preview when a value is provided', () => {
    render(<FotoUploader value="https://example.com/foto.jpg" onChange={() => {}} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg')
  })

  it('lets the user remove the current photo, calling onChange(null)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FotoUploader value="https://example.com/foto.jpg" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /quitar foto/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('compresses, uploads to storage and reports the public URL via onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<FotoUploader value={null} onChange={onChange} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, makeImageFile('event.jpg'))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const [url] = onChange.mock.calls[0]
    expect(typeof url).toBe('string')
    expect(url).toContain('centros-fotos')
  })

  it('shows an error message when the file is not an image and does not call onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = render(<FotoUploader value={null} onChange={onChange} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['x'], 'doc.pdf', { type: 'application/pdf' }))
    await waitFor(() => expect(screen.getByText(/no es una imagen/i)).toBeInTheDocument())
    expect(onChange).not.toHaveBeenCalled()
  })
})