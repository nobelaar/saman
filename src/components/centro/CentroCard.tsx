import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { CentroResumen } from '@/types/db'
import { DEFAULT_FALLBACK_PHOTO } from '@/lib/constants'
import { truncate } from '@/lib/utils'

interface Props {
  centro: CentroResumen
}

export const CentroCard = memo(function CentroCard({ centro }: Props) {
  return (
    <Link
      to={`/centro/${centro.id}`}
      className="block overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
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
        {centro.ultimo_post_contenido && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {truncate(centro.ultimo_post_contenido, 110)}
          </p>
        )}
      </div>
    </Link>
  )
})
