import { useState } from 'react'
import type { CentroAcopio } from '@/types/db'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { FotoUploader } from '@/components/common/FotoUploader'

export interface CentroFormValues {
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
}

interface Props {
  initial?: Partial<CentroAcopio>
  onSubmit: (values: CentroFormValues) => void
  submitting?: boolean
  submitLabel?: string
}

export function CentroForm({ initial, onSubmit, submitting = false, submitLabel = 'Registrar centro' }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [direccion, setDireccion] = useState(initial?.direccion ?? '')
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? '')
  const [contacto, setContacto] = useState(initial?.contacto ?? '')
  const [foto, setFoto] = useState<string | null>(initial?.foto_portada ?? null)
  const [errors, setErrors] = useState<{ nombre?: string; direccion?: string; ciudad?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio'
    if (!direccion.trim()) nextErrors.direccion = 'La dirección es obligatoria'
    if (!ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      contacto: contacto.trim() || null,
      foto_portada: foto,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          aria-invalid={!!errors.nombre}
        />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          aria-invalid={!!errors.direccion}
        />
        {errors.direccion && <p className="text-sm text-destructive">{errors.direccion}</p>}
      </div>

      <div>
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input
          id="ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          aria-invalid={!!errors.ciudad}
        />
        {errors.ciudad && <p className="text-sm text-destructive">{errors.ciudad}</p>}
      </div>

      <div>
        <Label htmlFor="contacto">Contacto (opcional)</Label>
        <Input
          id="contacto"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
        />
      </div>

      <div>
        <Label>Foto de portada</Label>
        <FotoUploader
          value={foto}
          onChange={setFoto}
          storagePrefix={initial?.id}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
