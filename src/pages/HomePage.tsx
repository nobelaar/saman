import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCentros } from '@/features/centros/queries'
import { CentroGrid } from '@/components/centro/CentroGrid'
import { SearchBar } from '@/components/common/SearchBar'

export function HomePage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useCentros()

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return data ?? []
    return (data ?? []).filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Centros de acopio</h1>
          <Link
            to="/centros/nuevo"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Registrar un centro
          </Link>
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
          No se pudieron cargar los centros. Reintentá más tarde.
        </p>
      )}

      <CentroGrid centros={filtered} isLoading={isLoading} />
    </div>
  )
}
