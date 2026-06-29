# Saman — Anuncios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Acopio into Saman by adding structured announcements (`anuncio`) with type-specific fields, a unified filterable feed, and rebranding in 3 independently deployable phases.

**Architecture:** New `anuncio` table with `anuncio_util` reactions, coexisting with existing `posts`. The home feed merges both sources client-side via two parallel TanStack infinite queries sorted by `created_at DESC`. Tabs (Todo/Acopio/Hospedaje) filter the merge. Anuncios are visually distinct: left accent bar, type badge, background wash, data panel.

**Tech Stack:** React + Vite + Tailwind + shadcn/ui + TanStack Query + Supabase (Auth, DB, Storage, Realtime) + Vitest + MSW

---

## File Structure

```
supabase/migrations/00010_anuncio.sql          (NEW)
src/types/db.ts                                 (MODIFY)
src/lib/constants.ts                            (MODIFY)
src/test/mocks/fixtures.ts                      (MODIFY)
src/test/mocks/handlers.ts                      (MODIFY)
src/features/anuncios/queries.ts                (NEW)
src/features/anuncios/queries.test.ts           (NEW)
src/features/anuncios/mutations.ts              (NEW)
src/features/anuncios/mutations.test.tsx        (NEW)
src/features/anuncios/realtime.ts               (NEW)
src/components/anuncio/AnuncioCard.tsx           (NEW)
src/components/anuncio/AnuncioCard.test.tsx      (NEW)
src/pages/FeedPage.tsx                          (MODIFY)
src/pages/FeedPage.test.tsx                     (NEW)
src/pages/NuevoAnuncioPage.tsx                  (NEW)
src/pages/NuevoAnuncioPage.test.tsx             (NEW)
src/components/common/SearchOverlay.tsx         (MODIFY)
src/App.tsx                                     (MODIFY)
src/pages/HomePage.tsx                          (MODIFY)
src/components/layout/DesktopSidebar.tsx        (MODIFY)
src/components/layout/MobileBottomBar.tsx       (MODIFY)
src/components/layout/Navbar.tsx                (MODIFY)
index.html                                      (MODIFY)
package.json                                    (MODIFY)
src/lib/theme.tsx                               (MODIFY)
```

---

## Phase 1 — Database & Data Layer

### Task 1: Migration — anuncio + anuncio_util tables

**Files:** Create: `supabase/migrations/00010_anuncio.sql`

- [ ] **Step 1: Write the migration**

See the SQL in the design spec `docs/superpowers/specs/2026-06-28-saman-anuncios-design.md` Section 2.1 and 2.2. Copy the full CREATE TABLE, CREATE INDEX, ALTER TABLE ENABLE RLS, all policy DROP/CREATE statements, and realtime DO block.

- [ ] **Step 2: Push migration to Supabase**

Run: `npm run supabase:push`

- [ ] **Step 3: Commit**

Tell user to run:
```bash
git add supabase/migrations/00010_anuncio.sql
git commit -S -m "feat: add anuncio and anuncio_util tables with RLS and realtime"
```

### Task 2: TypeScript types

**Files:** Modify: `src/types/db.ts`

- [ ] **Step 1: Add new types after PostWithUtil interface**

```ts
export type AnuncioTipo = 'hospedaje'

export interface Anuncio {
  id: string
  tipo: AnuncioTipo
  titulo: string
  descripcion: string
  ciudad: string
  zona: string | null
  contacto: string
  centro_id: string | null
  user_id: string | null
  capacidad: number | null
  duracion: string | null
  mascotas: boolean
  accesibilidad: boolean
  activo: boolean
  created_at: string
}

export interface AnuncioWithUtil extends Anuncio {
  util_count: number
  user_has_util: boolean
}

export interface AnuncioUtil {
  id: string
  anuncio_id: string
  user_id: string
  created_at: string
}

export type FeedItem =
  | { kind: 'post'; data: PostWithUtil; centroNombre?: string; centroCiudad?: string }
  | { kind: 'anuncio'; data: AnuncioWithUtil; centroNombre?: string; centroCiudad?: string }
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/db.ts
git commit -S -m "feat: add Anuncio, AnuncioWithUtil, FeedItem types"
```

### Task 3: Constants

**Files:** Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add anuncio constants**

Add import at line 1:
```ts
import type { AnuncioTipo } from '@/types/db'
```

After NECESIDAD_META, add:
```ts
export const ANUNCIO_TIPO_META: Record<AnuncioTipo, { emoji: string; label: string; color: string }> = {
  hospedaje: { emoji: '\U0001f3e0', label: 'Hospedaje', color: '#10B981' },
} as const

export const DURACION_OPCIONES = [
  '1 semana',
  '2 semanas',
  '1 mes',
  '3 meses',
  'Indefinido',
] as const

export const CAPACIDAD_OPCIONES = [1, 2, 3, 4, 5, 6, '7+'] as const
```

- [ ] **Step 2: Verify compile**
- [ ] **Step 3: Commit `git commit -S -m "feat: add anuncio constants"`**

### Task 4: MSW fixtures

**Files:** Modify: `src/test/mocks/fixtures.ts`

- [ ] **Step 1: Add anuncio fixtures**

Update the import line to include Anuncio and AnuncioUtil from @/types/db. Add after fixtureNotificacion:

```ts
export const fixtureAnuncio: Anuncio = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  tipo: 'hospedaje',
  titulo: 'Habitacion disponible en El Hatillo',
  descripcion: 'Habitacion privada con bano compartido. Cocina disponible.',
  ciudad: 'Caracas',
  zona: 'El Hatillo',
  contacto: '0412-1234567',
  centro_id: null,
  user_id: fixtureUser.id,
  capacidad: 2,
  duracion: 'Indefinido',
  mascotas: true,
  accesibilidad: false,
  activo: true,
  created_at: '2025-01-13T10:00:00.000Z',
}

export const fixtureAnuncio2: Anuncio = {
  id: 'aaaaaaaa-0000-0000-0000-000000000002',
  tipo: 'hospedaje',
  titulo: 'Casa de retiro ofrece alojamiento',
  descripcion: 'Capacidad para 20 personas. Comedor incluido.',
  ciudad: 'Valencia',
  zona: 'Naguanagua',
  contacto: '0241-0000000',
  centro_id: fixtureCentro2.id,
  user_id: null,
  capacidad: 20,
  duracion: '1 mes',
  mascotas: false,
  accesibilidad: true,
  activo: true,
  created_at: '2025-01-13T14:00:00.000Z',
}

export const fixtureAnuncioUtil: AnuncioUtil = {
  id: 'uuuuuuuu-0000-0000-0000-000000000003',
  anuncio_id: fixtureAnuncio.id,
  user_id: fixtureUser.id,
  created_at: '2025-01-13T11:00:00.000Z',
}
```
- [ ] **Step 2: Commit `git commit -S -m "test: add anuncio fixtures for MSW"`**

### Task 5a: Remove centro_id filter from posts feed query

**Files:** Modify: `src/features/posts/queries.ts`

- [ ] **Step 1: Remove the `.not('centro_id', 'is', null)` line**

In `useInfinitePostsFeed` (around line 37), delete:
```ts
.not('centro_id', 'is', null)
```

This makes the feed include community posts (where centro_id IS NULL) alongside center posts. The unified feed then merges ALL posts with anuncios.

- [ ] **Step 2: Verify existing post feed tests still pass**

Run: `npm test -- src/features/posts`
Expected: Posts feature tests pass. The test fixtures include posts with centro_id set, so behavior doesn't change for those fixtures.

- [ ] **Step 3: Commit**

```bash
git add src/features/posts/queries.ts
git commit -S -m "feat: remove centro_id filter from feed query to include community posts"
```

### Task 5: MSW handlers for anuncio

**Files:** Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Extend store and add handlers**

1. Update imports to include Anuncio, AnuncioUtil types and fixtureAnuncio, fixtureAnuncio2, fixtureAnuncioUtil
2. Add `anuncios: Anuncio[]` and `anuncioUtils: AnuncioUtil[]` to Store interface
3. Add them to makeStore() initial values
4. Add these handlers before the authHandlers block:

```ts
  http.get(`${BASE}/rest/v1/anuncio`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order } = parseQuery(url)
    let rows = applyFilters(store.anuncios as unknown as Record<string, unknown>[], filters) as unknown as Anuncio[]
    if (order) rows = applyOrder(rows, order, (r) => String(r[order!.column as keyof Anuncio])) as Anuncio[]
    const limit = url.searchParams.get('limit')
    if (limit) rows = rows.slice(0, parseInt(limit))
    return responseObjectOrError(rows as unknown as Record<string, unknown>[], request)
  }),

  http.post(`${BASE}/rest/v1/anuncio`, async ({ request }) => {
    const body = (await request.json()) as Partial<Anuncio> | Partial<Anuncio>[]
    const payload = Array.isArray(body) ? body[0] : body
    const created: Anuncio = {
      id: crypto.randomUUID(),
      tipo: payload.tipo ?? 'hospedaje',
      titulo: payload.titulo ?? '',
      descripcion: payload.descripcion ?? '',
      ciudad: payload.ciudad ?? '',
      zona: payload.zona ?? null,
      contacto: payload.contacto ?? '',
      centro_id: payload.centro_id ?? null,
      user_id: payload.user_id ?? null,
      capacidad: payload.capacidad ?? null,
      duracion: payload.duracion ?? null,
      mascotas: payload.mascotas ?? false,
      accesibilidad: payload.accesibilidad ?? false,
      activo: true,
      created_at: new Date().toISOString(),
    }
    store.anuncios.push(created)
    return HttpResponse.json(isObjectAccept(request) ? created : [created])
  }),

  http.get(`${BASE}/rest/v1/anuncio_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    let rows = applyFilters(store.anuncioUtils as unknown as Record<string, unknown>[], filters)
    return HttpResponse.json(rows)
  }),

  http.post(`${BASE}/rest/v1/anuncio_util`, async ({ request }) => {
    const body = (await request.json()) as Partial<AnuncioUtil>
    const created: AnuncioUtil = {
      id: crypto.randomUUID(),
      anuncio_id: body.anuncio_id ?? '',
      user_id: body.user_id ?? '',
      created_at: new Date().toISOString(),
    }
    store.anuncioUtils.push(created)
    return HttpResponse.json(created)
  }),

  http.delete(`${BASE}/rest/v1/anuncio_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    store.anuncioUtils = store.anuncioUtils.filter(
      (au) => !(filters.anuncio_id && au.anuncio_id === filters.anuncio_id)
    )
    return HttpResponse.json(null, { status: 204 })
  }),
```
- [ ] **Step 2: Run tests** — `npm test`, all existing tests must pass
- [ ] **Step 3: Commit `git commit -S -m "test: add MSW handlers for anuncio and anuncio_util"`**

### Task 6: Anuncios queries
**Files:** Create: `src/features/anuncios/queries.ts`, Create: `src/features/anuncios/queries.test.ts`

- [ ] **Step 1: Write the failing test (`queries.test.ts`)**

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { useInfiniteAnuncios } from './queries'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useInfiniteAnuncios', () => {
  it('fetches anuncios paginated', async () => {
    const { result } = renderHook(() => useInfiniteAnuncios(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const pages = result.current.data?.pages ?? []
    expect(pages.length).toBeGreaterThan(0)
    const items = pages.flat()
    expect(items.length).toBe(2)
    expect(items[0].tipo).toBe('hospedaje')
  })

  it('filters by tipo', async () => {
    const { result } = renderHook(() => useInfiniteAnuncios('hospedaje'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const items = result.current.data?.pages.flat() ?? []
    expect(items.every((a) => a.tipo === 'hospedaje')).toBe(true)
  })

  it('paginates with cursor', async () => {
    const { result } = renderHook(() => useInfiniteAnuncios(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/anuncios/queries.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write queries implementation (`queries.ts`)**

```ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Anuncio, AnuncioWithUtil, AnuncioTipo } from '@/types/db'

const PAGE_SIZE = 20

function toAnuncioWithUtil(anuncio: Anuncio): AnuncioWithUtil {
  return { ...anuncio, util_count: 0, user_has_util: false }
}

export function useInfiniteAnuncios(tipo?: AnuncioTipo) {
  return useInfiniteQuery<AnuncioWithUtil[]>({
    queryKey: ['anuncios', 'feed', tipo ?? 'all'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('anuncio')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (tipo) {
        query = query.eq('tipo', tipo)
      }
      if (cursor) {
        query = query.lt('created_at', cursor)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toAnuncioWithUtil) as AnuncioWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function useAnunciosPorCentro(centroId: string) {
  return useQuery<AnuncioWithUtil[]>({
    queryKey: ['anuncios', 'centro', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anuncio')
        .select('*')
        .eq('centro_id', centroId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(toAnuncioWithUtil) as AnuncioWithUtil[]
    },
    enabled: !!centroId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/anuncios/queries.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/anuncios/queries.ts src/features/anuncios/queries.test.ts
git commit -S -m "feat: add anuncio queries (infinite feed + by centro)"
```

### Task 7: Anuncios mutations

**Files:** Create: `src/features/anuncios/mutations.ts`, Create: `src/features/anuncios/mutations.test.tsx`

- [ ] **Step 1: Write mutations implementation**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Anuncio, AnuncioWithUtil } from '@/types/db'

export interface CrearAnuncioInput {
  tipo: 'hospedaje'
  titulo: string
  descripcion: string
  ciudad: string
  zona?: string | null
  contacto: string
  centro_id?: string | null
  user_id?: string | null
  capacidad?: number | null
  duracion?: string | null
  mascotas?: boolean
  accesibilidad?: boolean
}

export function useCrearAnuncio() {
  const qc = useQueryClient()
  return useMutation<Anuncio, Error, CrearAnuncioInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('anuncio')
        .insert({
          tipo: input.tipo,
          titulo: input.titulo,
          descripcion: input.descripcion,
          ciudad: input.ciudad,
          zona: input.zona ?? null,
          contacto: input.contacto,
          centro_id: input.centro_id ?? null,
          user_id: input.user_id ?? null,
          capacidad: input.capacidad ?? null,
          duracion: input.duracion ?? null,
          mascotas: input.mascotas ?? false,
          accesibilidad: input.accesibilidad ?? false,
        })
        .select()
        .single()
      if (error) throw error
      return data as Anuncio
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['anuncios', 'feed'] })
      if (variables.centro_id) {
        qc.invalidateQueries({ queryKey: ['anuncios', 'centro', variables.centro_id] })
      }
    },
  })
}

export interface ToggleAnuncioUtilInput {
  anuncioId: string
  active: boolean
}

export function useToggleAnuncioUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleAnuncioUtilInput>({
    mutationFn: async ({ anuncioId, active }) => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) throw new Error('Debes iniciar sesion para marcar como util')

      if (active) {
        const { error } = await supabase
          .from('anuncio_util')
          .delete()
          .eq('anuncio_id', anuncioId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('anuncio_util')
          .upsert({ anuncio_id: anuncioId, user_id: userId }, { onConflict: 'anuncio_id, user_id' })
        if (error) throw error
      }
    },
    onMutate: async ({ anuncioId, active }) => {
      await qc.cancelQueries({ queryKey: ['anuncios', 'feed'] })
      qc.setQueriesData<{ pages: AnuncioWithUtil[][] }>(
        { queryKey: ['anuncios', 'feed'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((a) =>
                a.id === anuncioId
                  ? {
                      ...a,
                      user_has_util: !active,
                      util_count: active ? Math.max(0, a.util_count - 1) : a.util_count + 1,
                    }
                  : a
              )
            ),
          }
        }
      )
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['anuncios', 'feed'] })
    },
  })
}
```

- [ ] **Step 2: Write the test**

```tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { useCrearAnuncio } from './mutations'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCrearAnuncio', () => {
  it('creates an anuncio successfully', async () => {
    const { result } = renderHook(() => useCrearAnuncio(), { wrapper })
    await act(async () => {
      result.current.mutate({
        tipo: 'hospedaje',
        titulo: 'Test anuncio',
        descripcion: 'Descripcion de prueba',
        ciudad: 'Caracas',
        contacto: '0412-0000000',
        user_id: '00000000-0000-0000-0000-0000000000aa',
        capacidad: 3,
        duracion: '1 semana',
        mascotas: true,
        accesibilidad: false,
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.titulo).toBe('Test anuncio')
  })
})
```

- [ ] **Step 3: Run tests** — `npx vitest run src/features/anuncios/mutations.test.tsx`, expected PASS
- [ ] **Step 4: Commit** `git commit -S -m "feat: add anuncio mutations (crear + toggle util)"`

### Task 8: Anuncios realtime

**Files:** Create: `src/features/anuncios/realtime.ts`

```ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AnuncioWithUtil } from '@/types/db'

export function useRealtimeAnuncios() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('anuncios-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'anuncio' },
        (payload) => {
          qc.setQueryData<{ pages: AnuncioWithUtil[][] }>(
            { queryKey: ['anuncios', 'feed', 'all'] },
            (old) => {
              if (!old) return old
              const newItem = {
                ...payload.new,
                util_count: 0,
                user_has_util: false,
              } as AnuncioWithUtil
              return {
                ...old,
                pages: [[newItem, ...old.pages[0]], ...old.pages.slice(1)],
              }
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
```

- [ ] **Commit** `git commit -S -m "feat: add realtime subscription for new anuncios"`

## Phase 2 — UI: Feed, AnuncioCard, NuevoAnuncioPage

### Task 9: AnuncioCard component

**Files:** Create: `src/components/anuncio/AnuncioCard.tsx`, Create: `src/components/anuncio/AnuncioCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { AnuncioWithUtil } from '@/types/db'
import { AnuncioCard } from './AnuncioCard'

const anuncio: AnuncioWithUtil = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  tipo: 'hospedaje',
  titulo: 'Habitacion disponible en El Hatillo',
  descripcion: 'Habitacion privada con bano compartido.',
  ciudad: 'Caracas',
  zona: 'El Hatillo',
  contacto: '0412-1234567',
  centro_id: null,
  user_id: 'u1',
  capacidad: 2,
  duracion: 'Indefinido',
  mascotas: true,
  accesibilidad: false,
  activo: true,
  created_at: '2025-01-13T10:00:00.000Z',
  util_count: 3,
  user_has_util: false,
}

function renderCard(props = {}) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AnuncioCard anuncio={anuncio} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AnuncioCard', () => {
  it('renders titulo, descripcion, and date', () => {
    renderCard()
    expect(screen.getByText(anuncio.titulo)).toBeInTheDocument()
    expect(screen.getByText(anuncio.descripcion)).toBeInTheDocument()
    expect(screen.getByText(/13.*ene/i)).toBeInTheDocument()
  })

  it('renders the HOSPEDAJE badge', () => {
    renderCard()
    expect(screen.getByText('HOSPEDAJE')).toBeInTheDocument()
  })

  it('renders the data panel with capacidad and mascotas', () => {
    renderCard()
    expect(screen.getByText(/2 personas/)).toBeInTheDocument()
    expect(screen.getByText(/Mascotas OK/)).toBeInTheDocument()
  })

  it('does not show accesibilidad when false', () => {
    renderCard()
    expect(screen.queryByText(/Accesible/)).not.toBeInTheDocument()
  })

  it('shows accesibilidad when true', () => {
    renderCard({ anuncio: { ...anuncio, accesibilidad: true } })
    expect(screen.getByText(/Accesible/)).toBeInTheDocument()
  })

  it('shows centro name when showCentro is true and centro_id exists', () => {
    renderCard({
      anuncio: { ...anuncio, centro_id: 'c1' },
      showCentro: true,
      centroNombre: 'Centro Test',
      centroCiudad: 'Caracas',
    })
    expect(screen.getByText('Centro Test')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/anuncio/AnuncioCard.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write AnuncioCard implementation**

```tsx
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { AnuncioWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart, Share } from 'lucide-react'
import { useToggleAnuncioUtil } from '@/features/anuncios/mutations'
import { ANUNCIO_TIPO_META } from '@/lib/constants'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  anuncio: AnuncioWithUtil
  centroNombre?: string
  centroCiudad?: string
  showCentro?: boolean
}

export const AnuncioCard = memo(function AnuncioCard({
  anuncio,
  centroNombre,
  centroCiudad,
  showCentro = false,
}: Props) {
  const toggleUtil = useToggleAnuncioUtil()
  const meta = ANUNCIO_TIPO_META[anuncio.tipo]

  function handleUtil() {
    toggleUtil.mutate(
      { anuncioId: anuncio.id, active: anuncio.user_has_util },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  function handleShare() {
    const url = `${window.location.origin}`
    if (navigator.share) {
      navigator.share({ title: anuncio.titulo, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  return (
    <article
      className="border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/50"
      style={{
        borderLeft: `3px solid ${meta.color}`,
        background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 40%)`,
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        {showCentro && centroNombre && anuncio.centro_id && (
          <Link to={`/centro/${anuncio.centro_id}`} className="flex items-center gap-2">
            <span className="text-[15px] font-bold leading-tight tracking-[-0.3px] text-primary hover:underline">
              {centroNombre}
            </span>
            {centroCiudad && (
              <span className="text-[13px] text-muted-foreground">@{centroCiudad}</span>
            )}
          </Link>
        )}
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
        >
          {meta.emoji} {meta.label.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <h3 className="text-[15px] font-bold text-foreground">{anuncio.titulo}</h3>
        <time dateTime={anuncio.created_at} className="shrink-0">
          {formatDate(anuncio.created_at)}
        </time>
      </div>

      {anuncio.descripcion && (
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
          {anuncio.descripcion}
        </p>
      )}

      <p className="mt-1 text-[13px] text-muted-foreground">
        {anuncio.ciudad}
        {anuncio.zona ? ` · ${anuncio.zona}` : ''}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
        {anuncio.capacidad != null && (
          <span className="inline-flex items-center gap-1">
            <span>👤</span> {anuncio.capacidad}{' '}
            {anuncio.capacidad === 1 ? 'persona' : 'personas'}
          </span>
        )}
        {anuncio.mascotas && (
          <span className="inline-flex items-center gap-1">
            <span>🐶</span> Mascotas OK
          </span>
        )}
        {anuncio.accesibilidad && (
          <span className="inline-flex items-center gap-1">
            <span>♿</span> Accesible
          </span>
        )}
        {anuncio.duracion && (
          <span className="inline-flex items-center gap-1">
            <span>📅</span> {anuncio.duracion}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-6">
        <button
          type="button"
          onClick={handleUtil}
          disabled={toggleUtil.isPending}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          <Heart
            size={18}
            className={anuncio.user_has_util ? 'fill-primary text-primary' : ''}
          />
          <span>{anuncio.util_count}</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Share size={18} />
        </button>
      </div>
    </article>
  )
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/anuncio/AnuncioCard.test.tsx`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/anuncio/AnuncioCard.tsx src/components/anuncio/AnuncioCard.test.tsx
git commit -S -m "feat: add AnuncioCard with accent bar, badge, data panel and util reaction"
```

### Task 10: FeedPage — unified feed with tabs

**Files:** Modify: `src/pages/FeedPage.tsx`, Create: `src/pages/FeedPage.test.tsx`

- [ ] **Step 1: Write FeedPage test**

```tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FeedPage } from './FeedPage'

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FeedPage', () => {
  it('renders the three tabs', () => {
    renderPage()
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('Acopio')).toBeInTheDocument()
    expect(screen.getByText('Hospedaje')).toBeInTheDocument()
  })

  it('shows posts in the feed', async () => {
    renderPage()
    expect(await screen.findByText(/Necesitamos agua/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify test fails**

Run: `npx vitest run src/pages/FeedPage.test.tsx`
Expected: FAIL — FeedPage hasn't been updated yet.

- [ ] **Step 3: Rewrite FeedPage with tabs and merged feed**

Replace the entire `src/pages/FeedPage.tsx` with:

```tsx
import { useCallback, useMemo, useState } from 'react'
import { useInfinitePostsFeed } from '@/features/posts/queries'
import { useInfiniteAnuncios } from '@/features/anuncios/queries'
import { useCentros } from '@/features/centros/queries'
import { PostCard } from '@/components/post/PostCard'
import { AnuncioCard } from '@/components/anuncio/AnuncioCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PostWithUtil, AnuncioWithUtil, FeedItem } from '@/types/db'

type Tab = 'todo' | 'acopio' | 'hospedaje'

function mergeFeed(
  posts: PostWithUtil[],
  anuncios: AnuncioWithUtil[],
  centroMap: Map<string, { nombre: string; ciudad: string }>
): FeedItem[] {
  const items: FeedItem[] = [
    ...anuncios.map((a) => ({
      kind: 'anuncio' as const,
      data: a,
      centroNombre: a.centro_id ? centroMap.get(a.centro_id)?.nombre : undefined,
      centroCiudad: a.centro_id ? centroMap.get(a.centro_id)?.ciudad : undefined,
    })),
    ...posts.map((p) => ({
      kind: 'post' as const,
      data: p,
      centroNombre: centroMap.get(p.centro_id)?.nombre,
      centroCiudad: centroMap.get(p.centro_id)?.ciudad,
    })),
  ]
  items.sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  )
  return items
}

export function FeedPage() {
  const [tab, setTab] = useState<Tab>('todo')
  const showPosts = tab === 'todo' || tab === 'acopio'
  const showAnuncios = tab === 'todo' || tab === 'hospedaje'

  const postsQuery = useInfinitePostsFeed()
  const anunciosQuery = useInfiniteAnuncios(
    tab === 'hospedaje' ? 'hospedaje' : undefined
  )
  const { data: centros = [] } = useCentros()

  const centroMap = useMemo(() => {
    const map = new Map<string, { nombre: string; ciudad: string }>()
    for (const c of centros) {
      map.set(c.id, { nombre: c.nombre, ciudad: c.ciudad })
    }
    return map
  }, [centros])

  const posts: PostWithUtil[] = postsQuery.data?.pages.flat() ?? []
  const anuncios: AnuncioWithUtil[] = anunciosQuery.data?.pages.flat() ?? []

  const feedItems = useMemo(() => {
    return mergeFeed(
      showPosts ? posts : [],
      showAnuncios ? anuncios : [],
      centroMap
    )
  }, [posts, anuncios, centroMap, showPosts, showAnuncios])

  const isLoading =
    (showPosts ? postsQuery.isLoading : false) ||
    (showAnuncios ? anunciosQuery.isLoading : false)
  const isError =
    (showPosts ? postsQuery.isError : false) ||
    (showAnuncios ? anunciosQuery.isError : false)
  const isFetchingNextPage =
    postsQuery.isFetchingNextPage || anunciosQuery.isFetchingNextPage
  const hasNextPage =
    (showPosts ? postsQuery.hasNextPage : false) ||
    (showAnuncios ? anunciosQuery.hasNextPage : false)

  const loadMore = useCallback(() => {
    if (showPosts && postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      postsQuery.fetchNextPage()
    }
    if (showAnuncios && anunciosQuery.hasNextPage && !anunciosQuery.isFetchingNextPage) {
      anunciosQuery.fetchNextPage()
    }
  }, [showPosts, showAnuncios, postsQuery, anunciosQuery])

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage)

  const refetch = useCallback(() => {
    if (showPosts) postsQuery.refetch()
    if (showAnuncios) anunciosQuery.refetch()
  }, [showPosts, showAnuncios, postsQuery, anunciosQuery])

  return (
    <div className="pt-2 pb-2">
      <div className="sticky top-0 z-10 flex border-b border-border bg-background">
        {(
          [
            ['todo', 'Todo'],
            ['acopio', 'Acopio'],
            ['hospedaje', 'Hospedaje'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 py-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-secondary/50',
              tab === key &&
                'text-foreground border-b-2 border-primary font-bold'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="py-4">
          <PostSkeletonList count={5} />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las publicaciones.
          </p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && feedItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Heart size={48} className="text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            No hay publicaciones todavia.
          </p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        feedItems.map((item) =>
          item.kind === 'post' ? (
            <PostCard
              key={`post-${item.data.id}`}
              post={item.data}
              showCentro
              centroNombre={item.centroNombre ?? 'Centro'}
              centroCiudad={item.centroCiudad ?? ''}
            />
          ) : (
            <AnuncioCard
              key={`anuncio-${item.data.id}`}
              anuncio={item.data}
              showCentro
              centroNombre={item.centroNombre}
              centroCiudad={item.centroCiudad}
            />
          )
        )}

      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <span className="text-sm text-muted-foreground">Cargando mas...</span>
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">
            Desliza para ver mas
          </span>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/pages/FeedPage.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

Run: `npm test`
Expected: All tests pass. Fix any tests that broke due to FeedPage changes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/FeedPage.tsx src/pages/FeedPage.test.tsx
git commit -S -m "feat: unified feed with Todo/Acopio/Hospedaje tabs merging posts + anuncios"
```

### Task 11: NuevoAnuncioPage

**Files:** Create: `src/pages/NuevoAnuncioPage.tsx`, Create: `src/pages/NuevoAnuncioPage.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NuevoAnuncioPage } from './NuevoAnuncioPage'
import type { AuthUser } from '@/types/db'

const user: AuthUser = {
  id: '00000000-0000-0000-0000-0000000000aa',
  email: 'test@example.com',
}

function renderPage() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <NuevoAnuncioPage user={user} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NuevoAnuncioPage', () => {
  it('renders the form with required fields', () => {
    renderPage()
    expect(screen.getByPlaceholderText(/Titulo/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Descripcion/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ciudad/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Contacto/)).toBeInTheDocument()
  })

  it('shows hospedaje-specific fields', () => {
    renderPage()
    expect(screen.getByText('Acepta mascotas')).toBeInTheDocument()
    expect(
      screen.getByText('Accesible (silla de ruedas)')
    ).toBeInTheDocument()
  })

  it('validates required fields on submit', async () => {
    renderPage()
    const btn = screen.getByText('Publicar anuncio')
    await userEvent.click(btn)
    expect(screen.getByText(/Completa el titulo/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run src/pages/NuevoAnuncioPage.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write NuevoAnuncioPage implementation**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrearAnuncio } from '@/features/anuncios/mutations'
import { useCentros } from '@/features/centros/queries'
import { Button } from '@/components/ui/button'
import { DURACION_OPCIONES, CAPACIDAD_OPCIONES } from '@/lib/constants'
import { ChevronLeft } from 'lucide-react'
import type { AuthUser } from '@/types/db'

interface Props {
  user: AuthUser | null
}

export function NuevoAnuncioPage({ user }: Props) {
  const navigate = useNavigate()
  const crearAnuncio = useCrearAnuncio()
  const { data: centros = [] } = useCentros()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [zona, setZona] = useState('')
  const [contacto, setContacto] = useState('')
  const [capacidad, setCapacidad] = useState<number | string>('')
  const [duracion, setDuracion] = useState('')
  const [mascotas, setMascotas] = useState(false)
  const [accesibilidad, setAccesibilidad] = useState(false)
  const [centroId, setCentroId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const misCentros = centros.filter(
    (c) =>
      'coordinador_id' in c &&
      (c as { coordinador_id: string }).coordinador_id === user?.id
  ) as unknown as { id: string; nombre: string }[]

  function validate(): string | null {
    if (!titulo.trim()) return 'Completa el titulo'
    if (!descripcion.trim()) return 'Completa la descripcion'
    if (!ciudad.trim()) return 'Completa la ciudad'
    if (!contacto.trim()) return 'Completa el contacto'
    if (descripcion.length > 2000) return 'La descripcion es demasiado larga'
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    crearAnuncio.mutate(
      {
        tipo: 'hospedaje',
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ciudad: ciudad.trim(),
        zona: zona.trim() || null,
        contacto: contacto.trim(),
        centro_id: centroId,
        user_id: centroId ? null : user?.id,
        capacidad: capacidad
          ? typeof capacidad === 'string'
            ? null
            : capacidad
          : null,
        duracion: duracion || null,
        mascotas,
        accesibilidad,
      },
      { onSuccess: () => navigate('/') }
    )
  }

  if (!user) {
    navigate('/login?redirect=/anuncio/nuevo')
    return null
  }

  return (
    <div className="pb-14">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-bold">Nuevo anuncio</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            {error}
          </p>
        )}

        {misCentros.length > 0 && (
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-muted-foreground">
              Publicar como
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCentroId(null)}
                className={`rounded-full px-3 py-1.5 text-[13px] ${
                  centroId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                Personal
              </button>
              {misCentros.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCentroId(c.id)}
                  className={`rounded-full px-3 py-1.5 text-[13px] ${
                    centroId === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Titulo *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="ej: Habitacion disponible en El Hatillo"
            maxLength={200}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Descripcion *</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el espacio, servicios, condiciones..."
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {descripcion.length}/2000
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[13px] font-medium">Ciudad *</label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="ej: Caracas"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-medium">Zona / Barrio</label>
            <input
              type="text"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="ej: El Hatillo"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium">Contacto *</label>
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="Telefono o WhatsApp"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-border pt-3">
          <p className="mb-3 text-[13px] font-semibold text-muted-foreground">
            Detalles del hospedaje
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-medium">Capacidad</label>
              <select
                value={capacidad}
                onChange={(e) => {
                  const val = e.target.value
                  setCapacidad(
                    val === '7+' ? val : val ? Number(val) : ''
                  )
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar</option>
                {CAPACIDAD_OPCIONES.map((c) => (
                  <option key={c} value={c}>
                    {c === '7+' ? '7 o mas' : c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-medium">Duracion</label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar</option>
                {DURACION_OPCIONES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mascotas}
                onChange={(e) => setMascotas(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-[14px]">Acepta mascotas</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accesibilidad}
                onChange={(e) => setAccesibilidad(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-[14px]">Accesible (silla de ruedas)</span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={crearAnuncio.isPending}
          className="w-full rounded-full py-3 text-[15px] font-semibold"
        >
          {crearAnuncio.isPending ? 'Publicando...' : 'Publicar anuncio'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/pages/NuevoAnuncioPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/NuevoAnuncioPage.tsx src/pages/NuevoAnuncioPage.test.tsx
git commit -S -m "feat: add NuevoAnuncioPage with hospedaje form and centro toggle"
```

### Task 12: Wire routes and navigation

**Files:** Modify: `src/App.tsx`, `src/components/layout/DesktopSidebar.tsx`, `src/components/layout/MobileBottomBar.tsx`

- [ ] **Step 1: Add route to App.tsx**

In `src/App.tsx`:
1. Change import from `{ Link, Route, Routes }` to `{ Link, Navigate, Route, Routes }`
2. Add import: `import { NuevoAnuncioPage } from '@/pages/NuevoAnuncioPage'`
3. Add route after the `/centros/nuevo` route block:

```tsx
<Route
  path="/anuncio/nuevo"
  element={
    <ProtectedRoute user={user} loading={loading}>
      <NuevoAnuncioPage user={user} />
    </ProtectedRoute>
  }
/>
```

4. Add redirect for `/comunidad` before the `*` catch-all:

```tsx
<Route path="/comunidad" element={<Navigate to="/" replace />} />
```

- [ ] **Step 2: Update DesktopSidebar**

In `src/components/layout/DesktopSidebar.tsx`:
1. Remove the `SidebarItem` line for "Comunidad" (`to="/comunidad"`)
2. Change the existing `SidebarItem` for "Nuevo":
```tsx
<SidebarItem
  to={user ? '/anuncio/nuevo' : '/login?redirect=/anuncio/nuevo'}
  icon={PlusCircle}
  label="Publicar"
/>
```

- [ ] **Step 3: Update MobileBottomBar**

In `src/components/layout/MobileBottomBar.tsx`:
1. Remove the `Tab to="/comunidad"` line
2. Change the existing `Tab` for "Nuevo":
```tsx
<Tab
  to={user ? '/anuncio/nuevo' : '/login?redirect=/anuncio/nuevo'}
  icon={PlusCircle}
  label="Publicar"
/>
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. Fix any navigation-related test failures.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/layout/DesktopSidebar.tsx src/components/layout/MobileBottomBar.tsx
git commit -S -m "feat: wire /anuncio/nuevo route, replace Comunidad with Publicar in nav"
```

### Task 13: Extend SearchOverlay

**Files:** Modify: `src/components/common/SearchOverlay.tsx`

- [ ] **Step 1: Add anuncio search alongside centros**

In `src/components/common/SearchOverlay.tsx`:
1. Add import: `import { useInfiniteAnuncios } from '@/features/anuncios/queries'`
2. Add import: `import { ANUNCIO_TIPO_META } from '@/lib/constants'`
3. Inside the component, add:
```tsx
const { data: anunciosData } = useInfiniteAnuncios()
const anuncios = anunciosData?.pages.flat() ?? []
```

4. Filter anuncios by query:
```tsx
const anunciosFiltrados = deferredQuery.trim()
  ? anuncios.filter(
      (a) =>
        a.titulo.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        a.descripcion.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        (a.zona && a.zona.toLowerCase().includes(deferredQuery.toLowerCase())) ||
        a.ciudad.toLowerCase().includes(deferredQuery.toLowerCase())
    ).slice(0, 5)
  : []
```

5. After the centros results, render anuncios results with type badge:
```tsx
{anunciosFiltrados.map((a) => {
  const meta = ANUNCIO_TIPO_META[a.tipo]
  return (
    <Link
      key={`anuncio-${a.id}`}
      to={`/anuncio/${a.id}`}
      onClick={onClose}
      className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-secondary/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-lg">
        {meta.emoji}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium">{a.titulo}</p>
        <p className="text-[13px] text-muted-foreground">
          {a.ciudad}{a.zona ? ` · ${a.zona}` : ''} · {meta.label}
        </p>
      </div>
    </Link>
  )
})}
```

6. Add "Anuncios" section header if there are both centros and anuncios results:
```tsx
{anunciosFiltrados.length > 0 && (
  <p className="px-4 pt-2 text-[11px] font-semibold uppercase text-muted-foreground">
    Anuncios
  </p>
)}
```

- [ ] **Step 2: Run tests**

Run: `npm test`
SearchOverlay tests may need updating since the component now fetches anuncios too.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/SearchOverlay.tsx
git commit -S -m "feat: extend search to include anuncios by titulo, descripcion, zona"
```

## Phase 3 — Rebranding

### Task 14: Rebrand to Saman

**Files:** Modify: `index.html`, `src/lib/theme.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/DesktopSidebar.tsx`, `src/lib/constants.ts`, `package.json`, `src/pages/HomePage.tsx`

- [ ] **Step 1: Update index.html**

```html
<title>Saman — Conectando Venezuela</title>
```

Change line 11 in the inline script:
```html
var t = localStorage.getItem('saman-theme')
```

- [ ] **Step 2: Update theme.tsx localStorage key**

In `src/lib/theme.tsx`:
- Line 14: `const stored = localStorage.getItem('saman-theme')`
- Line 43: `localStorage.setItem('saman-theme', next)`

- [ ] **Step 3: Update Navbar branding**

In `src/components/layout/Navbar.tsx`, line 29-30:
```tsx
<HeartHandshake size={22} strokeWidth={2.5} />
<span className="text-[17px] font-bold tracking-tight">Saman</span>
```

Also update the fallback title string on line 48: `return 'Saman'`

- [ ] **Step 4: Update DesktopSidebar logo**

In `src/components/layout/DesktopSidebar.tsx`, change line 16-17:
```tsx
<NavLink to="/" className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary hover:bg-secondary">
  S
</NavLink>
```

- [ ] **Step 5: Update fallback photo**

In `src/lib/constants.ts`, change the SVG text from 'Acopio' to 'Saman':
```ts
'<text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#a8a29e" text-anchor="middle" dominant-baseline="middle">Saman</text>'
```

- [ ] **Step 6: Update package.json name**

```json
"name": "saman",
```

- [ ] **Step 7: Add anuncio link to HomePage**

In `src/pages/HomePage.tsx`, add next to the "Registrar un centro" link:
```tsx
<Link
  to="/anuncio/nuevo"
  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary"
>
  Publicar anuncio
</Link>
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: All tests pass. Fix any tests that reference "Acopio" in strings.

- [ ] **Step 9: Commit**

```bash
git add index.html src/lib/theme.tsx src/components/layout/Navbar.tsx src/components/layout/DesktopSidebar.tsx src/lib/constants.ts package.json src/pages/HomePage.tsx
git commit -S -m "feat: rebrand Acopio to Saman"
```

---

### Task 15: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass. Zero failures. Fix any remaining issues.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: Build succeeds with no errors. Verify the dist output size is reasonable.

- [ ] **Step 5: Manual smoke test (dev server)**

Run: `npm run dev`
Open browser and verify:
- `/` shows tabs (Todo/Acopio/Hospedaje) with posts in feed
- `/anuncio/nuevo` shows the form and allows creating a hospedaje anuncio
- Newly created anuncio appears in "Todo" and "Hospedaje" tabs
- AnuncioCard renders with green left border, badge, data panel
- Search overlay includes anuncios in results
- Desktop sidebar shows "Publicar" instead of "Comunidad"
- Navbar shows "Saman" branding
- `/comunidad` redirects to `/`
- `/centros` still works as before
- `/centro/:id` still works as before
- Light/dark theme toggle still works with new `saman-theme` key

- [ ] **Step 6: Final commit if needed**

```bash
git add -A
git commit -S -m "chore: final verification fixes"
```
