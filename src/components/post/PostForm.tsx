import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FotoUploader } from '@/components/common/FotoUploader'
import { NecesidadesSelector } from '@/components/common/NecesidadesSelector'
import { Image } from 'lucide-react'

export interface PostFormValues {
  centro_id?: string | null
  contenido: string
  foto_url: string | null
  necesidades: string[]
  user_id?: string | null
}

interface Props {
  centroId?: string | null
  userId?: string | null
  onSubmit: (values: PostFormValues) => void
  submitting?: boolean
}

export function PostForm({ centroId, userId, onSubmit, submitting = false }: Props) {
  const [contenido, setContenido] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [necesidades, setNecesidades] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showExtras, setShowExtras] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) {
      setError('Escribi algo para publicar')
      return
    }
    setError(null)
    onSubmit({
      centro_id: centroId ?? null,
      contenido: contenido.trim(),
      foto_url: foto,
      necesidades,
      user_id: userId ?? null,
    })
    setContenido('')
    setFoto(null)
    setNecesidades([])
    setShowExtras(false)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={3}
        placeholder="Que necesita este centro?"
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      {showExtras && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <FotoUploader
              value={foto}
              onChange={setFoto}
              storagePrefix={centroId ?? userId ?? 'user'}
            />
          </div>
          <NecesidadesSelector value={necesidades} onChange={setNecesidades} />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setShowExtras(!showExtras)}
          className="rounded-full p-2 text-primary hover:bg-primary/10"
        >
          <Image size={20} />
        </button>
        <Button
          type="submit"
          disabled={submitting || !contenido.trim()}
          size="sm"
          className="rounded-full px-5"
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  )
}
