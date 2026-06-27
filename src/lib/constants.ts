export const NECESIDADES_PREDEFINIDAS = [
  'Agua',
  'Ropa',
  'Medicamentos',
  'Pañales',
  'Alimentos no perecederos',
  'Higiene personal',
  'Combustible',
  'Herramientas',
  'Voluntarios',
  'Otros',
] as const

export const DEFAULT_FALLBACK_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f5f5f4"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#a8a29e" text-anchor="middle" dominant-baseline="middle">Acopio</text></svg>'
  )