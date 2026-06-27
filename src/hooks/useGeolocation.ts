import { useEffect, useState } from 'react'

export interface Coords {
  lat: number
  lng: number
}

export function useGeolocation(): { coords: Coords | null; loading: boolean; error: string | null } {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator?.geolocation) {
      setError('Geolocalización no disponible en este dispositivo')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'No se pudo obtener la ubicación')
        setLoading(false)
      }
    )
  }, [])

  return { coords, loading, error }
}