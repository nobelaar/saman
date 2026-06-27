import { useState } from 'react'
import type { CentroAcopio } from '@/types/db'
import { geocodeAddress } from '@/lib/geo'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { FotoUploader } from '@/components/common/FotoUploader'

export interface CentroFormValues {
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  lat: number
  lng: number
  foto_portada: string | null
}

interface Props {
  initial?: Partial<CentroAcopio>
  onSubmit: (values: CentroFormValues) => void
  submitting?: boolean
  submitLabel?: string
}

const defaults = { lat: 0, lng: 0 } satisfies { lat: number; lng: number }

export function CentroForm({ initial, onSubmit, submitting = false, submitLabel = 'Registrar centro' }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [direccion, setDireccion] = useState(initial?.direccion ?? '')
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? '')
  const [contacto, setContacto] = useState(initial?.contacto ?? '')
  const [foto, setFoto] = useState<string | null>(initial?.foto_portada ?? null)
  const [lat, setLat] = useState<number | ''>(initial?.lat ?? '')
  const [lng, setLng] = useState<number | ''>(initial?.lng ?? '')
  const [manual, setManual] = useState(false)
  const [errors, setErrors] = useState<{ nombre?: string; direccion?: string; ciudad?: string; coords?: string }>({})
  const [geoStatus, setGeoStatus] = useState<string | null>(null)

  async function geocodeIfPossible() {
    if (manual) return
    if (!direccion.trim() || !ciudad.trim()) return
    setGeoStatus('Buscando coordenadas…')
    const res = await geocodeAddress(`${direccion}, ${ciudad}`)
    if (res) {
      setLat(Number(res.lat))
      setLng(Number(res.lon))
      setGeoStatus(null)
    } else {
      setGeoStatus('No se pudo geocodificar. Activá el ingreso manual.')
      setManual(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio'
    if (!direccion.trim()) nextErrors.direccion = 'La dirección es obligatoria'
    if (!ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria'
    if (lat === '' || lng === '' || lat === 0 || lng === 0) {
      nextErrors.coords = 'Falta latitud/longitud (geocodificá la dirección o ingresá coordenadas)'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      contacto: contacto.trim() || null,
      lat: Number(lat),
      lng: Number(lng),
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
          onBlur={geocodeIfPossible}
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
          onBlur={geocodeIfPossible}
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

      <div className="space-y-2 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          Ingresar coordenadas manualmente
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="lat">Latitud</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={lat}
              disabled={!manual}
              onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitud</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={lng}
              disabled={!manual}
              onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>
        {errors.coords && <p className="text-sm text-destructive">{errors.coords}</p>}
        {geoStatus && <p className="text-sm text-muted-foreground">{geoStatus}</p>}
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}

void defaults