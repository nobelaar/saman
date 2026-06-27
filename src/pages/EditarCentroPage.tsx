import { useNavigate, useParams } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { useCentro } from '@/features/centros/queries'
import { useEditarCentro } from '@/features/centros/mutations'
import { CentroForm, type CentroFormValues } from '@/components/centro/CentroForm'

interface Props {
  user: AuthUser | null
}

export function EditarCentroPage({ user }: Props) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: centro, isLoading } = useCentro(id)
  const editar = useEditarCentro()

  if (isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Cargando centro…</p>
  }
  if (!centro) {
    return <p className="py-8 text-center text-muted-foreground">No se encontró el centro.</p>
  }
  if (user?.id !== centro.coordinador_id) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No sos el coordinador de este centro y no podés editarlo.
      </p>
    )
  }

  async function handleSubmit(values: CentroFormValues) {
    await editar.mutateAsync({ id, ...values })
    navigate(`/centro/${id}`)
  }

  return (
    <div className="mx-auto max-w-md space-y-3 py-4">
      <h1 className="text-xl font-bold">Editar centro</h1>
      <CentroForm
        key={centro.id}
        initial={centro}
        onSubmit={handleSubmit}
        submitting={editar.isPending}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}