-- =========================================================================
--  Acopio — Migración inicial 00001
--  Aplicala con: supabase link --project-ref <ref> && supabase db push
--  Idempotente (IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS) para que
--  también pueda correrse a mano en el SQL Editor si no usás el CLI.
-- =========================================================================

-- 1. Habilitar extensiones requeridas
create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 2. Tabla: centros_acopio
-- =========================================================================
create table if not exists public.centros_acopio (
  id              uuid primary key default gen_random_uuid(),
  coordinador_id  uuid not null references auth.users (id) on delete cascade,
  nombre          text not null,
  descripcion     text,
  direccion       text not null,
  ciudad          text not null,
  contacto        text,
  lat             double precision not null,
  lng             double precision not null,
  foto_portada    text,
  created_at      timestamptz not null default now()
);

-- Columna geography generada + índice GIST para orden KNN
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'centros_acopio' and column_name = 'geom'
  ) then
    alter table public.centros_acopio
      add column geom geography(POINT, 4326)
      generated always as (st_makepoint(lng, lat)::geography) stored;
  end if;
end$$;

create index if not exists idx_centros_geom on public.centros_acopio using gist (geom);
create index if not exists idx_centros_ciudad on public.centros_acopio (ciudad);

-- =========================================================================
-- 3. Tabla: posts
-- =========================================================================
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  centro_id   uuid not null references public.centros_acopio (id) on delete cascade,
  contenido   text not null check (char_length(contenido) <= 2000),
  foto_url    text,
  necesidades text[] not null default '{}' check (array_length(necesidades, 1) is null or array_length(necesidades, 1) <= 20),
  created_at  timestamptz not null default now()
);

create index if not exists idx_posts_centro_created
  on public.posts (centro_id, created_at desc);

-- =========================================================================
-- 4. Política de eliminación de datos antiguos (opcional, comentada por defecto)
-- =========================================================================
-- create or replace function public.delete_old_posts() returns void as $$
--   delete from public.posts where created_at < now() - interval '90 days';
-- $$ language sql;
-- select cron.schedule('delete_old_posts', '0 3 * * *', 'select public.delete_old_posts()');

-- =========================================================================
-- 5. Función RPC: centros_cercanos (orden por distancia PostGIS)
-- =========================================================================
create or replace function public.centros_cercanos(
  user_lat double precision,
  user_lng double precision,
  p_limit int default 100
)
returns table (
  id                     uuid,
  nombre                 text,
  descripcion            text,
  ciudad                 text,
  direccion              text,
  foto_portada           text,
  contacto               text,
  distancia_km          double precision,
  ultimo_post_contenido  text,
  ultimo_post_created_at timestamptz
)
language sql
stable
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
       from public.posts p
      where p.centro_id = c.id
      order by p.created_at desc
      limit 1) as ultimo_post_contenido,
    (select p.created_at
       from public.posts p
      where p.centro_id = c.id
      order by p.created_at desc
      limit 1) as ultimo_post_created_at
  from public.centros_acopio c
  order by c.geom <-> st_makepoint(user_lng, user_lat)::geography
  limit p_limit;
$$;

-- =========================================================================
-- 6. Habilitar Row Level Security
-- =========================================================================
alter table public.centros_acopio enable row level security;
alter table public.posts enable row level security;

-- =========================================================================
-- 7. Políticas RLS para centros_acopio
-- =========================================================================
drop policy if exists "centros_select_publico" on public.centros_acopio;
create policy "centros_select_publico"
  on public.centros_acopio for select
  using ( true );

drop policy if exists "centros_insert_owner" on public.centros_acopio;
create policy "centros_insert_owner"
  on public.centros_acopio for insert
  to authenticated
  with check ( auth.uid() = coordinador_id );

drop policy if exists "centros_update_owner" on public.centros_acopio;
create policy "centros_update_owner"
  on public.centros_acopio for update
  to authenticated
  using ( auth.uid() = coordinador_id )
  with check ( auth.uid() = coordinador_id );

-- =========================================================================
-- 8. Políticas RLS para posts
-- =========================================================================
drop policy if exists "posts_select_publico" on public.posts;
create policy "posts_select_publico"
  on public.posts for select
  using ( true );

drop policy if exists "posts_insert_owner" on public.posts;
create policy "posts_insert_owner"
  on public.posts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centros_acopio c
      where c.id = posts.centro_id
        and c.coordinador_id = auth.uid()
    )
  );

drop policy if exists "posts_delete_owner" on public.posts;
create policy "posts_delete_owner"
  on public.posts for delete
  to authenticated
  using (
    exists (
      select 1 from public.centros_acopio c
      where c.id = posts.centro_id
        and c.coordinador_id = auth.uid()
    )
  );

-- =========================================================================
-- 9. Storage bucket: centros-fotos
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('centros-fotos', 'centros-fotos', true)
on conflict (id) do nothing;

-- Lectura pública (fotos son públicas para mostrarlas)
drop policy if exists "fotos_read_public" on storage.objects;
create policy "fotos_read_public"
  on storage.objects for select
  using ( bucket_id = 'centros-fotos' );

-- Upload: solo usuarios autenticados
drop policy if exists "fotos_upload_auth" on storage.objects;
create policy "fotos_upload_auth"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'centros-fotos' );

-- Update: dueño del objeto
drop policy if exists "fotos_update_owner" on storage.objects;
create policy "fotos_update_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'centros-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'centros-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: dueño del objeto (por path prefix)
drop policy if exists "fotos_delete_owner" on storage.objects;
create policy "fotos_delete_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'centros-fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================================================================
-- 10. Habilitar Realtime para la tabla posts
-- =========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end$$;

-- =========================================================================
-- Fin de la migración inicial. Ver README.md para el flujo con el CLI.
-- =========================================================================