import { Link } from 'react-router-dom'
import type { CentroCercano } from '@/types/db'
import { DEFAULT_FALLBACK_PHOTO } from '@/lib/constants'
import { formatDistance, truncate } from '@/lib/utils'

interface Props {
  centro: CentroCercano
}

export function CentroCard({ centro }: Props) {
  return (
    <Link
      to={`/centro/${centro.id}`}
      className="block overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img
          src={centro.foto_portada ?? DEFAULT_FALLBACK_PHOTO}
          alt={centro.nombre}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 font-semibold">{centro.nombre}</h3>
        <p className="text-sm text-muted-foreground">{centro.ciudad}</p>
        <p className="text-sm font-medium">
          {centro.distancia_km > 0 ? formatDistance(centro.distancia_km) : '—'}
        </p>
        {centro.ultimo_post_contenido && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {truncate(centro.ultimo_post_contenido, 110)}
          </p>
        )}
      </div>
    </Link>
  )
}