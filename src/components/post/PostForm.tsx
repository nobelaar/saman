import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/input'
import { FotoUploader } from '@/components/common/FotoUploader'
import { NecesidadesSelector } from '@/components/common/NecesidadesSelector'

export interface PostFormValues {
  centro_id: string
  contenido: string
  foto_url: string | null
  necesidades: string[]
}

interface Props {
  centroId: string
  onSubmit: (values: PostFormValues) => void
  submitting?: boolean
}

export function PostForm({ centroId, onSubmit, submitting = false }: Props) {
  const [contenido, setContenido] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [necesidades, setNecesidades] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) {
      setError('Escribí algo para publicar')
      return
    }
    setError(null)
    onSubmit({
      centro_id: centroId,
      contenido: contenido.trim(),
      foto_url: foto,
      necesidades,
    })
    setContenido('')
    setFoto(null)
    setNecesidades([])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div>
        <Label htmlFor="contenido">Contenido</Label>
        <Textarea
          id="contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="¿Qué necesita el centro ahora?"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div>
        <Label>Foto (opcional)</Label>
        <FotoUploader value={foto} onChange={setFoto} storagePrefix={`posts/${centroId}`} />
      </div>
      <div>
        <Label>Necesidades</Label>
        <NecesidadesSelector value={necesidades} onChange={setNecesidades} />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Publicando…' : 'Publicar'}
      </Button>
    </form>
  )
}