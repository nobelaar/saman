import type { NominatimResult } from '@/types/db'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const MIN_INTERVAL_MS = 1100

let lastCall = 0

async function throttle(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastCall
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed))
  }
  lastCall = Date.now()
}

export async function geocodeAddress(
  query: string,
  signal?: AbortSignal
): Promise<NominatimResult | null> {
  if (!query.trim()) return null
  await throttle()
  const url = `${NOMINATIM_BASE}/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`)
  const data = (await res.json()) as NominatimResult[]
  return data.length > 0 ? data[0] : null
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}