import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { useCrearCentro } from '@/features/centros/mutations'
import { CentroForm, type CentroFormValues } from '@/components/centro/CentroForm'

interface Props {
  user: AuthUser | null
}

export function NuevoCentroPage({ user }: Props) {
  const navigate = useNavigate()
  const crear = useCrearCentro()

  async function handleSubmit(values: CentroFormValues) {
    const created = await crear.mutateAsync({
      coordinador_id: user?.id ?? '',
      nombre: values.nombre,
      descripcion: values.descripcion,
      direccion: values.direccion,
      ciudad: values.ciudad,
      contacto: values.contacto,
      lat: values.lat,
      lng: values.lng,
      foto_portada: values.foto_portada,
    })
    navigate(`/centro/${created.id}`)
  }

  return (
    <div className="mx-auto max-w-md space-y-3 py-4">
      <h1 className="text-xl font-bold">Registrar centro de acopio</h1>
      <p className="text-sm text-muted-foreground">
        Tu dirección se geocodifica automáticamente. Si falla, podés ingresar las coordenadas manualmente.
      </p>
      <CentroForm
        initial={{}}
        onSubmit={handleSubmit}
        submitting={crear.isPending}
        submitLabel="Registrar centro"
      />
    </div>
  )
}