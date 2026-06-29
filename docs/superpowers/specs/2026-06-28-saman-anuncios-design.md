# Saman — Extension Anuncios: Design Doc

## 1. Overview

Transform "Acopio" into **Saman**, a citizen communication platform for post-earthquake Venezuela. This is an extension, not a rewrite. The core addition: structured announcements (`anuncio`) that coexist with the existing social post system (`posts`), unified in a single filterable timeline.

**Stack:** React + Vite + Tailwind + shadcn/ui + TanStack Query + Supabase (Auth, DB, Storage, Realtime) + PostGIS.

**Strategy:** 3 incremental phases, each independently deployable and testable.

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| 1 | DB migration (`anuncio` table), types, queries, mutations | Backend foundation, no UI changes |
| 2 | Unified home feed with tabs, `AnuncioCard`, `NuevoAnuncioPage`, extended search | Core feature |
| 3 | Rebranding to "Saman", onboarding update, route cleanup | Presentation layer |

---

## 2. Data Model

### 2.1 New table: `anuncio`

```sql
CREATE TABLE public.anuncio (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text NOT NULL CHECK (tipo IN ('hospedaje')),
  titulo        text NOT NULL,
  descripcion   text NOT NULL CHECK (char_length(descripcion) <= 2000),
  ciudad        text NOT NULL,
  zona          text,
  contacto      text NOT NULL,
  centro_id     uuid REFERENCES centros_acopio(id) ON DELETE SET NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  capacidad     integer CHECK (capacidad > 0),
  duracion      text,
  mascotas      boolean DEFAULT false,
  accesibilidad boolean DEFAULT false,
  activo        boolean DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anuncio_autor_check CHECK (
    centro_id IS NOT NULL OR user_id IS NOT NULL
  )
);

CREATE INDEX idx_anuncio_ciudad  ON anuncio (ciudad);
CREATE INDEX idx_anuncio_tipo    ON anuncio (tipo);
CREATE INDEX idx_anuncio_created ON anuncio (created_at DESC);
CREATE INDEX idx_anuncio_centro  ON anuncio (centro_id);
CREATE INDEX idx_anuncio_user    ON anuncio (user_id);
```

### 2.2 RLS policies

```sql
ALTER TABLE public.anuncio ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "anuncio_select_publico"
  ON public.anuncio FOR SELECT
  USING (true);

-- Insert: must be authenticated; at least one of centro_id or user_id
CREATE POLICY "anuncio_insert_auth"
  ON public.anuncio FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM centros_acopio c
      WHERE c.id = anuncio.centro_id AND c.coordinador_id = auth.uid()
    )
  );

-- Update/delete: owner or center coordinator
CREATE POLICY "anuncio_update_owner"
  ON public.anuncio FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM centros_acopio c
      WHERE c.id = anuncio.centro_id AND c.coordinador_id = auth.uid()
    )
  );

CREATE POLICY "anuncio_delete_owner"
  ON public.anuncio FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM centros_acopio c
      WHERE c.id = anuncio.centro_id AND c.coordinador_id = auth.uid()
    )
  );
```

### 2.3 Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.anuncio;
```

### 2.4 Existing tables — no changes

- `posts` remains unchanged: `id`, `centro_id`, `user_id`, `contenido`, `foto_url`, `necesidades`, `created_at`
- `centros_acopio` remains unchanged
- No data migration needed

---

## 3. TypeScript Types

### 3.1 New types (`src/types/db.ts` additions)

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

export type FeedItem =
  | { kind: 'post'; data: PostWithUtil; centroNombre?: string; centroCiudad?: string }
  | { kind: 'anuncio'; data: AnuncioWithUtil; centroNombre?: string; centroCiudad?: string }
```

### 3.2 Constants (`src/lib/constants.ts` additions)

```ts
export const ANUNCIO_TIPOS = ['hospedaje'] as const

export const ANUNCIO_TIPO_META: Record<AnuncioTipo, { emoji: string; label: string; color: string }> = {
  hospedaje: { emoji: '🏠', label: 'Hospedaje', color: '#10B981' },
}

export const DURACION_OPCIONES = [
  '1 semana', '2 semanas', '1 mes', '3 meses', 'Indefinido',
] as const

export const CAPACIDAD_OPCIONES = [1, 2, 3, 4, 5, 6, '7+'] as const
```

---

## 4. Queries & Mutations

### 4.1 New feature: `src/features/anuncios/`

**`queries.ts`:**
- `useInfiniteAnuncios(tipo?: AnuncioTipo)` — paginated by `created_at DESC`, optional type filter. `staleTime: 30s`, `PAGE_SIZE: 20`
- `useAnunciosPorCentro(centroId: string)` — all anuncios from a center
- `useAnuncio(id: string)` — single anuncio by id

**`mutations.ts`:**
- `useCrearAnuncio()` — INSERT into `anuncio`. On success, invalidates `['anuncios', 'feed']` and centro/user caches
- `useToggleAnuncioUtil()` — same pattern as `useToggleUtil` for posts, operating on `anuncio_util` table
- `useDesactivarAnuncio(id)` — sets `activo = false` (soft delete)

**`anuncio_util` table** (migration):
```sql
CREATE TABLE public.anuncio_util (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id  uuid NOT NULL REFERENCES public.anuncio(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (anuncio_id, user_id)
);
```

### 4.2 Feed unified query

The home page runs two independent `useInfiniteQuery` hooks in parallel:
- `useInfinitePostsFeed()` — existing, but simplified: no longer filters by `centro_id IS NOT NULL`. Selects ALL posts.
- `useInfiniteAnuncios()` — new

Client-side merge by `created_at DESC` via a utility (see Section 3.1 for `FeedItem` type).

**Infinite scroll:** The sentinel element fires **both** `fetchNextPage()` calls when visible. Each query manages its own cursor independently; if one source runs out of pages, only the other continues loading.

```ts
function mergeFeed(
  posts: PostWithUtil[],
  anuncios: AnuncioWithUtil[],
  centroMap: Map<string, { nombre: string; ciudad: string }>
): FeedItem[] {
  const items: FeedItem[] = [
    ...posts.map(p => ({ kind: 'post' as const, data: p, centroNombre: centroMap.get(p.centro_id)?.nombre, centroCiudad: centroMap.get(p.centro_id)?.ciudad })),
    ...anuncios.map(a => ({ kind: 'anuncio' as const, data: a, centroNombre: a.centro_id ? centroMap.get(a.centro_id)?.nombre : undefined, centroCiudad: a.centro_id ? centroMap.get(a.centro_id)?.ciudad : undefined })),
  ]
  items.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())
  return items
}
```

---

## 5. UI Components

### 5.1 Home: FeedPage (rewritten)

```
┌─────────────────────────────────────┐
│  [Todo] [Acopio] [Hospedaje]        │  ← sticky tabs
├─────────────────────────────────────┤
│  PostCard / AnuncioCard              │  ← merged timeline
│  PostCard / AnuncioCard              │
│  PostCard / AnuncioCard              │
│  ⋮ (infinite scroll)                │
└─────────────────────────────────────┘
```

- **Tab "Todo":** merge posts + anuncios
- **Tab "Acopio":** only posts
- **Tab "Hospedaje":** only anuncios of type `hospedaje`
- The old `/comunidad` route redirects to `/`

### 5.2 AnuncioCard (new component)

Same silhouette as PostCard but visually distinct:

- **Left accent bar:** 3px colored border-left by tipo (`#10B981` for hospedaje)
- **Background wash:** `bg-emerald-50/30` (light) / `bg-emerald-950/20` (dark)
- **Type badge:** upper-right chip with emoji + label: `🏠 HOSPEDAJE`
- **Header:** titulo (bold), autor (user email or centro nombre + ciudad)
- **Body:** descripcion text
- **Data panel:** horizontal icon row below description:
  ```
  👤 3 personas  |  🐶 Mascotas OK  |  ♿ Accesible  |  📅 2 semanas
  ```
- **Footer:** útil (heart) + share bar. Comments on anuncios deferred to Phase 2 — MVP ships with útil reactions only, using `anuncio_util` table

### 5.3 NuevoAnuncioPage (new page)

Route: `/anuncio/nuevo`. Accessible from desktop sidebar and mobile bottom bar ("Publicar" entry).

Form fields:
- **Tipo:** dropdown, currently only `hospedaje`
- **Titulo** (required): text input
- **Descripcion** (required): textarea, max 2000 chars
- **Ciudad** (required): text input with autocomplete from existing cities
- **Zona:** optional text input (barrio/urbanizacion)
- **Contacto** (required): text input (phone/WhatsApp)
- **Capacidad:** number select (1-6, 7+)
- **Duracion:** select from predefined options
- **Mascotas:** checkbox
- **Accesibilidad:** checkbox

If user is coordinator of a center, a toggle/label: "Publicar como [centro nombre]" — sets `centro_id`. Otherwise, personal post with `user_id`.

Validation: titulo, descripcion, ciudad, contacto required. Contacto must be non-empty.

### 5.4 SearchOverlay (extended)

Current behavior: searches centros by name/city. Extended to also search anuncios by titulo, descripcion, zona. Results grouped or mixed with a type indicator.

---

## 6. Routes & Navigation

### 6.1 Route table (final)

| Route | Page | Access |
|-------|------|--------|
| `/` | FeedPage (unified, tabs) | Public |
| `/centros` | HomePage (centro grid) | Public |
| `/centro/:id` | CentroPerfilPage | Public |
| `/centro/:id/editar` | EditarCentroPage | Coordinator only |
| `/centros/nuevo` | NuevoCentroPage | Authenticated |
| `/anuncio/nuevo` | NuevoAnuncioPage | Authenticated |
| `/anuncio/:id` | AnuncioDetallePage (future) | Public |
| `/perfil` | PerfilPage | Authenticated |
| `/notificaciones` | NotificacionesPage | Authenticated |
| `/login` | LoginPage | Public |
| `/registro` | RegistroPage | Public |
| `/comunidad` | → redirect to `/` | Public |

### 6.2 Navigation changes

**DesktopSidebar:**
- Remove "Comunidad" entry
- Rename "Nuevo" → "Publicar" or split into sub-action
- Icon "A" → "Saman" branding (icon + text)

**MobileBottomBar:**
- Remove "Comunidad" tab
- Add "Publicar" action (opens form context)

---

## 7. Rebranding (Phase 3)

### 7.1 Name change map

| Location | Old | New |
|----------|-----|-----|
| `index.html` `<title>` | Acopio — Centros de ayuda humanitaria | Saman — Conectando Venezuela |
| `index.html` theme script key | `acopio-theme` | `saman-theme` |
| Navbar logo text | "Acopio" | "Saman" |
| Navbar icon | `HeartHandshake` (lucide) | Custom SVG or tree icon |
| Desktop sidebar logo | Letter "A" | "Saman" branding |
| `package.json` name | `acopio` | `saman` |
| Fallback photo SVG text | "Acopio" | "Saman" |
| PRD/README title | Acopio | Saman |

### 7.2 What does NOT change

- All database table names (`centros_acopio`, `posts`, etc.)
- All route paths (`/centro/:id`, `/centros`, etc.)
- Storage bucket names and paths
- Supabase project reference
- Environment variable names

### 7.3 favicon

Replace `/public/favicon.svg` with a Saman tree icon (same name to avoid cache busting for existing visitors).

---

## 8. What Stays Unchanged

- Auth system (Supabase GoTrue, email/password, RLS)
- Centros: table, CRUD, RPC `centros_cercanos`, PostGIS
- Posts: table, queries, mutations, realtime, comments, útil reactions
- Notifications system
- Theme toggle (light/dark)
- TanStack Query cache strategy
- All existing tests (no regressions)

---

## 9. Testing Strategy

- **DB migration:** idempotent SQL, run against local supabase before pushing
- **Unit tests:** new `AnuncioCard.test.tsx`, `NuevoAnuncioPage.test.tsx`, `FeedPage` updated tests for tabs
- **Integration:** feed merge utility function tested with mixed post/anuncio payloads
- **MSW handlers:** new handlers for `anuncio` and `anuncio_util` tables
- **No regression:** existing test suite must pass at every phase boundary

---

## 10. Future Considerations (out of scope)

- New anuncio types: `transporte`, `voluntariado`, `donacion`
- `AnuncioDetallePage` with full detail view
- Anuncios linked to specific necesidades
- Geolocation for anuncios (PostGIS proximity search)
- "Solicitudes" as inverse of anuncios (people asking for housing)
- PWA + offline support
