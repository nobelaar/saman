create table if not exists public.post_comentario (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  contenido  text not null check (char_length(contenido) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_comentario_post_created
  on public.post_comentario (post_id, created_at asc);

create table if not exists public.comentario_util (
  id            uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.post_comentario (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (comentario_id, user_id)
);

create index if not exists idx_comentario_util_comentario
  on public.comentario_util (comentario_id);

alter table public.post_comentario enable row level security;
alter table public.comentario_util enable row level security;

drop policy if exists "comentario_select_publico" on public.post_comentario;
create policy "comentario_select_publico"
  on public.post_comentario for select
  using ( true );

drop policy if exists "comentario_insert_auth" on public.post_comentario;
create policy "comentario_insert_auth"
  on public.post_comentario for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "comentario_util_select_publico" on public.comentario_util;
create policy "comentario_util_select_publico"
  on public.comentario_util for select
  using ( true );

drop policy if exists "comentario_util_insert_auth" on public.comentario_util;
create policy "comentario_util_insert_auth"
  on public.comentario_util for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "comentario_util_delete_owner" on public.comentario_util;
create policy "comentario_util_delete_owner"
  on public.comentario_util for delete
  to authenticated
  using ( auth.uid() = user_id );
