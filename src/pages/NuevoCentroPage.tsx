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
      foto_portada: values.foto_portada,
    })
    navigate(`/centro/${created.id}`)
  }

  return (
    <div className="mx-auto max-w-[400px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Registrar centro de acopio</h1>
        <p className="text-[15px] text-muted-foreground">
          Registra la direccion y el contacto del centro.
        </p>
      </div>
      <CentroForm
        initial={{}}
        onSubmit={handleSubmit}
        submitting={crear.isPending}
        submitLabel="Registrar centro"
      />
    </div>
  )
}
