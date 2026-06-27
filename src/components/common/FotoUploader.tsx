import { useEffect, useRef, useState } from 'react'
import { comprimirImagen, subirFoto } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface Props {
  value: string | null
  onChange: (publicUrl: string | null) => void
  storagePrefix?: string
}

export function FotoUploader({ value, onChange, storagePrefix = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value && preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
  }, [value, preview])

  const handleFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('El archivo no es una imagen')
      return
    }
    setUploading(true)
    try {
      const blob = await comprimirImagen(file)
      const objectUrl = URL.createObjectURL(blob)
      setPreview(objectUrl)
      const folder = storagePrefix || crypto.randomUUID()
      const path = `${folder}/${crypto.randomUUID()}.jpg`
      const { publicUrl, error: uploadError } = await subirFoto('centros-fotos', path, blob)
      if (uploadError) {
        setError(uploadError)
        return
      }
      onChange(publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      {value || preview ? (
        <div className="space-y-2">
          <img
            src={value ?? preview ?? ''}
            alt="Foto de portada"
            className={cn('h-40 w-full rounded-md object-cover', uploading && 'opacity-60')}
          />
          {!uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-sm text-destructive underline"
            >
              Quitar foto
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full items-center justify-center rounded-md border border-dashed border-input bg-muted text-sm text-muted-foreground hover:bg-accent"
        >
          {uploading ? 'Subiendo…' : 'Subir foto'}
        </button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}