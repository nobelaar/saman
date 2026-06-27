export interface CentroAcopio {
  id: string
  coordinador_id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  lat: number
  lng: number
  foto_portada: string | null
  created_at: string
}

export interface Post {
  id: string
  centro_id: string
  contenido: string
  foto_url: string | null
  necesidades: string[]
  created_at: string
}

export interface CentroCercano {
  id: string
  nombre: string
  descripcion: string | null
  ciudad: string
  direccion: string
  foto_portada: string | null
  contacto: string | null
  distancia_km: number
  ultimo_post_contenido: string | null
  ultimo_post_created_at: string | null
}

export interface CentroConPosts extends CentroAcopio {
  posts: Pick<Post, 'contenido' | 'created_at'>[]
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  user: AuthUser
  access_token: string
}

export interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}