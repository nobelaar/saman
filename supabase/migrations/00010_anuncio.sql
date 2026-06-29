-- 00010_anuncio.sql
-- Anuncios estructurados (hospedaje, futuro: transporte, voluntariado, etc.)

create table if not exists public.anuncio (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('hospedaje')),
  titulo        text not null,
  descripcion   text not null check (char_length(descripcion) <= 2000),
  ciudad        text not null,
  zona          text,
  contacto      text not null,
  centro_id     uuid references public.centros_acopio (id) on delete set null,
  user_id       uuid references auth.users (id) on delete cascade,
  capacidad     integer check (capacidad > 0),
  duracion      text,
  mascotas      boolean default false,
  accesibilidad boolean default false,
  activo        boolean default true,
  created_at    timestamptz not null default now(),
  constraint anuncio_autor_check check (
    centro_id is not null or user_id is not null
  )
);

create index if not exists idx_anuncio_ciudad  on public.anuncio (ciudad);
create index if not exists idx_anuncio_tipo    on public.anuncio (tipo);
create index if not exists idx_anuncio_created on public.anuncio (created_at desc);
create index if not exists idx_anuncio_centro  on public.anuncio (centro_id);
create index if not exists idx_anuncio_user    on public.anuncio (user_id);

-- anuncio_util — reactions (like posts have post_util)
create table if not exists public.anuncio_util (
  id          uuid primary key default gen_random_uuid(),
  anuncio_id  uuid not null references public.anuncio (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (anuncio_id, user_id)
);

create index if not exists idx_anuncio_util_anuncio on public.anuncio_util (anuncio_id);

-- RLS
alter table public.anuncio enable row level security;
alter table public.anuncio_util enable row level security;

-- Public read
drop policy if exists "anuncio_select_publico" on public.anuncio;
create policy "anuncio_select_publico"
  on public.anuncio for select
  using (true);

-- Insert: authenticated only; must own the row via user_id or centro_id
drop policy if exists "anuncio_insert_auth" on public.anuncio;
create policy "anuncio_insert_auth"
  on public.anuncio for insert
  to authenticated
  with check (
    (user_id is not null and auth.uid() = user_id)
    or (
      centro_id is not null
      and exists (
        select 1 from public.centros_acopio c
        where c.id = anuncio.centro_id and c.coordinador_id = auth.uid()
      )
    )
  );

-- Update: owner or coordinator
drop policy if exists "anuncio_update_owner" on public.anuncio;
create policy "anuncio_update_owner"
  on public.anuncio for update
  to authenticated
  using (
    (user_id is not null and auth.uid() = user_id)
    or (
      centro_id is not null
      and exists (
        select 1 from public.centros_acopio c
        where c.id = anuncio.centro_id and c.coordinador_id = auth.uid()
      )
    )
  );

-- Delete: owner or coordinator
drop policy if exists "anuncio_delete_owner" on public.anuncio;
create policy "anuncio_delete_owner"
  on public.anuncio for delete
  to authenticated
  using (
    (user_id is not null and auth.uid() = user_id)
    or (
      centro_id is not null
      and exists (
        select 1 from public.centros_acopio c
        where c.id = anuncio.centro_id and c.coordinador_id = auth.uid()
      )
    )
  );

-- anuncio_util RLS
drop policy if exists "anuncio_util_select_publico" on public.anuncio_util;
create policy "anuncio_util_select_publico"
  on public.anuncio_util for select
  using (true);

drop policy if exists "anuncio_util_insert_auth" on public.anuncio_util;
create policy "anuncio_util_insert_auth"
  on public.anuncio_util for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "anuncio_util_delete_owner" on public.anuncio_util;
create policy "anuncio_util_delete_owner"
  on public.anuncio_util for delete
  to authenticated
  using (auth.uid() = user_id);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'anuncio'
  ) then
    alter publication supabase_realtime add table public.anuncio;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'anuncio_util'
  ) then
    alter publication supabase_realtime add table public.anuncio_util;
  end if;
end$$;
