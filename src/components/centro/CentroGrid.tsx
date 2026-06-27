import type { CentroResumen } from '@/types/db'
import { CentroCard } from './CentroCard'

interface Props {
  centros: CentroResumen[]
  isLoading?: boolean
}

export function CentroGrid({ centros, isLoading }: Props) {
  if (isLoading) {
    return (
      <div data-testid="centro-grid" className="grid grid-cols-2 gap-3">
        <p className="col-span-full text-sm text-muted-foreground">Cargando centros…</p>
      </div>
    )
  }
  if (centros.length === 0) {
    return (
      <div data-testid="centro-grid" className="py-12 text-center text-muted-foreground">
        Aún no hay centros registrados.
      </div>
    )
  }
  return (
    <div
      data-testid="centro-grid"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
    >
      {centros.map((c) => (
        <CentroCard key={c.id} centro={c} />
      ))}
    </div>
  )
}
