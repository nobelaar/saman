import { useState, useDeferredValue } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useCentros } from '@/features/centros/queries'
import { X } from 'lucide-react'
import { NECESIDADES_PREDEFINIDAS, NECESIDAD_META } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { data: centros = [] } = useCentros()
  const deferredQuery = useDeferredValue(query)

  if (!open) return null

  const filtered =
    deferredQuery.trim()
      ? centros.filter(
          (c) =>
            c.nombre.toLowerCase().includes(deferredQuery.toLowerCase()) ||
            c.ciudad.toLowerCase().includes(deferredQuery.toLowerCase())
        )
      : centros.slice(0, 10)

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 flex flex-col bg-black animate-in slide-in-from-bottom duration-200"
      style={{ height: '100dvh' }}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
        <button type="button" onClick={onClose} className="text-muted-foreground">
          <X size={20} />
        </button>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar centros..."
          className="h-10 flex-1 border-0 bg-transparent text-[15px] focus-visible:ring-0"
        />
      </div>

      <div className="flex-1 overflow-auto pb-4">
        {!query.trim() && (
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {NECESIDADES_PREDEFINIDAS.slice(0, 6).map((n) => {
              const meta = NECESIDAD_META[n]
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuery(n)}
                  className="rounded-full bg-secondary px-4 py-1.5 text-[13px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  {meta?.emoji} {n}
                </button>
              )
            })}
          </div>
        )}

        {filtered.map((c) => (
          <Link
            key={c.id}
            to={`/centro/${c.id}`}
            onClick={onClose}
            className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-secondary/50"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
              {c.foto_portada && (
                <img src={c.foto_portada} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium">{c.nombre}</p>
              <p className="text-[13px] text-muted-foreground">{c.ciudad}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
