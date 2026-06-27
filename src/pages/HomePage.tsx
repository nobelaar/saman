import { Link } from 'react-router-dom'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useCentrosCercanos } from '@/features/centros/queries'
import { CentroGrid } from '@/components/centro/CentroGrid'

export function HomePage() {
  const { coords, loading: geoLoading, error: geoError } = useGeolocation()
  const { data, isLoading, error } = useCentrosCercanos(coords)

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Centros de acopio cercanos</h1>
          <p className="text-sm text-muted-foreground">
            {coords
              ? 'Ordenados por distancia a tu ubicación.'
              : 'Ordenados por ciudad (sin geolocalización).'}
          </p>
        </div>
        <Link
          to="/centros/nuevo"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Registrar un centro
        </Link>
      </div>

      {geoLoading && <p className="text-sm text-muted-foreground">Obteniendo tu ubicación…</p>}
      {geoError && (
        <p className="rounded-md border border-amber-400/40 bg-amber-50 p-2 text-sm text-amber-700">
          No se pudo obtener tu ubicación. Mostrando todos los centros igual.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
          No se pudieron cargar los centros. Reintentá más tarde.
        </p>
      )}

      <CentroGrid centros={data ?? []} isLoading={isLoading || (geoLoading && !data)} />
    </div>
  )
}