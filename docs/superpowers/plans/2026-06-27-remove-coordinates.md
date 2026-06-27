# Remove Coordinates & Add Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all geocoding, coordinates, and geolocation logic. Add a client-side search bar for filtering centers by name/city.

**Architecture:** Single query (`useCentros`) fetches all centers ordered by city. Search bar filters client-side with debounce. All PostGIS/lat/lng columns dropped from DB. Types, mutations, and UI simplified accordingly.

**Tech Stack:** React, TypeScript, Supabase, TanStack Query, Vitest, React Router, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-06-27-remove-coordinates-design.md`

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/00002_remove_coords.sql` |
| Delete | `src/lib/geo.ts` |
| Delete | `src/hooks/useGeolocation.ts` |
| Delete | `src/hooks/useGeolocation.test.ts` |
| Modify | `src/types/db.ts` |
| Modify | `src/lib/utils.ts` |
| Modify | `src/features/centros/queries.ts` |
| Modify | `src/features/centros/mutations.ts` |
| Modify | `src/components/centro/CentroForm.tsx` |
| Modify | `src/components/centro/CentroCard.tsx` |
| Modify | `src/components/centro/CentroGrid.tsx` |
| Create | `src/components/common/SearchBar.tsx` |
| Modify | `src/pages/HomePage.tsx` |
| Modify | `src/pages/CentroPerfilPage.tsx` |
| Modify | `src/pages/NuevoCentroPage.tsx` |
| Modify | `src/test/mocks/fixtures.ts` |
| Modify | `src/test/mocks/handlers.ts` |
| Modify | `src/components/centro/CentroForm.test.tsx` |
| Modify | `src/components/centro/CentroCard.test.tsx` |
| Modify | `src/components/centro/CentroGrid.test.tsx` |
| Modify | `src/pages/HomePage.test.tsx` |
| Modify | `src/pages/CentroPerfilPage.test.tsx` |
| Modify | `src/pages/NuevoCentroPage.test.tsx` |
| Modify | `src/pages/EditarCentroPage.test.tsx` |
| Modify | `src/features/centros/queries.test.tsx` |
| Modify | `src/features/centros/mutations.test.tsx` |

---

### Task 1: DB migration

**Files:**
- Create: `supabase/migrations/00002_remove_coords.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 00002_remove_coords.sql
-- Elimina columnas de coordenadas y la función RPC de distancia
-- Aplicar con: supabase db push

drop function if exists public.centros_cercanos;

drop index if exists idx_centros_geom;

alter table public.centros_acopio
  drop column if exists geom,
  drop column if exists lat,
  drop column if exists lng;
```

- [ ] **Step 2: Verify migration runs**

Run: `supabase db push`
Expected: no errors

- [ ] **Step 3: Verify columns are gone**

Run: `supabase db dump --local --data-only 2>/dev/null | grep -i 'lat\|lng\|geom' | head -5`
Expected: no output (no lat/lng/geom references in schema)

---

### Task 2: Delete geo files + update types + update utils

**Files:**
- Delete: `src/lib/geo.ts`
- Delete: `src/hooks/useGeolocation.ts`
- Delete: `src/hooks/useGeolocation.test.ts`
- Modify: `src/types/db.ts`
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Delete the three files**

```bash
rm src/lib/geo.ts src/hooks/useGeolocation.ts src/hooks/useGeolocation.test.ts
```

- [ ] **Step 2: Verify no imports of deleted files remain**

Run: `rg "from '@/lib/geo'" src/ --no-heading`
Expected: only matches in `src/components/centro/CentroForm.tsx`, `src/pages/CentroPerfilPage.tsx`, `src/pages/NuevoCentroPage.tsx`, `src/pages/EditarCentroPage.tsx` (these get fixed in later tasks; no test files should import them after we fix tests)

Run: `rg "from '@/hooks/useGeolocation'" src/ --no-heading`
Expected: matches only in `src/pages/HomePage.tsx`, `src/pages/HomePage.test.tsx`, `src/pages/CentroPerfilPage.test.tsx` (fixed in later tasks)

- [ ] **Step 3: Update `src/types/db.ts`**

Replace the entire file:

```ts
export interface CentroAcopio {
  id: string
  coordinador_id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
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

export interface CentroResumen {
  id: string
  nombre: string
  descripcion: string | null
  ciudad: string
  direccion: string
  foto_portada: string | null
  contacto: string | null
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
```

- [ ] **Step 4: Update `src/lib/utils.ts` — remove `formatDistance`**

Replace the entire file:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(text: string, max = 90): string {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}
```

- [ ] **Step 5: Verify TypeScript compiles (will have errors in files not yet fixed — that's expected)**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: errors only in files we'll fix in subsequent tasks (CentroForm, CentroCard, CentroGrid, queries, mutations, pages)

---

### Task 3: Update test mocks (fixtures + handlers)

**Files:**
- Modify: `src/test/mocks/fixtures.ts`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Update `src/test/mocks/fixtures.ts`**

Replace the entire file:

```ts
import type { CentroAcopio, Post, CentroResumen } from '@/types/db'

export const fixtureCentro: CentroAcopio = {
  id: '00000000-0000-0000-0000-000000000001',
  coordinador_id: '00000000-0000-0000-0000-0000000000aa',
  nombre: 'Centro La Candelaria',
  descripcion: 'Iglesia habilitada como centro de acopio.',
  direccion: 'Av. Urdaneta, Caracas',
  ciudad: 'Caracas',
  contacto: '@centrolacandelaria',
  foto_portada: null,
  created_at: '2025-01-10T12:00:00.000Z',
}

export const fixtureCentro2: CentroAcopio = {
  id: '00000000-0000-0000-0000-000000000002',
  coordinador_id: '00000000-0000-0000-0000-0000000000bb',
  nombre: 'Centro Valencia Norte',
  descripcion: 'Grupo scout.',
  direccion: 'Av. Bolívar, Valencia',
  ciudad: 'Valencia',
  contacto: '0414-0000000',
  foto_portada: 'https://acopio-test.supabase.co/storage/v1/object/public/centros-fotos/test.jpg',
  created_at: '2025-01-11T09:00:00.000Z',
}

export const fixturePost: Post = {
  id: '11111111-0000-0000-0000-000000000001',
  centro_id: fixtureCentro.id,
  contenido: 'Urgente: necesitamos agua y pañales.',
  foto_url: null,
  necesidades: ['Agua', 'Pañales'],
  created_at: '2025-01-12T10:00:00.000Z',
}

export const fixturePost2: Post = {
  id: '11111111-0000-0000-0000-000000000002',
  centro_id: fixtureCentro.id,
  contenido: 'Cubrimos agua, gracias. Ahora necesitamos combustible.',
  foto_url: null,
  necesidades: ['Combustible'],
  created_at: '2025-01-12T12:00:00.000Z',
}

export const fixtureCentroResumen: CentroResumen = {
  id: fixtureCentro.id,
  nombre: fixtureCentro.nombre,
  descripcion: fixtureCentro.descripcion,
  ciudad: fixtureCentro.ciudad,
  direccion: fixtureCentro.direccion,
  foto_portada: fixtureCentro.foto_portada,
  contacto: fixtureCentro.contacto,
  ultimo_post_contenido: fixturePost2.contenido,
  ultimo_post_created_at: fixturePost2.created_at,
}

export const fixtureUser = {
  id: '00000000-0000-0000-0000-0000000000aa',
  email: 'coordinador@example.com',
}

export const fixtureSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: fixtureUser,
}
```

- [ ] **Step 2: Update `src/test/mocks/handlers.ts`**

Replace the entire file:

```ts
import { http, HttpResponse } from 'msw'
import type { CentroAcopio, Post } from '@/types/db'
import {
  fixtureCentro,
  fixtureCentro2,
  fixturePost,
  fixturePost2,
  fixtureSession,
} from './fixtures'

const BASE = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://acopio-test.supabase.co'

interface Store {
  centros: CentroAcopio[]
  posts: Post[]
}

let store: Store = makeStore()
let requireEmailConfirm = false

export function resetStore(): void {
  store = makeStore()
  requireEmailConfirm = false
}

export function setRequireEmailConfirm(value: boolean): void {
  requireEmailConfirm = value
}

function makeStore(): Store {
  return {
    centros: [structuredClone(fixtureCentro), structuredClone(fixtureCentro2)],
    posts: [structuredClone(fixturePost), structuredClone(fixturePost2)],
  }
}

function parseQuery(url: URL) {
  const filters: Record<string, string> = {}
  const orderRaw = url.searchParams.get('order')
  const select = url.searchParams.get('select') ?? '*'
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue
    const m = value.match(/^eq\.(.*)$/)
    if (m) filters[key] = m[1]
  }
  let order: { column: string; ascending: boolean } | null = null
  if (orderRaw) {
    const [column, dir] = orderRaw.split('.')
    order = { column, ascending: dir !== 'desc' }
  }
  return { filters, order, select }
}

function applyFilters(rows: Record<string, unknown>[], filters: Record<string, string>) {
  return rows.filter((r) => Object.entries(filters).every(([k, v]) => String(r[k]) === v))
}

function applyOrder<T>(rows: T[], orderRaw: ReturnType<typeof parseQuery>['order'], col: (r: T) => string) {
  if (!orderRaw) return rows
  const sorted = [...rows].sort((a, b) => col(a).localeCompare(col(b)))
  return orderRaw.ascending ? sorted : sorted.reverse()
}

function isObjectAccept(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('vnd.pgrst.object')
}

function responseObjectOrError(
  rows: Record<string, unknown>[],
  request: Request
): Response {
  if (!isObjectAccept(request)) return HttpResponse.json(rows)
  if (rows.length === 1) return HttpResponse.json(rows[0])
  return HttpResponse.json(
    {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: `Results contain ${rows.length} rows, application/vnd.pgrst.object+json requires 1 row`,
      hint: null,
    },
    { status: 406, statusText: 'Not Acceptable' }
  )
}

const restHandlers = [
  http.get(`${BASE}/rest/v1/centros_acopio`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order, select } = parseQuery(url)
    let rows = applyFilters(store.centros as unknown as Record<string, unknown>[], filters) as unknown as CentroAcopio[]
    if (order) rows = applyOrder(rows as CentroAcopio[], order, (r) => String(r[order!.column as keyof CentroAcopio])) as CentroAcopio[]
    const wantsPosts = /posts\s*\(/.test(select)
    const out = rows.map((c) => {
      const base: Record<string, unknown> = { ...c }
      if (wantsPosts) {
        const posts = store.posts
          .filter((p) => p.centro_id === c.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((p) => ({ contenido: p.contenido, created_at: p.created_at }))
        base.posts = posts
      }
      return base
    })
    return responseObjectOrError(out as unknown as Record<string, unknown>[], request)
  }),

  http.post(`${BASE}/rest/v1/centros_acopio`, async ({ request }) => {
    const body = (await request.json()) as Partial<CentroAcopio> | Partial<CentroAcopio>[]
    const payload = Array.isArray(body) ? body[0] : body
    const created: CentroAcopio = {
      id: crypto.randomUUID(),
      coordinador_id: payload.coordinador_id ?? '00000000-0000-0000-0000-0000000000aa',
      nombre: payload.nombre ?? '',
      descripcion: payload.descripcion ?? null,
      direccion: payload.direccion ?? '',
      ciudad: payload.ciudad ?? '',
      contacto: payload.contacto ?? null,
      foto_portada: payload.foto_portada ?? null,
      created_at: new Date().toISOString(),
    }
    store.centros.push(created)
    return HttpResponse.json(isObjectAccept(request) ? created : [created])
  }),

  http.patch(`${BASE}/rest/v1/centros_acopio`, async ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    const body = (await request.json()) as Partial<CentroAcopio>
    const idx = store.centros.findIndex((c) => String(c.id) === filters.id)
    if (idx >= 0) store.centros[idx] = { ...store.centros[idx], ...body }
    const updated = idx >= 0 ? store.centros[idx] : { ...body, id: filters.id } as CentroAcopio
    return responseObjectOrError([updated] as unknown as Record<string, unknown>[], request)
  }),

  http.get(`${BASE}/rest/v1/posts`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order } = parseQuery(url)
    let rows = applyFilters(store.posts as unknown as Record<string, unknown>[], filters) as unknown as Post[]
    if (order) rows = applyOrder(rows, order, (r) => String(r[order!.column as keyof Post])) as Post[]
    return responseObjectOrError(rows as unknown as Record<string, unknown>[], request)
  }),

  http.post(`${BASE}/rest/v1/posts`, async ({ request }) => {
    const body = (await request.json()) as Partial<Post> | Partial<Post>[]
    const payload = Array.isArray(body) ? body[0] : body
    const created: Post = {
      id: crypto.randomUUID(),
      centro_id: payload.centro_id ?? '',
      contenido: payload.contenido ?? '',
      foto_url: payload.foto_url ?? null,
      necesidades: payload.necesidades ?? [],
      created_at: new Date().toISOString(),
    }
    store.posts.push(created)
    return HttpResponse.json(isObjectAccept(request) ? created : [created])
  }),
]

const authHandlers = [
  http.post(`${BASE}/auth/v1/token`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'invalid_credentials', error_description: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }
    if (requireEmailConfirm) {
      return HttpResponse.json(
        {
          code: 'email_not_confirmed',
          message: 'Email not confirmed',
          error_description: 'Email not confirmed',
        },
        { status: 400 }
      )
    }
    return HttpResponse.json({ ...fixtureSession, user: { ...fixtureSession.user, email: body.email } })
  }),
  http.post(`${BASE}/auth/v1/signup`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'weak_password', error_description: 'Credenciales inválidas' },
        { status: 400 }
      )
    }
    if (requireEmailConfirm) {
      return HttpResponse.json({
        user: { ...fixtureSession.user, email: body.email },
        session: null,
      })
    }
    return HttpResponse.json({
      ...fixtureSession,
      refresh_token: 'signup-refresh',
      user: { ...fixtureSession.user, email: body.email },
    })
  }),
  http.post(`${BASE}/auth/v1/resend`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string
      type?: string
    }
    if (!body.email || (body.type && body.type !== 'signup')) {
      return HttpResponse.json(
        { code: 'invalid_request', error_description: 'Email requerido' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ message: 'Confirmation email resent' })
  }),
]

const storageHandlers = [
  http.post(`${BASE}/storage/v1/object/centros-fotos/*`, () =>
    HttpResponse.json({
      path: `centros-fotos/${crypto.randomUUID()}.jpg`,
      fullPath: `centros-fotos/${crypto.randomUUID()}.jpg`,
      id: crypto.randomUUID(),
    })
  ),
  http.put(`${BASE}/storage/v1/object/centros-fotos/*`, () =>
    HttpResponse.json({ Key: 'placeholder', Id: crypto.randomUUID() })
  ),
]

export const handlers = [...restHandlers, ...authHandlers, ...storageHandlers]
```

---

### Task 4: Feature layer (queries + mutations)

**Files:**
- Modify: `src/features/centros/queries.ts`
- Modify: `src/features/centros/mutations.ts`

- [ ] **Step 1: Rewrite `src/features/centros/queries.ts`**

Replace the entire file:

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CentroAcopio, CentroResumen } from '@/types/db'

export function useCentros() {
  return useQuery<CentroResumen[]>({
    queryKey: ['centros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .select(
          'id, nombre, descripcion, direccion, ciudad, contacto, foto_portada, created_at, posts ( contenido, created_at )'
        )
        .order('ciudad', { ascending: true })
      if (error) throw error
      return ((data ?? []) as CentroWithPostsRow[]).map(toCentroResumen)
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

interface CentroWithPostsRow {
  id: string
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
  posts: { contenido: string; created_at: string }[]
}

function toCentroResumen(row: CentroWithPostsRow): CentroResumen {
  const ultimo = row.posts?.[0]
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    ciudad: row.ciudad,
    direccion: row.direccion,
    foto_portada: row.foto_portada,
    contacto: row.contacto,
    ultimo_post_contenido: ultimo?.contenido ?? null,
    ultimo_post_created_at: ultimo?.created_at ?? null,
  }
}

export function useCentro(id: string) {
  return useQuery<CentroAcopio>({
    queryKey: ['centro', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    enabled: !!id,
  })
}
```

- [ ] **Step 2: Update `src/features/centros/mutations.ts`**

Replace the entire file:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CentroAcopio } from '@/types/db'

export interface CrearCentroInput {
  coordinador_id: string
  nombre: string
  descripcion?: string | null
  direccion: string
  ciudad: string
  contacto?: string | null
  foto_portada?: string | null
}

export interface EditarCentroInput {
  id: string
  nombre?: string
  descripcion?: string | null
  direccion?: string
  ciudad?: string
  contacto?: string | null
  foto_portada?: string | null
}

export function useCrearCentro() {
  const qc = useQueryClient()
  return useMutation<CentroAcopio, Error, CrearCentroInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('centros_acopio')
        .insert({
          coordinador_id: input.coordinador_id,
          nombre: input.nombre,
          descripcion: input.descripcion ?? null,
          direccion: input.direccion,
          ciudad: input.ciudad,
          contacto: input.contacto ?? null,
          foto_portada: input.foto_portada ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centros'] })
    },
  })
}

export function useEditarCentro() {
  const qc = useQueryClient()
  return useMutation<CentroAcopio, Error, EditarCentroInput>({
    mutationFn: async (input) => {
      const { id, ...patch } = input
      const { data, error } = await supabase
        .from('centros_acopio')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CentroAcopio
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['centros'] })
      qc.invalidateQueries({ queryKey: ['centro', variables.id] })
    },
  })
}
```

---

### Task 5: CentroForm (remove coordinate UI)

**Files:**
- Modify: `src/components/centro/CentroForm.tsx`

- [ ] **Step 1: Rewrite `src/components/centro/CentroForm.tsx`**

Replace the entire file:

```tsx
import { useState } from 'react'
import type { CentroAcopio } from '@/types/db'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { FotoUploader } from '@/components/common/FotoUploader'

export interface CentroFormValues {
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
}

interface Props {
  initial?: Partial<CentroAcopio>
  onSubmit: (values: CentroFormValues) => void
  submitting?: boolean
  submitLabel?: string
}

export function CentroForm({ initial, onSubmit, submitting = false, submitLabel = 'Registrar centro' }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [direccion, setDireccion] = useState(initial?.direccion ?? '')
  const [ciudad, setCiudad] = useState(initial?.ciudad ?? '')
  const [contacto, setContacto] = useState(initial?.contacto ?? '')
  const [foto, setFoto] = useState<string | null>(initial?.foto_portada ?? null)
  const [errors, setErrors] = useState<{ nombre?: string; direccion?: string; ciudad?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio'
    if (!direccion.trim()) nextErrors.direccion = 'La dirección es obligatoria'
    if (!ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      contacto: contacto.trim() || null,
      foto_portada: foto,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          aria-invalid={!!errors.nombre}
        />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          aria-invalid={!!errors.direccion}
        />
        {errors.direccion && <p className="text-sm text-destructive">{errors.direccion}</p>}
      </div>

      <div>
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input
          id="ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          aria-invalid={!!errors.ciudad}
        />
        {errors.ciudad && <p className="text-sm text-destructive">{errors.ciudad}</p>}
      </div>

      <div>
        <Label htmlFor="contacto">Contacto (opcional)</Label>
        <Input
          id="contacto"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
        />
      </div>

      <div>
        <Label>Foto de portada</Label>
        <FotoUploader
          value={foto}
          onChange={setFoto}
          storagePrefix={initial?.id}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Verify CentroForm compiles**

Run: `npx tsc --noEmit src/components/centro/CentroForm.tsx 2>&1`
Expected: no errors

---

### Task 6: CentroCard, CentroGrid, and new SearchBar

**Files:**
- Modify: `src/components/centro/CentroCard.tsx`
- Modify: `src/components/centro/CentroGrid.tsx`
- Create: `src/components/common/SearchBar.tsx`

- [ ] **Step 1: Update `src/components/centro/CentroCard.tsx`**

Replace the entire file:

```tsx
import { Link } from 'react-router-dom'
import type { CentroResumen } from '@/types/db'
import { DEFAULT_FALLBACK_PHOTO } from '@/lib/constants'
import { truncate } from '@/lib/utils'

interface Props {
  centro: CentroResumen
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
        {centro.ultimo_post_contenido && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {truncate(centro.ultimo_post_contenido, 110)}
          </p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Update `src/components/centro/CentroGrid.tsx`**

Replace the entire file:

```tsx
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
```

- [ ] **Step 3: Create `src/components/common/SearchBar.tsx`**

Write the new file:

```tsx
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar por nombre o ciudad…' }: Props) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative w-full">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <Input
        className="pl-9"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={placeholder}
      />
    </div>
  )
}
```

---

### Task 7: Update pages

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/CentroPerfilPage.tsx`
- Modify: `src/pages/NuevoCentroPage.tsx`

- [ ] **Step 1: Rewrite `src/pages/HomePage.tsx`**

Replace the entire file:

```tsx
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
```

- [ ] **Step 2: Update `src/pages/CentroPerfilPage.tsx`**

Replace the entire file:

```tsx
import { Link, useParams } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { useCentro } from '@/features/centros/queries'
import { usePostsCentro } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useRealtimePosts } from '@/features/posts/realtime'
import { PostFeed } from '@/components/post/PostFeed'
import { PostForm } from '@/components/post/PostForm'

interface Props {
  user: AuthUser | null
}

export function CentroPerfilPage({ user }: Props) {
  const { id = '' } = useParams()
  const { data: centro, isLoading, error } = useCentro(id)
  const { data: posts = [], isLoading: postsLoading, error: postsError, refetch } = usePostsCentro(id)
  const isLive = useRealtimeSafe(id)
  void isLive
  const crearPost = useCrearPost()
  const esCoordinador = !!(user && centro && user.id === centro.coordinador_id)

  if (!id) return null

  if (isLoading) {
    return <p className="py-8 text-sm text-muted-foreground">Cargando centro…</p>
  }
  if (error || !centro) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No se encontró el centro solicitado.
      </p>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{centro.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {centro.ciudad} · {centro.direccion}
            </p>
            {centro.contacto && (
              <a
                href={`https://wa.me/${centro.contacto.replace(/[^0-9]/g, '')}`}
                className="text-sm text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {centro.contacto}
              </a>
            )}
          </div>
          {esCoordinador && (
            <Link
              to={`/centro/${centro.id}/editar`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent"
            >
              Editar
            </Link>
          )}
        </div>
        {centro.descripcion && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{centro.descripcion}</p>
        )}
      </section>

      {esCoordinador && (
        <PostForm
          centroId={centro.id}
          submitting={crearPost.isPending}
          onSubmit={(values) =>
            crearPost.mutate(values, {
              onSuccess: () => refetch(),
            })
          }
        />
      )}

      <PostFeed
        posts={posts}
        isLoading={postsLoading}
        isLive
        error={postsError}
        onRetry={() => refetch()}
      />
    </div>
  )
}

function useRealtimeSafe(centroId: string): boolean {
  useRealtimePosts(centroId)
  return true
}
```

- [ ] **Step 3: Update `src/pages/NuevoCentroPage.tsx`**

Replace the entire file:

```tsx
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '@/types/db'
import { useCrearCentro } from '@/features/centros/mutations'
import { CentroForm, type CentroFormValues } from '@/components/centro/CentroForm'

interface Props {
  user: AuthUser | null
}

export function NuevoCentroPage({ user }: Props) {
  const navigate = useNavigate()
  const crear = useCrearCentro()

  async function handleSubmit(values: CentroFormValues) {
    const created = await crear.mutateAsync({
      coordinador_id: user?.id ?? '',
      nombre: values.nombre,
      descripcion: values.descripcion,
      direccion: values.direccion,
      ciudad: values.ciudad,
      contacto: values.contacto,
      foto_portada: values.foto_portada,
    })
    navigate(`/centro/${created.id}`)
  }

  return (
    <div className="mx-auto max-w-md space-y-3 py-4">
      <h1 className="text-xl font-bold">Registrar centro de acopio</h1>
      <p className="text-sm text-muted-foreground">
        Registrá la dirección y el contacto del centro.
      </p>
      <CentroForm
        initial={{}}
        onSubmit={handleSubmit}
        submitting={crear.isPending}
        submitLabel="Registrar centro"
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify `EditarCentroPage.tsx` needs no changes**

Run: `npx tsc --noEmit src/pages/EditarCentroPage.tsx 2>&1`
Expected: no errors (it passes `...values` from `CentroFormValues` which now has no lat/lng)

---

### Task 8: Update all test files

**Files:**
- Modify: `src/components/centro/CentroForm.test.tsx`
- Modify: `src/components/centro/CentroCard.test.tsx`
- Modify: `src/components/centro/CentroGrid.test.tsx`
- Modify: `src/pages/HomePage.test.tsx`
- Modify: `src/pages/CentroPerfilPage.test.tsx`
- Modify: `src/pages/NuevoCentroPage.test.tsx`
- Modify: `src/pages/EditarCentroPage.test.tsx`
- Modify: `src/features/centros/queries.test.tsx`
- Modify: `src/features/centros/mutations.test.tsx`

- [ ] **Step 1: Rewrite `src/components/centro/CentroForm.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CentroAcopio } from '@/types/db'
import { CentroForm, CentroFormValues } from './CentroForm'

const emptyInitial: Partial<CentroAcopio> = {}
const existingInitial: Partial<CentroAcopio> = {
  nombre: 'Centro Existente',
  descripcion: 'desc',
  direccion: 'Av. Urdaneta',
  ciudad: 'Caracas',
  contacto: '@centro',
  foto_portada: 'https://cdn.example.com/p.jpg',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CentroForm', () => {
  it('renders all the fields empty in creation mode', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={vi.fn()} submitting={false} />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('')
    expect(screen.getByLabelText(/dirección/i)).toHaveValue('')
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('')
  })

  it('preloads values when an existing centro is provided', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={existingInitial} onSubmit={vi.fn()} submitting={false} />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Centro Existente')
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Caracas')
    expect(screen.getByLabelText(/contacto/i)).toHaveValue('@centro')
  })

  it('rejects submit when required fields are missing', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() =>
      expect(screen.getByText(/el nombre es obligatorio|nombre es obligatorio/i)).toBeInTheDocument()
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits with valid fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MemoryRouter>
        <CentroForm initial={emptyInitial} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/nombre/i), 'Mi Centro')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(values.nombre).toBe('Mi Centro')
    expect(values.ciudad).toBe('Caracas')
    expect(values.direccion).toBe('Av. Urdaneta')
  })

  it('disables the submit button while submitting', () => {
    render(
      <MemoryRouter>
        <CentroForm initial={existingInitial} onSubmit={vi.fn()} submitting />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /guardando|publicando|enviando|subiendo/i })).toBeDisabled()
  })

  it('stores the foto URL returned by FotoUploader into the submitted values', async () => {
    vi.mock('@/lib/storage', async (orig) => {
      const actual = await (orig as () => Promise<typeof import('@/lib/storage')>)()
      return {
        ...actual,
        comprimirImagen: vi.fn(async (f: File) => new Blob([f.name], { type: 'image/jpeg' })),
      }
    })
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <CentroForm initial={{ ...existingInitial, foto_portada: null }} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['data'], 'event.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(screen.getByRole('img', { name: /foto de portada/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /guardar|publicar|registrar|enviar/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values: CentroFormValues = onSubmit.mock.calls[0][0]
    expect(typeof values.foto_portada).toBe('string')
    expect(values.foto_portada).toContain('centros-fotos')
  })
})
```

- [ ] **Step 2: Rewrite `src/components/centro/CentroCard.test.tsx`**

Replace the entire file:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CentroResumen } from '@/types/db'
import { DEFAULT_FALLBACK_PHOTO } from '@/lib/constants'
import { CentroCard } from './CentroCard'

const centro: CentroResumen = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Centro La Candelaria',
  descripcion: 'Iglesia habilitada',
  ciudad: 'Caracas',
  direccion: 'Av. Urdaneta',
  foto_portada: null,
  contacto: null,
  ultimo_post_contenido: 'Necesitamos agua y pañales para esta noche',
  ultimo_post_created_at: '2025-01-12T12:00:00.000Z',
}

function renderCard(overrides: Partial<CentroResumen> = {}) {
  return render(
    <MemoryRouter>
      <CentroCard centro={{ ...centro, ...overrides }} />
    </MemoryRouter>
  )
}

describe('CentroCard', () => {
  it('renders the name, ciudad and a link to the centro detail', () => {
    renderCard()
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Centro La Candelaria')
    expect(link).toHaveAttribute('href', '/centro/00000000-0000-0000-0000-000000000001')
  })

  it('renders the truncated preview of the last post', () => {
    renderCard({
      ultimo_post_contenido:
        'Necesitamos agua embotellada, pañales talla 3 y 4, medicamentos básicos y alimentos no perecederos para esta noche por favor',
    })
    const preview = screen.getByText(/Necesitamos agua embotellada/i)
    expect(preview.textContent).toMatch(/…$/)
  })

  it('renders no preview text when there is no last post', () => {
    renderCard({ ultimo_post_contenido: null })
    expect(screen.queryByText(/Necesitamos/)).not.toBeInTheDocument()
  })

  it('uses the cover photo when provided', () => {
    renderCard({ foto_portada: 'https://cdn.example.com/p.jpg' })
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.example.com/p.jpg')
  })

  it('renders a placeholder image when no cover photo', () => {
    renderCard()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', DEFAULT_FALLBACK_PHOTO)
  })
})
```

- [ ] **Step 3: Rewrite `src/components/centro/CentroGrid.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CentroResumen } from '@/types/db'
import { CentroGrid } from './CentroGrid'

const centros: CentroResumen[] = [
  {
    id: 'c1',
    nombre: 'Centro Uno',
    ciudad: 'Caracas',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
  {
    id: 'c2',
    nombre: 'Centro Dos',
    ciudad: 'Valencia',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
  {
    id: 'c3',
    nombre: 'Centro Tres',
    ciudad: 'Maracay',
    direccion: '',
    descripcion: null,
    foto_portada: null,
    contacto: null,
    ultimo_post_contenido: null,
    ultimo_post_created_at: null,
  },
]

describe('CentroGrid', () => {
  it('renders one CentroCard per centro', () => {
    render(
      <MemoryRouter>
        <CentroGrid centros={centros} />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.getByText('Centro Uno')).toBeInTheDocument()
    expect(screen.getByText('Centro Dos')).toBeInTheDocument()
    expect(screen.getByText('Centro Tres')).toBeInTheDocument()
  })

  it('renders an empty state message when there are no centros', () => {
    render(
      <MemoryRouter>
        <CentroGrid centros={[]} />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/no hay centros|aún no hay centros/i)
    ).toBeInTheDocument()
  })

  it('renders a loading skeleton when isLoading is true (no cards)', () => {
    const { container } = render(
      <MemoryRouter>
        <CentroGrid centros={[]} isLoading />
      </MemoryRouter>
    )
    const grid = container.querySelector('[data-testid="centro-grid"]') as HTMLElement
    within(grid).getByText(/cargando/i)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})
```

- [ ] **Step 4: Rewrite `src/pages/HomePage.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { HomePage } from './HomePage'

beforeEach(async () => {
  await supabase.auth.signOut()
})

function renderHome() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HomePage', () => {
  it('renders the grid of centros ordered by ciudad', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
  })

  it('shows the search bar', () => {
    renderHome()
    expect(screen.getByPlaceholderText(/buscar por nombre o ciudad/i)).toBeInTheDocument()
  })

  it('filters centros when user types in the search bar', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o ciudad/i)
    await user.type(searchInput, 'xyz_nonexistent_xyz')
    await waitFor(() => {
      expect(screen.queryByText(fixtureCentro.nombre)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/aún no hay centros/i)).toBeInTheDocument()
  })

  it('has a link to register a new centro', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /registrar un centro/i })
    expect(link).toHaveAttribute('href', '/centros/nuevo')
  })
})
```

- [ ] **Step 5: Rewrite `src/pages/CentroPerfilPage.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { CentroPerfilPage } from './CentroPerfilPage'

beforeEach(async () => {
  await supabase.auth.signOut()
})

function renderPerfil(id: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/centro/${id}`]}>
        <Routes>
          <Route
            path="/centro/:id"
            element={<CentroPerfilPage user={{ id: fixtureCentro.coordinador_id, email: 'ana@x.com' }} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CentroPerfilPage', () => {
  it('renders the centro name, ciudad and direccion', async () => {
    renderPerfil(fixtureCentro.id)
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    expect(screen.getByText(new RegExp(fixtureCentro.ciudad))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(fixtureCentro.direccion))).toBeInTheDocument()
  })

  it('shows the contact link when available', async () => {
    renderPerfil(fixtureCentro.id)
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.contacto!)).toBeInTheDocument()
    })
  })

  it('shows a not-found message for nonexistent centro', async () => {
    renderPerfil('ffffffff-ffff-ffff-ffff-ffffffffffff')
    await waitFor(() => {
      expect(screen.getByText(/no se encontró/i)).toBeInTheDocument()
    })
  })

  it('does NOT show the Editar link when the viewer is not the coordinador', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[`/centro/${fixtureCentro.id}`]}>
          <Routes>
            <Route
              path="/centro/:id"
              element={<CentroPerfilPage user={{ id: 'other-user', email: 'x@y.com' }} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() => {
      expect(screen.getByText(fixtureCentro.nombre)).toBeInTheDocument()
    })
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Rewrite `src/pages/NuevoCentroPage.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureUser } from '@/test/mocks'
import { NuevoCentroPage } from './NuevoCentroPage'

function renderNew(user = fixtureUser) {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/centros/nuevo']}>
        <Routes>
          <Route path="/centros/nuevo" element={<NuevoCentroPage user={user} />} />
          <Route path="/centro/:id" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('NuevoCentroPage', () => {
  it('submits the form and navigates to the created centro detail', async () => {
    const user = userEvent.setup()
    renderNew()
    await user.type(screen.getByLabelText(/nombre/i), 'Centro Nuevo')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await user.click(screen.getByRole('button', { name: /registrar|guardar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/centro\//))
  })

  it('uses the authenticated user id as coordinador_id on submit', async () => {
    const user = userEvent.setup()
    const { container } = renderNew({ id: '00000000-0000-0000-0000-0000000000ff', email: 'z@x.com' })
    await user.type(screen.getByLabelText(/nombre/i), 'Centro Z')
    await user.type(screen.getByLabelText(/dirección/i), 'Av. Urdaneta')
    await user.type(screen.getByLabelText(/ciudad/i), 'Caracas')
    await waitFor(() => expect(container).toBeTruthy())
    await user.click(screen.getByRole('button', { name: /registrar|guardar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(/^\/centro\//))
  })
})
```

- [ ] **Step 7: Rewrite `src/pages/EditarCentroPage.test.tsx`**

Replace the entire file:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro, fixtureUser } from '@/test/mocks'
import { EditarCentroPage } from './EditarCentroPage'

function renderEdit(id = fixtureCentro.id) {
  const Probe = () => {
    const loc = useLocation()
    return <div data-testid="loc">{loc.pathname}</div>
  }
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/centro/${id}/editar`]}>
        <Routes>
          <Route
            path="/centro/:id/editar"
            element={<EditarCentroPage user={{ id: fixtureCentro.coordinador_id, email: 'ana@x.com' }} />}
          />
          <Route path="/centro/:id" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  await supabase.auth.signOut()
})

describe('EditarCentroPage', () => {
  it('loads the existing centro into the form and lets the coordinador update it', async () => {
    const user = userEvent.setup()
    renderEdit()
    const nombre = await screen.findByLabelText(/nombre/i)
    await waitFor(() => expect(nombre).toHaveValue(fixtureCentro.nombre))
    await user.clear(nombre)
    await user.type(nombre, 'Centro Actualizado')
    await user.click(screen.getByRole('button', { name: /guardar|registrar|publicar|enviar/i }))
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent(`/centro/${fixtureCentro.id}`))
  })

  it('shows a not-found message when the centro does not exist', async () => {
    renderEdit('ffffffff-ffff-ffff-ffff-ffffffffffff')
    await waitFor(() =>
      expect(screen.getByText(/no se encontró|no existe|centro no encontrado/i)).toBeInTheDocument()
    )
  })

  it('warns when the authenticated user is not the coordinador of this centro', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={[`/centro/${fixtureCentro.id}/editar`]}>
          <Routes>
            <Route
              path="/centro/:id/editar"
              element={<EditarCentroPage user={{ id: 'otro', email: 'no@coordinador.com' }} />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() =>
      expect(screen.getByText(/no sos el coordinador|no tenés permiso|no podés editar/i)).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 8: Rewrite `src/features/centros/queries.test.tsx`**

Replace the entire file:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { useCentro, useCentros } from './queries'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
)

describe('useCentros', () => {
  it('returns centros ordered by ciudad', async () => {
    const { result } = renderHook(() => useCentros(), { wrapper })
    await waitFor(() => expect(result.current.data?.length).toBe(2))
    const ordered = result.current.data!.map((c) => c.ciudad)
    expect(ordered).toEqual([...ordered].sort())
    const first = result.current.data![0]
    expect(first.ultimo_post_contenido).not.toBeNull()
  })
})

describe('useCentro', () => {
  it('returns a centro matching the id', async () => {
    const { result } = renderHook(() => useCentro(fixtureCentro.id), { wrapper })
    await waitFor(() => expect(result.current.data?.nombre).toBe(fixtureCentro.nombre))
  })

  it('exposes an error when the centro does not exist', async () => {
    const { result } = renderHook(
      () => useCentro('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeFalsy()
  })
})
```

- [ ] **Step 9: Rewrite `src/features/centros/mutations.test.tsx`**

Replace the entire file:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/test/test-utils'
import { fixtureCentro } from '@/test/mocks'
import { useCentros } from './queries'
import { CrearCentroInput, EditarCentroInput, useCrearCentro, useEditarCentro } from './mutations'

const crearPayload: CrearCentroInput = {
  coordinador_id: '00000000-0000-0000-0000-0000000000aa',
  nombre: 'Centro Prueba',
  descripcion: 'un centro de prueba',
  direccion: 'Calle 1',
  ciudad: 'Maracay',
  contacto: '0414-1111111',
  foto_portada: null,
}

describe('useCrearCentro', () => {
  it('creates a centro and returns it with an id', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useCrearCentro(), { wrapper })
    await result.current.mutateAsync(crearPayload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const created = result.current.data
    expect(created?.id).toBeTruthy()
    expect(created?.nombre).toBe(crearPayload.nombre)
  })

  it('invalidates the centros query cache on success', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    function UseCase() {
      const centros = useCentros()
      const crear = useCrearCentro()
      return { centros, crear }
    }
    const { result } = renderHook(() => UseCase(), { wrapper })
    await waitFor(() => expect(result.current.centros.data?.length).toBe(2))
    const key = ['centros']
    const first = qc.getQueryState(key)?.dataUpdatedAt ?? 0
    await result.current.crear.mutateAsync(crearPayload)
    await waitFor(() => expect(result.current.crear.isSuccess).toBe(true))
    await waitFor(() => {
      const state = qc.getQueryState(key)
      return state != null && state.dataUpdatedAt > first
    })
  })
})

describe('useEditarCentro', () => {
  it('updates an existing centro and returns the updated record', async () => {
    const qc = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const payload: EditarCentroInput = { id: fixtureCentro.id, nombre: 'Actualizado' }
    const { result } = renderHook(() => useEditarCentro(), { wrapper })
    await result.current.mutateAsync(payload)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nombre).toBe('Actualizado')
    expect(result.current.data?.id).toBe(fixtureCentro.id)
  })
})
```

---

### Task 9: Run all tests and verify

- [ ] **Step 1: Run the test suite**

Run: `npx vitest run 2>&1`
Expected: all tests pass, no failing tests

- [ ] **Step 2: Check TypeScript compilation**

Run: `npx tsc --noEmit 2>&1`
Expected: no errors

- [ ] **Step 3: Verify no dead code references remain**

```bash
rg "from '@/lib/geo'" src/ --no-heading; \
rg "from '@/hooks/useGeolocation'" src/ --no-heading; \
rg "geocodeAddress\|googleMapsDirectionsUrl\|NominatimResult\|useGeolocation\|CentroCercano\|formatDistance\b" src/ --no-heading
```

Expected: no output (all references cleaned)
