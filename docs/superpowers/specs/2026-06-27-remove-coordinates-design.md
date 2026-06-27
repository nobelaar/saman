# Remove Coordinates & Add Search — Design Spec

**Date:** 2026-06-27
**Summary:** Eliminate all geocoding, coordinates, and geolocation logic from the app. People only enter address and contact. Add a search bar to filter centers by name/city.

---

## 1. Database

New migration `supabase/migrations/00002_remove_coords.sql`:

```sql
drop function if exists public.centros_cercanos;
drop index if exists idx_centros_geom;
alter table public.centros_acopio
  drop column if exists geom,
  drop column if exists lat,
  drop column if exists lng;
```

Extension `postgis` stays installed but unused.

---

## 2. Types (`src/types/db.ts`)

- Remove `lat: number`, `lng: number` from `CentroAcopio`.
- `CentroCercano` → rename to `CentroResumen`. Remove `distancia_km`.
- `CentroConPosts` inherits from `CentroAcopio` — no changes needed.
- Remove `NominatimResult` entirely.

```ts
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
```

---

## 3. Files to Delete

- `src/lib/geo.ts` (geocodeAddress, googleMapsDirectionsUrl, throttle)
- `src/hooks/useGeolocation.ts`
- `src/hooks/useGeolocation.test.ts`

---

## 4. Feature Layer

### Queries (`src/features/centros/queries.ts`)

- `useCentrosCercanos(coords)` → `useCentros()`. No parameters. Always queries `centros_acopio` ordered by `ciudad ASC` with posts nested.
- Internal `Coords` type and the RPC path are removed.
- `queryKey` becomes `['centros']`. `staleTime: 30_000`, `gcTime: 5 * 60_000` kept.
- `toCentroCercano` → `toCentroResumen`.
- `useCentro(id)` unchanged.

### Mutations (`src/features/centros/mutations.ts`)

- `CrearCentroInput`: remove `lat: number`, `lng: number`.
- `EditarCentroInput`: remove `lat?: number`, `lng?: number`.
- Insert/update don't send `lat`/`lng`.

---

## 5. Components

### `CentroForm.tsx`

**Removed:**
- `geocodeAddress` import
- `defaults = { lat: 0, lng: 0 }`
- `lat`, `lng`, `manual`, `geoStatus` state
- `errors.coords` key
- `geocodeIfPossible` function
- `onBlur={geocodeIfPossible}` on dirección/ciudad inputs
- The entire "Ingresar coordenadas manualmente" checkbox + lat/lng input section

**`CentroFormValues`:**
```ts
export interface CentroFormValues {
  nombre: string
  descripcion: string | null
  direccion: string
  ciudad: string
  contacto: string | null
  foto_portada: string | null
}
```

Validation: required fields are `nombre`, `direccion`, `ciudad`.

### `CentroCard.tsx`

- Remove `formatDistance` import (or keep as `—` always).
- Remove the distance display line.
- Type: `CentroCercano` → `CentroResumen`.

### `CentroGrid.tsx`

- Type: `CentroCercano[]` → `CentroResumen[]`.
- Empty state message: "Aún no hay centros registrados."

### New: `SearchBar.tsx`

```tsx
// src/components/common/SearchBar.tsx
interface Props {
  value: string
  onChange: (value: string) => void
}
```

- Single `<Input>` with a search icon (lupa), debounce 300ms.
- Mobile-first: `w-full`, `pl-9` for icon padding.
- Renders inside `HomePage`, not as a standalone page-level component.

---

## 6. Pages

### `HomePage.tsx`

- Remove `useGeolocation` import and usage.
- Remove `geoLoading`, `geoError` states and JSX.
- `useCentrosCercanos(coords)` → `useCentros()`.
- Add `search` state + `SearchBar` + client-side `useMemo` filter by `nombre`/`ciudad`.
- Title: "Centros de acopio" (remove "cercanos").
- Error state: only query error (no geo error).
- Loading: only `isLoading` from query.

### `CentroPerfilPage.tsx`

- Remove `googleMapsDirectionsUrl` import.
- Remove "Cómo llegar" button.
- Remove `void Button` workaround.

### `NuevoCentroPage.tsx`

- Remove `lat`/`lng` from `handleSubmit`.
- Update description text: "Registrá la dirección y el contacto del centro de acopio."

### `EditarCentroPage.tsx`

- No logic changes. Works because `CentroForm` no longer needs coordinates.

---

## 7. Tests

### `src/test/mocks/fixtures.ts`

- Remove `lat`, `lng` from `fixtureCentro` and `fixtureCentro2`.
- `fixtureCentroCercano` → `fixtureCentroResumen`. Remove `distancia_km`.

### `src/test/mocks/handlers.ts`

- Remove `centros_cercanos` RPC handler (`POST ${BASE}/rest/v1/rpc/centros_cercanos`).
- Remove `lat`, `lng` from `POST /rest/v1/centros_acopio` handler body.
- Remove `lat`, `lng` from store `CentroAcopio` objects.

### Per-test changes

| File | Changes |
|---|---|
| `CentroForm.test.tsx` | Remove `@/lib/geo` mock, geocoding tests, manual toggle test, lat/lng assertions from submit test |
| `CentroCard.test.tsx` | Remove "5.2 km" distance test |
| `CentroGrid.test.tsx` | Remove `distancia_km` from test data |
| `HomePage.test.tsx` | Remove `useGeolocation` mock, geo-loading tests, geo-error tests. Add search filter test. |
| `NuevoCentroPage.test.tsx` | Remove `@/lib/geo` mock |
| `EditarCentroPage.test.tsx` | Remove `@/lib/geo` mock |
| `CentroPerfilPage.test.tsx` | Remove `useGeolocation` mock, Google Maps URL assertion |
| `queries.test.tsx` | `useCentrosCercanos` → `useCentros`, remove coords test case |
| `mutations.test.tsx` | Remove `lat`/`lng` from `crearPayload` |

### File to delete

- `src/hooks/useGeolocation.test.ts`

---

## 8. Utilities

### `src/lib/utils.ts`

`formatDistance` can be removed (unused after `CentroCard` changes). If it's used elsewhere, keep it — but it won't be.

---

## 9. Migration Notes

1. Run `supabase db push` after creating the migration file.
2. Existing data: users lose `lat`/`lng`/`geom` columns. No data migration needed since the columns are being dropped.
3. Rollback: restore from backup or recreate columns as nullable.

---

## 10. Mobile-First Notes

- `SearchBar`: full width, comfortable tap target height (h-10), visible above the grid.
- `CentroGrid`: already `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (responsive).
- `CentroForm`: already `max-w-md mx-auto` (good for mobile).
- All button sizes (`h-10`, `h-9`) are adequate for touch.
