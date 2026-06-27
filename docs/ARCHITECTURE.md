# Arquitectura técnica — Acopio

## 1. Diagrama de componentes

```
                 ┌──────────────────────────────────────┐
                 │           NAVEGADOR (Usuario)         │
                 │  React SPA (Vite + Tailwind + shadcn)│
                 │  TanStack Query (cache + retries)    │
                 └───────────────┬──────────────────────┘
                                 │ HTTPS / WebSocket (Realtime)
                                 ▼
       ┌─────────────────────────────────────────────────────┐
       │                    SUPABASE                         │
       │                                                     │
       │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
       │  │   Auth     │  │ PostgreSQL │  │   Storage    │  │
       │  │ (GoTrue)   │  │  + PostGIS │  │  (S3-backed) │  │
       │  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  │
       │        │               │                │          │
       │        └───────────────┼────────────────┘          │
       │                        │                          │
       │                 RLS policies                       │
       │                 (Row Level Security)               │
       └────────────────────────┬─────────────────────────────┘
                                │
                ┌───────────────▼──────────────────┐
                │  Nominatim (OSM) — geocodificación │
                │  (solo solicitud cliente → API)   │
                └───────────────────────────────────┘
```

**Flujos principales:**

1. **Home → cards**: Client → Supabase REST/PostgREST (RPC `centros_cercanos`)
   → PostGIS calcula distancia → resultado cacheado por TanStack Query.
2. **Perfil → feed**: Client → Supabase (select posts) + subscripto a Realtime
   channel `postgres_changes` en `posts` filtrado por `centro_id`.
3. **Posteo**: Client → Storage (upload foto) → Client → PostgREST INSERT
   `posts` → Realtime broadcastea a todos subscriptos a ese centro → feeds se
   actualizan.

## 2. Decisiones técnicas justificadas

| Decisión | Alternativa considerada | Justificación |
|---------|------------------------|---------------|
| **Supabase** (BaaS) | Custom API en Node/FastAPI + Postgres | Necesitamos estar en producción en días. Supabase trae Auth, DB, Storage, Realtime y RLS listos. Reduce superficie de ataque y ops a casi cero. |
| **PostGIS** para distancia | Calcular Haversine en cliente | PostGIS corre en la DB, evita transferir miles de filas al cliente y permite indexar con `GIST` para escala. Nativo en Supabase. |
| **Nominatim** para geocodificar | Google Maps Geocoding API | Gratuito, sin API key, suficiente para el volumen esperado. Fallback manual si falla. |
| **Auth nativo Supabase** (sin tabla usuarios custom) | Custom user table con JWT | Reduce complejidad y errores. `auth.users.id` es referenciado directamente por `coordinador_id`. |
| **RLS en lugar de API middleware** | Authorization backend custom | Única fuente de verdad de los permisos. Cualquier cliente (web, móvil futuro) está sujeto a las mismas reglas. |
| **TanStack Query** para estado server | Redux Toolkit / Zustand global | El estado es mayoritariamente server-derived. Query cachea, refetcha, deduplica y soporta optimistic updates. |
| **shadcn/ui** | MUI, Chakra | Componentes copiados al repo (control total), Tailwind-native, sin dependencia runtime de lib grande. Mobile first y custom friendly. |
| **Realtime vía Supabase** en lugar de polling | `setInterval` polling cada Ns | Una sola conexión broadcastea al backend; escala horizontalmente sin código extra. UX instantánea. |
| **`necesidades text[]`** | Tabla normalizada `necesidades` + `post_necesidades` | Las necesidades son libres y categorías fluidas en emergencia. Un array simple cumple; se puede migrar a tabla si se requieren analíticas. |

## 3. Estructura de carpetas del frontend

```
src/
├── main.tsx                    # bootstrap + React QueryClientProvider
├── App.tsx                     # rutas (react-router-dom)
├── lib/
│   ├── supabase.ts             # cliente supabase-js + singleton
│   ├── geo.ts                  # helpers PostGIS / Nominatim
│   └── utils.ts                # cn(), formatDate(), formatDistance()
├── components/
│   ├── ui/                     # componentes shadcn (Button, Card, Input…)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── centro/
│   │   ├── CentroCard.tsx      # card cuadrada home
│   │   ├── CentroGrid.tsx
│   │   └── CentroForm.tsx      # alta/edición
│   ├── post/
│   │   ├── PostCard.tsx
│   │   ├── PostFeed.tsx
│   │   └── PostForm.tsx
│   └── common/
│       ├── FotoUploader.tsx
│       └── NecesidadesSelector.tsx
├── features/                   # lógica por feature (queries + mutations)
│   ├── centros/
│   │   ├── queries.ts           # useCentrosCercanos, useCentro
│   │   └── mutations.ts        # useCrearCentro, useEditarCentro
│   ├── posts/
│   │   ├── queries.ts          # usePostsCentro
│   │   ├── mutations.ts        # useCrearPost
│   │   └── realtime.ts        # useRealtimePosts(centroId)
│   └── auth/
│       └── session.ts          # useSession, signIn, signUp
├── pages/
│   ├── HomePage.tsx
│   ├── CentroPerfilPage.tsx
│   ├── LoginPage.tsx
│   ├── RegistroPage.tsx
│   ├── NuevoCentroPage.tsx
│   └── EditarCentroPage.tsx
├── hooks/                      # hooks transversales
│   └── useGeolocation.ts
├── types/
│   └── db.ts                   # tipos generados via `supabase gen types`
└── assets/
```

## 4. Queries clave de Supabase / PostGIS

### 4.1 Habilitar PostGIS (una vez)

```sql
create extension if not exists postgis;
-- agregar columna geography para indexar
alter table centros_acopio
  add column geom geography(POINT, 4326)
  generated always as (st_makepoint(lng, lat)::geography) stored;

create index idx_centros_geom on centros_acopio using gist (geom);
```

### 4.2 RPC: centros cercanos ordenados por distancia

```sql
create or replace function centros_cercanos(
  user_lat double precision,
  user_lng double precision,
  p_limit int default 100
)
returns table (
  id uuid,
  nombre text,
  descripcion text,
  ciudad text,
  direccion text,
  foto_portada text,
  contacto text,
  distancia_km double precision,
  ultimo_post_contenido text,
  ultimo_post_created_at timestamptz
)
language sql
as $$
  select
    c.id,
    c.nombre,
    c.descripcion,
    c.ciudad,
    c.direccion,
    c.foto_portada,
    c.contacto,
    st_distance(
      c.geom,
      st_makepoint(user_lng, user_lat)::geography
    ) / 1000.0 as distancia_km,
    (select p.contenido
       from posts p
      where p.centro_id = c.id
      order by p.created_at desc
      limit 1) as ultimo_post_contenido,
    (select p.created_at
       from posts p
      where p.centro_id = c.id
      order by p.created_at desc
      limit 1) as ultimo_post_created_at
  from centros_acopio c
  order by c.geom <-> st_makepoint(user_lng, user_lat)::geography
  limit p_limit;
$$;
```

### 4.3 Llamada desde el cliente

```ts
const { data } = await supabase.rpc('centros_cercanos', {
  user_lat: coords.lat,
  user_lng: coords.lng,
  p_limit: 100,
});
```

### 4.4 Versión fallback (sin geolocation) — orden por `ciudad`

```ts
const { data } = await supabase
  .from('centros_acopio')
  .select(`
    id, nombre, descripcion, ciudad, direccion, foto_portada, contacto,
    posts ( contenido, created_at )
  `)
  .order('ciudad', { ascending: true });
```
(último post se deriva del primer elemento de `posts` ordenados desc client-side
o por subquery en vista SQL).

### 4.5 Crear centro (cliente)

```ts
await supabase.from('centros_acopio').insert({
  coordinador_id: session.user.id,  // o vacío si RLS lo setea vía auth.uid()
  nombre, descripcion, direccion, ciudad,
  lat, lng, foto_portada: fotoUrl,
  contacto,
});
```

### 4.6 Listar posts de un centro (con orden)

```ts
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('centro_id', centroId)
  .order('created_at', { ascending: false });
```

### 4.7 Realtime — nuevos posts del centro

```ts
supabase
  .channel(`posts:centro=${centroId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
      filter: `centro_id=eq.${centroId}`,
    },
    (payload) => queryClient.setQueryData(
      ['posts', centroId],
      (old) => [payload.new, ...(old ?? [])]
    )
  )
  .subscribe();
```

### 4.8 Upload de foto a Storage

```ts
const path = `${centroId}/${crypto.randomUUID()}.jpg`;
const { error } = await supabase.storage
  .from('centros-fotos')
  .upload(path, file, { upsert: false });

const { data: { publicUrl } } = supabase.storage
  .from('centros-fotos').getPublicUrl(path);
```

## 5. Configuración de RLS

```sql
-- ============ centros_acopio ============
alter table centros_acopio enable row level security;

-- Lectura pública
create policy "centros_select_publico"
  on centros_acopio for select
  using ( true );

-- Insert: usuario autenticado crea centro donde es coordinador
create policy "centros_insert_owner"
  on centros_acopio for insert
  with check ( auth.uid() = coordinador_id );

-- Update: solo el coordinador dueño del centro
create policy "centros_update_owner"
  on centros_acopio for update
  using ( auth.uid() = coordinador_id )
  with check ( auth.uid() = coordinador_id );

-- (sin DELETE por defecto para evitar pérdida accidental)

-- ============ posts ============
alter table posts enable row level security;

create policy "posts_select_publico"
  on posts for select
  using ( true );

-- Insert: el coordinador del centro al que pertenece el post
create policy "posts_insert_owner"
  on posts for insert
  with check (
    exists (
      select 1 from centros_acopio c
      where c.id = posts.centro_id
        and c.coordinador_id = auth.uid()
    )
  );

-- Delete: mismo dueño (corrección de post propio)
create policy "posts_delete_owner"
  on posts for delete
  using (
    exists (
      select 1 from centros_acopio c
      where c.id = posts.centro_id
        and c.coordinador_id = auth.uid()
    )
  );
```

### Storage bucket `centros-fotos`

```sql
-- Políticas en Storage
-- Lectura pública (fotos son públicas para mostrarlas)
create policy "fotos_read_public"
  on storage.objects for select
  using ( bucket_id = 'centros-fotos' );

-- Upload: solo usuarios autenticados
create policy "fotos_upload_auth"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'centros-fotos' );

-- Update/delete: dueño del objeto (por path prefix o authorization)
create policy "fotos_delete_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'centros-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 6. Consideraciones de escalabilidad

### 6.1 Indexación
- `centros_acopio.geom` → índice **GIST** para orden KNN (`<->`) en O(log n).
- `posts.centro_id` → índice btree para el feed por centro.
- `posts.created_at desc` → índice compuesto `(centro_id, created_at desc)` para
  el feed.

### 6.2 Conexiones y pooling
- Supabase usa **PgBouncer/Supavisor** en transaction mode; el RPC
  `centros_cercanos` no usa sentencias preparadas problemáticas.
- TanStack Query con `staleTime: 30s` en home y `gcTime: 5min` reduce llamadas
  repetidas.

### 6.3 Realtime
- Subscribirse **solo al canal del centro abierto** (no a todos los posts del
  país). Desuscribirse al desmontar el componente (`useEffect` cleanup).
- Para superar el límite de conexiones concurrentes por proyecto en plan free,
  evaluar upgrade a Pro ante picos.

### 6.4 Limitaciones de Nominatim
- Política de uso justo: **1 req/segundo por IP**. Cache client-side de
  direcciones ya geocodificadas (IndexedDB o `localStorage`).
- Para coordinadores que registren muchos centros, encolar requests con throttle
  de 1s.

### 6.5 Storage
- Almacenar **solo thumbnails comprimidos** (max 1MB) aplicando compresión
  client-side (`canvas.toBlob('image/jpeg', 0.8)`) antes de upload para reducir
  almacenamiento y ancho de banda.

### 6.6 CDN y cache
- Las URLs públicas de Storage ya salen por CDN. Header `Cache-Control`
  inmutable vía path UUID.
- SPA cachea en service worker (futuro) para offline-first de la grilla.

### 6.7 Límites razonables
- `p_limit` = 100 en `centros_cercanos`.
- Paginación del feed: inicialmente limit/desc de 50 posts, lazy-load más al
  hacer scroll.
- Longitud máxima de `contenido`: 2000 chars. `necesidades`: máx 20 items.

### 6.8 Evolución futura (no ahora)
- Migrar `necesidades text[]` a tabla normalizada si se requieren analíticas
  (qué se pidió más, cuándo se completó).
- Agregar campañas de donación matched (post → "necesidad cubierta" con
  timestamp).
- Exportar dataset CSV para autoridades de protección civil.
- Multilenguaje ES/EN para organizaciones internacionales.
- PWA + offline service worker.